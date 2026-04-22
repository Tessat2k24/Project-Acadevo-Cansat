// Updated serialReader.js (Scrubbed Version)
const { SerialPort, ReadlineParser } = require("serialport");

class SerialReader {
  constructor(dataGenerator, opts = {}) {
    this.dg = dataGenerator;
    this.portPath = opts.portPath || "COM18";
    this.baudRate = opts.baudRate ||  115200;
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

    // 1. Look for your actual CanSat ID instead of "TEAM"
    const teamString = "Cansat-025";
    const teamIndex = raw.indexOf(teamString);
    if (teamIndex === -1) return; // Drop lines that don't contain telemetry

    // Clean off any garbage characters before "Cansat-025"
    const csv = raw.substring(teamIndex);

    // 2. Split into array
    const p = csv.split(",").map((s) => s.trim());
    if (p.length < 19) return; // Accept 19 or more parameters

    // 3. Map the data variables
    const [
      teamId, timeStampMs, packetCount, altitude, pressure, temp, voltage,
      gnssTime, gnssLat, gnssLon, gnssAlt, gnssSats, accelX, accelY, accelZ,
      gyroX, gyroY, gyroZ, flightState, rssi
    ] = p;

    const now = new Date().toISOString();
    const data = this.dg.loadData?.() ?? this.dg.getData();
    const oldSensors = data.sensors || {};

    const sensors = {
      temperature: { value: +temp || 0, change: (+temp || 0) - (oldSensors.temperature?.value || 0), unit: "°C", status: "good" },
      pressure: { value: +pressure || 0, change: (+pressure || 0) - (oldSensors.pressure?.value || 0), unit: "hPa", status: "good" },
      altitude: { value: +altitude || 0, change: (+altitude || 0) - (oldSensors.altitude?.value || 0), unit: "m", status: "good" },
      gyro: { x: +gyroX || 0, y: +gyroY || 0, z: +gyroZ || 0, unit: "°/s", status: "good" },
    };

    const batPerc = Math.min(100, Math.max(0, (+voltage - 3.3) * 125));
    const battery = { percentage: batPerc, voltage: +voltage || 0, timeLeft: data.battery?.timeLeft ?? "N/A", current: data.battery?.current ?? 0, status: "good" };

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
      signalStrength: rssi ? +rssi : 0 // Fallback to 0 if RSSI isn't appended yet
    };

    data.historicalData = data.historicalData || [];
    data.historicalData.unshift({
      timestamp: now, altitude: sensors.altitude.value, temperature: sensors.temperature.value,
      pressure: sensors.pressure.value, batteryVoltage: battery.voltage,
      gyro: { x: sensors.gyro.x, y: sensors.gyro.y, z: sensors.gyro.z },
    });
    if (data.historicalData.length > this.maxHist) data.historicalData.pop();

    Object.assign(data, {
      timestamp: now, sensors, battery, gps, mission,
      groundStation: data.groundStation ?? { temperature: 0, humidity: 0, pressure: 0, status: "unknown" }
    });

    if (typeof this.dg.saveData === "function") this.dg.saveData(data);
    
    console.log(`Telemetry OK | State: ${flightState} | Alt: ${sensors.altitude.value}m | PKT: ${packetCount}`);
  }
}

module.exports = SerialReader;

//---EXPLANATION---
// Updated serialReader.js (Annotated for Handover)

// ---------------------------------------------------------
// IMPORTS
// We import the necessary modules from the "serialport" library.
// SerialPort handles the physical USB connection, and ReadlineParser
// ensures we read the incoming LoRa data line-by-line.
// ---------------------------------------------------------
const { SerialPort, ReadlineParser } = require("serialport");

class SerialReader {
  // ---------------------------------------------------------
  // CONSTRUCTOR (The Setup Phase)
  // This runs the moment the backend starts. It locks in the USB port,
  // the communication speed (baud rate), and prepares the variables
  // needed to store the connection. Finally, it calls start() to ignite it.
  // ---------------------------------------------------------
  constructor(dataGenerator, opts = {}) {
    this.dg = dataGenerator; // The manager that will save our data (JSON/CSV)
    this.portPath = opts.portPath || "COM18"; // The physical USB port
    this.baudRate = opts.baudRate || 115200; // The speed of communication
    this.maxHist = opts.historicalMax || 100; // Limits chart memory to 100 points
    this.port = null;
    this.parser = null;
    this.start();
  }

  // ---------------------------------------------------------
  // START METHOD (The Hardware Connection)
  // This physically opens the connection to the LoRa receiver and sets
  // up the "listeners". Every time a new line of telemetry arrives over
  // the radio, it catches it and sends it to the handle() function.
  // ---------------------------------------------------------
  start() {
    try {
      // 1. Open the COM port
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
      });

      // 2. Pipe the raw data through a parser that splits it at every new line
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

      // 3. System logs for debugging
      this.port.on("open", () =>
        console.log(`Serial open ${this.portPath}@${this.baudRate}`)
      );
      this.port.on("error", (e) => console.error("Serial error:", e.message));

      // 4. The main trigger: when data arrives, clean the whitespace and process it
      this.parser.on("data", (line) => this.handle(line.trim()));
    } catch (e) {
      console.error("SerialReader init failed:", e);
    }
  }

  // ---------------------------------------------------------
  // HANDLE METHOD (The Data Processor)
  // This is the core engine. It takes the raw, comma-separated string
  // from the CanSat, validates it, splits it apart, and formats it
  // perfectly for the React dashboard.
  // ---------------------------------------------------------
  handle(raw) {
    if (!raw) return;

    // --- STEP 1: VALIDATION & NOISE REDUCTION ---
    // Radio signals can pick up static/garbage characters. This looks
    // for our specific CanSat ID and cuts off anything that came before it.
    const teamString = "Cansat-025";
    const teamIndex = raw.indexOf(teamString);
    if (teamIndex === -1) return; // Ignore strings from other teams or pure static

    const csv = raw.substring(teamIndex);

    // --- STEP 2: SPLITTING THE STRING ---
    // Turn the single string into an array of individual values.
    // Ensure we actually received a full packet (at least 19 parameters).
    const p = csv.split(",").map((s) => s.trim());
    if (p.length < 19) return; 

    // --- STEP 3: MAPPING THE VARIABLES ---
    // Extract the array elements into neatly named variables.
    const [
      teamId, timeStampMs, packetCount, altitude, pressure, temp, voltage,
      gnssTime, gnssLat, gnssLon, gnssAlt, gnssSats, accelX, accelY, accelZ,
      gyroX, gyroY, gyroZ, flightState, rssi
    ] = p;

    // --- STEP 4: FETCH PREVIOUS STATE ---
    // Get the last known data so we can calculate how things are changing
    // (e.g., is the temperature rising or falling?).
    const now = new Date().toISOString();
    const data = this.dg.loadData?.() ?? this.dg.getData();
    const oldSensors = data.sensors || {};

    // --- STEP 5: BUILD THE SENSOR OBJECT ---
    // Format the raw numbers into structured objects with units and status.
    const sensors = {
      temperature: { value: +temp || 0, change: (+temp || 0) - (oldSensors.temperature?.value || 0), unit: "°C", status: "good" },
      pressure: { value: +pressure || 0, change: (+pressure || 0) - (oldSensors.pressure?.value || 0), unit: "hPa", status: "good" },
      altitude: { value: +altitude || 0, change: (+altitude || 0) - (oldSensors.altitude?.value || 0), unit: "m", status: "good" },
      gyro: { x: +gyroX || 0, y: +gyroY || 0, z: +gyroZ || 0, unit: "°/s", status: "good" },
    };

    // --- STEP 6: CALCULATE BATTERY & GPS ---
    // Convert raw voltage into a 0-100% reading for the UI.
    const batPerc = Math.min(100, Math.max(0, (+voltage - 3.3) * 125));
    const battery = { percentage: batPerc, voltage: +voltage || 0, timeLeft: data.battery?.timeLeft ?? "N/A", current: data.battery?.current ?? 0, status: "good" };

    const gps = {
      cansatLocation: { lat: +gnssLat || 0, lng: +gnssLon || 0 },
      currentLocation: { lat: +gnssLat || 0, lng: +gnssLon || 0 },
      distance: data.gps?.distance || 0,
      status: "good",
    };

    // --- STEP 7: MISSION STATUS ---
    // Track the active flight state (e.g., ASCENT, DESCENT) and signal strength.
    const mission = {
      connectionStatus: "online",
      cansatState: flightState || data.mission?.cansatState || "UNKNOWN",
      launchTime: data.mission?.launchTime ?? "N/A",
      notifications: data.mission?.notifications ?? 0,
      status: "active",
      signalStrength: rssi ? +rssi : 0 // Fallback to 0 if RSSI isn't appended yet
    };

    // --- STEP 8: UPDATE HISTORICAL CHART DATA ---
    // Push the newest reading to the front of the historical array.
    // If the array exceeds our max limit (100), pop the oldest one off the back.
    data.historicalData = data.historicalData || [];
    data.historicalData.unshift({
      timestamp: now, altitude: sensors.altitude.value, temperature: sensors.temperature.value,
      pressure: sensors.pressure.value, batteryVoltage: battery.voltage,
      gyro: { x: sensors.gyro.x, y: sensors.gyro.y, z: sensors.gyro.z },
    });
    if (data.historicalData.length > this.maxHist) data.historicalData.pop();

    // --- STEP 9: MERGE AND SAVE ---
    // Combine all the newly formatted objects back into the main data structure.
    Object.assign(data, {
      timestamp: now, sensors, battery, gps, mission,
      groundStation: data.groundStation ?? { temperature: 0, humidity: 0, pressure: 0, status: "unknown" }
    });

    // Pass the finalized object to the data manager to write to JSON and CSV.
    if (typeof this.dg.saveData === "function") this.dg.saveData(data);
    
    // Print a quick confirmation to the terminal so we know it worked.
    console.log(`Telemetry OK | State: ${flightState} | Alt: ${sensors.altitude.value}m | PKT: ${packetCount}`);
  }
}

module.exports = SerialReader;