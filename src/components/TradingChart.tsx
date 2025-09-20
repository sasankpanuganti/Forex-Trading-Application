import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TradingChartProps {
  selectedPair: string;
  currentPrice: number;
  data?: Array<{ time: string; price: number; sma?: number; volume?: number }>;
}

// Simulate realistic forex price data with minimal volatility
const generatePriceData = (currentPrice: number) => {
  const data = [];
  let price = currentPrice - 0.002; // Smaller initial range
  let momentum = 0;
  
  for (let i = 0; i < 50; i++) {
    // More realistic forex price movement with momentum
    const volatility = 0.0001; // Much smaller volatility for realistic forex movement
    const randomChange = (Math.random() - 0.5) * volatility;
    
    // Add momentum to simulate market trends
    momentum = momentum * 0.8 + randomChange * 0.2;
    price += momentum;
    
    // Ensure price stays within reasonable bounds
    price = Math.max(currentPrice - 0.01, Math.min(currentPrice + 0.01, price));
    
    data.push({
      time: new Date(Date.now() - (49 - i) * 60000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      price: Number(price.toFixed(5)),
      sma: Number((price + 0.0005).toFixed(5)),
      volume: Math.floor(Math.random() * 500000) + 750000,
    });
  }
  
  return data;
};

export const TradingChart = (props: TradingChartProps) => {
  const { selectedPair, currentPrice, data: incomingData } = props;
  const data = incomingData && incomingData.length ? incomingData : generatePriceData(currentPrice);
  const priceChange = data.length > 1 ? data[data.length - 1].price - data[data.length - 2].price : 0;
  const priceChangePercent = data.length > 1 ? ((priceChange / data[data.length - 2].price) * 100).toFixed(3) : '0.000';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {selectedPair} Live Chart
            </CardTitle>
            <CardDescription>Real-time price movements and technical indicators</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{currentPrice.toFixed(5)}</div>
            <div className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-success' : 'text-danger'}`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(5)} ({priceChangePercent}%)
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Technical Indicators */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-chart-1/20 text-chart-1 border-chart-1/30">
              SMA(20): {(currentPrice + 0.001).toFixed(5)}
            </Badge>
            <Badge variant="secondary" className="bg-chart-2/20 text-chart-2 border-chart-2/30">
              RSI: 64.2
            </Badge>
            <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 border-chart-3/30">
              MACD: 0.0012
            </Badge>
            <Badge variant="secondary" className="bg-chart-4/20 text-chart-4 border-chart-4/30">
              BB Upper: {(currentPrice + 0.002).toFixed(5)}
            </Badge>
          </div>

          {/* Price Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  domain={['dataMin - 0.001', 'dataMax + 0.001']}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="sma"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted))"
                  fillOpacity={0.6}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};