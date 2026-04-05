# Docker Setup for Mahek Admin

This guide explains how to build and run the Mahek Admin application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, for easier orchestration)

## Building the Docker Image

### Using Docker CLI

```bash
docker build -t mahek-admin:latest .
```

### Using Docker Compose

```bash
docker-compose build
```

## Running the Container

### Using Docker CLI

```bash
docker run -p 80:80 mahek-admin:latest
```

Access the application at `http://localhost`

### Using Docker Compose

```bash
docker-compose up -d
```

## Stopping the Container

### Using Docker CLI

```bash
docker stop <container-id>
```

### Using Docker Compose

```bash
docker-compose down
```

## Development with Docker

For development with hot-reload, build a development image:

```bash
docker build -f Dockerfile.dev -t mahek-admin:dev .
```

Then run:

```bash
docker run -it -p 4200:4200 -v $(pwd)/src:/app/src mahek-admin:dev
```

## Production Deployment

The default Dockerfile is optimized for production:

- **Multi-stage build**: Reduces final image size by only including necessary files
- **Nginx serving**: Lightweight web server for static files
- **Gzip compression**: Enabled for better performance
- **Cache optimization**: Assets are cached with appropriate headers
- **SPA routing**: Configured to support client-side routing

## Image Details

- **Base Image**: node:18-alpine (builder), nginx:alpine (production)
- **Build Size**: ~150MB (build stage)
- **Final Size**: ~30MB (nginx stage)
- **Port**: 80 (HTTP)

## Environment Variables

Currently no environment variables are required. If you need to add API endpoints or other configurations, update the nginx.conf or Dockerfile accordingly.

## Troubleshooting

### Port already in use

If port 80 is already in use:

```bash
docker run -p 8080:80 mahek-admin:latest
```

Then access at `http://localhost:8080`

### Build fails

Ensure `package-lock.json` exists in the project root:

```bash
npm install
```

Then rebuild the Docker image.
