import React from "react";
import { Radio, Thermometer, Droplets, Gauge, MapPin } from "lucide-react";

export default function GroundStation  ({ groundStationData }){
  const dataItems = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: groundStationData.temperature,
      unit: "°C",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      maxValue: 50,
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: groundStationData.humidity,
      unit: "%",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      maxValue: 100,
    },
    {
      icon: Gauge,
      label: "Pressure",
      value: groundStationData.pressure,
      unit: "hPa",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      maxValue: 1100,
    },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Ground Station</h3>
            <p className="text-sm text-gray-400">Environmental monitoring</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{groundStationData.location || "Launch Site"}</span>
          </div>
          <div className="text-xs text-gray-500">{groundStationData.coordinates || ""}</div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dataItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`${item.bgColor} border border-gray-700/30 rounded-lg p-4 transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {item.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{item.value}</span>
                <span className="text-sm text-gray-400">{item.unit}</span>
              </div>

              
            </div>
          );
        })}
      </div>

      {/* Connection Quality */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Data Link Quality</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-2 ${
                      bar <= 4 ? "bg-green-400" : "bg-gray-600"
                    } rounded-full transition-all duration-200`}
                    style={{ height: `${8 + bar * 2}px` }}
                  />
                ))}
              </div>
              <span className="text-green-400 text-sm font-medium">
                Excellent (96%)
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm text-gray-400">Uplink Rate</span>
            <div className="text-green-400 text-sm font-medium mt-1">2.4 Mbps</div>
          </div>
        </div>
      </div>
    </div>
  );
};

