import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Zap, 
  Sun, 
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { useAIInsights, type AIInsight, type AIRecommendation } from "@/hooks/useAIInsights";
import { useInsightFeedback } from "@/hooks/useInsightFeedback";
import { useCurrency } from "@/hooks/useCurrency";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const InsightIcon = ({ category }: { category: AIInsight['category'] }) => {
  switch (category) {
    case 'usage_pattern':
      return <TrendingUp className="h-4 w-4" />;
    case 'efficiency':
      return <Zap className="h-4 w-4" />;
    case 'cost':
      return <DollarSign className="h-4 w-4" />;
    case 'solar':
      return <Sun className="h-4 w-4" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
};

const PriorityBadge = ({ priority }: { priority: AIRecommendation['priority'] }) => {
  const variants = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline'
  } as const;

  return (
    <Badge variant={variants[priority]} className="text-xs">
      {priority.toUpperCase()}
    </Badge>
  );
};

export function InsightsPanel() {
  const { insights, recommendations, forecast, isLoading, error, lastGeneratedAt, generateInsights } = useAIInsights();
  const { submitFeedback, submittingFeedback } = useInsightFeedback();
  const { formatCurrency } = useCurrency();

  if (error) {
    return (
      <Alert className="border-danger/20 bg-danger/5">
        <AlertTriangle className="h-4 w-4 text-danger" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">AI Energy Insights</h2>
            {lastGeneratedAt && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastGeneratedAt.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <Button 
          onClick={generateInsights} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {/* Forecast Card */}
          {forecast && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Next Month Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-energy-consumption">
                      {forecast.nextMonthConsumption.toFixed(1)} kWh
                    </div>
                    <div className="text-sm text-muted-foreground">Consumption</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-energy-solar">
                      {forecast.nextMonthSolar.toFixed(1)} kWh
                    </div>
                    <div className="text-sm text-muted-foreground">Solar Generation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {formatCurrency(forecast.nextMonthCost)}
                    </div>
                    <div className="text-sm text-muted-foreground">Estimated Cost</div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-xs">
                    {forecast.confidence.toUpperCase()} CONFIDENCE
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights Grid */}
          {insights.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Insights
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {insights.map((insight, index) => (
                  <Card key={index} className="relative">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <InsightIcon category={insight.category} />
                        {insight.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Personalized Recommendations
              </h3>
              <div className="space-y-4">
                {recommendations
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .map((rec, index) => (
                    <Card key={rec.id || index} className="relative group hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base flex-1 pr-4">
                            {rec.title}
                          </CardTitle>
                          <PriorityBadge priority={rec.priority} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {rec.description}
                        </p>
                        
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Zap className="h-4 w-4 text-energy-consumption" />
                              <span className="font-medium">{rec.expected_savings_kwh} kWh/month</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-success" />
                              <span className="font-medium">{formatCurrency(rec.expected_savings_currency)}/month</span>
                            </div>
                          </div>
                          
                          {rec.id && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => submitFeedback(rec.id!, true)}
                                disabled={submittingFeedback === rec.id}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => submitFeedback(rec.id!, false)}
                                disabled={submittingFeedback === rec.id}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && insights.length === 0 && recommendations.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No insights available yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate personalized energy insights and recommendations based on your usage data.
                </p>
                <Button onClick={generateInsights} disabled={isLoading}>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}