// src/components/TelemetryCard.jsx
import React from "react";
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
export function TelemetryCard({
  title,
  value = 0,
  unit,
  change = 0,
  icon: Icon,
  precision = 1,
}) {
  const formatValue = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0" : num.toFixed(precision);
  };
  const formatChange = (val) => {
    const num = Math.abs(parseFloat(val));
    return isNaN(num) ? "0" : num.toFixed(precision);
  };
  const getTrendIcon = () => {
    const c = parseFloat(change);
    if (isNaN(c)) return FaMinus;
    return c > 0 ? FaArrowUp : c < 0 ? FaArrowDown : FaMinus;
  };
  const getTrendColor = () => {
    const c = parseFloat(change);
    if (isNaN(c)) return "text-gray-400";
    return c > 0 ? "text-green-500" : c < 0 ? "text-red-500" : "text-gray-400";
  };
  const TrendIcon = getTrendIcon();
  const trendColor = getTrendColor();
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg shadow-lg hover:shadow-red-500/20 transition-all duration-300 p-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
        <Icon className="h-6 w-6 text-red-800" />
      </div>
      <div className="mt-2">
        <div className="flex items-center text-xl font-bold text-white font-mono">
          {formatValue(value)}
          <span className="text-base text-gray-400 ml-1">{unit}</span>
          <div
            className={`flex items-center ml-5 space-x-1 text-xs ${trendColor}`}
          >
            <TrendIcon className="h-3 w-3" />
            <span className="font-medium">
              {change !== 0 && (parseFloat(change) > 0 ? "+" : "-")}
              {formatChange(change)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}