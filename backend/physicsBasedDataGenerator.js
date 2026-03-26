// physicsBasedDataGenerator.js
// Generates realistic CanSat data based on atmospheric physics and electronics principles

class PhysicsBasedDataGenerator {
  constructor() {
    // Initial conditions (ground level)
    this.groundLevel = {
      altitude: 0,
      temperature: 15.0, // °C at ground level
      pressure: 1013.25, // hPa at sea level
      humidity: 60.0, // % relative humidity
      voltage: 12.4, // V fully charged battery
    };

    // Mission parameters
    this.maxAltitude = 1000; // meters
    this.missionDuration = 300; // seconds (5 minutes)
    this.currentTime = 0;

    // Noise parameters for realism
    this.noise = {
      temperature: 0.5,
      pressure: 1.0,
      humidity: 2.0,
      voltage: 0.05,
    };
  }

  // Generate a complete mission dataset
  generateMissionData(dataPoints = 300) {
    const dataset = [];
    const timeStep = this.missionDuration / dataPoints;

    for (let i = 0; i < dataPoints; i++) {
      const time = i * timeStep;
      const dataPoint = this.generatePhysicsBasedPoint(time);
      dataset.push(dataPoint);
    }

    return dataset;
  }

  // Generate a single data point based on mission time
  generatePhysicsBasedPoint(time) {
    // Mission phases
    const phase = this.getMissionPhase(time);
    const altitude = this.calculateAltitude(time, phase);

    // Calculate physics-based parameters
    const temperature = this.calculateTemperature(altitude, time);
    const pressure = this.calculatePressure(altitude, temperature);
    const humidity = this.calculateHumidity(altitude, temperature, time);
    const voltage = this.calculateVoltage(time, temperature);

    // Add realistic noise
    const noisyData = this.addNoise({
      temperature,
      pressure,
      humidity,
      voltage,
    });

    return {
      timestamp: Date.now() - (this.missionDuration - time) * 1000,
      time: time,
      altitude: altitude,
      phase: phase,
      ...noisyData,
      // Additional metadata for ML training
      features: {
        altitude,
        time,
        phase: this.phaseToNumber(phase),
        timeOfDay: this.getTimeOfDay(),
        seasonFactor: this.getSeasonFactor(),
      },
    };
  }

  getMissionPhase(time) {
    if (time < 10) return "launch";
    if (time < 60) return "ascent";
    if (time < 120) return "coast";
    if (time < 180) return "deployment";
    return "descent";
  }

  calculateAltitude(time, phase) {
    switch (phase) {
      case "launch":
        return time * 5; // Quick initial rise
      case "ascent":
        return 50 + (time - 10) * 15; // Steady climb
      case "coast":
        return Math.max(
          this.maxAltitude - 50,
          750 + Math.sin((time - 60) * 0.1) * 50
        ); // Floating with oscillation
      case "deployment":
        return this.maxAltitude - (time - 120) * 8; // Slow descent after deployment
      case "descent":
        return Math.max(0, this.maxAltitude - 480 - (time - 180) * 12); // Faster descent
      default:
        return 0;
    }
  }

  calculateTemperature(altitude, time) {
    // Standard atmospheric lapse rate: 6.5°C per 1000m
    const altitudeEffect = this.groundLevel.temperature - altitude * 0.0065;

    // Diurnal temperature variation (simplified)
    const timeOfDayEffect =
      Math.sin((time / this.missionDuration) * 2 * Math.PI) * 2;

    // Electronic heating effect at low altitudes
    const electronicHeating = Math.max(0, (100 - altitude) / 100) * 1.5;

    return altitudeEffect + timeOfDayEffect + electronicHeating;
  }

  calculatePressure(altitude, temperature) {
    // Barometric formula (simplified)
    const scale_height = 8400; // meters
    const pressureRatio = Math.exp(-altitude / scale_height);

    // Temperature correction (simplified ideal gas law effect)
    const tempCorrection =
      (temperature + 273.15) / (this.groundLevel.temperature + 273.15);

    return this.groundLevel.pressure * pressureRatio * tempCorrection;
  }

  calculateHumidity(altitude, temperature, time) {
    // Humidity generally decreases with altitude
    const altitudeEffect =
      this.groundLevel.humidity * Math.exp(-altitude / 3000);

    // Temperature effect on relative humidity
    const tempEffect = Math.max(0.3, 1 - Math.abs(temperature - 20) / 50);

    // Seasonal/time variation
    const timeVariation = 1 + Math.sin(time / 50) * 0.2;

    return Math.min(
      100,
      Math.max(10, altitudeEffect * tempEffect * timeVariation)
    );
  }

  calculateVoltage(time, temperature) {
    // Battery discharge over time (logarithmic decay)
    const timeDischarge =
      this.groundLevel.voltage * (1 - Math.log(1 + time / 100) * 0.05);

    // Temperature effect on battery (cold reduces voltage)
    const tempEffect = Math.max(0.85, 1 - Math.max(0, 5 - temperature) * 0.01);

    // Load variation during different mission phases
    const loadFactor = this.getLoadFactor(time);

    return Math.max(10.5, timeDischarge * tempEffect * loadFactor);
  }

  getLoadFactor(time) {
    const phase = this.getMissionPhase(time);
    switch (phase) {
      case "launch":
        return 0.95; // High load during launch
      case "ascent":
        return 0.98; // Normal load
      case "coast":
        return 0.99; // Low load during coast
      case "deployment":
        return 0.94; // High load during deployment
      case "descent":
        return 0.96; // Moderate load
      default:
        return 0.97;
    }
  }

  addNoise(data) {
    return {
      temperature:
        data.temperature + (Math.random() - 0.5) * this.noise.temperature,
      pressure: data.pressure + (Math.random() - 0.5) * this.noise.pressure,
      humidity: Math.max(
        0,
        Math.min(
          100,
          data.humidity + (Math.random() - 0.5) * this.noise.humidity
        )
      ),
      voltage: Math.max(
        10,
        data.voltage + (Math.random() - 0.5) * this.noise.voltage
      ),
    };
  }

  phaseToNumber(phase) {
    const phases = {
      launch: 1,
      ascent: 2,
      coast: 3,
      deployment: 4,
      descent: 5,
    };
    return phases[phase] || 0;
  }

  getTimeOfDay() {
    // Simplified: assume launch at noon, return hour equivalent
    return 12 + this.currentTime / 3600;
  }

  getSeasonFactor() {
    // Simplified seasonal factor (0-1)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) || 180; // Default to summer
    return 0.5 + 0.3 * Math.sin(((dayOfYear - 80) * 2 * Math.PI) / 365);
  }

  // Method to generate training data for ML
  generateTrainingDataset(samples = 1000) {
    const dataset = [];

    for (let i = 0; i < samples; i++) {
      // Vary mission parameters for diversity
      this.maxAltitude = 800 + Math.random() * 400; // 800-1200m
      this.missionDuration = 250 + Math.random() * 100; // 250-350s
      this.groundLevel.temperature = 10 + Math.random() * 20; // 10-30°C
      this.groundLevel.pressure = 1005 + Math.random() * 16; // 1005-1021 hPa
      this.groundLevel.humidity = 40 + Math.random() * 40; // 40-80%

      // Generate random time point in mission
      const randomTime = Math.random() * this.missionDuration;
      const dataPoint = this.generatePhysicsBasedPoint(randomTime);

      dataset.push(dataPoint);
    }

    return dataset;
  }

  // Generate prediction targets for supervised learning
  generatePredictionTargets(currentData, forecastHorizon = 30) {
    // Generate future predictions based on current state
    const predictions = [];

    for (let i = 1; i <= forecastHorizon; i++) {
      const futureTime = currentData.time + i;
      const futureData = this.generatePhysicsBasedPoint(futureTime);
      predictions.push({
        horizon: i,
        temperature: futureData.temperature,
        pressure: futureData.pressure,
        humidity: futureData.humidity,
        voltage: futureData.voltage,
      });
    }

    return predictions;
  }
}

module.exports = PhysicsBasedDataGenerator;
