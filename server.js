const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 9012;
const DATA_FILE = path.join(__dirname, 'data', 'routines.json');

app.use(express.json());

// Erstelle data Verzeichnis
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Prüfe ob dist existiert
const distExists = fs.existsSync(path.join(__dirname, 'dist'));
console.log('dist folder exists:', distExists);

if (!distExists) {
  console.log('⚠️  No dist folder - starting Vite dev server...');
  
  // Starte Vite asynchron
  setTimeout(async () => {
    try {
      const { createServer } = require('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('✅ Vite dev server started');
    } catch (err) {
      console.error('❌ Failed to start Vite:', err);
    }
  }, 100);
} else {
  console.log('📦 Serving from dist folder');
  app.use(express.static('dist'));
}

function loadRoutines() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading routines:', error);
  }
  return [];
}

function saveRoutines(routines) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(routines, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving routines:', error);
    return false;
  }
}

app.get('/api/routines', (req, res) => {
  const routines = loadRoutines();
  res.json({ routines });
});

app.post('/api/routines', (req, res) => {
  const routines = loadRoutines();
  const newRoutine = {
    id: Date.now().toString(),
    ...req.body
  };
  
  const existingIndex = routines.findIndex(r => r.name === newRoutine.name);
  if (existingIndex >= 0) {
    routines[existingIndex] = newRoutine;
  } else {
    routines.unshift(newRoutine);
  }
  
  if (saveRoutines(routines)) {
    res.json({ success: true, routine: newRoutine });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

app.delete('/api/routines/:id', (req, res) => {
  const routines = loadRoutines();
  const filtered = routines.filter(r => r.id !== req.params.id);
  
  if (saveRoutines(filtered)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to delete' });
  }
});

if (distExists) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HIIT Timer running on http://localhost:${PORT}`);
});
