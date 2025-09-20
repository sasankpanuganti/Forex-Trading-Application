"""Simple demo: train a toy RandomForest classifier on synthetic price features
and expose a FastAPI endpoint to return recommendations. This file is
intended as an example and **is not** wired into the frontend; run it
locally if you want to test the Python model.

Usage:
  python -m venv .venv
  .venv\Scripts\activate
  pip install -r requirements.txt
  python train_and_serve.py

The server will start on http://127.0.0.1:5001 by default.
"""
from __future__ import annotations
import os
import time
from typing import List, Dict, Any
import numpy as np
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

MODEL_PATH = "model.joblib"

app = FastAPI(title="Demo Forex Predictor")


class TrainRequest(BaseModel):
    samples: int = 2000


class PredictRequest(BaseModel):
    prices: List[float] = []
    current_pair: str = "EUR/USD"
    balance: float = 10000.0


def featurize(prices: List[float]) -> List[float]:
    """Create simple statistical features from a price history."""
    if not prices:
        return [0.0, 0.0, 0.0]
    arr = np.array(prices[-50:])
    mean = float(np.mean(arr))
    std = float(np.std(arr))
    slope = float((arr[-1] - arr[0]) / (len(arr) or 1))
    return [mean, std, slope]


def generate_synthetic_dataset(n_samples: int = 2000):
    X = []
    y = []
    rng = np.random.RandomState(42)
    for _ in range(n_samples):
        # simulate short price history as a random walk with optional trend
        base = 1.0 + rng.rand() * 2.0
        steps = rng.normal(loc=0.0, scale=0.002, size=50)
        # add occasional trend
        trend = rng.choice([0.0, 1e-4, -1e-4], p=[0.7, 0.15, 0.15])
        prices = base + np.cumsum(steps + trend * np.linspace(0, 1, 50))
        feats = featurize(list(prices))
        # label: BUY if slope positive enough, SELL if negative enough, else HOLD
        slope = feats[2]
        if slope > 0.00005:
            label = 1  # BUY
        elif slope < -0.00005:
            label = -1  # SELL
        else:
            label = 0  # HOLD
        X.append(feats)
        y.append(label)
    return np.array(X), np.array(y)


@app.post("/train")
def train(req: TrainRequest):
    X, y = generate_synthetic_dataset(req.samples)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    joblib.dump(clf, MODEL_PATH)
    return {"status": "trained", "accuracy": float(acc), "saved_to": MODEL_PATH}


@app.post("/predict")
def predict(req: PredictRequest):
    # load model if available
    model = None
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
        except Exception:
            model = None

    feats = np.array([featurize(req.prices)])
    if model is not None:
        label = model.predict(feats)[0]
        # try to get a probability/confidence for class
        conf = 0.5
        try:
            probs = model.predict_proba(feats)
            # map label index to prob
            # classes_ may be [-1,0,1] or similar
            classes = list(model.classes_)
            idx = classes.index(label)
            conf = float(probs[0, idx])
        except Exception:
            conf = 0.6
    else:
        # fallback heuristic
        slope = feats[0, 2]
        if slope > 0.00005:
            label = 1
            conf = min(0.9, 0.6 + abs(slope) * 1000)
        elif slope < -0.00005:
            label = -1
            conf = min(0.9, 0.6 + abs(slope) * 1000)
        else:
            label = 0
            conf = 0.5

    signal = "HOLD"
    if label == 1:
        signal = "BUY"
    elif label == -1:
        signal = "SELL"

    # Create a simple recommendation list similar to the frontend shape
    rec = {
        "pair": req.current_pair,
        "action": signal,
        "amount": int(max(1, req.balance * 0.1)),
        "confidence": float(round(conf, 3)),
        "profitRatio": float(round(1.5 + conf * 2.0, 3)),
        "reasoning": f"Model-based signal ({signal})",
        "timeframe": "15 minutes"
    }
    return {"recommendations": [rec], "signal": signal, "confidence": float(conf)}


if __name__ == "__main__":
    # If executed directly, train a model and print status
    print("Training demo model...")
    res = train(TrainRequest())
    print("Done:", res)
    print("You can run the API via: uvicorn train_and_serve:app --host 127.0.0.1 --port 5001")
