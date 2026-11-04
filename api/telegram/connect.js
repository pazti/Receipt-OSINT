import { getAdminAuth, getAdminDb } from "../_lib/firebaseAdmin.js";

function respond(res, status, body) {
  return res.status(status).json(body);
}

function readBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

function webhookUrl() {
  const baseUrl = process.env.APP_BASE_URL || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`);
  if (!baseUrl) throw new Error("APP_BASE_URL or VERCEL_URL is required.");
  return `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
}

async function telegramRequest(method, payload = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.description || "Telegram API request failed.");
  return result.result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return respond(res, 405, { error: "Method not allowed." });

  const authorization = req.headers.authorization || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) return respond(res, 401, { error: "Authentication required." });

  let user;
  try {
    user = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return respond(res, 401, { error: "Authentication required." });
  }
  if (!process.env.TELEGRAM_OWNER_UID) {
    return respond(res, 503, { error: "TELEGRAM_OWNER_UID is not configured." });
  }
  if (user.uid !== process.env.TELEGRAM_OWNER_UID) {
    return respond(res, 403, { error: "This account cannot manage the Telegram bot." });
  }

  try {
    const { action, verify_endpoint: verifyEndpoint } = readBody(req);
    if (action === "save-verifier") {
      let normalizedEndpoint = "";
      if (verifyEndpoint) {
        const parsed = new URL(verifyEndpoint);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
          return respond(res, 400, { error: "Enter a valid HTTPS verification endpoint." });
        }
        normalizedEndpoint = parsed.toString();
      }
      await getAdminDb().doc(`users/${user.uid}/settings/integrations`).set(
        { verify_endpoint: normalizedEndpoint, updated_at: new Date().toISOString() },
        { merge: true },
      );
      return respond(res, 200, { ok: true });
    }

    if (action !== "status" && action !== "connect") {
      return respond(res, 400, { error: "Unsupported Telegram action." });
    }

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return respond(res, 200, { connected: false, error: "TELEGRAM_BOT_TOKEN is not configured." });
    }

    if (action === "connect") {
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
        return respond(res, 503, { error: "TELEGRAM_WEBHOOK_SECRET is missing or invalid." });
      }
      const endpoint = webhookUrl();
      await telegramRequest("setWebhook", {
        url: endpoint,
        secret_token: secret,
        allowed_updates: ["message"],
      });
    }

    const [bot, webhook] = await Promise.all([
      telegramRequest("getMe"),
      telegramRequest("getWebhookInfo"),
    ]);
    return respond(res, 200, {
      connected: Boolean(webhook.url),
      bot_username: bot.username,
      webhook_url: webhook.url,
      pending_updates: webhook.pending_update_count || 0,
      last_error: webhook.last_error_message || "",
    });
  } catch (error) {
    return respond(res, 502, { error: error.message || "Could not connect to Telegram." });
  }
}
