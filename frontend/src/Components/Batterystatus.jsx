// src/components/BatteryStatus.jsx
import React from "react";
import { FaBolt, FaTachometerAlt, FaClock } from "react-icons/fa";
export default function BatteryStatus({ sensorData }) {
  const { percentage, voltage, current, timeLeft, health } = sensorData.battery;
  const getBatteryFill = (p) =>
    p > 60 ? "bg-green-500" : p > 30 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Battery Status</h3>
          <p className="text-sm text-gray-400">Power Management</p>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Charge Level</span>
          <span className="text-lg font-bold text-white">
            {percentage?.toFixed(2)}%
          </span>
        </div>
        <div className="relative">
          <div className="w-full h-8 bg-gray-700/50 rounded-lg border border-gray-600/50 overflow-hidden">
            <div
              className={`${getBatteryFill(
                percentage
              )} h-full transition-all duration-500 relative`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-4 bg-gray-600 rounded-r border border-gray-500" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
          <div className="flex items-center gap-2 mb-2">
            <FaBolt className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Voltage</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white">
              {voltage?.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">V</span>
          </div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
          <div className="flex items-center gap-2 mb-2">
            <FaTachometerAlt className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Current</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white">
              {current?.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400">A</span>
          </div>
        </div>
        <div className="col-span-2 bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Estimated Time Left</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-white">{timeLeft}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-400 font-medium">
            Battery Health: {health}
          </span>
        </div>
      </div>
    </div>
  );
}