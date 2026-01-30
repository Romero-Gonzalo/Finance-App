import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { TxType } from "./types";

function getDayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export async function createTransaction(
  uid: string,
  type: TxType,
  amountCents: number,
  category: string,
  note?: string
) {
  const col = collection(firebaseDb, "users", uid, "tx");

  await addDoc(col, {
    type,
    amountCents,
    category,
    note: note ?? "",
    createdAt: serverTimestamp(),
    dayKey: getDayKey(),
  });
}

export async function listTransactions(uid: string) {
  const col = collection(firebaseDb, "users", uid, "tx");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function deleteTransaction(uid: string, txId: string) {
  const ref = doc(firebaseDb, "users", uid, "tx", txId);
  await deleteDoc(ref);
}

export async function updateTransaction(
  uid: string,
  txId: string,
  patch: {
    type?: TxType;
    amountCents?: number;
    category?: string;
    note?: string;
    dayKey?: string;
  }
) {
  const ref = doc(firebaseDb, "users", uid, "tx", txId);
  await updateDoc(ref, patch);
}
