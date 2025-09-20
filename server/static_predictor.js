// Simple static predictor for demo purposes. Not connected to the app.
module.exports = {
  predict: function (prices, opts = {}) {
    // Return a deterministic fake recommendation based on last price
    const last = (prices && prices.length) ? prices[prices.length - 1] : 1.0;
    const action = last % 2 > 1 ? 'BUY' : 'SELL';
    return {
      signal: action,
      confidence: 0.75,
      recommendations: [{ pair: opts.pair || 'EUR/USD', action, amount: Math.floor((opts.balance || 10000) * 0.1), confidence: 0.75 }]
    };
  }
};
