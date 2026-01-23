import Footer from "./Footer";
import MetricCard from "../../components/MetricCard";
import RegionSection from "./RegionSection";

import { MOCK_REGIONS,MOCK_METRICS } from "../../constants/constants";
import { Globe, MapPin, Truck, Users, TrendingUp, Wallet } from "lucide-react";
const TenantDashboard = () => {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };
  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Operational Overview
          </h2>
          <p className="text-gray-500">
            Real-time performance and coverage data for SwiftRide Logistics.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Operating Countries"
            value={MOCK_METRICS.operatingCountries}
            icon={<Globe size={24} />}
            trend="2.4%"
            trendUp={true}
          />

          <MetricCard
            title="Operating Cities"
            value={MOCK_METRICS.operatingCities}
            icon={<MapPin size={24} />}
            trend="12%"
            trendUp={true}
          />

          <MetricCard
            title="Total Fleets"
            value={MOCK_METRICS.totalFleets}
            icon={<Truck size={24} />}
            trend="0.5%"
            trendUp={true}
          />

          <MetricCard
            title="Total Drivers"
            value={MOCK_METRICS.totalDrivers.total.toLocaleString()}
            icon={<Users size={24} />}
            subtitle={`${MOCK_METRICS.totalDrivers.fleet} Fleet • ${MOCK_METRICS.totalDrivers.independent} Independent`}
            trend="4.1%"
            trendUp={true}
          />

          <MetricCard
            title="Total Earnings"
            value={formatCurrency(MOCK_METRICS.totalEarnings)}
            icon={<TrendingUp size={24} />}
            trend="8.2%"
            trendUp={true}
          />

          <MetricCard
            title="Wallet Balance"
            value={formatCurrency(MOCK_METRICS.walletBalance)}
            icon={<Wallet size={24} />}
            subtitle="Withdrawal available"
          />
        </div>
        <Footer />

        {/* Operating Regions Section */}
        {/* <RegionSection countries={MOCK_REGIONS} /> */}
      </div>
    </>
  );
};

export default TenantDashboard;
