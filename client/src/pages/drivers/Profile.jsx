import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Loader from "../../components/common/Loader";
import { driverApi } from "../../services/driverApi";
import UserProfile from "../auth/UserProfile";
import SwitchRole from "../../components/SwitchRole";

export default function DriverProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [driverProfile, setDriverProfile] = useState(null);

  /* --------------------------------
     FETCH DRIVER PROFILE (READ ONLY)
  --------------------------------- */
  useEffect(() => {
    const fetchDriverProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await driverApi.getDriverProfile();
        setDriverProfile(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load driver profile");
      } finally {
        setLoading(false);
      }
    };

    fetchDriverProfile();
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="bg-red-50 border p-4 rounded flex gap-2">
        <AlertCircle className="text-red-600" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Driver Profile</h1>

      {/* DRIVER INFO (from getDriverProfile) */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Driver Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <p>
            <span className="font-medium">Driver ID:</span>{" "}
            {driverProfile.driver.driver_id}
          </p>

          <p>
            <span className="font-medium">Driver Type:</span>{" "}
            {driverProfile.driver.driver_type}
          </p>

          <p>
            <span className="font-medium">KYC Status:</span>{" "}
            {driverProfile.driver.kyc_status}
          </p>

          <p>
            <span className="font-medium">Rating:</span>{" "}
            {driverProfile.driver.rating_avg ?? "-"}
          </p>

          <p>
            <span className="font-medium">Phone:</span>{" "}
            {driverProfile.user.phone_e164}
          </p>

          <p>
            <span className="font-medium">Email:</span>{" "}
            {driverProfile.user.email || "-"}
          </p>
        </div>
      </div>

      {/* USER PROFILE (REUSABLE COMPONENT) */}
      <UserProfile />
      <SwitchRole/> 
    </div>
  );
}
