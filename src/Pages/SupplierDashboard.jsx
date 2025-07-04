import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../Data/config";
import { useDropzone } from "react-dropzone";
import FullPageModal from "../Components/FullPageModal";
import ReportCard from "../Components/ReportCard";
import {
  FaExclamationTriangle,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaChartLine,
  FaFileAlt,
  FaFileImport,
  FaSync,
  FaExclamationCircle,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaWrench,
  FaRegClock,
  FaRegCalendarCheck,
  FaStar,
  FaShippingFast,
  FaRegCalendarAlt,
} from "react-icons/fa";
import SwrmMissingThreadChart from "../Components/SwrmMissingThreadChart";
import { motion, AnimatePresence } from "framer-motion";

export default function SupplierDashboard() {
  const [swrmFile, setSwrmFile] = useState(null);
  const [swrmFileName, setSwrmFileName] = useState("");
  const [swrmLastUpdated, setSwrmLastUpdated] = useState("");

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [metrics, setMetrics] = useState({
    missedExMillCount: 0,
    missedExMillPercent: 0,
    upcomingCount: 0,
    topLocations: [],
    upcomingByLocation: {},
  });
  const [timeframeFilter, setTimeframeFilter] = useState("10"); // days for upcoming orders

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/fetch_saved_data`);

      if (response.data && response.data.data) {
        const ordersData = response.data.data;
        setData(ordersData);
        calculateMetrics(ordersData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (ordersData) => {
    const today = new Date();

    // Filter for orders that missed ex-mill date
    const missedExMill = ordersData.filter((order) => {
      if (order["Ex-Mill Date"] === "NA" || order["Ex-Mill Date"] === "o")
        return false;

      const exMillDate = new Date(order["Ex-Mill Date"]);
      return exMillDate < today && order["Balance to Receive Qty"] > 0;
    });

    // Calculate upcoming orders (next X days)
    const upcoming = ordersData.filter((order) => {
      if (order["Earliest PCD"] === "o" || !order["Earliest PCD"]) return false;

      const pcdDate = new Date(order["Earliest PCD"]);
      const differenceInDays = Math.ceil(
        (pcdDate - today) / (1000 * 60 * 60 * 24)
      );
      return (
        differenceInDays >= 0 &&
        differenceInDays <= parseInt(timeframeFilter) &&
        order["Balance to Receive Qty"] > 0
      );
    });

    // Group upcoming orders by location
    const locationMap = {};
    upcoming.forEach((order) => {
      const location = order["Ship to Location"];
      if (!locationMap[location]) locationMap[location] = [];
      locationMap[location].push(order);
    });

    // Sort locations by order count
    const topLocations = Object.keys(locationMap)
      .map((loc) => ({ location: loc, count: locationMap[loc].length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setMetrics({
      missedExMillCount: missedExMill.length,
      missedExMillPercent: ordersData.length
        ? ((missedExMill.length / ordersData.length) * 100).toFixed(1)
        : 0,
      upcomingCount: upcoming.length,
      topLocations,
      upcomingByLocation: locationMap,
    });
  };

  // SWRM Dropzone
  const { getRootProps: getSwrmRootProps, getInputProps: getSwrmInputProps } =
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
          setSwrmFile(acceptedFiles[0]);
          setSwrmFileName(acceptedFiles[0].name);
        }
      },
    });

  // SWRM Upload Handler
  const handleUploadSwrm = async () => {
    if (!swrmFile) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("swrm", swrmFile);
    try {
      const response = await axios.post(`${apiUrl}/upload_swrm`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSwrmLastUpdated(response.data.last_updated);
      setMessage({
        text: "SWRM Report uploaded successfully!",
        type: "success",
      });
    } catch (error) {
      setMessage({ text: "Failed to upload SWRM Report.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" min-h-screen">
      <div className=" ">
        <div className="flex flex-col md:flex-row text-left justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold  bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 bg-clip-text text-transparent">
              Supplier Performance Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time visibility into supplier delivery performance
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={timeframeFilter}
              onChange={(e) => {
                setTimeframeFilter(e.target.value);
                calculateMetrics(data);
              }}
              className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="7">Next 7 Days</option>
              <option value="10">Next 10 Days</option>
              <option value="14">Next 14 Days</option>
              <option value="30">Next 30 Days</option>
            </select>
            <motion.button
              onClick={fetchDashboardData}
              className="bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm shadow-md hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FaSync className={isLoading ? "animate-spin" : ""} />
              Refresh Data
            </motion.button>
            <motion.button
              onClick={() => setModalOpen(true)}
              className="  bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 text-white text-sm py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 hover:from-[#8f91f6] hover:to-[#686fdc] transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              <FaFileImport className="mr-1" />
              Import Data
            </motion.button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"
            />
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Failed Ex-Mill"
                  value={metrics.missedExMillCount}
                  trend={{
                    value: metrics.missedExMillPercent + "%",
                    label: "of all orders",
                    direction: "up",
                    isGood: false,
                  }}
                  icon={<FaExclamationTriangle />}
                  color="red"
                />
                <MetricCard
                  title={`Upcoming PCD (${timeframeFilter} Days)`}
                  value={metrics.upcomingCount}
                  trend={{
                    value: metrics.topLocations[0]?.location || "N/A",
                    label: "",
                    icon: <FaMapMarkedAlt />,
                  }}
                  icon={<FaCalendarAlt />}
                  color="blue"
                />
                <MetricCard
                  title="Priority Orders"
                  value={
                    data.filter(
                      (o) =>
                        o["Is Priority"] === "Yes" &&
                        o["Balance to Receive Qty"] > 0
                    ).length
                  }
                  trend={{
                    value: "Needs Attention",
                    label: "active status",
                    icon: <FaStar className="text-amber-400" />,
                  }}
                  icon={<FaStar />}
                  color="amber"
                />
                <MetricCard
                  title="Average Delay"
                  value={(() => {
                    const delayedOrders = data.filter((order) => {
                      if (
                        order["Ex-Mill Date"] === "NA" ||
                        order["Ex-Mill Date"] === "o"
                      )
                        return false;
                      const exMillDate = new Date(order["Ex-Mill Date"]);
                      return (
                        exMillDate < new Date() &&
                        order["Balance to Receive Qty"] > 0
                      );
                    });

                    let totalDays = 0;
                    delayedOrders.forEach((order) => {
                      const exMillDate = new Date(order["Ex-Mill Date"]);
                      const days = Math.ceil(
                        (new Date() - exMillDate) / (1000 * 60 * 60 * 24)
                      );
                      totalDays += days;
                    });

                    return delayedOrders.length
                      ? Math.round(totalDays / delayedOrders.length)
                      : 0;
                  })()}
                  suffix="days"
                  trend={{
                    value: (() => {
                      const completedOrders = data.filter(
                        (o) =>
                          o["Ex-Mill Date"] !== "NA" &&
                          o["Ex-Mill Date"] !== "o" &&
                          o["Balance to Receive Qty"] === 0
                      );

                      const onTimeOrders = completedOrders.filter((o) => {
                        const exMillDate = new Date(o["Ex-Mill Date"]);
                        const receivedDate = new Date();
                        return exMillDate >= receivedDate;
                      });

                      return completedOrders.length
                        ? (
                            (onTimeOrders.length / completedOrders.length) *
                            100
                          ).toFixed(1) + "% on time"
                        : "N/A";
                    })(),
                    label: "delivery rate",
                    icon: <FaShippingFast className="text-green-500" />,
                  }}
                  icon={<FaRegClock />}
                  color="purple"
                />
              </div>

              {/* Main Dashboard Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Supplier Failure Card */}
                <DashboardCard
                  title="Supplier Failure Analysis"
                  icon={<FaExclamationCircle />}
                  className="bg-gradient-to-br from-red-50 to-white"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500">
                          <FaExclamationTriangle className="w-3 h-3" />
                        </span>
                        Orders Past Ex-Mill Date with Pending Delivery
                      </h3>
                      <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        {metrics.missedExMillCount} Orders
                      </span>
                    </div>

                    <div className="overflow-auto max-h-[600px] rounded-lg shadow-sm border border-gray-100">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              PO
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              Article
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              Ex-Mill Date
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              PCD Date
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              Days Overdue
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              Risk Level
                            </th>
                            <th className="px-3 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                              Pending
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {data
                            .filter((order) => {
                              if (
                                order["Ex-Mill Date"] === "NA" ||
                                order["Ex-Mill Date"] === "o"
                              )
                                return false;
                              const exMillDate = new Date(
                                order["Ex-Mill Date"]
                              );
                              return (
                                exMillDate < new Date() &&
                                order["Balance to Receive Qty"] > 0
                              );
                            })
                            .sort((a, b) => {
                              const dateA = new Date(a["Ex-Mill Date"]);
                              const dateB = new Date(b["Ex-Mill Date"]);
                              return dateA - dateB; // Oldest first
                            })
                            .slice(0, 10)
                            .map((order, idx) => {
                              const exMillDate = new Date(
                                order["Ex-Mill Date"]
                              );
                              const daysOverdue = Math.ceil(
                                (new Date() - exMillDate) /
                                  (1000 * 60 * 60 * 24)
                              );

                              // Calculate risk level
                              const pcdDate =
                                order["Earliest PCD"] !== "o" &&
                                order["Earliest PCD"]
                                  ? new Date(order["Earliest PCD"])
                                  : null;

                              let riskLevel = "Low";
                              let riskColor = "bg-green-100 text-green-800";

                              if (pcdDate) {
                                const daysUntilPcd = Math.ceil(
                                  (pcdDate - new Date()) / (1000 * 60 * 60 * 24)
                                );
                                if (daysUntilPcd < 0) {
                                  riskLevel = "Critical";
                                  riskColor = "bg-red-100 text-red-800";
                                } else if (daysUntilPcd < 7) {
                                  riskLevel = "High";
                                  riskColor = "bg-orange-100 text-orange-800";
                                } else if (daysUntilPcd < 14) {
                                  riskLevel = "Medium";
                                  riskColor = "bg-amber-100 text-amber-800";
                                }
                              }

                              return (
                                <tr
                                  key={idx}
                                  className={
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  }
                                >
                                  <td className="px-3 py-3 text-left text-[11px] text-gray-900 font-medium">
                                    {order.RMPONo}
                                    {order["Is Priority"] === "Yes" && (
                                      <span className="ml-1 text-amber-500">
                                        <FaStar className="inline w-3 h-3" />
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2 text-[11px] text-gray-900 text-left">
                                    {(() => {
                                      const name = order["Article Name"] || "";
                                      const idx = name.lastIndexOf("--");
                                      return idx !== -1
                                        ? name.substring(0, idx)
                                        : name;
                                    })()}
                                  </td>{" "}
                                  <td className="px-3 py-3 text-left text-[11px] text-gray-900">
                                    {order["Ex-Mill Date"]}
                                  </td>
                                  <td className="px-3 py-3 text-left text-[11px] text-gray-900">
                                    {order["Earliest PCD"] !== "o"
                                      ? order["Earliest PCD"]
                                      : "Not Set"}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full">
                                      {daysOverdue} days
                                    </span>
                                  </td>
                                  <td className="px-3 py-3">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${riskColor}`}
                                    >
                                      {riskLevel}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-xs text-gray-900 font-medium">
                                    {typeof order["Balance to Receive Qty"] ===
                                    "number"
                                      ? order["Balance to Receive Qty"].toFixed(
                                          0
                                        )
                                      : order["Balance to Receive Qty"]}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>

                      {data.filter((order) => {
                        if (
                          order["Ex-Mill Date"] === "NA" ||
                          order["Ex-Mill Date"] === "o"
                        )
                          return false;
                        const exMillDate = new Date(order["Ex-Mill Date"]);
                        return (
                          exMillDate < new Date() &&
                          order["Balance to Receive Qty"] > 0
                        );
                      }).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FaRegCalendarCheck className="mx-auto mb-3 text-2xl text-green-500" />
                          <p>No missed ex-mill orders found</p>
                          <p className="text-xs mt-1">
                            All suppliers are on schedule
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardCard>

                {/* Upcoming Orders Card */}
                <DashboardCard
                  title={`Upcoming PCD Orders (Next ${timeframeFilter} Days)`}
                  icon={<FaCalendarAlt />}
                  className="bg-gradient-to-br from-blue-50 to-white"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[12px] font-semibold text-gray-500 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-500">
                          <FaMapMarkedAlt className="w-3 h-3" />
                        </span>
                        Orders by Ship-To Location
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        {metrics.upcomingCount} Orders
                      </span>
                    </div>

                    {metrics.topLocations.length > 0 ? (
                      <div className="space-y-6">
                        {metrics.topLocations.map((loc, idx) => (
                          <div
                            key={idx}
                            className="space-y-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-[12px] text-gray-700 flex items-center gap-2">
                                <span
                                  className={`w-3 h-3 rounded-full bg-blue-${
                                    600 - idx * 100
                                  }`}
                                ></span>
                                {loc.location}
                              </h4>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">
                                {loc.count} orders
                              </span>
                            </div>

                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-blue-${
                                  600 - idx * 100
                                } rounded-full`}
                                style={{
                                  width: `${Math.min(
                                    (loc.count / metrics.upcomingCount) * 100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>

                            <div className="overflow-auto max-h-48">
                              <table className="min-w-full divide-y divide-gray-200 text-xs">
                                <thead className="bg-gray-50 text-[11px]">
                                  <tr>
                                    <th className="px-2 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                                      PO
                                    </th>
                                    <th className="px-2 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                                      Article
                                    </th>
                                    <th className="px-2 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                                      PCD
                                    </th>
                                    <th className="px-2 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                                      Ex-Mill
                                    </th>
                                    <th className="px-2 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                                      Days Left
                                    </th>
                                    <th className="px-2 py-2 text-left  font-medium text-gray-500 uppercase tracking-wider">
                                      Qty
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-[11px]">
                                  {metrics.upcomingByLocation[loc.location]
                                    ?.slice(0, 5)
                                    .map((order, idx) => {
                                      const pcdDate = new Date(
                                        order["Earliest PCD"]
                                      );
                                      const daysLeft = Math.ceil(
                                        (pcdDate - new Date()) /
                                          (1000 * 60 * 60 * 24)
                                      );

                                      return (
                                        <tr
                                          key={idx}
                                          className={
                                            idx % 2 === 0
                                              ? "bg-white"
                                              : "bg-gray-50"
                                          }
                                        >
                                          <td className="px-2 py-2  text-gray-900 font-medium">
                                            {order.RMPONo}
                                            {order["Is Priority"] === "Yes" && (
                                              <span className="ml-1 text-amber-500">
                                                <FaStar className="inline w-3 h-3" />
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-2 py-2  text-gray-900 text-left">
                                            {(() => {
                                              const name =
                                                order["Article Name"] || "";
                                              const idx =
                                                name.lastIndexOf("--");
                                              return idx !== -1
                                                ? name.substring(0, idx)
                                                : name;
                                            })()}
                                          </td>{" "}
                                          <td className="px-2 py-2  text-gray-900  text-left">
                                            {order["Earliest PCD"]}
                                          </td>
                                          <td className="px-2 py-2 text-gray-900  text-left">
                                            {order["Ex-Mill Date"] !== "o"
                                              ? order["Ex-Mill Date"]
                                              : "Not Set"}
                                          </td>
                                          <td className="px-2 py-2">
                                            <span
                                              className={`px-2 py-1  font-medium rounded-full
                                              ${
                                                daysLeft <= 3
                                                  ? "bg-red-100 text-red-800"
                                                  : daysLeft <= 7
                                                  ? "bg-amber-100 text-amber-800"
                                                  : "bg-green-100 text-green-800"
                                              }`}
                                            >
                                              {daysLeft} days
                                            </span>
                                          </td>
                                          <td className="px-3 py-3  text-gray-900 font-medium">
                                            {typeof order[
                                              "Balance to Receive Qty"
                                            ] === "number"
                                              ? order[
                                                  "Balance to Receive Qty"
                                                ].toFixed(0)
                                              : order["Balance to Receive Qty"]}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
                        <FaRegCalendarCheck className="mx-auto mb-3 text-2xl text-blue-500" />
                        <p>No upcoming orders found</p>
                        <p className="text-xs mt-1">
                          All scheduled orders are beyond {timeframeFilter} days
                        </p>
                      </div>
                    )}
                  </div>
                </DashboardCard>
              </div>

              <SwrmMissingThreadChart />
            </motion.div>
          </AnimatePresence>
        )}

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
              <div className="grid grid-cols-1 md:grid-cols-1  gap-6 mb-8">
                {/* General Requirement Report */}
                <ReportCard
                  title="SWRM Report"
                  description="Upload SWRM data (only THREAD (DECIMAL) will be processed)"
                  fileName={swrmFileName}
                  lastUpdated={swrmLastUpdated}
                  rootProps={getSwrmRootProps}
                  inputProps={getSwrmInputProps}
                  handleUpload={handleUploadSwrm}
                  icon={<FaFileAlt />}
                  color="purple"
                  isLoading={isLoading}
                />
              </div>
            </FullPageModal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// New Modern Metric Card Component
const MetricCard = ({
  title,
  value,
  suffix = "",
  trend = null,
  icon,
  color,
}) => {
  const colors = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    red: "from-red-500 to-red-600 shadow-red-200",
    green: "from-green-500 to-green-600 shadow-green-200",
    amber: "from-amber-500 to-amber-600 shadow-amber-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
  };

  const bgColors = {
    blue: "bg-blue-50",
    red: "bg-red-50",
    green: "bg-green-50",
    amber: "bg-amber-50",
    purple: "bg-purple-50",
  };

  const gradientClass = colors[color] || colors.blue;
  const bgClass = bgColors[color] || bgColors.blue;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-50 transition-all hover:shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <div
              className={`text-lg bg-gradient-to-r ${gradientClass} bg-clip-text `}
            >
              {icon}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-1 text-gray-800">
              {value}
              {suffix && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {suffix}
                </span>
              )}
            </p>
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center text-xs">
            {trend.icon ? (
              trend.icon
            ) : trend.direction ? (
              trend.direction === "up" ? (
                <FaArrowUp
                  className={`mr-1 ${
                    trend.isGood ? "text-green-500" : "text-red-500"
                  }`}
                />
              ) : (
                <FaArrowDown
                  className={`mr-1 ${
                    trend.isGood ? "text-green-500" : "text-red-500"
                  }`}
                />
              )
            ) : null}
            <span className="ml-2 font-medium mr-1 ">
              {trend.value.charAt(0).toUpperCase() +
                trend.value.slice(1).toLowerCase()}
            </span>
            <span className=" text-gray-400">{trend.label}</span>
          </div>
        )}
      </div>
      <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`}></div>
    </div>
  );
};

// Modern Dashboard Card
const DashboardCard = ({ title, children, icon, className = "" }) => {
  return (
    <div
      className={`rounded-xl shadow-md border border-gray-50 overflow-hidden ${className}`}
    >
      <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          {title}
        </h2>
        <button className="text-gray-400 hover:text-gray-600">
          <FaFilter className="text-xs" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};
