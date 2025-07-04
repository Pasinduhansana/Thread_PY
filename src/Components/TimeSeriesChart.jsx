import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";

const TimeSeriesChart = ({ data, granularity, title }) => {
  // Format the date based on selected granularity
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "o") return "No Date";
    const date = parseISO(dateStr);
    switch (granularity) {
      case "day":
        return format(date, "yyyy-MM-dd");
      case "week":
        return format(date, "'Week' w, yyyy");
      case "month":
      default:
        return format(date, "MMM yyyy");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">{title}</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => formatDate(label)}
              formatter={(value) => [`${value} units`, "Demand"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="demand"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;
