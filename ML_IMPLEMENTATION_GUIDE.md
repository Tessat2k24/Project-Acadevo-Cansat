# CanSat ML Prediction System - Implementation Guide

## Overview

This guide will help you implement a realistic machine learning prediction system for your CanSat project. Instead of random predictions, you'll have physics-based correlations that make the predictions accurate and meaningful.

## Problem Solved

- ✅ **No more random predictions** - Uses real atmospheric physics
- ✅ **Correlated training data** - Temperature, pressure, humidity, and voltage are properly related
- ✅ **Accurate ML model** - Trained on realistic CanSat mission scenarios
- ✅ **Easy integration** - Works with your existing frontend/backend

## Files Created

```
backend/
├── physicsBasedDataGenerator.js     # Physics-based data generation
├── generateTrainingData.js          # Script to create ML training data
├── train_ml_model.py               # Python ML training script
├── mlPredictor.js                  # ML integration for Node.js
└── (modified) dataGenerator.js     # Updated to use ML predictions
```

## Step-by-Step Implementation

### Step 1: Generate Physics-Based Training Data

```bash
cd backend
node generateTrainingData.js 5000
```

This creates:

- `training_data/training_data.csv` - 5000 samples of correlated sensor data
- `training_data/metadata.json` - Information about the data structure

**What it does:**

- Simulates realistic CanSat missions (launch → ascent → coast → descent)
- Creates proper correlations:
  - Temperature decreases with altitude (6.5°C per 1000m)
  - Pressure decreases exponentially with altitude
  - Humidity affected by temperature and altitude
  - Battery voltage decreases with time and temperature

### Step 2: Train the Machine Learning Model

```bash
# Install Python dependencies
pip install pandas numpy scikit-learn matplotlib seaborn

# Train the model
python train_ml_model.py
```

**What happens:**

- Loads the physics-based training data
- Trains a machine learning model (Random Forest by default)
- Evaluates model accuracy (should show R² > 0.85 for each parameter)
- Saves the trained model as `cansat_model.pkl`

**Replace with your friend's model:**
In `train_ml_model.py`, line 65, replace the `RandomForestRegressor` with your friend's model:

```python
def create_model(self):
    # Replace this with your friend's model
    # Example: from sklearn.linear_model import LinearRegression
    # Example: from xgboost import XGBRegressor
    # Or import your friend's custom model class
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    return model
```

### Step 3: Test the Integration

Start your backend:

```bash
node server.js
```

The system will automatically:

- Load the trained ML model
- Use it for predictions if available
- Fall back to physics-based predictions if the model fails

### Step 4: Verify in Frontend

Open your frontend and go to the Prediction page. You should see:

- **Realistic predictions** that follow atmospheric physics
- **Correlated changes** - when altitude increases, temperature decreases
- **Smooth transitions** instead of random jumps

## Model Performance Expectations

With the physics-based training data, you should see:

| Parameter   | Expected R² Score | Physical Relationship                 |
| ----------- | ----------------- | ------------------------------------- |
| Temperature | > 0.90            | Altitude + time + electronics heating |
| Pressure    | > 0.95            | Barometric formula + temperature      |
| Humidity    | > 0.85            | Altitude + temperature effects        |
| Voltage     | > 0.88            | Time decay + temperature effects      |

## Understanding the Physics

### Temperature Predictions

- **Altitude effect**: -6.5°C per 1000m (standard lapse rate)
- **Time effect**: Diurnal variation during mission
- **Electronics heating**: Warming at low altitudes

### Pressure Predictions

- **Altitude effect**: Exponential decay (barometric formula)
- **Temperature correction**: Ideal gas law effects

### Humidity Predictions

- **Altitude effect**: Decreases with height
- **Temperature effect**: Relative humidity changes with temp
- **Time variation**: Natural fluctuations

### Voltage Predictions

- **Time decay**: Logarithmic battery discharge
- **Temperature effect**: Cold reduces battery voltage
- **Load variation**: Different power consumption by mission phase

## Customization Options

### 1. Adjust Mission Parameters

In `physicsBasedDataGenerator.js`:

```javascript
this.maxAltitude = 1000; // Change max altitude
this.missionDuration = 300; // Change mission length
this.groundLevel.temperature = 15.0; // Change ground temperature
```

### 2. Modify Physics Relationships

```javascript
// Change temperature lapse rate
const altitudeEffect = this.groundLevel.temperature - altitude * 0.0065;

// Adjust pressure formula
const pressureRatio = Math.exp(-altitude / scale_height);
```

### 3. Add New Parameters

To predict additional parameters:

1. Add to `generatePhysicsBasedPoint()` in physics generator
2. Update feature extraction in `mlPredictor.js`
3. Modify frontend to display new predictions

## Troubleshooting

### Model Not Loading

```bash
# Check if model file exists
ls -la cansat_model.pkl

# Check Python dependencies
python -c "import pickle, numpy, sklearn; print('Dependencies OK')"
```

### TypeError: getDayOfYear is not a function

This error occurs because `getDayOfYear()` is not a native JavaScript Date method. This has been fixed in the current version of the files. If you see this error:

1. **Check your mlPredictor.js file** - Make sure it uses the correct day-of-year calculation:

```javascript
// Correct way to calculate day of year
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const diff = now - start;
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
```

2. **Restart your server** after fixing the files:

```bash
# Stop the server (Ctrl+C) and restart
node server.js
```

### Poor Predictions

- **Check training data quality**: Open `training_data.csv` and verify correlations
- **Increase training samples**: Use `node generateTrainingData.js 10000`
- **Verify feature scaling**: Model expects normalized inputs

### Performance Issues

- **Reduce prediction frequency**: Change interval in `server.js`
- **Cache predictions**: Store recent predictions to avoid recalculation
- **Use simpler model**: Replace Random Forest with Linear Regression

## Production Deployment

### 1. Environment Setup

```bash
# Install production dependencies
npm install --production
pip install -r requirements.txt
```

### 2. Model Validation

```python
# Validate model before deployment
python -c "
import pickle
with open('cansat_model.pkl', 'rb') as f:
    model = pickle.load(f)
print('Model validation: OK')
"
```

### 3. Monitoring

Add logging to track prediction accuracy:

```javascript
// In mlPredictor.js
console.log(
  `Prediction: temp=${pred.temperature.predicted.toFixed(
    2
  )}°C, confidence=${confidence}`
);
```

## Advanced Features

### 1. Real-time Model Updates

Implement online learning to improve predictions during mission:

```python
# Add to train_ml_model.py
def update_model_online(self, new_features, new_targets):
    # Partial fit for online learning
    self.model.partial_fit(new_features, new_targets)
```

### 2. Uncertainty Quantification

Add prediction confidence intervals:

```python
# For Random Forest
def predict_with_uncertainty(self, features):
    predictions = []
    for tree in self.model.estimators_:
        pred = tree.predict(features)
        predictions.append(pred)

    mean_pred = np.mean(predictions, axis=0)
    std_pred = np.std(predictions, axis=0)
    return mean_pred, std_pred
```

### 3. Multi-horizon Predictions

Predict multiple time steps ahead:

```javascript
// Generate 30-second, 60-second, and 120-second predictions
const horizons = [30, 60, 120];
const predictions = await this.mlPredictor.generateMultiHorizonPredictions(
  sensorData,
  horizons
);
```

## Success Metrics

Your implementation is successful when:

- ✅ Predictions follow physical laws (temp decreases with altitude)
- ✅ Model R² scores > 0.8 for all parameters
- ✅ Frontend shows smooth, realistic prediction curves
- ✅ No random jumps or unrealistic values
- ✅ Graceful fallback when ML model unavailable

## Next Steps

1. **Collect real data**: Once you have actual CanSat data, retrain the model
2. **Add more sensors**: Extend to accelerometer, magnetometer predictions
3. **Implement alerts**: Add warnings when predictions indicate problems
4. **Model comparison**: Test different ML algorithms (XGBoost, Neural Networks)

## Support

If you need help:

1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Test with the provided sample data first
4. Ensure Python and Node.js versions are compatible

Your prediction system should now be significantly more accurate and realistic than random values!
