import { Prediction } from './predictor';

// Helper: simple SMA
const sma = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

function stddev(arr: number[]) {
  const m = sma(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

// Random Forest-like ensemble of simple decision stumps.
export function rfPredict(prices: number[]): Prediction {
  if (!prices || prices.length < 5) return { signal: 'HOLD', confidence: 0, reason: 'insufficient data' };

  const short = sma(prices.slice(-3));
  const medium = sma(prices.slice(-8));
  const long = sma(prices.slice(-20 > prices.length ? 0 : -20));
  const momentum = (prices[prices.length - 1] - prices[Math.max(0, prices.length - 6)]) / prices[Math.max(0, prices.length - 6)];
  const vol = stddev(prices.slice(-20));

  // Create several simple 'trees' (rules) that vote BUY/SELL/HOLD
  const votes: Array<'BUY'|'SELL'|'HOLD'> = [];

  // Tree 1: MA crossover
  if (short > medium * 1.001) votes.push('BUY');
  else if (short < medium * 0.999) votes.push('SELL');
  else votes.push('HOLD');

  // Tree 2: momentum
  if (momentum > 0.002) votes.push('BUY');
  else if (momentum < -0.002) votes.push('SELL');
  else votes.push('HOLD');

  // Tree 3: trend vs long
  if (short > long * 1.002) votes.push('BUY');
  else if (short < long * 0.998) votes.push('SELL');
  else votes.push('HOLD');

  // Tree 4: volatility filter (avoid trading in high vol unless momentum strong)
  if (vol > 0.001 && Math.abs(momentum) < 0.0005) votes.push('HOLD');
  else votes.push(momentum > 0 ? 'BUY' : 'SELL');

  // Tally votes
  const counts = { BUY: 0, SELL: 0, HOLD: 0 } as Record<string, number>;
  votes.forEach(v => counts[v]++);

  const winner = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));

  // confidence roughly proportional to vote margin and feature strength
  const margin = Math.max(counts['BUY'], counts['SELL']) - counts['HOLD'];
  const signalStrength = Math.abs(short - long) / long + Math.abs(momentum) * 5;
  const baseConfidence = Math.min(1, (margin / votes.length) + Math.min(1, signalStrength));

  return { signal: winner as Prediction['signal'], confidence: Math.max(0, Math.min(1, baseConfidence)), reason: `rf votes:${votes.join(',')}` };
}

// SVM-like linear classifier over simple features. Produces a signed score and sigmoid confidence.
export function svmPredict(prices: number[]): Prediction {
  if (!prices || prices.length < 5) return { signal: 'HOLD', confidence: 0, reason: 'insufficient data' };

  const f1 = sma(prices.slice(-3));
  const f2 = sma(prices.slice(-10));
  const f3 = (prices[prices.length - 1] - prices[Math.max(0, prices.length - 6)]) / prices[Math.max(0, prices.length - 6)];
  const f4 = stddev(prices.slice(-20));

  // weights chosen heuristically for demo
  const w = [1.2, -1.0, 8.0, -3.0];
  const bias = -0.02;

  // normalize features a bit
  const features = [f1, f2, f3, f4];
  const score = features.reduce((s, fv, i) => s + fv * w[i], bias);

  // logistic sigmoid for confidence
  const conf = 1 / (1 + Math.exp(-Math.min(10, Math.max(-10, score * 50))));

  if (score > 0.01) return { signal: 'BUY', confidence: conf, reason: `svm score=${score.toFixed(4)}` };
  if (score < -0.01) return { signal: 'SELL', confidence: 1 - conf, reason: `svm score=${score.toFixed(4)}` };
  return { signal: 'HOLD', confidence: conf * 0.5, reason: 'svm neutral' };
}
