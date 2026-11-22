// ============================================================================
// MOTOR NEURONAL WHISPER ONNX WEB WORKER (100% AUTÓNOMO Y LOCAL)
// Transcribe directamente el audio vocal aislado (16 kHz) palabra por palabra
// con marcas de tiempo de atención cruzada (return_timestamps: 'word') en un
// hilo separado sin bloquear el renderizado 60fps ni el micrófono de SingStar.
// ============================================================================

let transcriberInstance = null;
let loadedModelId = '';
let loadingPromise = null;

async function ensureTranscriberLoaded(preferredModel = 'Xenova/whisper-tiny') {
  if (transcriberInstance && loadedModelId === preferredModel) {
    return transcriberInstance;
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      self.postMessage({
        type: 'status',
        status: 'loading_runtime',
        message: 'Inicializando motor neuronal ONNX local...'
      });

      const baseRoot = new URL('./', self.location.href).href;
      const localTransformersUrl = new URL('./assets/vendor/transformers/transformers.min.js', baseRoot).href;
      let mod = null;
      let localImportErr = null;
      try {
        mod = await import(localTransformersUrl);
      } catch (e1) {
        localImportErr = e1;
        mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
      }

      const { pipeline, env } = mod;
      env.allowLocalModels = true;
      env.localModelPath = new URL('./assets/models/', baseRoot).href;
      env.allowRemoteModels = true;
      // Los archivos ONNX locales ya residen en disco/APK; evitar CacheStorage previene
      // errores de cuota/seguridad en Android WebView y ahorra RAM en dispositivos móviles.
      env.useBrowserCache = false;
      env.useFSCache = false;

      if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
        env.backends.onnx.wasm.wasmPaths = new URL('./assets/vendor/transformers/', baseRoot).href;
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
      }

      const candidates = preferredModel === 'Xenova/whisper-base'
        ? ['Xenova/whisper-base', 'Xenova/whisper-tiny']
        : ['Xenova/whisper-tiny'];

      let lastErr = localImportErr;
      for (const modelId of candidates) {
        const shortName = modelId.replace('Xenova/', '');
        try {
          self.postMessage({
            type: 'status',
            status: 'loading_model',
            message: `Cargando red neuronal ${shortName}...`
          });
          const pipe = await pipeline('automatic-speech-recognition', modelId, {
            quantized: true,
            local_files_only: modelId === 'Xenova/whisper-tiny'
          });
          transcriberInstance = pipe;
          loadedModelId = modelId;
          self.postMessage({
            type: 'status',
            status: 'ready',
            modelId,
            message: `Motor neuronal ${shortName} listo`
          });
          return pipe;
        } catch (errLocal) {
          lastErr = errLocal;
          try {
            const pipeFallback = await pipeline('automatic-speech-recognition', modelId, {
              quantized: true,
              local_files_only: false
            });
            transcriberInstance = pipeFallback;
            loadedModelId = modelId;
            self.postMessage({
              type: 'status',
              status: 'ready',
              modelId,
              message: `Motor neuronal ${shortName} listo`
            });
            return pipeFallback;
          } catch (errRemote) {
            lastErr = errRemote;
          }
        }
      }
      throw new Error(`whisper_model_load_failed: ${String(lastErr?.message || lastErr || 'unknown')}`);
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

const HALLUCINATION_PHRASE_RE = /^(?:subt[ií]tulos(?:\s+por|\s+realizados|\s+de)?.*|amara\.org.*|gracias por ver.*|suscr[ií]bete.*|m[uú]sica|aplausos|risas|captions.*|thank you for watching.*|thanks for watching.*|please subscribe.*|music|applause|laughter|silence|\[.*\]|\(.*\)|[♪♫.\-_,;:!?¡¿\s]+)$/i;
const HALLUCINATION_WORD_RE = /^(?:subt[ií]tulos|amara\.org|suscr[ií]bete|captions|subscribe|\[.*\]|\(.*\)|[♪♫.\-_,;:!?¡¿]+)$/i;

let canceledTrackKey = '';
let cancelBeforeReqId = 0;

function isCanceled(trackKey, reqId) {
  if (trackKey && canceledTrackKey && trackKey === canceledTrackKey) return true;
  if (typeof reqId === 'number' && Number.isFinite(reqId) && reqId <= cancelBeforeReqId) return true;
  return false;
}

function normalizeWordClean(raw) {
  return String(raw || '')
    .replace(/[\[\]\(\)♪♫<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

self.onmessage = async (event) => {
  const data = event.data || {};

  if (data.type === 'cancel') {
    if (data.trackKey) canceledTrackKey = String(data.trackKey);
    if (typeof data.upToId === 'number' && Number.isFinite(data.upToId)) {
      cancelBeforeReqId = Math.max(cancelBeforeReqId, Number(data.upToId));
    }
    return;
  }

  if (data.type === 'reset_cancel') {
    canceledTrackKey = '';
    return;
  }

  if (data.type === 'preload' || data.type === 'init') {
    try {
      await ensureTranscriberLoaded(data.modelId || 'Xenova/whisper-tiny');
      self.postMessage({ type: 'ready', ok: true, modelId: loadedModelId });
      self.postMessage({ type: 'preload_done', ok: true, modelId: loadedModelId });
    } catch (err) {
      const errMsg = String(err?.message || err);
      self.postMessage({ type: 'error', ok: false, error: errMsg, message: errMsg });
      self.postMessage({ type: 'preload_done', ok: false, error: errMsg });
    }
    return;
  }

  if (data.type === 'transcribe_window') {
    const reqId = data.reqId !== undefined ? data.reqId : data.id;
    const trackKey = String(data.trackKey || '');
    const winIdx = data.winIdx ?? 0;
    const totalWins = data.totalWins ?? 1;
    const startSec = Number.isFinite(data.startSec)
      ? Number(data.startSec)
      : (Number.isFinite(data.windowStartSec) ? Number(data.windowStartSec) : 0);
    const endSec = Number.isFinite(data.endSec) ? Number(data.endSec) : 0;
    const rawLang = String(data.languageHint || data.language || 'auto').trim().toLowerCase();
    const languageHint = (rawLang && rawLang !== 'auto') ? rawLang : '';
    const pcm16k = data.pcm16k;

    if (isCanceled(trackKey, reqId)) {
      self.postMessage({
        type: 'window_result',
        id: reqId,
        reqId,
        trackKey,
        winIdx,
        totalWins,
        startSec,
        endSec,
        canceled: true,
        text: '',
        words: []
      });
      return;
    }

    try {
      const pipe = await ensureTranscriberLoaded(data.modelId || 'Xenova/whisper-tiny');
      if (isCanceled(trackKey, reqId)) {
        self.postMessage({
          type: 'window_result',
          id: reqId,
          reqId,
          trackKey,
          winIdx,
          totalWins,
          startSec,
          endSec,
          canceled: true,
          text: '',
          words: []
        });
        return;
      }

      if (!pipe || !pcm16k || pcm16k.length < 4000) {
        self.postMessage({
          type: 'window_result',
          id: reqId,
          reqId,
          trackKey,
          winIdx,
          totalWins,
          startSec,
          endSec,
          text: '',
          words: []
        });
        return;
      }

      const audioArr = pcm16k instanceof Float32Array ? pcm16k : new Float32Array(pcm16k);
      const winDur = audioArr.length / 16000;

      // Para ventanas <= 28.5s usar pase único nativo de Whisper (30s) SIN stride_length_s:
      // evita 100% los duplicados con saltos hacia atrás en el tiempo y duplica la velocidad.
      // Limitar max_new_tokens + no_repeat_ngram_size impide los bucles de repetición en pasajes
      // musicales/vibrato que podían colgar una ventana 30+ segundos en WASM.
      const opts = {
        task: 'transcribe',
        return_timestamps: 'word',
        max_new_tokens: Math.min(148, Math.max(68, Math.round(winDur * 5.8))),
        no_repeat_ngram_size: 5,
        repetition_penalty: 1.12
      };
      if (winDur > 28.5) {
        opts.chunk_length_s = 26;
        opts.stride_length_s = 3;
      }
      if (languageHint) {
        opts.language = languageHint;
      }

      let out = null;
      try {
        out = await pipe(audioArr, opts);
      } catch (_) {
        opts.return_timestamps = true;
        out = await pipe(audioArr, opts);
      }

      // DETECCIÓN DE COLAPSO DTW EN ATENCIÓN CRUZADA DE WHISPER-TINY:
      // En pasajes musicales intensos, return_timestamps:'word' puede colapsar todas las palabras
      // al borde de relleno de ceros (timestamp >= winDur - 0.15s) o apilarlas en el mismo instante.
      // Si detectamos colapso DTW, reintentar automáticamente con return_timestamps:true (tokens de
      // tiempo nativos del decoder Whisper, inmunes al colapso de atención cruzada).
      const hasDtwTimestampCollapse = (resObj) => {
        const chs = Array.isArray(resObj?.chunks) ? resObj.chunks : [];
        if (chs.length < 2) return false;
        let cliffCount = 0;
        let sameTsPairs = 0;
        let minTs = Infinity;
        let maxTs = -Infinity;
        let validCount = 0;
        let prevTs0 = -999;
        for (const c of chs) {
          const t0 = Array.isArray(c?.timestamp) && Number.isFinite(c.timestamp[0]) ? Number(c.timestamp[0]) : NaN;
          if (!Number.isFinite(t0)) continue;
          validCount++;
          if (t0 >= winDur - 0.18) cliffCount++;
          if (Math.abs(t0 - prevTs0) < 0.015) sameTsPairs++;
          if (t0 < minTs) minTs = t0;
          if (t0 > maxTs) maxTs = t0;
          prevTs0 = t0;
        }
        if (validCount < 2) return false;
        if (cliffCount >= 2 && cliffCount >= validCount * 0.35) return true;
        if (validCount >= 4 && sameTsPairs >= validCount * 0.55) return true;
        if (validCount >= 5 && (maxTs - minTs) < 0.25) return true;
        return false;
      };

      let collapsedDtw = false;
      if (opts.return_timestamps === 'word' && hasDtwTimestampCollapse(out)) {
        collapsedDtw = true;
        const rawFallbackClean = normalizeWordClean(out?.text || '');
        const rawFallbackWords = (!rawFallbackClean || HALLUCINATION_PHRASE_RE.test(rawFallbackClean))
          ? []
          : rawFallbackClean.split(/\s+/).filter(t => t.length >= 2 && !HALLUCINATION_WORD_RE.test(t));
        if (rawFallbackWords.length >= 4) {
          try {
            const segOpts = { ...opts, return_timestamps: true };
            const segOut = await pipe(audioArr, segOpts);
            if (segOut && Array.isArray(segOut.chunks) && segOut.chunks.length > 0 && !hasDtwTimestampCollapse(segOut)) {
              out = segOut;
              collapsedDtw = false;
            }
          } catch (_) {}
        }
      }

      if (isCanceled(trackKey, reqId)) {
        self.postMessage({
          type: 'window_result',
          id: reqId,
          reqId,
          trackKey,
          winIdx,
          totalWins,
          startSec,
          endSec,
          canceled: true,
          text: '',
          words: []
        });
        return;
      }

      const fullTextClean = normalizeWordClean(out?.text || '');
      if (!fullTextClean || HALLUCINATION_PHRASE_RE.test(fullTextClean)) {
        self.postMessage({
          type: 'window_result',
          id: reqId,
          reqId,
          trackKey,
          winIdx,
          totalWins,
          startSec,
          endSec,
          text: '',
          words: []
        });
        return;
      }

      const rawChunks = Array.isArray(out?.chunks) ? out.chunks : [];
      const words = [];
      let lastEndSec = startSec;
      let lastNormWord = '';
      let repeatRun = 0;

      for (const ch of rawChunks) {
        const cleanW = normalizeWordClean(ch?.text || '');
        if (!cleanW || HALLUCINATION_PHRASE_RE.test(cleanW) || HALLUCINATION_WORD_RE.test(cleanW)) continue;

        const hasRaw0 = Array.isArray(ch.timestamp) && Number.isFinite(ch.timestamp[0]);
        // Descartar palabras pegadas artificialmente al borde de zero-padding de 30s (>= winDur - 0.08s)
        if (hasRaw0 && ch.timestamp[0] >= winDur - 0.08) continue;

        const rawTs0 = hasRaw0
          ? Math.max(0, Math.min(winDur - 0.08, ch.timestamp[0]))
          : Math.max(0, lastEndSec - startSec);
        const rawTs1 = Array.isArray(ch.timestamp) && Number.isFinite(ch.timestamp[1]) && ch.timestamp[1] > rawTs0
          ? Math.min(winDur + 0.35, ch.timestamp[1])
          : Math.min(winDur, rawTs0 + Math.max(0.18, cleanW.length * 0.062));

        let absStart = +(startSec + rawTs0).toFixed(3);
        let absEnd = +Math.max(absStart + 0.09, startSec + rawTs1).toFixed(3);

        // Descartar duplicados con retroceso temporal de bordes de chunk
        if (words.length > 0 && absStart < words[words.length - 1].startSec - 0.15) {
          continue;
        }
        if (words.length > 0 && absStart < words[words.length - 1].startSec) {
          absStart = +(words[words.length - 1].endSec + 0.01).toFixed(3);
          absEnd = +Math.max(absStart + 0.09, absEnd).toFixed(3);
        }

        const tokens = cleanW.split(/\s+/).filter(t => t && !HALLUCINATION_WORD_RE.test(t));
        if (tokens.length === 0) continue;

        if (tokens.length === 1) {
          const normT = tokens[0].toLowerCase().replace(/[^a-z0-9áéíóúüñ]/gi, '');
          if (!normT) continue;
          if (normT === lastNormWord) {
            repeatRun++;
            if (repeatRun >= 4) continue; // Cortar bucles de alucinación repetitiva
          } else {
            lastNormWord = normT;
            repeatRun = 1;
          }
          words.push({
            text: tokens[0],
            startSec: absStart,
            endSec: Math.min(+(startSec + winDur + 0.25).toFixed(3), absEnd)
          });
          lastEndSec = absEnd;
        } else {
          const totalChars = tokens.reduce((acc, t) => acc + Math.max(1, t.length), 0);
          let curT = absStart;
          const span = Math.max(0.24, Math.min(winDur - rawTs0 + 0.2, absEnd - absStart));
          for (let ti = 0; ti < tokens.length; ti++) {
            const normT = tokens[ti].toLowerCase().replace(/[^a-z0-9áéíóúüñ]/gi, '');
            if (!normT) continue;
            if (normT === lastNormWord) {
              repeatRun++;
              if (repeatRun >= 4) continue;
            } else {
              lastNormWord = normT;
              repeatRun = 1;
            }
            const wDur = span * (Math.max(1, tokens[ti].length) / totalChars);
            const wEnd = ti === tokens.length - 1 ? +(absStart + span).toFixed(3) : +(curT + wDur).toFixed(3);
            const safeEnd = +Math.max(curT + 0.09, wEnd).toFixed(3);
            words.push({
              text: tokens[ti],
              startSec: +curT.toFixed(3),
              endSec: safeEnd
            });
            curT = safeEnd;
            lastEndSec = safeEnd;
          }
        }
      }

      if (words.length === 0 && fullTextClean.length >= 6) {
        collapsedDtw = true;
      }

      self.postMessage({
        type: 'window_result',
        id: reqId,
        reqId,
        trackKey,
        winIdx,
        totalWins,
        startSec,
        endSec,
        dtwCollapsed: collapsedDtw,
        text: fullTextClean,
        words
      });
    } catch (err) {
      const errMsg = String(err?.message || err);
      self.postMessage({
        type: 'window_error',
        id: reqId,
        reqId,
        trackKey,
        winIdx,
        error: errMsg,
        message: errMsg
      });
    }
  }
};
