import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

  // Memoized calculations to prevent unnecessary re-renders
  const totalConsumption = useMemo(() => 
    simulationState.devices.reduce((sum, device) => sum + device.currentUsage, 0),
    [simulationState.devices]
  );

  const solarProduction = useMemo(() => {
    const now = simulationState.currentTime;
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    if (hour < 6 || hour > 18) return 0;
    
    const dayProgress = (hour - 6 + minute / 60) / 12;
    const solarCurve = Math.sin(dayProgress * Math.PI);
    const cloudReduction = 1 - (simulationState.weather.cloudCover * 0.7);
    
    return Math.max(0, solarCurve * 8 * cloudReduction);
  }, [simulationState.currentTime, simulationState.weather.cloudCover]);

  const gridPrice = useMemo(() => {
    const hour = simulationState.currentTime.getHours();
    if (hour >= 16 && hour <= 20) return 0.25; // Peak
    if (hour >= 9 && hour <= 16) return 0.15; // Mid-peak
    return 0.12; // Off-peak
  }, [simulationState.currentTime]);

  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const isDemoMode = location.pathname === '/demo' || !user;

  // Auto-start simulation on mount for demo mode
  useEffect(() => {
    if (isDemoMode) {
      loadDemoDevices().then(() => {
        setTimeout(startSimulation, 1000); // Slight delay for smoother UX
      });
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

  // Update calculated values in state
  useEffect(() => {
    setSimulationState(prev => ({
      ...prev,
      totalConsumption,
      solarProduction,
      gridPrice
    }));
  }, [totalConsumption, solarProduction, gridPrice]);

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

    // Optimized simulation loop - smoother updates
    intervalRef.current = setInterval(() => {
      setSimulationState(prev => {
        const now = new Date(prev.currentTime.getTime() + 30000); // Advance 30 seconds
        const minute = now.getMinutes();
        
        // Gradual weather changes for smoother transitions
        const shouldUpdateWeather = minute % 2 === 0; // Every 2 minutes
        let newWeather = prev.weather;
        if (shouldUpdateWeather) {
          const cloudVariation = (Math.random() - 0.5) * 0.05;
          const tempVariation = (Math.random() - 0.5) * 0.2;
          
          newWeather = {
            ...prev.weather,
            cloudCover: Math.max(0, Math.min(1, prev.weather.cloudCover + cloudVariation)),
            temperature: Math.max(10, Math.min(35, prev.weather.temperature + tempVariation)),
            condition: prev.weather.cloudCover > 0.7 ? 'cloudy' : 
                      prev.weather.cloudCover > 0.4 ? 'partly-cloudy' : 'sunny'
          };
        }

        return {
          ...prev,
          currentTime: now,
          weather: newWeather
        };
      });
    }, 3000); // Update every 3 seconds for smoother flow
  }, []);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSimulationState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    setSimulationState(prev => ({
      ...prev,
      currentTime: new Date(),
      weather: {
        temperature: 22,
        cloudCover: 0.3,
        windSpeed: 5,
        humidity: 65,
        condition: 'cloudy'
      },
      devices: prev.devices.map(device => ({
        ...device,
        status: 'off',
        currentUsage: 0,
        lastUsageUpdate: new Date().toISOString()
      }))
    }));
    
    // Auto-restart after reset for smooth demo experience
    if (isDemoMode) {
      setTimeout(startSimulation, 1000);
    }
  }, [stopSimulation, startSimulation, isDemoMode]);

  return {
    simulationState,
    addDevice,
    toggleDevice,
    removeDevice,
    startSimulation,
    stopSimulation,
    resetSimulation,
    isDemoMode
  };
}