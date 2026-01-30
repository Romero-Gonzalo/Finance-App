"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { useMe } from "@/lib/auth/useMe";
import TxForm from "@/components/TxForm";
import { listTransactions } from "@/lib/tx/client";

export default function AppHome() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [txs, setTxs] = useState<any[]>([]);

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

  const { monthTxs, income, expense, total, currentMonthLabel } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    const monthTxs = txs.filter((tx) => tx.dayKey?.startsWith(currentMonth));

    const income = monthTxs
      .filter((tx) => tx.type === "income")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const expense = monthTxs
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => acc + (tx.amountCents ?? 0), 0);

    const total = income - expense;

    const currentMonthLabel = now.toLocaleString("es-AR", {
      month: "long",
      year: "numeric",
    });

    return { monthTxs, income, expense, total, currentMonthLabel };
  }, [txs]);

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

      <div className="border p-4 rounded-xl space-y-1">
        <p className="text-sm">Resumen del mes ({currentMonthLabel})</p>
        <p className="text-sm">Ingresos: ${(income / 100).toFixed(2)}</p>
        <p className="text-sm">Gastos: ${(expense / 100).toFixed(2)}</p>
        <h2 className="text-2xl font-bold">
          Balance: ${(total / 100).toFixed(2)}
        </h2>
      </div>

      <TxForm uid={me.uid} onCreated={load} />

      <div className="space-y-2">
        <h3 className="font-semibold">Movimientos del mes</h3>

        {monthTxs.length === 0 ? (
          <p className="text-sm opacity-70">
            Todavía no cargaste movimientos este mes. Meté el primero y arrancamos el imperio 💸
          </p>
        ) : (
          monthTxs.map((tx) => (
            <div key={tx.id} className="border p-3 rounded-xl text-sm">
              <div className="flex justify-between">
                <span>{tx.category}</span>
                <span>
                  {tx.type === "income" ? "+" : "-"}$
                  {(tx.amountCents / 100).toFixed(2)}
                </span>
              </div>
              {tx.note && <p className="text-xs opacity-70">{tx.note}</p>}
              <p className="text-xs opacity-50">{tx.dayKey}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
