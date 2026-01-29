// src/app/router.jsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

/* ===== Guards ===== */
import AdminGaurd from "../guards/admin/AdminGuard";
import {
  RiderRoute,
  DriverRoute,
  FleetOwnerRoute,
} from "../guards/user/UserProtectedRoute";

import RoleRedirect from "../guards/RoleRedirect";

/* ===== Auth Pages ===== */
import Login from "../pages/auth/AdminLogin";
import { UserLogin } from "../pages/auth/UserLogin";

/* ===== Admin Pages ===== */
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardHome from "../pages/appAdmin/dashboard/Home";
import TenantsList from "../pages/appAdmin/tenants/TenantsList";
import TenantDetails from "../pages/appAdmin/tenants/TenantDetails";
import TenantCreate from "../pages/appAdmin/TenantCreate";
import TenantAdminCreate from "../pages/appAdmin/TenantAdminCreate";
import TenantDocumentsApproval from "../pages/appAdmin/TenantDocumentsApproval";
import TenantApprove from "../pages/appAdmin/TenantApprove";
import TenantProfile from "../pages/tenant-admin/Profile";

/* ===== Tenant Admin ===== */
import TenantAdminLayout from "../layouts/TenantAdminLayout";
import TenantDashboard from "../pages/tenant-admin/Dashboard";
import TenantDocuments from "../pages/tenant-admin/Documents";
import TenantRegions from "../pages/tenant-admin/Regions";
import TenantVehicles from "../pages/tenant-admin/Vehicles";
import TenantFleetOwners from "../pages/tenant-admin/FleetOwners";
import TenantDrivers from "../pages/tenant-admin/Drivers";

/* ===== Driver ===== */
import DriverLayout from "../layouts/DriverLayout";
import Dashboard from "../pages/drivers/Dashboard";
import DriverDocuments from "../pages/drivers/Documents";
import DriverProfile from "../pages/drivers/Profile";
import DriverShifts from "../pages/drivers/Shifts";
import DriverRegistration from "../pages/drivers/DriverRegistration";

/* ===== Vehicles (shared driver + fleet) ===== */
import Vehicles from "../pages/vehicles/Vehicles";
import VehicleDocuments from "../pages/vehicles/VehicleDocuments";
import VehicleForm from "../pages/vehicles/VehicleForm";

/* ===== Fleet ===== */
import FleetLayout from "../layouts/FleetLayout";
import FleetDashboard from "../pages/fleets/FleetDashboard";
import FleetDocuments from "../pages/fleets/FleetDocuments";
import FleetVehicles from "../pages/fleets/FleetVehicles";
import FleetInvites from "../pages/fleets/FleetInvites";
import FleetRegistration from "../pages/fleets/FleetRegistration";

/* ===== Rider ===== */
import RiderDashboard from "../pages/user/RiderDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RoleRedirect />,
  },

  /* ===== Auth ===== */
  { path: "/admin/login", element: <Login /> },
  { path: "/user/login", element: <UserLogin /> },

  /* ===== Super Admin ===== */
  {
    path: "/dashboard",
    element: (
      <AdminGaurd>
          <DashboardLayout />
      </AdminGaurd>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "tenants", element: <TenantsList /> },
      { path: "tenants/create", element: <TenantCreate /> },
      { path: "tenants/:tenantId", element: <TenantDetails /> },
      {
        path: "tenants/:tenantId/admin/create",
        element: <TenantAdminCreate />,
      },
      {
        path: "tenants/:tenantId/documents",
        element: <TenantDocumentsApproval />,
      },
      { path: "tenants/:tenantId/approve", element: <TenantApprove /> },
      { path: "profile", element: <TenantProfile /> },
    ],
  },

  /* ===== Tenant Admin ===== */
  {
    path: "/tenant-admin",
    element: (
      <AdminGaurd>
          <TenantAdminLayout />
      
      </AdminGaurd>
    ),
    children: [
      { path: "dashboard", element: <TenantDashboard /> },
      { path: "documents", element: <TenantDocuments /> },
      { path: "regions", element: <TenantRegions /> },
      { path: "vehicles", element: <TenantVehicles /> },
      { path: "fleet-owners", element: <TenantFleetOwners /> },
      { path: "drivers", element: <TenantDrivers /> },
      { path: "profile", element: <TenantProfile /> },
    ],
  },

  /* ===== Driver ===== */
  {
    path: "/driver",
    element: (
      <DriverRoute>

            <DriverLayout />
      </DriverRoute>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "documents", element: <DriverDocuments /> },
      { path: "shifts", element: <DriverShifts /> },
      { path: "profile", element: <DriverProfile /> },

      {
        path: "vehicles",
        children: [
          { index: true, element: <Vehicles /> },
          { path: "add", element: <VehicleForm /> },
          { path: ":vehicleId/edit", element: <VehicleForm /> },
          { path: ":vehicleId/documents", element: <VehicleDocuments /> },
        ],
      },
    ],
  },

  /* ===== Fleet Owner ===== */
  {
    path: "/fleet",
    element: (
      <FleetOwnerRoute>
          <FleetLayout />
      </FleetOwnerRoute>
    ),
    children: [
      { path: "dashboard", element: <FleetDashboard /> },
      { path: "documents", element: <FleetDocuments /> },
      { path: "vehicles", element: <FleetVehicles /> },
      { path: "invites", element: <FleetInvites /> },
    ],
  },

  /* ===== Rider ===== */
  {
    path: "/rider/dashboard",
    element: (
      <RiderRoute>
        <RiderDashboard />
      </RiderRoute>
    ),
  },

  /* ===== Registration ===== */
  { path: "/register/driver", element: <DriverRegistration /> },
  { path: "/register/fleet", element: <FleetRegistration /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
