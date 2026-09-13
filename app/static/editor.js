const DIFFICULTY_PRESETS = {
  'Fácil': { stars: 1.5, scrollDurationMs: 1800, label: '1.5★ Fácil (Relajado)' },
  'Media': { stars: 3.5, scrollDurationMs: 1400, label: '3.5★ Media (Estándar)' },
  'Difícil': { stars: 5.5, scrollDurationMs: 1100, label: '5.5★ Difícil (Rápido)' },
  'Extrema': { stars: 7.5, scrollDurationMs: 850, label: '7.5★ Extrema (Experto)' },
  'Insana': { stars: 9.5, scrollDurationMs: 650, label: '9.5★ Insana (Frenético)' }
};

const ChartEditor = {
  audioCtx: null,
  audioBuffer: null,
  audioBlob: null,
  audioBlobUrl: null,
  audioElement: null,
  audioSourceNode: null,
  isPlaying: false,
  isInitialized: false,
  playbackStartTime: 0,
  currentSongTime: 0,
  duration: 0,
  bpm: 120,
  snap: 4,
  firstBeatOffsetMs: 0,
  difficultyPreset: 'Media',
  playbackRate: 1.0,
  activeTool: 'auto',
  notes: [], // [{ lane: 0..2, time: ms, type: 'tap'|'hold'|'swipe', duration: ms, direction: 'up'|'down'|'left'|'right' }]
  pixelsPerSecond: 200,
  startMarkerMs: null, // Marcador de comienzo de la pista (abarca 3 carriles)
  endMarkerMs: null,   // Marcador de fin de la pista (abarca 3 carriles)
  canvas: null,
  ctx: null,

  // Estados de interacción táctil avanzada
  isDraggingGrid: false,
  gridDragStartY: 0,
  gridDragStartOffset: 0,

  isStretchingHold: false,
  stretchingNote: null,

  isDraggingNote: false,
  draggedNote: null,
  targetNote: null,
  dragNoteTimer: null,

  isDraggingStartMarker: false,
  isDraggingEndMarker: false,
  markerDragPointerId: null,
  gridDragPointerId: null,

  // Sistema de interacción Multi-Touch independiente para ritmos a múltiples dedos
  activePointers: new Map(),
  // Sistema de teclas activas para teclado
  activeKeys: new Map(),

  init() {
    this.canvas = document.getElementById('editorCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    if (!this.isInitialized) {
      this.isInitialized = true;
      window.addEventListener('resize', () => this.resizeCanvas());
      this.bindEvents();
      this.renderLoop();
      this.initUI();
    }
  },

  initUI() {
    this.setOffset(this.firstBeatOffsetMs);
    this.setDifficulty(this.difficultyPreset);
  },

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(rect.width || this.canvas.clientWidth || 320);
    const h = Math.floor(rect.height || this.canvas.clientHeight || 550);

    if (w > 0 && h > 0) {
      if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
      }
      if (this.ctx) {
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  },

  async loadAudioFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    this.pause();

    if (this.audioBlobUrl) {
      try { URL.revokeObjectURL(this.audioBlobUrl); } catch (err) {}
    }
    this.audioBlob = file;
    this.audioBlobUrl = URL.createObjectURL(file);

    if (!this.audioElement) {
      this.audioElement = new Audio();
    }
    this.audioElement.src = this.audioBlobUrl;
    this.audioElement.preservesPitch = true;
    this.audioElement.mozPreservesPitch = true;
    this.audioElement.webkitPreservesPitch = true;
    this.audioElement.playbackRate = this.playbackRate;
    this.audioElement.onended = () => {
      this.pause();
      this.currentSongTime = this.duration;
    };

    const btnText = document.getElementById('edAudioBtnText');
    if (btnText) btnText.innerText = `🎵 ${file.name.slice(0, 14)}...`;

    const arrayBuffer = await file.arrayBuffer();

    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;
    this.currentSongTime = 0;

    const titleInput = document.getElementById('edSongTitle');
    if (titleInput && !titleInput.value) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, '');
    }

    showSuccessToast(`Audio cargado: ${this.duration.toFixed(1)}s`);
  },

  setPlaybackSpeed(speedVal) {
    this.playbackRate = parseFloat(speedVal) || 1.0;
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.preservesPitch = true;
      this.audioElement.mozPreservesPitch = true;
      this.audioElement.webkitPreservesPitch = true;
    }
    showSuccessToast(`Velocidad: ${this.playbackRate}x (Tono original preservado)`);
  },

  setOffset(ms) {
    this.firstBeatOffsetMs = Math.max(-500, Math.min(500, parseInt(ms, 10) || 0));
    const slider = document.getElementById('edOffsetSlider');
    if (slider) slider.value = this.firstBeatOffsetMs;
    const display = document.getElementById('edOffsetVal');
    if (display) {
      const sign = this.firstBeatOffsetMs > 0 ? '+' : '';
      display.innerText = `${sign}${this.firstBeatOffsetMs} ms`;
    }
  },

  adjustOffset(deltaMs) {
    this.setOffset(this.firstBeatOffsetMs + deltaMs);
  },

  setDifficulty(presetKey) {
    if (DIFFICULTY_PRESETS[presetKey]) {
      this.difficultyPreset = presetKey;
    } else {
      this.difficultyPreset = 'Media';
    }
    const select = document.getElementById('edDiffPresetSelect');
    if (select) select.value = this.difficultyPreset;

    const badge = document.getElementById('edDiffBadge');
    if (badge) {
      if (typeof t === 'function') {
        const pKey = 'ed_diff_' + (this.difficultyPreset === 'Fácil' ? 'easy' : (this.difficultyPreset === 'Media' ? 'medium' : (this.difficultyPreset === 'Difícil' ? 'hard' : (this.difficultyPreset === 'Extrema' ? 'extreme' : 'insane'))));
        badge.innerText = t(pKey, DIFFICULTY_PRESETS[this.difficultyPreset].label);
      } else {
        const p = DIFFICULTY_PRESETS[this.difficultyPreset];
        badge.innerText = p.label;
      }
    }
  },

  setStartMarker() {
    this.startMarkerMs = Math.round(this.currentSongTime * 1000);
    showSuccessToast(`🏁 Comienzo marcado en ${(this.startMarkerMs / 1000).toFixed(2)}s`);
    this.updateMarkerUI();
  },

  adjustStartMarker(deltaSec) {
    const cur = this.startMarkerMs !== null ? this.startMarkerMs : 0;
    this.startMarkerMs = Math.max(0, Math.round(cur + (deltaSec * 1000)));
    this.updateMarkerUI();
  },

  clearStartMarker() {
    this.startMarkerMs = 0;
    this.updateMarkerUI();
    showSuccessToast('Inicio restablecido a 0.0s');
  },

  setEndMarker() {
    this.endMarkerMs = Math.round(this.currentSongTime * 1000);
    showSuccessToast(`🛑 Final marcado en ${(this.endMarkerMs / 1000).toFixed(2)}s`);
    this.updateMarkerUI();
  },

  adjustEndMarker(deltaSec) {
    const defaultEnd = this.duration > 0 ? Math.round(this.duration * 1000) : 60000;
    const cur = this.endMarkerMs !== null ? this.endMarkerMs : defaultEnd;
    this.endMarkerMs = Math.max(1000, Math.round(cur + (deltaSec * 1000)));
    this.updateMarkerUI();
  },

  clearEndMarker() {
    this.endMarkerMs = null;
    this.updateMarkerUI();
    showSuccessToast('Final restablecido al término del audio');
  },

  updateMarkerUI() {
    const statusEl = document.getElementById('edMarkerStatus');
    if (statusEl) {
      const parts = [];
      if (this.startMarkerMs !== null && this.startMarkerMs > 0) parts.push(`🏁 ${(this.startMarkerMs / 1000).toFixed(1)}s`);
      if (this.endMarkerMs !== null) parts.push(`🛑 ${(this.endMarkerMs / 1000).toFixed(1)}s`);
      statusEl.innerText = parts.join(' | ');
    }

    const startValEl = document.getElementById('edStartMarkerVal');
    if (startValEl) {
      startValEl.innerText = this.startMarkerMs !== null ? `${(this.startMarkerMs / 1000).toFixed(1)}s` : '0.0s';
    }

    const endValEl = document.getElementById('edEndMarkerVal');
    if (endValEl) {
      endValEl.innerText = this.endMarkerMs !== null ? `${(this.endMarkerMs / 1000).toFixed(1)}s` : (this.duration > 0 ? `${this.duration.toFixed(1)}s` : 'Audio fin');
    }
  },

  // Validación estricta anti-solapamiento de notas
  canPlaceNote(lane, timeMs, durationMs = 0, excludeNote = null) {
    const dur = Math.max(0, durationMs || 0);
    const startA = timeMs;
    const endA = timeMs + dur;
    const minGapMs = 45; // Ventana mínima estricta entre notas en el mismo carril

    for (const n of this.notes) {
      if (excludeNote && n === excludeNote) continue;
      if (n.lane !== lane) continue;

      const nDur = Math.max(0, n.duration || 0);
      const startB = n.time;
      const endB = n.time + nDur;

      // 1. Cabezas de notas colisionando (< 45ms)
      if (Math.abs(startA - startB) < minGapMs) {
        return false;
      }

      // 2. Colisión de intervalos de tiempo
      const effEndA = dur > 0 ? endA : (startA + minGapMs);
      const effEndB = nDur > 0 ? endB : (startB + minGapMs);

      if (Math.max(startA, startB) < Math.min(effEndA, effEndB)) {
        return false;
      }
    }
    return true;
  },

  cleanOverlappingNotes() {
    this.notes.sort((a, b) => a.time - b.time);
    const cleaned = [];
    for (const n of this.notes) {
      let overlap = false;
      const dur = Math.max(0, n.duration || 0);
      const startA = n.time;
      const effEndA = dur > 0 ? (startA + dur) : (startA + 45);

      for (const prev of cleaned) {
        if (prev.lane !== n.lane) continue;
        const prevDur = Math.max(0, prev.duration || 0);
        const startB = prev.time;
        const effEndB = prevDur > 0 ? (startB + prevDur) : (startB + 45);

        if (Math.abs(startA - startB) < 45 || Math.max(startA, startB) < Math.min(effEndA, effEndB)) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        cleaned.push(n);
      }
    }
    this.notes = cleaned;
    this.updateStats();
  },

  setTool(tool) {
    this.activeTool = tool;
    const badge = document.getElementById('edModeBadge');
    if (badge) {
      if (tool === 'auto') {
        badge.innerText = (typeof t === 'function') ? t('ed_mode_auto', '✨ AUTO GESTOS') : '✨ AUTO GESTOS';
        badge.className = 'text-[9px] font-black text-emerald-400';
      } else {
        badge.innerText = `MANUAL (${tool.toUpperCase()})`;
        badge.className = 'text-[9px] font-black text-pink-400';
      }
    }

    document.querySelectorAll('.ed-tool-btn').forEach(btn => {
      if (btn.dataset.tool === tool) {
        btn.className = `ed-tool-btn active py-1 rounded-lg text-[9px] font-black ${tool === 'auto' ? 'bg-emerald-500 text-black' : 'bg-pink-500 text-white'}`;
      } else {
        btn.className = 'ed-tool-btn py-1 rounded-lg text-[9px] font-bold bg-white/10 text-gray-300';
      }
    });
  },

  setBpm(val) {
    this.bpm = Math.max(40, Math.min(320, parseFloat(val) || 120));
  },

  setSnap(val) {
    this.snap = parseInt(val, 10) || 4;
  },

  getSnappedTime(timeSeconds) {
    const beatInterval = 60 / this.bpm;
    const snapInterval = beatInterval / (this.snap / 4);
    const offsetSec = (this.firstBeatOffsetMs || 0) / 1000;
    const relative = timeSeconds - offsetSec;
    const snapped = Math.round(relative / snapInterval) * snapInterval + offsetSec;
    return Math.max(0, snapped);
  },

  findNoteAt(x, y, laneWidth, hitLineY) {
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      const noteTimeSec = n.time / 1000;
      const noteY = hitLineY - (noteTimeSec - this.currentSongTime) * this.pixelsPerSecond;
      const noteX = n.lane * laneWidth + 8;
      const noteW = laneWidth - 16;

      if (x >= noteX && x <= noteX + noteW && Math.abs(y - noteY) <= 18) {
        return { note: n, index: i };
      }
    }
    return null;
  },

  findHoldHandleAt(x, y, laneWidth, hitLineY) {
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const n = this.notes[i];
      if (n.type === 'hold') {
        const noteTimeSec = n.time / 1000;
        const headY = hitLineY - (noteTimeSec - this.currentSongTime) * this.pixelsPerSecond;
        const holdHeight = ((n.duration || 600) / 1000) * this.pixelsPerSecond;
        const tailY = headY - holdHeight;
        const handleX = n.lane * laneWidth + laneWidth / 2;

        const dist = Math.hypot(x - handleX, y - tailY);
        if (dist <= 18) {
          return { note: n, index: i };
        }
      }
    }
    return null;
  },

  bindEvents() {
    if (!this.canvas) return;

    // --- POINTER DOWN ---
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) {}

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const laneWidth = rect.width / 3;
      const hitLineY = rect.height - 50;
      const timeOffset = (hitLineY - y) / this.pixelsPerSecond;
      const noteTime = this.currentSongTime + timeOffset;

      // 1. Arrastre directo de Marcador de Inicio (Comienzo 🏁)
      if (this.startMarkerMs !== null && this.startMarkerMs !== undefined) {
        const markerY = hitLineY - (this.startMarkerMs / 1000 - this.currentSongTime) * this.pixelsPerSecond;
        if (Math.abs(y - markerY) <= 16) {
          this.isDraggingStartMarker = true;
          this.markerDragPointerId = e.pointerId;
          return;
        }
      }

      // 2. Arrastre directo de Marcador de Fin (Final 🛑)
      if (this.endMarkerMs !== null && this.endMarkerMs !== undefined) {
        const markerY = hitLineY - (this.endMarkerMs / 1000 - this.currentSongTime) * this.pixelsPerSecond;
        if (Math.abs(y - markerY) <= 16) {
          this.isDraggingEndMarker = true;
          this.markerDragPointerId = e.pointerId;
          return;
        }
      }

      // 3. Estirar cola de Hold existente mediante Handle circular
      const handleHit = this.findHoldHandleAt(x, y, laneWidth, hitLineY);
      if (handleHit) {
        this.activePointers.set(e.pointerId, {
          pointerId: e.pointerId,
          type: 'stretch_hold',
          stretchingNote: handleHit.note,
          lane: handleHit.note.lane
        });
        return;
      }

      // 4. Click en una nota existente (Tap para borrar / rotar swipe, o Long-Press para arrastrar)
      const noteHit = this.findNoteAt(x, y, laneWidth, hitLineY);
      if (noteHit) {
        const ptrState = {
          pointerId: e.pointerId,
          type: 'existing_note',
          targetNote: noteHit.note,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          startTime: performance.now(),
          lane: noteHit.note.lane,
          songTimeAtTouch: noteHit.note.time / 1000,
          isDraggingNote: false,
          dragged: false,
          direction: noteHit.note.direction || 'up',
          dragNoteTimer: null
        };

        ptrState.dragNoteTimer = setTimeout(() => {
          if (this.activePointers.has(e.pointerId)) {
            ptrState.isDraggingNote = true;
            if (navigator.vibrate) navigator.vibrate(25);
          }
        }, 180);

        this.activePointers.set(e.pointerId, ptrState);
        return;
      }

      // 5. Arrastre de rejilla visual con Shift
      if (e.shiftKey) {
        this.isDraggingGrid = true;
        this.gridDragPointerId = e.pointerId;
        this.gridDragStartY = y;
        this.gridDragStartOffset = this.firstBeatOffsetMs;
        return;
      }

      // 6. Nueva nota táctil (independiente por cada dedo / pointerId)
      const lane = Math.max(0, Math.min(2, Math.floor(x / laneWidth)));
      const isAuto = this.activeTool === 'auto';
      // En modo automático: cliquear donde sea en la pantalla crea la nota en la línea rosa imantada a la rejilla
      const autoSec = this.getSnappedTime(this.currentSongTime);
      const autoMs = Math.round(autoSec * 1000);
      const startMs = isAuto ? autoMs : Math.round(this.getSnappedTime(noteTime) * 1000);

      this.activePointers.set(e.pointerId, {
        pointerId: e.pointerId,
        type: 'new_note',
        lane: lane,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        startTime: performance.now(),
        startSongTimeMs: startMs,
        isAutoMode: isAuto,
        dragged: false,
        direction: 'up'
      });
    });

    // --- POINTER MOVE ---
    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const laneWidth = rect.width / 3;
      const hitLineY = rect.height - 50;

      // Arrastre directo de Marcador de Inicio
      if (this.isDraggingStartMarker && this.markerDragPointerId === e.pointerId) {
        const timeOffset = (hitLineY - y) / this.pixelsPerSecond;
        const newSec = Math.max(0, this.currentSongTime + timeOffset);
        this.startMarkerMs = Math.round(newSec * 1000);
        this.updateMarkerUI();
        return;
      }

      // Arrastre directo de Marcador de Fin
      if (this.isDraggingEndMarker && this.markerDragPointerId === e.pointerId) {
        const timeOffset = (hitLineY - y) / this.pixelsPerSecond;
        const newSec = Math.max(1, this.currentSongTime + timeOffset);
        this.endMarkerMs = Math.round(newSec * 1000);
        this.updateMarkerUI();
        return;
      }

      // Arrastre de rejilla visual
      if (this.isDraggingGrid && this.gridDragPointerId === e.pointerId) {
        const deltaY = y - this.gridDragStartY;
        const deltaOffsetMs = Math.round(-(deltaY / this.pixelsPerSecond) * 1000);
        this.setOffset(this.gridDragStartOffset + deltaOffsetMs);
        return;
      }

      const ptr = this.activePointers.get(e.pointerId);
      if (!ptr) {
        // Feedback de cursor al pasar el ratón (hover)
        let cursor = 'crosshair';
        if (this.startMarkerMs !== null) {
          const mY = hitLineY - (this.startMarkerMs / 1000 - this.currentSongTime) * this.pixelsPerSecond;
          if (Math.abs(y - mY) <= 12) cursor = 'ns-resize';
        }
        if (this.endMarkerMs !== null) {
          const mY = hitLineY - (this.endMarkerMs / 1000 - this.currentSongTime) * this.pixelsPerSecond;
          if (Math.abs(y - mY) <= 12) cursor = 'ns-resize';
        }
        if (cursor === 'crosshair' && this.findHoldHandleAt(x, y, laneWidth, hitLineY)) {
          cursor = 'grab';
        }
        this.canvas.style.cursor = cursor;
        return;
      }

      // Estiramiento dinámico continuo de un Hold con limitación anti-solapamiento
      if (ptr.type === 'stretch_hold' && ptr.stretchingNote) {
        const noteHeadY = hitLineY - (ptr.stretchingNote.time / 1000 - this.currentSongTime) * this.pixelsPerSecond;
        let rawDurMs = Math.max(100, Math.round(((noteHeadY - y) / this.pixelsPerSecond) * 1000));
        if (this.snap > 0) {
          const snapIntervalMs = ((60 / this.bpm) / (this.snap / 4)) * 1000;
          rawDurMs = Math.max(snapIntervalMs, Math.round(rawDurMs / snapIntervalMs) * snapIntervalMs);
        }
        // Clampear para no colisionar con la siguiente nota en este carril
        const nextNote = this.notes
          .filter(n => n !== ptr.stretchingNote && n.lane === ptr.stretchingNote.lane && n.time > ptr.stretchingNote.time)
          .sort((a, b) => a.time - b.time)[0];
        if (nextNote) {
          const maxDur = Math.max(100, nextNote.time - ptr.stretchingNote.time - 50);
          rawDurMs = Math.min(rawDurMs, maxDur);
        }
        ptr.stretchingNote.duration = rawDurMs;
        this.updateStats();
        return;
      }

      // Arrastre de nota existente
      if (ptr.type === 'existing_note' && ptr.isDraggingNote && ptr.targetNote) {
        const newLane = Math.max(0, Math.min(2, Math.floor(x / laneWidth)));
        const timeOffset = (hitLineY - y) / this.pixelsPerSecond;
        const newSongTime = this.currentSongTime + timeOffset;
        const snappedMs = Math.max(0, Math.round(this.getSnappedTime(newSongTime) * 1000));

        if (this.canPlaceNote(newLane, snappedMs, ptr.targetNote.duration || 0, ptr.targetNote)) {
          ptr.targetNote.lane = newLane;
          ptr.targetNote.time = snappedMs;
        }
        return;
      }

      // Detección de Swipe sobre nueva nota
      if (ptr.type === 'new_note') {
        ptr.currentX = x;
        ptr.currentY = y;
        const deltaX = x - ptr.startX;
        const deltaY = y - ptr.startY;
        const elapsed = performance.now() - ptr.startTime;

        // Un swipe sólo es un movimiento rápido (<240ms con desplazamiento >25px)
        // Si se mantiene pulsado más de 180ms, se prioriza como HOLD y no se descarta por temblor
        if (elapsed < 240 && (Math.abs(deltaX) > 25 || Math.abs(deltaY) > 25)) {
          ptr.dragged = true;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            ptr.direction = deltaX > 0 ? 'right' : 'left';
          } else {
            ptr.direction = deltaY > 0 ? 'down' : 'up';
          }
        }
      }
    });

    // --- POINTER UP ---
    const handlePointerUp = (e) => {
      try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) {}

      if (this.isDraggingStartMarker && this.markerDragPointerId === e.pointerId) {
        this.isDraggingStartMarker = false;
        this.markerDragPointerId = null;
        this.updateMarkerUI();
        showSuccessToast(`🏁 Comienzo: ${(this.startMarkerMs / 1000).toFixed(2)}s`);
        return;
      }

      if (this.isDraggingEndMarker && this.markerDragPointerId === e.pointerId) {
        this.isDraggingEndMarker = false;
        this.markerDragPointerId = null;
        this.updateMarkerUI();
        showSuccessToast(`🛑 Final: ${(this.endMarkerMs / 1000).toFixed(2)}s`);
        return;
      }

      if (this.isDraggingGrid && this.gridDragPointerId === e.pointerId) {
        this.isDraggingGrid = false;
        this.gridDragPointerId = null;
        return;
      }

      const ptr = this.activePointers.get(e.pointerId);
      if (!ptr) return;

      if (ptr.dragNoteTimer) {
        clearTimeout(ptr.dragNoteTimer);
        ptr.dragNoteTimer = null;
      }

      this.activePointers.delete(e.pointerId);

      if (ptr.type === 'stretch_hold') {
        this.notes.sort((a, b) => a.time - b.time);
        this.updateStats();
        return;
      }

      if (ptr.type === 'existing_note') {
        if (ptr.isDraggingNote) {
          ptr.targetNote.time = Math.round(this.getSnappedTime(ptr.targetNote.time / 1000) * 1000);
          this.notes.sort((a, b) => a.time - b.time);
          this.updateStats();
        } else {
          // Tap rápido sobre la nota para eliminarla o rotar swipe
          const touchDurationMs = performance.now() - ptr.startTime;
          if (touchDurationMs < 250 && !ptr.dragged) {
            const idx = this.notes.indexOf(ptr.targetNote);
            if (idx !== -1) {
              if (ptr.targetNote.type === 'swipe' && this.activeTool === 'swipe') {
                const rot = { up: 'right', right: 'down', down: 'left', left: 'up' };
                ptr.targetNote.direction = rot[ptr.targetNote.direction || 'up'] || 'up';
              } else {
                this.notes.splice(idx, 1);
              }
              this.updateStats();
            }
          }
        }
        return;
      }

      if (ptr.type === 'new_note') {
        const touchDurationMs = performance.now() - ptr.startTime;
        const lane = ptr.lane;
        const snappedMs = ptr.startSongTimeMs;

        let noteType = this.activeTool;
        let holdDuration = 0;
        let swipeDir = ptr.direction || 'up';

        if (this.activeTool === 'auto') {
          if (ptr.dragged && touchDurationMs < 250) {
            noteType = 'swipe';
          } else if (touchDurationMs >= 180) {
            noteType = 'hold';
            const snapIntervalMs = ((60 / this.bpm) / (this.snap / 4)) * 1000;
            if (this.isPlaying) {
              const curSongMs = Math.round(this.getSnappedTime(this.currentSongTime) * 1000);
              holdDuration = Math.max(snapIntervalMs, curSongMs - snappedMs);
            } else {
              holdDuration = Math.max(snapIntervalMs, Math.round(touchDurationMs / snapIntervalMs) * snapIntervalMs);
            }
            if (holdDuration < 150) holdDuration = 250;
          } else {
            noteType = 'tap';
          }
        } else if (this.activeTool === 'hold') {
          noteType = 'hold';
          const snapIntervalMs = ((60 / this.bpm) / (this.snap / 4)) * 1000;
          if (this.isPlaying) {
            const curSongMs = Math.round(this.getSnappedTime(this.currentSongTime) * 1000);
            holdDuration = Math.max(snapIntervalMs, curSongMs - snappedMs);
          } else {
            holdDuration = Math.max(snapIntervalMs, Math.round(touchDurationMs / snapIntervalMs) * snapIntervalMs);
          }
          if (holdDuration < 150) holdDuration = Math.round((60 / this.bpm) * 1000);
        } else if (this.activeTool === 'swipe') {
          noteType = 'swipe';
          swipeDir = ptr.dragged ? ptr.direction : 'up';
        }

        // Limitación anti-colisión: el Hold no puede invadir la siguiente nota del mismo carril
        if (noteType === 'hold') {
          const nextNote = this.notes
            .filter(n => n.lane === lane && n.time > snappedMs)
            .sort((a, b) => a.time - b.time)[0];
          if (nextNote) {
            const maxDur = nextNote.time - snappedMs - 50;
            if (maxDur < 150) {
              noteType = 'tap';
              holdDuration = 0;
            } else {
              holdDuration = Math.min(holdDuration, maxDur);
            }
          }
        }

        // Validación estricta anti-solapamiento antes de insertar
        if (this.canPlaceNote(lane, snappedMs, holdDuration)) {
          this.notes.push({
            lane: lane,
            time: snappedMs,
            type: noteType,
            duration: noteType === 'hold' ? holdDuration : 0,
            direction: swipeDir
          });
          this.notes.sort((a, b) => a.time - b.time);
          this.updateStats();
          if (navigator.vibrate) navigator.vibrate(15);
        }
      }
    };

    this.canvas.addEventListener('pointerup', handlePointerUp);
    this.canvas.addEventListener('pointercancel', handlePointerUp);

    // --- TECLADO MULTI-TECLA CON SOPORTE DE HOLD ---
    const keyLaneMap = {
      'Digit1': 0, 'KeyD': 0, 'KeyJ': 0,
      'Digit2': 1, 'KeyF': 1, 'KeyK': 1,
      'Digit3': 2, 'KeyG': 2, 'KeyL': 2
    };

    window.addEventListener('keydown', (e) => {
      if (typeof currentActiveTab !== 'undefined' && currentActiveTab !== 'editor') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayback();
        return;
      }

      if (e.repeat) return;

      if (keyLaneMap[e.code] !== undefined) {
        if (this.activeKeys.has(e.code)) return;
        const lane = keyLaneMap[e.code];
        const startMs = Math.round(this.getSnappedTime(this.currentSongTime) * 1000);
        this.activeKeys.set(e.code, {
          code: e.code,
          lane: lane,
          startMs: startMs,
          startTime: performance.now()
        });
      }
    });

    window.addEventListener('keyup', (e) => {
      if (typeof currentActiveTab !== 'undefined' && currentActiveTab !== 'editor') return;

      const keyState = this.activeKeys.get(e.code);
      if (!keyState) return;
      this.activeKeys.delete(e.code);

      const touchDurationMs = performance.now() - keyState.startTime;
      const lane = keyState.lane;
      const snappedMs = keyState.startMs;

      let noteType = this.activeTool;
      let holdDuration = 0;

      if (this.activeTool === 'auto') {
        if (touchDurationMs >= 180) {
          noteType = 'hold';
          const snapIntervalMs = ((60 / this.bpm) / (this.snap / 4)) * 1000;
          if (this.isPlaying) {
            const curSongMs = Math.round(this.getSnappedTime(this.currentSongTime) * 1000);
            holdDuration = Math.max(snapIntervalMs, curSongMs - snappedMs);
          } else {
            holdDuration = Math.max(snapIntervalMs, Math.round(touchDurationMs / snapIntervalMs) * snapIntervalMs);
          }
          if (holdDuration < 150) holdDuration = 250;
        } else {
          noteType = 'tap';
        }
      } else if (this.activeTool === 'hold') {
        noteType = 'hold';
        const snapIntervalMs = ((60 / this.bpm) / (this.snap / 4)) * 1000;
        if (this.isPlaying) {
          const curSongMs = Math.round(this.getSnappedTime(this.currentSongTime) * 1000);
          holdDuration = Math.max(snapIntervalMs, curSongMs - snappedMs);
        } else {
          holdDuration = Math.max(snapIntervalMs, Math.round(touchDurationMs / snapIntervalMs) * snapIntervalMs);
        }
        if (holdDuration < 150) holdDuration = Math.round((60 / this.bpm) * 1000);
      } else if (this.activeTool === 'swipe') {
        noteType = 'swipe';
      }

      // Clamping anti-solapamiento de holds por teclado
      if (noteType === 'hold') {
        const nextNote = this.notes
          .filter(n => n.lane === lane && n.time > snappedMs)
          .sort((a, b) => a.time - b.time)[0];
        if (nextNote) {
          const maxDur = nextNote.time - snappedMs - 50;
          if (maxDur < 150) {
            noteType = 'tap';
            holdDuration = 0;
          } else {
            holdDuration = Math.min(holdDuration, maxDur);
          }
        }
      }

      if (this.canPlaceNote(lane, snappedMs, holdDuration)) {
        this.notes.push({
          lane: lane,
          time: snappedMs,
          type: noteType,
          duration: noteType === 'hold' ? holdDuration : 0,
          direction: 'up'
        });
        this.notes.sort((a, b) => a.time - b.time);
        this.updateStats();
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * (60 / this.bpm) / 4;
      this.seek(this.currentSongTime + delta);
    }, { passive: false });
  },

  updateStats() {
    const countEl = document.getElementById('edNoteCount');
    if (countEl) countEl.innerText = `${this.notes.length} Notas`;
  },

  seek(targetSeconds) {
    this.currentSongTime = Math.max(0, Math.min(this.duration || 300, targetSeconds));
    if (this.audioElement) {
      this.audioElement.currentTime = this.currentSongTime;
    }
    const scrubber = document.getElementById('edTimelineScrubber');
    if (scrubber && this.duration > 0) {
      scrubber.value = (this.currentSongTime / this.duration) * 100;
    }
  },

  seekFraction(pct) {
    if (this.duration > 0) {
      this.seek((parseFloat(pct) / 100) * this.duration);
    }
  },

  togglePlayback() {
    if (!this.audioBuffer && !this.audioElement) {
      showErrorToast('Carga un archivo de audio primero.');
      return;
    }
    if (this.isPlaying) this.pause();
    else this.play();
  },

  play() {
    if (this.isPlaying || (!this.audioBuffer && !this.audioElement)) return;
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.duration || 300, this.currentSongTime));
      this.audioElement.playbackRate = this.playbackRate;
      this.audioElement.preservesPitch = true;
      this.audioElement.mozPreservesPitch = true;
      this.audioElement.webkitPreservesPitch = true;
      this.audioElement.play().catch(err => {
        console.warn('Fallo al reproducir con AudioElement, usando fallback:', err);
        this.playFallbackWebAudio();
      });
    } else {
      this.playFallbackWebAudio();
    }

    this.isPlaying = true;
    const playBtn = document.getElementById('edBtnPlay');
    if (playBtn) playBtn.innerHTML = '<span>⏸</span>';
  },

  playFallbackWebAudio() {
    if (this.audioSourceNode) {
      try { this.audioSourceNode.stop(); this.audioSourceNode.disconnect(); } catch (e) {}
    }
    this.audioSourceNode = this.audioCtx.createBufferSource();
    this.audioSourceNode.buffer = this.audioBuffer;
    this.audioSourceNode.playbackRate.value = this.playbackRate;
    this.audioSourceNode.connect(this.audioCtx.destination);
    this.playbackStartTime = this.audioCtx.currentTime - (this.currentSongTime / this.playbackRate);
    this.audioSourceNode.start(0, this.currentSongTime);
  },

  pause() {
    if (!this.isPlaying) return;
    if (this.audioElement) {
      try { this.audioElement.pause(); } catch (e) {}
    }
    if (this.audioSourceNode) {
      try {
        this.audioSourceNode.stop();
        this.audioSourceNode.disconnect();
      } catch (e) {}
      this.audioSourceNode = null;
    }
    this.isPlaying = false;
    const playBtn = document.getElementById('edBtnPlay');
    if (playBtn) playBtn.innerHTML = '<span>▶</span>';
  },

  renderLoop() {
    if (this.isPlaying) {
      if (this.audioElement && !this.audioElement.paused) {
        this.currentSongTime = this.audioElement.currentTime;
      } else if (this.audioCtx && this.playbackStartTime) {
        this.currentSongTime = (this.audioCtx.currentTime - this.playbackStartTime) * this.playbackRate;
      }
      if (this.currentSongTime >= this.duration) {
        this.pause();
        this.currentSongTime = this.duration;
      }
      const scrubber = document.getElementById('edTimelineScrubber');
      if (scrubber && this.duration > 0) {
        scrubber.value = (this.currentSongTime / this.duration) * 100;
      }
    }

    this.draw();
    requestAnimationFrame(() => this.renderLoop());
  },

  draw() {
    if (!this.ctx || !this.canvas) return;

    this.resizeCanvas();

    const w = this.canvas.clientWidth || 320;
    const h = this.canvas.clientHeight || 550;
    if (w === 0 || h === 0) return;

    const is3D = (typeof localStorage !== 'undefined' ? localStorage.getItem('beatstar_visual_dimension') : null) !== '2d';

    if (is3D) {
      // 1. Fondo de ébano pulido de estudio acústico con sutil veteado
      this.ctx.fillStyle = '#0a080d';
      this.ctx.fillRect(0, 0, w, h);
      const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0.0, 'rgba(25, 18, 29, 0.45)');
      bgGrad.addColorStop(0.4, 'rgba(12, 9, 15, 0.2)');
      bgGrad.addColorStop(0.85, 'rgba(6, 4, 8, 0.65)');
      bgGrad.addColorStop(1.0, 'rgba(3, 2, 4, 0.95)');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, w, h);
    } else {
      this.ctx.fillStyle = '#08050e';
      this.ctx.fillRect(0, 0, w, h);
    }

    const laneWidth = w / 3;
    const hitLineY = h - 50;

    // Carriles
    for (let i = 0; i < 3; i++) {
      if (is3D) {
        this.ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(i * laneWidth, 0, laneWidth, h);

        this.ctx.fillStyle = 'rgba(243, 215, 145, 0.65)';
        this.ctx.font = 'bold 11px "Cinzel", "Playfair Display", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Carril ${i + 1}`, i * laneWidth + laneWidth / 2, h - 18);
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(i * laneWidth, 0, laneWidth, h);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Carril ${i + 1}`, i * laneWidth + laneWidth / 2, h - 18);
      }
    }

    // Rejilla de compases proyectada con firstBeatOffsetMs
    const beatSec = 60 / this.bpm;
    const snapSec = beatSec / (this.snap / 4);
    const offsetSec = (this.firstBeatOffsetMs || 0) / 1000;
    const startSec = Math.max(0, this.currentSongTime - 0.5);
    const endSec = this.currentSongTime + (h / this.pixelsPerSecond) + 0.5;

    const firstSnap = Math.floor((startSec - offsetSec) / snapSec);
    const lastSnap = Math.ceil((endSec - offsetSec) / snapSec);

    for (let idx = firstSnap; idx <= lastSnap; idx++) {
      const snapTime = (idx * snapSec) + offsetSec;
      const y = hitLineY - (snapTime - this.currentSongTime) * this.pixelsPerSecond;

      if (y < 0 || y > h) continue;

      const isFullBeat = (idx % (this.snap / 4)) === 0;
      if (is3D) {
        this.ctx.strokeStyle = isFullBeat ? 'rgba(243, 215, 145, 0.6)' : 'rgba(197, 160, 89, 0.25)';
        this.ctx.lineWidth = isFullBeat ? 2 : 1;
      } else {
        this.ctx.strokeStyle = isFullBeat ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 242, 254, 0.3)';
        this.ctx.lineWidth = isFullBeat ? 2 : 1;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Línea de juicio
    if (is3D) {
      // Fieltro rojo carmesí de apagador de gran piano
      const feltGrad = this.ctx.createLinearGradient(0, hitLineY - 6, 0, hitLineY + 12);
      feltGrad.addColorStop(0.0, '#85141d');
      feltGrad.addColorStop(1.0, '#3f080c');
      this.ctx.fillStyle = feltGrad;
      this.ctx.fillRect(0, hitLineY - 5, w, 14);

      // Riel de latón dorado pulido
      this.ctx.strokeStyle = '#d4af37';
      this.ctx.lineWidth = 3.5;
      this.ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(0, hitLineY);
      this.ctx.lineTo(w, hitLineY);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    } else {
      this.ctx.strokeStyle = '#ff007f';
      this.ctx.lineWidth = 3.5;
      this.ctx.shadowColor = '#ff007f';
      this.ctx.shadowBlur = 12;
      this.ctx.beginPath();
      this.ctx.moveTo(0, hitLineY);
      this.ctx.lineTo(w, hitLineY);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    // Dibujar notas
    for (const note of this.notes) {
      const noteTimeSec = note.time / 1000;
      const y = hitLineY - (noteTimeSec - this.currentSongTime) * this.pixelsPerSecond;
      const x = note.lane * laneWidth + 8;
      const noteW = laneWidth - 16;

      if (y < -200 || y > h + 100) continue;

      let isBeingDragged = false;
      for (const p of this.activePointers.values()) {
        if (p.type === 'existing_note' && p.isDraggingNote && p.targetNote === note) {
          isBeingDragged = true;
          break;
        }
      }

      // Render Hold Tail & Stretch Handle
      if (note.type === 'hold') {
        const holdHeight = ((note.duration || 600) / 1000) * this.pixelsPerSecond;
        const tailY = y - holdHeight;

        if (is3D) {
          // Cinta de resonancia acústica dorada
          const holdGrad = this.ctx.createLinearGradient(0, tailY, 0, y);
          holdGrad.addColorStop(0, 'rgba(212, 175, 55, 0.35)');
          holdGrad.addColorStop(1, 'rgba(212, 175, 55, 0.65)');
          this.ctx.fillStyle = holdGrad;
          this.ctx.fillRect(x + 6, tailY, noteW - 12, holdHeight);

          // Rieles de latón en los bordes
          this.ctx.strokeStyle = 'rgba(243, 215, 145, 0.85)';
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(x + 6, tailY, noteW - 12, holdHeight);

          // Barra superior de la cola
          this.ctx.fillStyle = '#d4af37';
          this.ctx.fillRect(x + 4, tailY - 3, noteW - 8, 6);

          // Handle circular en latón
          const handleX = note.lane * laneWidth + laneWidth / 2;
          this.ctx.fillStyle = '#f3d791';
          this.ctx.beginPath();
          this.ctx.arc(handleX, tailY, 7, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          this.ctx.fillStyle = '#08050e';
          this.ctx.beginPath();
          this.ctx.arc(handleX, tailY, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          this.ctx.fillStyle = 'rgba(0, 242, 254, 0.45)';
          this.ctx.fillRect(x + 6, tailY, noteW - 12, holdHeight);

          // Barra superior de la cola
          this.ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
          this.ctx.fillRect(x + 4, tailY - 3, noteW - 8, 6);

          // Manipulador circular interactivo (Handle) en la cola superior
          const handleX = note.lane * laneWidth + laneWidth / 2;
          this.ctx.fillStyle = '#00f2fe';
          this.ctx.beginPath();
          this.ctx.arc(handleX, tailY, 7, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // Punto interior del handle
          this.ctx.fillStyle = '#08050e';
          this.ctx.beginPath();
          this.ctx.arc(handleX, tailY, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Cabeza de la nota
      if (is3D) {
        if (note.type === 'swipe') {
          // Tecla de esmalte carmesí con bisel rubí
          const swipeGrad = this.ctx.createLinearGradient(0, y - 9, 0, y + 9);
          swipeGrad.addColorStop(0, '#c5283d');
          swipeGrad.addColorStop(1, '#6a0d18');
          this.ctx.fillStyle = isBeingDragged ? '#ffffff' : swipeGrad;
          this.ctx.beginPath();
          if (this.ctx.roundRect) this.ctx.roundRect(x, y - 9, noteW, 18, 5);
          else this.ctx.rect(x, y - 9, noteW, 18);
          this.ctx.fill();

          // Labio inferior
          this.ctx.fillStyle = '#3f060d';
          this.ctx.fillRect(x + 2, y + 6, noteW - 4, 3);
        } else {
          // Tecla de marfil acústico con bisel 3D
          const ivoryGrad = this.ctx.createLinearGradient(0, y - 9, 0, y + 9);
          ivoryGrad.addColorStop(0, '#ffffff');
          ivoryGrad.addColorStop(0.3, '#fdfbf7');
          ivoryGrad.addColorStop(1, '#e5dcc7');
          this.ctx.fillStyle = isBeingDragged ? '#ffffff' : ivoryGrad;
          this.ctx.beginPath();
          if (this.ctx.roundRect) this.ctx.roundRect(x, y - 9, noteW, 18, 5);
          else this.ctx.rect(x, y - 9, noteW, 18);
          this.ctx.fill();

          // Labio de sombra inferior (madera oscura)
          this.ctx.fillStyle = '#9e8d75';
          this.ctx.fillRect(x + 2, y + 6, noteW - 4, 3);

          // Línea táctil de latón incrustado
          this.ctx.fillStyle = (note.type === 'hold') ? 'rgba(212, 175, 55, 0.9)' : 'rgba(197, 160, 89, 0.75)';
          this.ctx.fillRect(x + 10, y - 1, noteW - 20, 2);
        }
      } else {
        this.ctx.fillStyle = isBeingDragged ? '#ffffff' : (note.type === 'swipe' ? '#ff007f' : (note.type === 'hold' ? '#00f2fe' : '#ffd700'));
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
          this.ctx.roundRect(x, y - 9, noteW, 18, 6);
        } else {
          this.ctx.rect(x, y - 9, noteW, 18);
        }
        this.ctx.fill();
      }

      // Flecha direccionada de Swipe (←, →, ↑, ↓)
      if (note.type === 'swipe') {
        this.ctx.fillStyle = is3D ? '#ffd700' : '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        const dir = note.direction || 'up';
        const arrow = dir === 'left' ? '←' : (dir === 'right' ? '→' : (dir === 'down' ? '↓' : '↑'));
        this.ctx.fillText(arrow, x + noteW / 2, y + 4);
      }
    }

    // Visualización en tiempo real de notas Hold estirándose bajo dedos o teclas simultáneas
    const activeHolds = [];
    for (const ptr of this.activePointers.values()) {
      if (ptr.type === 'new_note' && !ptr.dragged) {
        activeHolds.push({
          lane: ptr.lane,
          startTime: ptr.startTime,
          startSongTimeMs: ptr.startSongTimeMs
        });
      }
    }
    for (const key of this.activeKeys.values()) {
      activeHolds.push({
        lane: key.lane,
        startTime: key.startTime,
        startSongTimeMs: key.startMs
      });
    }

    for (const hold of activeHolds) {
      const elapsedMs = performance.now() - hold.startTime;
      const curLane = hold.lane;
      const noteX = curLane * laneWidth + 8;
      const noteW = laneWidth - 16;
      const headY = hitLineY;

      // Si se mantiene pulsado >= 160 ms, se visualiza el cuerpo del hold formándose en vivo
      if (elapsedMs >= 160) {
        let liveDurMs = 0;
        if (this.isPlaying) {
          const curSongMs = Math.round(this.getSnappedTime(this.currentSongTime) * 1000);
          liveDurMs = Math.max(150, curSongMs - hold.startSongTimeMs);
        } else {
          const snapIntervalMs = ((60 / this.bpm) / (this.snap / 4)) * 1000;
          liveDurMs = Math.max(snapIntervalMs, Math.round(elapsedMs / snapIntervalMs) * snapIntervalMs);
        }

        // Clampear para que no sobrepase la siguiente nota
        const nextNote = this.notes
          .filter(n => n.lane === curLane && n.time > hold.startSongTimeMs)
          .sort((a, b) => a.time - b.time)[0];
        if (nextNote) {
          const maxDur = Math.max(100, nextNote.time - hold.startSongTimeMs - 50);
          liveDurMs = Math.min(liveDurMs, maxDur);
        }

        const liveHeight = (liveDurMs / 1000) * this.pixelsPerSecond;
        const tailY = headY - liveHeight;

        // Cola translúcida con degradado
        const grad = this.ctx.createLinearGradient(0, headY, 0, tailY);
        if (is3D) {
          grad.addColorStop(0, 'rgba(212, 175, 55, 0.7)');
          grad.addColorStop(1, 'rgba(212, 175, 55, 0.25)');
          this.ctx.fillStyle = grad;
          this.ctx.fillRect(noteX + 6, tailY, noteW - 12, liveHeight);

          // Barra superior de la cola
          this.ctx.fillStyle = '#d4af37';
          this.ctx.fillRect(noteX + 4, tailY - 3, noteW - 8, 6);
        } else {
          grad.addColorStop(0, 'rgba(0, 242, 254, 0.7)');
          grad.addColorStop(1, 'rgba(0, 242, 254, 0.25)');
          this.ctx.fillStyle = grad;
          this.ctx.fillRect(noteX + 6, tailY, noteW - 12, liveHeight);

          // Barra superior de la cola
          this.ctx.fillStyle = '#00f2fe';
          this.ctx.fillRect(noteX + 4, tailY - 3, noteW - 8, 6);
        }
      }

      // Cabeza de la nota pulsada sobre la línea de juicio
      if (is3D) {
        const ivoryGrad = this.ctx.createLinearGradient(0, headY - 9, 0, headY + 9);
        ivoryGrad.addColorStop(0, '#ffffff');
        ivoryGrad.addColorStop(0.3, '#fdfbf7');
        ivoryGrad.addColorStop(1, '#e5dcc7');
        this.ctx.fillStyle = ivoryGrad;
        this.ctx.beginPath();
        if (this.ctx.roundRect) this.ctx.roundRect(noteX, headY - 9, noteW, 18, 5);
        else this.ctx.rect(noteX, headY - 9, noteW, 18);
        this.ctx.fill();

        // Labio de sombra inferior
        this.ctx.fillStyle = '#9e8d75';
        this.ctx.fillRect(noteX + 2, headY + 6, noteW - 4, 3);

        // Efecto sutil de iluminación en el carril
        this.ctx.fillStyle = 'rgba(212, 175, 55, 0.16)';
        this.ctx.fillRect(curLane * laneWidth, 0, laneWidth, h);
      } else {
        this.ctx.fillStyle = elapsedMs >= 160 ? '#00f2fe' : '#ffd700';
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
          this.ctx.roundRect(noteX, headY - 9, noteW, 18, 6);
        } else {
          this.ctx.rect(noteX, headY - 9, noteW, 18);
        }
        this.ctx.fill();

        // Efecto sutil de iluminación en el carril
        this.ctx.fillStyle = 'rgba(255, 0, 127, 0.18)';
        this.ctx.fillRect(curLane * laneWidth, 0, laneWidth, h);
      }
    }

    // Dibujar Marcador de Inicio (Comienzo) abarcando las 3 casillas
    if (this.startMarkerMs !== null && this.startMarkerMs !== undefined) {
      const markerSec = this.startMarkerMs / 1000;
      const markerY = hitLineY - (markerSec - this.currentSongTime) * this.pixelsPerSecond;
      if (markerY >= -40 && markerY <= h + 40) {
        this.ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        this.ctx.fillRect(0, markerY - 11, w, 22);
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, markerY - 11, w, 22);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🏁 COMIENZO DE LA PISTA (${markerSec.toFixed(2)}s)`, w / 2, markerY + 4);
      }
    }

    // Dibujar Marcador de Fin (Final) abarcando las 3 casillas
    if (this.endMarkerMs !== null && this.endMarkerMs !== undefined) {
      const markerSec = this.endMarkerMs / 1000;
      const markerY = hitLineY - (markerSec - this.currentSongTime) * this.pixelsPerSecond;
      if (markerY >= -40 && markerY <= h + 40) {
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.40)';
        this.ctx.fillRect(0, markerY - 11, w, 22);
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, markerY - 11, w, 22);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`🛑 FINAL DE LA PISTA (${markerSec.toFixed(2)}s)`, w / 2, markerY + 4);
      }
    }

    // Reloj
    const timeEl = document.getElementById('edCurrentTime');
    if (timeEl) {
      const mins = Math.floor(this.currentSongTime / 60);
      const secs = (this.currentSongTime % 60).toFixed(2).padStart(5, '0');
      timeEl.innerText = `${mins}:${secs}`;
    }
  },

  clearAllNotes() {
    if (confirm('¿Borrar todas las notas creadas?')) {
      this.notes = [];
      this.updateStats();
    }
  },

  createBeatmapPackage(title, artist) {
    const diffConfig = DIFFICULTY_PRESETS[this.difficultyPreset] || DIFFICULTY_PRESETS['Media'];

    const formattedNotes = this.notes.map((n, i) => {
      let rawTime = Number(n.time !== undefined ? n.time : (n.timeMs !== undefined ? n.timeMs : n.timestamp_ms));
      if (!Number.isFinite(rawTime)) rawTime = 0;
      const timeMs = Math.round(rawTime > 100 ? rawTime : rawTime * 1000);
      const timeSec = timeMs / 1000;

      let rawDur = Number(n.duration_ms !== undefined ? n.duration_ms : (n.holdDuration !== undefined ? n.holdDuration : n.duration));
      if (!Number.isFinite(rawDur) || rawDur < 0) rawDur = 0;
      const isHold = n.type === 'hold' || rawDur > 0;
      const durMs = isHold ? Math.round(rawDur > 50 ? rawDur : (rawDur > 0 ? rawDur * 1000 : 600)) : 0;
      const durSec = durMs / 1000;

      const laneIdx = Math.max(0, Math.min(2, parseInt(n.lane !== undefined ? n.lane : (n.column !== undefined ? n.column : 0), 10) || 0));
      const typeStr = n.type === 'swipe' ? 'swipe' : (isHold ? 'hold' : 'tap');
      const dirStr = n.direction || 'up';

      return {
        id: i,
        lane: laneIdx,
        column: laneIdx,
        track: laneIdx,
        time: timeSec,
        timeSec: timeSec,
        timeMs: timeMs,
        timestamp: timeMs,
        timestamp_ms: timeMs,
        type: typeStr,
        duration: durSec,
        duration_ms: durMs,
        holdDuration: durSec,
        end_timestamp_ms: typeStr === 'hold' ? (timeMs + Math.max(150, durMs)) : null,
        direction: dirStr,
        swipeDirection: dirStr
      };
    });

    formattedNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    const lastNoteTime = formattedNotes.length > 0
      ? Math.max(...formattedNotes.map(n => n.end_timestamp_ms || n.timestamp_ms))
      : 0;
    const resolvedEndMs = (this.endMarkerMs !== null && this.endMarkerMs !== undefined)
      ? this.endMarkerMs
      : (lastNoteTime + 1500);

    const chartId = 'custom_' + Date.now();
    return {
      id: chartId,
      is_community: true,
      isCommunity: true,
      source: 'community',
      source_name: 'Comunidad',
      metadata: {
        id: chartId,
        title: title || 'Pista Creada',
        artist: artist || 'Usuario',
        difficulty_name: this.difficultyPreset,
        bpm: Number(this.bpm) || 120,
        stars: diffConfig.stars,
        is_community: true,
        isCommunity: true,
        source: 'community',
        source_name: 'Comunidad'
      },
      bpm: Number(this.bpm) || 120,
      offset: Number(this.firstBeatOffsetMs) || 0,
      firstBeatOffsetMs: Number(this.firstBeatOffsetMs) || 0,
      scrollDurationMs: diffConfig.scrollDurationMs,
      startMarkerMs: this.startMarkerMs || 0,
      endMarkerMs: resolvedEndMs,
      endTimestampMs: resolvedEndMs,
      notes: formattedNotes,
      audioBlob: this.audioBlob,
      difficulties: [{
        id: 'custom_diff',
        name: this.difficultyPreset,
        stars: diffConfig.stars,
        keys: 3,
        notes: formattedNotes
      }]
    };
  },

  async playtest() {
    if (!this.audioBlob || this.notes.length === 0) {
      showErrorToast('Carga un audio y añade varias notas antes de probar.');
      return;
    }

    this.pause();
    window.isPlaytestingFromEditor = true;
    const title = document.getElementById('edSongTitle')?.value || 'Pista de Prueba';
    const artist = document.getElementById('edSongArtist')?.value || 'Editor';

    const testPackage = this.createBeatmapPackage(title, artist);
    startGame(testPackage, this.audioBlob, this.difficultyPreset);
  },

  async saveToLibrary() {
    if (!this.audioBlob || this.notes.length === 0) {
      showErrorToast('Añade un archivo de audio y notas para guardar la pista.');
      return;
    }

    const title = document.getElementById('edSongTitle')?.value || 'Mi Pista Creada';
    const artist = document.getElementById('edSongArtist')?.value || 'Comunidad';

    const unpackedData = this.createBeatmapPackage(title, artist);
    const chartId = unpackedData.id;

    const chartItem = {
      id: chartId,
      source: 'community',
      source_name: 'Mi Creación',
      is_community: true,
      isCommunity: true,
      title: title,
      artist: artist,
      creator: localStorage.getItem('beatstar_player_nickname') || localStorage.getItem('beatstar_creator_name') || 'Tú',
      thumbnail: typeof GENERIC_THUMBNAIL !== 'undefined' ? GENERIC_THUMBNAIL : '',
      bpm: this.bpm,
      notes: unpackedData.notes,
      difficulties: unpackedData.difficulties
    };

    if (typeof IndexedDBStorage !== 'undefined') {
      await IndexedDBStorage.saveChart(chartItem, unpackedData, this.audioBlob);
    }
    showSuccessToast(`¡Pista "${title}" guardada en Mi Biblioteca!`);
    switchMainTab('library');
  },

  openPublishModal() {
    if (!this.audioBlob || this.notes.length === 0) {
      showErrorToast('Carga un audio y añade notas antes de publicar.');
      return;
    }

    const title = document.getElementById('edSongTitle')?.value || 'Mi Pista Creada';
    const artist = document.getElementById('edSongArtist')?.value || 'Comunidad';

    const modalTitle = document.getElementById('pubModalTitle');
    if (modalTitle) modalTitle.value = title;
    const modalArtist = document.getElementById('pubModalArtist');
    if (modalArtist) modalArtist.value = artist;

    const creatorInput = document.getElementById('pubModalCreator');
    if (creatorInput) {
      creatorInput.value = localStorage.getItem('beatstar_player_nickname') || localStorage.getItem('beatstar_creator_name') || 'Charter';
    }

    const modalDiff = document.getElementById('pubModalDiff');
    if (modalDiff) modalDiff.value = this.difficultyPreset;

    const modal = document.getElementById('publishCommunityModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
  },

  closePublishModal() {
    const modal = document.getElementById('publishCommunityModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('open');
      modal.style.display = 'none';
    }
  },

  async confirmPublish() {
    const title = document.getElementById('pubModalTitle')?.value.trim() || 'Mi Pista Creada';
    const artist = document.getElementById('pubModalArtist')?.value.trim() || 'Comunidad';
    const creator = document.getElementById('pubModalCreator')?.value.trim() || 'Charter';
    const diff = document.getElementById('pubModalDiff')?.value || this.difficultyPreset;

    localStorage.setItem('beatstar_creator_name', creator);
    localStorage.setItem('beatstar_player_nickname', creator);
    this.setDifficulty(diff);

    const unpackedData = this.createBeatmapPackage(title, artist);
    const diffConfig = DIFFICULTY_PRESETS[diff] || DIFFICULTY_PRESETS['Media'];
    const tempChartId = unpackedData.id;

    // 1. Preparar subida a la nube si hay backend disponible
    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('creator_name', creator);
    formData.append('bpm', this.bpm);
    formData.append('offset_ms', this.firstBeatOffsetMs);
    formData.append('difficulty_name', diff);
    formData.append('stars', diffConfig.stars);
    formData.append('scroll_duration_ms', diffConfig.scrollDurationMs);
    formData.append('chart_json', JSON.stringify(unpackedData));

    if (this.audioBlob) {
      formData.append('audio_file', this.audioBlob, 'audio.mp3');
    }

    const publishBtn = document.getElementById('btnConfirmPublish');
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerText = 'Publicando...';
    }

    let publishedChartId = null;
    let cloudOk = false;
    try {
      const baseUrl = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '';
      if (baseUrl) {
        const response = await fetch(`${baseUrl}/api/v1/community/charts/publish`, {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          const pubData = await response.json();
          if (pubData && pubData.chart_id) {
            publishedChartId = pubData.chart_id;
            cloudOk = true;
          }
        }
      }
    } catch (err) {
      console.warn('Subida cloud no disponible (modo local activo):', err);
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerText = '🚀 Publicar Ahora';
      }
    }

    // Usar el ID oficial generado por el servidor si la subida fue exitosa; si no, usar el ID local temporal
    const finalChartId = publishedChartId || tempChartId;

    unpackedData.id = finalChartId;
    if (unpackedData.metadata) unpackedData.metadata.id = finalChartId;
    unpackedData.communityChartId = finalChartId;

    const chartItem = {
      id: finalChartId,
      source: 'community',
      source_name: 'Comunidad',
      title: title,
      artist: artist,
      creator: creator,
      creator_name: creator,
      difficulty_name: diff,
      stars: diffConfig.stars,
      bpm: this.bpm,
      likes_count: 1,
      rating_avg: 5.0,
      votes_count: 0,
      play_count: 0,
      created_at: new Date().toISOString(),
      thumbnail: typeof GENERIC_THUMBNAIL !== 'undefined' ? GENERIC_THUMBNAIL : '',
      notes: unpackedData.notes,
      difficulties: unpackedData.difficulties,
      chartData: unpackedData
    };

    // 2. Guardar en IndexedDB con el ID canónico definitivo y audio listo
    if (typeof IndexedDBStorage !== 'undefined') {
      try {
        await IndexedDBStorage.saveChart(chartItem, unpackedData, this.audioBlob);
        if (publishedChartId && publishedChartId !== tempChartId) {
          IndexedDBStorage.deleteChart(tempChartId).catch(() => {});
        }
      } catch (err) {
        console.warn('Error guardando en IndexedDB:', err);
      }
    }

    // 3. Guardar SIEMPRE una copia permanente en la bóveda de creaciones del usuario
    // Esta bóveda nunca se purga y garantiza que el usuario jamás pierda sus pistas creadas
    try {
      const myVault = JSON.parse(localStorage.getItem('beatstar_my_published_charts') || '[]');
      const cleanVault = myVault.filter(c => c.id !== tempChartId && c.id !== finalChartId && !(c.title?.toLowerCase() === title.toLowerCase() && c.artist?.toLowerCase() === artist.toLowerCase()));
      cleanVault.unshift(chartItem);
      localStorage.setItem('beatstar_my_published_charts', JSON.stringify(cleanVault));
    } catch (e) {}

    // 4. Si la subida a la nube fue exitosa, NO guardarlo en beatstar_community_local_charts para evitar duplicados fantasma.
    // Solo se almacena localmente si la conexión a la nube falló (modo offline).
    try {
      const localCommunity = JSON.parse(localStorage.getItem('beatstar_community_local_charts') || '[]');
      const filtered = localCommunity.filter(c => c.id !== tempChartId && c.id !== finalChartId && !(c.title?.toLowerCase() === title.toLowerCase() && c.artist?.toLowerCase() === artist.toLowerCase()));
      if (!cloudOk) {
        filtered.unshift(chartItem);
      }
      localStorage.setItem('beatstar_community_local_charts', JSON.stringify(filtered));
    } catch (e) {}

    this.closePublishModal();
    if (cloudOk) {
      showSuccessToast('¡Pista subida a la nube comunitaria con éxito!');
    } else {
      showSuccessToast('¡Pista guardada y publicada localmente en Comunidad!');
    }

    // Ir a la pestaña Comunidad
    switchMainTab('search');
    if (typeof switchExploreSubTab === 'function') {
      switchExploreSubTab('community');
    }
  }
};