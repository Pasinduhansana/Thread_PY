import React, { createContext, useState } from "react";

export const PriorityContext = createContext();

export const PriorityProvider = ({ children }) => {
  const [priorityPOs, setPriorityPOs] = useState([]);

  const addToPriority = (pos) => {
    setPriorityPOs((prev) => [
      ...prev,
      ...pos.filter(
        (po) => !prev.some((existingPo) => existingPo.RMPONo === po.RMPONo)
      ),
    ]);
  };

  const removeFromPriority = (pos) => {
    setPriorityPOs((prev) =>
      prev.filter(
        (po) => !pos.some((removePo) => removePo.RMPONo === po.RMPONo)
      )
    );
  };

  return (
    <PriorityContext.Provider
      value={{ priorityPOs, addToPriority, removeFromPriority }}
    >
      {children}
    </PriorityContext.Provider>
  );
};
