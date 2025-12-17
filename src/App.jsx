import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, ArrowLeft, Save, Trash2 } from 'lucide-react';

export default function HIITTimer() {
  const [view, setView] = useState('timer');
  const [routines, setRoutines] = useState([]);
  const [currentRoutine, setCurrentRoutine] = useState(null);
  const [settings, setSettings] = useState({
    name: '',
    rounds: 8,
    workTime: 25,
    restBetweenExercises: 25,
    restBetweenRounds: 25
  });
  
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('work');
  const [totalTime, setTotalTime] = useState(0);
  
  const timerRef = useRef(null);

  useEffect(() => {
    loadRoutines();
    if ('wakeLock' in navigator) {
      let wakeLock = null;
      const requestWakeLock = async () => {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('Wake Lock error:', err);
        }
      };
      requestWakeLock();
      
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          requestWakeLock();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            playBeep();
            handlePhaseTransition();
            return getNextPhaseTime();
          }
          return prev - 1;
        });
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phase, currentRound]);

  const loadRoutines = async () => {
    try {
      const response = await fetch('/api/routines');
      const data = await response.json();
      setRoutines(data.routines || []);
      
      if (data.routines && data.routines.length > 0) {
        const last = data.routines[0];
        setCurrentRoutine(last.id);
        setSettings(last);
        setTimeLeft(last.workTime);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  };

  const saveRoutine = async () => {
    if (!settings.name.trim()) {
      alert('Bitte gib einen Namen für die Routine ein!');
      return;
    }

    try {
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRoutines();
        setTimeLeft(settings.workTime);
        setView('timer');
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Fehler beim Speichern!');
    }
  };

  const deleteRoutine = async (id) => {
    if (!confirm('Routine wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/routines/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRoutines();
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const loadRoutine = (routine) => {
    setCurrentRoutine(routine.id);
    setSettings(routine);
    setTimeLeft(routine.workTime);
    setView('timer');
    resetTimer();
  };

  const handlePhaseTransition = () => {
    if (phase === 'work') {
      setPhase('restExercise');
    } else if (phase === 'restExercise') {
      if (currentRound < settings.rounds) {
        setCurrentRound(prev => prev + 1);
        setPhase('work');
        playRoundStartSound();
      } else {
        setIsRunning(false);
      }
    }
  };

  const getNextPhaseTime = () => {
    if (phase === 'work') {
      return settings.restBetweenExercises;
    } else if (phase === 'restExercise') {
      return settings.workTime;
    }
    return settings.workTime;
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playRoundStartSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = [600, 800, 1000];
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + (index * 0.15);
      
      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentRound(1);
    setPhase('work');
    setTimeLeft(settings.workTime);
    setTotalTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progress = phase === 'work' 
    ? ((settings.workTime - timeLeft) / settings.workTime) * 100
    : ((settings.restBetweenExercises - timeLeft) / settings.restBetweenExercises) * 100;

  if (view === 'select') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setView('timer')} className="p-2">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Routine wählen</h1>
            <button onClick={() => setView('settings')} className="p-2">
              <Settings size={24} />
            </button>
          </div>

          {routines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-6">Keine Routines gespeichert</p>
              <button
                onClick={() => setView('settings')}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Erste Routine erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => loadRoutine(routine)}
                  className={`w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-4 text-left transition-colors ${
                    currentRoutine === routine.id ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-1">{routine.name}</div>
                      <div className="text-sm text-slate-400">
                        {routine.rounds} Runden • {routine.workTime}s Arbeit • {routine.restBetweenExercises}s Pause
                      </div>
                    </div>
                    {currentRoutine === routine.id && (
                      <div className="ml-3 text-green-500">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setView('select')} className="p-2">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Einstellungen</h1>
            <div className="w-10"></div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-4">
              <label className="block text-sm mb-2">Routine Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
                placeholder="z.B. Morgen Workout"
                className="w-full bg-slate-700 rounded-lg px-4 py-3 text-lg"
              />
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <label className="block text-sm mb-2">Runden</label>
              <input
                type="number"
                value={settings.rounds}
                onChange={(e) => setSettings({...settings, rounds: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-700 rounded-lg px-4 py-3 text-lg"
              />
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <label className="block text-sm mb-2">Arbeitszeit (s)</label>
              <input
                type="number"
                value={settings.workTime}
                onChange={(e) => setSettings({...settings, workTime: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-700 rounded-lg px-4 py-3 text-lg"
              />
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <label className="block text-sm mb-2">Pause zwischen Übungen (s)</label>
              <input
                type="number"
                value={settings.restBetweenExercises}
                onChange={(e) => setSettings({...settings, restBetweenExercises: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-700 rounded-lg px-4 py-3 text-lg"
              />
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <label className="block text-sm mb-2">Pause zwischen Runden (s)</label>
              <input
                type="number"
                value={settings.restBetweenRounds}
                onChange={(e) => setSettings({...settings, restBetweenRounds: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-700 rounded-lg px-4 py-3 text-lg"
              />
            </div>

            <button
              onClick={saveRoutine}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Routine speichern
            </button>

            <button
              onClick={() => setView('select')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 rounded-2xl transition-colors"
            >
              Zurück zur Auswahl
            </button>

            {routines.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Gespeicherte Routines</h2>
                <div className="space-y-3">
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      className="bg-slate-800 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{routine.name}</div>
                        <div className="text-sm text-slate-400">
                          {routine.rounds} Runden • {routine.workTime}s Arbeit • {routine.restBetweenExercises}s Pause
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRoutine(routine.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setView('select')} className="p-2">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">{settings.name || 'HIIT Timer'}</h1>
          <button onClick={() => setView('settings')} className="p-2">
            <Settings size={24} />
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center text-lg">
            <div className="flex items-center gap-2">
              <RotateCcw size={20} />
              <span>{currentRound} / {settings.rounds}</span>
            </div>
            <div>⏱️ {formatTime(totalTime)}</div>
            <div>💪 {currentRound}</div>
          </div>
        </div>

        <div className="relative w-full aspect-square max-w-sm mx-auto mb-8">
          <svg 
            className="w-full h-full -rotate-90 cursor-pointer"
            onClick={toggleTimer}
          >
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#1e293b"
              strokeWidth="20"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={phase === 'work' ? '#ef4444' : '#3b82f6'}
              strokeWidth="20"
              strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
            onClick={toggleTimer}
          >
            <div className="text-7xl font-bold mb-2">{formatTime(timeLeft)}</div>
            <div className="text-xl text-slate-400 capitalize">
              {phase === 'work' ? 'Arbeiten' : 'Pause'}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={toggleTimer}
            className={`flex-1 ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'} text-white font-semibold py-6 rounded-2xl flex items-center justify-center gap-2 transition-colors`}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            onClick={resetTimer}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-6 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}