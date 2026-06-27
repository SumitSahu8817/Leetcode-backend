FROM node:18

# 1. System dependencies aur g++ compiler install karna
RUN apt-get update && apt-get install -y g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Package files copy karke dependencies install karna
COPY package*.json ./
RUN npm install

# 3. Baaki saara source code copy karna
COPY . .

# 4. Port expose karna jo Render use karega
EXPOSE 5000

# 5. Server start karne ki command
CMD ["node", "server.js"]