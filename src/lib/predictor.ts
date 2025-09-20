export type Signal = 'BUY' | 'SELL' | 'HOLD';

export interface Prediction {
  signal: Signal;
  confidence: number; // 0..1
  reason?: string;
}

// Very small moving-average crossover predictor for demo purposes.
// Accepts an array of recent prices (most recent last).
export function predictFromPrices(prices: number[]): Prediction {
  if (!prices || prices.length < 3) return { signal: 'HOLD', confidence: 0, reason: 'insufficient data' };

  const shortWindow = 3;
  const longWindow = Math.min(10, prices.length);

  const sma = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const short = sma(prices.slice(-shortWindow));
  const long = sma(prices.slice(-longWindow));

  const diff = (short - long) / long;

  // Confidence grows with the magnitude of the divergence and number of samples
  const baseConfidence = Math.min(1, Math.abs(diff) * 5);
  const sampleFactor = Math.min(1, prices.length / 50);
  const confidence = Math.max(0, Math.min(1, baseConfidence * (0.4 + 0.6 * sampleFactor)));

  if (diff > 0.005) {
    return { signal: 'BUY', confidence, reason: `short(${short.toFixed(4)})>long(${long.toFixed(4)})` };
  }
  if (diff < -0.005) {
    return { signal: 'SELL', confidence, reason: `short(${short.toFixed(4)})<long(${long.toFixed(4)})` };
  }
  return { signal: 'HOLD', confidence, reason: 'no clear crossover' };
}
