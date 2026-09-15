
    // ==========================================
    // LEADERBOARD & SERVER SETTINGS
    // ==========================================

    let currentInlineLeaderboardTab = 'song';
    let currentInlineLeaderboardChartId = null;

    async function switchInlineLeaderboard(tab) {
      currentInlineLeaderboardTab = tab;
      const songBtn = document.getElementById('inlineLbBtnSong');
      const globalBtn = document.getElementById('inlineLbBtnGlobal');
      const container = document.getElementById('inlineLeaderboardRows');
      if (!container) return;

      if (tab === 'song') {
        if (songBtn) songBtn.className = 'px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 cursor-pointer';
        if (globalBtn) globalBtn.className = 'px-2 py-0.5 rounded-md text-[9px] font-bold text-gray-400 hover:text-white cursor-pointer';
        loadInlineLeaderboard(currentInlineLeaderboardChartId);
      } else {
        if (songBtn) songBtn.className = 'px-2 py-0.5 rounded-md text-[9px] font-bold text-gray-400 hover:text-white cursor-pointer';
        if (globalBtn) globalBtn.className = 'px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 cursor-pointer';
        loadInlineGlobalLeaderboard();
      }
    }

    async function loadInlineLeaderboard(chartId) {
      currentInlineLeaderboardChartId = chartId;
      const container = document.getElementById('inlineLeaderboardRows');
      if (!container) return;

      container.innerHTML = `
        <div class="p-2.5 text-center text-gray-400 text-[10px]">
          <p>Cargando clasificación...</p>
        </div>
      `;

      let rows = [];
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl && chartId) {
          const res = await fetch(`${baseUrl}/api/v1/community/charts/${encodeURIComponent(chartId)}/leaderboard`);
          if (res.ok) {
            const data = await res.json();
            rows = data.leaderboard || [];
          }
        }
      } catch (err) {
        console.warn('Error cargando clasificación remota:', err);
      }

      // Si la lista de la nube no contiene el récord local del jugador o está vacía, incluirlo
      // Si el jugador tiene récord local para esta pista, agregarlo como candidato
      const highscores = JSON.parse(localStorage.getItem('beatstar_highscores') || '{}');
      const songRecord = chartId ? highscores[chartId] : null;
      if (songRecord && songRecord.score > 0) {
        const nickname = localStorage.getItem('beatstar_player_nickname') || 'Tú';
        rows.push({
          player_name: nickname + ' (Tu Récord)',
          score: songRecord.score || 0,
          max_combo: songRecord.maxCombo || 0,
          stars: songRecord.stars || 0,
          accuracy_pct: songRecord.accuracyPct || songRecord.scorePct || 0,
          medal_tier: songRecord.medalTier || songRecord.medal || null
        });
      }

      // 1 usuario solo puede aparecer una vez con su mejor resultado
      const uniquePlayers = new Map();
      for (const r of rows) {
        const cleanKey = (r.player_name || '').replace(/\s*\((Tu Récord|Tú)\)/i, '').trim().toLowerCase();
        const existing = uniquePlayers.get(cleanKey);
        if (!existing || (r.score || 0) > (existing.score || 0)) {
          uniquePlayers.set(cleanKey, r);
        }
      }
      rows = Array.from(uniquePlayers.values()).sort((a, b) => (b.score || 0) - (a.score || 0));

      renderInlineLeaderboardRows(rows, container);
    }

    async function loadInlineGlobalLeaderboard() {
      const container = document.getElementById('inlineLeaderboardRows');
      if (!container) return;

      container.innerHTML = `
        <div class="p-2.5 text-center text-gray-400 text-[10px]">
          <p>Cargando ranking global...</p>
        </div>
      `;

      let rows = [];
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl) {
          const res = await fetch(`${baseUrl}/api/v1/community/leaderboards/global`);
          if (res.ok) {
            const data = await res.json();
            rows = (data.global_leaderboard || []).map(r => ({
              player_name: r.player_name,
              score: r.total_score,
              max_combo: r.songs_played ? `${r.songs_played} canciones` : '',
              stars: 5
            }));
          }
        }
      } catch (err) {
        console.warn('Error cargando ranking global:', err);
      }

      if (rows.length === 0) {
        const nickname = localStorage.getItem('beatstar_player_nickname') || 'Tú';
        rows = [
          { player_name: nickname + ' (Tú)', score: 98500, max_combo: '12 pistas', stars: 5 },
          { player_name: 'PianoMaster', score: 284500, max_combo: '35 pistas', stars: 5 },
          { player_name: 'NeonCharter', score: 215300, max_combo: '26 pistas', stars: 5 }
        ].sort((a, b) => b.score - a.score);
      }

      renderInlineLeaderboardRows(rows, container);
    }

    function renderInlineLeaderboardRows(rows, container) {
      if (!rows || rows.length === 0) {
        container.innerHTML = `
          <div class="p-3 text-center text-gray-400 text-[10px] space-y-0.5">
            <p class="font-bold text-gray-300">Sin puntuaciones registradas</p>
            <p class="text-gray-500">¡Sé el primero en jugar y registrar tu récord!</p>
          </div>
        `;
        return;
      }

      const medalIcons = { 'platinum': '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" stroke-width="2" class="inline align-middle"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/></svg>', 'gold': '<svg width="11" height="11" viewBox="0 0 24 24" fill="#fcd34d" stroke="#fcd34d" stroke-width="1.5" class="inline align-middle"><circle cx="12" cy="12" r="7"/></svg>', 'silver': '<svg width="11" height="11" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#cbd5e1" stroke-width="1.5" class="inline align-middle"><circle cx="12" cy="12" r="7"/></svg>' };
      const rankColors = ['text-amber-400 font-black', 'text-gray-300 font-bold', 'text-amber-600 font-bold'];

      let html = '';
      rows.forEach((r, idx) => {
        const medalIcon = r.medal_tier ? (medalIcons[r.medal_tier] || '') : '';
        const rankClass = idx < 3 ? rankColors[idx] : 'text-gray-500 font-bold';

        html += `
          <div class="p-1.5 bg-black/60 border border-white/5 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-5 text-center ${rankClass}">#${idx + 1}</span>
              <div class="min-w-0 truncate">
                <span class="font-bold text-white truncate block text-[11px]">${escapeHtml(r.player_name)} ${medalIcon}</span>
                <span class="text-[9px] text-gray-400">${r.max_combo ? `Combo: ${r.max_combo}` : ''}${r.stars ? ` • ${r.stars}★` : ''}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="font-mono font-black text-cyan-300 text-xs">${(r.score || 0).toLocaleString()}</span>
              <span class="text-[8px] text-gray-400 block">${r.accuracy_pct ? Number(r.accuracy_pct).toFixed(1) + '%' : ''}</span>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    let currentLeaderboardSubTab = 'song';
    let currentLeaderboardChartId = null;

    async function syncPlayerAndScoresWithServer() {
      try {
        const baseUrl = getApiBaseUrl();
        if (!baseUrl) return;
        const playerName = localStorage.getItem('beatstar_player_nickname') || 'Jugador';

        // 1. Registrar permanentemente al jugador en el leaderboard global (incluso con 0 puntos)
        fetch(`${baseUrl}/api/v1/community/players/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_name: playerName })
        }).catch(() => {});

        // 2. Sincronizar puntuaciones locales
        const highscores = JSON.parse(localStorage.getItem('beatstar_highscores') || '{}');
        const scoreItems = [];
        for (const [chartId, data] of Object.entries(highscores)) {
          if (data && typeof data.score === 'number' && data.score > 0) {
            scoreItems.push({
              chart_id: chartId,
              score: data.score,
              max_combo: data.maxCombo || 0,
              stars: data.stars || 0,
              accuracy_pct: data.accuracyPct || 100.0,
              medal_tier: data.medalTier || null
            });
          }
        }
        if (scoreItems.length > 0) {
          fetch(`${baseUrl}/api/v1/community/sync_scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              player_name: playerName,
              scores: scoreItems
            })
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('Sync with server error:', e);
      }
    }

    async function openLeaderboardModal(chartId = null) {
      const modal = document.getElementById('leaderboardModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('open');
        modal.style.display = 'flex';
      }

      const tabsContainer = document.getElementById('lbSubTabsContainer');
      const titleText = document.getElementById('lbModalTitleText');

      if (!chartId) {
        // Abierto desde la cabecera: mostrar ÚNICAMENTE la clasificación global
        currentLeaderboardChartId = null;
        if (tabsContainer) tabsContainer.style.display = 'none';
        if (titleText) titleText.innerText = t('leaderboard_global_title', 'Clasificación Global');
        switchLeaderboardSubTab('global');
      } else {
        // Abierto para una canción específica al finalizar
        currentLeaderboardChartId = chartId;
        if (tabsContainer) tabsContainer.style.display = 'flex';
        if (titleText) titleText.innerText = t('leaderboard_song_title', 'Clasificación Online');
        switchLeaderboardSubTab('song');
      }
    }

    function closeLeaderboardModal() {
      const modal = document.getElementById('leaderboardModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('open');
        modal.style.display = 'none';
      }
    }

    async function switchLeaderboardSubTab(tab) {
      currentLeaderboardSubTab = tab;
      const songBtn = document.getElementById('lbSubTabSongBtn');
      const globalBtn = document.getElementById('lbSubTabGlobalBtn');
      const container = document.getElementById('leaderboardRowsContainer');
      if (!container) return;

      if (tab === 'song') {
        if (songBtn) songBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40 cursor-pointer font-serif';
        if (globalBtn) globalBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer font-serif';
        loadSongLeaderboard(currentLeaderboardChartId);
      } else {
        if (songBtn) songBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer font-serif';
        if (globalBtn) globalBtn.className = 'flex-1 py-1 rounded-lg text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40 cursor-pointer font-serif';
        loadGlobalLeaderboard();
      }
    }

    async function loadSongLeaderboard(chartId) {
      const container = document.getElementById('leaderboardRowsContainer');
      if (!container) return;

      container.innerHTML = `
        <div class="p-4 text-center text-gray-400 text-xs font-serif">
          <p>Cargando clasificaciones...</p>
        </div>
      `;

      let rows = [];
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl && chartId) {
          const res = await fetch(`${baseUrl}/api/v1/community/charts/${chartId}/leaderboard`);
          if (res.ok) {
            const data = await res.json();
            rows = data.leaderboard || [];
          }
        }
      } catch (err) {
        console.warn('Error cargando clasificación remota:', err);
      }

      // Si no hay datos en la nube, mostrar el récord local
      if (rows.length === 0) {
        const highscores = JSON.parse(localStorage.getItem('beatstar_highscores') || '{}');
        const songRecord = chartId ? highscores[chartId] : null;
        if (songRecord) {
          const nickname = localStorage.getItem('beatstar_player_nickname') || 'Tú';
          rows.push({
            player_name: nickname + ' (Récord Local)',
            score: songRecord.score || 0,
            max_combo: songRecord.maxCombo || 0,
            stars: songRecord.stars || 0,
            accuracy_pct: songRecord.scorePct || 100,
            medal_tier: songRecord.medal || null
          });
        }
      }

      renderLeaderboardRows(rows, container);
    }

    async function loadGlobalLeaderboard() {
      const container = document.getElementById('leaderboardRowsContainer');
      if (!container) return;

      container.innerHTML = `
        <div class="p-4 text-center text-gray-400 text-xs font-serif">
          <p>Cargando ranking global...</p>
        </div>
      `;

      // Sincronizar jugador y puntuaciones antes de consultar
      await syncPlayerAndScoresWithServer();

      let rows = [];
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl) {
          const res = await fetch(`${baseUrl}/api/v1/community/leaderboards/global`);
          if (res.ok) {
            const data = await res.json();
            rows = (data.global_leaderboard || []).map(r => ({
              player_name: r.player_name,
              score: r.total_score || 0,
              max_combo: r.songs_played ? `${r.songs_played} pistas` : '0 pistas',
              stars: 5
            }));
          }
        }
      } catch (err) {
        console.warn('Error cargando ranking global:', err);
      }

      if (rows.length === 0) {
        const nickname = localStorage.getItem('beatstar_player_nickname') || 'Tú';
        const highscores = JSON.parse(localStorage.getItem('beatstar_highscores') || '{}');
        let totalLocal = 0;
        let countLocal = 0;
        for (const k in highscores) {
          if (highscores[k] && highscores[k].score) {
            totalLocal += highscores[k].score;
            countLocal++;
          }
        }
        rows = [
          { player_name: nickname, score: totalLocal, max_combo: `${countLocal} pistas`, stars: 5 }
        ];
      }

      renderLeaderboardRows(rows, container);
    }

    function renderLeaderboardRows(rows, container) {
      if (!rows || rows.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-gray-400 text-xs space-y-1">
            <p class="font-bold text-gray-300">Sin puntuaciones registradas</p>
            <p class="text-[10px] text-gray-500">¡Sé el primero en jugar y registrar tu récord!</p>
          </div>
        `;
        return;
      }

      let html = '';
      rows.forEach((r, idx) => {
        const medalIcons = { 'platinum': '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" stroke-width="2" class="inline align-middle"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/></svg>', 'gold': '<svg width="11" height="11" viewBox="0 0 24 24" fill="#fcd34d" stroke="#fcd34d" stroke-width="1.5" class="inline align-middle"><circle cx="12" cy="12" r="7"/></svg>', 'silver': '<svg width="11" height="11" viewBox="0 0 24 24" fill="#cbd5e1" stroke="#cbd5e1" stroke-width="1.5" class="inline align-middle"><circle cx="12" cy="12" r="7"/></svg>' };
        const medalIcon = r.medal_tier ? (medalIcons[r.medal_tier] || '') : '';
        const rankColors = ['text-amber-400 font-black', 'text-gray-300 font-bold', 'text-amber-600 font-bold'];
        const rankClass = idx < 3 ? rankColors[idx] : 'text-gray-500 font-bold';

        html += `
          <div class="p-2 bg-black/50 border border-white/5 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-5 text-center ${rankClass}">#${idx + 1}</span>
              <div class="min-w-0 truncate">
                <span class="font-bold text-white truncate block">${escapeHtml(r.player_name)} ${medalIcon}</span>
                <span class="text-[9px] text-gray-400">Combo: ${r.max_combo || 0} • ${r.stars || 0}★</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <span class="font-mono font-black text-cyan-300">${(r.score || 0).toLocaleString()}</span>
              <span class="text-[8px] text-gray-400 block">${r.accuracy_pct ? Number(r.accuracy_pct).toFixed(1) + '%' : ''}</span>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    // ==========================================
    // MODAL DE CALIFICACIÓN MANUAL (BIBLIOTECA)
    // ==========================================

    let currentManualRatingSong = null;
    let manualModalStars = 5;

    function openRateSongModal(songId, songTitle = 'Canción', songArtist = 'Artista', diffName = 'Normal', stars = 3.5, isCommunity = false) {

      currentManualRatingSong = { id: songId, title: songTitle, artist: songArtist, difficulty_name: diffName, stars: stars, is_community: isCommunity };

      

      const userRatings = JSON.parse(localStorage.getItem('beatstar_user_ratings_map') || '{}');

      const existingVote = (userRatings[songId] !== undefined && userRatings[songId] !== null)

        ? Number(userRatings[songId])

        : (JSON.parse(localStorage.getItem('beatstar_song_ratings') || '{}')[songId]?.my_vote ?? null);

      const isEditing = (existingVote !== null && existingVote !== undefined && !isNaN(existingVote));



      manualModalStars = isEditing ? existingVote : 5;

      const modal = document.getElementById('rateSongModal');

      const titleEl = document.getElementById('rateModalSongTitle');

      const artistEl = document.getElementById('rateModalSongArtist');

      if (titleEl) titleEl.innerText = songTitle;

      if (artistEl) artistEl.innerText = songArtist;



      const submitBtn = modal?.querySelector('button[onclick="saveManualModalRating()"]');

      if (submitBtn) {

        submitBtn.innerText = isEditing ? 'Actualizar Valoración' : 'Guardar Calificación';

      }



      setManualModalRating(manualModalStars);

      if (modal) {

        modal.classList.remove('hidden');

        modal.classList.add('open');

        modal.style.display = 'flex';

      }

    }



    function closeRateSongModal() {

      const modal = document.getElementById('rateSongModal');

      if (modal) {

        modal.classList.add('hidden');

        modal.classList.remove('open');

        modal.style.display = 'none';

      }

    }



    function setManualModalRating(val) {

      manualModalStars = Math.max(1, Math.min(5, parseInt(val, 10) || 5));

      const lbl = document.getElementById('rateModalRatingVal');

      if (lbl) lbl.innerText = `${manualModalStars} / 5 Estrellas`;

      const starsEls = document.querySelectorAll('#rateModalStars span');

      starsEls.forEach((el, idx) => {

        if (idx < manualModalStars) {

          el.className = 'cursor-pointer transition hover:scale-125 active:scale-95 select-none text-amber-400 p-1';

        } else {

          el.className = 'cursor-pointer transition hover:scale-125 active:scale-95 select-none text-gray-600 p-1';

        }

      });

    }



    async function saveManualModalRating() {

      if (!currentManualRatingSong) return;

      const s = currentManualRatingSong;

      const songId = s.id;

      const userRatings = JSON.parse(localStorage.getItem('beatstar_user_ratings_map') || '{}');

      const oldRating = (userRatings[songId] !== undefined && userRatings[songId] !== null) ? Number(userRatings[songId]) : null;

      const isEditing = (oldRating !== null && !isNaN(oldRating));



      const userAnonId = localStorage.getItem('beatstar_player_id') || ('user_' + Math.floor(Math.random() * 1000000));

      localStorage.setItem('beatstar_player_id', userAnonId);



      try {

        const ratingsStore = JSON.parse(localStorage.getItem('beatstar_song_ratings') || '{}');

        const prev = ratingsStore[songId] || {

          id: songId,

          title: s.title,

          artist: s.artist,

          difficulty_name: s.difficulty_name,

          stars: s.stars,

          is_community: !!s.is_community,

          count: 0,

          totalStars: 0,

          totalSync: 0

        };



        if (isEditing) {

          prev.totalStars = Math.max(0, (prev.totalStars || 0) - oldRating + manualModalStars);

          if (!prev.count || prev.count < 1) prev.count = 1;

        } else {

          prev.count = (prev.count || 0) + 1;

          prev.totalStars = (prev.totalStars || 0) + manualModalStars;

        }



        prev.totalSync = (prev.totalSync || 0) + 100;

        prev.avgStars = parseFloat((prev.totalStars / prev.count).toFixed(1));

        prev.avgSync = Math.round(prev.totalSync / prev.count);

        prev.my_vote = manualModalStars;

        prev.lastRated = Date.now();

        prev.title = s.title;

        prev.artist = s.artist;

        prev.difficulty_name = s.difficulty_name;

        prev.stars = s.stars;

        prev.is_community = !!s.is_community;



        userRatings[songId] = manualModalStars;

        localStorage.setItem('beatstar_user_ratings_map', JSON.stringify(userRatings));



        // Si la pista comunitaria recibe 2 o más votos y su media es inferior a 2 estrellas,

        // se elimina de la lista y se notifica al creador

        let deletedLocally = false;

        if (prev.count >= 2 && prev.avgStars < 2.0 && prev.is_community) {

          deletedLocally = true;

          delete ratingsStore[songId];

          localStorage.setItem('beatstar_song_ratings', JSON.stringify(ratingsStore));

          if (typeof IndexedDBStorage !== 'undefined') {

            IndexedDBStorage.deleteChart(songId).catch(() => {});

          }



          const localNotifs = JSON.parse(localStorage.getItem('beatstar_creator_notifications') || '[]');

          localNotifs.push({

            chart_id: songId,

            chart_title: s.title,

            message: `Tu pista '${s.title}' ha sido retirada de la comunidad automáticamente al recibir una valoración media de ${prev.avgStars}★ tras ${prev.count} valoraciones (mínimo requerido: 2.0★).`,

            is_read: false,

            created_at: new Date().toISOString()

          });

          localStorage.setItem('beatstar_creator_notifications', JSON.stringify(localNotifs));

        } else {

          ratingsStore[songId] = prev;

          localStorage.setItem('beatstar_song_ratings', JSON.stringify(ratingsStore));

        }



        // Enviar a la nube si el servidor está en línea

        let deletedFromCloud = false;

        try {

          const baseUrl = getApiBaseUrl();

          if (baseUrl) {

            const res = await fetch(`${baseUrl}/api/v1/community/charts/${encodeURIComponent(songId)}/rate`, {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({

                rating: manualModalStars,

                sync_pct: 100,

                user_id: userAnonId,

                title: s.title,

                artist: s.artist,

                difficulty_name: s.difficulty_name,

                stars: s.stars

              })

            });

            if (res.ok) {

              const data = await res.json();

              if (data.deleted) {

                deletedFromCloud = true;

                if (typeof IndexedDBStorage !== 'undefined') {

                  IndexedDBStorage.deleteChart(songId).catch(() => {});

                }

              }

            }

          }

        } catch (e) {}



        if (deletedLocally || deletedFromCloud) {

          showErrorToast(`La pista '${s.title}' ha sido retirada por baja valoración (< 2★ tras 2+ votos).`);

          checkCreatorNotifications();

        } else {

          showSuccessToast(isEditing ? `¡Valoración de '${s.title}' actualizada!` : `¡Calificación de ${manualModalStars}★ guardada!`);

        }



        closeRateSongModal();

        loadDailyFeaturedSongs();

      } catch (err) {

        showErrorToast('Error al guardar calificación: ' + err.message);

      }

    }


    // ==========================================
    // NOTIFICACIONES PARA EL CREADOR (Bajas Puntuaciones)
    // ==========================================

    let pendingCreatorNotifications = [];

    async function checkCreatorNotifications() {
      const creatorName = localStorage.getItem('beatstar_creator_name') || localStorage.getItem('beatstar_player_nickname') || 'Tú';
      const creatorId = localStorage.getItem('beatstar_player_id') || '';

      pendingCreatorNotifications = [];

      // 1. Notificaciones locales
      try {
        const localNotifs = JSON.parse(localStorage.getItem('beatstar_creator_notifications') || '[]');
        if (Array.isArray(localNotifs)) {
          pendingCreatorNotifications.push(...localNotifs.filter(n => !n.is_read));
        }
      } catch (e) {}

      // 2. Notificaciones de la nube
      try {
        const baseUrl = getApiBaseUrl();
        if (baseUrl) {
          const res = await fetch(`${baseUrl}/api/v1/community/notifications?creator_name=${encodeURIComponent(creatorName)}&creator_id=${encodeURIComponent(creatorId)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.notifications)) {
              for (const n of data.notifications) {
                if (!pendingCreatorNotifications.some(p => p.id === n.id || (p.chart_id === n.chart_id && p.message === n.message))) {
                  pendingCreatorNotifications.push(n);
                }
              }
            }
          }
        }
      } catch (e) {}

      displayNextCreatorNotification();
    }

    function displayNextCreatorNotification() {
      if (pendingCreatorNotifications.length === 0) return;
      const notif = pendingCreatorNotifications[0];
      const modal = document.getElementById('creatorNotificationModal');
      const textEl = document.getElementById('creatorNotificationText');
      if (modal && textEl) {
        textEl.innerText = notif.message;
        modal.classList.remove('hidden');
        modal.classList.add('open');
        modal.style.display = 'flex';
      }
    }

    async function dismissCreatorNotification() {
      const modal = document.getElementById('creatorNotificationModal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('open');
        modal.style.display = 'none';
      }

      if (pendingCreatorNotifications.length > 0) {
        const dismissed = pendingCreatorNotifications.shift();

        // Marcar en servidor si tiene ID numérico
        if (dismissed.id && Number.isInteger(dismissed.id)) {
          try {
            const baseUrl = getApiBaseUrl();
            if (baseUrl) {
              fetch(`${baseUrl}/api/v1/community/notifications/${dismissed.id}/read`, { method: 'POST' }).catch(() => {});
            }
          } catch (e) {}
        }

        // Marcar en local storage
        try {
          const localNotifs = JSON.parse(localStorage.getItem('beatstar_creator_notifications') || '[]');
          const updated = localNotifs.map(n => (n.chart_id === dismissed.chart_id || n.id === dismissed.id) ? { ...n, is_read: true } : n);
          localStorage.setItem('beatstar_creator_notifications', JSON.stringify(updated));
        } catch (e) {}

        if (pendingCreatorNotifications.length > 0) {
          setTimeout(displayNextCreatorNotification, 350);
        }
      }
    }

    // Comprobar notificaciones al iniciar la app
    setTimeout(checkCreatorNotifications, 1500);

    // Detección y exclusión del botón de APK en caso de ejecutarse dentro del APK nativo
    function checkAndHideApkDownloadButton() {
      const isApk = (typeof window.AndroidNative !== 'undefined') ||
                    (window.location.hostname === 'appassets.androidplatform.net') ||
                    (window.location.protocol === 'file:' && /Android/i.test(navigator.userAgent)) ||
                    (typeof window.AndroidNative?.isAndroidNative === 'function' && window.AndroidNative.isAndroidNative());
      if (isApk) {
        document.querySelectorAll('.apk-only-web, #btnDownloadApk, #settingsDownloadApkCard').forEach(el => {
          el.remove();
        });
        document.documentElement.classList.add('is-android-apk');
      }
    }

    checkAndHideApkDownloadButton();
    window.addEventListener('DOMContentLoaded', checkAndHideApkDownloadButton);

