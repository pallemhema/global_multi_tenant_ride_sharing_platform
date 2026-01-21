import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Users,
  Wallet,
  Globe,
  Settings,
  TrendingUp,
} from 'lucide-react';

/* ---------- Navigation ---------- */

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, active: true,path:'/' },
  { label: 'Fleets', icon: <Truck size={20} /> ,path:'/fleets'},
 
  { label: 'Operating Regions', icon: <Globe size={20} /> ,path:'/regions'},
  { label: 'Earnings', icon: <TrendingUp size={20} />,path:'/earnings' },
  { label: 'Wallet', icon: <Wallet size={20} />,path:'/wallet' },
  { label: 'Requests', icon: <Settings size={20} />,path:'/add_fleets' },
];

/* ---------- Dashboard Metrics ---------- */

export const MOCK_METRICS = {
  operatingCountries: 4,
  operatingCities: 24,
  totalFleets: 12,
  totalDrivers: {
    fleet: 450,
    independent: 230,
    total: 680,
  },
  totalEarnings: 124500.5,
  walletBalance: 12450.75,
};

/* ---------- Regions & Cities ---------- */
/* status values must match JSX logic: ACTIVE | PENDING | SUSPENDED */

export const MOCK_REGIONS = [
  {
    id: 'us',
    name: 'United States',
    flag: '🇺🇸',
    cities: [
      { id: 'nyc', name: 'New York City', status: 'ACTIVE' },
      { id: 'la', name: 'Los Angeles', status: 'ACTIVE' },
      { id: 'chi', name: 'Chicago', status: 'PENDING' },
      { id: 'sf', name: 'San Francisco', status: 'SUSPENDED' },
    ],
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    cities: [
      { id: 'lon', name: 'London', status: 'ACTIVE' },
      { id: 'man', name: 'Manchester', status: 'ACTIVE' },
      { id: 'bir', name: 'Birmingham', status: 'PENDING' },
    ],
  },
  {
    id: 'ae',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    cities: [
      { id: 'dub', name: 'Dubai', status: 'ACTIVE' },
      { id: 'abu', name: 'Abu Dhabi', status: 'ACTIVE' },
    ],
  },
  {
    id: 'in',
    name: 'India',
    flag: '🇮🇳',
    cities: [
      { id: 'mum', name: 'Mumbai', status: 'ACTIVE' },
      { id: 'del', name: 'Delhi', status: 'PENDING' },
      { id: 'blr', name: 'Bangalore', status: 'ACTIVE' },
    ],
  },
];
