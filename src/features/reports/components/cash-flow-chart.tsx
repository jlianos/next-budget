"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatMoney } from "@/lib/money";

type CashFlowChartProps = {
  currency: string;
  data: {
    key: string;
    label: string;
    income: string;
    expenses: string;
    net: string;
  }[];
};

export function CashFlowChart({ currency, data }: CashFlowChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    income: Number(item.income),
    expenses: Number(item.expenses),
    net: Number(item.net),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: 8,
            right: 8,
            bottom: 0,
            left: 0,
          }}
        >
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />

          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={24}
            tick={{
              fill: "#71717a",
              fontSize: 12,
            }}
            tickLine={false}
          />

          <YAxis
            axisLine={false}
            tick={{
              fill: "#71717a",
              fontSize: 12,
            }}
            tickFormatter={(value: number) =>
              new Intl.NumberFormat("en", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value)
            }
            tickLine={false}
            width={48}
          />

          <Tooltip
            contentStyle={{
              border: "1px solid #e4e4e7",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px rgb(0 0 0 / 0.08)",
            }}
            formatter={(value, name) => {
              const amount = Array.isArray(value) ? (value[0] ?? 0) : value;

              return [formatMoney(amount, currency), name ?? ""];
            }}
          />

          <Legend />

          <Bar dataKey="income" fill="#059669" isAnimationActive={false} name="Income" radius={[4, 4, 0, 0]} />

          <Bar dataKey="expenses" fill="#dc2626" isAnimationActive={false} name="Expenses" radius={[4, 4, 0, 0]} />

          <Line
            dataKey="net"
            dot={false}
            isAnimationActive={false}
            name="Net"
            stroke="#18181b"
            strokeWidth={2}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
