from flask import Flask, request, jsonify, send_file
import pandas as pd
import os
import re

app = Flask(__name__)

# Allow frontend to communicate with the backend
from flask_cors import CORS
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # Process Excel file
        df = pd.read_excel(file_path)

        # Debugging: Check if DataFrame is empty
        if df.empty:
            raise ValueError("The Excel file is empty or not read properly.")

        # Define the column name to sort by (Change this to your actual date column)
        sort_column = "PCD Date"
        po_column = "PO_NO"
        BAL_TO_ISSUE_column = "BAL_TO_ISSUE" 
        Total_Current_Stock = "Total Current Stock" 
    
        def clean_po_no(po_no):
            if pd.isna(po_no):
                return ""  # Handle NaN values

            # Split by commas
            items = po_no.split(',')

            # Remove "CL-" starting values
            items = [item for item in items if not item.startswith("CL-")]

            # Remove prefix characters before '-' and discard empty or whitespace-only strings
            cleaned_items = [re.sub(r'^[A-Z]+-', '', item).strip() for item in items if item.strip()]

            # If only one item remains, return it without comma
            return cleaned_items[0] if len(cleaned_items) == 1 else ",".join(cleaned_items)
        
            # Apply function to clean PO_NO column
        df[po_column] = df[po_column].apply(clean_po_no)

        # Convert column to datetime format, handling errors
        df[sort_column] = pd.to_datetime(df[sort_column], errors='coerce').dt.strftime('%Y-%b-%d')

        # Sort DataFrame by the column (oldest to latest)
        df_sorted = df.sort_values(by=sort_column, ascending=True)

        # Calculate the variance
        df["Variance"] = df["Total Current Stock"] - df["BAL_TO_ISSUE"]
        
        # Filter out rows where Variance is negative
        df_negative_variance = df[df["Variance"]  < 0]
        
        # Sort by PO_NO and Date to get the first date for each PO_NO
        df_negative_variance_sorted = df_negative_variance.sort_values(by=sort_column, ascending=True)
        
        # Then group by PO_NO, Item Code, Item Name, MAT_Color_Code and get the latest (most recent) PCD Date for each group
        latest_values = df_negative_variance_sorted.groupby(["PO_NO", "Item Code", "Item Name", "MAT_Color_Code"])["PCD Date"].first().reset_index()

        # Group by PO_NO, Item Code, Item Name, MAT_Color_Code
        grouped = df_negative_variance.groupby(["PO_NO", "Item Code", "Item Name", "MAT_Color_Code"])

        # Get the sum of variance for each group
        variance_sum = grouped["Variance"].sum().reset_index()
        
        # Merge the sum of variance with the first values of PCD Date, Item Code, etc.
        result = pd.merge(variance_sum, latest_values, on=["PO_NO", "Item Code", "Item Name", "MAT_Color_Code"])
        
        # Select relevant columns: PO_NO, Item Code, Item Name, MAT_Color_Code, Variance, and PCD Date
        result = result[["PO_NO", "Item Code", "Item Name", "MAT_Color_Code", "Variance", "PCD Date"]]

        # Convert to JSON and send response
        return jsonify(result.to_dict(orient="records"))

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/export", methods=["POST"])
def export_data():
    try:
        data = request.json
        df = pd.DataFrame(data)

        output_file = "processed_output.xlsx"
        df.to_excel(output_file, index=False)

        return send_file(output_file, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
