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
