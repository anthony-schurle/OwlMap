import psycopg2
import json

conn = psycopg2.connect(
    host="localhost",
    database="owlmap",
    user="postgres"
)
cur = conn.cursor()

cur.execute("SELECT data FROM buildings WHERE id = 1;")
row = cur.fetchone()

# Pretty-print JSON
if row:
    data = row[0]  # already a Python dict
    print(json.dumps(data, indent=4))

cur.close()
conn.close()
