# Base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose ports
EXPOSE 5000
EXPOSE 3001

# Default command (can be overridden in docker-compose)
CMD ["flask", "run", "--host=0.0.0.0"]
