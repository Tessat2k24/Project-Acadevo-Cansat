import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import MissionSidebar from "../components/MissionSidebar";

const API_URL = "http://localhost:3001/api/data";
const LINE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#22D3EE",
];
const AXIS_COLORS = { x: "#3B82F6", y: "#F59E0B", z: "#EC4899" };

const MetricCard = ({ metric, lineColor }) => {
  const { title, value, unit, change, data } = metric;

  const safeToFixed = (val, digits = 2) =>
    Number.isFinite(val) ? val.toFixed(digits) : "0.00";

  const getTrendIcon = (c) => {
    if (!Number.isFinite(c) || Math.abs(c) < 0.01)
      return <Minus className="w-3 h-3" />;
    return c > 0 ? (
      <TrendingUp className="w-3 h-3" />
    ) : (
      <TrendingDown className="w-3 h-3" />
    );
  };

  const getTrendColor = (c) => {
    if (!Number.isFinite(c) || Math.abs(c) < 0.01) return "text-gray-400";
    return c > 0 ? "text-green-400" : "text-red-400";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 shadow-md text-xs">
        <p className="text-gray-400">{new Date(label).toLocaleTimeString()}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-white font-medium">
            {p.name}: {safeToFixed(p.value, 2)} {unit}
          </p>
        ))}
      </div>
    );
  };

  const filteredData = data.filter((d) =>
    title === "Gyro" || title === "Magnetometer"
      ? Number.isFinite(d.xValue) &&
        Number.isFinite(d.yValue) &&
        Number.isFinite(d.zValue)
      : Number.isFinite(d.value)
  );

  const xAxisTickFormatter = (v) => {
    const d = new Date(v);
    return `${d.getMinutes().toString().padStart(2, "0")}:${d
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl border bg-gradient-to-br from-gray-900 to-gray-800 shadow-md border-gray-700 shadow-gray-500/10 flex flex-col min-h-[200px] sm:min-h-[250px]">
      <div className="p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-2">
          <h3 className="text-white font-semibold text-sm sm:text-base">
            {title}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs">
            {title === "Gyro" || title === "Magnetometer" ? (
              <div className="font-bold text-white text-xs sm:text-sm">
                <div className="flex flex-wrap gap-2">
                  <span>X: {safeToFixed(value.x)}</span>
                  <span>Y: {safeToFixed(value.y)}</span>
                  <span>Z: {safeToFixed(value.z)}</span>
                  <span className="text-gray-400">{unit}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base">
                  {safeToFixed(value)}
                </span>
                <span className="text-gray-400 text-xs sm:text-sm">{unit}</span>
                <span
                  className={`flex items-center gap-1 font-medium text-xs sm:text-sm ${getTrendColor(
                    change
                  )}`}
                >
                  {getTrendIcon(change)}
                  {change > 0 ? "+" : ""}
                  {safeToFixed(change)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[150px] sm:min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="2 2"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={xAxisTickFormatter}
              fontSize={8}
              stroke="#94a3b8"
              allowDataOverflow
              tickCount={3}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={8}
              tickFormatter={(v) => (Number.isFinite(v) ? v.toFixed(1) : "")}
              tick={{ fill: "#94a3b8" }}
              allowDataOverflow
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            {title === "Gyro" || title === "Magnetometer" ? (
              <>
                <Line
                  type="monotone"
                  dataKey="xValue"
                  name="X"
                  stroke={AXIS_COLORS.x}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="yValue"
                  name="Y"
                  stroke={AXIS_COLORS.y}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="zValue"
                  name="Z"
                  stroke={AXIS_COLORS.z}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.5}
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

const Graphs = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataPoints, setDataPoints] = useState({
    temp: [],
    pressure: [],
    altitude: [],
    gyro: [],
    magneto: [],
    speed: [],
  });

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const fetchData = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Server error");
      const latest = await res.json();
      if (!latest) return;

      const ts = new Date().getTime();

      setDataPoints((prev) => {
        const add = (arr, val) => [
          ...arr.slice(-49),
          { timestamp: ts, value: val },
        ];
        const addXYZ = (arr, x, y, z) => [
          ...arr.slice(-49),
          { timestamp: ts, xValue: x, yValue: y, zValue: z },
        ];

        return {
          temp: add(prev.temp, parseFloat(latest.temp) || 0),
          pressure: add(prev.pressure, parseFloat(latest.pressure) || 0),
          altitude: add(prev.altitude, parseFloat(latest.altitude) || 0),
          gyro: addXYZ(
            prev.gyro,
            parseFloat(latest.gyroX) || 0,
            parseFloat(latest.gyroY) || 0,
            parseFloat(latest.gyroZ) || 0
          ),
          magneto: addXYZ(
            prev.magneto,
            parseFloat(latest.magX) || 0,
            parseFloat(latest.magY) || 0,
            parseFloat(latest.magZ) || 0
          ),
          speed: add(prev.speed, 0),
        };
      });

      setError(null);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Backend offline");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => {
      clearInterval(timer);
      clearInterval(id);
    };
  }, []);

  const metrics = useMemo(() => {
    const safeChange = (arr) => {
      if (arr.length < 2) return 0;
      const diff = arr.at(-1)?.value - arr.at(-2)?.value;
      return Number.isFinite(diff) ? diff : 0;
    };

    const latestTemp = dataPoints.temp.at(-1);
    const latestGyro = dataPoints.gyro.at(-1);
    const latestMag = dataPoints.magneto.at(-1);

    if (!latestTemp || !latestGyro || !latestMag) return [];

    return [
      {
        title: "Temperature",
        value: latestTemp.value,
        unit: "°C",
        change: safeChange(dataPoints.temp),
        data: dataPoints.temp,
      },
      {
        title: "Pressure",
        value: dataPoints.pressure.at(-1)?.value || 0,
        unit: "hPa",
        change: safeChange(dataPoints.pressure),
        data: dataPoints.pressure,
      },
      {
        title: "Altitude",
        value: dataPoints.altitude.at(-1)?.value || 0,
        unit: "m",
        change: safeChange(dataPoints.altitude),
        data: dataPoints.altitude,
      },
      {
        title: "Gyro",
        value: {
          x: latestGyro.xValue,
          y: latestGyro.yValue,
          z: latestGyro.zValue,
        },
        unit: "°/s",
        change: { x: 0, y: 0, z: 0 },
        data: dataPoints.gyro,
      },
      {
        title: "Magnetometer",
        value: {
          x: latestMag.xValue,
          y: latestMag.yValue,
          z: latestMag.zValue,
        },
        unit: "µT",
        change: { x: 0, y: 0, z: 0 },
        data: dataPoints.magneto,
      },
      {
        title: "Speed",
        value: dataPoints.speed.at(-1)?.value || 0,
        unit: "m/s",
        change: safeChange(dataPoints.speed),
        data: dataPoints.speed,
      },
    ];
  }, [dataPoints]);

  if (error) {
    return (
      <div className="flex h-screen bg-gray-950 text-white items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">
            Connection Error
          </h2>
          <p className="text-gray-400 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <MissionSidebar
        collapsed={!sidebarOpen}
        onToggleCollapse={toggleSidebar}
        connectionStatus="online"
        timeSinceLaunch="00:12:45"
        cansatState="launch"
      />
      <main className="flex-1 p-2 sm:p-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Telemetry Dashboard
            </h1>
            <p className="text-gray-400 text-xs">Real-time system monitoring</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-base sm:text-lg font-mono text-white mb-0.5">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-400">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="grid overflow-auto pb-10 lg:overflow-hidden lg:mb-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
          {metrics.map((m, i) => (
            <MetricCard
              key={i}
              metric={m}
              lineColor={LINE_COLORS[i % LINE_COLORS.length]}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Graphs;
