// src/components/MissionSidebar.jsx
import React, { useState, useEffect } from "react";
import {
  FaRocket,
  FaChartLine,
  FaMap,
  FaDatabase,
  FaBrain,
  FaWifi,
  FaExclamationTriangle,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
const API_URL = "http://localhost:3001/api/data";
const cansatStates = {
  calibrate: { label: "Calibrating", color: "bg-yellow-500" },
  command: { label: "Command Mode", color: "bg-blue-500" },
  launch: { label: "Ready to Launch", color: "bg-green-500" },
  freefall: { label: "Free Fall", color: "bg-red-500" },
  descent: { label: "Descent", color: "bg-yellow-500" },
  landed: { label: "Landed", color: "bg-green-500" },
  landing: { label: "Landing", color: "bg-red-500" },
};
export default function MissionSidebar({
  collapsed = false,
  onToggleCollapse = () => {},
}) {
  const [connectionStatus, setConnectionStatus] = useState("online");
  const [cansatState, setCansatState] = useState("calibrate");
  const [lastTimestamp, setLastTimestamp] = useState("00:00:00.000");
  const [missionTime, setMissionTime] = useState("00:00:00");
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data) {
          const stateKey = (data.flightState || "calibrate").toLowerCase();
          setCansatState(stateKey);
          setMissionTime(data.missionTime || "00:00:00");
          setConnectionStatus("online");
          if (data.timestamp) {
            const d = new Date(data.timestamp);
            const time = d.toLocaleTimeString("en-US", { hour12: false });
            const ms = d.getMilliseconds().toString().padStart(3, "0");
            setLastTimestamp(`${time}.${ms}`);
          }
        }
      } catch {
        setConnectionStatus("offline");
        setCansatState("calibrate");
        setLastTimestamp("--:--:--.---");
        setMissionTime("00:00:00");
      }
    };
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => clearInterval(id);
  }, []);
  const ConnectionIcon =
    connectionStatus === "online" ? FaWifi : FaExclamationTriangle;
  const connectionColor =
    connectionStatus === "online" ? "text-green-500" : "text-red-500";
  return (
    <aside
      className={`flex relative flex-col h-full bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="p-4 border-b border-gray-800">
        {!collapsed ? (
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/Logo1.png" //Tessat logo
              className="w-14 h-14 object-contain"
              alt="Tessat"
            />
            <div className="h-12 w-px bg-gray-600" />
            <img
              src="Acadevo_logo.jpg" //Acadevo logo
              className="w-14 h-14 object-contain"
              alt="Acaddevo"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src="/Logo1.png"
              className="w-14 h-14 object-contain"
              alt="Logo"
            />
            <div className="w-12 h-px bg-gray-600" />
            <img
              src="Acadevo_logo.jpg" 
              className="w-14 h-14 object-contain"
              alt="Acadevo"
            />
          </div>
        )}
        {!collapsed && (
          <div className="mt-3 text-sm text-gray-200 grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 items-center">
            <span className="text-gray-400 font-medium">Team:</span>
            <span className="text-white font-semibold">Tessat</span>
            <span className="text-gray-400 font-medium">Institute:</span>
            <span className="text-white">Acadevo Research Labs Pvt.Ltd</span>
            <span className="text-gray-400 font-medium">Mission:</span>
            <span className="text-white">Temp</span>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 overflow-auto">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const active = isActive(item.url);
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={`flex items-center rounded-lg px-2 py-2 transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-red-500/20 text-red-400 border-l-2 border-red-500"
                    : "hover:bg-red-500/6 hover:text-red-400 text-gray-300"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 text-sm">{item.title}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
      <div className="p-3 border-t border-gray-800 space-y-3">
        <div
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <ConnectionIcon className={`h-4 w-4 ${connectionColor}`} />
          {!collapsed && (
            <div className="flex-1 flex justify-between items-center text-sm">
              <span className="text-gray-400">Connection</span>
              <span
                className={`px-2 py-0.5 rounded-full border ${connectionColor} border-current text-xs`}
              >
                {connectionStatus}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <FaClock className="h-4 w-4 text-gray-400" />
          {!collapsed && (
            <div className="flex-1 flex justify-between items-center text-sm">
              <span className="text-gray-400">Mission Time</span>
              <span className="font-mono text-red-500 text-xs">
                {missionTime}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              cansatStates[cansatState]?.color || "bg-gray-400"
            } animate-pulse`}
          />
          {!collapsed && (
            <span className="text-sm text-white font-medium">
              {cansatStates[cansatState]?.label || "Unknown"}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onToggleCollapse}
        className={`absolute top-1/2 -right-3 transform -translate-y-1/2 z-20
    flex items-center justify-center w-6 h-12 rounded-md border border-gray-700
    bg-gray-800 hover:bg-gray-700 text-gray-300 shadow-md`}
      >
        {collapsed ? (
          <FaChevronRight className="h-4 w-4" />
        ) : (
          <FaChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
const navigationItems = [
  { title: "Dashboard", url: "/", icon: FaRocket },
  { title: "Graphs", url: "/graphs", icon: FaChartLine },
  { title: "Map", url: "/map", icon: FaMap },
  { title: "Data", url: "/data", icon: FaDatabase },
];