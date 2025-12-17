FROM node:18-alpine

WORKDIR /app

# Installiere curl für healthcheck
RUN apk add --no-cache curl

COPY package.json ./

# Installiere mit maximaler Fehlertoleranz
RUN npm install --legacy-peer-deps --ignore-scripts 2>&1 || \
    npm install --force --ignore-scripts 2>&1 || \
    echo "Some packages failed but continuing..."

COPY . .

RUN mkdir -p /app/data

EXPOSE 9012

# Healthcheck damit Portainer sieht dass der Container lebt
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9012/api/routines || exit 1

CMD ["node", "server.js"]
