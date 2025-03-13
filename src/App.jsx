import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

export default function App() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState("");

  const { getRootProps, getInputProps } = useDropzone({
    accept: ".xlsx",
    onDrop: async (acceptedFiles) => {
      const formData = new FormData();
      formData.append("file", acceptedFiles[0]);
      setFileName(acceptedFiles[0].name);

      try {
        const response = await axios.post(
          "http://127.0.0.1:5000/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        console.log(response.data);
        console.log(response.data.items);
        if (Array.isArray(response.items)) {
          data.items.map((item) => {
            console.log(item["ASN Qty"]);
          });
        }
        setData(response.data);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    },
  });

  const exportData = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/export", data, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "processed_output.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error exporting file:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 space-y-6">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-blue-500 p-12 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition duration-300 ease-in-out"
      >
        <div className="h-20 w-80 flex justify-center items-center bg-blue-100 border-2 border-blue-500 rounded-xl shadow-md">
          <input {...getInputProps()} />
          <p className="text-blue-500 font-semibold text-center">
            Drag & Drop or Click to Upload an Excel File
          </p>
        </div>
      </div>

      {fileName && (
        <p className="text-lg font-bold text-gray-700">Uploaded: {fileName}</p>
      )}

      {data.length > 0 && (
        <div className="w-full max-w-5xl">
          <div className="overflow-x-auto bg-white rounded-lg shadow-md p-6">
            {data.map((item, index) => (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white shadow-lg rounded-lg">
                <p className="text-lg font-semibold text-gray-800">
                  {item["PO_NO"]}
                </p>
                <p className="text-sm text-gray-600">{item["Item Code"]}</p>
                <p className="text-sm text-gray-600">{item["Item Name"]}</p>
                <p className="text-sm text-gray-600">
                  {item["MAT_Color_Code"]}
                </p>
                <p className="text-sm text-gray-600">{item["Variance"]}</p>
                <p className="text-sm text-gray-600">{item["PCD Date"]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={exportData}
        className="mt-6 px-8 py-3 bg-blue-600 text-blue-400 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
      >
        Export to Excel
      </button>
    </div>
  );
}
