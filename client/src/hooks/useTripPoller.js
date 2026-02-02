import { useEffect, useRef, useState } from 'react';
import { getTripStatus } from '../services/tripApi';

export default function useTripPoller(
  tripRequestId,
  { interval = 3000, enabled = false, maxInterval = 30000, onStatusChange } = {}
) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const mountedRef = useRef(true);
  const currentIntervalRef = useRef(interval);
  const prevStatusRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchOnce = async () => {
    try {
      const resp = await getTripStatus(tripRequestId);
      setData(resp);
      setError(null);

      // reset backoff on success
      currentIntervalRef.current = interval;

      // call status change handler if changed
      if (prevStatusRef.current !== resp?.status) {
        prevStatusRef.current = resp?.status;
        if (typeof onStatusChange === 'function') onStatusChange(resp?.status, resp);
      }

      return true;
    } catch (err) {
      setError(err);
      // exponential backoff
      currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, maxInterval);
      return false;
    }
  };

  useEffect(() => {
    if (!tripRequestId) return;
    if (!isPolling) return;

    let cancelled = false;

    const runner = async () => {
      while (!cancelled && mountedRef.current) {
        await fetchOnce();
        await new Promise((res) => setTimeout(res, currentIntervalRef.current));
      }
    };

    runner();

    return () => {
      cancelled = true;
    };
  }, [tripRequestId, isPolling, interval, maxInterval]);

  return {
    data,
    error,
    isPolling,
    start: () => setIsPolling(true),
    stop: () => setIsPolling(false),
  };
}
