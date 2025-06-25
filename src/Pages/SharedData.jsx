import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../Data/config";

const SharedData = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/fetch_shared_data`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching shared data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
  }, []);

  return (
    <div className="p-5 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Shared Data</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : data.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(data[0]).map((key, index) => (
                <th
                  key={index}
                  className="border border-gray-300 py-2 px-4 text-left"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {Object.values(row).map((value, idx) => (
                  <td key={idx} className="border border-gray-300 py-2 px-4">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No data available.</p>
      )}
    </div>
  );
};

export default SharedData;
