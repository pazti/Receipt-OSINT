import { auth } from "@/lib/firebase";

export async function callTelegramConnect(payload) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to manage the Telegram bot.");

  const response = await fetch("/api/telegram/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not connect to Telegram.");
  return result;
}
