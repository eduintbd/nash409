import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { useCameras, useCreateCamera, useUpdateCamera, useDeleteCamera } from '@/hooks/useCameras';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Wifi, WifiOff, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Cameras = () => {
  const { t, language } = useLanguage();
  const { data: cameras, isLoading } = useCameras();
  const createCamera = useCreateCamera();
  const updateCamera = useUpdateCamera();
  const deleteCamera = useDeleteCamera();
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCamera, setNewCamera] = useState({ name: '', location: '', camera_id: '' });

  const onlineCount = cameras?.filter(c => c.status === 'online').length || 0;

  const handleAddCamera = async () => {
    await createCamera.mutateAsync({
      name: newCamera.name,
      location: newCamera.location,
      camera_id: newCamera.camera_id || null,
      status: 'online',
    });
    setNewCamera({ name: '', location: '', camera_id: '' });
    setFormOpen(false);
  };

  const handleToggleStatus = async (camera: any) => {
    await updateCamera.mutateAsync({
      id: camera.id,
      status: camera.status === 'online' ? 'offline' : 'online',
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCamera.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout>
      <Header 
        title={t.cameras.title} 
        subtitle={t.cameras.subtitle}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">{t.cameras.totalCameras}</p>
            <p className="text-2xl font-bold mt-1">{cameras?.length || 0}</p>
          </div>
          <div className="stat-card bg-success/5">
            <p className="text-sm text-muted-foreground">{t.cameras.online}</p>
            <p className="text-2xl font-bold mt-1 text-success">{onlineCount}</p>
          </div>
          <div className="stat-card bg-destructive/5">
            <p className="text-sm text-muted-foreground">{t.cameras.offline}</p>
            <p className="text-2xl font-bold mt-1 text-destructive">
              {(cameras?.length || 0) - onlineCount}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">{t.cameras.cameraIntegration}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.cameras.cameraIntegrationHint}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.common.add} {t.cameras.title}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : cameras?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.cameras.noCameras}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cameras?.map((camera) => (
              <Card key={camera.id} className="stat-card border-0 overflow-hidden">
                {/* Camera Preview Placeholder */}
                <div className="aspect-video bg-muted/50 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {camera.status === 'online' ? (
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                        <p className="text-xs text-muted-foreground mt-2">{t.cameras.liveFeed}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <WifiOff className="h-12 w-12 text-destructive/50 mx-auto" />
                        <p className="text-xs text-destructive mt-2">{t.cameras.offline}</p>
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
                      <><Wifi className="h-3 w-3 mr-1" /> {t.cameras.online}</>
                    ) : (
                      <><WifiOff className="h-3 w-3 mr-1" /> {t.cameras.offline}</>
                    )}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 left-2 h-8 w-8 bg-background/50 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteId(camera.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{camera.name}</CardTitle>
                  <CardDescription>{camera.location}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {camera.camera_id && (
                    <p className="text-xs text-muted-foreground">ID: {camera.camera_id}</p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      disabled={camera.status === 'offline'}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t.cameras.liveFeed}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(camera)}
                    >
                      {camera.status === 'online' ? t.cameras.turnOff : t.cameras.turnOn}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Camera Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.add} {t.cameras.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.common.name}</Label>
              <Input 
                value={newCamera.name} 
                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                placeholder="Main Gate Camera"
              />
            </div>
            <div>
              <Label>{t.cameras.location}</Label>
              <Input 
                value={newCamera.location} 
                onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                placeholder="Building Entrance"
              />
            </div>
            <div>
              <Label>Camera ID ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})</Label>
              <Input 
                value={newCamera.camera_id} 
                onChange={(e) => setNewCamera({ ...newCamera, camera_id: e.target.value })}
                placeholder="V380-XXXX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleAddCamera} disabled={!newCamera.name || !newCamera.location || createCamera.isPending}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{t.common.deleteWarning}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">{t.common.delete}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Cameras;