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
  static normalizeSongDifficulties(item, fallbackId = '') {
    if (!item || typeof item !== 'object') return [];
    if (Array.isArray(item)) {
      const normalizedArr = item.map((d, idx) => {
        if (!d || typeof d !== 'object') return null;
        const mode = d.densityMode || this.inferDensityModeFromDiff(d.id || d.name, d.stars);
        const stdName = this.getStandardTierName(mode);
        const starsVal = Math.round((parseFloat(d.stars) || (mode === 'easy' ? 1.7 : mode === 'medium' ? 3.0 : mode === 'hard' ? 4.5 : mode === 'extreme' ? 6.2 : 8.4)) * 10) / 10;
        const dId = d.id || (fallbackId ? `${fallbackId}_${mode}` : mode);
        return {
          ...d,
          id: dId,
          sourceDiffId: d.sourceDiffId || dId,
          densityMode: mode,
          name: stdName,
          stars: starsVal,
          keys: d.keys || 3,
          label: `${stdName} (${starsVal.toFixed(1)}★)`
        };
      }).filter(Boolean);
      return normalizedArr;
    }
    if (item._diffsNormalizedVersion === 2 && Array.isArray(item.difficulties) && item.difficulties.length > 0) {
      if (Array.isArray(item.diffs) && item.diffs !== item.difficulties) {
        item.diffs = item.difficulties;
      }
      return item.difficulties;
    }

    const srcLower = String(item.source || item.source_name || '').toLowerCase();
    const idStr = String(item.id || '');
    const isAutoOrMagic = Boolean(
      item._isAutoGeneratedDsp ||
      item._isMagicKey ||
      srcLower === 'auto_dsp' ||
      srcLower === 'magic_youtube' ||
      idStr.startsWith('auto_dsp_') ||
      idStr.startsWith('dsp_') ||
      idStr.startsWith('magic_yt_')
    );
    if (isAutoOrMagic && Array.isArray(item.difficulties) && item.difficulties.length > 0) {
      const preserved = this.normalizeSongDifficulties(item.difficulties, idStr);
      item.difficulties = preserved;
      item.diffs = preserved;
      item._diffsNormalizedVersion = 2;
      return preserved;
    }

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
          const isGuitarTrack = trackName.includes('GUITAR') || trackName.includes('PART ') || trackName.includes('T1 GEMS');
          if (pitch >= basePitch && pitch <= basePitch + 4) {
            const fret = pitch - basePitch;
            if (isNoteOn) {
              activeNotes.set(fret, currentTick);
            } else if (activeNotes.has(fret)) {
              const startTick = activeNotes.get(fret);
              const durationTicks = currentTick - startTick;
              noteEvents.push({ tick: startTick, fret, length: durationTicks, pitch, _isGuitarTrack: isGuitarTrack });
              activeNotes.delete(fret);
            }
          } else if (basePitch !== 96 && pitch >= 96 && pitch <= 100) {
            const expKey = 10 + (pitch - 96);
            if (isNoteOn) {
              activeNotes.set(expKey, currentTick);
            } else if (activeNotes.has(expKey)) {
              const startTick = activeNotes.get(expKey);
              const durationTicks = currentTick - startTick;
              noteEvents.push({ tick: startTick, fret: pitch - 96, length: durationTicks, pitch, _isFallbackExpert: true, _isGuitarTrack: isGuitarTrack });
              activeNotes.delete(expKey);
            }
          }

          // Captura universal para archivos MIDI estándar de piano / melodía polifónica (rango 21..108)
          const ch = status & 0x0F;
          if (ch !== 9 && pitch >= 21 && pitch <= 108) {
            const genKey = 1000 + pitch;
            if (isNoteOn) {
              activeNotes.set(genKey, { tick: currentTick, vel });
            } else if (activeNotes.has(genKey)) {
              const startObj = activeNotes.get(genKey);
              const durationTicks = Math.max(1, currentTick - startObj.tick);
              noteEvents.push({
                tick: startObj.tick,
                pitch,
                vel: startObj.vel,
                length: durationTicks,
                _isGeneralMidi: true
              });
              activeNotes.delete(genKey);
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

    const chPrimaryEvents = noteEvents.filter(e => !e._isGeneralMidi && !e._isFallbackExpert);
    const chFallbackEvents = noteEvents.filter(e => !e._isGeneralMidi);
    const generalMidiEvents = noteEvents.filter(e => e._isGeneralMidi);

    let activeNoteEvents = chPrimaryEvents.length >= 15 ? chPrimaryEvents : chFallbackEvents;
    let isStandardPianoMidi = false;

    // Si no es un MIDI de Clone Hero (o tiene menos de 20 notas de guitarra pero sí notas MIDI melódicas)
    if (activeNoteEvents.length < 20 && generalMidiEvents.length > 0) {
      isStandardPianoMidi = true;
      generalMidiEvents.sort((a, b) => a.tick - b.tick || b.pitch - a.pitch);
      const pitches = generalMidiEvents.map(e => e.pitch).sort((a, b) => a - b);
      const p20 = pitches[Math.floor(pitches.length * 0.20)] || 48;
      const p40 = pitches[Math.floor(pitches.length * 0.40)] || 56;
      const p60 = pitches[Math.floor(pitches.length * 0.60)] || 64;
      const p80 = pitches[Math.floor(pitches.length * 0.80)] || 72;

      activeNoteEvents = generalMidiEvents.map(ev => {
        let fret = 2;
        if (ev.pitch <= p20) fret = 0;
        else if (ev.pitch <= p40) fret = 1;
        else if (ev.pitch <= p60) fret = 2;
        else if (ev.pitch <= p80) fret = 3;
        else fret = 4;
        return {
          tick: ev.tick,
          fret,
          pitch: ev.pitch,
          vel: ev.vel || 90,
          length: ev.length
        };
      });
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

    const rawNotes = activeNoteEvents.map(ev => {
      const startMs = tickToMs(ev.tick);
      const isHold = ev.length > resolution / 3;
      const endMs = isHold ? tickToMs(ev.tick + ev.length) : startMs;
      const duration = isHold ? Math.max(0, endMs - startMs) : null;
      return {
        originalLane: ev.fret,
        sourceKeys: 5,
        timestamp_ms: Math.max(0, Math.round(startMs)),
        original_timestamp: Math.max(0, Math.round(startMs)),
        type: isHold ? 'hold' : 'tap',
        duration_ms: duration ? Math.round(duration) : null,
        end_timestamp_ms: isHold ? Math.round(endMs) : null,
        midiPitch: ev.pitch || (60 + (ev.fret || 0) * 4),
        midiVel: ev.vel || 95
      };
    });

    const finalNotes = LaneRemapper.resolveCollisions(rawNotes, 5, Math.round(tempoEvents[0].bpm), 4.5);

    return {
      audioFilename: 'song.ogg',
      title: isStandardPianoMidi ? 'Partitura MIDI de Piano' : 'Clone Hero MIDI',
      artist: 'MIDI',
      creator: 'MIDI Importer',
      difficultyName: chosenDiff,
      stars: 4.5,
      bpm: Math.round(tempoEvents[0].bpm),
      keys: 5,
      isStandardPianoMidi,
      rawNotes: rawNotes,
      notes: finalNotes
    };
  }

  /**
   * Sintetiza un archivo WAV PCM de piano acústico a partir de las notas de un archivo .mid independiente
   * para que cualquier MIDI descargado de internet se pueda jugar con sonido real sin requerir un MP3 externo.
   */
  static synthesizeWavBlobFromNotes(rawNotes = []) {
    const sampleRate = 22050;
    const valid = Array.isArray(rawNotes) ? rawNotes : [];
    const lastMs = valid.reduce((max, n) => Math.max(max, (n.end_timestamp_ms || n.timestamp_ms || 0) + 1200), 5000);
    const durationSec = Math.min(360, Math.max(4, Math.ceil(lastMs / 1000) + 2));
    const totalSamples = sampleRate * durationSec;
    const pcm = new Float32Array(totalSamples);

    for (let i = 0; i < valid.length; i++) {
      const n = valid[i];
      const startSample = Math.max(0, Math.floor(((n.timestamp_ms || 0) / 1000) * sampleRate));
      if (startSample >= totalSamples) continue;
      const pitch = n.midiPitch || (60 + ((n.originalLane || 0) * 4));
      const freq = 440 * Math.pow(2, (pitch - 69) / 12);
      const durSec = Math.min(3.2, Math.max(0.28, ((n.duration_ms || 260) / 1000) + 0.22));
      const lenSamples = Math.min(totalSamples - startSample, Math.floor(durSec * sampleRate));
      const amp = Math.min(0.22, ((n.midiVel || 90) / 127) * 0.18);

      for (let s = 0; s < lenSamples; s++) {
        const t = s / sampleRate;
        const env = s < 140 ? (s / 140) : Math.exp(-t * 4.2);
        const wave =
          Math.sin(2 * Math.PI * freq * t) +
          0.45 * Math.sin(4 * Math.PI * freq * t) * Math.exp(-t * 6.0) +
          0.18 * Math.sin(6 * Math.PI * freq * t) * Math.exp(-t * 9.0);
        pcm[startSample + s] += wave * env * amp;
      }
    }

    // Normalización suave y empaquetado RIFF WAV 16-bit mono
    const wavBuffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(wavBuffer);
    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const clamped = Math.max(-1, Math.min(1, Math.tanh(pcm[i])));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF, true);
      offset += 2;
    }
    return new Blob([wavBuffer], { type: 'audio/wav' });
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
        keys: beatmapData.keys || (beatmapData.metadata && beatmapData.metadata.source_keys) || 3,
        source: beatmapData.source || chartItem.source,
        source_name: beatmapData.source_name || chartItem.source_name,
        metadata: beatmapData.metadata,
        rawNotes: beatmapData.rawNotes || null,
        tierNotes: beatmapData.tierNotes || null,
        tierRawNotes: beatmapData.tierRawNotes || null,
        tierStars: beatmapData.tierStars || null,
        maxAllowedTier: beatmapData.maxAllowedTier || null,
        chorusStartSec: beatmapData.chorusStartSec || null,
        _choreographedVersion: beatmapData._choreographedVersion || chartItem._choreographedVersion || 0,
        _fullTrackVersion: beatmapData._fullTrackVersion || chartItem._fullTrackVersion || 0,
        _isAutoGeneratedDsp: Boolean(beatmapData._isAutoGeneratedDsp || chartItem._isAutoGeneratedDsp)
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
        videoId: chartItem.videoId || (beatmapData && beatmapData.videoId) || '',
        diff_id: chartItem.diff_id || '',
        difficulty_name: chartItem.difficulty_name || (beatmapData && beatmapData.metadata ? beatmapData.metadata.difficulty_name : '') || '',
        stars: chartItem.stars || (beatmapData && beatmapData.metadata ? beatmapData.metadata.stars : 3.5),
        is_top_song: Boolean(chartItem.is_top_song),
        is_community: Boolean(chartItem.is_community),
        chart_url: chartItem.chart_url || '',
        audio_url: chartItem.audio_url || '',
        metadata: beatmapData ? beatmapData.metadata : null,
        notes: baseNotes,
        tierNotes: (beatmapData && beatmapData.tierNotes) || chartItem.tierNotes || null,
        tierRawNotes: (beatmapData && beatmapData.tierRawNotes) || chartItem.tierRawNotes || null,
        tierStars: (beatmapData && beatmapData.tierStars) || chartItem.tierStars || null,
        maxAllowedTier: (beatmapData && beatmapData.maxAllowedTier) || chartItem.maxAllowedTier || null,
        chorusStartSec: (beatmapData && beatmapData.chorusStartSec) || chartItem.chorusStartSec || null,
        _choreographedVersion: (beatmapData && beatmapData._choreographedVersion) || chartItem._choreographedVersion || 0,
        _fullTrackVersion: (beatmapData && beatmapData._fullTrackVersion) || chartItem._fullTrackVersion || 0,
        _isAutoGeneratedDsp: Boolean((beatmapData && beatmapData._isAutoGeneratedDsp) || chartItem._isAutoGeneratedDsp),
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

  static async countSavedCharts() {
    const db = await this.openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_SAVED, 'readonly');
        const store = tx.objectStore(this.STORE_SAVED);
        const req = store.count();
        req.onsuccess = () => resolve(Number(req.result) || 0);
        req.onerror = () => resolve(0);
      } catch (_) {
        resolve(0);
      }
    });
  }

  static async countFavorites() {
    const db = await this.openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_FAVORITES, 'readonly');
        const store = tx.objectStore(this.STORE_FAVORITES);
        const req = store.count();
        req.onsuccess = () => resolve(Number(req.result) || 0);
        req.onerror = () => resolve(0);
      } catch (_) {
        resolve(0);
      }
    });
  }

  static async countPlaylists() {
    const db = await this.openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(this.STORE_PLAYLISTS, 'readonly');
        const store = tx.objectStore(this.STORE_PLAYLISTS);
        const req = store.count();
        req.onsuccess = () => resolve(Number(req.result) || 0);
        req.onerror = () => resolve(0);
      } catch (_) {
        resolve(0);
      }
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

  static async putFavoriteRecord(chartItem) {
    if (!chartItem || !chartItem.id) return false;
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FAVORITES, 'readwrite');
      const store = tx.objectStore(this.STORE_FAVORITES);
      const favRecord = {
        id: chartItem.id,
        title: chartItem.title || 'Canción Favorita',
        artist: chartItem.artist || 'Artista',
        creator: chartItem.creator || 'Catálogo',
        source: chartItem.source || 'official',
        source_name: chartItem.source_name || '',
        thumbnail: chartItem.thumbnail || '',
        download_url: chartItem.download_url || '',
        direct_download_url: chartItem.direct_download_url || '',
        fallback_download_url: chartItem.fallback_download_url || '',
        difficulties: Array.isArray(chartItem.difficulties) ? chartItem.difficulties : [],
        is_community: Boolean(chartItem.is_community),
        audio_url: chartItem.audio_url || '',
        addedAt: Number(chartItem.addedAt) || Date.now()
      };
      const req = store.put(favRecord);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
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

// ==========================================
// 9. AUDIO AUTO-MAPPER DSP (Analizador Espectral de 3 Bandas para cualquier MP3/WAV/OGG)
// ==========================================

class AudioAutoMapper {
  /**
   * Extrae Título y Artista limpios a partir del nombre de un archivo de audio
   */
  static parseFilenameMetadata(filename = '') {
    const base = String(filename || 'Cancion Local')
      .replace(/\.[^/.]+$/, '')
      .replace(/[_]+/g, ' ')
      .replace(/\b(official\s*(music\s*)?video|lyric\s*video|audio|hd|hq|4k|320kbps|128kbps)\b/gi, '')
      .replace(/\(\s*\)|\[\s*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = base.split(/\s+[-–—]\s+/);
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim() || 'Artista Local',
        title: parts.slice(1).join(' - ').trim() || base
      };
    }
    return {
      artist: 'Estudio Acústico DSP',
      title: base || 'Pista Importada'
    };
  }

  /**
   * Decodifica un Blob/File o ArrayBuffer de audio en un AudioBuffer usando Web Audio API
   */
  static async decodeAudio(fileOrBuffer) {
    const arrayBuffer = (fileOrBuffer instanceof ArrayBuffer)
      ? fileOrBuffer.slice(0)
      : await fileOrBuffer.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API no está disponible en este navegador.');
    }
    const ctx = new AudioCtx();
    try {
      const audioBuffer = await new Promise((resolve, reject) => {
        ctx.decodeAudioData(
          arrayBuffer,
          (decoded) => resolve(decoded),
          (err) => reject(err || new Error('No se pudo decodificar el archivo de audio.'))
        );
      });
      return audioBuffer;
    } finally {
      try { await ctx.close(); } catch (_) {}
    }
  }

  /**
   * MOTOR VIRTUOSO DE COREOGRAFÍA HUMANA Y DSP MULTIRRESOLUCIÓN (v4)
   * - Banco de filtros acústicos de 5 bandas a 200 FPS (resoluciones de 5 ms).
   * - Seguimiento continuo del contorno melódico (ZCR + Centroide Espectral logarítmico).
   * - Detección simultánea de ataques percusivos, sílabas vocales y cambios de nota en legato.
   * - Segmentación estructural inteligente (Intro, Estrofa, Subida/Build-up, Estribillo/Drop, Puente).
   * - Bloqueo honesto de dificultades: canciones lentas o suaves no inventan modos Extrema ni Imposible.
   * - Memoria de motivos rítmico-melódicos (consistencia humana en riffs y estribillos que se repiten).
   * - Patrones hipnóticos de nivel osu!mania (escaleras melódicas, jumpstreams, trinos de pulgares, holds laterales con contrapunto).
   */
  static analyzeAudioBuffer(audioBuffer, options = {}) {
    const requestedDensity = options.densityMode || 'hard';
    const targetLanes = options.targetLanes === 4 ? 4 : 3;
    const sampleRate = audioBuffer.sampleRate || 44100;
    const numChannels = audioBuffer.numberOfChannels || 1;
    const length = audioBuffer.length;
    const durationSec = audioBuffer.duration || (length / sampleRate);

    // 1. Mezcla estéreo + diferencia lateral (side) para detectar instrumentos paneados y guitarras/sintetizadores
    const mono = new Float32Array(length);
    if (numChannels === 1) {
      mono.set(audioBuffer.getChannelData(0));
    } else {
      const ch0 = audioBuffer.getChannelData(0);
      const ch1 = audioBuffer.getChannelData(1);
      for (let i = 0; i < length; i++) {
        const mid = (ch0[i] + ch1[i]) * 0.5;
        const side = (ch0[i] - ch1[i]) * 0.22;
        mono[i] = mid + side;
      }
    }

    // 2. Resolución temporal de alta precisión: ventanas de 5 ms (200 FPS)
    const hopSize = Math.max(64, Math.round(sampleRate * 0.005));
    const frameDurMs = (hopSize * 1000) / sampleRate;
    const numFrames = Math.floor(length / hopSize);
    if (numFrames < 80) {
      throw new Error('El archivo de audio es demasiado corto para generar un mapa.');
    }

    // 5 bandas espectrales:
    // b0: Sub/Kick (< 135 Hz)
    // b1: Snare/Cuerpo Grave-Medio (135 - 420 Hz)
    // b2: Voz Principal / Melodía Fundamental (420 - 1850 Hz)
    // b3: Ataque de Púa / Presencia Armónica (1850 - 4600 Hz)
    // b4: Brillo / Hi-Hats / Platos (> 4600 Hz)
    const subEnergy = new Float32Array(numFrames);
    const bodyEnergy = new Float32Array(numFrames);
    const vocalEnergy = new Float32Array(numFrames);
    const pluckEnergy = new Float32Array(numFrames);
    const hatEnergy = new Float32Array(numFrames);
    const totalRms = new Float32Array(numFrames);
    const rawPitchProxy = new Float32Array(numFrames);

    const calcAlpha = (fc) => Math.min(0.99, Math.max(0.005, (2 * Math.PI * fc) / (sampleRate + 2 * Math.PI * fc)));
    const a135 = calcAlpha(135);
    const a420 = calcAlpha(420);
    const a1850 = calcAlpha(1850);
    const a4600 = calcAlpha(4600);

    let lp135 = 0;
    let lp420 = 0;
    let lp1850 = 0;
    let lp4600 = 0;
    let prevMidSample = 0;

    for (let f = 0; f < numFrames; f++) {
      const start = f * hopSize;
      const end = Math.min(length, start + hopSize);
      let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, sTot = 0;
      let zeroCrossings = 0;

      for (let i = start; i < end; i++) {
        const x = mono[i];
        lp135 += a135 * (x - lp135);
        lp420 += a420 * (x - lp420);
        lp1850 += a1850 * (x - lp1850);
        lp4600 += a4600 * (x - lp4600);

        const b0 = lp135;
        const b1 = lp420 - lp135;
        const b2 = lp1850 - lp420;
        const b3 = lp4600 - lp1850;
        const b4 = x - lp4600;

        s0 += b0 * b0;
        s1 += b1 * b1;
        s2 += b2 * b2;
        s3 += b3 * b3;
        s4 += b4 * b4;
        sTot += x * x;

        const melodicSample = b1 * 0.45 + b2 + b3 * 0.35;
        if ((melodicSample >= 0 && prevMidSample < 0) || (melodicSample < 0 && prevMidSample >= 0)) {
          zeroCrossings++;
        }
        prevMidSample = melodicSample;
      }

      const nSamp = Math.max(1, end - start);
      const invN = 1 / nSamp;
      const e0 = Math.sqrt(s0 * invN);
      const e1 = Math.sqrt(s1 * invN) * 1.18;
      const e2 = Math.sqrt(s2 * invN) * 1.48;
      const e3 = Math.sqrt(s3 * invN) * 1.85;
      const e4 = Math.sqrt(s4 * invN) * 2.25;

      subEnergy[f] = e0;
      bodyEnergy[f] = e1;
      vocalEnergy[f] = e2;
      pluckEnergy[f] = e3;
      hatEnergy[f] = e4;
      totalRms[f] = Math.sqrt(sTot * invN);

      // Estimador combinado de altura tonal (ZCR melódico + centroide espectral ponderado)
      const zcrHz = (zeroCrossings * sampleRate) / (2 * nSamp);
      const zcrNorm = Math.max(0, Math.min(1, (Math.log2(Math.max(110, Math.min(2400, zcrHz))) - Math.log2(110)) / (Math.log2(2400) - Math.log2(110))));
      const denomE = e0 * 0.6 + e1 + e2 * 1.2 + e3 * 1.1 + e4 * 0.4 + 0.00001;
      const centroidNorm = (e0 * 0.05 + e1 * 0.25 + e2 * 0.55 + e3 * 0.82 + e4 * 0.96) / denomE;
      rawPitchProxy[f] = zcrNorm * 0.58 + centroidNorm * 0.42;
    }

    // 3. Suavizar contorno melódico (ventana de 35 ms) y normalizar dentro de registro local de 3.2 s
    const smoothPitch = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) {
      let sum = 0, count = 0;
      for (let k = Math.max(0, f - 3); k <= Math.min(numFrames - 1, f + 3); k++) {
        sum += rawPitchProxy[k];
        count++;
      }
      smoothPitch[f] = sum / count;
    }

    const pitchContour = new Float32Array(numFrames);
    const regRadius = Math.round(1600 / frameDurMs); // +/- 1.6s
    for (let f = 0; f < numFrames; f++) {
      const w0 = Math.max(0, f - regRadius);
      const w1 = Math.min(numFrames - 1, f + regRadius);
      let minP = 1, maxP = 0;
      for (let k = w0; k <= w1; k += 4) {
        const p = smoothPitch[k];
        if (p < minP) minP = p;
        if (p > maxP) maxP = p;
      }
      const span = Math.max(0.06, maxP - minP);
      pitchContour[f] = Math.max(0, Math.min(1, (smoothPitch[f] - minP) / span));
    }

    // 4. SuperFlux Multibanda + Detector de Transición de Nota en Legato
    const compositeFlux = new Float32Array(numFrames);
    const percussiveFlux = new Float32Array(numFrames);
    const melodicFlux = new Float32Array(numFrames);
    const domRole = new Uint8Array(numFrames);
    // Roles: 0 = bass_kick, 1 = snare_backbeat, 2 = vocal_melody, 3 = pluck_lead, 4 = hat_subdiv, 5 = accent_chord

    for (let f = 3; f < numFrames; f++) {
      const ref0 = Math.max(subEnergy[f - 1], subEnergy[f - 2] * 0.92, subEnergy[f - 3] * 0.85);
      const ref1 = Math.max(bodyEnergy[f - 1], bodyEnergy[f - 2] * 0.92, bodyEnergy[f - 3] * 0.85);
      const ref2 = Math.max(vocalEnergy[f - 1], vocalEnergy[f - 2] * 0.92, vocalEnergy[f - 3] * 0.85);
      const ref3 = Math.max(pluckEnergy[f - 1], pluckEnergy[f - 2] * 0.92, pluckEnergy[f - 3] * 0.85);
      const ref4 = Math.max(hatEnergy[f - 1], hatEnergy[f - 2] * 0.92, hatEnergy[f - 3] * 0.85);

      const d0 = Math.max(0, subEnergy[f] - ref0);
      const d1 = Math.max(0, bodyEnergy[f] - ref1);
      const d2 = Math.max(0, vocalEnergy[f] - ref2);
      const d3 = Math.max(0, pluckEnergy[f] - ref3);
      const d4 = Math.max(0, hatEnergy[f] - ref4);

      // Detectar cambio de nota en legato (cuando la voz o instrumento cambia de tono con energía sostenida)
      const pitchStep = Math.abs(smoothPitch[f] - smoothPitch[Math.max(0, f - 5)]);
      const activeMelodicEnergy = vocalEnergy[f] + pluckEnergy[f] * 0.8;
      const legatoFlux = (pitchStep > 0.042 && activeMelodicEnergy > 0.018)
        ? pitchStep * activeMelodicEnergy * 2.1
        : 0;

      const pFlux = d0 * 1.32 + d1 * 1.15 + d4 * 0.88;
      const mFlux = d2 * 1.38 + d3 * 1.25 + legatoFlux;
      percussiveFlux[f] = pFlux;
      melodicFlux[f] = mFlux;
      compositeFlux[f] = pFlux * 0.95 + mFlux * 1.12;

      // Clasificar el rol acústico del frame
      const SimultaneousKickAndHigh = (d0 > 0.015 && (d1 + d2 + d3) > 0.028);
      if (SimultaneousKickAndHigh && (d0 + d1 + d2) > 0.055) {
        domRole[f] = 5; // accent_chord
      } else if (d0 >= d1 && d0 >= d2 && d0 >= d3) {
        domRole[f] = 0; // bass_kick
      } else if (d1 >= d2 && (d1 + d4 * 0.6) > d3) {
        domRole[f] = 1; // snare_backbeat
      } else if (d3 > d2 * 1.08) {
        domRole[f] = 3; // pluck_lead
      } else if (d4 > (d2 + d3) * 0.95) {
        domRole[f] = 4; // hat_subdiv
      } else {
        domRole[f] = 2; // vocal_melody
      }
    }

    // 5. Extracción de micro-eventos musicales con Puerta de Silencio Acústico Estricta (v5)
    // Evita que el ruido de fondo o colas de reverberación en silencios (ej. pausas de Rush E) generen notas fantasma.
    const winFrames = Math.round(750 / frameDurMs); // +/- 0.75s
    const minPeakFrames = Math.max(6, Math.round(36 / frameDurMs)); // ~36ms para capturar fusas/trinos rápidos de piano
    const rawEvents = [];
    let lastEventFrame = -minPeakFrames;

    // Calcular distribución global de RMS y Flux en frames activos para fijar puerta de silencio inquebrantable
    const sortedRmsSample = [];
    const sortedFluxSample = [];
    for (let f = 0; f < numFrames; f += 4) {
      if (totalRms[f] > 0.001) sortedRmsSample.push(totalRms[f]);
      if (compositeFlux[f] > 0.0005) sortedFluxSample.push(compositeFlux[f]);
    }
    sortedRmsSample.sort((a, b) => a - b);
    sortedFluxSample.sort((a, b) => a - b);

    const refRmsP88 = sortedRmsSample.length > 0
      ? sortedRmsSample[Math.min(sortedRmsSample.length - 1, Math.floor(sortedRmsSample.length * 0.88))]
      : 0.15;
    const refRmsP20 = sortedRmsSample.length > 0
      ? sortedRmsSample[Math.min(sortedRmsSample.length - 1, Math.floor(sortedRmsSample.length * 0.20))]
      : 0.01;
    const globalFluxP70 = sortedFluxSample.length > 0
      ? sortedFluxSample[Math.min(sortedFluxSample.length - 1, Math.floor(sortedFluxSample.length * 0.70))]
      : 0.012;

    // Umbral absoluto de silencio: por debajo de este nivel RMS o Flux, la canción está en silencio y JAMÁS puede caer una tecla
    const silenceRmsGate = Math.max(0.013, refRmsP88 * 0.082, Math.min(refRmsP20 * 0.65, refRmsP88 * 0.14));
    const silenceFluxGate = Math.max(0.0032, globalFluxP70 * 0.22);
    const stdFloor = Math.max(0.0024, globalFluxP70 * 0.36);

    for (let f = 20; f < numFrames - 30; f++) {
      const val = compositeFlux[f];
      if (val < silenceFluxGate) continue;
      if (val < compositeFlux[f - 1] || val < compositeFlux[f + 1]) continue;

      // Puerta 1: Energía instantánea en el ataque
      const curRms = totalRms[f];
      const peakLocalRms = Math.max(curRms, totalRms[f + 1] || 0, totalRms[f + 2] || 0);
      if (peakLocalRms < silenceRmsGate) continue;

      // Puerta 2: Energía sostenida en los siguientes 40 ms (evita artefactos secos de compresión en medio de un silencio)
      let forwardRmsSum = 0;
      const fwdCount = 8;
      for (let k = 0; k < fwdCount; k++) {
        forwardRmsSum += totalRms[Math.min(numFrames - 1, f + k)];
      }
      const forwardAvgRms = forwardRmsSum / fwdCount;
      if (forwardAvgRms < silenceRmsGate * 0.86) continue;

      // Puerta 3: Debe ser un ataque real (subida de energía respecto a hace 15-20ms o transitorio franco de nota)
      // Evita colocar notas en la cola de decaimiento cuando un acorde de piano se está apagando hacia el silencio
      const prevRmsAvg = (totalRms[Math.max(0, f - 3)] + totalRms[Math.max(0, f - 4)] + totalRms[Math.max(0, f - 5)]) / 3;
      const isTrueAttack = (peakLocalRms >= prevRmsAvg * 1.055) || (val >= globalFluxP70 * 0.62);
      if (!isTrueAttack) continue;

      const wStart = Math.max(0, f - winFrames);
      const wEnd = Math.min(numFrames - 1, f + winFrames);
      let sum = 0;
      const count = wEnd - wStart + 1;
      for (let k = wStart; k <= wEnd; k++) sum += compositeFlux[k];
      const mean = sum / count;

      let varSum = 0;
      for (let k = wStart; k <= wEnd; k++) {
        const d = compositeFlux[k] - mean;
        varSum += d * d;
      }
      // Suelo de desviación estándar global: impide que una ventana silenciosa divida por ~0 e infle la saliencia de un susurro
      const std = Math.max(stdFloor, Math.sqrt(varSum / count));
      const minThreshold = mean + std * 0.32;
      if (val < minThreshold) continue;

      const salience = (val - mean) / std;
      const timeMs = Math.round(f * frameDurMs);
      const prevEv = rawEvents.length > 0 ? rawEvents[rawEvents.length - 1] : null;
      const pitchVal = pitchContour[f];
      const rawPitchVal = smoothPitch[f];
      const pitchDelta = prevEv ? (pitchVal - prevEv.pitch) : 0;

      const evObj = {
        frame: f,
        timeMs,
        flux: val,
        salience,
        percFlux: percussiveFlux[f],
        melFlux: melodicFlux[f],
        role: domRole[f],
        pitch: pitchVal,
        rawPitch: rawPitchVal,
        pitchDelta,
        rms: peakLocalRms,
        rmsNorm: Math.min(1.5, peakLocalRms / Math.max(0.01, refRmsP88)),
        isAccent: domRole[f] === 5 || (salience >= 1.70 && peakLocalRms >= refRmsP88 * 0.65)
      };

      if (f - lastEventFrame < minPeakFrames) {
        if (prevEv && val > prevEv.flux) {
          rawEvents[rawEvents.length - 1] = evObj;
          lastEventFrame = f;
        }
      } else {
        rawEvents.push(evObj);
        lastEventFrame = f;
      }
    }

    // 6. Estimación de Tempo (BPM) y Fase Rítmica con ponderación de ataques fuertes
    const bpmBins = new Float32Array(220);
    const strongEvents = rawEvents.filter(e => e.salience >= 0.75);
    const bpmSourceEvents = strongEvents.length >= 24 ? strongEvents : rawEvents;

    for (let i = 0; i < bpmSourceEvents.length; i++) {
      const e1 = bpmSourceEvents[i];
      for (let j = i + 1; j < Math.min(bpmSourceEvents.length, i + 18); j++) {
        const e2 = bpmSourceEvents[j];
        const dt = e2.timeMs - e1.timeMs;
        if (dt < 175 || dt > 2200) continue;
        let candBpm = 60000 / dt;
        while (candBpm < 84) candBpm *= 2;
        while (candBpm > 178) candBpm /= 2;
        const bin = Math.round(candBpm);
        if (bin >= 82 && bin <= 180) {
          const roleBoost = (e1.role === 0 || e1.role === 1 || e1.role === 5) ? 1.45 : 1.0;
          const w = ((e1.salience + e2.salience) * 0.5) * roleBoost;
          bpmBins[bin] += w;
          bpmBins[bin - 1] += w * 0.55;
          bpmBins[bin + 1] += w * 0.55;
        }
      }
    }

    let estimatedBpm = 120;
    let bestBpmScore = -1;
    for (let b = 84; b <= 178; b++) {
      if (bpmBins[b] > bestBpmScore) {
        bestBpmScore = bpmBins[b];
        estimatedBpm = b;
      }
    }

    const beatMs = 60000 / estimatedBpm;
    const halfBeatMs = beatMs / 2;
    const quarterBeatMs = beatMs / 4;
    const tripletBeatMs = beatMs / 3;

    // 7. Fase global y seguimiento dinámico de compás (respetando al 100% el instante exacto del ataque acústico en canciones aceleradas como Rush E)
    let bestPhaseMs = 0;
    let bestPhaseScore = -1;
    const phaseSteps = 36;
    for (let p = 0; p < phaseSteps; p++) {
      const candPhase = (p / phaseSteps) * beatMs;
      let sc = 0;
      for (let i = 0; i < Math.min(bpmSourceEvents.length, 220); i++) {
        const ev = bpmSourceEvents[i];
        const rem = ((ev.timeMs - candPhase) % beatMs + beatMs) % beatMs;
        const dist = Math.min(rem, beatMs - rem);
        if (dist < 40) {
          const roleW = (ev.role === 0 || ev.role === 5) ? 1.5 : 1.0;
          sc += ev.salience * roleW * (1 - dist / 42);
        }
      }
      if (sc > bestPhaseScore) {
        bestPhaseScore = sc;
        bestPhaseMs = Math.round(candPhase);
      }
    }

    let localPhaseMs = bestPhaseMs;
    for (let i = 0; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      const rel = ev.timeMs - localPhaseMs;
      const nearestBeatNum = Math.round(rel / beatMs);
      const expectedBeatMs = localPhaseMs + nearestBeatNum * beatMs;
      const beatErr = ev.timeMs - expectedBeatMs;

      if (Math.abs(beatErr) <= 55 && ev.salience >= 1.10 && (ev.role === 0 || ev.role === 1 || ev.role === 5)) {
        localPhaseMs += beatErr * 0.25;
      }

      const relLocal = Math.max(0, ev.timeMs - localPhaseMs);
      const distBeat = Math.min(relLocal % beatMs, beatMs - (relLocal % beatMs));
      const distHalf = Math.min(relLocal % halfBeatMs, halfBeatMs - (relLocal % halfBeatMs));
      const distQuart = Math.min(relLocal % quarterBeatMs, quarterBeatMs - (relLocal % quarterBeatMs));
      const distTrip = Math.min(relLocal % tripletBeatMs, tripletBeatMs - (relLocal % tripletBeatMs));

      if (distBeat <= 32) {
        ev.subdivType = 1;
        ev.metricWeight = 1.0;
      } else if (distHalf <= 26) {
        ev.subdivType = 2;
        ev.metricWeight = 0.85;
      } else if (distQuart <= 22) {
        ev.subdivType = 4;
        ev.metricWeight = 0.74;
      } else if (distTrip <= 20) {
        ev.subdivType = 3;
        ev.metricWeight = 0.72;
      } else {
        ev.subdivType = 8;
        ev.metricWeight = 0.60;
      }
      // Preservar el instante acústico exacto (resolución 5ms) sin desplazar notas hacia rejillas teóricas que desincronizan aceleraciones de tempo
      ev.snappedTimeMs = Math.max(180, ev.timeMs);

      // Medir sustain real de la nota hasta el siguiente ataque o hasta que caiga en silencio
      let nextStrongMs = ev.snappedTimeMs + 1300;
      for (let j = i + 1; j < rawEvents.length; j++) {
        if (rawEvents[j].salience >= 0.75 || rawEvents[j].role !== 4) {
          nextStrongMs = rawEvents[j].timeMs;
          break;
        }
      }
      const maxSustainCheckFrames = Math.min(
        numFrames - ev.frame - 1,
        Math.floor(Math.min(nextStrongMs - ev.timeMs - 65, 1600) / frameDurMs)
      );
      let sustFrames = 0;
      const sustThresh = Math.max(silenceRmsGate * 1.15, ev.rms * 0.56);
      for (let sf = 2; sf <= maxSustainCheckFrames; sf++) {
        if (totalRms[ev.frame + sf] >= sustThresh) {
          sustFrames++;
        } else if (sf > 6) {
          break;
        }
      }
      ev.sustainMs = Math.round(sustFrames * frameDurMs);
    }

    // 8. Segmentación Macro-Estructural (Intro, Estrofa, Subida/Build-up, Estribillo/Drop, Puente)
    const phraseDurMs = Math.max(2800, Math.round(beatMs * 8));
    const numPhrases = Math.max(1, Math.ceil((durationSec * 1000) / phraseDurMs));
    const phrases = [];
    let bestChorusPhraseIdx = 0;
    let bestChorusScore = -1;

    for (let p = 0; p < numPhrases; p++) {
      const pStartMs = p * phraseDurMs;
      const pEndMs = Math.min(durationSec * 1000, (p + 1) * phraseDurMs);
      const f0 = Math.max(0, Math.floor(pStartMs / frameDurMs));
      const f1 = Math.min(numFrames - 1, Math.floor(pEndMs / frameDurMs));

      let sumRms = 0;
      for (let f = f0; f <= f1; f++) sumRms += totalRms[f];
      const avgRms = sumRms / Math.max(1, f1 - f0 + 1);
      const energyNorm = Math.min(1.35, avgRms / Math.max(0.008, refRmsP88));

      const phraseEvents = rawEvents.filter(e => e.timeMs >= pStartMs && e.timeMs < pEndMs);
      const meaningfulEvents = phraseEvents.filter(e => e.salience >= 0.48);
      const spanSec = Math.max(1.5, (pEndMs - pStartMs) / 1000);
      const onsetRate = meaningfulEvents.length / spanSec;

      phrases.push({
        index: p,
        startMs: pStartMs,
        endMs: pEndMs,
        energyNorm,
        onsetRate,
        events: phraseEvents,
        sectionType: 'verse'
      });

      const progressRatio = (pStartMs / 1000) / Math.max(30, durationSec);
      if (progressRatio >= 0.16 && progressRatio <= 0.72) {
        const chorusScore = energyNorm * 1.4 + (onsetRate / 8.0);
        if (chorusScore > bestChorusScore) {
          bestChorusScore = chorusScore;
          bestChorusPhraseIdx = p;
        }
      }
    }

    for (let p = 0; p < phrases.length; p++) {
      const ph = phrases[p];
      const nextPh = phrases[p + 1];
      if (ph.energyNorm < 0.36 || ph.onsetRate < 1.30) {
        ph.sectionType = 'quiet';
      } else if (ph.energyNorm >= 0.72 || (ph.energyNorm >= 0.58 && ph.onsetRate >= 5.0)) {
        ph.sectionType = 'chorus';
      } else if (nextPh && nextPh.energyNorm >= ph.energyNorm + 0.16 && ph.onsetRate >= 3.2) {
        ph.sectionType = 'buildup';
      } else {
        ph.sectionType = 'verse';
      }
      for (const ev of ph.events) {
        ev.sectionType = ph.sectionType;
        ev.phraseIndex = p;
        ev.phraseEnergy = ph.energyNorm;
      }
    }

    const chorusStartSec = phrases[bestChorusPhraseIdx]
      ? Math.max(12, Math.round(phrases[bestChorusPhraseIdx].startMs / 1000))
      : Math.round(durationSec * 0.30);

    // 9. Evaluación Honesta de Intensidad Acústica Real (No inventar Extrema/Imposible en canciones lentas)
    const activePhrases = phrases.filter(ph => ph.sectionType !== 'quiet');
    const sortedRates = (activePhrases.length > 0 ? activePhrases : phrases)
      .map(ph => ph.onsetRate)
      .sort((a, b) => a - b);
    const p75OnsetRate = sortedRates.length > 0
      ? sortedRates[Math.min(sortedRates.length - 1, Math.floor(sortedRates.length * 0.75))]
      : 2.5;
    const p90OnsetRate = sortedRates.length > 0
      ? sortedRates[Math.min(sortedRates.length - 1, Math.floor(sortedRates.length * 0.90))]
      : 3.0;

    let maxAllowedTier = 'impossible';
    if (p90OnsetRate < 3.60 || (p75OnsetRate < 2.60 && estimatedBpm < 98)) {
      maxAllowedTier = 'hard';
    } else if (p90OnsetRate < 5.05 && (p75OnsetRate < 4.00 || estimatedBpm < 114)) {
      maxAllowedTier = 'extreme';
    }

    const availableTiers = ['easy', 'medium', 'hard'];
    if (maxAllowedTier === 'extreme' || maxAllowedTier === 'impossible') {
      availableTiers.push('extreme');
    }
    if (maxAllowedTier === 'impossible') {
      availableTiers.push('impossible');
    }

    // Helper verificador post-proceso contra notas en silencio absoluto
    const verifyNoNotesInSilence = (notesList) => {
      if (!Array.isArray(notesList) || notesList.length === 0) return [];
      const verified = [];
      for (let i = 0; i < notesList.length; i++) {
        const n = notesList[i];
        const fCenter = Math.max(0, Math.min(numFrames - 1, Math.round((n.timestamp_ms || 0) / frameDurMs)));
        let localMaxRms = 0;
        for (let k = Math.max(0, fCenter - 3); k <= Math.min(numFrames - 1, fCenter + 4); k++) {
          if (totalRms[k] > localMaxRms) localMaxRms = totalRms[k];
        }
        if (localMaxRms < silenceRmsGate * 0.90) {
          continue; // Descartar cualquier nota que caiga en silencio real
        }
        // Si es un hold, truncarlo inmediatamente si entra en una pausa de silencio
        if (n.type === 'hold' && n.duration_ms > 0) {
          const fStart = fCenter;
          const fEnd = Math.min(numFrames - 1, Math.round(((n.timestamp_ms || 0) + n.duration_ms) / frameDurMs));
          let validEndFrame = fStart;
          for (let f = fStart; f <= fEnd; f++) {
            if (totalRms[f] >= silenceRmsGate * 0.85) {
              validEndFrame = f;
            } else {
              break;
            }
          }
          const validDurMs = Math.round((validEndFrame - fStart) * frameDurMs);
          if (validDurMs < 220) {
            n.type = 'tap';
            n.duration_ms = 0;
            n.end_timestamp_ms = null;
          } else {
            n.duration_ms = validDurMs;
            n.end_timestamp_ms = n.timestamp_ms + validDurMs;
          }
        }
        verified.push(n);
      }
      verified.forEach((n, idx) => { n.id = idx + 1; });
      return verified;
    };

    // 10. Construir mapas dedicados con Coreografía Humana de Piano para cada dificultad disponible
    const tierNotes = {};
    const tierRawNotes = {};
    const tierStars = {};

    for (const tier of availableTiers) {
      const built = this.buildHumanChoreographedTierChart(
        rawEvents,
        phrases,
        estimatedBpm,
        bestPhaseMs,
        durationSec,
        tier,
        targetLanes
      );
      const cleanTierNotes = verifyNoNotesInSilence(built.notes);
      tierNotes[tier] = cleanTierNotes;
      tierRawNotes[tier] = cleanTierNotes;
      tierStars[tier] = LaneRemapper.calculateObjectiveStars(cleanTierNotes, estimatedBpm, tier);
    }

    const effectiveTier = availableTiers.includes(requestedDensity)
      ? requestedDensity
      : availableTiers[availableTiers.length - 1];

    return {
      bpm: estimatedBpm,
      firstBeatOffsetMs: bestPhaseMs,
      chorusStartSec,
      durationSec: Math.round(durationSec),
      maxAllowedTier,
      availableTiers,
      tierNotes,
      tierRawNotes,
      tierStars,
      stars: tierStars[effectiveTier] || 4.5,
      rawNotes: tierRawNotes[effectiveTier] || [],
      notes: tierNotes[effectiveTier] || []
    };
  }

  /**
   * COREÓGRAFO DE PIANO Y MELODÍA REAL v5:
   * - Asigna cada tecla estrictamente según la altura tonal real del piano/voz (Grave=Izquierda, Medio=Centro, Agudo=Derecha).
   * - En notas repetidas muy rápidas del mismo tono (como el famoso "E-E-E-E-E" de Rush E), ejecuta un trino limpio de 2 dedos
   *   alternando entre el carril de esa nota y su vecino inmediato, jamás lanzando teclas al azar.
   * - En escalas ascendentes o descendentes, sigue fielmente la dirección de la escala (0->1->2 o 2->1->0).
   */
  static buildHumanChoreographedTierChart(rawEvents, phrases, bpm, beatPhaseMs, durationSec, tier, targetLanes = 3) {
    const numLanes = targetLanes === 4 ? 4 : 3;
    const maxLane = numLanes - 1;
    const beatMs = 60000 / Math.max(70, Math.min(200, bpm || 120));
    const stepMs = beatMs / 4;

    const tierConfig = {
      easy: {
        minGapVerseMs: 255,
        minGapChorusMs: 220,
        minSalienceVerse: 1.05,
        minSalienceChorus: 0.88,
        allowSubdiv8: false,
        allowSubdiv4: false,
        chordProbChorus: 0.0,
        chordProbVerse: 0.0,
        minChordSpacingMs: 99999,
        allowCounterTapsDuringHold: false,
        minSameLaneGapMs: 250
      },
      medium: {
        minGapVerseMs: 170,
        minGapChorusMs: 135,
        minSalienceVerse: 0.78,
        minSalienceChorus: 0.62,
        allowSubdiv8: false,
        allowSubdiv4: true,
        chordProbChorus: 0.20,
        chordProbVerse: 0.05,
        minChordSpacingMs: 540,
        allowCounterTapsDuringHold: false,
        minSameLaneGapMs: 185
      },
      hard: {
        minGapVerseMs: 112,
        minGapChorusMs: 88,
        minSalienceVerse: 0.54,
        minSalienceChorus: 0.40,
        allowSubdiv8: false,
        allowSubdiv4: true,
        chordProbChorus: 0.38,
        chordProbVerse: 0.14,
        minChordSpacingMs: 310,
        allowCounterTapsDuringHold: true,
        minSameLaneGapMs: 135
      },
      extreme: {
        minGapVerseMs: 74,
        minGapChorusMs: 54,
        minSalienceVerse: 0.32,
        minSalienceChorus: 0.18,
        allowSubdiv8: true,
        allowSubdiv4: true,
        chordProbChorus: 0.58,
        chordProbVerse: 0.26,
        minChordSpacingMs: 185,
        allowCounterTapsDuringHold: true,
        minSameLaneGapMs: 88
      },
      impossible: {
        minGapVerseMs: 48,
        minGapChorusMs: 38,
        minSalienceVerse: 0.14,
        minSalienceChorus: 0.06,
        allowSubdiv8: true,
        allowSubdiv4: true,
        chordProbChorus: 0.78,
        chordProbVerse: 0.42,
        minChordSpacingMs: 120,
        allowCounterTapsDuringHold: true,
        minSameLaneGapMs: 56
      }
    }[tier] || {
      minGapVerseMs: 112,
      minGapChorusMs: 88,
      minSalienceVerse: 0.54,
      minSalienceChorus: 0.40,
      allowSubdiv8: false,
      allowSubdiv4: true,
      chordProbChorus: 0.38,
      chordProbVerse: 0.14,
      minChordSpacingMs: 310,
      allowCounterTapsDuringHold: true,
      minSameLaneGapMs: 135
    };

    // Paso 1: Selección musical de ataques reales
    const selectedEvents = [];
    let lastSelectedMs = -999;

    for (let i = 0; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      const t = ev.snappedTimeMs || ev.timeMs;
      if (t < 180) continue;

      const sec = ev.sectionType || 'verse';
      const isChorusOrBuild = (sec === 'chorus' || sec === 'buildup');
      const isQuiet = (sec === 'quiet');

      const effMinGap = isQuiet
        ? Math.max(150, tierConfig.minGapVerseMs * 1.30)
        : (isChorusOrBuild ? tierConfig.minGapChorusMs : tierConfig.minGapVerseMs);

      const gap = t - lastSelectedMs;
      if (gap < effMinGap) {
        if (selectedEvents.length > 0 && gap < 32 && ev.salience > selectedEvents[selectedEvents.length - 1].salience * 1.30) {
          selectedEvents[selectedEvents.length - 1] = ev;
          lastSelectedMs = t;
        }
        continue;
      }

      if (!tierConfig.allowSubdiv8 && ev.subdivType === 8 && ev.salience < 1.50) continue;
      if (!tierConfig.allowSubdiv4 && (ev.subdivType === 4 || ev.subdivType === 3) && ev.salience < 1.30) continue;

      const minSal = isQuiet
        ? tierConfig.minSalienceVerse * 1.25
        : (isChorusOrBuild ? tierConfig.minSalienceChorus : tierConfig.minSalienceVerse);

      const isPhraseEntry = (gap >= 360 && ev.salience >= minSal * 0.78);
      const isOnBeat = (ev.subdivType === 1 && ev.salience >= minSal * 0.80);

      if (ev.salience >= minSal || isPhraseEntry || isOnBeat) {
        selectedEvents.push(ev);
        lastSelectedMs = t;
      }
    }

    // Paso 2: Coreografía de Piano Fiel al Tono y al Contorno Melódico
    const motifMemory = new Map();
    const choreographedNotes = [];
    const laneLastTapMs = new Array(numLanes).fill(-9999);
    let activeHold = null;
    let lastChordMs = -9999;
    let prevLane = 1;
    let prevPitch = 0.5;
    let trillAnchorLane = 1;
    let trillPartnerLane = 2;
    let trillToggle = false;

    const resolveNaturalPitchLane = (ev) => {
      if (numLanes === 3) {
        if (ev.role === 0 && ev.pitch < 0.45) return 0; // Bajo / mano izquierda del piano
        if (ev.pitch <= 0.35) return 0;
        if (ev.pitch >= 0.65) return 2;
        return 1;
      }
      return Math.max(0, Math.min(3, Math.floor(ev.pitch * 4)));
    };

    const phraseGroups = new Map();
    for (const ev of selectedEvents) {
      const pIdx = ev.phraseIndex ?? 0;
      if (!phraseGroups.has(pIdx)) phraseGroups.set(pIdx, []);
      phraseGroups.get(pIdx).push(ev);
    }

    for (const [pIdx, pEvents] of phraseGroups.entries()) {
      if (pEvents.length === 0) continue;

      const ioiSig = [];
      for (let k = 1; k < Math.min(pEvents.length, 9); k++) {
        const dtQuant = Math.round((pEvents[k].snappedTimeMs - pEvents[k - 1].snappedTimeMs) / Math.max(40, stepMs));
        const pDir = (pEvents[k].pitch - pEvents[k - 1].pitch) > 0.045 ? 'U' : ((pEvents[k].pitch - pEvents[k - 1].pitch) < -0.045 ? 'D' : 'S');
        ioiSig.push(`${Math.min(8, Math.max(1, dtQuant))}${pDir}`);
      }
      const sigKey = ioiSig.join('_');
      const matchedMotif = (sigKey.length >= 6 && motifMemory.has(sigKey)) ? motifMemory.get(sigKey) : null;
      const recordedPhraseLanes = [];

      for (let i = 0; i < pEvents.length; i++) {
        const ev = pEvents[i];
        const t = ev.snappedTimeMs || ev.timeMs;
        const nextEv = (i + 1 < pEvents.length) ? pEvents[i + 1] : null;
        const nextT = nextEv ? (nextEv.snappedTimeMs || nextEv.timeMs) : (t + 1000);
        const gapToNext = nextT - t;
        const gapFromPrev = i > 0 ? (t - (pEvents[i - 1].snappedTimeMs || pEvents[i - 1].timeMs)) : 600;
        const actualPitchDiff = i > 0 ? (ev.pitch - prevPitch) : 0;

        if (activeHold && t >= activeHold.endMs + 45) {
          activeHold = null;
        }
        if (activeHold && !tierConfig.allowCounterTapsDuringHold) {
          continue;
        }

        let targetLane = resolveNaturalPitchLane(ev);

        if (matchedMotif && i < matchedMotif.length && !activeHold) {
          targetLane = matchedMotif[i];
        } else {
          const isRapidNote = (gapFromPrev <= 145);
          const isRepeatedSamePitch = (Math.abs(actualPitchDiff) < 0.038);

          if (isRapidNote && isRepeatedSamePitch) {
            // Nota repetida rápida del mismo tono (ej. estacato repetido de Rush E):
            // Si el intervalo es menor que minSameLaneGapMs, alternar limpiamente como trino de piano entre 2 carriles fijos
            if (gapFromPrev < tierConfig.minSameLaneGapMs) {
              if (!trillToggle) {
                trillAnchorLane = targetLane;
                trillPartnerLane = targetLane === maxLane ? (targetLane - 1) : (targetLane + 1);
              }
              trillToggle = !trillToggle;
              targetLane = trillToggle ? trillPartnerLane : trillAnchorLane;
            } else {
              trillToggle = false;
            }
          } else {
            trillToggle = false;
            // Si la melodía sube o baja perceptiblemente respecto a la nota anterior, reflejar esa dirección en el teclado
            if (actualPitchDiff >= 0.042) {
              if (targetLane <= prevLane) {
                targetLane = Math.min(maxLane, prevLane + 1);
              }
            } else if (actualPitchDiff <= -0.042) {
              if (targetLane >= prevLane) {
                targetLane = Math.max(0, prevLane - 1);
              }
            }
          }
        }

        if (activeHold) {
          if (targetLane === activeHold.lane) {
            targetLane = activeHold.lane === 0 ? maxLane : 0;
          }
          const lastTap = choreographedNotes[choreographedNotes.length - 1];
          if (lastTap && (t - lastTap.timestamp_ms) < (tier === 'impossible' ? 72 : 112)) {
            continue;
          }
        }

        // Salvaguarda ergonómica: si el mismo carril se pide más rápido que minSameLaneGapMs, usar el carril adyacente coherente con el registro tonal
        if ((t - laneLastTapMs[targetLane]) < tierConfig.minSameLaneGapMs) {
          const preferredAlt = ev.pitch >= 0.5
            ? (targetLane < maxLane ? targetLane + 1 : targetLane - 1)
            : (targetLane > 0 ? targetLane - 1 : targetLane + 1);
          if ((!activeHold || preferredAlt !== activeHold.lane) && (t - laneLastTapMs[preferredAlt]) >= tierConfig.minSameLaneGapMs * 0.75) {
            targetLane = preferredAlt;
          } else {
            for (let l = 0; l < numLanes; l++) {
              if (l !== targetLane && (!activeHold || l !== activeHold.lane)) {
                targetLane = l;
                break;
              }
            }
          }
        }

        // ¿Convertir en Nota Larga (Hold) cuando la nota del piano/voz realmente se mantiene sonando?
        let isHoldNote = false;
        let holdDurationMs = 0;
        if (
          !activeHold &&
          ev.sustainMs >= 260 &&
          gapToNext >= (tier === 'impossible' ? 230 : 290) &&
          (targetLane === 0 || targetLane === maxLane || ev.sectionType === 'quiet' || ev.subdivType <= 2)
        ) {
          const holdLane = (targetLane === 0 || targetLane === maxLane)
            ? targetLane
            : (ev.pitch < 0.5 ? 0 : maxLane);
          const maxHoldSpan = tierConfig.allowCounterTapsDuringHold
            ? Math.min(ev.sustainMs, 1100)
            : Math.min(ev.sustainMs, gapToNext - 85);
          const quantizedHold = Math.round(maxHoldSpan / (stepMs * 2)) * Math.round(stepMs * 2);
          if (quantizedHold >= 240) {
            targetLane = holdLane;
            isHoldNote = true;
            holdDurationMs = Math.min(1250, quantizedHold);
          }
        }

        // ¿Convertir en Swipe direccional en remates de frase con salto tonal?
        let noteType = isHoldNote ? 'hold' : 'tap';
        let swipeDir = 'up';
        if (
          !isHoldNote &&
          !activeHold &&
          gapToNext >= 220 &&
          ((ev.sectionType === 'buildup' && i === pEvents.length - 1) ||
           (ev.isAccent && Math.abs(actualPitchDiff) >= 0.28 && gapFromPrev >= 150))
        ) {
          noteType = 'swipe';
          if (targetLane === 0) swipeDir = 'left';
          else if (targetLane === maxLane) swipeDir = 'right';
          else swipeDir = actualPitchDiff >= 0 ? 'up' : 'down';
        }

        const primaryNote = {
          id: choreographedNotes.length + 1,
          lane: targetLane,
          originalLane: targetLane,
          sourceKeys: numLanes,
          timestamp_ms: t,
          original_timestamp: t,
          type: noteType,
          duration_ms: isHoldNote ? holdDurationMs : 0,
          end_timestamp_ms: isHoldNote ? (t + holdDurationMs) : null,
          direction: swipeDir,
          swipeDirection: swipeDir
        };

        choreographedNotes.push(primaryNote);
        laneLastTapMs[targetLane] = t;
        prevLane = targetLane;
        prevPitch = ev.pitch;
        recordedPhraseLanes.push(targetLane);

        if (isHoldNote) {
          activeHold = {
            lane: targetLane,
            startMs: t,
            endMs: t + holdDurationMs,
            noteRef: primaryNote
          };
        }

        // Acordes dobles de piano (mano izquierda + mano derecha simultáneas en golpes de acento real)
        const canPlaceChord = (
          !isHoldNote &&
          !activeHold &&
          noteType === 'tap' &&
          (t - lastChordMs) >= tierConfig.minChordSpacingMs &&
          gapFromPrev >= (tier === 'impossible' ? 56 : 86) &&
          gapToNext >= (tier === 'impossible' ? 56 : 86)
        );

        if (canPlaceChord) {
          const isChorus = (ev.sectionType === 'chorus');
          const isDownbeat = (ev.subdivType === 1);
          const isStrongAccent = (ev.isAccent || (isDownbeat && ev.salience >= 1.20));
          const chordChance = isChorus ? tierConfig.chordProbChorus : tierConfig.chordProbVerse;
          const deterministicTrigger = (((pIdx * 7 + i * 13) % 10) / 10) < chordChance;

          if (isStrongAccent && deterministicTrigger) {
            const partnerLane = targetLane === 0 ? maxLane : (targetLane === maxLane ? 0 : (ev.pitch >= 0.5 ? maxLane : 0));
            if (partnerLane !== targetLane && (t - laneLastTapMs[partnerLane]) >= tierConfig.minSameLaneGapMs) {
              choreographedNotes.push({
                id: choreographedNotes.length + 1,
                lane: partnerLane,
                originalLane: partnerLane,
                sourceKeys: numLanes,
                timestamp_ms: t,
                original_timestamp: t,
                type: 'tap',
                duration_ms: 0,
                end_timestamp_ms: null,
                direction: 'up',
                swipeDirection: 'up'
              });
              laneLastTapMs[partnerLane] = t;
              lastChordMs = t;
            }
          }
        }
      }

      if (sigKey.length >= 6 && recordedPhraseLanes.length >= 4 && !motifMemory.has(sigKey)) {
        motifMemory.set(sigKey, recordedPhraseLanes);
      }
    }

    choreographedNotes.sort((a, b) => a.timestamp_ms - b.timestamp_ms || a.lane - b.lane);
    choreographedNotes.forEach((n, idx) => { n.id = idx + 1; });

    const calculatedStars = LaneRemapper.calculateObjectiveStars(choreographedNotes, bpm, tier);
    return {
      notes: choreographedNotes,
      stars: calculatedStars
    };
  }

  /**
   * Conserva el buffer de audio íntegro sin duplicar ni poner en bucle cortes de preview.
   */
  static extendStudioBufferIfShort(audioBuffer, originalBlob) {
    return { buffer: audioBuffer, blob: originalBlob };
  }

  /**
   * Genera un paquete completo de canción a partir de un archivo o Blob de audio (.mp3, .wav, .ogg, .m4a, .flac)
   */
  static async createPlayableChartFromAudioFile(fileOrBlob, customMeta = {}) {
    const fileMeta = this.parseFilenameMetadata((fileOrBlob && fileOrBlob.name) || customMeta.title || 'Cancion');
    const title = (customMeta.title && String(customMeta.title).trim()) || fileMeta.title || 'Canción Generada';
    const artist = (customMeta.artist && String(customMeta.artist).trim()) || fileMeta.artist || 'Artista';
    const requestedDensity = customMeta.densityMode || 'hard';
    const sourceLabel = customMeta.sourceLabel || 'Motor Acústico DSP';

    const decodedBuffer = await this.decodeAudio(fileOrBlob);
    const { buffer: finalAudioBuffer, blob: finalAudioBlob } = this.extendStudioBufferIfShort(decodedBuffer, fileOrBlob);
    const analysis = this.analyzeAudioBuffer(finalAudioBuffer, { densityMode: requestedDensity, targetLanes: 3 });

    try {
      const syncedLyrics = await LrcLibLyricsHelper.fetchSyncedLyrics(title, artist, analysis.durationSec);
      if (syncedLyrics && syncedLyrics.length > 0) {
        for (const tKey of Object.keys(analysis.tierNotes || {})) {
          LrcLibLyricsHelper.attachLyricsToNotes(analysis.tierNotes[tKey], syncedLyrics);
        }
      }
    } catch (_) {}

    const baseId = customMeta.id || `dsp_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const diffNameMap = {
      easy: 'Fácil',
      medium: 'Media',
      hard: 'Difícil',
      extreme: 'Extrema',
      impossible: 'Imposible'
    };

    const rawDiffList = (analysis.availableTiers || ['easy', 'medium', 'hard']).map(tier => {
      const st = analysis.tierStars?.[tier] || (tier === 'easy' ? 1.7 : tier === 'medium' ? 3.0 : tier === 'hard' ? 4.5 : tier === 'extreme' ? 6.3 : 8.6);
      const tName = diffNameMap[tier] || 'Difícil';
      return {
        id: `${baseId}_${tier}`,
        sourceDiffId: `${baseId}_${tier}`,
        name: tName,
        stars: st,
        densityMode: tier,
        keys: 3,
        label: `${tName} (${st.toFixed(1)}★)`
      };
    });

    const difficulties = LaneRemapper.normalizeSongDifficulties(rawDiffList, baseId);
    const effectiveDensity = (analysis.availableTiers || []).includes(requestedDensity)
      ? requestedDensity
      : (analysis.availableTiers?.[analysis.availableTiers.length - 1] || 'hard');
    const chosenDiffName = customMeta.difficultyName || diffNameMap[effectiveDensity] || 'Difícil';

    return {
      id: baseId,
      title,
      artist,
      creator: sourceLabel,
      thumbnail: customMeta.thumbnail || './app_logo.png',
      bpm: analysis.bpm,
      firstBeatOffsetMs: analysis.firstBeatOffsetMs,
      chorusStartSec: analysis.chorusStartSec,
      maxAllowedTier: analysis.maxAllowedTier,
      stars: analysis.tierStars?.[effectiveDensity] || analysis.stars,
      difficulties,
      tierNotes: analysis.tierNotes,
      tierRawNotes: analysis.tierRawNotes,
      tierStars: analysis.tierStars,
      _choreographedVersion: 5,
      _fullTrackVersion: 5,
      rawNotes: analysis.rawNotes,
      notes: analysis.notes,
      audioBlob: finalAudioBlob,
      metadata: {
        id: baseId,
        title,
        artist,
        creator: sourceLabel,
        difficulty_name: chosenDiffName,
        stars: analysis.tierStars?.[effectiveDensity] || analysis.stars,
        bpm: analysis.bpm,
        firstBeatOffsetMs: analysis.firstBeatOffsetMs,
        chorusStartSec: analysis.chorusStartSec,
        total_notes: analysis.notes.length,
        source_keys: 3,
        num_lanes: 3
      }
    };
  }
}

// ==========================================
// 10. LRCLIB SYNCED LYRICS HELPER (Letras de Karaoke Automáticas)
// ==========================================

class LrcLibLyricsHelper {
  static parseLrcString(lrcText = '') {
    if (!lrcText || typeof lrcText !== 'string') return [];
    const lines = lrcText.split(/\r?\n/);
    const entries = [];
    const timeRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (const rawLine of lines) {
      const text = rawLine.replace(timeRegex, '').trim();
      if (!text) continue;
      let match;
      timeRegex.lastIndex = 0;
      while ((match = timeRegex.exec(rawLine)) !== null) {
        const min = parseInt(match[1], 10) || 0;
        const sec = parseInt(match[2], 10) || 0;
        const fracStr = (match[3] || '0').padEnd(3, '0').slice(0, 3);
        const ms = parseInt(fracStr, 10) || 0;
        const totalMs = min * 60000 + sec * 1000 + ms;
        entries.push({ timeMs: totalMs, text });
      }
    }

    entries.sort((a, b) => a.timeMs - b.timeMs);
    return entries;
  }

  static async fetchSyncedLyrics(title, artist, durationSec = 0) {
    const cleanTitle = String(title || '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
    const cleanArtist = String(artist || '').replace(/\b(Estudio Acústico DSP|Artista Local|MIDI|Unknown)\b/gi, '').trim();
    if (!cleanTitle || cleanTitle.length < 2) return [];

    const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());
    const urls = [
      `/api/v1/lyrics?q=${query}&title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}`,
      `https://lrclib.net/api/search?q=${query}`
    ];

    for (const url of urls) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3200);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
        const withSynced = list.find(item => item && typeof item.syncedLyrics === 'string' && item.syncedLyrics.trim().length > 20);
        if (withSynced) {
          return this.parseLrcString(withSynced.syncedLyrics);
        }
      } catch (_) {}
    }
    return [];
  }

  static attachLyricsToNotes(notes = [], lrcEntries = []) {
    if (!Array.isArray(notes) || notes.length === 0 || !Array.isArray(lrcEntries) || lrcEntries.length === 0) {
      return notes;
    }

    for (const line of lrcEntries) {
      const words = line.text.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      // Buscar las notas más cercanas dentro de la ventana de este verso
      let startIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < notes.length; i++) {
        const nMs = notes[i].timestamp_ms ?? notes[i].timeMs ?? 0;
        const d = Math.abs(nMs - line.timeMs);
        if (d < bestDist && d <= 1800) {
          bestDist = d;
          startIdx = i;
        }
      }
      if (startIdx === -1) continue;

      for (let w = 0; w < words.length && (startIdx + w) < notes.length; w++) {
        const targetNote = notes[startIdx + w];
        if (!targetNote.lyric) {
          targetNote.lyric = words[w];
        }
      }
    }
    return notes;
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
window.AudioAutoMapper = AudioAutoMapper;
window.LrcLibLyricsHelper = LrcLibLyricsHelper;

