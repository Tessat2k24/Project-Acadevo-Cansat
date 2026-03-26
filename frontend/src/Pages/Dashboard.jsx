// src/Pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FaThermometerHalf,
  FaWeightHanging,
  FaMountain,
  FaCompass,
} from "react-icons/fa";
import { DashboardHeader } from "../components/DashboardHeader";
import MissionSidebar from "../components/MissionSidebar";
import { TelemetryCard } from "../components/TelemetryCard";
import AnalysisVisualization from "../components/AnalysisVisualization";
import BatteryStatus from "../components/BatteryStatus";
import CansatVisualization from "../components/CansatVisualization";
// GroundStation not provided, assuming placeholder or remove
const API_URL = "http://localhost:3001/api/data";
const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cansatState, setCansatState] = useState("calibrate");
  const [connectionStatus, setConnectionStatus] = useState("online");
  const [launchTime, setLaunchTime] = useState("00:00:00");
  const [notifications, setNotifications] = useState(0);
  const [error, setError] = useState(null);
  const [sensorData, setSensorData] = useState({
    temperature: { value: 0, change: 0 },
    pressure: { value: 0, change: 0 },
    altitude: { value: 0, change: 0 },
    pitch: 0,
    roll: 0,
    yaw: 0,
    gyro: { x: 0, y: 0, z: 0 },
    mag: { x: 0, y: 0, z: 0 },
    battery: { percentage: 0, voltage: 0, timeLeft: "N/A", current: 0, health: "Excellent" },
  });
  const [graphData, setGraphData] = useState({
    temperature: [],
    pressure: [],
    altitude: [],
    gyro: [],
    mag: [],
  });
  const prevData = useRef(sensorData);
  const globalTime = useRef(0);
  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const fetchData = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Server error");
      const latest = await res.json();
      if (!latest) return;
      globalTime.current += 1;
      const newData = {
        temperature: {
          value: latest.temp ?? 0,
          change:
            (latest.temp ?? 0) - (prevData.current.temperature.value ?? 0),
        },
        pressure: {
          value: latest.pressure ?? 0,
          change:
            (latest.pressure ?? 0) - (prevData.current.pressure.value ?? 0),
        },
        altitude: {
          value: latest.altitude ?? 0,
          change:
            (latest.altitude ?? 0) - (prevData.current.altitude.value ?? 0),
        },
        pitch: latest.pitch ?? 0,
        roll: latest.roll ?? 0,
        yaw: latest.yaw ?? 0,
        gyro: {
          x: latest.gyroX ?? 0,
          y: latest.gyroY ?? 0,
          z: latest.gyroZ ?? 0,
        },
        mag: {
          x: latest.magX ?? 0,
          y: latest.magY ?? 0,
          z: latest.magZ ?? 0,
        },
        battery: latest.battery ?? { percentage: 0, voltage: 0, timeLeft: "N/A", current: 0, health: "Excellent" },
      };
      setSensorData(newData);
      prevData.current = newData;
      setCansatState(latest.flightState || "calibrate");
      setLaunchTime(latest.missionTime || "00:00:00");
      setConnectionStatus("online");
      setError(null);
      setGraphData((prev) => ({
        temperature: [
          ...prev.temperature.slice(-14),
          { time: globalTime.current, value: newData.temperature.value },
        ],
        pressure: [
          ...prev.pressure.slice(-14),
          { time: globalTime.current, value: newData.pressure.value },
        ],
        altitude: [
          ...prev.altitude.slice(-14),
          { time: globalTime.current, value: newData.altitude.value },
        ],
        gyro: [
          ...prev.gyro.slice(-14),
          {
            time: globalTime.current,
            x: newData.gyro.x,
            y: newData.gyro.y,
            z: newData.gyro.z,
          },
        ],
        mag: [
          ...prev.mag.slice(-14),
          {
            time: globalTime.current,
            x: newData.mag.x,
            y: newData.mag.y,
            z: newData.mag.z,
          },
        ],
      }));
    } catch (err) {
      console.error("Fetch failed:", err);
      setConnectionStatus("offline");
      setError("Backend offline");
    }
  };
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => clearInterval(id);
  }, []);
  if (error && connectionStatus === "offline") {
    return (
      <div className="flex h-screen bg-gray-950 text-white items-center justify-center text-center">
        <div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Connection Error
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <MissionSidebar
          connectionStatus={connectionStatus}
          timeSinceLaunch={launchTime}
          cansatState={cansatState}
          collapsed={!sidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          notifications={notifications}
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <TelemetryCard
              title="Temperature"
              value={sensorData.temperature.value.toFixed(2)}
              unit="°C"
              change={sensorData.temperature.change.toFixed(2)}
              icon={FaThermometerHalf}
            />
            <TelemetryCard
              title="Pressure"
              value={sensorData.pressure.value.toFixed(2)}
              unit="hPa"
              change={sensorData.pressure.change.toFixed(2)}
              icon={FaWeightHanging}
            />
            <TelemetryCard
              title="Altitude"
              value={sensorData.altitude.value.toFixed(2)}
              unit="m"
              change={sensorData.altitude.change.toFixed(2)}
              icon={FaMountain}
            />
            <TelemetryCard
              title="Magnetic Field"
              value={(
                Math.sqrt(
                  sensorData.mag.x ** 2 +
                    sensorData.mag.y ** 2 +
                    sensorData.mag.z ** 2
                ) || 0
              ).toFixed(2)}
              unit="μT"
              change={0}
              icon={FaCompass}
            />
          </div>
          <div className="mb-8">
            <AnalysisVisualization
              sensorData={sensorData}
              graphData={graphData}
            />
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <CansatVisualization
                  gyroData={{
                    x: sensorData.roll,
                    y: sensorData.pitch,
                    z: sensorData.yaw,
                  }}
                  cansatState={cansatState}
                />
              </div>
              <div className="flex-1">
                <BatteryStatus sensorData={sensorData} />
              </div>
            </div>
            {/* GroundStation placeholder */}
            <div>
              {/* <GroundStation groundStationData={{}} /> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Dashboard;