package com.beatstar.renacer

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
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
    private val FILE_CHOOSER_REQUEST_CODE = 1001
    private lateinit var assetLoader: WebViewAssetLoader

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

            val cleanRel = trimmed
                .removePrefix("www/")
                .removePrefix("static/")
                .substringBefore('?')
            val isLiveSyncCoreFile = cleanRel == "game.html" ||
                cleanRel == "index.html" ||
                cleanRel == "game.js" ||
                cleanRel == "parsers.js" ||
                cleanRel == "style.css" ||
                cleanRel == "styles.css" ||
                cleanRel == "editor.js" ||
                cleanRel == "slot_machine.js" ||
                cleanRel == "gachapon_3d.js"

            if (isLiveSyncCoreFile) {
                val liveDir = File(context.filesDir, "live_www")
                val cachedFile = File(liveDir, if (cleanRel == "game.html") "index.html" else cleanRel)
                val mime = guessMimeType(cleanRel)
                val encoding = "UTF-8"

                // 1. Intentar descargar la última versión en vivo de renacer.onrender.com (con timeout corto para no bloquear)
                try {
                    val remoteName = if (cleanRel == "game.html") "index.html" else if (cleanRel == "styles.css") "style.css" else cleanRel
                    val remoteUrl = URL("https://renacer.onrender.com/$remoteName?t=${System.currentTimeMillis()}")
                    val conn = (remoteUrl.openConnection() as HttpURLConnection).apply {
                        requestMethod = "GET"
                        connectTimeout = 2200
                        readTimeout = 3500
                        useCaches = false
                        setRequestProperty("Accept-Encoding", "identity")
                        setRequestProperty("Cache-Control", "no-cache")
                    }
                    if (conn.responseCode == 200) {
                        val bytes = conn.inputStream.use { it.readBytes() }
                        if (bytes.size > 512) {
                            try {
                                if (!liveDir.exists()) liveDir.mkdirs()
                                cachedFile.writeBytes(bytes)
                            } catch (_: Exception) {}
                            return WebResourceResponse(mime, encoding, 200, "OK", CORS_HEADERS, ByteArrayInputStream(bytes))
                        }
                    }
                } catch (_: Exception) {
                    // Sin conexión o servidor despertando: usar caché sincronizada si es más reciente que el APK
                }

                // 2. Si hay una versión sincronizada guardada en disco más reciente que la instalación del APK, servirla offline
                try {
                    val pkgTime = try {
                        context.packageManager.getPackageInfo(context.packageName, 0).lastUpdateTime
                    } catch (_: Exception) {
                        0L
                    }
                    if (cachedFile.exists() && cachedFile.length() > 512L && cachedFile.lastModified() > pkgTime) {
                        return WebResourceResponse(mime, encoding, 200, "OK", CORS_HEADERS, cachedFile.inputStream())
                    }
                } catch (_: Exception) {}
            }

            val candidates = linkedSetOf<String>()
            if (cleanRel == "game.html") {
                candidates.add("www/index.html")
            }
            if (trimmed.startsWith("www/")) {
                candidates.add(trimmed)
            } else {
                candidates.add("www/$trimmed")
            }
            if (trimmed.startsWith("static/")) {
                candidates.add("www/" + trimmed.removePrefix("static/"))
            }
            if (trimmed.startsWith("www/static/")) {
                candidates.add("www/" + trimmed.removePrefix("www/static/"))
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

        webView = WebView(this).apply {
            setBackgroundColor(Color.parseColor("#06040A"))
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
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

        webView.addJavascriptInterface(WebAppInterface(this), "AndroidNative")

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
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d("BeatstarWeb", "[${it.messageLevel()}] ${it.message()} (${it.sourceId()}:${it.lineNumber()})")
                }
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
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
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html?v=54.0")
        hideSystemUI()
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
        super.onPause()
        if (::webView.isInitialized) {
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
    }

    override fun onDestroy() {
        cleanupWebViewVariationsSeed(this)
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
            "if (typeof engine !== 'undefined' && engine && engine.isRunning) { if (engine.isPaused) { resumeGame(); } else { openPauseModal(); } } else if (typeof exitToSearch === 'function') { exitToSearch(); }",
            null
        )
    }

    class WebAppInterface(private val context: Context) {
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
