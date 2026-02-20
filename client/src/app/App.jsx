import { Router } from "./router";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { UserAuthProvider } from "../context/UserAuthContext";
import "../styles/index.css";

export default function App() {
  return (
    <AdminAuthProvider>
      <UserAuthProvider>
        <Router />
      </UserAuthProvider>
    </AdminAuthProvider>
  );
}
