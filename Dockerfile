# --- Stage 1: install dependencies and build ---
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: runtime ---
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/crm.db

COPY --from=build /app ./

EXPOSE 3000
CMD ["npm", "start"]
