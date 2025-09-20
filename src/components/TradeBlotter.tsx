import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, TrendingUp, TrendingDown, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  timestamp: string; // ISO or readable
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  entry_price: number;
  trading_capacity?: number;
  settlement_capacity?: number;
  quantity?: number;
  best_deal?: number | null;
  exit_price?: number | null;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  profit: number; // realized profit
  algorithm: string;
}

interface TradeBlotterProps {
  trades: Trade[];
  currentPrice: number;
  onCloseTrade: (tradeId: string) => void;
}
export const TradeBlotter = ({ trades = [], currentPrice, onCloseTrade }: TradeBlotterProps) => {
  const handleCloseTrade = (tradeId: string) => {
    if (onCloseTrade) onCloseTrade(tradeId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-chart-1/20 text-chart-1';
      case 'CLOSED': return 'bg-muted text-muted-foreground';
      case 'PENDING': return 'bg-chart-4/20 text-chart-4';
      default: return 'bg-secondary';
    }
  };

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'SMA': return 'bg-chart-2/20 text-chart-2';
      case 'RSI': return 'bg-chart-3/20 text-chart-3';
      case 'Bollinger': return 'bg-chart-4/20 text-chart-4';
      case 'MACD': return 'bg-chart-5/20 text-chart-5';
      case 'Manual': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Trade Blotter
        </CardTitle>
        <CardDescription>Real-time trading activity and position management</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>Trade ID</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Pair</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trading Cap.</TableHead>
                  <TableHead>Settl. Cap.</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Best Deal (24h)</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-mono text-sm">{trade.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : ''}
                  </TableCell>
                  <TableCell className="font-medium">{trade.pair}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${
                      trade.type === 'BUY' ? 'text-success' : 'text-danger'
                    }`}>
                      {trade.type === 'BUY' ? 
                        <TrendingUp className="h-3 w-3" /> : 
                        <TrendingDown className="h-3 w-3" />
                      }
                      {trade.type}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{trade.trading_capacity ? trade.trading_capacity.toLocaleString() : trade.amount.toLocaleString()}</TableCell>
                  <TableCell className="font-mono">{trade.settlement_capacity ? trade.settlement_capacity.toLocaleString() : ''}</TableCell>
                  <TableCell className="font-mono">{trade.quantity ?? Math.floor(trade.amount)}</TableCell>
                  <TableCell className="font-mono">{typeof trade.best_deal === 'number' ? trade.best_deal.toFixed(5) : 'No best deal'}</TableCell>
                  <TableCell className="font-mono">
                    {trade.entry_price.toFixed(5)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {trade.status === 'OPEN' ? currentPrice.toFixed(5) : (trade.exit_price ?? currentPrice).toFixed(5)}
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono ${
                      trade.profit >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {trade.status === 'OPEN' ? (
                        // unrealized profit based on currentPrice
                        (() => {
                          const entry = trade.entry_price;
                          const current = currentPrice;
                          const direction = trade.type === 'BUY' ? 1 : -1;
                          const unrealized = ((current - entry) / entry) * trade.amount * direction;
                          return (unrealized >= 0 ? '+' : '') + unrealized.toFixed(2);
                        })()
                      ) : (
                        (trade.profit >= 0 ? '+' : '') + trade.profit.toFixed(2)
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(trade.status)}>
                      {trade.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getAlgorithmColor(trade.algorithm)}>
                      {trade.algorithm}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trade.status === 'OPEN' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloseTrade(trade.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Open Trades</div>
                <div className="text-lg font-bold">
                  {trades.filter(t => t.status === 'OPEN').length}
                </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total P&L</div>
                <div className="text-lg font-bold text-success">
                  +{trades.reduce((sum, trade) => sum + trade.profit, 0).toFixed(2)}
                </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-lg font-bold">68.5%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Volume</div>
                <div className="text-lg font-bold">
                  {trades.reduce((sum, trade) => sum + trade.amount, 0).toLocaleString()}
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};