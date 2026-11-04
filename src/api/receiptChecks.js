import {
  average,
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const checksCollection = collection(db, "receiptChecks");

function currentUid() {
  if (!auth.currentUser) throw new Error("Sign in to view receipt checks.");
  return auth.currentUser.uid;
}

function fromSnapshot(snapshot) {
  const record = { id: snapshot.id, ...snapshot.data() };
  if (record.created_date?.toDate) record.created_date = record.created_date.toDate().toISOString();
  return record;
}

/** @param {{ verdict?: string, maxResults?: number }} options */
export async function getReceiptChecks({ verdict, maxResults = 50 } = {}) {
  /** @type {import("firebase/firestore").QueryConstraint[]} */
  const constraints = [where("ownerUid", "==", currentUid())];
  if (verdict) constraints.push(where("verdict", "==", verdict));
  constraints.push(orderBy("created_date", "desc"), limit(maxResults));
  const snapshot = await getDocs(query(checksCollection, ...constraints));
  return snapshot.docs.map(fromSnapshot);
}

export async function getReceiptCheck(id) {
  const snapshot = await getDoc(doc(db, "receiptChecks", id));
  return snapshot.exists() ? fromSnapshot(snapshot) : null;
}

export async function getReceiptImageUrl(storagePath) {
  if (!storagePath) return "";
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to view receipt images.");
  const response = await fetch("/api/receipts/image-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify({ storagePath }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not load receipt image.");
  return result.url;
}

export async function getReceiptDashboard() {
  const uid = currentUid();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayQuery = query(
    checksCollection,
    where("ownerUid", "==", uid),
    where("created_date", ">=", dayStart.toISOString()),
  );
  const fakeQuery = query(todayQuery, where("verdict", "==", "fake"));
  const [todayStats, fakeStats, recentSnapshot] = await Promise.all([
    getAggregateFromServer(todayQuery, {
      total: count(),
      amount: sum("amount"),
      processingMs: average("processing_ms"),
    }),
    getAggregateFromServer(fakeQuery, { total: count() }),
    getDocs(query(checksCollection, where("ownerUid", "==", uid), orderBy("created_date", "desc"), limit(6))),
  ]);

  return {
    today: todayStats.data().total,
    fake: fakeStats.data().total,
    valueReviewed: todayStats.data().amount || 0,
    averageReadMs: todayStats.data().processingMs || 0,
    recent: recentSnapshot.docs.map(fromSnapshot),
  };
}