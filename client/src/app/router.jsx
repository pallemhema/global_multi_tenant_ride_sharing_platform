// src/app/router.jsx
import {
  createBrowserRouter,
  RouterProvider,
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

/* ===== Providers ===== */
import { AppAdminProvider } from "../context/AppAdminContext";
import { TenantProvider } from "../context/TenantContext";
import { DriverProvider } from "../context/DriverContext";
import { FleetOwnerProvider } from "../context/FleetOwnerContext";
import { VehicleProvider } from "../context/VehicleContext";

/* ===== Admin Pages ===== */
import AppAdminLayout from "../layouts/AppAdminLayout";
import DashboardHome from "../pages/appAdmin/dashboard/Home";
import TenantsList from "../pages/appAdmin/tenants/TenantsList";
import TenantDetails from "../pages/appAdmin/tenants/TenantDetails";
import TenantCreate from "../pages/appAdmin/TenantCreate";
import TenantAdminCreate from "../pages/appAdmin/TenantAdminCreate";
import TenantDocumentsApproval from "../pages/appAdmin/TenantDocumentsApproval";
import TenantApprove from "../pages/appAdmin/TenantApprove";
import CreatePayoutBatch from "../pages/appAdmin/payouts/CreatePayoutBatch";
import PayoutBatchList from "../pages/appAdmin/payouts/PayoutBatchList";
import PayoutBatchDetails from "../pages/appAdmin/payouts/PayoutBatchDetails";

/* ===== Tenant Admin ===== */
import TenantAdminLayout from "../layouts/TenantAdminLayout";
import TenantDashboard from "../pages/tenant-admin/Dashboard";
import TenantDocuments from "../pages/tenant-admin/Documents";
import TenantRegions from "../pages/tenant-admin/Regions";
import TenantVehicles from "../pages/tenant-admin/Vehicles";
import TenantFleetOwners from "../pages/tenant-admin/FleetOwners";
import TenantDrivers from "../pages/tenant-admin/Drivers";
import TenantFare from "../pages/tenant-admin/fare/TenantFare"

/* ===== Driver ===== */
import DriverLayout from "../layouts/DriverLayout";
import DriverDashboard from "../pages/drivers/Dashboard"
import DriverDocuments from "../pages/drivers/Documents";
import DriverProfile from "../pages/drivers/Profile";
import DriverShifts from "../pages/drivers/Shifts";
import DriverRegistration from "../pages/drivers/DriverRegistration";
import DriverInvitesFromFleets from "../pages/drivers/DriverInvitesFromFleets";
import AssignedVehicles from "../pages/drivers/AssignedVehicles";
import DriverVehicles from "../pages/drivers/DriverVehicles";

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
import FleetVehicles from "../pages/fleets/FleetVehicles";

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

      { path: "payouts", element: <PayoutBatchList /> },
      { path: "payouts/create", element: <CreatePayoutBatch /> },
      { path: "payouts/batches/:batchId", element: <PayoutBatchDetails /> },
      
    ],
  },

  /* ===== Tenant Admin ===== */
  {
    path: "/tenant-admin",
    element: (
      <AdminGaurd>
        <TenantProvider>
          <TenantAdminLayout />
        </TenantProvider>
      </AdminGaurd>
    ),
  
    children: [
      { path: "dashboard", element: <TenantDashboard /> },
      { path: "documents", element: <TenantDocuments /> },
      { path: "regions", element: <TenantRegions /> },
      { path: "vehicles", element: <TenantVehicles /> },
      { path: "fleet-owners", element: <TenantFleetOwners /> },
      { path: "drivers", element: <TenantDrivers /> },
      { path: "fare", element: <TenantFare /> },
    ],
  },

  /* ===== Driver ===== */
 {
    path: "/driver",
    element: (
      <DriverRoute>
        <DriverProvider>
          <VehicleProvider>
            <DriverLayout />
          </VehicleProvider>
        </DriverProvider>
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
          { index: true, element: <DriverVehicles /> },
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
        <FleetOwnerProvider>
          <VehicleProvider>
            <FleetLayout />
          </VehicleProvider>
        </FleetOwnerProvider>
      </FleetOwnerRoute>
    ),

    children: [
      { path: "dashboard", element: <FleetDashboard /> },
      // { path: "finances", element: <FleetOwnerDashboard /> },
      { path: "documents", element: <FleetDocuments /> },
      { path: "invites", element: <FleetInvites /> },
      { path: "vehicle-assignments", element: <VehicleAssignments /> },


      {
        path: "vehicles", role:"fleet",
        children: [
          { index: true, element: <FleetVehicles /> },
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
  {
    path: "/register/driver",
    element: (
      <DriverProvider>
        <DriverRegistration />
      </DriverProvider>
    ),
  },
  ,
  {
    path: "/register/fleet",
    element: (
      <FleetOwnerProvider>
        <FleetRegistration />
      </FleetOwnerProvider>
    ),
  },

]);

export function Router() {
  return <RouterProvider router={router} />;
}
