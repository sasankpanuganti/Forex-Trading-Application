Server helpers (static predictors)
=================================

This folder contains two standalone demo artifacts:

- `static_predictor.js` — a tiny Node module that exports a `predict` function. It returns a static/deterministic fake recommendation for testing.
- `python_model/` — a tiny FastAPI example that trains a toy RandomForest on synthetic price data and exposes `/predict` and `/train`. See `python_model/README.md` for details.

These files are intentionally static examples and are not imported or wired into the main frontend app.
Agent Server
------------

This is a minimal demo agent that exposes a prediction endpoint used by the Org Dashboard.

Run:

```bash
cd server
npm install
npm start

```

The Node agent listens on `http://localhost:4001` and accepts POST `/api/agent/predict` with JSON body `{ prices: number[], model?: 'sma'|'rf'|'svm' }`.

Python training + server (optional):

1. Install Python dependencies (use venv recommended):

```bash
cd server/python_server
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. Train and run demo server:

```bash
python train_and_serve.py  # starts FastAPI on port 5001
# in another terminal you can run:
# curl -X POST http://localhost:5001/train-demo
```

The Node agent will attempt to call `http://localhost:5001/predict` first and fallback to the JS predictor if the Python server is not reachable.
