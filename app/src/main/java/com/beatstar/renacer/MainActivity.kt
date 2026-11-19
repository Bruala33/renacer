package com.beatstar.renacer

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingWebPermissionRequest: PermissionRequest? = null
    private val FILE_CHOOSER_REQUEST_CODE = 1001
    private val AUDIO_PERMISSION_REQUEST_CODE = 1002
    private lateinit var assetLoader: WebViewAssetLoader
    private var forceSoftwareLayer: Boolean = false

    @Volatile private var nativeMicRequested: Boolean = false
    @Volatile private var nativeMicRunning: Boolean = false
    @Volatile private var nativeMicState: String = "stopped"
    @Volatile private var nativeMicFreqHz: Float = 0f
    @Volatile private var nativeMicClarity: Float = 0f
    @Volatile private var nativeMicRms: Float = 0f
    @Volatile private var nativeMicNoiseFloor: Float = 0.0036f
    @Volatile private var nativeMicVoiced: Boolean = false
    @Volatile private var nativeMicSensitivity: Float = 1.0f
    @Volatile private var nativeMicRecalibrateRequested: Boolean = false
    @Volatile private var nativeMicSessionId: Long = 0L
    @Volatile private var nativeMicThread: Thread? = null

    private fun isRunningOnEmulator(): Boolean {
        val fp = Build.FINGERPRINT.lowercase(Locale.ROOT)
        val model = Build.MODEL.lowercase(Locale.ROOT)
        val manuf = Build.MANUFACTURER.lowercase(Locale.ROOT)
        val brand = Build.BRAND.lowercase(Locale.ROOT)
        val device = Build.DEVICE.lowercase(Locale.ROOT)
        val product = Build.PRODUCT.lowercase(Locale.ROOT)
        val hardware = Build.HARDWARE.lowercase(Locale.ROOT)
        return fp.startsWith("generic") ||
            fp.startsWith("unknown") ||
            model.contains("google_sdk") ||
            model.contains("emulator") ||
            model.contains("android sdk built for") ||
            model.contains("sdk_gphone") ||
            manuf.contains("genymotion") ||
            (brand.startsWith("generic") && device.startsWith("generic")) ||
            product.contains("sdk") ||
            product.contains("emulator") ||
            product.contains("vbox") ||
            hardware.contains("goldfish") ||
            hardware.contains("ranchu") ||
            hardware.contains("cuttlefish") ||
            hardware.contains("vsoc")
    }

    private fun hasDrmRenderNode(): Boolean {
        if (isRunningOnEmulator()) return false
        return try {
            File("/dev/dri/renderD128").exists()
        } catch (_: Exception) {
            false
        }
    }

    companion object {
        private val CORS_HEADERS = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers" to "*",
            "Cache-Control" to "no-store, no-cache, must-revalidate"
        )

        fun guessMimeType(path: String): String {
            val clean = path.lowercase(Locale.ROOT)
            return when {
                clean.endsWith(".html") || clean.endsWith(".htm") -> "text/html"
                clean.endsWith(".js") || clean.endsWith(".mjs") -> "application/javascript"
                clean.endsWith(".css") -> "text/css"
                clean.endsWith(".json") -> "application/json"
                clean.endsWith(".wasm") -> "application/wasm"
                clean.endsWith(".png") -> "image/png"
                clean.endsWith(".jpg") || clean.endsWith(".jpeg") -> "image/jpeg"
                clean.endsWith(".webp") -> "image/webp"
                clean.endsWith(".svg") -> "image/svg+xml"
                clean.endsWith(".gif") -> "image/gif"
                clean.endsWith(".ico") -> "image/x-icon"
                clean.endsWith(".mp3") -> "audio/mpeg"
                clean.endsWith(".ogg") || clean.endsWith(".oga") -> "audio/ogg"
                clean.endsWith(".wav") -> "audio/wav"
                clean.endsWith(".m4a") -> "audio/mp4"
                clean.endsWith(".ttf") -> "font/ttf"
                clean.endsWith(".woff") -> "font/woff"
                clean.endsWith(".woff2") -> "font/woff2"
                else -> "application/octet-stream"
            }
        }
    }

    private class SilentAssetsPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse {
            val trimmed = path.trimStart('/')
            if (trimmed.isEmpty()) return notFoundResponse()

            if (trimmed == "api/songs" || trimmed == "api/custom-songs") {
                return WebResourceResponse(
                    "application/json",
                    "UTF-8",
                    200,
                    "OK",
                    CORS_HEADERS,
                    ByteArrayInputStream("[]".toByteArray(Charsets.UTF_8))
                )
            }
            if (trimmed == "api/leaderboard" || trimmed == "leaderboard.json") {
                return try {
                    val stream = context.assets.open("www/leaderboard.json")
                    WebResourceResponse("application/json", "UTF-8", 200, "OK", CORS_HEADERS, stream)
                } catch (_: Exception) {
                    WebResourceResponse(
                        "application/json",
                        "UTF-8",
                        200,
                        "OK",
                        CORS_HEADERS,
                        ByteArrayInputStream("{}".toByteArray(Charsets.UTF_8))
                    )
                }
            }

            val noQuery = trimmed.substringBefore('?')
            val cleanRel = noQuery
                .removePrefix("www/")
                .removePrefix("static/")

            val candidates = linkedSetOf<String>()
            if (cleanRel == "game.html") {
                candidates.add("www/index.html")
            }
            if (noQuery.startsWith("www/")) {
                candidates.add(noQuery)
            } else {
                candidates.add("www/$noQuery")
            }
            if (noQuery.startsWith("static/")) {
                candidates.add("www/" + noQuery.removePrefix("static/"))
            }
            if (noQuery.startsWith("www/static/")) {
                candidates.add("www/" + noQuery.removePrefix("www/static/"))
            }

            for (assetPath in candidates) {
                try {
                    val inputStream: InputStream = context.assets.open(assetPath)
                    val mime = guessMimeType(assetPath)
                    val encoding = if (mime.startsWith("text/") || mime == "application/json" || mime == "application/javascript") "UTF-8" else null
                    return WebResourceResponse(mime, encoding, 200, "OK", CORS_HEADERS, inputStream)
                } catch (_: Exception) {
                    // Try next candidate
                }
            }

            return notFoundResponse()
        }

        private fun notFoundResponse(): WebResourceResponse {
            return WebResourceResponse(
                "application/json",
                "UTF-8",
                404,
                "Not Found",
                CORS_HEADERS,
                ByteArrayInputStream("{}".toByteArray(Charsets.UTF_8))
            )
        }
    }

    override fun attachBaseContext(newBase: Context?) {
        if (newBase != null) {
            cleanupWebViewVariationsSeed(newBase)
        }
        super.attachBaseContext(newBase)
    }

    private fun cleanupWebViewVariationsSeed(ctx: Context = this) {
        try {
            val dirs = linkedSetOf<File>()
            try {
                dirs.add(ctx.getDir("webview", Context.MODE_PRIVATE))
            } catch (_: Exception) {}
            ctx.dataDir?.let { dataDir ->
                dirs.add(File(dataDir, "app_webview"))
                dirs.add(File(dataDir, "app_webview/Default"))
            }
            ctx.filesDir?.parentFile?.let { parent ->
                dirs.add(File(parent, "app_webview"))
                dirs.add(File(parent, "app_webview/Default"))
            }
            val seedNames = listOf("variations_seed", "variations_seed_new", "variations_seed_temp")
            val now = System.currentTimeMillis()
            for (dir in dirs) {
                if (!dir.exists()) dir.mkdirs()
                for (name in seedNames) {
                    val f = File(dir, name)
                    if (f.exists()) f.delete()
                }
                val stamp = File(dir, "variations_stamp")
                if (!stamp.exists()) stamp.createNewFile()
                stamp.setLastModified(now)
            }
        } catch (_: Exception) {}
    }

    private fun ensureDirectoryPath(dir: File) {
        try {
            if (dir.exists() && !dir.isDirectory) {
                dir.delete()
            }
            if (!dir.exists()) {
                dir.mkdirs()
            }
        } catch (_: Exception) {}
    }

    private fun ensureWebViewCacheDirectories() {
        try {
            val baseCache = cacheDir ?: return
            ensureDirectoryPath(baseCache)
            ensureDirectoryPath(File(baseCache, "WebView/Default/HTTP Cache"))
            ensureDirectoryPath(File(baseCache, "WebView/Default/HTTP Cache/Code Cache/js"))
            ensureDirectoryPath(File(baseCache, "WebView/Default/HTTP Cache/Code Cache/wasm"))
            ensureDirectoryPath(File(baseCache, "org.chromium.android_webview"))
        } catch (_: Exception) {}
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        cleanupWebViewVariationsSeed(this)
        super.onCreate(savedInstanceState)
        ensureWebViewCacheDirectories()

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val display = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    this.display
                } else {
                    @Suppress("DEPRECATION")
                    windowManager.defaultDisplay
                }
                val modes = display?.supportedModes
                val bestMode = modes?.maxByOrNull { it.refreshRate }
                if (bestMode != null) {
                    val params = window.attributes
                    params.preferredDisplayModeId = bestMode.modeId
                    params.preferredRefreshRate = bestMode.refreshRate
                    window.attributes = params
                }
            } catch (e: Exception) {
                Log.w("BeatstarApp", "No se pudo configurar 120Hz: ${e.message}")
            }
        }

        val silentHandler = SilentAssetsPathHandler(this)
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", silentHandler)
            .addPathHandler("/", silentHandler)
            .build()

        // Ensure Web Workers (Whisper ONNX/WASM) and Service Workers can load local APK assets reliably on all WebView versions
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {
            try {
                ServiceWorkerControllerCompat.getInstance().setServiceWorkerClient(object : ServiceWorkerClientCompat() {
                    override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse? {
                        val uri = request.url ?: return null
                        val host = uri.host?.lowercase(Locale.ROOT) ?: ""
                        if (host == "appassets.androidplatform.net") {
                            return assetLoader.shouldInterceptRequest(uri)
                        }
                        return null
                    }
                })
            } catch (_: Exception) {}
        }

        val initialLayerType = if (forceSoftwareLayer) {
            View.LAYER_TYPE_SOFTWARE
        } else {
            View.LAYER_TYPE_HARDWARE
        }

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#06040A"))
            setLayerType(initialLayerType, null)
            isFocusable = true
            isFocusableInTouchMode = true
            overScrollMode = View.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            isSoundEffectsEnabled = false
        }

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_NO_CACHE
            @Suppress("DEPRECATION")
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            javaScriptCanOpenWindowsAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.addJavascriptInterface(WebAppInterface(this, forceSoftwareLayer), "AndroidNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val uri = request?.url ?: return super.shouldInterceptRequest(view, request)
                val host = uri.host?.lowercase(Locale.ROOT) ?: ""
                val path = uri.path ?: ""

                if (host == "appassets.androidplatform.net") {
                    return assetLoader.shouldInterceptRequest(uri)
                }

                if ((host == "github.com" && path.contains("/Bruala33/renacer/releases/download/")) ||
                    host.endsWith("githubusercontent.com") ||
                    ((host.endsWith(".notube.im") || host.endsWith(".notube.net")) && path.contains("/download.php"))
                ) {
                    if (request.method.equals("OPTIONS", ignoreCase = true)) {
                        return WebResourceResponse(
                            "text/plain",
                            "UTF-8",
                            200,
                            "OK",
                            CORS_HEADERS,
                            ByteArrayInputStream(ByteArray(0))
                        )
                    }
                    val isNotube = host.endsWith(".notube.im") || host.endsWith(".notube.net")
                    var conn: HttpURLConnection? = null
                    return try {
                        conn = (URL(uri.toString()).openConnection() as HttpURLConnection).apply {
                            instanceFollowRedirects = true
                            connectTimeout = 8000
                            readTimeout = 25000
                            requestMethod = "GET"
                            if (isNotube) {
                                setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36")
                                setRequestProperty("Referer", "https://notube.im/")
                            } else {
                                setRequestProperty("User-Agent", "BeatstarRenacerAndroid/1.0")
                            }
                        }
                        val code = conn.responseCode
                        val contentType = (conn.contentType ?: "").lowercase(Locale.ROOT)
                        if (code in 200..299 && (!isNotube || (!contentType.contains("text/html") && !contentType.contains("application/json")))) {
                            val mime = if (isNotube) "audio/mpeg" else guessMimeType(uri.path ?: "")
                            val encoding = if (mime == "application/json" || mime.startsWith("text/")) "UTF-8" else null
                            WebResourceResponse(mime, encoding, 200, "OK", CORS_HEADERS, conn.inputStream)
                        } else {
                            conn.disconnect()
                            WebResourceResponse(
                                "text/plain",
                                "UTF-8",
                                if (code in 400..599) code else 404,
                                "Not Found",
                                CORS_HEADERS,
                                ByteArrayInputStream(ByteArray(0))
                            )
                        }
                    } catch (_: Exception) {
                        try { conn?.disconnect() } catch (_: Exception) {}
                        WebResourceResponse(
                            "text/plain",
                            "UTF-8",
                            502,
                            "Bad Gateway",
                            CORS_HEADERS,
                            ByteArrayInputStream(ByteArray(0))
                        )
                    }
                }

                return super.shouldInterceptRequest(view, request)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    Log.e("BeatstarApp", "Error cargando URL principal, activando fallback local: ${error?.description}")
                    view?.post {
                        view.loadUrl("file:///android_asset/www/index.html")
                    }
                }
            }

            override fun onRenderProcessGone(
                view: WebView?,
                detail: RenderProcessGoneDetail?
            ): Boolean {
                Log.w("BeatstarApp", "WebView render process gone; switching to software layer recovery")
                forceSoftwareLayer = true
                try {
                    view?.destroy()
                } catch (_: Exception) {}
                window?.decorView?.post {
                    if (!isFinishing && !isDestroyed) {
                        recreate()
                    }
                }
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d("BeatstarWeb", "[${it.messageLevel()}] ${it.message()} (${it.sourceId()}:${it.lineNumber()})")
                }
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                if (request == null) return
                val resources = request.resources ?: emptyArray()
                val needsAudio = resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                if (needsAudio && ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    pendingWebPermissionRequest = request
                    ActivityCompat.requestPermissions(
                        this@MainActivity,
                        arrayOf(Manifest.permission.RECORD_AUDIO),
                        AUDIO_PERMISSION_REQUEST_CODE
                    )
                } else {
                    try {
                        request.grant(resources)
                    } catch (_: Exception) {}
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    val mimeTypes = fileChooserParams?.acceptTypes?.filter { it.isNotBlank() }?.toTypedArray()
                    if (mimeTypes != null && mimeTypes.isNotEmpty() && mimeTypes.any { it.contains("/") }) {
                        putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes)
                    }
                }
                return try {
                    startActivityForResult(Intent.createChooser(intent, "Seleccionar Archivo"), FILE_CHOOSER_REQUEST_CODE)
                    true
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    false
                }
            }
        }

        setContentView(webView)
        webView.clearCache(true)
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html?v=86.0")
        hideSystemUI()
    }

    @Volatile private var isRequestingMicPermission: Boolean = false

    fun setNativeVocalMicSensitivity(level: Float) {
        nativeMicSensitivity = level.coerceIn(0.45f, 2.0f)
    }

    fun recalibrateNativeVocalMic() {
        nativeMicRecalibrateRequested = true
    }

    @SuppressLint("MissingPermission")
    fun startNativeVocalMicEngine(forcePromptIfDenied: Boolean = false): String {
        nativeMicRequested = true
        val hasPerm = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        if (!hasPerm) {
            nativeMicState = "permission_pending"
            if (!isRequestingMicPermission || forcePromptIfDenied) {
                isRequestingMicPermission = true
                runOnUiThread {
                    try {
                        ActivityCompat.requestPermissions(
                            this,
                            arrayOf(Manifest.permission.RECORD_AUDIO),
                            AUDIO_PERMISSION_REQUEST_CODE
                        )
                    } catch (_: Exception) {
                        isRequestingMicPermission = false
                    }
                }
            }
            return pollNativeVocalMicTelemetry()
        }
        isRequestingMicPermission = false
        if (nativeMicRunning && nativeMicThread?.isAlive == true) {
            nativeMicState = "running"
            return pollNativeVocalMicTelemetry()
        }

        // Non-blocking teardown of any previous session
        val sessionId = ++nativeMicSessionId
        try {
            nativeMicThread?.interrupt()
        } catch (_: Exception) {}

        nativeMicRunning = true
        nativeMicState = "running"
        nativeMicFreqHz = 0f
        nativeMicClarity = 0f
        nativeMicRms = 0f
        nativeMicVoiced = false

        nativeMicThread = Thread({
            val candidateRates = intArrayOf(44100, 48000, 22050, 16000)
            // Prioritize VOICE_RECOGNITION and MIC first so Android keeps media playback on main
            // stereo loudspeaker (VOICE_COMMUNICATION can route media to the quiet earpiece on some OEMs).
            // Hardware AcousticEchoCanceler + NoiseSuppressor are attached explicitly via audioSessionId below.
            val candidateSources = intArrayOf(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                MediaRecorder.AudioSource.MIC,
                MediaRecorder.AudioSource.DEFAULT,
                MediaRecorder.AudioSource.VOICE_COMMUNICATION
            )

            var recorder: AudioRecord? = null
            var chosenSampleRate = 44100
            var chosenFrameSamples = 2048

            outer@ for (sr in candidateRates) {
                if (!nativeMicRunning || nativeMicSessionId != sessionId) break
                val minBufBytes = AudioRecord.getMinBufferSize(
                    sr,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
                )
                if (minBufBytes <= 0) continue
                val fSamples = if (sr >= 44100) 2048 else 1024
                val recordBufBytes = max(minBufBytes * 2, fSamples * 4)
                for (src in candidateSources) {
                    if (!nativeMicRunning || nativeMicSessionId != sessionId) break@outer
                    try {
                        val cand = AudioRecord(
                            src,
                            sr,
                            AudioFormat.CHANNEL_IN_MONO,
                            AudioFormat.ENCODING_PCM_16BIT,
                            recordBufBytes
                        )
                        if (cand.state == AudioRecord.STATE_INITIALIZED) {
                            recorder = cand
                            chosenSampleRate = sr
                            chosenFrameSamples = fSamples
                            break@outer
                        } else {
                            cand.release()
                        }
                    } catch (_: Exception) {}
                }
            }

            if (recorder == null || !nativeMicRunning || nativeMicSessionId != sessionId) {
                try { recorder?.release() } catch (_: Exception) {}
                if (nativeMicSessionId == sessionId) {
                    nativeMicRunning = false
                    nativeMicState = if (recorder == null) "error" else "stopped"
                }
                return@Thread
            }

            var echoCanceler: AcousticEchoCanceler? = null
            var noiseSuppressor: NoiseSuppressor? = null
            var autoGainControl: AutomaticGainControl? = null

            try {
                val audioSession = recorder.audioSessionId
                if (AcousticEchoCanceler.isAvailable()) {
                    try {
                        echoCanceler = AcousticEchoCanceler.create(audioSession)
                        echoCanceler?.enabled = true
                    } catch (_: Exception) {}
                }
                if (NoiseSuppressor.isAvailable()) {
                    try {
                        noiseSuppressor = NoiseSuppressor.create(audioSession)
                        noiseSuppressor?.enabled = true
                    } catch (_: Exception) {}
                }
                if (AutomaticGainControl.isAvailable()) {
                    try {
                        // Disable AGC so Android never boosts quiet speaker bleed when user is silent
                        autoGainControl = AutomaticGainControl.create(audioSession)
                        autoGainControl?.enabled = false
                    } catch (_: Exception) {}
                }

                val sampleRate = chosenSampleRate
                val frameSamples = chosenFrameSamples
                val hopSamples = max(256, frameSamples / 4) // ~11ms hop for instant stop & 86Hz telemetry
                val readShortBuf = ShortArray(hopSamples)
                val ringBuf = FloatArray(frameSamples)
                val presenceBuf = FloatArray(frameSamples)
                var samplesFilled = 0

                val halfW = min(960, frameSamples / 2 - 4)
                val minTau = max(4, sampleRate / 960) // ~960 Hz upper bound
                val maxTau = min(halfW - 4, sampleRate / 82) // ~82 Hz lower bound
                val cmnd = FloatArray(maxTau + 2)

                recorder.startRecording()

                var prevSample = 0f
                var hpSample = 0f
                var lpSample = 0f
                var hpPresSample = 0f
                var lpPresSample = 0f

                val dt = 1f / sampleRate.toFloat()
                // Fundamental pitch band: 92 Hz - 1020 Hz
                val rcHp = 1f / (2f * Math.PI.toFloat() * 92f)
                val aHp = rcHp / (rcHp + dt)
                val rcLp = 1f / (2f * Math.PI.toFloat() * 1020f)
                val aLp = dt / (rcLp + dt)

                // Vocal presence/formant band: 280 Hz - 2600 Hz (distinguishes near-field voice from muffled speaker bleed)
                val rcHpPres = 1f / (2f * Math.PI.toFloat() * 280f)
                val aHpPres = rcHpPres / (rcHpPres + dt)
                val rcLpPres = 1f / (2f * Math.PI.toFloat() * 2600f)
                val aLpPres = dt / (rcLpPres + dt)

                var ambientFloor = 0.0038f
                var recalibFramesLeft = 45 // Quick 0.5s ambient/speaker-bleed calibration on startup
                var recalibRmsSum = 0f
                var recalibCount = 0
                var consecutiveVoiced = 0
                var lastRawFreq = 0f
                var smoothedFreq = 0f

                while (nativeMicRunning && nativeMicSessionId == sessionId && !Thread.currentThread().isInterrupted) {
                    val readCount = recorder.read(readShortBuf, 0, hopSamples)
                    if (!nativeMicRunning || nativeMicSessionId != sessionId) break
                    if (readCount <= 0) {
                        Thread.sleep(4)
                        continue
                    }

                    val shift = min(readCount, frameSamples)
                    if (samplesFilled >= frameSamples) {
                        System.arraycopy(ringBuf, shift, ringBuf, 0, frameSamples - shift)
                        System.arraycopy(presenceBuf, shift, presenceBuf, 0, frameSamples - shift)
                        samplesFilled = frameSamples - shift
                    }

                    for (i in 0 until shift) {
                        val raw = readShortBuf[i] / 32768f
                        hpSample = aHp * (hpSample + raw - prevSample)
                        hpPresSample = aHpPres * (hpPresSample + raw - prevSample)
                        prevSample = raw
                        lpSample += aLp * (hpSample - lpSample)
                        lpPresSample += aLpPres * (hpPresSample - lpPresSample)
                        if (samplesFilled < frameSamples) {
                            ringBuf[samplesFilled] = lpSample
                            presenceBuf[samplesFilled] = lpPresSample
                            samplesFilled++
                        }
                    }

                    if (samplesFilled < frameSamples) {
                        continue
                    }

                    var sumSq = 0f
                    var presSq = 0f
                    var zeroCrossings = 0
                    var prevSign = ringBuf[0] >= 0f
                    for (i in 0 until frameSamples) {
                        val v = ringBuf[i]
                        val p = presenceBuf[i]
                        sumSq += v * v
                        presSq += p * p
                        val curSign = v >= 0f
                        if (curSign != prevSign) {
                            zeroCrossings++
                            prevSign = curSign
                        }
                    }
                    val rms = sqrt(sumSq / frameSamples.toFloat())
                    val presRms = sqrt(presSq / frameSamples.toFloat())
                    val zcrHz = (zeroCrossings * sampleRate) / (2f * frameSamples.toFloat())
                    nativeMicRms = rms

                    if (nativeMicRecalibrateRequested) {
                        nativeMicRecalibrateRequested = false
                        recalibFramesLeft = 45
                        recalibRmsSum = 0f
                        recalibCount = 0
                        consecutiveVoiced = 0
                        nativeMicVoiced = false
                        nativeMicFreqHz = 0f
                        smoothedFreq = 0f
                        lastRawFreq = 0f
                    }
                    if (recalibFramesLeft > 0) {
                        recalibFramesLeft--
                        recalibRmsSum += rms
                        recalibCount++
                        val avgAmb = (recalibRmsSum / max(1, recalibCount)).coerceIn(0.0022f, 0.032f)
                        ambientFloor = avgAmb
                        nativeMicNoiseFloor = ambientFloor
                    }

                    // Dynamic gate threshold scaled inversely by user mic sensitivity
                    val sens = nativeMicSensitivity.coerceIn(0.45f, 2.0f)
                    val gateMult = (2.45f / sens).coerceIn(1.35f, 4.4f)
                    val minGate = (0.0052f / sens).coerceIn(0.0026f, 0.014f)
                    val gateThreshold = max(minGate, ambientFloor * gateMult)
                    if (rms < gateThreshold || zcrHz > 1600f) {
                        // Adapt ambient floor when below voice gate
                        ambientFloor = if (rms < ambientFloor) {
                            ambientFloor * 0.93f + max(0.0020f, rms) * 0.07f
                        } else {
                            (ambientFloor * 0.982f + rms * 0.018f).coerceAtMost(0.032f)
                        }
                        nativeMicNoiseFloor = ambientFloor
                        consecutiveVoiced = max(0, consecutiveVoiced - 1)
                        if (consecutiveVoiced == 0) {
                            nativeMicFreqHz = 0f
                            nativeMicClarity = 0f
                            nativeMicVoiced = false
                            smoothedFreq = 0f
                            lastRawFreq = 0f
                        }
                        continue
                    }

                    // YIN Cumulative Mean Normalized Difference d'(tau)
                    cmnd[0] = 1f
                    var runningSum = 0f
                    for (tau in 1..maxTau) {
                        var diff = 0f
                        var i = 0
                        while (i < halfW) {
                            val d = ringBuf[i] - ringBuf[i + tau]
                            diff += d * d
                            i += 1
                        }
                        runningSum += diff
                        cmnd[tau] = if (runningSum > 1e-9f) (diff * tau) / runningSum else 1f
                    }

                    var chosenTau = -1
                    var chosenVal = 1f
                    val strictYinThreshold = if (consecutiveVoiced >= 2) 0.27f else 0.20f
                    for (tau in (minTau + 1) until maxTau) {
                        val v = cmnd[tau]
                        if (v < strictYinThreshold && v <= cmnd[tau - 1] && v <= cmnd[tau + 1]) {
                            chosenTau = tau
                            chosenVal = v
                            break
                        }
                    }
                    if (chosenTau < 0) {
                        for (tau in (minTau + 1) until maxTau) {
                            val v = cmnd[tau]
                            if (v < chosenVal && v <= cmnd[tau - 1] && v <= cmnd[tau + 1]) {
                                chosenVal = v
                                chosenTau = tau
                            }
                        }
                        val maxAllowedYin = if (consecutiveVoiced >= 2) 0.31f else 0.25f
                        if (chosenVal > maxAllowedYin) {
                            chosenTau = -1
                        }
                    }

                    // Harmonic / sub-octave verification: only if chosenTau was a partial 2nd harmonic (chosenVal > 0.07f) and 2*tau is a much deeper trough (< 52%)
                    if (chosenTau >= minTau && chosenVal > 0.07f) {
                        val doubleTau = chosenTau * 2
                        if (doubleTau < maxTau - 1) {
                            var bestSubTau = doubleTau
                            var bestSubVal = cmnd[doubleTau]
                            for (dtau in max(minTau + 1, doubleTau - 2)..min(maxTau - 1, doubleTau + 2)) {
                                if (cmnd[dtau] < bestSubVal) {
                                    bestSubVal = cmnd[dtau]
                                    bestSubTau = dtau
                                }
                            }
                            if (bestSubVal < chosenVal * 0.52f) {
                                chosenTau = bestSubTau
                                chosenVal = bestSubVal
                            }
                        }
                    }

                    val presenceRatio = presRms / max(1e-5f, rms)
                    val requiredClarity = if (consecutiveVoiced >= 2) 0.66f else 0.72f
                    if (chosenTau >= minTau && presenceRatio >= 0.18f) {
                        val y1 = cmnd[chosenTau - 1]
                        val y2 = cmnd[chosenTau]
                        val y3 = cmnd[chosenTau + 1]
                        val denom = (y1 - 2f * y2 + y3)
                        val shiftTau = if (abs(denom) > 1e-6f) 0.5f * (y1 - y3) / denom else 0f
                        val refinedTau = max(minTau.toFloat(), chosenTau.toFloat() + shiftTau.coerceIn(-0.5f, 0.5f))
                        val rawFreq = sampleRate.toFloat() / refinedTau
                        val clarity = (1f - chosenVal).coerceIn(0f, 1f)

                        if (rawFreq in 82f..960f && clarity >= requiredClarity) {
                            // Require pitch stability across adjacent frames (~±2.8 semitones or clean octave)
                            // to reject erratic multi-instrument speaker bleed
                            val ratio = if (lastRawFreq > 0f) rawFreq / lastRawFreq else 1f
                            val isPitchStable = lastRawFreq <= 0f ||
                                (ratio in 0.845f..1.185f) ||
                                (ratio in 1.78f..2.24f) ||
                                (ratio in 0.445f..0.56f)
                            lastRawFreq = rawFreq

                            if (isPitchStable) {
                                consecutiveVoiced = min(6, consecutiveVoiced + 1)
                            } else {
                                consecutiveVoiced = 1
                            }

                            if (consecutiveVoiced >= 2) {
                                smoothedFreq = if (smoothedFreq > 0f && abs(rawFreq - smoothedFreq) / smoothedFreq < 0.14f) {
                                    smoothedFreq * 0.36f + rawFreq * 0.64f
                                } else {
                                    rawFreq
                                }
                                nativeMicFreqHz = smoothedFreq
                                nativeMicClarity = clarity
                                nativeMicVoiced = true
                            }
                        } else {
                            // Unvoiced / diffuse bleed: slowly adapt ambient floor upward
                            ambientFloor = (ambientFloor * 0.978f + rms * 0.022f).coerceIn(0.0020f, 0.032f)
                            nativeMicNoiseFloor = ambientFloor
                            consecutiveVoiced = max(0, consecutiveVoiced - 1)
                            if (consecutiveVoiced == 0) {
                                nativeMicFreqHz = 0f
                                nativeMicClarity = 0f
                                nativeMicVoiced = false
                                smoothedFreq = 0f
                                lastRawFreq = 0f
                            }
                        }
                    } else {
                        // Non-periodic energy (speaker percussion/bleed): adapt floor so speaker bleed stays gated out
                        ambientFloor = (ambientFloor * 0.972f + rms * 0.028f).coerceIn(0.0020f, 0.034f)
                        nativeMicNoiseFloor = ambientFloor
                        consecutiveVoiced = max(0, consecutiveVoiced - 1)
                        if (consecutiveVoiced == 0) {
                            nativeMicFreqHz = 0f
                            nativeMicClarity = 0f
                            nativeMicVoiced = false
                            smoothedFreq = 0f
                            lastRawFreq = 0f
                        }
                    }
                }
            } catch (_: Exception) {
            } finally {
                try { echoCanceler?.release() } catch (_: Exception) {}
                try { noiseSuppressor?.release() } catch (_: Exception) {}
                try { autoGainControl?.release() } catch (_: Exception) {}
                try { recorder.stop() } catch (_: Exception) {}
                try { recorder.release() } catch (_: Exception) {}
            }
        }, "BeatstarVocalYinThread").apply {
            priority = Thread.NORM_PRIORITY + 1
            isDaemon = true
            start()
        }
        return pollNativeVocalMicTelemetry()
    }

    fun stopNativeVocalMicEngine(keepRequested: Boolean = false) {
        if (!keepRequested) {
            nativeMicRequested = false
        }
        nativeMicSessionId++
        nativeMicRunning = false
        if (!keepRequested) {
            nativeMicState = "stopped"
        }
        nativeMicFreqHz = 0f
        nativeMicClarity = 0f
        nativeMicRms = 0f
        nativeMicVoiced = false
        val t = nativeMicThread
        nativeMicThread = null
        try {
            t?.interrupt()
        } catch (_: Exception) {}
    }

    fun pollNativeVocalMicTelemetry(): String {
        val permGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
        val isAct = nativeMicRunning && nativeMicState == "running"
        return String.format(
            Locale.US,
            "{\"active\":%s,\"state\":\"%s\",\"permissionGranted\":%s,\"voiced\":%s,\"freqHz\":%.2f,\"clarity\":%.3f,\"rms\":%.5f,\"noiseFloor\":%.5f}",
            if (isAct) "true" else "false",
            nativeMicState,
            if (permGranted) "true" else "false",
            if (nativeMicVoiced) "true" else "false",
            nativeMicFreqHz,
            nativeMicClarity,
            nativeMicRms,
            nativeMicNoiseFloor
        )
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            val results: Array<Uri>? = if (resultCode == Activity.RESULT_OK && data != null) {
                val dataString = data.dataString
                if (dataString != null) {
                    arrayOf(Uri.parse(dataString))
                } else if (data.clipData != null) {
                    val count = data.clipData!!.itemCount
                    val uris = mutableListOf<Uri>()
                    for (i in 0 until count) {
                        uris.add(data.clipData!!.getItemAt(i).uri)
                    }
                    uris.toTypedArray()
                } else null
            } else null

            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        } else {
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == AUDIO_PERMISSION_REQUEST_CODE) {
            isRequestingMicPermission = false
            val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
            val req = pendingWebPermissionRequest
            pendingWebPermissionRequest = null
            if (req != null) {
                try {
                    if (granted) {
                        req.grant(req.resources)
                    } else {
                        req.deny()
                    }
                } catch (_: Exception) {}
            }
            if (granted) {
                nativeMicRequested = true
                startNativeVocalMicEngine()
            } else {
                nativeMicState = "denied"
            }
        }
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    override fun onPause() {
        cleanupWebViewVariationsSeed(this)
        if (!isRequestingMicPermission) {
            stopNativeVocalMicEngine(keepRequested = nativeMicRequested)
        }
        super.onPause()
        if (::webView.isInitialized && !isRequestingMicPermission) {
            try {
                webView.evaluateJavascript("if (typeof window.onAppBackground === 'function') { window.onAppBackground(); }", null)
                webView.onPause()
                webView.pauseTimers()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onStop() {
        cleanupWebViewVariationsSeed(this)
        super.onStop()
    }

    override fun onResume() {
        cleanupWebViewVariationsSeed(this)
        super.onResume()
        if (::webView.isInitialized) {
            try {
                webView.onResume()
                webView.resumeTimers()
                hideSystemUI()
                webView.evaluateJavascript("if (typeof window.onAppForeground === 'function') { window.onAppForeground(); }", null)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        if (nativeMicRequested && !nativeMicRunning) {
            val hasPerm = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            if (hasPerm) {
                startNativeVocalMicEngine()
            }
        }
    }

    override fun onDestroy() {
        cleanupWebViewVariationsSeed(this)
        stopNativeVocalMicEngine(keepRequested = false)
        if (::webView.isInitialized) {
            try {
                webView.stopLoading()
                webView.destroy()
            } catch (_: Exception) {}
        }
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        webView.evaluateJavascript(
            "if (window.SingStarVocalEngine && window.SingStarVocalEngine.isActive && window.DiscoverHomeApp) { window.DiscoverHomeApp.closeSingStarStudio(); } else if (typeof engine !== 'undefined' && engine && engine.isPaused) { resumeGame(); } else if (typeof engine !== 'undefined' && engine && engine.isRunning) { openPauseModal(); } else if (typeof exitToSearch === 'function') { exitToSearch(); }",
            null
        )
    }

    class WebAppInterface(private val context: Context, private val isSoftMode: Boolean = false) {
        private val hapticExecutor = Executors.newSingleThreadExecutor()
        private val vibrator: Vibrator? by lazy {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    vm?.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                }
            } catch (_: Exception) {
                null
            }
        }

        @JavascriptInterface
        fun startVocalMic(): String {
            val act = context as? MainActivity ?: return "{\"active\":false,\"state\":\"error\",\"permissionGranted\":false,\"freqHz\":0,\"clarity\":0,\"rms\":0}"
            return act.startNativeVocalMicEngine(forcePromptIfDenied = true)
        }

        @JavascriptInterface
        fun stopVocalMic() {
            val act = context as? MainActivity ?: return
            act.stopNativeVocalMicEngine(keepRequested = false)
        }

        @JavascriptInterface
        fun pollVocalMic(): String {
            val act = context as? MainActivity ?: return "{\"active\":false,\"state\":\"stopped\",\"permissionGranted\":false,\"freqHz\":0,\"clarity\":0,\"rms\":0}"
            return act.pollNativeVocalMicTelemetry()
        }

        @JavascriptInterface
        fun setVocalMicSensitivity(level: Float) {
            val act = context as? MainActivity ?: return
            act.setNativeVocalMicSensitivity(level)
        }

        @JavascriptInterface
        fun recalibrateVocalMic() {
            val act = context as? MainActivity ?: return
            act.recalibrateNativeVocalMic()
        }

        @JavascriptInterface
        fun vibrate(milliseconds: Long) {
            val dur = milliseconds.coerceIn(1L, 100L)
            hapticExecutor.execute {
                try {
                    val vib = vibrator ?: return@execute
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vib.vibrate(VibrationEffect.createOneShot(dur, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vib.vibrate(dur)
                    }
                } catch (_: Exception) {}
            }
        }

        @JavascriptInterface
        fun getAppVersionCode(): Int {
            return try {
                val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    pInfo.longVersionCode.toInt()
                } else {
                    @Suppress("DEPRECATION")
                    pInfo.versionCode
                }
            } catch (e: Exception) {
                54
            }
        }

        @JavascriptInterface
        fun isAndroidNative(): Boolean = true

        @JavascriptInterface
        fun isSoftwareRendered(): Boolean = isSoftMode

        @JavascriptInterface
        fun openBrowser(url: String) {
            try {
                val fullUrl = if (url.startsWith("http://") || url.startsWith("https://")) {
                    url
                } else {
                    "https://renacer.onrender.com/${url.trimStart('/')}"
                }
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(fullUrl)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
