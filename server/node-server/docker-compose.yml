services:
  postgres-dev:
    image: postgres:16.9
    container_name: postgres-dev
    environment:
      POSTGRES_DB: sysgd
      POSTGRES_USER: sysgd_user
      POSTGRES_PASSWORD: 1234
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sysgd_user -d sysgd"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio-dev:
    image: minio/minio:latest
    container_name: minio-dev
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: password123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  minio_data:
