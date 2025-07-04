import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { apiUrl } from "../Data/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import {
  FaChartPie,
  FaBuilding,
  FaTshirt,
  FaPalette,
  FaExclamationTriangle,
} from "react-icons/fa";

const COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#0d9488",
  "#059669",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
];

const SwrmMissingThreadChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartType, setChartType] = useState("factory"); // factory, style, color

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/get_swrm_data`);
        setData(response.data.missing_thread_combinations || []);
        console.log(
          "Missing Thread Combinations Data:",
          response.data.missing_thread_combinations
        );
      } catch (err) {
        setError("Failed to load missing thread combinations data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Group by the selected category
    const groupField =
      chartType === "factory"
        ? "OCFactory"
        : chartType === "style"
        ? "StyleCode"
        : "GMTColorName";

    const labelField =
      chartType === "factory"
        ? "OCFactory"
        : chartType === "style"
        ? "StyleName"
        : "GMTColorName";

    const groupedData = {};

    data.forEach((item) => {
      const key = item[groupField] || "Unknown";
      const label = item[labelField] || key;

      if (!groupedData[key]) {
        groupedData[key] = {
          name: label,
          value: 0,
          items: [],
        };
      }

      groupedData[key].value += 1;
      groupedData[key].items.push(item);
    });

    return Object.values(groupedData).sort((a, b) => b.value - a.value);
  }, [data, chartType]);

  const renderActiveShape = (props) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin((-midAngle * Math.PI) / 180);
    const cos = Math.cos((-midAngle * Math.PI) / 180);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          fontSize={12}
        >
          {payload.name.length > 20
            ? payload.name.substring(0, 20) + "..."
            : payload.name}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#666"
          fontSize={12}
        >
          {`${value} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-600">
        <FaExclamationTriangle className="mx-auto text-3xl mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FaExclamationTriangle className="text-amber-500 mr-2" />
            Missing Thread Combinations
          </h2>
          <p className="text-gray-500 text-sm">
            Styles/colors that need thread specifications
          </p>
        </div>

        <div className="mt-3 sm:mt-0 flex bg-gray-100 rounded-lg p-1 text-sm">
          <button
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center ${
              chartType === "factory"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setChartType("factory")}
          >
            <FaBuilding className="mr-1" /> Factory
          </button>
          <button
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center ${
              chartType === "style"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setChartType("style")}
          >
            <FaTshirt className="mr-1" /> Style
          </button>
          <button
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center ${
              chartType === "color"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setChartType("color")}
          >
            <FaPalette className="mr-1" /> Color
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <FaChartPie className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500">No missing thread combinations found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow p-4 text-white">
              <div className="font-bold text-lg mb-1">Total Missing</div>
              <div className="text-3xl font-bold">{data.length}</div>
              <div className="text-indigo-100 mt-1">
                combinations require thread specs
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow p-4 text-white">
              <div className="font-bold text-lg mb-1">
                Unique{" "}
                {chartType === "factory"
                  ? "Factories"
                  : chartType === "style"
                  ? "Styles"
                  : "Colors"}
              </div>
              <div className="text-3xl font-bold">{chartData.length}</div>
              <div className="text-emerald-100 mt-1">
                affected by missing thread specs
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow p-4 text-white">
              <div className="font-bold text-lg mb-1">Most Affected</div>
              <div className="text-3xl font-bold">
                {chartData[0]?.name?.substring(0, 20) || "None"}
              </div>
              <div className="text-amber-100 mt-1">
                with {chartData[0]?.value || 0} missing combinations
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px]">
              <h3 className="text-gray-700 font-semibold mb-3">
                Distribution by{" "}
                {chartType === "factory"
                  ? "Factory"
                  : chartType === "style"
                  ? "Style"
                  : "Color"}
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="60%"
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[400px]">
              <h3 className="text-gray-700 font-semibold mb-3">
                Top 10 Missing Combinations
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={3}
                          textAnchor="end"
                          fill="#666"
                          fontSize={12}
                        >
                          {payload.value.length > 20
                            ? payload.value.substring(0, 20) + "..."
                            : payload.value}
                        </text>
                      );
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Missing Combinations"
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.slice(0, 10).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-gray-700 font-semibold mb-3">
              Missing Thread Combinations
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Style Code
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Style Name
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Factory
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Color
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.StyleCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.StyleName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.OCFactory}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.GMTColorName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 10 && (
                <div className="bg-gray-50 px-4 py-3 text-right text-xs font-medium text-indigo-600">
                  Showing 10 of {data.length} results
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SwrmMissingThreadChart;
