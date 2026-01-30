"use client";

import { useEffect, useState } from "react";
import { createTransaction } from "@/lib/tx/client";
import type { TxType } from "@/lib/tx/types";
import { CATEGORIES } from "@/lib/tx/categories";

function arsToCents(value: string) {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default function TxForm({
  uid,
  onCreated,
}: {
  uid: string;
  onCreated: () => void;
}) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("otros");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // recuerda última categoría usada
  useEffect(() => {
    const last = localStorage.getItem("fluxo:lastCategory");
    if (last) setCategory(last);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountCents = arsToCents(amount);
    if (amountCents == null || amountCents <= 0) {
      setError("Monto inválido (ej: 1250.50)");
      return;
    }

    setBusy(true);
    try {
      await createTransaction(uid, type, amountCents, category, note);

      localStorage.setItem("fluxo:lastCategory", category);

      setAmount("");
      setNote("");
      await onCreated();
    } catch (err: any) {
      setError(err?.message ?? "Error guardando movimiento");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded-xl">
      <div className="grid grid-cols-3 gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TxType)}
          className="border rounded px-2 py-2"
        >
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>

        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monto (ej 1250.50)"
          className="border rounded px-2 py-2 col-span-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-2 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
          className="border rounded px-2 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button disabled={busy} className="border rounded px-3 py-2 w-full">
        {busy ? "Guardando..." : "Guardar movimiento"}
      </button>

      <p className="text-xs opacity-60">
        Tip: la app recuerda la última categoría para cargar más rápido.
      </p>
    </form>
  );
}
