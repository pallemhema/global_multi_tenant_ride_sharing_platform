import MetricCard from "../../components/MetricCard";
import { Truck, Users, MapPin, TrendingUp } from "lucide-react";

const FleetDashboard = () => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Fleet Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Vehicles" value={12} icon={<Truck />} />
        <MetricCard title="Drivers" value={18} icon={<Users />} />
        <MetricCard title="Cities" value={3} icon={<MapPin />} />
        <MetricCard title="Earnings" value="₹1,24,000" icon={<TrendingUp />} />
      </div>
    </>
  );
};

export default FleetDashboard;
