// dataGenerator.js
const fs = require("fs");
const path = require("path");
const MLPredictor = require("./mlPredictor");

class DataGenerator {
  constructor() {
    this.dataFile = path.join(__dirname, "data.json");
    this.mlPredictor = new MLPredictor();
    this.initializeData();
  }

  initializeData() {
    if (!fs.existsSync(this.dataFile)) {
      const initialData = this.generateInitialData();
      this.saveData(initialData);
    }
  }

  generateInitialData() {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      sensors: {
        temperature: {
          value: 25.3,
          change: 0.5,
          unit: "°C",
          status: "good",
        },
        humidity: {
          value: 65.2,
          change: -2.1,
          unit: "%",
          status: "good",
        },
        pressure: {
          value: 1013.25,
          change: 1.2,
          unit: "hPa",
          status: "good",
        },
        altitude: {
          value: 120.5,
          change: 0.8,
          unit: "m",
          status: "good",
        },
        gyro: {
          x: 0.1,
          y: -7,
          z: 0.5,
          unit: "°/s",
          status: "good",
        },
        speed: {
          value: 10.2,
          change: 0.3,
          unit: "m/s",
          status: "good",
        },
      },
      battery: {
        percentage: 87,
        voltage: 12.4,
        timeLeft: "2h 15m",
        current: 1.2,
        status: "good",
      },
      gps: {
        cansatLocation: {
          lat: 40.7128,
          lng: -74.006,
        },
        currentLocation: {
          lat: 40.7589,
          lng: -73.9851,
        },
        distance: 0,
        status: "good",
      },
      groundStation: {
        temperature: 22.1,
        humidity: 58.3,
        pressure: 1015.2,
        status: "good",
      },
      mission: {
        connectionStatus: "online",
        cansatState: "calibrate",
        launchTime: "00:00:00",
        notifications: 3,
        status: "active",
      },
      historicalData: this.generateHistoricalData(),
      predictions: this.generatePredictions(),
    };
  }

  generateHistoricalData() {
    const historicalData = [];
    const now = new Date();

    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - i * 5000); // 5-sec intervals
      historicalData.push({
        timestamp: timestamp.toISOString(),
        altitude: Math.random() * 1000 + 100,
        temperature: Math.random() * 40 - 10,
        humidity: Math.random() * 100,
        pressure: Math.random() * 200 + 900,
        batteryVoltage: Math.random() * 2 + 3,
        gyro: {
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 2 - 1,
        },
        speed: Math.random() * 20 + 5,
      });
    }
    return historicalData.reverse();
  }

  generatePredictions() {
    const predictions = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
      const timestamp = now - (49 - i) * 1000;
      const baseTemp = 24.5;
      const baseHumid = 65;
      const basePressure = 1013;
      const baseVoltage = 12.2;

      predictions.push({
        timestamp: timestamp,
        temperature: {
          predicted: baseTemp + Math.random() * 2 - 1,
          cansat: baseTemp + Math.random() * 2 - 1,
          ground: baseTemp + Math.random() * 2 - 1,
        },
        humidity: {
          predicted: baseHumid + Math.random() * 8 - 4,
          cansat: baseHumid + Math.random() * 8 - 4,
          ground: baseHumid + Math.random() * 8 - 4,
        },
        pressure: {
          predicted: basePressure + Math.random() * 5 - 2.5,
          cansat: basePressure + Math.random() * 5 - 2.5,
          ground: basePressure + Math.random() * 5 - 2.5,
        },
        voltage: {
          predicted: baseVoltage + Math.random() * 0.5 - 0.25,
          cansat: baseVoltage + Math.random() * 0.5 - 0.25,
          ground: 12.0 + Math.random() * 0.5,
        },
      });
    }
    return predictions;
  }

  async updateSensorData() {
    const data = this.loadData();

    data.sensors.temperature.value += (Math.random() - 0.5) * 0.5;
    data.sensors.humidity.value += (Math.random() - 0.5) * 0.5;
    data.sensors.pressure.value += (Math.random() - 0.5) * 0.5;
    data.sensors.altitude.value += (Math.random() - 0.5) * 0.5;
    data.sensors.gyro.x += (Math.random() - 0.5) * 0.5;
    data.sensors.gyro.y += (Math.random() - 0.5) * 0.5;
    data.sensors.gyro.z += (Math.random() - 0.5) * 0.5;
    data.sensors.speed.value += (Math.random() - 0.5) * 0.3;

    data.battery.percentage = Math.max(
      0,
      data.battery.percentage - Math.random() * 0.1
    );
    data.battery.voltage = 12.4 - (87 - data.battery.percentage) * 0.01;

    data.gps.currentLocation.lat += (Math.random() - 0.5) * 0.001;
    data.gps.currentLocation.lng += (Math.random() - 0.5) * 0.001;

    data.gps.distance = this.calculateDistance(
      data.gps.cansatLocation.lat,
      data.gps.cansatLocation.lng,
      data.gps.currentLocation.lat,
      data.gps.currentLocation.lng
    );

    data.groundStation.temperature += (Math.random() - 0.5) * 0.2;
    data.groundStation.humidity += (Math.random() - 0.5) * 0.3;
    data.groundStation.pressure += (Math.random() - 0.5) * 0.1;

    const newHistoricalPoint = {
      timestamp: new Date().toISOString(),
      altitude: data.sensors.altitude.value,
      temperature: data.sensors.temperature.value,
      humidity: data.sensors.humidity.value,
      pressure: data.sensors.pressure.value,
      batteryVoltage: data.battery.voltage,
      gyro: { ...data.sensors.gyro },
      speed: data.sensors.speed.value,
    };

    data.historicalData.unshift(newHistoricalPoint);
    if (data.historicalData.length > 100) {
      data.historicalData.pop();
    }

    // Use ML predictor for predictions instead of random values
    try {
      const mlPrediction = await this.mlPredictor.generateMLPredictions(data);
      data.predictions.unshift(mlPrediction);
    } catch (error) {
      console.error("ML Prediction failed, using fallback:", error);
      // Fallback to old method if ML fails
      const fallbackPrediction = {
        timestamp: Date.now(),
        temperature: {
          predicted:
            data.sensors.temperature.value + (Math.random() - 0.5) * 0.5,
          cansat: data.sensors.temperature.value,
          ground: data.groundStation.temperature,
        },
        humidity: {
          predicted: data.sensors.humidity.value + (Math.random() - 0.5) * 0.5,
          cansat: data.sensors.humidity.value,
          ground: data.groundStation.humidity,
        },
        pressure: {
          predicted: data.sensors.pressure.value + (Math.random() - 0.5) * 0.5,
          cansat: data.sensors.pressure.value,
          ground: data.groundStation.pressure,
        },
        voltage: {
          predicted: data.battery.voltage + (Math.random() - 0.5) * 0.1,
          cansat: data.battery.voltage,
          ground: 12.0 + Math.random() * 0.5,
        },
      };
      data.predictions.unshift(fallbackPrediction);
    }

    if (data.predictions.length > 100) {
      data.predictions.pop();
    }

    data.timestamp = new Date().toISOString();
    this.saveData(data);

    return data;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  loadData() {
    try {
      const data = fs.readFileSync(this.dataFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading data:", error);
      // This is the fallback if the file is empty or corrupted.
      // It regenerates initial data.
      return this.generateInitialData();
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  getData() {
    return this.loadData();
  }

  getHistoricalData(limit = 50) {
    const data = this.loadData();
    return data.historicalData.slice(0, limit);
  }

  getPredictions(limit = 50) {
    const data = this.loadData();
    return data.predictions.slice(0, limit);
  }

  getSensorData() {
    const data = this.loadData();
    return {
      sensors: data.sensors,
      battery: data.battery,
      gps: data.gps,
      groundStation: data.groundStation,
      mission: data.mission,
      timestamp: data.timestamp,
    };
  }
}

module.exports = DataGenerator;
