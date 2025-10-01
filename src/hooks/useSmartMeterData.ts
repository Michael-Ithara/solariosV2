import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SmartMeterGraph {
  meter: {
    id: string;
    name: string;
    timezone: string | null;
  } | null;
  inverters: Array<{
    id: string;
    name: string;
    capacity_kw: number | null;
  }>;
  circuits: Array<{
    id: string;
    name: string;
    breaker_rating_amps: number | null;
  }>;
  devices: Array<{
    id: string;
    name: string;
    status: 'on' | 'off';
    power_rating_w: number;
    total_kwh: number;
    circuit_id: string | null;
  }>;
}

export function useSmartMeterData() {
  const { user } = useAuth();
  const [graph, setGraph] = useState<SmartMeterGraph>({ meter: null, inverters: [], circuits: [], devices: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setGraph({ meter: null, inverters: [], circuits: [], devices: [] });
      setIsLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: meters } = await supabase
          .from('smart_meters')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        const meter = meters?.[0] || null;

        if (!meter) {
          // Backfill path: if no meter yet, derive devices from appliances for parity
          const { data: appliances } = await supabase
            .from('appliances')
            .select('*')
            .eq('user_id', user.id);

          setGraph({
            meter: null,
            inverters: [],
            circuits: [],
            devices: (appliances || []).map(a => ({
              id: a.id,
              name: a.name,
              status: a.status,
              power_rating_w: a.power_rating_w || 0,
              total_kwh: Number(a.total_kwh || 0),
              circuit_id: null
            }))
          });
          return;
        }

        const [invertersRes, circuitsRes, devicesRes] = await Promise.all([
          supabase.from('inverters').select('*').eq('meter_id', meter.id),
          supabase.from('circuits').select('*').eq('meter_id', meter.id),
          supabase.from('device_instances').select('*').eq('meter_id', meter.id)
        ]);

        setGraph({
          meter: { id: meter.id, name: meter.name, timezone: meter.timezone },
          inverters: (invertersRes.data || []).map(inv => ({ id: inv.id, name: inv.name, capacity_kw: inv.capacity_kw })),
          circuits: (circuitsRes.data || []).map(c => ({ id: c.id, name: c.name, breaker_rating_amps: c.breaker_rating_amps })),
          devices: (devicesRes.data || []).map(d => ({
            id: d.id,
            name: d.name,
            status: d.status,
            power_rating_w: d.power_rating_w || 0,
            total_kwh: Number(d.total_kwh || 0),
            circuit_id: d.circuit_id || null
          }))
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load smart meter data';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  return { graph, isLoading, error };
}


