import { createContext, useContext, useState } from "react";
import { appAdminAPI } from "../services/appAdminApi";

const AppAdminContext = createContext(null);

export function AppAdminProvider({ children }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tenants, setTenants] = useState([]);
    

}