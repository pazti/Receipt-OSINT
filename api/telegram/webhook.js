import { getAdminDb } from "../_lib/firebaseAdmin.js";
import {
  analyzeReceipt,
  MAX_RECEIPT_DOWNLOAD_BYTES,
  prepareReceiptImage,
} from "../_lib/processReceipt.js";

export const config = { maxDuration: 60 };

async function telegramApi(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.description || "Telegram API request failed.");
  return result.result;
}

async function reply(chatId, text) {
  await telegramApi("sendMessage", { chat_id: chatId, text });
}

async function getPhotoBuffer(fileId) {
  const file = await telegramApi("getFile", { file_id: fileId });
  const response = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`);
  if (!response.ok) throw new Error("Telegram could not provide the image.");
  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength > MAX_RECEIPT_DOWNLOAD_BYTES) {
    throw new Error("This receipt image exceeds Telegram's 20 MB download limit.");
  }
  const image = Buffer.from(await response.arrayBuffer());
  if (image.length > MAX_RECEIPT_DOWNLOAD_BYTES) {
    throw new Error("This receipt image exceeds Telegram's 20 MB download limit.");
  }
  return image;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Telegram webhook is not configured." });
  }
  if (req.headers["x-telegram-bot-api-secret-token"] !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Invalid webhook secret." });
  }

  let update;
  try {
    update = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "Invalid request body." });
  }
  const message = update.message;
  if (!message?.chat?.id) return res.status(200).json({ ok: true });

  if (message.chat.type !== "private" || !process.env.TELEGRAM_ALLOWED_USER_ID
    || String(message.from?.id) !== process.env.TELEGRAM_ALLOWED_USER_ID) {
    return res.status(200).json({ ok: true });
  }

  try {
    if (!Array.isArray(message.photo) || message.photo.length === 0) {
      await reply(message.chat.id, "Send a receipt photo and I will extract its text. Transaction authenticity is not verified by OCR.");
      return res.status(200).json({ ok: true });
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT || !process.env.TELEGRAM_OWNER_UID) {
      await reply(message.chat.id, "Receipt processing is not configured yet. Ask the dashboard owner to finish server setup.");
      return res.status(200).json({ ok: true });
    }

    const photo = message.photo[message.photo.length - 1];
    const checkRef = getAdminDb().collection("receiptChecks").doc(`telegram_${update.update_id}`);
    if ((await checkRef.get()).exists) {
      await reply(message.chat.id, "This receipt was already processed.");
      return res.status(200).json({ ok: true });
    }
    const sourceImage = await getPhotoBuffer(photo.file_id);
    const { buffer: image, dataUrl } = await prepareReceiptImage(sourceImage);
    const processingStartedAt = Date.now();
    const analysis = await analyzeReceipt(image);
    const record = {
      ...analysis,
      ownerUid: process.env.TELEGRAM_OWNER_UID,
      created_date: new Date().toISOString(),
      processing_ms: Date.now() - processingStartedAt,
      sender_name: [message.from.first_name, message.from.last_name].filter(Boolean).join(" "),
      image_data_url: dataUrl,
    };
    await checkRef.create(record);

    const amountLine = analysis.amount === null ? "Amount: not found" : `Amount: NGN ${analysis.amount.toLocaleString("en-NG")}`;
    const refLine = analysis.reference
      ? `Reference: ${analysis.reference}`
      : analysis.reference_note?.startsWith("Reference text was detected")
        ? "Reference: OCR unclear; check the image"
        : "Reference: not found";
    await reply(message.chat.id, `OCR complete (${analysis.ocr_confidence}% text confidence). ${amountLine}\n${refLine}\nVerdict: inconclusive. Check the extracted details and confirm the credit in your bank account.`);
  } catch (error) {
    console.error("Receipt processing failed:", error);
    try {
      await reply(message.chat.id, error.message || "Could not process this receipt.");
    } catch (replyError) {
      console.error("Could not send Telegram reply:", replyError);
    }
  }

  return res.status(200).json({ ok: true });
}
