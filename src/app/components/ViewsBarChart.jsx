"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

/** Monochrome bar chart for view counts. `data` = [{ label, views }]. */
export default function ViewsBarChart({ data, height = 260 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current.getContext("2d"), {
      type: "bar",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "Views",
            data: data.map((d) => d.views || 0),
            backgroundColor: data.map((_, i) => (i === data.length - 1 ? "#111111" : "#d4d4d4")),
            hoverBackgroundColor: "#dc3d24",
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111",
            padding: 10,
            displayColors: false,
            callbacks: { label: (ctx) => `${ctx.parsed.y} views` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#6B7280", maxRotation: 0, autoSkipPadding: 12 },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: "#F3F4F6" },
            ticks: { color: "#9CA3AF", precision: 0 },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div style={{ height }} className="w-full">
      <canvas ref={canvasRef} role="img" aria-label="Views over time" />
    </div>
  );
}

/** Bucket `rows` (with created_at) into hourly or daily slots between start and end. */
export function bucketViews(rows, start, end) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const spanHours = (endMs - startMs) / 36e5;
  const hourly = spanHours <= 48;
  const stepMs = hourly ? (spanHours <= 24 ? 36e5 : 3 * 36e5) : 864e5;

  const buckets = [];
  const first = new Date(startMs);
  if (hourly) first.setMinutes(0, 0, 0);
  else first.setHours(0, 0, 0, 0);

  for (let t = first.getTime(); t <= endMs; t += stepMs) {
    const d = new Date(t);
    buckets.push({
      start: t,
      label: hourly
        ? d.toLocaleTimeString("en-US", { hour: "numeric" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: 0,
    });
    if (buckets.length > 400) break;
  }

  rows.forEach((r) => {
    const t = new Date(r.created_at).getTime();
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (t >= buckets[i].start) {
        buckets[i].views += 1;
        break;
      }
    }
  });

  return buckets;
}
