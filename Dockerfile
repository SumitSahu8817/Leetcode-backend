FROM node:18-slim

# 1. System dependencies aur g++ compiler install karna
RUN apt-get update && apt-get install -y g++ python3 make && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]