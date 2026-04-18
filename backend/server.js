const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();

// --- HARDWARE ENABLED ---
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

app.use(cors());
app.use(express.json());

const PORT = 3001;
const DATA_FILE = path.join(__dirname, "data.json");
const CSV_FILE = path.join(__dirname, "flight_log.csv"); 
const ackClients = new Set();

// --- API: Send command via LoRa ---
app.post("/api/command", (req, res) => {
  const cmd = req.body.command?.trim().toUpperCase();
  if (!cmd) return res.status(400).send("Missing command");
  
  serialPort.write(cmd + "\n", (err) => {
    if (err) {
      console.error("LoRa write error:", err);
      return res.status(500).send("LoRa error");
    }
    console.log(`[LoRa TX] Sent command: ${cmd}`);
    res.send("OK");
  });
});

// --- SSE: ACK stream ---
app.get("/api/ack-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  ackClients.add(res);
  req.on("close", () => ackClients.delete(res));
});

// --- APIs to fetch data ---
app.get("/api/data", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json(null);
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) return res.json(null);
    const data = JSON.parse(raw);
    res.json(data[data.length - 1] || null);
  } catch (err) {
    res.json(null);
  }
});

app.get("/api/predictions", (req, res) => {
  res.json([]);
});

app.get("/api/all", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) return res.json([]);
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// --- CSV LOGGER FUNCTION ---
function logToCSV(dataObj) {
  // Updated headers to remove pitch/roll/yaw/mag and add timeStampMs/optional
  const headers = "Team,Time(ms),Packet,Alt(m),Press(hPa),Temp(C),Voltage(V),Lat,Lon,FlightState,Optional,Timestamp\n";
  
  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, headers);
  }

  const row = `${dataObj.teamId},${dataObj.timeStampMs},${dataObj.packetCount},${dataObj.altitude},${dataObj.pressure},${dataObj.temp},${dataObj.voltage},${dataObj.gnssLat},${dataObj.gnssLon},${dataObj.flightState},${dataObj.optional},${dataObj.timestamp}\n`;
  
  fs.appendFileSync(CSV_FILE, row);
}

// --- Serial Port (LoRa Receiver) ---
const serialPort = new SerialPort({ path: "COM17", baudRate: 115200 });
const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", (line) => {
  const trimmed = line.trim();
  
  if (!trimmed.startsWith("Cansat-025")) return;

  if (trimmed.startsWith("ACK,")) {
    const msg = trimmed.substring(4).trim();
    for (const client of ackClients) {
      client.write(`data: ${msg}\n\n`);
    }
  }

  const parts = trimmed.split(",").map(s => s.trim());
  
  // UPDATED: Now strictly expects your 20 data points
  if (parts.length !== 20) return; 

  const dataObj = {
    teamId: parts[0],
    timeStampMs: parseInt(parts[1]) || 0, // Updated name
    packetCount: parseInt(parts[2]) || 0,
    altitude: parseFloat(parts[3]) || 0,
    pressure: parseFloat(parts[4]) || 0,
    temp: parseFloat(parts[5]) || 0,
    voltage: parseFloat(parts[6]) || 0,
    gnssTime: parts[7],
    gnssLat: parseFloat(parts[8]) || 0,
    gnssLon: parseFloat(parts[9]) || 0,
    gnssAlt: parseFloat(parts[10]) || 0,
    gnssSats: parseInt(parts[11]) || 0,
    accelX: parseFloat(parts[12]) || 0,
    accelY: parseFloat(parts[13]) || 0,
    accelZ: parseFloat(parts[14]) || 0,
    gyroX: parseFloat(parts[15]) || 0,
    gyroY: parseFloat(parts[16]) || 0,
    gyroZ: parseFloat(parts[17]) || 0,
    flightState: [
      "calibrate", "command", "launch", "freefall", "descent", "landed",
    ][parseInt(parts[18]) || 0], // Moved to index 18
    optional: parts[19] || "",   // Added optional field
    timestamp: new Date().toISOString(),
  };

  // Battery & mission time logic
  const v = dataObj.voltage;
  const percentage = v >= 8.5 ? 100 : v <= 6.6 ? 0 : Math.round(((v - 6.6) / (8.5 - 6.6)) * 100);

  dataObj.battery = {
    percentage,
    voltage: v,
    current: 0.5,
    timeLeft: percentage > 0 ? `${Math.floor((4400 * (percentage / 100)) / 0.5 / 60)}m` : "0m",
    health: percentage > 80 ? "Excellent" : percentage > 50 ? "Excellent" : percentage > 20 ? "Excellent" : "Excellent",
  };

  // 1. Save to CSV log
  logToCSV(dataObj);

  // 2. Save to JSON for the frontend
  let data = [];
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.error("Error reading JSON:", e);
    }
  }
  
  data.push(dataObj);
  if (data.length > 100) data = data.slice(-100);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
});

app.listen(PORT, () => {
  console.log(`Backend on http://localhost:${PORT} (HARDWARE MODE: LoRa on COM17)`);
});