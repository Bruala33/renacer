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
   * Remapea un carril de origen (4K, 5K, 6K, 7K o X de osu!) a N carriles (3 o 4)
   * preservando el contorno direccional melódico (izquierda/centro/derecha).
   */
  static mapToLanes(originalLane, totalLanes = 4, targetLanes = 3, prevMappedLane = -1, prevOriginalLane = -1) {
    const numTarget = targetLanes === 4 ? 4 : 3;
    const clampedOrig = Math.max(0, Math.min(Math.max(1, totalLanes) - 1, originalLane ?? 0));

    if (numTarget === 4) {
      if (totalLanes <= 4) {
        return Math.min(3, Math.max(0, clampedOrig));
      }
      if (totalLanes === 5) {
        // 5K (Clone Hero 0..4) -> 4 carriles (0..3) con preservación de contorno en trastes centrales
        if (clampedOrig === 0) return 0;
        if (clampedOrig === 1) return 1;
        if (clampedOrig === 4) return 3;
        if (clampedOrig === 3) return prevMappedLane === 3 ? 2 : 3;
        // clampedOrig === 2 (traste amarillo central)
        if (prevOriginalLane !== -1 && prevMappedLane !== -1) {
          if (clampedOrig > prevOriginalLane) return Math.min(3, Math.max(1, prevMappedLane + 1));
          if (clampedOrig < prevOriginalLane) return Math.max(0, Math.min(2, prevMappedLane - 1));
        }
        return prevMappedLane === 1 ? 2 : 1;
      }
      const ratio4 = (clampedOrig + 0.5) / totalLanes;
      return Math.min(3, Math.max(0, Math.floor(ratio4 * 4)));
    }

    // Modo 3 carriles (0, 1, 2)
    if (totalLanes <= 3) {
      return Math.min(2, Math.max(0, clampedOrig));
    }
    if (totalLanes === 4) {
      if (clampedOrig === 0) return 0;
      if (clampedOrig === 3) return 2;
      // Columnas centrales (1 y 2): preservar dirección y alternancia en lugar de colapsar todo al carril 1
      if (prevOriginalLane !== -1 && prevMappedLane !== -1) {
        if (clampedOrig > prevOriginalLane && prevMappedLane < 2) return prevMappedLane + 1;
        if (clampedOrig < prevOriginalLane && prevMappedLane > 0) return prevMappedLane - 1;
        if (clampedOrig === prevOriginalLane) return prevMappedLane;
      }
      if (clampedOrig === 1) return prevMappedLane === 1 ? 0 : 1;
      return prevMappedLane === 1 ? 2 : 1;
    }
    if (totalLanes === 5) {
      // Clone Hero 5 trastes (0=Verde, 1=Rojo, 2=Amarillo, 3=Azul, 4=Naranja)
      if (clampedOrig === 0) return 0;
      if (clampedOrig === 4) return 2;
      if (clampedOrig === 2) return 1;
      if (clampedOrig === 1) {
        if (prevOriginalLane >= 2 && prevMappedLane === 2) return 1;
        return prevMappedLane === 0 ? 1 : 0;
      }
      if (clampedOrig === 3) {
        if (prevOriginalLane <= 2 && prevMappedLane === 0) return 1;
        return prevMappedLane === 2 ? 1 : 2;
      }
    }
    if (totalLanes === 6) {
      if (clampedOrig <= 1) return 0;
      if (clampedOrig <= 3) return 1;
      return 2;
    }
    const ratio = (clampedOrig + 0.5) / totalLanes;
    if (ratio <= 0.334) return 0;
    if (ratio <= 0.667) return 1;
    return 2;
  }

  static mapTo3K(originalLane, totalLanes = 4, prevMappedLane = -1, prevOriginalLane = -1) {
    return this.mapToLanes(originalLane, totalLanes, 3, prevMappedLane, prevOriginalLane);
  }

  /**
   * Downsampler Rítmico Inteligente y Balanceador de Dificultad para 2 Pulgares
   * IMPORTANTE: Mantiene intacto el timestamp_ms real de cada nota para sincronía exacta con el audio
   * de osu! y Clone Hero (cero notas fantasma o desplazadas).
   */
  static thinMultiLaneChart(rawNotes, totalLanes = 4, bpm = 120, stars = 3.0, densityMode = 'hard') {
    if (!rawNotes || rawNotes.length === 0) return [];

    const effectiveBpm = Math.max(60, Math.min(260, bpm || 120));
    const beatDurationMs = 60000 / effectiveBpm;
    const halfBeatMs = beatDurationMs / 2;
    const quarterBeatMs = beatDurationMs / 4;
    const s = Math.max(1.0, Math.min(10.0, parseFloat(stars) || 3.0));

    // Normalizar tiempos reales y ordenar primero
    const normalized = rawNotes.map(n => {
      const rawT = Number.isFinite(n.original_timestamp)
        ? n.original_timestamp
        : (Number.isFinite(n.timestamp_ms)
            ? n.timestamp_ms
            : (Number.isFinite(n.timeMs)
                ? n.timeMs
                : (Number.isFinite(n.timestamp) ? n.timestamp : (Number.isFinite(n.time) ? (n.time > 100 ? n.time : n.time * 1000) : 0))));
      const t = Math.round(Number.isFinite(rawT) ? rawT : 0);
      const isHold = n.type === 'hold' || (n.duration_ms && n.duration_ms > 140) || (n.duration && n.duration > 0.14) || (n.holdDuration && n.holdDuration > 0.14);
      return {
        ...n,
        type: isHold ? 'hold' : (n.type || 'tap'),
        timestamp_ms: t,
        original_timestamp: t,
        _isHold: isHold
      };
    }).sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // Anclar la rejilla métrica al primer ataque real de la canción
    const gridAnchorMs = normalized.length > 0 ? normalized[0].timestamp_ms : 0;

    // 1. Puntuación de importancia musical real (sin alterar timestamp_ms)
    const scoredNotes = normalized.map((n, idx) => {
      const t = n.timestamp_ms;
      const relT = Math.max(0, t - gridAnchorMs);

      const wholeRem = ((relT % beatDurationMs) + beatDurationMs) % beatDurationMs;
      const distWhole = Math.min(wholeRem, beatDurationMs - wholeRem);

      const halfRem = ((relT % halfBeatMs) + halfBeatMs) % halfBeatMs;
      const distHalf = Math.min(halfRem, halfBeatMs - halfRem);

      const quartRem = ((relT % quarterBeatMs) + quarterBeatMs) % quarterBeatMs;
      const distQuart = Math.min(quartRem, quarterBeatMs - quartRem);

      let score = 40;
      if (distWhole <= 60) {
        score = 100;
      } else if (distHalf <= 48) {
        score = 82;
      } else if (distQuart <= 36) {
        score = 64;
      }

      // Inicio de frase musical tras un silencio o respiro (>= 300ms): prioridad máxima para nunca perder el ataque
      const prevT = idx > 0 ? normalized[idx - 1].timestamp_ms : -Infinity;
      const nextT = idx + 1 < normalized.length ? normalized[idx + 1].timestamp_ms : Infinity;
      if (t - prevT >= 300) {
        score = Math.max(score, 95) + 25;
      }
      // Acordes reales compuestos por el mapper en osu!/Clone Hero tienen énfasis rítmico
      if (Math.abs(t - prevT) <= 18 || Math.abs(nextT - t) <= 18) {
        score += 18;
      }
      if (n._isHold) {
        score += 35;
      }

      return {
        ...n,
        timestamp_ms: t,
        original_timestamp: t,
        priority: score
      };
    });

    // 2. Parámetros según modo de densidad / dificultad (5 niveles calibrados: easy, medium, hard, extreme, impossible)
    let minEventGap = 88;
    let maxChordSize = 2;
    let minChordSpacing = 140;

    if (densityMode === 'easy') {
      minEventGap = 225; // ~225ms mínimo entre notas
      maxChordSize = 1;  // CERO acordes simultáneos
      minChordSpacing = Infinity;
    } else if (densityMode === 'medium') {
      minEventGap = 132; // ~132ms mínimo entre notas (streams divididos limpiamente a la mitad)
      maxChordSize = 2;
      minChordSpacing = 260;
    } else if (densityMode === 'impossible') {
      minEventGap = 24;  // MODO IMPOSIBLE (Solo osu!/BeatSaver/Clone Hero): conserva prácticamente el 100% de las ráfagas brutales del mapa
      maxChordSize = 2;
      minChordSpacing = 24;
    } else if (densityMode === 'extreme') {
      // Nivel EXTREMA intermedio entre Difícil e Imposible (equiparado físicamente a Extrema de Karaoke/Top: 5.4★ - 7.4★)
      minEventGap = Math.max(88, Math.min(104, Math.round(108 - (s - 5.0) * 7.5)));
      maxChordSize = 2;
      minChordSpacing = 135;
    } else {
      minEventGap = Math.max(106, Math.min(165, Math.round(165 - (s - 1.0) * 12.0)));
      maxChordSize = 2;
      minChordSpacing = 155;
    }

    const thinned = [];
    let lastEventTimestamp = -Infinity;
    let lastChordTimestamp = -Infinity;

    for (let i = 0; i < scoredNotes.length; i++) {
      const n = scoredNotes[i];
      const t = n.timestamp_ms;

      // Manejo de acordes simultáneos reales (<= 32ms)
      if (Math.abs(t - lastEventTimestamp) <= 32) {
        if (maxChordSize <= 1) {
          // En Fácil nos quedamos con la nota de mayor prioridad o hold del acorde
          const lastIdx = thinned.length - 1;
          if (lastIdx >= 0 && n.priority > thinned[lastIdx].priority) {
            thinned[lastIdx] = n;
          }
          continue;
        }
        if (t - lastChordTimestamp < minChordSpacing) {
          continue;
        }

        const chordNotes = thinned.filter(prev => Math.abs(prev.timestamp_ms - t) <= 32);
        const minChordPrio = densityMode === 'medium' ? 68 : (densityMode === 'impossible' ? 0 : (densityMode === 'extreme' ? 46 : 56));
        if (chordNotes.length < maxChordSize && n.priority >= minChordPrio) {
          thinned.push(n);
          lastChordTimestamp = t;
        }
        continue;
      }

      const gap = t - lastEventTimestamp;
      if (gap < minEventGap) {
        // Permitir inicios de hold o downbeats marcados según el escalón de dificultad
        if (densityMode === 'easy') continue;
        if (densityMode === 'medium') {
          if (gap < minEventGap * 0.82 || n.priority < 95) continue;
        } else if (densityMode === 'impossible') {
          if (gap < 18) continue;
        } else if (densityMode === 'extreme') {
          if (gap < 74 || (gap < minEventGap * 0.86 && n.priority < 88)) continue;
        } else {
          if (gap < minEventGap * 0.80 || n.priority < 82) continue;
        }
      }

      // Límite de densidad en ventana móvil de 600ms (solo en Imposible se eliminan por completo los topes)
      if (densityMode !== 'impossible') {
        const windowStart = t - 600;
        const notesInRecentWindow = thinned.filter(prev => prev.timestamp_ms >= windowStart);
        const maxWindowEvents = densityMode === 'easy'
          ? 3
          : (densityMode === 'medium'
              ? 4
              : (densityMode === 'extreme'
                  ? 6
                  : 5));
        if (notesInRecentWindow.length >= maxWindowEvents && n.priority < 110) {
          continue;
        }
      }

      lastEventTimestamp = t;
      thinned.push(n);

      // En Imposible (frecuente) y Extrema (moderado en acentos muy marcados): potenciar golpes fuertes con acorde doble de 2 pulgares
      const nextRaw = (i + 1 < scoredNotes.length) ? scoredNotes[i + 1] : null;
      const isSimultaneousWithNext = nextRaw && Math.abs(nextRaw.timestamp_ms - t) <= 32;
      const allowPowerChord = densityMode === 'impossible'
        ? (n.priority >= 80 && (t - lastChordTimestamp >= 145) && (!nextRaw || (nextRaw.timestamp_ms - t >= 85)))
        : (densityMode === 'extreme' && n.priority >= 98 && (t - lastChordTimestamp >= 340) && (!nextRaw || (nextRaw.timestamp_ms - t >= 145)));
      if (
        allowPowerChord &&
        !isSimultaneousWithNext &&
        n.type !== 'hold' &&
        !(n.duration_ms && n.duration_ms > 140)
      ) {
        const origLane = n.originalLane ?? n.lane ?? 0;
        const maxOrig = Math.max(2, (totalLanes || 4) - 1);
        const partnerOrig = origLane <= Math.floor(maxOrig / 2) ? maxOrig : 0;
        thinned.push({
          ...n,
          originalLane: partnerOrig,
          lane: partnerOrig,
          type: 'tap',
          duration_ms: null,
          end_timestamp_ms: null,
          _isExtremeChordCompanion: true
        });
        lastChordTimestamp = t;
      }
    }

    return thinned;
  }

  /**
   * Sanitizador Universal para 2 Dedos (Soporta 3 o 4 carriles)
   */
  static sanitizeForTwoFingers(notes, bpm = 120, stars = 3.0, densityMode = 'hard', targetLanes = 3) {
    if (!notes || notes.length === 0) return [];
    const numLanes = targetLanes === 4 ? 4 : 3;
    const maxLaneIdx = numLanes - 1;

    const preThinned = this.thinMultiLaneChart(notes, numLanes, bpm, stars, densityMode);
    const sorted = [...preThinned].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    const maxChordLimit = densityMode === 'easy' ? 1 : 2;

    // 1. Agrupar en acordes instantáneos (<= 35ms)
    const chordGroups = [];
    let currentGroup = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const anchor = currentGroup[0];
      if (Math.abs(curr.timestamp_ms - anchor.timestamp_ms) <= 35) {
        currentGroup.push(curr);
      } else {
        chordGroups.push(currentGroup);
        currentGroup = [curr];
      }
    }
    if (currentGroup.length > 0) chordGroups.push(currentGroup);

    // 2. En cada acorde: Máximo maxChordLimit notas, cada una en carril distinto
    const pass1Notes = [];
    const allLaneIndices = numLanes === 4 ? [0, 1, 2, 3] : [0, 1, 2];

    for (const group of chordGroups) {
      // Ordenar el acorde de izquierda a derecha según su carril original para mantener coherencia espacial
      group.sort((a, b) => (a.originalLane ?? a.lane ?? 0) - (b.originalLane ?? b.lane ?? 0));
      const usedLanes = new Set();
      const kept = [];

      for (const n of group) {
        if (kept.length >= maxChordLimit) break;

        let targetLane = Math.max(0, Math.min(maxLaneIdx, n.lane ?? 1));
        if (usedLanes.has(targetLane)) {
          const candidates = allLaneIndices
            .filter(l => !usedLanes.has(l))
            .sort((a, b) => Math.abs(a - targetLane) - Math.abs(b - targetLane));
          if (candidates.length > 0) {
            targetLane = candidates[0];
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

    // 3. Anti-Jackhammer (evita ráfagas imposibles en el mismo carril alternando al carril vecino libre)
    const minSameLaneGap = densityMode === 'easy'
      ? 240
      : (densityMode === 'medium'
          ? 170
          : (densityMode === 'impossible'
              ? 48
              : (densityMode === 'extreme'
                  ? 82
                  : (stars < 5.0 ? 150 : 125))));
    const pass2Notes = [];
    const laneLastHitTime = new Array(numLanes).fill(-Infinity);

    for (let i = 0; i < pass1Notes.length; i++) {
      const n = pass1Notes[i];
      const t = n.timestamp_ms;
      n.lane = Math.max(0, Math.min(maxLaneIdx, n.lane ?? 1));

      const lastSameLaneTime = laneLastHitTime[n.lane];
      if (t - lastSameLaneTime < minSameLaneGap && n.type === 'tap') {
        const candidates = allLaneIndices
          .filter(l => l !== n.lane)
          .sort((a, b) => Math.abs(a - n.lane) - Math.abs(b - n.lane));
        let alternated = false;
        for (const alt of candidates) {
          if (t - laneLastHitTime[alt] >= minSameLaneGap) {
            const recentAroundT = pass2Notes.filter(prev => Math.abs(prev.timestamp_ms - t) <= 24);
            const usedLanesAroundT = new Set(recentAroundT.map(r => r.lane));
            if (!usedLanesAroundT.has(alt) && usedLanesAroundT.size < maxChordLimit) {
              n.lane = alt;
              alternated = true;
              break;
            }
          }
        }
        if (!alternated) {
          // En Imposible conservar ráfagas ultra rápidas si hay >= 38ms; en Extrema >= 64ms
          const minJackFloor = densityMode === 'impossible' ? 38 : (densityMode === 'extreme' ? 64 : Infinity);
          if (t - lastSameLaneTime < minJackFloor) {
            continue;
          }
        }
      }

      const recent = pass2Notes.filter(prev => Math.abs(prev.timestamp_ms - t) <= 24);
      const recentLanes = new Set(recent.map(r => r.lane));
      if (!recentLanes.has(n.lane) && recentLanes.size >= maxChordLimit) {
        continue;
      }

      laneLastHitTime[n.lane] = t;
      pass2Notes.push(n);
    }

    // 4. Regla Estricta de Holds (Solo laterales extremos y Cero Solapamiento)
    return this.enforceStrictLateralHoldsAndAntiOverlap(pass2Notes, numLanes, densityMode);
  }

  /**
   * REGLA ESTRICTA DE HOLDS (SOLO LATERALES Y SIN SOLAPAMIENTO):
   * 1. Las notas largas se ubican en los carriles exteriores (0 o maxLaneIdx) para ergonomía de pulgares.
   * 2. Ninguna nota puede aparecer en el mismo carril mientras un hold esté activo (+60ms margen).
   * 3. Nunca hay más de 1 Hold activo a la vez.
   */
  static enforceStrictLateralHoldsAndAntiOverlap(notes, targetLanes = 3, densityMode = 'hard') {
    if (!notes || notes.length === 0) return [];
    const numLanes = targetLanes === 4 ? 4 : 3;
    const maxLaneIdx = numLanes - 1;
    const allLaneIndices = numLanes === 4 ? [0, 1, 2, 3] : [0, 1, 2];
    const isImpossible = (densityMode === 'impossible');
    const isHighSpeed = (isImpossible || densityMode === 'extreme');

    const sorted = [...notes].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    const SAFETY_MARGIN_MS = isImpossible ? 32 : (densityMode === 'extreme' ? 46 : 60);

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

    const finalHolds = [];
    const holdIntervals = []; // { lane, start, end }

    for (const h of processedHolds) {
      const start = h.timestamp_ms;
      let end = h.end_timestamp_ms || (start + (h.duration_ms || 600));

      // En Extrema e Imposible: si un hold taparía ráfagas rápidas o acordes dobles siguientes, acortarlo o convertirlo en tap
      if (isHighSpeed) {
        for (let k = 0; k < nonHoldNotes.length; k++) {
          const nt = nonHoldNotes[k].timestamp_ms;
          if (nt > start + 35 && nt <= end + SAFETY_MARGIN_MS) {
            end = Math.min(end, nt - SAFETY_MARGIN_MS - 10);
            break;
          }
        }
        if (end - start < 220) {
          h.type = 'tap';
          h.lane = Math.max(0, Math.min(maxLaneIdx, h.lane ?? 1));
          h.duration_ms = 0;
          delete h.end_timestamp_ms;
          nonHoldNotes.push(h);
          continue;
        }
      }

      const anyHoldActive = holdIntervals.some(i => !(end + SAFETY_MARGIN_MS <= i.start || start >= i.end + SAFETY_MARGIN_MS));

      if (anyHoldActive) {
        h.type = 'tap';
        h.lane = Math.max(0, Math.min(maxLaneIdx, h.lane ?? 1));
        h.duration_ms = 0;
        delete h.end_timestamp_ms;
        nonHoldNotes.push(h);
        continue;
      }

      let chosenLane = (h.lane === 0 || h.lane === maxLaneIdx)
        ? h.lane
        : (h.lane < numLanes / 2 ? 0 : maxLaneIdx);

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

    nonHoldNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    const finalTaps = [];
    const conflictWindowMs = isImpossible ? 20 : (densityMode === 'extreme' ? 32 : 45);
    for (const n of nonHoldNotes) {
      const t = n.timestamp_ms;
      const activeHold = holdIntervals.find(h => t >= h.start - 30 && t <= h.end + SAFETY_MARGIN_MS);

      if (activeHold) {
        const alreadyHasTapDuringHold = finalTaps.some(prev => Math.abs(prev.timestamp_ms - t) <= (isImpossible ? 26 : (densityMode === 'extreme' ? 42 : 60)));
        if (alreadyHasTapDuringHold) {
          continue;
        }

        const freeLanes = allLaneIndices.filter(l => l !== activeHold.lane);
        let targetLane = freeLanes.includes(n.lane) ? n.lane : freeLanes[0];

        n.lane = targetLane;
        finalTaps.push(n);
        continue;
      }

      let targetLane = Math.max(0, Math.min(maxLaneIdx, n.lane ?? 1));
      const tapConflict = finalTaps.some(prev => prev.lane === targetLane && Math.abs(prev.timestamp_ms - t) <= conflictWindowMs);
      if (tapConflict) {
        const freeCandidate = allLaneIndices.find(l => {
          const hasTap = finalTaps.some(prev => prev.lane === l && Math.abs(prev.timestamp_ms - t) <= conflictWindowMs);
          return !hasTap;
        });
        if (freeCandidate !== undefined) {
          const simultaneousCount = finalTaps.filter(prev => Math.abs(prev.timestamp_ms - t) <= conflictWindowMs).length;
          if (simultaneousCount >= 2) {
            continue;
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
        else if (n.lane === maxLaneIdx) n.direction = 'right';
        else n.direction = (idx % 2 === 0) ? 'up' : 'down';
      }
    });

    return merged;
  }

  /**
   * Resuelve colisiones iniciales y sanitiza para 2 dedos en 3 o 4 carriles
   */
  static resolveCollisions(rawNotes, totalLanes = 4, bpm = 120, stars = 3.0, densityMode = 'hard', targetLanes = 3) {
    if (!rawNotes || rawNotes.length === 0) return [];
    const numLanes = targetLanes === 4 ? 4 : 3;

    // Paso 1: Poda de canales múltiples manteniendo timestamps exactos
    const thinned = this.thinMultiLaneChart(rawNotes, totalLanes, bpm, stars, densityMode);

    // Paso 2: Mapear carriles preservando el contorno melódico entre notas consecutivas
    let prevMapped = -1;
    let prevOrig = -1;
    const mapped = thinned.map(n => {
      const orig = n.originalLane ?? n.lane ?? 0;
      const lane = this.mapToLanes(orig, totalLanes, numLanes, prevMapped, prevOrig);
      prevMapped = lane;
      prevOrig = orig;
      return {
        ...n,
        originalLane: orig,
        sourceKeys: totalLanes,
        lane
      };
    });

    // Paso 3: Sanitización universal a 2 dedos + Holds laterales
    return this.sanitizeForTwoFingers(mapped, bpm, stars, densityMode, numLanes);
  }

  /**
   * Infiere el tier de densidad ('easy', 'medium', 'hard', 'extreme', 'impossible') a partir de ID/nombre/estrellas
   */
  static inferDensityModeFromDiff(diffIdOrName, stars = null) {
    const raw = String(diffIdOrName || '').toLowerCase().trim();
    if (raw.startsWith('easy::') || raw === 'easy' || raw === 'tier_easy' || raw === 'diff_easy' || raw.includes('fácil') || raw.includes('facil') || raw.includes('beginner')) {
      return 'easy';
    }
    if (raw.startsWith('medium::') || raw === 'medium' || raw === 'tier_medium' || raw === 'diff_normal' || raw === 'diff_medium' || raw.includes('media') || raw.includes('medio') || raw.includes('normal') || raw.includes('medium')) {
      return 'medium';
    }
    if (raw.startsWith('impossible::') || raw === 'impossible' || raw === 'tier_impossible' || raw === 'diff_impossible' || raw.includes('imposible') || raw.includes('impossible')) {
      return 'impossible';
    }
    if (raw.startsWith('extreme::') || raw === 'extreme' || raw === 'tier_extreme' || raw === 'diff_extreme' || raw.includes('extrema') || raw.includes('extremo') || raw.includes('extreme')) {
      return 'extreme';
    }
    if (raw.startsWith('hard::') || raw === 'hard' || raw === 'tier_hard' || raw === 'diff_hard' || raw.includes('difícil') || raw.includes('dificil') || raw.includes('hard')) {
      return 'hard';
    }
    // Etiquetas nativas de mappers (cuando no llevan prefijo de tier explícito)
    if (raw.includes('expert+') || raw.includes('lunatic') || raw.includes('hell') || raw.includes('god')) {
      return 'impossible';
    }
    if (raw.includes('insana') || raw.includes('insane') || raw.includes('master')) {
      return 'extreme';
    }
    if (raw.includes('expert')) {
      return 'hard';
    }
    const s = parseFloat(stars);
    if (Number.isFinite(s)) {
      if (s <= 2.35) return 'easy';
      if (s <= 3.75) return 'medium';
      if (s >= 7.55) return 'impossible';
      if (s >= 5.35) return 'extreme';
    }
    return 'hard';
  }

  static extractSourceDiffId(diffId) {
    const raw = String(diffId || '').trim();
    if (raw.includes('::')) {
      return raw.split('::').slice(1).join('::');
    }
    return raw;
  }

  static getStandardTierName(densityMode) {
    if (densityMode === 'easy') return 'Fácil';
    if (densityMode === 'medium') return 'Media';
    if (densityMode === 'impossible') return 'Imposible';
    if (densityMode === 'extreme') return 'Extrema';
    return 'Difícil';
  }

  /**
   * Calcula las estrellas reales y objetivas (1.2★ a 10.0★) de un chart jugable de 2 pulgares.
   * Garantiza que Extrema (5.4★ - 7.4★) tenga la misma exigencia física entre Karaoke/Top y mapas osu!,
   * mientras que Imposible (7.6★ - 10.0★) queda reservada a la barbaridad real sin recortes de osu!/BeatSaver/Clone Hero.
   */
  static calculateObjectiveStars(notes, bpm = 120, densityMode = null, fallbackStars = null) {
    const mode = densityMode || this.inferDensityModeFromDiff('', fallbackStars);
    if (!Array.isArray(notes) || notes.length < 8) {
      if (mode === 'easy') return 1.6;
      if (mode === 'medium') return 2.9;
      if (mode === 'impossible') return 8.2;
      if (mode === 'extreme') return 6.0;
      return 4.3;
    }

    const valid = notes
      .filter(n => n && !n.isMine)
      .map(n => {
        const t = Number.isFinite(n.timestamp_ms)
          ? n.timestamp_ms
          : (Number.isFinite(n.timeMs) ? n.timeMs : (Number.isFinite(n.timestamp) ? n.timestamp : (Number.isFinite(n.time) ? (n.time > 100 ? n.time : n.time * 1000) : 0)));
        const dur = Number.isFinite(n.duration_ms) ? n.duration_ms : (Number.isFinite(n.holdDuration) ? n.holdDuration * 1000 : 0);
        return { t: Math.round(t), isHold: n.type === 'hold' || dur >= 180 };
      })
      .sort((a, b) => a.t - b.t);

    if (valid.length < 8) return mode === 'easy' ? 1.5 : 3.0;

    // Agrupar notas simultáneas (<= 35ms) en eventos rítmicos reales
    const events = [];
    let curGroup = [valid[0]];
    for (let i = 1; i < valid.length; i++) {
      if (Math.abs(valid[i].t - curGroup[0].t) <= 35) {
        curGroup.push(valid[i]);
      } else {
        events.push(curGroup);
        curGroup = [valid[i]];
      }
    }
    if (curGroup.length > 0) events.push(curGroup);

    const spanSec = Math.max(18, (events[events.length - 1][0].t - events[0][0].t) / 1000);
    const eventCount = events.length;
    const avgEps = eventCount / spanSec;

    let chordEvents = 0;
    let holdNotes = 0;
    let fastGaps = 0;
    let burstGaps = 0;
    let ultraBurstGaps = 0;

    for (let i = 0; i < events.length; i++) {
      const g = events[i];
      if (g.length >= 2) chordEvents++;
      for (const item of g) {
        if (item.isHold) holdNotes++;
      }
      if (i > 0) {
        const gap = g[0].t - events[i - 1][0].t;
        if (gap < 145) fastGaps++;
        if (gap < 95) burstGaps++;
        if (gap < 62) ultraBurstGaps++;
      }
    }

    // Densidad pico sostenida en ventanas de 4 segundos (percentil 85 y percentil 95)
    const windowEpsList = [];
    let leftIdx = 0;
    for (let rightIdx = 0; rightIdx < events.length; rightIdx++) {
      const rightT = events[rightIdx][0].t;
      while (leftIdx < rightIdx && rightT - events[leftIdx][0].t > 4000) {
        leftIdx++;
      }
      if (rightT - events[0][0].t >= 3000) {
        windowEpsList.push((rightIdx - leftIdx + 1) / 4.0);
      }
    }
    windowEpsList.sort((a, b) => a - b);
    const p85Eps = windowEpsList.length > 0
      ? windowEpsList[Math.min(windowEpsList.length - 1, Math.floor(windowEpsList.length * 0.85))]
      : avgEps * 1.25;
    const p95Eps = windowEpsList.length > 0
      ? windowEpsList[Math.min(windowEpsList.length - 1, Math.floor(windowEpsList.length * 0.95))]
      : p85Eps * 1.15;

    const chordRatio = chordEvents / Math.max(1, eventCount);
    const holdRatio = holdNotes / Math.max(1, valid.length);
    const fastRatio = fastGaps / Math.max(1, eventCount - 1);
    const burstRatio = burstGaps / Math.max(1, eventCount - 1);
    const ultraRatio = ultraBurstGaps / Math.max(1, eventCount - 1);

    const rawStars = 0.65 + (avgEps * 0.56) + (p85Eps * 0.34) + (chordRatio * 1.15) + (holdRatio * 0.35) + (fastRatio * 1.05) + (burstRatio * 1.25) + (ultraRatio * 1.65);

    // Calibrar dentro de la banda física real del tier elegido para consistencia total entre catálogos
    let finalStars = rawStars;
    if (mode === 'easy') {
      finalStars = Math.max(1.2, Math.min(2.3, 1.15 + (rawStars - 1.0) * 0.42));
    } else if (mode === 'medium') {
      finalStars = Math.max(2.4, Math.min(3.7, 2.35 + (rawStars - 1.8) * 0.48));
    } else if (mode === 'hard') {
      finalStars = Math.max(3.8, Math.min(5.3, 3.75 + (rawStars - 2.6) * 0.52));
    } else if (mode === 'extreme') {
      // Tanto Karaoke Extrema como osu! Extrema intermedio viven en [5.4★ - 7.4★] con el mismo baremo físico
      finalStars = Math.max(5.4, Math.min(7.4, 5.35 + Math.max(0, rawStars - 3.6) * 0.52));
    } else if (mode === 'impossible') {
      // Exclusivo de mapas salvajes osu!/BeatSaver/Clone Hero: [7.6★ - 10.0★]
      const impScore = rawStars + (p95Eps * 0.18);
      finalStars = Math.max(7.6, Math.min(10.0, 7.55 + Math.max(0, impScore - 5.2) * 0.44));
    }

    return Math.round(finalStars * 10) / 10;
  }

  /**
   * Normaliza las dificultades de cualquier canción del catálogo a:
   * - Karaoke / Top / Comunidad: { Fácil, Media, Difícil, Extrema } (máximo Extrema 5.4★-7.3★)
   * - Mapas osu! / BeatSaver / Clone Hero: { Fácil, Media, Difícil, Extrema (intermedia), Imposible (solo mapas salvajes) }
   */
  static normalizeSongDifficulties(item) {
    if (!item || typeof item !== 'object') return [];
    if (item._diffsNormalizedVersion === 2 && Array.isArray(item.difficulties) && item.difficulties.length > 0) {
      if (Array.isArray(item.diffs) && item.diffs !== item.difficulties) {
        item.diffs = item.difficulties;
      }
      return item.difficulties;
    }

    const srcLower = String(item.source || item.source_name || '').toLowerCase();
    const idStr = String(item.id || '');
    const isExplicitMapped = Boolean(
      srcLower.includes('osu') ||
      srcLower.includes('beatsaver') ||
      srcLower.includes('beat saber') ||
      srcLower.includes('clonehero') ||
      srcLower.includes('clone hero') ||
      srcLower.includes('catboy') ||
      srcLower.includes('nerinyan') ||
      idStr.startsWith('osu_') ||
      idStr.startsWith('bs_') ||
      idStr.startsWith('clonehero_') ||
      idStr.startsWith('ch_') ||
      item.sng_url ||
      item.bs_hash
    );

    let effBpm = Number(item.bpm || item.metadata?.bpm) || 120;
    while (effBpm > 195) effBpm /= 2;
    while (effBpm < 75) effBpm *= 2;
    const tempoFactor = Math.max(0.85, Math.min(1.22, effBpm / 120));

    const standardized = [];

    if (!isExplicitMapped) {
      // Karaoke / Canciones Top / Catálogo vocal / Comunidad: máximo 4 categorías (NUNCA Imposible)
      const rawNotesCount = Number(
        item.total_notes ||
        item.notes_count ||
        (Array.isArray(item.notes) ? item.notes.length : 0) ||
        item.metadata?.total_notes ||
        340
      );
      // Índice objetivo de densidad natural de la canción según sus notas reales y tempo
      const naturalDensity = (rawNotesCount / 108) * (0.76 + 0.24 * tempoFactor);

      // 1. Fácil (Siempre disponible, filtra suavemente las notas reales a tempo)
      const easyStars = Math.max(1.2, Math.min(2.3, Math.round((1.25 + Math.min(0.95, naturalDensity * 0.16)) * 10) / 10));
      standardized.push({
        id: 'easy',
        sourceDiffId: 'easy',
        densityMode: 'easy',
        name: 'Fácil',
        stars: easyStars,
        keys: 3,
        label: `Fácil (${easyStars.toFixed(1)}★)`
      });

      // 2. Media (Solo si la canción tiene suficientes notas reales para nivel intermedio: >= 200 notas)
      if (rawNotesCount >= 200 || naturalDensity >= 2.15) {
        const medStars = Math.max(2.4, Math.min(3.7, Math.round((2.4 + Math.min(1.25, (naturalDensity - 1.7) * 0.30)) * 10) / 10));
        standardized.push({
          id: 'medium',
          sourceDiffId: 'medium',
          densityMode: 'medium',
          name: 'Media',
          stars: medStars,
          keys: 3,
          label: `Media (${medStars.toFixed(1)}★)`
        });
      }

      // 3. Difícil (Solo si la canción tiene ritmo real suficiente sin inventar rellenos artificiales: >= 325 notas)
      if (rawNotesCount >= 325 || naturalDensity >= 3.25) {
        const hardStars = Math.max(3.8, Math.min(5.2, Math.round((3.75 + Math.min(1.40, (naturalDensity - 2.9) * 0.36)) * 10) / 10));
        standardized.push({
          id: 'hard',
          sourceDiffId: 'hard',
          densityMode: 'hard',
          name: 'Difícil',
          stars: hardStars,
          keys: 3,
          label: `Difícil (${hardStars.toFixed(1)}★)`
        });
      }

      // 4. Extrema (Techo máximo de canciones Karaoke/Top/Comunidad: 5.4★ - 7.3★, equiparada al nuevo Extrema intermedio de osu!)
      if (rawNotesCount >= 340 || naturalDensity >= 3.35) {
        const extStars = Math.max(5.4, Math.min(7.3, Math.round((5.4 + Math.min(1.85, Math.max(0, naturalDensity - 3.2) * 0.42)) * 10) / 10));
        standardized.push({
          id: 'extreme',
          sourceDiffId: 'extreme',
          densityMode: 'extreme',
          name: 'Extrema',
          stars: extStars,
          keys: 3,
          label: `Extrema (${extStars.toFixed(1)}★)`
        });
      }
    } else {
      // Canciones mapeadas externas (osu!, BeatSaver, Clone Hero)
      const incomingDiffs = Array.isArray(item.difficulties) && item.difficulties.length > 0
        ? item.difficulties
        : (Array.isArray(item.diffs) && item.diffs.length > 0 ? item.diffs : null);

      if (!Array.isArray(item._rawDifficulties) && incomingDiffs) {
        const looksLikeLegacyNormalized = incomingDiffs.every(d => d && ['easy', 'medium', 'hard', 'extreme', 'impossible'].includes(d.densityMode));
        if (looksLikeLegacyNormalized) {
          // Reconstruir fielmente estrellas crudas de origen si venía guardado en caché/IndexedDB con el esquema antiguo de 4 niveles
          item._rawDifficulties = incomingDiffs.map(d => {
            let origStars = parseFloat(d.stars) || 3.5;
            if (d.densityMode === 'extreme' && origStars >= 5.4) {
              origStars = 3.5 + ((origStars - 5.35) / (0.48 * tempoFactor));
            }
            return {
              id: this.extractSourceDiffId(d.sourceDiffId || d.id || 'default'),
              name: d.name || 'Normal',
              stars: Math.round(origStars * 10) / 10,
              keys: d.keys || 4,
              nps: d.nps || 0,
              notes_count: d.notes_count || d.notesCount || 0
            };
          });
        } else {
          item._rawDifficulties = incomingDiffs.map(d => ({ ...d }));
        }
      }

      const baseList = Array.isArray(item._rawDifficulties) && item._rawDifficulties.length > 0
        ? item._rawDifficulties
        : (incomingDiffs || [{ id: 'default', name: 'Normal', stars: parseFloat(item.stars) || 4.2, keys: 4 }]);

      const rawDiffs = [...baseList].sort((a, b) => (parseFloat(a.stars) || 3.0) - (parseFloat(b.stars) || 3.0));

      const minRawStars = Math.max(0.8, parseFloat(rawDiffs[0]?.stars) || 2.0);
      const maxRawDiff = rawDiffs[rawDiffs.length - 1];
      const maxRawStars = Math.max(minRawStars, parseFloat(maxRawDiff?.stars) || 4.2);
      const maxRawNotes = Math.max(
        Number(item.notes_count || item.total_notes || 0),
        ...rawDiffs.map(d => Number(d.notes_count || d.notesCount || 0))
      );
      const maxRawNps = Math.max(
        0,
        ...rawDiffs.map(d => parseFloat(d.nps) || 0)
      );

      const pickClosestRawDiff = (targetStar) => {
        let best = rawDiffs[0];
        let bestDist = Infinity;
        for (const d of rawDiffs) {
          const s = parseFloat(d.stars) || 3.0;
          const dist = Math.abs(s - targetStar);
          if (dist < bestDist) {
            bestDist = dist;
            best = d;
          }
        }
        return best || maxRawDiff;
      };

      // 1. Fácil (1.2★ - 2.3★)
      const easySource = pickClosestRawDiff(1.8);
      const easySrcId = this.extractSourceDiffId(easySource.sourceDiffId || easySource.id || 'default');
      const easyStars = Math.max(1.2, Math.min(2.3, Math.round((1.25 + Math.min(0.95, minRawStars * 0.22 * tempoFactor)) * 10) / 10));
      standardized.push({
        id: `easy::${easySrcId}`,
        sourceDiffId: easySrcId,
        densityMode: 'easy',
        name: 'Fácil',
        stars: easyStars,
        keys: easySource.keys || 4,
        label: `Fácil (${easyStars.toFixed(1)}★)`
      });

      // 2. Media (2.4★ - 3.7★, si el mapa real supera 2.2★)
      if (maxRawStars >= 2.2) {
        const medSource = pickClosestRawDiff(3.1);
        const medSrcId = this.extractSourceDiffId(medSource.sourceDiffId || medSource.id || 'default');
        const medBase = Math.min(maxRawStars, Math.max(2.2, parseFloat(medSource.stars) || 3.0));
        const medStars = Math.max(2.4, Math.min(3.7, Math.round((2.4 + Math.min(1.25, (medBase - 1.6) * 0.36 * tempoFactor)) * 10) / 10));
        standardized.push({
          id: `medium::${medSrcId}`,
          sourceDiffId: medSrcId,
          densityMode: 'medium',
          name: 'Media',
          stars: medStars,
          keys: medSource.keys || 4,
          label: `Media (${medStars.toFixed(1)}★)`
        });
      }

      // 3. Difícil (3.8★ - 5.3★, si el mapa real supera 3.2★)
      if (maxRawStars >= 3.2) {
        const hardSource = pickClosestRawDiff(4.2);
        const hardSrcId = this.extractSourceDiffId(hardSource.sourceDiffId || hardSource.id || 'default');
        const hardBase = Math.min(maxRawStars, Math.max(3.2, parseFloat(hardSource.stars) || 4.1));
        const hardStars = Math.max(3.8, Math.min(5.3, Math.round((3.78 + Math.min(1.45, (hardBase - 3.0) * 0.46 * tempoFactor)) * 10) / 10));
        standardized.push({
          id: `hard::${hardSrcId}`,
          sourceDiffId: hardSrcId,
          densityMode: 'hard',
          name: 'Difícil',
          stars: hardStars,
          keys: hardSource.keys || 4,
          label: `Difícil (${hardStars.toFixed(1)}★)`
        });
      }

      // 4. Extrema INTERMEDIA (5.4★ - 7.4★): Escalón real entre Difícil e Imposible, coherente en estrellas con Extrema de Karaoke/Top
      if (maxRawStars >= 4.0) {
        // Si el pack tiene varias dificultades altas (ej. Insane 5.2★ y Extra 7.1★), elegir la intermedia-alta (~5.3★) como fuente de Extrema
        const extSource = (rawDiffs.length >= 3 && maxRawStars >= 5.6) ? pickClosestRawDiff(5.3) : maxRawDiff;
        const extSrcId = this.extractSourceDiffId(extSource.sourceDiffId || extSource.id || 'default');
        const extBase = Math.min(maxRawStars, Math.max(4.0, parseFloat(extSource.stars) || maxRawStars));
        const extStars = Math.max(5.4, Math.min(7.4, Math.round((5.4 + Math.min(1.95, Math.max(0, extBase - 3.85) * 0.46 * tempoFactor)) * 10) / 10));
        standardized.push({
          id: `extreme::${extSrcId}`,
          sourceDiffId: extSrcId,
          densityMode: 'extreme',
          name: 'Extrema',
          stars: extStars,
          keys: extSource.keys || maxRawDiff.keys || 4,
          label: `Extrema (${extStars.toFixed(1)}★)`
        });
      }

      // 5. IMPOSIBLE (7.6★ - 10.0★): EXCLUSIVA para mapas salvajes de osu!, BeatSaver y Clone Hero con densidad extrema real
      const qualifiesForImpossible = (
        maxRawStars >= 5.1 ||
        maxRawNps >= 6.2 ||
        (maxRawStars >= 4.8 && maxRawNotes >= 650) ||
        (maxRawStars >= 4.85 && effBpm >= 175)
      );
      if (qualifiesForImpossible) {
        const impSrcId = this.extractSourceDiffId(maxRawDiff.sourceDiffId || maxRawDiff.id || 'default');
        const noteBonus = maxRawNotes >= 700 ? Math.min(0.65, (maxRawNotes - 700) / 1400) : 0;
        const impStars = Math.max(
          7.6,
          Math.min(10.0, Math.round((7.6 + Math.min(2.4, (Math.max(0, maxRawStars - 4.9) * 0.58 * tempoFactor) + noteBonus)) * 10) / 10)
        );
        standardized.push({
          id: `impossible::${impSrcId}`,
          sourceDiffId: impSrcId,
          densityMode: 'impossible',
          name: 'Imposible',
          stars: impStars,
          keys: maxRawDiff.keys || 4,
          isImpossibleTier: true,
          label: `Imposible (${impStars.toFixed(1)}★)`
        });
      }
    }

    item.difficulties = standardized;
    if (Array.isArray(item.diffs)) {
      item.diffs = standardized;
    }
    item._diffsNormalized = true;
    item._diffsNormalizedVersion = 2;
    const defaultDiff = standardized.find(d => d.densityMode === 'hard') || standardized[standardized.length - 1];
    if (defaultDiff) {
      item.stars = defaultDiff.stars;
      item.difficulty_name = defaultDiff.name;
    }
    return standardized;
  }
}

// ==========================================
// 2. PARSER: OSU! MANIA & OSU! STANDARD (.osu)
// ==========================================

class OsuManiaParser {
  static parse(osuText, targetLanes = 3, densityMode = 'hard') {
    const lines = osuText.split(/\r?\n/);
    let currentSection = '';
    
    let audioFilename = 'audio.mp3';
    let audioLeadIn = 0;
    let mode = 0; // 0 = osu!standard, 3 = osu!mania
    let title = 'Canción';
    let artist = 'Artista';
    let creator = 'osu! Mapper';
    let version = 'Normal';
    let circleSize = 4; // Columns / Keys
    let overallDifficulty = 5;
    let sliderMultiplier = 1.4;

    const timingPoints = [];
    const allTimingPoints = [];
    const hitObjectsRaw = [];
    let taikoKatToggle = 0;
    let taikoDonToggle = 0;
    let stdPrevCol = -1;
    let stdPrevTime = -9999;

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
        if (key === 'Mode') mode = parseInt(val, 10) || 0;
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
        if (key === 'SliderMultiplier') sliderMultiplier = parseFloat(val) || 1.4;
      } else if (currentSection === 'TimingPoints') {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const time = parseFloat(parts[0]);
          const beatLength = parseFloat(parts[1]);
          const uninherited = parts.length > 6 ? parseInt(parts[6], 10) : (beatLength > 0 ? 1 : 0);
          allTimingPoints.push({ time, beatLength, uninherited });
          if (uninherited === 1 && beatLength > 0) {
            timingPoints.push({ time, bpm: 60000 / beatLength, beatLength });
          }
        }
      } else if (currentSection === 'HitObjects') {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const x = parseInt(parts[0], 10) || 0;
          const y = parseInt(parts[1], 10) || 0;
          const time = parseInt(parts[2], 10);
          const type = parseInt(parts[3], 10);
          const hitSound = parts.length > 4 ? (parseInt(parts[4], 10) || 0) : 0;

          const effectiveColumns = mode === 3 ? Math.max(3, Math.min(9, circleSize)) : 4;
          let originalLane = 0;

          if (mode === 3) {
            // osu!mania: columna directa por coordenada X
            originalLane = Math.max(0, Math.min(effectiveColumns - 1, Math.floor((x * effectiveColumns) / 512)));
          } else if (mode === 1) {
            // osu!taiko: Don (centro: carriles 1 y 2) vs Kat (borde: carriles 0 y 3)
            const isKat = (hitSound & 2) !== 0 || (hitSound & 8) !== 0;
            if (isKat) {
              originalLane = (taikoKatToggle++ % 2 === 0) ? 0 : 3;
            } else {
              originalLane = (taikoDonToggle++ % 2 === 0) ? 1 : 2;
            }
          } else {
            // osu!standard / osu!catch: combinar posición (X, Y) para repartir por los 4 carriles y evitar pilas en el mismo carril
            const normPos = Math.max(0, Math.min(0.999, ((x / 512) * 0.78) + ((y / 384) * 0.22)));
            originalLane = Math.floor(normPos * effectiveColumns);
            if (originalLane === stdPrevCol && (time - stdPrevTime) > 15 && (time - stdPrevTime) < 260) {
              originalLane = (originalLane + 1 + ((x + y) % (effectiveColumns - 1))) % effectiveColumns;
            }
            stdPrevCol = originalLane;
            stdPrevTime = time;
          }

          const isManiaHold = (type & 128) !== 0;
          const isSlider = (type & 2) !== 0;
          const isSpinner = (type & 8) !== 0;
          let endTime = time;
          let isHold = false;

          if (isManiaHold && parts.length >= 6) {
            const endPart = parts[5].split(':')[0];
            endTime = parseInt(endPart, 10) || (time + 400);
            isHold = true;
          } else if (isSpinner && parts.length >= 6) {
            const spinEnd = parseInt(parts[5].split(':')[0], 10) || 0;
            if (spinEnd > time + 180) {
              endTime = Math.min(time + 5000, spinEnd);
              isHold = true;
            }
          } else if (isSlider && parts.length >= 8) {
            const slides = Math.max(1, parseInt(parts[6], 10) || 1);
            const pixelLength = parseFloat(parts[7]) || 0;
            if (pixelLength > 0) {
              let baseBeatLength = timingPoints.length > 0 ? timingPoints[0].beatLength : 500;
              let svMult = 1.0;
              for (const tp of allTimingPoints) {
                if (tp.time <= time + 5) {
                  if (tp.uninherited === 1 && tp.beatLength > 0) {
                    baseBeatLength = tp.beatLength;
                    svMult = 1.0;
                  } else if (tp.uninherited === 0 && tp.beatLength < 0) {
                    svMult = Math.max(0.1, Math.min(10.0, -100.0 / tp.beatLength));
                  }
                } else {
                  break;
                }
              }
              const pxPerBeat = 100 * sliderMultiplier * svMult;
              const singleSlideMs = Math.round((pixelLength / pxPerBeat) * baseBeatLength);
              const sliderDurationMs = singleSlideMs * slides;
              if (slides >= 2 && singleSlideMs >= 75 && sliderDurationMs <= 6000) {
                // En sliders con rebote (repeat sliders), emitir los golpes rítmicos reales de cada rebote del mapper
                for (let sIdx = 1; sIdx <= slides; sIdx++) {
                  const repTime = time + sIdx * singleSlideMs;
                  const repLane = (originalLane + sIdx) % effectiveColumns;
                  hitObjectsRaw.push({
                    originalLane: repLane,
                    sourceKeys: effectiveColumns,
                    timestamp_ms: repTime,
                    original_timestamp: repTime,
                    type: 'tap',
                    duration_ms: null,
                    end_timestamp_ms: null
                  });
                }
              } else if (sliderDurationMs >= 340 && sliderDurationMs <= 6000) {
                endTime = time + sliderDurationMs;
                isHold = true;
              }
            }
          }

          const duration = Math.max(0, endTime - time);

          hitObjectsRaw.push({
            originalLane: originalLane,
            sourceKeys: effectiveColumns,
            timestamp_ms: time,
            original_timestamp: time,
            type: (isHold && duration >= 140) ? 'hold' : 'tap',
            duration_ms: (isHold && duration >= 140) ? duration : null,
            end_timestamp_ms: (isHold && duration >= 140) ? endTime : null
          });

          // En osu!standard y osu!taiko, las notas con acento fuerte (Finish=4 o Clap=8) generan acorde doble real
          if ((mode === 0 || mode === 1) && ((hitSound & 4) !== 0 || (hitSound & 8) !== 0) && !isHold) {
            const partnerLane = originalLane === 0 ? 3 : (originalLane === 3 ? 0 : (originalLane === 1 ? 2 : 1));
            hitObjectsRaw.push({
              originalLane: partnerLane,
              sourceKeys: effectiveColumns,
              timestamp_ms: time,
              original_timestamp: time,
              type: 'tap',
              duration_ms: null,
              end_timestamp_ms: null
            });
          }
        }
      }
    }

    const bpm = timingPoints.length > 0 ? timingPoints[0].bpm : 120;
    const effectiveKeys = mode === 3 ? Math.max(3, Math.min(9, circleSize)) : 4;
    const finalNotes = LaneRemapper.resolveCollisions(hitObjectsRaw, effectiveKeys, Math.round(bpm), overallDifficulty, densityMode, targetLanes);

    return {
      audioFilename,
      audioLeadIn,
      title,
      artist,
      creator,
      difficultyName: version,
      stars: Math.max(1.0, Math.min(10.0, overallDifficulty)),
      bpm: Math.round(bpm),
      keys: effectiveKeys,
      rawNotes: hitObjectsRaw,
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
        sourceKeys: 5,
        timestamp_ms: Math.max(0, startMs),
        original_timestamp: Math.max(0, startMs),
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
      rawNotes: rawNotes,
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
          // Siempre capturamos también Expert (96-100) como respaldo si la pista inferior está vacía
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
          } else if (basePitch !== 96 && pitch >= 96 && pitch <= 100) {
            const expKey = 10 + (pitch - 96);
            if (isNoteOn) {
              activeNotes.set(expKey, currentTick);
            } else if (activeNotes.has(expKey)) {
              const startTick = activeNotes.get(expKey);
              const durationTicks = currentTick - startTick;
              noteEvents.push({ tick: startTick, fret: pitch - 96, length: durationTicks, _isFallbackExpert: true });
              activeNotes.delete(expKey);
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

    const primaryEvents = noteEvents.filter(e => !e._isFallbackExpert);
    const activeNoteEvents = primaryEvents.length >= 15 ? primaryEvents : noteEvents;

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

    const rawNotes = activeNoteEvents.map(ev => {
      const startMs = tickToMs(ev.tick);
      const isHold = ev.length > resolution / 4;
      const endMs = isHold ? tickToMs(ev.tick + ev.length) : startMs;
      const duration = isHold ? Math.max(0, endMs - startMs) : null;
      return {
        originalLane: ev.fret,
        sourceKeys: 5,
        timestamp_ms: Math.max(0, startMs),
        original_timestamp: Math.max(0, startMs),
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
      rawNotes: rawNotes,
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
        parsedBeatmap = CloneHeroParser.parse(chartText, LaneRemapper.extractSourceDiffId(selectedDiffId) || 'ExpertSingle');
      } else if (midiFileName) {
        log(5, 'Notas Clone Hero MIDI (.mid) encontradas', `Archivo: ${midiFileName}`, 'info');
        parsedBeatmap = MidiChartParser.parse(sng.files[midiFileName], LaneRemapper.extractSourceDiffId(selectedDiffId) || 'Expert');
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
          source_keys: parsedBeatmap.keys || 5,
          num_lanes: 3
        },
        rawNotes: parsedBeatmap.rawNotes || parsedBeatmap.notes,
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
        parsedBeatmap = CloneHeroParser.parse(chartTxt, LaneRemapper.extractSourceDiffId(selectedDiffId) || 'ExpertSingle');
      } else if (midiPath) {
        log(5, 'Archivo de notas MIDI (.mid) detectado', `Ruta: ${midiPath}`, 'info');
        const midiBuf = await fileMap[midiPath].arrayBuffer();
        parsedBeatmap = MidiChartParser.parse(midiBuf, LaneRemapper.extractSourceDiffId(selectedDiffId) || 'Expert');
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
          source_keys: parsedBeatmap.keys || 5,
          num_lanes: 3
        },
        rawNotes: parsedBeatmap.rawNotes || parsedBeatmap.notes,
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
            const nCnt = (parsed.notes && Array.isArray(parsed.notes)) ? parsed.notes.length : 0;
            extractedDiffs.push({
              file: f,
              id: f,
              name: parsed.difficultyName,
              stars: parsed.stars,
              keys: parsed.keys,
              notesCount: nCnt,
              label: `${parsed.difficultyName} (${parsed.stars}★)`,
              parsedData: parsed
            });
          }
          const playable = extractedDiffs.filter(d => d.notesCount >= 10);
          const pool = playable.length > 0 ? playable : extractedDiffs;
          const cleanFallbackId = LaneRemapper.extractSourceDiffId(selectedDiffId);
          let targetDiff = pool.find(d => d.id === cleanFallbackId || d.name === cleanFallbackId) || pool[pool.length - 1];
          const parsedBeatmap = targetDiff.parsedData;
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
              source_keys: parsedBeatmap.keys || 4,
              num_lanes: 3
            },
            rawNotes: parsedBeatmap.rawNotes || parsedBeatmap.notes,
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

      const osuTexts = await Promise.all(osuFiles.map(f => zip.file(f).async('text')));
      for (let i = 0; i < osuFiles.length; i++) {
        const f = osuFiles[i];
        const txt = osuTexts[i];
        const parsed = OsuManiaParser.parse(txt);
        const noteCount = (parsed.notes && Array.isArray(parsed.notes)) ? parsed.notes.length : 0;
        extractedDiffs.push({
          file: f,
          id: f,
          name: parsed.difficultyName,
          stars: parsed.stars,
          notesCount: noteCount,
          label: `${parsed.difficultyName} (${parsed.stars.toFixed(1)}★)`,
          parsedData: parsed
        });
      }

      // Filtrar dificultades auxiliares/hitsounds/dummy con <= 2 notas si existen dificultades completas
      const playableDiffs = extractedDiffs.filter(d => d.notesCount >= 10);
      const candidates = playableDiffs.length > 0 ? playableDiffs : extractedDiffs.filter(d => d.notesCount > 0);
      const finalPool = candidates.length > 0 ? candidates : extractedDiffs;

      finalPool.sort((a, b) => (a.notesCount || 0) - (b.notesCount || 0) || a.stars - b.stars);
      const reqDensity = LaneRemapper.inferDensityModeFromDiff(selectedDiffId);
      const cleanDiffId = LaneRemapper.extractSourceDiffId(selectedDiffId);

      // Construir mapa ligero de rawNotes por tier (easy, medium, hard, extreme, impossible) a partir de los .osu reales del paquete
      const pickPoolByFraction = (frac) => finalPool[Math.min(finalPool.length - 1, Math.max(0, Math.round((finalPool.length - 1) * frac)))];
      const easyEntry = finalPool[0].notesCount >= 45 ? finalPool[0] : finalPool[finalPool.length - 1];
      const medEntry = pickPoolByFraction(0.42);
      const hardEntry = finalPool.length <= 2 ? finalPool[finalPool.length - 1] : pickPoolByFraction(0.68);
      const extEntry = finalPool.length >= 4 ? pickPoolByFraction(0.84) : finalPool[finalPool.length - 1];
      const impEntry = finalPool[finalPool.length - 1];

      const tierRawNotes = {
        easy: easyEntry.parsedData.rawNotes || easyEntry.parsedData.notes,
        medium: medEntry.parsedData.rawNotes || medEntry.parsedData.notes,
        hard: hardEntry.parsedData.rawNotes || hardEntry.parsedData.notes,
        extreme: extEntry.parsedData.rawNotes || extEntry.parsedData.notes,
        impossible: impEntry.parsedData.rawNotes || impEntry.parsedData.notes
      };

      let chosen = finalPool.find(d => d.id === cleanDiffId || d.name === cleanDiffId);
      if (!chosen && cleanDiffId && !['easy', 'medium', 'hard', 'extreme', 'impossible'].includes(cleanDiffId.toLowerCase())) {
        chosen = finalPool.find(d => d.name.toLowerCase().includes(String(cleanDiffId).toLowerCase()) || d.file.toLowerCase().includes(String(cleanDiffId).toLowerCase()));
      }
      if (!chosen) {
        chosen = reqDensity === 'easy' ? easyEntry : (reqDensity === 'medium' ? medEntry : (reqDensity === 'impossible' ? impEntry : (reqDensity === 'extreme' ? extEntry : hardEntry)));
      }

      parsedBeatmap = chosen.parsedData;
      parsedBeatmap.tierRawNotes = tierRawNotes;
      targetAudioName = parsedBeatmap.audioFilename;
      extractedDiffs = finalPool.map(d => ({
        id: d.id,
        name: d.name,
        stars: d.stars,
        notesCount: d.notesCount,
        label: d.label
      }));

    } else if (
      fileType === 'beatsaver' ||
      files.some(f => {
        const lower = f.toLowerCase();
        return lower === 'info.dat' || lower.endsWith('/info.dat') || lower.endsWith('\\info.dat');
      })
    ) {
      log(5, 'Paquete Beat Saber (Info.dat) detectado', 'Extrayendo metadatos y dificultades...', 'info');
      const infoPath = files.find(f => {
        const lower = f.toLowerCase();
        return lower === 'info.dat' || lower.endsWith('/info.dat') || lower.endsWith('\\info.dat');
      });
      let infoJson = {};
      if (infoPath) {
        try {
          infoJson = JSON.parse(await zip.file(infoPath).async('text'));
        } catch (e) {}
      }

      const bsDiffList = BeatSaberParser.extractDifficultiesFromInfo(infoJson, files);
      const parsedDiffs = [];
      for (const dMeta of bsDiffList) {
        const matchFile = files.find(f => {
          const lower = f.toLowerCase();
          const targetLower = dMeta.file.toLowerCase();
          return lower === targetLower || lower.endsWith('/' + targetLower) || lower.endsWith('\\' + targetLower);
        });
        if (!matchFile) continue;
        try {
          const datTxt = await zip.file(matchFile).async('text');
          const datJson = JSON.parse(datTxt);
          const parsed = BeatSaberParser.parse(datJson, infoJson, dMeta, 3, 'hard');
          if (parsed && parsed.notes && parsed.notes.length > 0) {
            parsedDiffs.push({
              id: dMeta.id,
              name: dMeta.name,
              stars: parsed.stars,
              notesCount: parsed.notes.length,
              label: `${dMeta.name} (${parsed.stars.toFixed(1)}★)`,
              file: matchFile,
              parsedData: parsed
            });
          }
        } catch (e) {}
      }

      // Fallback si Info.dat no listaba los archivos .dat estándar
      if (parsedDiffs.length === 0) {
        const datFiles = files.filter(f => {
          const lower = f.toLowerCase();
          return lower.endsWith('.dat') && !lower.endsWith('info.dat') && !lower.includes('audioclip');
        });
        for (const df of datFiles) {
          try {
            const datJson = JSON.parse(await zip.file(df).async('text'));
            const baseName = df.split('/').pop().replace(/\.dat$/i, '');
            const parsed = BeatSaberParser.parse(datJson, infoJson, { id: baseName, name: baseName }, 3, 'hard');
            if (parsed && parsed.notes && parsed.notes.length > 0) {
              parsedDiffs.push({
                id: baseName,
                name: baseName,
                stars: parsed.stars,
                notesCount: parsed.notes.length,
                label: `${baseName} (${parsed.stars.toFixed(1)}★)`,
                file: df,
                parsedData: parsed
              });
            }
          } catch (e) {}
        }
      }

      if (parsedDiffs.length > 0) {
        parsedDiffs.sort((a, b) => (a.notesCount || 0) - (b.notesCount || 0) || a.stars - b.stars);
        const reqDensity = LaneRemapper.inferDensityModeFromDiff(selectedDiffId);
        const cleanDiffId = LaneRemapper.extractSourceDiffId(selectedDiffId);
        const pickBsByFraction = (frac) => parsedDiffs[Math.min(parsedDiffs.length - 1, Math.max(0, Math.round((parsedDiffs.length - 1) * frac)))];
        const easyBs = parsedDiffs[0].notesCount >= 40 ? parsedDiffs[0] : parsedDiffs[parsedDiffs.length - 1];
        const medBs = pickBsByFraction(0.42);
        const hardBs = parsedDiffs.length <= 2 ? parsedDiffs[parsedDiffs.length - 1] : pickBsByFraction(0.68);
        const extBs = parsedDiffs.length >= 4 ? pickBsByFraction(0.84) : parsedDiffs[parsedDiffs.length - 1];
        const impBs = parsedDiffs[parsedDiffs.length - 1];

        const tierRawNotes = {
          easy: easyBs.parsedData.rawNotes || easyBs.parsedData.notes,
          medium: medBs.parsedData.rawNotes || medBs.parsedData.notes,
          hard: hardBs.parsedData.rawNotes || hardBs.parsedData.notes,
          extreme: extBs.parsedData.rawNotes || extBs.parsedData.notes,
          impossible: impBs.parsedData.rawNotes || impBs.parsedData.notes
        };

        let chosen = parsedDiffs.find(d => d.id === cleanDiffId || d.name === cleanDiffId);
        if (!chosen && cleanDiffId && !['easy', 'medium', 'hard', 'extreme', 'impossible'].includes(cleanDiffId.toLowerCase())) {
          chosen = parsedDiffs.find(d => d.name.toLowerCase().includes(String(cleanDiffId).toLowerCase()) || d.id.toLowerCase().includes(String(cleanDiffId).toLowerCase()));
        }
        if (!chosen) {
          chosen = reqDensity === 'easy' ? easyBs : (reqDensity === 'medium' ? medBs : (reqDensity === 'impossible' ? impBs : (reqDensity === 'extreme' ? extBs : hardBs)));
        }
        parsedBeatmap = chosen.parsedData;
        parsedBeatmap.tierRawNotes = tierRawNotes;
        targetAudioName = parsedBeatmap.audioFilename;
        // Liberar referencias pesadas a JSZip (file) y arrays de notas de otras dificultades (parsedData)
        extractedDiffs = parsedDiffs.map(d => ({
          id: d.id,
          name: d.name,
          stars: d.stars,
          keys: d.keys,
          label: d.label
        }));
      }

    } else if (files.some(f => f.toLowerCase().endsWith('.chart'))) {
      const chartFile = files.find(f => f.toLowerCase().endsWith('.chart'));
      log(5, 'Notas Clone Hero (.chart) en ZIP', `Archivo: ${chartFile}`, 'info');
      const txt = await zip.file(chartFile).async('text');
      extractedDiffs = CloneHeroParser.getAvailableDifficulties(txt);
      parsedBeatmap = CloneHeroParser.parse(txt, LaneRemapper.extractSourceDiffId(selectedDiffId) || 'ExpertSingle');
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
      parsedBeatmap = MidiChartParser.parse(midiBuf, LaneRemapper.extractSourceDiffId(selectedDiffId) || 'Expert');
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
      log(5, 'Formato no reconocido', 'No se encontraron notas válidas (.osu, Info.dat, .chart, .mid)', 'error');
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
        return lower.endsWith('.mp3') || lower.endsWith('.ogg') || lower.endsWith('.egg') || lower.endsWith('.opus') || lower.endsWith('.wav') || lower.endsWith('.m4a');
      });
      if (audioPath) {
        audioFileEntry = zip.file(audioPath);
      }
    }

    if (!audioFileEntry) {
      log(5, 'Audio no encontrado en ZIP', 'No se encontró archivo de audio', 'error');
      throw new Error('No se encontró archivo de audio (.mp3, .ogg, .egg, .wav) dentro del paquete.');
    }

    log(5, 'Pista de audio cargada', `Archivo: ${audioFileEntry.name}`, 'info');
    const audioArrayBuffer = await audioFileEntry.async('arraybuffer');
    const audioName = audioFileEntry.name || 'audio.mp3';
    const ext = audioName.split('.').pop().toLowerCase();
    const mime = (ext === 'ogg' || ext === 'egg' || ext === 'opus') ? 'audio/ogg' : (ext === 'wav' ? 'audio/wav' : 'audio/mpeg');
    audioBlob = new Blob([audioArrayBuffer], { type: mime });

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
        source_keys: parsedBeatmap.keys || 4,
        num_lanes: 3
      },
      rawNotes: parsedBeatmap.rawNotes || parsedBeatmap.notes,
      tierRawNotes: parsedBeatmap.tierRawNotes || null,
      notes: parsedBeatmap.notes,
      audioBlob: audioBlob,
      audioUrl: null,
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
  static _dbPromise = null;

  static openDB() {
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve, reject) => {
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
      request.onsuccess = (e) => {
        const db = e.target.result;
        db.onclose = () => { this._dbPromise = null; };
        db.onversionchange = () => { db.close(); this._dbPromise = null; };
        resolve(db);
      };
      request.onerror = (e) => {
        this._dbPromise = null;
        reject(e.target.error);
      };
    });
    return this._dbPromise;
  }

  // --- Saved Offline Charts ---
  static async saveChart(chartItem, beatmapData, audioBlob) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_SAVED, 'readwrite');
      const store = tx.objectStore(this.STORE_SAVED);

      // Evitar duplicar audioBlob y arrays gigantes dentro de chartData para no saturar RAM ni provocar tirones de GC al iniciar la partida
      const baseNotes = beatmapData ? (beatmapData.notes || []) : [];
      const cleanChartData = beatmapData ? {
        id: beatmapData.id || chartItem.id,
        title: beatmapData.title || chartItem.title,
        artist: beatmapData.artist || chartItem.artist,
        creator: beatmapData.creator || chartItem.creator,
        bpm: beatmapData.bpm || (beatmapData.metadata && beatmapData.metadata.bpm) || 120,
        keys: beatmapData.keys || (beatmapData.metadata && beatmapData.metadata.source_keys) || 4,
        source: beatmapData.source || chartItem.source,
        source_name: beatmapData.source_name || chartItem.source_name,
        metadata: beatmapData.metadata,
        rawNotes: beatmapData.rawNotes || null
      } : null;

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
        direct_download_url: chartItem.direct_download_url || chartItem.download_url || '',
        fallback_download_url: chartItem.fallback_download_url || '',
        sng_url: chartItem.sng_url || '',
        bs_hash: chartItem.bs_hash || '',
        drive_id: chartItem.drive_id || '',
        parent_folder_id: chartItem.parent_folder_id || '',
        md5: chartItem.md5 || '',
        diff_id: chartItem.diff_id || '',
        difficulty_name: chartItem.difficulty_name || (beatmapData && beatmapData.metadata ? beatmapData.metadata.difficulty_name : '') || '',
        stars: chartItem.stars || (beatmapData && beatmapData.metadata ? beatmapData.metadata.stars : 3.5),
        is_top_song: Boolean(chartItem.is_top_song),
        is_community: Boolean(chartItem.is_community),
        chart_url: chartItem.chart_url || '',
        audio_url: chartItem.audio_url || '',
        metadata: beatmapData ? beatmapData.metadata : null,
        notes: baseNotes,
        chartData: cleanChartData,
        audioBlob: audioBlob,
        savedAt: Date.now()
      };

      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  static async getChart(chartId) {
    if (!chartId) return null;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_SAVED, 'readonly');
      const store = tx.objectStore(this.STORE_SAVED);
      const req = store.get(chartId);
      req.onsuccess = () => {
        if (req.result) return resolve(req.result);
        // Usar getAllKeys() en lugar de getAll() para NO deserializar todos los audioBlobs de la base de datos en RAM
        if (typeof store.getAllKeys !== 'function') return resolve(null);
        const keysReq = store.getAllKeys();
        keysReq.onsuccess = () => {
          const keys = keysReq.result || [];
          const targetSlug = String(chartId || '').toLowerCase().replace(/[\s\-_]+/g, '');
          if (!targetSlug) return resolve(null);
          const matchedKey = keys.find(k => {
            const kSlug = String(k || '').toLowerCase().replace(/[\s\-_]+/g, '');
            return kSlug && (kSlug === targetSlug || kSlug.includes(targetSlug) || targetSlug.includes(kSlug));
          });
          if (!matchedKey) return resolve(null);
          const subReq = store.get(matchedKey);
          subReq.onsuccess = () => resolve(subReq.result || null);
          subReq.onerror = () => resolve(null);
        };
        keysReq.onerror = () => resolve(null);
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
          download_url: chartItem.download_url || chartItem.direct_download_url || '',
          direct_download_url: chartItem.direct_download_url || chartItem.download_url || '',
          fallback_download_url: chartItem.fallback_download_url || '',
          sng_url: chartItem.sng_url || '',
          bs_hash: chartItem.bs_hash || '',
          drive_id: chartItem.drive_id || '',
          parent_folder_id: chartItem.parent_folder_id || '',
          md5: chartItem.md5 || '',
          diff_id: chartItem.diff_id || '',
          difficulty_name: chartItem.difficulty_name || (chartItem.metadata && chartItem.metadata.difficulty_name) || '',
          stars: chartItem.stars || (chartItem.metadata && chartItem.metadata.stars) || 3.5,
          is_top_song: Boolean(chartItem.is_top_song),
          is_community: Boolean(chartItem.is_community),
          chart_url: chartItem.chart_url || '',
          audio_url: chartItem.audio_url || '',
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

  // --- Custom Background Media (Image or Video Blob) ---
  static async saveCustomMedia(fileOrBlob, mediaType) {
    try {
      let cleanBlob = fileOrBlob;
      if (fileOrBlob && typeof fileOrBlob.arrayBuffer === 'function') {
        try {
          const buf = await fileOrBlob.arrayBuffer();
          cleanBlob = new Blob([buf], { type: fileOrBlob.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg') });
        } catch (bufErr) {
          cleanBlob = fileOrBlob;
        }
      }
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_SAVED, 'readwrite');
        const store = tx.objectStore(this.STORE_SAVED);
        const record = {
          id: 'custom_bg_media_blob',
          mediaType: mediaType,
          blob: cleanBlob,
          updatedAt: Date.now()
        };
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error saving custom media to IndexedDB:', e);
      return false;
    }
  }

  static async getCustomMedia() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_SAVED, 'readonly');
        const store = tx.objectStore(this.STORE_SAVED);
        const req = store.get('custom_bg_media_blob');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error getting custom media from IndexedDB:', e);
      return null;
    }
  }

  static async deleteCustomMedia() {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_SAVED, 'readwrite');
        const store = tx.objectStore(this.STORE_SAVED);
        const req = store.delete('custom_bg_media_blob');
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error deleting custom media from IndexedDB:', e);
      return false;
    }
  }

  // --- Highscores Respaldo Persistente ---
  static async saveHighscoreRecord(songId, record) {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_SAVED, 'readwrite');
        const store = tx.objectStore(this.STORE_SAVED);
        const item = {
          id: `highscore_${songId}`,
          songId,
          record,
          updatedAt: Date.now()
        };
        const req = store.put(item);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      console.warn('Error guardando highscore en IndexedDB:', e);
      return false;
    }
  }

  static async getAllHighscores() {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.STORE_SAVED, 'readonly');
        const store = tx.objectStore(this.STORE_SAVED);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = {};
          const all = req.result || [];
          for (const item of all) {
            if (item && item.id && item.id.startsWith('highscore_') && item.record) {
              results[item.songId] = item.record;
            }
          }
          resolve(results);
        };
        req.onerror = () => resolve({});
      });
    } catch (e) {
      console.warn('Error leyendo highscores de IndexedDB:', e);
      return {};
    }
  }
}

// ==========================================
// 8. ULTRASTAR KARAOKE PARSER (Spanish & Vocal Charts -> Beatstar 3-Lanes)
// ==========================================

class UltraStarParser {
  /**
   * Parsea el contenido en texto plano de un archivo UltraStar (.txt)
   * y devuelve un chart adaptado a los 3 carriles de Beatstar.
   */
  static parseTxt(txtContent, options = {}) {
    if (!txtContent || typeof txtContent !== 'string') {
      throw new Error('Contenido de UltraStar vacío o inválido');
    }

    const lines = txtContent.split(/\r?\n/);
    const headers = {};
    const rawEvents = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('#')) {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
          const key = trimmed.slice(1, colonIdx).toUpperCase().trim();
          const val = trimmed.slice(colonIdx + 1).trim();
          headers[key] = val;
        }
      } else if (trimmed.startsWith(':') || trimmed.startsWith('*') || trimmed.startsWith('F') || trimmed.startsWith('R') || trimmed.startsWith('G')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 4) {
          rawEvents.push({
            typeChar: parts[0],
            startBeat: parseInt(parts[1], 10),
            durBeat: parseInt(parts[2], 10),
            pitch: parseInt(parts[3], 10),
            lyric: parts.slice(4).join(' '),
            isBreak: false
          });
        }
      } else if (trimmed.startsWith('-')) {
        const beat = parseInt(trimmed.slice(1).trim(), 10);
        rawEvents.push({ isBreak: true, beat });
      }
    }

    const rawBpm = parseFloat((headers.BPM || '120').replace(',', '.'));
    const gapMs = parseFloat((headers.GAP || '0').replace(',', '.'));
    const msPerBeat = 15000 / (rawBpm > 0 ? rawBpm : 120);

    const noteEvents = rawEvents.filter(e => !e.isBreak);
    if (noteEvents.length === 0) {
      throw new Error('No se encontraron notas vocales en el archivo UltraStar');
    }

    // Análisis de percentiles de tono vocal para equilibrar los 3 carriles
    const allPitches = noteEvents.map(e => e.pitch).sort((a, b) => a - b);
    const pLow = allPitches[Math.floor(allPitches.length * 0.33)];
    const pHigh = allPitches[Math.floor(allPitches.length * 0.67)];

    const notes = [];
    let prevPitch = noteEvents[0].pitch;
    let samePitchStreak = 0;

    for (let i = 0; i < noteEvents.length; i++) {
      const ev = noteEvents[i];
      const tMs = Math.round(gapMs + (ev.startBeat * msPerBeat));
      const durMs = Math.round(ev.durBeat * msPerBeat);
      const isGolden = ev.typeChar === '*';

      const nextEvent = (i < noteEvents.length - 1) ? noteEvents[i + 1] : null;
      const isEndOfPhrase = !nextEvent || ((nextEvent.startBeat - (ev.startBeat + ev.durBeat)) > 8);

      if (ev.pitch === prevPitch) {
        samePitchStreak++;
      } else {
        samePitchStreak = 0;
      }

      // Asignación de carril basada en altura melódica
      let lane = 1;
      if (ev.pitch <= pLow) lane = 0;
      else if (ev.pitch >= pHigh) lane = 2;
      else lane = 1;

      // Ergonomía humana: evitar ráfagas excesivas en un mismo carril
      if (samePitchStreak >= 2) {
        if (lane === 1) lane = (samePitchStreak % 2 === 0) ? 0 : 2;
        else if (lane === 0) lane = 1;
        else if (lane === 2) lane = 1;
      }

      let type = 'tap';
      let holdDur = 0;
      let swipeDir = null;

      // Swipes para remates de frase intensos o notas doradas
      if (isEndOfPhrase && (isGolden || durMs >= 220 || ev.pitch >= pHigh)) {
        type = 'swipe';
        swipeDir = lane === 0 ? 'left' : (lane === 2 ? 'right' : 'up');
      } else if (durMs >= 260 || isGolden) {
        type = 'hold';
        holdDur = durMs;
      }

      notes.push({
        id: i,
        lane,
        column: lane,
        track: lane,
        time: tMs / 1000,
        timeSec: tMs / 1000,
        timeMs: tMs,
        timestamp: tMs,
        timestamp_ms: tMs,
        type,
        duration: holdDur / 1000,
        duration_ms: holdDur,
        holdDuration: holdDur / 1000,
        end_timestamp_ms: type === 'hold' ? (tMs + holdDur) : null,
        direction: swipeDir,
        swipeDirection: swipeDir,
        lyric: ev.lyric,
        pitch: ev.pitch
      });

      prevPitch = ev.pitch;
    }

    const cleanTitle = (headers.TITLE || 'Canción UltraStar').replace(/^[\ufffd\?]+/, '¿');
    const cleanArtist = headers.ARTIST || 'Artista';
    const cleanCover = headers.COVER || '';

    return {
      title: cleanTitle,
      artist: cleanArtist,
      bpm: Math.round((rawBpm / 4) * 10) / 10,
      ultrastar_bpm: rawBpm,
      stars: 4.0,
      difficulty_name: 'Media',
      scrollDurationMs: 1550,
      firstBeatOffsetMs: gapMs,
      startMarkerMs: 0,
      endMarkerMs: parseInt(headers.END || '0', 10) || (notes[notes.length - 1].timeMs + 5000),
      notes_count: notes.length,
      cover_filename: cleanCover,
      mp3_filename: headers.MP3 || '',
      notes
    };
  }
}

class BeatSaberParser {
  static extractDifficultiesFromInfo(infoJson, files = []) {
    const diffs = [];
    if (!infoJson || typeof infoJson !== 'object') return diffs;

    const sets = infoJson._difficultyBeatmapSets || infoJson.difficultyBeatmapSets || [];
    for (const set of sets) {
      const charName = set._beatmapCharacteristicName || set.beatmapCharacteristicName || 'Standard';
      const bmaps = set._difficultyBeatmaps || set.difficultyBeatmaps || [];
      for (const b of bmaps) {
        const diffName = b._difficulty || b.difficulty || 'Normal';
        const fileName = b._beatmapFilename || b.beatmapFilename || b.beatmapDataFilename || '';
        const rank = b._difficultyRank || b.difficultyRank || 3;
        const label = charName === 'Standard' ? diffName : `${diffName} (${charName})`;
        if (fileName) {
          diffs.push({
            id: diffName,
            name: label,
            file: fileName,
            rank: rank
          });
        }
      }
    }
    return diffs;
  }

  static parse(datJson, infoJson = {}, diffMeta = {}, targetLanes = 3, densityMode = 'hard') {
    const bpm = parseFloat(infoJson._beatsPerMinute || infoJson.audio?.bpm || datJson._beatsPerMinute || 120) || 120;
    const offsetSec = parseFloat(infoJson._songTimeOffset || infoJson.audio?.songTimeOffset || 0) || 0;
    const offsetMs = Math.round(offsetSec * 1000);
    const title = infoJson._songName || infoJson.song?.title || 'Beat Saber Track';
    const artist = infoJson._songAuthorName || infoJson.song?.author || 'BeatSaver Artist';
    const creator = infoJson._levelAuthorName || infoJson.song?.subTitle || 'BeatSaver Mapper';
    const audioFilename = infoJson._songFilename || infoJson.audio?.songFilename || 'song.egg';
    const difficultyName = diffMeta.name || diffMeta.id || 'Expert';

    const beatToMs = (beat) => Math.max(0, Math.round((beat * 60000) / bpm) + offsetMs);

    // Extraer notas en formato v2 (_notes), v3 (colorNotes) o v4 (colorNotes + colorNotesData)
    const rawColorNotes = [];
    if (Array.isArray(datJson._notes)) {
      for (const n of datJson._notes) {
        if (!n || (n._type !== 0 && n._type !== 1)) continue; // Ignorar bombas (_type === 3)
        rawColorNotes.push({
          beat: parseFloat(n._time) || 0,
          x: Math.max(0, Math.min(3, parseInt(n._lineIndex, 10) || 0)),
          y: parseInt(n._lineLayer, 10) || 0,
          c: parseInt(n._type, 10) || 0,
          d: parseInt(n._cutDirection, 10) ?? 8
        });
      }
    } else if (Array.isArray(datJson.colorNotes)) {
      const notesData = Array.isArray(datJson.colorNotesData) ? datJson.colorNotesData : null;
      for (const n of datJson.colorNotes) {
        if (!n) continue;
        const meta = (notesData && typeof n.i === 'number' && notesData[n.i]) ? notesData[n.i] : {};
        const beat = parseFloat(n.b ?? n.time ?? 0) || 0;
        const x = Math.max(0, Math.min(3, parseInt(n.x ?? meta.x ?? 0, 10) || 0));
        const y = parseInt(n.y ?? meta.y ?? 0, 10) || 0;
        const c = parseInt(n.c ?? meta.c ?? 0, 10) || 0;
        const d = parseInt(n.d ?? meta.d ?? 8, 10);
        rawColorNotes.push({ beat, x, y, c, d: Number.isNaN(d) ? 8 : d });
      }
    }

    // Extraer sliders / arcos (holds) en v2 (_sliders), v3 (sliders / burstSliders) o v4 (arcs)
    const holdIntervalsByKey = new Map();
    const rawHolds = [];
    const registerSlider = (startBeat, tailBeat, x) => {
      if (!Number.isFinite(startBeat) || !Number.isFinite(tailBeat) || tailBeat <= startBeat) return;
      const startMs = beatToMs(startBeat);
      const endMs = beatToMs(tailBeat);
      const dur = endMs - startMs;
      if (dur >= 140 && dur <= 8000) {
        const laneX = Math.max(0, Math.min(3, parseInt(x, 10) || 0));
        holdIntervalsByKey.set(`${laneX}_${ Math.round(startBeat * 100) }`, endMs);
        rawHolds.push({ startMs, endMs, x: laneX });
      }
    };

    if (Array.isArray(datJson.sliders)) {
      for (const s of datJson.sliders) {
        if (s) registerSlider(parseFloat(s.b), parseFloat(s.tb), s.x);
      }
    }
    if (Array.isArray(datJson.burstSliders)) {
      for (const s of datJson.burstSliders) {
        if (s) registerSlider(parseFloat(s.b), parseFloat(s.tb), s.x);
      }
    }
    if (Array.isArray(datJson._sliders)) {
      for (const s of datJson._sliders) {
        if (s) registerSlider(parseFloat(s._headTime), parseFloat(s._tailTime), s._headLineIndex);
      }
    }

    rawColorNotes.sort((a, b) => a.beat - b.beat);

    const hitObjectsRaw = [];
    const usedHoldStarts = new Set();

    for (let i = 0; i < rawColorNotes.length; i++) {
      const n = rawColorNotes[i];
      const timeMs = beatToMs(n.beat);
      const key = `${n.x}_${Math.round(n.beat * 100)}`;
      let endTimeMs = holdIntervalsByKey.get(key) || null;
      if (endTimeMs) {
        usedHoldStarts.add(key);
      }

      const duration = endTimeMs ? Math.max(0, endTimeMs - timeMs) : 0;
      const isHold = duration >= 140;

      hitObjectsRaw.push({
        originalLane: n.x,
        sourceKeys: 4,
        timestamp_ms: timeMs,
        original_timestamp: timeMs,
        type: isHold ? 'hold' : 'tap',
        duration_ms: isHold ? duration : null,
        end_timestamp_ms: isHold ? endTimeMs : null,
        bsCutDirection: n.d,
        bsLayer: n.y
      });
    }

    // Añadir arcos independientes que no coincidían exactamente con una nota base
    for (const h of rawHolds) {
      const dur = h.endMs - h.startMs;
      if (dur >= 160) {
        const alreadyCovered = hitObjectsRaw.some(o => o.originalLane === h.x && Math.abs(o.timestamp_ms - h.startMs) < 35);
        if (!alreadyCovered) {
          hitObjectsRaw.push({
            originalLane: h.x,
            sourceKeys: 4,
            timestamp_ms: h.startMs,
            original_timestamp: h.startMs,
            type: 'hold',
            duration_ms: dur,
            end_timestamp_ms: h.endMs
          });
        }
      }
    }

    hitObjectsRaw.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // Estimar estrellas según densidad de notas por segundo (NPS)
    let durationSec = 120;
    if (hitObjectsRaw.length >= 2) {
      durationSec = Math.max(15, (hitObjectsRaw[hitObjectsRaw.length - 1].timestamp_ms - hitObjectsRaw[0].timestamp_ms) / 1000);
    }
    const nps = hitObjectsRaw.length / durationSec;
    const estimatedStars = Math.max(1.2, Math.min(9.5, Math.round((1.2 + nps * 0.85) * 10) / 10));

    const finalNotes = LaneRemapper.resolveCollisions(hitObjectsRaw, 4, Math.round(bpm), estimatedStars, densityMode, targetLanes);

    return {
      audioFilename,
      audioLeadIn: 0,
      title,
      artist,
      creator,
      difficultyName,
      stars: estimatedStars,
      bpm: Math.round(bpm),
      keys: 4,
      rawNotes: hitObjectsRaw,
      notes: finalNotes
    };
  }
}

// Export to global window scope
window.LaneRemapper = LaneRemapper;
window.OsuManiaParser = OsuManiaParser;
window.BeatSaberParser = BeatSaberParser;
window.SongIniParser = SongIniParser;
window.ArchiveHelper = ArchiveHelper;
window.CloneHeroParser = CloneHeroParser;
window.MidiChartParser = MidiChartParser;
window.SngUnpacker = SngUnpacker;
window.PackageUnpacker = PackageUnpacker;
window.IndexedDBStorage = IndexedDBStorage;
window.UltraStarParser = UltraStarParser;
