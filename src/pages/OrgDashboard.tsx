import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingChart } from '@/components/TradingChart';
import { Portfolio } from '@/components/Portfolio';
import { TradeBlotter } from '@/components/TradeBlotter';
import { RealTimeData } from '@/components/RealTimeData';
import { AIRecommendationModal } from '@/components/AIRecommendationModal';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Settings, Brain, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { predictFromPrices } from '@/lib/predictor';

const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

const OrgDashboard = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [tradeAmount, setTradeAmount] = useState<string>(() => {
    try {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        const amt = JSON.parse(demo).basicTradeAmount;
        const num = Number(String(amt).toString().replace(/[^0-9.-]/g, ''));
        return String(isFinite(num) && num > 0 ? num : 1000);
      }
    } catch (err) { console.warn('Failed to read demo_user', err); }
    return '1000';
  });

  const [minTradeAmount, setMinTradeAmount] = useState<number>(() => {
    try {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        const amt = JSON.parse(demo).basicTradeAmount;
        const num = Number(String(amt).toString().replace(/[^0-9.-]/g, ''));
        return isFinite(num) && num > 0 ? num : 100;
      }
    } catch (err) { console.warn('Failed to read demo_user', err); }
    return 100;
  });
  const [currentPrice, setCurrentPrice] = useState(1.0847);
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        const parsed = JSON.parse(demo);
        return { balance: 50000, baseCurrency: parsed.baseCurrency || 'USD', totalProfit: 0, todayProfit: 0, openPositions: 0, totalTrades: 0, totalCapacity: 10000000, deployedCapital: 125000 };
      }
    } catch (err) { console.warn('Failed to read demo_user', err); }
    return { balance: 50000, baseCurrency: 'USD', totalProfit: 0, todayProfit: 0, openPositions: 0, totalTrades: 0, totalCapacity: 10000000, deployedCapital: 125000 };
  });

  interface Trade { id: string; timestamp: string; pair: string; type: 'BUY'|'SELL'; amount: number; entry_price: number; exit_price?: number|null; status: 'OPEN'|'CLOSED'|'PENDING'; profit: number; algorithm: string; trading_capacity?: number; settlement_capacity?: number; quantity?: number; best_deal?: number | null; }
  const [trades, setTrades] = useState<Trade[]>([]);

  // trading pairs management for org (from user-provided reference)
  const [tradingPairs, setTradingPairs] = useState(() => {
    try {
      const saved = localStorage.getItem('org_trading_pairs');
      return saved ? JSON.parse(saved) : [
        { id: 1, pair: 'EUR/USD', status: 'Active', position: 'Neutral', capacity: 200000, lastAction: 'Initialized', profit: 0, volume: 0 },
        { id: 2, pair: 'GBP/USD', status: 'Paused', position: 'Neutral', capacity: 150000, lastAction: 'Initialized', profit: 0, volume: 0 }
      ];
    } catch (e) { return []; }
  });
  const [showAddPairModal, setShowAddPairModal] = useState(false);
  const [newPairData, setNewPairData] = useState({ pair: '', capacity: '100000' });

  useEffect(() => { try { localStorage.setItem('org_trading_pairs', JSON.stringify(tradingPairs)); } catch (e) { console.warn('save pairs failed', e);} }, [tradingPairs]);

  const handleAddPair = () => {
    if (!newPairData.pair) {
      console.log('Error: Please select a currency pair');
      return;
    }

    const newPair = {
      id: Date.now(),
      pair: newPairData.pair,
      status: 'Paused',
      position: 'Neutral',
      capacity: parseInt(newPairData.capacity, 10),
      lastAction: 'Just added',
      profit: 0,
      volume: 0,
    };

    setTradingPairs((prev) => [...prev, newPair]);
    setNewPairData({ pair: '', capacity: '100000' });
    setShowAddPairModal(false);

    console.log(`Pair Added Successfully: ${newPair.pair}`);
  };

  const removePair = (id: number) => {
    setTradingPairs((prev) => prev.filter((pair) => pair.id !== id));
    console.log('Pair Removed');
  };

  const togglePairStatus = (id: number) => {
    setTradingPairs(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Paused' : 'Active', lastAction: p.status === 'Active' ? 'Paused by admin' : 'Resumed by admin' } : p));
  };

  // API keys management (4 slots) — saved to localStorage
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    try { const raw = localStorage.getItem('org_api_keys'); return raw ? JSON.parse(raw) : ['', '', '', '']; } catch (e) { return ['', '', '', '']; }
  });
  useEffect(() => { try { localStorage.setItem('org_api_keys', JSON.stringify(apiKeys)); } catch (e) { console.warn('save keys failed', e); } }, [apiKeys]);

  // keep a small history of recent prices for the predictor
  const priceHistory = useRef<number[]>([]);
  // chart history at 5-minute resolution (timestamps in ms)
  const chartHistory = useRef<Array<{ ts: number; price: number }>>([]);
  const lastBucketTs = useRef<number>(Date.now());

  // generate initial synthetic 5-minute history (default: last 24 hours -> 288 points)
  const generateFiveMinHistory = (centerPrice: number, points = 288) => {
    const out: Array<{ ts: number; price: number }> = [];
    const now = Date.now();
    const intervalMs = 5 * 60 * 1000;
    let price = centerPrice;
    for (let i = points - 1; i >= 0; i--) {
      // iterate backward so earliest first
      const ts = now - i * intervalMs;
      // small realistic volatility per 5-min
      const vol = 0.0003;
      const delta = (Math.random() - 0.5) * vol;
      price = Math.max(0.00001, Number((price + delta).toFixed(5)));
      out.push({ ts, price });
    }
    return out;
  };

  // refs to allow the agent effect to read latest state without listing dependencies
  const portfolioRef = useRef(portfolio);
  const currentPriceRef = useRef(currentPrice);
  const minTradeAmountRef = useRef(minTradeAmount);
  const selectedPairRef = useRef(selectedPair);

  useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);
  useEffect(() => { currentPriceRef.current = currentPrice; }, [currentPrice]);
  useEffect(() => { minTradeAmountRef.current = minTradeAmount; }, [minTradeAmount]);
  useEffect(() => { selectedPairRef.current = selectedPair; }, [selectedPair]);

  // Auto-agent: runs once on mount and simulates continuous decision-making every 5s
  useEffect(() => {
    let mounted = true;
    const runAgent = () => {
      const hist = priceHistory.current.slice(-50);
      const pred = predictFromPrices(hist);
      // simple mapping: BUY/SELL/ HOLD
      if (!mounted) return;
      if (pred.signal === 'HOLD') return;

      const action = pred.signal;
      const confidence = pred.confidence;
      // determine size based on deployedCapital and capacity (use refs)
      const capacity = portfolioRef.current.totalCapacity ?? 10000000;
      const deployed = portfolioRef.current.deployedCapital ?? 125000;
      const tradeNotional = Math.max(minTradeAmountRef.current, Math.floor(deployed * 0.02));
      const id = `AGT${Date.now()}`;
      const timestamp = new Date().toISOString();
      const entry_price = currentPriceRef.current;
      const quantity = Math.floor(tradeNotional / entry_price) || 1;
      const best_deal = entry_price + (action === 'BUY' ? -0.0005 : 0.0005);

      const newTrade: Trade = {
        id,
        timestamp,
        pair: selectedPairRef.current,
        type: action as 'BUY' | 'SELL',
        amount: tradeNotional,
        trading_capacity: capacity,
        settlement_capacity: Math.floor(deployed),
        quantity,
        best_deal,
        entry_price,
        exit_price: null,
        status: 'OPEN',
        profit: 0,
        algorithm: 'AutoAgent'
      };

      setTrades(prev => [newTrade, ...prev]);
      setPortfolio(prev => ({ ...prev, deployedCapital: (prev.deployedCapital ?? 125000) + tradeNotional, openPositions: prev.openPositions + 1, totalTrades: prev.totalTrades + 1 }));
      // if it's sell, maybe realize immediate small profit/loss simulation
      if (action === 'SELL') {
        const realized = (Math.random() - 0.4) * tradeNotional * 0.01;
        setPortfolio(prev => ({ ...prev, balance: prev.balance + realized, totalProfit: prev.totalProfit + realized, todayProfit: prev.todayProfit + realized }));
      }
    };

    // initial run
    runAgent();
    const id = setInterval(runAgent, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    // initialize chartHistory once (5-min resolution)
    if (!chartHistory.current.length) {
      chartHistory.current = generateFiveMinHistory(currentPrice, 288);
      lastBucketTs.current = chartHistory.current[chartHistory.current.length - 1].ts;
    }

    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.002;
        const next = Number((prev + change).toFixed(5));
        // per-second raw history for predictor
        priceHistory.current.push(next);
        if (priceHistory.current.length > 60 * 60 * 24) priceHistory.current.shift(); // cap by 24h seconds

        // update the 5-min chart bucket when 5 minutes elapsed
        const now = Date.now();
        if (now - lastBucketTs.current >= 5 * 60 * 1000) {
          // push new 5-min point (use latest price)
          chartHistory.current.push({ ts: now, price: next });
          // keep last 288 points (~24h)
          if (chartHistory.current.length > 288) chartHistory.current.shift();
          lastBucketTs.current = now;
        } else {
          // optionally update last point's price to reflect intra-bucket movement
          const last = chartHistory.current[chartHistory.current.length - 1];
          if (last) last.price = next;
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trading is manual for organization dashboard; ML agent integration is handled elsewhere.


  const handleCloseTrade = (tradeId: string) => {
    let realizedProfit = 0;
    setTrades(prev => prev.map(t => {
      if (t.id !== tradeId) return t;
      const exit_price = currentPrice;
      const direction = t.type === 'BUY' ? 1 : -1;
      const profit = ((exit_price - t.entry_price) / t.entry_price) * t.amount * direction;
      realizedProfit = profit;
      return { ...t, exit_price, status: 'CLOSED', profit };
    }));

    setPortfolio(prev => ({ ...prev, balance: prev.balance + realizedProfit, totalProfit: prev.totalProfit + realizedProfit, openPositions: Math.max(0, prev.openPositions - 1) }));
    toast({ title: 'Org Trade Closed', description: `P/L ${realizedProfit.toFixed(2)}` });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organization Dashboard</h1>
            <p className="text-muted-foreground">Auto-trading dashboard for organizations (demo)</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => {
              try { localStorage.removeItem('demo_user'); } catch (e) { console.warn('logout failed', e); }
              navigate('/auth');
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Portfolio portfolio={portfolio} minTradeAmount={minTradeAmount} trades={trades} />
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="chart" className="space-y-4">
              <TabsList>
                <TabsTrigger value="chart">Price Chart</TabsTrigger>
                <TabsTrigger value="blotter">Trade Blotter</TabsTrigger>
              </TabsList>

              <TabsContent value="chart">
                <TradingChart selectedPair={selectedPair} currentPrice={currentPrice} data={priceHistory.current.map((p, i) => ({ time: new Date(Date.now() - (priceHistory.current.length - 1 - i) * 1000).toLocaleTimeString('en-US', { hour12: false }), price: Number(p.toFixed(5)), sma: undefined, volume: Math.floor(Math.random()*500000) }))} />
              </TabsContent>
              <TabsContent value="blotter"><TradeBlotter trades={trades} currentPrice={currentPrice} onCloseTrade={handleCloseTrade} /></TabsContent>
            </Tabs>
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Keys (for real-time feeds)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[0,1,2,3].map(idx => (
                      <div key={idx} className="flex gap-2">
                        <Input placeholder={`API Key ${idx+1}`} value={apiKeys[idx] ?? ''} onChange={(e) => setApiKeys(prev => { const copy = [...prev]; copy[idx] = e.target.value; return copy; })} />
                        <Button size="sm" onClick={() => { try { navigator.clipboard?.writeText(apiKeys[idx] ?? ''); toast({ title: 'Copied', description: `API key ${idx+1} copied` }); } catch (e) { console.warn(e); } }}>Copy</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Managed Pairs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Pair</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Position</th>
                          <th className="text-left py-3 px-4 font-medium">Capacity</th>
                          <th className="text-left py-3 px-4 font-medium">Last Action</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradingPairs.map((pair: { id: number; pair: string; status: string; position: string; capacity: number; lastAction: string; profit: number; volume: number }) => (
                          <tr key={pair.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono font-medium">{pair.pair}</td>
                            <td className="py-3 px-4"><Badge variant={pair.status === 'Active' ? 'default' : 'secondary'}>{pair.status}</Badge></td>
                            <td className="py-3 px-4"><Badge variant="outline" className={pair.position === 'Long' ? 'text-green-600 border-green-600' : pair.position === 'Short' ? 'text-red-600 border-red-600' : 'text-gray-500'}>{pair.position}</Badge></td>
                            <td className="py-3 px-4 font-mono">{pair.capacity.toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-500">{pair.lastAction}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => togglePairStatus(pair.id)}>{pair.status === 'Active' ? '⏸' : '▶'}</Button>
                                <Button size="sm" variant="outline" onClick={() => console.log('Edit feature coming soon')}>✏</Button>
                                <Button size="sm" variant="outline" onClick={() => removePair(pair.id)} className="text-red-600 hover:text-red-600">🗑</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <AIRecommendationModal open={false} onOpenChange={() => {}} currentPair={selectedPair} portfolio={portfolio} onApplyRecommendations={() => {}} />
    </div>
  );
};

export default OrgDashboard;
