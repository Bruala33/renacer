
    // ===================================================
    // SISTEMA DE INTERNACIONALIZACIÓN (i18n: ES / EN)
    // ===================================================
    const TRANSLATIONS = {
      es: {
        app_title: 'Piano Community',
        tab_search: 'Explorar',
        tab_discover: 'Descubrir',
        tab_library: 'Mi Biblioteca',
        tab_editor: 'Editor',
        subtab_global: 'Catálogo',
        subtab_community: 'Comunidad',
        subtab_downloads: 'Descargas',
        subtab_favorites: 'Favoritos',
        subtab_playlists: 'Playlists',
        search_placeholder: 'Buscar canción o artista...',
        search_btn: 'Buscar',
        diff_label: 'Dificultad:',
        diff_all: 'Todas',
        diff_easy: 'Fácil',
        diff_medium: 'Media',
        diff_hard: 'Difícil',
        diff_extreme: 'Extrema',
        diff_insane: 'Insana',
        diff_filter_2: '2★ Fácil',
        diff_filter_3: '3★ Media',
        diff_filter_4: '4★ Normal',
        diff_filter_5: '5★ Difícil',
        diff_filter_6: '6★+ Pro',
        prioritize_diff: 'Priorizar Dificultad:',
        target_diff_all: 'Todas (Relevancia)',
        target_diff_closest: 'Más cercanas primero',
        ed_header_title: 'Creador de Pistas',
        ed_header_sub: '3 Carriles Táctiles',
        ed_playtest: 'Probar',
        ed_save: 'Guardar',
        ed_publish: 'Publicar',
        ed_song_title: 'Título...',
        ed_artist: 'Artista...',
        ed_file_label: 'Cargar Audio',
        ed_bpm_label: 'BPM:',
        ed_playback_speed: 'Velocidad:',
        ed_offset_label: 'Desfase:',
        ed_diff_label: 'Dificultad:',
        ed_diff_easy: '1.5★ Fácil',
        ed_diff_medium: '3.5★ Media',
        ed_diff_hard: '5.5★ Difícil',
        ed_diff_extreme: '7.5★ Extrema',
        ed_diff_insane: '9.5★ Insana',
        ed_start_label: 'Inicio:',
        ed_end_label: 'Fin:',
        ed_mark_here: 'Marcar Aquí',
        ed_clear_marker: 'Quitar',
        ed_mode_label: 'Modo:',
        ed_mode_auto: 'AUTO GESTOS',
        ed_snap_label: 'Rejilla Magnética (Snap):',
        ed_snap_1_1: '1/1 (Compás)',
        ed_snap_1_2: '1/2 (Blancas)',
        ed_snap_1_4: '1/4 (Negras - Estándar)',
        ed_snap_1_8: '1/8 (Corcheas)',
        ed_snap_1_16: '1/16 (Rápido)',
        ed_notes_count: 'Notas',
        ed_clear_all: 'Limpiar',
        ed_return: 'VOLVER AL EDITOR',
        pub_modal_title: 'Publicar en la Comunidad',
        pub_modal_sub: 'Comparte tu creación con todos los jugadores del mundo en la nube.',
        pub_modal_song_title: 'Título de la Canción:',
        pub_modal_artist: 'Artista Original:',
        pub_modal_creator: 'Tu Nombre de Creador (Charter):',
        pub_modal_diff: 'Dificultad de Juego:',
        pub_modal_cancel: 'Cancelar',
        pub_modal_confirm: 'Publicar Ahora',
        daily_challenge: 'Desafío Diario',
        daily_desc: 'Compite por la mejor puntuación de hoy en el ranking global',
        daily_btn: 'Jugar Desafío Diario',
        play: 'Jugar',
        play_again: 'Jugar de Nuevo',
        resume: 'REANUDAR',
        restart: 'REINICIAR',
        exit_menu: 'SALIR AL MENÚ',
        pause_title: 'JUEGO EN PAUSA',
        pause_offset: 'Ajustar Offset Audio:',
        results_title: '¡Pista Completada!',
        final_score: 'Puntuación Final',
        max_combo: 'Combo Máximo',
        rewards: 'Recompensas',
        new_record: '¡Nuevo Récord!',
        accuracy: 'Precisión',
        song_speed: 'Velocidad Música',
        speed_btn: 'Velocidad',
        reset: '1.0x',
        settings_title: 'Ajustes del Motor',
        settings_volume: 'Volumen del menú:',
        apk_download_btn: 'Descargar APK',
        apk_card_title: 'App Oficial Android (APK):',
        apk_card_desc: 'Instala la app oficial en tu móvil para jugar a pantalla completa, vibración háptica y con disponibilidad 100% offline.',
        apk_card_btn: 'DESCARGAR APK ANDROID',
        settings_lang: 'Idioma / Language:',
        settings_note_speed: 'Velocidad de Notas:',
        settings_density: 'Densidad / Dificultad:',
        settings_continue: 'Modo Continuar (No perder):',
        settings_calibration: 'Calibración de Latencia (Audio & Visual)',
        settings_import_yt: 'Importar Playlist de YouTube',
        settings_local_storage: 'Almacenamiento Local',
        settings_fx: 'Efectos de Tecla',
        settings_shop: 'Tienda de Fondos y Efectos',
        shop_tab_effects: 'Efectos de Tecla',
        shop_tab_background: 'Fondo Personalizado',
        settings_nickname: 'Tu Nickname:',
        settings_nickname_sub: 'Creador & Social',
        settings_nickname_placeholder: 'Elige tu nombre en el juego...',
        settings_judge_colors: 'Colores de Juicio',
        settings_pc_controls: 'Teclas de Carril (PC)',
        settings_pc_hint: 'En PC los swipes se tocan con la tecla normal del carril sin deslizar.',
        settings_clear_storage: 'Eliminar todas las canciones descargadas',
        settings_offline_mem: 'Memoria Offline',
        onboarding_welcome: '¡Bienvenido a Piano Community!',
        onboarding_choose_lang: 'Elige tu idioma / Choose your language:',
        onboarding_nick_desc: 'Elige tu Nickname para que la comunidad te reconozca y pueda seguir tus pistas creadas:',
        onboarding_placeholder: 'Tu Nickname (ej. Mozart99)...',
        onboarding_start: 'Guardar y Empezar',
        add_fav: 'Añadir a Favoritos',
        remove_fav: 'Quitar de Favoritos',
        add_playlist: 'Añadir a Playlist',
        rate_track: 'Calificar canción',
        rate_post_title: 'Califica esta pista comunitaria',
        rate_post_subtitle: 'Tu valoración ayuda a la comunidad a descubrir las mejores creaciones',
        rate_fun: 'Diversión / Mapeo:',
        rate_sync: 'Sincronización con la música:',
        rate_comment: 'Comentario opcional:',
        rate_comment_placeholder: 'Escribe tu opinión aquí...',
        send_rating: 'Enviar Valoración',
        upload_track: 'Publicar Pista',
        follow: '+ Seguir',
        following: '✓ Siguiendo',
        speed_slow: '0.8x (Lento / Relajado)',
        speed_normal: '1.0x (Auto por Dificultad - Recomendado)',
        speed_fast: '1.2x (Rápido / Espaciado)',
        speed_very_fast: '1.4x (Muy Rápido)',
        speed_pro: '1.8x (Extremo / Pro)',
        density_easy: 'Fácil (1 nota por golpe, relajado)',
        density_medium: 'Media (Ritmo natural, 1-2 dedos)',
        density_hard: 'Difícil (Desafío completo, 2 dedos)',
        density_insane: 'Insana (Frenético, máxima densidad)',
        toast_saved: 'Ajustes guardados',
        toast_speed_updated: 'Velocidad de notas: ',
        toast_song_speed_updated: 'Velocidad de música: ',
        toast_lang_updated: 'Idioma cambiado a Español',
        toast_welcome: '¡Bienvenido/a, ',
        comm_search_placeholder: 'Buscar en canciones de la comunidad o por charter...',
        comm_filter_rating: 'Mejor Valorados',
        comm_filter_following: 'Siguiendo',
        comm_filter_trending: 'Populares',
        comm_filter_newest: 'Nuevos',
        comm_empty_title: 'No se encontraron pistas con los filtros actuales.',
        comm_empty_desc: 'Prueba cambiando de filtro o sé el primero en subir una canción desde el Editor.',
        comm_searching: 'Buscando en la nube comunitaria...',
        comm_charter: 'Charter:',
        comm_sync: 'Sincro',
        comm_notes: 'notas',
        disc_title: 'Descubrir Música',
        disc_recommendations: 'Recomendaciones para ti',
        disc_trending: 'Pistas en Tendencia',
        disc_community_pop: 'Canciones más populares de la comunidad',
        disc_play_random: 'Reproducir Pista Aleatoria',
        lib_storage_title: 'Almacenamiento Local (Offline)',
        lib_storage_sub: 'Pistas guardadas en este dispositivo',
        lib_play_random: 'Reproducir Pista Aleatoria',
        lib_clear_all: 'Vaciar biblioteca',
        lib_empty_downloads: 'No tienes canciones descargadas aún. Explora el catálogo o la comunidad para jugar sin conexión.',
        lib_empty_favorites: 'No tienes canciones favoritas guardadas.',
        lib_empty_playlists: 'No tienes playlists creadas.',
        lib_new_playlist: '+ Nueva Playlist',
        lib_delete_tooltip: 'Eliminar de almacenamiento local',
        ed_title: 'Modo Editor de Pistas',
        ed_subtitle: 'Crea y comparte tus propios mapas rítmicos para la comunidad',
        ed_step1: '1. Cargar Canción / Audio',
        ed_file_label: 'Cargar Audio',
        ed_song_title: 'Título...',
        ed_artist: 'Artista...',
        ed_bpm: 'BPM:',
        ed_offset: 'Desfase:',
        ed_diff: 'Dificultad:',
        ed_playtest: 'Probar',
        ed_save: 'Guardar',
        ed_publish: 'Publicar',
        fail_title: '¡PISTA FALLADA!',
        fail_subtitle: '¿Quieres continuar con el modo arcade?',
        fail_revive: 'Continuar (Revivir)',
        fail_restart: 'Reiniciar Canción',
        fail_exit: 'Salir al Menú',
        pl_title: 'Añadir a Playlist',
        pl_subtitle: 'Selecciona una playlist o crea una nueva:',
        pl_new_ph: 'Crear nueva playlist...',
        pl_create_save: 'Crear y Guardar',
        pl_close: 'Cerrar',
        calib_title: 'Calibración de Latencia',
        calib_desc: 'Toca la pantalla cuando la línea blanca coincida con la línea rosa y el sonido.',
        calib_save: 'Guardar y Salir',
        shop_title: 'Efectos de Tecla',
        shop_desc: 'Personaliza los impactos de pulsación y luces sobre fondo negro. Mira la demo antes de comprar o equipar.',
        shop_equip: 'Equipar',
        shop_equipped: 'Equipado',
        shop_buy: 'Comprar',
        fullscreen_title: 'Pantalla completa',
        toast_track_deleted: 'Pista eliminada de la biblioteca.',
        toast_fav_added: 'Añadido a favoritos.',
        toast_fav_removed: 'Quitado de favoritos.',
        toast_follow_ok: '¡Ahora sigues a este creador!',
        toast_unfollow_ok: 'Has dejado de seguir a este creador.',
        toast_rating_ok: 'Valoración enviada. ¡Gracias!',
        comm_filter_header: 'Filtro Comunidad:',
        diff_label_caps: 'DIFICULTAD:',
        unknown_artist: 'Desconocido',
        unknown_song: 'Canción Desconocida',
        lib_downloads_title: 'Canciones Descargadas',
        lib_downloads_sub: 'Listas para jugar sin conexión a internet',
        shuffle: 'Aleatorio',
        badge_community: 'Comunidad',
        badge_my_creation: 'Mi Creación',
        badge_catalog: 'Catálogo',
        lib_fav_title: 'Mis Canciones Favoritas',
        lib_fav_sub: 'Tus pistas marcadas con corazón',
        lib_empty_fav_title: 'No tienes favoritos aún',
        lib_empty_fav_sub: 'Pulsa el corazón en cualquier canción para tenerla a mano.',
        lib_pl_title: 'Playlists Guardadas',
        lib_pl_sub: 'Importadas de YouTube o creadas localmente',
        lib_pl_empty_title: 'No hay playlists guardadas aún',
        lib_pl_empty_sub: 'Importa una playlist de YouTube o crea una pulsando + en cualquier canción.',
        lib_pl_back: 'Volver a Playlists',
        lib_import_btn: '+ Importar',
        disc_daily_title: 'Desafíos Diarios',
        disc_daily_title_caps: 'DESAFÍOS DIARIOS',
        disc_x2_clefs: 'x2 Claves',
        disc_yt_title: 'Playlists Destacadas de YT Music',
        disc_yt_sub: 'Colecciones curadas de canciones listas para jugar',
        disc_paste_url: 'Pegar URL',
        disc_search_ph: 'Buscar playlists (ej. Rock, Phonk, Anime, Pop)...',
        disc_featured_playlists: 'Playlists Destacadas',
        disc_import_play: 'Importar y Jugar',
        disc_tracks: 'Temas',
        disc_no_featured_title: 'Sin canciones destacadas aún',
        disc_no_featured_sub: 'Juega y califica canciones al terminar la partida para que aparezcan aquí como las mejor valoradas.',
        disc_search_results: 'Resultados de Playlists',
        disc_close: 'Cerrar',
        import_btn: 'Importar',
        retry: 'Reintentar',
        explore_more: 'Explorar Más',
        rate_song: 'Calificar canción',
        delete_offline: 'Eliminar de almacenamiento local',
        cat_error_connect: 'No se pudo conectar con los servidores comunitarios',
        cat_empty_title: 'No se encontraron canciones para esta búsqueda',
        cat_empty_sub: 'Prueba con palabras clave en inglés, nombre de artista o títulos populares.',
        view_playlist: 'Ver',
        votes: 'votos',
        lib_downloads_empty_title: 'Sin descargas offline',
        lib_downloads_empty_sub: 'Juega canciones en el buscador para guardarlas aquí automáticamente.',
        diff_all_relevance: 'Todas (Relevancia)',
        leaderboard_global_title: 'Clasificación Global',
        leaderboard_song_title: 'Clasificación Online',
        leaderboard_tab_song: 'Esta Canción',
        leaderboard_tab_global: 'Global',
        shop_dimension_title: 'Dimensión Visual del Juego',
        shop_dimension_desc: 'Elige entre la perspectiva pseudo-3D gran piano y el clásico neón 2D plano.',
        shop_mode_3d: '3D Gran Piano',
        shop_mode_3d_tag: '★ RECOMENDADO',
        shop_mode_2d: '2D Neón Clásico',
        shop_mode_2d_tag: 'VERSIÓN ANTERIOR',
        shop_keystyle_title: 'Estilo de Teclas de Piano',
        shop_keystyle_desc: 'Forma y tamaño de las teclas en pista (aplica en 2D y 3D).',
        shop_keys_beatstar: 'Teclas Grandes',
        shop_keys_beatstar_tag: 'ANCHO COMPLETO',
        shop_keys_compact: 'Teclas Compactas',
        shop_keys_compact_tag: 'ORIGINALES',
        shop_effects_header: 'Efectos de Impacto y Luces',
        shop_exclusive_3d: 'EXCLUSIVO 3D',
        toast_3d_mode: 'Modo 3D Gran Piano activado.',
        toast_2d_mode: 'Modo 2D Neón Clásico activado.',
        toast_keys_large: 'Teclas grandes tradicionales activadas.',
        toast_keys_compact: 'Teclas compactas activadas.',
        effect_royal_brass_name: 'Latón Real y Destello Áureo',
        effect_royal_brass_desc: 'Chispas incandescentes de latón pulido y una majestuosa onda expansiva dorada.',
        effect_acoustic_resonance_name: 'Resonancia Acústica Armónica',
        effect_acoustic_resonance_desc: 'Doble halo acústico de ondas armónicas que resuenan como cuerdas de piano.',
        effect_crimson_royale_name: 'Fieltro Carmesí Real',
        effect_crimson_royale_desc: 'Brasas de fieltro rojo carmesí y oro ascendentes inspiradas en apagadores de concierto.',
        effect_luminous_ivory_name: 'Marfil Luminoso y Cénit',
        effect_luminous_ivory_desc: 'Destello de marfil puro pulido con estallido radial celestial al pulsar.'
      },
      en: {
        app_title: 'Piano Community',
        tab_search: 'Explore',
        tab_discover: 'Discover',
        tab_library: 'My Library',
        tab_editor: 'Editor',
        subtab_global: 'Catalog',
        subtab_community: 'Community',
        subtab_downloads: 'Downloads',
        subtab_favorites: 'Favorites',
        subtab_playlists: 'Playlists',
        search_placeholder: 'Search song or artist...',
        search_btn: 'Search',
        diff_label: 'Difficulty:',
        diff_all: 'All',
        diff_easy: 'Easy',
        diff_medium: 'Medium',
        diff_hard: 'Hard',
        diff_extreme: 'Extreme',
        diff_insane: 'Insane',
        diff_filter_2: '2★ Easy',
        diff_filter_3: '3★ Medium',
        diff_filter_4: '4★ Normal',
        diff_filter_5: '5★ Hard',
        diff_filter_6: '6★+ Pro',
        prioritize_diff: 'Prioritize Difficulty:',
        target_diff_all: 'All (Relevance)',
        target_diff_closest: 'Closest First',
        ed_header_title: 'Track Creator',
        ed_header_sub: '3 Touch Lanes',
        ed_playtest: 'Playtest',
        ed_save: 'Save',
        ed_publish: 'Publish',
        ed_song_title: 'Title...',
        ed_artist: 'Artist...',
        ed_file_label: 'Load Audio',
        ed_bpm_label: 'BPM:',
        ed_playback_speed: 'Speed:',
        ed_offset_label: 'Offset:',
        ed_diff_label: 'Difficulty:',
        ed_diff_easy: '1.5★ Easy',
        ed_diff_medium: '3.5★ Medium',
        ed_diff_hard: '5.5★ Hard',
        ed_diff_extreme: '7.5★ Extreme',
        ed_diff_insane: '9.5★ Insane',
        ed_start_label: 'Start:',
        ed_end_label: 'End:',
        ed_mark_here: 'Mark Here',
        ed_clear_marker: 'Clear',
        ed_mode_label: 'Mode:',
        ed_mode_auto: 'AUTO GESTURES',
        ed_snap_label: 'Snap Grid:',
        ed_snap_1_1: '1/1 (Bar)',
        ed_snap_1_2: '1/2 (Half)',
        ed_snap_1_4: '1/4 (Quarter - Standard)',
        ed_snap_1_8: '1/8 (Eighth)',
        ed_snap_1_16: '1/16 (Fast)',
        ed_notes_count: 'Notes',
        ed_clear_all: 'Clear',
        ed_return: 'RETURN TO EDITOR',
        pub_modal_title: 'Publish to Community',
        pub_modal_sub: 'Share your creation with players worldwide in the cloud.',
        pub_modal_song_title: 'Song Title:',
        pub_modal_artist: 'Original Artist:',
        pub_modal_creator: 'Your Creator Name (Charter):',
        pub_modal_diff: 'Game Difficulty:',
        pub_modal_cancel: 'Cancel',
        pub_modal_confirm: 'Publish Now',
        daily_challenge: 'Daily Challenge',
        daily_desc: "Compete for today's best score on the global leaderboard",
        daily_btn: 'Play Daily Challenge',
        play: 'Play',
        play_again: 'Play Again',
        resume: 'RESUME',
        restart: 'RESTART',
        exit_menu: 'EXIT TO MENU',
        pause_title: 'GAME PAUSED',
        pause_offset: 'Adjust Audio Offset:',
        results_title: 'Track Completed!',
        final_score: 'Final Score',
        max_combo: 'Max Combo',
        rewards: 'Rewards',
        new_record: 'New Record!',
        accuracy: 'Accuracy',
        song_speed: 'Song Speed',
        speed_btn: 'Speed',
        reset: '1.0x',
        settings_title: 'Engine Settings',
        settings_volume: 'Menu Volume:',
        apk_download_btn: 'Download APK',
        apk_card_title: 'Official Android App (APK):',
        apk_card_desc: 'Install the official app on your mobile device for full-screen gameplay, haptic feedback, and 100% offline availability.',
        apk_card_btn: 'DOWNLOAD ANDROID APK',
        settings_lang: 'Language / Idioma:',
        settings_note_speed: 'Note Fall Speed:',
        settings_density: 'Map Density / Difficulty:',
        settings_continue: 'Continue Mode (Never Fail):',
        settings_calibration: 'Latency Calibration (Audio & Visual)',
        settings_import_yt: 'Import YouTube Playlist',
        settings_local_storage: 'Local Storage',
        settings_fx: 'Key Effects',
        settings_shop: 'Shop & Visual Effects',
        shop_tab_effects: 'Key Effects',
        shop_tab_background: 'Custom Background',
        settings_nickname: 'Your Nickname:',
        settings_nickname_sub: 'Creator & Social',
        settings_nickname_placeholder: 'Choose your in-game name...',
        settings_judge_colors: 'Judgement Colors',
        settings_pc_controls: 'Lane Keys (PC)',
        settings_pc_hint: 'On PC, swipe notes can be tapped with the lane key without swiping.',
        settings_clear_storage: 'Delete all downloaded songs',
        settings_offline_mem: 'Offline Memory',
        onboarding_welcome: 'Welcome to Piano Community!',
        onboarding_choose_lang: 'Choose your language / Elige tu idioma:',
        onboarding_nick_desc: 'Choose your Nickname so the community can recognize you and follow your tracks:',
        onboarding_placeholder: 'Your Nickname (e.g. Mozart99)...',
        onboarding_start: 'Save & Start',
        add_fav: 'Add to Favorites',
        remove_fav: 'Remove from Favorites',
        add_playlist: 'Add to Playlist',
        rate_track: 'Rate track',
        rate_post_title: 'Rate this community track',
        rate_post_subtitle: 'Your rating helps the community discover top creations',
        rate_fun: 'Fun / Mapping:',
        rate_sync: 'Music Synchronization:',
        rate_comment: 'Optional comment:',
        rate_comment_placeholder: 'Write your feedback here...',
        send_rating: 'Submit Rating',
        upload_track: 'Publish Track',
        follow: '+ Follow',
        following: '✓ Following',
        speed_slow: '0.8x (Slow / Relaxed)',
        speed_normal: '1.0x (Auto by Difficulty - Recommended)',
        speed_fast: '1.2x (Fast / Spaced)',
        speed_very_fast: '1.4x (Very Fast)',
        speed_pro: '1.8x (Extreme / Pro)',
        density_easy: 'Easy (1 note per beat, relaxed)',
        density_medium: 'Medium (Natural rhythm, 1-2 fingers)',
        density_hard: 'Hard (Full challenge, 2 fingers)',
        density_insane: 'Insane (Frenetic, max density)',
        toast_saved: 'Settings saved',
        toast_speed_updated: 'Note speed: ',
        toast_song_speed_updated: 'Song speed: ',
        toast_lang_updated: 'Language changed to English',
        toast_welcome: 'Welcome, ',
        comm_search_placeholder: 'Search community tracks or creator...',
        comm_filter_rating: 'Top Rated',
        comm_filter_following: 'Following',
        comm_filter_trending: 'Trending',
        comm_filter_newest: 'Newest',
        comm_empty_title: 'No tracks found with current filters.',
        comm_empty_desc: 'Try changing filters or be the first to upload a track from the Editor.',
        comm_searching: 'Searching in community cloud...',
        comm_charter: 'Charter:',
        comm_sync: 'Sync',
        comm_notes: 'notes',
        disc_title: 'Discover Music',
        disc_recommendations: 'Recommended for you',
        disc_trending: 'Trending Tracks',
        disc_community_pop: 'Most popular community tracks',
        disc_play_random: 'Play Random Track',
        lib_storage_title: 'Local Storage (Offline)',
        lib_storage_sub: 'Tracks saved on this device',
        lib_play_random: 'Play Random Track',
        lib_clear_all: 'Clear library',
        lib_empty_downloads: 'No downloaded songs yet. Explore the catalog or community to play offline.',
        lib_empty_favorites: 'No favorite songs saved yet.',
        lib_empty_playlists: 'No playlists created yet.',
        lib_new_playlist: '+ New Playlist',
        lib_delete_tooltip: 'Delete from local storage',
        ed_title: 'Track Editor Mode',
        ed_subtitle: 'Create and share your own rhythm maps with the community',
        ed_step1: '1. Load Song / Audio',
        ed_file_label: 'Load Audio',
        ed_song_title: 'Title...',
        ed_artist: 'Artist...',
        ed_bpm: 'BPM:',
        ed_offset: 'Offset:',
        ed_diff: 'Difficulty:',
        ed_playtest: 'Test',
        ed_save: 'Save',
        ed_publish: 'Publish',
        fail_title: 'TRACK FAILED!',
        fail_subtitle: 'Do you want to continue arcade mode?',
        fail_revive: 'Continue (Revive)',
        fail_restart: 'Restart Track',
        fail_exit: 'Exit to Menu',
        pl_title: 'Add to Playlist',
        pl_subtitle: 'Select a playlist or create a new one:',
        pl_new_ph: 'Create new playlist...',
        pl_create_save: 'Create & Save',
        pl_close: 'Close',
        calib_title: 'Latency Calibration',
        calib_desc: 'Tap the screen when the white line aligns with the pink line and sound.',
        calib_save: 'Save & Exit',
        shop_title: 'Key Effects',
        shop_desc: 'Customize tap impacts and lighting on black background. Watch demo before buying or equipping.',
        shop_equip: 'Equip',
        shop_equipped: 'Equipped',
        shop_buy: 'Buy',
        fullscreen_title: 'Fullscreen',
        toast_track_deleted: 'Track deleted from library.',
        toast_fav_added: 'Added to favorites.',
        toast_fav_removed: 'Removed from favorites.',
        toast_follow_ok: 'You are now following this creator!',
        toast_unfollow_ok: 'Unfollowed creator.',
        toast_rating_ok: 'Rating submitted. Thank you!',
        comm_filter_header: 'Community Filter:',
        diff_label_caps: 'DIFFICULTY:',
        unknown_artist: 'Unknown',
        unknown_song: 'Unknown Song',
        lib_downloads_title: 'Downloaded Songs',
        lib_downloads_sub: 'Ready to play offline without internet',
        shuffle: 'Shuffle',
        badge_community: 'Community',
        badge_my_creation: 'My Creation',
        badge_catalog: 'Catalog',
        lib_fav_title: 'My Favorite Songs',
        lib_fav_sub: 'Your tracks marked with a heart',
        lib_empty_fav_title: 'No favorites yet',
        lib_empty_fav_sub: 'Tap the heart on any track to keep it handy.',
        lib_pl_title: 'Saved Playlists',
        lib_pl_sub: 'Imported from YouTube or created locally',
        lib_pl_empty_title: 'No saved playlists yet',
        lib_pl_empty_sub: 'Import a playlist from YouTube or create one by tapping + on any track.',
        lib_pl_back: 'Back to Playlists',
        lib_import_btn: '+ Import',
        disc_daily_title: 'Daily Challenges',
        disc_daily_title_caps: 'DAILY CHALLENGES',
        disc_x2_clefs: 'x2 Keys',
        disc_yt_title: 'Featured YT Music Playlists',
        disc_yt_sub: 'Curated collections ready to play',
        disc_paste_url: 'Paste URL',
        disc_search_ph: 'Search playlists (e.g. Rock, Phonk, Anime, Pop)...',
        disc_featured_playlists: 'Featured Playlists',
        disc_import_play: 'Import & Play',
        disc_tracks: 'Tracks',
        disc_no_featured_title: 'No featured songs yet',
        disc_no_featured_sub: 'Play and rate tracks after a game to have top rated creations appear here.',
        disc_search_results: 'Playlist Results',
        disc_close: 'Close',
        import_btn: 'Import',
        retry: 'Restart',
        explore_more: 'Explore More',
        rate_song: 'Rate song',
        delete_offline: 'Remove from local storage',
        cat_error_connect: 'Could not connect to community servers',
        cat_empty_title: 'No songs found for this search',
        cat_empty_sub: 'Try searching by artist, title, or English keywords.',
        view_playlist: 'View',
        votes: 'votes',
        lib_downloads_empty_title: 'No offline downloads',
        lib_downloads_empty_sub: 'Play songs from the explore tab to save them here automatically.',
        diff_all_relevance: 'All (Relevance)',
        leaderboard_global_title: 'Global Leaderboard',
        leaderboard_song_title: 'Online Leaderboard',
        leaderboard_tab_song: 'This Song',
        leaderboard_tab_global: 'Global',
        shop_dimension_title: 'Game Visual Dimension',
        shop_dimension_desc: 'Choose between pseudo-3D Grand Piano perspective and classic flat 2D neon.',
        shop_mode_3d: '3D Grand Piano',
        shop_mode_3d_tag: '★ RECOMMENDED',
        shop_mode_2d: '2D Classic Neon',
        shop_mode_2d_tag: 'PREVIOUS VERSION',
        shop_keystyle_title: 'Piano Key Style',
        shop_keystyle_desc: 'Shape and size of lane keys on the track (applies to both 2D and 3D).',
        shop_keys_beatstar: 'Large Keys',
        shop_keys_beatstar_tag: 'FULL WIDTH',
        shop_keys_compact: 'Compact Keys',
        shop_keys_compact_tag: 'ORIGINALS',
        shop_effects_header: 'Hit & Lighting Effects',
        shop_exclusive_3d: '3D EXCLUSIVE',
        toast_3d_mode: '3D Grand Piano mode activated.',
        toast_2d_mode: '2D Classic Neon mode activated.',
        toast_keys_large: 'Traditional large keys activated.',
        toast_keys_compact: 'Compact keys activated.',
        effect_royal_brass_name: 'Royal Brass & Golden Flare',
        effect_royal_brass_desc: 'Incandescent sparks of polished brass and a majestic golden shockwave.',
        effect_acoustic_resonance_name: 'Harmonic Acoustic Resonance',
        effect_acoustic_resonance_desc: 'Dual acoustic halo of harmonic waves resonating like piano soundboard strings.',
        effect_crimson_royale_name: 'Crimson Royale Damper',
        effect_crimson_royale_desc: 'Rising embers of crimson damper felt and antique gold inspired by concert grands.',
        effect_luminous_ivory_name: 'Luminous Ivory Zenith',
        effect_luminous_ivory_desc: 'Polished pure ivory flash with a celestial radial burst at the tap zenith.'
      }
    };

    function getLanguage() {
      return localStorage.getItem('beatstar_lang') || 'es';
    }

    function t(key, fallback = '') {
      const lang = getLanguage();
      if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
        return TRANSLATIONS[lang][key];
      }
      if (TRANSLATIONS['es'] && TRANSLATIONS['es'][key]) {
        return TRANSLATIONS['es'][key];
      }
      return fallback || key;
    }

    function setLanguage(lang, showToast = true) {
      const selectedLang = (lang === 'en') ? 'en' : 'es';
      localStorage.setItem('beatstar_lang', selectedLang);
      document.documentElement.lang = selectedLang;

      // Actualizar todos los elementos con data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated) {
          el.innerText = translated;
        }
      });

      // Actualizar placeholders
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated) {
          el.placeholder = translated;
        }
      });

      // Actualizar titles
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated) {
          el.title = translated;
        }
      });

      // Actualizar opciones de velocidad en Ajustes
      const speedOpts = [
        { val: '0.8', key: 'speed_slow' },
        { val: '1.0', key: 'speed_normal' },
        { val: '1.2', key: 'speed_fast' },
        { val: '1.4', key: 'speed_very_fast' },
        { val: '1.8', key: 'speed_pro' }
      ];
      const speedSelect = document.getElementById('settingsNoteSpeedSelect');
      if (speedSelect) {
        Array.from(speedSelect.options).forEach(opt => {
          const found = speedOpts.find(s => s.val === opt.value);
          if (found) opt.text = t(found.key);
        });
      }

      // Actualizar opciones de densidad en Ajustes
      const densOpts = [
        { val: 'easy', key: 'diff_easy' },
        { val: 'medium', key: 'diff_medium' },
        { val: 'hard', key: 'diff_hard' }
      ];
      const densSelect = document.getElementById('settingsMapDensitySelect');
      if (densSelect) {
        Array.from(densSelect.options).forEach(opt => {
          const found = densOpts.find(d => d.val === opt.value);
          if (found) opt.text = t(found.key);
        });
      }

      updateLanguageButtonsUI(selectedLang);

      if (typeof setTargetDifficulty === 'function' && typeof currentTargetDifficulty !== 'undefined') {
        setTargetDifficulty(currentTargetDifficulty);
      }

      const edBadge = document.getElementById('edDiffBadge');
      if (edBadge && typeof ChartEditor !== 'undefined' && ChartEditor.difficultyPreset) {
        const pKey = 'ed_diff_' + (ChartEditor.difficultyPreset === 'Fácil' ? 'easy' : (ChartEditor.difficultyPreset === 'Media' ? 'medium' : (ChartEditor.difficultyPreset === 'Difícil' ? 'hard' : (ChartEditor.difficultyPreset === 'Extrema' ? 'extreme' : 'insane'))));
        edBadge.innerText = t(pKey, ChartEditor.difficultyPreset);
      }

      // Actualizar indicador de ordenación comunitaria
      const commDisplay = document.getElementById('commActiveFilterDisplay');
      if (commDisplay && typeof communitySort !== 'undefined') {
        const commLabels = {
          'rating': t('comm_filter_rating', 'Mejor Valorados'),
          'following': t('comm_filter_following', 'Siguiendo'),
          'trending': t('comm_filter_trending', 'Populares'),
          'newest': t('comm_filter_newest', 'Nuevos')
        };
        commDisplay.innerText = commLabels[communitySort] || communitySort;
      }

      // Re-renderizar vistas dinámicas para actualizar textos al instante
      if (typeof currentActiveTab !== 'undefined') {
        if (currentActiveTab === 'library' && typeof renderCurrentLibrarySubtab === 'function') {
          renderCurrentLibrarySubtab();
        } else if (currentActiveTab === 'discover' && typeof loadDailyFeaturedSongs === 'function') {
          loadDailyFeaturedSongs();
        } else if (currentActiveTab === 'search') {
          if (typeof currentExploreSubTab !== 'undefined' && currentExploreSubTab === 'community' && typeof loadCommunityCharts === 'function') {
            loadCommunityCharts();
          } else if (typeof renderSearchResults === 'function' && typeof searchResultsCache !== 'undefined' && searchResultsCache && searchResultsCache.length > 0) {
            renderSearchResults(searchResultsCache);
          }
        }
      }

      if (showToast) {
        showSuccessToast(t('toast_lang_updated'));
      }
    }

    function updateLanguageButtonsUI(lang) {
      const isEs = (lang === 'es');

      const onbEs = document.getElementById('onboardingLangEs');
      const onbEn = document.getElementById('onboardingLangEn');
      if (onbEs && onbEn) {
        onbEs.className = `flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 border ${isEs ? 'bg-pink-500/30 text-pink-300 border-pink-500/50' : 'text-gray-400 hover:text-white border-transparent'}`;
        onbEn.className = `flex-1 py-1.5 px-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 border ${!isEs ? 'bg-pink-500/30 text-pink-300 border-pink-500/50' : 'text-gray-400 hover:text-white border-transparent'}`;
      }

      const setEs = document.getElementById('settingsLangEs');
      const setEn = document.getElementById('settingsLangEn');
      if (setEs && setEn) {
        setEs.className = `py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${isEs ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' : 'bg-black/50 text-gray-400 border-white/10 hover:text-white'}`;
        setEn.className = `py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${!isEs ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' : 'bg-black/50 text-gray-400 border-white/10 hover:text-white'}`;
      }
    }

    // ===================================================
    // CONTROLADOR DE VELOCIDAD DE CANCIÓN (0.5x - 2.0x)
    // ===================================================
    function safeSongId(id) {
      return String(id || 'song').replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    function getSongSpeed(songId) {
      if (songId) {
        const raw = localStorage.getItem(`beatstar_song_speed_${songId}`);
        const val = parseFloat(raw);
        if (Number.isFinite(val) && val >= 0.5 && val <= 2.0) return val;
      }
      const active = parseFloat(localStorage.getItem('beatstar_active_song_speed'));
      if (Number.isFinite(active) && active >= 0.5 && active <= 2.0) return active;
      return 1.0;
    }

    function setSongSpeed(songId, speedVal) {
      if (!songId) return;
      const val = Math.max(0.5, Math.min(2.0, Math.round(parseFloat(speedVal) * 20) / 20));
      if (Math.abs(val - 1.0) < 0.001) {
        localStorage.removeItem(`beatstar_song_speed_${songId}`);
      } else {
        localStorage.setItem(`beatstar_song_speed_${songId}`, val.toFixed(2));
      }
      localStorage.setItem('beatstar_active_song_speed', val.toFixed(2));
      const sId = safeSongId(songId);
      document.querySelectorAll(`.song-speed-badge-${sId}`).forEach(el => {
        el.innerText = `${val.toFixed(2)}x`;
        el.className = `song-speed-badge-${sId} ${val !== 1.0 ? 'text-amber-300 font-black' : 'text-cyan-300'}`;
      });
      document.querySelectorAll(`.song-speed-display-${sId}`).forEach(el => {
        el.innerText = `${val.toFixed(2)}x`;
      });
      document.querySelectorAll(`.song-speed-slider-${sId}`).forEach(el => {
        el.value = val;
      });
      const floatVal = document.getElementById('floatingSpeedValue');
      if (floatVal) floatVal.innerText = `${val.toFixed(2)}x`;
      if (engine && engine.setSongPlaybackSpeed) {
        engine.setSongPlaybackSpeed(val);
      }
    }

    let activeSpeedModalSongId = null;

    function openSongSpeedModal(songId) {
      if (!songId) return;
      activeSpeedModalSongId = songId;
      const speed = getSongSpeed(songId);
      
      const modal = document.getElementById('songSpeedModal');
      const valDisp = document.getElementById('speedModalValue');
      const slider = document.getElementById('speedModalSlider');

      if (valDisp) valDisp.innerText = `${speed.toFixed(2)}x`;
      if (slider) slider.value = speed.toFixed(2);

      if (modal) modal.classList.add('open');
    }

    function closeSongSpeedModal() {
      const modal = document.getElementById('songSpeedModal');
      if (modal) modal.classList.remove('open');
      activeSpeedModalSongId = null;
    }

    function onSpeedModalSliderChange(val) {
      const num = parseFloat(val) || 1.0;
      const valDisp = document.getElementById('speedModalValue');
      if (valDisp) valDisp.innerText = `${num.toFixed(2)}x`;

      if (activeSpeedModalSongId) {
        setSongSpeed(activeSpeedModalSongId, num);
      }
    }

    function setSpeedModalValue(val) {
      const num = parseFloat(val) || 1.0;
      const valDisp = document.getElementById('speedModalValue');
      const slider = document.getElementById('speedModalSlider');
      if (valDisp) valDisp.innerText = `${num.toFixed(2)}x`;
      if (slider) slider.value = num.toFixed(2);

      if (activeSpeedModalSongId) {
        setSongSpeed(activeSpeedModalSongId, num);
      }
    }

    function resetSpeedModalValue() {
      setSpeedModalValue(1.0);
    }

    function toggleCardDiffDrawer(cardId) {
      const drawer = document.getElementById(`diffDrawer_${cardId}`);
      if (drawer) {
        drawer.classList.toggle('hidden');
      }
    }

    function toggleSongSpeedSlider(songId) {
      openSongSpeedModal(songId);
    }

    function resetSongSpeed(songId) {
      setSongSpeed(songId, 1.0);
    }

    function renderSongSpeedHtml(songId) {
      const currentSpeed = getSongSpeed(songId);
      const sId = safeSongId(songId);
      const isCustom = Math.abs(currentSpeed - 1.0) > 0.02;
      return {
        btn: `
          <button type="button" onclick="event.stopPropagation(); openSongSpeedModal('${songId}')" class="key-tempo-pill px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border ${isCustom ? 'border-amber-400 bg-amber-500/25 text-amber-300 font-black shadow-md shadow-amber-500/25' : 'border-white/15 text-gray-300'} text-[10px] font-mono flex items-center gap-1 cursor-pointer active:scale-95 transition select-none flex-shrink-0" title="${t('song_speed', 'Velocidad de reproducción (Ajuste detallado)')}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="text-amber-400 inline"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span class="song-speed-badge-${sId} ${isCustom ? 'text-amber-300 font-black' : 'text-gray-200'}">${currentSpeed.toFixed(2)}x</span>
          </button>
        `,
        sliderRow: ''
      };
    }
  