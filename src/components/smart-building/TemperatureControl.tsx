import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Thermometer, Droplets, Fan, Snowflake, Flame, Power } from 'lucide-react';
import { generateTemperatureReadings, SimulatedTemperature } from '@/lib/simulatedData';
import { useMemo, useState } from 'react';

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'cooling':
      return <Snowflake className="h-4 w-4 text-blue-500" />;
    case 'heating':
      return <Flame className="h-4 w-4 text-orange-500" />;
    case 'auto':
      return <Fan className="h-4 w-4 text-green-500" />;
    default:
      return <Power className="h-4 w-4 text-muted-foreground" />;
  }
};

const getModeColor = (mode: string) => {
  switch (mode) {
    case 'cooling':
      return 'bg-blue-500/10 text-blue-600 border-blue-500';
    case 'heating':
      return 'bg-orange-500/10 text-orange-600 border-orange-500';
    case 'auto':
      return 'bg-green-500/10 text-green-600 border-green-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getTemperatureColor = (temp: number, target: number) => {
  const diff = Math.abs(temp - target);
  if (diff <= 1) return 'text-green-500';
  if (diff <= 3) return 'text-yellow-500';
  return 'text-orange-500';
};

export const TemperatureControl = () => {
  const initialReadings = useMemo(() => generateTemperatureReadings(), []);
  const [readings, setReadings] = useState<SimulatedTemperature[]>(initialReadings);

  const avgTemp = readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length;
  const avgHumidity = readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length;

  const handleModeChange = (location: string, mode: string) => {
    setReadings(prev => prev.map(r => 
      r.location === location ? { ...r, hvacMode: mode as any } : r
    ));
  };

  const handleTargetChange = (location: string, target: number[]) => {
    setReadings(prev => prev.map(r => 
      r.location === location ? { ...r, targetTemp: target[0] } : r
    ));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Average Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTemp.toFixed(1)}°C</div>
            <p className="text-sm text-muted-foreground">Across all zones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Average Humidity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHumidity.toFixed(0)}%</div>
            <p className="text-sm text-muted-foreground">Relative humidity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              Cooling Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {readings.filter(r => r.hvacMode === 'cooling').length}
            </div>
            <p className="text-sm text-muted-foreground">zones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Fan className="h-4 w-4 text-green-500" />
              Auto Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {readings.filter(r => r.hvacMode === 'auto').length}
            </div>
            <p className="text-sm text-muted-foreground">zones</p>
          </CardContent>
        </Card>
      </div>

      {/* Zone Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {readings.map(reading => (
          <Card key={reading.location} className={`border-2 ${getModeColor(reading.hvacMode)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{reading.location}</CardTitle>
                <Badge variant="outline" className={getModeColor(reading.hvacMode)}>
                  {getModeIcon(reading.hvacMode)}
                  <span className="ml-1 capitalize">{reading.hvacMode}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Temperature */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className={`text-3xl font-bold ${getTemperatureColor(reading.temperature, reading.targetTemp)}`}>
                    {reading.temperature.toFixed(1)}°C
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Humidity</p>
                  <p className="text-xl font-semibold flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    {reading.humidity}%
                  </p>
                </div>
              </div>

              {/* Target Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Target Temperature</span>
                  <span className="font-medium">{reading.targetTemp}°C</span>
                </div>
                <Slider
                  value={[reading.targetTemp]}
                  min={16}
                  max={30}
                  step={1}
                  onValueChange={(value) => handleTargetChange(reading.location, value)}
                  className="w-full"
                  disabled={reading.hvacMode === 'off'}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>16°C</span>
                  <span>30°C</span>
                </div>
              </div>

              {/* Mode Selector */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">HVAC Mode</p>
                <Select
                  value={reading.hvacMode}
                  onValueChange={(value) => handleModeChange(reading.location, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooling">
                      <div className="flex items-center gap-2">
                        <Snowflake className="h-4 w-4 text-blue-500" />
                        Cooling
                      </div>
                    </SelectItem>
                    <SelectItem value="heating">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Heating
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Fan className="h-4 w-4 text-green-500" />
                        Auto
                      </div>
                    </SelectItem>
                    <SelectItem value="off">
                      <div className="flex items-center gap-2">
                        <Power className="h-4 w-4 text-muted-foreground" />
                        Off
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
