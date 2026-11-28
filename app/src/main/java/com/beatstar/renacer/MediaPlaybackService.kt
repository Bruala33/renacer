package com.beatstar.renacer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.BitmapFactory
import android.media.AudioManager
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log

class MediaPlaybackService : Service() {

    companion object {
        const val CHANNEL_ID = "beatstar_media_playback"
        const val NOTIFICATION_ID = 4201

        const val ACTION_UPDATE_STATE = "com.beatstar.renacer.action.UPDATE_MEDIA_STATE"
        const val ACTION_PLAY = "com.beatstar.renacer.action.MEDIA_PLAY"
        const val ACTION_PAUSE = "com.beatstar.renacer.action.MEDIA_PAUSE"
        const val ACTION_TOGGLE = "com.beatstar.renacer.action.MEDIA_TOGGLE"
        const val ACTION_NEXT = "com.beatstar.renacer.action.MEDIA_NEXT"
        const val ACTION_PREV = "com.beatstar.renacer.action.MEDIA_PREV"
        const val ACTION_STOP = "com.beatstar.renacer.action.MEDIA_STOP"

        const val EXTRA_PLAYING = "playing"
        const val EXTRA_TITLE = "title"
        const val EXTRA_ARTIST = "artist"
        const val EXTRA_ALBUM = "album"
        const val EXTRA_DURATION_MS = "durationMs"
        const val EXTRA_POSITION_MS = "positionMs"

        @Volatile var onMediaAction: ((String) -> Unit)? = null
        @Volatile var isForegroundRunning: Boolean = false
        @Volatile var isCurrentlyPlaying: Boolean = false
    }

    private var mediaSession: MediaSession? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null
    private var noisyReceiverRegistered: Boolean = false

    private var curPlaying: Boolean = false
    private var curTitle: String = "Piano Community"
    private var curArtist: String = "Reproduciendo"
    private var curAlbum: String = "Piano Community"
    private var curDurationMs: Long = 0L
    private var curPositionMs: Long = 0L

    private val becomingNoisyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY && curPlaying) {
                dispatchAction("pause")
            }
        }
    }

    // Nota: NO solicitamos AudioManager.requestAudioFocus aquí porque el motor Chromium del WebView
    // ya gestiona automáticamente AUDIOFOCUS_GAIN para <audio>/WebAudio. Pedir un segundo AudioFocus
    // en este servicio provoca colisión de foco con el propio WebView y pausa la canción al instante.

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BeatstarRenacer::MediaPlaybackWakeLock")?.apply {
                setReferenceCounted(false)
            }
        } catch (e: Exception) {
            Log.w("MediaPlaybackSvc", "WakeLock init failed: ${e.message}")
        }

        try {
            val wm = applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                WifiManager.WIFI_MODE_FULL_LOW_LATENCY
            } else {
                @Suppress("DEPRECATION")
                WifiManager.WIFI_MODE_FULL_HIGH_PERF
            }
            wifiLock = wm?.createWifiLock(mode, "BeatstarRenacer::MediaWifiLock")?.apply {
                setReferenceCounted(false)
            }
        } catch (e: Exception) {
            Log.w("MediaPlaybackSvc", "WifiLock init failed: ${e.message}")
        }

        try {
            mediaSession = MediaSession(this, "BeatstarRenacerMediaSession").apply {
                setCallback(object : MediaSession.Callback() {
                    override fun onPlay() { dispatchAction("play") }
                    override fun onPause() { dispatchAction("pause") }
                    override fun onSkipToNext() { dispatchAction("next") }
                    override fun onSkipToPrevious() { dispatchAction("prev") }
                    override fun onStop() {
                        dispatchAction("stop")
                        stopPlaybackAndService()
                    }
                    override fun onSeekTo(pos: Long) {
                        dispatchAction("seek:$pos")
                    }
                })
                isActive = true
            }
        } catch (e: Exception) {
            Log.w("MediaPlaybackSvc", "MediaSession init failed: ${e.message}")
        }

        try {
            val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(becomingNoisyReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(becomingNoisyReceiver, filter)
            }
            noisyReceiverRegistered = true
        } catch (_: Exception) {}
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_UPDATE_STATE
        when (action) {
            ACTION_PLAY -> {
                dispatchAction("play")
                curPlaying = true
                isCurrentlyPlaying = true
                acquirePlaybackLocks()
                updateMediaSession()
                promoteOrUpdateNotification(asForeground = true)
            }
            ACTION_PAUSE -> {
                dispatchAction("pause")
                curPlaying = false
                isCurrentlyPlaying = false
                releasePlaybackLocks()
                updateMediaSession()
                demoteNotificationPaused()
            }
            ACTION_TOGGLE -> {
                dispatchAction("toggle")
            }
            ACTION_NEXT -> {
                dispatchAction("next")
            }
            ACTION_PREV -> {
                dispatchAction("prev")
            }
            ACTION_STOP -> {
                dispatchAction("stop")
                stopPlaybackAndService()
                return START_NOT_STICKY
            }
            ACTION_UPDATE_STATE -> {
                val playing = intent?.getBooleanExtra(EXTRA_PLAYING, curPlaying) ?: curPlaying
                val title = intent?.getStringExtra(EXTRA_TITLE)?.takeIf { it.isNotBlank() } ?: curTitle
                val artist = intent?.getStringExtra(EXTRA_ARTIST)?.takeIf { it.isNotBlank() } ?: curArtist
                val album = intent?.getStringExtra(EXTRA_ALBUM)?.takeIf { it.isNotBlank() } ?: curAlbum
                val durationMs = intent?.getLongExtra(EXTRA_DURATION_MS, curDurationMs) ?: curDurationMs
                val positionMs = intent?.getLongExtra(EXTRA_POSITION_MS, curPositionMs) ?: curPositionMs

                curPlaying = playing
                isCurrentlyPlaying = playing
                curTitle = title
                curArtist = artist
                curAlbum = album
                curDurationMs = durationMs.coerceAtLeast(0L)
                curPositionMs = positionMs.coerceAtLeast(0L)

                updateMediaSession()

                if (playing) {
                    acquirePlaybackLocks()
                    promoteOrUpdateNotification(asForeground = true)
                } else {
                    releasePlaybackLocks()
                    if (isForegroundRunning) {
                        demoteNotificationPaused()
                    } else {
                        stopSelf()
                    }
                }
            }
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onTaskRemoved(rootIntent: Intent?) {
        dispatchAction("stop")
        stopPlaybackAndService()
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        isForegroundRunning = false
        isCurrentlyPlaying = false
        releasePlaybackLocks()
        if (noisyReceiverRegistered) {
            try { unregisterReceiver(becomingNoisyReceiver) } catch (_: Exception) {}
            noisyReceiverRegistered = false
        }
        try {
            mediaSession?.isActive = false
            mediaSession?.release()
        } catch (_: Exception) {}
        mediaSession = null
        super.onDestroy()
    }

    private fun dispatchAction(action: String) {
        try {
            onMediaAction?.invoke(action)
        } catch (_: Exception) {}
    }

    private fun acquirePlaybackLocks() {
        try {
            wakeLock?.let { wl ->
                if (!wl.isHeld) {
                    wl.acquire(4L * 60L * 60L * 1000L)
                }
            }
        } catch (_: Exception) {}
        try {
            wifiLock?.let { wfl ->
                if (!wfl.isHeld) {
                    wfl.acquire()
                }
            }
        } catch (_: Exception) {}
    }

    private fun releasePlaybackLocks() {
        try {
            wakeLock?.let { wl -> if (wl.isHeld) wl.release() }
        } catch (_: Exception) {}
        try {
            wifiLock?.let { wfl -> if (wfl.isHeld) wfl.release() }
        } catch (_: Exception) {}
    }

    private fun updateMediaSession() {
        val session = mediaSession ?: return
        try {
            val metaBuilder = MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, curTitle)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, curArtist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, curAlbum)
            if (curDurationMs > 0L) {
                metaBuilder.putLong(MediaMetadata.METADATA_KEY_DURATION, curDurationMs)
            }
            session.setMetadata(metaBuilder.build())

            val actions = PlaybackState.ACTION_PLAY or
                PlaybackState.ACTION_PAUSE or
                PlaybackState.ACTION_PLAY_PAUSE or
                PlaybackState.ACTION_SKIP_TO_NEXT or
                PlaybackState.ACTION_SKIP_TO_PREVIOUS or
                PlaybackState.ACTION_STOP or
                PlaybackState.ACTION_SEEK_TO

            val stateCode = if (curPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
            val speed = if (curPlaying) 1.0f else 0.0f
            val state = PlaybackState.Builder()
                .setActions(actions)
                .setState(stateCode, curPositionMs, speed)
                .build()
            session.setPlaybackState(state)
            session.isActive = true
        } catch (_: Exception) {}
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Reproducción de música",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantiene la música sonando con la pantalla apagada y controles en pantalla de bloqueo"
                setShowBadge(false)
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            nm.createNotificationChannel(channel)
        }
    }

    private fun serviceActionPendingIntent(action: String, reqCode: Int): PendingIntent {
        val intent = Intent(this, MediaPlaybackService::class.java).setAction(action)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        return PendingIntent.getService(this, reqCode, intent, flags)
    }

    private fun buildNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPi = PendingIntent.getActivity(
            this,
            100,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val prevPi = serviceActionPendingIntent(ACTION_PREV, 101)
        val playPauseAction = if (curPlaying) ACTION_PAUSE else ACTION_PLAY
        val playPausePi = serviceActionPendingIntent(playPauseAction, 102)
        val nextPi = serviceActionPendingIntent(ACTION_NEXT, 103)
        val stopPi = serviceActionPendingIntent(ACTION_STOP, 104)

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        val largeIcon = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
                ?: BitmapFactory.decodeResource(resources, R.drawable.ic_launcher_fg)
        } catch (_: Exception) {
            null
        }

        val mediaStyle = Notification.MediaStyle()
            .setShowActionsInCompactView(0, 1, 2)
        mediaSession?.sessionToken?.let { token ->
            mediaStyle.setMediaSession(token)
        }

        @Suppress("DEPRECATION")
        builder
            .setSmallIcon(if (curPlaying) android.R.drawable.ic_media_play else android.R.drawable.ic_media_pause)
            .setContentTitle(curTitle)
            .setContentText(curArtist)
            .setSubText(curAlbum)
            .setContentIntent(contentPi)
            .setDeleteIntent(stopPi)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(curPlaying)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setStyle(mediaStyle)
            .addAction(android.R.drawable.ic_media_previous, "Anterior", prevPi)
            .addAction(
                if (curPlaying) android.R.drawable.ic_media_pause else android.R.drawable.ic_media_play,
                if (curPlaying) "Pausar" else "Reproducir",
                playPausePi
            )
            .addAction(android.R.drawable.ic_media_next, "Siguiente", nextPi)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Cerrar", stopPi)

        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon)
        }

        return builder.build()
    }

    private fun promoteOrUpdateNotification(asForeground: Boolean) {
        try {
            val notif = buildNotification()
            if (asForeground) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(
                        NOTIFICATION_ID,
                        notif,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notif)
                }
                isForegroundRunning = true
            } else {
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                nm?.notify(NOTIFICATION_ID, notif)
            }
        } catch (e: Exception) {
            Log.w("MediaPlaybackSvc", "startForeground/notify error: ${e.message}")
        }
    }

    private fun demoteNotificationPaused() {
        try {
            if (isForegroundRunning) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_DETACH)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(false)
                }
                isForegroundRunning = false
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.notify(NOTIFICATION_ID, buildNotification())
        } catch (_: Exception) {}
    }

    private fun stopPlaybackAndService() {
        curPlaying = false
        isCurrentlyPlaying = false
        releasePlaybackLocks()
        try {
            if (isForegroundRunning) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
                isForegroundRunning = false
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.cancel(NOTIFICATION_ID)
        } catch (_: Exception) {}
        stopSelf()
    }
}
