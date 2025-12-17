FROM node:18-alpine

WORKDIR /app

# Kopiere package.json
COPY package.json ./

# Installiere Dependencies mit Fehlertoleranz
RUN npm install --legacy-peer-deps || npm install --force

# Kopiere alle Dateien
COPY . .

# Erstelle Data-Verzeichnis
RUN mkdir -p /app/data

# Port exponieren
EXPOSE 9012

# Environment
ENV NODE_ENV=production

# Starte Server
CMD ["node", "server.js"]
