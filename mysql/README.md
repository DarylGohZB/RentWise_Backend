MySQL Docker / Schema instructions

Place SQL files (.sql, .sql.gz) or shell scripts (.sh) into the `schema/`
folder. During first-time container initialization the official MySQL image
will execute those files in alphabetical order.

Where to place your schema files:

- ./backend/mysql/schema/*.sql

How it is mounted in docker-compose:

- ./backend/mysql/schema -> /docker-entrypoint-initdb.d (read-only)

Notes:
- The init scripts run only on a fresh database (when /var/lib/mysql is empty).
- To re-run init scripts delete the `backend/mysql/data` directory (or run a
  new volume) and restart the service.

Environment variables in docker-compose.yml set default DB, user and password
for development. Change them if needed or load them from an env file in
production.
