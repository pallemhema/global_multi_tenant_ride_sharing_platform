import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";

export default function Assigned() {
  const { tripRequestId } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [otp, setOtp] = useState(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        // Get trip status (includes OTP now)
        const res = await tripApi.getTripStatus(tripRequestId);
        if (!mounted) return;
        console.log("Trip Status Response:", res);
        setInfo(res || {});

        // OTP is now included in the status response
        if (res?.otp) {
          setOtp(res.otp);
        }

        if (res?.status === "in_progress") {
          // Get trip_id from assigned_info (where it's nested)
          const tripId = res?.assigned_info?.trip_id;
          if (tripId) {
            navigate(`/rider/in-progress/${tripId}`);
          } else {
            console.error("Trip ID not available in response:", res);
          }
        }
        // If driver cancelled after assignment, send rider back to searching
        else if (res?.status === "cancelled") {
          navigate(`/rider/searching/${tripRequestId}`);
        }
      } catch (e) {
        console.error("Trip status error:", e);
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tripRequestId, navigate]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Driver assigned</h1>
      {info?.assigned_info ? (
        <div className="p-4 bg-white rounded shadow">
          <div className="font-semibold text-lg">
            {info.assigned_info.driver_name || "Driver"}
          </div>
          <div className="text-sm text-slate-600">
            {info.assigned_info.vehicle_number || "—"} •{" "}
            {info.assigned_info.vehicle_type || "—"}
          </div>
          {info.assigned_info.driver_rating_avg && (
            <div className="text-sm text-yellow-600 mb-3">
              ⭐ {info.assigned_info.driver_rating_avg} (
              {info.assigned_info.driver_rating_count || 0} reviews)
            </div>
          )}
          <div className="mt-4 p-3 bg-slate-100 rounded border-2 border-indigo-500">
            <p className="text-xs text-slate-600 mb-1">Trip OTP</p>
            <div className="text-3xl font-bold tracking-widest">
              {otp || info.otp || info.driver_otp || "—"}
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3">
            Share this OTP with your driver to start the trip
          </p>
          {info.assigned_info.driver_phone && (
            <p className="text-sm text-slate-600 mt-2">
              Driver: {info.assigned_info.driver_phone}
            </p>
          )}
          {info.assigned_info.eta_minutes && (
            <p className="text-sm text-slate-600 mt-1">
              ETA: {info.assigned_info.eta_minutes} minutes
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 bg-slate-100 text-slate-600">
          Loading driver info…
        </div>
      )}
    </div>
  );
}
