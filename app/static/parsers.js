/**
 * PARSERS & PACKAGING ENGINE - BEATSTAR 3-LANE ADAPTATION
 * Supports: osu! Mania (.osu / .osz), Clone Hero (.chart / .mid / .sng / .7z / .rar / .zip)
 * Fixed 3-lane remap with polyphonic collision avoidance and hold-tail clearance.
 */

// ==========================================
// 1. DETERMINISTIC 3-LANE REMAPPER & STRICT 2-FINGER COLLISION RESOLVER
// ==========================================

class LaneRemapper {
  /**
   * Remapea un carril de origen (4K, 5K, 6K, 7K) a 3 carriles fijos (0, 1, 2)
   */
  static mapTo3K(originalLane, totalLanes = 4) {
    if (totalLanes <= 3) {
      return Math.min(2, Math.max(0, originalLane));
    }
    if (totalLanes === 4) {
      if (originalLane === 0) return 0; // Izquierda
      if (originalLane === 1 || originalLane === 2) return 1; // Centro
      return 2; // Derecha
    }
    if (totalLanes === 5) {
      if (originalLane === 0) return 0;
      if (originalLane === 1 || originalLane === 2 || originalLane === 3) return 1;
      return 2;
    }
    if (totalLanes === 6) {
      if (originalLane <= 1) return 0;
      if (originalLane <= 3) return 1;
      return 2;
    }
    // 7K y superiores
    const ratio = (originalLane + 0.5) / totalLanes;
    if (ratio <= 0.334) return 0;
    if (ratio <= 0.667) return 1;
    return 2;
  }

  /**
   * Downsampler Rítmico Inteligente y Balanceador de Dificultad para 2 Pulgares
   * Soporta 3 Modos de Dificultad General:
   * - 'hard': Máxima riqueza rítmica, streams y dobles acordes (mínimo gap ~85-90ms)
   * - 'medium': Filtra ráfagas 1/4 y 1/8 a 1/2, elimina acordes en pasajes rápidos (gap ~115ms)
   * - 'easy': Cuantización estricta a 1/1 y 1/2, CERO acordes simultáneos, mínimo gap 230ms
   */
  static thinMultiLaneChart(rawNotes, totalLanes = 4, bpm = 120, stars = 3.0, densityMode = 'hard') {
    if (!rawNotes || rawNotes.length === 0) return [];

    const effectiveBpm = Math.max(60, Math.min(260, bpm || 120));
    const beatDurationMs = 60000 / effectiveBpm;
    const halfBeatMs = beatDurationMs / 2;
    const quarterBeatMs = beatDurationMs / 4;
    const s = Math.max(1.0, Math.min(10.0, parseFloat(stars) || 3.0));

    // 1. Puntuación de importancia musical para cada nota
    const scoredNotes = rawNotes.map(n => {
      const rawT = Number.isFinite(n.timestamp_ms)
        ? n.timestamp_ms
        : (Number.isFinite(n.timeMs)
            ? n.timeMs
            : (Number.isFinite(n.timestamp) ? n.timestamp : (Number.isFinite(n.time) ? (n.time > 100 ? n.time : n.time * 1000) : 0)));
      const t = Math.round(Number.isFinite(rawT) ? rawT : 0);
      const isHold = n.type === 'hold' || (n.duration_ms && n.duration_ms > 140) || (n.duration && n.duration > 0.14) || (n.holdDuration && n.holdDuration > 0.14);

      // Distancia al pulso entero más cercano
      const wholeRem = ((t % beatDurationMs) + beatDurationMs) % beatDurationMs;
      const distWhole = Math.min(wholeRem, beatDurationMs - wholeRem);

      // Distancia al medio pulso más cercano
      const halfRem = ((t % halfBeatMs) + halfBeatMs) % halfBeatMs;
      const distHalf = Math.min(halfRem, halfBeatMs - halfRem);

      // Distancia al cuarto de pulso
      const quartRem = ((t % quarterBeatMs) + quarterBeatMs) % quarterBeatMs;
      const distQuart = Math.min(quartRem, quarterBeatMs - quartRem);

      let score = 10;
      let snapTime = t;

      if (distWhole <= 55) {
        score = 100;
        snapTime = t - wholeRem + (wholeRem > beatDurationMs / 2 ? beatDurationMs : 0);
      } else if (distHalf <= 45) {
        score = 75;
        snapTime = t - halfRem + (halfRem > halfBeatMs / 2 ? halfBeatMs : 0);
      } else if (distQuart <= 35) {
        score = 45;
      }

      if (isHold) score += 30; // Proteger notas sostenidas

      return {
        ...n,
        type: isHold ? 'hold' : (n.type || 'tap'),
        timestamp_ms: Math.round(Number.isFinite(snapTime) ? snapTime : t),
        original_timestamp: t,
        priority: score
      };
    });

    // 2. Ordenar cronológicamente
    scoredNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // 3. Ajuste de parámetros según modo de densidad / dificultad
    let minEventGap = 90;
    let maxChordSize = 2;
    let minChordSpacing = 160;

    if (densityMode === 'easy') {
      minEventGap = 230; // ~230ms mínimo entre notas
      maxChordSize = 1;  // CERO acordes
      minChordSpacing = Infinity;
    } else if (densityMode === 'medium') {
      minEventGap = 130; // ~130ms mínimo entre notas
      maxChordSize = 2;  // Permitir acordes pero espaciados
      minChordSpacing = 280; // Sin dobles en ritmos rápidos
    } else {
      // Hard (Actual)
      minEventGap = Math.max(80, Math.min(180, 180 - (s - 1.0) * 14.0));
      maxChordSize = 2;
      minChordSpacing = 60;
    }

    const thinned = [];
    let lastEventTimestamp = -Infinity;
    let lastChordTimestamp = -Infinity;

    for (let i = 0; i < scoredNotes.length; i++) {
      const n = scoredNotes[i];
      const t = n.timestamp_ms;

      // En modo Fácil: filtrar notas débiles fuera de 1/1 y 1/2
      if (densityMode === 'easy' && n.priority < 70) {
        continue;
      }

      // Manejo de acordes simultáneos (<= 45ms)
      if (Math.abs(t - lastEventTimestamp) <= 45) {
        if (maxChordSize <= 1) {
          continue; // CERO acordes en Fácil
        }
        if (t - lastChordTimestamp < minChordSpacing) {
          continue; // Sin acordes consecutivos rápidos en Medio
        }

        const chordNotes = thinned.filter(prev => Math.abs(prev.timestamp_ms - t) <= 45);
        if (chordNotes.length < maxChordSize && n.priority >= (densityMode === 'medium' ? 75 : 60)) {
          thinned.push(n);
          lastChordTimestamp = t;
        }
        continue;
      }

      const gap = t - lastEventTimestamp;
      if (gap < minEventGap) {
        if (n.priority < 70) continue;
        if (densityMode === 'easy') continue;
        if (densityMode === 'medium' && n.priority < 85) continue;
        if (gap < minEventGap * 0.70) continue;
      }

      // Límite de densidad en ventana móvil de 600ms
      const windowStart = t - 600;
      const notesInRecentWindow = thinned.filter(prev => prev.timestamp_ms >= windowStart);
      const maxWindowEvents = densityMode === 'easy' ? 2 : (densityMode === 'medium' ? 3 : (s <= 3.0 ? 4 : (s <= 5.0 ? 5 : 6)));
      if (notesInRecentWindow.length >= maxWindowEvents && n.priority < 90) {
        continue;
      }

      lastEventTimestamp = t;
      thinned.push(n);
    }

    return thinned;
  }

  /**
   * Sanitizador Universal para 2 Dedos (2 Pulgares en Móvil)
   */
  static sanitizeForTwoFingers(notes, bpm = 120, stars = 3.0, densityMode = 'hard') {
    if (!notes || notes.length === 0) return [];

    const preThinned = this.thinMultiLaneChart(notes, 3, bpm, stars, densityMode);
    const sorted = [...preThinned].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    const maxChordLimit = densityMode === 'easy' ? 1 : 2;

    // 1. Agrupar en acordes instantáneos (<= 45ms)
    const chordGroups = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const anchor = currentGroup[0];
      if (Math.abs(curr.timestamp_ms - anchor.timestamp_ms) <= 45) {
        currentGroup.push(curr);
      } else {
        chordGroups.push(currentGroup);
        currentGroup = [curr];
      }
    }
    if (currentGroup.length > 0) chordGroups.push(currentGroup);

    // 2. En cada acorde: Máximo maxChordLimit notas, cada una en carril distinto
    const pass1Notes = [];
    for (const group of chordGroups) {
      const usedLanes = new Set();
      const kept = [];

      for (const n of group) {
        if (kept.length >= maxChordLimit) break;

        let targetLane = Math.max(0, Math.min(2, n.lane ?? 1));
        if (usedLanes.has(targetLane)) {
          const candidates = targetLane === 1 ? [0, 2] : (targetLane === 0 ? [1, 2] : [1, 0]);
          const free = candidates.find(l => !usedLanes.has(l));
          if (free !== undefined) {
            targetLane = free;
          } else {
            continue;
          }
        }

        usedLanes.add(targetLane);
        n.lane = targetLane;
        kept.push(n);
      }
      pass1Notes.push(...kept);
    }

    // 3. Anti-Jackhammer estricto
    const minSameLaneGap = densityMode === 'easy' ? 250 : (densityMode === 'medium' ? 180 : (stars < 5.0 ? 160 : 130));
    const pass2Notes = [];
    const laneLastHitTime = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < pass1Notes.length; i++) {
      const n = pass1Notes[i];
      const t = n.timestamp_ms;

      const lastSameLaneTime = laneLastHitTime[n.lane];
      if (t - lastSameLaneTime < minSameLaneGap && n.type === 'tap') {
        const candidates = n.lane === 1 ? [0, 2] : (n.lane === 0 ? [1, 2] : [1, 0]);
        let alternated = false;
        for (const alt of candidates) {
          if (t - laneLastHitTime[alt] >= minSameLaneGap) {
            const recentAroundT = pass2Notes.filter(prev => Math.abs(prev.timestamp_ms - t) <= 70);
            const usedLanesAroundT = new Set(recentAroundT.map(r => r.lane));
            if (!usedLanesAroundT.has(alt) && usedLanesAroundT.size < maxChordLimit) {
              n.lane = alt;
              alternated = true;
              break;
            }
          }
        }
        if (!alternated) {
          continue;
        }
      }

      const recent = pass2Notes.filter(prev => Math.abs(prev.timestamp_ms - t) <= 70);
      const recentLanes = new Set(recent.map(r => r.lane));
      if (!recentLanes.has(n.lane) && recentLanes.size >= maxChordLimit) {
        continue;
      }

      laneLastHitTime[n.lane] = t;
      pass2Notes.push(n);
    }

    // 4. Regla Estricta de Holds (Solo laterales 0/2 y Cero Solapamiento)
    return this.enforceStrictLateralHoldsAndAntiOverlap(pass2Notes);
  }

  /**
   * REGLA ESTRICTA DE HOLDS (SOLO LATERALES Y SIN SOLAPAMIENTO):
   * 1. Las notas largas NUNCA se generan en el carril central (1). Se reubican en 0 o 2.
   * 2. Ninguna nota (tap ni hold) puede aparecer en el mismo carril mientras un hold esté activo (+60ms margen).
   * 3. Dos holds nunca se solapan en el mismo carril.
   */
  static enforceStrictLateralHoldsAndAntiOverlap(notes) {
    if (!notes || notes.length === 0) return [];

    const sorted = [...notes].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    const SAFETY_MARGIN_MS = 60; // Margen de seguridad estricto

    const processedHolds = [];
    const nonHoldNotes = [];

    for (const n of sorted) {
      const isHold = n.type === 'hold' || (n.duration_ms && n.duration_ms > 140);
      if (isHold) {
        n.type = 'hold';
        n.duration_ms = Math.max(200, n.duration_ms || 600);
        n.end_timestamp_ms = n.end_timestamp_ms || (n.timestamp_ms + n.duration_ms);
        processedHolds.push(n);
      } else {
        n.type = n.type || 'tap';
        nonHoldNotes.push(n);
      }
    }

    // 1. Asignar Holds estrictamente a carriles laterales (0 o 2) sin solapamiento
    // 1. Asignar Holds estrictamente a carriles laterales (0 o 2) sin solapamiento
    // REGLA: Nunca más de 1 Hold activo simultáneamente en ningún carril (1 dedo fijo)
    const finalHolds = [];
    const holdIntervals = []; // { lane, start, end }

    for (const h of processedHolds) {
      const start = h.timestamp_ms;
      const end = h.end_timestamp_ms || (start + (h.duration_ms || 600));

      // Comprobar si ya existe CUALQUIER hold activo en ese rango de tiempo
      const anyHoldActive = holdIntervals.some(i => !(end + SAFETY_MARGIN_MS <= i.start || start >= i.end + SAFETY_MARGIN_MS));

      if (anyHoldActive) {
        // Ya hay un hold activo -> degradar a tap para no requerir 2 dedos en holds
        h.type = 'tap';
        h.lane = (h.lane === 0 || h.lane === 2) ? h.lane : 1;
        h.duration_ms = 0;
        delete h.end_timestamp_ms;
        nonHoldNotes.push(h);
        continue;
      }

      let prefLane = (h.lane === 0 || h.lane === 2) ? h.lane : null;
      let chosenLane = prefLane !== null ? prefLane : ((Math.floor(start / 1000) % 2 === 0) ? 0 : 2);

      h.lane = chosenLane;
      h.end_timestamp_ms = end;
      h.duration_ms = end - start;
      holdIntervals.push({
        lane: chosenLane,
        start: start,
        end: end
      });
      finalHolds.push(h);
    }

    // 2. Anti-Overlap y Regla Máximo 2 Dedos para Taps/Swipes:
    // - Si hay un Hold activo en tiempo T, en los otros dos carriles SOLO puede haber como MÁXIMO 1 nota a la vez.
    // - Ninguna nota puede caer en el mismo carril del Hold mientras esté activo.
    const finalTaps = [];
    for (const n of nonHoldNotes) {
      const t = n.timestamp_ms;
      const activeHold = holdIntervals.find(h => t >= h.start - 40 && t <= h.end + SAFETY_MARGIN_MS);

      if (activeHold) {
        // 1 dedo ya está ocupado sosteniendo el Hold.
        // En los otros 2 carriles SOLO puede haber como máximo 1 nota en tiempo t.
        const alreadyHasTapDuringHold = finalTaps.some(prev => Math.abs(prev.timestamp_ms - t) <= 60);
        if (alreadyHasTapDuringHold) {
          // Descartar tercera nota concurrente para respetar estrictamente la regla de máximo 2 dedos
          continue;
        }

        // Elegir el carril libre más idóneo (carril 1 o el lateral opuesto al hold)
        const freeLanes = [1, activeHold.lane === 0 ? 2 : 0];
        let targetLane = freeLanes[0];
        if (n.lane === freeLanes[1]) {
          targetLane = freeLanes[1];
        }

        n.lane = targetLane;
        finalTaps.push(n);
        continue;
      }

      // No hay hold activo: procesar con anti-solapamiento regular (máx 2 notas simultáneas)
      let targetLane = Math.max(0, Math.min(2, n.lane ?? 1));
      const tapConflict = finalTaps.some(prev => prev.lane === targetLane && Math.abs(prev.timestamp_ms - t) <= 45);
      if (tapConflict) {
        const freeCandidate = [1, 0, 2].find(l => {
          const hasTap = finalTaps.some(prev => prev.lane === l && Math.abs(prev.timestamp_ms - t) <= 45);
          return !hasTap;
        });
        if (freeCandidate !== undefined) {
          const simultaneousCount = finalTaps.filter(prev => Math.abs(prev.timestamp_ms - t) <= 45).length;
          if (simultaneousCount >= 2) {
            continue; // Descartar para nunca superar 2 dedos
          }
          n.lane = freeCandidate;
        } else {
          continue;
        }
      }

      finalTaps.push(n);
    }

    // 3. Fusionar y estilizar swipes
    const merged = [...finalHolds, ...finalTaps].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    merged.forEach((n, idx) => {
      n.id = idx + 1;
      if (n.type === 'tap' && idx % 22 === 21) {
        n.type = 'swipe';
        if (n.lane === 0) n.direction = 'left';
        else if (n.lane === 2) n.direction = 'right';
        else n.direction = (idx % 2 === 0) ? 'up' : 'down';
      }
    });

    return merged;
  }

  /**
   * Resuelve colisiones iniciales y sanitiza para 2 dedos
   */
  static resolveCollisions(rawNotes, totalLanes = 4, bpm = 120, stars = 3.0, densityMode = 'hard') {
    if (!rawNotes || rawNotes.length === 0) return [];

    // Paso 1: Poda de canales múltiples en 4K/6K/7K
    const thinned = this.thinMultiLaneChart(rawNotes, totalLanes, bpm, stars, densityMode);

    // Paso 2: Mapear carriles a 3K
    const mapped = thinned.map(n => ({
      ...n,
      lane: this.mapTo3K(n.originalLane ?? n.lane, totalLanes)
    }));

    // Paso 3: Sanitización universal a 2 dedos + Holds estrictamente laterales y sin solapamiento
    return this.sanitizeForTwoFingers(mapped, bpm, stars, densityMode);
  }
}

// ==========================================
// 2. PARSER: OSU! MANIA (.osu)
// ==========================================

class OsuManiaParser {
  static parse(osuText) {
    const lines = osuText.split(/\r?\n/);
    let currentSection = '';
    
    let audioFilename = 'audio.mp3';
    let audioLeadIn = 0;
    let title = 'Canción';
    let artist = 'Artista';
    let creator = 'osu! Mapper';
    let version = 'Normal';
    let circleSize = 4; // Columns / Keys
    let overallDifficulty = 5;

    const timingPoints = [];
    const hitObjectsRaw = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
        continue;
      }

      if (currentSection === 'General') {
        const [k, ...v] = line.split(':');
        const key = k.trim();
        const val = v.join(':').trim();
        if (key === 'AudioFilename') audioFilename = val;
        if (key === 'AudioLeadIn') audioLeadIn = parseInt(val, 10) || 0;
      } else if (currentSection === 'Metadata') {
        const [k, ...v] = line.split(':');
        const key = k.trim();
        const val = v.join(':').trim();
        if (key === 'Title') title = val;
        if (key === 'Artist') artist = val;
        if (key === 'Creator') creator = val;
        if (key === 'Version') version = val;
      } else if (currentSection === 'Difficulty') {
        const [k, ...v] = line.split(':');
        const key = k.trim();
        const val = v.join(':').trim();
        if (key === 'CircleSize') circleSize = Math.max(1, parseInt(val, 10) || 4);
        if (key === 'OverallDifficulty') overallDifficulty = parseFloat(val) || 5;
      } else if (currentSection === 'TimingPoints') {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const time = parseFloat(parts[0]);
          const beatLength = parseFloat(parts[1]);
          const uninherited = parts.length > 6 ? parseInt(parts[6], 10) : 1;
          if (uninherited === 1 && beatLength > 0) {
            timingPoints.push({ time, bpm: 60000 / beatLength });
          }
        }
      } else if (currentSection === 'HitObjects') {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const x = parseInt(parts[0], 10);
          const time = parseInt(parts[2], 10);
          const type = parseInt(parts[3], 10);
          
          const originalLane = Math.max(0, Math.min(circleSize - 1, Math.floor((x * circleSize) / 512)));
          const isHold = (type & 128) !== 0;
          let endTime = time;

          if (isHold && parts.length >= 6) {
            const endPart = parts[5].split(':')[0];
            endTime = parseInt(endPart, 10) || (time + 400);
          }

          const duration = Math.max(0, endTime - time);

          hitObjectsRaw.push({
            originalLane: originalLane,
            timestamp_ms: time,
            type: (isHold && duration >= 80) ? 'hold' : 'tap',
            duration_ms: (isHold && duration >= 80) ? duration : null,
            end_timestamp_ms: (isHold && duration >= 80) ? endTime : null
          });
        }
      }
    }

    const bpm = timingPoints.length > 0 ? timingPoints[0].bpm : 120;
    const finalNotes = LaneRemapper.resolveCollisions(hitObjectsRaw, circleSize, Math.round(bpm), overallDifficulty);

    return {
      audioFilename,
      audioLeadIn,
      title,
      artist,
      creator,
      difficultyName: version,
      stars: Math.max(1.0, Math.min(10.0, overallDifficulty)),
      bpm: Math.round(bpm),
      keys: circleSize,
      notes: finalNotes
    };
  }
}

// ==========================================
// 3. HELPER: SONG.INI & MULTIFORMAT ARCHIVE (7z / RAR / ZIP)
// ==========================================

class SongIniParser {
  static parse(iniText) {
    const meta = {};
    if (!iniText) return meta;
    const lines = iniText.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('[') || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
        const val = trimmed.slice(eqIdx + 1).trim();
        meta[key] = val;
      }
    }
    return meta;
  }
}

class ArchiveHelper {
  static is7zOrRar(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 8) return false;
    const bytes = new Uint8Array(arrayBuffer.slice(0, 8));
    // 7z: 37 7a bc af
    if (bytes[0] === 0x37 && bytes[1] === 0x7a && bytes[2] === 0xbc && bytes[3] === 0xaf) return true;
    // Rar: 52 61 72 21
    if (bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72 && bytes[3] === 0x21) return true;
    return false;
  }

  static async extractWithLibarchive(arrayBuffer, onLog = null) {
    const log = (step, title, detail, st = 'info') => {
      if (typeof onLog === 'function') onLog(step, title, detail, st);
      else if (window.VisualLogger && typeof window.VisualLogger.step === 'function') window.VisualLogger.step(step, title, detail, st);
    };

    if (typeof Archive === 'undefined') {
      log(4, 'Módulo libarchive no encontrado', 'window.Archive no está inicializado en la página.', 'error');
      throw new Error('libarchive.js / WebAssembly no está disponible en el cliente.');
    }

    try {
      const workerUrl = new URL('./assets/vendor/libarchive/worker-bundle.js', window.location.href).href;
      Archive.init({ workerUrl });
      log(4, 'WebAssembly Worker configurado', `Ruta: ${workerUrl}`, 'info');
    } catch (e) {
      log(4, 'Worker libarchive listo', e.message, 'info');
    }

    log(4, 'Abriendo contenedor 7z/RAR', `Tamaño buffer: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`, 'info');
    const blob = new Blob([arrayBuffer]);
    const archive = await Archive.open(blob);

    log(4, 'Extrayendo con WebAssembly', 'Descomprimiendo ficheros en memoria...', 'info');
    const extracted = await archive.extractFiles();
    
    // Flatten nested directory structure from libarchive output
    const fileMap = {}; // { 'path/to/file.ext': File }
    
    const traverse = async (node, prefix = '') => {
      for (const key of Object.keys(node)) {
        const item = node[key];
        const fullPath = prefix ? `${prefix}/${key}` : key;
        if (item instanceof File || item instanceof Blob) {
          fileMap[fullPath] = item;
        } else if (typeof item === 'object' && item !== null) {
          await traverse(item, fullPath);
        }
      }
    };

    await traverse(extracted);
    log(4, 'Descompresión WebAssembly lista', `Archivos extraídos: ${Object.keys(fileMap).length} (${Object.keys(fileMap).slice(0, 4).join(', ')})`, 'success');
    return fileMap;
  }
}

// ==========================================
// 4. PARSER: CLONE HERO (.chart)
// ==========================================

class CloneHeroParser {
  static getAvailableDifficulties(chartText) {
    const diffs = [];
    const diffMap = [
      { section: 'ExpertSingle', name: 'Expert Single', stars: 4.5 },
      { section: 'HardSingle', name: 'Hard Single', stars: 3.5 },
      { section: 'MediumSingle', name: 'Medium Single', stars: 2.5 },
      { section: 'EasySingle', name: 'Easy Single', stars: 1.5 },
      { section: 'ExpertDoubleBass', name: 'Expert Double Bass', stars: 5.0 },
      { section: 'ExpertGuitar', name: 'Expert Guitar', stars: 4.5 }
    ];

    for (const d of diffMap) {
      if (chartText.includes(`[${d.section}]`)) {
        diffs.push({
          id: d.section,
          name: d.name,
          stars: d.stars,
          label: `${d.name} (${d.stars.toFixed(1)}★)`
        });
      }
    }

    if (diffs.length === 0) {
      diffs.push({
        id: 'ExpertSingle',
        name: 'Expert',
        stars: 3.5,
        label: 'Expert (3.5★)'
      });
    }

    return diffs;
  }

  static parse(chartText, chosenDiff = 'ExpertSingle') {
    const lines = chartText.split(/\r?\n/);
    let currentSection = '';

    let resolution = 192;
    let offsetSec = 0;
    let title = 'Canción Clone Hero';
    let artist = 'Artista';
    let charter = 'Charter';
    let audioFilename = 'song.ogg';

    const bpms = [];
    const rawEvents = [];

    // Fallback search if chosen section not found directly
    const targetSections = [chosenDiff, 'ExpertSingle', 'HardSingle', 'MediumSingle', 'EasySingle'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
        continue;
      }

      if (currentSection === 'Song') {
        const [k, ...v] = line.split('=');
        const key = k.trim();
        const val = v.join('=').trim().replace(/^"|"$/g, '');
        if (key === 'Resolution') resolution = parseInt(val, 10) || 192;
        if (key === 'Offset') offsetSec = parseFloat(val) || 0;
        if (key === 'Name') title = val;
        if (key === 'Artist') artist = val;
        if (key === 'Charter') charter = val;
        if (key === 'MusicStream') audioFilename = val;
      } else if (currentSection === 'SyncTrack') {
        const parts = line.split(/\s*=\s*/);
        if (parts.length === 2) {
          const tick = parseInt(parts[0].trim(), 10);
          const evParts = parts[1].trim().split(/\s+/);
          if (evParts[0] === 'B') {
            const rawBpm = parseInt(evParts[1], 10) / 1000;
            bpms.push({ tick, bpm: rawBpm });
          }
        }
      } else if (currentSection === chosenDiff || (!rawEvents.length && targetSections.includes(currentSection))) {
        const parts = line.split(/\s*=\s*/);
        if (parts.length === 2) {
          const tick = parseInt(parts[0].trim(), 10);
          const evParts = parts[1].trim().split(/\s+/);
          if (evParts[0] === 'N') {
            const fret = parseInt(evParts[1], 10);
            const length = parseInt(evParts[2], 10) || 0;
            if (fret <= 4) {
              rawEvents.push({ tick, fret, length });
            }
          }
        }
      }
    }

    if (bpms.length === 0) bpms.push({ tick: 0, bpm: 120 });
    bpms.sort((a, b) => a.tick - b.tick);

    const tickToMs = (targetTick) => {
      let accumulatedMs = offsetSec * 1000;
      let lastTick = 0;
      let currentBpm = bpms[0].bpm;

      for (const bp of bpms) {
        if (targetTick <= bp.tick) break;
        const deltaTicks = bp.tick - lastTick;
        const msPerTick = (60000 / currentBpm) / resolution;
        accumulatedMs += deltaTicks * msPerTick;
        lastTick = bp.tick;
        currentBpm = bp.bpm;
      }

      const remTicks = targetTick - lastTick;
      const msPerTick = (60000 / currentBpm) / resolution;
      accumulatedMs += remTicks * msPerTick;
      return accumulatedMs;
    };

    const rawNotes = [];
    for (const ev of rawEvents) {
      const startMs = tickToMs(ev.tick);
      const isHold = ev.length > resolution / 4;
      const endMs = isHold ? tickToMs(ev.tick + ev.length) : startMs;
      const duration = isHold ? Math.max(0, endMs - startMs) : null;

      rawNotes.push({
        originalLane: ev.fret,
        timestamp_ms: Math.max(0, startMs),
        type: isHold ? 'hold' : 'tap',
        duration_ms: duration,
        end_timestamp_ms: isHold ? endMs : null
      });
    }

    const finalNotes = LaneRemapper.resolveCollisions(rawNotes, 5, Math.round(bpms[0].bpm), 4.5);

    return {
      audioFilename,
      title,
      artist,
      creator: charter,
      difficultyName: chosenDiff,
      stars: 4.5,
      bpm: Math.round(bpms[0].bpm),
      keys: 5,
      notes: finalNotes
    };
  }
}

// ==========================================
// 5. PARSER: CLONE HERO MIDI (.mid / notes.mid)
// ==========================================

class MidiChartParser {
  static parse(arrayBuffer, chosenDiff = 'Expert') {
    const data = new Uint8Array(arrayBuffer);
    let pos = 0;

    const readString = (len) => {
      let str = '';
      for (let i = 0; i < len; i++) str += String.fromCharCode(data[pos++]);
      return str;
    };

    const readUint32 = () => {
      const val = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
      pos += 4;
      return val >>> 0;
    };

    const readUint16 = () => {
      const val = (data[pos] << 8) | data[pos + 1];
      pos += 2;
      return val;
    };

    const readVarLen = () => {
      let val = 0;
      let byte;
      do {
        byte = data[pos++];
        val = (val << 7) | (byte & 0x7F);
      } while (byte & 0x80);
      return val;
    };

    const header = readString(4);
    if (header !== 'MThd') throw new Error('Archivo MIDI inválido.');

    pos += 4; // header length (6)
    const format = readUint16();
    const numTracks = readUint16();
    const division = readUint16();
    const resolution = division & 0x7FFF;

    const tempoEvents = [{ tick: 0, bpm: 120 }];
    const noteEvents = [];

    for (let t = 0; t < numTracks; t++) {
      if (pos >= data.length) break;
      const trackHeader = readString(4);
      if (trackHeader !== 'MTrk') break;
      const trackLen = readUint32();
      const trackEnd = pos + trackLen;

      let currentTick = 0;
      let lastStatus = 0;
      let trackName = '';
      const activeNotes = new Map();

      while (pos < trackEnd && pos < data.length) {
        const delta = readVarLen();
        currentTick += delta;

        let status = data[pos];
        if (status < 0x80) {
          status = lastStatus;
        } else {
          pos++;
          lastStatus = status;
        }

        const msgType = status & 0xF0;

        if (status === 0xFF) {
          const metaType = data[pos++];
          const metaLen = readVarLen();
          if (metaType === 0x03) {
            let name = '';
            for (let i = 0; i < metaLen; i++) name += String.fromCharCode(data[pos + i]);
            trackName = name.trim().toUpperCase();
          } else if (metaType === 0x51 && metaLen === 3) {
            const microSec = (data[pos] << 16) | (data[pos + 1] << 8) | data[pos + 2];
            const bpm = 60000000 / microSec;
            tempoEvents.push({ tick: currentTick, bpm });
          }
          pos += metaLen;
        } else if (msgType === 0x90 || msgType === 0x80) {
          const pitch = data[pos++];
          const vel = data[pos++];
          const isNoteOn = msgType === 0x90 && vel > 0;

          // Target guitar track notes (Expert: 96-100, Hard: 84-88, Medium: 72-76, Easy: 60-64)
          const basePitch = (chosenDiff.includes('Hard') ? 84 : (chosenDiff.includes('Medium') ? 72 : (chosenDiff.includes('Easy') ? 60 : 96)));
          if (pitch >= basePitch && pitch <= basePitch + 4) {
            const fret = pitch - basePitch;
            if (isNoteOn) {
              activeNotes.set(fret, currentTick);
            } else if (activeNotes.has(fret)) {
              const startTick = activeNotes.get(fret);
              const durationTicks = currentTick - startTick;
              noteEvents.push({ tick: startTick, fret, length: durationTicks });
              activeNotes.delete(fret);
            }
          }
        } else if (msgType === 0xC0 || msgType === 0xD0) {
          pos++;
        } else if (msgType === 0x80 || msgType === 0xA0 || msgType === 0xB0 || msgType === 0xE0) {
          pos += 2;
        } else if (status === 0xF0 || status === 0xF7) {
          const sysexLen = readVarLen();
          pos += sysexLen;
        }
      }
      pos = trackEnd;
    }

    tempoEvents.sort((a, b) => a.tick - b.tick);
    const tickToMs = (targetTick) => {
      let accumulatedMs = 0;
      let lastTick = 0;
      let currentBpm = tempoEvents[0].bpm;

      for (const bp of tempoEvents) {
        if (targetTick <= bp.tick) break;
        const deltaTicks = bp.tick - lastTick;
        const msPerTick = (60000 / currentBpm) / resolution;
        accumulatedMs += deltaTicks * msPerTick;
        lastTick = bp.tick;
        currentBpm = bp.bpm;
      }

      const remTicks = targetTick - lastTick;
      const msPerTick = (60000 / currentBpm) / resolution;
      accumulatedMs += remTicks * msPerTick;
      return accumulatedMs;
    };

    const rawNotes = noteEvents.map(ev => {
      const startMs = tickToMs(ev.tick);
      const isHold = ev.length > resolution / 4;
      const endMs = isHold ? tickToMs(ev.tick + ev.length) : startMs;
      const duration = isHold ? Math.max(0, endMs - startMs) : null;
      return {
        originalLane: ev.fret,
        timestamp_ms: Math.max(0, startMs),
        type: isHold ? 'hold' : 'tap',
        duration_ms: duration,
        end_timestamp_ms: isHold ? endMs : null
      };
    });

    const finalNotes = LaneRemapper.resolveCollisions(rawNotes, 5, Math.round(tempoEvents[0].bpm), 4.5);

    return {
      audioFilename: 'song.ogg',
      title: 'Clone Hero MIDI',
      artist: 'Artista',
      creator: 'MIDI Charter',
      difficultyName: chosenDiff,
      stars: 4.5,
      bpm: Math.round(tempoEvents[0].bpm),
      keys: 5,
      notes: finalNotes
    };
  }
}

// ==========================================
// 6. UNPACKER: SNG PACKAGE CONTAINER (.sng)
// ==========================================

class SngUnpacker {
  static isSng(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 26) return false;
    const b = new Uint8Array(arrayBuffer, 0, 6);
    return b[0] === 0x53 && b[1] === 0x4E && b[2] === 0x47 && b[3] === 0x50 && b[4] === 0x4B && b[5] === 0x47; // "SNGPKG"
  }

  static unpack(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);

    if (!this.isSng(arrayBuffer)) {
      throw new Error('El archivo no es un paquete .sng válido.');
    }

    const version = dataView.getUint32(6, true);
    const xorMask = bytes.slice(10, 26);

    let offset = 26;
    const metadataLen = Number(dataView.getBigUint64(offset, true));
    offset += 8;

    const metadataEnd = offset + metadataLen;
    const metadata = {};
    const textDecoder = new TextDecoder('utf-8');

    if (metadataLen > 0 && offset + 8 <= metadataEnd) {
      const metadataCount = Number(dataView.getBigUint64(offset, true));
      offset += 8;
      for (let i = 0; i < metadataCount && offset < metadataEnd; i++) {
        const keyLen = dataView.getInt32(offset, true);
        offset += 4;
        const key = textDecoder.decode(bytes.subarray(offset, offset + keyLen));
        offset += keyLen;

        const valLen = dataView.getInt32(offset, true);
        offset += 4;
        const val = textDecoder.decode(bytes.subarray(offset, offset + valLen));
        offset += valLen;
        metadata[key] = val;
      }
    }
    offset = metadataEnd;

    // FileIndex Section
    const fileIndexLen = Number(dataView.getBigUint64(offset, true));
    offset += 8;
    const fileIndexEnd = offset + fileIndexLen;
    const fileCount = Number(dataView.getBigUint64(offset, true));
    offset += 8;

    const fileEntries = [];
    for (let i = 0; i < fileCount && offset < fileIndexEnd; i++) {
      const filenameLen = bytes[offset++];
      const filename = textDecoder.decode(bytes.subarray(offset, offset + filenameLen));
      offset += filenameLen;

      const contentsLen = Number(dataView.getBigUint64(offset, true));
      offset += 8;
      const contentsIndex = Number(dataView.getBigUint64(offset, true));
      offset += 8;

      fileEntries.push({ filename, contentsLen, contentsIndex });
    }
    offset = fileIndexEnd;

    // FileData Section
    const fileDataLen = Number(dataView.getBigUint64(offset, true));
    offset += 8;
    const fileDataStart = offset;

    const files = {};
    for (const entry of fileEntries) {
      const start = entry.contentsIndex;
      const len = entry.contentsLen;
      const masked = bytes.subarray(start, start + len);
      const unmasked = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        unmasked[j] = masked[j] ^ xorMask[j % 16] ^ (j & 0xFF);
      }
      files[entry.filename] = unmasked;
    }

    return { metadata, files };
  }
}

// ==========================================
// 7. PACKAGE UNPACKER (Multi-format: SNG, 7z, RAR, ZIP, OSZ)
// ==========================================

class PackageUnpacker {
  static async ensureJSZip() {
    if (typeof JSZip !== 'undefined') return true;
    const sources = [
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      './assets/vendor/jszip.min.js',
      './vendor/jszip.min.js',
      '/static/assets/vendor/jszip.min.js'
    ];
    for (const src of sources) {
      try {
        await new Promise((resolve, reject) => {
          if (typeof document === 'undefined') return resolve();
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed ' + src));
          document.head.appendChild(script);
        });
        if (typeof JSZip !== 'undefined') return true;
      } catch (e) {
        // try next
      }
    }
    return typeof JSZip !== 'undefined';
  }

  static async unpack(arrayBuffer, fileType = 'osz', selectedDiffId = null, onLog = null) {
    const textDecoder = new TextDecoder('utf-8');
    const log = (step, title, detail, st = 'info') => {
      if (typeof onLog === 'function') onLog(step, title, detail, st);
      else if (window.VisualLogger && typeof window.VisualLogger.step === 'function') window.VisualLogger.step(step, title, detail, st);
    };

    // 1. Manejo de paquete binario .sng (Clone Hero / Chorus Encore SNGPKG)
    if (fileType === 'sng' || SngUnpacker.isSng(arrayBuffer)) {
      log(4, 'Contenedor binario SNG detectado', 'Extrayendo pistas de audio y mapa con SngUnpacker...', 'info');
      const sng = SngUnpacker.unpack(arrayBuffer);
      const fileNames = Object.keys(sng.files);

      let parsedBeatmap = null;
      let extractedDiffs = [];

      // Buscar archivo de notas (.chart o .mid)
      const chartFileName = fileNames.find(f => f.toLowerCase().endsWith('.chart'));
      const midiFileName = fileNames.find(f => f.toLowerCase().endsWith('.mid') || f.toLowerCase().endsWith('.midi'));

      if (chartFileName) {
        log(5, 'Notas Clone Hero (.chart) encontradas', `Archivo: ${chartFileName}`, 'info');
        const chartText = textDecoder.decode(sng.files[chartFileName]);
        extractedDiffs = CloneHeroParser.getAvailableDifficulties(chartText);
        parsedBeatmap = CloneHeroParser.parse(chartText, selectedDiffId || 'ExpertSingle');
      } else if (midiFileName) {
        log(5, 'Notas Clone Hero MIDI (.mid) encontradas', `Archivo: ${midiFileName}`, 'info');
        parsedBeatmap = MidiChartParser.parse(sng.files[midiFileName], selectedDiffId || 'Expert');
        extractedDiffs = [{ id: 'Expert', name: 'Expert Single', stars: 4.5, label: 'Expert Single (4.5★)' }];
      } else {
        log(5, 'Faltan notas en paquete SNG', 'No se encontró .chart ni .mid dentro del archivo .sng', 'error');
        throw new Error('No se encontró archivo de notas (.chart o .mid) en el paquete .sng');
      }

      // Metadata adicional del contenedor SNG
      if (sng.metadata) {
        if (sng.metadata.name) parsedBeatmap.title = sng.metadata.name;
        if (sng.metadata.artist) parsedBeatmap.artist = sng.metadata.artist;
        if (sng.metadata.charter) parsedBeatmap.creator = sng.metadata.charter;
      }

      // Buscar archivo de audio en el paquete SNG (Prioridad: song.* > guitar.* > rhythm.* > resto)
      const priorityNames = ['song.ogg', 'song.opus', 'song.mp3', 'guitar.ogg', 'guitar.opus', 'guitar.mp3', 'rhythm.ogg', 'rhythm.opus', 'drums.ogg', 'drums.opus'];
      let audioFileName = priorityNames.find(p => fileNames.some(fn => fn.toLowerCase() === p));
      if (!audioFileName) {
        audioFileName = fileNames.find(f => {
          const l = f.toLowerCase();
          return l.endsWith('.ogg') || l.endsWith('.mp3') || l.endsWith('.opus') || l.endsWith('.wav') || l.endsWith('.m4a');
        });
      }

      if (!audioFileName) {
        log(5, 'Audio no encontrado en SNG', 'No se encontró archivo .ogg/.mp3 en el contenedor', 'error');
        throw new Error('No se encontró archivo de audio dentro del paquete .sng');
      }

      log(5, 'Pista de audio encontrada', `Archivo: ${audioFileName}`, 'info');
      const audioBytes = sng.files[audioFileName];
      const ext = audioFileName.split('.').pop().toLowerCase();
      const mime = ext === 'ogg' || ext === 'opus' ? 'audio/ogg' : (ext === 'wav' ? 'audio/wav' : 'audio/mpeg');
      const audioBlob = new Blob([audioBytes], { type: mime });
      const audioUrl = URL.createObjectURL(audioBlob);

      log(5, 'Parseo SNG completado', `${parsedBeatmap.notes.length} notas | 3 carriles`, 'success');
      return {
        metadata: {
          id: parsedBeatmap.title.toLowerCase().replace(/\s+/g, '_'),
          title: parsedBeatmap.title,
          artist: parsedBeatmap.artist,
          creator: parsedBeatmap.creator,
          difficulty_name: parsedBeatmap.difficultyName,
          stars: parsedBeatmap.stars,
          bpm: parsedBeatmap.bpm,
          total_notes: parsedBeatmap.notes.length,
          num_lanes: 3
        },
        notes: parsedBeatmap.notes,
        audioBlob: audioBlob,
        audioUrl: audioUrl,
        availableDifficulties: extractedDiffs
      };
    }

    // 2. Manejo de paquetes comprimidos .7z o .rar con libarchive.js (WebAssembly)
    if (ArchiveHelper.is7zOrRar(arrayBuffer) || fileType === '7z' || fileType === 'rar') {
      log(4, 'Formato 7-Zip / RAR detectado', 'Iniciando descompresión con WebAssembly...', 'info');
      const fileMap = await ArchiveHelper.extractWithLibarchive(arrayBuffer, onLog);
      const filePaths = Object.keys(fileMap);

      if (filePaths.length === 0) {
        log(4, 'Archivo 7z vacío', 'No se pudieron extraer archivos del contenedor.', 'error');
        throw new Error('El archivo comprimido .7z/.rar está vacío o no se pudo extraer.');
      }

      let parsedBeatmap = null;
      let extractedDiffs = [];
      let songIniMeta = {};

      // Parsear song.ini si existe
      const iniPath = filePaths.find(p => p.toLowerCase().endsWith('song.ini'));
      if (iniPath) {
        try {
          const iniTxt = await fileMap[iniPath].text();
          songIniMeta = SongIniParser.parse(iniTxt);
          log(5, 'Configuración song.ini leída', `Canción: ${songIniMeta.name || 'Sin título'} • Artista: ${songIniMeta.artist || 'Desconocido'}`, 'info');
        } catch (iniErr) {
          console.debug('Error reading song.ini:', iniErr);
        }
      }
// Buscar archivo de notas (.chart o .mid) de forma flexible en cualquier subcarpeta
      const chartPath = filePaths.find(p => p && p.toLowerCase().trim().includes('.chart'));
      const midiPath = filePaths.find(p => p && (p.toLowerCase().trim().includes('.mid') || p.toLowerCase().trim().includes('.midi')));

      if (chartPath) {
        log(5, 'Archivo de notas .chart detectado', `Ruta: ${chartPath}`, 'info');
        const chartTxt = await fileMap[chartPath].text();
        extractedDiffs = CloneHeroParser.getAvailableDifficulties(chartTxt);
        parsedBeatmap = CloneHeroParser.parse(chartTxt, selectedDiffId || 'ExpertSingle');
      } else if (midiPath) {
        log(5, 'Archivo de notas MIDI (.mid) detectado', `Ruta: ${midiPath}`, 'info');
        const midiBuf = await fileMap[midiPath].arrayBuffer();
        parsedBeatmap = MidiChartParser.parse(midiBuf, selectedDiffId || 'Expert');
        extractedDiffs = [{ id: 'Expert', name: 'Expert Single', stars: 4.5, label: 'Expert Single (4.5★)' }];
      } else {
        log(5, 'Faltan notas en paquete 7z', `Archivos encontrados: ${filePaths.slice(0, 4).join(', ')}`, 'error');
        throw new Error('No se encontró archivo de notas (.chart o .mid) en el paquete .7z/.rar');
      }


      // Aplicar metadata de song.ini
      if (songIniMeta.name) parsedBeatmap.title = songIniMeta.name;
      if (songIniMeta.artist) parsedBeatmap.artist = songIniMeta.artist;
      if (songIniMeta.charter || songIniMeta.frets) parsedBeatmap.creator = songIniMeta.charter || songIniMeta.frets;
      if (songIniMeta.diff_guitar && parseFloat(songIniMeta.diff_guitar) > 0) {
        parsedBeatmap.stars = parseFloat(songIniMeta.diff_guitar);
      }

      // Buscar archivo de audio
      let audioFile = null;
      let targetAudio = parsedBeatmap.audioFilename ? parsedBeatmap.audioFilename.toLowerCase() : '';
      if (targetAudio) {
        const match = filePaths.find(p => p.toLowerCase() === targetAudio || p.toLowerCase().endsWith('/' + targetAudio));
        if (match) audioFile = fileMap[match];
      }

      if (!audioFile) {
        const match = filePaths.find(p => {
          const l = p.toLowerCase();
          return l.endsWith('.ogg') || l.endsWith('.mp3') || l.endsWith('.opus') || l.endsWith('.wav') || l.endsWith('.m4a');
        });
        if (match) audioFile = fileMap[match];
      }

      if (!audioFile) {
        log(5, 'Audio no encontrado en 7z', 'No se encontró pista de audio (.ogg/.mp3)', 'error');
        throw new Error('No se encontró archivo de audio (.ogg, .mp3, .wav) en el paquete .7z/.rar');
      }

      log(5, 'Pista de audio cargada', `Archivo: ${audioFile.name || 'audio'} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
      const audioArrayBuffer = await audioFile.arrayBuffer();
      const ext = (audioFile.name || 'audio.mp3').split('.').pop().toLowerCase();
      const mime = ext === 'ogg' || ext === 'opus' ? 'audio/ogg' : (ext === 'wav' ? 'audio/wav' : 'audio/mpeg');
      const audioBlob = new Blob([audioArrayBuffer], { type: mime });
      const audioUrl = URL.createObjectURL(audioBlob);

      log(5, 'Parseo 7z/RAR completado', `${parsedBeatmap.notes.length} notas mapeadas a 3 carriles`, 'success');
      return {
        metadata: {
          id: parsedBeatmap.title.toLowerCase().replace(/\s+/g, '_'),
          title: parsedBeatmap.title,
          artist: parsedBeatmap.artist,
          creator: parsedBeatmap.creator,
          difficulty_name: parsedBeatmap.difficultyName,
          stars: parsedBeatmap.stars,
          bpm: parsedBeatmap.bpm,
          total_notes: parsedBeatmap.notes.length,
          num_lanes: 3
        },
        notes: parsedBeatmap.notes,
        audioBlob: audioBlob,
        audioUrl: audioUrl,
        availableDifficulties: extractedDiffs
      };
    }

    // 3. Manejo de paquetes ZIP / OSZ estándar con JSZip
    if (typeof JSZip === 'undefined') {
      log(4, 'JSZip no encontrado en memoria', 'Intentando carga dinámica de JSZip...', 'info');
      await PackageUnpacker.ensureJSZip();
    }

    if (typeof JSZip === 'undefined') {
      // Fallback to libarchive if JSZip is still missing
      if (typeof Archive !== 'undefined') {
        log(4, 'Descomprimiendo con libarchive', 'Usando motor WebAssembly alternativo...', 'info');
        const fileMap = await ArchiveHelper.extractWithLibarchive(arrayBuffer, onLog);
        const filePaths = Object.keys(fileMap);
        const osuFiles = filePaths.filter(f => f.toLowerCase().endsWith('.osu'));
        if (osuFiles.length > 0) {
          let extractedDiffs = [];
          for (const f of osuFiles) {
            const txt = await fileMap[f].text();
            const parsed = OsuManiaParser.parse(txt);
            extractedDiffs.push({
              file: f,
              id: f,
              name: parsed.difficultyName,
              stars: parsed.stars,
              keys: parsed.keys,
              label: `${parsed.difficultyName} (${parsed.stars}★)`
            });
          }
          let targetOsu = osuFiles[0];
          if (selectedDiffId && fileMap[selectedDiffId]) targetOsu = selectedDiffId;
          const osuText = await fileMap[targetOsu].text();
          const parsedBeatmap = OsuManiaParser.parse(osuText);
          const audioName = parsedBeatmap.audioFilename.toLowerCase();
          const audioPath = filePaths.find(p => p.toLowerCase().endsWith(audioName) || p.toLowerCase().endsWith('.mp3') || p.toLowerCase().endsWith('.ogg'));
          if (!audioPath) throw new Error('Audio no encontrado en osu! pack');
          const audioBlob = fileMap[audioPath];
          return {
            metadata: {
              title: parsedBeatmap.title,
              artist: parsedBeatmap.artist,
              creator: parsedBeatmap.creator,
              difficulty_name: parsedBeatmap.difficultyName,
              stars: parsedBeatmap.stars,
              bpm: parsedBeatmap.bpm,
              total_notes: parsedBeatmap.notes.length,
              num_lanes: 3
            },
            notes: parsedBeatmap.notes,
            audioBlob: audioBlob,
            audioUrl: URL.createObjectURL(audioBlob),
            availableDifficulties: extractedDiffs
          };
        }
      }
      log(4, 'JSZip no encontrado', 'La librería JSZip no está disponible.', 'error');
      throw new Error('La librería JSZip no está cargada en el cliente.');
    }

    log(4, 'Descomprimiendo ZIP con JSZip', `Tamaño buffer: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`, 'info');
    const zip = await JSZip.loadAsync(arrayBuffer);
    const files = Object.keys(zip.files);

    let parsedBeatmap = null;
    let audioBlob = null;
    let targetAudioName = '';
    let extractedDiffs = [];

    // Comprobar si el ZIP contiene un archivo .sng comprimido
    const innerSng = files.find(f => f.toLowerCase().endsWith('.sng'));
    if (innerSng) {
      log(4, 'Archivo .sng interno en ZIP', `Ruta: ${innerSng}`, 'info');
      const sngBuf = await zip.file(innerSng).async('arraybuffer');
      return this.unpack(sngBuf, 'sng', selectedDiffId, onLog);
    }

    if (fileType === 'osz' || files.some(f => f.toLowerCase().endsWith('.osu'))) {
      const osuFiles = files.filter(f => f.toLowerCase().endsWith('.osu'));
      if (osuFiles.length === 0) throw new Error('No se encontraron archivos .osu en el paquete.');

      log(5, 'Parseando dificultades osu! Mania', `${osuFiles.length} ficheros .osu encontrados`, 'info');
      for (const f of osuFiles) {
        const txt = await zip.file(f).async('text');
        const parsed = OsuManiaParser.parse(txt);
        extractedDiffs.push({
          file: f,
          id: f,
          name: parsed.difficultyName,
          stars: parsed.stars,
          label: `${parsed.difficultyName} (${parsed.stars.toFixed(1)}★)`,
          parsedData: parsed
        });
      }

      extractedDiffs.sort((a, b) => a.stars - b.stars);
      let chosen = extractedDiffs.find(d => d.id === selectedDiffId || d.name === selectedDiffId) || extractedDiffs[0];
      parsedBeatmap = chosen.parsedData;
      targetAudioName = parsedBeatmap.audioFilename;

    } else if (files.some(f => f.toLowerCase().endsWith('.chart'))) {
      const chartFile = files.find(f => f.toLowerCase().endsWith('.chart'));
      log(5, 'Notas Clone Hero (.chart) en ZIP', `Archivo: ${chartFile}`, 'info');
      const txt = await zip.file(chartFile).async('text');
      extractedDiffs = CloneHeroParser.getAvailableDifficulties(txt);
      parsedBeatmap = CloneHeroParser.parse(txt, selectedDiffId || 'ExpertSingle');
      targetAudioName = parsedBeatmap.audioFilename;

      // Check for song.ini
      const iniFile = files.find(f => f.toLowerCase().endsWith('song.ini'));
      if (iniFile) {
        try {
          const iniTxt = await zip.file(iniFile).async('text');
          const songIni = SongIniParser.parse(iniTxt);
          if (songIni.name) parsedBeatmap.title = songIni.name;
          if (songIni.artist) parsedBeatmap.artist = songIni.artist;
          if (songIni.charter || songIni.frets) parsedBeatmap.creator = songIni.charter || songIni.frets;
        } catch (e) {}
      }

    } else if (files.some(f => f.toLowerCase().endsWith('.mid') || f.toLowerCase().endsWith('.midi'))) {
      const midiFile = files.find(f => f.toLowerCase().endsWith('.mid') || f.toLowerCase().endsWith('.midi'));
      log(5, 'Notas Clone Hero (.mid) en ZIP', `Archivo: ${midiFile}`, 'info');
      const midiBuf = await zip.file(midiFile).async('arraybuffer');
      parsedBeatmap = MidiChartParser.parse(midiBuf, selectedDiffId || 'Expert');
      extractedDiffs = [{ id: 'Expert', name: 'Expert Single', stars: 4.5, label: 'Expert Single (4.5★)' }];
      targetAudioName = parsedBeatmap.audioFilename;

      // Check for song.ini
      const iniFile = files.find(f => f.toLowerCase().endsWith('song.ini'));
      if (iniFile) {
        try {
          const iniTxt = await zip.file(iniFile).async('text');
          const songIni = SongIniParser.parse(iniTxt);
          if (songIni.name) parsedBeatmap.title = songIni.name;
          if (songIni.artist) parsedBeatmap.artist = songIni.artist;
          if (songIni.charter || songIni.frets) parsedBeatmap.creator = songIni.charter || songIni.frets;
        } catch (e) {}
      }
    }

    if (!parsedBeatmap) {
      log(5, 'Formato no reconocido', 'No se encontraron notas válidas (.osu, .chart, .mid)', 'error');
      throw new Error('Formato de mapa de ritmo no reconocido en el paquete.');
    }

    let audioFileEntry = null;
    if (targetAudioName) {
      const cleanTarget = targetAudioName.toLowerCase();
      const matchPath = files.find(f => {
        const l = f.toLowerCase();
        return l === cleanTarget || l.endsWith('/' + cleanTarget) || l.endsWith('\\' + cleanTarget);
      });
      if (matchPath) {
        audioFileEntry = zip.file(matchPath);
      }
    }

    if (!audioFileEntry) {
      const audioPath = files.find(f => {
        const lower = f.toLowerCase();
        return lower.endsWith('.mp3') || lower.endsWith('.ogg') || lower.endsWith('.opus') || lower.endsWith('.wav') || lower.endsWith('.m4a');
      });
      if (audioPath) {
        audioFileEntry = zip.file(audioPath);
      }
    }

    if (!audioFileEntry) {
      log(5, 'Audio no encontrado en ZIP', 'No se encontró archivo de audio', 'error');
      throw new Error('No se encontró archivo de audio (.mp3, .ogg, .wav) dentro del paquete.');
    }

    log(5, 'Pista de audio cargada', `Archivo: ${audioFileEntry.name}`, 'info');
    const audioArrayBuffer = await audioFileEntry.async('arraybuffer');
    const audioName = audioFileEntry.name || 'audio.mp3';
    const ext = audioName.split('.').pop().toLowerCase();
    const mime = ext === 'ogg' || ext === 'opus' ? 'audio/ogg' : (ext === 'wav' ? 'audio/wav' : 'audio/mpeg');
    audioBlob = new Blob([audioArrayBuffer], { type: mime });
    const audioUrl = URL.createObjectURL(audioBlob);

    log(5, 'Parseo completado con éxito', `${parsedBeatmap.notes.length} notas mapeadas a 3 carriles`, 'success');
    return {
      metadata: {
        id: parsedBeatmap.title.toLowerCase().replace(/\s+/g, '_'),
        title: parsedBeatmap.title,
        artist: parsedBeatmap.artist,
        creator: parsedBeatmap.creator,
        difficulty_name: parsedBeatmap.difficultyName,
        stars: parsedBeatmap.stars,
        bpm: parsedBeatmap.bpm,
        total_notes: parsedBeatmap.notes.length,
        num_lanes: 3
      },
      notes: parsedBeatmap.notes,
      audioBlob: audioBlob,
      audioUrl: audioUrl,
      availableDifficulties: extractedDiffs
    };
  }
}

// ==========================================
// 6. INDEXEDDB STORAGE (Offline Library, Favorites & Playlists)
// ==========================================

class IndexedDBStorage {
  static DB_NAME = 'BeatstarLibraryDB';
  static STORE_SAVED = 'saved_charts';
  static STORE_FAVORITES = 'favorites';
  static STORE_PLAYLISTS = 'playlists';
  static DB_VERSION = 2;

  static openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_SAVED)) {
          db.createObjectStore(this.STORE_SAVED, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.STORE_FAVORITES)) {
          db.createObjectStore(this.STORE_FAVORITES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(this.STORE_PLAYLISTS)) {
          db.createObjectStore(this.STORE_PLAYLISTS, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- Saved Offline Charts ---
  static async saveChart(chartItem, beatmapData, audioBlob) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_SAVED, 'readwrite');
      const store = tx.objectStore(this.STORE_SAVED);

      const record = {
        id: chartItem.id,
        title: chartItem.title,
        artist: chartItem.artist,
        creator: chartItem.creator,
        source: chartItem.source,
        source_name: chartItem.source_name,
        thumbnail: chartItem.thumbnail,
        difficulties: chartItem.difficulties,
        download_url: chartItem.download_url || chartItem.direct_download_url || '',
        md5: chartItem.md5 || '',
        diff_id: chartItem.diff_id || '',
        metadata: beatmapData.metadata,
        notes: beatmapData.notes,
        chartData: beatmapData,
        audioBlob: audioBlob,
        savedAt: Date.now()
      };

      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async getChart(chartId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_SAVED, 'readonly');
      const store = tx.objectStore(this.STORE_SAVED);
      const req = store.get(chartId);
      req.onsuccess = () => {
        if (req.result) return resolve(req.result);
        // Búsqueda tolerante por id de metadatos o por slug de título normalizado
        const allReq = store.getAll();
        allReq.onsuccess = () => {
          const all = allReq.result || [];
          const targetSlug = String(chartId || '').toLowerCase().replace(/[\s\-_]+/g, '');
          const match = all.find(c => {
            if (!c) return false;
            if (c.id === chartId) return true;
            if (c.metadata && c.metadata.id === chartId) return true;
            const cSlug = String(c.title || '').toLowerCase().replace(/[\s\-_]+/g, '');
            const idSlug = String(c.id || '').toLowerCase().replace(/[\s\-_]+/g, '');
            return (cSlug && (cSlug === targetSlug || targetSlug.includes(cSlug))) ||
                   (idSlug && (idSlug === targetSlug || targetSlug.includes(idSlug)));
          });
          resolve(match || null);
        };
        allReq.onerror = () => resolve(null);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async getAllCharts() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_SAVED, 'readonly');
      const store = tx.objectStore(this.STORE_SAVED);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async deleteChart(chartId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_SAVED, 'readwrite');
      const store = tx.objectStore(this.STORE_SAVED);
      const req = store.delete(chartId);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // --- Favorites (❤️) ---
  static async toggleFavorite(chartItem) {
    const db = await this.openDB();
    const isFav = await this.isFavorite(chartItem.id);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FAVORITES, 'readwrite');
      const store = tx.objectStore(this.STORE_FAVORITES);

      if (isFav) {
        const req = store.delete(chartItem.id);
        req.onsuccess = () => resolve(false); // Removed
        req.onerror = (e) => reject(e.target.error);
      } else {
        const favRecord = {
          id: chartItem.id,
          title: chartItem.title,
          artist: chartItem.artist,
          creator: chartItem.creator,
          source: chartItem.source,
          source_name: chartItem.source_name,
          thumbnail: chartItem.thumbnail,
          difficulties: chartItem.difficulties,
          download_url: chartItem.download_url,
          direct_download_url: chartItem.direct_download_url,
          fallback_download_url: chartItem.fallback_download_url,
          addedAt: Date.now()
        };
        const req = store.put(favRecord);
        req.onsuccess = () => resolve(true); // Added
        req.onerror = (e) => reject(e.target.error);
      }
    });
  }

  static async isFavorite(chartId) {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(this.STORE_FAVORITES, 'readonly');
      const store = tx.objectStore(this.STORE_FAVORITES);
      const req = store.get(chartId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  }

  static async getAllFavorites() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FAVORITES, 'readonly');
      const store = tx.objectStore(this.STORE_FAVORITES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // --- Playlists (📁) ---
  static async savePlaylist(playlistObj) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_PLAYLISTS, 'readwrite');
      const store = tx.objectStore(this.STORE_PLAYLISTS);
      const req = store.put(playlistObj);
      req.onsuccess = () => resolve(playlistObj);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async getAllPlaylists() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_PLAYLISTS, 'readonly');
      const store = tx.objectStore(this.STORE_PLAYLISTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async getPlaylist(playlistId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_PLAYLISTS, 'readonly');
      const store = tx.objectStore(this.STORE_PLAYLISTS);
      const req = store.get(playlistId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async deletePlaylist(playlistId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_PLAYLISTS, 'readwrite');
      const store = tx.objectStore(this.STORE_PLAYLISTS);
      const req = store.delete(playlistId);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async addTrackToPlaylist(playlistId, trackItem) {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist no encontrada.');
    if (!playlist.tracks) playlist.tracks = [];
    
    // Evitar duplicados
    if (!playlist.tracks.some(t => t.id === trackItem.id)) {
      playlist.tracks.push(trackItem);
      playlist.item_count = playlist.tracks.length;
      await this.savePlaylist(playlist);
    }
    return playlist;
  }

  static async removeTrackFromPlaylist(playlistId, trackId) {
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) return;
    playlist.tracks = (playlist.tracks || []).filter(t => t.id !== trackId);
    playlist.item_count = playlist.tracks.length;
    await this.savePlaylist(playlist);
    return playlist;
  }

  static async clearAllDownloadedData() {
    try {
      const db = await this.openDB();
      const clearStore = (storeName) => new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const req = store.clear();
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });

      await clearStore(this.STORE_SAVED);
      if (typeof window !== 'undefined' && window.caches) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {}
      }
      return true;
    } catch (e) {
      console.warn('Error clearing IndexedDB data:', e);
      return false;
    }
  }
}

// Export to global window scope
window.LaneRemapper = LaneRemapper;
window.OsuManiaParser = OsuManiaParser;
window.SongIniParser = SongIniParser;
window.ArchiveHelper = ArchiveHelper;
window.CloneHeroParser = CloneHeroParser;
window.MidiChartParser = MidiChartParser;
window.SngUnpacker = SngUnpacker;
window.PackageUnpacker = PackageUnpacker;
window.IndexedDBStorage = IndexedDBStorage;
