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
import { Camera, Wifi, WifiOff, ExternalLink, Plus, Trash2, Copy, Monitor, Smartphone, Play } from 'lucide-react';
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
  const [rtspUrlByCameraId, setRtspUrlByCameraId] = useState<Record<string, string>>({});
  const [rtspCredentials, setRtspCredentials] = useState<Record<string, { username: string; password: string }>>({});

  const getCredentials = (cameraId: string) => rtspCredentials[cameraId] || { username: '', password: '' };

  const setCredentialsForCamera = (cameraId: string, field: 'username' | 'password', value: string) => {
    setRtspCredentials((prev) => ({
      ...prev,
      [cameraId]: { ...getCredentials(cameraId), [field]: value },
    }));
  };

  const buildRtspUrl = (ip: string, port: string, path: string, username?: string, password?: string) => {
    if (username && password) {
      return `rtsp://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ip}:${port}${path}`;
    }
    return `rtsp://${ip}:${port}${path}`;
  };

  const getDefaultRtspUrl = (ip: string, username?: string, password?: string) => 
    buildRtspUrl(ip, '554', '/live/ch00_0', username, password);

  const getRtspUrl = (camera: any) => {
    if (!camera?.camera_id) return '';
    const creds = getCredentials(camera.id);
    const customUrl = rtspUrlByCameraId[camera.id];
    if (customUrl) return customUrl;
    return getDefaultRtspUrl(camera.camera_id, creds.username, creds.password);
  };

  const setRtspUrlForCamera = (cameraId: string, value: string) => {
    setRtspUrlByCameraId((prev) => ({ ...prev, [cameraId]: value }));
  };

  const getRtspCandidates = (ip: string, username?: string, password?: string) => [
    { key: '554_ch00_0', label: '554 ch00_0', url: buildRtspUrl(ip, '554', '/live/ch00_0', username, password) },
    { key: '554_ch00_1', label: '554 ch00_1', url: buildRtspUrl(ip, '554', '/live/ch00_1', username, password) },
    { key: '8554_ch00_0', label: '8554 ch00_0', url: buildRtspUrl(ip, '8554', '/live/ch00_0', username, password) },
    { key: 'h264_main', label: 'h264 main', url: buildRtspUrl(ip, '554', '/h264Preview_01_main', username, password) },
  ];

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

  const openInVLC = (rtspUrl: string, name: string) => {
    if (!rtspUrl) return;
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
      description:
        language === 'bn'
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
                  ? 'আপনার V380 Pro ক্যামেরা দেখতে নীচের বিকল্পগুলি ব্যবহার করুন। ওয়েব ব্রাউজার সরাসরি RTSP স্ট্রিম দেখাতে পারে না।'
                  : 'Use the options below to view your V380 Pro camera. Web browsers cannot directly display RTSP streams.'}
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
                <div className="aspect-video bg-muted/30 relative flex items-center justify-center">
                  {camera.status === 'online' && camera.camera_id ? (
                    <div className="text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                        <Wifi className="h-8 w-8 text-success" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {language === 'bn' ? 'ক্যামেরা সংযুক্ত' : 'Camera Connected'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        IP: {camera.camera_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === 'bn' 
                          ? 'VLC বা V380 Pro অ্যাপ দিয়ে দেখুন'
                          : 'View with VLC or V380 Pro app'}
                      </p>
                    </div>
                  ) : camera.status === 'online' ? (
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
                    className="absolute top-2 left-2 h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteId(camera.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                  {camera.camera_id && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-3">
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

                      {/* RTSP Credentials */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">{language === 'bn' ? 'ইউজারনেম' : 'Username'}</Label>
                          <Input
                            value={getCredentials(camera.id).username}
                            onChange={(e) => setCredentialsForCamera(camera.id, 'username', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="admin"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</Label>
                          <Input
                            type="password"
                            value={getCredentials(camera.id).password}
                            onChange={(e) => setCredentialsForCamera(camera.id, 'password', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'RTSP লিংক' : 'RTSP URL'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(getRtspUrl(camera))}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Input
                          value={getRtspUrl(camera)}
                          onChange={(e) => setRtspUrlForCamera(camera.id, e.target.value)}
                          className="h-9 text-xs"
                          placeholder="rtsp://user:pass@192.168.0.102:554/live/ch00_0"
                        />
                        <div className="flex flex-wrap gap-1">
                          {getRtspCandidates(camera.camera_id, getCredentials(camera.id).username, getCredentials(camera.id).password).map((opt) => (
                            <Button
                              key={opt.key}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setRtspUrlForCamera(camera.id, opt.url)}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language === 'bn'
                            ? 'ইউজারনেম/পাসওয়ার্ড দিন, তারপর একটি স্ট্রিম বাটনে ক্লিক করুন।'
                            : 'Enter username/password, then click a stream button.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-2 md:px-3"
                      disabled={!camera.camera_id || camera.status === 'offline'}
                      onClick={() => camera.camera_id && openCameraWeb(camera.camera_id)}
                    >
                      <Monitor className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                      <span className="hidden md:inline">{language === 'bn' ? 'ওয়েব' : 'Web'}</span>
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-2 md:px-3"
                      disabled={!camera.camera_id || camera.status === 'offline'}
                      onClick={() => openInVLC(getRtspUrl(camera), camera.name)}
                    >
                      <Play className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                      <span className="hidden md:inline">VLC</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs md:text-sm px-2 md:px-3"
                      disabled={!camera.camera_id}
                      onClick={() => camera.camera_id && copyToClipboard(camera.camera_id)}
                    >
                      <Smartphone className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                      <span className="hidden md:inline">{language === 'bn' ? 'অ্যাপ' : 'App'}</span>
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    {language === 'bn' 
                      ? 'VLC তে RTSP URL পেস্ট করুন অথবা V380 Pro অ্যাপ ব্যবহার করুন'
                      : 'Paste RTSP URL in VLC or use V380 Pro app'}
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