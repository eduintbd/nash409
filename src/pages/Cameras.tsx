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
import { Camera, Wifi, WifiOff, Plus, Trash2, Copy, Monitor, Smartphone, Play, Loader2, CheckCircle2, XCircle, Maximize2, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
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
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'failed' | null>>({});
  const [streamMode, setStreamMode] = useState<Record<string, 'snapshot' | 'mjpeg' | 'iframe'>>({});
  const [snapshotKey, setSnapshotKey] = useState<Record<string, number>>({});

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

  const testConnection = async (cameraId: string, ip: string) => {
    setTestingConnection(cameraId);
    setConnectionStatus(prev => ({ ...prev, [cameraId]: null }));
    
    try {
      // Create a controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Try to fetch the camera's web interface
      // We use mode: 'no-cors' because camera web interfaces don't support CORS
      // This will throw if the connection times out or fails
      await fetch(`http://${ip}`, { 
        mode: 'no-cors',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      // If we get here, the request was sent (no-cors doesn't let us see the response)
      setConnectionStatus(prev => ({ ...prev, [cameraId]: 'success' }));
      toast({
        title: language === 'bn' ? 'সংযোগ সফল' : 'Connection Successful',
        description: language === 'bn' 
          ? `ক্যামেরা ${ip} এ সাড়া দিচ্ছে` 
          : `Camera at ${ip} is responding`,
      });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [cameraId]: 'failed' }));
      toast({
        title: language === 'bn' ? 'সংযোগ ব্যর্থ' : 'Connection Failed',
        description: language === 'bn' 
          ? `ক্যামেরা ${ip} এ পৌঁছানো যাচ্ছে না। নেটওয়ার্ক চেক করুন।` 
          : `Cannot reach camera at ${ip}. Check your network connection.`,
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === 'bn' ? 'কপি হয়েছে' : 'Copied',
      description: text,
    });
  };

  const openCameraWeb = (ip: string) => {
    window.open(`http://${ip}`, '_blank');
  };

  const openInVLC = (ip: string, name: string) => {
    const rtspUrl = `rtsp://${ip}:554/live/ch00_0`;
    // Create a .m3u playlist file that VLC will open
    const playlistContent = `#EXTM3U\n#EXTINF:-1,${name}\n${rtspUrl}`;
    const blob = new Blob([playlistContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: language === 'bn' ? 'ফাইল ডাউনলোড হয়েছে' : 'File Downloaded',
      description: language === 'bn' 
        ? 'ডাউনলোড করা .m3u ফাইলটি খুলুন - VLC স্বয়ংক্রিয়ভাবে শুরু হবে' 
        : 'Open the downloaded .m3u file - VLC will start automatically',
    });
  };

  return (
    <MainLayout>
      <Header 
        title={t.cameras.title} 
        subtitle={t.cameras.subtitle}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="stat-card p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">{t.cameras.totalCameras}</p>
            <p className="text-lg md:text-2xl font-bold mt-1">{cameras?.length || 0}</p>
          </div>
          <div className="stat-card bg-success/5 p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">{t.cameras.online}</p>
            <p className="text-lg md:text-2xl font-bold mt-1 text-success">{onlineCount}</p>
          </div>
          <div className="stat-card bg-destructive/5 p-3 md:p-6">
            <p className="text-xs md:text-sm text-muted-foreground">{t.cameras.offline}</p>
            <p className="text-lg md:text-2xl font-bold mt-1 text-destructive">
              {(cameras?.length || 0) - onlineCount}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{t.cameras.cameraIntegration}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'bn'
                  ? 'ক্যামেরা দেখতে Snapshot/MJPEG/Web UI মোড ব্যবহার করুন। HTTPS সাইটে লোকাল ক্যামেরা দেখতে হলে সরাসরি ক্যামেরার IP ব্রাউজারে খুলুন অথবা VLC ব্যবহার করুন।'
                  : 'Use Snapshot/MJPEG/Web UI modes to view cameras. For local cameras on HTTPS sites, open the camera IP directly in a new tab or use VLC for RTSP streaming.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {cameras?.map((camera) => (
              <Card key={camera.id} className="stat-card border-0 overflow-hidden">
                {/* Camera Preview */}
                <div className="aspect-video bg-black relative">
                  {camera.status === 'online' && camera.camera_id ? (() => {
                    const mode = streamMode[camera.id] || 'snapshot';
                    const ip = camera.camera_id;
                    const snapshotUrls = [
                      `http://${ip}/cgi-bin/snapshot.cgi`,
                      `http://${ip}/snap.jpg`,
                      `http://${ip}/snapshot.jpg`,
                      `http://${ip}/capture`,
                      `http://${ip}/image.jpg`,
                    ];
                    const mjpegUrls = [
                      `http://${ip}/video.mjpg`,
                      `http://${ip}/mjpeg/1`,
                      `http://${ip}/cgi-bin/mjpeg`,
                      `http://${ip}/videostream.cgi`,
                      `http://${ip}:8080/video`,
                    ];
                    const ts = snapshotKey[camera.id] || 0;

                    if (mode === 'iframe') {
                      return (
                        <iframe
                          src={`http://${ip}`}
                          className="w-full h-full border-0"
                          title={camera.name}
                          sandbox="allow-same-origin allow-scripts"
                        />
                      );
                    }

                    if (mode === 'mjpeg') {
                      return (
                        <img
                          src={mjpegUrls[0]}
                          alt={camera.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const currentIdx = mjpegUrls.indexOf(target.src);
                            if (currentIdx < mjpegUrls.length - 1) {
                              target.src = mjpegUrls[currentIdx + 1];
                            }
                          }}
                        />
                      );
                    }

                    return (
                      <img
                        key={ts}
                        src={`${snapshotUrls[0]}?t=${ts}`}
                        alt={camera.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const baseUrl = target.src.split('?')[0];
                          const currentIdx = snapshotUrls.indexOf(baseUrl);
                          if (currentIdx < snapshotUrls.length - 1) {
                            target.src = `${snapshotUrls[currentIdx + 1]}?t=${ts}`;
                          }
                        }}
                      />
                    );
                  })() : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {camera.status === 'online' ? (
                        <div className="text-center p-4">
                          <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                          <p className="text-sm text-muted-foreground mt-2">
                            {language === 'bn' ? 'IP ঠিকানা যুক্ত করুন' : 'Add IP address to view'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <WifiOff className="h-12 w-12 text-destructive/50 mx-auto" />
                          <p className="text-xs text-destructive mt-2">{t.cameras.offline}</p>
                        </div>
                      )}
                    </div>
                  )}

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
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteId(camera.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {camera.status === 'online' && camera.camera_id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-background/80"
                          onClick={() => setSnapshotKey(prev => ({ ...prev, [camera.id]: Date.now() }))}
                          title={language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-background/80"
                          onClick={() => window.open(`http://${camera.camera_id}`, '_blank')}
                          title={language === 'bn' ? 'পূর্ণ স্ক্রিন' : 'Full screen'}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {camera.name}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(camera)}
                    >
                      {camera.status === 'online' ? t.cameras.turnOff : t.cameras.turnOn}
                    </Button>
                  </CardTitle>
                  <CardDescription>{camera.location}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {camera.camera_id && camera.status === 'online' && (
                    <div className="flex gap-1">
                      {(['snapshot', 'mjpeg', 'iframe'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={(streamMode[camera.id] || 'snapshot') === mode ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setStreamMode(prev => ({ ...prev, [camera.id]: mode }))}
                        >
                          {mode === 'snapshot' ? (language === 'bn' ? 'স্ন্যাপশট' : 'Snapshot')
                            : mode === 'mjpeg' ? 'MJPEG'
                            : (language === 'bn' ? 'ওয়েব UI' : 'Web UI')}
                        </Button>
                      ))}
                    </div>
                  )}
                  {camera.camera_id && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">IP: {camera.camera_id}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(camera.camera_id!)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">RTSP: rtsp://{camera.camera_id}:554/live/ch00_0</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(`rtsp://${camera.camera_id}:554/live/ch00_0`)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 gap-1 md:gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-1 md:px-3"
                      disabled={!camera.camera_id || testingConnection === camera.id}
                      onClick={() => camera.camera_id && testConnection(camera.id, camera.camera_id)}
                    >
                      {testingConnection === camera.id ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      ) : connectionStatus[camera.id] === 'success' ? (
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-success" />
                      ) : connectionStatus[camera.id] === 'failed' ? (
                        <XCircle className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                      ) : (
                        <Wifi className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                      <span className="hidden md:inline ml-2">{language === 'bn' ? 'টেস্ট' : 'Test'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-1 md:px-3"
                      disabled={!camera.camera_id || camera.status === 'offline'}
                      onClick={() => camera.camera_id && openCameraWeb(camera.camera_id)}
                    >
                      <Monitor className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden md:inline ml-2">{language === 'bn' ? 'ওয়েব' : 'Web'}</span>
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-1 md:px-3"
                      disabled={!camera.camera_id || camera.status === 'offline'}
                      onClick={() => camera.camera_id && openInVLC(camera.camera_id, camera.name)}
                    >
                      <Play className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden md:inline ml-2">VLC</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-1 md:px-3"
                      disabled={!camera.camera_id}
                      onClick={() => camera.camera_id && copyToClipboard(camera.camera_id)}
                    >
                      <Smartphone className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden md:inline ml-2">{language === 'bn' ? 'অ্যাপ' : 'App'}</span>
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    {language === 'bn' 
                      ? 'টেস্ট বাটনে ক্লিক করে সংযোগ যাচাই করুন, তারপর VLC তে দেখুন'
                      : 'Click Test to verify connection, then view in VLC'}
                  </p>
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
              <Label>{language === 'bn' ? 'ক্যামেরা IP ঠিকানা' : 'Camera IP Address'}</Label>
              <Input 
                value={newCamera.camera_id} 
                onChange={(e) => setNewCamera({ ...newCamera, camera_id: e.target.value })}
                placeholder="192.168.1.100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'bn' 
                  ? 'আপনার V380 Pro ক্যামেরার IP ঠিকানা লিখুন'
                  : 'Enter your V380 Pro camera IP address'}
              </p>
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