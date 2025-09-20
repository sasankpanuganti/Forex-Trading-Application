from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

app = FastAPI()

MODEL_PATH = './model.joblib'

class Prices(BaseModel):
    prices: List[float]
    model: Optional[str] = 'rf'


def featurize(prices: List[float]):
    arr = np.array(prices)
    # create simple features: returns, moving averages, volatility
    returns = np.diff(arr) / arr[:-1]
    features = {
        'last_price': arr[-1],
        'ma3': arr[-3:].mean() if len(arr) >= 3 else arr.mean(),
        'ma10': arr[-10:].mean() if len(arr) >= 10 else arr.mean(),
        'vol20': arr[-20:].std() if len(arr) >= 5 else arr.std(),
        'momentum': (arr[-1] - arr[-5]) / arr[-5] if len(arr) >= 5 and arr[-5] != 0 else 0,
    }
    return np.array([features['last_price'], features['ma3'], features['ma10'], features['vol20'], features['momentum']])


@app.post('/train-demo')
def train_demo():
    # generate synthetic labeled data: BUY/SELL/HOLD
    np.random.seed(42)
    X = []
    y = []
    for _ in range(2000):
        base = np.cumsum(np.random.normal(0, 0.1, 60)) + 100
        # label by forward return over next 5 steps
        forward = (np.mean(base[-1:]) - np.mean(base[-6:-1])) / np.mean(base[-6:-1])
        label = 0
        if forward > 0.003:
            label = 1  # BUY
        elif forward < -0.003:
            label = -1  # SELL
        else:
            label = 0
        feat = featurize(list(base))
        X.append(feat)
        y.append(1 if label == 1 else ( -1 if label == -1 else 0))

    X = np.vstack(X)
    y = np.array(y)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    report = classification_report(y_test, preds, output_dict=True)

    joblib.dump(clf, MODEL_PATH)
    return {'status': 'trained', 'report': report}


@app.post('/predict')
def predict(body: Prices):
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        return {'error': 'model not found, run /train-demo first'}

    features = featurize(body.prices).reshape(1, -1)
    pred = model.predict(features)[0]
    proba = None
    try:
        proba = model.predict_proba(features).max().item()
    except Exception:
        proba = 0.5

    signal = 'HOLD'
    if pred == 1:
        signal = 'BUY'
    elif pred == -1:
        signal = 'SELL'

    return {'signal': signal, 'confidence': float(proba), 'reason': 'rf-demo'}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=5001)
