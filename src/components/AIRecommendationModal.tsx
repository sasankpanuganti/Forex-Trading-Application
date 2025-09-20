import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Brain, Target, DollarSign, Zap } from 'lucide-react';

interface AIRecommendationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPair: string;
  portfolio: any;
  onApplyRecommendations?: (recs: Recommendation[]) => void;
}

interface Recommendation {
  pair: string;
  action: 'BUY' | 'SELL';
  amount: number;
  confidence: number;
  profitRatio: number;
  reasoning: string;
  timeframe: string;
}

const generateAIRecommendations = (currentPair: string, balance: number): Recommendation[] => {
  const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD'];
  const recommendations: Recommendation[] = [];
  
  for (let i = 0; i < 3; i++) {
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const confidence = 75 + Math.random() * 20; // 75-95% confidence
    const profitRatio = 1.5 + Math.random() * 3; // 1.5-4.5% profit ratio
    const amount = Math.floor((balance * 0.1) + (Math.random() * balance * 0.2)); // 10-30% of balance
    
    recommendations.push({
      pair,
      action,
      amount,
      confidence: Number(confidence.toFixed(1)),
      profitRatio: Number(profitRatio.toFixed(2)),
      reasoning: getReasoningForPair(pair, action),
      timeframe: ['5 minutes', '15 minutes', '30 minutes', '1 hour'][Math.floor(Math.random() * 4)]
    });
  }
  
  return recommendations.sort((a, b) => b.confidence - a.confidence);
};

const getReasoningForPair = (pair: string, action: string): string => {
  const reasons = {
    'EUR/USD': action === 'BUY' ? 'Strong EUR fundamentals, ECB policy support' : 'USD strength expected, EUR weakness',
    'GBP/USD': action === 'BUY' ? 'GBP oversold, technical bounce expected' : 'Brexit uncertainty, USD strength',
    'USD/JPY': action === 'BUY' ? 'BoJ intervention unlikely, yield differential' : 'Risk-off sentiment, JPY safe haven',
    'USD/CHF': action === 'BUY' ? 'USD strength, SNB dovish stance' : 'CHF safe haven demand increasing',
    'AUD/USD': action === 'BUY' ? 'Commodity prices rising, RBA hawkish' : 'China slowdown concerns, USD strength'
  };
  
  return reasons[pair as keyof typeof reasons] || 'Technical analysis indicates favorable conditions';
};

export const AIRecommendationModal = ({ open, onOpenChange, currentPair, portfolio, onApplyRecommendations }: AIRecommendationModalProps) => {
  const [recommendations] = useState(() => generateAIRecommendations(currentPair, (portfolio?.balance ?? 0)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Trading Recommendations
          </DialogTitle>
          <DialogDescription>
            Advanced machine learning analysis of current market conditions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* AI Analysis Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Market Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">Bullish</div>
                  <div className="text-sm text-muted-foreground">Overall Market Sentiment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">87%</div>
                  <div className="text-sm text-muted-foreground">AI Confidence Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">Medium</div>
                  <div className="text-sm text-muted-foreground">Risk Assessment</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Recommendations */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Top AI Recommendations</h3>
            {recommendations.map((rec, index) => (
              <Card key={index} className={`${index === 0 ? 'border-primary bg-primary/5' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={rec.action === 'BUY' ? 'default' : 'destructive'} className="font-semibold">
                        {rec.action}
                      </Badge>
                      <CardTitle className="text-lg">{rec.pair}</CardTitle>
                      {index === 0 && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          <Target className="h-3 w-3 mr-1" />
                          Best Match
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{rec.confidence}%</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Recommended Amount</span>
                      </div>
                      <div className="text-xl font-bold">${rec.amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {((rec.amount / portfolio.balance) * 100).toFixed(1)}% of portfolio
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Expected Profit</span>
                      </div>
                      <div className="text-xl font-bold text-success">+{rec.profitRatio}%</div>
                      <div className="text-sm text-muted-foreground">
                        ~${(rec.amount * rec.profitRatio / 100).toFixed(0)} profit
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Timeframe</div>
                      <div className="text-lg font-semibold">{rec.timeframe}</div>
                      <div className="text-sm text-muted-foreground">Estimated hold time</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <div className="text-sm font-medium mb-1">AI Analysis:</div>
                    <div className="text-sm text-muted-foreground">{rec.reasoning}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => {
              if (recommendations.length > 0 && onApplyRecommendations) onApplyRecommendations([recommendations[0]]);
              onOpenChange(false);
            }} className="flex-1">
              Apply Best Recommendation
            </Button>

            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Continue Manual Trading
            </Button>

            <Button variant="secondary" onClick={() => {
              if (onApplyRecommendations) onApplyRecommendations(recommendations);
              onOpenChange(false);
            }} className="flex-1">
              Keep All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};