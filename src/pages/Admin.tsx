import { useState } from 'react';
import { 
  Users, 
  Database, 
  Activity, 
  AlertTriangle,
  Shield,
  Settings,
  BarChart3,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseData } from "@/hooks/useSupabaseData";

export default function Admin() {
  const { loading, error } = useSupabaseData();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock admin data - in real app, this would come from admin-specific queries
  const adminStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalAppliances: 5634,
    totalEnergyLogged: 125678.5,
    systemAlerts: 3,
    systemUptime: 99.8
  };

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "High Database Load",
      description: "Database queries are taking longer than usual",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      type: "info",
      title: "Scheduled Maintenance",
      description: "System maintenance scheduled for tonight at 2 AM",
      timestamp: "1 day ago"
    },
    {
      id: 3,
      type: "critical",
      title: "API Rate Limit Reached",
      description: "Weather API rate limit reached, using cached data",
      timestamp: "3 hours ago"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            System administration and monitoring dashboard
          </p>
        </div>
        <Badge variant="outline" className="border-success/20 text-success">
          System Healthy
        </Badge>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-3">
          {systemAlerts.slice(0, 2).map((alert) => (
            <Alert 
              key={alert.id} 
              className={`${
                alert.type === 'critical' ? 'border-danger/20 bg-danger/5' :
                alert.type === 'warning' ? 'border-warning/20 bg-warning/5' :
                'border-primary/20 bg-primary/5'
              }`}
            >
              <AlertTriangle className={`h-4 w-4 ${
                alert.type === 'critical' ? 'text-danger' :
                alert.type === 'warning' ? 'text-warning' :
                'text-primary'
              }`} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{alert.title}</strong>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {adminStats.activeUsers} active this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appliances</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.totalAppliances.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Energy Logged</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.totalEnergyLogged.toLocaleString()} kWh</div>
                <p className="text-xs text-muted-foreground">
                  Total energy monitored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Recent system events and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.type === 'critical' ? 'bg-danger' :
                        alert.type === 'warning' ? 'bg-warning' :
                        'bg-primary'
                      }`} />
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={
                      alert.type === 'critical' ? 'border-danger/20 text-danger' :
                      alert.type === 'warning' ? 'border-warning/20 text-warning' :
                      'border-primary/20 text-primary'
                    }>
                      {alert.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Registered Users</p>
                    <p className="text-sm text-muted-foreground">{adminStats.totalUsers} users</p>
                  </div>
                  <Button variant="outline">View All Users</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active This Month</p>
                    <p className="text-sm text-muted-foreground">{adminStats.activeUsers} users</p>
                  </div>
                  <Button variant="outline">Export Data</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor system performance and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <Badge className="bg-success text-success-foreground">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Status</span>
                    <Badge className="bg-success text-success-foreground">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Background Jobs</span>
                    <Badge className="bg-success text-success-foreground">Running</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm">23%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm">45%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Enable maintenance mode for system updates</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Backup Settings</p>
                    <p className="text-sm text-muted-foreground">Configure automated backups</p>
                  </div>
                  <Button variant="outline">Manage</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">API Rate Limits</p>
                    <p className="text-sm text-muted-foreground">Configure API rate limiting</p>
                  </div>
                  <Button variant="outline">Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}