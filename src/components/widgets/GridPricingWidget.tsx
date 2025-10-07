import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useWeatherAndPricing } from "@/hooks/useWeatherAndPricing";
import { Badge } from "@/components/ui/badge";

export function GridPricingWidget() {
  const { gridPrice, loading, formatPrice } = useWeatherAndPricing();

  if (loading || !gridPrice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grid Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'off-peak':
        return 'bg-success/10 text-success border-success/20';
      case 'peak':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'off-peak':
        return <TrendingDown className="h-4 w-4" />;
      case 'peak':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-energy-grid/20 bg-gradient-to-br from-energy-grid/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-energy-grid" />
          Current Grid Price
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-energy-grid">
                {formatPrice(gridPrice.price)}
              </p>
              <p className="text-sm text-muted-foreground">per kWh</p>
            </div>
            <Badge variant="outline" className={getTierColor(gridPrice.tier)}>
              <span className="flex items-center gap-1">
                {getTierIcon(gridPrice.tier)}
                {gridPrice.tier.replace('-', ' ').toUpperCase()}
              </span>
            </Badge>
          </div>

          {/* Price Tiers Info */}
          <div className="pt-3 border-t space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Daily Rate Tiers</h4>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Off-Peak (12AM-6AM)</span>
                </div>
                <span className="font-medium">-10%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Standard (6AM-6PM)</span>
                </div>
                <span className="font-medium">Base Rate</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-danger" />
                  <span className="text-muted-foreground">Peak (6PM-12AM)</span>
                </div>
                <span className="font-medium">+17%</span>
              </div>
            </div>
          </div>

          {/* Optimization Tip */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {gridPrice.tier === 'peak' && "💡 High demand period. Use battery or solar if available."}
              {gridPrice.tier === 'off-peak' && "⚡ Best time to charge batteries and run high-power appliances."}
              {gridPrice.tier === 'standard' && "📊 Standard rates. Good for regular consumption."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
