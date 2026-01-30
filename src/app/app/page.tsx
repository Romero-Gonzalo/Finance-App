"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { useMe } from "@/lib/auth/useMe";
import TxForm from "@/components/TxForm";
import MonthlyChart from "@/components/MonthlyChart";
import {
  listTransactions,
  deleteTransaction,
  updateTransaction,
} from "@/lib/tx/client";

type Tx = {
  id: string;
  type: "income" | "expense";
  amountCents: number;
  category: string;
  note?: string;
  dayKey: string; // YYYY-MM-DD
};

function arsToCents(value: string) {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function monthLabelFromYM(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString("es-AR", { month: "long", year: "numeric" });
}

function prevMonthYM(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

export default function AppHome() {
  const { me, loading } = useMe();
  const router = useRouter();

  const [txs, setTxs] = useState<Tx[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // --- EDIT STATE ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDayKey, setEditDayKey] = useState("");

  useEffect(() => {
    if (!loading && !me) router.replace("/login");
  }, [loading, me, router]);

  async function load() {
    if (!me) return;
    const data = (await listTransactions(me.uid)) as Tx[];
    setTxs(data);
  }

  useEffect(() => {
    if (me) load();
  }, [me]);

  const {
    monthTxs,
    income,
    expense,
    total,
    monthLabel,
    prevYM,
    prevIncome,
    prevExpense,
    prevTotal,
    deltaTotal,
  } = useMemo(() => {
    const monthTxs = txs.filter((tx) => tx.dayKey?.startsWith(selectedMonth));

    const income = monthTxs
      .filter((tx) => tx.type === "income")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const expense = monthTxs
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const total = income - expense;

    const monthLabel = monthLabelFromYM(selectedMonth);

    const prevYM = prevMonthYM(selectedMonth);
    const prevTxs = txs.filter((tx) => tx.dayKey?.startsWith(prevYM));

    const prevIncome = prevTxs
      .filter((tx) => tx.type === "income")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const prevExpense = prevTxs
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const prevTotal = prevIncome - prevExpense;

    const deltaTotal = total - prevTotal;

    return {
      monthTxs,
      income,
      expense,
      total,
      monthLabel,
      prevYM,
      prevIncome,
      prevExpense,
      prevTotal,
      deltaTotal,
    };
  }, [txs, selectedMonth]);

  function startEdit(tx: Tx) {
    setEditingId(tx.id);
    setEditType(tx.type);
    setEditAmount(String((tx.amountCents ?? 0) / 100));
    setEditCategory(tx.category ?? "otros");
    setEditNote(tx.note ?? "");
    setEditDayKey(tx.dayKey ?? `${selectedMonth}-01`);
  }

  async function saveEdit() {
    if (!me || !editingId) return;

    const cents = arsToCents(editAmount);
    if (cents == null || cents <= 0) {
      alert("Monto inválido");
      return;
    }

    // dayKey tiene que ser YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDayKey)) {
      alert("Fecha inválida. Usá formato YYYY-MM-DD");
      return;
    }

    await updateTransaction(me.uid, editingId, {
      type: editType,
      amountCents: cents,
      category: editCategory.trim() || "otros",
      note: editNote.trim(),
      dayKey: editDayKey,
    });

    setEditingId(null);
    await load();
  }

  function downloadCSV() {
    const rows = [
      ["dayKey", "type", "category", "amountARS", "note"],
      ...monthTxs.map((tx) => [
        tx.dayKey ?? "",
        tx.type ?? "",
        tx.category ?? "",
        ((tx.amountCents ?? 0) / 100).toFixed(2),
        (tx.note ?? "").replaceAll("\n", " ").trim(),
      ]),
    ];

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxo-${selectedMonth}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  if (loading) return <main className="p-6">Cargando...</main>;
  if (!me) return null;

  return (
    <main className="p-6 space-y-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Fluxo</h1>
          <p className="text-xs opacity-70">Logueado como: {me.email}</p>
        </div>

        <button
          onClick={async () => {
            await signOut(firebaseAuth);
            router.push("/login");
          }}
          className="text-sm underline"
        >
          Cerrar sesión
        </button>
      </div>

      {/* RESUMEN */}
      <div className="border p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm font-medium">Resumen de {monthLabel}</p>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              className="border rounded px-3 py-1 text-sm"
              title="Descargar CSV del mes"
            >
              Exportar CSV
            </button>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>Ingresos: ${(income / 100).toFixed(2)}</p>
          <p>Gastos: ${(expense / 100).toFixed(2)}</p>
        </div>

        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">
            Balance: ${(total / 100).toFixed(2)}
          </h2>

          <p className="text-xs opacity-70">
            vs {monthLabelFromYM(prevYM)}:{" "}
            <span className={deltaTotal >= 0 ? "text-green-600" : "text-red-600"}>
              {(deltaTotal / 100).toFixed(2)}
            </span>
          </p>
        </div>

        {/* Comparativa mes anterior */}
        <div className="text-sm opacity-80 border-t pt-3">
          <p className="font-medium">Mes anterior ({monthLabelFromYM(prevYM)})</p>
          <div className="grid grid-cols-2 gap-2">
            <p>Ingresos: ${(prevIncome / 100).toFixed(2)}</p>
            <p>Gastos: ${(prevExpense / 100).toFixed(2)}</p>
            <p className="col-span-2">
              Balance: ${(prevTotal / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* DONUT GASTOS */}
      <MonthlyChart monthTxs={monthTxs} />

      {/* FORM */}
      <TxForm uid={me.uid} onCreated={load} />

      {/* LISTA */}
      <div className="space-y-2">
        <h3 className="font-semibold">Movimientos de {monthLabel}</h3>

        {monthTxs.length === 0 ? (
          <p className="text-sm opacity-70">No hay movimientos en este mes.</p>
        ) : (
          monthTxs.map((tx) =>
            editingId === tx.id ? (
              <div key={tx.id} className="border p-3 rounded-xl text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="border rounded px-2 py-2"
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>

                  <input
                    className="border rounded px-2 py-2"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Monto (ej 1250.50)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="border rounded px-2 py-2"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Categoría"
                  />

                  <input
                    className="border rounded px-2 py-2"
                    value={editDayKey}
                    onChange={(e) => setEditDayKey(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <input
                  className="border rounded px-2 py-2 w-full"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Nota (opcional)"
                />

                <div className="flex gap-2 justify-end">
                  <button
                    className="border rounded px-3 py-2 text-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="border rounded px-3 py-2 text-sm font-medium"
                    onClick={saveEdit}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={tx.id}
                className="border p-3 rounded-xl text-sm flex justify-between items-center"
              >
                <div>
                  <div className="flex justify-between gap-4">
                    <span>{tx.category}</span>
                    <span
                      className={
                        tx.type === "income"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {tx.type === "income" ? "+" : "-"}$
                      {((tx.amountCents ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>
                  {tx.note && <p className="text-xs opacity-70">{tx.note}</p>}
                  <p className="text-xs opacity-50">{tx.dayKey}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => startEdit(tx)}
                    className="text-xs hover:underline"
                  >
                    Editar
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar movimiento?")) return;
                      await deleteTransaction(me.uid, tx.id);
                      load();
                    }}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </main>
  );
}
