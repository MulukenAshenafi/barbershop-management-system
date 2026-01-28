#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."

# Try using pg_isready if available, otherwise use Python script
if command -v pg_isready &> /dev/null; then
    until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}"; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 1
    done
else
    # Use Python script as fallback
    python wait_for_db.py
fi

echo "PostgreSQL is up - executing commands"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

echo "Starting server..."

# Execute the main command (from CMD or docker-compose)
exec "$@"
