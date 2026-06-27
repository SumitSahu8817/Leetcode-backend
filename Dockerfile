FROM node:20-bullseye

# System dependencies install karna
RUN apt-get update && apt-get install -y g++ make python3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]