import os
import time
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def wait_for_db():
    if not DATABASE_URL:
        print("DATABASE_URL is not set.")
        return False
    
    parsed_url = urlparse(DATABASE_URL)
    username = parsed_url.username or "postgres"
    password = parsed_url.password or "postgres"
    host = parsed_url.hostname or "localhost"
    port = parsed_url.port or 5432
    
    print(f"Polling database connectivity at {host}:{port}...")
    retries = 30
    while retries > 0:
        try:
            conn = psycopg2.connect(
                dbname="postgres", # standard default db
                user=username,
                password=password,
                host=host,
                port=port,
                connect_timeout=3
            )
            conn.close()
            print("Database is ready and reachable!")
            return True
        except Exception as e:
            print(f"Database not ready yet ({e}). Retrying in 2 seconds... ({retries} retries left)")
            time.sleep(2)
            retries -= 1
            
    print("Database connection timed out. Exiting.")
    return False

if __name__ == "__main__":
    wait_for_db()
