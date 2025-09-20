const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { predictFromPrices } = require('../src/lib/predictor');
const { rfPredict, svmPredict } = require('../src/lib/models');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// POST /api/agent/predict
// body: { prices: number[], model?: 'sma'|'rf'|'svm' }
app.post('/api/agent/predict', (req, res) => {
  try {
    const { prices, model } = req.body || {};
    if (!Array.isArray(prices) || prices.length === 0) return res.status(400).json({ error: 'prices required' });
    // Try Python service first
    const pythonUrl = `http://localhost:5001/predict`;
    const fetch = require('node-fetch');
    fetch(pythonUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prices, model }) , timeout: 2000 })
      .then(r => r.json())
      .then(pyRes => {
        if (pyRes && pyRes.signal) return res.json(pyRes);
        // fallback to JS
        let pred = predictFromPrices(prices);
        if (model === 'rf') pred = rfPredict(prices);
        else if (model === 'svm') pred = svmPredict(prices);
        return res.json(pred);
      })
      .catch(err => {
        // python service unavailable, fallback
        let pred = predictFromPrices(prices);
        if (model === 'rf') pred = rfPredict(prices);
        else if (model === 'svm') pred = svmPredict(prices);
        return res.json(pred);
      });
  } catch (err) {
    console.error('predict error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

const port = process.env.PORT || 4001;
app.listen(port, () => console.log(`Agent listening on ${port}`));
