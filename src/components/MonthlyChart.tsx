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

// Paleta elegante (sin carnaval)
const COLORS = [
  "#3b82f6", // azul
  "#16a34a", // verde
  "#f59e0b", // naranja
  "#ef4444", // rojo
  "#8b5cf6", // violeta
  "#06b6d4", // cyan
  "#e11d48", // rosa fuerte
  "#64748b", // gris
];

export default function MonthlyChart({
  monthTxs,
}: {
  monthTxs: Tx[];
}) {
  const data = useMemo(() => {
    const byCategory = new Map<string, number>();

    for (const tx of monthTxs) {
      if (tx.type !== "expense") continue;

      const prev = byCategory.get(tx.category) ?? 0;
      byCategory.set(tx.category, prev + (tx.amountCents ?? 0));
    }

    return Array.from(byCategory.entries()).map(([category, cents]) => ({
      name: category,
      value: centsToARS(cents),
    }));
  }, [monthTxs]);

  if (!data.length) {
    return (
      <div className="border p-4 rounded-xl">
        <p className="text-sm opacity-70">
          No hay gastos en este mes para mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="border p-4 rounded-xl space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Distribución de gastos</h3>
        <p className="text-xs opacity-70">
          ¿En qué se fue la plata?
        </p>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label={({ name }) => name}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value: any) =>
                formatARS(Number(value))
              }
            />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs opacity-60">
        Si una porción domina… ya sabés dónde atacar el presupuesto.
      </p>
    </div>
  );
}
