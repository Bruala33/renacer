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
      try {
        mod = await import(localTransformersUrl);
      } catch (_) {
        mod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
      }

      const { pipeline, env } = mod;
      env.allowLocalModels = true;
      env.localModelPath = new URL('./assets/models/', baseRoot).href;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;

      if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
        env.backends.onnx.wasm.wasmPaths = new URL('./assets/vendor/transformers/', baseRoot).href;
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.proxy = false;
      }

      const candidates = preferredModel === 'Xenova/whisper-base'
        ? ['Xenova/whisper-base', 'Xenova/whisper-tiny']
        : ['Xenova/whisper-tiny'];

      for (const modelId of candidates) {
        try {
          self.postMessage({
            type: 'status',
            status: 'loading_model',
            message: `Cargando red neuronal ${modelId.replace('Xenova/', '')}...`
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
            message: `Motor neuronal ${modelId.replace('Xenova/', '')} listo`
          });
          return pipe;
        } catch (_) {
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
              message: `Motor neuronal ${modelId.replace('Xenova/', '')} listo`
            });
            return pipeFallback;
          } catch (_err2) {}
        }
      }
      throw new Error('whisper_model_load_failed');
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

const HALLUCINATION_RE = /^(?:subt[ií]tulos|amara\.org|gracias por ver|suscr[ií]bete|m[uú]sica|aplausos|risas|captions|thank you for watching|music|applause|\[.*\]|\(.*\)|\.+|\s*)$/i;

let canceledTrackKey = '';
let cancelBeforeReqId = 0;

self.onmessage = async (event) => {
  const data = event.data || {};

  if (data.type === 'cancel') {
    if (data.trackKey) canceledTrackKey = String(data.trackKey);
    if (Number.isFinite(data.upToId)) cancelBeforeReqId = Math.max(cancelBeforeReqId, Number(data.upToId));
    return;
  }

  if (data.type === 'preload' || data.type === 'init') {
    try {
      await ensureTranscriberLoaded(data.modelId || 'Xenova/whisper-tiny');
      self.postMessage({ type: 'ready', ok: true, modelId: loadedModelId });
      self.postMessage({ type: 'preload_done', ok: true, modelId: loadedModelId });
    } catch (err) {
      const errMsg = String(err?.message || err);
      self.postMessage({ type: 'error', ok: false, error: errMsg });
      self.postMessage({ type: 'preload_done', ok: false, error: errMsg });
    }
    return;
  }

  if (data.type === 'transcribe_window') {
    const reqId = data.reqId !== undefined ? data.reqId : data.id;
    const trackKey = data.trackKey || '';
    const winIdx = data.winIdx ?? 0;
    const totalWins = data.totalWins ?? 1;
    const startSec = Number.isFinite(data.startSec)
      ? Number(data.startSec)
      : (Number.isFinite(data.windowStartSec) ? Number(data.windowStartSec) : 0);
    const endSec = Number.isFinite(data.endSec) ? Number(data.endSec) : 0;
    const languageHint = data.languageHint || data.language || 'spanish';
    const pcm16k = data.pcm16k;

    if (
      (trackKey && canceledTrackKey && trackKey === canceledTrackKey) ||
      (Number.isFinite(reqId) && Number(reqId) <= cancelBeforeReqId)
    ) {
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
        words: [],
        phrases: []
      });
      return;
    }

    try {
      const pipe = await ensureTranscriberLoaded(data.modelId || 'Xenova/whisper-tiny');
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
          words: [],
          phrases: []
        });
        return;
      }

      const audioArr = pcm16k instanceof Float32Array ? pcm16k : new Float32Array(pcm16k);
      const winDur = audioArr.length / 16000;

      const opts = {
        task: 'transcribe',
        return_timestamps: 'word',
        chunk_length_s: Math.min(20, Math.max(8, Math.ceil(winDur))),
        stride_length_s: 2
      };
      if (languageHint && languageHint !== 'auto') {
        opts.language = languageHint;
      }

      let out = null;
      try {
        out = await pipe(audioArr, opts);
      } catch (_) {
        opts.return_timestamps = true;
        out = await pipe(audioArr, opts);
      }

      const rawChunks = Array.isArray(out?.chunks) ? out.chunks : [];
      const words = [];

      for (const ch of rawChunks) {
        const cleanW = String(ch?.text || '')
          .replace(/[\[\]\(\)♪♫]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (!cleanW || HALLUCINATION_RE.test(cleanW)) continue;

        const relS = Array.isArray(ch.timestamp) && Number.isFinite(ch.timestamp[0])
          ? Math.max(0, ch.timestamp[0])
          : 0;
        const relE = Array.isArray(ch.timestamp) && Number.isFinite(ch.timestamp[1]) && ch.timestamp[1] > relS
          ? Math.min(winDur + 0.5, ch.timestamp[1])
          : Math.min(winDur, relS + Math.max(0.22, cleanW.length * 0.065));

        const absStart = +(startSec + relS).toFixed(3);
        const absEnd = +Math.max(absStart + 0.12, startSec + relE).toFixed(3);

        // Si un chunk contiene varias palabras (modo fallback return_timestamps: true), subdividirlas proporcionalmente
        const tokens = cleanW.split(/\s+/).filter(Boolean);
        if (tokens.length === 1) {
          words.push({
            text: tokens[0],
            startSec: absStart,
            endSec: absEnd
          });
        } else if (tokens.length > 1) {
          const totalChars = tokens.reduce((acc, t) => acc + Math.max(1, t.length), 0);
          let curT = absStart;
          const span = Math.max(0.25, absEnd - absStart);
          for (let ti = 0; ti < tokens.length; ti++) {
            const wDur = span * (Math.max(1, tokens[ti].length) / totalChars);
            const wEnd = ti === tokens.length - 1 ? absEnd : +(curT + wDur).toFixed(3);
            words.push({
              text: tokens[ti],
              startSec: +curT.toFixed(3),
              endSec: Math.max(+(curT + 0.10).toFixed(3), wEnd)
            });
            curT = wEnd;
          }
        }
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
        text: String(out?.text || '').trim(),
        words
      });
    } catch (err) {
      self.postMessage({
        type: 'window_error',
        id: reqId,
        reqId,
        trackKey,
        winIdx,
        error: String(err?.message || err)
      });
    }
  }
};
