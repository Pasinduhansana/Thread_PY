import React, { useState, useContext, useRef, useEffect } from "react";
import { PriorityContext } from "../Data/PriorityOrders";
import {
  FaSearch,
  FaEnvelope,
  FaChevronDown,
  FaChevronRight,
  FaInfoCircle,
  FaBox,
  FaStar,
  FaThLarge,
  FaTable,
  FaTrash,
  FaFilter,
  FaSort,
  FaCaretDown,
} from "react-icons/fa";

const EMAIL_TEMPLATES = {
  urgent: {
    subject: "URGENT: Thread Request for Selected POs",
    greeting:
      "Dear Supplier,\n\nWe urgently need the following thread orders to be processed with highest priority:",
    closing:
      "\nPlease confirm receipt of this email and expected delivery date.\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nProcurement Team",
  },
  regular: {
    subject: "Thread Order Status Update Request",
    greeting:
      "Hello,\n\nKindly provide an update on the status of the following thread orders:",
    closing:
      "\nPlease provide the current status and expected delivery timeline for each item.\n\nRegards,\nProcurement Team",
  },
  followup: {
    subject: "Follow-up: Outstanding Thread Orders",
    greeting:
      "Hello,\n\nWe are following up on these outstanding thread orders that are past their expected delivery dates:",
    closing:
      "\nThese orders are critical for our production schedule. Please advise on when we can expect delivery.\n\nThank you,\nProcurement Team",
  },
  delivery_change: {
    subject: "Delivery Location Change: IGL Thread Orders",
    greeting:
      "Hi Sashini,\n\nWe are required to change the following orders delivery location as below.",
    closing: "\nPlease let us know the confirmation after the location change",
  },
};

const groupDataByPO = (data) => {
  const grouped = {};
  const roundUp = (value, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.ceil(value * factor) / factor;
  };

  data.forEach((row) => {
    const poNo = row["RMPONo"];
    if (!grouped[poNo]) {
      grouped[poNo] = {
        RMPONo: poNo,
        "Article Sub Category": row["Article Sub Category"],
        "Total PO Qty": roundUp(row["PO Qty(Purchase UOM)"]),
        "Total Received Qty": roundUp(row["Received Qty"]),
        "Balance to Receive Qty": roundUp(row["Balance to Receive Qty"]),
        Qty: row["Qty"],
        "Ship to Location": row["Ship to Location"],
        "Earliest PCD": row["Earliest PCD"],
        "Earliest PSD": row["Earliest PSD"],
        articles: [],
      };
    } else {
      grouped[poNo]["Total PO Qty"] = roundUp(
        grouped[poNo]["Total PO Qty"] + row["PO Qty(Purchase UOM)"]
      );
      grouped[poNo]["Total Received Qty"] = roundUp(
        grouped[poNo]["Total Received Qty"] + row["Received Qty"]
      );
      grouped[poNo]["Balance to Receive Qty"] = roundUp(
        grouped[poNo]["Balance to Receive Qty"] + row["Balance to Receive Qty"]
      );
      grouped[poNo]["Qty"] = roundUp(grouped[poNo]["Qty"] + row["Qty"]);
      if (
        row["Earliest PCD"] &&
        (!grouped[poNo]["Earliest PCD"] ||
          new Date(row["Earliest PCD"]) <
            new Date(grouped[poNo]["Earliest PCD"]))
      ) {
        grouped[poNo]["Earliest PCD"] = row["Earliest PCD"];
      }
      if (
        row["Earliest PSD"] &&
        (!grouped[poNo]["Earliest PSD"] ||
          new Date(row["Earliest PSD"]) <
            new Date(grouped[poNo]["Earliest PSD"]))
      ) {
        grouped[poNo]["Earliest PSD"] = row["Earliest PSD"];
      }
    }

    grouped[poNo].articles.push({
      "Article Name": row["Article Name"],
      "Color Name": row["Color Name"],
      "Article Code": row["Article Code"],
      "Color Code": row["Color Code"],
      "PO Qty(Purchase UOM)": roundUp(row["PO Qty(Purchase UOM)"]),
      "Received Qty": roundUp(row["Received Qty"]),
      "Balance to Receive Qty": roundUp(row["Balance to Receive Qty"]),
      "Billing Doc. No": row["Billing Doc. No"],
      Qty: roundUp(row["Qty"]),
      "Earliest PCD": row["Earliest PCD"],
      "Earliest PSD": row["Earliest PSD"],
    });
  });

  return Object.values(grouped);
};

const DataGrid = ({ data, allowSelection = true }) => {
  const [expandedPO, setExpandedPO] = useState(null);
  const groupedData = groupDataByPO(data);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("grid"); // Add state for tab view: 'card' or 'grid'
  const [selectedRows, setSelectedRows] = useState({});
  const { priorityPOs, addToPriority, removeFromPriority } =
    useContext(PriorityContext);
  const isPriority = (poNo) =>
    priorityPOs && priorityPOs.some((po) => po.RMPONo === poNo);
  const [selectAll, setSelectAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("urgent");
  const [customRecipient, setCustomRecipient] = useState("");
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [emailGrouping, setEmailGrouping] = useState("po");
  const [onlyPending, setOnlyPending] = useState(false);
  //console.log("Priority Orders:", priorityPOs);
  //const { priorityPOs, addToPriority, removeFromPriority } =
  //useContext(PriorityContext);
  //const isPriority = (poNo) => priorityPOs.some((po) => po.RMPONo === poNo);

  const handleEmailSelected = () => {
    // If no rows are selected, use filtered data
    const dataToEmail = Object.values(selectedRows).some(Boolean)
      ? filteredDataWithFilters.filter((row) => selectedRows[row.RMPONo])
      : filteredDataWithFilters;

    const template = EMAIL_TEMPLATES[selectedTemplate];
    const subject = template.subject;

    let body = template.greeting + "\n\n";

    // Replace this plain text formatting with HTML tables
    if (emailGrouping === "po") {
      // PO Level - HTML Table
      body += `
        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #696fcf; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">PO No</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Sub Category</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total PO Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Received Qty</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Balance</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Ship to Location</th>
            </tr>
          </thead>
          <tbody>
            ${dataToEmail
              .map(
                (row) => `
              <tr style="background-color: ${
                isPriority(row.RMPONo) ? "#fff8e6" : "#ffffff"
              }">
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${
                  row.RMPONo
                }</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${
                  row["Article Sub Category"]
                }</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                  row["Total PO Qty"]
                }</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                  row["Total Received Qty"]
                }</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                  row["Balance to Receive Qty"]
                }</td>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${
                  row["Ship to Location"]
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    } else {
      // PO + Article + Colour Code Level - Nested HTML Tables
      dataToEmail.forEach((row) => {
        body += `
          <div style="margin-bottom: 30px; font-family: Arial, sans-serif;">
            <table style="width:100%; border-collapse: collapse; margin-bottom: 10px; background-color: #f0f2ff;">
              <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #696fcf; color: white; width: 20%;">PO No:</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd; font-weight: bold;">${row.RMPONo}</td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #696fcf; color: white;">Sub Category:</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${row["Article Sub Category"]}</td>
              </tr>
              <tr>
                <th style="padding: 8px; text-align: left; border: 1px solid #ddd; background-color: #696fcf; color: white;">Ship to Location:</th>
                <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${row["Ship to Location"]}</td>
              </tr>
            </table>
        `;

        if (row.articles && row.articles.length) {
          body += `
            <h4 style="margin: 12px 0 8px 0; color: #696fcf;">Article Details</h4>
            <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #e0dbff;">
                  <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Article Code</th>
                  <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Article Name</th>
                  <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Color</th>
                  <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Ordered</th>
                  <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Received</th>
                  <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Balance</th>
                  ${
                    row.articles.some((a) => a["Billing Doc. No"])
                      ? '<th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Invoice</th>'
                      : ""
                  }
                </tr>
              </thead>
              <tbody>
                ${row.articles
                  .map(
                    (article, idx) => `
                  <tr style="background-color: ${
                    idx % 2 === 0 ? "#ffffff" : "#f9f9ff"
                  };">
                    <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      article["Article Code"]
                    }</td>
                    <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      article["Article Name"]
                    }</td>
                    <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      article["Color Name"]
                    } (${article["Color Code"]})</td>
                    <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                      article["PO Qty(Purchase UOM)"]
                    }</td>
                    <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                      article["Received Qty"]
                    }</td>
                    <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                      article["Balance to Receive Qty"]
                    }</td>
                    ${
                      article["Billing Doc. No"]
                        ? `<td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${article["Billing Doc. No"]} (${article["Qty"]})</td>`
                        : ""
                    }
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `;
        }

        body += `</div><hr style="border: 0; height: 1px; background-color: #ddd; margin: 20px 0;">`;
      });
    }

    body += template.closing;

    // Use the custom recipient if provided, otherwise use default
    const to = customRecipient || "sashini@coats.com";
    const cc = "sahansu@inqube.com";
    const mailtoLink = `mailto:${to}?cc=${cc}&subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}&html=true`;
    window.location.href = mailtoLink;
    setShowEmailModal(false);
  };

  const handleSendMail = () => {
    setShowEmailModal(true);
  };

  const filterRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setActiveFilter(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle filter dropdown
  const toggleFilter = (column) => {
    setActiveFilter(activeFilter === column ? null : column);
  };

  // Apply filter
  const applyFilter = (column, value) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setActiveFilter(null);
  };

  // Clear filter
  const clearFilter = (column) => {
    const newFilters = { ...filters };
    delete newFilters[column];
    setFilters(newFilters);
    setActiveFilter(null);
  };

  const filteredData = showOnlyPriority
    ? groupedData.filter((row) =>
        priorityPOs.some((po) => po.RMPONo === row.RMPONo)
      )
    : groupedData.filter((row) => {
        return (
          row.RMPONo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (row["Invoice No"] &&
            row["Invoice No"].some((invoice) =>
              String(invoice).toLowerCase().includes(searchTerm.toLowerCase())
            ))
        );
      });

  // Filter data based on all active filters
  const filteredDataWithFilters = filteredData.filter((row) => {
    return Object.entries(filters).every(([column, value]) => {
      // Skip empty filters
      if (!value) return true;

      const cellValue = String(row[column] || "").toLowerCase();
      return cellValue.includes(value.toLowerCase());
    });
  });

  // Define columns that can be filtered
  const filterableColumns = [
    { key: "RMPONo", label: "PO No" },
    { key: "Article Sub Category", label: "Sub Category" },
    { key: "Ship to Location", label: "Ship to Location" },
    // Add more columns as needed
  ];

  //Select All functions
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);

    // Create an object with all rows selected/deselected
    const newSelectedRows = {};
    groupedData.forEach((row) => {
      newSelectedRows[row.RMPONo] = isChecked;
    });

    setSelectedRows(newSelectedRows);
  };

  // Handle row selection
  const handleSelectRow = (e, poNo) => {
    e.stopPropagation(); // Prevent row expansion when clicking checkbox
    setSelectedRows((prev) => ({
      ...prev,
      [poNo]: !prev[poNo],
    }));
  };

  // Add selected POs to priority
  const handleAddToPriority = () => {
    const selectedPOs = groupedData.filter((row) => selectedRows[row.RMPONo]);
    if (selectedPOs.length > 0) {
      addToPriority(selectedPOs);
      //console.log("Selected POs:", selectedPOs);
      // Clear selections after adding
      setSelectedRows({});
    }
  };
  // Remove selected POs from priority
  const handleRemoveFromPriority = () => {
    const selectedPOs = groupedData.filter((row) => selectedRows[row.RMPONo]);
    if (selectedPOs.length > 0) {
      removeFromPriority(selectedPOs);

      // Clear selections after removing
      setSelectedRows({});
    }
  };

  const toggleRow = (poNo) => {
    setExpandedPO(expandedPO === poNo ? null : poNo);
  };

  // Returns true if ALL selected rows are already prioritized
  const allSelectedArePriority = () => {
    const selectedPOs = groupedData.filter((row) => selectedRows[row.RMPONo]);
    return (
      selectedPOs.length > 0 &&
      selectedPOs.every((row) => isPriority(row.RMPONo))
    );
  };

  // Function to get completion percentage
  const getCompletionPercentage = (received, total) => {
    return total > 0 ? Math.round((received / total) * 100) : 0;
  };

  // Helper function to group articles by Article+Color combination
  const groupArticlesByColor = (articles) => {
    const grouped = {};

    articles.forEach((article) => {
      const key = `${article["Article Code"]}-${article["Color Code"]}`;

      if (!grouped[key]) {
        grouped[key] = {
          "Article Code": article["Article Code"],
          "Article Name": article["Article Name"],
          "Color Code": article["Color Code"],
          "Color Name": article["Color Name"],
          "PO Qty(Purchase UOM)": article["PO Qty(Purchase UOM)"],
          "Received Qty": article["Received Qty"],
          "Balance to Receive Qty": article["Balance to Receive Qty"],
          "Earliest PCD": article["Earliest PCD"],
          "Earliest PSD": article["Earliest PSD"],
          invoices: [],
        };
      }

      if (article["Billing Doc. No"]) {
        grouped[key].invoices.push({
          "Billing Doc. No": article["Billing Doc. No"],
          Qty: article["Qty"],
        });
      }
    });

    return Object.values(grouped);
  };

  return (
    <div className="p-5 min-h-screen w-full">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-5">
        <div className="relative w-full sm:w-2/3 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-[#696fcf] text-xs" />
          </div>
          <input
            type="text"
            placeholder="Search by PO No or Invoice No"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 py-2 pr-3 w-full bg-white border border-[#bbadff] rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#9c8af2] focus:border-transparent transition-all text-gray-700 text-xs"
          />
        </div>

        <div className="flex gap-2">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={showOnlyPriority}
              onChange={() => setShowOnlyPriority((prev) => !prev)}
              className="form-checkbox h-4 w-4 text-amber-500"
            />
            <span className="text-sm text-gray-700">
              Show only priority orders
            </span>
          </label>

          {allowSelection &&
            Object.values(selectedRows).some(Boolean) &&
            (allSelectedArePriority() ? (
              <button
                onClick={handleRemoveFromPriority}
                className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 w-full sm:w-auto justify-center text-xs"
              >
                <FaTrash className="text-xs" />
                <span>Remove from Priority</span>
              </button>
            ) : (
              <button
                onClick={handleAddToPriority}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 w-full sm:w-auto justify-center text-xs"
              >
                <FaStar className="text-xs" />
                <span>Add to Priority</span>
              </button>
            ))}
          <button
            onClick={handleSendMail}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#9fa0ff] to-[#505bf9] text-white py-2 px-4 rounded-lg hover:from-[#8183f9] hover:to-[#696fcf] transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 w-full sm:w-auto justify-center text-xs"
          >
            <FaEnvelope className="text-xs" />
            <span>Send Mail</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl shadow-md border border-[#e4d7ff] bg-white w-full ">
        <div className="max-h-[80vh] overflow-auto">
          {filteredData.length > 0 ? (
            <table className="w-full text-xs ">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#9fa0ff] to-[#696fcf] text-white font-medium">
                  {allowSelection && (
                    <th className="py-2.5 px-3 text-center w-10">
                      {/* Add select all checkbox */}
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-[#e0c3fc] bg-[#e0c3fc] accent-[#e0c3fc] "
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}

                  {/* Filter headers */}
                  {filterableColumns.map((column) => (
                    <th key={column.key} className="py-2.5 px-3 text-left">
                      <div className="flex items-center justify-between">
                        <span>{column.label}</span>
                        <div className="relative">
                          <button
                            onClick={() => toggleFilter(column.key)}
                            className={`ml-1 text-xs p-1 rounded ${
                              filters[column.key]
                                ? "bg-white bg-opacity-20"
                                : "hover:bg-white hover:bg-opacity-10"
                            }`}
                          >
                            <FaFilter size={10} />
                            {filters[column.key] && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                            )}
                          </button>

                          {activeFilter === column.key && (
                            <div
                              ref={filterRef}
                              className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg z-50 overflow-hidden"
                            >
                              <div className="p-2 border-b">
                                <p className="text-gray-700 font-medium text-xs">
                                  Filter {column.label}
                                </p>
                              </div>
                              <div className="p-2">
                                <div className="relative mb-2">
                                  <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full p-1.5 pl-7 text-xs border rounded"
                                    value={filters[column.key] || ""}
                                    onChange={(e) =>
                                      applyFilter(column.key, e.target.value)
                                    }
                                  />
                                  <FaSearch
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={12}
                                  />
                                </div>

                                <div className="flex justify-between mt-2">
                                  <button
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                    onClick={() => clearFilter(column.key)}
                                  >
                                    Clear
                                  </button>
                                  <button
                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                    onClick={() => setActiveFilter(null)}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}

                  <th className="py-2.5 px-3 text-left">Total PO Qty</th>
                  <th className="py-2.5 px-3 text-left">Total Received</th>
                  <th className="py-2.5 px-3 text-left">Balance</th>
                  <th className="py-2.5 px-3 text-left">Invoice Qty</th>
                  <th className="py-2.5 px-3 text-left">Earliest PCD</th>
                  <th className="py-2.5 px-3 text-left">Earliest PSD</th>
                  <th className="py-2.5 px-3 text-left">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredDataWithFilters.map((row, index) => (
                  <React.Fragment key={index}>
                    {/* Main Row */}
                    <tr
                      onClick={() => toggleRow(row.RMPONo)}
                      className={`
                      cursor-pointer  text-gray-700 border-b border-gray-100
                      ${
                        expandedPO === row.RMPONo
                          ? "bg-[#e0dbff] shadow-inner"
                          : "bg-white hover:bg-[#e0dbff]"
                      }
                      ${isPriority(row.RMPONo) ? "bg-amber-50" : ""}
                      transition-all duration-200
                    `}
                    >
                      {allowSelection && (
                        <td
                          className="py-2.5 px-3 w-10 text-center "
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-[#e0c3fc] bg-[#e0c3fc] accent-[#e0c3fc] transition duration-150 ease-in-out"
                            checked={!!selectedRows[row.RMPONo]}
                            onChange={(e) => handleSelectRow(e, row.RMPONo)}
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3 font-medium flex items-center gap-1.5">
                        <div
                          className={`transition-transform duration-200 ${
                            expandedPO === row.RMPONo ? "rotate-90" : ""
                          }`}
                        >
                          <FaChevronRight
                            className={`text-xs ${
                              expandedPO === row.RMPONo
                                ? "text-[#8e94f2]"
                                : "text-[#8e94f2]"
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {isPriority(row.RMPONo) && (
                            <FaStar className="text-amber-500 text-xs" />
                          )}
                          {row.RMPONo}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {row["Article Sub Category"]}
                      </td>

                      <td className="py-2.5 px-3">{row["Ship to Location"]}</td>

                      <td className="py-2.5 px-3">{row["Total PO Qty"]}</td>
                      <td className="py-2.5 px-3">
                        {row["Total Received Qty"]}
                      </td>
                      <td className="py-2.5 px-3">
                        {row["Balance to Receive Qty"]}
                      </td>

                      <td className="py-2.5 px-3">{row["Qty"]}</td>

                      <td className="py-2.5 px-3">
                        {row["Earliest PCD"] &&
                        !isNaN(new Date(row["Earliest PCD"]))
                          ? new Date(row["Earliest PCD"]).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3">
                        {row["Earliest PSD"] &&
                        !isNaN(new Date(row["Earliest PSD"]))
                          ? new Date(row["Earliest PSD"]).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center  justify-end gap-2">
                          <div className="relative w-[40px] h-4 bg-gray-200 rounded-full text-center">
                            <div
                              className="absolute w-full h-full bg-gradient-to-r from-[#64ed9d] to-[#1df18e] z-20  rounded-full"
                              style={{
                                width: `${getCompletionPercentage(
                                  row["Qty"],
                                  row["Total PO Qty"]
                                )}%`,
                              }}
                            ></div>
                            <span className="relative text-[11px] font-semibold z-50  text-gray-800">
                              {getCompletionPercentage(
                                row["Qty"],
                                row["Total PO Qty"]
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details with Tabs */}
                    {expandedPO === row.RMPONo && (
                      <tr className="bg-white w-full">
                        <td colSpan="10" className="p-0">
                          <div className="animate-slideIn py-3 px-4 border-l-2 border-[#8e94f2] bg-gradient-to-r from-blue-50 to-transparent">
                            <div className="mb-3 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <FaBox className="text-[#656bc4]" />
                                <h3 className="text-[#656bc4] font-medium text-xs">
                                  Article Details
                                </h3>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="text-[10px] text-white bg-[#7c85ee] px-2 py-0.5 rounded-full">
                                  {row.articles.length}{" "}
                                  {row.articles.length === 1 ? "Item" : "Items"}
                                </div>
                              </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="flex border-b border-gray-200 mb-3">
                              <button
                                onClick={() => setActiveTab("card")}
                                className={`flex items-center gap-1 py-1.5 px-3 text-[10px] font-medium transition-colors ${
                                  activeTab === "card"
                                    ? "text-[#656bc4] border-b-2 border-[#656bc4]"
                                    : "text-gray-600 hover:text-[#656bc4]"
                                }`}
                              >
                                <FaThLarge className="text-[10px]" />
                                Card View
                              </button>
                              <button
                                onClick={() => setActiveTab("grid")}
                                className={`flex items-center gap-1 py-1.5 px-3 text-[10px] font-medium transition-colors ${
                                  activeTab === "grid"
                                    ? "text-[#656bc4] border-b-2 border-[#656bc4]"
                                    : "text-gray-600 hover:text-[#656bc4]"
                                }`}
                              >
                                <FaTable className="text-[10px]" />
                                Grid View
                              </button>
                            </div>

                            {/* Progress bar showing overall completion */}
                            <div className="mb-3 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-[#e7c6ff] h-1.5 rounded-full"
                                style={{
                                  width: `${getCompletionPercentage(
                                    row["Total Received Qty"],
                                    row["Total PO Qty"]
                                  )}%`,
                                }}
                              ></div>
                            </div>

                            {/* Card View */}
                            {activeTab === "card" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                                {row.articles.map((article, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white rounded-lg border border-[#bcc0ff] shadow-sm hover:shadow-md transition-all p-2.5 flex flex-col"
                                  >
                                    <div className="flex justify-between mb-1.5">
                                      <span className="text-[10px] text-[#656bc4] font-semibold">
                                        #{article["Article Code"]}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-[#e4d7ff] text-[#656bc4] rounded-md">
                                        {getCompletionPercentage(
                                          article["Received Qty"],
                                          article["PO Qty(Purchase UOM)"]
                                        )}
                                        % Complete
                                      </span>
                                    </div>

                                    <h4
                                      className="text-xs font-medium text-gray-800 mb-1 truncate"
                                      title={article["Article Name"]}
                                    >
                                      {article["Article Name"]}
                                    </h4>

                                    <div className="flex items-center mb-1.5 gap-1">
                                      <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></div>
                                      <span className="text-[10px] text-gray-600">
                                        {article["Color Name"]} (
                                        {article["Color Code"]})
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-700">
                                      <div className="flex flex-col">
                                        <span className="text-gray-500">
                                          PO Qty
                                        </span>
                                        <span className="font-medium">
                                          {article["PO Qty(Purchase UOM)"]}
                                        </span>
                                      </div>

                                      <div className="flex flex-col">
                                        <span className="text-gray-500">
                                          Received
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            article["Received Qty"] > 0
                                              ? "text-[#06d6a0]"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {article["Received Qty"]}
                                        </span>
                                      </div>

                                      <div className="flex flex-col">
                                        <span className="text-gray-500">
                                          Balance
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            article["Balance to Receive Qty"] >
                                            0
                                              ? "text-amber-600"
                                              : "text-[#06d6a0]"
                                          }`}
                                        >
                                          {article["Balance to Receive Qty"]}
                                        </span>
                                      </div>
                                    </div>

                                    {article["Billing Doc. No"] && (
                                      <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-gray-500">
                                            Invoice:
                                          </span>
                                          <span className="font-medium text-gray-700">
                                            {article["Billing Doc. No"]}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                          <span className="text-gray-500">
                                            Invoice Qty:
                                          </span>
                                          <span className="font-medium text-gray-700">
                                            {article["Qty"]}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Grid View - Articles grouped by Article+Color */}
                            {activeTab === "grid" && (
                              <div className="overflow-x-auto rounded-lg border border-[#e4d7ff]">
                                <table className="w-full text-[10px] ">
                                  <thead>
                                    <tr className="bg-blue-50 text-[#656bc4] font-medium">
                                      <th className="p-2 text-left border-b border-[#e4d7ff]">
                                        Article Code
                                      </th>
                                      <th className="p-2 text-left border-b border-[#e4d7ff]">
                                        Article Name
                                      </th>
                                      <th className="p-2 text-left border-b border-[#e4d7ff]">
                                        Color
                                      </th>
                                      <th className="p-2 text-center border-b border-[#e4d7ff]">
                                        PO Qty
                                      </th>
                                      <th className="p-2 text-center border-b border-[#e4d7ff]">
                                        Received Qty
                                      </th>
                                      <th className="p-2 text-center border-b border-[#e4d7ff]">
                                        Balance Qty
                                      </th>
                                      <th className="p-2 text-left border-b border-[#e4d7ff]">
                                        Invoices
                                      </th>
                                      <th className="p-2 text-center border-b border-[#e4d7ff]">
                                        Invoices Qty
                                      </th>
                                      <th className="p-2 text-left border-b border-[#e4d7ff]">
                                        Earliest PCD
                                      </th>
                                      <th className="p-2 text-left border-b border-[#e4d7ff]">
                                        Earliest PSD
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupArticlesByColor(row.articles).map(
                                      (article, idx) => (
                                        <tr
                                          key={idx}
                                          className="hover:bg-blue-50 transition-colors text-gray-700"
                                        >
                                          <td className="p-2 border-b text-left border-[#e4d7ff] font-medium">
                                            {article["Article Code"]}
                                          </td>
                                          <td className="p-2 border-b text-left border-[#e4d7ff]">
                                            {article["Article Name"]}
                                          </td>
                                          <td className="p-2 border-b text-left border-[#e4d7ff]">
                                            <div className="flex items-center gap-1">
                                              <div className="w-2 h-2 rounded-full bg-gray-200 border border-gray-300"></div>
                                              <span>
                                                {article["Color Name"]} (
                                                {article["Color Code"]})
                                              </span>
                                            </div>
                                          </td>
                                          <td className="p-2 border-b text-center border-[#e4d7ff]">
                                            {article["PO Qty(Purchase UOM)"]}
                                          </td>
                                          <td className="p-2 border-b text-center border-[#e4d7ff]">
                                            <span
                                              className={
                                                article["Received Qty"] > 0
                                                  ? "text-[#06d6a0] font-medium"
                                                  : ""
                                              }
                                            >
                                              {article["Received Qty"]}
                                            </span>
                                          </td>
                                          <td className="p-2 border-b text-center border-[#e4d7ff]">
                                            <span
                                              className={
                                                article[
                                                  "Balance to Receive Qty"
                                                ] > 0
                                                  ? "text-amber-600 font-medium"
                                                  : "text-[#06d6a0] font-medium"
                                              }
                                            >
                                              {
                                                article[
                                                  "Balance to Receive Qty"
                                                ]
                                              }
                                            </span>
                                          </td>
                                          <td className="p-2 border-b border-[#e4d7ff]">
                                            {article.invoices.length > 0 ? (
                                              <div className="flex flex-col gap-1">
                                                {article.invoices.map(
                                                  (invoice, i) => (
                                                    <div
                                                      key={i}
                                                      className="flex items-center justify-between"
                                                    >
                                                      <span className="text-gray-600 ">
                                                        {
                                                          invoice[
                                                            "Billing Doc. No"
                                                          ]
                                                        }
                                                      </span>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-gray-400">
                                                No invoices
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2 border-b text-center border-[#e4d7ff]">
                                            {article.invoices.map(
                                              (invoice, i) => (
                                                <div
                                                  key={i}
                                                  className="flex items-center  text-center justify-between"
                                                >
                                                  <span className="font-medium ml-2 w-full text-center">
                                                    ({invoice["Qty"]})
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            {article["Earliest PCD"] &&
                                            !isNaN(
                                              new Date(article["Earliest PCD"])
                                            )
                                              ? new Date(
                                                  article["Earliest PCD"]
                                                ).toLocaleDateString()
                                              : "-"}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            {article["Earliest PSD"] &&
                                            !isNaN(
                                              new Date(article["Earliest PSD"])
                                            )
                                              ? new Date(
                                                  article["Earliest PSD"]
                                                ).toLocaleDateString()
                                              : "-"}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="text-blue-300 text-4xl mb-3">
                <FaSearch />
              </div>
              <h3 className="text-sm text-gray-700 mb-1">No Results Found</h3>
              <p className="text-xs text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
      @keyframes slideIn {
        from { opacity: 0; max-height: 0; }
        to { opacity: 1; max-height: 2000px; }
      }
      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
        overflow: hidden;
      }
    `}</style>

      {/* Email Template Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="border-b px-4 py-2 border-gray-300">
              <h3 className="text-lg font-medium text-gray-800">Send Email</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-left text-gray-700 mb-1">
                  Email Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border ring-0 outline-none focus:ring-0 border-gray-300 rounded-md  py-2 px-3 text-sm"
                >
                  <option value="urgent">Urgent Request</option>
                  <option value="delivery_change">
                    Delivery Change Request
                  </option>
                  <option value="regular">Regular Status Update</option>
                  <option value="followup">Follow-up on Late Orders</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-left text-gray-700 mb-1">
                  Order Grouping Level
                </label>
                <select
                  value={emailGrouping}
                  onChange={(e) => setEmailGrouping(e.target.value)}
                  className="w-full border ring-0 outline-none focus:ring-0 border-gray-300 rounded-md py-2 px-3 text-sm mb-2"
                >
                  <option value="po">PO Level</option>
                  <option value="po-article-color">
                    PO + Article + Colour Code
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-left text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  placeholder="Enter recipient email address"
                  className="w-full border border-gray-300 rounded-md  py-2 px-3 text-sm"
                />
              </div>

              <div className="bg-blue-50 border text-left border-[#e4d7ff] rounded-md p-3 text-xs text-[#424cd7]">
                <p className="font-medium mb-1">Email will include:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    {Object.values(selectedRows).filter(Boolean).length > 0
                      ? `${
                          Object.values(selectedRows).filter(Boolean).length
                        } selected POs`
                      : "All filtered POs"}
                  </li>
                  <li>Full article details for each PO</li>
                  <li>Current quantities and status</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block ml-6 text-sm font-medium text-left text-gray-700 mb-1">
                Include Order Lines
              </label>
              <div className="flex gap-4 mb-2  ml-6 mt-2">
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="pendingFilter"
                    checked={!onlyPending}
                    onChange={() => setOnlyPending(false)}
                    className="mr-2"
                  />
                  All
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    name="pendingFilter"
                    checked={onlyPending}
                    onChange={() => setOnlyPending(true)}
                    className="mr-2"
                  />
                  Only Pending
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-2 flex justify-end gap-2 rounded-b-lg">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-sm w-[90px] text-gray-700 border-1 border-gray-300 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSelected}
                className="px-4 py-2 text-sm bg-[#424cd7] text-white rounded-md hover:bg-[#424cd7]"
              >
                Send Email
              </button>
            </div>
            <div className="border-t border-gray-300 mt-2 pt-2">
              <p className="text-sm text-gray-600 mb-2">
                Trouble opening your email client?
              </p>
              <div className="flex flex-wrap gap-2 w-full justify-center items-center mb-4">
                <button
                  onClick={() => {
                    const template = EMAIL_TEMPLATES[selectedTemplate];
                    const subject = template.subject;

                    const dataToEmail = Object.values(selectedRows).some(
                      Boolean
                    )
                      ? filteredDataWithFilters.filter(
                          (row) => selectedRows[row.RMPONo]
                        )
                      : filteredDataWithFilters;

                    let body = template.greeting + "\n\n";

                    if (emailGrouping === "po") {
                      // PO Level
                      dataToEmail.forEach((row) => {
                        body += `PO No: ${row.RMPONo}\n`;
                        body += `Sub Category: ${row["Article Sub Category"]}\n`;
                        body += `Total PO Qty: ${row["Total PO Qty"]}\n`;
                        body += `Total Received Qty: ${row["Total Received Qty"]}\n`;
                        body += `Balance to Receive Qty: ${row["Balance to Receive Qty"]}\n`;
                        body += `Ship to Location: ${row["Ship to Location"]}\n\n`;
                        body += "------------------------\n\n";
                      });
                    } else {
                      // PO + Article + Colour Code Level
                      dataToEmail.forEach((row) => {
                        body += `PO No: ${row.RMPONo}\n`;
                        body += `Sub Category: ${row["Article Sub Category"]}\n`;
                        body += `Ship to Location: ${row["Ship to Location"]}\n`;
                        if (row.articles && row.articles.length) {
                          body += "Article Details:\n";
                          row.articles.forEach((article, idx) => {
                            body += `${idx + 1}. Code: ${
                              article["Article Code"]
                            }, Name: ${article["Article Name"]}\n`;
                            body += `   Color: ${article["Color Name"]} (${article["Color Code"]})\n`;
                            body += `   Ordered: ${article["PO Qty(Purchase UOM)"]}, Received: ${article["Received Qty"]}\n`;
                            if (article["Billing Doc. No"]) {
                              body += `   Invoice: ${article["Billing Doc. No"]}, Qty: ${article["Qty"]}\n`;
                            }
                            body += "\n";
                          });
                        }
                        body += "------------------------\n\n";
                      });
                    }

                    body += template.closing;

                    const gmailUrl = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${customRecipient}&su=${encodeURIComponent(
                      subject
                    )}&body=${encodeURIComponent(body)}`;
                    window.open(gmailUrl, "_blank");
                    setShowEmailModal(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Open in Gmail
                </button>

                <button
                  onClick={() => {
                    const template = EMAIL_TEMPLATES[selectedTemplate];
                    const subject = template.subject;

                    const dataToEmail = Object.values(selectedRows).some(
                      Boolean
                    )
                      ? filteredDataWithFilters.filter(
                          (row) => selectedRows[row.RMPONo]
                        )
                      : filteredDataWithFilters;

                    let body = template.greeting + "\n\n";

                    if (emailGrouping === "po") {
                      // PO Level
                      dataToEmail.forEach((row) => {
                        body += `PO No: ${row.RMPONo}\n`;
                        body += `Sub Category: ${row["Article Sub Category"]}\n`;
                        body += `Total PO Qty: ${row["Total PO Qty"]}\n`;
                        body += `Total Received Qty: ${row["Total Received Qty"]}\n`;
                        body += `Balance to Receive Qty: ${row["Balance to Receive Qty"]}\n`;
                        body += `Ship to Location: ${row["Ship to Location"]}\n\n`;
                        body += "------------------------\n\n";
                      });
                    } else {
                      // PO + Article + Colour Code Level
                      dataToEmail.forEach((row) => {
                        body += `PO No: ${row.RMPONo}\n`;
                        body += `Sub Category: ${row["Article Sub Category"]}\n`;
                        body += `Ship to Location: ${row["Ship to Location"]}\n`;
                        if (row.articles && row.articles.length) {
                          body += "Article Details:\n";
                          row.articles.forEach((article, idx) => {
                            body += `${idx + 1}. Code: ${
                              article["Article Code"]
                            }, Name: ${article["Article Name"]}\n`;
                            body += `   Color: ${article["Color Name"]} (${article["Color Code"]})\n`;
                            body += `   Ordered: ${article["PO Qty(Purchase UOM)"]}, Received: ${article["Received Qty"]}\n`;
                            if (article["Billing Doc. No"]) {
                              body += `   Invoice: ${article["Billing Doc. No"]}, Qty: ${article["Qty"]}\n`;
                            }
                            body += "\n";
                          });
                        }
                        body += "------------------------\n\n";
                      });
                    }

                    body += template.closing;

                    const outlookWebUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${customRecipient}&subject=${encodeURIComponent(
                      subject
                    )}&body=${encodeURIComponent(body)}`;
                    window.open(outlookWebUrl, "_blank");
                    setShowEmailModal(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-[#424cd7] text-white rounded-md hover:bg-[#4a55f3]"
                >
                  Open in Outlook Web
                </button>

                <button
                  onClick={() => {
                    const template = EMAIL_TEMPLATES[selectedTemplate];
                    const subject = template.subject;

                    // Get data to email
                    const dataToEmail = Object.values(selectedRows).some(
                      Boolean
                    )
                      ? filteredDataWithFilters.filter(
                          (row) => selectedRows[row.RMPONo]
                        )
                      : filteredDataWithFilters;

                    // Generate HTML content (same as in the main email function)
                    let body = template.greeting + "<br><br>";

                    if (emailGrouping === "po") {
                      // PO Level - HTML Table
                      body += `
                      <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif;font-size: 12px;">
                        <thead>
                          <tr style="background-color: #696fcf; color: white;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">PO No</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Sub Category</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total PO Qty</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Received Qty</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Balance</th>
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Ship to Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${dataToEmail
                            .map(
                              (row) => `
                            <tr style="background-color: ${
                              isPriority(row.RMPONo) ? "#fff8e6" : "#ffffff"
                            }">
                              <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${
                                row.RMPONo
                              }</td>
                              <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${
                                row["Article Sub Category"]
                              }</td>
                              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                row["Total PO Qty"]
                              }</td>
                              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                row["Total Received Qty"]
                              }</td>
                              <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">${
                                row["Balance to Receive Qty"]
                              }</td>
                              <td style="padding: 8px; text-align: left; border: 1px solid #ddd;">${
                                row["Ship to Location"]
                              }</td>
                            </tr>
                          `
                            )
                            .join("")}
                        </tbody>
                      </table>
                    `;
                    } else {
                      // PO + Article + Colour Code Level - Nested HTML Tables
                      // Flatten all articles from all POs
                      let allArticles = [];
                      dataToEmail.forEach((row) => {
                        if (row.articles && row.articles.length) {
                          row.articles.forEach((article) => {
                            // Only include if not onlyPending, or if onlyPending and balance > 0
                            if (
                              !onlyPending ||
                              article["Balance to Receive Qty"] > 0
                            ) {
                              allArticles.push({
                                poNo: row.RMPONo,
                                shipTo: row["Ship to Location"],
                                articleCode: article["Article Code"],
                                articleName: article["Article Name"],
                                color: `${article["Color Name"]} (${article["Color Code"]})`,
                                ordered: article["PO Qty(Purchase UOM)"],
                                received: article["Received Qty"],
                                balance: article["Balance to Receive Qty"],
                                invoice: article["Billing Doc. No"]
                                  ? `${article["Billing Doc. No"]} (${article["Qty"]})`
                                  : "",
                              });
                            }
                          });
                        }
                      });

                      body += `
                        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 12px;">
                          <thead>
                            <tr style="background-color: #e0dbff;">
                              <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">PO No</th>
                              <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Ship to Location</th>
                              <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Article Code</th>
                              <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Article Name</th>
                              <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Color</th>
                              <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Ordered</th>
                              <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Received</th>
                              <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Balance</th>
                              <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Invoice</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${allArticles
                              .map(
                                (a, idx) => `
                              <tr style="background-color: ${
                                idx % 2 === 0 ? "#ffffff" : "#f9f9ff"
                              };">
                                <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                                  a.poNo
                                }</td>
                                <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                                  a.shipTo
                                }</td>
                                <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                                  a.articleCode
                                }</td>
                                <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                                  a.articleName
                                }</td>
                                <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                                  a.color
                                }</td>
                                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                                  a.ordered
                                }</td>
                                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                                  a.received
                                }</td>
                                <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                                  a.balance
                                }</td>
                                <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                                  a.invoice
                                }</td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>
                      `;

                      // dataToEmail.forEach((row) => {
                      //   body += `
                      //   <div style="margin-bottom: 30px; font-family: Arial, sans-serif; font-size: 12px;">
                      // `;

                      //   if (row.articles && row.articles.length) {
                      //     body += `
                      //     <h1 style="margin: 12px 0 8px 0; color: #696fcf;">Order Details</h4>
                      //     <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
                      //       <thead>
                      //         <tr style="background-color: #e0dbff;">
                      //           <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">PO No</th>
                      //           <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Ship to Location</th>
                      //           <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Article Code</th>
                      //           <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Article Name</th>
                      //           <th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Color</th>
                      //           <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Ordered</th>
                      //           <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Received</th>
                      //           <th style="padding: 6px; text-align: right; border: 1px solid #ddd;">Balance</th>
                      //           ${
                      //             row.articles.some((a) => a["Billing Doc. No"])
                      //               ? '<th style="padding: 6px; text-align: left; border: 1px solid #ddd;">Invoice</th>'
                      //               : ""
                      //           }
                      //         </tr>
                      //       </thead>
                      //       <tbody>
                      //         ${row.articles
                      //           .map(
                      //             (article, idx) => `
                      //           <tr style="background-color: ${
                      //             idx % 2 === 0 ? "#ffffff" : "#f9f9ff"
                      //           };">

                      //             <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      //               row.RMPONo
                      //             }</td>
                      //              <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      //                row["Ship to Location"]
                      //              }</td>
                      //             <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      //               article["Article Code"]
                      //             }</td>
                      //             <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      //               article["Article Name"]
                      //             }</td>
                      //             <td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${
                      //               article["Color Name"]
                      //             } (${article["Color Code"]})</td>
                      //             <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                      //               article["PO Qty(Purchase UOM)"]
                      //             }</td>
                      //             <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                      //               article["Received Qty"]
                      //             }</td>
                      //             <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${
                      //               article["Balance to Receive Qty"]
                      //             }</td>
                      //             ${
                      //               article["Billing Doc. No"]
                      //                 ? `<td style="padding: 6px; text-align: left; border: 1px solid #ddd;">${article["Billing Doc. No"]} (${article["Qty"]})</td>`
                      //                 : ""
                      //             }
                      //           </tr>
                      //         `
                      //           )
                      //           .join("")}
                      //       </tbody>
                      //     </table>
                      //   `;
                      //   }

                      //   body += `</div><hr style="border: 0; height: 1px; background-color: #ddd; margin: 20px 0; font-size: 12px;">`;
                      // });
                    }

                    body += template.closing;

                    // Create formatted email content for clipboard
                    const emailDetails = `
                    <div style="font-family: Arial, sans-serif;">
                      <p><strong>To:</strong> ${
                        customRecipient || "sashini@coats.com"
                      }</p>
                      <p><strong>CC:</strong> sahansu@inqube.com</p>
                      <p><strong>Subject:</strong> ${subject}</p>
                      <hr>
                      <div>
                        ${body}
                      </div>
                    </div>
                  `;

                    // Create a temporary textarea element to copy HTML content
                    const tempElement = document.createElement("div");
                    tempElement.innerHTML = emailDetails;
                    document.body.appendChild(tempElement);

                    // Copy to clipboard
                    const range = document.createRange();
                    range.selectNode(tempElement);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    document.execCommand("copy");
                    window.getSelection().removeAllRanges();
                    document.body.removeChild(tempElement);

                    alert(
                      "Email details copied to clipboard! Paste in an HTML-compatible editor to see formatting."
                    );
                    setShowEmailModal(false);
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
