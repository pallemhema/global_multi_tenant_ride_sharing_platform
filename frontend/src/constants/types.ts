
export enum RegionStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending Approval',
  SUSPENDED = 'Suspended'
}

export interface City {
  id: string;
  name: string;
  status: RegionStatus;
}

export interface Country {
  id: string;
  name: string;
  flag: string;
  cities: City[];
}

export interface DashboardMetrics {
  operatingCountries: number;
  operatingCities: number;
  totalFleets: number;
  totalDrivers: {
    fleet: number;
    independent: number;
    total: number;
  };
  totalEarnings: number;
  walletBalance: number;
}
