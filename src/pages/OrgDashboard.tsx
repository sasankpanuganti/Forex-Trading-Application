import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// AI Agent Configuration
const AI_AGENT_CONFIG = {
  // Trading parameters
  riskPerTrade: 0.02, // 2% risk per trade
  takeProfit: 0.003,  // 0.3% take profit
  stopLoss: 0.0015,   // 0.15% stop loss
  maxOpenTrades: 3,   // Maximum number of open trades
  tradeCooldown: 30000, // 30 seconds between trades
  
  // Technical indicators configuration
  rsiPeriod: 14,
  rsiOverbought: 70,
  rsiOversold: 30,
  
  // Moving averages
  fastMA: 9,
  slowMA: 21,
  
  // Volatility
  atrPeriod: 14,
  
  // Risk management
  maxDailyLossPercent: 2, // 2% max daily drawdown
  maxPositionSize: 0.1,   // 10% of portfolio per position
};

// AI Trading Agent Class
class AITradingAgent {
  private trades: any[] = [];
  private lastTradeTime: number = 0;
  private dailyPnL: number = 0;
  private dailyStartBalance: number = 0;
  
  constructor(private config: typeof AI_AGENT_CONFIG) {}
  
  // Calculate technical indicators
  private calculateIndicators(prices: number[]) {
    const rsi = this.calculateRSI(prices, this.config.rsiPeriod);
    const { fastMA, slowMA } = this.calculateMAs(prices);
    const atr = this.calculateATR(prices, this.config.atrPeriod);
    const currentPrice = prices[prices.length - 1];
    
    return { rsi, fastMA, slowMA, atr, currentPrice };
  }
  
  // Simple Moving Average
  private calculateSMA(prices: number[], period: number): number[] {
    return prices.map((_, i) => {
      if (i < period - 1) return 0;
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      return sum / period;
    });
  }
  
  // Moving Averages
  private calculateMAs(prices: number[]) {
    return {
      fastMA: this.calculateSMA(prices, this.config.fastMA),
      slowMA: this.calculateSMA(prices, this.config.slowMA)
    };
  }
  
  // Relative Strength Index
  private calculateRSI(prices: number[], period: number): number[] {
    const changes = prices.slice(1).map((price, i) => price - prices[i]);
    const gains = changes.map(change => Math.max(0, change));
    const losses = changes.map(change => Math.abs(Math.min(0, change)));
    
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    const rsi: number[] = Array(period).fill(50);
    
    for (let i = period; i < prices.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      const rs = avgGain / (avgLoss || 0.0001);
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  }
  
  // Average True Range
  private calculateATR(prices: number[], period: number): number {
    const trueRanges: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const high = Math.max(prices[i], prices[i - 1]);
      const low = Math.min(prices[i], prices[i - 1]);
      trueRanges.push(high - low);
    }
    
    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
    return atr;
  }
  
  // Generate trading signal
  generateSignal(prices: number[], currentPosition: 'LONG' | 'SHORT' | 'NONE'): { action: 'BUY' | 'SELL' | 'HOLD'; confidence: number } {
    if (prices.length < Math.max(this.config.slowMA, this.config.rsiPeriod) + 1) {
      return { action: 'HOLD', confidence: 0 };
    }
    
    const { rsi, fastMA, slowMA, atr, currentPrice } = this.calculateIndicators(prices);
    const lastRsi = rsi[rsi.length - 1];
    const prevRsi = rsi[rsi.length - 2] || 50;
    const lastFastMA = fastMA[fastMA.length - 1];
    const lastSlowMA = slowMA[slowMA.length - 1];
    const prevFastMA = fastMA[fastMA.length - 2] || 0;
    const prevSlowMA = slowMA[slowMA.length - 2] || 0;
    
    // Check for buy signals
    const buySignal = 
      (lastRsi < this.config.rsiOversold && prevRsi < lastRsi) || // RSI oversold and starting to rise
      (lastFastMA > lastSlowMA && prevFastMA <= prevSlowMA);       // Golden cross
    
    // Check for sell signals
    const sellSignal = 
      (lastRsi > this.config.rsiOverbought && prevRsi > lastRsi) || // RSI overbought and starting to fall
      (lastFastMA < lastSlowMA && prevFastMA >= prevSlowMA);        // Death cross
    
    // Calculate confidence based on multiple factors
    let confidence = 0;
    if (buySignal) {
      confidence = 0.6 + (this.config.rsiOversold - lastRsi) * 0.02; // Up to 0.8 confidence
      if (lastFastMA > lastSlowMA) confidence += 0.15;               // Additional confidence for trend confirmation
      confidence = Math.min(0.95, confidence);
      return { action: 'BUY', confidence };
    } else if (sellSignal) {
      confidence = 0.6 + (lastRsi - this.config.rsiOverbought) * 0.02; // Up to 0.8 confidence
      if (lastFastMA < lastSlowMA) confidence += 0.15;                 // Additional confidence for trend confirmation
      confidence = Math.min(0.95, confidence);
      return { action: 'SELL', confidence };
    }
    
    return { action: 'HOLD', confidence: 0.1 }; // Default to hold with low confidence
  }
  
  // Check if we can open a new trade
  canTrade(currentTime: number, openPositions: number): boolean {
    const timeSinceLastTrade = currentTime - this.lastTradeTime;
    return (
      timeSinceLastTrade >= this.config.tradeCooldown &&
      openPositions < this.config.maxOpenTrades &&
      this.dailyPnL > -(this.dailyStartBalance * (this.config.maxDailyLossPercent / 100))
    );
  }
  
  // Update daily P&L tracking
  updateDailyPnL(pnl: number) {
    this.dailyPnL += pnl;
  }
  
  // Reset daily stats
  resetDailyStats(balance: number) {
    this.dailyStartBalance = balance;
    this.dailyPnL = 0;
  }
  
  // Update last trade time
  updateLastTradeTime(time: number) {
    this.lastTradeTime = time;
  }
}

// Trading limits
const DAILY_TRADING_LIMIT = 10000000; // 10 million
const MINIMUM_BALANCE = 1000000; // 1 million

// Types
interface Portfolio {
  balance: number;
  baseCurrency: string;
  totalProfit: number;
  todayProfit: number;
  openPositions: number;
  totalTrades: number;
  totalCapacity: number;
  deployedCapital: number;
  dailyTradingVolume?: number;
}

interface Trade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  entry_price: number;
  exit_price?: number;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  profit: number;
  timestamp: string;
}

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
  const [currentPrice, setCurrentPrice] = useState<number>(1.0847);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    try {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        const parsed = JSON.parse(demo);
        return { 
          balance: 5000000, // Starting with 5 million for org
          baseCurrency: parsed.baseCurrency || 'USD', 
          totalProfit: 0, 
          todayProfit: 0, 
          openPositions: 0, 
          totalTrades: 0, 
          totalCapacity: 10000000, 
          deployedCapital: 0,
          dailyTradingVolume: 0
        };
      }
    } catch (err) { 
      console.warn('Failed to read demo_user', err); 
    }
    return {
      balance: 5000000,
      baseCurrency: 'USD',
      totalProfit: 0,
      todayProfit: 0,
      openPositions: 0,
      totalTrades: 0,
      totalCapacity: 10000000,
      deployedCapital: 0,
      dailyTradingVolume: 0
    };
  });

  // Calculate daily trading volume
  const calculateDailyVolume = useCallback((trades: Trade[]): number => {
    const today = new Date().toDateString();
    return trades
      .filter(trade => new Date(trade.timestamp).toDateString() === today)
      .reduce((sum, trade) => sum + trade.amount, 0);
  }, []);

  // Check if trading is allowed based on limits
  const canTrade = useCallback((amount: number, currentTrades: Trade[] = []): boolean => {
    // Calculate current daily trading volume
    const dailyVolume = calculateDailyVolume(currentTrades);
    const newDailyVolume = dailyVolume + amount;
    const remainingBalance = portfolio.balance - amount;
    
    // Check daily trading limit
    if (newDailyVolume > DAILY_TRADING_LIMIT) {
      const remainingLimit = DAILY_TRADING_LIMIT - dailyVolume;
      toast({
        title: 'Trading Limit Exceeded',
        description: `Daily trading limit of ${DAILY_TRADING_LIMIT.toLocaleString()} would be exceeded. Remaining: ${remainingLimit.toLocaleString()}`,
        variant: 'destructive'
      });
      return false;
    }
    
    // Check minimum balance requirement
    if (remainingBalance < MINIMUM_BALANCE) {
      const requiredBalance = amount + MINIMUM_BALANCE;
      toast({
        title: 'Insufficient Balance',
        description: `Cannot trade. Need ${requiredBalance.toLocaleString()} (${amount.toLocaleString()} + ${MINIMUM_BALANCE.toLocaleString()} minimum balance)`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  }, [portfolio.balance, calculateDailyVolume]);

  // Handle closing a trade
  const handleCloseTrade = useCallback((tradeId: string) => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade || trade.status !== 'OPEN') return;

    // Calculate profit/loss
    const exitPrice = currentPrice;
    const direction = trade.type === 'BUY' ? 1 : -1;
    const profit = ((exitPrice - trade.entry_price) / trade.entry_price) * trade.amount * direction;
    const newBalance = portfolio.balance + trade.amount + profit;

    // Check if closing would violate minimum balance
    if (newBalance < MINIMUM_BALANCE) {
      toast({
        title: 'Cannot Close Trade',
        description: `Closing this trade would bring balance below minimum required ${MINIMUM_BALANCE.toLocaleString()}`,
        variant: 'destructive'
      });
      return;
    }

    // Update the trade with exit details
    setTrades(prevTrades => 
      prevTrades.map(t => 
        t.id === tradeId 
          ? { 
              ...t, 
              exit_price: exitPrice,
              status: 'CLOSED',
              profit,
              timestamp: new Date().toISOString()
            } 
          : t
      )
    );

    // Update portfolio
    setPortfolio(prev => ({
      ...prev,
      balance: newBalance,
      totalProfit: prev.totalProfit + profit,
      openPositions: Math.max(0, prev.openPositions - 1),
      todayProfit: prev.todayProfit + profit
    }));

    // Show success notification
    toast({
      title: 'Trade Closed',
      description: `Realized P/L: ${profit >= 0 ? '+' : ''}${profit.toFixed(2)}`,
      variant: profit >= 0 ? 'default' : 'destructive'
    });
  };

  // Execute trade with limit checks
  const executeTrade = useCallback((type: 'BUY' | 'SELL', amount: number): boolean => {
    if (!canTrade(amount, trades)) {
      return false;
    }
    
    // Create new trade
    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      pair: selectedPair,
      type,
      amount,
      entry_price: currentPrice,
      status: 'OPEN',
      profit: 0,
      timestamp: new Date().toISOString()
    };
    
    // Update trades and portfolio
    setTrades(prev => [...prev, newTrade]);
    setPortfolio(prev => ({
      ...prev,
      balance: prev.balance - amount,
      openPositions: prev.openPositions + 1,
      totalTrades: prev.totalTrades + 1,
      dailyTradingVolume: (prev.dailyTradingVolume || 0) + amount,
      deployedCapital: prev.deployedCapital + amount
    }));
    
    // Show success notification
    toast({
      title: 'Trade Executed',
      description: `${type} order for ${amount.toLocaleString()} ${selectedPair} at ${currentPrice}`,
      variant: 'default'
    });
    
    return true;
  };

  // Toggle pair status function
  const togglePairStatus = useCallback((id: string) => {
    // Implementation for toggling pair status
    console.log('Toggle pair status:', id);
  }, []);

  // Remove pair function
  const removePair = useCallback((id: string) => {
    // Implementation for removing a pair
    console.log('Remove pair:', id);
  }, []);

  // Mock data for the table
  const tableData = useMemo(() => [
    { id: '1', pair: 'EUR/USD', status: 'Active' as const, position: 'Long' as const, capacity: 1000000, lastAction: 'Buy' },
    { id: '2', pair: 'GBP/USD', status: 'Inactive' as const, position: 'Short' as const, capacity: 500000, lastAction: 'Sell' },
  ], []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
      {/* Trading Limits and Balance Status */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Trading Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used / Limit</span>
                <span className="font-medium">
                  {(portfolio.dailyTradingVolume || 0).toLocaleString()} / {DAILY_TRADING_LIMIT.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    (portfolio.dailyTradingVolume || 0) / DAILY_TRADING_LIMIT > 0.8 
                      ? 'bg-red-500' 
                      : (portfolio.dailyTradingVolume || 0) / DAILY_TRADING_LIMIT > 0.6 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, ((portfolio.dailyTradingVolume || 0) / DAILY_TRADING_LIMIT) * 100)}%`,
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.max(0, DAILY_TRADING_LIMIT - (portfolio.dailyTradingVolume || 0)).toLocaleString()} remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-mono text-lg font-bold">
                  {portfolio.balance.toLocaleString(undefined, { style: 'currency', currency: portfolio.baseCurrency })}
                </span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    portfolio.balance < MINIMUM_BALANCE * 1.2 
                      ? 'bg-red-500' 
                      : portfolio.balance < MINIMUM_BALANCE * 1.5 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (portfolio.balance / (MINIMUM_BALANCE * 2)) * 100)}%`,
                    transition: 'width 0.3s ease-in-out'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Minimum Required</span>
                <span className={portfolio.balance < MINIMUM_BALANCE ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                  {MINIMUM_BALANCE.toLocaleString(undefined, { style: 'currency', currency: portfolio.baseCurrency })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading Pairs Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Trading Pairs</CardTitle>
          <CardDescription>Manage your trading pairs and positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Pair</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Position</th>
                  <th className="text-left py-2 px-4">Capacity</th>
                  <th className="text-left py-2 px-4">Last Action</th>
                  <th className="text-right py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((pair) => (
                  <tr key={pair.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-mono font-medium">{pair.pair}</td>
                    <td className="py-3 px-4">
                      <Badge variant={pair.status === 'Active' ? 'default' : 'secondary'}>{pair.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="outline" 
                        className={pair.position === 'Long' 
                          ? 'text-green-600 border-green-600' 
                          : pair.position === 'Short' 
                            ? 'text-red-600 border-red-600' 
                            : 'text-gray-500'}
                      >
                        {pair.position}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono">{pair.capacity.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{pair.lastAction}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => togglePairStatus(pair.id)}
                        >
                          {pair.status === 'Active' ? '⏸' : '▶'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => console.log('Edit feature coming soon')}
                        >
                          ✏
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => removePair(pair.id)} 
                          className="text-red-600 hover:text-red-600"
                        >
                          🗑
                        </Button>
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
      <AIRecommendationModal 
        open={false} 
        onOpenChange={() => {}} 
        currentPair={selectedPair} 
        portfolio={portfolio} 
        onApplyRecommendations={() => {}} 
      />
    </div>
    </div>
  );
};

export default OrgDashboard;
