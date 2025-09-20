import { useState, useEffect } from 'react';
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

const currencyPairs = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'USD/INR', 'EUR/INR', 'GBP/INR'
];

const algorithms = [
  { id: 'sma', name: 'Simple Moving Average (SMA)', enabled: true },
  { id: 'rsi', name: 'Relative Strength Index (RSI)', enabled: false },
  { id: 'bollinger', name: 'Bollinger Bands', enabled: false },
  { id: 'macd', name: 'MACD', enabled: false },
];

const Dashboard = () => {
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
  // profitRate removed — P/L is derived from real prices
  const [enabledAlgorithms, setEnabledAlgorithms] = useState(algorithms);
  const [autoTrading, setAutoTrading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(1.0847);
  const [showAIModal, setShowAIModal] = useState(false);
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState({
    balance: 5000,
    baseCurrency: 'USD',
    totalProfit: 234.56,
    todayProfit: 45.23,
    openPositions: 3,
    totalTrades: 127
  });

  interface Trade {
    id: string;
    timestamp: string;
    pair: string;
    type: 'BUY' | 'SELL';
    amount: number;
    entry_price: number;
    exit_price?: number | null;
    status: 'OPEN' | 'CLOSED' | 'PENDING';
    profit: number;
    algorithm: string;
  }

  const [trades, setTrades] = useState<Trade[]>([]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.002;
        return Number((prev + change).toFixed(5));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTrade = (type: 'buy' | 'sell', amountOverride?: number) => {
    const requested = amountOverride ? amountOverride : Number(tradeAmount || 0);

    // If requested amount is less than minimum, use the minimum (user wants to trade at least the min)
    const executedAmount = requested < minTradeAmount ? minTradeAmount : requested;

    // Create trade with timestamp and current price using executedAmount
    const id = `TXN${Date.now()}`;
    const timestamp = new Date().toISOString();
    const entry_price = currentPrice;
    const newTrade: Trade = {
      id,
      timestamp,
      pair: selectedPair,
      type: (type === 'buy' ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
      amount: executedAmount,
      entry_price,
      exit_price: null,
      status: 'OPEN',
      profit: 0,
      algorithm: 'Manual'
    };

    // Example margin rate: 1% of notional is reserved as used margin
    const marginUsed = executedAmount * 0.01;

    // compute new balance deterministically so we can update tradeAmount afterwards
    setTrades(prev => [newTrade, ...prev]);
    setPortfolio(prev => {
      const newBalance = prev.balance - marginUsed;
      // update tradeAmount input to reflect a sensible next default: keep at least minTradeAmount or available balance
      const nextTradeAmount = Math.max(minTradeAmount, Math.floor(newBalance));
      // update the visible input immediately
      setTradeAmount(String(nextTradeAmount > 0 ? nextTradeAmount : 0));
      return ({
        ...prev,
        balance: newBalance,
        openPositions: prev.openPositions + 1,
        totalTrades: prev.totalTrades + 1
      });
    });

    toast({
      title: `${type.toUpperCase()} Order Executed`,
      description: `${type === 'buy' ? 'Bought' : 'Sold'} ${executedAmount} ${selectedPair} at ${currentPrice}`,
    });
  };

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

    // Update portfolio based on closed trade
    setPortfolio(prev => ({
      ...prev,
      balance: prev.balance + (realizedProfit + (/* release margin */ 0)),
      totalProfit: prev.totalProfit + realizedProfit,
      openPositions: Math.max(0, prev.openPositions - 1)
    }));

    toast({ title: 'Trade Closed', description: `Trade ${tradeId} closed. P/L ${realizedProfit.toFixed(2)}` });
  };

  const applyRecommendations = (recs: Array<{ action: string; amount: number }>) => {
    recs.forEach(rec => {
      const type = rec.action.toLowerCase() === 'buy' ? 'buy' : 'sell';
      handleTrade(type as 'buy' | 'sell', rec.amount);
    });
  };

  const toggleAlgorithm = (id: string, enabled: boolean) => {
    setEnabledAlgorithms(prev =>
      prev.map(alg => alg.id === id ? { ...alg, enabled } : alg)
    );
  };

  const toggleAutoTrading = () => {
    setAutoTrading(!autoTrading);
    toast({
      title: autoTrading ? "Auto Trading Disabled" : "Auto Trading Enabled",
      description: autoTrading 
        ? "Manual trading mode activated" 
        : "AI algorithms will now execute trades automatically",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              AlphaFxTrader
            </h1>
            <p className="text-muted-foreground">Professional Forex Trading Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={autoTrading ? "destructive" : "default"}
              onClick={toggleAutoTrading}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {autoTrading ? "Disable Auto Trading" : "Enable Auto Trading"}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              try { localStorage.removeItem('demo_user'); } catch (e) { console.warn('logout localStorage remove failed', e); }
              navigate('/auth');
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Real-time Data Row */}
        <RealTimeData selectedPair={selectedPair} currentPrice={currentPrice} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Portfolio & Trading Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Portfolio portfolio={portfolio} minTradeAmount={minTradeAmount} trades={trades} />
            
            {/* Trading Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Trading Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Currency Pair</Label>
                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyPairs.map(pair => (
                        <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trade Amount</Label>
                  <Input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Trade Amount ({portfolio.baseCurrency})</Label>
                  <Input
                    type="number"
                    value={minTradeAmount}
                    onChange={(e) => setMinTradeAmount(Number(e.target.value))}
                    placeholder="Minimum amount"
                  />
                </div>

                {/* Profit Rate removed — P/L uses market prices */}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleTrade('buy')} 
                      className="flex-1 bg-success hover:bg-success/90"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      BUY
                    </Button>
                    <Button 
                      onClick={() => handleTrade('sell')} 
                      variant="destructive" 
                      className="flex-1"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      SELL
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setShowAIModal(true)}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Using AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Algorithm Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trading Algorithms
                </CardTitle>
                <CardDescription>
                  Configure AI trading strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {enabledAlgorithms.map(algorithm => (
                  <div key={algorithm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={algorithm.id}
                      checked={algorithm.enabled}
                      onCheckedChange={(checked) => 
                        toggleAlgorithm(algorithm.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={algorithm.id} className="text-sm">
                      {algorithm.name}
                    </Label>
                    {algorithm.enabled && (
                      <Badge variant="secondary" className="ml-auto">Active</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Charts and Data */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chart" className="space-y-4">
              <TabsList>
                <TabsTrigger value="chart">Price Chart</TabsTrigger>
                <TabsTrigger value="blotter">Trade Blotter</TabsTrigger>
                <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="space-y-4">
                <TradingChart selectedPair={selectedPair} currentPrice={currentPrice} />
              </TabsContent>
              
              <TabsContent value="blotter">
                <TradeBlotter trades={trades} currentPrice={currentPrice} onCloseTrade={handleCloseTrade} />
              </TabsContent>
              
              <TabsContent value="analysis">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Analysis</CardTitle>
                    <CardDescription>Algorithm-based market analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Advanced technical analysis dashboard will be implemented here
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <AIRecommendationModal 
        open={showAIModal}
        onOpenChange={setShowAIModal}
        currentPair={selectedPair}
        portfolio={portfolio}
        onApplyRecommendations={applyRecommendations}
      />
    </div>
  );
};

export default Dashboard;