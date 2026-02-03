# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Entrypoint runs from / so it is not overwritten by local dev volume mounts (when used with Compose)
RUN sed -i 's/\r$//' /app/entrypoint.sh 2>/dev/null || true && \
    cp /app/entrypoint.sh /entrypoint.sh && chmod +x /entrypoint.sh

# Create directories for static files and logs
RUN mkdir -p /app/staticfiles /app/media /app/logs

RUN chmod +x /app/wait_for_db.py

# Expose port
EXPOSE 8000

# Run entrypoint from / so it stays LF; /app is overwritten by volume on host
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]

# Production: run with env from Render (DB_*, SECRET_KEY, etc.). No Compose required.
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
