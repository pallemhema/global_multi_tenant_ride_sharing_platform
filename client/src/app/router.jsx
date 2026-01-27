import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import AppAdminGuard from '../guards/AppAdminGuard';
import TenantAdminGuard from '../guards/TenantAdminGuard';
import RoleRedirect from '../guards/RoleRedirect';

// App Admin Pages
import Login from '../pages/auth/Login';
import {UserLogin} from '../pages/auth/UserLogin';
import DashboardHome from '../pages/appAdmin/dashboard/Home';
import TenantsList from '../pages/appAdmin/tenants/TenantsList'
import TenantDetails from '../pages/appAdmin/tenants/TenantDetails';

import TenantCreate from '../pages/appAdmin/TenantCreate';
import TenantAdminCreate from '../pages/appAdmin/TenantAdminCreate';
import TenantDocumentsApproval from '../pages/appAdmin/TenantDocumentsApproval';
import TenantApprove from '../pages/appAdmin/TenantApprove';
import DashboardLayout from '../components/layout/DashboardLayout';

// User Pages
import RiderDashboard from '../pages/user/RiderDashboard';
//vehicle
import Vehicles from '../pages/vehicles/Vehicles';
import VehicleDocuments from '../pages/vehicles/VehicleDocuments';
import VehicleForm from '../pages/vehicles/VehicleForm';

//Driver
import DriverLayout from '../layouts/DriverLayout';
import Dashboard from '../pages/drivers/Dashboard'
import DriverDocuments from '../pages/drivers/Documents';
import DriverProfile from '../pages/drivers/Profile';
import DriverShifts from '../pages/drivers/Shifts';
import DriverRegistration from '../pages/drivers/DriverRegistration';

import FleetOwnerDashboard from '../pages/user/FleetOwnerDashboard';

import FleetOwnerRegistration from '../pages/fleets/FleetOwnerRegistration';

// Tenant Admin Pages
import TenantAdminLayout from '../layouts/TenantAdminLayout';
import TenantDashboard from '../pages/tenant-admin/Dashboard';
import TenantDocuments from '../pages/tenant-admin/Documents';
import TenantRegions from '../pages/tenant-admin/Regions';
import TenantVehicles from '../pages/tenant-admin/Vehicles';
import TenantFleetOwners from '../pages/tenant-admin/FleetOwners';
import TenantDrivers from '../pages/tenant-admin/Drivers';
import TenantProfile from '../pages/tenant-admin/Profile';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RoleRedirect />,
  },
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/user/login',
    element: <UserLogin />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AppAdminGuard>
          <DashboardLayout />
        </AppAdminGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: 'tenants',
        element: <TenantsList />,
      },
      {
        path: 'tenants/create',
        element: <TenantCreate />,
      },
      {
        path: 'tenants/:tenantId',
        element: <TenantDetails />,
      },
      {
        path: 'tenants/:tenantId/admin/create',
        element: <TenantAdminCreate />,
      },
      {
        path: 'tenants/:tenantId/documents',
        element: <TenantDocumentsApproval />,
      },
      {
        path: 'tenants/:tenantId/approve',
        element: <TenantApprove />,
      },
      {
        path: 'profile',
        element: <TenantProfile />,
      },
    ],
  },
  // Tenant Admin Routes
  {
    path: '/tenant-admin',
    element: (
      <ProtectedRoute>
        <TenantAdminGuard>
          <TenantAdminLayout />
        </TenantAdminGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <TenantDashboard />,
      },
      {
        path: 'documents',
        element: <TenantDocuments />,
      },
      {
        path: 'regions',
        element: <TenantRegions />,
      },
      {
        path: 'vehicles',
        element: <TenantVehicles />,
      },
      {
        path: 'fleet-owners',
        element: <TenantFleetOwners />,
      },
      {
        path: 'drivers',
        element: <TenantDrivers />,
      },
      {
        path: 'profile',
        element: <TenantProfile />,
      },
    ],
  },
 

// Driver Routes
{
  path: '/driver',
  element: (
    <ProtectedRoute>
      <DriverLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: 'dashboard',
      element: <Dashboard />,
    },
    {
      path: 'documents',
      element: <DriverDocuments />,
    },

    /* ✅ VEHICLES MODULE */
    {
      path: 'vehicles',
      children: [
        {
          index: true,
          element: <Vehicles />,          // /driver/vehicles
        },
        {
          path: 'add',
          element: <VehicleForm />,       // /driver/vehicles/add
        },
        {
          path: ':vehicleId/edit',
          element: <VehicleForm />,       // /driver/vehicles/1/edit
        },
        {
          path: ':vehicleId/documents',
          element: <VehicleDocuments />,  // /driver/vehicles/1/documents
        },
      ],
    },

    {
      path: 'shifts',
      element: <DriverShifts />,
    },
    {
      path: 'profile',
      element: <DriverProfile />,
    },
  ],
},

  {
    path: '/fleet-owner/dashboard',
    element: <FleetOwnerDashboard />,
  },
  {
    path: '/register/driver',
    element: <DriverRegistration />,
  },
  {
    path: '/register/fleet-owner',
    element: <FleetOwnerRegistration />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
