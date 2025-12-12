FROM checkexploreai/global_tyre:v1

# Set working directory inside container
WORKDIR /app

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python packages
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the entire backend code
COPY . .

# Expose the application port
EXPOSE 8086

# Command to run Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8086"]