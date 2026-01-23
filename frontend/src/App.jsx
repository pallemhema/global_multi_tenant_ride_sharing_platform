import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProctedRoutes";
import TenantProtected from "./routes/TenantProtected";

import Auth from "./pages/auth/Auth";
import AppAdminDashboard from "./pages/appAdmin/AppAdminDashboard";

import TenantLayout from "./layouts/TenantLayout";
import TenantDashboard from "./pages/tenantAdmin/TenantDashboard";
import Earnings from "./pages/tenantAdmin/Earnings";
import Fleets from "./pages/tenantAdmin/Fleets";
import RegionSection from "./pages/tenantAdmin/RegionSection";
import TenantDocuments from "./pages/tenantAdmin/TenantDocuments";
import Requests from "./pages/tenantAdmin/Requests";

import FleetOwnerLayout from "./layouts/FleetOwnerLayout";
import FleetDashboard from "./pages/fleetOwner/FleetDashboard";
import FleetOwnerEntry from "./pages/fleetOwner/FleetOwnerEntry";

import DriverDashboard from "./pages/driver/DriverDashboard";

import RiderDashboard from "./pages/rider/RiderDashboard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth */}
          <Route path="/login" element={<Auth />} />

          {/* App Admin */}
          <Route
            path="/platform"
            element={
              <ProtectedRoute allow={["app-admin"]}>
                <AppAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Tenant Root */}
          {/* <Route
            path="/tenant"
            element={
              <ProtectedRoute allow={["tenant-admin"]}>
                <TenantLayout />
              </ProtectedRoute>
            }
          >
    
            <Route index element={<TenantDashboard />} />
            <Route path="documents" element={<TenantDocuments />} />


            <Route
              path="regions"
              element={
                <TenantProtected>
                  <RegionSection />
                </TenantProtected>
              }
            />

            <Route
              path="fleets"
              element={
                <TenantProtected>
                  <Fleets />
                </TenantProtected>
              }
            />
            <Route
              path="requests"
              element={
                <TenantProtected>
                  <Requests />
                </TenantProtected>
              }
            />
          

            <Route
              path="earnings"
              element={
                <TenantProtected>
                  <Earnings />
                </TenantProtected>
              }
            />
          </Route> */}

          {/* Driver */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute allow={["driver"]}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />


          {/* Fleet Owner */}
          <Route
            path="/fleet-owner"
            element={
              <ProtectedRoute allow={["fleet-owner"]}>
                <FleetOwnerLayout />
              </ProtectedRoute>
            }
          > 
          <Route
            path="/fleet-owner"
            element={
              <ProtectedRoute allow={["fleet-owner"]}>
                <FleetOwnerEntry />   {/* 👈 NEW */}
              </ProtectedRoute>
            }
          />

           
            <Route index element={<FleetDashboard />} />
            {/* <Route path="documents" element={<FleetDocuments />} />

          
            <Route
              path="vehicles"
              element={
                <FleetProtected>
                  <FleetVehicles />
                </FleetProtected>
              }
            />

            <Route
              path="drivers"
              element={
                <FleetProtected>
                  <FleetDrivers />
                </FleetProtected>
              }
            />

            <Route
              path="invites"
              element={
                <FleetProtected>
                  <FleetProtected>
                    <FleetInvites />
                  </FleetProtected>
                </FleetProtected>
              }
            /> */}
          </Route>


          {/* Rider */}
          <Route
            path="/rider"
            element={
              <ProtectedRoute allow={["rider"]}>
                <RiderDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
