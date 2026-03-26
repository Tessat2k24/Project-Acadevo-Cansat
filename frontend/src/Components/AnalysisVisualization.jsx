// src/components/AnalysisVisualization.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";
const AnalysisVisualization = ({ sensorData, graphData }) => {
  const [activeTab, setActiveTab] = useState("temperature");
  const tabs = [
    { id: "temperature", label: "Temperature", unit: "°C", color: "#ff4444" },
    { id: "pressure", label: "Pressure", unit: "hPa", color: "#44ff44" },
    { id: "altitude", label: "Altitude", unit: "m", color: "#ffaa44" },
    { id: "gyro", label: "Gyro", unit: "", color: "#ffaa44" },
    { id: "mag", label: "Mag", unit: "", color: "#4444ff" },
  ];
  const getChangeIcon = (c) =>
    c > 0 ? (
      <FaArrowUp className="inline-block mr-1" />
    ) : c < 0 ? (
      <FaArrowDown className="inline-block mr-1" />
    ) : (
      <FaMinus className="inline-block mr-1" />
    );
  const getChangeClass = (c) =>
    c > 0 ? "text-green-400" : c < 0 ? "text-red-400" : "text-gray-300";
  const getCurrentValueDisplay = () => {
    if (activeTab === "gyro") {
      return (
        <span>
          X: {sensorData.gyro.x.toFixed(2)} Y: {sensorData.gyro.y.toFixed(2)} Z:{" "}
          {sensorData.gyro.z.toFixed(2)}
        </span>
      );
    } else if (activeTab === "mag") {
      return (
        <span>
          X: {sensorData.mag.x.toFixed(2)} Y: {sensorData.mag.y.toFixed(2)} Z:{" "}
          {sensorData.mag.z.toFixed(2)}
        </span>
      );
    }
    const tab = tabs.find((t) => t.id === activeTab);
    return (
      <span>
        {sensorData[activeTab].value.toFixed(1)}
        {tab.unit}
      </span>
    );
  };
  const getChangeDisplay = () => {
    if (activeTab === "gyro" && graphData.gyro.length > 1) {
      const [prev, curr] = [graphData.gyro.at(-2), graphData.gyro.at(-1)];
      return (
        <span className="ml-2">
          <span className={getChangeClass(curr.x - prev.x)}>
            {getChangeIcon(curr.x - prev.x)}X:{(curr.x - prev.x).toFixed(2)}
          </span>{" "}
          <span className={getChangeClass(curr.y - prev.y)}>
            {getChangeIcon(curr.y - prev.y)}Y:{(curr.y - prev.y).toFixed(2)}
          </span>{" "}
          <span className={getChangeClass(curr.z - prev.z)}>
            {getChangeIcon(curr.z - prev.z)}Z:{(curr.z - prev.z).toFixed(2)}
          </span>
        </span>
      );
    } else if (activeTab === "mag" && graphData.mag.length > 1) {
      const [prev, curr] = [graphData.mag.at(-2), graphData.mag.at(-1)];
      return (
        <span className="ml-2">
          <span className={getChangeClass(curr.x - prev.x)}>
            {getChangeIcon(curr.x - prev.x)}X:{(curr.x - prev.x).toFixed(2)}
          </span>{" "}
          <span className={getChangeClass(curr.y - prev.y)}>
            {getChangeIcon(curr.y - prev.y)}Y:{(curr.y - prev.y).toFixed(2)}
          </span>{" "}
          <span className={getChangeClass(curr.z - prev.z)}>
            {getChangeIcon(curr.z - prev.z)}Z:{(curr.z - prev.z).toFixed(2)}
          </span>
        </span>
      );
    }
    const change = sensorData[activeTab].change;
    return (
      <span className={`${getChangeClass(change)} ml-2`}>
        {getChangeIcon(change)}
        {change.toFixed(1)}
      </span>
    );
  };
  const renderChart = () => {
    const tab = tabs.find((t) => t.id === activeTab);
    const data = graphData[activeTab] || [];
    const domain = data.length > 1 ? [data[0].time, data.at(-1).time] : [0, 14];
    if (activeTab === "gyro" || activeTab === "mag") {
      const colors = { x: "#ff4444", y: "#44ff44", z: "#4444ff" };
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={12}
              tickFormatter={(v) => `${v}s`}
              domain={domain}
            />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip
              content={({ payload }) =>
                payload?.length ? (
                  <div className="bg-gray-800 p-2 rounded text-white text-xs">
                    X: {payload[0].payload.x.toFixed(2)}
                    <br />
                    Y: {payload[1].payload.y.toFixed(2)}
                    <br />
                    Z: {payload[2].payload.z.toFixed(2)}
                  </div>
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="x"
              stroke={colors.x}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke={colors.y}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="z"
              stroke={colors.z}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="time"
            stroke="#94A3B8"
            fontSize={12}
            tickFormatter={(v) => `${v}s`}
            domain={domain}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickFormatter={(v) => `${v}${tab.unit}`}
          />
          <Tooltip
            content={({ payload }) =>
              payload?.length ? (
                <div className="bg-gray-800 p-2 rounded text-white text-xs">{`${tab.label}: ${payload[0].value}${tab.unit}`}</div>
              ) : null
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={tab.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Sensor Analysis</h2>
        <div className="text-white font-medium flex items-center text-sm">
          {getCurrentValueDisplay()}
          {getChangeDisplay()}
        </div>
      </div>
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-red-500 text-red-500"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="h-80">{renderChart()}</div>
    </div>
  );
};
export default AnalysisVisualization;