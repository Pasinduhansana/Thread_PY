import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Thread_Dashboard from "./Pages/Thread_Dashboard";
import SharedData from "./Pages/SharedData";
import Navbar from "./Components/Navbar";
import { PriorityProvider } from "./Data/PriorityOrders";

function App() {
  return (
    <BrowserRouter>
      <PriorityProvider>
        <div className="min-h-screen ">
          <Navbar />
          <div className="pt-16 pb-8">
            {" "}
            {/* Add padding-top to account for fixed navbar */}
            <Routes>
              <Route path="/" element={<Thread_Dashboard />} />
              <Route path="/shared-data" element={<SharedData />} />
            </Routes>
          </div>
        </div>
      </PriorityProvider>
    </BrowserRouter>
  );
}

export default App;
