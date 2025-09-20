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
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Settings, Brain } from 'lucide-react';
import { predictFromPrices } from '@/lib/predictor';

const currencyPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

const OrgDashboard = () => {
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
  const [autoTrading, setAutoTrading] = useState(false);
  const [model, setModel] = useState<'sma'|'rf'|'svm'>('sma');
  const [currentPrice, setCurrentPrice] = useState(1.0847);
  const [portfolio, setPortfolio] = useState(() => {
    try {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        const parsed = JSON.parse(demo);
        return { balance: 50000, baseCurrency: parsed.baseCurrency || 'USD', totalProfit: 0, todayProfit: 0, openPositions: 0, totalTrades: 0 };
      }
    } catch (err) { console.warn('Failed to read demo_user', err); }
    return { balance: 50000, baseCurrency: 'USD', totalProfit: 0, todayProfit: 0, openPositions: 0, totalTrades: 0 };
  });

  interface Trade { id: string; timestamp: string; pair: string; type: 'BUY'|'SELL'; amount: number; entry_price: number; exit_price?: number|null; status: 'OPEN'|'CLOSED'|'PENDING'; profit: number; algorithm: string; }
  const [trades, setTrades] = useState<Trade[]>([]);

  // keep a small history of recent prices for the predictor
  const priceHistory = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.002;
        const next = Number((prev + change).toFixed(5));
        priceHistory.current.push(next);
        if (priceHistory.current.length > 200) priceHistory.current.shift();
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-trade effect: run predictor periodically and execute on strong signals
  useEffect(() => {
    if (!autoTrading) return;
    const id = setInterval(() => {
      const hist = priceHistory.current.slice(-50);
      // call backend agent for prediction
      try {
        fetch(`http://localhost:4001/api/agent/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prices: hist, model })
        })
        .then(r => r.json())
        .then(pred => {
          if (!pred) return;
          if (pred.signal === 'BUY' && pred.confidence > 0.7) {
            handleTrade.current?.('buy', Math.max(minTradeAmount, Number(tradeAmount)));
            toast({ title: 'Auto-Trade', description: `Agent signaled BUY (${(pred.confidence*100).toFixed(0)}%)` });
          } else if (pred.signal === 'SELL' && pred.confidence > 0.7) {
            handleTrade.current?.('sell', Math.max(minTradeAmount, Number(tradeAmount)));
            toast({ title: 'Auto-Trade', description: `Agent signaled SELL (${(pred.confidence*100).toFixed(0)}%)` });
          }
        })
        .catch(err => console.warn('agent fetch error', err));
      } catch (err) {
        console.warn('agent call failed', err);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [autoTrading, tradeAmount, minTradeAmount, model]);

  const handleTrade = useRef<((type: 'buy'|'sell', amountOverride?: number) => void) | null>(null);

  // concrete implementation stored in ref so effect dependencies are stable
  useEffect(() => {
    handleTrade.current = (type: 'buy'|'sell', amountOverride?: number) => {
      const requested = amountOverride ?? Number(tradeAmount || 0);
      const executedAmount = requested < minTradeAmount ? minTradeAmount : requested;
      const id = `ORG${Date.now()}`;
      const timestamp = new Date().toISOString();
      const entry_price = currentPrice;
      const newTrade: Trade = { id, timestamp, pair: selectedPair, type: type === 'buy' ? 'BUY' : 'SELL', amount: executedAmount, entry_price, exit_price: null, status: 'OPEN', profit: 0, algorithm: 'ML-Org' };

      const marginUsed = executedAmount * 0.01;
      setTrades(prev => [newTrade, ...prev]);
      setPortfolio(prev => ({ ...prev, balance: prev.balance - marginUsed, openPositions: prev.openPositions + 1, totalTrades: prev.totalTrades + 1 }));
    };
  }, [tradeAmount, minTradeAmount, selectedPair, currentPrice]);


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
            <Button onClick={() => setAutoTrading(v => !v)} variant={autoTrading ? 'destructive' : 'default'}>
              {autoTrading ? 'Disable Auto-Trade' : 'Enable Auto-Trade'}
            </Button>
            <Button onClick={() => {
              const pred = predictFromPrices(priceHistory.current.slice(-50));
              toast({ title: `Model: ${pred.signal}`, description: `${pred.reason} — ${(pred.confidence*100).toFixed(0)}%` });
            }} variant="outline">Run Model Now</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Portfolio portfolio={portfolio} minTradeAmount={minTradeAmount} trades={trades} />

            <Card>
              <CardHeader>
                <CardTitle>Trading Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Currency Pair</Label>
                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencyPairs.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trade Amount</Label>
                  <Input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Trade Amount ({portfolio.baseCurrency})</Label>
                  <Input type="number" value={minTradeAmount} onChange={e => setMinTradeAmount(Number(e.target.value))} />
                </div>

                {/* model selection is handled by backend agent */}

                <div className="flex gap-2">
                  <Button onClick={() => handleTrade.current?.('buy')} className="flex-1 bg-success">BUY</Button>
                  <Button onClick={() => handleTrade.current?.('sell')} variant="destructive" className="flex-1">SELL</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs defaultValue="chart" className="space-y-4">
              <TabsList>
                <TabsTrigger value="chart">Price Chart</TabsTrigger>
                <TabsTrigger value="blotter">Trade Blotter</TabsTrigger>
              </TabsList>

              <TabsContent value="chart"><TradingChart selectedPair={selectedPair} currentPrice={currentPrice} /></TabsContent>
              <TabsContent value="blotter"><TradeBlotter trades={trades} currentPrice={currentPrice} onCloseTrade={handleCloseTrade} /></TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <AIRecommendationModal open={false} onOpenChange={() => {}} currentPair={selectedPair} portfolio={portfolio} onApplyRecommendations={() => {}} />
    </div>
  );
};

export default OrgDashboard;
