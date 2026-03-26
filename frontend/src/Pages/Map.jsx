import React, { useState, useEffect, Suspense } from "react";
import {
  MapPin,
  Target,
  Loader,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import MissionSidebar from "../components/MissionSidebar.jsx";
import { useMap } from "react-leaflet";

const API_URL = "http://localhost:3001/api/data";

const createCustomIcons = (L) => {
  const cansatIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const currentLocationIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return { cansatIcon, currentLocationIcon };
};

const ResizeHandler = ({ dependency }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 300);
  }, [dependency, map]);
  return null;
};

const MapDisplay = ({ cansatLocation, currentLocation, sidebarOpen }) => {
  const [mapComponents, setMapComponents] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [_, L, reactLeaflet] = await Promise.all([
          import("leaflet/dist/leaflet.css"),
          import("leaflet"),
          import("react-leaflet"),
        ]);

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const icons = createCustomIcons(L);
        setMapComponents({ ...reactLeaflet, icons });
        setMapError(null);
      } catch (err) {
        console.error("Map load error:", err);
        setMapError("Map failed to load. Try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError || !mapComponents) {
    return (
      <div className="h-[500px] w-full bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, icons } = mapComponents;

  return (
    <div className="h-[500px] w-full relative">
      <MapContainer
        center={[
          cansatLocation?.lat || 40.7128,
          cansatLocation?.lng || -74.006,
        ]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full rounded-lg"
      >
        <ResizeHandler dependency={sidebarOpen} />
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cansatLocation?.lat && cansatLocation?.lng && (
          <Marker
            position={[cansatLocation.lat, cansatLocation.lng]}
            icon={icons.cansatIcon}
          >
            <Popup>
              <h3 className="font-semibold text-red-600">CanSat</h3>
              <p className="text-xs">
                Lat: {cansatLocation.lat.toFixed(6)}
                <br />
                Lng: {cansatLocation.lng.toFixed(6)}
              </p>
            </Popup>
          </Marker>
        )}
        {currentLocation?.lat && currentLocation?.lng && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={icons.currentLocationIcon}
          >
            <Popup>
              <h3 className="font-semibold text-blue-600">Ground Station</h3>
              <p className="text-xs">
                Lat: {currentLocation.lat.toFixed(6)}
                <br />
                Lng: {currentLocation.lng.toFixed(6)}
              </p>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md z-[9999]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>
    </div>
  );
};

const Map = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cansatLocation, setCansatLocation] = useState({
    lat: 40.7128,
    lng: -74.006,
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  // Get laptop's real GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported by this browser");
      return;
    }

    const updatePosition = (pos) => {
      const { latitude, longitude } = pos.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
    };

    const handleError = (err) => {
      console.error("Geolocation error:", err);
    };

    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
    });

    const watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 5000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch Cansat coordinates from backend
  // Fetch Cansat coordinates from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      const lat = parseFloat(data.gnssLat) || 0;
      const lng = parseFloat(data.gnssLon) || 0;

      if (lat && lng) setCansatLocation({ lat, lng });
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Backend offline or invalid data");
    } finally {
      setLoading(false); // Back to the safe, simple version!
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => clearInterval(id);
  }, []);

  // Calculate distance between CanSat and Ground Station
  const distance = (() => {
    if (!currentLocation) return "N/A";
    const R = 6371;
    const dLat = ((currentLocation.lat - cansatLocation.lat) * Math.PI) / 180;
    const dLng = ((currentLocation.lng - cansatLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((cansatLocation.lat * Math.PI) / 180) *
        Math.cos((currentLocation.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  })();

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

  const images = [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDG90clb4aDjusUpEsPNDROZSEZwhvNPL0054fVr_6oP1jw0-Ko9ezwb7FDXYYzNG8-jE&usqp=CAU",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFKSOyPTRsXXSpGtRoisk_YTMztRf5f4fyKQ&s",
    "https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2010/01/a_cansat_descending/9775136-3-eng-GB/A_CanSat_descending_pillars.jpg",
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5GsLIElbJ7flOKQyeetrY0lVX9pyk39uqNAWY75i5yrN5g0whvw-VxdgbicudQweOitM&usqp=CAU",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <MissionSidebar
        collapsed={!sidebarOpen}
        onToggleCollapse={toggleSidebar}
        connectionStatus="online"
        timeSinceLaunch="00:12:45"
        cansatState="launch"
      />

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              GPS Location Tracking Map
            </h1>
            <p className="text-gray-400 text-sm hover:text-gray-300 transition-colors">CanSat position</p>
            <span className="text-blue-400 text-sm animate-pulse">
              Updating live...
            </span>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-xs text-gray-400">Distance: {distance} km</div>
            <div className="text-xs text-gray-400">
              Last: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
            <Suspense
              fallback={
                <div className="h-[500px] flex items-center justify-center">
                  <Loader className="animate-spin" />
                </div>
              }
            >
              <MapDisplay
                cansatLocation={cansatLocation}
                currentLocation={currentLocation}
                sidebarOpen={sidebarOpen}
              />
            </Suspense>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CanSat position */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-red-800 rounded">
                  <MapPin className="w-4 h-4 text-red-200" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  CanSat Position
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 rounded-lg p-2">
                  <label className="text-xs text-gray-400">Lat</label>
                  <p className="text-base font-mono text-white">
                    {cansatLocation.lat.toFixed(6)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <label className="text-xs text-gray-400">Lng</label>
                  <p className="text-base font-mono text-white">
                    {cansatLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              <div className="mt-2 p-2 bg-red-900 rounded-lg text-sm text-red-200">
                Status: Live tracking
              </div>
            </div>

            {/* Ground Station */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-800 rounded">
                  <Target className="w-4 h-4 text-blue-200" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Ground Station
                </h2>
              </div>
              {currentLocation ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <label className="text-xs text-gray-400">Lat</label>
                    <p className="text-base font-mono text-white">
                      {currentLocation.lat.toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <label className="text-xs text-gray-400">Lng</label>
                    <p className="text-base font-mono text-white">
                      {currentLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Waiting for location permission...
                </p>
              )}
              <div className="mt-2 p-2 bg-blue-900 rounded-lg flex justify-between text-sm text-blue-200">
                <span>Status: {currentLocation ? "Active" : "Pending"}</span>
                <span>{distance} km away</span>
              </div>
            </div>
          </div>

          {/* Gallery */}
          {/* <div className="max-w-7xl mx-auto mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              CanSat Touchdown Gallery
            </h2>
            <div className="relative w-full max-w-5xl mx-auto">
              <div className="overflow-hidden rounded-xl border border-gray-700 shadow-md">
                <img
                  src={images[currentIndex]}
                  alt="Touchdown"
                  className="w-full h-[300px] object-contain"
                />
              </div>
              <button
                onClick={() =>
                  setCurrentIndex((i) => (i - 1 + images.length) % images.length)
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/70 p-3 rounded-full hover:bg-gray-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/70 p-3 rounded-full hover:bg-gray-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="flex justify-center gap-2 mt-3">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full ${
                      currentIndex === i ? "bg-blue-600 w-4" : "bg-gray-500"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
};

export default Map;
