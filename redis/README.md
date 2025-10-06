Redis configuration and usage

This folder contains a basic `redis.conf` that you can mount into the Redis container if you want to supply custom settings.

How to use in docker-compose (example):

services:
  redis:
    image: redis:7.0-alpine
    volumes:
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: ["redis-server", "/usr/local/etc/redis/redis.conf"]
    ports:
      - "6379:6379"

Notes:
- The default `docker-compose.yml` in this repo starts Redis with the official image defaults. Only mount a custom config when you need to change settings.
- For production, secure Redis (requirepass, TLS, network isolation) and avoid exposing port 6379 publicly.

Persistence:
- The compose file in this repo already creates a named volume `redis_data` mounted at `/data` which persists Redis data across restarts.
- If you wish to enable AOF, set `appendonly yes` in the config and ensure your volume is mounted.

Security:
- If you enable `requirepass`, also set the password in your application environment and Redis client.
- Consider binding to localhost or using network policies to restrict access in production.
