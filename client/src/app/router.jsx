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
import AppAdminLayout from "../layouts/AppAdminLayout";
import DashboardHome from "../pages/appAdmin/dashboard/Home";
import TenantsList from "../pages/appAdmin/tenants/TenantsList";
import TenantDetails from "../pages/appAdmin/tenants/TenantDetails";
import TenantCreate from "../pages/appAdmin/TenantCreate";
import TenantAdminCreate from "../pages/appAdmin/TenantAdminCreate";
import TenantDocumentsApproval from "../pages/appAdmin/TenantDocumentsApproval";
import TenantApprove from "../pages/appAdmin/TenantApprove";
import TenantProfile from "../pages/tenant-admin/Profile";
import CreatePayoutBatch from "../pages/appAdmin/payouts/CreatePayoutBatch";
import PayoutBatchList from "../pages/appAdmin/payouts/PayoutBatchList";
import PayoutBatchDetails from "../pages/appAdmin/payouts/PayoutBatchDetails";
import { AppAdminProvider } from "../context/AppAdminContext";

/* ===== Tenant Admin ===== */
import TenantAdminLayout from "../layouts/TenantAdminLayout";
import TenantDashboard from "../pages/tenant-admin/Dashboard";
import TenantDocuments from "../pages/tenant-admin/Documents";
import TenantRegions from "../pages/tenant-admin/Regions";
import TenantVehicles from "../pages/tenant-admin/Vehicles";
import TenantFleetOwners from "../pages/tenant-admin/FleetOwners";
import TenantDrivers from "../pages/tenant-admin/Drivers";
// import PayoutDashboard from "../components/tenant-admin/PayoutDashboard";

/* ===== Driver ===== */
import DriverLayout from "../layouts/DriverLayout";
import DriverDashboard from "../pages/drivers/Dashboard"
import DriverDocuments from "../pages/drivers/Documents";
import DriverProfile from "../pages/drivers/Profile";
import DriverShifts from "../pages/drivers/Shifts";
import DriverRegistration from "../pages/drivers/DriverRegistration";
import DriverInvitesFromFleets from "../pages/drivers/DriverInvitesFromFleets";
import AssignedVehicles from "../pages/drivers/AssignedVehicles";

/* ===== Vehicles (shared driver + fleet) ===== */
import Vehicles from "../pages/vehicles/Vehicles";
import VehicleDocuments from "../pages/vehicles/VehicleDocuments";
import VehicleForm from "../pages/vehicles/VehicleForm";

/* ===== Fleet ===== */
import FleetLayout from "../layouts/FleetLayout";
import FleetDashboard from "../pages/fleets/FleetDashboard";
import FleetDocuments from "../pages/fleets/FleetDocuments";
import FleetInvites from "../pages/fleets/FleetInvites";
import FleetRegistration from "../pages/fleets/FleetRegistration";
import VehicleAssignments from "../pages/fleets/VehicleAssignments";

/* ===== Rider ===== */
import RiderDashboard from "../pages/rider/RiderDashboard";
import RiderLayout from "../layouts/RiderLayout";
import PickupDrop from "../pages/rider/PickupDrop";
import ChooseOption from "../pages/rider/ChooseOption";
import Searching from "../pages/rider/Searching";
import Assigned from "../pages/rider/Assigned";
import InProgress from "../pages/rider/InProgress";
import Payment from "../pages/rider/Payment";
import RiderProfile from "../pages/rider/RiderProfile";
import TripCompletion from "../pages/rider/TripCompletion";

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
        <AppAdminProvider>
          <AppAdminLayout />
        </AppAdminProvider>
      </AdminGaurd>
    ),
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "tenants", element: <TenantsList /> },
      { path: "tenants/create", element: <TenantCreate /> },
      { path: "tenants/:tenantId", element: <TenantDetails /> },
      { path: "tenants/:tenantId/admin/create", element: <TenantAdminCreate /> },
      { path: "tenants/:tenantId/documents", element: <TenantDocumentsApproval /> },
      { path: "tenants/:tenantId/approve", element: <TenantApprove /> },
      { path: "profile", element: <TenantProfile /> },
      // Payout routes (App Admin + Tenant Admin via AdminGuard)
      { path: "payouts", element: <PayoutBatchList /> },
      { path: "payouts/create", element: <CreatePayoutBatch /> },
      { path: "payouts/:batchId", element: <PayoutBatchDetails /> },
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
      // { path: "payouts", element: <PayoutDashboard /> },
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
      { path: "dashboard", element: <DriverDashboard /> },
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
      {
        path: "fleet-invites",
        element: <DriverInvitesFromFleets />,
      },
      {
        path: "assigned-vehicles",
        element: <AssignedVehicles />,
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
      // { path: "finances", element: <FleetOwnerDashboard /> },
      { path: "documents", element: <FleetDocuments /> },
      { path: "invites", element: <FleetInvites /> },
      { path: "vehicle-assignments", element: <VehicleAssignments /> },
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

  /* ===== Rider ===== */
  {
    path: "/rider",
    element: (
      <RiderRoute>
        <RiderLayout />
      </RiderRoute>
    ),
    children: [
      { path: "dashboard", element: <RiderDashboard /> },
      { path: "pickup", element: <PickupDrop /> },
      { path: "options/:tripRequestId", element: <ChooseOption /> },
      { path: "searching/:tripRequestId", element: <Searching /> },
      { path: "assigned/:tripRequestId", element: <Assigned /> },
      { path: "in-progress/:tripId", element: <InProgress /> },
      { path: "trip-completion/:tripId", element: <TripCompletion /> },
      { path: "payment/:tripId", element: <Payment /> },
      { path: "profile", element: <RiderProfile /> },
    ],
  },

  /* ===== Registration ===== */
  { path: "/register/driver", element: <DriverRegistration /> },
  { path: "/register/fleet", element: <FleetRegistration /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
