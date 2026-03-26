// src/components/SensorGraphCard.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
const SensorGraphCard = ({
  title,
  unit,
  color,
  data,
  currentValue,
  dataKey,
  lineKeys,
}) => {
  const isMultiLine = Array.isArray(lineKeys);
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    if (isMultiLine) {
      return (
        <div className="bg-gray-800 p-2 rounded shadow-lg border border-gray-700 text-white text-xs">
          {payload.map((p, i) => (
            <div key={i}>
              <span style={{ color: p.stroke }}>{p.name}:</span>{" "}
              {p.value.toFixed(2)}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="bg-gray-800 p-2 rounded shadow-lg border border-gray-700 text-white text-xs">
        {title}: {payload[0].value.toFixed(1)} {unit}
      </div>
    );
  };
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-gray-400 uppercase">
          {title}
        </h2>
        <span className="text-lg font-bold text-green-400">
          {currentValue}
          <span className="text-sm ml-1 text-gray-500">{unit}</span>
        </span>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              stroke="#4B5563"
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              stroke="#4B5563"
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {isMultiLine ? (
              lineKeys.map((k, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={k.dataKey}
                  stroke={k.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default SensorGraphCard;