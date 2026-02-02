import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as tripApi from "../../services/tripApi";

export default function Payment() {
  const { tripId } = useParams();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tripApi.getTripReceipt(tripId);
        setReceipt(res);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [tripId]);

  if (!receipt) return <div>Loading fare…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payment</h1>
      <div className="bg-white p-4 rounded">
        <div className="flex justify-between">
          <div>Base fare</div>
          <div>{receipt.base_fare}</div>
        </div>
        <div className="flex justify-between">
          <div>Distance</div>
          <div>{receipt.distance_charge}</div>
        </div>
        <div className="flex justify-between">
          <div>Time</div>
          <div>{receipt.time_charge}</div>
        </div>
        <div className="flex justify-between">
          <div>Tax</div>
          <div>{receipt.tax}</div>
        </div>
        <div className="flex justify-between font-semibold mt-2">
          <div>Total</div>
          <div>{receipt.total}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Pay Now
        </button>
      </div>
    </div>
  );
}
