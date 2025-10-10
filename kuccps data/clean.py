import pandas as pd
import os

# --- 1. Load Excel file (relative path) ---
file_path = os.path.join("kuccps data", "DEGREE_UNI_CLUSTER EDUPATH.xlsx")
df = pd.read_excel(file_path)

# --- 2. Clean up column names ---
df.columns = df.columns.str.strip()

# --- 3. Output file path (same folder) ---
output_path = os.path.join("kuccps data", "Programmes_By_Category_Full.xlsx")

# --- 4. Group rows by category ---
groups = {}
current_category = None
full_categories = []  # Store full category names

for _, row in df.iterrows():
    # Detect category row (blank or NaN in '#' column)
    if pd.isna(row['#']) or str(row['#']).strip() == '':
        prog_name = str(row['PROGRAMME NAME']).strip() if not pd.isna(row['PROGRAMME NAME']) else ''
        if prog_name:
            current_category = prog_name
            full_categories.append(current_category)  # Store full name
            groups[current_category] = []
    elif current_category:
        groups[current_category].append(row.to_dict())

# --- 5. Save full category names to CSV ---
full_categories_df = pd.DataFrame(full_categories, columns=['Full_Category_Name'])
csv_output = os.path.join("kuccps data", "full_category_names.csv")
full_categories_df.to_csv(csv_output, index=False)

# --- 6. Save all categories to one Excel file (each as its own sheet) ---
with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
    for cat, items in groups.items():
        # Ensure valid sheet name (Excel has 31-char limit)
        sheet_name = cat[:31].replace('/', '_').replace('\\', '_')
        pd.DataFrame(items).to_excel(writer, sheet_name=sheet_name, index=False)

print(f"\nDone! Extracted {len(full_categories)} full category names")
print(f"Full category names saved to: {csv_output}")
print(f"Categories grouped by sheets in: {output_path}")
print(f"\nSample full category names:")
for i, cat in enumerate(full_categories[:10]):
    print(f"  {i+1}. {cat}")
if len(full_categories) > 10:
    print(f"  ... and {len(full_categories) - 10} more")
