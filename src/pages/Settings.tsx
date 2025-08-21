import { 
  Bell, 
  Shield, 
  User, 
  Zap,
  Sun,
  Smartphone,
  Mail,
  Save,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";

export default function Settings() {
  const { currency, formatRate, manuallySetCurrency, availableCountries, isLoading } = useCurrency();
  
  const currencyMap: Record<string, { code: string; symbol: string; name: string; rate: number }> = {
    'DE': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.30 },
    'FR': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.28 },
    'ES': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.25 },
    'IT': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.32 },
    'NL': { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.35 },
    'GB': { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.25 },
    'US': { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.12 },
    'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.16 },
    'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.18 },
    'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 18 },
    'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 10 },
    'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 0.17 }
  };
  
  const countryNames: Record<string, string> = {
    'DE': 'Germany',
    'FR': 'France', 
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'GB': 'United Kingdom',
    'US': 'United States',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'IN': 'India',
    'SG': 'Singapore'
  };
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your energy monitoring system preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="america/new_york">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america/new_york">Eastern Time</SelectItem>
                  <SelectItem value="america/chicago">Central Time</SelectItem>
                  <SelectItem value="america/denver">Mountain Time</SelectItem>
                  <SelectItem value="america/los_angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="solar-capacity">Solar Panel Capacity</Label>
              <div className="flex gap-2">
                <Input id="solar-capacity" defaultValue="8.5" />
                <span className="flex items-center text-sm text-muted-foreground">kW</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="battery-capacity">Battery Capacity</Label>
              <div className="flex gap-2">
                <Input id="battery-capacity" defaultValue="13.5" />
                <span className="flex items-center text-sm text-muted-foreground">kWh</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-region">Currency & Region</Label>
              <Select onValueChange={manuallySetCurrency} value={availableCountries.find(code => 
                currencyMap[code]?.code === currency.code
              )}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Detecting..." : `${countryNames[availableCountries.find(code => 
                    currencyMap[code]?.code === currency.code
                  ) || 'US'] || 'United States'} (${currency.symbol})`} />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((code) => (
                    <SelectItem key={code} value={code}>
                      {countryNames[code]} ({currencyMap[code].symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grid-rate">Grid Rate</Label>
              <div className="flex gap-2">
                <Input id="grid-rate" defaultValue={currency.rate.toString()} />
                <span className="flex items-center text-sm text-muted-foreground">
                  {isLoading ? '...' : `${currency.symbol}/kWh`}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-rate">Export Rate</Label>
              <div className="flex gap-2">
                <Input id="export-rate" defaultValue={(currency.rate * 0.67).toFixed(2)} />
                <span className="flex items-center text-sm text-muted-foreground">
                  {isLoading ? '...' : `${currency.symbol}/kWh`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Detection Info */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Information</CardTitle>
            <CardDescription>
              Your currency is automatically detected based on your location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Detected Currency:</span>
              <Badge variant="secondary">
                {currency.name} ({currency.symbol})
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Standard Rate:</span>
              <span className="text-sm text-muted-foreground">
                {formatRate(currency.rate)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You can manually change your currency and region in the dropdown above if the detection is incorrect.
            </p>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>High Usage Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when consumption exceeds threshold
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anomaly Detection</Label>
                <p className="text-sm text-muted-foreground">
                  Alert for unusual energy patterns
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Solar Production Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify about solar performance
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Email daily energy summary
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Notification Methods</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Push
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Data Collection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Collection</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Detailed Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect detailed usage patterns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Usage Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Share anonymized data for research
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select defaultValue="2years">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6months">6 months</SelectItem>
                      <SelectItem value="1year">1 year</SelectItem>
                      <SelectItem value="2years">2 years</SelectItem>
                      <SelectItem value="5years">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* API & Integrations */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">API & Integrations</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Access</span>
                  <Badge variant="outline" className="text-success border-success/20">
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Third-party Integrations</span>
                  <Badge variant="outline">
                    3 Connected
                  </Badge>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  Manage Integrations
                </Button>

                <div className="pt-2 border-t">
                  <div className="space-y-2">
                    <Label>Data Export Format</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="bg-gradient-energy text-primary-foreground shadow-energy">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}