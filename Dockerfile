# Einfache Version - Nutzt Vite Dev Server
FROM node:18-alpine

WORKDIR /app

# Kopiere package.json
COPY package.json ./

# Installiere ALLE dependencies (Vite wird gebraucht!)
RUN npm install --legacy-peer-deps

# Kopiere alle Dateien
COPY . .

# Ersetze server.js mit der smarten Version
COPY server-fixed.js ./server.js

# Erstelle data Verzeichnis
RUN mkdir -p /app/data

EXPOSE 9012

ENV NODE_ENV=production

CMD ["node", "server.js"]
