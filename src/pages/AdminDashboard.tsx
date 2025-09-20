import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingChart } from '@/components/TradingChart';
import { RealTimeData } from '@/components/RealTimeData';
import { TradingPair } from '@/types/trading';

const currencyPairs = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'
];

const AdminDashboard: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<string>(currencyPairs[0]);
  const [currentPrice, setCurrentPrice] = useState<number>(1.0847);
  const [autoTrading, setAutoTrading] = useState<boolean>(false);
  const [showAddPairModal, setShowAddPairModal] = useState<boolean>(false);

  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([
    { id: 1, pair: 'EUR/USD', status: 'Active', position: 'Neutral', capacity: 200000, lastAction: 'Initialized', profit: 0, volume: 0 },
    { id: 2, pair: 'GBP/USD', status: 'Paused', position: 'Neutral', capacity: 150000, lastAction: 'Initialized', profit: 0, volume: 0 },
  ]);

  const [newPairData, setNewPairData] = useState<{ pair: string; capacity: string }>({ pair: '', capacity: '100000' });

  interface PortfolioSummary {
    dailyLimit: number;
    totalVolume: number;
    todayProfit: number;
    activeTraders: number;
    baseCurrency: string;
  }

  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
    dailyLimit: 1000000,
    totalVolume: 120000,
    todayProfit: 4500,
    activeTraders: 12,
    baseCurrency: 'USD'
  });

  const handleAddPair = () => {
    if (!newPairData.pair) {
      console.log('Error: Please select a currency pair');
      return;
    }

    const newPair: TradingPair = {
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
    setTradingPairs((prev) => prev.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Paused' : 'Active', lastAction: p.status === 'Active' ? 'Paused by admin' : 'Resumed by admin' } : p));
  };

  const toggleAutoTrading = () => {
    setAutoTrading(prev => !prev);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: portfolio.baseCurrency || 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AlphaFxTrader Admin
            </h1>
            <p className="text-gray-600">Organization Trading Management Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={autoTrading ? 'destructive' : 'default'}
              onClick={toggleAutoTrading}
              className="flex items-center gap-2"
            >
              <span className="text-sm">⚡</span>
              {autoTrading ? 'Disable Auto Trading' : 'Enable Auto Trading'}
            </Button>
            <Button variant="outline" size="sm">
              <span className="mr-2">⚙</span>
              Settings
            </Button>
          </div>
        </div>

        {/* Admin Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Limit</CardTitle>
              <span className="h-4 w-4 text-gray-500">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolio.dailyLimit)}</div>
              <p className="text-xs text-gray-500">Used: {(portfolio.totalVolume / portfolio.dailyLimit * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Profit</CardTitle>
              <span className="h-4 w-4 text-gray-500">📈</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{formatCurrency(portfolio.todayProfit)}</div>
              <p className="text-xs text-gray-500">+12.4% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Traders</CardTitle>
              <span className="h-4 w-4 text-gray-500">👥</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.activeTraders}</div>
              <p className="text-xs text-gray-500">3 new today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <span className="h-4 w-4 text-gray-500">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(portfolio.totalVolume)}</div>
              <p className="text-xs text-gray-500">Today's trading volume</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Data Row */}
        <RealTimeData selectedPair={selectedPair} currentPrice={currentPrice} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="chart" className="space-y-4">
              <TabsList>
                <TabsTrigger value="chart">Price Chart</TabsTrigger>
                <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="space-y-4">
                <TradingChart selectedPair={selectedPair} currentPrice={currentPrice} />
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                    <CardDescription>Organization trading performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">Advanced analytics dashboard will be implemented here</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🏢</span>
                  Organization Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monitoring Pair</Label>
                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyPairs.map((pair) => (
                        <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Auto Trading Status</span>
                    <Badge variant={autoTrading ? 'default' : 'secondary'}>{autoTrading ? 'Active' : 'Paused'}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">AI algorithms are {autoTrading ? 'actively' : 'not'} managing trades</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚠</span>
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Daily Limit Usage</span>
                    <span className="text-sm font-mono">{((portfolio.totalVolume / portfolio.dailyLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(portfolio.totalVolume / portfolio.dailyLimit) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500">{formatCurrency(portfolio.dailyLimit - portfolio.totalVolume)} remaining today</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trading Pairs Management Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trading Pairs Management</CardTitle>
                <CardDescription>Manage and monitor all active trading pairs</CardDescription>
              </div>
              <Button onClick={() => setShowAddPairModal(true)} className="flex items-center gap-2"><span className="text-sm">➕</span>Add Pair</Button>
            </div>
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
                  {tradingPairs.map((pair) => (
                    <tr key={pair.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-medium">{pair.pair}</td>
                      <td className="py-3 px-4"><Badge variant={pair.status === 'Active' ? 'default' : 'secondary'}>{pair.status}</Badge></td>
                      <td className="py-3 px-4"><Badge variant="outline" className={pair.position === 'Long' ? 'text-green-600 border-green-600' : pair.position === 'Short' ? 'text-red-600 border-red-600' : 'text-gray-500'}>{pair.position}</Badge></td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(pair.capacity)}</td>
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

      {/* Add Pair Modal */}
      {showAddPairModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Trading Pair</CardTitle>
              <CardDescription>Configure a new currency pair for trading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency Pair</Label>
                <Select value={newPairData.pair} onValueChange={(value: string) => setNewPairData((prev) => ({ ...prev, pair: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyPairs
                      .filter((pair) => !tradingPairs.some((tp) => tp.pair === pair))
                      .map((pair) => (
                        <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trading Capacity</Label>
                <Input type="number" value={newPairData.capacity} onChange={(e) => setNewPairData((prev) => ({ ...prev, capacity: e.target.value }))} placeholder="Enter capacity amount" />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddPair} className="flex-1">Add Pair</Button>
                <Button variant="outline" onClick={() => setShowAddPairModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
