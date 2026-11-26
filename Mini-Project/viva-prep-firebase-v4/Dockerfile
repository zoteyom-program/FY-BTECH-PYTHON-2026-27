FROM python:3.12-slim
# Start from a lightweight official Python 3.12 Linux image
WORKDIR /app
# Set /app as the working folder inside the container
COPY backend/requirements.txt ./backend/
# Copy the requirements file first so Docker can cache package installs
RUN pip install --no-cache-dir -r backend/requirements.txt
# Install all required Python libraries without saving extra cache files
COPY backend/main.py backend/content_cache.json ./backend/
# Copy our FastAPI backend code and shared subject content cache into the container
COPY frontend ./frontend
# Copy the frontend HTML, CSS, and JS files into the container
WORKDIR /app/backend
# Switch the working folder to /app/backend to run the server
EXPOSE 8000
# Tell Docker that the app listens on port 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
# Start the FastAPI server using uvicorn on the host port (default 8000)
