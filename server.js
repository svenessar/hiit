const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9012;
const DATA_FILE = path.join(__dirname, 'data', 'settings.json');

app.use(express.json());
app.use(express.static('public'));

// Erstelle data Verzeichnis
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Lade Einstellungen
app.get('/api/settings', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.json(JSON.parse(data));
    } else {
      // Standard-Einstellungen
      res.json({
        workTime: 30,
        restTime: 10,
        rounds: 8,
        preparationTime: 5
      });
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Speichere Einstellungen
app.post('/api/settings', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HIIT Timer läuft auf http://localhost:${PORT}`);
});
