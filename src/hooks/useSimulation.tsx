import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DeviceTemplate, SimulatedDevice, SimulationState, WeatherState } from '@/types/simulation';
import { useToast } from '@/components/ui/use-toast';

export function useSimulation() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [simulationState, setSimulationState] = useState<SimulationState>({
    devices: [],
    currentTime: new Date(),
    weather: {
      temperature: 22,
      cloudCover: 0.3,
      windSpeed: 5,
      humidity: 65,
      condition: 'cloudy'
    } as WeatherState,
    solarProduction: 0,
    gridPrice: 0.12,
    totalConsumption: 0,
    isRunning: false,
    speedMultiplier: 1
  });

  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const isDemoMode = location.pathname === '/demo' || !user;

  // Initialize simulation
  useEffect(() => {
    if (isDemoMode) {
      loadDemoDevices();
      startSimulation();
    } else {
      loadUserDevices();
    }
    
    return () => {
      stopSimulation();
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [isDemoMode, user]);

  const loadDemoDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_appliances')
        .select('*');

      if (error) throw error;

      const simulatedDevices: SimulatedDevice[] = data.map(device => ({
        id: device.id,
        templateId: 'legacy',
        name: device.name,
        status: device.status as 'on' | 'off',
        powerRating: device.power_rating_w || 0,
        currentUsage: device.status === 'on' ? (device.power_rating_w || 0) / 1000 : 0,
        scheduledTasks: [],
        settings: {},
        lastUsageUpdate: new Date().toISOString()
      }));

      setSimulationState(prev => ({
        ...prev,
        devices: simulatedDevices
      }));
    } catch (error) {
      console.error('Error loading demo devices:', error);
    }
  };

  const loadUserDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const simulatedDevices: SimulatedDevice[] = data.map(device => ({
        id: device.id,
        templateId: 'user',
        name: device.name,
        status: device.status as 'on' | 'off',
        powerRating: device.power_rating_w || 0,
        currentUsage: device.status === 'on' ? (device.power_rating_w || 0) / 1000 : 0,
        scheduledTasks: [],
        settings: {},
        lastUsageUpdate: new Date().toISOString()
      }));

      setSimulationState(prev => ({
        ...prev,
        devices: simulatedDevices
      }));
    } catch (error) {
      console.error('Error loading user devices:', error);
    }
  };

  const addDevice = useCallback(async (template: DeviceTemplate, customName?: string) => {
    const newDevice: SimulatedDevice = {
      id: Date.now().toString(),
      templateId: template.id,
      name: customName || template.name,
      status: 'off',
      powerRating: template.powerRating,
      currentUsage: 0,
      scheduledTasks: [],
      settings: {},
      lastUsageUpdate: new Date().toISOString()
    };

    if (isDemoMode) {
      // For demo mode, just update local state
      setSimulationState(prev => ({
        ...prev,
        devices: [...prev.devices, newDevice]
      }));
    } else if (user) {
      // For authenticated users, save to database
      try {
        const { error } = await supabase
          .from('appliances')
          .insert({
            user_id: user.id,
            name: newDevice.name,
            power_rating_w: newDevice.powerRating,
            status: 'off',
            total_kwh: 0
          });

        if (error) throw error;

        setSimulationState(prev => ({
          ...prev,
          devices: [...prev.devices, newDevice]
        }));

        toast({
          title: "Device Added",
          description: `${newDevice.name} has been added to your simulation`,
        });
      } catch (error) {
        console.error('Error adding device:', error);
        toast({
          title: "Error",
          description: "Failed to add device",
          variant: "destructive",
        });
      }
    }
  }, [isDemoMode, user, toast]);

  const toggleDevice = useCallback(async (deviceId: string) => {
    setSimulationState(prev => ({
      ...prev,
      devices: prev.devices.map(device => {
        if (device.id === deviceId) {
          const newStatus = device.status === 'on' ? 'off' : 'on';
          const newUsage = newStatus === 'on' ? device.powerRating / 1000 : 0;
          
          return {
            ...device,
            status: newStatus,
            currentUsage: newUsage,
            lastUsageUpdate: new Date().toISOString()
          };
        }
        return device;
      })
    }));

    // Update database if not in demo mode
    if (!isDemoMode && user) {
      try {
        const device = simulationState.devices.find(d => d.id === deviceId);
        if (!device) return;

        const newStatus = device.status === 'on' ? 'off' : 'on';
        
        await supabase
          .from('appliances')
          .update({ status: newStatus })
          .eq('id', deviceId)
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating device:', error);
      }
    }
  }, [isDemoMode, user, simulationState.devices]);

  const removeDevice = useCallback(async (deviceId: string) => {
    if (isDemoMode) {
      setSimulationState(prev => ({
        ...prev,
        devices: prev.devices.filter(device => device.id !== deviceId)
      }));
    } else if (user) {
      try {
        await supabase
          .from('appliances')
          .delete()
          .eq('id', deviceId)
          .eq('user_id', user.id);

        setSimulationState(prev => ({
          ...prev,
          devices: prev.devices.filter(device => device.id !== deviceId)
        }));

        toast({
          title: "Device Removed",
          description: "Device has been removed from your simulation",
        });
      } catch (error) {
        console.error('Error removing device:', error);
        toast({
          title: "Error",
          description: "Failed to remove device",
          variant: "destructive",
        });
      }
    }
  }, [isDemoMode, user, toast]);

  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;

    setSimulationState(prev => ({ ...prev, isRunning: true }));

    intervalRef.current = setInterval(() => {
      setSimulationState(prev => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Simulate solar production based on time of day
        let solarProduction = 0;
        if (hour >= 6 && hour <= 18) {
          const dayProgress = (hour - 6) / 12;
          const solarCurve = Math.sin(dayProgress * Math.PI);
          solarProduction = solarCurve * 8 * (1 - prev.weather.cloudCover * 0.7); // Max 8kW
        }

        // Calculate total consumption
        const totalConsumption = prev.devices.reduce((sum, device) => 
          sum + device.currentUsage, 0
        );

        // Update weather occasionally
        const shouldUpdateWeather = minute % 5 === 0; // Every 5 minutes
        let newWeather = prev.weather;
        if (shouldUpdateWeather) {
          newWeather = {
            ...prev.weather,
            cloudCover: Math.max(0, Math.min(1, prev.weather.cloudCover + (Math.random() - 0.5) * 0.1)),
            temperature: prev.weather.temperature + (Math.random() - 0.5) * 0.5,
          };
        }

        return {
          ...prev,
          currentTime: now,
          weather: newWeather,
          solarProduction,
          totalConsumption
        };
      });
    }, 10000); // Update every 10 seconds
  }, []);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSimulationState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const setSpeedMultiplier = useCallback((speed: number) => {
    setSimulationState(prev => ({ ...prev, speedMultiplier: speed }));
  }, []);

  return {
    simulationState,
    addDevice,
    toggleDevice,
    removeDevice,
    startSimulation,
    stopSimulation,
    setSpeedMultiplier,
    isDemoMode
  };
}