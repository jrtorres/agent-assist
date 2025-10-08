#!/bin/bash

# Trap to clean up both processes
trap "kill 0" EXIT

# Start Flask app in background
python app.py &

# Start Celery worker in foreground
celery -A celery_worker worker -l INFO
