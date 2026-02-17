import { useEffect, useState } from "react";
import CountryCitySelector from "./CountryCitySelector";
import FareConfigList from  "./FareConfigList";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import TenantSurge from "../surge/TenantSurge";
export default function TenantFare() {
  const [countryId, setCountryId] = useState(null);
  const [cityId, setCityId] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  console.log(countryId, cityId)

  const loadConfigs = async () => {
    if (!countryId || !cityId) return;

    setLoading(true);
    try {
      const res = await tenantAdminAPI.getFareConfigs(countryId, cityId);
      console.log("TenantFare res",res);
      setConfigs(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [countryId, cityId]);

  return (
    <div className="p-6 space-y-6">
      <h3>Select the country and city you manganing to edit or create the fare and surges</h3>

      <CountryCitySelector
        onCountryChange={setCountryId}
        onCityChange={setCityId}
      />
           

      {countryId && cityId && (<>
 <div>
          <h2 className="text-2xl font-semibold">Fare Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage fare for different vehicle categories.</p>
        </div>
        <FareConfigList
          configs={configs}
          countryId={countryId}
          cityId={cityId}
          reload={loadConfigs}
          loading={loading}
        />
        <TenantSurge  countryId={countryId}
          cityId={cityId}
          />
          </>
      )}
      
    </div>
  );
}
