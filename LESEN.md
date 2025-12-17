# HIIT Timer - Raspberry Pi Fix (npm ci Error)

## Das Problem
`npm ci` schlägt fehl weil `package-lock.json` fehlt!

## 3 Lösungen - Von einfach zu komplex

---

## 🎯 LÖSUNG 1: Einfachste Lösung (EMPFOHLEN)

Nutze `npm install` statt `npm ci`:

### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN mkdir -p /app/data
EXPOSE 9012

CMD ["node", "server.js"]
```

### Schritte:
1. **Ersetze dein Dockerfile** mit dem obigen Code
2. In Portainer: Deploy Stack
3. Fertig! ✅

**Vorteil:** Kein Vite-Build nötig, läuft direkt  
**Nachteil:** Etwas langsamer als Production-Build

---

## 🔧 LÖSUNG 2: Mit package-lock.json erstellen

Erstelle die fehlende `package-lock.json`:

```bash
# Auf deinem Entwicklungsrechner:
cd /pfad/zum/projekt
npm install
# Dies erstellt package-lock.json

# Dann beide Dateien committen/hochladen
```

Dann kannst du das Original-Dockerfile mit `npm ci` nutzen.

---

## 🚀 LÖSUNG 3: Hybrid-Server (Dev + Production)

Nutze den verbesserten Server der automatisch Dev oder Production mode erkennt:

### Schritte:

1. **Ersetze `server.js`** mit `server-hybrid.js` (aus dem ZIP)

2. **Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN mkdir -p /app/data

EXPOSE 9012
CMD ["node", "server.js"]
```

3. **Vorteil:** Funktioniert automatisch mit und ohne Build!

---

## Was ich empfehle:

### Für schnellen Start: **LÖSUNG 1**
- Kopiere das `Dockerfile.final` in dein Projekt
- Benenne es um zu `Dockerfile`
- Deploy in Portainer

### docker-compose.yml:
```yaml
version: '3.8'

services:
  hiit-timer:
    build: .
    ports:
      - "9012:9012"
    volumes:
      - hiit_data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      
volumes:
  hiit_data:
```

---

## Troubleshooting

### "npm install" schlägt fehl
```dockerfile
# Versuche --force Flag
RUN npm install --force
```

### Speicher-Probleme
```bash
# Auf dem Pi: Erstelle Swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Ändere: CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Container startet nicht
```bash
# Logs checken in Portainer oder:
docker logs [container-name]
```

### Port schon belegt
```bash
# In docker-compose.yml ändern:
ports:
  - "9013:9012"  # Nutze Port 9013 extern
```

---

## Performance-Tipps

### Schnellerer Deploy:
```bash
# Build-Cache nutzen
docker-compose build --pull
docker-compose up -d
```

### Weniger Speicher nutzen:
In `docker-compose.yml`:
```yaml
services:
  hiit-timer:
    mem_limit: 256m
    mem_reservation: 128m
```

---

## Nach dem Deployment

1. Öffne `http://[raspberry-pi-ip]:9012`
2. App sollte laufen!
3. Daten werden automatisch im Volume gespeichert

---

## Noch Probleme?

1. ✅ Stelle sicher dass `package.json` im Projektordner ist
2. ✅ Prüfe dass Port 9012 frei ist: `sudo lsof -i :9012`
3. ✅ Logs checken: Portainer → Container → Logs
4. ✅ Speicher prüfen: `free -h`

Bei weiteren Fehlern: Poste die genaue Fehlermeldung aus den Logs!
