Python demo model (toy)
========================

This folder contains a tiny demo showing how to train a RandomForest on
synthetic price data and expose a `/predict` endpoint using FastAPI.

It is intentionally standalone and not wired into the main application.

Quick start (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python train_and_serve.py
# or to run as an API server:
uvicorn train_and_serve:app --reload --port 5001
```
