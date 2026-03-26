// mlPredictor.js
// Integration script to use the trained ML model in your Node.js backend

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class MLPredictor {
  constructor(modelPath = "./cansat_model.pkl") {
    this.modelPath = modelPath;
    this.pythonScript = path.join(__dirname, "ml_predictor.py");
    this.isModelReady = false;
    this.lastPrediction = null;

    this.initializePythonScript();
    this.checkModelReady();
  }

  initializePythonScript() {
    // Create Python script for predictions
    const pythonCode = `
import pickle
import numpy as np
import sys
import json

class ModelPredictor:
    def __init__(self, model_path):
        try:
            with open(model_path, 'rb') as f:
                self.model_data = pickle.load(f)
            
            self.model = self.model_data['model']
            self.scaler_features = self.model_data['scaler_features']
            self.scaler_targets = self.model_data['scaler_targets']
            self.feature_names = self.model_data['feature_names']
            self.target_names = self.model_data['target_names']
            
            print(json.dumps({"status": "ready", "message": "Model loaded successfully"}))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))
    
    def predict(self, features):
        try:
            # Ensure features is numpy array
            features = np.array(features).reshape(1, -1)
            
            # Scale features
            features_scaled = self.scaler_features.transform(features)
            
            # Predict
            predictions_scaled = self.model.predict(features_scaled)
            
            # Inverse scale predictions
            predictions = self.scaler_targets.inverse_transform(predictions_scaled)
            
            # Return as dictionary
            result = {}
            for i, name in enumerate(self.target_names):
                result[name] = float(predictions[0][i])
            
            return {"status": "success", "predictions": result}
        except Exception as e:
            return {"status": "error", "message": str(e)}

# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "Model path required"}))
        sys.exit(1)
    
    model_path = sys.argv[1]
    predictor = ModelPredictor(model_path)
    
    # Read from stdin for predictions
    for line in sys.stdin:
        try:
            data = json.loads(line.strip())
            if data.get('action') == 'predict':
                result = predictor.predict(data['features'])
                print(json.dumps(result))
            elif data.get('action') == 'health':
                print(json.dumps({"status": "ready", "message": "Predictor is running"}))
        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))
`;

    fs.writeFileSync(this.pythonScript, pythonCode);
  }

  checkModelReady() {
    this.isModelReady = fs.existsSync(this.modelPath);
    if (this.isModelReady) {
      console.log("✓ ML Model found and ready for predictions");
    } else {
      console.log("⚠ ML Model not found. Using fallback predictions.");
      console.log(`Expected model path: ${this.modelPath}`);
    }
  }

  async generateMLPredictions(currentSensorData) {
    if (!this.isModelReady) {
      return this.generateFallbackPredictions(currentSensorData);
    }

    try {
      // Extract features for ML model
      const features = this.extractFeatures(currentSensorData);

      // Call Python predictor
      const predictions = await this.callPythonPredictor(features);

      if (predictions.status === "success") {
        this.lastPrediction = predictions.predictions;
        return this.formatPredictions(
          predictions.predictions,
          currentSensorData
        );
      } else {
        console.error("ML Prediction error:", predictions.message);
        return this.generateFallbackPredictions(currentSensorData);
      }
    } catch (error) {
      console.error("ML Predictor error:", error);
      return this.generateFallbackPredictions(currentSensorData);
    }
  }

  extractFeatures(sensorData) {
    // Extract features in the same order as training data
    const now = new Date();
    const timeOfDay = now.getHours() + now.getMinutes() / 60;

    // Calculate day of year manually
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const seasonFactor =
      0.5 + 0.3 * Math.sin(((dayOfYear - 80) * 2 * Math.PI) / 365);

    // Calculate mission time (assuming mission started recently)
    const missionTime = (Date.now() - (Date.now() - 300000)) / 1000; // Last 5 minutes

    // Determine mission phase based on altitude pattern
    const phase = this.determineMissionPhase(
      sensorData.sensors.altitude.value,
      missionTime
    );

    return [
      sensorData.sensors.temperature.value, // temp_current
      sensorData.sensors.pressure.value, // pressure_current
      sensorData.sensors.humidity.value, // humidity_current
      sensorData.battery.voltage, // voltage_current
      sensorData.sensors.altitude.value, // altitude
      missionTime, // time
      phase, // phase
      timeOfDay, // time_of_day
      seasonFactor, // season_factor
      sensorData.sensors.temperature.change || 0, // temp_rate
      sensorData.sensors.pressure.change || 0, // pressure_rate
      sensorData.sensors.humidity.change || 0, // humidity_rate
      (sensorData.battery.voltage - 12.0) * 0.1 || 0, // voltage_rate (estimated)
    ];
  }

  determineMissionPhase(altitude, time) {
    // Simple phase determination based on altitude and time
    if (altitude < 50) return 1; // launch
    if (altitude < 200) return 2; // ascent
    if (altitude > 800) return 3; // coast
    if (time > 180) return 5; // descent
    return 4; // deployment
  }

  async callPythonPredictor(features) {
    return new Promise((resolve, reject) => {
      const python = spawn("python", [this.pythonScript, this.modelPath]);
      let result = "";
      let error = "";

      python.stdout.on("data", (data) => {
        result += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
        if (code === 0) {
          try {
            const lines = result.trim().split("\n");
            const lastLine = lines[lines.length - 1];
            resolve(JSON.parse(lastLine));
          } catch (e) {
            reject(new Error("Failed to parse Python output: " + result));
          }
        } else {
          reject(new Error("Python script error: " + error));
        }
      });

      // Send prediction request
      const request = {
        action: "predict",
        features: features,
      };

      python.stdin.write(JSON.stringify(request) + "\n");
      python.stdin.end();

      // Set timeout
      setTimeout(() => {
        python.kill();
        reject(new Error("Python prediction timeout"));
      }, 5000);
    });
  }

  formatPredictions(mlPredictions, currentSensorData) {
    const timestamp = Date.now();

    return {
      timestamp: timestamp,
      temperature: {
        predicted: mlPredictions.temp_future,
        cansat: currentSensorData.sensors.temperature.value,
        ground: currentSensorData.groundStation?.temperature || 20.0,
      },
      humidity: {
        predicted: mlPredictions.humidity_future,
        cansat: currentSensorData.sensors.humidity.value,
        ground: currentSensorData.groundStation?.humidity || 60.0,
      },
      pressure: {
        predicted: mlPredictions.pressure_future,
        cansat: currentSensorData.sensors.pressure.value,
        ground: currentSensorData.groundStation?.pressure || 1013.25,
      },
      voltage: {
        predicted: mlPredictions.voltage_future,
        cansat: currentSensorData.battery.voltage,
        ground: 12.0,
      },
    };
  }

  generateFallbackPredictions(currentSensorData) {
    // Enhanced fallback predictions with some physics-based logic
    const timestamp = Date.now();
    const temp = currentSensorData.sensors.temperature.value;
    const pressure = currentSensorData.sensors.pressure.value;
    const humidity = currentSensorData.sensors.humidity.value;
    const voltage = currentSensorData.battery.voltage;
    const altitude = currentSensorData.sensors.altitude.value;

    // Apply some basic physics relationships for fallback
    const altitudeEffect = altitude * 0.0065; // Temperature lapse rate
    const timeEffect = Math.sin(Date.now() / 60000) * 0.5; // Small time-based variation

    return {
      timestamp: timestamp,
      temperature: {
        predicted: temp - altitudeEffect + timeEffect,
        cansat: temp,
        ground: currentSensorData.groundStation?.temperature || 20.0,
      },
      humidity: {
        predicted: Math.max(10, humidity - altitude * 0.01 + timeEffect * 2),
        cansat: humidity,
        ground: currentSensorData.groundStation?.humidity || 60.0,
      },
      pressure: {
        predicted: pressure * Math.exp(-altitude / 8400) + timeEffect * 0.5,
        cansat: pressure,
        ground: currentSensorData.groundStation?.pressure || 1013.25,
      },
      voltage: {
        predicted: Math.max(10.5, voltage - 0.02 + timeEffect * 0.01),
        cansat: voltage,
        ground: 12.0,
      },
    };
  }

  // Health check method
  async healthCheck() {
    return {
      modelReady: this.isModelReady,
      modelPath: this.modelPath,
      lastPrediction: this.lastPrediction,
      status: this.isModelReady
        ? "ML predictions active"
        : "Using fallback predictions",
    };
  }
}

module.exports = MLPredictor;
