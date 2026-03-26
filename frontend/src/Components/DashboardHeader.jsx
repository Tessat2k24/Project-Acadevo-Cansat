import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaCog } from "react-icons/fa";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";

export function DashboardHeader({
  onToggleSidebar,
  sidebarOpen,
  notifications = 0,
}) {
  const [isFlightMode, setIsFlightMode] = useState(true);
  const [toast, setToast] = useState(null);          // {msg, id}
  const toastId = useRef(0);
  const eventSource = useRef(null);

  // ---------- SSE ----------
  useEffect(() => {
    eventSource.current = new EventSource("http://localhost:3001/api/ack-stream");
    eventSource.current.onmessage = (e) => {
      const msg = e.data.trim();
      if (!msg) return;

      let displayMsg = msg;
      if (msg === "CALIB_DONE") displayMsg = "Calibration Successful";
      if (msg === "CALIB_FAIL") displayMsg = "Calibration Failed: No GNSS";
      if (msg === "MANUAL_PARACHUTE_OPEN") displayMsg = "Parachute Deployed";
      if (msg === "SERVO_CLOSE") displayMsg = "Parachute Closed";
      if (msg === "COMMAND_MODE") displayMsg = "Command Mode Active";
      if (msg === "RECOVERY_COMPLETE") displayMsg = "Recovery: 3 Images Sent + Buzzer Active";

      const id = ++toastId.current;
      setToast({ msg: displayMsg, id });
      setTimeout(() => setToast(t => t?.id === id ? null : t), 4000);
    };
    return () => eventSource.current?.close();
  }, []);

  // ---------- COMMAND ----------
  const sendCommand = async (cmd) => {
    try {
      await fetch("http://localhost:3001/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
    } catch (err) {
      const id = ++toastId.current;
      setToast({ msg: "Command failed", id });
      setTimeout(() => setToast(t => t?.id === id ? null : t), 4000);
    }
  };

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-gray-700 bg-gray-900/80 backdrop-blur-sm px-4 md:px-6 shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
      >
        {sidebarOpen ? <GoSidebarExpand className="h-4 w-4" /> : <GoSidebarCollapse className="h-4 w-4" />}
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => sendCommand("CALIB")}
          className="flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-xs"
        >
          Calibrate
        </button>

        <button
          onClick={() => sendCommand("COMMAND")}
          className="flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-xs"
        >
          Command
        </button>

        {/* NEW: Parachute Controls */}
        <button
          onClick={() => sendCommand("OPENPARA")}
          className="flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-xs font-medium"
        >
          Open Para
        </button>
<button
  onClick={() => sendCommand("SERVO CLOSE")}
  className="flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-xs"
>
  Close Para
</button>

{/* RECOVERY BUTTON */}
<button
  onClick={() => sendCommand("RECOVERY")}
  className="flex items-center justify-center gap-1.5 px-2.5 h-9 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors text-xs font-medium"
>
  Recovery
</button>

        {/* Flight / Sim toggle */}
        {/*<div className="flex items-center bg-gray-800 border border-red-700 rounded-full p-0.5">
          <button
            onClick={() => setIsFlightMode(true)}
            className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${
              isFlightMode ? "bg-red-500 text-white" : "bg-transparent text-gray-300 hover:text-white"
            }`}
          >
            Flight
          </button>
          <button
            onClick={() => setIsFlightMode(false)}
            className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${
              !isFlightMode ? "bg-blue-500 text-white" : "bg-transparent text-gray-300 hover:text-white"
            }`}
          >
            Simulation
          </button>
        </div>

        {/* Notifications */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
          <FaBell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        <button className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
          <FaCog className="h-4 w-4" />
        </button>
      </div>

      {/* ----- TOAST NOTIFICATION ----- */}
      {toast && (
        <div className="absolute top-16 right-4 z-50 animate-fadeIn">
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="font-medium">{toast.msg}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </header>
  );
}