import React from "react";
import Sidebar from "./Sidebar";


import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./Header";
import Fleets from "./Fleets";
import Earnings from "./Earnings";
import Dashboard from "./Dashboard";
import RegionSection from "./RegionSection";
import { MOCK_REGIONS } from "../../constants/tenant";

const Tenant = () => {
 

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <BrowserRouter>
     
        <Sidebar />

        <main className="flex-1">
          <Header />

          <Routes>
            <Route path="/" element={<Dashboard/>} />
            <Route path="/fleets" element={<Fleets />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/regions" element={<RegionSection countries={MOCK_REGIONS} />} />
          </Routes>
        </main>
      
    </BrowserRouter>
      
      </div>
     
   
  );
};

export default Tenant;
