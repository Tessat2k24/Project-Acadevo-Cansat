// backend/server.js (Run with: node server.js)
const express = require("express");
const fs = require("fs");
const path = require("path");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const cors = require("cors");

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());

// Initialize data file
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Serve data.json
app.get("/api/data", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read data" });
  }
});

// Start serial reading
const port = new SerialPort({ path: "COM18", baudRate:  115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", (line) => {
  console.log("Received:", line);
  if (!line.trim().startsWith("TEAM")) return;

  const parts = line.split(",").map((s) => s.trim());
  if (parts.length < 20) return;

  const dataObj = {
    teamId: parts[0],
    timeStampMs: parts[1],
    packetCount: parts[2],
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
    flightState: parts[18],
    optional: parts[19],
    timestamp: new Date().toISOString(),
  };

  try {
    let data = [];
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
    data.push(dataObj);
    // Keep last 100 entries
    if (data.length > 100) data = data.slice(-100);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Write error:", err);
  }
});

port.on("error", (err) => {
  console.error("Serial port error:", err.message);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(
    "Serial data will be saved to data.json and served via /api/data"
  );
});
