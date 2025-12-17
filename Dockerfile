# Multi-stage Build - Richtig gemacht
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package.json
COPY package.json ./

# Installiere ALLE dependencies (inkl. devDependencies für Build)
RUN npm install --legacy-peer-deps

# Kopiere Source-Code
COPY . .

# Baue die App mit Vite
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Kopiere package.json
COPY package.json ./

# Installiere NUR production dependencies
RUN npm install --production --legacy-peer-deps

# Kopiere Server
COPY server.js ./

# Kopiere gebaute Dateien vom Builder
COPY --from=builder /app/dist ./dist

# Erstelle data Verzeichnis
RUN mkdir -p /app/data

EXPOSE 9012

ENV NODE_ENV=production

CMD ["node", "server.js"]
