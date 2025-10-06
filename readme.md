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