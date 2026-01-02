// Generate simulated utility data for demonstration purposes
import { format, subDays, subMonths } from 'date-fns';

export interface SimulatedReading {
  date: string;
  electricity: number;
  water: number;
  gas: number;
  electricityCost: number;
  waterCost: number;
  gasCost: number;
}

// Cost per unit in BDT
export const COST_PER_UNIT = {
  electricity: 8.5, // BDT per kWh
  water: 15, // BDT per cubic meter
  gas: 12, // BDT per cubic meter
};

// Generate daily readings for the past N days
export const generateDailyReadings = (days: number = 30): SimulatedReading[] => {
  const readings: SimulatedReading[] = [];
  const baseElectricity = 150; // kWh per day
  const baseWater = 25; // cubic meters per day
  const baseGas = 10; // cubic meters per day

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    
    // Weekend consumption is typically higher
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1;
    
    // Random variation ±20%
    const variation = () => 0.8 + Math.random() * 0.4;
    
    const electricity = Math.round(baseElectricity * weekendMultiplier * variation());
    const water = Math.round(baseWater * weekendMultiplier * variation() * 10) / 10;
    const gas = Math.round(baseGas * weekendMultiplier * variation() * 10) / 10;

    readings.push({
      date: format(date, 'yyyy-MM-dd'),
      electricity,
      water,
      gas,
      electricityCost: Math.round(electricity * COST_PER_UNIT.electricity),
      waterCost: Math.round(water * COST_PER_UNIT.water),
      gasCost: Math.round(gas * COST_PER_UNIT.gas),
    });
  }

  return readings;
};

// Generate monthly readings for the past N months
export const generateMonthlyReadings = (months: number = 12): SimulatedReading[] => {
  const readings: SimulatedReading[] = [];
  const baseElectricity = 4500; // kWh per month
  const baseWater = 750; // cubic meters per month
  const baseGas = 300; // cubic meters per month

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const month = date.getMonth();
    
    // Summer months (Apr-Sep) have higher electricity (AC), winter (Nov-Feb) higher gas
    const summerMultiplier = month >= 3 && month <= 8 ? 1.4 : 1;
    const winterMultiplier = month >= 10 || month <= 1 ? 1.3 : 1;
    
    // Random variation ±15%
    const variation = () => 0.85 + Math.random() * 0.3;
    
    const electricity = Math.round(baseElectricity * summerMultiplier * variation());
    const water = Math.round(baseWater * variation());
    const gas = Math.round(baseGas * winterMultiplier * variation());

    readings.push({
      date: format(date, 'yyyy-MM'),
      electricity,
      water,
      gas,
      electricityCost: Math.round(electricity * COST_PER_UNIT.electricity),
      waterCost: Math.round(water * COST_PER_UNIT.water),
      gasCost: Math.round(gas * COST_PER_UNIT.gas),
    });
  }

  return readings;
};

// Generate per-flat readings
export const generateFlatReadings = (flatNumber: string, days: number = 7): SimulatedReading[] => {
  const readings: SimulatedReading[] = [];
  const floor = parseInt(flatNumber.charAt(0));
  
  // Higher floors typically have slightly higher consumption
  const floorMultiplier = 1 + (floor - 2) * 0.05;
  
  const baseElectricity = 8; // kWh per day per flat
  const baseWater = 1.2; // cubic meters per day per flat
  const baseGas = 0.5; // cubic meters per day per flat

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const variation = () => 0.7 + Math.random() * 0.6;
    
    const electricity = Math.round(baseElectricity * floorMultiplier * variation() * 10) / 10;
    const water = Math.round(baseWater * floorMultiplier * variation() * 100) / 100;
    const gas = Math.round(baseGas * floorMultiplier * variation() * 100) / 100;

    readings.push({
      date: format(date, 'yyyy-MM-dd'),
      electricity,
      water,
      gas,
      electricityCost: Math.round(electricity * COST_PER_UNIT.electricity * 100) / 100,
      waterCost: Math.round(water * COST_PER_UNIT.water * 100) / 100,
      gasCost: Math.round(gas * COST_PER_UNIT.gas * 100) / 100,
    });
  }

  return readings;
};

// Generate simulated alerts
export interface SimulatedAlert {
  id: string;
  type: 'high_consumption' | 'leak_detection' | 'anomaly' | 'maintenance_due';
  utility: 'electricity' | 'water' | 'gas' | 'hvac';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  flatNumber?: string;
  timestamp: Date;
  isResolved: boolean;
}

export const generateSimulatedAlerts = (): SimulatedAlert[] => {
  return [
    {
      id: '1',
      type: 'high_consumption',
      utility: 'electricity',
      title: 'High Electricity Usage - Flat 4B',
      description: 'Consumption 45% above average for the past 3 days',
      severity: 'high',
      flatNumber: '4B',
      timestamp: subDays(new Date(), 1),
      isResolved: false,
    },
    {
      id: '2',
      type: 'leak_detection',
      utility: 'water',
      title: 'Potential Water Leak Detected',
      description: 'Unusual water flow pattern detected in common area pipeline',
      severity: 'critical',
      timestamp: subDays(new Date(), 0),
      isResolved: false,
    },
    {
      id: '3',
      type: 'anomaly',
      utility: 'gas',
      title: 'Gas Usage Anomaly - Floor 5',
      description: 'Gas consumption pattern differs from historical trend',
      severity: 'medium',
      timestamp: subDays(new Date(), 2),
      isResolved: false,
    },
    {
      id: '4',
      type: 'maintenance_due',
      utility: 'hvac',
      title: 'HVAC Filter Replacement Due',
      description: 'Central AC unit filter needs replacement (90 days since last change)',
      severity: 'low',
      timestamp: subDays(new Date(), 5),
      isResolved: false,
    },
    {
      id: '5',
      type: 'high_consumption',
      utility: 'water',
      title: 'High Water Usage - Flat 3A',
      description: 'Consumption 30% above monthly average',
      severity: 'medium',
      flatNumber: '3A',
      timestamp: subDays(new Date(), 3),
      isResolved: true,
    },
  ];
};

// Generate temperature readings for different locations
export interface SimulatedTemperature {
  location: string;
  temperature: number;
  humidity: number;
  hvacMode: 'cooling' | 'heating' | 'auto' | 'off';
  targetTemp: number;
}

export const generateTemperatureReadings = (): SimulatedTemperature[] => {
  const locations = [
    'Lobby',
    'Parking Level 1',
    'Parking Level 2',
    'Rooftop',
    'Generator Room',
    'Common Hall',
  ];

  return locations.map(location => ({
    location,
    temperature: Math.round((22 + Math.random() * 8) * 10) / 10,
    humidity: Math.round(50 + Math.random() * 30),
    hvacMode: ['cooling', 'heating', 'auto', 'off'][Math.floor(Math.random() * 4)] as 'cooling' | 'heating' | 'auto' | 'off',
    targetTemp: 24,
  }));
};

// Generate maintenance schedules
export interface SimulatedMaintenance {
  id: string;
  equipment: string;
  type: string;
  location: string;
  lastMaintenance: Date;
  nextMaintenance: Date;
  frequency: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
}

export const generateMaintenanceSchedules = (): SimulatedMaintenance[] => {
  return [
    {
      id: '1',
      equipment: 'Central AC Unit',
      type: 'hvac',
      location: 'Rooftop',
      lastMaintenance: subDays(new Date(), 85),
      nextMaintenance: subDays(new Date(), -5),
      frequency: 90,
      status: 'scheduled',
    },
    {
      id: '2',
      equipment: 'Elevator 1',
      type: 'elevator',
      location: 'Building Core',
      lastMaintenance: subDays(new Date(), 25),
      nextMaintenance: subDays(new Date(), -5),
      frequency: 30,
      status: 'in_progress',
    },
    {
      id: '3',
      equipment: 'Generator',
      type: 'generator',
      location: 'Basement',
      lastMaintenance: subDays(new Date(), 55),
      nextMaintenance: subDays(new Date(), 5),
      frequency: 60,
      status: 'scheduled',
    },
    {
      id: '4',
      equipment: 'Water Pump',
      type: 'water_pump',
      location: 'Underground Tank',
      lastMaintenance: subDays(new Date(), 92),
      nextMaintenance: subDays(new Date(), -2),
      frequency: 90,
      status: 'overdue',
    },
    {
      id: '5',
      equipment: 'Fire Safety System',
      type: 'electrical',
      location: 'All Floors',
      lastMaintenance: subDays(new Date(), 170),
      nextMaintenance: subDays(new Date(), 10),
      frequency: 180,
      status: 'completed',
    },
  ];
};
