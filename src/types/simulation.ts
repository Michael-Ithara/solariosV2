export interface DeviceTemplate {
  id: string;
  name: string;
  category: string;
  powerRating: number; // watts
  icon: string;
  description: string;
  usagePattern: UsagePattern;
  features?: string[];
}

export interface UsagePattern {
  baseUsage: number; // 0-1 multiplier of power rating
  peakHours: number[]; // hours of day (0-23)
  peakMultiplier: number; // multiplier during peak hours
  randomVariance: number; // 0-1 random variation
  weatherDependent?: boolean;
  seasonalVariance?: number;
}

export interface SimulatedDevice {
  id: string;
  templateId: string;
  name: string;
  status: 'on' | 'off' | 'standby';
  powerRating: number;
  currentUsage: number;
  scheduledTasks: ScheduledTask[];
  settings: DeviceSettings;
  lastUsageUpdate: string;
}

export interface ScheduledTask {
  id: string;
  deviceId: string;
  action: 'turn_on' | 'turn_off' | 'set_temperature' | 'set_brightness';
  scheduledTime: string;
  value?: number;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // 0-6 for weekly
  };
}

export interface DeviceSettings {
  temperature?: number;
  brightness?: number;
  timer?: number;
  autoMode?: boolean;
  ecoMode?: boolean;
}

export interface SimulationState {
  devices: SimulatedDevice[];
  currentTime: Date;
  weather: WeatherState;
  solarProduction: number;
  gridPrice: number;
  totalConsumption: number;
  isRunning: boolean;
  speedMultiplier: number; // 1 = real time, 60 = 1 hour per minute
}

export interface WeatherState {
  temperature: number;
  cloudCover: number; // 0-1
  windSpeed: number;
  humidity: number;
  condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy';
}

export interface SimulationEvent {
  id: string;
  type: 'device_update' | 'energy_data' | 'alert' | 'weather_change';
  timestamp: string;
  data: any;
}