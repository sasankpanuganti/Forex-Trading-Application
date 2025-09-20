import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
];

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'individual',
    baseCurrency: '',
    organizationName: '',
    basicTradeAmount: '100'
  });

  const handleInputChange = (field: string, value: string) => {
    // sanitize numeric fields to avoid commas or other characters
    if (field === 'basicTradeAmount') {
  const sanitized = value.replace(/[^0-9.-]/g, '');
      setFormData(prev => ({ ...prev, [field]: sanitized }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const demo = localStorage.getItem('demo_user');
      if (demo) {
        const parsed = JSON.parse(demo);
        if (parsed.userType === 'organization') {
          navigate('/org-dashboard');
          return;
        }
        navigate('/dashboard');
      }
    } catch (err) {
      // ignore
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - would need Supabase integration
    setTimeout(() => {
      toast({
        title: "Login Successful",
        description: "Welcome to AlphaFxTrader!",
      });
      setIsLoading(false);
      // Navigate to appropriate dashboard based on saved demo user
      try {
        const demo = localStorage.getItem('demo_user');
        if (demo) {
          const parsed = JSON.parse(demo);
          if (parsed.userType === 'organization') {
            navigate('/org-dashboard');
            return;
          }
        }
      } catch (err) {
        // ignore and fallback
      }
      navigate('/dashboard');
    }, 1000);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.baseCurrency) {
      toast({
        title: "Error",
        description: "Please select a base currency",
        variant: "destructive",
      });
      return;
    }
    if (!formData.basicTradeAmount || Number(formData.basicTradeAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid basic trade amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate signup - would need Supabase integration
    setTimeout(() => {
      toast({
        title: "Account Created",
        description: `Welcome to AlphaFxTrader! Your account has been created with ${formData.baseCurrency} as base currency. Basic trade amount: ${formData.basicTradeAmount}`,
      });
      setIsLoading(false);
  // Navigate to dashboard - placeholder
      // Save demo user settings in localStorage for demo purposes
  const basicAmt = Number(String(formData.basicTradeAmount).replace(/[^0-9.-]/g, '')) || 0;
      localStorage.setItem('demo_user', JSON.stringify({
        name: formData.name,
        email: formData.email,
        baseCurrency: formData.baseCurrency,
        basicTradeAmount: basicAmt,
        userType: formData.userType,
        organizationName: formData.organizationName || null
      }));
      // Redirect based on role
      if (formData.userType === 'organization') {
        navigate('/org-dashboard');
      } else {
        navigate('/dashboard');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            AlphaFxTrader
          </h1>
          <p className="text-muted-foreground mt-2">Professional Forex Trading Platform</p>
        </div>

        <Card className="bg-card border-border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to your trading account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Start your forex trading journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Account Type</Label>
                    <RadioGroup
                      value={formData.userType}
                      onValueChange={(value) => handleInputChange('userType', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual">Individual Trader</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="organization" id="organization" />
                        <Label htmlFor="organization">Organization</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.userType === 'organization' && (
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
                      <Input
                        id="org-name"
                        placeholder="Your organization name"
                        value={formData.organizationName}
                        onChange={(e) => handleInputChange('organizationName', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base-currency">Base Currency *</Label>
                    <Select onValueChange={(value) => handleInputChange('baseCurrency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your base currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{currency.symbol}</span>
                              <span>{currency.name} ({currency.code})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="basic-trade-amount">Basic Trade Amount</Label>
                    <Input
                      id="basic-trade-amount"
                      type="number"
                      value={formData.basicTradeAmount}
                      onChange={(e) => handleInputChange('basicTradeAmount', e.target.value)}
                      placeholder="e.g. 100"
                      required
                    />
                    <div className="text-xs text-muted-foreground">This amount will be used as your default trade size on the dashboard.</div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;