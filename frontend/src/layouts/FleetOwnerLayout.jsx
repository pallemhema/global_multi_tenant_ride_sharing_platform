import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  fetchFleetCompliance,
  fetchFleetDetails,
} from "../services/fleetOwners/fleet";

const FleetOwnerLayout = () => {
  const { user } = useAuth();
  const fleetId = user?.fleet_owner_id;

  const [fleet, setFleet] = useState(null);
  const [isCompliant, setIsCompliant] = useState(true);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch fleet details
  useEffect(() => {
    if (!fleetId) return;

    const loadFleet = async () => {
      try {
        const res = await fetchFleetDetails(fleetId);
       
        setFleet(res.data);
      } finally {
        setLoading(false);
      }
    };

    loadFleet();
  }, [fleetId]);

  // 🔹 Fetch compliance
  useEffect(() => {
    if (!fleetId) return;

    const loadCompliance = async () => {
      try {
        const res = await fetchFleetCompliance(fleetId);
        setIsCompliant(res.data.is_compliant);
      } catch {
        setIsCompliant(false);
      }
    };

    loadCompliance();
  }, [fleetId]);

  console.log(fleet)

  if (loading) return null; // or skeleton

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="fleet-owner" />

      <div className="flex-1 flex flex-col">
        <Header
          title={fleet?.fleet_name}
          subtitle={
            fleet?.approval_status === "approved"
              ? "Verified Fleet"
              : "Pending Approval"
          }
        />

        {!isCompliant && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800">
            ⚠️ Complete document verification to unlock fleet features
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FleetOwnerLayout;
