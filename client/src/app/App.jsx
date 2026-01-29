import { Router } from './router';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { UserAuthProvider } from '../context/UserAuthContext';
import { DriverProvider } from '../context/DriverContext';
import { VehicleProvider } from '../context/VehicleContext';
import { FleetOwnerProvider } from '../context/FleetOwnerContext';
import { TenantProvider } from '../context/TenantContext';
import '../styles/index.css';

export default function App() {
  return (
    <AdminAuthProvider>
      <UserAuthProvider>
        <TenantProvider>
        <DriverProvider>
          <FleetOwnerProvider>
          <VehicleProvider>
            <Router />
          </VehicleProvider>
        </FleetOwnerProvider>
      </DriverProvider>
      </TenantProvider>
    </UserAuthProvider>
    </AdminAuthProvider>
  );
}
