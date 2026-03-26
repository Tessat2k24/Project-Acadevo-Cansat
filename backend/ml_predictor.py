
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
