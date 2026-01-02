import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Wrench, Clock, CheckCircle, AlertTriangle, Play, User } from 'lucide-react';
import { generateMaintenanceSchedules, SimulatedMaintenance } from '@/lib/simulatedData';
import { format, differenceInDays } from 'date-fns';
import { useMemo, useState } from 'react';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/10 text-green-600">Completed</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500/10 text-blue-600">In Progress</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="secondary">Scheduled</Badge>;
  }
};

const getEquipmentIcon = (type: string) => {
  switch (type) {
    case 'hvac':
      return '🌡️';
    case 'elevator':
      return '🛗';
    case 'generator':
      return '⚡';
    case 'water_pump':
      return '💧';
    case 'electrical':
      return '🔌';
    case 'plumbing':
      return '🔧';
    default:
      return '🔨';
  }
};

export const MaintenanceScheduling = () => {
  const initialSchedules = useMemo(() => generateMaintenanceSchedules(), []);
  const [schedules, setSchedules] = useState<SimulatedMaintenance[]>(initialSchedules);

  const overdueCount = schedules.filter(s => s.status === 'overdue').length;
  const inProgressCount = schedules.filter(s => s.status === 'in_progress').length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const completedCount = schedules.filter(s => s.status === 'completed').length;

  const handleStartMaintenance = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'in_progress' as const } : s
    ));
  };

  const handleCompleteMaintenance = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'completed' as const, lastMaintenance: new Date() } : s
    ));
  };

  const getProgressToNextMaintenance = (schedule: SimulatedMaintenance) => {
    const daysSinceLast = differenceInDays(new Date(), schedule.lastMaintenance);
    return Math.min(100, (daysSinceLast / schedule.frequency) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={overdueCount > 0 ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map(schedule => {
                const daysUntilDue = differenceInDays(schedule.nextMaintenance, new Date());
                const progress = getProgressToNextMaintenance(schedule);

                return (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEquipmentIcon(schedule.type)}</span>
                        <span className="font-medium">{schedule.equipment}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{schedule.location}</TableCell>
                    <TableCell>{format(schedule.lastMaintenance, 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={daysUntilDue < 0 ? 'text-destructive font-medium' : ''}>
                          {daysUntilDue < 0 
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : daysUntilDue === 0 
                              ? 'Due today'
                              : `In ${daysUntilDue} days`
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.frequency} days</TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress 
                          value={progress} 
                          className={progress >= 100 ? 'bg-destructive/20' : ''}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      {schedule.status === 'scheduled' || schedule.status === 'overdue' ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStartMaintenance(schedule.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      ) : schedule.status === 'in_progress' ? (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleCompleteMaintenance(schedule.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
