// src/components/CansatVisualization.jsx
import React, { useRef, Suspense, useState, useEffect } from "react";
import { Satellite, Wifi, AlertTriangle, RefreshCw } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
function Model({ gyroData, scale = 0.5 }) {
  const { scene } = useGLTF("/Cansat.glb");
  const modelRef = useRef();
  useEffect(() => {
    if (modelRef.current && scene) {
      modelRef.current.add(scene);
      scene.scale.set(scale, scale, scale);
    }
  }, [scene, scale]);
  useFrame(() => {
    if (!modelRef.current || !gyroData) return;
    const roll = parseFloat(gyroData.x) || 0; // X-axis
    const pitch = parseFloat(gyroData.y) || 0; // Y-axis
    const yaw = parseFloat(gyroData.z) || 0; // Z-axis
    modelRef.current.rotation.x = roll * (Math.PI / 180);
    modelRef.current.rotation.y = yaw * (Math.PI / 180);
    modelRef.current.rotation.z = pitch * (Math.PI / 180);
  });
  return <group ref={modelRef} />;
}
function CansatVisualization({ gyroData = { x: 0, y: 0, z: 0 }, cansatState }) {
  const [controlsEnabled] = useState(true);
  const controlsRef = useRef();
  const resetCamera = () => {
    controlsRef.current?.reset();
  };
  const getStateColor = (state) => {
    const colors = {
      calibrate: "text-yellow-400",
      command: "text-blue-400",
      launch: "text-green-400",
      freefall: "text-red-400",
      descent: "text-yellow-600",
      landed: "text-green-600",
    };
    return colors[state] || "text-gray-400";
  };
  const getStateMessage = (state) => {
    const msgs = {
      calibrate: "System Calibrating...",
      command: "Awaiting Commands",
      launch: "Ready for Launch",
      freefall: "In Free Fall",
      descent: "Descending",
      landed: "Mission Complete",
    };
    return msgs[state] || "Status Unknown";
  };
  const getStateIcon = (state) => {
    if (state === "calibrate") return AlertTriangle;
    if (state === "command") return Wifi;
    return Satellite;
  };
  const StateIcon = getStateIcon(cansatState);
  const formatGyro = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0.0" : num.toFixed(1);
  };
  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">CANSAT Status</h3>
          <p className="text-sm text-gray-400">Live orientation & state</p>
        </div>
        <button
          onClick={resetCamera}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
          title="Reset Camera"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full h-80 mb-6 rounded-lg overflow-hidden border border-gray-600/30">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} />
          <Suspense fallback={null}>
            <Model gyroData={gyroData} scale={0.5} />
          </Suspense>
          <OrbitControls ref={controlsRef} enabled={controlsEnabled} />
          <Environment preset="city" />
        </Canvas>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
          <div className="text-xs text-red-400 mb-1">Roll (X)</div>
          <div className="text-lg font-bold text-white">
            {formatGyro(gyroData.x)}°
          </div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
          <div className="text-xs text-green-400 mb-1">Pitch (Y)</div>
          <div className="text-lg font-bold text-white">
            {formatGyro(gyroData.y)}°
          </div>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
          <div className="text-xs text-blue-400 mb-1">Yaw (Z)</div>
          <div className="text-lg font-bold text-white">
            {formatGyro(gyroData.z)}°
          </div>
        </div>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
        <div className="flex items-center gap-3">
          <StateIcon className={`w-5 h-5 ${getStateColor(cansatState)}`} />
          <div>
            <div
              className={`text-sm font-semibold capitalize ${getStateColor(
                cansatState
              )}`}
            >
              {cansatState}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {getStateMessage(cansatState)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CansatVisualization;