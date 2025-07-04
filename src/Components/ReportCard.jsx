import React from "react";
import { FaFileUpload, FaSync, FaArrowUp } from "react-icons/fa";

import { motion, AnimatePresence } from "framer-motion";

// Report Card Component for modal
export default function ReportCard({
  title,
  description,
  fileName,
  lastUpdated,
  rootProps,
  inputProps,
  handleUpload,
  icon,
  color = "blue",
  isLoading,
}) {
  const colors = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      border: "border-blue-100",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      lastUpdatedBg: "bg-blue-50",
      dropzoneBorder: "border-blue-200 hover:border-blue-300",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      border: "border-green-100",
      buttonBg: "bg-green-600 hover:bg-green-700",
      lastUpdatedBg: "bg-green-50",
      dropzoneBorder: "border-green-200 hover:border-green-300",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      border: "border-purple-100",
      buttonBg: "bg-purple-600 hover:bg-purple-700",
      lastUpdatedBg: "bg-purple-50",
      dropzoneBorder: "border-purple-200 hover:border-purple-300",
    },
  };

  const colorSet = colors[color] || colors.blue;

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-md border  ${colorSet.border}`}
    >
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div
            className={`p-3 rounded-full ${colorSet.iconBg} ${colorSet.iconColor} mr-3`}
          >
            {icon}
          </div>
          <div className="text-left h-[60px]">
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <div
          {...rootProps()}
          className={`border-2 border-dashed py-5 ${colorSet.dropzoneBorder} rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors cursor-pointer`}
        >
          <input {...inputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <FaFileUpload className={`text-xl mb-2 ${colorSet.iconColor}`} />
            <p className="text-xs text-gray-600 font-medium truncate w-full">
              {fileName ? fileName : "Drop or select file"}
            </p>
          </div>
        </div>

        {fileName && (
          <motion.button
            onClick={handleUpload}
            className={`mt-3 w-full ${colorSet.buttonBg} text-white py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors`}
            whileTap={{ scale: 0.97 }}
            disabled={isLoading}
          >
            {isLoading ? <FaSync className="animate-spin" /> : <FaArrowUp />}
            Upload {title}
          </motion.button>
        )}

        {lastUpdated && (
          <div
            className={`mt-3 ${colorSet.lastUpdatedBg} rounded-lg p-2 flex items-center justify-between`}
          >
            <span className="text-xs text-gray-600">Last updated:</span>
            <span className="text-xs font-medium text-gray-800">
              {lastUpdated}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
