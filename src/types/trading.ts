export interface TradingPair {
  id: number;
  pair: string;
  status: 'Active' | 'Paused';
  position: 'Long' | 'Short' | 'Neutral';
  capacity: number;
  lastAction: string;
  profit: number;
  volume: number;
}
