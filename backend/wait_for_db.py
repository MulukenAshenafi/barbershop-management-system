#!/usr/bin/env python
"""
Wait for PostgreSQL database to be ready.
This script is used by the Docker entrypoint to ensure the database is available.
"""
import sys
import time
import psycopg2
import os

def wait_for_db():
    """Wait for PostgreSQL to be ready."""
    max_attempts = 30
    attempt = 0
    
    db_config = {
        'host': os.getenv('DB_HOST', 'db'),
        'port': os.getenv('DB_PORT', '5432'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres'),
        'dbname': os.getenv('DB_NAME', 'barbershop_db'),
    }
    
    while attempt < max_attempts:
        try:
            conn = psycopg2.connect(**db_config)
            conn.close()
            print("PostgreSQL is ready!")
            return True
        except psycopg2.OperationalError:
            attempt += 1
            if attempt < max_attempts:
                print(f"PostgreSQL is unavailable - waiting... ({attempt}/{max_attempts})")
                time.sleep(1)
            else:
                print("PostgreSQL connection failed after maximum attempts")
                return False
    
    return False

if __name__ == '__main__':
    if wait_for_db():
        sys.exit(0)
    else:
        sys.exit(1)
