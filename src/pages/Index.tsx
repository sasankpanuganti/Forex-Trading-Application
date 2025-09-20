import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Shield, Zap, BarChart3, Activity, DollarSign } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Professional Forex Trading Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              AlphaFxTrader
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced algorithmic trading platform with real-time market data, AI-powered strategies, and professional-grade risk management tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-3"
              >
                Start Trading Now
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="text-lg px-8 py-3"
              >
                View Demo
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => navigate('/org-dashboard')}
                className="text-lg px-8 py-3"
              >
                Org Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Advanced Trading Features</h2>
          <p className="text-muted-foreground text-lg">Everything you need for professional forex trading</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Real-time Charts
              </CardTitle>
              <CardDescription>
                Advanced charting with technical indicators, real-time price feeds, and customizable timeframes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                AI Trading Algorithms
              </CardTitle>
              <CardDescription>
                Multiple ML-powered strategies including SMA, RSI, Bollinger Bands, and MACD for automated trading.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Risk Management
              </CardTitle>
              <CardDescription>
                Professional risk controls with stop-loss, take-profit, and position sizing to protect your capital.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Multi-Currency Support
              </CardTitle>
              <CardDescription>
                Trade major and minor currency pairs with support for multiple base currencies including USD, EUR, GBP, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Portfolio Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive portfolio tracking with P&L analysis, performance metrics, and detailed trade history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Live Market Data
              </CardTitle>
              <CardDescription>
                Real-time forex rates, market depth, and economic calendar integration for informed trading decisions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Start Trading?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of traders using AlphaFxTrader for professional forex trading.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-3"
          >
            Create Your Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
