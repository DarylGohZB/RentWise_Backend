FROM node:lts-bookworm-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./

RUN npm ci --only=production || npm install --omit=dev

# Bundle app source
COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
