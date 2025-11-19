# -----------------------------
# FastAPI + PGPy Dockerfile
# -----------------------------
FROM python:3.11-slim

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgmp10 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend folder into container
COPY backend/ /app/backend/

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Create data directory (SQLite storage)
RUN mkdir -p /app/data/tmp

# Expose FastAPI port
EXPOSE 8000

# Correct entrypoint for your structure:
# backend/app/main.py → backend.app.main
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
