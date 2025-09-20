FROM python:3.11-slim

WORKDIR /app

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "-k", "uvicorn.workers.UvicornWorker", "backend/main:app"]
