// src/pages/Data.jsx
import React, { useState, useEffect } from "react";
import {
  FaSync,
  FaDownload,
  FaChevronUp,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import MissionSidebar from "../components/MissionSidebar";

const API_URL = "http://localhost:3001/api/data";
const FULL_DATA_URL = "http://localhost:3001/api/all";

const Data = () => {
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  // All telemetry fields you mentioned
  const columns = [
    { key: "teamId", label: "Team ID", type: "text" },
    { key: "timestamp", label: "Time", type: "datetime" },
    { key: "packetCount", label: "Packet", type: "number" },
    { key: "altitude", label: "Altitude", unit: "m", type: "number" },
    { key: "pressure", label: "Pressure", unit: "hPa", type: "number" },
    { key: "temp", label: "Temperature", unit: "°C", type: "number" },
    { key: "voltage", label: "Voltage", unit: "V", type: "number" },
    { key: "gnssTime", label: "GNSS Time", type: "text" },
    { key: "gnssLat", label: "Latitude", type: "number" },
    { key: "gnssLon", label: "Longitude", type: "number" },
    { key: "gnssAlt", label: "GNSS Altitude", unit: "m", type: "number" },
    { key: "gnssSats", label: "Satellites", type: "number" },
    { key: "accelX", label: "Acc X", unit: "m/s²", type: "number" },
    { key: "accelY", label: "Acc Y", unit: "m/s²", type: "number" },
    { key: "accelZ", label: "Acc Z", unit: "m/s²", type: "number" },
    { key: "gyroX", label: "Gyro X", unit: "°/s", type: "number" },
    { key: "gyroY", label: "Gyro Y", unit: "°/s", type: "number" },
    { key: "gyroZ", label: "Gyro Z", unit: "°/s", type: "number" },
    { key: "magX", label: "Mag X", unit: "μT", type: "number" },
    { key: "magY", label: "Mag Y", unit: "μT", type: "number" },
    { key: "magZ", label: "Mag Z", unit: "μT", type: "number" },
    { key: "flightState", label: "State", type: "text" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Server error");
      const latest = await res.json();

      if (!latest) return;

      // Ensure all fields exist even if undefined
      const newRow = {};
      columns.forEach((col) => {
        newRow[col.key] = latest[col.key] ?? "";
      });

      setData((prev) => [...prev.slice(-99), newRow]);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Backend offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 2000);
    return () => clearInterval(id);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal = a[sortField] || 0;
    let bVal = b[sortField] || 0;
    if (sortField === "timestamp") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formatValue = (value, col) => {
    if (col.type === "datetime") {
      const d = new Date(value);
      if (isNaN(d.getTime())) return "—";
      return `${d.toLocaleTimeString("en-US", { hour12: false })}.${d
        .getMilliseconds()
        .toString()
        .padStart(3, "0")}`;
    }
    return typeof value === "number" ? value.toFixed(2) : value || "—";
  };

  const getValueStatus = (value, col) => {
    if (col.key === "temp") {
      if (value > 60) return { color: "#ff4444" };
      if (value < -10) return { color: "#ffaa44" };
      return { color: "#44ff44" };
    }
    if (col.key === "voltage") {
      if (value < 3.3) return { color: "#ff4444" };
      if (value < 3.6) return { color: "#ffaa44" };
      return { color: "#44ff44" };
    }
    return { color: "#ccc" };
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(FULL_DATA_URL);
      if (!res.ok) throw new Error("Failed to fetch full data");
      const allData = await res.json();
      if (!Array.isArray(allData) || allData.length === 0) {
        alert("No telemetry data found.");
        return;
      }

      const headers = columns.map((c) => `"${c.label}"`).join(",");
      const rows = allData
        .map((row) =>
          columns
            .map((col) => {
              const val = row[col.key];
              if (col.type === "datetime")
                return `"${new Date(val).toISOString()}"`;
              return typeof val === "number" ? val.toFixed(3) : `"${val ?? ""}"`;
            })
            .join(",")
        )
        .join("\n");

      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cansat-025.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("Failed to export telemetry data.");
    }
  };

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
    <div className="flex h-screen bg-gray-950 text-white">
      <MissionSidebar
        collapsed={!sidebarOpen}
        onToggleCollapse={toggleSidebar}
        connectionStatus="online"
        timeSinceLaunch="00:12:45"
        cansatState="launch"
      />

      <div className="flex-1 flex flex-col p-4 overflow-auto">
        <div className="flex items-center justify-between mb-4 bg-gray-900 rounded-lg p-4 shadow-md border border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">
              Real-time Telemetry
            </h3>
            <span className="text-gray-400">({data.length} records)</span>
            {loading && (
              <span className="text-blue-400 text-sm">Updating...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1 px-3 py-1 bg-gray-800 border border-blue-500 rounded hover:bg-gray-700"
            >
              <FaSync /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-3 py-1 bg-gray-800 border border-red-500 rounded hover:bg-gray-700"
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-2">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-gray-800 border border-red-500 text-white rounded px-2 py-1"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-md border border-gray-700 flex flex-col overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1200px]">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="p-2 text-left cursor-pointer whitespace-nowrap"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.unit && (
                        <span className="text-gray-400 text-xs">
                          ({col.unit})
                        </span>
                      )}
                      {sortField === col.key &&
                        (sortDirection === "asc" ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-700">
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 whitespace-nowrap">
                      <span style={getValueStatus(row[col.key], col)}>
                        {formatValue(row[col.key], col)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-between items-center p-2 bg-gray-800 border-t border-gray-700">
              <div className="text-gray-400 text-sm">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, data.length)} of{" "}
                {data.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-red-500 rounded disabled:opacity-50"
                >
                  <FaChevronLeft />
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-red-500 rounded disabled:opacity-50"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Data;
