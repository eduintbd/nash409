import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Bell, X } from 'lucide-react';
import { generateSimulatedAlerts, SimulatedAlert } from '@/lib/simulatedData';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case 'high':
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    case 'medium':
      return <Info className="h-5 w-5 text-yellow-500" />;
    default:
      return <Bell className="h-5 w-5 text-blue-500" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getUtilityColor = (utility: string) => {
  switch (utility) {
    case 'electricity':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'water':
      return 'bg-blue-500/10 text-blue-600';
    case 'gas':
      return 'bg-orange-500/10 text-orange-600';
    case 'hvac':
      return 'bg-green-500/10 text-green-600';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const SmartAlerts = () => {
  const initialAlerts = useMemo(() => generateSimulatedAlerts(), []);
  const [alerts, setAlerts] = useState<SimulatedAlert[]>(initialAlerts);

  const activeAlerts = alerts.filter(a => !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.isResolved);

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, isResolved: true } : a
    ));
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
          </CardContent>
        </Card>

        <Card className={criticalCount > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          </CardContent>
        </Card>

        <Card className={highCount > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedAlerts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active alerts. All systems operating normally.</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <div
                key={alert.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  alert.severity === 'critical' ? 'border-destructive bg-destructive/5' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-500/5' :
                  'border-border'
                }`}
              >
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{alert.title}</span>
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                    <Badge className={getUtilityColor(alert.utility)} variant="outline">
                      {alert.utility}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(alert.timestamp, 'MMM d, yyyy h:mm a')}
                    {alert.flatNumber && ` • Flat ${alert.flatNumber}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResolve(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Recently Resolved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resolvedAlerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 opacity-60"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div className="flex-1">
                  <span className="text-sm">{alert.title}</span>
                </div>
                <Badge variant="outline" className="text-green-600">Resolved</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
