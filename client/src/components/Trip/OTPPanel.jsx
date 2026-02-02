import React, { useState } from 'react';
import { getTripOtp, resendTripOtp } from '../../services/tripApi';

export default function OTPPanel({ tripRequestId }) {
  const [otp, setOtp] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!tripRequestId) return null;

  const fetchOtp = async () => {
    setLoading(true);
    try {
      const r = await getTripOtp(tripRequestId);
      setOtp(r.otp);
    } catch (err) {
      console.error('getTripOtp failed', err);
      alert('OTP not available (production disabled or expired)');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendTripOtp(tripRequestId);
      alert('OTP regenerated (dev)');
      await fetchOtp();
    } catch (err) {
      console.error('resendTripOtp failed', err);
      alert('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 border rounded-md bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">OTP (dev)</div>
        <div className="flex gap-2">
          <button onClick={fetchOtp} className="px-2 py-1 text-sm bg-indigo-500 text-white rounded">Show OTP</button>
          <button onClick={handleResend} className="px-2 py-1 text-sm bg-gray-200 rounded">Resend</button>
        </div>
      </div>

      <div className="mt-3 text-2xl font-mono text-center">{loading ? '…' : otp || '—'}</div>
    </div>
  );
}
