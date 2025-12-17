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

// API Routes ZUERST (wichtig!)
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

// Prüfe ob dist existiert
const distExists = fs.existsSync(path.join(__dirname, 'dist'));
console.log('📁 dist folder exists:', distExists);

// Server ERST starten, DANN Vite
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HIIT Timer API running on http://localhost:${PORT}`);
  console.log(`   API endpoints ready: /api/routines`);
  
  if (!distExists) {
    console.log('⚙️  Starting Vite dev server (this takes 30-60 seconds)...');
    
    // Versuche Vite zu starten, aber crash nicht wenn es fehlschlägt
    setTimeout(async () => {
      try {
        const { createServer } = require('vite');
        const vite = await createServer({
          server: { middlewareMode: true },
          appType: 'spa',
          logLevel: 'info'
        });
        
        app.use(vite.middlewares);
        console.log('✅ Vite dev server started successfully!');
        console.log('🌐 Frontend ready at http://localhost:9012');
        
      } catch (err) {
        console.error('❌ Failed to start Vite dev server:', err.message);
        console.log('⚠️  API is still running, but frontend is not available');
        console.log('💡 Try: npm run build to create dist folder');
      }
    }, 1000);
    
  } else {
    console.log('📦 Serving from dist folder (production mode)');
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
    console.log('🌐 Frontend ready at http://localhost:9012');
  }
});

// Crash-Handler
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.log('⚠️  Server continues running...');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  console.log('⚠️  Server continues running...');
});
