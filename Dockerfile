FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]

# Отдельный образ для миграций (включает dev-зависимости и src/)
FROM node:20-alpine AS migrator

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY tsconfig*.json ./

CMD ["npm", "run", "migration:run"]
