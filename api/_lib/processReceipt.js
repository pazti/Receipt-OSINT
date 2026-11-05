import { createWorker } from "tesseract.js";
import sharp from "sharp";

const MAX_STORED_IMAGE_BYTES = 600 * 1024;
export const MAX_RECEIPT_DOWNLOAD_BYTES = 20 * 1024 * 1024;

export async function prepareReceiptImage(imageBuffer) {
  if (!imageBuffer.length || imageBuffer.length > MAX_RECEIPT_DOWNLOAD_BYTES) {
    throw new Error("This receipt image is empty or exceeds Telegram's 20 MB download limit.");
  }

  const image = sharp(imageBuffer, { limitInputPixels: 40_000_000 }).rotate().flatten({ background: "#fff" });
  const presets = [
    [2000, 82],
    [1800, 76],
    [1600, 70],
    [1400, 62],
    [1200, 55],
    [1000, 45],
  ];

  for (const [dimension, quality] of presets) {
    const compressed = await image.clone()
      .resize({ width: dimension, height: dimension, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (compressed.length <= MAX_STORED_IMAGE_BYTES) {
      return {
        buffer: compressed,
        dataUrl: `data:image/jpeg;base64,${compressed.toString("base64")}`,
      };
    }
  }

  throw new Error("Could not compress this receipt enough to store it safely.");
}

function parseAmount(text) {
  const match = text.match(/(?:NGN|₦)\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/(?:amount|total)\D{0,20}([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function parseReference(text) {
  const match = text.match(/\b(?:reference|ref|transaction\s*id|txn\s*id|session\s*id)\s*[:#-]?\s*([A-Z0-9/-]{6,40})\b/i);
  if (match && /^[([{]/.test(text.slice(match.index + match[0].length))) return "";
  return match?.[1] || "";
}

async function preprocessForOcr(imageBuffer) {
  return sharp(imageBuffer, { limitInputPixels: 40_000_000 })
    .rotate()
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1 })
    .resize({ width: 2200, height: 3000, fit: "inside" })
    .png()
    .toBuffer();
}

function findReferenceLine(tsv) {
  if (!tsv) return null;
  const lines = new Map();
  for (const row of tsv.split(/\r?\n/).slice(1)) {
    const columns = row.split("\t");
    if (columns[0] !== "5" || !columns[11]) continue;
    const key = columns.slice(1, 5).join(":");
    const left = Number(columns[6]);
    const top = Number(columns[7]);
    const right = left + Number(columns[8]);
    const bottom = top + Number(columns[9]);
    const line = lines.get(key) || { text: [], x0: left, y0: top, x1: right, y1: bottom };
    line.text.push(columns[11]);
    line.x0 = Math.min(line.x0, left);
    line.y0 = Math.min(line.y0, top);
    line.x1 = Math.max(line.x1, right);
    line.y1 = Math.max(line.y1, bottom);
    lines.set(key, line);
  }

  for (const line of lines.values()) {
    line.text = line.text.join(" ");
    if (/\b(?:reference|ref|transaction\s*id|txn\s*id|session\s*id)\b/i.test(line.text)) return line;
  }
  return null;
}

async function recognizeReferenceRegion(worker, imageBuffer, tsv) {
  const line = findReferenceLine(tsv);
  if (!line) return null;

  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) return null;
  const padding = Math.max(12, Math.round((line.y1 - line.y0) * 0.3));
  const left = Math.max(0, Math.floor(line.x0 - padding));
  const top = Math.max(0, Math.floor(line.y0 - padding));
  const right = Math.min(metadata.width, Math.ceil(line.x1 + padding));
  const bottom = Math.min(metadata.height, Math.ceil(line.y1 + padding));
  if (right <= left || bottom <= top) return null;

  const crop = await sharp(imageBuffer)
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize({ width: 1800, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
  await worker.setParameters({
    tessedit_pageseg_mode: "7",
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-",
  });
  const { data: result } = await worker.recognize(crop);
  return { text: (result.text || "").trim(), confidence: Math.round(result.confidence || 0) };
}

function scoreOcrResult(data) {
  const text = (data.text || "").trim();
  return (data.confidence || 0)
    + (parseAmount(text) === null ? 0 : 8)
    + (parseReference(text) ? 8 : 0);
}

export async function analyzeReceipt(imageBuffer) {
  const enhancedImage = await preprocessForOcr(imageBuffer);
  const worker = await createWorker("eng", undefined, {
    cachePath: process.env.VERCEL ? "/tmp" : ".",
  });
  try {
    const originalResult = await worker.recognize(imageBuffer, {}, { text: true, tsv: true });
    await worker.setParameters({ tessedit_pageseg_mode: "6" });
    const enhancedResult = await worker.recognize(enhancedImage, {}, { text: true, tsv: true });
    const candidates = [
      { data: originalResult.data, image: imageBuffer },
      { data: enhancedResult.data, image: enhancedImage },
    ].sort((a, b) => scoreOcrResult(b.data) - scoreOcrResult(a.data));
    const { data, image } = candidates[0];
    const text = (data.text || "").trim();
    const referenceRegion = await recognizeReferenceRegion(worker, image, data.tsv);
    const reference = referenceRegion
      ? referenceRegion.confidence >= 60 ? parseReference(referenceRegion.text) : ""
      : parseReference(text);
    const hasReferenceLabel = /\b(?:reference|ref|transaction\s*id|txn\s*id|session\s*id)\b/i.test(text);

    return {
      amount: parseAmount(text),
      reference,
      reference_confidence: referenceRegion?.confidence ?? null,
      ocr_text: text.slice(0, 12000),
      ocr_confidence: Math.round(data.confidence || 0),
      ocr_method: "English OCR; original and enhanced image passes",
      verdict: "inconclusive",
      risk_score: null,
      reference_valid: null,
      reference_note: reference
        ? "Reference extracted by OCR; format and transaction were not independently verified."
        : hasReferenceLabel
          ? "Reference text was detected but could not be read confidently; review the full OCR text."
          : "No reference found in the OCR text.",
      bank_verified: "unknown",
      bank_verify_note: "Not checked with a bank or payment provider.",
      reasons: [
        "Text was extracted from the image with OCR.",
        "This deployment does not run image-tampering analysis or confirm transactions with a bank.",
      ],
    };
  } finally {
    await worker.terminate();
  }
}