# ---- Frontend build (Vite needs the node binary for its CLI shebang) ----
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Runtime: Bun serves the API + built static files ----
FROM oven/bun:1 AS runtime
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY tsconfig.json ./
COPY src ./src
COPY --from=frontend /app/frontend/dist ./public

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
USER bun
CMD ["bun", "run", "src/index.ts"]
