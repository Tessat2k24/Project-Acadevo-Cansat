#!/usr/bin/env python3
"""
ML Model Training Script for CanSat Sensor Prediction
This script will train your friend's ML model using the physics-based training data
"""

import pandas as pd
import numpy as np
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os

class CansatMLTrainer:
    def __init__(self, model_save_path='./cansat_model.pkl'):
        self.model_save_path = model_save_path
        self.scaler_features = StandardScaler()
        self.scaler_targets = StandardScaler()
        self.model = None
        self.feature_names = [
            'temp_current', 'pressure_current', 'humidity_current', 'voltage_current',
            'altitude', 'time', 'phase', 'time_of_day', 'season_factor',
            'temp_rate', 'pressure_rate', 'humidity_rate', 'voltage_rate'
        ]
        self.target_names = ['temp_future', 'pressure_future', 'humidity_future', 'voltage_future']
    
    def load_training_data(self, data_path='./training_data/training_data.csv'):
        """Load the physics-based training data"""
        print(f"Loading training data from {data_path}...")
        
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Training data not found at {data_path}")
        
        df = pd.read_csv(data_path)
        print(f"Loaded {len(df)} training samples")
        
        # Separate features and targets
        X = df[self.feature_names].values
        y = df[self.target_names].values
        
        print(f"Features shape: {X.shape}")
        print(f"Targets shape: {y.shape}")
        
        return X, y
    
    def preprocess_data(self, X, y):
        """Normalize features and targets"""
        print("Preprocessing data...")
        
        # Fit scalers and transform
        X_scaled = self.scaler_features.fit_transform(X)
        y_scaled = self.scaler_targets.fit_transform(y)
        
        return X_scaled, y_scaled
    
    def create_model(self):
        """Create the ML model - you can replace this with your friend's model"""
        print("Creating ML model...")
        
        # Using Random Forest as example - replace with your friend's model
        # You can also use other models like:
        # - XGBoost: xgb.XGBRegressor()
        # - Neural Network: MLPRegressor()
        # - Linear Regression: LinearRegression()
        
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        return model
    
    def train_model(self, X, y, test_size=0.2, validation_split=0.1):
        """Train the model with proper validation"""
        print("Training model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, test_size=validation_split, random_state=42
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        # Create and train model
        self.model = self.create_model()
        self.model.fit(X_train, y_train)
        
        # Validate model
        train_score = self.model.score(X_train, y_train)
        val_score = self.model.score(X_val, y_val)
        test_score = self.model.score(X_test, y_test)
        
        print(f"Training R² Score: {train_score:.4f}")
        print(f"Validation R² Score: {val_score:.4f}")
        print(f"Test R² Score: {test_score:.4f}")
        
        # Detailed evaluation
        y_pred = self.model.predict(X_test)
        self.evaluate_model(y_test, y_pred)
        
        return X_test, y_test, y_pred
    
    def evaluate_model(self, y_true, y_pred):
        """Evaluate model performance for each target"""
        print("\nDetailed Model Evaluation:")
        print("-" * 50)
        
        for i, target_name in enumerate(self.target_names):
            mse = mean_squared_error(y_true[:, i], y_pred[:, i])
            r2 = r2_score(y_true[:, i], y_pred[:, i])
            rmse = np.sqrt(mse)
            
            print(f"{target_name}:")
            print(f"  RMSE: {rmse:.4f}")
            print(f"  R² Score: {r2:.4f}")
            print()
    
    def plot_feature_importance(self):
        """Plot feature importance (if model supports it)"""
        if hasattr(self.model, 'feature_importances_'):
            plt.figure(figsize=(10, 6))
            importance = self.model.feature_importances_
            indices = np.argsort(importance)[::-1]
            
            plt.title("Feature Importance for CanSat Prediction")
            plt.bar(range(len(importance)), importance[indices])
            plt.xticks(range(len(importance)), [self.feature_names[i] for i in indices], rotation=45)
            plt.tight_layout()
            plt.savefig('./feature_importance.png')
            plt.show()
    
    def save_model(self):
        """Save the trained model and scalers"""
        print(f"Saving model to {self.model_save_path}...")
        
        model_data = {
            'model': self.model,
            'scaler_features': self.scaler_features,
            'scaler_targets': self.scaler_targets,
            'feature_names': self.feature_names,
            'target_names': self.target_names,
            'training_date': datetime.now().isoformat(),
            'model_type': type(self.model).__name__
        }
        
        with open(self.model_save_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print("Model saved successfully!")
    
    def load_model(self):
        """Load a previously trained model"""
        print(f"Loading model from {self.model_save_path}...")
        
        with open(self.model_save_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler_features = model_data['scaler_features']
        self.scaler_targets = model_data['scaler_targets']
        
        print("Model loaded successfully!")
        return model_data
    
    def predict(self, features):
        """Make predictions with the trained model"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Ensure features is 2D
        if len(features.shape) == 1:
            features = features.reshape(1, -1)
        
        # Scale features
        features_scaled = self.scaler_features.transform(features)
        
        # Predict
        predictions_scaled = self.model.predict(features_scaled)
        
        # Inverse scale predictions
        predictions = self.scaler_targets.inverse_transform(predictions_scaled)
        
        return predictions
    
    def train_complete_pipeline(self, data_path='./training_data/training_data.csv'):
        """Complete training pipeline"""
        print("Starting complete training pipeline...")
        print("=" * 60)
        
        # Load data
        X, y = self.load_training_data(data_path)
        
        # Preprocess
        X_scaled, y_scaled = self.preprocess_data(X, y)
        
        # Train
        X_test, y_test, y_pred = self.train_model(X_scaled, y_scaled)
        
        # Plot importance
        self.plot_feature_importance()
        
        # Save model
        self.save_model()
        
        print("Training pipeline complete!")
        return self.model

def main():
    """Main function to run the training"""
    trainer = CansatMLTrainer()
    
    # Check if training data exists
    data_path = './training_data/training_data.csv'
    if not os.path.exists(data_path):
        print("Training data not found!")
        print("Please run the Node.js script first to generate training data:")
        print("node generateTrainingData.js")
        return
    
    # Train the model
    model = trainer.train_complete_pipeline(data_path)
    
    print("\n" + "="*60)
    print("MODEL TRAINING COMPLETE!")
    print("="*60)
    print(f"Model saved as: {trainer.model_save_path}")
    print("\nNext steps:")
    print("1. Copy the .pkl file to your backend directory")
    print("2. Use the integration script to connect it to your API")
    print("3. Your prediction page will now use real ML predictions!")

if __name__ == "__main__":
    main()