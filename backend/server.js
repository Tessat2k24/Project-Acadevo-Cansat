const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const DATA_FILE = path.join(__dirname, "data.json");
let simulatedData = [];
let index = 0;
const ackClients = new Set();

// --- Load dataset for simulation ---
if (fs.existsSync(DATA_FILE)) {
  try {
    simulatedData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    console.log(`Loaded ${simulatedData.length} records for simulation`);
  } catch (err) {
    console.error("Failed to parse data.json:", err);
  }
} else {
  console.warn("data.json not found. Simulation will be empty.");
}

// --- API: Send command (for compatibility with frontend) ---
app.post("/api/command", (req, res) => {
  const cmd = req.body.command?.trim().toUpperCase();
  if (!cmd) return res.status(400).send("Missing command");
  res.send("Simulated OK");
});

// --- SSE: ACK stream (for real-time messages if needed) ---
app.get("/api/ack-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  ackClients.add(res);
  req.on("close", () => ackClients.delete(res));
});

// --- API: latest telemetry ---
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

// --- API: all telemetry ---
app.get("/api/all", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (!raw) return res.json([]);
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read data" });
  }
});

// --- Simulation Loop ---
function simulateDataFeed() {
  if (!simulatedData.length) return;

  const record = { ...simulatedData[index] };
  record.timestamp = new Date().toISOString();

  // --- Recalculate battery status ---
  const v = record.voltage || 6.6;
  const percentage =
    v >= 8.5 ? 100 : v <= 6.6 ? 0 : Math.round(((v - 6.6) / (8.5 - 6.6)) * 100);

  record.battery = {
    percentage,
    voltage: v,
    current: 0.5,
    timeLeft:
      percentage > 0
        ? `${Math.floor((4400 * (percentage / 100)) / 0.5 / 60)}m`
        : "0m",
    health: "Excellent",
  };

  // --- Update data.json ---
  let data = [];
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf8").trim();
    if (raw) data = JSON.parse(raw);
  }

  data.push(record);
  if (data.length > 100) data = data.slice(-100);

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

  index = (index + 1) % simulatedData.length;
}

// Run simulation every 2 seconds
setInterval(simulateDataFeed, 1000);

app.listen(PORT, () => {
  console.log(`Simulation backend running on http://localhost:${PORT}`);
});
