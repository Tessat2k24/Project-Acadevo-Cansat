// generateTrainingData.js
// Script to generate realistic training data for ML model

const PhysicsBasedDataGenerator = require("./physicsBasedDataGenerator");
const fs = require("fs");
const path = require("path");

class TrainingDataGenerator {
  constructor() {
    this.physicsGenerator = new PhysicsBasedDataGenerator();
  }

  // Generate comprehensive training dataset
  generateFullTrainingSet(numSamples = 5000) {
    console.log(`Generating ${numSamples} training samples...`);

    const features = [];
    const targets = [];

    for (let i = 0; i < numSamples; i++) {
      if (i % 500 === 0) {
        console.log(`Progress: ${i}/${numSamples} samples generated`);
      }

      // Generate current state
      const currentData = this.physicsGenerator.generatePhysicsBasedPoint(
        Math.random() * 280 // Random time in mission
      );

      // Generate future targets (what we want to predict)
      const futureTime = currentData.time + 10 + Math.random() * 20; // 10-30 seconds ahead
      const futureData =
        this.physicsGenerator.generatePhysicsBasedPoint(futureTime);

      // Feature vector (input to ML model)
      const featureVector = [
        currentData.temperature,
        currentData.pressure,
        currentData.humidity,
        currentData.voltage,
        currentData.altitude,
        currentData.time,
        currentData.features.phase,
        currentData.features.timeOfDay,
        currentData.features.seasonFactor,
        // Add rate of change features
        this.calculateRateOfChange(currentData, "temperature"),
        this.calculateRateOfChange(currentData, "pressure"),
        this.calculateRateOfChange(currentData, "humidity"),
        this.calculateRateOfChange(currentData, "voltage"),
      ];

      // Target vector (what to predict)
      const targetVector = [
        futureData.temperature,
        futureData.pressure,
        futureData.humidity,
        futureData.voltage,
      ];

      features.push(featureVector);
      targets.push(targetVector);
    }

    return { features, targets };
  }

  calculateRateOfChange(currentData, parameter) {
    // Simulate rate of change based on mission phase
    const phase = currentData.features.phase;
    const baseRates = {
      temperature: { 1: -0.1, 2: -0.3, 3: -0.1, 4: 0.2, 5: 0.4 },
      pressure: { 1: -0.5, 2: -2.0, 3: -0.2, 4: 1.0, 5: 2.5 },
      humidity: { 1: -0.2, 2: -0.8, 3: -0.1, 4: 0.3, 5: 0.6 },
      voltage: { 1: -0.02, 2: -0.01, 3: -0.005, 4: -0.03, 5: -0.02 },
    };

    return baseRates[parameter][phase] + (Math.random() - 0.5) * 0.1;
  }

  // Save training data in formats suitable for different ML frameworks
  saveTrainingData(data, outputDir = "./training_data") {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save as CSV for pandas/scikit-learn
    this.saveAsCSV(data, path.join(outputDir, "training_data.csv"));

    // Save as JSON for JavaScript ML libraries
    this.saveAsJSON(data, path.join(outputDir, "training_data.json"));

    // Save metadata
    this.saveMetadata(outputDir);

    console.log(`Training data saved to ${outputDir}`);
  }

  saveAsCSV(data, filepath) {
    const { features, targets } = data;

    // Create header
    const featureNames = [
      "temp_current",
      "pressure_current",
      "humidity_current",
      "voltage_current",
      "altitude",
      "time",
      "phase",
      "time_of_day",
      "season_factor",
      "temp_rate",
      "pressure_rate",
      "humidity_rate",
      "voltage_rate",
    ];
    const targetNames = [
      "temp_future",
      "pressure_future",
      "humidity_future",
      "voltage_future",
    ];

    const header = [...featureNames, ...targetNames].join(",") + "\n";

    // Create rows
    const rows = features
      .map((feature, i) => {
        return [...feature, ...targets[i]].join(",");
      })
      .join("\n");

    fs.writeFileSync(filepath, header + rows);
  }

  saveAsJSON(data, filepath) {
    const { features, targets } = data;

    const jsonData = {
      metadata: {
        numSamples: features.length,
        featureCount: features[0].length,
        targetCount: targets[0].length,
        generated: new Date().toISOString(),
      },
      features: features,
      targets: targets,
    };

    fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
  }

  saveMetadata(outputDir) {
    const metadata = {
      description: "CanSat sensor prediction training data",
      features: {
        0: "Current Temperature (°C)",
        1: "Current Pressure (hPa)",
        2: "Current Humidity (%)",
        3: "Current Voltage (V)",
        4: "Altitude (m)",
        5: "Mission Time (s)",
        6: "Mission Phase (1-5)",
        7: "Time of Day (hours)",
        8: "Season Factor (0-1)",
        9: "Temperature Rate of Change (°C/s)",
        10: "Pressure Rate of Change (hPa/s)",
        11: "Humidity Rate of Change (%/s)",
        12: "Voltage Rate of Change (V/s)",
      },
      targets: {
        0: "Future Temperature (°C)",
        1: "Future Pressure (hPa)",
        2: "Future Humidity (%)",
        3: "Future Voltage (V)",
      },
      physics_relationships: {
        temperature_altitude:
          "Standard atmospheric lapse rate: 6.5°C per 1000m",
        pressure_altitude: "Exponential decay with altitude",
        humidity_temperature: "Relative humidity affected by temperature",
        voltage_time: "Battery discharge over time",
        voltage_temperature: "Cold temperatures reduce battery voltage",
      },
      usage: {
        input_normalization:
          "Recommended to normalize features before training",
        prediction_horizon: "10-30 seconds ahead",
        validation_split: "80/20 train/validation recommended",
      },
    };

    fs.writeFileSync(
      path.join(outputDir, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );
  }

  // Generate and save a complete dataset
  generateAndSave(numSamples = 5000, outputDir = "./training_data") {
    console.log("Starting training data generation...");

    const trainingData = this.generateFullTrainingSet(numSamples);
    this.saveTrainingData(trainingData, outputDir);

    console.log("Training data generation complete!");
    console.log(
      `Generated ${numSamples} samples with realistic physics-based correlations`
    );

    return trainingData;
  }
}

// Export for use as module
module.exports = TrainingDataGenerator;

// Run directly if called from command line
if (require.main === module) {
  const generator = new TrainingDataGenerator();

  // Parse command line arguments
  const numSamples = parseInt(process.argv[2]) || 5000;
  const outputDir = process.argv[3] || "./training_data";

  generator.generateAndSave(numSamples, outputDir);
}
