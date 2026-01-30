"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { useMe } from "@/lib/auth/useMe";
import TxForm from "@/components/TxForm";
import { listTransactions, deleteTransaction } from "@/lib/tx/client";
import MonthlyChart from "@/components/MonthlyChart";


export default function AppHome() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [txs, setTxs] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    if (!loading && !me) router.replace("/login");
  }, [loading, me, router]);

  async function load() {
    if (!me) return;
    const data = await listTransactions(me.uid);
    setTxs(data);
  }

  useEffect(() => {
    if (me) load();
  }, [me]);

  const { monthTxs, income, expense, total, monthLabel } = useMemo(() => {
    const monthTxs = txs.filter((tx) =>
      tx.dayKey?.startsWith(selectedMonth)
    );

    const income = monthTxs
      .filter((tx) => tx.type === "income")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const expense = monthTxs
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const total = income - expense;

    const [year, month] = selectedMonth.split("-");
    const date = new Date(Number(year), Number(month) - 1);

    const monthLabel = date.toLocaleString("es-AR", {
      month: "long",
      year: "numeric",
    });

    return { monthTxs, income, expense, total, monthLabel };
  }, [txs, selectedMonth]);

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

      <div className="border p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">
            Resumen de {monthLabel}
          </p>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
<MonthlyChart monthTxs={monthTxs} />

        <p className="text-sm">Ingresos: ${(income / 100).toFixed(2)}</p>
        <p className="text-sm">Gastos: ${(expense / 100).toFixed(2)}</p>
        <h2 className="text-2xl font-bold">
          Balance: ${(total / 100).toFixed(2)}
        </h2>
      </div>

      <TxForm uid={me.uid} onCreated={load} />

      <div className="space-y-2">
        <h3 className="font-semibold">
          Movimientos de {monthLabel}
        </h3>

        {monthTxs.length === 0 ? (
          <p className="text-sm opacity-70">
            No hay movimientos en este mes.
          </p>
        ) : (
          monthTxs.map((tx) => (
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
                    {(tx.amountCents / 100).toFixed(2)}
                  </span>
                </div>

                {tx.note && (
                  <p className="text-xs opacity-70">{tx.note}</p>
                )}

                <p className="text-xs opacity-50">{tx.dayKey}</p>
              </div>

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
          ))
        )}
      </div>
    </main>
  );
}
