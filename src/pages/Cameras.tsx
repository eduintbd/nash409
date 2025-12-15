import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Wifi, WifiOff, ExternalLink, Settings, Plus } from 'lucide-react';

const mockCameras = [
  { id: '1', name: 'Main Gate', location: 'Building Entrance', status: 'online' as const },
  { id: '2', name: 'Parking Area', location: 'Ground Floor', status: 'online' as const },
  { id: '3', name: 'Lift Lobby', location: 'Ground Floor', status: 'online' as const },
  { id: '4', name: 'Staircase A', location: 'All Floors', status: 'offline' as const },
  { id: '5', name: 'Terrace', location: 'Top Floor', status: 'online' as const },
  { id: '6', name: 'Generator Room', location: 'Basement', status: 'online' as const },
];

const Cameras = () => {
  const onlineCount = mockCameras.filter(c => c.status === 'online').length;

  return (
    <MainLayout>
      <Header 
        title="Camera Surveillance" 
        subtitle="Monitor building security cameras"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Cameras</p>
            <p className="text-2xl font-bold mt-1">{mockCameras.length}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">Online</p>
            <p className="text-2xl font-bold mt-1 text-success">{onlineCount}</p>
          </div>
          <div className="stat-card bg-destructive/5">
            <p className="text-sm text-muted-foreground">Offline</p>
            <p className="text-2xl font-bold mt-1 text-destructive">
              {mockCameras.length - onlineCount}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">Camera Integration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your V380 Pro cameras or Angelcam account to view live feeds directly in this dashboard.
                Configure camera settings and view recordings.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Camera
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockCameras.map((camera) => (
            <Card key={camera.id} className="stat-card border-0 overflow-hidden">
              {/* Camera Preview Placeholder */}
              <div className="aspect-video bg-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  {camera.status === 'online' ? (
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <p className="text-xs text-muted-foreground mt-2">Live Feed Available</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <WifiOff className="h-12 w-12 text-destructive/50 mx-auto" />
                      <p className="text-xs text-destructive mt-2">Camera Offline</p>
                    </div>
                  )}
                </div>
                <Badge 
                  className={`absolute top-2 right-2 ${
                    camera.status === 'online' 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-destructive text-destructive-foreground'
                  }`}
                >
                  {camera.status === 'online' ? (
                    <><Wifi className="h-3 w-3 mr-1" /> Live</>
                  ) : (
                    <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                  )}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{camera.name}</CardTitle>
                <CardDescription>{camera.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" disabled={camera.status === 'offline'}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Screen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Cameras;
