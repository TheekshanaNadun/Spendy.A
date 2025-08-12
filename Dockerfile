# Base image
FROM python:3.10

# Install Prophet and pystan system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libatlas-base-dev \
    gfortran \
    libfreetype6-dev \
    libpng-dev \
    libopenblas-dev \
    liblapack-dev \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Install additional testing dependencies
RUN pip install --no-cache-dir pytest pytest-cov pytest-mock coverage

# Copy application code
COPY . .

# Expose ports
EXPOSE 5000
EXPOSE 3001

# Default command (can be overridden in docker-compose)
CMD ["flask", "run", "--host=0.0.0.0"]
