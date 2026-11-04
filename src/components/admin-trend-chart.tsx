"use client";

import { useId, useState } from "react";
import { TrendingUp, Users, ShoppingBag } from "lucide-react";
import { displayPrice } from "@/data/content";

type ChartPoint = {
  label: string;
  orders: number;
  revenue: number;
  visits: number;
};

type Props = {
  data: ChartPoint[];
  totalRevenue: number;
  totalOrders: number;
};

export function AdminTrendChart({ data, totalRevenue, totalOrders }: Props) {
  const [metric, setMetric] = useState<"revenue" | "orders" | "visits">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId();

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d[metric]), 1);
  const width = 640;
  const height = 180;
  const paddingX = 36;
  const paddingY = 24;

  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * innerW;
    const y = height - paddingY - (d[metric] / maxVal) * innerH;
    return { x, y, ...d };
  });

  // Smooth SVG curve generator
  const pathD = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x},${curr.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  const metricColors = {
    revenue: { stroke: "#b8903e", fillStart: "rgba(184, 144, 62, 0.28)", fillEnd: "rgba(184, 144, 62, 0.0)" },
    orders: { stroke: "#24553b", fillStart: "rgba(36, 85, 59, 0.28)", fillEnd: "rgba(36, 85, 59, 0.0)" },
    visits: { stroke: "#2b5c77", fillStart: "rgba(43, 92, 119, 0.25)", fillEnd: "rgba(43, 92, 119, 0.0)" },
  };

  const activeColor = metricColors[metric];

  return (
    <div className="admin-chart-card">
      <div className="admin-chart-header">
        <div>
          <span className="admin-kicker">نبض المزرعة خلال أسبوع</span>
          <h3>المؤشرات التشغيلية والنشاط</h3>
        </div>
        <div className="admin-chart-toggles">
          <button
            type="button"
            className={metric === "revenue" ? "is-active" : ""}
            onClick={() => setMetric("revenue")}
          >
            <TrendingUp size={15} aria-hidden="true" />
            <span>الإيرادات</span>
          </button>
          <button
            type="button"
            className={metric === "orders" ? "is-active" : ""}
            onClick={() => setMetric("orders")}
          >
            <ShoppingBag size={15} aria-hidden="true" />
            <span>الطلبات</span>
          </button>
          <button
            type="button"
            className={metric === "visits" ? "is-active" : ""}
            onClick={() => setMetric("visits")}
          >
            <Users size={15} aria-hidden="true" />
            <span>الزيارات</span>
          </button>
        </div>
      </div>

      <div className="admin-chart-summary">
        <div>
          <small>إجمالي الإيرادات المسجلة</small>
          <strong>{displayPrice(totalRevenue)} ج.م</strong>
        </div>
        <div>
          <small>إجمالي الطلبات</small>
          <strong>{totalOrders} طلب</strong>
        </div>
        <div>
          <small>المتوسط لليوم الحالي</small>
          <strong>
            {metric === "revenue"
              ? `${displayPrice(data[data.length - 1]?.revenue ?? 0)} ج.م`
              : metric === "orders"
              ? `${data[data.length - 1]?.orders ?? 0} طلب`
              : `${data[data.length - 1]?.visits ?? 0} زيارة`}
          </strong>
        </div>
      </div>

      <div className="admin-chart-svg-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="admin-chart-svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor.fillStart} />
              <stop offset="100%" stopColor={activeColor.fillEnd} />
            </linearGradient>
          </defs>

          {/* Background grid lines */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="var(--admin-rule)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + innerH / 2}
            x2={width - paddingX}
            y2={paddingY + innerH / 2}
            stroke="var(--admin-rule)"
            strokeDasharray="4 4"
            opacity={0.6}
          />

          {/* Area fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Curve stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={activeColor.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="var(--admin-surface)"
                stroke={activeColor.stroke}
                strokeWidth={hoveredIndex === i ? 3 : 2}
                className="admin-chart-dot"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Labels underneath */}
        <div className="admin-chart-labels">
          {data.map((d, i) => (
            <span
              key={i}
              className={hoveredIndex === i ? "is-hovered" : ""}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
