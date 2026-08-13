"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ExpenseBreakdownChartProps = {
  currency: string;
  data: {
    id: number;
    label: string;
    amount: string;
  }[];
};

export function ExpenseBreakdownChart({ currency, data }: ExpenseBreakdownChartProps) {
  const format = useFormatter();
  const t = useTranslations("Reports.charts");
  const chartData = data.map((item) => ({
    ...item,
    amount: Number(item.amount),
  }));

  const height = Math.max(240, chartData.length * 48);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            top: 4,
            right: 16,
            bottom: 0,
            left: 8,
          }}
        >
          <CartesianGrid horizontal={false} stroke="#e4e4e7" strokeDasharray="3 3" />

          <XAxis
            axisLine={false}
            tick={{
              fill: "#71717a",
              fontSize: 12,
            }}
            tickFormatter={(value: number) =>
              format.number(value, {
                notation: "compact",
                maximumFractionDigits: 1,
              })
            }
            tickLine={false}
            type="number"
          />

          <YAxis
            axisLine={false}
            dataKey="label"
            tick={{
              fill: "#52525b",
              fontSize: 12,
            }}
            tickLine={false}
            type="category"
            width={130}
          />

          <Tooltip
            contentStyle={{
              border: "1px solid #e4e4e7",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 25px rgb(0 0 0 / 0.08)",
            }}
            formatter={(value) => {
              const amount = Array.isArray(value) ? (value[0] ?? 0) : value;

              return [format.number(Number(amount), { style: "currency", currency }), t("expenses")];
            }}
          />

          <Bar dataKey="amount" fill="#dc2626" isAnimationActive={false} name={t("expenses")} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
