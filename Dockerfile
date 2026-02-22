FROM node:20-alpine

WORKDIR /app

# Copy package files AND prisma schema before install
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

# Copy remaining source files
COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]