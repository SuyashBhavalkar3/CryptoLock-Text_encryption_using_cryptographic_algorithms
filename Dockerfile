# Use slim Python base image for smaller size
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV GPG_HOME=/app/data/gnupg_home

# Install system dependencies
RUN apt-get update && \
    apt-get install -y gnupg2 curl && \
    rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy requirements first (for Docker caching)
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY data/ ./data/

# Expose port used by FastAPI / Uvicorn
EXPOSE 10000

# Default command to run FastAPI
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "10000"]