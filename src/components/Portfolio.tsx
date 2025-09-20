import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, Activity, Target, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface PortfolioData {
  balance: number;
  baseCurrency: string;
  totalProfit: number;
  todayProfit: number;
  openPositions: number;
  totalTrades: number;
}

interface TradeItem {
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  profit?: number;
  amount?: number;
}

interface PortfolioProps {
  portfolio: PortfolioData;
  minTradeAmount?: number;
  trades?: TradeItem[];
}

export const Portfolio = ({ portfolio, minTradeAmount = 1000, trades = [] }: PortfolioProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const profitPercentage = ((portfolio.totalProfit / portfolio.balance) * 100).toFixed(2);
  const todayProfitPercentage = ((portfolio.todayProfit / portfolio.balance) * 100).toFixed(2);
  // compute profits from provided trades
  const closedProfit = trades.filter(t => t.status === 'CLOSED').reduce((s, t) => s + (t.profit || 0), 0);
  const openNotional = trades.filter(t => t.status === 'OPEN').reduce((s, t) => s + (t.amount || 0), 0);
  // exact reserved margin is 1% of each open trade amount
  const reservedMargin = openNotional * 0.01;
  const remainingBalance = portfolio.balance + closedProfit - reservedMargin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Portfolio Overview
        </CardTitle>
        <CardDescription>Your trading account summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Balance</span>
            <span className="font-mono text-lg font-bold">
              {portfolio.balance.toLocaleString()} {portfolio.baseCurrency}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Minimum Trade Amount</span>
            <span className="font-mono text-sm">{minTradeAmount.toLocaleString()} {portfolio.baseCurrency}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Remaining Balance</span>
            <span className="font-mono text-sm font-bold">{remainingBalance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} {portfolio.baseCurrency}</span>
          </div>
          <div className="pt-2">
            <button onClick={() => setShowBalance(!showBalance)} className="text-sm text-primary underline">
              {showBalance ? 'Hide Balance Details' : 'Balance'}
            </button>
          </div>
          <Progress value={75} className="h-2" />
          <div className="text-xs text-muted-foreground">75% of maximum leverage used</div>
        </div>

        {/* Profit/Loss */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Total Profit
            </div>
            <div className={`font-mono font-bold ${portfolio.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {portfolio.totalProfit >= 0 ? '+' : ''}{portfolio.totalProfit.toFixed(2)} {portfolio.baseCurrency}
            </div>
            <div className="text-xs text-muted-foreground">{profitPercentage}%</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Today
            </div>
            <div className={`font-mono font-bold ${portfolio.todayProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {portfolio.todayProfit >= 0 ? '+' : ''}{portfolio.todayProfit.toFixed(2)} {portfolio.baseCurrency}
            </div>
            <div className="text-xs text-muted-foreground">{todayProfitPercentage}%</div>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Open Positions
            </span>
            <Badge variant="secondary">{portfolio.openPositions}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Trades
            </span>
            <Badge variant="outline">{portfolio.totalTrades}</Badge>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="text-sm font-medium">Risk Metrics</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="text-success">68.5%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span>1.34</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="text-danger">-5.2%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};