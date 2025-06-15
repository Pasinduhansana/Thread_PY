import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import * as XLSX from "xlsx";
import DataGrid from "../Components/Datagrid";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileUpload,
  FaChevronRight,
  FaChevronLeft,
  FaDownload,
  FaSync,
  FaFileInvoice,
  FaFileAlt,
  FaDatabase,
} from "react-icons/fa";
import ExportModel from "../Components/ExportModel";

export default function Thread_Dashboard() {
  const [data, setData] = useState([]);
  const [kpiFileName, setKpiFileName] = useState("");
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const [kpiFile, setKpiFile] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUploadedDate, setLastUploadedDate] = useState("");
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportClick = () => {
    setShowExportModal(true); // Open the export modal
  };

  // Fetch saved data on page load
  useEffect(() => {
    const fetchSavedData = async () => {
      try {
        const response = await axios.get(
          "http://threadpybackend-production.up.railway.app/fetch_saved_data"
        );

        console.log("Backend response:", response.data);

        if (response.data && response.data.data) {
          setData(response.data.data); // Set the grid data
          setLastUploadedDate(response.data.last_uploaded_date || "Unknown"); // Set the last uploaded date
        } else {
          console.error("Unexpected response structure:", response.data);
          setData([]); // Set empty data if response is invalid
        }
      } catch (error) {
        console.error("Error fetching saved data:", error);
        setData([]); // Set empty data on error
      } finally {
        setIsLoadingSavedData(false); // End loading
      }
    };

    fetchSavedData();
  }, []);

  // KPI Report Dropzone
  const { getRootProps: getKpiRootProps, getInputProps: getKpiInputProps } =
    useDropzone({
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
      },
      onDrop: async (acceptedFiles) => {
        const formData = new FormData();
        formData.append("file", acceptedFiles[0]);
        setKpiFile(acceptedFiles[0]);
        setKpiFileName(acceptedFiles[0].name);
      },
    });

  // Invoice Report Dropzone
  const {
    getRootProps: getInvoiceRootProps,
    getInputProps: getInvoiceInputProps,
  } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    onDrop: async (acceptedFiles) => {
      const formData = new FormData();
      formData.append("file", acceptedFiles[0]);
      setInvoiceFileName(acceptedFiles[0].name);
      setInvoiceFile(acceptedFiles[0]);
    },
  });

  const Fetch_Data = async () => {
    try {
      console.log("Fetching data...");
      setIsLoading(true);
      const formData = new FormData();
      formData.append("kpi", kpiFile); // <-- Add this
      formData.append("invoice", invoiceFile); // <-- And this

      const response = await axios.post(
        "http://threadpybackend-production.up.railway.app/upload_Dashboard",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setData(response.data);
      setLastUploadedDate(new Date().toLocaleString());
    } catch (error) {
      console.error("Error exporting file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData1 = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        "http://threadpybackend-production.up.railway.app/export",
        data,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "processed_output.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error exporting file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = (type) => {
    let exportData = [];
    console.log("Exporting data for type:", type);

    if (type === "POWise") {
      // PO-wise details
      exportData = data.map((row) => ({
        "Ship to Location": row["Ship to Location"],
        "PO No": row.RMPONo,
        "Total Qty": row["PO Qty(Purchase UOM)"],
        "Received Qty": row["Received Qty"],
        "Balance to Receive Qty": row["Balance to Receive Qty"],
        "Invoice Qty": row["Qty"],
        "Ex-Mill Date": "NA",
        "Required Date": "NA",
        Remark: "",
      }));
    } else if (type === "POArticleWise") {
      console.log(data);
      // PO + Article-wise details
      exportData = data.map((article) => ({
        "Ship to Location": article["Ship to Location"],
        "PO No": article.RMPONo,
        "Article Code": article["Article Code"],
        "Article Name": article["Article Name"],
        "Color Code": article["Color Code"],
        "Color Name": article["Color Name"],
        "PO Qty": article["PO Qty(Purchase UOM)"],
        "Received Qty": article["Received Qty"],
        "Balance Qty": article["Balance to Receive Qty"],
        "Invoice Qty": article["Qty"],
        Invoices: article["Billing Doc. No"],
        "Ex-Mill Date": "NA",
        "Required Date": "NA",
        Remark: "",
      }));
    }

    console.log(exportData);
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
    <div className="flex h-screen w-full ">
      {/* Side Menu Toggle Button */}
      <div
        className={`${
          menuOpen ? "ml-64" : ""
        } fixed top-4 left-0 z-20 transition-all duration-300`}
      >
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-[#696fcf] hover:bg-[#856ed2] text-white rounded-r-lg p-2 shadow-md flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <FaChevronLeft size={14} />
          ) : (
            <FaChevronRight size={14} />
          )}
        </button>
      </div>

      {/* Side Menu Panel */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: menuOpen ? 256 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-white shadow-lg z-10 overflow-hidden"
      >
        <div className="p-4 h-full">
          <h2 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
            <FaFileUpload /> Upload Reports
          </h2>

          <div className="space-y-4">
            {/* KPI Report Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                KPI Report
              </label>
              <div
                {...getKpiRootProps()}
                className="border-2 border-dashed border-[#bbadff] rounded-lg p-3 bg-[#f4f3f5] hover:bg-[#f5f0f9]  transition-colors cursor-pointer"
              >
                <input {...getKpiInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                  <FaFileAlt className="text-[#7851dc] text-lg mb-1" />
                  <p className="text-xs text-[#7851dc] font-medium truncate w-full">
                    {kpiFileName ? kpiFileName : "Drop KPI Report"}
                  </p>
                  {kpiFileName && (
                    <p className="text-[9px] text-green-600 mt-1">
                      File uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Report Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Invoice Report
              </label>
              <div
                {...getInvoiceRootProps()}
                className="border-2 border-dashed border-[#bbadff] rounded-lg p-3 bg-[#f4f3f5] hover:bg-[#f5f0f9] transition-colors cursor-pointer"
              >
                <input {...getInvoiceInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                  <FaFileInvoice className="text-[#7851dc] text-lg mb-1" />
                  <p className="text-xs text-[#7851dc] font-medium truncate w-full">
                    {invoiceFileName ? invoiceFileName : "Drop Invoice Report"}
                  </p>
                  {invoiceFileName && (
                    <p className="text-[9px] text-green-600 mt-1">
                      File uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              <motion.button
                onClick={Fetch_Data}
                className="w-full bg-gradient-to-r from-[#9fa0ff] to-[#696fcf] text-white text-xs py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-2 hover:from-[#8183f9] hover:to-[#696fcf]"
                whileTap={{ scale: 0.97 }}
                whileHover={{
                  boxShadow: "0 4px 6px rgba(59, 130, 246, 0.5)",
                  y: -1,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin">
                    <FaSync className="h-3 w-3" />
                  </div>
                ) : (
                  <>
                    <FaDatabase className="h-3 w-3" /> Fetch Data
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleExportClick}
                className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-xs py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-emerald-700"
                whileTap={{ scale: 0.97 }}
                whileHover={{
                  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.5)",
                  y: -1,
                }}
                disabled={isLoading || !data.length}
              >
                {isLoading ? (
                  <div className="animate-spin">
                    <FaSync className="h-3 w-3" />
                  </div>
                ) : (
                  <>
                    <FaDownload className="h-3 w-3" /> Export to Excel
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div
        className={`flex-1  transition-all duration-300 ${
          menuOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Header */}
        <div className="px-4 display flex flex-row gap-0 justify-between text-left">
          <div className="flex flex-col gap-0 mb-2 justify-baseline text-left">
            <h1 className="text-[20px] font-semibold text-gray-800">
              Thread Dashboard
            </h1>
            <p className="text-sm font-normal text-gray-400">
              Analize the thread data and generate insights.
            </p>
          </div>
          {lastUploadedDate && (
            <p className="text-xs text-gray-500 mt-2">
              Last Uploaded: {lastUploadedDate}
            </p>
          )}
        </div>

        {/* Content Area */}
        <div className="px-4 h-full overflow-y-auto">
          {isLoadingSavedData ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#dab6fc]"></div>
            </div>
          ) : data.length > 0 ? (
            <div className="bg-white rounded-lg overflow-x-auto">
              <DataGrid data={data} />
            </div>
          ) : (
            <div className="bg-white rounded-lg max-h-[400px] h-full flex flex-col justify-center items-center text-center">
              <FaDatabase className="mx-auto text-4xl text-blue-200 mb-4" />
              <h2 className="text-lg text-gray-600 font-medium">
                No Data Available
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Upload files and fetch data to see results
              </p>
            </div>
          )}
        </div>
      </div>
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
