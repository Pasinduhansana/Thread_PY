import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../Data/config";
import { useDropzone } from "react-dropzone";
import ReportCard from "../Components/ReportCard";
import FullPageModal from "../Components/FullPageModal";
import {
  FaFileAlt,
  FaFileUpload,
  FaSync,
  FaRegCalendarAlt,
  FaArrowUp,
  FaDatabase,
  FaWrench,
  FaChartBar,
  FaBoxOpen,
  FaTimes,
  FaFileImport,
  FaClipboardList,
  FaChartLine,
  FaCog,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSave,
  FaRegListAlt,
  FaEdit,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
  isValid,
  getWeek,
  getYear,
  getMonth,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import TimeSeriesChart from "../Components/TimeSeriesChart";
import "chart.js/auto";

const ARTICLE_CODES = ["5722160", "2925120", "F025160", "F025140", "57A3140"];

function getArticleKey(articleName) {
  if (!articleName) return "";
  for (let code of ARTICLE_CODES) {
    if (articleName.startsWith(code)) return code;
  }
  return "";
}

export default function ROP_Thread() {
  // Existing state variables
  const [requirementFile, setRequirementFile] = useState(null);
  const [requirementFileName, setRequirementFileName] = useState("");
  const [requirementData, setRequirementData] = useState([]);
  const [requirementLastUpdated, setRequirementLastUpdated] = useState("");

  const [inventoryFile, setInventoryFile] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [inventoryFileName, setInventoryFileName] = useState("");
  const [inventoryLastUpdated, setInventoryLastUpdated] = useState("");

  const [kpiFile, setKpiFile] = useState(null);
  const [kpiData, setkpiData] = useState([]);
  const [kpiFileName, setKpiFileName] = useState("");
  const [kpiLastUpdated, setKpiLastUpdated] = useState("");

  // New state variables for visualization
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [minLevelModalOpen, setMinLevelModalOpen] = useState(false);
  const [minimumLevels, setMinimumLevels] = useState({});
  const [tempMinimumLevels, setTempMinimumLevels] = useState({});
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleGroups, setArticleGroups] = useState([]);
  const [timeGranularity, setTimeGranularity] = useState("month");

  // Fetch last uploaded dates and stock data on component mount
  useEffect(() => {
    fetchRequirementData();
    fetchRequirementLastUpdated();
    fetchKPData();
    fetchKPILastUpdated();
    fetchLastUpdatedTimes();
    fetchStockData();
  }, []);

  const fetchKPData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_kpi_data`);
      setkpiData(response.data.kpi || []);
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      setMessage({
        text: "Failed to fetch KPI data",
        type: "error",
      });
    }
  };

  const fetchKPILastUpdated = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_kpi_last_updated`);
      setKpiLastUpdated(response.data.last_updated || "Never");
    } catch (error) {
      console.error("Error fetching KPI last updated:", error);
    }
  };

  const fetchRequirementData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get_requirement_data`);
      setRequirementData(response.data.requirement || []);
    } catch (error) {
      console.error("Error fetching requirement data:", error);
      setMessage({
        text: "Failed to fetch requirement data",
        type: "error",
      });
    }
  };

  const fetchRequirementLastUpdated = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/get_requirement_last_updated`
      );
      setRequirementLastUpdated(response.data.last_updated || "Never");
    } catch (error) {
      console.error("Error fetching requirement last updated:", error);
    }
  };

  const fetchLastUpdatedTimes = async () => {
    try {
      const reqResponse = await axios.get(
        `${apiUrl}/get_requirement_last_updated`
      );
      if (reqResponse.data && reqResponse.data.last_updated) {
        setRequirementLastUpdated(reqResponse.data.last_updated);
      }

      const invResponse = await axios.get(
        `${apiUrl}/get_inventory_last_updated`
      );
      if (invResponse.data && invResponse.data.last_updated) {
        setInventoryLastUpdated(invResponse.data.last_updated);
      }

      const kpiResponse = await axios.get(`${apiUrl}/get_kpi_last_updated`);
      if (kpiResponse.data && kpiResponse.data.last_updated) {
        setKpiLastUpdated(kpiResponse.data.last_updated);
      }
    } catch (error) {
      console.error("Error fetching last updated times:", error);
    }
  };

  // Fetch stock data from inventory.json
  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/get_inventory_data`);

      if (response.data && response.data.inventory) {
        setStockData(response.data.inventory);

        // Group by article name
        const groups = {};
        response.data.inventory.forEach((item) => {
          const articleName = item["Article Name"];
          if (!groups[articleName]) {
            groups[articleName] = [];
          }
          groups[articleName].push(item);
        });

        setArticleGroups(
          Object.keys(groups).map((name) => ({
            name,
            items: groups[name],
          }))
        );
      }

      // Fetch minimum levels if they exist
      try {
        const minLevelsResponse = await axios.get(
          `${apiUrl}/get_minimum_levels`
        );
        if (minLevelsResponse.data && minLevelsResponse.data.minimumLevels) {
          setMinimumLevels(minLevelsResponse.data.minimumLevels);
          setTempMinimumLevels(minLevelsResponse.data.minimumLevels);
        }
      } catch (err) {
        console.log("No minimum levels found, using defaults");
        setMinimumLevels({});
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setMessage({
        text: "Failed to load stock data. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save minimum levels
  const saveMinimumLevels = async () => {
    try {
      setIsLoading(true);
      await axios.post(`${apiUrl}/save_minimum_levels`, {
        minimumLevels: tempMinimumLevels,
      });

      setMinimumLevels(tempMinimumLevels);
      setMessage({
        text: "Minimum stock levels saved successfully!",
        type: "success",
      });
      setMinLevelModalOpen(false);
    } catch (error) {
      console.error("Error saving minimum levels:", error);
      setMessage({
        text: "Failed to save minimum stock levels.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Requirement Report Dropzone
  const {
    getRootProps: getRequirementRootProps,
    getInputProps: getRequirementInputProps,
  } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setRequirementFile(acceptedFiles[0]);
        setRequirementFileName(acceptedFiles[0].name);
      }
    },
  });

  // Inventory Report Dropzone
  const {
    getRootProps: getInventoryRootProps,
    getInputProps: getInventoryInputProps,
  } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setInventoryFile(acceptedFiles[0]);
        setInventoryFileName(acceptedFiles[0].name);
      }
    },
  });

  // KPI Report Dropzone
  const { getRootProps: getKpiRootProps, getInputProps: getKpiInputProps } =
    useDropzone({
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
      },
      maxFiles: 1,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          setKpiFile(acceptedFiles[0]);
          setKpiFileName(acceptedFiles[0].name);
        }
      },
    });

  // Upload handlers
  const handleUploadRequirement = async () => {
    if (!requirementFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("requirement", requirementFile);

    try {
      const response = await axios.post(
        `${apiUrl}/upload_requirement`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setRequirementLastUpdated(response.data.last_updated);
      setMessage({
        text: "Requirement Report uploaded successfully!",
        type: "success",
      });
    } catch (error) {
      setMessage({
        text: "Failed to upload Requirement Report.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadInventory = async () => {
    if (!inventoryFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("inventory", inventoryFile);

    try {
      const response = await axios.post(
        `${apiUrl}/upload_inventory`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setInventoryLastUpdated(response.data.last_updated);
      setMessage({
        text: "Inventory Report uploaded successfully!",
        type: "success",
      });

      // Refresh stock data after upload
      fetchStockData();
    } catch (error) {
      setMessage({ text: "Failed to upload Inventory Report.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadKpi = async () => {
    if (!kpiFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("kpi", kpiFile);

    try {
      const response = await axios.post(`${apiUrl}/upload_kpi`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setKpiLastUpdated(response.data.last_updated);
      setMessage({
        text: "KPI Report uploaded successfully!",
        type: "success",
      });
    } catch (error) {
      setMessage({ text: "Failed to upload KPI Report.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const processAllReports = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/process_reports`);
      setMessage({
        text: "All reports processed successfully!",
        type: "success",
      });
    } catch (error) {
      setMessage({ text: "Error processing reports.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for opening the minimum level configuration modal
  const openMinLevelModal = (article = null) => {
    setSelectedArticle(article);
    setTempMinimumLevels({ ...minimumLevels });
    setMinLevelModalOpen(true);
  };

  // Format article name for display
  const formatArticleName = (name) => {
    if (!name) return "";
    // Extract code and description if available
    const match = name.match(/^([^-]+)-(.+)$/);
    if (match) {
      return (
        <span>
          <span className="font-semibold">{match[1]}</span>
          <span className="text-gray-500 ml-2 text-xs">
            ({match[2].trim()})
          </span>
        </span>
      );
    }
    return name;
  };

  // Get stock status based on minimum level
  const getStockStatus = (item) => {
    const articleCode = item["Article Name"].split("-")[0];
    const minLevel = minimumLevels[articleCode] || 10; // Default to 10 if not set
    const stock = parseFloat(item["Total Qty"]) || 0;

    if (stock <= 0) return { status: "danger", text: "Out of stock" };
    if (stock < minLevel) return { status: "warning", text: "Low stock" };
    return { status: "good", text: "In stock" };
  };

  const getArticleTotals = () => {
    const articleTotals = {};
    stockData.forEach((item) => {
      const articleCode = item["Article Name"].split("-")[0];
      if (!articleTotals[articleCode]) {
        articleTotals[articleCode] = {
          articleCode,
          articleName: item["Article Name"],
          totalQty: 0,
          items: [],
        };
      }
      articleTotals[articleCode].totalQty += parseFloat(item["Total Qty"]) || 0;
      articleTotals[articleCode].items.push(item);
    });
    return Object.values(articleTotals);
  };

  const getRequirementTotals = () => {
    const articleTotals = {};
    requirementData.forEach((item) => {
      const articleCode = item["Article Name"].split("-")[0];
      if (!articleTotals[articleCode]) {
        articleTotals[articleCode] = {
          articleCode,
          articleName: item["Article Name"],
          totalQty: 0,
          items: [],
        };
      }
      articleTotals[articleCode].totalQty += parseFloat(item["Req Qty"]) || 0;
      articleTotals[articleCode].items.push(item);
    });
    return Object.values(articleTotals);
  };

  const getDemandMetrics = () => {
    if (!requirementData.length)
      return { total: 0, articles: 0, factories: new Set() };

    const factories = new Set();
    let totalDemand = 0;

    requirementData.forEach((item) => {
      totalDemand += parseFloat(item["Req Qty"]) || 0;
      if (item["OCFactory"]) factories.add(item["OCFactory"]);
    });

    return {
      total: totalDemand.toFixed(0),
      articles: getRequirementTotals().length,
      factories: factories.size,
    };
  };

  // Add this function to process PCD-based demand data
  const getTimeSeriesDemandData = () => {
    const demandByDate = {};

    requirementData.forEach((item) => {
      if (!item.PCD || item.PCD === "o") return;

      let dateKey;
      try {
        const date = parseISO(item.PCD);
        if (!isValid(date)) return;
        // Group by selected granularity
        switch (timeGranularity) {
          case "day":
            dateKey = format(date, "yyyy-MM-dd");
            break;
          case "week":
            const weekNum = getWeek(date);
            const year = getYear(date);
            dateKey = `${year}-W${weekNum.toString().padStart(2, "0")}`;
            break;
          case "month":
          default:
            dateKey = format(date, "yyyy-MM");
            break;
        }

        const demand = parseFloat(item["Req Qty"]) || 0;

        if (!demandByDate[dateKey]) {
          demandByDate[dateKey] = { date: item.PCD, demand: 0 };
        }
        demandByDate[dateKey].demand += demand;
      } catch (error) {
        console.error("Date parsing error:", error);
      }
    });

    // Convert to array and sort by date
    return Object.values(demandByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  const articleData = ARTICLE_CODES.map((code) => {
    // Inventory
    const inv = stockData
      .filter(
        (item) => item["Article Name"] && item["Article Name"].startsWith(code)
      )
      .reduce((sum, item) => sum + parseFloat(item["Total Qty"] || 0), 0);

    // Requirement
    const req = requirementData
      .filter(
        (item) => item["Article Name"] && item["Article Name"].startsWith(code)
      )
      .reduce((sum, item) => sum + parseFloat(item["Req Qty"] || 0), 0);

    // KPI/Order
    const kpiOrders = kpiData.filter(
      (item) => item["Article Name"] && item["Article Name"].startsWith(code)
    );
    const balanceToReceive = kpiOrders.reduce(
      (sum, item) => sum + parseFloat(item["Balance to Receive Qty"] || 0),
      0
    );
    // Try both possible column names for PO Qty
    const poQty = kpiOrders.reduce(
      (sum, item) =>
        sum +
        parseFloat(
          item["PO Qty (Stock UOM)"] || item["PO Qty(Purchase UOM)"] || 0
        ),
      0
    );

    return {
      code,
      inventory: inv,
      requirement: req,
      balanceToReceive,
      poQty,
    };
  });

  // Chart data
  const chartData = {
    labels: articleData.map((a) => a.code),
    datasets: [
      {
        label: "Inventory",
        data: articleData.map((a) => a.inventory),
        backgroundColor: "#4ade80",
      },
      {
        label: "Requirement",
        data: articleData.map((a) => a.requirement),
        backgroundColor: "#fbbf24",
      },
      {
        label: "Order (Balance to Receive)",
        data: articleData.map((a) => a.balanceToReceive),
        backgroundColor: "#60a5fa",
      },
      {
        label: "Order (Total PO Qty)",
        data: articleData.map((a) => a.poQty),
        backgroundColor: "#f472b6",
      },
    ],
  };

  return (
    <div className="px-6 bg-gray-50 min-h-screen">
      <div className=" mx-auto">
        {/* Stock Level Visualization */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col text-left">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                <FaChartBar className="mr-2 text-indigo-600" />
                Thread Stock Levels
              </h2>
              <div className="text-[12px] text-gray-500">
                Last updated: {inventoryLastUpdated || "Never"}
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={() => setModalOpen(true)}
                className="  bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 text-white text-sm py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 hover:from-[#8f91f6] hover:to-[#686fdc] transition-colors"
                whileTap={{ scale: 0.97 }}
              >
                <FaFileImport className="mr-1" />
                Import Data
              </motion.button>

              <motion.button
                onClick={() => openMinLevelModal()}
                className="  bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 text-white text-sm py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 hover:from-[#8f91f6] hover:to-[#686fdc] transition-colors"
                whileTap={{ scale: 0.97 }}
              >
                <FaCog className="mr-1" />
                Configure Min Levels
              </motion.button>
            </div>
          </div>

          {/* Alert Message */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="mr-2" />
              ) : (
                <FaWrench className="mr-2" />
              )}
              <span>{message.text}</span>
            </motion.div>
          )}
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-center my-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
              />
            </div>
          )}
          {stockData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <FaBoxOpen className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500">No inventory data available.</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload an inventory report to view stock levels.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 outline-none">
              {/* Single combined chart for all articles */}
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getArticleTotals()}
                    layout="vertical" // This switches to horizontal layout
                    margin={{ top: 20, right: 70, left: 150, bottom: 20 }} // Increased left margin for article names
                    className="outline-none"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      label={{
                        value: "Stock Quantity",
                        position: "insideBottom",
                        offset: -15,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="articleName" // Use article name instead of code
                      width={140} // Increased width to accommodate article names
                      tick={{ fontSize: 9 }}
                    />
                    <Tooltip
                      formatter={(value, name, props) => {
                        return [
                          `${value} units`,
                          `${props.payload.articleName}`,
                        ];
                      }}
                      labelFormatter={(label) =>
                        `Article: ${label.split("-")[0]}`
                      }
                    />
                    <Legend formatter={(value, entry) => `Stock Level`} />

                    {/* Add minimum level reference lines for each article - in crimson */}
                    {getArticleTotals().map((article) => {
                      const minLevel = minimumLevels[article.articleCode] || 10;
                      return (
                        <ReferenceLine
                          key={`ref-${article.articleCode}`}
                          y={article.articleName}
                          x={minLevel}
                          stroke="crimson"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          isFront={true}
                          label={{
                            position: "right",
                            value: `Min: ${minLevel}`,
                            fontSize: 9,
                            fill: "crimson",
                          }}
                        />
                      );
                    })}

                    <Bar
                      name="Stock Level"
                      dataKey="totalQty"
                      fill="#8884d8"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {getArticleTotals().map((entry, i) => {
                        // Article-level check
                        const articleCode = entry.articleCode;
                        const minLevel = minimumLevels[articleCode] || 10;

                        let color = "#10b981"; // Good stock
                        if (entry.totalQty <= 0)
                          color = "#ef4444"; // Out of stock
                        else if (entry.totalQty < minLevel) color = "#f59e0b"; // Low stock

                        return <Cell key={i} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Minimum level indicator legend */}
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Out of stock</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span>Below minimum level</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span>Sufficient stock</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-5 border-t border-dashed border-red-500"></div>
                  <span>Minimum level threshold</span>
                </div>
              </div>
            </div>
          )}

          {/* Demand Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(() => {
              const metrics = getDemandMetrics();
              return (
                <>
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                        <FaRegListAlt size={20} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Total Demand</p>
                        <p className="text-xl font-semibold">
                          {metrics.total} units
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <FaChartLine size={20} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Article Types</p>
                        <p className="text-xl font-semibold">
                          {metrics.articles}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                        <FaRegCalendarAlt size={20} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">
                          Source Factories
                        </p>
                        <p className="text-xl font-semibold">
                          {metrics.factories}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Demand Chart */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col text-left">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                  <FaChartLine className="mr-2 text-indigo-600" />
                  Thread Demand Requirements
                </h2>
                <div className="text-[12px] text-gray-500">
                  Last updated: {requirementLastUpdated || "Never"}
                </div>
              </div>
            </div>

            {requirementData.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FaRegListAlt className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500">No requirement data available.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload a requirement report to view demand levels.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-4 mb-6 outline-none">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getRequirementTotals()}
                      layout="vertical"
                      margin={{ top: 20, right: 70, left: 150, bottom: 20 }}
                      className="outline-none"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        label={{
                          value: "Required Quantity",
                          position: "insideBottom",
                          offset: -15,
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="articleName"
                        width={140}
                        tick={{ fontSize: 9 }}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          return [
                            `${value} units`,
                            `${props.payload.articleName}`,
                          ];
                        }}
                        labelFormatter={(label) =>
                          `Article: ${label.split("-")[0]}`
                        }
                      />
                      <Legend formatter={(value, entry) => `Demand Level`} />
                      <Bar
                        name="Demand Level"
                        dataKey="totalQty"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Chart */}
          {stockData.length > 0 && requirementData.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <FaChartBar className="mr-2 text-indigo-600" />
                Stock vs Demand Comparison
              </h2>

              <div className="bg-white rounded-xl shadow-md p-4 outline-none">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      margin={{ top: 20, right: 70, left: 150, bottom: 20 }}
                      data={(() => {
                        const stockById = {};
                        getArticleTotals().forEach((item) => {
                          stockById[item.articleCode] = item.totalQty;
                        });

                        return getRequirementTotals().map((item) => ({
                          articleCode: item.articleCode,
                          articleName: item.articleName,
                          demand: item.totalQty,
                          stock: stockById[item.articleCode] || 0,
                        }));
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="articleName"
                        width={140}
                        tick={{ fontSize: 9 }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar name="Stock" dataKey="stock" fill="#10b981" />
                      <Bar name="Demand" dataKey="demand" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Time Series Demand Chart */}
          {requirementData.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col text-left">
                  <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                    <FaChartLine className="mr-2 text-indigo-600" />
                    Demand Timeline by PCD
                  </h2>
                  <div className="text-[12px] text-gray-500">
                    View upcoming demand based on PCD dates
                  </div>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setTimeGranularity("month")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      timeGranularity === "month"
                        ? "bg-white shadow-sm text-indigo-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setTimeGranularity("week")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      timeGranularity === "week"
                        ? "bg-white shadow-sm text-indigo-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setTimeGranularity("day")}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      timeGranularity === "day"
                        ? "bg-white shadow-sm text-indigo-600"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Day
                  </button>
                </div>
              </div>

              <TimeSeriesChart
                data={getTimeSeriesDemandData()}
                granularity={timeGranularity}
                title="Timeline of Thread Demand by PCD"
              />
            </div>
          )}

          {requirementData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <FaCalendarAlt size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">
                      Upcoming 30 Days Demand
                    </p>
                    <p className="text-xl font-semibold">
                      {getTimeSeriesDemandData()
                        .filter((item) => {
                          try {
                            const date = parseISO(item.date);
                            const now = new Date();
                            const in30Days = new Date();
                            in30Days.setDate(now.getDate() + 30);
                            return date >= now && date <= in30Days;
                          } catch (e) {
                            return false;
                          }
                        })
                        .reduce((sum, item) => sum + item.demand, 0)
                        .toFixed(0)}{" "}
                      units
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <FaChartLine size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Peak Demand Period</p>
                    <p className="text-xl font-semibold">
                      {(() => {
                        const data = getTimeSeriesDemandData();
                        if (data.length === 0) return "N/A";
                        const maxItem = data.reduce(
                          (max, item) =>
                            item.demand > max.demand ? item : max,
                          { demand: 0 }
                        );
                        try {
                          return format(parseISO(maxItem.date), "MMM yyyy");
                        } catch (e) {
                          return "N/A";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FaChartLine size={20} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Future Demand</p>
                    <p className="text-xl font-semibold">
                      {getTimeSeriesDemandData()
                        .filter((item) => {
                          try {
                            return parseISO(item.date) > new Date();
                          } catch (e) {
                            return false;
                          }
                        })
                        .reduce((sum, item) => sum + item.demand, 0)
                        .toFixed(0)}{" "}
                      units
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Thread ROP Dashboard</h2>
            <div className="mb-8">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: {
                      display: true,
                      text: "Inventory vs Requirement vs Orders",
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: "Quantity" },
                    },
                  },
                }}
              />
            </div>
            <div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Article Code</th>
                    <th className="border px-2 py-1">Inventory</th>
                    <th className="border px-2 py-1">Requirement</th>
                    <th className="border px-2 py-1">
                      Order (Balance to Receive)
                    </th>
                    <th className="border px-2 py-1">Order (Total PO Qty)</th>
                  </tr>
                </thead>
                <tbody>
                  {articleData.map((row) => (
                    <tr key={row.code}>
                      <td className="border px-2 py-1">{row.code}</td>
                      <td className="border px-2 py-1">{row.inventory}</td>
                      <td className="border px-2 py-1">{row.requirement}</td>
                      <td className="border px-2 py-1">
                        {row.balanceToReceive}
                      </td>
                      <td className="border px-2 py-1">{row.poQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Import Modal - Full Page Content */}
        <AnimatePresence>
          {modalOpen && (
            <FullPageModal onClose={() => setModalOpen(false)}>
              {/* Alert Message */}
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 p-4 rounded-lg flex items-center ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <FaRegCalendarAlt className="mr-2" />
                  ) : (
                    <FaWrench className="mr-2" />
                  )}
                  <span>{message.text}</span>
                </motion.div>
              )}

              {/* Reports Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* General Requirement Report */}
                <ReportCard
                  title="General Requirement Report"
                  description="Upload requirement data for thread planning"
                  fileName={requirementFileName}
                  lastUpdated={requirementLastUpdated}
                  rootProps={getRequirementRootProps}
                  inputProps={getRequirementInputProps}
                  handleUpload={handleUploadRequirement}
                  icon={<FaFileAlt />}
                  color="blue"
                  isLoading={isLoading}
                />

                {/* General Inventory Report */}
                <ReportCard
                  title="General Inventory Report"
                  description="Upload inventory data for stock analysis"
                  fileName={inventoryFileName}
                  lastUpdated={inventoryLastUpdated}
                  rootProps={getInventoryRootProps}
                  inputProps={getInventoryInputProps}
                  handleUpload={handleUploadInventory}
                  icon={<FaBoxOpen />}
                  color="green"
                  isLoading={isLoading}
                />

                {/* General KPI Report */}
                <ReportCard
                  title="General KPI Report"
                  description="Upload KPI metrics for performance tracking"
                  fileName={kpiFileName}
                  lastUpdated={kpiLastUpdated}
                  rootProps={getKpiRootProps}
                  inputProps={getKpiInputProps}
                  handleUpload={handleUploadKpi}
                  icon={<FaChartBar />}
                  color="purple"
                  isLoading={isLoading}
                />
              </div>

              {/* Process All Button */}
              {(requirementFileName || inventoryFileName || kpiFileName) && (
                <motion.button
                  onClick={processAllReports}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm py-4 px-6 rounded-lg shadow-md flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-colors"
                  whileTap={{ scale: 0.97 }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <FaSync className="animate-spin mr-2" />
                  ) : (
                    <FaDatabase className="mr-2" />
                  )}
                  Process All Reports
                </motion.button>
              )}
            </FullPageModal>
          )}
        </AnimatePresence>
        {/* Minimum Level Configuration Modal */}
        <AnimatePresence>
          {minLevelModalOpen && (
            // Replace the current minimum level modal content with this more compact version
            <FullPageModal
              onClose={() => setMinLevelModalOpen(false)}
              title="Configure Minimum Stock Levels"
              icon={<FaCog />}
            >
              <div className="bg-gray-50 p-4 mb-6 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-amber-500 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">
                    About Minimum Stock Levels
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Set minimum stock threshold for each article. When stock falls
                  below these levels, it will be highlighted as low stock in the
                  dashboard.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-medium">Article Minimum Levels</h3>
                  <button
                    onClick={saveMinimumLevels}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm flex items-center"
                  >
                    {isLoading ? (
                      <FaSync className="animate-spin mr-2" />
                    ) : (
                      <FaSave className="mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {getArticleTotals().map((article, i) => {
                      const articleCode = article.articleCode;
                      return (
                        <div
                          key={i}
                          className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                              <span className="font-medium text-gray-800">
                                {articleCode}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Total Stock: {article.totalQty} units
                            </p>
                          </div>
                          <div className="ml-4 w-20">
                            <input
                              type="number"
                              min="0"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1 px-2 border text-center"
                              value={tempMinimumLevels[articleCode] || 10}
                              onChange={(e) => {
                                const newLevels = { ...tempMinimumLevels };
                                newLevels[articleCode] = parseInt(
                                  e.target.value
                                );
                                setTempMinimumLevels(newLevels);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </FullPageModal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Status Card Component for dashboard
const StatusCard = ({ title, lastUpdated, icon, color }) => {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-100",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  };

  const colorSet = colors[color] || colors.blue;

  return (
    <div
      className={`${colorSet.bg} border ${colorSet.border} rounded-lg overflow-hidden shadow-sm`}
    >
      <div className="p-4">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-full ${colorSet.iconBg} ${colorSet.iconColor} mr-3`}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">Report</p>
          </div>
        </div>

        <div className="mt-3 bg-white bg-opacity-60 rounded p-2">
          <div className="flex items-center text-xs text-gray-600">
            <FaRegCalendarAlt className="mr-2" />
            <span>
              {lastUpdated ? (
                <>
                  Last updated:{" "}
                  <span className="font-medium">{lastUpdated}</span>
                </>
              ) : (
                <span className="text-gray-500">No data uploaded</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
