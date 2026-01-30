"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Tx = {
  type: "income" | "expense";
  amountCents: number;
  category: string;
};

function centsToARS(cents: number) {
  return cents / 100;
}

function formatARS(value: number) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

const COLORS = [
  "#3b82f6",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#e11d48",
  "#64748b",
];

export default function MonthlyChart({ monthTxs }: { monthTxs: Tx[] }) {
  const { data, totalExpense } = useMemo(() => {
    const byCategory = new Map<string, number>();

    for (const tx of monthTxs) {
      if (tx.type !== "expense") continue;
      const prev = byCategory.get(tx.category) ?? 0;
      byCategory.set(tx.category, prev + (tx.amountCents ?? 0));
    }

    const data = Array.from(byCategory.entries()).map(([category, cents]) => ({
      name: category,
      value: centsToARS(cents),
    }));

    const totalExpense = data.reduce((acc, d) => acc + d.value, 0);

    return { data, totalExpense };
  }, [monthTxs]);

  if (!data.length) {
    return (
      <div className="border p-4 rounded-xl">
        <p className="text-sm opacity-70">No hay gastos en este mes para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-xl space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Distribución de gastos</h3>
        <p className="text-xs opacity-70">¿En qué se fue la plata?</p>
      </div>

      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              innerRadius={72}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            {/* Texto en el centro */}
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: "16px", fontWeight: 700 }}
            >
              {formatARS(totalExpense)}
            </text>
            <text
              x="50%"
              y="57%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: "12px", opacity: 0.75 }}
            >
              Gastos del mes
            </text>

            <Tooltip
              formatter={(value: any) => formatARS(Number(value))}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs opacity-60">
        Si una porción domina… ahí está el “jefe final” de tu presupuesto 😅
      </p>
    </div>
  );
}
