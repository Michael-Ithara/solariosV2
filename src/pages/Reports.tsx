import { ReportsPanel } from '@/components/reports/ReportsPanel';

export default function Reports() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Exports</h1>
        <p className="text-muted-foreground">
          Generate and download detailed reports of your energy data
        </p>
      </div>

      <ReportsPanel />
    </div>
  );
}
