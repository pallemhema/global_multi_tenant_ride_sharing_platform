// src/hooks/useHeartbeat.js
import { useEffect } from 'react';
import { driverApi } from '../services/driverApi';
import { getCurrentPositionPromise } from '../utils/location';

export default function useHeartbeat({ enabled }) {
  useEffect(() => {
  

    if (!enabled) return;

    const tick = async () => {
      const loc = await getCurrentPositionPromise();
      await driverApi.sendLocationHeartbeat(loc);
    };

    tick();
    const id = setInterval(tick, 25000);
    return () => clearInterval(id);
  }, [enabled]);
}
