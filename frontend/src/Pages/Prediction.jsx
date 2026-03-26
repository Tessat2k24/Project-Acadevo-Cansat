// src/pages/Prediction.jsx
{/* 
import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Thermometer,
  Droplets,
  Gauge,
} from "lucide-react";
import MissionSidebar from "../Components/MissionSidebar";

const API_URL = "http://localhost:3001/api/data";
const PREDICTIONS_URL = "http://localhost:3001/api/predictions?limit=50";

const MetricCard = ({ metric }) => {
  const {
    title,
    value,
    unit,
    change,
    color,
    icon: Icon,
    data,
    status,
    cansatColor,
    groundColor,
  } = metric;

  const getTrendIcon = () => {
    if (Math.abs(change) < 0.1) return <Minus className="w-4 h-4" />;
    return change > 0 ? (
      <TrendingUp className="w-4 h-4" style={{ color }} />
    ) : (
      <TrendingDown className="w-4 h-4" style={{ color }} />
    );
  };

  const getTrendColor = () => {
    if (Math.abs(change) < 0.1) return "text-gray-400";
    return change > 0 ? "text-emerald-400" : "text-red-400";
  };

  const getStatusColor = () => {
    switch (status) {
      case "critical":
        return "border border-red-500";
      case "warning":
        return "border border-amber-500";
      case "good":
        return "border border-emerald-500";
      default:
        return "border border-gray-700";
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 shadow-xl text-xs">
        <p className="text-gray-400 mb-1">
          {new Date(label).toLocaleTimeString()}
        </p>
        <p className="text-sm font-medium text-white">
          Predicted: {d.value?.toFixed(2)} {unit}
        </p>
        <p className="text-sm font-medium" style={{ color: cansatColor }}>
          Cansat: {d.cansat?.toFixed(2)} {unit}
        </p>
        <p className="text-sm font-medium" style={{ color: groundColor }}>
          Ground: {d.ground?.toFixed(2)} {unit}
        </p>
      </div>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gray-900 cursor-pointer ${getStatusColor()} col-span-1 row-span-1 flex flex-col`}
      style={{ height: "100%" }}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `linear-gradient(13510deg, ${color}22, transparent 50%, ${color}11)`,
        }}
      />
      <div className="relative p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <h3 className="text-white font-semibold text-sm">{title}</h3>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              status === "critical"
                ? "bg-red-500"
                : status === "warning"
                ? "bg-amber-500"
                : status === "good"
                ? "bg-emerald-500"
                : "bg-gray-500"
            }`}
          />
        </div>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {value.toFixed(1)}
          </span>
          <span className="text-lg text-gray-400">{unit}</span>
          <span className={getTrendColor()}>{getTrendIcon()}</span>
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {change > 0 ? "+" : ""}
            {change.toFixed(2)} {unit}
          </span>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id={`grad-${title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timestamp"
                hide
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
              />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Predicted"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title})`}
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Predicted</p>
            <p className="text-sm text-white font-medium" style={{ color }}>
              {value.toFixed(1)} {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Cansat</p>
            <p
              className="text-sm text-white font-medium"
              style={{ color: cansatColor }}
            >
              {Math.min(...data.map((d) => d.cansat || d.value)).toFixed(1)}{" "}
              {unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Ground</p>
            <p
              className="text-sm text-white font-medium"
              style={{ color: groundColor }}
            >
              {Math.max(...data.map((d) => d.ground || d.value)).toFixed(1)}{" "}
              {unit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingIndicator = ({ loading }) => (
  <div
    className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      loading ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    }`}
  >
    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-700 text-blue-400 font-semibold text-sm animate-pulse">
      <svg
        className="animate-spin h-4 w-4 text-blue-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span>Updating...</span>
    </div>
  </div>
);

const Prediction = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [predictionsData, setPredictionsData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missionData, setMissionData] = useState({});

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [predictionsRes, latestRes, missionRes] = await Promise.all([
        fetch(PREDICTIONS_URL),
        fetch(API_URL),
        fetch("http://localhost:3001/api/mission"),
      ]);

      if (!predictionsRes.ok || !latestRes.ok || !missionRes.ok)
        throw new Error();

      const predictions = await predictionsRes.json();
      const latest = await latestRes.json();
      const mission = await missionRes.json();

      const transformed = predictions.map((p) => ({
        ...p,
        temperature: { ...p.temperature, cansat: latest.temp, ground: 0 },
        pressure: { ...p.pressure, cansat: latest.pressure, ground: 0 },
        voltage: { ...p.voltage, cansat: latest.voltage, ground: 0 },
      }));

      setPredictionsData(transformed);
      setMissionData(mission);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => clearInterval(id);
  }, []);

  const getStatus = (v, t) => {
    if (v > t.critical[1] || v < t.critical[0]) return "critical";
    if (v > t.warning[1] || v < t.warning[0]) return "warning";
    return "good";
  };

  const metrics = useMemo(() => {
    if (!predictionsData.length) return [];

    const latest = predictionsData.at(-1);

    return [
      {
        title: "Temperature",
        value: latest.temperature.predicted,
        unit: "°C",
        change:
          latest.temperature.predicted -
            predictionsData.at(-2)?.temperature.predicted || 0,
        color: "#EF4444",
        cansatColor: "tomato",
        groundColor: "violet",
        icon: Thermometer,
        data: predictionsData.map((d) => ({
          timestamp: d.timestamp,
          value: d.temperature.predicted,
          cansat: d.temperature.cansat,
          ground: d.temperature.ground,
        })),
        status: getStatus(latest.temperature.predicted, {
          critical: [15, 35],
          warning: [18, 30],
        }),
      },
      {
        title: "Pressure",
        value: latest.pressure.predicted,
        unit: "hPa",
        change:
          latest.pressure.predicted -
            predictionsData.at(-2)?.pressure.predicted || 0,
        color: "#10B981",
        cansatColor: "tomato",
        groundColor: "violet",
        icon: Gauge,
        data: predictionsData.map((d) => ({
          timestamp: d.timestamp,
          value: d.pressure.predicted,
          cansat: d.pressure.cansat,
          ground: d.pressure.ground,
        })),
        status: getStatus(latest.pressure.predicted, {
          critical: [1000, 1025],
          warning: [1005, 1020],
        }),
      },
      {
        title: "Voltage",
        value: latest.voltage.predicted,
        unit: "V",
        change:
          latest.voltage.predicted -
            predictionsData.at(-2)?.voltage.predicted || 0,
        color: "#F59E0B",
        cansatColor: "tomato",
        groundColor: "violet",
        icon: Zap,
        data: predictionsData.map((d) => ({
          timestamp: d.timestamp,
          value: d.voltage.predicted,
          cansat: d.voltage.cansat,
          ground: d.voltage.ground,
        })),
        status: getStatus(latest.voltage.predicted, {
          critical: [11, 13.5],
          warning: [11.5, 13],
        }),
      },
    ];
  }, [predictionsData]);

  if (error) {
    return (
      <div className="flex h-screen bg-gray-950 text-white items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Connection Error
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <MissionSidebar
        collapsed={!sidebarOpen}
        onToggleCollapse={toggleSidebar}
        connectionStatus={missionData.connectionStatus || "offline"}
        timeSinceLaunch={missionData.launchTime || "00:00:00"}
        cansatState={missionData.cansatState || "calibrate"}
      />
      <div className="flex-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex flex-col overflow-hidden">
        <div className="max-w-7xl w-full mx-auto mb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Telemetry Prediction
              </h1>
              <p className="text-gray-400">Real-time Parameter Prediction</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-white mb-1">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-400">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 h-full">
            {predictionsData.length > 0 ? (
              metrics.map((m, i) => <MetricCard key={i} metric={m} />)
            ) : (
              <div className="col-span-full text-center p-8 text-gray-400">
                Awaiting data...
              </div>
            )}
          </div>
        </div>
      </div>
      <LoadingIndicator loading={loading} />
    </div>
  );
};

export default Prediction;
*\}