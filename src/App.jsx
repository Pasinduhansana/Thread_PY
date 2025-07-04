import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Thread_Dashboard from "./Pages/Thread_Dashboard";
import SharedData from "./Pages/SharedData";
import SupplierDashboard from "./Pages/SupplierDashboard";
import Navbar from "./Components/Navbar";
import { PriorityProvider } from "./Data/PriorityOrders";
import ROPThread from "./Pages/ROP_Thread";

function App() {
  return (
    <BrowserRouter>
      <PriorityProvider>
        <div className="min-h-screen ">
          <Navbar />
          <div className="pt-16 pb-8">
            <Routes>
              <Route path="/" element={<Thread_Dashboard />} />
              <Route path="/shared-data" element={<SharedData />} />
              <Route path="/rop-thread" element={<ROPThread />} />
              <Route
                path="/supplier-dashboard"
                element={<SupplierDashboard />}
              />
            </Routes>
          </div>
        </div>
      </PriorityProvider>
    </BrowserRouter>
  );
}
export default App;
