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

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader

    // Callback para el selector de archivos nativo de Android
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_REQUEST_CODE = 1001

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Mantener pantalla encendida
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 2. Desbloquear modo de alta tasa de refresco (120Hz / 90Hz) para máxima fluidez
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val display = this.display
                if (display != null) {
                    val modes = display.supportedModes
                    var maxMode = display.mode
                    var maxRate = maxMode.refreshRate
                    for (mode in modes) {
                        if (mode.refreshRate > maxRate) {
                            maxRate = mode.refreshRate
                            maxMode = mode
                        }
                    }
                    val params = window.attributes
                    params.preferredDisplayModeId = maxMode.modeId
                    window.attributes = params
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                @Suppress("DEPRECATION")
                val windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
                @Suppress("DEPRECATION")
                val display = windowManager?.defaultDisplay
                if (display != null) {
                    val modes = display.supportedModes
                    var maxMode = display.mode
                    var maxRate = maxMode.refreshRate
                    for (mode in modes) {
                        if (mode.refreshRate > maxRate) {
                            maxRate = mode.refreshRate
                            maxMode = mode
                        }
                    }
                    val params = window.attributes
                    params.preferredDisplayModeId = maxMode.modeId
                    window.attributes = params
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

        // 3. Asset Loader
        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        // 4. Configuración de WebView con aceleración directa por GPU
        webView = WebView(this).apply {
            setBackgroundColor(0xFF06040A.toInt())
            isFocusable = true
            isFocusableInTouchMode = true
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
        webView.clearCache(true)
        settings.javaScriptCanOpenWindowsAutomatically = true

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // 5. JavaScript Native Interface
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidNative")

        // 6. Custom WebView Client
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                request?.url?.let { uri ->
                    try {
                        val response = assetLoader.shouldInterceptRequest(uri)
                        if (response != null) return response
                    } catch (e: Exception) {
                        android.util.Log.e("BeatstarWeb", "AssetLoader intercept error: ${e.message}")
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

        // 7. WebChrome Client con permisos, logs y Selector de Audio nativo
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    android.util.Log.d("BeatstarWeb", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                }
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

        // 8. Carga inicial del juego
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/game.html")

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

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        webView.evaluateJavascript("if (typeof engine !== 'undefined' && engine && engine.isRunning) { if (engine.isPaused) { resumeGame(); } else { openPauseModal(); } } else if (typeof exitToSearch === 'function') { exitToSearch(); }", null)
    }

    class WebAppInterface(private val context: Context) {
        @JavascriptInterface
        fun vibrate(milliseconds: Long) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    vibratorManager?.defaultVibrator?.vibrate(
                        VibrationEffect.createOneShot(milliseconds, VibrationEffect.DEFAULT_AMPLITUDE)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    val v = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    v?.vibrate(milliseconds)
                }
            } catch (e: Exception) {
                e.printStackTrace()
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
                2
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
