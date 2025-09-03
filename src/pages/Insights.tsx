import { InsightsPanel } from "@/components/ai/InsightsPanel";

export default function Insights() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Energy Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis of your energy usage patterns and personalized recommendations
        </p>
      </div>

      {/* Main Content */}
      <InsightsPanel />
    </div>
  );
}