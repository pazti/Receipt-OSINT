import { getAdminAuth, getAdminStorage } from "../_lib/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const authorization = req.headers.authorization || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!idToken) return res.status(401).json({ error: "Authentication required." });

  let user;
  try {
    user = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Authentication required." });
  }

  const storagePath = typeof req.body?.storagePath === "string" ? req.body.storagePath : "";
  if (!storagePath.startsWith(`receipts/${user.uid}/`) || storagePath.includes("..")) {
    return res.status(403).json({ error: "You cannot access this receipt image." });
  }

  try {
    const [signedUrl] = await getAdminStorage()
      .bucket()
      .file(storagePath)
      .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
    return res.status(200).json({ url: signedUrl });
  } catch (error) {
    console.error("Could not create receipt image URL:", error);
    return res.status(500).json({ error: "Could not load receipt image." });
  }
}
