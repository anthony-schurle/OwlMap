import psycopg2
from pathlib import Path
import json

# --- PostgreSQL connection ---
conn = psycopg2.connect(
    host="localhost",
    database="owlmap",
    user="postgres"   # password can be omitted if not required
)
cur = conn.cursor()

# --- Path to the data folder ---
data_folder = Path(__file__).parent.parent / "data"

# --- Loop over all JSON files ---
for json_file in data_folder.glob("*.json"):
    table_name = json_file.stem.lower()  # filename becomes table name
    print(f"Loading {json_file.name} into table '{table_name}'...")

    # Create table if it doesn't exist
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL
        )
    """)

    # Delete all existing rows (wipe table)
    cur.execute(f"DELETE FROM {table_name};")
    cur.execute(f"ALTER SEQUENCE {table_name}_id_seq RESTART WITH 1;")

    # Read JSON content
    with open(json_file, "r", encoding="utf-8") as f:
        content = f.read().strip()

    if not content:
        print(f"Skipping empty file {json_file.name}")
        continue

    # Validate JSON
    try:
        json.loads(content)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in {json_file.name}: {e}")
        continue

    # Insert into PostgreSQL
    cur.execute(f"INSERT INTO {table_name} (data) VALUES (%s)", (content,))
    conn.commit()
    print(f"Inserted {json_file.name} successfully!")

# --- Close connection ---
cur.close()
conn.close()
print("All JSON files loaded successfully!")
