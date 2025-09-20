export interface StaticRec {
  pair: string;
  action: 'BUY' | 'SELL';
  amount: number;
  confidence: number;
}

export function staticPredict(prices: number[] = [], pair = 'EUR/USD', balance = 10000): { signal: string; confidence: number; recommendations: StaticRec[] } {
  const last = prices.length ? prices[prices.length - 1] : 1.0;
  const action = (Math.round(last * 1000) % 2) === 0 ? 'BUY' : 'SELL';
  const rec = {
    pair,
    action: action as 'BUY' | 'SELL',
    amount: Math.floor(balance * 0.1),
    confidence: 0.78
  };
  return { signal: action, confidence: 0.78, recommendations: [rec] };
}
