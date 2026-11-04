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
  return match?.[1] || "";
}

export async function analyzeReceipt(imageBuffer) {
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(imageBuffer);
    const text = (data.text || "").trim();
    const reference = parseReference(text);

    return {
      amount: parseAmount(text),
      reference,
      ocr_text: text.slice(0, 12000),
      ocr_confidence: Math.round(data.confidence || 0),
      verdict: "inconclusive",
      risk_score: null,
      reference_valid: null,
      reference_note: reference ? "Reference extracted; format and transaction were not independently verified." : "No reference found in the OCR text.",
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