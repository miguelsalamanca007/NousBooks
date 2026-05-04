"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statsApi } from "@/lib/api";
import { ReadingStatus, STATUS_LABELS } from "@/types";

// Tailwind palette → hex, so the SVG charts can use the same accent
// colours as the rest of the app without relying on CSS-in-JS.
const STATUS_HEX: Record<ReadingStatus, string> = {
  TO_READ: "#fcd34d", // amber-300
  READING: "#7dd3fc", // sky-300
  READ: "#6ee7b7",    // emerald-300
};

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.getMyStats,
  });

  if (isLoading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (!stats) return <p className="text-sm text-zinc-400">No stats yet.</p>;

  const memberSinceLabel = new Date(stats.memberSince).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long" }
  );

  // Bar chart needs a short month label ("Jan", "Feb") and the year only when
  // it changes — keeps the x-axis from getting cramped.
  const monthly = stats.finishedByMonth.map((m, idx, arr) => {
    const date = new Date(m.month + "-01");
    const showYear =
      idx === 0 ||
      new Date(arr[idx - 1].month + "-01").getFullYear() !== date.getFullYear();
    return {
      ...m,
      label: date.toLocaleString("en-US", { month: "short" }),
      sublabel: showYear ? date.getFullYear().toString() : "",
    };
  });

  const pieData = (Object.keys(stats.booksByStatus) as ReadingStatus[])
    .map((status) => ({
      status,
      name: STATUS_LABELS[status],
      value: stats.booksByStatus[status],
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-800">Reading stats</h1>
        <p className="text-sm text-zinc-500">Member since {memberSinceLabel}</p>
      </div>

      {/* Top-line cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total books" value={stats.totalBooks} />
        <StatCard
          label="Currently reading"
          value={stats.booksByStatus.READING}
        />
        <StatCard label="Read this year" value={stats.readThisYear} />
        <StatCard label="Notes" value={stats.totalNotes} />
      </div>

      {/* Bar chart: finished per month */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Finished by month
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthly}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#71717a", fontSize: 12 }}
                axisLine={{ stroke: "#e4e4e7" }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#fef3c7" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                  fontSize: 12,
                }}
                formatter={(value) => [value as number, "Books finished"]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as
                    | { month: string }
                    | undefined;
                  if (!p) return "";
                  return new Date(p.month + "-01").toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  });
                }}
              />
              <Bar
                dataKey="count"
                fill="#fcd34d"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Pie / donut: distribution by status */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Library distribution
        </h2>

        {pieData.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Add a book to start tracking your library.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-around">
            <div className="h-56 w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="white"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_HEX[entry.status]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e4e4e7",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <ul className="flex flex-col gap-2 text-sm">
              {pieData.map((entry) => (
                <li key={entry.status} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: STATUS_HEX[entry.status] }}
                  />
                  <span className="text-zinc-700">{entry.name}</span>
                  <span className="text-zinc-400">·</span>
                  <span className="font-medium text-zinc-700">
                    {entry.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-zinc-800">{value}</p>
    </div>
  );
}
