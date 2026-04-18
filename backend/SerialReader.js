// Updated serialReader.js (Scrubbed Version)
const { SerialPort, ReadlineParser } = require("serialport");

class SerialReader {
  constructor(dataGenerator, opts = {}) {
    this.dg = dataGenerator;
    this.portPath = opts.portPath || "COM18";
    this.baudRate = opts.baudRate || 9600;
    this.maxHist = opts.historicalMax || 100;
    this.port = null;
    this.parser = null;
    this.start();
  }

  start() {
    try {
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
      });
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

      this.port.on("open", () =>
        console.log(`Serial open ${this.portPath}@${this.baudRate}`)
      );
      this.port.on("error", (e) => console.error("Serial error:", e.message));
      this.parser.on("data", (line) => this.handle(line.trim()));
    } catch (e) {
      console.error("SerialReader init failed:", e);
    }
  }

  handle(raw) {
    if (!raw) return;

    const csv = raw.includes("TEAM")
      ? raw.split("TEAM").splice(1).join("TEAM")
      : raw;
    if (!csv.startsWith("TEAM")) return;

    const p = csv.split(",").map((s) => s.trim());
    if (p.length < 20) return;

    const [
      teamId,
      timeStampMs,
      packetCount,
      altitude,
      pressure,
      temp,
      voltage,
      gnssTime,
      gnssLat,
      gnssLon,
      gnssAlt,
      gnssSats,
      accelX,
      accelY,
      accelZ,
      gyroX,
      gyroY,
      gyroZ,
      flightState,
      optional,
    ] = p;

    const now = new Date().toISOString();

    const data = this.dg.loadData?.() ?? this.dg.getData();

    const oldSensors = data.sensors || {};

    const sensors = {
      temperature: {
        value: +temp || 0,
        change: (+temp || 0) - (oldSensors.temperature?.value || 0),
        unit: "°C",
        status: "good",
      },
      pressure: {
        value: +pressure || 0,
        change: (+pressure || 0) - (oldSensors.pressure?.value || 0),
        unit: "hPa",
        status: "good",
      },
      altitude: {
        value: +altitude || 0,
        change: (+altitude || 0) - (oldSensors.altitude?.value || 0),
        unit: "m",
        status: "good",
      },
      gyro: {
        x: +gyroX || 0,
        y: +gyroY || 0,
        z: +gyroZ || 0,
        unit: "°/s",
        status: "good",
      },
    };

    const batPerc = Math.min(100, Math.max(0, (+voltage - 3.3) * 125));
    const battery = {
      percentage: batPerc,
      voltage: +voltage || 0,
      timeLeft: data.battery?.timeLeft ?? "N/A",
      current: data.battery?.current ?? 0,
      status: "good",
    };

    const gps = {
      cansatLocation: { lat: +gnssLat || 0, lng: +gnssLon || 0 },
      currentLocation: { lat: +gnssLat || 0, lng: +gnssLon || 0 },
      distance: data.gps?.distance || 0,
      status: "good",
    };

    const mission = {
      connectionStatus: "online",
      cansatState: flightState || data.mission?.cansatState || "UNKNOWN",
      launchTime: data.mission?.launchTime ?? "N/A",
      notifications: data.mission?.notifications ?? 0,
      status: "active",
    };

    data.historicalData = data.historicalData || [];
    data.historicalData.unshift({
      timestamp: now,
      altitude: sensors.altitude.value,
      temperature: sensors.temperature.value,
      pressure: sensors.pressure.value,
      batteryVoltage: battery.voltage,
      gyro: { x: sensors.gyro.x, y: sensors.gyro.y, z: sensors.gyro.z },
    });
    if (data.historicalData.length > this.maxHist) data.historicalData.pop();

    Object.assign(data, {
      timestamp: now,
      sensors,
      battery,
      gps,
      groundStation: data.groundStation ?? {
        temperature: 0,
        humidity: 0,
        pressure: 0,
        status: "unknown",
      },
      mission,
    });

    if (typeof this.dg.saveData === "function") this.dg.saveData(data);
    console.log(
      `Telemetry OK | ${flightState} | alt=${sensors.altitude.value}m`
    );
  }
}

module.exports = SerialReader;