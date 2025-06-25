import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
export const PriorityContext = createContext();
import { apiUrl } from "./config";

export const PriorityProvider = ({ children }) => {
  const [priorityPOs, setPriorityPOs] = useState([]);

  const savePriorityOrdersToBackend = async (priorityOrders) => {
    try {
      const response = await axios.post(
        `${apiUrl}/save_priority_orders`,
        { priorityOrders },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Priority orders saved:", response.data);
    } catch (error) {
      console.error("Error saving priority orders:", error);
    }
  };

  useEffect(() => {
    const fetchPriorityOrders = async () => {
      try {
        const response = await axios.get(`${apiUrl}/fetch_priority_orders`);
        setPriorityPOs(response.data.priorityOrders || []);
      } catch (error) {
        console.error("Error fetching priority orders:", error);
      }
    };

    fetchPriorityOrders();
  }, []);

  const addToPriority = (pos) => {
    const updatedPriorityPOs = [
      ...priorityPOs,
      ...pos.filter(
        (po) =>
          !priorityPOs.some((existingPo) => existingPo.RMPONo === po.RMPONo)
      ),
    ];
    setPriorityPOs(updatedPriorityPOs);
    savePriorityOrdersToBackend(updatedPriorityPOs);
  };

  const removeFromPriority = (pos) => {
    const updatedPriorityPOs = priorityPOs.filter(
      (existingPo) => !pos.some((po) => po.RMPONo === existingPo.RMPONo)
    );

    setPriorityPOs(updatedPriorityPOs);
    savePriorityOrdersToBackend(updatedPriorityPOs);
  };

  return (
    <PriorityContext.Provider
      value={{ priorityPOs, setPriorityPOs, addToPriority, removeFromPriority }}
    >
      {children}
    </PriorityContext.Provider>
  );
};
