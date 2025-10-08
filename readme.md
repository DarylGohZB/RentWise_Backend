### Setup using Docker Compose
1. Setup .env variables by running python script.
```
python3 generate_env.py
```
2. Fill in environment variables missing fields (Password etc.)
3. Download Docker/Docker Engine via online platform.
4. In the root directory run in terminal, 
```
docker compose up -d --build
```
4.5. Rerun the above command each time you make edits.
5. Done ez clap, by default mysql on port 3306, nodejs default 3000 (changable in env)

## Government Housing Data: Sync and Search

### What this does
- On server start, the app attempts to sync HDB resale data from Data.gov.sg and stores it in MySQL table `gov_house_transactions`.
- You can trigger the sync on-demand and query it via HTTP endpoints.

### Environment quick checklist (.env at repo root)
- Required for MySQL init (Compose reads these):
  - `MYSQL_ROOT_PASSWORD`
  - `MYSQL_DATABASE=rentwiseDB`
  - `MYSQL_USER=rentuser`
  - `MYSQL_PASSWORD=<your password>`
- Node container DB config (already mapped to MySQL above):
  - `DB_HOST=rentwiseDB`
  - `DB_PORT=3306`
  - `DB_USER=${MYSQL_USER}`
  - `DB_PASSWORD=${MYSQL_PASSWORD}`
  - `DB_NAME=${MYSQL_DATABASE}`
- Ports:
  - `HOST_DB_PORT=8000` (MySQL exposed on your host)
  - `NODEJS_PORT=3000` and `PORT=3000`
- Optional:
  - `DATA_GOV_SG_API_KEY=<if you have one>`

### Start services
```
docker compose up -d --build
docker compose logs -f nodejs
```
Wait until you see: `Server listening on port 3000`.

### Populate (sync) the dataset
- POST `http://localhost:3000/api/apimanagement/gov/sync`
- No headers/body required.
- The app paginates the DataStore API, uses backoff for 429s, and batches DB writes.

### Verify count and sample
- GET `http://localhost:3000/api/search/gov/count` → `{ "count": N }`
- GET `http://localhost:3000/api/search/gov/sample?limit=5`

### Search endpoints
- GET `http://localhost:3000/api/search/gov/search`
  - Query params: `town`, `flatType`, `minPrice`, `maxPrice`, `minAreaSqm`, `maxAreaSqm`, `limit`, `offset`
  - Example: `/api/search/gov/search?town=TAMPINES&flatType=4%20ROOM&minPrice=400000&maxPrice=700000&limit=20&offset=0`
- GET `http://localhost:3000/api/search/gov/towns`
  - Ranks towns by listing count, with optional filters above
  - Example: `/api/search/gov/towns?flatType=4%20ROOM&maxPrice=600000&limit=10`

### Common issues and fixes
- Postman can’t connect (ECONNREFUSED):
  - Ensure container exposes `3000:3000` and logs show `Server listening on port 3000`.
- DB access denied for `rentuser`:
  - Ensure `.env` has matching `MYSQL_*`, and container initialized with those values.
  - If needed, inside MySQL run: `GRANT ALL ON rentwiseDB.* TO 'rentuser'@'%' IDENTIFIED BY '<password>'; FLUSH PRIVILEGES;`
- Count is 0:
  - Trigger sync (POST `/api/apimanagement/gov/sync`). If logs show `429 Too Many Requests`, wait ~60s and re-run; it resumes paging.
- “Prepared statement contains too many placeholders” / “Malformed communication packet” during sync:
  - The app already handles batching and falls back to per-row upserts. Re-run sync.

### Inspect MySQL from host
```
mysql -h 127.0.0.1 -P 8000 -u rentuser -p
USE rentwiseDB;
SHOW TABLES;
SELECT COUNT(*) FROM gov_house_transactions;
```