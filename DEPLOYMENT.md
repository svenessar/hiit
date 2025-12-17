# HIIT Timer - Raspberry Pi Deployment

## Problem & Lösung

**Fehler:** `npm run build` failed beim Docker Build auf Raspberry Pi

**Ursachen:**
- devDependencies fehlten beim Build (Vite braucht diese)
- Zu wenig Speicher für Vite Build auf dem Pi
- Ineffizientes Single-Stage Dockerfile

**Lösung:**
- Multi-Stage Build: Build in Stage 1, Production in Stage 2
- Erhöhter Speicher für Node.js (`NODE_OPTIONS`)
- Alle Dependencies im Builder-Stage
- Nur Production-Dependencies im finalen Image

## Installation in Portainer

### Option 1: Über Portainer UI (empfohlen)

1. **Stack erstellen:**
   - Gehe zu "Stacks" → "Add stack"
   - Name: `hiit-timer`

2. **Repository-Methode:**
   - Wähle "Repository" als Build-Methode
   - Oder: Lade die Dateien hoch

3. **Dateien uploaden:**
   - Wähle "Web editor"
   - Kopiere den Inhalt der `docker-compose.yml`
   - Stelle sicher, dass `Dockerfile` und `.dockerignore` im gleichen Ordner liegen

4. **Deploy:**
   - Klicke auf "Deploy the stack"
   - Warte (Build dauert auf dem Pi 5-10 Minuten!)

### Option 2: Via Git Repository

Wenn dein Code in einem Git-Repo ist:
1. Gehe zu "Stacks" → "Add stack"
2. Wähle "Repository"
3. Gib die Git-URL ein
4. Branch: main/master
5. Compose path: `docker-compose.yml`

### Option 3: Manuell via SSH

```bash
# Auf dem Raspberry Pi
cd /pfad/zu/deinem/projekt
docker-compose up -d --build
```

## Wichtige Hinweise

### Speicher
- Der Build braucht mindestens 512MB RAM
- Wenn der Pi wenig RAM hat, schließe andere Dienste während des Builds

### Build-Dauer
- Erster Build: 10-15 Minuten auf Pi 4
- Folgende Builds: 5-10 Minuten (wegen Cache)

### Ports
- App läuft auf Port 9012
- Stelle sicher, dass der Port frei ist

### Volumes
- Daten werden in `hiit_etc` Volume gespeichert
- Bleibt erhalten bei Container-Neustarts

## Troubleshooting

### Build schlägt immer noch fehl

**1. Speicherproblems:**
```bash
# Prüfe verfügbaren Speicher
free -h

# Wenn zu wenig RAM: Erstelle Swap
sudo dkpg-reconfigure dphys-swapfile
# Erhöhe CONF_SWAPSIZE auf 2048
sudo service dphys-swapfile restart
```

**2. Alte Images aufräumen:**
```bash
docker system prune -a
docker volume prune
```

**3. Build mit mehr Logs:**
In Portainer oder via SSH:
```bash
docker-compose build --progress=plain --no-cache
```

### Container startet nicht

```bash
# Logs anschauen
docker logs hiit-timer-hiit-timer-1

# In Portainer: Container → Logs
```

### Port bereits belegt

```bash
# Prüfe was Port 9012 benutzt
sudo lsof -i :9012

# Oder ändere Port in docker-compose.yml
ports:
  - "9013:9012"  # Externer Port 9013
```

## Optimierungen

### Falls Build zu lange dauert:

Bearbeite das Dockerfile und reduziere die Build-Größe:

```dockerfile
# Am Ende des Builder-Stage
RUN npm run build -- --minify esbuild
```

### Für schnellere Deployments:

Baue das Image einmal lokal auf einem stärkeren Rechner und pushe es in eine Registry:

```bash
# Auf deinem PC (x86):
docker buildx build --platform linux/arm64 -t dein-user/hiit-timer:latest --push .

# In docker-compose.yml auf dem Pi:
services:
  hiit-timer:
    image: dein-user/hiit-timer:latest
    # Kein "build:" mehr nötig
```

## App nutzen

Nach erfolgreichem Deployment:
- Öffne `http://raspberry-pi-ip:9012`
- Timer sollte direkt funktionieren
- Workouts werden im Volume gespeichert

## Support

Bei weiteren Problemen:
1. Logs in Portainer checken
2. `docker-compose logs -f` ausführen
3. Speicher mit `free -h` prüfen
