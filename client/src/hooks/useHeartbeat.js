import { useEffect } from 'react';
import { driverApi } from '../services/driverApi';
import { getCurrentPositionPromise } from '../utils/location';
import { useDriver } from '../context/DriverContext';

export default function useHeartbeat({ enabled }) {
  const { driver ,runtimeStatus} = useDriver();

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      const loc = await getCurrentPositionPromise();
      // Debug log for driver and runtimeStatus
      console.log('[HEARTBEAT FRONTEND DEBUG] driver:', driver);
      console.log('[HEARTBEAT FRONTEND DEBUG] runtimeStatus:', runtimeStatus);
      // Use city_id from driver or runtimeStatus as fallback
      const payload = {
        ...loc,
        tenant_id: driver?.tenant_id,
        city_id: driver?.city_id,
      };
      console.log('[HEARTBEAT FRONTEND DEBUG] payload:', payload);
      await driverApi.sendLocationHeartbeat(payload);
    };

    tick();
    const id = setInterval(tick, 25000);
    return () => clearInterval(id);
  }, [enabled, driver, runtimeStatus]);
}