import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";

export default function Searching() {
  const { tripRequestId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const res = await tripApi.getTripStatus(tripRequestId);
        if (!mounted) return;
        setStatus(res);
        if (res?.status === "driver_assigned") {
          navigate(`/rider/assigned/${tripRequestId}`);
        }
      } catch (e) {
        console.error(e);
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
    <div className="text-center py-20">
      <h2 className="text-xl font-semibold">Searching for nearby drivers…</h2>
      <p className="text-sm text-slate-600 mt-4">
        We are looking for drivers near your pickup location.
      </p>
      <div className="mt-6">
        Please wait — this page will update automatically.
      </div>
    </div>
  );
}
