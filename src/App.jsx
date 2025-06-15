import React from "react";
import Thread_Dashboard from "./Pages/Thread_Dashboard";
import { PriorityProvider } from "./Data/PriorityOrders";

export default function App() {
  return (
    <PriorityProvider>
      <div className="min-h-screen w-full px-10 py-4">
        <Thread_Dashboard />
      </div>
    </PriorityProvider>
  );
}
