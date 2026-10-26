package com.beatstar.renacer

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
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
    private lateinit var assetLoader: WebViewAssetLoader

    // Callback para el selector de archivos nativo de Android
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_REQUEST_CODE = 1001

    companion object {
        private val CORS_HEADERS = mapOf(
            "Access-Control-Allow-Origin" to "*",
            "Access-Control-Allow-Methods" to "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers" to "*",
            "Cache-Control" to "no-store, no-cache, must-revalidate"
        )

        fun guessMimeType(path: String): String {
            val clean = path.substringBefore('?').substringBefore('#').lowercase(Locale.ROOT)
            return when {
                clean.endsWith(".html") || clean.endsWith(".htm") -> "text/html"
                clean.endsWith(".js") || clean.endsWith(".mjs") -> "application/javascript"
                clean.endsWith(".css") -> "text/css"
                clean.endsWith(".json") -> "application/json"
                clean.endsWith(".mp3") -> "audio/mpeg"
                clean.endsWith(".ogg") || clean.endsWith(".oga") -> "audio/ogg"
                clean.endsWith(".wav") -> "audio/wav"
                clean.endsWith(".m4a") -> "audio/mp4"
                clean.endsWith(".png") -> "image/png"
                clean.endsWith(".jpg") || clean.endsWith(".jpeg") -> "image/jpeg"
                clean.endsWith(".webp") -> "image/webp"
                clean.endsWith(".gif") -> "image/gif"
                clean.endsWith(".svg") -> "image/svg+xml"
                clean.endsWith(".ico") -> "image/x-icon"
                clean.endsWith(".wasm") -> "application/wasm"
                clean.endsWith(".woff2") -> "font/woff2"
                clean.endsWith(".woff") -> "font/woff"
                clean.endsWith(".ttf") -> "font/ttf"
                else -> "application/octet-stream"
            }
        }
    }

    /**
     * Custom PathHandler que sirve archivos de assets/ sin emitir trazas de error Log.e
     * cuando el cliente web comprueba la existencia opcional de canciones en /songs/.
     */
    private class SilentAssetsPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse {
            val cleanPath = path.trimStart('/')
            if (cleanPath.isEmpty()) {
                return notFoundResponse()
            }

            if (cleanPath == "api/songs" || cleanPath == "api/custom-songs") {
                return WebResourceResponse(
                    "application/json",
                    "UTF-8",
                    200,
                    "OK",
                    CORS_HEADERS,
                    ByteArrayInputStream("[]".toByteArray(Charsets.UTF_8))
                )
            }

            val candidates = LinkedHashSet<String>(6)
            if (cleanPath == "api/leaderboard" || cleanPath == "leaderboard.json") {
                candidates.add("www/leaderboard.json")
            }
            candidates.add(cleanPath)
            if (!cleanPath.startsWith("www/")) {
                candidates.add("www/$cleanPath")
            }
            if (cleanPath.startsWith("static/")) {
                candidates.add("www/${cleanPath.removePrefix("static/")}")
            } else if (cleanPath.startsWith("www/static/")) {
                candidates.add("www/${cleanPath.removePrefix("www/static/")}")
            }

            val assetManager = context.assets
            for (candidate in candidates) {
                try {
                    val stream: InputStream = assetManager.open(candidate)
                    val mimeType = guessMimeType(candidate)
                    val encoding = if (mimeType.startsWith("text/") || mimeType == "application/json" || mimeType == "application/javascript") "UTF-8" else null
                    return WebResourceResponse(mimeType, encoding, 200, "OK", CORS_HEADERS, stream)
                } catch (_: Exception) {
                    // Continuar probando el siguiente candidato silenciosamente
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

    private fun ensureDirectoryPath(root: File, relativePath: String) {
        var current = root
        for (part in relativePath.split('/')) {
            if (part.isEmpty()) continue
            current = File(current, part)
            if (current.exists() && !current.isDirectory) {
                current.delete()
            }
            if (!current.exists()) {
                current.mkdirs()
            }
        }
    }

    private fun cleanupWebViewVariationsSeed(ctx: Context = this) {
        try {
            val webviewDirs = linkedSetOf<File>()
            try {
                webviewDirs.add(ctx.getDir("webview", Context.MODE_PRIVATE))
            } catch (_: Exception) {
            }
            ctx.applicationInfo?.dataDir?.let { dataDir ->
                webviewDirs.add(File(dataDir, "app_webview"))
                webviewDirs.add(File(dataDir, "app_webview/Default"))
            }
            ctx.filesDir?.parentFile?.let { parent ->
                webviewDirs.add(File(parent, "app_webview"))
                webviewDirs.add(File(parent, "app_webview/Default"))
            }

            val seedNames = listOf(
                "variations_seed",
                "variations_seed_new",
                "variations_seed_temp"
            )
            val now = System.currentTimeMillis()
            for (dir in webviewDirs) {
                if (!dir.exists()) {
                    dir.mkdirs()
                }
                for (name in seedNames) {
                    val f = File(dir, name)
                    if (f.exists()) {
                        f.delete()
                    }
                }
                // Actualizar variations_stamp para que VariationsSeedLoader active shouldThrottleRequests()
                // y no solicite semillas sin firma al VariationsSeedServer del emulador.
                val stamp = File(dir, "variations_stamp")
                if (!stamp.exists()) {
                    stamp.createNewFile()
                }
                stamp.setLastModified(now)
            }
        } catch (_: Exception) {
        }
    }

    private fun ensureWebViewCacheDirectories() {
        try {
            cleanupWebViewVariationsSeed(this)
            val roots = listOfNotNull(cacheDir, codeCacheDir)
            val subDirs = listOf(
                "WebView/Default/HTTP Cache/Code Cache/js",
                "WebView/Default/HTTP Cache/Code Cache/wasm",
                "WebView/Default/HTTP Cache",
                "org.chromium.android_webview"
            )
            for (root in roots) {
                for (sub in subDirs) {
                    ensureDirectoryPath(root, sub)
                }
            }
        } catch (_: Exception) {
        }
    }

    override fun attachBaseContext(newBase: Context?) {
        if (newBase != null) {
            cleanupWebViewVariationsSeed(newBase)
        }
        super.attachBaseContext(newBase)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        cleanupWebViewVariationsSeed(this)
        super.onCreate(savedInstanceState)

        // Pre-crear jerarquía de directorios de caché de Chromium WebView para evitar errores de simple_backend_impl.cc
        ensureWebViewCacheDirectories()

        // 1. Mantener pantalla encendida y activar aceleración por hardware a nivel de ventana
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        )

        // 2. Desbloquear modo de alta tasa de refresco (120Hz / 90Hz) manteniendo la resolución nativa
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val display = this.display
                if (display != null) {
                    val modes = display.supportedModes
                    val currentMode = display.mode
                    var maxMode = currentMode
                    var maxRate = currentMode.refreshRate
                    for (mode in modes) {
                        val sameRes = mode.physicalWidth == currentMode.physicalWidth &&
                            mode.physicalHeight == currentMode.physicalHeight
                        if (sameRes && mode.refreshRate > maxRate) {
                            maxRate = mode.refreshRate
                            maxMode = mode
                        }
                    }
                    if (maxMode.modeId != currentMode.modeId) {
                        val params = window.attributes
                        params.preferredDisplayModeId = maxMode.modeId
                        params.preferredRefreshRate = maxRate
                        window.attributes = params
                    }
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                @Suppress("DEPRECATION")
                val windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
                @Suppress("DEPRECATION")
                val display = windowManager?.defaultDisplay
                if (display != null) {
                    val modes = display.supportedModes
                    val currentMode = display.mode
                    var maxMode = currentMode
                    var maxRate = currentMode.refreshRate
                    for (mode in modes) {
                        val sameRes = mode.physicalWidth == currentMode.physicalWidth &&
                            mode.physicalHeight == currentMode.physicalHeight
                        if (sameRes && mode.refreshRate > maxRate) {
                            maxRate = mode.refreshRate
                            maxMode = mode
                        }
                    }
                    if (maxMode.modeId != currentMode.modeId) {
                        val params = window.attributes
                        params.preferredDisplayModeId = maxMode.modeId
                        params.preferredRefreshRate = maxRate
                        window.attributes = params
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.w("BeatstarApp", "No se pudo configurar 120Hz: ${e.message}")
        }

        // 3. Modo pantalla completa Edge-to-Edge
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }

        // 4. Asset Loader silencioso (sin falsos positivos de FileNotFoundException en Logcat)
        val silentHandler = SilentAssetsPathHandler(this)
        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", silentHandler)
            .addPathHandler("/", silentHandler)
            .build()

        // 5. Configuración de WebView con renderizado directo en la ventana acelerada por GPU (sin FBO intermedio que parpadee)
        webView = WebView(this).apply {
            setBackgroundColor(0xFF06040A.toInt())
            setLayerType(View.LAYER_TYPE_NONE, null)
            isFocusable = true
            isFocusableInTouchMode = true
            overScrollMode = View.OVER_SCROLL_NEVER
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            isSoundEffectsEnabled = false
        }

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        @Suppress("DEPRECATION")
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        @Suppress("DEPRECATION")
        settings.allowFileAccessFromFileURLs = true
        @Suppress("DEPRECATION")
        settings.allowUniversalAccessFromFileURLs = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_NO_CACHE
        @Suppress("DEPRECATION")
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH)
        settings.javaScriptCanOpenWindowsAutomatically = true

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // 6. JavaScript Native Interface (con ejecución asíncrona para no bloquear el hilo de 120fps)
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidNative")

        // 7. Custom WebView Client
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val uri = request?.url ?: return super.shouldInterceptRequest(view, request)

                // A. Archivos locales bajo appassets.androidplatform.net
                if (uri.host == "appassets.androidplatform.net") {
                    try {
                        val response = assetLoader.shouldInterceptRequest(uri)
                        if (response != null) return response
                    } catch (_: Exception) {
                    }
                }

                // B. Proxy nativo sin bloqueo CORS para descargas de canciones desde GitHub Releases
                if (uri.host == "github.com" && uri.path?.startsWith("/Bruala33/renacer/releases/download/") == true) {
                    if (request.method.equals("OPTIONS", ignoreCase = true)) {
                        return WebResourceResponse("text/plain", "UTF-8", 200, "OK", CORS_HEADERS, ByteArrayInputStream(ByteArray(0)))
                    }
                    try {
                        val conn = (URL(uri.toString()).openConnection() as HttpURLConnection).apply {
                            instanceFollowRedirects = true
                            connectTimeout = 8000
                            readTimeout = 20000
                            requestMethod = "GET"
                            setRequestProperty("User-Agent", "BeatstarRenacerAndroid/1.0")
                        }
                        val status = conn.responseCode
                        if (status in 200..299) {
                            val mime = guessMimeType(uri.path ?: "")
                            val encoding = if (mime == "application/json" || mime.startsWith("text/")) "UTF-8" else null
                            return WebResourceResponse(mime, encoding, status, "OK", CORS_HEADERS, conn.inputStream)
                        } else {
                            conn.disconnect()
                            return WebResourceResponse(
                                "text/plain",
                                "UTF-8",
                                status.coerceIn(400, 599),
                                "Not Found",
                                CORS_HEADERS,
                                ByteArrayInputStream(ByteArray(0))
                            )
                        }
                    } catch (_: Exception) {
                        return WebResourceResponse(
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
                error: android.webkit.WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    android.util.Log.w("BeatstarWeb", "Error cargando URL principal, activando fallback local: ${error?.description}")
                    view?.post {
                        view.loadUrl("file:///android_asset/www/game.html")
                    }
                }
            }
        }

        // 8. WebChrome Client con permisos, logs y Selector de Audio nativo
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return true
            }

            // Habilita <input type="file"> para abrir el explorador de archivos
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val acceptTypes = fileChooserParams?.acceptTypes
                val mimeList = mutableListOf<String>()
                if (acceptTypes != null && acceptTypes.isNotEmpty()) {
                    for (t in acceptTypes) {
                        for (sub in t.split(",")) {
                            val trimmed = sub.trim()
                            if (trimmed.isNotBlank()) mimeList.add(trimmed)
                        }
                    }
                }

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    if (mimeList.size == 1 && !mimeList[0].contains("*/*")) {
                        type = mimeList[0]
                    } else if (mimeList.isNotEmpty()) {
                        type = "*/*"
                        putExtra(Intent.EXTRA_MIME_TYPES, mimeList.toTypedArray())
                    } else {
                        type = "*/*"
                    }
                }

                @Suppress("DEPRECATION")
                startActivityForResult(
                    Intent.createChooser(intent, "Seleccionar Archivo"),
                    FILE_CHOOSER_REQUEST_CODE
                )
                return true
            }
        }

        setContentView(webView)

        // 9. Limpiar caché de WebView y cargar la versión actualizada del juego
        webView.clearCache(true)
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/game.html?v=34.0")

        hideSystemUI()
    }

    // Manejador del archivo de audio seleccionado
    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback == null) return

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
                } else {
                    null
                }
            } else {
                null
            }

            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        } else {
            @Suppress("DEPRECATION")
            super.onActivityResult(requestCode, resultCode, data)
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUI()
        }
    }

    private fun hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
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
                webView.evaluateJavascript("if (typeof window.onAppBackground === 'function') { window.onAppBackground(); }", null)
                webView.destroy()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        webView.evaluateJavascript("if (typeof engine !== 'undefined' && engine && engine.isRunning) { if (engine.isPaused) { resumeGame(); } else { openPauseModal(); } } else if (typeof exitToSearch === 'function') { exitToSearch(); }", null)
    }

    class WebAppInterface(private val context: Context) {
        private val hapticExecutor = Executors.newSingleThreadExecutor()
        private val vibrator: Vibrator? by lazy {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
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
                } catch (_: Exception) {
                }
            }
        }

        @JavascriptInterface
        fun isAndroidNative(): Boolean {
            return true
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
                34
            }
        }

        @JavascriptInterface
        fun openBrowser(url: String) {
            try {
                val fullUrl = if (!url.startsWith("http://") && !url.startsWith("https://")) {
                    "https://renacer.onrender.com" + if (url.startsWith("/")) url else "/$url"
                } else {
                    url
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
