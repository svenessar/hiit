# Multi-stage Build für kleineres finales Image
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiere package files
COPY package*.json ./

# Installiere ALLE dependencies (auch devDependencies für den Build)
RUN npm ci

# Kopiere Source Code
COPY . .

# Baue die Anwendung
# Setze NODE_OPTIONS für mehr Speicher beim Build (wichtig für Raspberry Pi)
ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Kopiere nur production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Kopiere Server-Datei und gebaute Dateien
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Erstelle Data-Verzeichnis
RUN mkdir -p /app/data

EXPOSE 9012

CMD ["node", "server.js"]
