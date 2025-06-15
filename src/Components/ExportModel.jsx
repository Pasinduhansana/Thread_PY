import React, { useState } from "react";
import * as XLSX from "xlsx";

export default function Thread_Dashboard() {
  const [data, setData] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);

  const exportData = (type) => {
    let exportData = [];
    console.log("Exporting data for type:", type);

    if (type === "POWise") {
      // PO-wise details
      exportData = data.map((row) => ({
        "PO No": row.RMPONo,
        "Total Qty": row["Total PO Qty"],
        "Balance to Receive": row["Balance to Receive Qty"],
        "Invoice Qty": row["Qty"],
        "Ship to Location": row["Ship to Location"],
      }));
    } else if (type === "POArticleWise") {
      // PO + Article-wise details
      exportData = data.flatMap((row) =>
        row.articles.map((article) => ({
          "PO No": row.RMPONo,
          "Ship to Location": row["Ship to Location"],
          "Article Code": article["Article Code"],
          "Article Name": article["Article Name"],
          Color: `${article["Color Name"]} (${article["Color Code"]})`,
          "PO Qty": article["PO Qty(Purchase UOM)"],
          "Received Qty": article["Received Qty"],
          "Balance Qty": article["Balance to Receive Qty"],
          "Invoice Qty": article["Qty"],
          Invoices: article["Billing Doc. No"],
        }))
      );
    }

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exported Data");

    // Save Excel file
    const fileName =
      type === "POWise" ? "POWiseDetails.xlsx" : "POArticleWiseDetails.xlsx";
    XLSX.writeFile(workbook, fileName);

    // Close modal
    setShowExportModal(false);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-[20px] font-semibold text-gray-800">
          Thread Dashboard
        </h1>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-gradient-to-r from-blue-300 to-blue-400 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-400 hover:to-blue-500 transition-all duration-300"
        >
          Export Excel
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-medium text-gray-800">
                Export Options
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => exportData("POWise")}
                className="w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:from-green-500 hover:to-green-600 transition-all duration-300"
              >
                Export PO Wise Details
              </button>
              <button
                onClick={() => exportData("POArticleWise")}
                className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:from-blue-500 hover:to-blue-600 transition-all duration-300"
              >
                Export PO + Article Wise Details
              </button>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 rounded-b-lg">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
