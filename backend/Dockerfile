# Use a lightweight python image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Install system dependencies (build-essential is useful for compiling any custom wheel components)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to utilize Docker build cache
COPY requirements.txt .

# Upgrade pip and install PyTorch/Torchvision CPU-only package to minimize image size (~600MB vs 2.5GB+)
# Then install other python dependencies from requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code to container
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Script execution order:
# 1. Wait for PostgreSQL to be ready
# 2. Run the database setup script to create database and schemas, and seed users
# 3. Start the Uvicorn application server binding to 0.0.0.0 to allow host PC access
CMD ["sh", "-c", "python wait_for_db.py && python -m app.database.setup_db && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
