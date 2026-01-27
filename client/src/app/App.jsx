import { Router } from './router';
import { AdminProvider } from '../context/AdminContext';
import { UserAuthProvider } from '../context/UserAuthContext';
import { DriverProvider } from '../context/DriverContext';
import { VehicleProvider } from '../context/VehicleContext';
import '../styles/index.css';

export default function App() {
  return (
    <AdminProvider>
      <UserAuthProvider>
        <DriverProvider>
          <VehicleProvider>
            <Router />
          </VehicleProvider>
        </DriverProvider>
      </UserAuthProvider>
    </AdminProvider>
  );
}
