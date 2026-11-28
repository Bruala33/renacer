/**
 * OIDO ARCADE — Bespoke Analog Studio & Real-Audio DSP Musical Ear Challenge
 * 20 real-time Web Audio DSP trials:
 *   1. Clava el Tono (Blind Pitch Tuning)
 *   2. Cinta al Reves (Reversed Stereo Tape + Open-Reel Cassette Deck CRT)
 *   3. Solo Graves (24dB/oct Lowpass X-Ray)
 *   4. Pulso en Silencio (Sample-Accurate 4/4 Silent Beat Drop + ms Ruler)
 *   5. Radio 8-Bit (WaveShaper Bitcrusher + AM Bandpass)
 *   6. Ardilla / Gigante (Extreme Pitch Glide + RPM Tachometer)
 *   7. Micro-Flash 0.6s (Ultra-Short Chorus Burst + Extra Flash Clues)
 *   8. Voz Fantasma (Mid/Side Stereo Vocal Cancellation + Hall Reverb)
 *   9. Clava el BPM (Interactive 5-Tap Tempo Sensor)
 *  10. Radio 1940 (Vintage Telephone Bandpass + Tube + Synthesized Vinyl Crackle)
 *  11. Senal Cortada (Rhythmic Staccato Helicopter Gate Slicer)
 *  12. Cueva Infinita (Feedback Dub Delay Cavern Wash)
 *  13. Caza el Fallo (Live Pitch-Sabotage Reflex Catcher + ms Radar)
 *  14. Doble Vinilo (Live 2-Song DJ Mashup Crossfader + Channel Isolator)
 *  15. Submarino (Sweeping Resonant LFO Underwater Sonar Wah)
 *  16. Vinilo Rayado (Scratched-Groove Beat Looper + Needle Skip Tonearm)
 *  17. Dial FM 88-108 (Interactive Analog FM Radio Static & Heterodyne Tuner)
 *  18. Chiptune 8-Bit (Real-Time Autocorrelation Melody Extractor + NES Synth)
 *  19. Rueda Loca (Oscillating Rollercoaster Tape Motor + Magnetic Brake)
 *  20. Consola EQ (Interactive 3-Band Live Studio Mastering Isolator)
 *
 * Full YouTube + 1,000+ Song Catalog integration with Decade & Style Filters,
 * Arrival-Order Parallel Preloader, Broadcast Constant-Loudness AGC,
 * 3 Difficulty presets, 3 Formats (Examen 8 / Supervivencia / Blitz),
 * strict zero-scroll 100dvh mobile layout, and 1080x1350 studio PNG share card.
 */
(function () {
  'use strict';

  const STORAGE_BEST_KEY = 'piano_community_ear_arcade_best_v2';
  const STORAGE_PREFS_KEY = 'piano_community_ear_arcade_prefs_v3';
  const STORAGE_RECENT_KEY = 'piano_community_ear_arcade_recent_tracks_v1';
  const STORAGE_TRIAL_RECORDS_KEY = 'piano_community_ear_arcade_trials_v1';
  const STORAGE_DAILY_STATE_KEY = 'piano_community_ear_arcade_daily_v1';
  const STORAGE_PLAYER_ID_KEY = 'piano_community_ear_arcade_pid_v1';
  const MAX_RECENT_HISTORY = 180;

  const DAILY_TZ = 'Europe/Madrid';
  const DAILY_PAYTABLE = [
    { minRank: 1,  maxRank: 1,    clefs: 350, tier: 'CORONA DE ORO',       short: '#1' },
    { minRank: 2,  maxRank: 2,    clefs: 240, tier: 'PLATA IMPERIAL',      short: '#2' },
    { minRank: 3,  maxRank: 3,    clefs: 175, tier: 'BRONCE VEGAS',        short: '#3' },
    { minRank: 4,  maxRank: 5,    clefs: 120, tier: 'MESA VIP TOP 5',      short: '#4-5' },
    { minRank: 6,  maxRank: 10,   clefs: 80,  tier: 'SALA DE HONOR',       short: '#6-10' },
    { minRank: 11, maxRank: 9999, clefs: 45,  tier: 'FICHA PARTICIPACIÓN', short: '#11+' }
  ];

  const DAILY_THEMES = [
    { id: 'vegas_mix',   title: 'Ruleta Abierta Las Vegas', subtitle: 'Mezcla total de épocas y estilos',         era: 'all',    genre: 'all' },
    { id: 'nineties',    title: 'Noche de los 90',          subtitle: 'Himnos auténticos de 1990 a 1999',         era: '90s',    genre: 'all' },
    { id: 'rock_hall',   title: 'Salón del Rock',           subtitle: 'Guitarras y clásicos eternos',             era: 'all',    genre: 'rock' },
    { id: 'eighties',    title: 'Neón de los 80',           subtitle: 'Sintetizadores y joyas de 1980 a 1989',    era: '80s',    genre: 'all' },
    { id: 'latin_gold',  title: 'Gala en Español',          subtitle: 'Grandes éxitos hispanos y latinos',        era: 'all',    genre: 'espanol' },
    { id: 'twothousands',title: 'Fiebre de los 2000',       subtitle: 'Éxitos inolvidables de 2000 a 2009',       era: '2000s',  genre: 'all' },
    { id: 'pop_royal',   title: 'Pop Inmortal',             subtitle: 'Estribillos que conoce todo el planeta',   era: 'all',    genre: 'pop' },
    { id: 'modern_vip',  title: 'Gran Premio 2010–2026',    subtitle: 'Éxitos modernos de la última era',         era: '2010s',  genre: 'all' },
    { id: 'urban_strip', title: 'Ritmo Urbano & Club',      subtitle: 'Groove, reguetón, rap y pista',            era: 'all',    genre: 'urbano' },
    { id: 'gold_70s',    title: 'Vinilo de Oro 70s–80s',    subtitle: 'Leyendas analógicas de los 70 y 80',       era: '70s',    genre: 'all' },
    { id: 'synth_club',  title: 'Electrónica & Neón',       subtitle: 'Dance, house y beats de madrugada',        era: 'all',    genre: 'electronic' },
    { id: 'grand_mix',   title: 'Gran Ruleta Mundial',      subtitle: '5 rondas sorpresa sin fronteras',          era: 'all',    genre: 'all' }
  ];

  const POPULAR_ARTISTS = [
    'Queen', 'Michael Jackson', 'Bad Bunny', 'Estopa', 'Rosalía', 'Coldplay',
    'Taylor Swift', 'Shakira', 'Nirvana', 'Daft Punk', 'The Weeknd', 'Dua Lipa',
    'Bruno Mars', 'Karol G', 'Melendi', 'Mecano', 'Oasis', 'Rihanna',
    'Adele', 'Ed Sheeran', 'C. Tangana', 'Vetusta Morla', 'El Canto del Loco', 'Linkin Park',
    'ABBA', 'Madonna', 'Arctic Monkeys', 'Billie Eilish', 'Soda Stereo', 'Héroes del Silencio'
  ];

  const DAILY_CHOICE_TRIAL_IDS = [
    'reverse', 'xray', 'retro', 'chipmunk', 'micro', 'ghost',
    'telephone', 'chopper', 'echo', 'underwater', 'stutter', 'speedrun', 'eqhunter'
  ];
  const DAILY_SKILL_TRIAL_IDS = ['pitch', 'silence', 'taptempo', 'tuner', 'year'];

  const DIFFICULTIES = {
    easy: {
      id: 'easy',
      label: 'Fácil',
      hint: '24s · Relajado · x0.85',
      roundSec: 24.0,
      pitchPass: 0.055,
      pitchPerfect: 0.022,
      silencePassMs: 265,
      silencePerfectMs: 90,
      bpmPass: 12,
      bpmPerfect: 5,
      impostorPassMs: 1450,
      impostorPerfectMs: 560,
      impostorCents: 225,
      tunerPassMhz: 1.05,
      tunerPerfectMhz: 0.35,
      yearPass: 4,
      yearPerfect: 1,
      lives: 5,
      blitzSec: 75,
      scoreMult: 0.85,
      tightDistractors: false
    },
    normal: {
      id: 'normal',
      label: 'Normal',
      hint: '19s · Equilibrado · x1.0',
      roundSec: 19.0,
      pitchPass: 0.036,
      pitchPerfect: 0.014,
      silencePassMs: 195,
      silencePerfectMs: 65,
      bpmPass: 8.5,
      bpmPerfect: 3.5,
      impostorPassMs: 1100,
      impostorPerfectMs: 420,
      impostorCents: 180,
      tunerPassMhz: 0.72,
      tunerPerfectMhz: 0.24,
      yearPass: 3,
      yearPerfect: 0,
      lives: 4,
      blitzSec: 70,
      scoreMult: 1.0,
      tightDistractors: false
    },
    hard: {
      id: 'hard',
      label: 'Extremo',
      hint: '14s · Precisión pro · x1.5',
      roundSec: 14.0,
      pitchPass: 0.022,
      pitchPerfect: 0.008,
      silencePassMs: 135,
      silencePerfectMs: 42,
      bpmPass: 5.5,
      bpmPerfect: 2.2,
      impostorPassMs: 800,
      impostorPerfectMs: 300,
      impostorCents: 135,
      tunerPassMhz: 0.45,
      tunerPerfectMhz: 0.15,
      yearPass: 2,
      yearPerfect: 0,
      lives: 3,
      blitzSec: 60,
      scoreMult: 1.5,
      tightDistractors: true
    }
  };

  const POPULARITY_MODES = {
    hits:     { id: 'hits',     label: 'Éxitos',   hint: 'Top global YouTube + catálogo completo' },
    obscure:  { id: 'obscure',  label: 'Ocultas',  hint: 'Indie, culto y joyas underground en YouTube' },
    youtube:  { id: 'youtube',  label: 'YouTube',  hint: 'Catálogo entero de YouTube en vivo' },
    playlist: { id: 'playlist', label: 'Playlist', hint: 'Elige una playlist específica abajo' }
  };

  const ERA_FILTERS = {
    all:     { id: 'all',     label: 'Todas',         fullLabel: 'Todas las décadas', short: '',      query: '',                     minYear: 0,    maxYear: 9999, itunesSeeds: [] },
    '70s':   { id: '70s',     label: 'Años 70',       fullLabel: 'Años 70',           short: '70s',   query: '1970s classics',       minYear: 1970, maxYear: 1979, itunesSeeds: ['ABBA', 'Queen', 'Bee Gees', 'Fleetwood Mac', 'Elton John', 'David Bowie', 'Stevie Wonder', 'Blondie', 'Eagles', 'Camilo Sesto', 'Nino Bravo', 'Earth Wind Fire', 'Pink Floyd', 'Led Zeppelin'] },
    '80s':   { id: '80s',     label: 'Años 80',       fullLabel: 'Años 80',           short: '80s',   query: '1980s hits',           minYear: 1980, maxYear: 1989, itunesSeeds: ['Michael Jackson', 'Madonna', 'a-ha', 'Prince', 'Mecano', 'Hombres G', 'Bon Jovi', 'Cyndi Lauper', 'Depeche Mode', 'The Cure', 'Tears for Fears', 'Whitney Houston', 'Dire Straits', 'The Police', 'Alaska y Dinarama', 'Soda Stereo'] },
    '90s':   { id: '90s',     label: 'Años 90',       fullLabel: 'Años 90',           short: '90s',   query: '1990s hits',           minYear: 1990, maxYear: 1999, itunesSeeds: ['Nirvana', 'Oasis', 'Spice Girls', 'Backstreet Boys', 'The Cranberries', 'Radiohead', 'Green Day', 'Red Hot Chili Peppers', 'Estopa', 'Alejandro Sanz', 'La Oreja de Van Gogh', 'Jarabe de Palo', 'Héroes del Silencio', 'Celtas Cortos', 'Maná', 'Daft Punk', 'Britney Spears', 'No Doubt', 'R.E.M.', 'TLC'] },
    '2000s': { id: '2000s',   label: 'Años 2000',     fullLabel: 'Años 2000',         short: '2000s', query: '2000s hits',           minYear: 2000, maxYear: 2009, itunesSeeds: ['Coldplay', 'Linkin Park', 'Eminem', 'Rihanna', 'Shakira', 'Lady Gaga', 'Amy Winehouse', 'The Killers', 'Arctic Monkeys', 'The White Stripes', 'El Canto del Loco', 'Melendi', 'Amaral', 'Fito y Fitipaldis', 'Daddy Yankee', 'Juanes', 'Evanescence', 'Beyoncé', 'Outkast', 'Gorillaz'] },
    '2010s': { id: '2010s',   label: 'Años 2010',     fullLabel: 'Años 2010',         short: '2010s', query: '2010s hits',           minYear: 2010, maxYear: 2019, itunesSeeds: ['Adele', 'Bruno Mars', 'Ed Sheeran', 'Taylor Swift', 'Avicii', 'Calvin Harris', 'Imagine Dragons', 'The Weeknd', 'Dua Lipa', 'Ariana Grande', 'Billie Eilish', 'ROSALÍA', 'J Balvin', 'Maluma', 'Post Malone', 'Sia', 'Twenty One Pilots', 'Tame Impala', 'Daft Punk'] },
    '2020s': { id: '2020s',   label: '2020 – Actual', fullLabel: '2020 – Actual',     short: '2020s', query: '2024 2025 2026 hits',  minYear: 2020, maxYear: 2026, itunesSeeds: ['Bad Bunny', 'KAROL G', 'Quevedo', 'Bizarrap', 'Feid', 'Rauw Alejandro', 'Aitana', 'C. Tangana', 'Olivia Rodrigo', 'Sabrina Carpenter', 'Harry Styles', 'Miley Cyrus', 'SZA', 'Dua Lipa', 'The Weeknd', 'Myke Towers', 'Lola Indigo'] }
  };

  const GENRE_FILTERS = {
    all:        { id: 'all',        label: 'Todos',        fullLabel: 'Todos los estilos',   short: '',           query: '',                          re: null },
    pop:        { id: 'pop',        label: 'Pop',          fullLabel: 'Pop',                 short: 'Pop',        query: 'pop hits',                  re: /\b(pop|dance pop|synthpop|indie pop|teen pop|britpop|weeknd|michael jackson|harry styles|miley|adele|dua lipa|taylor swift|bruno mars|coldplay|abba|a-ha|madonna|olivia rodrigo|ariana|rihanna|lady gaga|ed sheeran|spice girls|backstreet|britney|celine dion|whitney houston|cyndi lauper|sabrina carpenter)\b/i },
    rock:       { id: 'rock',       label: 'Rock',         fullLabel: 'Rock / Metal',        short: 'Rock',       query: 'rock metal classics',       re: /\b(rock|metal|punk|grunge|hard rock|classic rock|britpop|queen|nirvana|oasis|arctic monkeys|white stripes|linkin park|metallica|ac\/dc|guns n|bon jovi|red hot|foo fighters|green day|muse|radiohead|strokes|killers|extremoduro|fito|h[eé]roes del silencio|cranberries|blur|r\.e\.m\.|dire straits|police|led zeppelin|pink floyd|fleetwood|eagles|u2|evanescence|soda stereo|man[aá]|celtas cortos)\b/i },
    urban:      { id: 'urban',      label: 'Urbano',       fullLabel: 'Urbano / Reggaetón',  short: 'Urbano',     query: 'reggaeton urbano hip hop',  re: /\b(reggaeton|reggaet[oó]n|urbano|trap|hip[\s-]?hop|rap|r&b|bad bunny|daddy yankee|karol g|quevedo|feid|rauw|bizarrap|j balvin|ozuna|anuel|myke towers|maluma|mora|c\.?\s*tangana|eminem|drake|kendrick|travis scott|tupac|2pac|dr\.?\s*dre|snoop|coolio|fugees|tlc|notorious|outkast|50 cent|kanye|post malone|sza)\b/i },
    spanish:    { id: 'spanish',    label: 'Español',      fullLabel: 'Música Española',     short: 'Español',    query: 'música española éxitos',    re: /\b(spanish|español|espanol|españa|espana|flamenco|rumba|estopa|rosal[ií]a|c\.?\s*tangana|melendi|alejandro sanz|mecano|hombres g|la oreja|el canto del loco|aitana|quevedo|sen senra|alizzz|fito|amaral|vetusta morla|izal|extremoduro|sabina|lola indigo|jarabe de palo|celtas cortos|h[eé]roes del silencio|camilo sesto|nino bravo|alaska|dinarama|nacha pop|duncan dhu|loquillo|pereza|m-clan)\b/i },
    electronic: { id: 'electronic', label: 'Electrónica',  fullLabel: 'Electrónica / Dance', short: 'Electro',    query: 'electronic dance house',    re: /\b(electronic|electr[oó]nica|dance|house|techno|edm|disco|synth|eurodance|trance|daft punk|avicii|calvin harris|david guetta|ti[eë]sto|skrillex|fred again|disclosure|kaytranada|polo & pan|grimes|justice|chemical brothers|prodigy|martin garrix|corona|haddaway|eiffel 65|faithless|robert miles|snap!|bee gees|donna summer|depeche mode|new order|pet shop boys|kraftwerk|bizarrap)\b/i },
    indie:      { id: 'indie',      label: 'Indie',        fullLabel: 'Indie / Alternativo', short: 'Indie',      query: 'indie alternative rock',    re: /\b(indie|alternative|alternativo|dream pop|shoegaze|lofi|lo-fi|post-punk|tame impala|mac demarco|mitski|beach house|khruangbin|men i trust|parcels|foals|phoebe bridgers|cuco|washed out|jungle|arctic monkeys|strokes|gorillaz|vampire weekend|the cure|the smiths|pixies|radiohead|blur|pulp|verve|mgmt|foster the people|vetusta morla|los planetas|supersubmarina|love of lesbian)\b/i },
    ost:        { id: 'ost',        label: 'Cine / OST',   fullLabel: 'Cine / Anime OST',    short: 'OST',        query: 'movie anime soundtrack ost',re: /\b(ost|soundtrack|banda sonora|anime|cine|movie|disney|ghibli|hans zimmer|john williams|joe hisaishi|ludovico|yann tiersen|naruto|attack on titan|evangelion|pok[eé]mon|zelda|mario|interstellar|harry potter|lion king|aladdin|titanic|frozen|encanto|star wars|jurassic park|pulp fiction|top gun|ghostbusters|rocky|shrek|toy story|demon slayer|your name|spider-verse)\b/i },
    latin:      { id: 'latin',      label: 'Latino',       fullLabel: 'Latino / Salsa',      short: 'Latino',     query: 'latin salsa bachata pop',   re: /\b(latin|latino|salsa|bachata|cumbia|merengue|bolero|rock en espa[ñn]ol|shakira|juanes|man[aá]|soda stereo|calle 13|natalia lafourcade|bomba est[eé]reo|marc anthony|romeo santos|juan luis guerra|luis miguel|carlos vives|camilo|morat|ricky martin|chayanne|selena|gloria estefan|celia cruz|h[eé]ctor lavoe|aventura|bad bunny|karol g|daddy yankee)\b/i }
  };

  // Historically verified multi-decade music vault (100% accurate original releaseYear & styles!)
  const VERIFIED_ERA_VAULT = [
    // ---- AÑOS 70 (1970-1979) ----
    { id: 'ea_70_1',  title: 'Bohemian Rhapsody',        artist: 'Queen',                releaseYear: 1975, genre: 'Rock',       filterGenres: ['rock', 'pop'],       bpm: 72 },
    { id: 'ea_70_2',  title: 'Dancing Queen',            artist: 'ABBA',                 releaseYear: 1976, genre: 'Pop',        filterGenres: ['pop', 'electronic'], bpm: 101 },
    { id: 'ea_70_3',  title: 'Stayin Alive',             artist: 'Bee Gees',             releaseYear: 1977, genre: 'Disco',      filterGenres: ['pop', 'electronic', 'ost'], bpm: 104 },
    { id: 'ea_70_4',  title: 'Hotel California',         artist: 'Eagles',               releaseYear: 1976, genre: 'Rock',       filterGenres: ['rock'],              bpm: 75 },
    { id: 'ea_70_5',  title: 'Dreams',                   artist: 'Fleetwood Mac',        releaseYear: 1977, genre: 'Rock',       filterGenres: ['rock', 'pop'],       bpm: 120 },
    { id: 'ea_70_6',  title: 'September',                artist: 'Earth, Wind & Fire',   releaseYear: 1978, genre: 'Funk',       filterGenres: ['pop', 'electronic'], bpm: 126 },
    { id: 'ea_70_7',  title: 'Superstition',             artist: 'Stevie Wonder',        releaseYear: 1972, genre: 'Funk',       filterGenres: ['pop'],               bpm: 101 },
    { id: 'ea_70_8',  title: 'Rocket Man',               artist: 'Elton John',           releaseYear: 1972, genre: 'Pop',        filterGenres: ['pop', 'rock'],       bpm: 136 },
    { id: 'ea_70_9',  title: 'Starman',                  artist: 'David Bowie',          releaseYear: 1972, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 100 },
    { id: 'ea_70_10', title: 'Heart of Glass',           artist: 'Blondie',              releaseYear: 1978, genre: 'Pop',        filterGenres: ['pop', 'electronic', 'rock'], bpm: 115 },
    { id: 'ea_70_11', title: 'Stairway to Heaven',       artist: 'Led Zeppelin',         releaseYear: 1971, genre: 'Rock',       filterGenres: ['rock'],              bpm: 82 },
    { id: 'ea_70_12', title: 'Wish You Were Here',       artist: 'Pink Floyd',           releaseYear: 1975, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 64 },
    { id: 'ea_70_13', title: 'Highway to Hell',          artist: 'AC/DC',                releaseYear: 1979, genre: 'Rock',       filterGenres: ['rock'],              bpm: 116 },
    { id: 'ea_70_14', title: 'Dont Stop Me Now',         artist: 'Queen',                releaseYear: 1978, genre: 'Rock',       filterGenres: ['rock', 'pop'],       bpm: 156 },
    { id: 'ea_70_15', title: 'I Will Survive',           artist: 'Gloria Gaynor',        releaseYear: 1978, genre: 'Disco',      filterGenres: ['pop', 'electronic'], bpm: 117 },
    { id: 'ea_70_16', title: 'I Feel Love',              artist: 'Donna Summer',         releaseYear: 1977, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 126 },
    { id: 'ea_70_17', title: 'Vivir Así Es Morir de Amor', artist: 'Camilo Sesto',       releaseYear: 1978, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 124 },
    { id: 'ea_70_18', title: 'Un Beso y Una Flor',       artist: 'Nino Bravo',           releaseYear: 1972, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 112 },
    { id: 'ea_70_19', title: 'Mediterráneo',             artist: 'Joan Manuel Serrat',   releaseYear: 1971, genre: 'Spanish',    filterGenres: ['spanish', 'indie'],  bpm: 118 },
    { id: 'ea_70_20', title: 'El Periódico de Ayer',     artist: 'Héctor Lavoe',         releaseYear: 1976, genre: 'Latin',      filterGenres: ['latin'],             bpm: 96 },
    { id: 'ea_70_21', title: 'Pedro Navaja',             artist: 'Rubén Blades',         releaseYear: 1978, genre: 'Latin',      filterGenres: ['latin'],             bpm: 94 },
    { id: 'ea_70_22', title: 'Oye Como Va',              artist: 'Santana',              releaseYear: 1970, genre: 'Latin',      filterGenres: ['latin', 'rock'],     bpm: 127 },
    { id: 'ea_70_23', title: 'Star Wars Main Title',     artist: 'John Williams',        releaseYear: 1977, genre: 'OST',        filterGenres: ['ost'],               bpm: 108 },
    { id: 'ea_70_24', title: 'Gonna Fly Now (Rocky)',    artist: 'Bill Conti',           releaseYear: 1976, genre: 'OST',        filterGenres: ['ost'],               bpm: 100 },
    { id: 'ea_70_25', title: 'Youre the One That I Want',artist: 'John Travolta & Olivia Newton-John', releaseYear: 1978, genre: 'OST', filterGenres: ['ost', 'pop'], bpm: 107 },
    { id: 'ea_70_26', title: 'Sultans of Swing',         artist: 'Dire Straits',         releaseYear: 1978, genre: 'Rock',       filterGenres: ['rock'],              bpm: 148 },
    { id: 'ea_70_27', title: 'Mr. Blue Sky',             artist: 'Electric Light Orchestra', releaseYear: 1977, genre: 'Pop',    filterGenres: ['pop', 'rock'],       bpm: 178 },
    { id: 'ea_70_28', title: 'Rappers Delight',          artist: 'The Sugarhill Gang',   releaseYear: 1979, genre: 'Hip-Hop',    filterGenres: ['urban'],             bpm: 111 },

    // ---- AÑOS 80 (1980-1989) ----
    { id: 'ea_80_1',  title: 'Billie Jean',              artist: 'Michael Jackson',      releaseYear: 1982, genre: 'Pop',        filterGenres: ['pop'],               bpm: 117 },
    { id: 'ea_80_2',  title: 'Take On Me',               artist: 'a-ha',                 releaseYear: 1985, genre: 'Pop',        filterGenres: ['pop', 'electronic'], bpm: 169 },
    { id: 'ea_80_3',  title: 'Like a Prayer',            artist: 'Madonna',              releaseYear: 1989, genre: 'Pop',        filterGenres: ['pop'],               bpm: 111 },
    { id: 'ea_80_4',  title: 'Sweet Child O Mine',       artist: 'Guns N Roses',         releaseYear: 1987, genre: 'Rock',       filterGenres: ['rock'],              bpm: 125 },
    { id: 'ea_80_5',  title: 'Livin on a Prayer',        artist: 'Bon Jovi',             releaseYear: 1986, genre: 'Rock',       filterGenres: ['rock'],              bpm: 123 },
    { id: 'ea_80_6',  title: 'Purple Rain',              artist: 'Prince',               releaseYear: 1984, genre: 'Pop',        filterGenres: ['pop', 'rock'],       bpm: 113 },
    { id: 'ea_80_7',  title: 'Every Breath You Take',    artist: 'The Police',           releaseYear: 1983, genre: 'Rock',       filterGenres: ['rock', 'pop'],       bpm: 117 },
    { id: 'ea_80_8',  title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper',      releaseYear: 1983, genre: 'Pop',        filterGenres: ['pop'],               bpm: 120 },
    { id: 'ea_80_9',  title: 'Everybody Wants to Rule the World', artist: 'Tears for Fears', releaseYear: 1985, genre: 'Pop',    filterGenres: ['pop', 'electronic', 'indie'], bpm: 112 },
    { id: 'ea_80_10', title: 'Just Like Heaven',         artist: 'The Cure',             releaseYear: 1987, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 151 },
    { id: 'ea_80_11', title: 'Blue Monday',              artist: 'New Order',            releaseYear: 1983, genre: 'Electronic', filterGenres: ['electronic', 'indie'], bpm: 130 },
    { id: 'ea_80_12', title: 'Just Cant Get Enough',     artist: 'Depeche Mode',         releaseYear: 1981, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 127 },
    { id: 'ea_80_13', title: 'I Wanna Dance with Somebody', artist: 'Whitney Houston',   releaseYear: 1987, genre: 'Pop',        filterGenres: ['pop'],               bpm: 119 },
    { id: 'ea_80_14', title: 'Hijo de la Luna',          artist: 'Mecano',               releaseYear: 1986, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 108 },
    { id: 'ea_80_15', title: 'Devuélveme a Mi Chica',    artist: 'Hombres G',            releaseYear: 1985, genre: 'Spanish',    filterGenres: ['spanish', 'pop', 'rock'], bpm: 162 },
    { id: 'ea_80_16', title: 'A Quién Le Importa',       artist: 'Alaska y Dinarama',    releaseYear: 1986, genre: 'Spanish',    filterGenres: ['spanish', 'pop', 'electronic'], bpm: 128 },
    { id: 'ea_80_17', title: 'La Chica de Ayer',         artist: 'Nacha Pop',            releaseYear: 1980, genre: 'Spanish',    filterGenres: ['spanish', 'rock', 'indie'], bpm: 136 },
    { id: 'ea_80_18', title: 'En Algún Lugar',           artist: 'Duncan Dhu',           releaseYear: 1987, genre: 'Spanish',    filterGenres: ['spanish', 'rock'],   bpm: 124 },
    { id: 'ea_80_19', title: 'Cuando Pase el Temblor',   artist: 'Soda Stereo',          releaseYear: 1985, genre: 'Latin',      filterGenres: ['latin', 'rock'],     bpm: 122 },
    { id: 'ea_80_20', title: 'La Incondicional',         artist: 'Luis Miguel',          releaseYear: 1988, genre: 'Latin',      filterGenres: ['latin', 'pop'],      bpm: 116 },
    { id: 'ea_80_21', title: 'Conga',                    artist: 'Gloria Estefan',       releaseYear: 1985, genre: 'Latin',      filterGenres: ['latin', 'pop'],      bpm: 122 },
    { id: 'ea_80_22', title: 'Eye of the Tiger',         artist: 'Survivor',             releaseYear: 1982, genre: 'OST',        filterGenres: ['ost', 'rock'],       bpm: 109 },
    { id: 'ea_80_23', title: 'Ghostbusters',             artist: 'Ray Parker Jr.',       releaseYear: 1984, genre: 'OST',        filterGenres: ['ost', 'pop'],        bpm: 116 },
    { id: 'ea_80_24', title: 'Take My Breath Away',      artist: 'Berlin',               releaseYear: 1986, genre: 'OST',        filterGenres: ['ost', 'pop'],        bpm: 94 },
    { id: 'ea_80_25', title: 'There Is a Light That Never Goes Out', artist: 'The Smiths', releaseYear: 1986, genre: 'Indie',    filterGenres: ['indie', 'rock'],     bpm: 136 },
    { id: 'ea_80_26', title: 'Where Is My Mind?',        artist: 'Pixies',               releaseYear: 1988, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 81 },
    { id: 'ea_80_27', title: 'Walk This Way',            artist: 'Run-D.M.C.',           releaseYear: 1986, genre: 'Hip-Hop',    filterGenres: ['urban', 'rock'],     bpm: 106 },
    { id: 'ea_80_28', title: 'Dont Stop Believin',       artist: 'Journey',              releaseYear: 1981, genre: 'Rock',       filterGenres: ['rock', 'pop'],       bpm: 119 },

    // ---- AÑOS 90 (1990-1999) ----
    { id: 'ea_90_1',  title: 'Smells Like Teen Spirit',  artist: 'Nirvana',              releaseYear: 1991, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 117 },
    { id: 'ea_90_2',  title: 'Wonderwall',               artist: 'Oasis',                releaseYear: 1995, genre: 'Rock',       filterGenres: ['rock', 'indie', 'pop'], bpm: 87 },
    { id: 'ea_90_3',  title: 'Losing My Religion',       artist: 'R.E.M.',               releaseYear: 1991, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 126 },
    { id: 'ea_90_4',  title: 'Wannabe',                  artist: 'Spice Girls',          releaseYear: 1996, genre: 'Pop',        filterGenres: ['pop'],               bpm: 110 },
    { id: 'ea_90_5',  title: 'Baby One More Time',       artist: 'Britney Spears',       releaseYear: 1998, genre: 'Pop',        filterGenres: ['pop'],               bpm: 93 },
    { id: 'ea_90_6',  title: 'I Want It That Way',       artist: 'Backstreet Boys',      releaseYear: 1999, genre: 'Pop',        filterGenres: ['pop'],               bpm: 99 },
    { id: 'ea_90_7',  title: 'Zombie',                   artist: 'The Cranberries',      releaseYear: 1994, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 84 },
    { id: 'ea_90_8',  title: 'Creep',                    artist: 'Radiohead',            releaseYear: 1992, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 92 },
    { id: 'ea_90_9',  title: 'Basket Case',              artist: 'Green Day',            releaseYear: 1994, genre: 'Rock',       filterGenres: ['rock'],              bpm: 170 },
    { id: 'ea_90_10', title: 'Enter Sandman',            artist: 'Metallica',            releaseYear: 1991, genre: 'Rock',       filterGenres: ['rock'],              bpm: 123 },
    { id: 'ea_90_11', title: 'Under the Bridge',         artist: 'Red Hot Chili Peppers',releaseYear: 1991, genre: 'Rock',       filterGenres: ['rock'],              bpm: 84 },
    { id: 'ea_90_12', title: 'Song 2',                   artist: 'Blur',                 releaseYear: 1997, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 130 },
    { id: 'ea_90_13', title: 'Bitter Sweet Symphony',    artist: 'The Verve',            releaseYear: 1997, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 171 },
    { id: 'ea_90_14', title: 'Dont Speak',               artist: 'No Doubt',             releaseYear: 1995, genre: 'Pop',        filterGenres: ['pop', 'rock'],       bpm: 76 },
    { id: 'ea_90_15', title: 'Torn',                     artist: 'Natalie Imbruglia',    releaseYear: 1997, genre: 'Pop',        filterGenres: ['pop'],               bpm: 96 },
    { id: 'ea_90_16', title: 'Gangstas Paradise',        artist: 'Coolio',               releaseYear: 1995, genre: 'Hip-Hop',    filterGenres: ['urban', 'ost'],      bpm: 80 },
    { id: 'ea_90_17', title: 'No Scrubs',                artist: 'TLC',                  releaseYear: 1999, genre: 'R&B',        filterGenres: ['urban', 'pop'],      bpm: 93 },
    { id: 'ea_90_18', title: 'California Love',          artist: '2Pac',                 releaseYear: 1995, genre: 'Hip-Hop',    filterGenres: ['urban'],             bpm: 92 },
    { id: 'ea_90_19', title: 'Killing Me Softly',        artist: 'Fugees',               releaseYear: 1996, genre: 'Hip-Hop',    filterGenres: ['urban'],             bpm: 92 },
    { id: 'ea_90_20', title: 'Around the World',         artist: 'Daft Punk',            releaseYear: 1997, genre: 'Electronic', filterGenres: ['electronic'],        bpm: 121 },
    { id: 'ea_90_21', title: 'What Is Love',             artist: 'Haddaway',             releaseYear: 1993, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 124 },
    { id: 'ea_90_22', title: 'The Rhythm of the Night',  artist: 'Corona',               releaseYear: 1993, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 128 },
    { id: 'ea_90_23', title: 'Blue (Da Ba Dee)',         artist: 'Eiffel 65',            releaseYear: 1998, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 128 },
    { id: 'ea_90_24', title: 'Corazón Partío',           artist: 'Alejandro Sanz',       releaseYear: 1997, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 96 },
    { id: 'ea_90_25', title: 'La Raja de Tu Falda',      artist: 'Estopa',               releaseYear: 1999, genre: 'Spanish',    filterGenres: ['spanish', 'rock'],   bpm: 112 },
    { id: 'ea_90_26', title: 'La Flaca',                 artist: 'Jarabe de Palo',       releaseYear: 1996, genre: 'Spanish',    filterGenres: ['spanish', 'rock', 'latin'], bpm: 110 },
    { id: 'ea_90_27', title: 'Entre Dos Tierras',        artist: 'Héroes del Silencio',  releaseYear: 1990, genre: 'Spanish',    filterGenres: ['spanish', 'rock'],   bpm: 124 },
    { id: 'ea_90_28', title: '20 de Abril',              artist: 'Celtas Cortos',        releaseYear: 1991, genre: 'Spanish',    filterGenres: ['spanish', 'rock'],   bpm: 126 },
    { id: 'ea_90_29', title: 'Cuéntame al Oído',         artist: 'La Oreja de Van Gogh', releaseYear: 1998, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 116 },
    { id: 'ea_90_30', title: 'De Música Ligera',         artist: 'Soda Stereo',          releaseYear: 1990, genre: 'Latin',      filterGenres: ['latin', 'rock'],     bpm: 125 },
    { id: 'ea_90_31', title: 'Rayando el Sol',           artist: 'Maná',                 releaseYear: 1990, genre: 'Latin',      filterGenres: ['latin', 'rock'],     bpm: 108 },
    { id: 'ea_90_32', title: 'Livin la Vida Loca',       artist: 'Ricky Martin',         releaseYear: 1999, genre: 'Latin',      filterGenres: ['latin', 'pop'],      bpm: 178 },
    { id: 'ea_90_33', title: 'My Heart Will Go On',      artist: 'Céline Dion',          releaseYear: 1997, genre: 'OST',        filterGenres: ['ost', 'pop'],        bpm: 99 },
    { id: 'ea_90_34', title: 'Circle of Life',           artist: 'Elton John',           releaseYear: 1994, genre: 'OST',        filterGenres: ['ost'],               bpm: 100 },
    { id: 'ea_90_35', title: 'A Cruel Angels Thesis',    artist: 'Yoko Takahashi',       releaseYear: 1995, genre: 'OST',        filterGenres: ['ost'],               bpm: 128 },

    // ---- AÑOS 2000 (2000-2009) ----
    { id: 'ea_00_1',  title: 'Viva La Vida',             artist: 'Coldplay',             releaseYear: 2008, genre: 'Pop',        filterGenres: ['pop', 'rock'],       bpm: 138 },
    { id: 'ea_00_2',  title: 'In the End',               artist: 'Linkin Park',          releaseYear: 2000, genre: 'Rock',       filterGenres: ['rock'],              bpm: 105 },
    { id: 'ea_00_3',  title: 'Lose Yourself',            artist: 'Eminem',               releaseYear: 2002, genre: 'Hip-Hop',    filterGenres: ['urban', 'ost'],      bpm: 171 },
    { id: 'ea_00_4',  title: 'Seven Nation Army',        artist: 'The White Stripes',    releaseYear: 2003, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 124 },
    { id: 'ea_00_5',  title: 'Mr. Brightside',           artist: 'The Killers',          releaseYear: 2003, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 148 },
    { id: 'ea_00_6',  title: 'Umbrella',                 artist: 'Rihanna',              releaseYear: 2007, genre: 'Pop',        filterGenres: ['pop', 'urban'],      bpm: 87 },
    { id: 'ea_00_7',  title: 'Poker Face',               artist: 'Lady Gaga',            releaseYear: 2008, genre: 'Pop',        filterGenres: ['pop', 'electronic'], bpm: 119 },
    { id: 'ea_00_8',  title: 'Hips Dont Lie',            artist: 'Shakira',              releaseYear: 2006, genre: 'Latin',      filterGenres: ['latin', 'pop'],      bpm: 100 },
    { id: 'ea_00_9',  title: 'Back to Black',            artist: 'Amy Winehouse',        releaseYear: 2006, genre: 'Soul',       filterGenres: ['pop', 'indie'],      bpm: 123 },
    { id: 'ea_00_10', title: 'Crazy in Love',            artist: 'Beyoncé',              releaseYear: 2003, genre: 'Pop',        filterGenres: ['pop', 'urban'],      bpm: 99 },
    { id: 'ea_00_11', title: 'Hey Ya!',                  artist: 'Outkast',              releaseYear: 2003, genre: 'Hip-Hop',    filterGenres: ['urban', 'pop'],      bpm: 159 },
    { id: 'ea_00_12', title: 'Bring Me to Life',         artist: 'Evanescence',          releaseYear: 2003, genre: 'Rock',       filterGenres: ['rock'],              bpm: 95 },
    { id: 'ea_00_13', title: 'Feel Good Inc.',           artist: 'Gorillaz',             releaseYear: 2005, genre: 'Indie',      filterGenres: ['indie', 'urban', 'electronic'], bpm: 139 },
    { id: 'ea_00_14', title: 'Last Nite',                artist: 'The Strokes',          releaseYear: 2001, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 104 },
    { id: 'ea_00_15', title: 'Kids',                     artist: 'MGMT',                 releaseYear: 2007, genre: 'Indie',      filterGenres: ['indie', 'electronic'], bpm: 123 },
    { id: 'ea_00_16', title: 'One More Time',            artist: 'Daft Punk',            releaseYear: 2000, genre: 'Electronic', filterGenres: ['electronic'],        bpm: 123 },
    { id: 'ea_00_17', title: 'Zapatillas',               artist: 'El Canto del Loco',    releaseYear: 2005, genre: 'Spanish',    filterGenres: ['spanish', 'pop', 'rock'], bpm: 146 },
    { id: 'ea_00_18', title: 'Soldadito Marinero',       artist: 'Fito y Fitipaldis',    releaseYear: 2003, genre: 'Spanish',    filterGenres: ['spanish', 'rock'],   bpm: 112 },
    { id: 'ea_00_19', title: 'Sin Ti No Soy Nada',       artist: 'Amaral',               releaseYear: 2002, genre: 'Spanish',    filterGenres: ['spanish', 'pop', 'rock'], bpm: 118 },
    { id: 'ea_00_20', title: 'Caminando por la Vida',    artist: 'Melendi',              releaseYear: 2005, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 110 },
    { id: 'ea_00_21', title: 'Rosas',                    artist: 'La Oreja de Van Gogh', releaseYear: 2003, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 126 },
    { id: 'ea_00_22', title: 'Gasolina',                 artist: 'Daddy Yankee',         releaseYear: 2004, genre: 'Reggaeton',  filterGenres: ['urban', 'latin'],    bpm: 96 },
    { id: 'ea_00_23', title: 'La Camisa Negra',          artist: 'Juanes',               releaseYear: 2004, genre: 'Latin',      filterGenres: ['latin', 'pop'],      bpm: 97 },
    { id: 'ea_00_24', title: 'Obsesión',                 artist: 'Aventura',             releaseYear: 2002, genre: 'Latin',      filterGenres: ['latin'],             bpm: 130 },
    { id: 'ea_00_25', title: 'Hes a Pirate',             artist: 'Klaus Badelt & Hans Zimmer', releaseYear: 2003, genre: 'OST',  filterGenres: ['ost'],               bpm: 140 },
    { id: 'ea_00_26', title: 'Comptine dun autre été',   artist: 'Yann Tiersen',         releaseYear: 2001, genre: 'OST',        filterGenres: ['ost'],               bpm: 100 },
    { id: 'ea_00_27', title: 'One Summers Day',          artist: 'Joe Hisaishi',         releaseYear: 2001, genre: 'OST',        filterGenres: ['ost'],               bpm: 88 },
    { id: 'ea_00_28', title: 'Copenhague',               artist: 'Vetusta Morla',        releaseYear: 2008, genre: 'Spanish',    filterGenres: ['spanish', 'indie'],  bpm: 120 },

    // ---- AÑOS 2010 (2010-2019) ----
    { id: 'ea_10_1',  title: 'Rolling in the Deep',      artist: 'Adele',                releaseYear: 2010, genre: 'Pop',        filterGenres: ['pop'],               bpm: 105 },
    { id: 'ea_10_2',  title: 'Uptown Funk',              artist: 'Mark Ronson & Bruno Mars', releaseYear: 2014, genre: 'Pop',    filterGenres: ['pop'],               bpm: 115 },
    { id: 'ea_10_3',  title: 'Shape of You',             artist: 'Ed Sheeran',           releaseYear: 2017, genre: 'Pop',        filterGenres: ['pop'],               bpm: 96 },
    { id: 'ea_10_4',  title: 'Get Lucky',                artist: 'Daft Punk',            releaseYear: 2013, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 116 },
    { id: 'ea_10_5',  title: 'Wake Me Up',               artist: 'Avicii',               releaseYear: 2013, genre: 'Electronic', filterGenres: ['electronic', 'pop'], bpm: 124 },
    { id: 'ea_10_6',  title: 'Summer',                   artist: 'Calvin Harris',        releaseYear: 2014, genre: 'Electronic', filterGenres: ['electronic'],        bpm: 128 },
    { id: 'ea_10_7',  title: 'Do I Wanna Know?',         artist: 'Arctic Monkeys',       releaseYear: 2013, genre: 'Rock',       filterGenres: ['rock', 'indie'],     bpm: 85 },
    { id: 'ea_10_8',  title: 'The Less I Know the Better', artist: 'Tame Impala',        releaseYear: 2015, genre: 'Indie',      filterGenres: ['indie', 'electronic'], bpm: 117 },
    { id: 'ea_10_9',  title: 'Pumped Up Kicks',          artist: 'Foster the People',    releaseYear: 2010, genre: 'Indie',      filterGenres: ['indie', 'pop'],      bpm: 128 },
    { id: 'ea_10_10', title: 'Believer',                 artist: 'Imagine Dragons',      releaseYear: 2017, genre: 'Rock',       filterGenres: ['rock', 'pop'],       bpm: 125 },
    { id: 'ea_10_11', title: 'Shake It Off',             artist: 'Taylor Swift',         releaseYear: 2014, genre: 'Pop',        filterGenres: ['pop'],               bpm: 160 },
    { id: 'ea_10_12', title: 'Bad Guy',                  artist: 'Billie Eilish',        releaseYear: 2019, genre: 'Pop',        filterGenres: ['pop', 'indie'],      bpm: 135 },
    { id: 'ea_10_13', title: 'New Rules',                artist: 'Dua Lipa',             releaseYear: 2017, genre: 'Pop',        filterGenres: ['pop'],               bpm: 116 },
    { id: 'ea_10_14', title: 'Starboy',                  artist: 'The Weeknd',           releaseYear: 2016, genre: 'Pop',        filterGenres: ['pop', 'urban', 'electronic'], bpm: 186 },
    { id: 'ea_10_15', title: 'Chandelier',               artist: 'Sia',                  releaseYear: 2014, genre: 'Pop',        filterGenres: ['pop'],               bpm: 117 },
    { id: 'ea_10_16', title: 'Stressed Out',             artist: 'Twenty One Pilots',    releaseYear: 2015, genre: 'Indie',      filterGenres: ['indie', 'rock'],     bpm: 170 },
    { id: 'ea_10_17', title: 'Gods Plan',                artist: 'Drake',                releaseYear: 2018, genre: 'Hip-Hop',    filterGenres: ['urban'],             bpm: 77 },
    { id: 'ea_10_18', title: 'HUMBLE.',                  artist: 'Kendrick Lamar',       releaseYear: 2017, genre: 'Hip-Hop',    filterGenres: ['urban'],             bpm: 150 },
    { id: 'ea_10_19', title: 'Malamente',                artist: 'ROSALÍA',              releaseYear: 2018, genre: 'Spanish',    filterGenres: ['spanish', 'urban', 'pop'], bpm: 100 },
    { id: 'ea_10_20', title: 'La Mujer de Verde',        artist: 'Izal',                 releaseYear: 2013, genre: 'Spanish',    filterGenres: ['spanish', 'indie'],  bpm: 124 },
    { id: 'ea_10_21', title: 'Despacito',                artist: 'Luis Fonsi',           releaseYear: 2017, genre: 'Latin',      filterGenres: ['latin', 'urban', 'pop'], bpm: 89 },
    { id: 'ea_10_22', title: 'Mi Gente',                 artist: 'J Balvin',             releaseYear: 2017, genre: 'Reggaeton',  filterGenres: ['urban', 'latin'],    bpm: 105 },
    { id: 'ea_10_23', title: 'Vivir Mi Vida',            artist: 'Marc Anthony',         releaseYear: 2013, genre: 'Latin',      filterGenres: ['latin'],             bpm: 105 },
    { id: 'ea_10_24', title: 'Propuesta Indecente',      artist: 'Romeo Santos',         releaseYear: 2013, genre: 'Latin',      filterGenres: ['latin'],             bpm: 124 },
    { id: 'ea_10_25', title: 'Cornfield Chase',          artist: 'Hans Zimmer',          releaseYear: 2014, genre: 'OST',        filterGenres: ['ost'],               bpm: 102 },
    { id: 'ea_10_26', title: 'Let It Go',                artist: 'Idina Menzel',         releaseYear: 2013, genre: 'OST',        filterGenres: ['ost', 'pop'],        bpm: 137 },
    { id: 'ea_10_27', title: 'Sunflower',                artist: 'Post Malone & Swae Lee', releaseYear: 2018, genre: 'OST',      filterGenres: ['ost', 'urban', 'pop'], bpm: 90 },
    { id: 'ea_10_28', title: 'Space Song',               artist: 'Beach House',          releaseYear: 2015, genre: 'Indie',      filterGenres: ['indie'],             bpm: 147 },

    // ---- 2020 – ACTUAL (2020-2026) ----
    { id: 'ea_20_1',  title: 'Blinding Lights',          artist: 'The Weeknd',           releaseYear: 2020, genre: 'Pop',        filterGenres: ['pop', 'electronic'], bpm: 171 },
    { id: 'ea_20_2',  title: 'As It Was',                artist: 'Harry Styles',         releaseYear: 2022, genre: 'Pop',        filterGenres: ['pop', 'indie'],      bpm: 174 },
    { id: 'ea_20_3',  title: 'Flowers',                  artist: 'Miley Cyrus',          releaseYear: 2023, genre: 'Pop',        filterGenres: ['pop'],               bpm: 118 },
    { id: 'ea_20_4',  title: 'Espresso',                 artist: 'Sabrina Carpenter',    releaseYear: 2024, genre: 'Pop',        filterGenres: ['pop'],               bpm: 104 },
    { id: 'ea_20_5',  title: 'Good 4 U',                 artist: 'Olivia Rodrigo',       releaseYear: 2021, genre: 'Pop',        filterGenres: ['pop', 'rock'],       bpm: 166 },
    { id: 'ea_20_6',  title: 'Levitating',               artist: 'Dua Lipa',             releaseYear: 2020, genre: 'Pop',        filterGenres: ['pop', 'electronic'], bpm: 103 },
    { id: 'ea_20_7',  title: 'Kill Bill',                artist: 'SZA',                  releaseYear: 2022, genre: 'R&B',        filterGenres: ['urban', 'pop'],      bpm: 89 },
    { id: 'ea_20_8',  title: 'Tití Me Preguntó',         artist: 'Bad Bunny',            releaseYear: 2022, genre: 'Reggaeton',  filterGenres: ['urban', 'latin'],    bpm: 107 },
    { id: 'ea_20_9',  title: 'DESPECHÁ',                 artist: 'ROSALÍA',              releaseYear: 2022, genre: 'Spanish',    filterGenres: ['spanish', 'latin', 'pop'], bpm: 130 },
    { id: 'ea_20_10', title: 'Quevedo: Bzrp Music Sessions, Vol. 52', artist: 'Bizarrap & Quevedo', releaseYear: 2022, genre: 'Spanish', filterGenres: ['spanish', 'urban', 'electronic'], bpm: 128 },
    { id: 'ea_20_11', title: 'Demasiadas Mujeres',       artist: 'C. Tangana',           releaseYear: 2020, genre: 'Spanish',    filterGenres: ['spanish', 'urban'],  bpm: 94 },
    { id: 'ea_20_12', title: 'Tú Me Dejaste de Querer',  artist: 'C. Tangana',           releaseYear: 2020, genre: 'Spanish',    filterGenres: ['spanish', 'pop', 'latin'], bpm: 92 },
    { id: 'ea_20_13', title: 'Mon Amour Remix',          artist: 'Aitana & zzoilo',      releaseYear: 2021, genre: 'Spanish',    filterGenres: ['spanish', 'pop'],    bpm: 116 },
    { id: 'ea_20_14', title: 'El Tonto',                 artist: 'Lola Indigo & Quevedo',releaseYear: 2023, genre: 'Spanish',    filterGenres: ['spanish', 'urban', 'pop'], bpm: 122 },
    { id: 'ea_20_15', title: 'PROVENZA',                 artist: 'KAROL G',              releaseYear: 2022, genre: 'Latin',      filterGenres: ['latin', 'urban'],    bpm: 111 },
    { id: 'ea_20_16', title: 'Todo de Ti',               artist: 'Rauw Alejandro',       releaseYear: 2021, genre: 'Latin',      filterGenres: ['latin', 'pop', 'electronic'], bpm: 128 },
    { id: 'ea_20_17', title: 'LUNA',                     artist: 'Feid & ATL Jacob',     releaseYear: 2023, genre: 'Reggaeton',  filterGenres: ['urban', 'latin'],    bpm: 100 },
    { id: 'ea_20_18', title: 'La Bachata',               artist: 'Manuel Turizo',        releaseYear: 2022, genre: 'Latin',      filterGenres: ['latin'],             bpm: 125 },
    { id: 'ea_20_19', title: 'Beggin',                   artist: 'Måneskin',             releaseYear: 2021, genre: 'Rock',       filterGenres: ['rock'],              bpm: 134 },
    { id: 'ea_20_20', title: 'ZITTI E BUONI',            artist: 'Måneskin',             releaseYear: 2021, genre: 'Rock',       filterGenres: ['rock'],              bpm: 103 },
    { id: 'ea_20_21', title: 'Delilah (pull me out of this)', artist: 'Fred again..',    releaseYear: 2022, genre: 'Electronic', filterGenres: ['electronic', 'indie'], bpm: 134 },
    { id: 'ea_20_22', title: 'Rumble',                   artist: 'Skrillex & Fred again..', releaseYear: 2023, genre: 'Electronic', filterGenres: ['electronic'],     bpm: 140 },
    { id: 'ea_20_23', title: 'Heat Waves',               artist: 'Glass Animals',        releaseYear: 2020, genre: 'Indie',      filterGenres: ['indie', 'pop'],      bpm: 81 },
    { id: 'ea_20_24', title: 'Birds of a Feather',       artist: 'Billie Eilish',        releaseYear: 2024, genre: 'Pop',        filterGenres: ['pop', 'indie'],      bpm: 105 },
    { id: 'ea_20_25', title: 'We Dont Talk About Bruno', artist: 'Carolina Gaitán',      releaseYear: 2021, genre: 'OST',        filterGenres: ['ost', 'latin'],      bpm: 103 },
    { id: 'ea_20_26', title: 'Idol',                     artist: 'YOASOBI',              releaseYear: 2023, genre: 'OST',        filterGenres: ['ost', 'pop'],        bpm: 166 },
    { id: 'ea_20_27', title: 'Not Like Us',              artist: 'Kendrick Lamar',       releaseYear: 2024, genre: 'Hip-Hop',    filterGenres: ['urban'],             bpm: 101 },
    { id: 'ea_20_28', title: 'Die With A Smile',         artist: 'Lady Gaga & Bruno Mars', releaseYear: 2024, genre: 'Pop',      filterGenres: ['pop'],               bpm: 158 }
  ];

  // Rotating live YouTube discovery queries across all eras, genres and scenes
  const YOUTUBE_RANDOM_SEEDS = [
    'top global music hits official audio',
    'rock clasico 80s 90s official audio',
    'pop hits 2000s 2010s official audio',
    'reggaeton latin hits 2024 2025 official audio',
    'musica espanola exitos pop rock official audio',
    'hip hop rap classics official audio',
    'electronic dance house classics official audio',
    'indie rock alternative classics official audio',
    'soul funk disco classics official audio',
    'bandas sonoras peliculas anime ost music',
    'r&b modern classics official audio',
    'latino pop rock en espanol clasicos official audio',
    'synthpop new wave 80s official audio',
    'acoustic folk indie hits official audio',
    'kpop jpop global hits official audio',
    'metal hard rock anthems official audio'
  ];

  const YOUTUBE_HITS_SEEDS = [
    'biggest songs of all time official audio',
    'top 50 global hits 2025 official audio',
    'exitos pop espanol latino official audio',
    'greatest pop rock hits official audio',
    'iconic 90s 2000s 2010s hits official audio',
    'viral music hits 2024 2025 official audio'
  ];

  const YOUTUBE_OBSCURE_SEEDS = [
    'indie dream pop bedroom pop official audio',
    'french touch nu disco electronic official audio',
    'neo soul psychedelic funk official audio',
    'indie espanol alternativo oficial audio',
    'shoegaze post punk underground official audio',
    'jazz hop lofi beats instrumental official audio',
    'math rock art pop indie gems official audio'
  ];

  const APPLE_CHART_COUNTRIES = ['es', 'us', 'mx', 'gb', 'ar'];

  // Extra iconic global/Spanish hits blended WITH the full 1,000+ song catalog (never overriding it!)
  const EXTRA_ICONIC_HITS = [
    { id: 'ea_hit_1',  title: 'Blinding Lights',         artist: 'The Weeknd',        genre: 'Pop',       releaseYear: 2020, filterGenres: ['pop', 'electronic'], bpm: 171 },
    { id: 'ea_hit_2',  title: 'Bohemian Rhapsody',       artist: 'Queen',             genre: 'Rock',      releaseYear: 1975, filterGenres: ['rock', 'pop'],       bpm: 72 },
    { id: 'ea_hit_3',  title: 'Billie Jean',             artist: 'Michael Jackson',   genre: 'Pop',       releaseYear: 1982, filterGenres: ['pop'],               bpm: 117 },
    { id: 'ea_hit_4',  title: 'DESPECHÁ',                artist: 'ROSALÍA',           genre: 'Latin',     releaseYear: 2022, filterGenres: ['spanish', 'latin', 'pop'], bpm: 130 },
    { id: 'ea_hit_5',  title: 'Tití Me Preguntó',        artist: 'Bad Bunny',         genre: 'Reggaeton', releaseYear: 2022, filterGenres: ['urban', 'latin'],    bpm: 107 },
    { id: 'ea_hit_6',  title: 'As It Was',               artist: 'Harry Styles',      genre: 'Pop',       releaseYear: 2022, filterGenres: ['pop', 'indie'],      bpm: 174 },
    { id: 'ea_hit_7',  title: 'Flowers',                 artist: 'Miley Cyrus',       genre: 'Pop',       releaseYear: 2023, filterGenres: ['pop'],               bpm: 118 },
    { id: 'ea_hit_8',  title: 'Smells Like Teen Spirit', artist: 'Nirvana',           genre: 'Rock',      releaseYear: 1991, filterGenres: ['rock', 'indie'],     bpm: 117 },
    { id: 'ea_hit_9',  title: 'Viva La Vida',            artist: 'Coldplay',          genre: 'Pop',       releaseYear: 2008, filterGenres: ['pop', 'rock'],       bpm: 138 },
    { id: 'ea_hit_10', title: 'Get Lucky',               artist: 'Daft Punk',         genre: 'Electronic',releaseYear: 2013, filterGenres: ['electronic', 'pop'], bpm: 116 },
    { id: 'ea_hit_11', title: 'Hips Dont Lie',           artist: 'Shakira',           genre: 'Latin',     releaseYear: 2006, filterGenres: ['latin', 'pop'],      bpm: 100 },
    { id: 'ea_hit_12', title: 'Rolling in the Deep',     artist: 'Adele',             genre: 'Pop',       releaseYear: 2010, filterGenres: ['pop'],               bpm: 105 },
    { id: 'ea_hit_13', title: 'Uptown Funk',             artist: 'Bruno Mars',        genre: 'Funk',      releaseYear: 2014, filterGenres: ['pop'],               bpm: 115 },
    { id: 'ea_hit_14', title: 'Dancing Queen',           artist: 'ABBA',              genre: 'Pop',       releaseYear: 1976, filterGenres: ['pop', 'electronic'], bpm: 101 },
    { id: 'ea_hit_15', title: 'Do I Wanna Know?',        artist: 'Arctic Monkeys',    genre: 'Rock',      releaseYear: 2013, filterGenres: ['rock', 'indie'],     bpm: 85 },
    { id: 'ea_hit_16', title: 'Wonderwall',              artist: 'Oasis',             genre: 'Rock',      releaseYear: 1995, filterGenres: ['rock', 'indie', 'pop'], bpm: 87 },
    { id: 'ea_hit_17', title: 'Como Camarón',            artist: 'Estopa',            genre: 'Spanish',   releaseYear: 1999, filterGenres: ['spanish', 'rock'],   bpm: 112 },
    { id: 'ea_hit_18', title: 'Take On Me',              artist: 'a-ha',              genre: 'Pop',       releaseYear: 1985, filterGenres: ['pop', 'electronic'], bpm: 169 },
    { id: 'ea_hit_19', title: 'Seven Nation Army',       artist: 'The White Stripes', genre: 'Rock',      releaseYear: 2003, filterGenres: ['rock', 'indie'],     bpm: 124 },
    { id: 'ea_hit_20', title: 'Demasiadas Mujeres',      artist: 'C. Tangana',        genre: 'Spanish',   releaseYear: 2020, filterGenres: ['spanish', 'urban'],  bpm: 94 }
  ];

  // Curated indie / cult / lesser-known cuts for "Ocultas" mode
  const DEEP_CUTS_LIBRARY = [
    { id: 'ea_obs_1',  title: 'Time (You and I)',        artist: 'Khruangbin',        genre: 'Indie',      releaseYear: 2020, filterGenres: ['indie'],              bpm: 108 },
    { id: 'ea_obs_2',  title: 'Show Me How',             artist: 'Men I Trust',       genre: 'Indie',      releaseYear: 2018, filterGenres: ['indie'],              bpm: 88 },
    { id: 'ea_obs_3',  title: 'Tieduprightnow',          artist: 'Parcels',           genre: 'Funk',       releaseYear: 2018, filterGenres: ['indie', 'electronic'],bpm: 112 },
    { id: 'ea_obs_4',  title: 'Aruarian Dance',          artist: 'Nujabes',           genre: 'LoFi',       releaseYear: 2004, filterGenres: ['indie', 'ost'],       bpm: 92 },
    { id: 'ea_obs_5',  title: 'Busy Earnin',             artist: 'Jungle',            genre: 'Funk',       releaseYear: 2014, filterGenres: ['indie', 'electronic'],bpm: 100 },
    { id: 'ea_obs_6',  title: 'Agitations Tropicales',   artist: 'L Imperatrice',     genre: 'Electronic', releaseYear: 2015, filterGenres: ['electronic', 'indie'],bpm: 116 },
    { id: 'ea_obs_7',  title: 'Chamber of Reflection',   artist: 'Mac DeMarco',       genre: 'Indie',      releaseYear: 2014, filterGenres: ['indie'],              bpm: 131 },
    { id: 'ea_obs_8',  title: 'Ya No Te Hago Falta',     artist: 'Sen Senra',         genre: 'Spanish',    releaseYear: 2019, filterGenres: ['spanish', 'indie'],   bpm: 102 },
    { id: 'ea_obs_9',  title: 'Nanai',                   artist: 'Polo & Pan',        genre: 'Electronic', releaseYear: 2017, filterGenres: ['electronic', 'indie'],bpm: 118 },
    { id: 'ea_obs_10', title: '10%',                     artist: 'KAYTRANADA',        genre: 'Electronic', releaseYear: 2019, filterGenres: ['electronic', 'urban'],bpm: 108 },
    { id: 'ea_obs_11', title: 'Washing Machine Heart',   artist: 'Mitski',            genre: 'Indie',      releaseYear: 2018, filterGenres: ['indie'],              bpm: 106 },
    { id: 'ea_obs_12', title: 'Hasta la Raíz',           artist: 'Natalia Lafourcade',genre: 'Latin',      releaseYear: 2015, filterGenres: ['latin', 'indie'],     bpm: 92 },
    { id: 'ea_obs_13', title: 'Fuego',                   artist: 'Bomba Estéreo',     genre: 'Latin',      releaseYear: 2008, filterGenres: ['latin', 'electronic'],bpm: 120 },
    { id: 'ea_obs_14', title: 'El Encuentro',            artist: 'Alizzz',            genre: 'Spanish',    releaseYear: 2020, filterGenres: ['spanish', 'indie'],   bpm: 124 },
    { id: 'ea_obs_15', title: 'Mountain at My Gates',    artist: 'Foals',             genre: 'Indie',      releaseYear: 2015, filterGenres: ['indie', 'rock'],      bpm: 128 },
    { id: 'ea_obs_16', title: 'Lover Is a Day',          artist: 'Cuco',              genre: 'Indie',      releaseYear: 2016, filterGenres: ['indie', 'latin'],     bpm: 86 },
    { id: 'ea_obs_17', title: 'Breathe Deeper',          artist: 'Tame Impala',       genre: 'Indie',      releaseYear: 2020, filterGenres: ['indie', 'electronic'],bpm: 118 },
    { id: 'ea_obs_18', title: 'Kyoto',                   artist: 'Phoebe Bridgers',   genre: 'Indie',      releaseYear: 2020, filterGenres: ['indie'],              bpm: 131 },
    { id: 'ea_obs_19', title: 'Redbone',                 artist: 'Childish Gambino',  genre: 'Soul',       releaseYear: 2016, filterGenres: ['urban', 'indie'],     bpm: 80 },
    { id: 'ea_obs_20', title: 'Space Song',              artist: 'Beach House',       genre: 'Indie',      releaseYear: 2015, filterGenres: ['indie'],              bpm: 147 },
    { id: 'ea_obs_21', title: 'Nubes',                   artist: 'Caifanes',          genre: 'Spanish',    releaseYear: 1992, filterGenres: ['latin', 'rock'],      bpm: 128 },
    { id: 'ea_obs_22', title: 'Ojos Color Sol',          artist: 'Calle 13',          genre: 'Latin',      bpm: 94 },
    { id: 'ea_obs_23', title: 'Feel It All Around',      artist: 'Washed Out',        genre: 'Indie',      bpm: 106 },
    { id: 'ea_obs_24', title: 'Genesis',                 artist: 'Grimes',            genre: 'Electronic', bpm: 124 },
    { id: 'ea_obs_25', title: 'Bambi',                   artist: 'Jidenna',           genre: 'Soul',       bpm: 98 },
    { id: 'ea_obs_26', title: 'Warm Glow',               artist: 'Hippo Campus',      genre: 'Indie',      bpm: 116 }
  ];

  const TRIALS = [
    { id: 'pitch',      name: 'Clava el Tono',     short: 'Tono',      kind: 'skill',  isNew: false, desc: 'Afina el fader a ciegas al tono real' },
    { id: 'reverse',    name: 'Cinta al Revés',    short: 'Al Revés',  kind: 'choice', isNew: false, desc: 'Reconoce el tema girando hacia atrás' },
    { id: 'xray',       name: 'Solo Graves',       short: 'Graves',    kind: 'choice', isNew: false, desc: 'Identifica la canción solo por el bajo' },
    { id: 'silence',    name: 'Pulso en Silencio', short: 'Silencio',  kind: 'skill',  isNew: false, desc: 'Clava el 1 tras 4 tiempos en silencio' },
    { id: 'retro',      name: 'Radio 8-Bit',       short: '8-Bit',     kind: 'choice', isNew: false, desc: 'Audio triturado estilo consola retro' },
    { id: 'chipmunk',   name: 'Ardilla / Gigante', short: 'RPM',       kind: 'choice', isNew: false, desc: 'Velocidad extrema acelerada o lenta' },
    { id: 'micro',      name: 'Micro-Flash 0.6s',  short: 'Flash',     kind: 'choice', isNew: false, desc: 'Un destello de medio segundo de estribillo' },
    { id: 'ghost',      name: 'Voz Fantasma',      short: 'Fantasma',  kind: 'choice', isNew: false, desc: 'Voz cancelada con reverb espectral' },
    { id: 'taptempo',   name: 'Clava el BPM',      short: 'Tap BPM',   kind: 'skill',  isNew: false, desc: 'Marca 5 golpes exactos al tempo real' },
    { id: 'telephone',  name: 'Radio 1940',        short: 'Vinilo',    kind: 'choice', isNew: false, desc: 'Válvula antigua y crujido de vinilo' },
    { id: 'chopper',    name: 'Señal Cortada',     short: 'Corte',     kind: 'choice', isNew: false, desc: 'Corte rítmico tipo helicóptero' },
    { id: 'echo',       name: 'Cueva Infinita',    short: 'Eco Dub',   kind: 'choice', isNew: false, desc: 'Delay infinito y eco cavernoso' },
    { id: 'impostor',   name: 'Caza el Fallo',     short: 'Fallo',     kind: 'skill',  isNew: false, desc: 'Detecta al instante el sabotaje tonal' },
    { id: 'mashup',     name: 'Doble Vinilo',      short: 'Doble DJ',  kind: 'choice', isNew: false, desc: 'Encuentra la canción oculta bajo otro beat' },
    { id: 'underwater', name: 'Submarino',         short: 'Submarino', kind: 'choice', isNew: false, desc: 'Sonar resonante bajo el agua' },
    { id: 'stutter',    name: 'Vinilo Rayado',     short: 'Rayado',    kind: 'choice', isNew: false, desc: 'Bucle atascado de aguja con toques' },
    { id: 'tuner',      name: 'Dial FM 88-108',    short: 'Dial FM',   kind: 'skill',  isNew: false, desc: 'Sintoniza la emisora oculta en estática' },
    { id: 'melody',     name: 'Chiptune 8-Bit',    short: 'Chiptune',  kind: 'choice', isNew: false, desc: 'Melodía extraída y tocada en sinte NES' },
    { id: 'speedrun',   name: 'Rueda Loca',        short: 'Rueda',     kind: 'choice', isNew: false, desc: 'Motor oscilante en montaña rusa' },
    { id: 'eqhunter',   name: 'Consola EQ',        short: 'Consola',   kind: 'choice', isNew: false, desc: 'Alterna Graves, Medios y Agudos en vivo' },
    { id: 'stereoduo',  name: 'Estéreo L/R',       short: 'Estéreo',   kind: 'choice', isNew: true,  desc: 'Dos canciones a la vez (Izd/Der): acierta ambas' },
    { id: 'year',       name: 'Adivina el Año',    short: 'Año',       kind: 'skill',  isNew: true,  desc: 'Sitúa la aguja en el año exacto de estreno' }
  ];

  const SVG = {
    close:     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    play:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    pitch:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/></svg>',
    reverse:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>',
    xray:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="19" x2="5" y2="12"/><line x1="12" y1="19" x2="12" y2="6"/><line x1="19" y1="19" x2="19" y2="10"/></svg>',
    silence:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    retro:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 12 6 12 6 6 12 6 12 18 18 18 18 12 22 12"/></svg>',
    chipmunk:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19a7 7 0 1 1 7-7"/><path d="M12 12l5-3"/></svg>',
    micro:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    ghost:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></svg>',
    taptempo:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 4 21 20 21 12 3"/><line x1="12" y1="15" x2="17" y2="8"/></svg>',
    telephone: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/></svg>',
    chopper:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="5" x2="4" y2="19"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="16" y1="5" x2="16" y2="19"/><line x1="21" y1="9" x2="21" y2="15"/></svg>',
    echo:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5a6.5 6.5 0 0 1 0 9"/><path d="M7.5 16.5a6.5 6.5 0 0 1 0-9"/></svg>',
    impostor:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 13 7 13 10 5 14 19 17 13 22 13"/></svg>',
    mashup:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/><circle cx="8" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/></svg>',
    underwater:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><line x1="12" y1="12" x2="17" y2="7"/></svg>',
    stutter:   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="13" r="7"/><circle cx="11" cy="13" r="1.8"/><path d="M19 4v7l-4 3"/></svg>',
    tuner:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="12" rx="2"/><line x1="6" y1="13" x2="18" y2="13"/><line x1="13" y1="9" x2="13" y2="17"/><path d="M7 7l5-4"/></svg>',
    melody:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="14" x2="11" y2="14"/><line x1="11" y1="10" x2="15" y2="10"/><line x1="15" y1="13" x2="18" y2="13"/></svg>',
    speedrun:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15c3-9 6-9 9 0s6 9 11-5"/></svg>',
    eqhunter:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="20" x2="6" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="13"/><circle cx="6" cy="8" r="1.5"/><circle cx="12" cy="14" r="1.5"/><circle cx="18" cy="11" r="1.5"/></svg>',
    stereoduo: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="13" width="4" height="7" rx="1.5"/><rect x="18" y="13" width="4" height="7" rx="1.5"/></svg>',
    year:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
    heart:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFill: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    piano:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><line x1="8" y1="4" x2="8" y2="14"/><line x1="12" y1="4" x2="12" y2="14"/><line x1="16" y1="4" x2="16" y2="14"/><line x1="6" y1="14" x2="6" y2="20"/><line x1="10" y1="14" x2="10" y2="20"/><line x1="14" y1="14" x2="14" y2="20"/><line x1="18" y1="14" x2="18" y2="20"/></svg>',
    share:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    replay:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
    flip:      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/></svg>',
    sliders:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    search:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    chevron:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    check:     '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    crown:     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4L3 18z"/><line x1="4" y1="21" x2="20" y2="21"/></svg>',
    trophy:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg>',
    mic:       '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>',
    clef:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3v14.5a3.5 3.5 0 1 1-2.5-3.35"/><path d="M13 5c3.2 0 5.5 1.8 5.5 4.4S16 14 12.5 14C9.5 14 7.5 12.2 7.5 9.8c0-2.1 1.6-3.8 4-4.1"/></svg>',
    clock:     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>'
  };

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function fnv1a32(str) {
    let h = 0x811c9dc5;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function createSeededRng(seedInput) {
    let a = (typeof seedInput === 'number' ? seedInput : fnv1a32(seedInput)) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function getEarDailyDayKey(dateObj = new Date()) {
    try {
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: DAILY_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = fmt.formatToParts(dateObj);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch (_) {}
    return dateObj.toISOString().slice(0, 10);
  }

  function getLocalNextMidnightMs(nowMs = Date.now()) {
    const curKey = getEarDailyDayKey(new Date(nowMs));
    let lo = nowMs;
    let hi = nowMs + 26 * 3600 * 1000;
    for (let i = 0; i < 24; i++) {
      const mid = Math.floor((lo + hi) / 2);
      if (getEarDailyDayKey(new Date(mid)) === curKey) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  function computeDailyPrizeInfo(rank) {
    const r = Number(rank) || 0;
    if (r <= 0) return { clefs: 0, tier: 'SIN PARTICIPACIÓN', short: '--' };
    const row = DAILY_PAYTABLE.find(p => r >= p.minRank && r <= p.maxRank)
      || DAILY_PAYTABLE[DAILY_PAYTABLE.length - 1];
    return { clefs: row.clefs, tier: row.tier, short: row.short };
  }

  function formatDayKeyHuman(dayKey) {
    const parts = String(dayKey || '').split('-');
    if (parts.length !== 3) return String(dayKey || '');
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    return `${parts[2]} ${months[mIdx]} ${parts[0]}`;
  }

  function getOrCreateDailyPlayerId() {
    try {
      let pid = localStorage.getItem(STORAGE_PLAYER_ID_KEY);
      if (pid && pid.length >= 6) return pid;
      const rand = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      pid = `ea_${rand}`;
      localStorage.setItem(STORAGE_PLAYER_ID_KEY, pid);
      return pid;
    } catch (_) {
      return `ea_guest_${Date.now().toString(36)}`;
    }
  }

  function getCurrentPlayerNickname() {
    try {
      const raw = (localStorage.getItem('beatstar_player_nickname') || '').trim();
      return raw || 'Jugador';
    } catch (_) {
      return 'Jugador';
    }
  }

  function loadDailyLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_DAILY_STATE_KEY);
      if (!raw) return { playedByDay: {}, claimedDays: {} };
      const p = JSON.parse(raw);
      return {
        playedByDay: (p && typeof p.playedByDay === 'object' && p.playedByDay) ? p.playedByDay : {},
        claimedDays: (p && typeof p.claimedDays === 'object' && p.claimedDays) ? p.claimedDays : {}
      };
    } catch (_) {
      return { playedByDay: {}, claimedDays: {} };
    }
  }

  function saveDailyLocalState(st) {
    try {
      const playedKeys = Object.keys(st.playedByDay || {}).sort().slice(-14);
      const claimedKeys = Object.keys(st.claimedDays || {}).sort().slice(-20);
      const compact = { playedByDay: {}, claimedDays: {} };
      playedKeys.forEach(k => { compact.playedByDay[k] = st.playedByDay[k]; });
      claimedKeys.forEach(k => { compact.claimedDays[k] = st.claimedDays[k]; });
      localStorage.setItem(STORAGE_DAILY_STATE_KEY, JSON.stringify(compact));
    } catch (_) {}
  }

  function normalizeArtistQuery(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeCleanTitle(raw) {
    return String(raw || '')
      .replace(/\s*[\(\[][^)\]]*(remaster|radio\s*edit|single\s*version|album\s*version|deluxe|anniversary|explicit|clean|bonus|feat\.?|ft\.?|official|video|audio|lyric|mono|stereo|live|\d{4})[^)\]]*[\)\]]/gi, '')
      .replace(/\s*[-–—]\s*(?:\d{4}\s*)?(?:remaster(?:ed)?|radio\s*edit|single\s*version|album\s*version|live.*|mono|stereo).*$/i, '')
      .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/i, '')
      .trim();
  }

  function trackSig(tr) {
    if (!tr || !tr.title) return '';
    const cleanTitle = normalizeCleanTitle(tr.title) || String(tr.title);
    const cleanArtist = String(tr.artist || '').split(/[,&]|feat\.?|ft\.?/i)[0].trim() || String(tr.artist || '');
    return `${cleanTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')}__${cleanArtist.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '')}`;
  }

  function artistSig(tr) {
    if (!tr || !tr.artist) return '';
    return String(tr.artist).split(/[,&]|feat\.?|ft\.?/i)[0]
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  function toast(msg) {
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast(msg);
    else if (typeof window.showToast === 'function') window.showToast(msg);
  }

  const COVER_CACHE_KEY = 'ea_cover_cache_v1';
  const COVER_MEM_CACHE = new Map();
  const COVER_INFLIGHT = new Map();
  let _coverSaveTimer = 0;

  (function loadPersistedCoverCache() {
    try {
      const raw = localStorage.getItem(COVER_CACHE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          if (typeof v === 'string' && v.startsWith('http')) COVER_MEM_CACHE.set(k, v);
        });
      }
    } catch (_) {}
  })();

  function _scheduleCoverCachePersist() {
    if (_coverSaveTimer) return;
    _coverSaveTimer = setTimeout(() => {
      _coverSaveTimer = 0;
      try {
        const entries = Array.from(COVER_MEM_CACHE.entries()).slice(-450);
        const obj = {};
        for (const [k, v] of entries) obj[k] = v;
        localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(obj));
      } catch (_) {}
    }, 1200);
  }

  function isRealCoverUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const s = url.trim();
    if (!s) return false;
    if (/app_logo|favicon|icon-192|icon-512|placeholder/i.test(s)) return false;
    return /^(https?:\/\/|data:image\/|blob:|\.?\/covers\/)/i.test(s);
  }

  function normalizeCoverRes(url, size = 300) {
    if (!url || typeof url !== 'string') return '';
    return url.replace(/\d+x\d+bb/i, `${size}x${size}bb`);
  }

  function rememberTrackCover(track, url) {
    if (!track || !isRealCoverUrl(url)) return '';
    const crisp = normalizeCoverRes(url, 300);
    const sig = trackSig(track);
    if (sig && !COVER_MEM_CACHE.has(sig)) {
      COVER_MEM_CACHE.set(sig, crisp);
      _scheduleCoverCachePersist();
    } else if (sig && COVER_MEM_CACHE.get(sig) !== crisp) {
      COVER_MEM_CACHE.set(sig, crisp);
      _scheduleCoverCachePersist();
    }
    track.artworkUrl600 = crisp;
    track.thumbnail = crisp;
    return crisp;
  }

  function getRealCoverUrl(track) {
    if (!track) return '';
    const direct = track.artworkUrl600 || track.thumbnail || track.cover_url || '';
    if (isRealCoverUrl(direct)) {
      const sig = trackSig(track);
      if (sig && !COVER_MEM_CACHE.has(sig)) rememberTrackCover(track, direct);
      return normalizeCoverRes(direct, 300);
    }
    const sig = trackSig(track);
    if (sig && COVER_MEM_CACHE.has(sig)) {
      const cached = COVER_MEM_CACHE.get(sig);
      track.artworkUrl600 = cached;
      track.thumbnail = cached;
      return cached;
    }
    if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.getBestTrackCover === 'function') {
      const fromApp = window.DiscoverHomeApp.getBestTrackCover(track);
      if (isRealCoverUrl(fromApp)) return rememberTrackCover(track, fromApp);
    }
    return '';
  }

  function getBestCover(track) {
    return getRealCoverUrl(track) || './app_logo.png';
  }

  async function fetchCoverForTrack(track) {
    if (!track || !track.title) return '';
    const existing = getRealCoverUrl(track);
    if (existing) return existing;

    const sig = trackSig(track);
    if (!sig) return '';
    if (COVER_INFLIGHT.has(sig)) return COVER_INFLIGHT.get(sig);

    const job = (async () => {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3200);
      try {
        const q = `${track.artist || ''} ${track.title || ''}`.trim();
        const resp = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=4&country=ES`,
          { signal: ctrl.signal }
        );
        clearTimeout(tid);
        if (!resp.ok) return '';
        const data = await resp.json();
        const items = Array.isArray(data?.results) ? data.results : [];
        const wantArtist = artistSig(track);
        const best = items.find(it => it && it.artworkUrl100 && (!wantArtist || artistSig({ artist: it.artistName }) === wantArtist))
          || items.find(it => it && it.artworkUrl100);
        if (best && best.artworkUrl100) {
          return rememberTrackCover(track, best.artworkUrl100);
        }
      } catch (_) {
        clearTimeout(tid);
      } finally {
        COVER_INFLIGHT.delete(sig);
      }
      return '';
    })();

    COVER_INFLIGHT.set(sig, job);
    return job;
  }

  function drawRoundedRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }

  // =========================================================================
  // 1. REAL-TIME AUDIO BUFFER ANALYSIS & PROCEDURAL DSP GENERATORS
  // =========================================================================
  function analyzeTrackAudio(buffer, bpmHint) {
    const sr = buffer.sampleRate;
    const len = buffer.length;
    const duration = buffer.duration;
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;

    const hop = 1024;
    const numFrames = Math.floor(len / hop);
    if (numFrames < 32) {
      return { bpm: 112, chorusStartSec: 0, activeRms: 0.18, normGain: 1.0, sideRatio: ch1 ? 0.35 : 0 };
    }

    const energies = new Float32Array(numFrames);
    for (let f = 0; f < numFrames; f++) {
      let sum = 0;
      const base = f * hop;
      for (let i = 0; i < hop; i += 4) {
        const s = ch1 ? 0.5 * (ch0[base + i] + ch1[base + i]) : ch0[base + i];
        sum += s * s;
      }
      energies[f] = Math.sqrt(sum / (hop / 4));
    }

    const fps = sr / hop;
    const winFrames = Math.min(numFrames, Math.floor(18 * fps));
    let chorusFrame = 0;
    if (duration > 36) {
      const startScan = Math.floor(numFrames * 0.16);
      const endScan = Math.max(startScan + 1, Math.floor(numFrames * 0.78) - winFrames);
      let curSum = 0;
      for (let i = startScan; i < startScan + winFrames && i < numFrames; i++) curSum += energies[i];
      let bestSum = curSum;
      chorusFrame = startScan;
      for (let i = startScan + 1; i < endScan; i++) {
        curSum += energies[i + winFrames - 1] - energies[i - 1];
        if (curSum > bestSum) {
          bestSum = curSum;
          chorusFrame = i;
        }
      }
    }

    const fluxLen = Math.min(winFrames, numFrames - chorusFrame);
    const flux = new Float32Array(fluxLen);
    for (let i = 1; i < fluxLen; i++) {
      const d = energies[chorusFrame + i] - energies[chorusFrame + i - 1];
      flux[i] = d > 0 ? d : 0;
    }

    // Per-track loudness (active RMS of chorus window) & stereo side ratio (for mono-safe Voz Fantasma)
    let activeSqSum = 0;
    let activeCount = 0;
    for (let i = 0; i < fluxLen; i++) {
      const e = energies[chorusFrame + i];
      if (e > 0.012) {
        activeSqSum += e * e;
        activeCount++;
      }
    }
    const activeRms = activeCount > 0 ? Math.sqrt(activeSqSum / activeCount) : 0.18;
    const normGain = clamp(0.185 / Math.max(0.025, activeRms), 0.45, 2.5);

    let sideRatio = 0;
    if (ch1) {
      const sStart = chorusFrame * hop;
      const sEnd = Math.min(len, (chorusFrame + fluxLen) * hop);
      let sideSq = 0;
      let midSq = 0;
      let sc = 0;
      for (let i = sStart; i < sEnd; i += 16) {
        const l = ch0[i];
        const r = ch1[i];
        const mid = 0.5 * (l + r);
        const side = 0.5 * (l - r);
        midSq += mid * mid;
        sideSq += side * side;
        sc++;
      }
      if (sc > 0 && midSq > 1e-7) {
        sideRatio = Math.sqrt(sideSq / sc) / Math.sqrt(midSq / sc);
      }
    }

    const minLag = Math.max(4, Math.floor((60 / 160) * fps));
    const maxLag = Math.min(fluxLen - 2, Math.ceil((60 / 74) * fps));
    let bestLag = Math.round((60 / 116) * fps);
    let bestCorr = -1;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      const lim = fluxLen - lag;
      for (let i = 0; i < lim; i++) corr += flux[i] * flux[i + lag];
      corr /= Math.max(1, lim);
      const candBpm = (60 * fps) / lag;
      const bias = 1 + 0.16 * Math.exp(-Math.pow((candBpm - 114) / 30, 2));
      if (corr * bias > bestCorr) {
        bestCorr = corr * bias;
        bestLag = lag;
      }
    }

    let bpm = clamp(Math.round((60 * fps) / bestLag), 74, 160);
    const hint = Number(bpmHint) || 0;
    if (hint >= 72 && hint <= 176 && hint !== 120) bpm = Math.round(hint);

    const beatFrames = Math.max(4, Math.round((60 / bpm) * fps));
    let bestPhase = 0;
    let bestPhaseScore = -1;
    const cycles = Math.min(12, Math.floor(fluxLen / beatFrames));
    for (let p = 0; p < beatFrames; p++) {
      let s = 0;
      for (let c = 0; c < cycles; c++) {
        const idx = p + c * beatFrames;
        if (idx < fluxLen) s += flux[idx];
      }
      if (s > bestPhaseScore) {
        bestPhaseScore = s;
        bestPhase = p;
      }
    }

    return {
      bpm,
      chorusStartSec: clamp((chorusFrame + bestPhase) / fps, 0, Math.max(0, duration - 12)),
      activeRms,
      normGain,
      sideRatio
    };
  }

  function normalizeHumanBpm(rawBpm) {
    let bpm = Number(rawBpm) || 112;
    while (bpm > 136) bpm = Math.round(bpm / 2);
    while (bpm < 76) bpm = Math.round(bpm * 2);
    return bpm;
  }

  function createReversedSliceBuffer(ctx, srcBuffer, startSec, spanSec = 18) {
    const sr = srcBuffer.sampleRate;
    const startSample = Math.floor(clamp(startSec, 0, Math.max(0, srcBuffer.duration - 6)) * sr);
    const sliceLen = Math.min(srcBuffer.length - startSample, Math.floor(spanSec * sr));
    const numCh = srcBuffer.numberOfChannels;
    const rev = ctx.createBuffer(numCh, Math.max(1, sliceLen), sr);
    for (let c = 0; c < numCh; c++) {
      const src = srcBuffer.getChannelData(c);
      const dst = rev.getChannelData(c);
      for (let i = 0; i < sliceLen; i++) {
        dst[i] = src[startSample + (sliceLen - 1 - i)];
      }
    }
    return rev;
  }

  function createBitcrushCurve(steps = 7) {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    return curve;
  }

  function createTubeSoftClipCurve(drive = 3.2) {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve;
  }

  function createHallImpulse(ctx, durSec = 1.5, decay = 2.7) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * durSec);
    const ir = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const data = ir.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.65;
      }
    }
    return ir;
  }

  // Procedural 1940s vinyl dust crackle & warm tube hiss loop buffer
  function createVinylCrackleBuffer(ctx, durSec = 4.0) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * durSec);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const hiss = (Math.random() * 2 - 1) * 0.032;
      last = last * 0.88 + hiss * 0.12;
      let pop = 0;
      if (Math.random() < 0.00055) pop = (Math.random() * 2 - 1) * 0.42;
      else if (Math.random() < 0.0022) pop = (Math.random() * 2 - 1) * 0.14;
      data[i] = clamp(last + pop, -0.8, 0.8);
    }
    return buf;
  }

  // Procedural stereo analog FM radio white/pink inter-station static buffer
  function createFmStaticBuffer(ctx, durSec = 2.4) {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * durSec);
    const buf = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const data = buf.getChannelData(c);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        const pink = (b0 + b1 + b2 + w * 0.18) * 0.65;
        data[i] = clamp(pink, -0.85, 0.85);
      }
    }
    return buf;
  }

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function midiToNoteLabel(midi) {
    const m = Math.round(midi);
    const name = NOTE_NAMES[((m % 12) + 12) % 12];
    const oct = Math.floor(m / 12) - 1;
    return `${name}${oct}`;
  }

  // Fast decimated autocorrelation melody & rhythm contour extractor for Chiptune 8-Bit mode
  function extractMelodyContour(buffer, startSec = 0, durSec = 18) {
    const sr = buffer.sampleRate;
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    const stepSec = 0.11;
    const numSteps = Math.max(24, Math.min(180, Math.floor(durSec / stepSec)));
    const decim = Math.max(2, Math.round(sr / 11025));
    const effSr = sr / decim;
    const winN = 512;
    const minLag = Math.max(8, Math.floor(effSr / 920));
    const maxLag = Math.min(winN - 64, Math.ceil(effSr / 125));
    const frames = [];
    const buf = new Float32Array(winN);
    let lastMidi = 64;

    for (let s = 0; s < numSteps; s++) {
      const centerSample = Math.floor((startSec + s * stepSec) * sr);
      if (centerSample + winN * decim >= ch0.length) break;
      let rmsSq = 0;
      let prev = 0;
      for (let i = 0; i < winN; i++) {
        const idx = centerSample + i * decim;
        const raw = ch1 ? 0.5 * (ch0[idx] + ch1[idx]) : ch0[idx];
        // Light pre-emphasis suppresses muddy sub-bass so vocal/lead melody pops out
        const val = raw - 0.82 * prev;
        prev = raw;
        buf[i] = val;
        rmsSq += raw * raw;
      }
      const rms = Math.sqrt(rmsSq / winN);
      if (rms < 0.018) {
        frames.push({ midi: lastMidi, freq: 0, amp: 0, label: '---' });
        continue;
      }
      let bestLag = 0;
      let bestScore = 0;
      let zeroLag = 0;
      for (let i = 0; i < winN - maxLag; i++) zeroLag += buf[i] * buf[i];
      if (zeroLag > 1e-6) {
        for (let lag = minLag; lag <= maxLag; lag += 2) {
          let corr = 0;
          const lim = winN - maxLag;
          for (let i = 0; i < lim; i += 2) corr += buf[i] * buf[i + lag];
          const norm = corr / zeroLag;
          if (norm > bestScore) {
            bestScore = norm;
            bestLag = lag;
          }
        }
      }
      if (bestLag > 0 && bestScore > 0.14) {
        const freq = effSr / bestLag;
        let midi = Math.round(69 + 12 * Math.log2(freq / 440));
        // Keep melody inside a pleasant musical NES lead register (A3..C6)
        while (midi < 55) midi += 12;
        while (midi > 84) midi -= 12;
        // Smooth sudden octave outliers
        if (Math.abs(midi - lastMidi) > 14 && frames.length > 0) {
          midi = Math.round(lastMidi * 0.4 + midi * 0.6);
        }
        lastMidi = midi;
        const qFreq = 440 * Math.pow(2, (midi - 69) / 12);
        frames.push({ midi, freq: qFreq, amp: clamp(rms * 2.8, 0.22, 1.0), label: midiToNoteLabel(midi) });
      } else {
        const qFreq = 440 * Math.pow(2, (lastMidi - 69) / 12);
        frames.push({ midi: lastMidi, freq: qFreq, amp: clamp(rms * 1.4, 0.1, 0.45), label: midiToNoteLabel(lastMidi) });
      }
    }
    return { stepSec, frames };
  }

  // =========================================================================
  // 2. RANK, PREFS & PERSISTENT ANTI-REPETITION MEMORY
  // =========================================================================
  function computeRank(score, totalRounds, diffMult) {
    const maxPossible = Math.max(1, totalRounds) * 1050 * (diffMult || 1.0);
    const ratio = score / maxPossible;
    if (ratio >= 0.84) return { grade: 'S+', title: 'Oido Absoluto',        color: '#f6dfa0' };
    if (ratio >= 0.68) return { grade: 'S',  title: 'Ingeniero de Estudio', color: '#4ade80' };
    if (ratio >= 0.52) return { grade: 'A',  title: 'Oido de Oro',          color: '#e5c16c' };
    if (ratio >= 0.34) return { grade: 'B',  title: 'Melomano Fino',        color: '#f59e0b' };
    return { grade: 'C', title: 'En Calibracion', color: '#f87171' };
  }

  function loadBestRecord() {
    try {
      const raw = localStorage.getItem(STORAGE_BEST_KEY) || localStorage.getItem('piano_community_ear_arcade_best_v1');
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p && typeof p.score === 'number' ? p : null;
    } catch (_) {
      return null;
    }
  }

  function saveBestRecord(score, grade, title) {
    const prev = loadBestRecord();
    if (!prev || score > prev.score) {
      try {
        localStorage.setItem(STORAGE_BEST_KEY, JSON.stringify({ score, grade, title, updatedAt: Date.now() }));
      } catch (_) {}
      return true;
    }
    return false;
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
    } catch (_) {}
  }

  function loadRecentPlayedSigs() {
    try {
      const raw = localStorage.getItem(STORAGE_RECENT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function recordPlayedTrack(tr) {
    const sig = trackSig(tr);
    if (!sig) return;
    try {
      let arr = loadRecentPlayedSigs().filter(s => s !== sig);
      arr.unshift(sig);
      if (arr.length > MAX_RECENT_HISTORY) arr = arr.slice(0, MAX_RECENT_HISTORY);
      localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(arr));
    } catch (_) {}
  }

  function loadTrialRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_TRIAL_RECORDS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function recordTrialOutcome(trialId, ok, pts, precisionObj = null) {
    if (!trialId) return;
    try {
      const all = loadTrialRecords();
      const cur = all[trialId] || {
        played: 0,
        won: 0,
        bestPts: 0,
        bestMetric: null,
        bestMetricLabel: '',
        metricLowerIsBetter: false
      };
      cur.played = (cur.played || 0) + 1;
      if (ok) cur.won = (cur.won || 0) + 1;
      if (typeof pts === 'number' && pts > (cur.bestPts || 0)) cur.bestPts = pts;

      if (precisionObj && typeof precisionObj.value === 'number' && isFinite(precisionObj.value)) {
        const lower = !!precisionObj.lowerIsBetter;
        const hasPrev = typeof cur.bestMetric === 'number' && isFinite(cur.bestMetric);
        const isBetter = !hasPrev || (lower ? precisionObj.value < cur.bestMetric : precisionObj.value > cur.bestMetric);
        if (isBetter) {
          cur.bestMetric = precisionObj.value;
          cur.bestMetricLabel = String(precisionObj.label || '');
          cur.metricLowerIsBetter = lower;
        }
      }

      all[trialId] = cur;
      localStorage.setItem(STORAGE_TRIAL_RECORDS_KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function formatTrialRecordSummary(rec) {
    if (!rec || !rec.played) return 'Sin marca';
    const pct = Math.round(((rec.won || 0) / Math.max(1, rec.played)) * 100);
    if (rec.bestMetricLabel) return `${pct}% · ${rec.bestMetricLabel}`;
    if (rec.bestPts > 0) return `${pct}% · ${rec.bestPts} PTS`;
    return `${pct}% (${rec.won}/${rec.played})`;
  }

  // =========================================================================
  // 3. MAIN EAR ARCADE ENGINE
  // =========================================================================
  const EarArcade = {
    _mounted: false,
    _isOpen: false,
    _audioCtx: null,
    _hallIrBuffer: null,
    _vinylCrackleBuffer: null,
    _fmStaticBuffer: null,
    _decodedCache: new Map(),
    _rawAudioCache: new Map(),
    _rawFetchPromises: new Map(),

    // Lobby Settings, Musical Filters & Playlists
    _difficulty: 'normal',        // 'easy' | 'normal' | 'hard'
    _popularityMode: 'youtube',   // 'hits' | 'obscure' | 'youtube' | 'playlist'
    _eraFilter: 'all',            // 'all' | '70s' | '80s' | '90s' | '2000s' | '2010s' | '2020s'
    _genreFilter: 'all',          // 'all' | 'pop' | 'rock' | 'urban' | 'spanish' | 'electronic' | 'indie' | 'ost' | 'latin'
    _ytSearchQuery: '',           // Custom YouTube artist/genre/topic or empty = Todo YouTube
    _artistFilter: '',            // Normal mode specific singer filter (ignored in Daily & Playlist)
    _artistPoolCache: new Map(),  // normalizedArtist -> Track[]
    _selectedPlaylistKey: '',     // e.g. 'user:<id>' | 'favs' | 'curated:<id>'
    _availablePlaylists: [],      // populated asynchronously on open()
    _formatMode: 'exam',          // 'exam' (8 trials) | 'survival' | 'blitz'
    _seedTrack: null,

    // Daily Mode ("Reto Diario Las Vegas" - 5 deterministic shared rounds + 00:00 Claves rewards)
    _isDailyMatch: false,
    _dailyDayKey: '',
    _dailyPlan: null,             // { dayKey, theme, rounds: [{ trial, track, choices, seedParams }] }
    _dailyAudioMap: new Map(),    // roundIdx -> Promise<{ track, audioData }>
    _dailyLeaderboardData: null,  // Latest server response for daily ranking
    _dailyCountdownTimer: 0,
    _dailyNextResetMs: 0,
    _dailyServerOffsetMs: 0,
    _pendingDailyReward: null,    // { dayKey, rank, clefs, tier, score, hits, totalPlayers, themeTitle }
    _prizeAnimRaf: 0,
    _prizeParticles: [],
    _prizeClaimed: false,

    // Live YouTube & Global Music Pool Caches
    _liveYtPoolCache: [],
    _liveHitsPoolCache: [],
    _liveObscurePoolCache: [],
    _liveFilterCache: new Map(),
    _liveFetchInFlight: false,
    _ytSeedCursor: Math.floor(Math.random() * 16),
    _lobbyWarmTimer: 0,

    // Arrival-Order Parallel Packet Preloader State
    _matchToken: 0,
    _readyQueue: [],              // Decoded { track, audioData } pushed in exact arrival order!
    _readyWaiters: [],            // Pending promises waiting for next ready track
    _packetCursor: 0,             // Next candidate index in _matchTracksQueue
    _packetInFlight: 0,           // Active parallel download+decode workers
    _packetDispatchedSigs: new Set(),
    _packetLivePending: false,    // True while initial custom YouTube search is still streaming chunks

    // Active Match State
    _running: false,
    _roundIndex: 0,
    _totalRounds: 8,
    _matchTrialsPlan: [],
    _score: 0,
    _streak: 0,
    _bestStreak: 0,
    _lives: 4,
    _maxLives: 4,
    _blitzRemainingSec: 70.0,
    _blitzLastFramePerf: 0,
    _blitzAutoNextTimer: 0,
    _roundResults: [],
    _matchTracksQueue: [],
    _matchUsedOptionSigs: new Set(),
    _activeSheet: null, // 'filters' | 'playlist' | 'trials' | 'artist' | null
    _allCatalogCache: [],
    _preloadPromises: new Map(),

    // Current Round State
    _curTrial: null,
    _curTrack: null,
    _curAudioData: null,
    _curChoices: [],
    _roundPhase: 'idle', // 'loading' | 'playing' | 'resolved'
    _roundStartPerf: 0,
    _roundElapsedSec: 0,
    _roundDurationSec: 19.0,

    // Trial-specific states
    _pitchStartRate: 1.0,
    _pitchCurrentRate: 1.0,
    _reverseFlipUsed: false,
    _reverseFlipActive: false,
    _chipmunkStartRate: 1.82,
    _chipmunkIsGiant: false,
    _chipmunkCurRate: 1.82,
    _microFlashesUsed: 0,
    _microFlashActiveUntil: 0,
    _microSnapshotWave: null,
    _ghostBoostUsed: false,
    _ghostDryTarget: 0.0,
    _tapTempoTargetBpm: 112,
    _tapTempoStamps: [],
    _tapTempoResultBpm: null,
    _chopperGateGain: null,
    _chopperFreqHz: 4.5,
    _chopperCurDuty: 0.24,
    _chopperIsOpen: true,
    _echoFbGain: null,
    _echoWetGain: null,
    _echoDryGain: null,
    _vinylNoiseGain: null,
    _impostorGlitchCtx: 0,
    _impostorGlitchDir: 1,
    _impostorLfoGain: null,
    _impostorTapped: false,
    _impostorLastSignedMs: null,
    _mashupTargetGain: null,
    _mashupDecoyGain: null,
    _mashupTargetPan: null,
    _mashupDecoyLabel: '',
    _mashupSoloUsed: false,
    _mashupSoloActiveUntil: 0,
    _mashupCrossVal: 0.35,
    _underwaterLp: null,
    _underwaterDepthM: 120,
    _stutterStage: 0,
    _stutterNudgesUsed: 0,
    _stutterLoopDur: 0.45,
    _stutterOffsetSec: 0,
    _stutterBounce: 0,
    _stutterCurGain: null,

    // New Trial 17: Dial FM 88-108
    _tunerTargetMhz: 98.4,
    _tunerCurMhz: 91.2,
    _tunerSignalClarity: 0,
    _tunerMusicGain: null,
    _tunerStaticGain: null,
    _tunerBpFilter: null,
    _tunerWhistleOsc: null,
    _tunerWhistleGain: null,

    // New Trial 18: Chiptune 8-Bit Melody Extractor
    _melodyContour: null,
    _melodyLeadOsc: null,
    _melodyBassOsc: null,
    _melodyLeadGain: null,
    _melodyBassGain: null,
    _melodySynthBus: null,
    _melodyLastStep: -1,
    _melodyCurNoteLabel: '---',

    // New Trial 19: Rueda Loca Rollercoaster Tape Motor
    _speedrunCurRate: 1.0,
    _speedrunPhase: 0,
    _speedrunBrakeUsed: false,
    _speedrunBrakeUntil: 0,
    _speedrunHistory: [],

    // New Trial 20: Consola EQ 3-Band Studio Isolator
    _eqActiveBand: 'high',
    _eqUsedMid: false,
    _eqBandGains: null,

    // Disciplines Patchbay Selector & Per-Trial Precision Tracking
    _selectedTrialId: 'mix',
    _lastRoundPrecision: null,

    // New Trial 21: Estéreo L/R (Dual-Track Simultaneous Identification)
    _stereoTrackB: null,
    _stereoAudioDataB: null,
    _stereoGainL: null,
    _stereoGainR: null,
    _stereoPanL: null,
    _stereoPanR: null,
    _stereoMonitorMode: 'mix',
    _stereoUsedSolo: false,
    _stereoFoundIndices: new Set(),

    // New Trial 22: Adivina el Año (Analog Studio Chronometer)
    _yearTarget: 1995,
    _yearMin: 1970,
    _yearMax: 2026,
    _yearCur: 1998,
    _yearZoomedEra: false,
    _yearPassTol: 3,
    _yearPerfectTol: 0,

    // Silence Beat Drop State
    _silenceBeatDur: 0.5,
    _silenceStartCtx: 0,
    _silenceMuteStartCtx: 0,
    _silenceTargetCtx: 0,
    _silenceLastLitBeat: -1,
    _silenceArmed: false,
    _silenceTapped: false,
    _silenceLastSignedMs: null,
    _bestPitchAccuracy: null,
    _bestSilenceErrMs: null,
    _bestBpmErr: null,

    // Active Web Audio Nodes + 3-Stage Broadcast Loudness / AGC Chain
    _roundSource: null,
    _roundNodes: [],
    _preNormGain: null,
    _dspOutBus: null,
    _preAgcAnalyser: null,
    _agcFloatBuf: null,
    _agcByteBuf: null,
    _agcGain: null,
    _agcCurrentGain: 1.0,
    _masterLimiter: null,
    _roundGain: null,
    _roundAnalyser: null,
    _roundAnalyserR: null,
    _roundFft: null,
    _roundWave: null,
    _roundWaveR: null,
    _roundFilter1: null,
    _roundFilter2: null,
    _roundWetGain: null,
    _roundDryGain: null,
    _reverseForwardSrc: null,

    // Canvas Loop & CRT Visual FX Engine
    _canvas: null,
    _ctx: null,
    _canvasW: 340,
    _canvasH: 185,
    _rafId: 0,
    _pulseFlash: 0,
    _shockwaves: [],
    _particles: [],
    _xrayPeaks: new Float32Array(40),
    _vuSmoothL: 0,
    _vuSmoothR: 0,

    // -----------------------------------------------------------------------
    // HOME STRIP SYNC & MOUNT
    // -----------------------------------------------------------------------
    syncHomeBadge() {
      const pill = document.getElementById('eaHomeBestPill');
      if (!pill) return;
      const pendingDay = this._findUnclaimedPastDailyDay();
      if (pendingDay) {
        pill.textContent = 'PREMIO DIARIO · COBRAR';
        pill.classList.add('ea-pill-reward');
        return;
      }
      pill.classList.remove('ea-pill-reward');
      const best = loadBestRecord();
      if (best && best.score > 0) {
        pill.textContent = `${best.grade} · ${best.score} PTS`;
      } else {
        pill.textContent = '22 PRUEBAS · DIARIO';
      }
    },

    _getDiff() {
      if (this._isDailyMatch) return DIFFICULTIES.normal;
      return DIFFICULTIES[this._difficulty] || DIFFICULTIES.normal;
    },

    _ensureMounted() {
      if (this._mounted) return;
      this._mounted = true;

      const saved = loadPrefs();
      if (saved.difficulty && DIFFICULTIES[saved.difficulty]) this._difficulty = saved.difficulty;
      if (saved.popularityMode === 'mixed') this._popularityMode = 'youtube';
      else if (saved.popularityMode && POPULARITY_MODES[saved.popularityMode]) this._popularityMode = saved.popularityMode;
      if (saved.eraFilter && ERA_FILTERS[saved.eraFilter]) this._eraFilter = saved.eraFilter;
      if (saved.genreFilter && GENRE_FILTERS[saved.genreFilter]) this._genreFilter = saved.genreFilter;
      if (typeof saved.artistFilter === 'string') this._artistFilter = saved.artistFilter.trim();
      if (typeof saved.ytSearchQuery === 'string') this._ytSearchQuery = saved.ytSearchQuery;
      if (saved.selectedPlaylistKey) this._selectedPlaylistKey = saved.selectedPlaylistKey;
      if (saved.selectedTrialId === 'mix' || TRIALS.some(t => t.id === saved.selectedTrialId)) {
        this._selectedTrialId = saved.selectedTrialId;
      }
      if (saved.formatMode === 'exam' || saved.formatMode === 'survival' || saved.formatMode === 'blitz') {
        this._formatMode = saved.formatMode;
      }

      const root = document.createElement('div');
      root.id = 'earArcadeModal';
      root.className = 'ea-modal-overlay';
      root.innerHTML = `
        <header class="ea-header">
          <div class="ea-header-left">
            <button type="button" id="eaCloseBtn" class="ea-icon-btn" title="Cerrar Oído Arcade">${SVG.close}</button>
            <div class="ea-brand-stack">
              <span class="ea-brand-kicker">CONSOLA DSP · OA-22</span>
              <h2 class="ea-brand-title">Oído Arcade</h2>
            </div>
          </div>
          <div class="ea-hud-stats" id="eaHudStats" style="display:none;">
            <span class="ea-led-readout blitz" id="eaHudBlitz" style="display:none;">70.0s</span>
            <span class="ea-led-readout score" id="eaHudScore">0000</span>
            <span class="ea-led-readout streak" id="eaHudStreak">x1</span>
            <span class="ea-led-readout" id="eaHudLivesWrap">
              <span class="ea-lives-row" id="eaHudLives"></span>
            </span>
          </div>
        </header>

        <main class="ea-main">
          <!-- VIEW 1: LOBBY (STRICT ZERO SCROLL) -->
          <section id="eaViewLobby" class="ea-view active">
            <div class="ea-lobby-plate">
              <div class="ea-plate-top">
                <span class="ea-plate-serial"><span class="ea-tally-dot"></span><span id="eaCatalogCountBadge">22 PRUEBAS DSP</span></span>
                <span class="ea-lobby-record" id="eaLobbyBestBadge">SIN RÉCORD</span>
              </div>
              <h1 class="ea-lobby-h1">Calibra tu oído musical</h1>
              <button type="button" id="eaTrialTriggerBtn" class="ea-trial-patch-btn" aria-label="Elegir prueba concreta y ver récords">
                <span class="ea-trial-patch-left">
                  <span class="ea-rack-trigger-led"></span>
                  <span class="ea-trial-patch-stack">
                    <span class="ea-rack-trigger-kicker">PRUEBA Y RÉCORDS</span>
                    <span class="ea-trial-patch-val" id="eaTrialTriggerVal">Mix completo (22 pruebas)</span>
                  </span>
                </span>
                <span class="ea-trial-patch-right">
                  <span class="ea-trial-patch-rec" id="eaTrialTriggerRec">22 MODOS</span>
                  <span class="ea-rack-trigger-chev">${SVG.chevron}</span>
                </span>
              </button>
            </div>

            <!-- LAS VEGAS RETO DIARIO BANNER (1 intento/día · 5 rondas iguales · Claves a las 00:00) -->
            <button type="button" id="eaDailyBannerBtn" class="ea-daily-banner" aria-label="Abrir Reto Diario de Oído Arcade">
              <span class="ea-marquee-bulbs top" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </span>
              <span class="ea-daily-banner-left">
                <span class="ea-daily-crest" id="eaDailyBannerCrest">${SVG.crown}</span>
                <span class="ea-daily-text-stack">
                  <span class="ea-daily-kicker" id="eaDailyBannerKicker">RETO DIARIO · 5 RONDAS · 00:00</span>
                  <span class="ea-daily-theme" id="eaDailyBannerTheme">Ruleta Abierta Las Vegas</span>
                </span>
              </span>
              <span class="ea-daily-banner-right">
                <span class="ea-daily-cta" id="eaDailyBannerCta">1 INTENTO</span>
              </span>
              <span class="ea-marquee-bulbs bot" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </span>
            </button>

            <div class="ea-config-bank">
              <!-- Dificultad -->
              <div class="ea-switch-group">
                <div class="ea-switch-head">
                  <span class="ea-switch-label">Dificultad</span>
                  <span class="ea-switch-hint" id="eaDiffHint">${escHtml(this._getDiff().hint)}</span>
                </div>
                <div class="ea-seg-row cols-3">
                  <button type="button" class="ea-seg-btn" data-diff="easy">
                    <span class="ea-seg-btn-main">Fácil</span>
                    <span class="ea-seg-btn-sub">24s · x0.85</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-diff="normal">
                    <span class="ea-seg-btn-main">Normal</span>
                    <span class="ea-seg-btn-sub">19s · x1.0</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-diff="hard">
                    <span class="ea-seg-btn-main">Extremo</span>
                    <span class="ea-seg-btn-sub">14s · x1.5</span>
                  </button>
                </div>
              </div>

              <!-- Canciones / Filtros Década, Estilo & Cantante / YouTube en vivo / Playlist -->
              <div class="ea-switch-group">
                <div class="ea-switch-head">
                  <span class="ea-switch-label">Canciones</span>
                  <span class="ea-switch-hint" id="eaPopHint">${escHtml(POPULARITY_MODES[this._popularityMode].hint)}</span>
                </div>
                <div class="ea-seg-row cols-4">
                  <button type="button" class="ea-seg-btn" data-pop="hits">
                    <span class="ea-seg-btn-main">Éxitos</span>
                    <span class="ea-seg-btn-sub">Top Live</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-pop="obscure">
                    <span class="ea-seg-btn-main">Ocultas</span>
                    <span class="ea-seg-btn-sub">Indie</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-pop="youtube">
                    <span class="ea-seg-btn-main">YouTube</span>
                    <span class="ea-seg-btn-sub">Todo YT</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-pop="playlist">
                    <span class="ea-seg-btn-main">Playlist</span>
                    <span class="ea-seg-btn-sub">Elegir</span>
                  </button>
                </div>
                <div id="eaFilterBar" class="ea-filter-bar cols-3 visible">
                  <button type="button" id="eaEraTriggerBtn" class="ea-rack-trigger compact" aria-label="Filtrar por década">
                    <span class="ea-rack-trigger-led"></span>
                    <span class="ea-rack-trigger-kicker">DÉCADA</span>
                    <span class="ea-rack-trigger-val" id="eaEraTriggerVal">Todas</span>
                    <span class="ea-rack-trigger-chev">${SVG.chevron}</span>
                  </button>
                  <button type="button" id="eaGenreTriggerBtn" class="ea-rack-trigger compact" aria-label="Filtrar por estilo">
                    <span class="ea-rack-trigger-led"></span>
                    <span class="ea-rack-trigger-kicker">ESTILO</span>
                    <span class="ea-rack-trigger-val" id="eaGenreTriggerVal">Todos</span>
                    <span class="ea-rack-trigger-chev">${SVG.chevron}</span>
                  </button>
                  <button type="button" id="eaArtistTriggerBtn" class="ea-rack-trigger compact" aria-label="Elegir cantante específico">
                    <span class="ea-rack-trigger-led"></span>
                    <span class="ea-rack-trigger-kicker">CANTANTE</span>
                    <span class="ea-rack-trigger-val" id="eaArtistTriggerVal">Todos</span>
                    <span class="ea-rack-trigger-chev">${SVG.chevron}</span>
                  </button>
                </div>
                <div id="eaYtSearchBar" class="ea-yt-bar">
                  <div class="ea-yt-input-wrap">
                    <span class="ea-yt-input-icon">${SVG.search}</span>
                    <input type="search" id="eaYtSearchInput" class="ea-yt-input" value="${escHtml(this._ytSearchQuery)}" placeholder="Artista, género o vacío = Todo YouTube..." autocomplete="off" spellcheck="false" enterkeyhint="go">
                    <button type="button" id="eaYtClearBtn" class="ea-yt-clear-btn" title="Borrar búsqueda">${SVG.close}</button>
                  </div>
                </div>
                <div id="eaPlaylistBar" class="ea-playlist-bar">
                  <button type="button" id="eaPlaylistTriggerBtn" class="ea-rack-trigger full active-filter" aria-label="Elegir playlist para jugar">
                    <span class="ea-rack-trigger-led"></span>
                    <span class="ea-rack-trigger-kicker">PLAYLIST</span>
                    <span class="ea-rack-trigger-val" id="eaPlaylistTriggerVal">Elegir playlist</span>
                    <span class="ea-rack-trigger-chev">${SVG.chevron}</span>
                  </button>
                </div>
              </div>

              <!-- Formato -->
              <div class="ea-switch-group">
                <div class="ea-switch-head">
                  <span class="ea-switch-label">Formato</span>
                  <span class="ea-switch-hint" id="eaFormatHint">8 pruebas variadas + Rango</span>
                </div>
                <div class="ea-seg-row cols-3">
                  <button type="button" class="ea-seg-btn" data-format="exam">
                    <span class="ea-seg-btn-main">Examen (8)</span>
                    <span class="ea-seg-btn-sub">Rango</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-format="survival">
                    <span class="ea-seg-btn-main">Superviv.</span>
                    <span class="ea-seg-btn-sub">Infinito</span>
                  </button>
                  <button type="button" class="ea-seg-btn" data-format="blitz">
                    <span class="ea-seg-btn-main" id="eaBlitzBtnMain">Blitz 70s</span>
                    <span class="ea-seg-btn-sub">Contrarreloj</span>
                  </button>
                </div>
              </div>
            </div>

            <button type="button" id="eaStartBtn" class="ea-start-btn">
              ${SVG.play}
              <span>Iniciar Prueba</span>
            </button>
          </section>

          <!-- VIEW 2: GAMEPLAY (STRICT ZERO SCROLL) -->
          <section id="eaViewPlay" class="ea-view">
            <div class="ea-round-bar">
              <span class="ea-trial-badge" id="eaTrialBadge">CH-01 · CLAVA EL TONO</span>
              <div class="ea-round-pips" id="eaRoundPips"></div>
            </div>

            <div class="ea-timer-track">
              <div class="ea-timer-fill" id="eaTimerFill"></div>
            </div>

            <div class="ea-stage-box" id="eaStageBox">
              <canvas id="eaStageCanvas"></canvas>
              <div class="ea-stage-overlay-top">
                <span class="ea-stage-telemetry" id="eaTelemetryLabel">DSP ACTIVO</span>
                <span class="ea-stage-mult" id="eaLiveMultBadge">x3.0</span>
              </div>
              <div class="ea-stage-loader" id="eaStageLoader">
                <div class="ea-spinner"></div>
                <div class="ea-loader-text" id="eaLoaderText">Sintonizando cinta...</div>
              </div>
              <div id="eaFeedbackCard" class="ea-feedback-card">
                <div class="ea-fb-sleeve" id="eaFbSleeve">
                  <img id="eaFbCover" class="ea-fb-cover" src="./app_logo.png" alt="">
                </div>
                <div class="ea-fb-info">
                  <div id="eaFbVerdict" class="ea-fb-verdict">Oído Absoluto</div>
                  <div id="eaFbTrack" class="ea-fb-track">Canción - Artista</div>
                </div>
                <button type="button" id="eaFbNextBtn" class="ea-fb-next-btn">Seguir</button>
              </div>
            </div>

            <div class="ea-prompt-block">
              <h3 class="ea-prompt-title" id="eaPromptTitle">Clava el tono original</h3>
              <p class="ea-prompt-sub" id="eaPromptSub">Ajusta el fader de oído sin ver el número</p>
            </div>

            <div id="eaInteractionZone"></div>
          </section>

          <!-- VIEW 3: SUMMARY CERTIFICATE (STRICT ZERO SCROLL) -->
          <section id="eaViewSummary" class="ea-view">
            <div class="ea-cert-card">
              <div class="ea-cert-top">
                <div class="ea-rank-stamp" id="eaSumGrade">S+</div>
                <div class="ea-cert-meta">
                  <div class="ea-cert-tags" id="eaSumTags">NORMAL · ÉXITOS</div>
                  <h2 class="ea-rank-title" id="eaSumTitle">Oído Absoluto</h2>
                  <div class="ea-rank-score" id="eaSumScore">0 PUNTOS</div>
                </div>
              </div>
              <div class="ea-metrics-grid">
                <div class="ea-metric-box">
                  <div class="ea-metric-val" id="eaSumHits">0/8</div>
                  <div class="ea-metric-lbl">Aciertos</div>
                </div>
                <div class="ea-metric-box">
                  <div class="ea-metric-val" id="eaSumPitch">--</div>
                  <div class="ea-metric-lbl">Tono / BPM</div>
                </div>
                <div class="ea-metric-box">
                  <div class="ea-metric-val" id="eaSumPulse">--</div>
                  <div class="ea-metric-lbl">Pulso</div>
                </div>
              </div>
            </div>

            <div class="ea-summary-actions">
              <button type="button" id="eaShareCardBtn" class="ea-btn-secondary">
                ${SVG.share}
                <span>Tarjeta</span>
              </button>
              <button type="button" id="eaReplayBtn" class="ea-btn-replay">
                ${SVG.replay}
                <span>Repetir</span>
              </button>
              <button type="button" id="eaBackLobbyBtn" class="ea-btn-config" title="Cambiar modo o playlist">
                ${SVG.sliders}
              </button>
            </div>

            <div class="ea-disc-head">Pistas de esta sesión · Guarda o toca al piano</div>
            <div id="eaDiscoveryList" class="ea-discovery-list"></div>
          </section>

          <!-- VIEW 4: LAS VEGAS DAILY RANKING (STRICT ZERO SCROLL) -->
          <section id="eaViewDailyRank" class="ea-view">
            <div class="ea-vegas-marquee">
              <span class="ea-marquee-bulbs top" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </span>
              <div class="ea-vegas-marquee-inner">
                <div class="ea-vegas-top-row">
                  <span class="ea-vegas-date-pill" id="eaDailyRankDate">HOY</span>
                  <span class="ea-vegas-clock-pill" id="eaDailyCountdown">${SVG.clock}<span>00:00:00</span></span>
                </div>
                <h2 class="ea-vegas-title">GRAND PRIX DIARIO</h2>
                <div class="ea-vegas-subtitle" id="eaDailyRankTheme">Ruleta Abierta Las Vegas · 5 Rondas Compartidas</div>
              </div>
              <span class="ea-marquee-bulbs bot" aria-hidden="true">
                <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
              </span>
            </div>

            <!-- My Daily Status Plaque -->
            <div class="ea-daily-my-plaque" id="eaDailyMyPlaque">
              <div class="ea-my-plaque-left">
                <span class="ea-my-plaque-rank" id="eaDailyMyRank">#--</span>
                <div class="ea-my-plaque-meta">
                  <div class="ea-my-plaque-name" id="eaDailyMyName">Tu posición hoy</div>
                  <div class="ea-my-plaque-sub" id="eaDailyMySub">1 intento diario · Premio a las 00:00</div>
                </div>
              </div>
              <div class="ea-my-plaque-prize" id="eaDailyMyPrize">
                <span class="ea-my-prize-amt" id="eaDailyMyClefs">+0</span>
                <span class="ea-my-prize-lbl">CLAVES 00:00</span>
              </div>
            </div>

            <!-- VIP Podium #2 / #1 / #3 -->
            <div class="ea-vegas-podium" id="eaDailyPodium"></div>

            <!-- Scrollable Velvet Leaderboard List -->
            <div class="ea-vegas-board-wrap">
              <div class="ea-vegas-board-head">
                <span>CLASIFICACIÓN OFICIAL</span>
                <span id="eaDailyTotalPlayers">0 JUGADORES</span>
              </div>
              <div class="ea-vegas-board-list" id="eaDailyRankList"></div>
            </div>

            <!-- Compact Claves Payout Table Strip -->
            <div class="ea-paytable-strip" aria-label="Tabla de premios en Claves a las 00:00">
              <span class="ea-pay-chip gold">#1 · 350 CLAVES</span>
              <span class="ea-pay-chip silver">#2 · 240</span>
              <span class="ea-pay-chip bronze">#3 · 175</span>
              <span class="ea-pay-chip">#4-5 · 120</span>
              <span class="ea-pay-chip">#6-10 · 80</span>
              <span class="ea-pay-chip">#11+ · 45</span>
            </div>

            <div class="ea-daily-rank-actions">
              <button type="button" id="eaDailyBackLobbyBtn" class="ea-btn-secondary">
                ${SVG.sliders}
                <span>Estudio</span>
              </button>
              <button type="button" id="eaDailyPrimaryActionBtn" class="ea-btn-vegas-gold">
                ${SVG.crown}
                <span id="eaDailyPrimaryActionTxt">Jugar Reto de Hoy</span>
              </button>
            </div>
          </section>
        </main>

        <!-- LAS VEGAS PRIZE CEREMONY OVERLAY (00:00 CLAVES PAYOUT VAULT) -->
        <div id="eaPrizeOverlay" class="ea-prize-overlay" aria-hidden="true">
          <canvas id="eaPrizeCanvas" class="ea-prize-canvas"></canvas>
          <div class="ea-prize-vault" role="dialog" aria-modal="true" aria-labelledby="eaPrizeHeading">
            <span class="ea-marquee-bulbs top" aria-hidden="true">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </span>
            <div class="ea-prize-vault-inner">
              <div class="ea-prize-kicker" id="eaPrizeDayLabel">PREMIO DIARIO · CIERRE 00:00</div>
              <h2 class="ea-prize-heading" id="eaPrizeHeading">BÓVEDA LAS VEGAS</h2>
              <div class="ea-prize-theme" id="eaPrizeThemeLabel">Ruleta Abierta Las Vegas</div>

              <div class="ea-prize-crest-stage">
                <div class="ea-prize-sunburst" aria-hidden="true"></div>
                <div class="ea-prize-medal" id="eaPrizeMedal">
                  <span class="ea-prize-medal-icon">${SVG.trophy}</span>
                  <span class="ea-prize-medal-rank" id="eaPrizeRankNum">#1</span>
                </div>
              </div>

              <div class="ea-prize-tier-badge" id="eaPrizeTierBadge">CORONA DE ORO</div>
              <div class="ea-prize-stats-line" id="eaPrizeStatsLine">0 PTS · 5/5 ACIERTOS · DE 1 JUGADORES</div>

              <div class="ea-prize-payout-box">
                <span class="ea-prize-payout-lbl">RECOMPENSA ACREDITADA</span>
                <div class="ea-prize-payout-row">
                  <span class="ea-prize-clef-ico">${SVG.clef}</span>
                  <span class="ea-prize-amount" id="eaPrizeAmount">+0</span>
                  <span class="ea-prize-unit">CLAVES</span>
                </div>
              </div>

              <button type="button" id="eaPrizeClaimBtn" class="ea-prize-claim-btn">
                <span>COBRAR CLAVES</span>
              </button>
              <button type="button" id="eaPrizeContinueBtn" class="ea-prize-continue-btn" style="display:none;">
                <span>CONTINUAR AL RETO DE HOY</span>
              </button>
            </div>
            <span class="ea-marquee-bulbs bot" aria-hidden="true">
              <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            </span>
          </div>
        </div>

        <!-- BESPOKE ANALOG STUDIO RACK SHEET (Filters, Artists, Playlists & Trials) -->
        <div id="eaSheetBackdrop" class="ea-sheet-backdrop" aria-hidden="true">
          <div id="eaSheetPanel" class="ea-sheet-panel" role="dialog" aria-modal="true">
            <div class="ea-sheet-handle"></div>
            <div class="ea-sheet-header">
              <div class="ea-sheet-title-wrap">
                <span class="ea-sheet-kicker" id="eaSheetKicker">RACK DE FILTROS</span>
                <h3 class="ea-sheet-title" id="eaSheetTitle">Filtros Musicales</h3>
              </div>
              <div class="ea-sheet-head-actions">
                <button type="button" id="eaSheetResetBtn" class="ea-sheet-reset-btn">Limpiar</button>
                <button type="button" id="eaSheetCloseBtn" class="ea-icon-btn ea-sheet-close" title="Cerrar">${SVG.close}</button>
              </div>
            </div>
            <div id="eaSheetBody" class="ea-sheet-body"></div>
            <div class="ea-sheet-footer" id="eaSheetFooter">
              <span class="ea-sheet-status" id="eaSheetStatus">Catálogo completo listo</span>
              <button type="button" id="eaSheetApplyBtn" class="ea-sheet-apply-btn">Aplicar</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(root);

      this._canvas = document.getElementById('eaStageCanvas');
      this._ctx = this._canvas.getContext('2d', { alpha: false });
      this._bindEvents();
      this._syncLobbySelectorsUI();
    },

    async _refreshPlaylistsAndCatalog() {
      const fullCatalog = this._collectEntireAppCatalog();
      this._allCatalogCache = fullCatalog;

      const countBadge = document.getElementById('eaCatalogCountBadge');
      if (countBadge) {
        countBadge.textContent = '22 PRUEBAS · TODO YOUTUBE';
      }

      const playlists = [];
      // 1. User custom playlists from IndexedDB
      try {
        if (window.IndexedDBStorage && typeof window.IndexedDBStorage.getAllPlaylists === 'function') {
          const userPls = await window.IndexedDBStorage.getAllPlaylists();
          if (Array.isArray(userPls)) {
            userPls.forEach(pl => {
              const tracks = Array.isArray(pl?.tracks) ? pl.tracks.filter(t => t && t.title) : [];
              if (tracks.length >= 1) {
                playlists.push({
                  key: `user:${pl.id}`,
                  group: 'Tus Playlists',
                  title: pl.title || 'Mi Playlist',
                  tracks
                });
              }
            });
          }
        }
      } catch (_) {}

      // 2. Liked songs ("Tus Me Gusta")
      const favIds = window.favoriteIdsSet || new Set();
      const recent = (window.SpotifySuite && typeof window.SpotifySuite.getRecentTracks === 'function')
        ? (window.SpotifySuite.getRecentTracks() || [])
        : [];
      const favMap = new Map();
      [...fullCatalog, ...recent].forEach(t => {
        if (t && favIds.has(t.id)) favMap.set(trackSig(t), t);
      });
      if (favMap.size >= 1) {
        playlists.push({
          key: 'favs',
          group: 'Tus Playlists',
          title: 'Tus Me Gusta',
          tracks: Array.from(favMap.values())
        });
      }

      if (recent.length >= 2) {
        playlists.push({
          key: 'recent',
          group: 'Tus Playlists',
          title: 'Escuchado Recientemente',
          tracks: recent
        });
      }

      // 3. All Curated Genre Playlists from window.CURATED_PLAYLIST_DATABASE
      if (window.CURATED_PLAYLIST_DATABASE && typeof window.CURATED_PLAYLIST_DATABASE === 'object') {
        Object.entries(window.CURATED_PLAYLIST_DATABASE).forEach(([cid, pl]) => {
          const tracks = Array.isArray(pl?.tracks) ? pl.tracks.filter(t => t && t.title) : [];
          if (tracks.length >= 4) {
            playlists.push({
              key: `curated:${cid}`,
              group: 'Playlists Tematicas',
              title: pl.title || 'Coleccion',
              tracks
            });
          }
        });
      }

      this._availablePlaylists = playlists;
      if (playlists.length > 0) {
        const exists = playlists.some(p => p.key === this._selectedPlaylistKey);
        if (!exists) this._selectedPlaylistKey = playlists[0].key;
      }
      this._syncLobbySelectorsUI();
      if (this._activeSheet === 'playlist') this._renderStudioSheetContent();
    },

    _getActiveFilterTag() {
      const parts = [];
      const era = ERA_FILTERS[this._eraFilter];
      const gen = GENRE_FILTERS[this._genreFilter];
      if (this._artistFilter && this._popularityMode !== 'playlist') parts.push(this._artistFilter);
      if (era && era.short) parts.push(era.label);
      if (gen && gen.short) parts.push(gen.label);
      return parts.join(' · ');
    },

    _openStudioSheet(kind) {
      this._activeSheet = kind;
      this._renderStudioSheetContent();
      const backdrop = document.getElementById('eaSheetBackdrop');
      if (backdrop) {
        backdrop.setAttribute('aria-hidden', 'false');
        backdrop.classList.add('open');
      }
      this._playSfx('click');
    },

    _closeStudioSheet() {
      this._activeSheet = null;
      const backdrop = document.getElementById('eaSheetBackdrop');
      if (backdrop) {
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
      }
    },

    _countLocalFilteredMatches() {
      const full = this._allCatalogCache && this._allCatalogCache.length > 0
        ? this._allCatalogCache
        : this._collectEntireAppCatalog();
      if (!this._hasActiveMusicalFilters()) return full.length;
      const customQ = this._popularityMode === 'youtube' ? (this._ytSearchQuery || '').trim() : '';
      const fKey = this._getFilterCacheKey(this._popularityMode, customQ);
      const cached = this._liveFilterCache.get(fKey) || [];
      const seen = new Set();
      let count = 0;
      const addIfOk = t => {
        if (!t || !this._trackMatchesActiveFilters(t)) return;
        const s = trackSig(t);
        if (!s || seen.has(s)) return;
        seen.add(s);
        count++;
      };
      cached.forEach(addIfOk);
      full.forEach(addIfOk);
      return count;
    },

    _renderStudioSheetContent() {
      const kicker = document.getElementById('eaSheetKicker');
      const title = document.getElementById('eaSheetTitle');
      const body = document.getElementById('eaSheetBody');
      const resetBtn = document.getElementById('eaSheetResetBtn');
      const footer = document.getElementById('eaSheetFooter');
      const status = document.getElementById('eaSheetStatus');
      if (!body) return;

      if (this._activeSheet === 'filters') {
        if (kicker) kicker.textContent = 'RACK DE FILTROS · SIN MEZCLAS';
        if (title) title.textContent = 'Década y Estilo';
        if (resetBtn) {
          resetBtn.style.display = this._hasActiveMusicalFilters() ? 'inline-flex' : 'none';
        }
        if (footer) footer.style.display = 'flex';

        const eras = Object.values(ERA_FILTERS);
        const genres = Object.values(GENRE_FILTERS);
        body.innerHTML = `
          <div class="ea-sheet-section">
            <div class="ea-sheet-sec-label">DÉCADA ORIGINAL</div>
            <div class="ea-pill-grid cols-3">
              ${eras.map(e => `
                <button type="button" class="ea-rack-pill ${this._eraFilter === e.id ? 'selected' : ''}" data-sheet-era="${escHtml(e.id)}">
                  <span class="ea-rack-pill-led"></span>
                  <span>${escHtml(e.label)}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="ea-sheet-section">
            <div class="ea-sheet-sec-label">ESTILO MUSICAL</div>
            <div class="ea-pill-grid cols-3">
              ${genres.map(g => `
                <button type="button" class="ea-rack-pill ${this._genreFilter === g.id ? 'selected' : ''}" data-sheet-genre="${escHtml(g.id)}">
                  <span class="ea-rack-pill-led"></span>
                  <span>${escHtml(g.label)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `;

        if (status) {
          const n = this._countLocalFilteredMatches();
          const tag = this._getActiveFilterTag();
          status.textContent = tag
            ? `${tag} · ${n} verificados + búsqueda en vivo`
            : 'Catálogo completo + YouTube en vivo';
        }

        body.querySelectorAll('[data-sheet-era]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-sheet-era') || 'all';
            this._eraFilter = ERA_FILTERS[id] ? id : 'all';
            this._saveCurrentPrefs();
            this._syncLobbySelectorsUI();
            this._renderStudioSheetContent();
            this._scheduleLobbyWarmup(140);
            this._playSfx('click');
          });
        });

        body.querySelectorAll('[data-sheet-genre]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-sheet-genre') || 'all';
            this._genreFilter = GENRE_FILTERS[id] ? id : 'all';
            this._saveCurrentPrefs();
            this._syncLobbySelectorsUI();
            this._renderStudioSheetContent();
            this._scheduleLobbyWarmup(140);
            this._playSfx('click');
          });
        });
      } else if (this._activeSheet === 'playlist') {
        if (kicker) kicker.textContent = 'SELECTOR DE PLAYLIST';
        if (title) title.textContent = 'Elige una Playlist';
        if (resetBtn) resetBtn.style.display = 'none';
        if (footer) footer.style.display = 'none';

        if (!this._availablePlaylists || this._availablePlaylists.length === 0) {
          body.innerHTML = '<div class="ea-sheet-empty">Aún no tienes playlists guardadas.</div>';
          return;
        }

        const userGroup = this._availablePlaylists.filter(p => p.group === 'Tus Playlists');
        const curatedGroup = this._availablePlaylists.filter(p => p.group !== 'Tus Playlists');

        const renderRows = (list) => list.map(p => {
          const active = p.key === this._selectedPlaylistKey;
          return `
            <button type="button" class="ea-sheet-pl-row ${active ? 'selected' : ''}" data-sheet-pl="${escHtml(p.key)}">
              <span class="ea-sheet-pl-main">
                <span class="ea-rack-pill-led"></span>
                <span class="ea-sheet-pl-name">${escHtml(p.title)}</span>
              </span>
              <span class="ea-sheet-pl-meta">
                <span class="ea-sheet-pl-count">${p.tracks.length} temas</span>
                ${active ? `<span class="ea-sheet-pl-check">${SVG.check}</span>` : ''}
              </span>
            </button>
          `;
        }).join('');

        let html = '';
        if (userGroup.length > 0) {
          html += `<div class="ea-sheet-section"><div class="ea-sheet-sec-label">TUS PLAYLISTS</div><div class="ea-sheet-pl-list">${renderRows(userGroup)}</div></div>`;
        }
        if (curatedGroup.length > 0) {
          html += `<div class="ea-sheet-section"><div class="ea-sheet-sec-label">PLAYLISTS TEMÁTICAS</div><div class="ea-sheet-pl-list">${renderRows(curatedGroup)}</div></div>`;
        }
        body.innerHTML = html;

        body.querySelectorAll('[data-sheet-pl]').forEach(btn => {
          btn.addEventListener('click', () => {
            this._selectedPlaylistKey = btn.getAttribute('data-sheet-pl') || '';
            this._saveCurrentPrefs();
            this._syncLobbySelectorsUI();
            this._scheduleLobbyWarmup(160);
            this._playSfx('click');
            this._closeStudioSheet();
          });
        });
      } else if (this._activeSheet === 'trials') {
        if (kicker) kicker.textContent = 'PATCHBAY DE DISCIPLINAS · 22 MODOS';
        if (title) title.textContent = 'Pruebas y Récords';
        if (resetBtn) {
          resetBtn.style.display = this._selectedTrialId !== 'mix' ? 'inline-flex' : 'none';
        }
        if (footer) footer.style.display = 'none';

        const records = loadTrialRecords();
        let totalPlayed = 0;
        let totalWon = 0;
        let unlockedCount = 0;
        Object.values(records).forEach(r => {
          if (r && r.played > 0) {
            totalPlayed += r.played;
            totalWon += (r.won || 0);
            unlockedCount += 1;
          }
        });
        const globalAcc = totalPlayed > 0 ? `${Math.round((totalWon / totalPlayed) * 100)}% global` : '22 disciplinas DSP';

        const isMix = this._selectedTrialId === 'mix';
        const cardsHtml = TRIALS.map((t, idx) => {
          const rec = records[t.id];
          const selected = this._selectedTrialId === t.id;
          const ch = `CH-${String(idx + 1).padStart(2, '0')}`;
          const recTxt = formatTrialRecordSummary(rec);
          const hasRec = Boolean(rec && rec.played > 0);
          return `
            <button type="button" class="ea-trial-card ${selected ? 'selected' : ''} ${t.isNew ? 'is-new' : ''}" data-sheet-trial="${escHtml(t.id)}">
              <div class="ea-trial-card-top">
                <span class="ea-trial-card-ch">${ch}</span>
                ${t.isNew ? '<span class="ea-trial-card-new">NUEVO</span>' : `<span class="ea-trial-card-ico">${SVG[t.id] || SVG.pitch}</span>`}
              </div>
              <div class="ea-trial-card-name">${escHtml(t.name)}</div>
              <div class="ea-trial-card-desc">${escHtml(t.desc || '')}</div>
              <div class="ea-trial-card-rec ${hasRec ? 'has-rec' : ''}">${escHtml(recTxt)}</div>
            </button>
          `;
        }).join('');

        body.innerHTML = `
          <button type="button" class="ea-trial-mix-card ${isMix ? 'selected' : ''}" data-sheet-trial="mix">
            <span class="ea-trial-mix-left">
              <span class="ea-rack-pill-led"></span>
              <span class="ea-trial-mix-meta">
                <span class="ea-trial-mix-title">Mix completo (22 pruebas)</span>
                <span class="ea-trial-mix-sub">Rotación variada de todas las pruebas · ${escHtml(globalAcc)}</span>
              </span>
            </span>
            <span class="ea-sheet-pl-count">${unlockedCount}/${TRIALS.length}</span>
          </button>
          <div class="ea-sheet-section">
            <div class="ea-sheet-sec-label">ENTRENAR UNA DISCIPLINA CONCRETA</div>
            <div class="ea-trial-cards-grid">${cardsHtml}</div>
          </div>
        `;

        body.querySelectorAll('[data-sheet-trial]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-sheet-trial') || 'mix';
            this._selectedTrialId = (id === 'mix' || TRIALS.some(t => t.id === id)) ? id : 'mix';
            this._saveCurrentPrefs();
            this._syncLobbySelectorsUI();
            this._playSfx('click');
            this._closeStudioSheet();
          });
        });
      } else if (this._activeSheet === 'artist') {
        if (kicker) kicker.textContent = 'MODO NORMAL · DISCOGRAFÍA COMPLETA';
        if (title) title.textContent = 'Elegir Cantante o Banda';
        if (resetBtn) {
          resetBtn.style.display = this._artistFilter ? 'inline-flex' : 'none';
        }
        if (footer) footer.style.display = 'none';

        const activeNorm = normalizeArtistQuery(this._artistFilter);
        const curVal = this._artistFilter || '';

        // Combine popular singers with top artists present in the verified vault
        const seenA = new Set();
        const artistChips = [];
        const pushA = name => {
          const clean = String(name || '').trim();
          const key = normalizeArtistQuery(clean);
          if (!key || seenA.has(key)) return;
          seenA.add(key);
          artistChips.push(clean);
        };
        if (curVal) pushA(curVal);
        POPULAR_ARTISTS.forEach(pushA);

        body.innerHTML = `
          <div class="ea-sheet-section">
            <div class="ea-sheet-sec-label">BUSCAR CUALQUIER CANTANTE O GRUPO</div>
            <div class="ea-artist-search-row">
              <div class="ea-yt-input-wrap ea-artist-input-wrap">
                <span class="ea-yt-input-icon">${SVG.mic}</span>
                <input type="search" id="eaArtistSearchInput" class="ea-yt-input" value="${escHtml(curVal)}" placeholder="Ej: Queen, Bad Bunny, Estopa, Adele..." autocomplete="off" spellcheck="false" enterkeyhint="done">
                <button type="button" id="eaArtistSearchClear" class="ea-yt-clear-btn ${curVal ? 'visible' : ''}" title="Quitar cantante">${SVG.close}</button>
              </div>
              <button type="button" id="eaArtistConfirmBtn" class="ea-artist-confirm-btn">Fijar</button>
            </div>
            <div class="ea-artist-note">Todas las rondas y las 4 opciones serán exclusivamente del cantante elegido (solo en modo normal).</div>
          </div>
          <div class="ea-sheet-section">
            <div class="ea-sheet-sec-label">CANTANTES DESTACADOS</div>
            <div class="ea-artist-grid" id="eaArtistGrid">
              <button type="button" class="ea-artist-chip ${!activeNorm ? 'selected' : ''}" data-sheet-artist="">
                <span class="ea-rack-pill-led"></span>
                <span>Todos los artistas</span>
              </button>
              ${artistChips.map(name => `
                <button type="button" class="ea-artist-chip ${activeNorm === normalizeArtistQuery(name) ? 'selected' : ''}" data-sheet-artist="${escHtml(name)}">
                  <span class="ea-rack-pill-led"></span>
                  <span>${escHtml(name)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        `;

        const selectArtist = (rawName) => {
          const clean = String(rawName || '').trim().slice(0, 48);
          this._artistFilter = clean;
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
          this._playSfx('click');
          if (clean) {
            // Warm up discography immediately so Start feels instantaneous
            this._fetchArtistDiscographyTracks(clean).catch(() => {});
          }
          this._closeStudioSheet();
        };

        const inp = document.getElementById('eaArtistSearchInput');
        const clr = document.getElementById('eaArtistSearchClear');
        const cfm = document.getElementById('eaArtistConfirmBtn');
        const grid = document.getElementById('eaArtistGrid');

        if (inp) {
          inp.addEventListener('input', () => {
            const q = normalizeArtistQuery(inp.value);
            if (clr) clr.classList.toggle('visible', Boolean(inp.value.trim()));
            if (grid) {
              grid.querySelectorAll('.ea-artist-chip[data-sheet-artist]').forEach(ch => {
                const aName = ch.getAttribute('data-sheet-artist') || '';
                if (!aName) { ch.style.display = q ? 'none' : ''; return; }
                ch.style.display = (!q || normalizeArtistQuery(aName).includes(q)) ? '' : 'none';
              });
            }
          });
          inp.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              selectArtist(inp.value);
            }
          });
        }
        if (clr) {
          clr.addEventListener('click', () => {
            if (inp) inp.value = '';
            selectArtist('');
          });
        }
        if (cfm) {
          cfm.addEventListener('click', () => {
            selectArtist(inp ? inp.value : '');
          });
        }
        body.querySelectorAll('[data-sheet-artist]').forEach(btn => {
          btn.addEventListener('click', () => {
            selectArtist(btn.getAttribute('data-sheet-artist') || '');
          });
        });
      }
    },

    _syncDailyBannerUI() {
      const banner = document.getElementById('eaDailyBannerBtn');
      const kickerEl = document.getElementById('eaDailyBannerKicker');
      const themeEl = document.getElementById('eaDailyBannerTheme');
      const ctaEl = document.getElementById('eaDailyBannerCta');
      if (!banner) return;

      const todayKey = getEarDailyDayKey();
      const theme = this._getDailyThemeForDay(todayKey);
      const localDaily = loadDailyLocalState();
      const pendingDay = this._findUnclaimedPastDailyDay();
      const playedToday = localDaily.playedByDay[todayKey] || null;

      banner.classList.remove('is-played', 'is-reward');
      if (pendingDay) {
        banner.classList.add('is-reward');
        if (kickerEl) kickerEl.textContent = `PREMIO 00:00 LISTO · ${formatDayKeyHuman(pendingDay)}`;
        if (themeEl) themeEl.textContent = 'Abre la Bóveda Las Vegas y cobra tus Claves';
        if (ctaEl) ctaEl.textContent = 'COBRAR PREMIO';
      } else if (playedToday) {
        banner.classList.add('is-played');
        const rkTxt = playedToday.rank ? `PUESTO #${playedToday.rank}` : 'COMPLETADO';
        if (kickerEl) kickerEl.textContent = `RETO DIARIO COMPLETADO · ${playedToday.score || 0} PTS`;
        if (themeEl) themeEl.textContent = theme.title;
        if (ctaEl) ctaEl.textContent = `${rkTxt} · VER`;
      } else {
        if (kickerEl) kickerEl.textContent = `RETO DIARIO · 5 RONDAS · CIERRE 00:00`;
        if (themeEl) themeEl.textContent = theme.title;
        if (ctaEl) ctaEl.textContent = '1 INTENTO HOY';
      }
    },

    _syncLobbySelectorsUI() {
      this._syncDailyBannerUI();

      document.querySelectorAll('.ea-seg-btn[data-diff]').forEach(b => {
        b.classList.toggle('selected', b.getAttribute('data-diff') === this._difficulty);
      });
      document.querySelectorAll('.ea-seg-btn[data-pop]').forEach(b => {
        b.classList.toggle('selected', b.getAttribute('data-pop') === this._popularityMode);
      });
      document.querySelectorAll('.ea-seg-btn[data-format]').forEach(b => {
        b.classList.toggle('selected', b.getAttribute('data-format') === this._formatMode);
      });

      const plBar = document.getElementById('eaPlaylistBar');
      if (plBar) plBar.classList.toggle('visible', this._popularityMode === 'playlist');

      const ytBar = document.getElementById('eaYtSearchBar');
      if (ytBar) ytBar.classList.toggle('visible', this._popularityMode === 'youtube');

      const fltBar = document.getElementById('eaFilterBar');
      if (fltBar) fltBar.classList.toggle('visible', this._popularityMode !== 'playlist');

      const eraBtn = document.getElementById('eaEraTriggerBtn');
      const eraVal = document.getElementById('eaEraTriggerVal');
      const eraObj = ERA_FILTERS[this._eraFilter] || ERA_FILTERS.all;
      if (eraVal) eraVal.textContent = eraObj.label;
      if (eraBtn) eraBtn.classList.toggle('active-filter', this._eraFilter !== 'all');

      const genBtn = document.getElementById('eaGenreTriggerBtn');
      const genVal = document.getElementById('eaGenreTriggerVal');
      const genObj = GENRE_FILTERS[this._genreFilter] || GENRE_FILTERS.all;
      if (genVal) genVal.textContent = genObj.label;
      if (genBtn) genBtn.classList.toggle('active-filter', this._genreFilter !== 'all');

      const artBtn = document.getElementById('eaArtistTriggerBtn');
      const artVal = document.getElementById('eaArtistTriggerVal');
      if (artVal) artVal.textContent = this._artistFilter ? this._artistFilter : 'Todos';
      if (artBtn) artBtn.classList.toggle('active-filter', Boolean(this._artistFilter));

      const plVal = document.getElementById('eaPlaylistTriggerVal');
      const chosenPl = this._availablePlaylists.find(p => p.key === this._selectedPlaylistKey) || this._availablePlaylists[0];
      if (plVal) {
        plVal.textContent = chosenPl ? `${chosenPl.title} (${chosenPl.tracks.length})` : 'Sin playlists aún';
      }

      const ytClear = document.getElementById('eaYtClearBtn');
      if (ytClear) ytClear.classList.toggle('visible', Boolean((this._ytSearchQuery || '').trim()));

      const diff = this._getDiff();
      const dh = document.getElementById('eaDiffHint');
      if (dh) dh.textContent = diff.hint;

      const blitzBtn = document.getElementById('eaBlitzBtnMain');
      if (blitzBtn) blitzBtn.textContent = `Blitz ${diff.blitzSec}s`;

      const ph = document.getElementById('eaPopHint');
      if (ph) {
        const fTag = this._getActiveFilterTag();
        if (this._popularityMode === 'playlist') {
          ph.textContent = chosenPl ? `${chosenPl.tracks.length} temas seleccionados` : 'Elige tu playlist';
        } else if (this._popularityMode === 'youtube') {
          const q = (this._ytSearchQuery || '').trim();
          if (q) ph.textContent = `YT: "${q.slice(0, 16)}"${fTag ? ` · ${fTag}` : ''}`;
          else ph.textContent = fTag ? `YouTube verificado · ${fTag}` : 'Todo el catálogo infinito de YouTube';
        } else if (POPULARITY_MODES[this._popularityMode]) {
          ph.textContent = fTag
            ? `${POPULARITY_MODES[this._popularityMode].label} · ${fTag}`
            : POPULARITY_MODES[this._popularityMode].hint;
        }
      }

      const lockedTrial = this._selectedTrialId !== 'mix'
        ? TRIALS.find(t => t.id === this._selectedTrialId)
        : null;
      const trialBtn = document.getElementById('eaTrialTriggerBtn');
      const trialVal = document.getElementById('eaTrialTriggerVal');
      const trialRec = document.getElementById('eaTrialTriggerRec');
      const records = loadTrialRecords();
      if (trialBtn) trialBtn.classList.toggle('active-filter', Boolean(lockedTrial));
      if (trialVal) {
        if (lockedTrial) {
          const chIdx = TRIALS.indexOf(lockedTrial) + 1;
          trialVal.textContent = `Solo CH-${String(chIdx).padStart(2, '0')} · ${lockedTrial.name}`;
        } else {
          trialVal.textContent = `Mix completo (${TRIALS.length} pruebas)`;
        }
      }
      if (trialRec) {
        if (lockedTrial) {
          trialRec.textContent = formatTrialRecordSummary(records[lockedTrial.id]).toUpperCase();
        } else {
          const mastered = Object.values(records).filter(r => r && r.played > 0).length;
          trialRec.textContent = mastered > 0 ? `${mastered}/${TRIALS.length} MARCAS` : 'VER RÉCORDS';
        }
      }

      const startBtnSpan = document.querySelector('#eaStartBtn span');
      if (startBtnSpan) {
        startBtnSpan.textContent = lockedTrial ? `Jugar: ${lockedTrial.name}` : 'Iniciar Prueba';
      }

      const fh = document.getElementById('eaFormatHint');
      if (fh) {
        if (lockedTrial) {
          if (this._formatMode === 'exam') fh.textContent = `8 rondas de ${lockedTrial.name}`;
          else if (this._formatMode === 'survival') fh.textContent = `Infinito · Solo ${lockedTrial.name}`;
          else fh.textContent = `${diff.blitzSec}s · Solo ${lockedTrial.name}`;
        } else {
          if (this._formatMode === 'exam') fh.textContent = '8 pruebas variadas + Rango';
          else if (this._formatMode === 'survival') fh.textContent = `Infinito · ${diff.lives} vidas · Multiplicador`;
          else fh.textContent = `${diff.blitzSec}s contrarreloj · +2s por acierto`;
        }
      }
    },

    _saveCurrentPrefs() {
      savePrefs({
        difficulty: this._difficulty,
        popularityMode: this._popularityMode,
        eraFilter: this._eraFilter,
        genreFilter: this._genreFilter,
        artistFilter: this._artistFilter,
        ytSearchQuery: this._ytSearchQuery,
        selectedPlaylistKey: this._selectedPlaylistKey,
        selectedTrialId: this._selectedTrialId,
        formatMode: this._formatMode
      });
    },

    _bindEvents() {
      const byId = id => document.getElementById(id);
      byId('eaCloseBtn').addEventListener('click', () => this.close());
      byId('eaStartBtn').addEventListener('click', () => this.startMatch());
      byId('eaFbNextBtn').addEventListener('click', () => this._advanceNextRound());
      byId('eaReplayBtn').addEventListener('click', () => this.startMatch());
      byId('eaShareCardBtn').addEventListener('click', () => this.exportShareCard());
      byId('eaBackLobbyBtn').addEventListener('click', () => {
        this._running = false;
        this._isDailyMatch = false;
        this._matchToken += 1;
        this._flushReadyWaiters();
        this._stopRoundAudio();
        this._stopRenderLoop();
        this._refreshPlaylistsAndCatalog().then(() => {
          if (this._isOpen && !this._running) this._scheduleLobbyWarmup(180);
        });
        this._syncLobbySelectorsUI();
        this._showView('lobby');
      });

      const dailyBanner = byId('eaDailyBannerBtn');
      if (dailyBanner) {
        dailyBanner.addEventListener('click', () => this._handleDailyBannerClick());
      }
      const dailyBackBtn = byId('eaDailyBackLobbyBtn');
      if (dailyBackBtn) {
        dailyBackBtn.addEventListener('click', () => {
          this._stopDailyCountdown();
          this._syncLobbySelectorsUI();
          this._showView('lobby');
        });
      }
      const dailyPrimaryBtn = byId('eaDailyPrimaryActionBtn');
      if (dailyPrimaryBtn) {
        dailyPrimaryBtn.addEventListener('click', () => this._handleDailyPrimaryAction());
      }
      const prizeClaimBtn = byId('eaPrizeClaimBtn');
      if (prizeClaimBtn) {
        prizeClaimBtn.addEventListener('click', () => this._claimPendingDailyReward());
      }
      const prizeContinueBtn = byId('eaPrizeContinueBtn');
      if (prizeContinueBtn) {
        prizeContinueBtn.addEventListener('click', () => {
          this._closePrizeCeremony();
          this._syncLobbySelectorsUI();
          this._openDailyRankingView(getEarDailyDayKey());
        });
      }

      const eraBtn = byId('eaEraTriggerBtn');
      const genBtn = byId('eaGenreTriggerBtn');
      const artBtn = byId('eaArtistTriggerBtn');
      const plBtn = byId('eaPlaylistTriggerBtn');
      const trialBtn = byId('eaTrialTriggerBtn');
      if (eraBtn) eraBtn.addEventListener('click', () => this._openStudioSheet('filters'));
      if (genBtn) genBtn.addEventListener('click', () => this._openStudioSheet('filters'));
      if (artBtn) artBtn.addEventListener('click', () => this._openStudioSheet('artist'));
      if (plBtn) plBtn.addEventListener('click', () => this._openStudioSheet('playlist'));
      if (trialBtn) trialBtn.addEventListener('click', () => this._openStudioSheet('trials'));

      const sheetBackdrop = byId('eaSheetBackdrop');
      const sheetClose = byId('eaSheetCloseBtn');
      const sheetApply = byId('eaSheetApplyBtn');
      const sheetReset = byId('eaSheetResetBtn');
      if (sheetBackdrop) {
        sheetBackdrop.addEventListener('click', ev => {
          if (ev.target === sheetBackdrop) this._closeStudioSheet();
        });
      }
      if (sheetClose) sheetClose.addEventListener('click', () => this._closeStudioSheet());
      if (sheetApply) sheetApply.addEventListener('click', () => this._closeStudioSheet());
      if (sheetReset) {
        sheetReset.addEventListener('click', () => {
          if (this._activeSheet === 'trials') {
            this._selectedTrialId = 'mix';
            this._saveCurrentPrefs();
            this._syncLobbySelectorsUI();
            this._renderStudioSheetContent();
            this._playSfx('click');
            return;
          }
          if (this._activeSheet === 'artist') {
            this._artistFilter = '';
            this._saveCurrentPrefs();
            this._syncLobbySelectorsUI();
            this._renderStudioSheetContent();
            this._scheduleLobbyWarmup(150);
            this._playSfx('click');
            return;
          }
          this._eraFilter = 'all';
          this._genreFilter = 'all';
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
          this._renderStudioSheetContent();
          this._scheduleLobbyWarmup(150);
          this._playSfx('click');
        });
      }

      const ytInput = byId('eaYtSearchInput');
      const ytClear = byId('eaYtClearBtn');
      if (ytInput) {
        ytInput.addEventListener('input', () => {
          this._ytSearchQuery = ytInput.value || '';
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
          this._scheduleLobbyWarmup(520);
        });
        ytInput.addEventListener('keydown', ev => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            ytInput.blur();
            this.startMatch();
          }
        });
      }
      if (ytClear) {
        ytClear.addEventListener('click', () => {
          this._ytSearchQuery = '';
          if (ytInput) ytInput.value = '';
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
          this._scheduleLobbyWarmup(180);
        });
      }

      document.querySelectorAll('.ea-seg-btn[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._difficulty = btn.getAttribute('data-diff') || 'normal';
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
        });
      });

      document.querySelectorAll('.ea-seg-btn[data-pop]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._popularityMode = btn.getAttribute('data-pop') || 'youtube';
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
          this._scheduleLobbyWarmup(180);
        });
      });

      document.querySelectorAll('.ea-seg-btn[data-format]').forEach(btn => {
        btn.addEventListener('click', () => {
          this._formatMode = btn.getAttribute('data-format') || 'exam';
          this._saveCurrentPrefs();
          this._syncLobbySelectorsUI();
        });
      });

      window.addEventListener('resize', () => {
        if (this._isOpen) this._resizeCanvas();
      });
    },

    // -----------------------------------------------------------------------
    // OPEN / CLOSE / NAVIGATION
    // -----------------------------------------------------------------------
    open(seedTrack = null) {
      this._ensureMounted();
      this._isOpen = true;
      this._isDailyMatch = false;
      this._seedTrack = seedTrack || null;

      const np = document.getElementById('nowPlayingTurntableModal');
      if (np && np.classList.contains('open') && window.DiscoverHomeApp) {
        window.DiscoverHomeApp.closeNowPlayingModal();
      }

      const best = loadBestRecord();
      const badge = document.getElementById('eaLobbyBestBadge');
      if (badge) {
        badge.textContent = best
          ? `RÉCORD ${best.grade} · ${best.score} PTS`
          : 'SIN RÉCORD';
      }

      this._refreshPlaylistsAndCatalog().then(() => {
        if (this._isOpen && !this._running) this._scheduleLobbyWarmup(120);
      });
      this._syncLobbySelectorsUI();
      this._showView('lobby');
      document.getElementById('earArcadeModal').classList.add('open');

      if (seedTrack && seedTrack.title) {
        this.startMatch();
      } else {
        // Check if player earned Claves from a completed past Daily challenge after 00:00!
        this._checkPendingDailyReward(true).catch(() => {});
      }
    },

    close() {
      if (!this._isOpen) return;
      this._closeStudioSheet();
      this._closePrizeCeremony();
      this._stopDailyCountdown();
      this._running = false;
      this._isDailyMatch = false;
      this._matchToken += 1;
      if (this._lobbyWarmTimer) { clearTimeout(this._lobbyWarmTimer); this._lobbyWarmTimer = 0; }
      if (this._blitzAutoNextTimer) { clearTimeout(this._blitzAutoNextTimer); this._blitzAutoNextTimer = 0; }
      this._flushReadyWaiters();
      this._stopRoundAudio();
      this._stopRenderLoop();
      this._isOpen = false;
      const modal = document.getElementById('earArcadeModal');
      if (modal) modal.classList.remove('open');
      this.syncHomeBadge();
    },

    handleBackPress() {
      if (this._isOpen) {
        const prizeEl = document.getElementById('eaPrizeOverlay');
        if (prizeEl && prizeEl.classList.contains('open')) {
          if (this._prizeClaimed) this._closePrizeCeremony();
          return true;
        }
        if (this._activeSheet) {
          this._closeStudioSheet();
          return true;
        }
        const dailyRankEl = document.getElementById('eaViewDailyRank');
        if (dailyRankEl && dailyRankEl.classList.contains('active')) {
          this._stopDailyCountdown();
          this._syncLobbySelectorsUI();
          this._showView('lobby');
          return true;
        }
        this.close();
        return true;
      }
      return false;
    },

    _showView(viewName) {
      const map = {
        lobby: 'eaViewLobby',
        play: 'eaViewPlay',
        summary: 'eaViewSummary',
        daily_rank: 'eaViewDailyRank'
      };
      Object.entries(map).forEach(([k, id]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', k === viewName);
      });
      if (viewName !== 'daily_rank') this._stopDailyCountdown();
      const hud = document.getElementById('eaHudStats');
      if (hud) hud.style.display = viewName === 'play' ? 'flex' : 'none';
      if (viewName === 'play') {
        requestAnimationFrame(() => this._resizeCanvas());
      }
    },

    // -----------------------------------------------------------------------
    // WEB AUDIO CONTEXT & SFX
    // -----------------------------------------------------------------------
    _ensureAudioContext() {
      if (!this._audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this._audioCtx = new AC();
      }
      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume().catch(() => {});
      }
      if (!this._hallIrBuffer) {
        this._hallIrBuffer = createHallImpulse(this._audioCtx, 1.5, 2.7);
      }
      if (!this._vinylCrackleBuffer) {
        this._vinylCrackleBuffer = createVinylCrackleBuffer(this._audioCtx, 4.0);
      }
      if (!this._fmStaticBuffer) {
        this._fmStaticBuffer = createFmStaticBuffer(this._audioCtx, 2.4);
      }
      return this._audioCtx;
    },

    _playSfx(type) {
      try {
        const ctx = this._ensureAudioContext();
        const now = ctx.currentTime;
        const playTone = (freq, startOff, dur, vol = 0.14, wave = 'triangle') => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = wave;
          o.frequency.setValueAtTime(freq, now + startOff);
          g.gain.setValueAtTime(0.0001, now + startOff);
          g.gain.linearRampToValueAtTime(vol, now + startOff + 0.008);
          g.gain.exponentialRampToValueAtTime(0.0001, now + startOff + dur);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now + startOff);
          o.stop(now + startOff + dur + 0.02);
        };

        if (type === 'click') {
          playTone(620, 0, 0.028, 0.08, 'sine');
        } else if (type === 'tap') {
          playTone(980, 0, 0.04, 0.13, 'triangle');
        } else if (type === 'tick') {
          playTone(1180, 0, 0.018, 0.06, 'sine');
        } else if (type === 'correct') {
          playTone(523.25, 0, 0.11, 0.15, 'triangle');
          playTone(659.25, 0.06, 0.13, 0.15, 'triangle');
          playTone(783.99, 0.12, 0.2, 0.17, 'triangle');
        } else if (type === 'perfect') {
          playTone(523.25, 0, 0.11, 0.16, 'triangle');
          playTone(659.25, 0.055, 0.11, 0.16, 'triangle');
          playTone(783.99, 0.11, 0.13, 0.17, 'triangle');
          playTone(1046.5, 0.165, 0.3, 0.19, 'sine');
        } else if (type === 'wrong') {
          playTone(185, 0, 0.16, 0.17, 'sawtooth');
          playTone(138.6, 0.11, 0.22, 0.17, 'sawtooth');
        } else if (type === 'fanfare') {
          playTone(440, 0, 0.12, 0.14, 'triangle');
          playTone(554.37, 0.08, 0.14, 0.15, 'triangle');
          playTone(659.25, 0.16, 0.16, 0.16, 'triangle');
          playTone(880, 0.24, 0.42, 0.18, 'sine');
        } else if (type === 'jackpot') {
          // Las Vegas brass arpeggio + shimmering high fifths
          playTone(523.25, 0.00, 0.15, 0.15, 'triangle');
          playTone(659.25, 0.07, 0.15, 0.15, 'triangle');
          playTone(783.99, 0.14, 0.18, 0.16, 'triangle');
          playTone(1046.5, 0.22, 0.24, 0.18, 'triangle');
          playTone(1318.5, 0.32, 0.28, 0.16, 'sine');
          playTone(1567.98, 0.42, 0.55, 0.18, 'sine');
        } else if (type === 'coin') {
          playTone(1318.5, 0.00, 0.07, 0.11, 'sine');
          playTone(1760.0, 0.055, 0.14, 0.13, 'sine');
        }
      } catch (_) {}
    },

    // -----------------------------------------------------------------------
    // RETO DIARIO LAS VEGAS: DETERMINISTIC 5-ROUND ENGINE + RANKING + 00:00 PRIZE VAULT
    // -----------------------------------------------------------------------
    _getDailyThemeForDay(dayKey) {
      const k = dayKey || getEarDailyDayKey();
      const rng = createSeededRng(`ea_daily_theme_v1_${k}`);
      const idx = Math.floor(rng() * DAILY_THEMES.length);
      return DAILY_THEMES[idx] || DAILY_THEMES[0];
    },

    _buildDailyChallenge(dayKey) {
      const k = dayKey || getEarDailyDayKey();
      const theme = this._getDailyThemeForDay(k);
      const rng = createSeededRng(`ea_daily_rounds_v1_${k}`);

      // Filter VERIFIED_ERA_VAULT deterministically so EVERY user on Earth gets the exact same pool
      let themedPool = VERIFIED_ERA_VAULT.filter(tr => {
        if (theme.era && theme.era !== 'all') {
          const era = ERA_FILTERS[theme.era];
          if (era) {
            const yr = Number(tr.releaseYear || 0);
            if (!(yr >= era.minYear && yr <= era.maxYear)) return false;
          }
        }
        if (theme.genre && theme.genre !== 'all') {
          if (Array.isArray(tr.filterGenres) && tr.filterGenres.includes(theme.genre)) return true;
          const gen = GENRE_FILTERS[theme.genre];
          if (gen && gen.re) {
            return gen.re.test(`${tr.title || ''} ${tr.artist || ''} ${tr.genre || ''}`);
          }
          return false;
        }
        return true;
      });

      // If a themed slice has < 14 songs, deterministically pad with remaining verified vault tracks
      if (themedPool.length < 14) {
        const seenSigs = new Set(themedPool.map(trackSig));
        const extra = seededShuffle(VERIFIED_ERA_VAULT.filter(t => !seenSigs.has(trackSig(t))), rng);
        themedPool = [...themedPool, ...extra.slice(0, 20 - themedPool.length)];
      }

      const shuffledPool = seededShuffle(themedPool, rng);

      // Select 5 distinct tracks (distinct artists too!)
      const selectedTracks = [];
      const usedTrackSigs = new Set();
      const usedMainArtists = new Set();
      for (const tr of shuffledPool) {
        const s = trackSig(tr);
        const a = artistSig(tr);
        if (!s || usedTrackSigs.has(s)) continue;
        if (a && usedMainArtists.has(a)) continue;
        usedTrackSigs.add(s);
        if (a) usedMainArtists.add(a);
        selectedTracks.push({ ...tr, _eaOrigin: 'daily_vault' });
        if (selectedTracks.length >= 5) break;
      }
      if (selectedTracks.length < 5) {
        for (const tr of shuffledPool) {
          const s = trackSig(tr);
          if (!s || usedTrackSigs.has(s)) continue;
          usedTrackSigs.add(s);
          selectedTracks.push({ ...tr, _eaOrigin: 'daily_vault' });
          if (selectedTracks.length >= 5) break;
        }
      }

      // Select 5 distinct trials: 3 DSP choice trials + 2 tactile skill trials
      const choiceIds = seededShuffle(DAILY_CHOICE_TRIAL_IDS, rng).slice(0, 3);
      const skillIds = seededShuffle(DAILY_SKILL_TRIAL_IDS, rng).slice(0, 2);
      const roundTrialIds = [choiceIds[0], skillIds[0], choiceIds[1], choiceIds[2], skillIds[1]];

      // Build deterministic choices & initial skill parameters per round
      const usedDistractorSigs = new Set(usedTrackSigs);
      const rounds = roundTrialIds.map((trialId, idx) => {
        const trial = TRIALS.find(t => t.id === trialId) || TRIALS[0];
        const track = selectedTracks[idx];
        const cSig = trackSig(track);
        const cArtist = artistSig(track);

        let choices = null;
        if (trial.kind === 'choice') {
          const distractors = [];
          const localArtists = new Set(cArtist ? [cArtist] : []);
          const localSigs = new Set([cSig]);
          const candPool = seededShuffle(themedPool, rng);

          // Pass 1: fresh unseen distractors with distinct artists
          for (const cand of candPool) {
            const s = trackSig(cand);
            const a = artistSig(cand);
            if (!s || localSigs.has(s) || usedDistractorSigs.has(s)) continue;
            if (a && localArtists.has(a)) continue;
            localSigs.add(s);
            usedDistractorSigs.add(s);
            if (a) localArtists.add(a);
            distractors.push({ ...cand, _eaOrigin: 'daily_vault' });
            if (distractors.length >= 3) break;
          }
          // Pass 2: allow reused distractors if theme slice is tight
          if (distractors.length < 3) {
            for (const cand of candPool) {
              const s = trackSig(cand);
              const a = artistSig(cand);
              if (!s || localSigs.has(s)) continue;
              if (a && localArtists.has(a)) continue;
              localSigs.add(s);
              if (a) localArtists.add(a);
              distractors.push({ ...cand, _eaOrigin: 'daily_vault' });
              if (distractors.length >= 3) break;
            }
          }
          choices = seededShuffle([track, ...distractors], rng).map(t => ({
            track: t,
            isCorrect: trackSig(t) === cSig
          }));
        }

        // Deterministic initial parameters for skill/random trials so every player gets identical setup
        const seedParams = {};
        if (trialId === 'pitch') {
          seedParams.detuneRate = rng() < 0.5
            ? (0.72 + rng() * 0.12)
            : (1.16 + rng() * 0.14);
        } else if (trialId === 'chipmunk') {
          seedParams.isGiant = rng() < 0.5;
        } else if (trialId === 'tuner') {
          const tMhz = Math.round((89.6 + rng() * 16.8) * 10) / 10;
          let sMhz = Math.round((88.2 + rng() * 19.6) * 10) / 10;
          if (Math.abs(sMhz - tMhz) < 4.5) {
            sMhz = tMhz > 98 ? Math.max(88.2, tMhz - 6.8) : Math.min(107.8, tMhz + 6.8);
            sMhz = Math.round(sMhz * 10) / 10;
          }
          seedParams.targetMhz = tMhz;
          seedParams.startMhz = sMhz;
        } else if (trialId === 'year') {
          const targetYear = clamp(Number(track.releaseYear) || 2005, 1970, 2026);
          const minY = Math.min(1970, targetYear - 2);
          const maxY = Math.max(2026, targetYear);
          const span = Math.max(6, maxY - minY);
          let startY = Math.round((minY + maxY) * 0.5);
          for (let tries = 0; tries < 10; tries++) {
            const cand = minY + Math.floor(rng() * (span + 1));
            if (Math.abs(cand - targetYear) >= 7) { startY = cand; break; }
          }
          seedParams.startYear = clamp(startY, minY, maxY);
        }

        return { index: idx, trial, track, choices, seedParams };
      });

      return { dayKey: k, theme, rounds };
    },

    _findUnclaimedPastDailyDay() {
      const todayKey = getEarDailyDayKey();
      const st = loadDailyLocalState();
      const playedDays = Object.keys(st.playedByDay || {}).sort().reverse();
      for (const dKey of playedDays) {
        if (dKey < todayKey && !st.claimedDays[dKey]) {
          return dKey;
        }
      }
      return null;
    },

    async _fetchDailyLeaderboard(dayKey) {
      const targetDay = dayKey || getEarDailyDayKey();
      const baseUrl = (typeof window.getApiBaseUrl === 'function') ? window.getApiBaseUrl() : '';
      const pid = getOrCreateDailyPlayerId();
      const pname = getCurrentPlayerNickname();
      const url = `${baseUrl}/api/v1/ear-arcade/daily?day=${encodeURIComponent(targetDay)}&player_id=${encodeURIComponent(pid)}&player_name=${encodeURIComponent(pname)}`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 5500);
      try {
        const resp = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(tid);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data && data.success) {
          if (data.serverNowMs) this._dailyServerOffsetMs = data.serverNowMs - Date.now();
          if (data.nextResetMs) this._dailyNextResetMs = data.nextResetMs;
          return data;
        }
      } catch (_) {
        clearTimeout(tid);
      }
      return null;
    },

    async _checkPendingDailyReward(autoShowOverlay = true) {
      const pendingDay = this._findUnclaimedPastDailyDay();
      if (!pendingDay) return false;
      const st = loadDailyLocalState();
      const localRec = st.playedByDay[pendingDay] || {};
      const theme = this._getDailyThemeForDay(pendingDay);

      // Verify final closed rank on server (after 00:00)
      let finalRank = Number(localRec.rank) || 1;
      let totalPlayers = Math.max(1, Number(localRec.totalPlayers) || 1);
      let finalScore = Number(localRec.score) || 0;
      let finalHits = Number(localRec.hits) || 0;
      let prize = computeDailyPrizeInfo(finalRank);

      const serverData = await this._fetchDailyLeaderboard(pendingDay);
      if (serverData && serverData.myEntry) {
        finalRank = Number(serverData.myEntry.rank) || finalRank;
        totalPlayers = Math.max(1, Number(serverData.totalPlayers) || totalPlayers);
        finalScore = Number(serverData.myEntry.score) || finalScore;
        finalHits = Number(serverData.myEntry.hits) || finalHits;
        prize = {
          clefs: Number(serverData.myEntry.prizeClefs) || computeDailyPrizeInfo(finalRank).clefs,
          tier: serverData.myEntry.prizeTier || computeDailyPrizeInfo(finalRank).tier
        };
      }

      this._pendingDailyReward = {
        dayKey: pendingDay,
        rank: finalRank,
        clefs: prize.clefs,
        tier: prize.tier,
        score: finalScore,
        hits: finalHits,
        totalPlayers,
        themeTitle: localRec.themeTitle || theme.title
      };

      if (autoShowOverlay && this._isOpen) {
        this._openPrizeCeremony(this._pendingDailyReward);
      }
      return true;
    },

    async _handleDailyBannerClick() {
      this._playSfx('click');
      const pendingDay = this._findUnclaimedPastDailyDay();
      if (pendingDay) {
        await this._checkPendingDailyReward(true);
        return;
      }
      const todayKey = getEarDailyDayKey();
      const st = loadDailyLocalState();
      if (st.playedByDay[todayKey]) {
        this._openDailyRankingView(todayKey);
        return;
      }
      // Show Daily Ranking / Briefing or launch directly: check server quickly to prevent double play on new browser
      this._openDailyRankingView(todayKey);
    },

    async _handleDailyPrimaryAction() {
      this._playSfx('click');
      const todayKey = getEarDailyDayKey();
      const st = loadDailyLocalState();
      const serverAlready = this._dailyLeaderboardData
        && this._dailyLeaderboardData.dayKey === todayKey
        && Boolean(this._dailyLeaderboardData.myEntry);
      if (st.playedByDay[todayKey] || serverAlready) {
        if (this._roundResults && this._roundResults.length > 0) {
          this.exportShareCard();
        } else {
          this._syncLobbySelectorsUI();
          this._showView('lobby');
        }
        return;
      }
      this.startDailyMatch();
    },

    async _openDailyRankingView(dayKey) {
      const targetDay = dayKey || getEarDailyDayKey();
      const theme = this._getDailyThemeForDay(targetDay);
      this._showView('daily_rank');

      const dateEl = document.getElementById('eaDailyRankDate');
      const themeEl = document.getElementById('eaDailyRankTheme');
      if (dateEl) dateEl.textContent = formatDayKeyHuman(targetDay);
      if (themeEl) themeEl.textContent = `${theme.title} · 5 Rondas Compartidas`;

      this._dailyNextResetMs = getLocalNextMidnightMs(Date.now());
      this._startDailyCountdown();

      // Render optimistic local state immediately, then hydrate from server
      const listEl = document.getElementById('eaDailyRankList');
      if (listEl && !this._dailyLeaderboardData) {
        listEl.innerHTML = '<div class="ea-vegas-loading">Conectando con la mesa Las Vegas...</div>';
      }
      this._renderDailyRankingView(this._dailyLeaderboardData || {
        dayKey: targetDay,
        themeTitle: theme.title,
        rankings: [],
        totalPlayers: 0,
        myEntry: null
      });

      const fresh = await this._fetchDailyLeaderboard(targetDay);
      if (fresh && this._isOpen) {
        this._dailyLeaderboardData = fresh;
        // Sync server myEntry into local state if played from another device with same nickname
        if (fresh.myEntry && fresh.dayKey === targetDay) {
          const st = loadDailyLocalState();
          if (!st.playedByDay[targetDay]) {
            st.playedByDay[targetDay] = {
              score: fresh.myEntry.score,
              hits: fresh.myEntry.hits,
              rank: fresh.myEntry.rank,
              totalPlayers: fresh.totalPlayers,
              themeTitle: fresh.themeTitle || theme.title,
              timestamp: fresh.myEntry.timestamp || Date.now()
            };
            saveDailyLocalState(st);
          } else {
            st.playedByDay[targetDay].rank = fresh.myEntry.rank;
            st.playedByDay[targetDay].totalPlayers = fresh.totalPlayers;
            saveDailyLocalState(st);
          }
        }
        this._renderDailyRankingView(fresh);
        this._syncDailyBannerUI();
      }
    },

    _renderDailyRankingView(data) {
      const todayKey = getEarDailyDayKey();
      const dayKey = data?.dayKey || todayKey;
      const rankings = Array.isArray(data?.rankings) ? data.rankings : [];
      const totalPlayers = Number(data?.totalPlayers) || rankings.length;
      const st = loadDailyLocalState();
      const localRec = st.playedByDay[dayKey] || null;
      const pid = getOrCreateDailyPlayerId();
      const myNameLower = getCurrentPlayerNickname().toLowerCase();

      let myEntry = data?.myEntry || null;
      if (!myEntry && localRec) {
        const prize = computeDailyPrizeInfo(localRec.rank || 1);
        myEntry = {
          player_name: getCurrentPlayerNickname(),
          score: localRec.score || 0,
          hits: localRec.hits || 0,
          rank: localRec.rank || 1,
          prizeClefs: prize.clefs,
          prizeTier: prize.tier
        };
      }

      // 1. Update My Plaque
      const myRankEl = document.getElementById('eaDailyMyRank');
      const myNameEl = document.getElementById('eaDailyMyName');
      const mySubEl = document.getElementById('eaDailyMySub');
      const myClefsEl = document.getElementById('eaDailyMyClefs');
      const myPlaque = document.getElementById('eaDailyMyPlaque');
      if (myEntry) {
        if (myPlaque) myPlaque.classList.add('has-entry');
        if (myRankEl) myRankEl.textContent = `#${myEntry.rank || 1}`;
        if (myNameEl) myNameEl.textContent = `${myEntry.player_name || getCurrentPlayerNickname()} · ${myEntry.score || 0} PTS`;
        if (mySubEl) mySubEl.textContent = `${myEntry.hits || 0}/5 aciertos · ${myEntry.prizeTier || 'EN CLASIFICACIÓN'}`;
        if (myClefsEl) myClefsEl.textContent = `+${myEntry.prizeClefs || computeDailyPrizeInfo(myEntry.rank || 1).clefs}`;
      } else {
        if (myPlaque) myPlaque.classList.remove('has-entry');
        if (myRankEl) myRankEl.textContent = 'VIP';
        if (myNameEl) myNameEl.textContent = 'Aún no has jugado hoy';
        if (mySubEl) mySubEl.textContent = '5 rondas iguales para todos · 1 solo intento';
        if (myClefsEl) myClefsEl.textContent = '+350';
      }

      // 2. Render Top-3 Las Vegas Podium (#2 left, #1 center elevated, #3 right)
      const podiumEl = document.getElementById('eaDailyPodium');
      if (podiumEl) {
        const slots = [
          { rank: 2, cls: 'silver', prize: 240, row: rankings[1] || null },
          { rank: 1, cls: 'gold',   prize: 350, row: rankings[0] || null },
          { rank: 3, cls: 'bronze', prize: 175, row: rankings[2] || null }
        ];
        podiumEl.innerHTML = slots.map(s => {
          const isMe = s.row && ((s.row.player_id && s.row.player_id === pid) || (myNameLower !== 'jugador' && String(s.row.player_name || '').toLowerCase() === myNameLower));
          return `
            <div class="ea-podium-col ${s.cls} ${s.row ? 'filled' : 'vacant'} ${isMe ? 'is-me' : ''}">
              <div class="ea-podium-crown">${s.rank === 1 ? SVG.crown : `#${s.rank}`}</div>
              <div class="ea-podium-name">${s.row ? escHtml(s.row.player_name) : 'VACANTE'}</div>
              <div class="ea-podium-score">${s.row ? `${s.row.score} PTS` : '---'}</div>
              <div class="ea-podium-pedestal">
                <span class="ea-podium-rank-num">#${s.rank}</span>
                <span class="ea-podium-prize">${s.prize} CLAVES</span>
              </div>
            </div>
          `;
        }).join('');
      }

      // 3. Render Leaderboard Rows
      const totalEl = document.getElementById('eaDailyTotalPlayers');
      if (totalEl) totalEl.textContent = `${totalPlayers} ${totalPlayers === 1 ? 'JUGADOR' : 'JUGADORES'}`;

      const listEl = document.getElementById('eaDailyRankList');
      if (listEl) {
        if (rankings.length === 0) {
          listEl.innerHTML = '<div class="ea-vegas-empty">Sé el primero en coronar la mesa de hoy y llévate 350 Claves a las 00:00.</div>';
        } else {
          listEl.innerHTML = rankings.map((r, idx) => {
            const rk = r.rank || (idx + 1);
            const isMe = (r.player_id && r.player_id === pid) || (myNameLower !== 'jugador' && String(r.player_name || '').toLowerCase() === myNameLower);
            const tierCls = rk === 1 ? 'top1' : (rk === 2 ? 'top2' : (rk === 3 ? 'top3' : ''));
            const prizeC = r.prizeClefs || computeDailyPrizeInfo(rk).clefs;
            return `
              <div class="ea-vegas-row ${tierCls} ${isMe ? 'is-me' : ''}">
                <span class="ea-vrow-rank">#${rk}</span>
                <span class="ea-vrow-name">${escHtml(r.player_name || 'Jugador')}${isMe ? ' <em class="ea-vrow-you">TÚ</em>' : ''}</span>
                <span class="ea-vrow-hits">${r.hits ?? 0}/5</span>
                <span class="ea-vrow-score">${r.score || 0}</span>
                <span class="ea-vrow-prize">+${prizeC}</span>
              </div>
            `;
          }).join('');
        }
      }

      // 4. Primary Action Button
      const primaryBtn = document.getElementById('eaDailyPrimaryActionBtn');
      const primaryTxt = document.getElementById('eaDailyPrimaryActionTxt');
      if (primaryBtn && primaryTxt) {
        const played = Boolean(myEntry);
        primaryBtn.classList.toggle('is-completed', played);
        if (played) {
          primaryTxt.textContent = (this._roundResults && this._roundResults.length > 0)
            ? 'Compartir Tarjeta'
            : 'Volver al Estudio';
        } else {
          primaryTxt.textContent = 'Jugar Reto de Hoy (1 Intento)';
        }
      }
    },

    _startDailyCountdown() {
      this._stopDailyCountdown();
      const updateClock = () => {
        const el = document.querySelector('#eaDailyCountdown span');
        if (!el) return;
        const nowSynced = Date.now() + (this._dailyServerOffsetMs || 0);
        const remMs = Math.max(0, (this._dailyNextResetMs || getLocalNextMidnightMs(nowSynced)) - nowSynced);
        const totalSec = Math.floor(remMs / 1000);
        const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        el.textContent = `${hh}:${mm}:${ss}`;
      };
      updateClock();
      this._dailyCountdownTimer = setInterval(updateClock, 1000);
    },

    _stopDailyCountdown() {
      if (this._dailyCountdownTimer) {
        clearInterval(this._dailyCountdownTimer);
        this._dailyCountdownTimer = 0;
      }
    },

    _openPrizeCeremony(reward) {
      if (!reward) return;
      this._pendingDailyReward = reward;
      this._prizeClaimed = false;

      const overlay = document.getElementById('eaPrizeOverlay');
      if (!overlay) return;

      const dayEl = document.getElementById('eaPrizeDayLabel');
      const themeEl = document.getElementById('eaPrizeThemeLabel');
      const rankEl = document.getElementById('eaPrizeRankNum');
      const medalEl = document.getElementById('eaPrizeMedal');
      const tierEl = document.getElementById('eaPrizeTierBadge');
      const statsEl = document.getElementById('eaPrizeStatsLine');
      const amtEl = document.getElementById('eaPrizeAmount');
      const claimBtn = document.getElementById('eaPrizeClaimBtn');
      const contBtn = document.getElementById('eaPrizeContinueBtn');

      if (dayEl) dayEl.textContent = `PREMIO FINAL · ${formatDayKeyHuman(reward.dayKey)} · 00:00`;
      if (themeEl) themeEl.textContent = reward.themeTitle || 'Reto Diario Las Vegas';
      if (rankEl) rankEl.textContent = `#${reward.rank}`;
      if (medalEl) {
        medalEl.className = `ea-prize-medal ${reward.rank === 1 ? 'gold' : (reward.rank === 2 ? 'silver' : (reward.rank === 3 ? 'bronze' : 'vip'))}`;
      }
      if (tierEl) tierEl.textContent = reward.tier || 'MESA VIP';
      if (statsEl) statsEl.textContent = `${reward.score} PTS · ${reward.hits}/5 ACIERTOS · DE ${reward.totalPlayers} ${reward.totalPlayers === 1 ? 'JUGADOR' : 'JUGADORES'}`;
      if (claimBtn) {
        claimBtn.style.display = 'inline-flex';
        claimBtn.disabled = false;
        claimBtn.innerHTML = `<span>COBRAR +${reward.clefs} CLAVES</span>`;
      }
      if (contBtn) contBtn.style.display = 'none';

      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open');

      this._playSfx('jackpot');
      this._startPrizeCanvasLoop(false);

      // Animated rolling gold Claves counter (0 -> reward.clefs)
      if (amtEl) {
        const target = Math.max(0, Number(reward.clefs) || 0);
        const startTs = performance.now();
        const dur = 1150;
        const step = now => {
          if (!overlay.classList.contains('open')) return;
          const t = clamp((now - startTs) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          amtEl.textContent = `+${Math.round(target * eased)}`;
          if (t < 1) requestAnimationFrame(step);
          else amtEl.textContent = `+${target}`;
        };
        requestAnimationFrame(step);
      }
    },

    _claimPendingDailyReward() {
      const reward = this._pendingDailyReward;
      if (!reward || this._prizeClaimed) return;
      this._prizeClaimed = true;

      // Credit real wallet via global addClefs()
      try {
        if (typeof window.addClefs === 'function') {
          window.addClefs(reward.clefs);
        } else {
          const cur = parseInt(localStorage.getItem('beatstar_player_clefs') || '0', 10) || 0;
          localStorage.setItem('beatstar_player_clefs', String(cur + reward.clefs));
          if (typeof window.updateUserWalletDisplay === 'function') window.updateUserWalletDisplay();
        }
        if (typeof window.syncPlayerProfileToCloud === 'function') {
          window.syncPlayerProfileToCloud();
        }
      } catch (_) {}

      // Persist claimed status so it can never be double-claimed
      const st = loadDailyLocalState();
      st.claimedDays[reward.dayKey] = {
        rank: reward.rank,
        clefs: reward.clefs,
        claimedAt: Date.now()
      };
      saveDailyLocalState(st);

      this._playSfx('coin');
      setTimeout(() => this._playSfx('jackpot'), 120);
      this._burstPrizeParticles(90);

      const claimBtn = document.getElementById('eaPrizeClaimBtn');
      const contBtn = document.getElementById('eaPrizeContinueBtn');
      if (claimBtn) claimBtn.style.display = 'none';
      if (contBtn) contBtn.style.display = 'inline-flex';

      toast(`+${reward.clefs} Claves acreditadas por tu puesto #${reward.rank}`);
      this.syncHomeBadge();
      this._syncDailyBannerUI();
    },

    _closePrizeCeremony() {
      this._stopPrizeCanvasLoop();
      const overlay = document.getElementById('eaPrizeOverlay');
      if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
      }
    },

    _burstPrizeParticles(count = 55) {
      const canvas = document.getElementById('eaPrizeCanvas');
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth || 380;
      const h = canvas.clientHeight || window.innerHeight || 720;
      const colors = ['#f6dfa0', '#e5c16c', '#fbbf24', '#fff5d6', '#d97706', '#f8fafc'];
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const spd = 2.2 + Math.random() * 6.8;
        this._prizeParticles.push({
          x: w * 0.5,
          y: h * 0.44,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 3.2,
          w: 4 + Math.random() * 6,
          h: 2.5 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.24,
          color: colors[i % colors.length],
          alpha: 1.0,
          gravity: 0.09 + Math.random() * 0.06
        });
      }
    },

    _startPrizeCanvasLoop() {
      this._stopPrizeCanvasLoop();
      const canvas = document.getElementById('eaPrizeCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const resize = () => {
        const w = canvas.clientWidth || window.innerWidth || 380;
        const h = canvas.clientHeight || window.innerHeight || 720;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      this._prizeParticles = [];
      this._burstPrizeParticles(68);

      let frame = 0;
      const tick = () => {
        const overlay = document.getElementById('eaPrizeOverlay');
        if (!overlay || !overlay.classList.contains('open')) {
          this._prizeAnimRaf = 0;
          return;
        }
        const w = canvas.clientWidth || window.innerWidth || 380;
        const h = canvas.clientHeight || window.innerHeight || 720;
        ctx.clearRect(0, 0, w, h);

        // Ambient gentle gold embers rising continuously
        frame++;
        if (frame % 4 === 0 && this._prizeParticles.length < 130) {
          this._prizeParticles.push({
            x: Math.random() * w,
            y: h + 8,
            vx: (Math.random() - 0.5) * 0.7,
            vy: -(1.2 + Math.random() * 1.8),
            w: 2.5 + Math.random() * 3,
            h: 2.5 + Math.random() * 3,
            rot: Math.random() * Math.PI,
            vrot: 0.05,
            color: Math.random() < 0.5 ? '#f6dfa0' : '#f59e0b',
            alpha: 0.82,
            gravity: -0.005
          });
        }

        for (let i = this._prizeParticles.length - 1; i >= 0; i--) {
          const p = this._prizeParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.992;
          p.rot += p.vrot;
          p.alpha -= 0.0065;
          if (p.alpha <= 0 || p.y > h + 30 || p.y < -40) {
            this._prizeParticles.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = clamp(p.alpha, 0, 1);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
          ctx.restore();
        }
        this._prizeAnimRaf = requestAnimationFrame(tick);
      };
      this._prizeAnimRaf = requestAnimationFrame(tick);
    },

    _stopPrizeCanvasLoop() {
      if (this._prizeAnimRaf) {
        cancelAnimationFrame(this._prizeAnimRaf);
        this._prizeAnimRaf = 0;
      }
      this._prizeParticles = [];
    },

    async startDailyMatch() {
      const todayKey = getEarDailyDayKey();
      const st = loadDailyLocalState();
      if (st.playedByDay[todayKey]) {
        toast('Ya completaste el Reto Diario de hoy');
        this._openDailyRankingView(todayKey);
        return;
      }

      try {
        const mainEngine = window.DiscoverHomeApp && window.DiscoverHomeApp.getAudioEngine();
        if (mainEngine && typeof mainEngine.pause === 'function') mainEngine.pause();
      } catch (_) {}

      this._ensureAudioContext();
      this._stopRoundAudio();
      this._stopDailyCountdown();
      if (this._lobbyWarmTimer) { clearTimeout(this._lobbyWarmTimer); this._lobbyWarmTimer = 0; }
      if (this._blitzAutoNextTimer) { clearTimeout(this._blitzAutoNextTimer); this._blitzAutoNextTimer = 0; }

      this._closeStudioSheet();
      const token = ++this._matchToken;
      this._flushReadyWaiters();
      this._readyQueue = [];
      this._packetCursor = 0;
      this._packetInFlight = 0;
      this._packetDispatchedSigs = new Set();
      this._matchUsedOptionSigs = new Set();
      this._packetLivePending = false;
      this._packetSuccessCount = 0;

      // Build deterministic 5-round daily challenge shared identically by all players
      this._isDailyMatch = true;
      this._dailyDayKey = todayKey;
      this._dailyPlan = this._buildDailyChallenge(todayKey);
      this._dailyAudioMap = new Map();

      this._running = true;
      this._roundIndex = 0;
      this._totalRounds = 5;
      this._matchTrialsPlan = this._dailyPlan.rounds.map(r => r.trial);
      this._score = 0;
      this._streak = 0;
      this._bestStreak = 0;
      this._maxLives = 4;
      this._lives = 4;
      this._roundResults = [];
      this._bestPitchAccuracy = null;
      this._bestSilenceErrMs = null;
      this._bestBpmErr = null;
      this._roundPhase = 'loading';

      // Kick off parallel fast decoding of all 5 daily tracks immediately (0 Render egress via iTunes)
      this._dailyPlan.rounds.forEach((r, idx) => {
        const p = this._resolveTrackAudio(r.track, { preferFast: true })
          .then(audioData => ({ track: r.track, audioData }))
          .catch(() => null);
        this._dailyAudioMap.set(idx, p);
        // Also pre-hydrate covers for the round track & its choices
        fetchCoverForTrack(r.track).catch(() => {});
        if (Array.isArray(r.choices)) {
          r.choices.forEach(c => { if (c && c.track) fetchCoverForTrack(c.track).catch(() => {}); });
        }
      });

      this._showView('play');
      this._updateHudUI();
      this._startRenderLoop();
      this._beginRound(0);
    },

    async _finishDailyMatch() {
      const dayKey = this._dailyDayKey || getEarDailyDayKey();
      const plan = this._dailyPlan || this._buildDailyChallenge(dayKey);
      const total = Math.max(1, this._roundResults.length);
      const hits = this._roundResults.filter(r => r.ok).length;
      const rankObj = computeRank(this._score, 5, 1.0);
      const times = this._roundResults.map(r => Number(r.elapsedMs) || 6000);
      const avgTimeMs = Math.round(times.reduce((a, b) => a + b, 0) / Math.max(1, times.length));

      // Lock local attempt immediately so user can never replay today even offline
      const st = loadDailyLocalState();
      if (!st.playedByDay[dayKey]) {
        st.playedByDay[dayKey] = {
          score: this._score,
          hits,
          totalRounds: total,
          avgTimeMs,
          grade: rankObj.grade,
          rank: 1,
          totalPlayers: 1,
          themeTitle: plan.theme.title,
          timestamp: Date.now()
        };
        saveDailyLocalState(st);
      }

      // Submit to backend Daily Ranking
      const baseUrl = (typeof window.getApiBaseUrl === 'function') ? window.getApiBaseUrl() : '';
      let serverRes = null;
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 6500);
        const resp = await fetch(`${baseUrl}/api/v1/ear-arcade/daily/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayKey,
            player_id: getOrCreateDailyPlayerId(),
            player_name: getCurrentPlayerNickname(),
            score: this._score,
            hits,
            totalRounds: total,
            avgTimeMs,
            grade: rankObj.grade,
            themeTitle: plan.theme.title
          }),
          signal: ctrl.signal
        });
        clearTimeout(tid);
        if (resp.ok) serverRes = await resp.json();
      } catch (_) {}

      if (serverRes && serverRes.success) {
        this._dailyLeaderboardData = serverRes;
        if (serverRes.serverNowMs) this._dailyServerOffsetMs = serverRes.serverNowMs - Date.now();
        if (serverRes.nextResetMs) this._dailyNextResetMs = serverRes.nextResetMs;
        const st2 = loadDailyLocalState();
        st2.playedByDay[dayKey] = {
          ...(st2.playedByDay[dayKey] || {}),
          score: serverRes.myEntry?.score ?? this._score,
          hits: serverRes.myEntry?.hits ?? hits,
          rank: serverRes.rank || 1,
          totalPlayers: serverRes.totalPlayers || 1,
          themeTitle: plan.theme.title,
          timestamp: Date.now()
        };
        saveDailyLocalState(st2);
      }

      this._isDailyMatch = false;
      this.syncHomeBadge();
      this._syncDailyBannerUI();
      this._playSfx('jackpot');
      await this._openDailyRankingView(dayKey);
    },

    // -----------------------------------------------------------------------
    // FULL YOUTUBE + GLOBAL LIVE CATALOG AGGREGATOR & ANTI-REPETITION ENGINE
    // -----------------------------------------------------------------------
    _normalizeYouTubeTrack(raw, fallbackGenre = 'YouTube') {
      if (!raw) return null;
      let rawTitle = String(raw.title || raw.trackName || '').trim();
      let rawArtist = String(raw.artist || raw.artistName || raw.channel || '').trim();
      if (!rawTitle) return null;

      // Filter out non-song YouTube uploads (1-hour mixes, compilations, reactions, karaoke, tutorials)
      const combined = `${rawTitle} ${rawArtist}`.toLowerCase();
      if (/\b(1\s*hour|2\s*hours|3\s*hours|full\s*album|megamix|nonstop|compilation|recopilacion|reaction|reaccion|karaoke|instrumental\s*cover|piano\s*tutorial|podcast|interview|entrevista|live\s*stream|top\s*\d+\s*songs|mejores\s*canciones|playlist\s*mix|mix\s*202\d)\b/i.test(combined)) {
        return null;
      }
      const durSec = Number(raw.durationSec || raw.duration || 0);
      if (durSec > 0 && (durSec < 48 || durSec > 480)) return null;

      // Clean official video / audio / lyrics tags from YouTube titles
      let title = rawTitle
        .replace(/\s*[\(\[](?:official\s*(?:music\s*)?(?:video|audio|lyric(?:s)?|visualizer|mv)|video\s*oficial|audio\s*oficial|letra|lyrics?|hd|4k|hq|remastered(?:\s*\d{4})?|explicit|clean\s*version|topic)[\)\]]/gi, '')
        .replace(/\s*[\|•]\s*(?:official|video|audio|lyrics|letra|hd|4k).*$/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      let artist = rawArtist
        .replace(/\s*-\s*Topic$/i, '')
        .replace(/VEVO$/i, '')
        .replace(/\s*Official$/i, '')
        .trim();

      if (title.includes(' - ') && (!artist || artist.toLowerCase() === 'youtube' || artist.length > 36)) {
        const parts = title.split(' - ');
        const left = parts[0].trim();
        const right = parts.slice(1).join(' - ').trim();
        if (left && right && left.length <= 40) {
          artist = left;
          title = right;
        }
      }

      if (!title || title.length < 2) return null;
      if (!artist) artist = 'YouTube';

      const vid = raw.videoId || (String(raw.id || '').startsWith('yt_') ? String(raw.id).slice(3) : '');
      const httpPreview = (typeof raw.previewUrl === 'string' && /^https?:\/\//i.test(raw.previewUrl)) ? raw.previewUrl : '';
      const thumb = raw.artworkUrl600
        || (typeof raw.artworkUrl100 === 'string' ? raw.artworkUrl100.replace('100x100bb', '600x600bb') : '')
        || raw.thumbnail
        || (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : './app_logo.png');

      let releaseYear = Number(raw.releaseYear || raw.year || 0) || 0;
      if (!releaseYear && typeof raw.releaseDate === 'string' && raw.releaseDate.length >= 4) {
        const y = parseInt(raw.releaseDate.slice(0, 4), 10);
        if (y >= 1950 && y <= 2035) releaseYear = y;
      }

      return {
        id: vid ? `yt_${vid}` : (raw.id || `live_${trackSig({ title, artist })}`),
        videoId: vid || undefined,
        title,
        artist,
        genre: raw.genre || raw.primaryGenreName || fallbackGenre,
        releaseYear: releaseYear || undefined,
        thumbnail: thumb,
        artworkUrl600: thumb,
        previewUrl: httpPreview || undefined,
        bpm: Number(raw.bpm) || undefined,
        _eaOrigin: 'youtube_live'
      };
    },

    _hasActiveMusicalFilters() {
      return !this._isDailyMatch
        && this._popularityMode !== 'playlist'
        && (this._eraFilter !== 'all' || this._genreFilter !== 'all' || Boolean(this._artistFilter));
    },

    _getFilterCacheKey(mode = this._popularityMode, customQ = '') {
      return `${mode}|${this._eraFilter}|${this._genreFilter}|${normalizeArtistQuery(this._artistFilter)}|${String(customQ || '').trim().toLowerCase()}`;
    },

    _buildFilterQueryString(customQ = '') {
      const parts = [];
      const q = String(customQ || '').trim();
      if (this._artistFilter) parts.push(this._artistFilter);
      if (q) parts.push(q);
      const gen = GENRE_FILTERS[this._genreFilter];
      const era = ERA_FILTERS[this._eraFilter];
      if (gen && gen.query) parts.push(gen.query);
      if (era && era.query) parts.push(era.query);
      return parts.join(' ').trim();
    },

    _trackMatchesArtist(tr, artistQuery = this._artistFilter) {
      const want = normalizeArtistQuery(artistQuery);
      if (!want) return true;
      if (!tr || !tr.artist) return false;
      const hay = normalizeArtistQuery(tr.artist);
      if (!hay) return false;
      if (hay === want) return true;
      // Match primary artist or collaboration segment (e.g. "Bad Bunny & Jhayco", "Queen & David Bowie")
      const segments = String(tr.artist)
        .split(/[,&+/]|feat\.?|ft\.?|with\b|x\b/i)
        .map(s => normalizeArtistQuery(s))
        .filter(Boolean);
      if (segments.some(seg => seg === want)) return true;
      // Allow whole-word containment when query >= 4 chars (e.g. "Estopa", "Rosalia", "Nirvana")
      if (want.length >= 4) {
        const paddedHay = ` ${hay} `;
        const paddedWant = ` ${want} `;
        if (paddedHay.includes(paddedWant)) return true;
      }
      return false;
    },

    _trackMatchesEra(tr, eraId = this._eraFilter) {
      if (!tr || !eraId || eraId === 'all') return true;
      const era = ERA_FILTERS[eraId];
      if (!era) return true;
      const yr = Number(tr.releaseYear || 0);
      // STRICT: When a decade is selected, ONLY accept tracks with a verified releaseYear inside [minYear, maxYear]!
      return yr >= era.minYear && yr <= era.maxYear;
    },

    _trackMatchesGenre(tr, genreId = this._genreFilter) {
      if (!tr || !genreId || genreId === 'all') return true;
      if (Array.isArray(tr.filterGenres) && tr.filterGenres.length > 0) {
        if (tr.filterGenres.includes(genreId)) return true;
      }
      const gen = GENRE_FILTERS[genreId];
      if (!gen || !gen.re) return true;
      const hay = `${tr.title || ''} ${tr.artist || ''} ${tr.genre || ''}`;
      return gen.re.test(hay);
    },

    _trackMatchesActiveFilters(tr) {
      if (!tr || !this._hasActiveMusicalFilters()) return true;
      if (this._artistFilter && !this._trackMatchesArtist(tr, this._artistFilter)) return false;
      if (this._eraFilter !== 'all' && !this._trackMatchesEra(tr, this._eraFilter)) return false;
      if (this._genreFilter !== 'all' && !this._trackMatchesGenre(tr, this._genreFilter)) return false;
      return true;
    },

    // Direct client-side iTunes Artist Discography loader (ZERO Render server egress!)
    async _fetchArtistDiscographyTracks(artistName, onChunk = null) {
      const cleanName = String(artistName || '').trim();
      const normKey = normalizeArtistQuery(cleanName);
      if (!normKey) return [];
      const cached = this._artistPoolCache.get(normKey);
      if (Array.isArray(cached) && cached.length >= 8) {
        if (typeof onChunk === 'function') { try { onChunk(cached); } catch (_) {} }
        return cached;
      }

      const collected = [];
      const seenTitleKeys = new Set();
      const pushSong = (it) => {
        if (!it || !it.trackName || !it.artistName || !it.previewUrl) return;
        const norm = this._normalizeYouTubeTrack({
          id: `it_${it.trackId || trackSig({ title: it.trackName, artist: it.artistName })}`,
          title: it.trackName,
          artist: it.artistName,
          genre: it.primaryGenreName || cleanName,
          releaseDate: it.releaseDate,
          artworkUrl100: it.artworkUrl100,
          previewUrl: it.previewUrl
        }, cleanName);
        if (!norm) return;
        if (/\b(karaoke|tribute|cover\b|lullaby|piano\s*version|8-bit|ringtone|megamix|medley|instrumental|commentary|interview|en vivo|live at|live from|acústico|unplugged|remix)\b/i.test(`${norm.title} ${norm.artist}`)) {
          return;
        }
        if (!this._trackMatchesArtist(norm, cleanName)) return;
        // Deduplicate by normalized clean title so the same song never appears twice as two choices!
        const cleanT = normalizeArtistQuery(normalizeCleanTitle(norm.title) || norm.title);
        if (!cleanT || seenTitleKeys.has(cleanT)) return;
        seenTitleKeys.add(cleanT);
        collected.push(norm);
      };

      const fetchIt = async (url) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 3200);
        try {
          const r = await fetch(url, { signal: ctrl.signal });
          clearTimeout(tid);
          if (!r.ok) return [];
          const d = await r.json();
          return Array.isArray(d?.results) ? d.results : [];
        } catch (_) {
          clearTimeout(tid);
          return [];
        }
      };

      const urls = [
        `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&media=music&entity=song&attribute=artistTerm&limit=60&country=ES`,
        `https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&media=music&entity=song&limit=40&country=US`
      ];

      const results = await Promise.allSettled(urls.map(u => fetchIt(u)));
      results.forEach(r => {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          r.value.forEach(pushSong);
        }
      });

      if (collected.length > 0) {
        this._artistPoolCache.set(normKey, collected);
        if (typeof onChunk === 'function') { try { onChunk(collected); } catch (_) {} }
      }
      return collected;
    },

    async _fetchLiveYouTubeBatch(mode = 'youtube', customQuery = '', onChunk = null) {
      const qClean = String(customQuery || '').trim();
      const baseUrl = (typeof window.getApiBaseUrl === 'function') ? window.getApiBaseUrl() : '';
      const snapEra = this._eraFilter;
      const snapGenre = this._genreFilter;
      const eraActive = mode !== 'playlist' && snapEra !== 'all';
      const genreActive = mode !== 'playlist' && snapGenre !== 'all';
      const hasFilters = eraActive || genreActive;
      const collected = [];
      const seen = new Set();

      const passesSnapFilters = (norm) => {
        if (!norm) return false;
        if (eraActive && !this._trackMatchesEra(norm, snapEra)) return false;
        if (genreActive && !this._trackMatchesGenre(norm, snapGenre)) return false;
        return true;
      };

      const pushNorm = (raw, fallbackGenre, localChunk, enforceFilter = false) => {
        const norm = this._normalizeYouTubeTrack(raw, fallbackGenre);
        if (!norm) return;
        // Reject karaoke/tribute/cover/remix junk from live streams
        if (/\b(karaoke|tribute|cover\b|lullaby|piano\s*version|8-bit|ringtone|megamix|medley|re-recorded|in the style of)\b/i.test(`${norm.title} ${norm.artist}`)) {
          return;
        }
        if (enforceFilter && !passesSnapFilters(norm)) return;
        const sig = trackSig(norm);
        if (!sig || seen.has(sig)) return;
        seen.add(sig);
        collected.push(norm);
        if (localChunk) localChunk.push(norm);
      };
      const emitChunk = (chunk) => {
        if (typeof onChunk === 'function' && Array.isArray(chunk) && chunk.length > 0) {
          try { onChunk(chunk); } catch (_) {}
        }
      };

      const fetchJsonTimeout = async (url, timeoutMs = 2400) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
          const r = await fetch(url, { signal: ctrl.signal });
          clearTimeout(tid);
          if (!r.ok) return null;
          return await r.json();
        } catch (_) {
          clearTimeout(tid);
          return null;
        }
      };

      const ytSearchTask = async (queryStr, tag, enforceFilter = false) => {
        if (typeof window.searchYouTubeOfficialClient !== 'function' || !queryStr) return;
        try {
          const items = await window.searchYouTubeOfficialClient(queryStr, '', 0);
          if (Array.isArray(items)) {
            const chunk = [];
            items.forEach(it => pushNorm(it, tag, chunk, enforceFilter));
            emitChunk(chunk);
          }
        } catch (_) {}
      };

      const itunesSearchTask = async (queryStr, limit = 30, tag = 'YouTube', eraId = 'all', enforceFilter = false) => {
        if (!queryStr) return;
        const data = await fetchJsonTimeout(
          `https://itunes.apple.com/search?term=${encodeURIComponent(queryStr)}&media=music&entity=song&limit=${limit}&country=ES`,
          2600
        );
        const items = Array.isArray(data?.results) ? data.results : [];
        const era = ERA_FILTERS[eraId];
        const chunk = [];
        items.forEach(it => {
          if (!it || !it.trackName || !it.artistName || !it.previewUrl) return;
          const yr = typeof it.releaseDate === 'string' && it.releaseDate.length >= 4 ? parseInt(it.releaseDate.slice(0, 4), 10) : 0;
          // STRICT DECADE GUARD: Never allow tracks outside [minYear, maxYear] when an era filter is active!
          if (era && era.id !== 'all') {
            if (!(yr >= era.minYear && yr <= era.maxYear)) return;
          }
          const raw = {
            id: `it_${it.trackId || trackSig({ title: it.trackName, artist: it.artistName })}`,
            title: it.trackName,
            artist: it.artistName,
            genre: it.primaryGenreName || tag,
            releaseDate: it.releaseDate,
            releaseYear: yr || undefined,
            artworkUrl100: it.artworkUrl100,
            previewUrl: it.previewUrl
          };
          pushNorm(raw, tag, chunk, enforceFilter);
        });
        emitChunk(chunk);
      };

      const appleChartTask = async () => {
        const country = APPLE_CHART_COUNTRIES[Math.floor(Math.random() * APPLE_CHART_COUNTRIES.length)];
        const data = await fetchJsonTimeout(`https://itunes.apple.com/${country}/rss/topsongs/limit=50/json`, 2400);
        const entries = Array.isArray(data?.feed?.entry) ? data.feed.entry : [];
        const chunk = [];
        entries.forEach(e => {
          const title = e?.['im:name']?.label || '';
          const artist = e?.['im:artist']?.label || '';
          const imgs = Array.isArray(e?.['im:image']) ? e['im:image'] : [];
          const thumb = imgs.length ? String(imgs[imgs.length - 1].label || '').replace(/\d+x\d+bb/, '600x600bb') : '';
          let preview = '';
          const links = Array.isArray(e?.link) ? e.link : [];
          for (const l of links) {
            const href = l?.attributes?.href || '';
            if (/\.m4a|\.mp3|audio-ssl\.itunes/i.test(href)) { preview = href; break; }
          }
          if (title && artist) {
            pushNorm({
              id: `rss_${country}_${trackSig({ title, artist })}`,
              title,
              artist,
              genre: e?.category?.attributes?.label || 'Top Charts',
              releaseDate: e?.['im:releaseDate']?.label || '',
              artworkUrl600: thumb,
              previewUrl: preview
            }, 'Top Charts', chunk, false);
          }
        });
        emitChunk(chunk);
      };

      const ytBackendChartTask = async () => {
        if (!baseUrl) return;
        let pls = [];
        try {
          const cachedRaw = localStorage.getItem('beatstar_top_playlists_cache_v1');
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed && Array.isArray(parsed.playlists) && parsed.playlists.length > 0 && (Date.now() - Number(parsed.ts || 0)) < 6 * 3600 * 1000) {
              pls = parsed.playlists;
            }
          }
        } catch (_) {}
        if (pls.length === 0) {
          const data = await fetchJsonTimeout(`${baseUrl}/api/v1/charts/top-playlists`, 2200);
          pls = Array.isArray(data?.playlists) ? data.playlists : [];
          if (pls.length > 0) {
            try { localStorage.setItem('beatstar_top_playlists_cache_v1', JSON.stringify({ ts: Date.now(), playlists: pls })); } catch (_) {}
          }
        }
        if (pls.length === 0) return;
        const pick = pls[Math.floor(Math.random() * pls.length)];
        if (!pick || !pick.id) return;
        let tracks = [];
        const trCacheKey = `beatstar_top_chart_tracks_v1_${pick.id}`;
        try {
          const trRaw = localStorage.getItem(trCacheKey);
          if (trRaw) {
            const parsedTr = JSON.parse(trRaw);
            if (parsedTr && Array.isArray(parsedTr.tracks) && parsedTr.tracks.length > 0 && (Date.now() - Number(parsedTr.ts || 0)) < 3 * 3600 * 1000) {
              tracks = parsedTr.tracks;
            }
          }
        } catch (_) {}
        if (tracks.length === 0) {
          const trData = await fetchJsonTimeout(`${baseUrl}/api/v1/charts/top-playlist-tracks?id=${encodeURIComponent(pick.id)}`, 2400);
          tracks = Array.isArray(trData?.tracks) ? trData.tracks : [];
          if (tracks.length > 0) {
            try { localStorage.setItem(trCacheKey, JSON.stringify({ ts: Date.now(), tracks: tracks.slice(0, 80) })); } catch (_) {}
          }
        }
        const chunk = [];
        tracks.forEach(t => pushNorm(t, pick.title || 'YouTube Charts', chunk, false));
        emitChunk(chunk);
      };

      const ytBackendPlaylistSearchTask = async (queryStr, enforceFilter = false) => {
        if (!baseUrl || !queryStr) return;
        const data = await fetchJsonTimeout(`${baseUrl}/api/v1/youtube/search_playlists?q=${encodeURIComponent(queryStr)}`, 2200);
        const pls = Array.isArray(data?.playlists) ? data.playlists : (Array.isArray(data?.items) ? data.items : []);
        const pick = pls.find(p => p && (p.id || p.playlistId));
        if (!pick) return;
        const plId = pick.id || pick.playlistId;
        const trData = await fetchJsonTimeout(`${baseUrl}/api/v1/youtube/playlist?id=${encodeURIComponent(plId)}`, 2400);
        const tracks = Array.isArray(trData?.tracks) ? trData.tracks : [];
        const chunk = [];
        tracks.slice(0, 35).forEach(t => pushNorm(t, queryStr, chunk, enforceFilter));
        emitChunk(chunk);
      };

      const tasks = [];
      const combinedFilterQ = this._buildFilterQueryString(mode === 'youtube' ? qClean : '');
      const filterTag = this._getActiveFilterTag() || qClean || 'YouTube';

      if (eraActive) {
        // STRICT ERA ENRICHMENT: Query authentic era-specific iTunes artists/terms and strictly verify releaseYear!
        // Never mix unverified YouTube videos without release dates when a decade filter is engaged!
        const era = ERA_FILTERS[snapEra];
        const seeds = shuffleArr(era?.itunesSeeds || []);
        const matchingVaultArtists = shuffleArr(
          VERIFIED_ERA_VAULT
            .filter(v => this._trackMatchesEra(v, snapEra) && (!genreActive || this._trackMatchesGenre(v, snapGenre)))
            .map(v => v.artist)
        );
        const chosenSeeds = [];
        const seenSeed = new Set();
        const addSeed = s => {
          const k = String(s || '').trim().toLowerCase();
          if (!k || seenSeed.has(k)) return;
          seenSeed.add(k);
          chosenSeeds.push(String(s).trim());
        };
        if (mode === 'youtube' && qClean) addSeed(qClean);
        matchingVaultArtists.slice(0, 3).forEach(addSeed);
        seeds.slice(0, 3).forEach(addSeed);
        chosenSeeds.slice(0, 4).forEach(seed => {
          tasks.push(itunesSearchTask(seed, 25, filterTag, snapEra, true));
        });
      } else if (genreActive) {
        const searchQ = combinedFilterQ || qClean;
        const modeHint = mode === 'obscure' ? ' indie underground' : (mode === 'hits' ? ' greatest hits' : '');
        tasks.push(itunesSearchTask(`${searchQ}${modeHint}`.trim(), 40, filterTag, 'all', true));
        tasks.push(ytSearchTask(`${searchQ}${modeHint} official audio`.trim(), filterTag, true));
        tasks.push(ytBackendPlaylistSearchTask(searchQ, true));
      } else if (mode === 'youtube' && qClean) {
        tasks.push(itunesSearchTask(qClean, 35, qClean, 'all', false));
        tasks.push(ytSearchTask(`${qClean} official audio`, qClean, false));
        tasks.push(ytSearchTask(`${qClean} best songs music`, qClean, false));
        tasks.push(ytBackendPlaylistSearchTask(qClean, false));
      } else if (mode === 'hits') {
        const s1 = YOUTUBE_HITS_SEEDS[this._ytSeedCursor % YOUTUBE_HITS_SEEDS.length];
        this._ytSeedCursor++;
        tasks.push(appleChartTask());
        tasks.push(ytSearchTask(s1, 'YouTube Hits', false));
        tasks.push(ytBackendChartTask());
      } else if (mode === 'obscure') {
        const s1 = YOUTUBE_OBSCURE_SEEDS[this._ytSeedCursor % YOUTUBE_OBSCURE_SEEDS.length];
        this._ytSeedCursor++;
        tasks.push(itunesSearchTask(s1.replace(/official audio/gi, '').trim(), 28, 'Indie', 'all', false));
        tasks.push(ytSearchTask(s1, 'Indie YT', false));
      } else {
        const s1 = YOUTUBE_RANDOM_SEEDS[this._ytSeedCursor % YOUTUBE_RANDOM_SEEDS.length];
        const s2 = YOUTUBE_RANDOM_SEEDS[(this._ytSeedCursor + 5) % YOUTUBE_RANDOM_SEEDS.length];
        this._ytSeedCursor += 2;
        tasks.push(appleChartTask());
        tasks.push(ytSearchTask(s1, 'YouTube', false));
        tasks.push(ytSearchTask(s2, 'YouTube', false));
        tasks.push(ytBackendChartTask());
      }

      await Promise.allSettled(tasks);
      const prioritized = this._prioritizeUnseenTracks(collected);

      // Update appropriate live cache for instant subsequent matches
      if (prioritized.length > 0) {
        if (hasFilters || (mode === 'youtube' && qClean)) {
          const fKey = `${mode}|${snapEra}|${snapGenre}|${qClean.toLowerCase()}`;
          const prev = this._liveFilterCache.get(fKey) || [];
          const ex = new Set(prev.map(trackSig));
          const merged = [...prioritized.filter(t => !ex.has(trackSig(t))), ...prev].slice(0, 140);
          this._liveFilterCache.set(fKey, merged);
          if (mode === 'youtube' && qClean && !hasFilters) {
            this._liveCustomCache = { query: qClean.toLowerCase(), tracks: merged };
          }
        } else {
          const mergeInto = (arr) => {
            const existing = new Set(arr.map(trackSig));
            const fresh = prioritized.filter(t => !existing.has(trackSig(t)));
            return [...fresh, ...arr].slice(0, 320);
          };
          if (mode === 'hits') this._liveHitsPoolCache = mergeInto(this._liveHitsPoolCache);
          else if (mode === 'obscure') this._liveObscurePoolCache = mergeInto(this._liveObscurePoolCache);
          else this._liveYtPoolCache = mergeInto(this._liveYtPoolCache);
        }
      }

      return prioritized;
    },

    _spliceLiveTracksIntoQueue(liveTracks, token = null) {
      if (!Array.isArray(liveTracks) || liveTracks.length === 0) return;
      if (token !== null && token !== this._matchToken) return;
      const filtersActive = this._hasActiveMusicalFilters();
      const queuedSigs = new Set(this._matchTracksQueue.map(trackSig));
      const fresh = liveTracks.filter(t => {
        if (!t) return false;
        if (filtersActive && !this._trackMatchesActiveFilters(t)) return false;
        const s = trackSig(t);
        return s && !queuedSigs.has(s) && !this._packetDispatchedSigs.has(s);
      });
      if (fresh.length === 0) return;

      // Also expand distractor cache with fresh verified live tracks
      const catSigs = new Set(this._allCatalogCache.map(trackSig));
      fresh.forEach(t => {
        const s = trackSig(t);
        if (s && !catSigs.has(s)) {
          catSigs.add(s);
          this._allCatalogCache.push(t);
        }
      });

      // Prioritize unseen & direct-HTTP-preview tracks right at _packetCursor so parallel workers grab them first!
      const ordered = this._sortPacketFastFirst(this._prioritizeUnseenTracks(fresh)).slice(0, 40);
      const insertAt = Math.min(this._matchTracksQueue.length, Math.max(0, this._packetCursor));
      this._matchTracksQueue.splice(insertAt, 0, ...ordered);

      // Immediately wake parallel preloader workers!
      if (this._running && this._isOpen) {
        this._pumpPacketPreloader(this._matchToken);
      }
    },

    _triggerBackgroundYouTubeHydration(mode, customQuery, token = null) {
      if (this._liveFetchInFlight) return;
      const activeToken = token !== null ? token : this._matchToken;
      this._liveFetchInFlight = true;
      this._fetchLiveYouTubeBatch(mode, customQuery, chunk => {
        if (this._running && this._isOpen && activeToken === this._matchToken) {
          this._spliceLiveTracksIntoQueue(chunk, activeToken);
        }
      })
        .catch(() => {})
        .finally(() => {
          this._liveFetchInFlight = false;
        });
    },

    _collectEntireAppCatalog() {
      const merged = [];
      const bySig = new Map();
      const add = (tr, originTag) => {
        if (!tr || !tr.title) return;
        const sig = trackSig(tr);
        if (!sig) return;
        const existing = bySig.get(sig);
        if (existing) {
          // Enrich existing track with verified releaseYear / filterGenres / previewUrl / cover if missing
          if (!existing.releaseYear && tr.releaseYear) existing.releaseYear = tr.releaseYear;
          if ((!existing.filterGenres || existing.filterGenres.length === 0) && Array.isArray(tr.filterGenres)) {
            existing.filterGenres = tr.filterGenres;
          }
          if (!existing.previewUrl && tr.previewUrl) existing.previewUrl = tr.previewUrl;
          const incomingCover = tr.artworkUrl600 || tr.thumbnail || tr.cover_url || '';
          if (!isRealCoverUrl(existing.artworkUrl600) && isRealCoverUrl(incomingCover)) {
            rememberTrackCover(existing, incomingCover);
          }
          return;
        }
        const entry = { ...tr, _eaOrigin: originTag };
        const ownCover = entry.artworkUrl600 || entry.thumbnail || entry.cover_url || '';
        if (isRealCoverUrl(ownCover)) {
          rememberTrackCover(entry, ownCover);
        } else if (COVER_MEM_CACHE.has(sig)) {
          const cached = COVER_MEM_CACHE.get(sig);
          entry.artworkUrl600 = cached;
          entry.thumbnail = cached;
        }
        bySig.set(sig, entry);
        merged.push(entry);
      };

      // 1. Historically verified multi-decade vault FIRST (ensures accurate releaseYear & genres!)
      VERIFIED_ERA_VAULT.forEach(t => add(t, 'verified_vault'));
      EXTRA_ICONIC_HITS.forEach(t => add(t, 'extra_hit'));
      DEEP_CUTS_LIBRARY.forEach(t => add(t, 'deep_cut'));

      // 2. Live YouTube / iTunes pools already fetched in this session
      [...this._liveYtPoolCache, ...this._liveHitsPoolCache, ...this._liveObscurePoolCache].forEach(t => add(t, 'youtube_live'));
      this._liveFilterCache.forEach(list => {
        if (Array.isArray(list)) list.forEach(t => add(t, 'youtube_live'));
      });

      // 3. DiscoverHomeApp full candidate pool (formatted catalog + curated playlists)
      if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.getAllCandidatePool === 'function') {
        (window.DiscoverHomeApp.getAllCandidatePool() || []).forEach(t => add(t, 'catalog'));
      }
      // 4. Formatted top songs catalog (if DiscoverHomeApp hasn't built yet)
      if (typeof window.getFormattedTopSongsCatalog === 'function') {
        (window.getFormattedTopSongsCatalog() || []).forEach(t => add(t, 'top'));
      }
      // 5. Direct raw window.TOP_SONGS_CATALOG (931 songs!)
      if (Array.isArray(window.TOP_SONGS_CATALOG)) {
        window.TOP_SONGS_CATALOG.forEach(t => add(t, 'top'));
      }
      // 6. Direct window.CURATED_PLAYLIST_DATABASE
      if (window.CURATED_PLAYLIST_DATABASE && typeof window.CURATED_PLAYLIST_DATABASE === 'object') {
        Object.values(window.CURATED_PLAYLIST_DATABASE).forEach(pl => {
          (pl?.tracks || []).forEach(t => add({ ...t, genre: pl.title }, 'curated'));
        });
      }
      // 7. Recent plays
      if (window.SpotifySuite && typeof window.SpotifySuite.getRecentTracks === 'function') {
        (window.SpotifySuite.getRecentTracks() || []).forEach(t => add(t, 'recent'));
      }

      return merged;
    },

    _prioritizeUnseenTracks(tracks) {
      const recentSigs = loadRecentPlayedSigs();
      const recentRank = new Map();
      recentSigs.forEach((sig, idx) => recentRank.set(sig, idx));

      const unseen = [];
      const seenBefore = [];
      for (const tr of tracks) {
        const sig = trackSig(tr);
        if (recentRank.has(sig)) {
          seenBefore.push({ tr, recency: recentRank.get(sig) });
        } else {
          unseen.push(tr);
        }
      }

      // Shuffle all unseen uniformly, then append older played tracks first (most recent last)
      seenBefore.sort((a, b) => b.recency - a.recency);
      return [...shuffleArr(unseen), ...seenBefore.map(x => x.tr)];
    },

    _buildPoolTracks(liveOverride = null) {
      const fullCatalog = this._collectEntireAppCatalog();
      this._allCatalogCache = fullCatalog;
      let eligible = [];

      if (this._popularityMode === 'playlist') {
        const pl = this._availablePlaylists.find(p => p.key === this._selectedPlaylistKey)
          || this._availablePlaylists[0];
        if (pl && Array.isArray(pl.tracks) && pl.tracks.length > 0) {
          eligible = this._prioritizeUnseenTracks(pl.tracks);
        } else {
          eligible = this._prioritizeUnseenTracks(fullCatalog);
        }
      } else {
        const customQ = this._popularityMode === 'youtube' ? (this._ytSearchQuery || '').trim() : '';
        const fKey = this._getFilterCacheKey(this._popularityMode, customQ);
        const cachedFiltered = this._liveFilterCache.get(fKey) || [];
        const artistCached = this._artistFilter ? (this._artistPoolCache.get(normalizeArtistQuery(this._artistFilter)) || []) : [];
        const hasFilters = this._hasActiveMusicalFilters();

        if (hasFilters || (this._popularityMode === 'youtube' && customQ)) {
          const seen = new Set();
          const combined = [];
          const addU = (t, requireStrict = true) => {
            if (!t) return;
            if (requireStrict && hasFilters && !this._trackMatchesActiveFilters(t)) return;
            const s = trackSig(t);
            if (!s || seen.has(s)) return;
            seen.add(s);
            combined.push(t);
          };
          if (Array.isArray(liveOverride)) liveOverride.forEach(t => addU(t, hasFilters));
          artistCached.forEach(t => addU(t, hasFilters));
          cachedFiltered.forEach(t => addU(t, hasFilters));
          // Strictly matching verified vault + catalog songs (Artist + Era + Genre verified!)
          fullCatalog.filter(t => this._trackMatchesActiveFilters(t)).forEach(t => addU(t, true));

          // If artistFilter + era/genre has < 6 exact tracks, relax era/genre while STRICTLY keeping the chosen Artist!
          if (combined.length < 6 && this._artistFilter) {
            [...artistCached, ...fullCatalog].filter(t => this._trackMatchesArtist(t, this._artistFilter)).forEach(t => addU(t, false));
          } else if (combined.length < 6 && this._eraFilter !== 'all') {
            // Relax ONLY genre while STRICTLY preserving chosen Decade! Never leak another decade!
            fullCatalog.filter(t => this._trackMatchesEra(t, this._eraFilter)).forEach(t => addU(t, false));
          }
          // Only if no artist/era/genre filter (pure custom YouTube search with < 4 results) fall back
          if (combined.length < 4 && !hasFilters) {
            fullCatalog.forEach(t => addU(t, false));
          }
          eligible = this._prioritizeUnseenTracks(combined);
        } else if (this._popularityMode === 'youtube') {
          const seen = new Set();
          const combined = [];
          const addU = t => {
            const s = trackSig(t);
            if (!s || seen.has(s)) return;
            seen.add(s);
            combined.push(t);
          };
          if (Array.isArray(liveOverride) && liveOverride.length > 0) liveOverride.forEach(addU);
          this._liveYtPoolCache.forEach(addU);
          fullCatalog.forEach(addU);
          eligible = this._prioritizeUnseenTracks(combined);
        } else if (this._popularityMode === 'hits') {
          const allHits = [...this._liveHitsPoolCache, ...fullCatalog];
          const seen = new Set();
          const dedup = [];
          allHits.forEach(t => {
            const s = trackSig(t);
            if (s && !seen.has(s)) { seen.add(s); dedup.push(t); }
          });
          eligible = this._prioritizeUnseenTracks(dedup);
        } else if (this._popularityMode === 'obscure') {
          const mergedDeep = [];
          const seen = new Set();
          const pushU = t => {
            const s = trackSig(t);
            if (!s || seen.has(s)) return;
            seen.add(s);
            mergedDeep.push(t);
          };
          this._liveObscurePoolCache.forEach(pushU);
          DEEP_CUTS_LIBRARY.forEach(pushU);
          const nonTop = shuffleArr(fullCatalog.filter(t => t._eaOrigin !== 'extra_hit'));
          nonTop.slice(0, Math.min(260, nonTop.length)).forEach(pushU);
          eligible = this._prioritizeUnseenTracks(mergedDeep);
        } else {
          eligible = this._prioritizeUnseenTracks(fullCatalog);
        }
      }

      if (this._seedTrack && this._seedTrack.title) {
        const seed = this._seedTrack;
        const seedSig = trackSig(seed);
        eligible = eligible.filter(t => trackSig(t) !== seedSig);
        eligible.unshift(seed);
      }
      return eligible;
    },

    _cacheRawAudio(key, arrBuf) {
      if (!key || !arrBuf || arrBuf.byteLength < 25000) return;
      if (this._rawAudioCache.has(key)) this._rawAudioCache.delete(key);
      this._rawAudioCache.set(key, arrBuf);
      while (this._rawAudioCache.size > 28) {
        const oldestKey = this._rawAudioCache.keys().next().value;
        this._rawAudioCache.delete(oldestKey);
      }
    },

    _cacheDecodedAudio(key, packed) {
      if (!key || !packed) return;
      if (this._decodedCache.has(key)) this._decodedCache.delete(key);
      this._decodedCache.set(key, packed);
      while (this._decodedCache.size > 24) {
        const oldestKey = this._decodedCache.keys().next().value;
        this._decodedCache.delete(oldestKey);
      }
    },

    _estimateTrackLoadSpeed(track) {
      if (!track) return 9;
      const key = String(track.id || trackSig(track));
      if (this._decodedCache.has(key)) return 0; // Already decoded in RAM (~0ms)
      if (this._rawAudioCache.has(key)) return 1; // Raw bytes already in RAM (~25ms decode)
      const mainEngine = window.DiscoverHomeApp && typeof window.DiscoverHomeApp.getAudioEngine === 'function'
        ? window.DiscoverHomeApp.getAudioEngine()
        : null;
      if (mainEngine && typeof mainEngine._getCachedFullBlobForTrack === 'function') {
        const hit = mainEngine._getCachedFullBlobForTrack(track);
        if (hit && hit.size >= 40000) return 1; // Cached full audio blob in main player (~25ms)
      }
      if (typeof track.previewUrl === 'string' && /^https?:\/\//i.test(track.previewUrl)) {
        return 2; // Single direct HTTP fetch, no search roundtrip (~150-300ms)
      }
      return 3; // Needs parallel YouTube + iTunes lookup
    },

    _sortPacketFastFirst(tracks) {
      if (!Array.isArray(tracks) || tracks.length <= 1) return tracks || [];
      const hasSeed = Boolean(this._seedTrack && this._seedTrack.title && trackSig(tracks[0]) === trackSig(this._seedTrack));
      const head = hasSeed ? [tracks[0]] : [];
      const body = hasSeed ? tracks.slice(1) : tracks.slice();

      // Inspect the front unseen window and bubble up to 8 fast-tier tracks to the front
      // without breaking anti-repetition or variety!
      const scanWindow = Math.min(body.length, 90);
      const fastBuckets = [[], [], []]; // tiers 0, 1, 2
      const pickedIdx = new Set();

      for (let i = 0; i < scanWindow; i++) {
        const tier = this._estimateTrackLoadSpeed(body[i]);
        if (tier <= 2 && fastBuckets[tier].length < 8) {
          fastBuckets[tier].push({ idx: i, tr: body[i] });
        }
      }

      const fastFront = [];
      for (let t = 0; t <= 2 && fastFront.length < 8; t++) {
        for (const item of fastBuckets[t]) {
          if (fastFront.length >= 8) break;
          fastFront.push(item.tr);
          pickedIdx.add(item.idx);
        }
      }

      const rest = body.filter((_, idx) => !pickedIdx.has(idx));
      return [...head, ...fastFront, ...rest];
    },

    _scheduleLobbyWarmup(delayMs = 180) {
      if (this._lobbyWarmTimer) { clearTimeout(this._lobbyWarmTimer); this._lobbyWarmTimer = 0; }
      this._lobbyWarmTimer = setTimeout(() => {
        this._lobbyWarmTimer = 0;
        if (!this._isOpen || this._running) return;
        this._runLobbyWarmup();
      }, Math.max(40, delayMs));
    },

    _runLobbyWarmup() {
      if (!this._isOpen || this._running) return;
      const customQ = this._popularityMode === 'youtube' ? (this._ytSearchQuery || '').trim() : '';
      const hasFilters = this._hasActiveMusicalFilters();
      const fKey = this._getFilterCacheKey(this._popularityMode, customQ);

      const warmCandidates = (list) => {
        if (!this._isOpen || this._running || !Array.isArray(list) || list.length === 0) return;
        const fastSorted = this._sortPacketFastFirst(list);
        const top = fastSorted.slice(0, 3);
        const ctxReady = Boolean(this._audioCtx && this._audioCtx.state === 'running');
        top.forEach((tr, idx) => {
          if (ctxReady && idx < 2) {
            this._resolveTrackAudio(tr, { preferFast: true }).catch(() => {});
          } else {
            this._fetchTrackRawAudio(tr, { preferFast: true }).catch(() => {});
          }
        });
      };

      // If Era/Genre filters OR custom YouTube query are active, warm verified local tracks immediately + stream live matches!
      if (hasFilters || (this._popularityMode === 'youtube' && customQ.length >= 2)) {
        if (hasFilters) {
          const verifiedLocal = this._buildPoolTracks();
          warmCandidates(verifiedLocal);
        }
        const cached = this._liveFilterCache.get(fKey);
        if (Array.isArray(cached) && cached.length > 0) {
          warmCandidates(cached);
        } else {
          let warmedFirstChunk = false;
          this._fetchLiveYouTubeBatch(this._popularityMode, customQ, chunk => {
            if (!this._isOpen || this._running) return;
            if (this._getFilterCacheKey(this._popularityMode, this._popularityMode === 'youtube' ? (this._ytSearchQuery || '').trim() : '') !== fKey) return;
            if (this._activeSheet === 'filters') this._renderStudioSheetContent();
            if (!warmedFirstChunk && chunk.length > 0) {
              warmedFirstChunk = true;
              warmCandidates(this._prioritizeUnseenTracks(chunk));
            }
          }).catch(() => {});
        }
        return;
      }

      const pool = this._buildPoolTracks();
      warmCandidates(pool);

      const needsLiveWarm = (this._popularityMode === 'youtube' && this._liveYtPoolCache.length < 8)
        || (this._popularityMode === 'hits' && this._liveHitsPoolCache.length < 8)
        || (this._popularityMode === 'obscure' && this._liveObscurePoolCache.length < 8);
      if (needsLiveWarm && !this._liveFetchInFlight) {
        this._liveFetchInFlight = true;
        this._fetchLiveYouTubeBatch(this._popularityMode, '', chunk => {
          if (this._isOpen && !this._running && chunk.length > 0) {
            warmCandidates(this._prioritizeUnseenTracks(chunk));
          }
        })
          .catch(() => {})
          .finally(() => { this._liveFetchInFlight = false; });
      }
    },

    async _fetchTrackRawAudio(track, { preferFast = false } = {}) {
      const key = String(track.id || trackSig(track));
      if (this._rawAudioCache.has(key)) return this._rawAudioCache.get(key);
      if (this._rawFetchPromises.has(key)) return this._rawFetchPromises.get(key);

      const job = (async () => {
        const mainEngine = window.DiscoverHomeApp && typeof window.DiscoverHomeApp.getAudioEngine === 'function'
          ? window.DiscoverHomeApp.getAudioEngine()
          : null;

        if (mainEngine && typeof mainEngine._getCachedFullBlobForTrack === 'function') {
          const hit = mainEngine._getCachedFullBlobForTrack(track);
          if (hit && hit.size >= 40000) {
            const arr = await hit.arrayBuffer();
            if (arr && arr.byteLength >= 30000) {
              this._cacheRawAudio(key, arr);
              return arr;
            }
          }
        }

        if (window.IndexedDBStorage && typeof window.IndexedDBStorage.getTrackAudio === 'function' && track.id) {
          try {
            const rec = await window.IndexedDBStorage.getTrackAudio(track.id);
            if (rec && rec.blob && rec.blob.size >= 40000) {
              const arr = await rec.blob.arrayBuffer();
              if (arr && arr.byteLength >= 30000) {
                this._cacheRawAudio(key, arr);
                return arr;
              }
            }
          } catch (_) {}
        }

        const isVirtual = String(track.id || '').startsWith('ea_');
        const racers = [];

        // Racer 1: Direct HTTP studio preview URL (fastest — 1 roundtrip, ~150-300ms!)
        if (typeof track.previewUrl === 'string' && /^https?:\/\//i.test(track.previewUrl)) {
          racers.push((async () => {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 3800);
            try {
              const ar = await fetch(track.previewUrl, { signal: ctrl.signal });
              clearTimeout(tid);
              if (ar.ok) {
                const arr = await ar.arrayBuffer();
                if (arr && arr.byteLength >= 25000) return arr;
              }
            } catch (_) {
              clearTimeout(tid);
            }
            throw new Error('no_direct_preview');
          })());
        }

        // Racer 2: Full YouTube audio extraction (supports any YouTube videoId or title+artist!)
        racers.push((async () => {
          if (!isVirtual && mainEngine && typeof mainEngine.preloadFullTrackInBackground === 'function') {
            const b = await mainEngine.preloadFullTrackInBackground(track);
            if (b && b.size >= 50000) {
              const arr = await b.arrayBuffer();
              if (arr && arr.byteLength >= 45000) return arr;
            }
          }
          throw new Error('no_full');
        })());

        // Racer 3: Fast CORS-safe iTunes 256kbps preview (0ms delay when preferFast or no videoId; 120ms max otherwise!)
        racers.push((async () => {
          if (!preferFast && !isVirtual && track.videoId) {
            await new Promise(r => setTimeout(r, 120));
          }
          const q = `${track.title || ''} ${track.artist || ''}`.replace(/youtube/gi, '').trim();
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 4200);
          try {
            const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=5&country=ES`, { signal: ctrl.signal });
            clearTimeout(tid);
            if (!resp.ok) throw new Error('it_err');
            const data = await resp.json();
            const items = Array.isArray(data?.results) ? data.results : [];
            for (const it of items) {
              if (it && it.previewUrl) {
                if (it.artworkUrl100 && !isRealCoverUrl(track.artworkUrl600)) {
                  rememberTrackCover(track, it.artworkUrl100);
                }
                const ac = new AbortController();
                const atid = setTimeout(() => ac.abort(), 3800);
                try {
                  const ar = await fetch(it.previewUrl, { signal: ac.signal });
                  clearTimeout(atid);
                  if (ar.ok) {
                    const arr = await ar.arrayBuffer();
                    if (arr && arr.byteLength >= 25000) return arr;
                  }
                } catch (_) {
                  clearTimeout(atid);
                }
              }
            }
          } catch (_) {
            clearTimeout(tid);
          }
          throw new Error('no_itunes');
        })());

        const rawArr = await Promise.any(racers);
        this._cacheRawAudio(key, rawArr);
        return rawArr;
      })();

      this._rawFetchPromises.set(key, job);
      try {
        return await job;
      } finally {
        this._rawFetchPromises.delete(key);
      }
    },

    async _resolveTrackAudio(track, { preferFast = false } = {}) {
      const ctx = this._ensureAudioContext();
      const key = String(track.id || trackSig(track));
      if (this._decodedCache.has(key)) return this._decodedCache.get(key);
      if (this._preloadPromises.has(key)) return this._preloadPromises.get(key);

      const job = (async () => {
        const rawArr = await this._fetchTrackRawAudio(track, { preferFast });
        // Always slice(0) so decodeAudioData does not detach our cached ArrayBuffer
        const buffer = await ctx.decodeAudioData(rawArr.slice(0));
        const analysis = analyzeTrackAudio(buffer, track.bpm);
        const packed = { buffer, analysis };
        this._cacheDecodedAudio(key, packed);
        return packed;
      })();

      this._preloadPromises.set(key, job);
      try {
        return await job;
      } finally {
        this._preloadPromises.delete(key);
      }
    },

    // -----------------------------------------------------------------------
    // ARRIVAL-ORDER PARALLEL PACKET PRELOADER
    // Launches a parallel wave from the match packet; whichever song finishes
    // first enters _readyQueue first (plays as Round 1 immediately!), while
    // slower songs keep streaming in the background for instant 0ms rounds.
    // -----------------------------------------------------------------------
    _flushReadyWaiters() {
      const waiters = this._readyWaiters.splice(0, this._readyWaiters.length);
      waiters.forEach(w => {
        if (w.tid) clearTimeout(w.tid);
        try { w.resolve(null); } catch (_) {}
      });
    },

    _pushReadyTrack(item, token) {
      if (token !== this._matchToken || !this._running || !this._isOpen) return;
      if (this._readyWaiters.length > 0) {
        const waiter = this._readyWaiters.shift();
        if (waiter.tid) clearTimeout(waiter.tid);
        waiter.resolve(item);
        return;
      }
      this._readyQueue.push(item);
    },

    _pumpPacketPreloader(token) {
      if (token !== this._matchToken || !this._running || !this._isOpen) return;
      const TARGET_READY = 6;
      const maxConc = (this._readyQueue.length === 0) ? 5 : 3;

      while (
        this._packetInFlight < maxConc &&
        (this._readyQueue.length + this._packetInFlight) < TARGET_READY
      ) {
        let cand = null;
        while (this._packetCursor < this._matchTracksQueue.length) {
          const next = this._matchTracksQueue[this._packetCursor++];
          if (!next) continue;
          const sig = trackSig(next);
          if (!sig || this._packetDispatchedSigs.has(sig)) continue;
          this._packetDispatchedSigs.add(sig);
          cand = next;
          break;
        }

        if (!cand) {
          // For tiny user playlists in infinite Survival/Blitz mode, safely loop packet once exhausted
          if (
            this._matchTracksQueue.length > 0 &&
            !this._packetLivePending &&
            this._packetSuccessCount > 0 &&
            this._readyQueue.length === 0 &&
            this._packetInFlight === 0
          ) {
            this._packetDispatchedSigs.clear();
            this._packetCursor = 0;
            continue;
          }
          break;
        }

        this._packetInFlight += 1;
        const preferFast = this._readyQueue.length === 0;
        this._resolveTrackAudio(cand, { preferFast })
          .then(audioData => {
            if (token !== this._matchToken || !this._running || !this._isOpen) return;
            if (audioData && audioData.buffer && audioData.buffer.duration >= 6) {
              this._packetSuccessCount = (this._packetSuccessCount || 0) + 1;
              this._pushReadyTrack({ track: cand, audioData }, token);
            }
          })
          .catch(() => {})
          .finally(() => {
            if (token !== this._matchToken) return;
            this._packetInFlight = Math.max(0, this._packetInFlight - 1);
            if (this._running && this._isOpen) {
              this._pumpPacketPreloader(token);
              if (
                this._packetInFlight === 0 &&
                this._readyQueue.length === 0 &&
                !this._packetLivePending &&
                this._packetCursor >= this._matchTracksQueue.length
              ) {
                this._flushReadyWaiters();
              }
            }
          });
      }
    },

    _takeNextReadyTrack(token) {
      if (token !== this._matchToken || !this._running || !this._isOpen) {
        return Promise.resolve(null);
      }
      if (this._readyQueue.length > 0) {
        const item = this._readyQueue.shift();
        this._pumpPacketPreloader(token);
        return Promise.resolve(item);
      }
      this._pumpPacketPreloader(token);
      if (
        this._packetInFlight === 0 &&
        !this._packetLivePending &&
        this._packetCursor >= this._matchTracksQueue.length
      ) {
        return Promise.resolve(null);
      }
      return new Promise(resolve => {
        const waiter = { resolve, tid: 0 };
        waiter.tid = setTimeout(() => {
          const idx = this._readyWaiters.indexOf(waiter);
          if (idx >= 0) this._readyWaiters.splice(idx, 1);
          resolve(null);
        }, 12000);
        this._readyWaiters.push(waiter);
      });
    },

    // -----------------------------------------------------------------------
    // MATCH PLANNER & LIFECYCLE (EXAMEN 8 / SUPERVIVENCIA / BLITZ 60s)
    // -----------------------------------------------------------------------
    _buildExamTrialsPlan() {
      // 8 varied rounds: 2 interactive tactile skills + 6 distinct DSP song IDs!
      const skills = shuffleArr(['pitch', 'silence', 'taptempo', 'impostor', 'tuner', 'year']).slice(0, 2);
      const choices = shuffleArr([
        'reverse', 'xray', 'retro', 'chipmunk', 'micro', 'ghost',
        'telephone', 'chopper', 'echo', 'mashup', 'underwater', 'stutter',
        'melody', 'speedrun', 'eqhunter', 'stereoduo'
      ]).slice(0, 6);
      // Avoid placing dual-track trials on Round 0 in Mix so parallel preloader has extra decoded songs ready!
      if (choices[0] === 'mashup' || choices[0] === 'stereoduo') {
        const swapIdx = choices.findIndex((id, i) => i > 0 && id !== 'mashup' && id !== 'stereoduo');
        if (swapIdx > 0) {
          const tmp = choices[0];
          choices[0] = choices[swapIdx];
          choices[swapIdx] = tmp;
        }
      }
      const planIds = [
        choices[0],
        skills[0],
        choices[1],
        choices[2],
        choices[3],
        skills[1],
        choices[4],
        choices[5]
      ];
      return planIds.map(id => TRIALS.find(t => t.id === id) || TRIALS[0]);
    },

    _buildBlitzTrialsPlan() {
      const choiceTrials = shuffleArr(TRIALS.filter(t => t.kind === 'choice'));
      if (choiceTrials.length > 2 && (choiceTrials[0].id === 'mashup' || choiceTrials[0].id === 'stereoduo')) {
        const swapIdx = choiceTrials.findIndex((t, i) => i > 0 && t.id !== 'mashup' && t.id !== 'stereoduo');
        if (swapIdx > 0) {
          const tmp = choiceTrials[0];
          choiceTrials[0] = choiceTrials[swapIdx];
          choiceTrials[swapIdx] = tmp;
        }
      }
      return choiceTrials;
    },

    _buildSurvivalTrialsPlan() {
      const all = shuffleArr(TRIALS);
      if (all.length > 2 && (all[0].id === 'mashup' || all[0].id === 'stereoduo')) {
        const swapIdx = all.findIndex((t, i) => i > 0 && t.id !== 'mashup' && t.id !== 'stereoduo');
        if (swapIdx > 0) {
          const tmp = all[0];
          all[0] = all[swapIdx];
          all[swapIdx] = tmp;
        }
      }
      return all;
    },

    async startMatch() {
      try {
        const mainEngine = window.DiscoverHomeApp && window.DiscoverHomeApp.getAudioEngine();
        if (mainEngine && typeof mainEngine.pause === 'function') mainEngine.pause();
      } catch (_) {}

      this._ensureAudioContext();
      this._stopRoundAudio();
      if (this._lobbyWarmTimer) { clearTimeout(this._lobbyWarmTimer); this._lobbyWarmTimer = 0; }
      if (this._blitzAutoNextTimer) { clearTimeout(this._blitzAutoNextTimer); this._blitzAutoNextTimer = 0; }

      this._closeStudioSheet();
      // Initialize a fresh Arrival-Order Parallel Packet session
      const token = ++this._matchToken;
      this._flushReadyWaiters();
      this._readyQueue = [];
      this._packetCursor = 0;
      this._packetInFlight = 0;
      this._packetDispatchedSigs = new Set();
      this._matchUsedOptionSigs = new Set();
      this._packetLivePending = false;
      this._packetSuccessCount = 0;

      const diff = this._getDiff();
      this._isDailyMatch = false;
      this._dailyPlan = null;
      this._running = true;
      this._roundIndex = 0;
      this._totalRounds = this._formatMode === 'exam' ? 8 : 99;
      this._matchTrialsPlan = this._formatMode === 'exam'
        ? this._buildExamTrialsPlan()
        : (this._formatMode === 'blitz' ? this._buildBlitzTrialsPlan() : this._buildSurvivalTrialsPlan());
      this._score = 0;
      this._streak = 0;
      this._bestStreak = 0;
      this._maxLives = diff.lives;
      this._lives = diff.lives;
      this._blitzRemainingSec = diff.blitzSec || 70.0;
      this._blitzLastFramePerf = performance.now();
      this._roundResults = [];
      this._bestPitchAccuracy = null;
      this._bestSilenceErrMs = null;
      this._bestBpmErr = null;
      this._roundPhase = 'loading';

      this._showView('play');
      this._updateHudUI();
      this._startRenderLoop();

      const customQ = this._popularityMode === 'youtube' ? (this._ytSearchQuery || '').trim() : '';
      const hasFilters = this._hasActiveMusicalFilters();
      const fKey = this._getFilterCacheKey(this._popularityMode, customQ);

      if (this._artistFilter && this._popularityMode !== 'playlist') {
        // SPECIFIC SINGER MODE: pull full verified discography directly from iTunes + local catalog
        const artistName = this._artistFilter;
        const localPool = this._buildPoolTracks();
        this._matchTracksQueue = this._sortPacketFastFirst(localPool);
        if (this._matchTracksQueue.length >= 4) {
          this._pumpPacketPreloader(token);
          this._prehydratePoolCovers(this._matchTracksQueue, token);
        }
        this._packetLivePending = true;
        this._fetchArtistDiscographyTracks(artistName, chunk => {
          if (token !== this._matchToken || !this._running || !this._isOpen) return;
          if (Array.isArray(chunk) && chunk.length > 0) {
            this._spliceLiveTracksIntoQueue(chunk, token);
          }
        })
          .catch(() => {})
          .finally(() => {
            if (token !== this._matchToken) return;
            this._packetLivePending = false;
            if (this._running && this._isOpen) {
              this._pumpPacketPreloader(token);
              if (
                this._packetInFlight === 0 &&
                this._readyQueue.length === 0 &&
                this._packetCursor >= this._matchTracksQueue.length
              ) {
                this._flushReadyWaiters();
              }
            }
          });
      } else if (hasFilters) {
        // Instantly launch using our 100%-verified local Era/Style pool + cached live matches,
        // while streaming even more strictly year-verified iTunes hits in the background!
        const cached = this._liveFilterCache.get(fKey) || [];
        const verifiedPool = this._buildPoolTracks(cached);
        this._matchTracksQueue = this._sortPacketFastFirst(verifiedPool);
        this._pumpPacketPreloader(token);
        this._prehydratePoolCovers(this._matchTracksQueue, token);
        this._triggerBackgroundYouTubeHydration(this._popularityMode, customQ, token);
      } else if (this._popularityMode === 'youtube' && customQ) {
        const cached = this._liveFilterCache.get(fKey);
        if (Array.isArray(cached) && cached.length >= 6) {
          this._matchTracksQueue = this._sortPacketFastFirst(this._buildPoolTracks(cached));
          this._pumpPacketPreloader(token);
          this._prehydratePoolCovers(this._matchTracksQueue, token);
          this._triggerBackgroundYouTubeHydration(this._popularityMode, customQ, token);
        } else {
          // Stream chunks incrementally so Round 1 launches on the VERY FIRST API response (~250-450ms)!
          this._allCatalogCache = this._collectEntireAppCatalog();
          this._matchTracksQueue = [];
          this._packetLivePending = true;
          let gotAnyChunk = false;

          const fallbackTimer = setTimeout(() => {
            if (token !== this._matchToken || !this._running || gotAnyChunk) return;
            this._matchTracksQueue = this._sortPacketFastFirst(this._buildPoolTracks());
            this._pumpPacketPreloader(token);
          }, 2400);

          this._fetchLiveYouTubeBatch(this._popularityMode, customQ, chunk => {
            if (token !== this._matchToken || !this._running || !this._isOpen) return;
            if (Array.isArray(chunk) && chunk.length > 0) {
              gotAnyChunk = true;
              clearTimeout(fallbackTimer);
              this._spliceLiveTracksIntoQueue(chunk, token);
            }
          })
            .catch(() => {})
            .finally(() => {
              clearTimeout(fallbackTimer);
              if (token !== this._matchToken) return;
              this._packetLivePending = false;
              if (this._running && this._isOpen) {
                if (this._matchTracksQueue.length < 6) {
                  this._spliceLiveTracksIntoQueue(this._buildPoolTracks(), token);
                }
                this._pumpPacketPreloader(token);
                if (
                  this._packetInFlight === 0 &&
                  this._readyQueue.length === 0 &&
                  this._packetCursor >= this._matchTracksQueue.length
                ) {
                  this._flushReadyWaiters();
                }
              }
            });
        }
      } else {
        this._matchTracksQueue = this._sortPacketFastFirst(this._buildPoolTracks());
        if (this._matchTracksQueue.length < 1) {
          this._setStageLoader(false);
          toast('No hay canciones disponibles en esta selección');
          this._showView('lobby');
          this._running = false;
          return;
        }
        this._pumpPacketPreloader(token);
        this._prehydratePoolCovers(this._matchTracksQueue, token);
        if (this._popularityMode === 'hits' || this._popularityMode === 'obscure' || this._popularityMode === 'youtube') {
          this._triggerBackgroundYouTubeHydration(this._popularityMode, '', token);
        }
      }

      this._beginRound(0);
    },

    _getTrialForRound(roundIdx) {
      if (this._isDailyMatch && this._dailyPlan && this._dailyPlan.rounds[roundIdx]) {
        return this._dailyPlan.rounds[roundIdx].trial;
      }
      if (this._selectedTrialId && this._selectedTrialId !== 'mix') {
        const locked = TRIALS.find(t => t.id === this._selectedTrialId);
        if (locked) return locked;
      }
      if (this._formatMode === 'exam') {
        return this._matchTrialsPlan[roundIdx % this._matchTrialsPlan.length];
      }
      if (this._formatMode === 'blitz') {
        if (roundIdx > 0 && roundIdx % this._matchTrialsPlan.length === 0) {
          this._matchTrialsPlan = this._buildBlitzTrialsPlan();
        }
        return this._matchTrialsPlan[roundIdx % this._matchTrialsPlan.length];
      }
      if (roundIdx > 0 && roundIdx % TRIALS.length === 0) {
        this._matchTrialsPlan = shuffleArr(TRIALS);
      }
      return this._matchTrialsPlan[roundIdx % this._matchTrialsPlan.length];
    },

    async _beginRound(roundIdx) {
      if (!this._running || !this._isOpen) return;
      const token = this._matchToken;
      this._stopRoundAudio();
      if (this._blitzAutoNextTimer) { clearTimeout(this._blitzAutoNextTimer); this._blitzAutoNextTimer = 0; }

      // Keep infinite Survival/Blitz sessions fed with fresh YouTube batches!
      if (!this._isDailyMatch && !this._artistFilter && roundIdx > 0 && roundIdx % 5 === 0 && this._popularityMode !== 'playlist') {
        this._triggerBackgroundYouTubeHydration(this._popularityMode, this._popularityMode === 'youtube' ? (this._ytSearchQuery || '').trim() : '', token);
      }

      const diff = this._getDiff();
      this._roundIndex = roundIdx;
      this._roundPhase = 'loading';
      this._roundDurationSec = (!this._isDailyMatch && this._formatMode === 'blitz') ? Math.min(15.0, diff.roundSec) : diff.roundSec;
      this._reverseFlipUsed = false;
      this._reverseFlipActive = false;
      this._microFlashesUsed = 0;
      this._microFlashActiveUntil = 0;
      this._microSnapshotWave = null;
      this._ghostBoostUsed = false;
      this._ghostDryTarget = 0.0;
      this._tapTempoStamps = [];
      this._tapTempoResultBpm = null;
      this._silenceArmed = false;
      this._silenceTapped = false;
      this._silenceLastLitBeat = -1;
      this._silenceLastSignedMs = null;
      this._impostorTapped = false;
      this._impostorLastSignedMs = null;
      this._mashupSoloUsed = false;
      this._mashupSoloActiveUntil = 0;
      this._mashupCrossVal = 0.35;
      this._mashupDecoyLabel = '';
      this._underwaterDepthM = 120;
      this._stutterStage = 0;
      this._stutterNudgesUsed = 0;
      this._stutterLoopDur = 0.45;
      this._stutterBounce = 0;
      this._tunerSignalClarity = 0;
      this._melodyContour = null;
      this._melodyLastStep = -1;
      this._melodyCurNoteLabel = '---';
      this._speedrunCurRate = 1.0;
      this._speedrunBrakeUsed = false;
      this._speedrunBrakeUntil = 0;
      this._speedrunHistory = [];
      this._eqActiveBand = 'high';
      this._eqUsedMid = false;
      this._lastRoundPrecision = null;
      this._stereoTrackB = null;
      this._stereoAudioDataB = null;
      this._stereoMonitorMode = 'mix';
      this._stereoUsedSolo = false;
      this._stereoFoundIndices = new Set();
      this._shockwaves = [];
      this._particles = [];
      if (this._xrayPeaks) this._xrayPeaks.fill(0);

      const stageBox = document.getElementById('eaStageBox');
      if (stageBox) {
        stageBox.classList.remove('shake');
        stageBox.classList.toggle('on-fire', this._streak >= 3);
      }

      const trial = this._getTrialForRound(roundIdx);
      this._curTrial = trial;

      const fb = document.getElementById('eaFeedbackCard');
      if (fb) fb.className = 'ea-feedback-card';

      const chNum = String(roundIdx + 1).padStart(2, '0');
      const badge = document.getElementById('eaTrialBadge');
      if (badge) {
        badge.textContent = this._isDailyMatch
          ? `DIARIO · R${roundIdx + 1}/5 · ${trial.name.toUpperCase()}`
          : `CH-${chNum} · ${trial.name.toUpperCase()}`;
      }

      this._renderRoundPips();

      let readyItem = null;
      if (this._isDailyMatch) {
        // Daily Mode: deterministic shared song for roundIdx (pre-decoded in parallel on startDailyMatch)
        const dailyRound = this._dailyPlan?.rounds?.[roundIdx] || null;
        const dailyTrack = dailyRound?.track || null;
        const promise = this._dailyAudioMap.get(roundIdx);
        let resolved = null;
        if (promise) {
          // Check quickly if already resolved before showing loader
          const raced = await Promise.race([promise, Promise.resolve('__PENDING__')]);
          if (raced === '__PENDING__') {
            this._setStageLoader(true, `Cargando Ronda ${roundIdx + 1}/5 del Reto Diario...`);
            this._setPrompt(trial.name, this._dailyPlan?.theme?.title || 'Reto Diario Las Vegas');
            document.getElementById('eaInteractionZone').innerHTML = '';
            resolved = await promise;
          } else {
            resolved = raced;
          }
        }
        if ((!resolved || !resolved.audioData) && dailyTrack) {
          this._setStageLoader(true, `Sintonizando pista diaria ${roundIdx + 1}/5...`);
          const audioData = await this._resolveTrackAudio(dailyTrack, { preferFast: false });
          if (audioData) resolved = { track: dailyTrack, audioData };
        }
        if (resolved && resolved.track && resolved.audioData) {
          readyItem = resolved;
        }
      } else if (this._readyQueue.length > 0) {
        // Zero-flash instant path: if arrival-order preloader already has a decoded song ready, skip the loader completely!
        // If playing "Adivina el Año", prefer a ready track that already carries a verified releaseYear!
        if (trial.id === 'year') {
          const yIdx = this._readyQueue.findIndex(it => it && it.track && Number(it.track.releaseYear) >= 1960);
          readyItem = yIdx >= 0 ? this._readyQueue.splice(yIdx, 1)[0] : this._readyQueue.shift();
        } else {
          readyItem = this._readyQueue.shift();
        }
        this._pumpPacketPreloader(token);
      } else {
        const customQ = (this._ytSearchQuery || '').trim();
        const activeArtist = (!this._isDailyMatch && this._popularityMode !== 'playlist' && this._artistFilter)
          ? this._artistFilter.trim()
          : '';
        const loaderText = activeArtist
          ? `Cargando éxitos de ${activeArtist.slice(0, 20)}...`
          : ((this._packetLivePending && customQ)
            ? `Buscando en YouTube: ${customQ.slice(0, 18)}...`
            : 'Sintonizando cinta...');
        const promptSub = activeArtist
          ? `Discografía exclusiva de ${activeArtist}...`
          : ((this._packetLivePending && customQ)
            ? `Extrayendo temas de "${customQ}"...`
            : 'Cargando audio real...');
        this._setStageLoader(true, loaderText);
        this._setPrompt(trial.name, promptSub);
        document.getElementById('eaInteractionZone').innerHTML = '';
        readyItem = await this._takeNextReadyTrack(token);
      }

      if (token !== this._matchToken || !this._running || !this._isOpen) return;

      if (!readyItem || !readyItem.track || !readyItem.audioData) {
        this._setStageLoader(false);
        toast('Sin conexión estable para decodificar audio');
        this.close();
        return;
      }

      let { track, audioData } = readyItem;

      // For Trial 22 ("Adivina el Año"), guarantee a verified historical releaseYear!
      if (trial.id === 'year') {
        const verifiedYear = await this._ensureTrackReleaseYear(track);
        if (token !== this._matchToken || !this._running || !this._isOpen) return;
        if (!verifiedYear && !this._isDailyMatch) {
          // Try swapping to a verified vault track with known year
          const altIdx = this._readyQueue.findIndex(it => it && it.track && Number(it.track.releaseYear) >= 1960);
          if (altIdx >= 0) {
            const alt = this._readyQueue.splice(altIdx, 1)[0];
            track = alt.track;
            audioData = alt.audioData;
          } else {
            track.releaseYear = 2015;
          }
        }
      }

      // For Trial 21 ("Estéreo L/R"), guarantee a second real decoded song for the Right channel!
      if (trial.id === 'stereoduo') {
        const curSig = trackSig(track);
        let second = null;
        for (let i = 0; i < this._readyQueue.length; i++) {
          const cand = this._readyQueue[i];
          if (cand && cand.track && cand.audioData && cand.audioData.buffer && trackSig(cand.track) !== curSig) {
            second = cand;
            break;
          }
        }
        if (!second) {
          for (const [k, packed] of this._decodedCache.entries()) {
            if (packed && packed.buffer && packed.buffer !== audioData.buffer) {
              const foundTrack = this._matchTracksQueue.find(t => String(t.id || trackSig(t)) === k)
                || this._allCatalogCache.find(t => String(t.id || trackSig(t)) === k);
              if (foundTrack && trackSig(foundTrack) !== curSig && (!this._hasActiveMusicalFilters() || this._trackMatchesActiveFilters(foundTrack))) {
                second = { track: foundTrack, audioData: packed };
                break;
              }
            }
          }
        }
        if (!second) {
          this._pumpPacketPreloader(token);
          this._setStageLoader(true, 'Alineando canales L / R...');
          const awaited = await this._takeNextReadyTrack(token);
          if (token !== this._matchToken || !this._running || !this._isOpen) return;
          if (awaited && awaited.track && awaited.audioData && trackSig(awaited.track) !== curSig) {
            second = awaited;
          }
        }
        if (second && second.track && second.audioData) {
          this._stereoTrackB = second.track;
          this._stereoAudioDataB = second.audioData;
        }
      }

      if (!this._isDailyMatch) recordPlayedTrack(track);
      this._curTrack = track;
      this._curAudioData = audioData;

      // Ensure background workers stay busy filling up to 6 upcoming songs while player plays this round!
      if (!this._isDailyMatch) this._pumpPacketPreloader(token);

      this._setStageLoader(false);
      this._roundPhase = 'playing';
      this._roundStartPerf = performance.now();
      this._blitzLastFramePerf = this._roundStartPerf;
      this._roundElapsedSec = 0;

      this._startTrialDSP(trial.id, track, audioData);
    },

    _setStageLoader(show, text) {
      const el = document.getElementById('eaStageLoader');
      const lbl = document.getElementById('eaLoaderText');
      if (lbl && text) lbl.textContent = text;
      if (el) el.classList.toggle('visible', !!show);
    },

    _setPrompt(title, sub) {
      const t = document.getElementById('eaPromptTitle');
      const s = document.getElementById('eaPromptSub');
      if (t) t.textContent = title || '';
      if (s) s.textContent = sub || '';
    },

    _renderRoundPips() {
      const wrap = document.getElementById('eaRoundPips');
      if (!wrap) return;
      if (!this._isDailyMatch && this._formatMode !== 'exam') {
        const okCount = this._roundResults.filter(r => r.ok).length;
        wrap.innerHTML = `<span style="font-family:var(--ea-mono);font-size:10px;font-weight:800;color:var(--ea-brass);">R${this._roundIndex + 1} · ${okCount} OK</span>`;
        return;
      }
      let html = '';
      for (let i = 0; i < this._totalRounds; i++) {
        let cls = 'ea-pip';
        if (i < this._roundResults.length) cls += this._roundResults[i].ok ? ' done-ok' : ' done-bad';
        else if (i === this._roundIndex) cls += ' current';
        html += `<span class="${cls}"></span>`;
      }
      wrap.innerHTML = html;
    },

    _updateHudUI() {
      const sc = document.getElementById('eaHudScore');
      const st = document.getElementById('eaHudStreak');
      const lw = document.getElementById('eaHudLivesWrap');
      const lr = document.getElementById('eaHudLives');
      const bl = document.getElementById('eaHudBlitz');

      if (sc) sc.textContent = String(this._score).padStart(4, '0');
      if (st) {
        st.textContent = `x${Math.min(5, 1 + Math.floor(this._streak / 2))}`;
        st.classList.toggle('hot', this._streak >= 3);
      }
      if (lw) lw.style.display = (!this._isDailyMatch && this._formatMode === 'survival') ? 'inline-flex' : 'none';
      if (bl) {
        bl.style.display = (!this._isDailyMatch && this._formatMode === 'blitz') ? 'inline-flex' : 'none';
        if (!this._isDailyMatch && this._formatMode === 'blitz') {
          bl.textContent = `${Math.max(0, this._blitzRemainingSec).toFixed(1)}s`;
          bl.classList.toggle('urgent', this._blitzRemainingSec <= 12);
        }
      }
      if (lr && !this._isDailyMatch && this._formatMode === 'survival') {
        let html = '';
        for (let i = 0; i < this._maxLives; i++) {
          html += `<span class="ea-life-dot ${i >= this._lives ? 'lost' : ''}"></span>`;
        }
        lr.innerHTML = html;
      }
    },

    // -----------------------------------------------------------------------
    // 20 REAL-AUDIO WEB AUDIO DSP TRIALS
    // -----------------------------------------------------------------------
    _stopRoundAudio() {
      try { if (this._roundSource) this._roundSource.stop(); } catch (_) {}
      try { if (this._reverseForwardSrc) this._reverseForwardSrc.stop(); } catch (_) {}
      this._roundNodes.forEach(n => {
        try { if (typeof n.stop === 'function') n.stop(); } catch (_) {}
        try { n.disconnect(); } catch (_) {}
      });
      this._roundSource = null;
      this._reverseForwardSrc = null;
      this._roundNodes = [];
      this._preNormGain = null;
      this._dspOutBus = null;
      this._preAgcAnalyser = null;
      this._agcGain = null;
      this._agcCurrentGain = 1.0;
      this._masterLimiter = null;
      this._roundGain = null;
      this._roundAnalyser = null;
      this._roundAnalyserR = null;
      this._roundFilter1 = null;
      this._roundFilter2 = null;
      this._roundWetGain = null;
      this._roundDryGain = null;
      this._chopperGateGain = null;
      this._echoFbGain = null;
      this._echoWetGain = null;
      this._echoDryGain = null;
      this._vinylNoiseGain = null;
      this._impostorLfoGain = null;
      this._mashupTargetGain = null;
      this._mashupDecoyGain = null;
      this._mashupTargetPan = null;
      this._underwaterLp = null;
      this._stutterCurGain = null;
      this._tunerMusicGain = null;
      this._tunerStaticGain = null;
      this._tunerBpFilter = null;
      this._tunerWhistleOsc = null;
      this._tunerWhistleGain = null;
      this._melodyLeadOsc = null;
      this._melodyBassOsc = null;
      this._melodyLeadGain = null;
      this._melodyBassGain = null;
      this._melodySynthBus = null;
      this._eqBandGains = null;
      this._stereoGainL = null;
      this._stereoGainR = null;
      this._stereoPanL = null;
      this._stereoPanR = null;
    },

    _buildChoicesForTrack(correctTrack, excludeSigs = []) {
      // Daily Mode: return exact deterministic 4 choices in identical order for all players worldwide
      if (this._isDailyMatch) {
        const dailyChoices = this._dailyPlan?.rounds?.[this._roundIndex]?.choices;
        if (Array.isArray(dailyChoices) && dailyChoices.length >= 4) {
          return dailyChoices.map(c => ({ track: c.track, isCorrect: Boolean(c.isCorrect) }));
        }
      }

      const diff = this._getDiff();
      const cSig = trackSig(correctTrack);
      const cArtist = artistSig(correctTrack);
      const targetGenre = String(correctTrack.genre || '').toLowerCase();
      const artistLock = Boolean(this._artistFilter && !this._isDailyMatch && this._popularityMode !== 'playlist');
      const filtersActive = this._hasActiveMusicalFilters();
      const blocked = new Set([cSig, ...(Array.isArray(excludeSigs) ? excludeSigs.filter(Boolean) : [])]);
      const seenInMatch = this._matchUsedOptionSigs || new Set();

      // STRICT FILTER LOCK: When Artist, Era, or Style filters are active, distractors MUST ALSO pass those filters!
      const filterGate = (t) => {
        if (!t || blocked.has(trackSig(t))) return false;
        if (artistLock) return this._trackMatchesArtist(t, this._artistFilter);
        if (filtersActive) return this._trackMatchesActiveFilters(t);
        return true;
      };

      const eraOnlyGate = (t) => {
        if (!t || blocked.has(trackSig(t))) return false;
        if (artistLock) return this._trackMatchesArtist(t, this._artistFilter);
        if (this._eraFilter !== 'all') return this._trackMatchesEra(t, this._eraFilter);
        return true;
      };

      const primaryPool = this._matchTracksQueue.filter(filterGate);
      const artistCachedPool = artistLock
        ? (this._artistPoolCache.get(normalizeArtistQuery(this._artistFilter)) || []).filter(filterGate)
        : [];
      const filteredCatalogPool = this._allCatalogCache.filter(filterGate);
      const eraFallbackPool = (!artistLock && filtersActive && this._eraFilter !== 'all')
        ? this._allCatalogCache.filter(eraOnlyGate)
        : [];
      const emergencyPool = this._allCatalogCache.filter(t => t && !blocked.has(trackSig(t)));

      const distractors = [];
      const used = new Set(blocked);
      const usedArtists = new Set(cArtist ? [cArtist] : []);
      const wantUniqueArtist = !artistLock;

      const pickFrom = (arr, { avoidSeen = true, uniqueArtist = wantUniqueArtist } = {}) => {
        for (const t of shuffleArr(arr)) {
          const s = trackSig(t);
          if (!s || used.has(s)) continue;
          if (avoidSeen && seenInMatch.has(s)) continue;
          const a = artistSig(t);
          if (uniqueArtist && a && usedArtists.has(a)) continue;
          used.add(s);
          if (a) usedArtists.add(a);
          distractors.push(t);
          if (distractors.length >= 3) return;
        }
      };

      const combinedStrict = [...primaryPool, ...artistCachedPool, ...filteredCatalogPool];

      // Tier 1: Same genre (hard mode) + unseen option + distinct artist (relaxed when artist-locked)
      if (!artistLock && diff.tightDistractors && targetGenre) {
        pickFrom(combinedStrict.filter(t => String(t.genre || '').toLowerCase() === targetGenre), { avoidSeen: true, uniqueArtist: true });
      }
      // Tier 2: Strict filtered pool, unseen in this match
      if (distractors.length < 3) pickFrom(primaryPool, { avoidSeen: true, uniqueArtist: wantUniqueArtist });
      if (distractors.length < 3 && artistCachedPool.length > 0) pickFrom(artistCachedPool, { avoidSeen: true, uniqueArtist: false });
      if (distractors.length < 3) pickFrom(filteredCatalogPool, { avoidSeen: true, uniqueArtist: wantUniqueArtist });
      // Tier 3: Strict filtered pool, unseen in this match (allow same artist if needed)
      if (distractors.length < 3) pickFrom(combinedStrict, { avoidSeen: true, uniqueArtist: false });
      // Tier 4: Same Decade (if rare era+genre combo ran out of unseen options — skipped when artist-locked)
      if (distractors.length < 3 && eraFallbackPool.length > 0) {
        pickFrom(eraFallbackPool, { avoidSeen: true, uniqueArtist: true });
        if (distractors.length < 3) pickFrom(eraFallbackPool, { avoidSeen: false, uniqueArtist: true });
      }
      // Tier 5: Recycle within strict filtered pool (only if tiny playlist / exhausted pool)
      if (distractors.length < 3) pickFrom(combinedStrict, { avoidSeen: false, uniqueArtist: wantUniqueArtist });
      if (distractors.length < 3) pickFrom(combinedStrict, { avoidSeen: false, uniqueArtist: false });
      // Tier 6: Last-resort safety net only if playlist itself has < 4 total tracks
      if (distractors.length < 3 && !filtersActive && !artistLock) pickFrom(emergencyPool, { avoidSeen: false, uniqueArtist: true });

      // Mark all 4 options as shown in this match so future rounds stay fresh and non-repetitive!
      seenInMatch.add(cSig);
      distractors.forEach(d => {
        const s = trackSig(d);
        if (s) seenInMatch.add(s);
      });

      return shuffleArr([correctTrack, ...distractors]).map(t => ({
        track: t,
        isCorrect: trackSig(t) === cSig
      }));
    },

    _prehydratePoolCovers(tracks, token) {
      if (!Array.isArray(tracks) || !tracks.length) return;
      const missing = tracks.filter(t => t && !getRealCoverUrl(t)).slice(0, 14);
      if (!missing.length) return;
      let idx = 0;
      const worker = async () => {
        while (idx < missing.length && token === this._matchToken && this._running) {
          const tr = missing[idx++];
          try { await fetchCoverForTrack(tr); } catch (_) {}
        }
      };
      worker();
      worker();
    },

    _renderChoicesGridHtml(choices) {
      return `
        <div class="ea-choices-grid">
          ${choices.map((c, idx) => {
            const sig = trackSig(c.track);
            const cover = getRealCoverUrl(c.track);
            return `
              <button type="button" class="ea-choice-btn" data-cidx="${idx}" data-sig="${escHtml(sig)}">
                <span class="ea-choice-art${cover ? ' has-art' : ''}">
                  <img class="ea-choice-art-img" ${cover ? `src="${escHtml(cover)}"` : ''} alt="" decoding="async">
                  <span class="ea-choice-idx">0${idx + 1}</span>
                </span>
                <span class="ea-choice-meta">
                  <span class="ea-choice-title">${escHtml(c.track.title)}</span>
                  <span class="ea-choice-artist">${escHtml(c.track.artist || 'Artista')}</span>
                </span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    },

    _hydrateChoiceCovers(choices, rootEl) {
      if (!rootEl || !Array.isArray(choices)) return;
      const btns = rootEl.querySelectorAll('.ea-choice-btn');
      choices.forEach((c, idx) => {
        const btn = btns[idx];
        if (!btn || !c || !c.track) return;
        const artWrap = btn.querySelector('.ea-choice-art');
        const img = btn.querySelector('.ea-choice-art-img');
        if (!img || !artWrap) return;

        const revealLoaded = () => {
          if (img.naturalWidth > 0) {
            img.classList.add('loaded');
            artWrap.classList.add('has-art');
          }
        };
        img.addEventListener('load', revealLoaded);
        img.addEventListener('error', () => {
          img.classList.remove('loaded');
          artWrap.classList.remove('has-art');
        });

        const existing = getRealCoverUrl(c.track);
        if (existing) {
          if (img.complete && img.naturalWidth > 0) revealLoaded();
        } else {
          fetchCoverForTrack(c.track).then(url => {
            if (!url || !img.isConnected) return;
            img.src = url;
          }).catch(() => {});
        }
      });
    },

    _renderChoicesUI(choices, lifelineCfg = null) {
      const zone = document.getElementById('eaInteractionZone');
      const lifelineHtml = lifelineCfg ? `
        <div class="ea-lifeline-row">
          <button type="button" id="${lifelineCfg.id}" class="ea-lifeline-btn">
            ${lifelineCfg.icon}
            <span id="${lifelineCfg.id}Lbl">${escHtml(lifelineCfg.label)}</span>
          </button>
        </div>
      ` : '';

      zone.innerHTML = `${this._renderChoicesGridHtml(choices)}${lifelineHtml}`;
      this._hydrateChoiceCovers(choices, zone);

      zone.querySelectorAll('.ea-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._roundPhase !== 'playing') return;
          this._submitChoice(Number(btn.getAttribute('data-cidx')));
        });
      });

      if (lifelineCfg && typeof lifelineCfg.onClick === 'function') {
        const lBtn = document.getElementById(lifelineCfg.id);
        if (lBtn) lBtn.addEventListener('click', lifelineCfg.onClick);
      }
    },

    _startTrialDSP(trialId, track, audioData) {
      const ctx = this._ensureAudioContext();
      const { buffer, analysis } = audioData;
      const startSec = analysis.chorusStartSec || 0;
      const now = ctx.currentTime;

      // =====================================================================
      // 3-STAGE CONSTANT-VOLUME BROADCAST LOUDNESS CHAIN
      // Stage 1: _preNormGain (per-track chorus RMS normalization)
      // Stage 2: _preAgcAnalyser -> _agcGain (feed-forward real-time RMS AGC)
      // Stage 3: _masterLimiter (DynamicsCompressorNode brickwall leveling)
      // =====================================================================
      const preNorm = ctx.createGain();
      preNorm.gain.setValueAtTime(analysis.normGain || 1.0, now);
      this._preNormGain = preNorm;

      const dspOutBus = ctx.createGain();
      dspOutBus.gain.setValueAtTime(1.0, now);
      this._dspOutBus = dspOutBus;

      const preAgcAnalyser = ctx.createAnalyser();
      preAgcAnalyser.fftSize = 256;
      preAgcAnalyser.smoothingTimeConstant = 0.45;
      this._preAgcAnalyser = preAgcAnalyser;
      this._agcFloatBuf = new Float32Array(preAgcAnalyser.fftSize);
      this._agcByteBuf = new Uint8Array(preAgcAnalyser.fftSize);

      // Gentle initial gain seed for naturally quiet filter/cancellation trials so there is zero opening volume dip
      const initAgc = (trialId === 'ghost' || trialId === 'xray' || trialId === 'telephone' || trialId === 'underwater' || trialId === 'eqhunter') ? 1.45 : 1.0;
      const agcGain = ctx.createGain();
      agcGain.gain.setValueAtTime(initAgc, now);
      this._agcGain = agcGain;
      this._agcCurrentGain = initAgc;

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-14, now);
      limiter.knee.setValueAtTime(12, now);
      limiter.ratio.setValueAtTime(10, now);
      limiter.attack.setValueAtTime(0.003, now);
      limiter.release.setValueAtTime(0.15, now);
      this._masterLimiter = limiter;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      this._roundAnalyser = analyser;
      this._roundFft = new Uint8Array(analyser.frequencyBinCount);
      this._roundWave = new Uint8Array(analyser.fftSize);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.92, now + 0.07);
      this._roundGain = masterGain;

      dspOutBus.connect(preAgcAnalyser);
      preAgcAnalyser.connect(agcGain);
      agcGain.connect(limiter);
      limiter.connect(analyser);
      analyser.connect(masterGain);
      masterGain.connect(ctx.destination);
      this._roundNodes.push(preNorm, dspOutBus, preAgcAnalyser, agcGain, limiter, analyser, masterGain);

      // 1. CLAVA EL TONO
      if (trialId === 'pitch') {
        const sp = this._isDailyMatch ? (this._dailyPlan?.rounds?.[this._roundIndex]?.seedParams || null) : null;
        const detuneRate = (sp && Number.isFinite(sp.detuneRate))
          ? sp.detuneRate
          : (Math.random() < 0.5
            ? (0.72 + Math.random() * 0.12)
            : (1.16 + Math.random() * 0.14));
        this._pitchStartRate = detuneRate;
        this._pitchCurrentRate = detuneRate;

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = startSec;
        src.loopEnd = Math.min(buffer.duration, startSec + 18);
        src.playbackRate.setValueAtTime(detuneRate, now);
        src.connect(preNorm);
        preNorm.connect(dspOutBus);
        src.start(now, startSec);
        this._roundSource = src;
        this._roundNodes.push(src);

        this._setPrompt('Clava el tono original', `${track.title} · Ajusta el fader a ciegas sin ver el %`);
        document.getElementById('eaTelemetryLabel').textContent = 'AFINACION CIEGA';

        const zone = document.getElementById('eaInteractionZone');
        zone.innerHTML = `
          <div class="ea-pitch-panel">
            <div class="ea-pitch-scale-labels">
              <span>GRAVE</span>
              <span>OBJETIVO OCULTO</span>
              <span>AGUDO</span>
            </div>
            <div class="ea-pitch-fader-row">
              <button type="button" id="eaPitchMinus" class="ea-step-btn" title="Bajar 1%">-</button>
              <div class="ea-pitch-slider-wrap">
                <input type="range" id="eaPitchSlider" class="ea-pitch-slider" min="65" max="135" step="0.4" value="${(detuneRate * 100).toFixed(1)}">
              </div>
              <button type="button" id="eaPitchPlus" class="ea-step-btn" title="Subir 1%">+</button>
            </div>
            <button type="button" id="eaPitchLockBtn" class="ea-lock-btn">Fijar Afinacion</button>
          </div>
        `;

        const slider = document.getElementById('eaPitchSlider');
        const applySlider = val => {
          const clamped = clamp(Number(val) || 100, 65, 135);
          slider.value = clamped.toFixed(1);
          this._pitchCurrentRate = clamped / 100;
          if (this._roundSource) {
            this._roundSource.playbackRate.setTargetAtTime(this._pitchCurrentRate, ctx.currentTime, 0.02);
          }
        };
        slider.addEventListener('input', () => { if (this._roundPhase === 'playing') applySlider(slider.value); });
        document.getElementById('eaPitchMinus').addEventListener('click', () => { if (this._roundPhase === 'playing') { this._playSfx('click'); applySlider(Number(slider.value) - 1.0); } });
        document.getElementById('eaPitchPlus').addEventListener('click', () => { if (this._roundPhase === 'playing') { this._playSfx('click'); applySlider(Number(slider.value) + 1.0); } });
        document.getElementById('eaPitchLockBtn').addEventListener('click', () => { if (this._roundPhase === 'playing') this._submitPitchLock(); });
        return;
      }

      // 2. CINTA AL REVES
      if (trialId === 'reverse') {
        const revBuffer = createReversedSliceBuffer(ctx, buffer, startSec, 16);
        const src = ctx.createBufferSource();
        src.buffer = revBuffer;
        src.loop = true;
        const revGain = ctx.createGain();
        revGain.gain.setValueAtTime(1.0, now);
        src.connect(preNorm);
        preNorm.connect(revGain);
        revGain.connect(dspOutBus);
        src.start(now);
        this._roundSource = src;
        this._roundWetGain = revGain;
        this._roundNodes.push(src, revGain);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Cinta al reves', 'Identifica la cancion mientras gira invertida');
        document.getElementById('eaTelemetryLabel').textContent = '<< REV TAPE';
        this._renderChoicesUI(this._curChoices, {
          id: 'eaReverseFlipBtn',
          icon: SVG.flip,
          label: 'Voltear cinta 1.5s (1 uso)',
          onClick: () => this._triggerReverseFlip()
        });
        return;
      }

      // 3. SOLO GRAVES
      if (trialId === 'xray') {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = startSec;
        src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const lp1 = ctx.createBiquadFilter(); lp1.type = 'lowpass'; lp1.Q.value = 1.3; lp1.frequency.setValueAtTime(165, now);
        const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.Q.value = 1.0; lp2.frequency.setValueAtTime(165, now);

        src.connect(preNorm);
        preNorm.connect(lp1); lp1.connect(lp2); lp2.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src; this._roundFilter1 = lp1; this._roundFilter2 = lp2;
        this._roundNodes.push(src, lp1, lp2);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Solo graves y bombo', 'Adivina antes de que se abra el espectro');
        document.getElementById('eaTelemetryLabel').textContent = 'LPF 165 HZ';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 4. PULSO EN SILENCIO (Sample-accurate 4 audible -> 4 silent -> tap on beat 8)
      if (trialId === 'silence') {
        const bpm = normalizeHumanBpm(analysis.bpm);
        const beatDur = 60 / bpm;
        this._silenceBeatDur = beatDur;
        this._silenceStartCtx = now + 0.30;
        this._silenceTargetCtx = this._silenceStartCtx + beatDur * 8;
        const muteStartCtx = this._silenceStartCtx + beatDur * 3.72;
        const muteEndCtx = this._silenceStartCtx + beatDur * 3.82;
        this._silenceMuteStartCtx = muteStartCtx;

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = startSec;
        src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const gate = ctx.createGain();
        gate.gain.setValueAtTime(0.95, now);
        gate.gain.setValueAtTime(0.95, muteStartCtx);
        gate.gain.linearRampToValueAtTime(0.0001, muteEndCtx);

        src.connect(preNorm);
        preNorm.connect(gate);
        gate.connect(dspOutBus);
        src.start(this._silenceStartCtx, startSec);

        for (let b = 0; b < 4; b++) {
          const tClick = this._silenceStartCtx + b * beatDur;
          const osc = ctx.createOscillator();
          const cg = ctx.createGain();
          osc.type = b === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(b === 0 ? 1320 : 880, tClick);
          cg.gain.setValueAtTime(0.0001, tClick);
          cg.gain.linearRampToValueAtTime(b === 0 ? 0.22 : 0.15, tClick + 0.005);
          cg.gain.exponentialRampToValueAtTime(0.0001, tClick + 0.065);
          osc.connect(cg); cg.connect(ctx.destination);
          osc.start(tClick); osc.stop(tClick + 0.08);
          this._roundNodes.push(osc, cg);
        }

        this._roundSource = src; this._roundWetGain = gate;
        this._roundNodes.push(src, gate);

        this._setPrompt('Pulso en silencio', `${bpm} BPM · Escucha 1-2-3-4, cuenta 4 en silencio y pulsa el 1`);
        document.getElementById('eaTelemetryLabel').textContent = `SYNC ${bpm} BPM`;

        const zone = document.getElementById('eaInteractionZone');
        zone.innerHTML = `
          <div class="ea-silence-wrap">
            <div class="ea-beat-leds" id="eaBeatLeds">
              <span class="ea-beat-led" data-b="0">1</span>
              <span class="ea-beat-led" data-b="1">2</span>
              <span class="ea-beat-led" data-b="2">3</span>
              <span class="ea-beat-led" data-b="3">4</span>
            </div>
            <button type="button" id="eaPulsePadBtn" class="ea-pulse-pad" disabled>
              <span class="ea-pulse-pad-main" id="eaPulsePadMain">Escucha el compas: 1 · 2 · 3 · 4</span>
              <span class="ea-pulse-pad-sub" id="eaPulsePadSub">Memoriza el pulso antes del silencio</span>
            </button>
          </div>
        `;
        const pad = document.getElementById('eaPulsePadBtn');
        pad.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          if (this._roundPhase !== 'playing' || !this._silenceArmed || this._silenceTapped) return;
          this._submitSilenceTap();
        });
        return;
      }

      // 5. RADIO 8-BIT
      if (trialId === 'retro') {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1350; bp.Q.value = 1.8;
        const shaper = ctx.createWaveShaper(); shaper.curve = createBitcrushCurve(6); shaper.oversample = 'none';
        const wet = ctx.createGain(); wet.gain.setValueAtTime(1.0, now);
        const dry = ctx.createGain(); dry.gain.setValueAtTime(0.0, now);

        src.connect(preNorm);
        preNorm.connect(bp); bp.connect(shaper); shaper.connect(wet); wet.connect(dspOutBus);
        preNorm.connect(dry); dry.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src; this._roundWetGain = wet; this._roundDryGain = dry;
        this._roundNodes.push(src, bp, shaper, wet, dry);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Radio 8-Bit', 'Descifra la senal distorsionada antes de llegar a HD');
        document.getElementById('eaTelemetryLabel').textContent = 'MODO 8-BIT';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 6. ARDILLA / GIGANTE
      if (trialId === 'chipmunk') {
        const sp = this._isDailyMatch ? (this._dailyPlan?.rounds?.[this._roundIndex]?.seedParams || null) : null;
        const isGiant = (sp && typeof sp.isGiant === 'boolean') ? sp.isGiant : (Math.random() < 0.5);
        const startRate = isGiant ? 0.54 : 1.82;
        this._chipmunkIsGiant = isGiant;
        this._chipmunkStartRate = startRate;
        this._chipmunkCurRate = startRate;

        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);
        src.playbackRate.setValueAtTime(startRate, now);
        src.connect(preNorm);
        preNorm.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src; this._roundNodes.push(src);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt(isGiant ? 'Modo Gigante (0.54x)' : 'Modo Ardilla (1.82x)', 'El motor vuelve a 33 RPM poco a poco');
        document.getElementById('eaTelemetryLabel').textContent = isGiant ? '18.0 RPM · GIGANTE' : '60.6 RPM · ARDILLA';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 7. MICRO-FLASH 0.6s
      if (trialId === 'micro') {
        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Micro-Flash 0.6s', 'Solo un destello del estribillo. Pide mas si lo necesitas');
        document.getElementById('eaTelemetryLabel').textContent = 'FLASH 0.65S';
        this._renderChoicesUI(this._curChoices, {
          id: 'eaMicroFlashBtn',
          icon: SVG.micro,
          label: 'Otro flash (+1.3s · menos bonus)',
          onClick: () => this._triggerMicroFlash()
        });
        this._fireMicroBurst(0.65, startSec);
        return;
      }

      // 8. VOZ FANTASMA (Mono-Safe Adaptive Mid/Side Vocal Cancellation + Hall Reverb + Constant Loudness)
      if (trialId === 'ghost') {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const sideRatio = typeof analysis.sideRatio === 'number' ? analysis.sideRatio : 0.35;
        const isMonoOrNarrow = buffer.numberOfChannels <= 1 || sideRatio < 0.22;

        const splitter = ctx.createChannelSplitter(2);
        // Prevent near-total silence on mono/narrow mixes by using partial phase cancellation + vocal notch filter!
        const invR = ctx.createGain();
        invR.gain.value = isMonoOrNarrow ? -0.74 : -1.0;

        const sideSum = ctx.createGain();
        sideSum.gain.value = isMonoOrNarrow
          ? 1.55
          : clamp(0.85 / Math.max(0.22, sideRatio), 1.35, 2.7);

        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 165;
        const vocalNotch = ctx.createBiquadFilter();
        vocalNotch.type = 'peaking';
        vocalNotch.frequency.value = 1450;
        vocalNotch.Q.value = 0.85;
        vocalNotch.gain.value = isMonoOrNarrow ? -14.0 : -4.5;

        const conv = ctx.createConvolver(); conv.buffer = this._hallIrBuffer;
        const revMix = ctx.createGain(); revMix.gain.value = 0.42;

        const wet = ctx.createGain(); wet.gain.setValueAtTime(1.0, now);
        const dry = ctx.createGain(); dry.gain.setValueAtTime(0.03, now);

        const scopeSplit = ctx.createChannelSplitter(2);
        const anR = ctx.createAnalyser(); anR.fftSize = 256;
        this._roundAnalyserR = anR; this._roundWaveR = new Uint8Array(anR.fftSize);

        src.connect(preNorm);
        preNorm.connect(splitter);
        splitter.connect(sideSum, 0);
        if (buffer.numberOfChannels > 1) { splitter.connect(invR, 1); invR.connect(sideSum); }
        sideSum.connect(hp);
        hp.connect(vocalNotch);
        vocalNotch.connect(wet);
        vocalNotch.connect(conv);
        conv.connect(revMix);
        revMix.connect(wet);
        preNorm.connect(dry);

        const mixBus = ctx.createGain();
        wet.connect(mixBus); dry.connect(mixBus); mixBus.connect(dspOutBus);
        limiter.connect(scopeSplit); scopeSplit.connect(anR, 1);
        src.start(now, startSec);

        this._roundSource = src; this._roundWetGain = wet; this._roundDryGain = dry;
        this._roundNodes.push(src, splitter, invR, sideSum, hp, vocalNotch, conv, revMix, wet, dry, mixBus, scopeSplit, anR);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Voz fantasma', 'Voz principal cancelada en fase. Reconoce la instrumental');
        document.getElementById('eaTelemetryLabel').textContent = 'FASE L-R · SIN VOZ';
        this._renderChoicesUI(this._curChoices, {
          id: 'eaGhostBoostBtn',
          icon: SVG.ghost,
          label: 'Traer voz central (+45%)',
          onClick: () => this._triggerGhostBoost()
        });
        return;
      }

      // 9. CLAVA EL BPM (Interactive 5-Tap Tempo Sensor)
      if (trialId === 'taptempo') {
        const targetBpm = normalizeHumanBpm(analysis.bpm);
        this._tapTempoTargetBpm = targetBpm;
        this._tapTempoStamps = [];
        this._tapTempoResultBpm = null;

        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);
        src.connect(preNorm);
        preNorm.connect(dspOutBus);
        src.start(now, startSec);
        this._roundSource = src; this._roundNodes.push(src);

        this._setPrompt('Clava el BPM', `${track.title} · Da 5 toques seguidos al ritmo del pulso`);
        document.getElementById('eaTelemetryLabel').textContent = 'SENSOR BPM CIEGO';

        const zone = document.getElementById('eaInteractionZone');
        zone.innerHTML = `
          <div class="ea-silence-wrap">
            <div class="ea-beat-leds cols-5" id="eaTapLeds">
              <span class="ea-beat-led">1</span>
              <span class="ea-beat-led">2</span>
              <span class="ea-beat-led">3</span>
              <span class="ea-beat-led">4</span>
              <span class="ea-beat-led">5</span>
            </div>
            <button type="button" id="eaTapTempoBtn" class="ea-pulse-pad armed">
              <span class="ea-pulse-pad-main" id="eaTapTempoMain">TAP AL RITMO (0/5)</span>
              <span class="ea-pulse-pad-sub">Marca 5 pulsos constantes al compas de la cancion</span>
            </button>
          </div>
        `;
        const pad = document.getElementById('eaTapTempoBtn');
        pad.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          if (this._roundPhase !== 'playing') return;
          this._handleTapTempoHit();
        });
        return;
      }

      // 10. RADIO 1940 (Vintage Telephone Bandpass + Tube + Synthesized Vinyl Crackle)
      if (trialId === 'telephone') {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 460; hp.Q.value = 1.2;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1750; bp.Q.value = 2.2;
        const tube = ctx.createWaveShaper(); tube.curve = createTubeSoftClipCurve(3.6);

        const wet = ctx.createGain(); wet.gain.setValueAtTime(1.1, now);
        const dry = ctx.createGain(); dry.gain.setValueAtTime(0.0, now);

        // Live procedural vinyl crackle & hiss source (post-AGC so crackle never pumps AGC!)
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = this._vinylCrackleBuffer;
        noiseSrc.loop = true;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.24, now);
        noiseSrc.connect(noiseGain);
        noiseGain.connect(limiter);
        noiseSrc.start(now);

        src.connect(preNorm);
        preNorm.connect(hp); hp.connect(bp); bp.connect(tube); tube.connect(wet); wet.connect(dspOutBus);
        preNorm.connect(dry); dry.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src; this._roundWetGain = wet; this._roundDryGain = dry; this._vinylNoiseGain = noiseGain;
        this._roundNodes.push(src, hp, bp, tube, wet, dry, noiseSrc, noiseGain);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Radio 1940', 'Escucha el vinilo antiguo mientras se restaura a Hi-Fi');
        document.getElementById('eaTelemetryLabel').textContent = 'AM 1940 · VINILO';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 11. SENAL CORTADA (Staccato Helicopter Slicer Gate)
      if (trialId === 'chopper') {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const gate = ctx.createGain();
        gate.gain.setValueAtTime(1.0, now);
        src.connect(preNorm);
        preNorm.connect(gate);
        gate.connect(dspOutBus);
        src.start(now, startSec);

        const bpm = normalizeHumanBpm(analysis.bpm);
        this._chopperFreqHz = clamp((bpm / 60) * 2.5, 3.6, 5.8);
        this._chopperCurDuty = 0.22;
        this._chopperGateGain = gate;
        this._roundSource = src;
        this._roundNodes.push(src, gate);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Senal cortada', 'La transmision entra a rafagas y se abre poco a poco');
        document.getElementById('eaTelemetryLabel').textContent = 'GATE 22% ABIERTO';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 12. CUEVA INFINITA (Cavernous Feedback Dub Delay Wash — Loudness-Controlled)
      if (trialId === 'echo') {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const bpm = normalizeHumanBpm(analysis.bpm);
        const delayTime = clamp((60 / bpm) * 0.75, 0.28, 0.56);

        const delay = ctx.createDelay(1.0);
        delay.delayTime.setValueAtTime(delayTime, now);

        const fbFilter = ctx.createBiquadFilter();
        fbFilter.type = 'bandpass';
        fbFilter.frequency.value = 950;
        fbFilter.Q.value = 0.9;

        const fbGain = ctx.createGain();
        fbGain.gain.setValueAtTime(0.72, now);

        const conv = ctx.createConvolver();
        conv.buffer = this._hallIrBuffer;
        const convMix = ctx.createGain(); convMix.gain.value = 0.55;

        const wet = ctx.createGain(); wet.gain.setValueAtTime(0.92, now);
        const dry = ctx.createGain(); dry.gain.setValueAtTime(0.08, now);

        src.connect(preNorm);
        preNorm.connect(delay);
        delay.connect(fbFilter);
        fbFilter.connect(fbGain);
        fbGain.connect(delay);
        fbFilter.connect(conv);
        conv.connect(convMix);
        convMix.connect(wet);
        delay.connect(wet);
        wet.connect(dspOutBus);

        preNorm.connect(dry);
        dry.connect(dspOutBus);

        src.start(now, startSec);

        this._roundSource = src; this._echoFbGain = fbGain; this._echoWetGain = wet; this._echoDryGain = dry;
        this._roundNodes.push(src, delay, fbFilter, fbGain, conv, convMix, wet, dry);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Cueva infinita', 'Eco dub extremo que se despeja segundo a segundo');
        document.getElementById('eaTelemetryLabel').textContent = 'DUB ECO 72%';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 13. CAZA EL FALLO (Live Pitch-Sabotage Reflex Catcher)
      if (trialId === 'impostor') {
        const diff = this._getDiff();
        const delaySec = 2.0 + Math.random() * 3.1;
        const dir = Math.random() < 0.5 ? 1 : -1;
        this._impostorGlitchCtx = now + delaySec;
        this._impostorGlitchDir = dir;
        this._impostorTapped = false;
        this._impostorLastSignedMs = null;

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = startSec;
        src.loopEnd = Math.min(buffer.duration, startSec + 18);

        // Schedule sudden sample-accurate sour pitch sabotage + unstable tape warble
        if (src.detune) {
          src.detune.setValueAtTime(0, now);
          src.detune.setValueAtTime(0, this._impostorGlitchCtx);
          src.detune.linearRampToValueAtTime(dir * diff.impostorCents, this._impostorGlitchCtx + 0.085);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(6.0, now);
          lfoGain.gain.setValueAtTime(0, now);
          lfoGain.gain.setValueAtTime(0, this._impostorGlitchCtx);
          lfoGain.gain.linearRampToValueAtTime(28, this._impostorGlitchCtx + 0.14);
          lfo.connect(lfoGain);
          lfoGain.connect(src.detune);
          lfo.start(now);
          this._impostorLfoGain = lfoGain;
          this._roundNodes.push(lfo, lfoGain);
        } else {
          const shiftRate = Math.pow(2, (dir * diff.impostorCents) / 1200);
          src.playbackRate.setValueAtTime(1.0, now);
          src.playbackRate.setValueAtTime(1.0, this._impostorGlitchCtx);
          src.playbackRate.linearRampToValueAtTime(shiftRate, this._impostorGlitchCtx + 0.085);
        }

        src.connect(preNorm);
        preNorm.connect(dspOutBus);
        src.start(now, startSec);
        this._roundSource = src;
        this._roundNodes.push(src);

        this._setPrompt('Caza el fallo', `${track.title} · Pulsa EN CUANTO la cinta desafine`);
        document.getElementById('eaTelemetryLabel').textContent = 'MONITOR DE TONO';

        const zone = document.getElementById('eaInteractionZone');
        zone.innerHTML = `
          <div class="ea-silence-wrap">
            <div class="ea-impostor-strip" id="eaImpostorStrip">
              <span class="ea-impostor-led lit">CINTA EN DIRECTO</span>
              <span class="ea-impostor-led" id="eaImpostorStatusLed">ESCUCHA EL TONO</span>
            </div>
            <button type="button" id="eaImpostorBtn" class="ea-pulse-pad armed">
              <span class="ea-pulse-pad-main" id="eaImpostorMain">CAZAR FALLO DE TONO</span>
              <span class="ea-pulse-pad-sub" id="eaImpostorSub">No pulses antes: espera a oir la desafinacion</span>
            </button>
          </div>
        `;
        const btn = document.getElementById('eaImpostorBtn');
        btn.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          if (this._roundPhase !== 'playing' || this._impostorTapped) return;
          this._submitImpostorHit();
        });
        return;
      }

      // 14. DOBLE VINILO (Live 2-Song DJ Mashup Clash!)
      if (trialId === 'mashup') {
        const curSig = trackSig(track);
        let decoyEntry = null;
        // 1. Peek an already-decoded rival song from our parallel preloader queue (without consuming it!)
        for (const item of this._readyQueue) {
          if (item && item.track && item.audioData && item.audioData.buffer && trackSig(item.track) !== curSig) {
            decoyEntry = item;
            break;
          }
        }
        // 2. Otherwise check _decodedCache for any other previously decoded track
        if (!decoyEntry) {
          for (const [k, packed] of this._decodedCache.entries()) {
            if (packed && packed.buffer && packed.buffer !== buffer) {
              const foundTrack = this._matchTracksQueue.find(t => String(t.id || trackSig(t)) === k)
                || this._allCatalogCache.find(t => String(t.id || trackSig(t)) === k);
              if (!foundTrack || trackSig(foundTrack) !== curSig) {
                decoyEntry = { track: foundTrack || null, audioData: packed };
                break;
              }
            }
          }
        }

        const targetSrc = ctx.createBufferSource();
        targetSrc.buffer = buffer;
        targetSrc.loop = true;
        targetSrc.loopStart = startSec;
        targetSrc.loopEnd = Math.min(buffer.duration, startSec + 18);

        const targetGain = ctx.createGain();
        targetGain.gain.setValueAtTime(0.62, now);
        const targetPan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
        if (targetPan) targetPan.pan.setValueAtTime(-0.34, now);

        targetSrc.connect(preNorm);
        if (targetPan) { preNorm.connect(targetPan); targetPan.connect(targetGain); }
        else { preNorm.connect(targetGain); }
        targetGain.connect(dspOutBus);
        targetSrc.start(now, startSec);

        // Decoy Deck B: either a real second song or a synthesized funky studio clash loop!
        const decoySrc = ctx.createBufferSource();
        let decoyNormGain = 1.0;
        let decoyStart = 0;
        let decoySig = '';
        if (decoyEntry && decoyEntry.audioData && decoyEntry.audioData.buffer) {
          decoySrc.buffer = decoyEntry.audioData.buffer;
          decoyStart = decoyEntry.audioData.analysis?.chorusStartSec || 0;
          decoyNormGain = decoyEntry.audioData.analysis?.normGain || 1.0;
          decoySrc.loop = true;
          decoySrc.loopStart = decoyStart;
          decoySrc.loopEnd = Math.min(decoySrc.buffer.duration, decoyStart + 18);
          if (decoyEntry.track) {
            decoySig = trackSig(decoyEntry.track);
            this._mashupDecoyLabel = decoyEntry.track.artist || decoyEntry.track.title || 'PISTA B';
          } else {
            this._mashupDecoyLabel = 'VINILO B';
          }
        } else {
          decoySrc.buffer = this._createStudioClashLoopBuffer(ctx, normalizeHumanBpm(analysis.bpm));
          decoySrc.loop = true;
          decoyNormGain = 0.95;
          this._mashupDecoyLabel = 'SYNTH DUB B';
        }

        const decoyNorm = ctx.createGain();
        decoyNorm.gain.setValueAtTime(decoyNormGain, now);
        const decoyHp = ctx.createBiquadFilter();
        decoyHp.type = 'highpass';
        decoyHp.frequency.value = 180;
        const decoyGain = ctx.createGain();
        decoyGain.gain.setValueAtTime(0.82, now);
        const decoyPan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
        if (decoyPan) decoyPan.pan.setValueAtTime(0.36, now);

        decoySrc.connect(decoyNorm);
        decoyNorm.connect(decoyHp);
        if (decoyPan) { decoyHp.connect(decoyPan); decoyPan.connect(decoyGain); }
        else { decoyHp.connect(decoyGain); }
        decoyGain.connect(dspOutBus);
        decoySrc.start(now, decoyStart);

        this._roundSource = targetSrc;
        this._mashupTargetGain = targetGain;
        this._mashupDecoyGain = decoyGain;
        this._mashupTargetPan = targetPan;
        this._mashupCrossVal = 0.35;
        this._roundNodes.push(targetSrc, targetGain, decoySrc, decoyNorm, decoyHp, decoyGain);
        if (targetPan) this._roundNodes.push(targetPan);
        if (decoyPan) this._roundNodes.push(decoyPan);

        // Guarantee ONLY the target track appears in the 4 buttons (never the decoy!)
        this._curChoices = this._buildChoicesForTrack(track, decoySig ? [decoySig] : []);
        this._setPrompt('Doble vinilo DJ', 'Suenan 2 temas a la vez · Solo UNO esta en las opciones');
        document.getElementById('eaTelemetryLabel').textContent = 'MIX A/B · 35%';
        this._renderChoicesUI(this._curChoices, {
          id: 'eaMashupSoloBtn',
          icon: SVG.mashup,
          label: 'Aislar canal 1.5s (1 uso)',
          onClick: () => this._triggerMashupSolo()
        });
        return;
      }

      // 15. SUBMARINO (Liquid Resonant LFO Wah-Phaser Rising from -120m to Surface)
      if (trialId === 'underwater') {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = startSec;
        src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const lpRes = ctx.createBiquadFilter();
        lpRes.type = 'lowpass';
        lpRes.frequency.setValueAtTime(340, now);
        lpRes.Q.setValueAtTime(4.2, now);

        const wahPeak = ctx.createBiquadFilter();
        wahPeak.type = 'peaking';
        wahPeak.frequency.setValueAtTime(620, now);
        wahPeak.Q.setValueAtTime(3.4, now);
        wahPeak.gain.setValueAtTime(8.5, now);

        const wahLfo = ctx.createOscillator();
        const wahDepth = ctx.createGain();
        wahLfo.type = 'sine';
        wahLfo.frequency.setValueAtTime(0.62, now);
        wahDepth.gain.setValueAtTime(360, now);
        wahLfo.connect(wahDepth);
        wahDepth.connect(wahPeak.frequency);
        wahLfo.start(now);

        // Liquid underwater chorus delay
        const chDelay = ctx.createDelay(0.1);
        chDelay.delayTime.setValueAtTime(0.017, now);
        const chLfo = ctx.createOscillator();
        const chDepth = ctx.createGain();
        chLfo.type = 'sine';
        chLfo.frequency.setValueAtTime(0.85, now);
        chDepth.gain.setValueAtTime(0.0038, now);
        chLfo.connect(chDepth);
        chDepth.connect(chDelay.delayTime);
        chLfo.start(now);
        const chMix = ctx.createGain();
        chMix.gain.setValueAtTime(0.35, now);

        const wet = ctx.createGain();
        wet.gain.setValueAtTime(1.0, now);
        const dry = ctx.createGain();
        dry.gain.setValueAtTime(0.0, now);

        src.connect(preNorm);
        preNorm.connect(lpRes);
        lpRes.connect(wahPeak);
        wahPeak.connect(wet);
        wahPeak.connect(chDelay);
        chDelay.connect(chMix);
        chMix.connect(wet);
        wet.connect(dspOutBus);

        preNorm.connect(dry);
        dry.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src;
        this._underwaterLp = lpRes;
        this._roundWetGain = wet;
        this._roundDryGain = dry;
        this._underwaterDepthM = 120;
        this._roundNodes.push(src, lpRes, wahPeak, wahLfo, wahDepth, chDelay, chLfo, chDepth, chMix, wet, dry);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Submarino', 'Sonido sumergido a -120m · Sube poco a poco a superficie');
        document.getElementById('eaTelemetryLabel').textContent = 'SONAR -120M';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 16. VINILO RAYADO (Scratched Groove Stutter Looper + Needle Skip Tonearm)
      if (trialId === 'stutter') {
        this._stutterStage = 0;
        this._stutterNudgesUsed = 0;
        this._stutterOffsetSec = startSec;
        this._stutterLoopDur = 0.46;
        this._stutterBounce = 1.0;

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Vinilo rayado', 'La aguja salta en bucle · Identifica el surco o salta aguja');
        document.getElementById('eaTelemetryLabel').textContent = 'SURCO 0.46S';
        this._renderChoicesUI(this._curChoices, {
          id: 'eaStutterSkipBtn',
          icon: SVG.stutter,
          label: 'Saltar aguja (+1 pista)',
          onClick: () => this._triggerStutterNudge()
        });
        this._launchStutterLoop(startSec, 0.46);
        return;
      }

      // 17. DIAL FM 88-108 (Interactive Analog FM Radio Static & Heterodyne Tuner)
      if (trialId === 'tuner') {
        const sp = this._isDailyMatch ? (this._dailyPlan?.rounds?.[this._roundIndex]?.seedParams || null) : null;
        const targetMhz = (sp && Number.isFinite(sp.targetMhz))
          ? sp.targetMhz
          : Math.round((89.6 + Math.random() * 16.8) * 10) / 10;
        let startMhz = (sp && Number.isFinite(sp.startMhz))
          ? sp.startMhz
          : Math.round((88.2 + Math.random() * 19.6) * 10) / 10;
        if (Math.abs(startMhz - targetMhz) < 4.5) {
          startMhz = targetMhz > 98 ? Math.max(88.2, targetMhz - 6.8) : Math.min(107.8, targetMhz + 6.8);
          startMhz = Math.round(startMhz * 10) / 10;
        }
        this._tunerTargetMhz = targetMhz;
        this._tunerCurMhz = startMhz;
        this._tunerSignalClarity = 0;

        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1400, now);
        bp.Q.setValueAtTime(0.55, now);

        const musicGain = ctx.createGain();
        musicGain.gain.setValueAtTime(0.05, now);

        src.connect(preNorm);
        preNorm.connect(bp);
        bp.connect(musicGain);
        musicGain.connect(dspOutBus);
        src.start(now, startSec);

        // Procedural FM inter-station static (routed post-AGC into limiter so static never pumps AGC!)
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = this._fmStaticBuffer;
        noiseSrc.loop = true;
        const nHp = ctx.createBiquadFilter(); nHp.type = 'highpass'; nHp.frequency.value = 340;
        const nLp = ctx.createBiquadFilter(); nLp.type = 'lowpass'; nLp.frequency.value = 6400;
        const staticGain = ctx.createGain(); staticGain.gain.setValueAtTime(0.24, now);
        noiseSrc.connect(nHp); nHp.connect(nLp); nLp.connect(staticGain); staticGain.connect(limiter);
        noiseSrc.start(now);

        // Subtle analog heterodyne carrier whistle as you approach the secret frequency
        const whistleOsc = ctx.createOscillator();
        const whistleGain = ctx.createGain();
        whistleOsc.type = 'sine';
        whistleOsc.frequency.setValueAtTime(1200, now);
        whistleGain.gain.setValueAtTime(0.0001, now);
        whistleOsc.connect(whistleGain);
        whistleGain.connect(limiter);
        whistleOsc.start(now);

        this._roundSource = src;
        this._tunerMusicGain = musicGain;
        this._tunerStaticGain = staticGain;
        this._tunerBpFilter = bp;
        this._tunerWhistleOsc = whistleOsc;
        this._tunerWhistleGain = whistleGain;
        this._roundNodes.push(src, bp, musicGain, noiseSrc, nHp, nLp, staticGain, whistleOsc, whistleGain);

        this._setPrompt('Dial FM 88-108', `${track.title} · Sintoniza hasta eliminar la estatica`);
        document.getElementById('eaTelemetryLabel').textContent = `FM ${startMhz.toFixed(1)} MHZ`;

        const zone = document.getElementById('eaInteractionZone');
        zone.innerHTML = `
          <div class="ea-pitch-panel">
            <div class="ea-pitch-scale-labels">
              <span>88.0 MHZ</span>
              <span id="eaTunerReadout">BUSCANDO EMISORA</span>
              <span>108.0 MHZ</span>
            </div>
            <div class="ea-pitch-fader-row">
              <button type="button" id="eaTunerMinus" class="ea-step-btn" title="-0.2 MHz">-</button>
              <div class="ea-pitch-slider-wrap">
                <input type="range" id="eaTunerSlider" class="ea-pitch-slider" min="88.0" max="108.0" step="0.1" value="${startMhz.toFixed(1)}">
              </div>
              <button type="button" id="eaTunerPlus" class="ea-step-btn" title="+0.2 MHz">+</button>
            </div>
            <button type="button" id="eaTunerLockBtn" class="ea-lock-btn">Fijar Emisora FM</button>
          </div>
        `;

        const slider = document.getElementById('eaTunerSlider');
        const applyDial = val => {
          const mhz = Math.round(clamp(Number(val) || 98, 88.0, 108.0) * 10) / 10;
          slider.value = mhz.toFixed(1);
          this._applyTunerMhz(mhz);
        };
        slider.addEventListener('input', () => { if (this._roundPhase === 'playing') applyDial(slider.value); });
        document.getElementById('eaTunerMinus').addEventListener('click', () => { if (this._roundPhase === 'playing') { this._playSfx('click'); applyDial(Number(slider.value) - 0.2); } });
        document.getElementById('eaTunerPlus').addEventListener('click', () => { if (this._roundPhase === 'playing') { this._playSfx('click'); applyDial(Number(slider.value) + 0.2); } });
        document.getElementById('eaTunerLockBtn').addEventListener('click', () => { if (this._roundPhase === 'playing') this._submitTunerLock(); });
        this._applyTunerMhz(startMhz);
        return;
      }

      // 18. CHIPTUNE 8-BIT (Real-Time Autocorrelation Melody Extractor + NES Dual-Voice Synth)
      if (trialId === 'melody') {
        const contour = extractMelodyContour(buffer, startSec, 18);
        this._melodyContour = contour;
        this._melodyLastStep = -1;
        this._melodyCurNoteLabel = '---';

        // Real studio song plays silently at start and smoothly fades in over the round
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);
        const dry = ctx.createGain();
        dry.gain.setValueAtTime(0.0, now);
        src.connect(preNorm);
        preNorm.connect(dry);
        dry.connect(dspOutBus);
        src.start(now, startSec);

        // Live 2-voice retro NES/GameBoy synthesizer (Square lead + Triangle -1 oct bass)
        const leadOsc = ctx.createOscillator();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(440, now);
        const leadGain = ctx.createGain();
        leadGain.gain.setValueAtTime(0.0001, now);

        const bassOsc = ctx.createOscillator();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(220, now);
        const bassGain = ctx.createGain();
        bassGain.gain.setValueAtTime(0.0001, now);

        const chipLp = ctx.createBiquadFilter();
        chipLp.type = 'lowpass';
        chipLp.frequency.setValueAtTime(2850, now);

        const synthBus = ctx.createGain();
        synthBus.gain.setValueAtTime(0.95, now);

        leadOsc.connect(leadGain); leadGain.connect(chipLp);
        bassOsc.connect(bassGain); bassGain.connect(chipLp);
        chipLp.connect(synthBus);
        synthBus.connect(dspOutBus);

        leadOsc.start(now);
        bassOsc.start(now);

        this._roundSource = src;
        this._roundDryGain = dry;
        this._melodyLeadOsc = leadOsc;
        this._melodyBassOsc = bassOsc;
        this._melodyLeadGain = leadGain;
        this._melodyBassGain = bassGain;
        this._melodySynthBus = synthBus;
        this._roundNodes.push(src, dry, leadOsc, leadGain, bassOsc, bassGain, chipLp, synthBus);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Chiptune 8-Bit', 'Melodia extraida en vivo con sintetizador NES · Luego entra el tema');
        document.getElementById('eaTelemetryLabel').textContent = 'SYNTH 8-BIT · 100%';
        this._renderChoicesUI(this._curChoices);
        return;
      }

      // 19. RUEDA LOCA (Oscillating Rollercoaster Tape Motor + 2s Magnetic Brake)
      if (trialId === 'speedrun') {
        this._speedrunPhase = Math.random() * Math.PI * 2;
        this._speedrunCurRate = 1.0 + Math.sin(this._speedrunPhase) * 0.44;
        this._speedrunBrakeUsed = false;
        this._speedrunBrakeUntil = 0;
        this._speedrunHistory = [];

        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);
        src.playbackRate.setValueAtTime(this._speedrunCurRate, now);
        src.connect(preNorm);
        preNorm.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src;
        this._roundNodes.push(src);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Rueda Loca', 'El motor oscila como una montana rusa · Usa el freno si te mareas');
        document.getElementById('eaTelemetryLabel').textContent = `MOTOR ${this._speedrunCurRate.toFixed(2)}X`;
        this._renderChoicesUI(this._curChoices, {
          id: 'eaSpeedrunBrakeBtn',
          icon: SVG.speedrun,
          label: 'Freno de motor 2s (1 uso)',
          onClick: () => this._triggerSpeedrunBrake()
        });
        return;
      }

      // 20. CONSOLA EQ (Interactive 3-Band Live Studio Mastering Isolator)
      if (trialId === 'eqhunter') {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.loop = true; src.loopStart = startSec; src.loopEnd = Math.min(buffer.duration, startSec + 18);

        // Band 1: LOW (<250 Hz 24dB/oct)
        const lp1 = ctx.createBiquadFilter(); lp1.type = 'lowpass'; lp1.frequency.value = 250; lp1.Q.value = 1.1;
        const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 250; lp2.Q.value = 0.9;
        const gLow = ctx.createGain(); gLow.gain.setValueAtTime(0.001, now);

        // Band 2: MID (1250 Hz Bandpass)
        const bpMid = ctx.createBiquadFilter(); bpMid.type = 'bandpass'; bpMid.frequency.value = 1250; bpMid.Q.value = 1.25;
        const gMid = ctx.createGain(); gMid.gain.setValueAtTime(0.001, now);

        // Band 3: HIGH (>3200 Hz 24dB/oct — starts soloed!)
        const hp1 = ctx.createBiquadFilter(); hp1.type = 'highpass'; hp1.frequency.value = 3200; hp1.Q.value = 1.0;
        const hp2 = ctx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 3200; hp2.Q.value = 0.85;
        const gHigh = ctx.createGain(); gHigh.gain.setValueAtTime(1.6, now);

        src.connect(preNorm);
        preNorm.connect(lp1); lp1.connect(lp2); lp2.connect(gLow); gLow.connect(dspOutBus);
        preNorm.connect(bpMid); bpMid.connect(gMid); gMid.connect(dspOutBus);
        preNorm.connect(hp1); hp1.connect(hp2); hp2.connect(gHigh); gHigh.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src;
        this._eqActiveBand = 'high';
        this._eqUsedMid = false;
        this._eqBandGains = { low: gLow, mid: gMid, high: gHigh };
        this._roundNodes.push(src, lp1, lp2, gLow, bpMid, gMid, hp1, hp2, gHigh);

        this._curChoices = this._buildChoicesForTrack(track);
        this._setPrompt('Consola EQ', 'Cambia de banda en vivo (Graves, Medios o Agudos) para descifrar la mezcla');
        document.getElementById('eaTelemetryLabel').textContent = 'SOLO · AGUDOS >3.2K';
        this._renderEqRackChoicesUI(this._curChoices);
        return;
      }

      // 21. ESTÉREO L/R (Dual-Track Simultaneous Stereo Identification — Find BOTH!)
      if (trialId === 'stereoduo') {
        const trackB = this._stereoTrackB;
        const audioDataB = this._stereoAudioDataB;

        const srcL = ctx.createBufferSource();
        srcL.buffer = buffer;
        srcL.loop = true;
        srcL.loopStart = startSec;
        srcL.loopEnd = Math.min(buffer.duration, startSec + 18);

        const panL = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
        if (panL) panL.pan.setValueAtTime(trackB ? -0.92 : 0, now);
        const gainL = ctx.createGain();
        gainL.gain.setValueAtTime(0.84, now);

        srcL.connect(preNorm);
        if (panL) { preNorm.connect(panL); panL.connect(gainL); }
        else { preNorm.connect(gainL); }
        gainL.connect(dspOutBus);
        srcL.start(now, startSec);

        this._roundSource = srcL;
        this._stereoGainL = gainL;
        this._stereoPanL = panL;
        this._roundNodes.push(srcL, gainL);
        if (panL) this._roundNodes.push(panL);

        if (trackB && audioDataB && audioDataB.buffer) {
          const startB = audioDataB.analysis?.chorusStartSec || 0;
          const normBVal = audioDataB.analysis?.normGain || 1.0;
          const srcR = ctx.createBufferSource();
          srcR.buffer = audioDataB.buffer;
          srcR.loop = true;
          srcR.loopStart = startB;
          srcR.loopEnd = Math.min(audioDataB.buffer.duration, startB + 18);

          const normR = ctx.createGain();
          normR.gain.setValueAtTime(normBVal, now);
          const panR = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
          if (panR) panR.pan.setValueAtTime(0.92, now);
          const gainR = ctx.createGain();
          gainR.gain.setValueAtTime(0.84, now);

          srcR.connect(normR);
          if (panR) { normR.connect(panR); panR.connect(gainR); }
          else { normR.connect(gainR); }
          gainR.connect(dspOutBus);
          srcR.start(now, startB);

          const anR = ctx.createAnalyser();
          anR.fftSize = 256;
          gainR.connect(anR);
          this._roundAnalyserR = anR;
          this._roundWaveR = new Uint8Array(anR.fftSize);

          this._stereoGainR = gainR;
          this._stereoPanR = panR;
          this._roundNodes.push(srcR, normR, gainR, anR);
          if (panR) this._roundNodes.push(panR);
        }

        this._stereoMonitorMode = 'mix';
        this._stereoUsedSolo = false;
        this._stereoFoundIndices = new Set();
        this._curChoices = this._buildStereoDuoChoices(track, trackB);

        const duoCount = trackB ? 2 : 1;
        this._setPrompt('Estéreo L/R', duoCount === 2 ? 'Suenan 2 temas (Izd y Der): toca AMBOS para ganar' : 'Reconoce la canción en el campo estéreo');
        document.getElementById('eaTelemetryLabel').textContent = duoCount === 2 ? 'L + R · ENCUENTRA 2/2' : 'MONITOR ESTÉREO';
        this._renderStereoDuoChoicesUI(this._curChoices);
        return;
      }

      // 22. ADIVINA EL AÑO (Analog Studio Chronometer & Decade Ruler)
      if (trialId === 'year') {
        const diff = this._getDiff();
        const sp = this._isDailyMatch ? (this._dailyPlan?.rounds?.[this._roundIndex]?.seedParams || null) : null;
        const targetYear = clamp(Number(track.releaseYear) || 2010, 1960, 2026);
        const era = ERA_FILTERS[this._eraFilter];
        const zoomed = Boolean(
          !this._isDailyMatch &&
          this._popularityMode !== 'playlist' &&
          era && era.id !== 'all' &&
          targetYear >= era.minYear && targetYear <= era.maxYear
        );

        const minY = zoomed ? era.minYear : Math.min(1970, targetYear - 2);
        const maxY = zoomed ? Math.min(era.maxYear, 2026) : Math.max(2026, targetYear);
        const span = Math.max(6, maxY - minY);
        const minOffset = zoomed ? 2 : 6;
        let startY = (sp && Number.isFinite(sp.startYear)) ? sp.startYear : Math.round((minY + maxY) * 0.5);
        if (!sp || !Number.isFinite(sp.startYear)) {
          for (let tries = 0; tries < 10; tries++) {
            const cand = minY + Math.floor(Math.random() * (span + 1));
            if (Math.abs(cand - targetYear) >= minOffset) { startY = cand; break; }
          }
        }

        this._yearTarget = targetYear;
        this._yearMin = minY;
        this._yearMax = maxY;
        this._yearCur = clamp(startY, minY, maxY);
        this._yearZoomedEra = zoomed;
        this._yearPassTol = zoomed ? Math.max(1, Math.min(2, diff.yearPass - 1)) : diff.yearPass;
        this._yearPerfectTol = zoomed ? 0 : diff.yearPerfect;

        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = startSec;
        src.loopEnd = Math.min(buffer.duration, startSec + 18);
        src.connect(preNorm);
        preNorm.connect(dspOutBus);
        src.start(now, startSec);

        this._roundSource = src;
        this._roundNodes.push(src);

        const bigStep = zoomed ? 2 : 5;
        this._setPrompt('Adivina el Año', `Desliza el cronómetro al año exacto (margen ±${this._yearPassTol} ${this._yearPassTol === 1 ? 'año' : 'años'})`);
        document.getElementById('eaTelemetryLabel').textContent = `DIAL ${minY}–${maxY} · ±${this._yearPassTol}A`;

        // Build visual scale markers along the full-width slider bar
        const tickMarkers = [];
        const tickStep = span <= 10 ? 2 : 10;
        const firstDec = Math.ceil(minY / tickStep) * tickStep;
        tickMarkers.push(minY);
        for (let ty = firstDec; ty < maxY; ty += tickStep) {
          if (ty > minY + 1 && ty < maxY - 1) tickMarkers.push(ty);
        }
        tickMarkers.push(maxY);
        const ticksHtml = tickMarkers.map(ty => {
          const pct = ((ty - minY) / span) * 100;
          const alignCls = pct <= 2 ? 'is-start' : (pct >= 98 ? 'is-end' : '');
          return `<span class="ea-year-tick ${alignCls}" style="left:${pct.toFixed(2)}%">${ty}</span>`;
        }).join('');

        const zone = document.getElementById('eaInteractionZone');
        zone.innerHTML = `
          <div class="ea-pitch-panel ea-year-panel">
            <div class="ea-pitch-scale-labels ea-year-header">
              <span>${minY}</span>
              <span id="eaYearReadout" class="ea-year-readout">AÑO ${this._yearCur}</span>
              <span>${maxY}</span>
            </div>
            <div class="ea-year-rail-wrap">
              <input type="range" id="eaYearSlider" class="ea-pitch-slider ea-year-slider" min="${minY}" max="${maxY}" step="1" value="${this._yearCur}" aria-label="Selector de año de lanzamiento">
              <div class="ea-year-ticks" aria-hidden="true">${ticksHtml}</div>
            </div>
            <div class="ea-year-controls-row">
              <button type="button" class="ea-step-btn ea-step-wide" id="eaYearDownBig">-${bigStep}</button>
              <button type="button" class="ea-step-btn" id="eaYearDown1">-1</button>
              <button type="button" id="eaYearLockBtn" class="ea-lock-btn ea-year-lock-btn">Fijar Año (${this._yearCur})</button>
              <button type="button" class="ea-step-btn" id="eaYearUp1">+1</button>
              <button type="button" class="ea-step-btn ea-step-wide" id="eaYearUpBig">+${bigStep}</button>
            </div>
          </div>
        `;

        const slider = document.getElementById('eaYearSlider');
        let lastTickSfxMs = 0;
        const setYear = (v, fromDrag = false) => {
          if (this._roundPhase !== 'playing') return;
          const nextY = clamp(Math.round(v), this._yearMin, this._yearMax);
          if (nextY !== this._yearCur && fromDrag) {
            const nowMs = performance.now();
            if (nowMs - lastTickSfxMs > 55) {
              lastTickSfxMs = nowMs;
              this._playSfx('tick');
            }
          }
          this._yearCur = nextY;
          if (slider) slider.value = String(this._yearCur);
          this._updateYearUi();
        };
        slider.addEventListener('input', () => setYear(Number(slider.value), true));
        document.getElementById('eaYearDownBig').addEventListener('click', () => { this._playSfx('click'); setYear(this._yearCur - bigStep); });
        document.getElementById('eaYearDown1').addEventListener('click', () => { this._playSfx('click'); setYear(this._yearCur - 1); });
        document.getElementById('eaYearUp1').addEventListener('click', () => { this._playSfx('click'); setYear(this._yearCur + 1); });
        document.getElementById('eaYearUpBig').addEventListener('click', () => { this._playSfx('click'); setYear(this._yearCur + bigStep); });
        document.getElementById('eaYearLockBtn').addEventListener('click', () => {
          if (this._roundPhase === 'playing') this._submitYearLock();
        });
      }
    },

    async _ensureTrackReleaseYear(track) {
      if (!track) return 0;
      const direct = Number(track.releaseYear);
      if (direct >= 1960 && direct <= 2026) return direct;

      const sig = trackSig(track);
      const fromCat = this._allCatalogCache.find(t => t && trackSig(t) === sig && Number(t.releaseYear) >= 1960);
      if (fromCat) {
        track.releaseYear = Number(fromCat.releaseYear);
        return track.releaseYear;
      }

      // Fast iTunes metadata lookup for exact original release year
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1900);
      try {
        const q = `${track.artist || ''} ${track.title || ''}`.trim();
        const resp = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=6&country=ES`,
          { signal: ctrl.signal }
        );
        clearTimeout(tid);
        if (resp.ok) {
          const data = await resp.json();
          const items = Array.isArray(data?.results) ? data.results : [];
          const wantArtist = artistSig(track);
          const yrs = items
            .filter(it => it && it.releaseDate && (!wantArtist || artistSig({ artist: it.artistName }) === wantArtist))
            .map(it => parseInt(String(it.releaseDate).slice(0, 4), 10))
            .filter(y => y >= 1960 && y <= 2026);
          if (yrs.length > 0) {
            // Earliest matching releaseDate avoids later greatest-hits compilation dates!
            track.releaseYear = Math.min(...yrs);
            return track.releaseYear;
          }
        }
      } catch (_) {
        clearTimeout(tid);
      }
      return 0;
    },

    _buildStereoDuoChoices(trackA, trackB) {
      if (!trackB) return this._buildChoicesForTrack(trackA);
      const sigA = trackSig(trackA);
      const sigB = trackSig(trackB);
      const base = this._buildChoicesForTrack(trackA, [sigB]);
      const distractors = base.filter(c => !c.isCorrect).slice(0, 2);
      if (this._matchUsedOptionSigs && sigB) this._matchUsedOptionSigs.add(sigB);
      return shuffleArr([
        { track: trackA, isCorrect: true, stereoCh: 'L' },
        { track: trackB, isCorrect: true, stereoCh: 'R' },
        ...distractors.map(d => ({ track: d.track, isCorrect: false, stereoCh: '' }))
      ]);
    },

    _renderStereoDuoChoicesUI(choices) {
      const zone = document.getElementById('eaInteractionZone');
      zone.innerHTML = `
        ${this._renderChoicesGridHtml(choices)}
        <div class="ea-eq-rack" id="eaStereoRack">
          <button type="button" class="ea-eq-band-btn" data-smon="left">SOLO IZD (L)</button>
          <button type="button" class="ea-eq-band-btn active" data-smon="mix">ESTÉREO L+R</button>
          <button type="button" class="ea-eq-band-btn" data-smon="right">SOLO DER (R)</button>
        </div>
      `;
      this._hydrateChoiceCovers(choices, zone);
      zone.querySelectorAll('.ea-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._roundPhase !== 'playing') return;
          this._submitChoice(Number(btn.getAttribute('data-cidx')));
        });
      });
      zone.querySelectorAll('[data-smon]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._roundPhase !== 'playing') return;
          this._setStereoMonitor(btn.getAttribute('data-smon'));
        });
      });
    },

    _setStereoMonitor(mode) {
      if (!this._audioCtx || this._roundPhase !== 'playing') return;
      if (mode !== 'left' && mode !== 'mix' && mode !== 'right') return;
      this._stereoMonitorMode = mode;
      if (mode !== 'mix') this._stereoUsedSolo = true;
      this._playSfx('click');

      const now = this._audioCtx.currentTime;
      const gL = mode === 'left' ? 1.12 : (mode === 'right' ? 0.12 : 0.84);
      const gR = mode === 'right' ? 1.12 : (mode === 'left' ? 0.12 : 0.84);
      if (this._stereoGainL) this._stereoGainL.gain.setTargetAtTime(gL, now, 0.03);
      if (this._stereoGainR) this._stereoGainR.gain.setTargetAtTime(gR, now, 0.03);

      document.querySelectorAll('#eaStereoRack [data-smon]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-smon') === mode);
      });
      const tel = document.getElementById('eaTelemetryLabel');
      const foundN = this._stereoFoundIndices ? this._stereoFoundIndices.size : 0;
      const labels = {
        left: `SOLO CANAL L · ${foundN}/2`,
        mix: `ESTÉREO L+R · ${foundN}/2`,
        right: `SOLO CANAL R · ${foundN}/2`
      };
      if (tel) tel.textContent = labels[mode] || 'ESTÉREO L/R';
    },

    _updateYearUi() {
      const rEl = document.getElementById('eaYearReadout');
      const bEl = document.getElementById('eaYearLockBtn');
      if (rEl) rEl.textContent = `AÑO ${this._yearCur}`;
      if (bEl) bEl.textContent = `Fijar Año (${this._yearCur})`;
    },

    _submitYearLock() {
      const diff = this._getDiff();
      const errYrs = Math.abs(this._yearCur - this._yearTarget);
      const slider = document.getElementById('eaYearSlider');
      const btn = document.getElementById('eaYearLockBtn');
      if (slider) slider.disabled = true;
      if (btn) btn.disabled = true;
      ['eaYearDownBig', 'eaYearDown1', 'eaYearUp1', 'eaYearUpBig'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.disabled = true;
      });

      const ok = errYrs <= this._yearPassTol;
      const perfect = errYrs <= this._yearPerfectTol;
      let pts = 0, verdict = '', sfx = 'wrong';
      if (errYrs === 0) {
        pts = Math.round(1150 * diff.scoreMult);
        verdict = `AÑO EXACTO (${this._yearTarget}) · +${pts}`;
        sfx = 'perfect';
      } else if (perfect) {
        pts = Math.round(980 * diff.scoreMult);
        verdict = `CASI EXACTO (${this._yearTarget} · ±${errYrs}) · +${pts}`;
        sfx = 'perfect';
      } else if (ok) {
        pts = Math.max(260, Math.round((820 - errYrs * 135) * diff.scoreMult));
        verdict = `ACIERTO (REAL ${this._yearTarget} · ±${errYrs}) · +${pts}`;
        sfx = 'correct';
      } else {
        verdict = `ERA DE ${this._yearTarget} (±${errYrs} AÑOS)`;
      }

      this._lastRoundPrecision = {
        value: errYrs,
        label: errYrs === 0 ? 'Exacto' : `±${errYrs}a`,
        lowerIsBetter: true
      };
      this._resolveRound(ok, pts, verdict, sfx, errYrs === 0 ? `${this._yearTarget} Exacto` : `${this._yearTarget} (±${errYrs})`);
    },

    _renderEqRackChoicesUI(choices) {
      const zone = document.getElementById('eaInteractionZone');
      zone.innerHTML = `
        ${this._renderChoicesGridHtml(choices)}
        <div class="ea-eq-rack" id="eaEqRack">
          <button type="button" class="ea-eq-band-btn" data-band="low">GRAVES</button>
          <button type="button" class="ea-eq-band-btn" data-band="mid">MEDIOS</button>
          <button type="button" class="ea-eq-band-btn active" data-band="high">AGUDOS</button>
        </div>
      `;
      this._hydrateChoiceCovers(choices, zone);
      zone.querySelectorAll('.ea-choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._roundPhase !== 'playing') return;
          this._submitChoice(Number(btn.getAttribute('data-cidx')));
        });
      });
      zone.querySelectorAll('.ea-eq-band-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this._roundPhase !== 'playing') return;
          this._setEqHunterBand(btn.getAttribute('data-band'));
        });
      });
    },

    _setEqHunterBand(band) {
      if (!this._eqBandGains || !this._audioCtx || this._roundPhase !== 'playing') return;
      if (band !== 'low' && band !== 'mid' && band !== 'high') return;
      this._eqActiveBand = band;
      if (band === 'mid') this._eqUsedMid = true;
      this._playSfx('click');

      const now = this._audioCtx.currentTime;
      this._eqBandGains.low.gain.setTargetAtTime(band === 'low' ? 1.45 : 0.001, now, 0.025);
      this._eqBandGains.mid.gain.setTargetAtTime(band === 'mid' ? 1.35 : 0.001, now, 0.025);
      this._eqBandGains.high.gain.setTargetAtTime(band === 'high' ? 1.65 : 0.001, now, 0.025);

      document.querySelectorAll('#eaEqRack .ea-eq-band-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-band') === band);
      });
      const labels = { low: 'SOLO · GRAVES <250', mid: 'SOLO · MEDIOS 1.2K', high: 'SOLO · AGUDOS >3.2K' };
      const tel = document.getElementById('eaTelemetryLabel');
      if (tel) tel.textContent = labels[band] || 'CONSOLA EQ';

      const colMap = { low: 0.22, mid: 0.5, high: 0.78 };
      this._emitParticles(this._canvasW * (colMap[band] || 0.5), this._canvasH * 0.5, '#4ade80', 10);
    },

    _applyTunerMhz(mhz) {
      this._tunerCurMhz = mhz;
      const delta = Math.abs(mhz - this._tunerTargetMhz);
      const clarity = clamp(Math.pow(Math.exp(-Math.pow(delta / 1.95, 2)), 1.25), 0, 1);
      this._tunerSignalClarity = clarity;

      if (this._audioCtx) {
        const now = this._audioCtx.currentTime;
        if (this._tunerMusicGain) {
          this._tunerMusicGain.gain.setTargetAtTime(0.04 + clarity * 1.02, now, 0.025);
        }
        if (this._tunerBpFilter) {
          // Narrow AM-like smear when off-station, crisp wideband FM when locked
          this._tunerBpFilter.Q.setTargetAtTime(0.28 + (1 - clarity) * 2.4, now, 0.03);
          this._tunerBpFilter.frequency.setTargetAtTime(1400 + clarity * 1200, now, 0.03);
        }
        if (this._tunerStaticGain) {
          this._tunerStaticGain.gain.setTargetAtTime(0.27 * (1 - clarity * 0.96), now, 0.025);
        }
        if (this._tunerWhistleOsc && this._tunerWhistleGain) {
          const wZone = (delta > 0.14 && delta < 2.3) ? Math.sin(clamp((delta - 0.14) / 2.16, 0, 1) * Math.PI) : 0;
          this._tunerWhistleOsc.frequency.setTargetAtTime(310 + delta * 460, now, 0.02);
          this._tunerWhistleGain.gain.setTargetAtTime(wZone * 0.045, now, 0.025);
        }
      }

      const tel = document.getElementById('eaTelemetryLabel');
      if (tel) tel.textContent = `FM ${mhz.toFixed(1)} MHZ`;
      const rd = document.getElementById('eaTunerReadout');
      if (rd) rd.textContent = `${mhz.toFixed(1)} MHZ`;
    },

    _submitTunerLock() {
      const diff = this._getDiff();
      const errMhz = Math.round(Math.abs(this._tunerCurMhz - this._tunerTargetMhz) * 10) / 10;
      const accuracy = clamp(Math.round((1 - errMhz / 2.5) * 100), 0, 100);
      if (this._bestPitchAccuracy === null || accuracy > this._bestPitchAccuracy) this._bestPitchAccuracy = accuracy;

      const slider = document.getElementById('eaTunerSlider');
      const btn = document.getElementById('eaTunerLockBtn');
      if (slider) slider.disabled = true;
      if (btn) btn.disabled = true;

      const ok = errMhz <= diff.tunerPassMhz;
      const perfect = errMhz <= diff.tunerPerfectMhz;
      let pts = 0, verdict = '', sfx = 'wrong';
      if (perfect) {
        pts = Math.round(1120 * diff.scoreMult);
        verdict = `FM STEREO CLAVADA (${this._tunerTargetMhz.toFixed(1)} MHz) · +${pts}`;
        sfx = 'perfect';
      } else if (ok) {
        pts = Math.max(260, Math.round((840 - errMhz * 360) * diff.scoreMult));
        verdict = `SINTONIZADA (${this._tunerCurMhz.toFixed(1)} / ${this._tunerTargetMhz.toFixed(1)}) · +${pts}`;
        sfx = 'correct';
      } else {
        verdict = `ESTATICA (EMISORA EN ${this._tunerTargetMhz.toFixed(1)} MHz)`;
      }

      this._lastRoundPrecision = {
        value: Math.round(errMhz * 10) / 10,
        label: `±${errMhz.toFixed(1)} MHz`,
        lowerIsBetter: true
      };
      this._resolveRound(ok, pts, verdict, sfx, `${errMhz.toFixed(1)} MHz`);
    },

    _triggerSpeedrunBrake() {
      if (this._roundPhase !== 'playing' || this._speedrunBrakeUsed || !this._audioCtx) return;
      this._speedrunBrakeUsed = true;
      this._speedrunBrakeUntil = performance.now() + 2150;
      this._playSfx('click');
      this._emitParticles(this._canvasW * 0.5, this._canvasH * 0.52, '#f59e0b', 18);

      const btn = document.getElementById('eaSpeedrunBrakeBtn');
      const lbl = document.getElementById('eaSpeedrunBrakeBtnLbl');
      if (btn) btn.disabled = true;
      if (lbl) lbl.textContent = 'Motor frenado 1.00x...';
      const tel = document.getElementById('eaTelemetryLabel');
      if (tel) tel.textContent = 'FRENO ACTIVO · 1.00X';

      setTimeout(() => {
        if (this._roundPhase !== 'playing') return;
        if (lbl) lbl.textContent = 'Freno agotado';
      }, 2150);
    },

    _createStudioClashLoopBuffer(ctx, bpm = 118) {
      const sr = ctx.sampleRate || 44100;
      const beatSec = 60 / clamp(bpm, 85, 145);
      const barsDur = beatSec * 8;
      const len = Math.max(sr, Math.floor(sr * barsDur));
      const buf = ctx.createBuffer(2, len, sr);
      const chL = buf.getChannelData(0);
      const chR = buf.getChannelData(1);
      const chords = [
        [220.0, 261.63, 329.63, 392.0],
        [174.61, 220.0, 261.63, 329.63],
        [196.0, 246.94, 293.66, 392.0],
        [164.81, 196.0, 246.94, 329.63]
      ];
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const beatPos = t / beatSec;
        const step = Math.floor(beatPos * 2);
        const sub = (beatPos * 2) % 1;
        const chord = chords[Math.floor(beatPos / 2) % chords.length];
        const env = Math.exp(-sub * 5.2) * (step % 2 === 0 ? 1.0 : 0.45);
        let sig = 0;
        for (let c = 0; c < chord.length; c++) {
          sig += Math.sin(2 * Math.PI * chord[c] * t) * 0.14;
        }
        // Subtle offbeat hi-hat noise
        const hatEnv = (step % 2 === 1) ? Math.exp(-sub * 26) * 0.12 : 0;
        const hat = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * hatEnv;
        chL[i] = clamp(sig * env + hat, -0.8, 0.8);
        chR[i] = clamp(sig * env * 0.92 - hat, -0.8, 0.8);
      }
      return buf;
    },

    _launchStutterLoop(offsetSec, loopDurSec) {
      if (!this._curAudioData || !this._dspOutBus || !this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;
      const { buffer, analysis } = this._curAudioData;

      // Crossfade out previous loop cleanly so every needle skip is crisp and click-free
      if (this._stutterCurGain) {
        try {
          this._stutterCurGain.gain.cancelScheduledValues(now);
          this._stutterCurGain.gain.setTargetAtTime(0.0001, now, 0.012);
        } catch (_) {}
      }
      const prevSrc = this._roundSource;
      if (prevSrc) {
        setTimeout(() => { try { prevSrc.stop(); } catch (_) {} }, 55);
      }

      const safeStart = clamp(offsetSec, 0, Math.max(0, buffer.duration - 2.2));
      const safeEnd = clamp(safeStart + loopDurSec, safeStart + 0.25, buffer.duration);

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.loopStart = safeStart;
      src.loopEnd = safeEnd;

      const g = ctx.createGain();
      const normG = analysis?.normGain || 1.0;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(normG, now + 0.018);

      src.connect(g);
      g.connect(this._dspOutBus);
      src.start(now, safeStart);

      this._roundSource = src;
      this._stutterCurGain = g;
      this._stutterOffsetSec = safeStart;
      this._stutterLoopDur = safeEnd - safeStart;
      this._stutterBounce = 1.0;
      this._roundNodes.push(src, g);
    },

    _triggerStutterNudge() {
      if (this._roundPhase !== 'playing' || this._stutterNudgesUsed >= 2 || !this._curAudioData) return;
      this._stutterNudgesUsed += 1;
      this._playSfx('click');
      const nextStage = Math.min(3, Math.max(this._stutterStage + 1, this._stutterNudgesUsed));
      this._stutterStage = nextStage;
      const stageDurs = [0.46, 0.96, 2.2, 16.0];
      const nextDur = stageDurs[nextStage] || 2.2;
      const nextOff = this._stutterOffsetSec + 1.35;
      this._launchStutterLoop(nextOff, nextDur);

      const btn = document.getElementById('eaStutterSkipBtn');
      const lbl = document.getElementById('eaStutterSkipBtnLbl');
      const tel = document.getElementById('eaTelemetryLabel');
      if (tel) tel.textContent = nextDur >= 10 ? 'SURCO LIBRE' : `SURCO ${nextDur.toFixed(2)}S`;
      if (this._stutterNudgesUsed === 1 && lbl) lbl.textContent = 'Saltar aguja otra vez (ultimo)';
      else if (btn) { btn.disabled = true; if (lbl) lbl.textContent = 'Aguja liberada'; }
    },

    _triggerMashupSolo() {
      if (this._roundPhase !== 'playing' || this._mashupSoloUsed || !this._mashupDecoyGain || !this._audioCtx) return;
      this._mashupSoloUsed = true;
      this._mashupSoloActiveUntil = performance.now() + 1550;
      this._playSfx('click');

      const now = this._audioCtx.currentTime;
      this._mashupDecoyGain.gain.setTargetAtTime(0.05, now, 0.03);
      if (this._mashupTargetGain) this._mashupTargetGain.gain.setTargetAtTime(1.05, now, 0.03);

      const btn = document.getElementById('eaMashupSoloBtn');
      const lbl = document.getElementById('eaMashupSoloBtnLbl');
      if (btn) btn.disabled = true;
      if (lbl) lbl.textContent = 'Aislando canal...';
      document.getElementById('eaTelemetryLabel').textContent = 'SOLO CANAL A · 1.5S';

      setTimeout(() => {
        if (this._roundPhase !== 'playing') return;
        if (lbl) lbl.textContent = 'Aislamiento usado';
      }, 1550);
    },

    _submitImpostorHit() {
      const diff = this._getDiff();
      this._impostorTapped = true;
      const ctx = this._ensureAudioContext();
      const signedMs = Math.round((ctx.currentTime - this._impostorGlitchCtx) * 1000);
      this._impostorLastSignedMs = signedMs;

      const btn = document.getElementById('eaImpostorBtn');
      if (btn) btn.disabled = true;

      let ok = false, pts = 0, verdict = '', sfx = 'wrong', metric = '';
      if (signedMs < -65) {
        ok = false;
        verdict = `FALSO POSITIVO (${signedMs}ms antes)`;
        metric = 'Pronto';
      } else {
        const reactMs = Math.max(12, signedMs);
        if (this._bestSilenceErrMs === null || reactMs < this._bestSilenceErrMs) {
          this._bestSilenceErrMs = reactMs;
        }
        metric = `+${reactMs}ms`;
        if (reactMs <= diff.impostorPerfectMs) {
          ok = true;
          pts = Math.round(1120 * diff.scoreMult);
          verdict = `REFLEJO MAESTRO (+${reactMs}ms) · +${pts}`;
          sfx = 'perfect';
        } else if (reactMs <= diff.impostorPassMs) {
          ok = true;
          pts = Math.max(260, Math.round((860 - (reactMs - diff.impostorPerfectMs) * 0.72) * diff.scoreMult));
          verdict = `FALLO CAZADO (+${reactMs}ms) · +${pts}`;
          sfx = 'correct';
        } else {
          ok = false;
          verdict = `TARDE (+${reactMs}ms)`;
        }
      }

      if (ok && reactMs >= 0) {
        this._lastRoundPrecision = {
          value: reactMs,
          label: `${reactMs}ms`,
          lowerIsBetter: true
        };
      }
      this._shockwaves.push({ r: 10, alpha: 1, color: ok ? '#4ade80' : '#ef4444' });
      this._resolveRound(ok, pts, verdict, sfx, metric);
    },

    _handleTapTempoHit() {
      const nowMs = performance.now();
      this._tapTempoStamps.push(nowMs);
      this._playSfx('tap');
      this._pulseFlash = 0.72;
      this._shockwaves.push({ r: 8, alpha: 0.9, color: '#e5c16c' });

      const count = this._tapTempoStamps.length;
      document.querySelectorAll('#eaTapLeds .ea-beat-led').forEach((el, i) => {
        el.classList.toggle('lit', i < count);
      });
      const mainLbl = document.getElementById('eaTapTempoMain');
      if (mainLbl) mainLbl.textContent = count < 5 ? `TAP AL RITMO (${count}/5)` : 'CALCULANDO BPM...';

      if (count >= 5) {
        const intervals = [];
        for (let i = 1; i < this._tapTempoStamps.length; i++) {
          intervals.push(this._tapTempoStamps[i] - this._tapTempoStamps[i - 1]);
        }
        intervals.sort((a, b) => a - b);
        const medianMs = (intervals[1] + intervals[2]) * 0.5;
        let measured = clamp(Math.round(60000 / Math.max(180, medianMs)), 45, 220);

        // Allow half-time or double-time equivalence fairly if player felt half/double pulse!
        const target = this._tapTempoTargetBpm;
        const cands = [measured, measured * 2, measured / 2];
        let bestErr = 999;
        let bestEff = measured;
        cands.forEach(c => {
          const e = Math.abs(c - target);
          if (e < bestErr) { bestErr = e; bestEff = Math.round(c); }
        });

        this._tapTempoResultBpm = bestEff;
        const diff = this._getDiff();
        const err = Math.round(bestErr * 10) / 10;
        if (this._bestBpmErr === null || err < this._bestBpmErr) this._bestBpmErr = err;

        const pad = document.getElementById('eaTapTempoBtn');
        if (pad) pad.disabled = true;

        const ok = err <= diff.bpmPass;
        const perfect = err <= diff.bpmPerfect;
        let pts = 0;
        let verdict = '';
        let sfx = 'wrong';
        if (perfect) {
          pts = Math.round(1100 * diff.scoreMult);
          verdict = `BPM CLAVADO (${bestEff} vs ${target}) · +${pts}`;
          sfx = 'perfect';
        } else if (ok) {
          pts = Math.max(260, Math.round((820 - err * 45) * diff.scoreMult));
          verdict = `EN TEMPO (${bestEff} vs ${target} BPM) · +${pts}`;
          sfx = 'correct';
        } else {
          verdict = `MARCASTE ${bestEff} BPM (REAL ${target})`;
        }

        this._lastRoundPrecision = {
          value: err,
          label: `±${err} BPM`,
          lowerIsBetter: true
        };
        this._resolveRound(ok, pts, verdict, sfx, `${bestEff}/${target} BPM`);
      }
    },

    _fireMicroBurst(durSec, startSec) {
      if (!this._curAudioData || !this._dspOutBus) return;
      const ctx = this._ensureAudioContext();
      const now = ctx.currentTime;
      try { if (this._roundSource) this._roundSource.stop(); } catch (_) {}

      const src = ctx.createBufferSource();
      src.buffer = this._curAudioData.buffer;
      const env = ctx.createGain();
      const normG = this._curAudioData.analysis?.normGain || 1.0;
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(normG, now + 0.02);
      env.gain.setValueAtTime(normG, now + Math.max(0.06, durSec - 0.05));
      env.gain.linearRampToValueAtTime(0.0001, now + durSec);

      src.connect(env); env.connect(this._dspOutBus);
      src.start(now, startSec, durSec + 0.03);
      this._roundSource = src;
      this._roundNodes.push(src, env);
      this._microFlashActiveUntil = performance.now() + durSec * 1000;
      this._pulseFlash = 1.0;

      const ch0 = this._curAudioData.buffer.getChannelData(0);
      const sr = this._curAudioData.buffer.sampleRate;
      const s0 = Math.floor(startSec * sr);
      const totalS = Math.min(ch0.length - s0, Math.floor(durSec * sr));
      const snap = new Float32Array(96);
      const stride = Math.max(1, Math.floor(totalS / snap.length));
      for (let i = 0; i < snap.length; i++) {
        let peak = 0;
        for (let k = 0; k < Math.min(stride, 64); k++) {
          const idx = s0 + i * stride + k;
          if (idx < ch0.length) peak = Math.max(peak, Math.abs(ch0[idx]));
        }
        snap[i] = peak;
      }
      this._microSnapshotWave = snap;
    },

    _triggerMicroFlash() {
      if (this._roundPhase !== 'playing' || this._microFlashesUsed >= 2) return;
      this._microFlashesUsed += 1;
      const dur = this._microFlashesUsed === 1 ? 1.35 : 2.4;
      this._fireMicroBurst(dur, this._curAudioData?.analysis?.chorusStartSec || 0);

      const btn = document.getElementById('eaMicroFlashBtn');
      const lbl = document.getElementById('eaMicroFlashBtnLbl');
      document.getElementById('eaTelemetryLabel').textContent = `FLASH ${dur.toFixed(1)}S`;
      if (this._microFlashesUsed === 1 && lbl) lbl.textContent = 'Ultimo flash (+2.4s · bonus minimo)';
      else if (btn) { btn.disabled = true; if (lbl) lbl.textContent = 'Flashes agotados'; }
    },

    _triggerGhostBoost() {
      if (this._roundPhase !== 'playing' || this._ghostBoostUsed) return;
      this._ghostBoostUsed = true;
      this._ghostDryTarget = 0.45;
      this._playSfx('click');
      const btn = document.getElementById('eaGhostBoostBtn');
      const lbl = document.getElementById('eaGhostBoostBtnLbl');
      if (btn) btn.disabled = true;
      if (lbl) lbl.textContent = 'Voz central reforzada';
      document.getElementById('eaTelemetryLabel').textContent = 'VOZ +45% ACTIVA';
    },

    _triggerReverseFlip() {
      if (this._roundPhase !== 'playing' || this._reverseFlipUsed || !this._curAudioData || !this._dspOutBus) return;
      this._reverseFlipUsed = true;
      this._reverseFlipActive = true;
      const btn = document.getElementById('eaReverseFlipBtn');
      const lbl = document.getElementById('eaReverseFlipBtnLbl');
      if (btn) btn.disabled = true;
      if (lbl) lbl.textContent = 'Girando adelante...';

      const ctx = this._ensureAudioContext();
      const now = ctx.currentTime;
      const { buffer, analysis } = this._curAudioData;
      if (this._roundWetGain) this._roundWetGain.gain.setTargetAtTime(0.001, now, 0.025);

      const fwd = ctx.createBufferSource();
      fwd.buffer = buffer;
      const g = ctx.createGain();
      const normG = analysis.normGain || 1.0;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(normG, now + 0.04);
      g.gain.setValueAtTime(normG, now + 1.4);
      g.gain.linearRampToValueAtTime(0.001, now + 1.55);
      fwd.connect(g); g.connect(this._dspOutBus);
      fwd.start(now, analysis.chorusStartSec || 0, 1.6);
      this._reverseForwardSrc = fwd;
      this._roundNodes.push(fwd, g);

      document.getElementById('eaTelemetryLabel').textContent = 'FWD >> 1.5S';
      setTimeout(() => {
        if (this._roundPhase !== 'playing') return;
        this._reverseFlipActive = false;
        if (this._roundWetGain) this._roundWetGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.04);
        if (lbl) lbl.textContent = 'Giro utilizado';
        document.getElementById('eaTelemetryLabel').textContent = '<< REV TAPE';
      }, 1550);
    },

    // -----------------------------------------------------------------------
    // SUBMISSIONS & SCORING
    // -----------------------------------------------------------------------
    _getCurrentLiveMultiplier() {
      const rem = clamp(1 - this._roundElapsedSec / this._roundDurationSec, 0, 1);
      let m = 1.0 + rem * 2.0;
      if (this._curTrial && this._curTrial.id === 'reverse' && this._reverseFlipUsed) m *= 0.72;
      if (this._curTrial && this._curTrial.id === 'ghost' && this._ghostBoostUsed) m *= 0.75;
      if (this._curTrial && this._curTrial.id === 'mashup' && this._mashupSoloUsed) m *= 0.72;
      if (this._curTrial && this._curTrial.id === 'speedrun' && this._speedrunBrakeUsed) m *= 0.76;
      if (this._curTrial && this._curTrial.id === 'eqhunter' && this._eqUsedMid) m *= 0.85;
      if (this._curTrial && this._curTrial.id === 'stereoduo' && this._stereoUsedSolo) m *= 0.85;
      if (this._curTrial && this._curTrial.id === 'stutter') {
        if (this._stutterNudgesUsed === 1) m *= 0.78;
        else if (this._stutterNudgesUsed >= 2) m *= 0.56;
      }
      if (this._curTrial && this._curTrial.id === 'micro') {
        if (this._microFlashesUsed === 1) m *= 0.68;
        else if (this._microFlashesUsed >= 2) m *= 0.45;
      }
      return Math.max(0.8, Number(m.toFixed(1)));
    },

    _submitChoice(choiceIdx) {
      const choice = this._curChoices[choiceIdx];
      if (!choice) return;
      const diff = this._getDiff();

      // Special 2-target simultaneous mechanic for Trial 21 (Estéreo L/R)
      if (this._curTrial && this._curTrial.id === 'stereoduo') {
        const targetTotal = this._curChoices.filter(c => c.isCorrect).length;
        const btns = document.querySelectorAll('.ea-choice-btn');
        if (choice.isCorrect) {
          if (this._stereoFoundIndices.has(choiceIdx)) return;
          this._stereoFoundIndices.add(choiceIdx);
          const hitBtn = btns[choiceIdx];
          if (hitBtn) {
            hitBtn.disabled = true;
            hitBtn.classList.add('is-correct');
            const idxBadge = hitBtn.querySelector('.ea-choice-idx');
            if (idxBadge && choice.stereoCh) idxBadge.textContent = choice.stereoCh;
          }
          if (this._stereoFoundIndices.size < targetTotal) {
            this._playSfx('perfect');
            const px = choice.stereoCh === 'L' ? this._canvasW * 0.28 : this._canvasW * 0.72;
            this._emitParticles(px, this._canvasH * 0.5, '#4ade80', 14);
            const tel = document.getElementById('eaTelemetryLabel');
            if (tel) tel.textContent = `CANAL ${choice.stereoCh || '1'} CLAVADO · FALTA 1`;
            this._setPrompt('Estéreo L/R', `¡Bien! Canal ${choice.stereoCh} encontrado — ahora toca la otra canción`);
            return;
          }
          btns.forEach((b, i) => {
            b.disabled = true;
            if (!this._curChoices[i].isCorrect) b.classList.add('is-dimmed');
          });
          const mult = this._getCurrentLiveMultiplier();
          const pts = Math.round(440 * mult * diff.scoreMult);
          const verdict = mult >= 2.0 ? `DOBLE ESTÉREO · +${pts}` : `AMBAS CLAVADAS · +${pts}`;
          this._resolveRound(true, pts, verdict, 'perfect', `2/2 · ${mult.toFixed(1)}x`);
          return;
        } else {
          btns.forEach((b, i) => {
            b.disabled = true;
            const c = this._curChoices[i];
            if (c.isCorrect) {
              b.classList.add('is-correct');
              const idxBadge = b.querySelector('.ea-choice-idx');
              if (idxBadge && c.stereoCh) idxBadge.textContent = c.stereoCh;
            } else if (i === choiceIdx) {
              b.classList.add('is-wrong');
            } else {
              b.classList.add('is-dimmed');
            }
          });
          const foundBefore = this._stereoFoundIndices.size;
          const verdict = foundBefore > 0 ? '1/2 · FALLASTE LA SEGUNDA' : 'INCORRECTO';
          this._resolveRound(false, 0, verdict, 'wrong', `${foundBefore}/${targetTotal}`);
          return;
        }
      }

      document.querySelectorAll('.ea-choice-btn').forEach((b, i) => {
        b.disabled = true;
        const c = this._curChoices[i];
        if (c.isCorrect) b.classList.add('is-correct');
        else if (i === choiceIdx) b.classList.add('is-wrong');
        else b.classList.add('is-dimmed');
      });

      const mult = this._getCurrentLiveMultiplier();
      const ok = !!choice.isCorrect;
      const pts = ok ? Math.round(350 * mult * diff.scoreMult) : 0;
      const verdict = ok
        ? (mult >= 2.2 ? `INSTANTÁNEO · +${pts}` : `CORRECTO · +${pts}`)
        : 'INCORRECTO';

      this._resolveRound(ok, pts, verdict, mult >= 2.2 ? 'perfect' : (ok ? 'correct' : 'wrong'), `${mult.toFixed(1)}x`);
    },

    _submitPitchLock() {
      const diff = this._getDiff();
      const errRatio = Math.abs(this._pitchCurrentRate - 1.0);
      const errPct = (errRatio * 100).toFixed(1);
      const signedPct = ((this._pitchCurrentRate - 1.0) * 100);
      const accuracy = clamp(Math.round((1 - errRatio / 0.25) * 100), 0, 100);
      if (this._bestPitchAccuracy === null || accuracy > this._bestPitchAccuracy) this._bestPitchAccuracy = accuracy;

      const slider = document.getElementById('eaPitchSlider');
      const btn = document.getElementById('eaPitchLockBtn');
      if (slider) slider.disabled = true;
      if (btn) btn.disabled = true;

      const ok = errRatio <= diff.pitchPass;
      const perfect = errRatio <= diff.pitchPerfect;
      let pts = 0, verdict = '', sfx = 'wrong';
      if (perfect) {
        pts = Math.round(1080 * diff.scoreMult);
        verdict = `CLAVADO (${signedPct >= 0 ? '+' : ''}${errPct}%) · +${pts}`;
        sfx = 'perfect';
      } else if (ok) {
        pts = Math.max(260, Math.round((780 - errRatio * 6500) * diff.scoreMult));
        verdict = `AFINADO (${signedPct >= 0 ? '+' : ''}${errPct}%) · +${pts}`;
        sfx = 'correct';
      } else {
        verdict = `DESVIADO ${signedPct >= 0 ? '+' : ''}${errPct}%`;
      }

      if (this._roundSource && this._audioCtx) {
        this._roundSource.playbackRate.setTargetAtTime(1.0, this._audioCtx.currentTime, 0.08);
      }
      this._lastRoundPrecision = { value: accuracy, label: `${accuracy}%`, lowerIsBetter: false };
      this._resolveRound(ok, pts, verdict, sfx, `${accuracy}%`);
    },

    _submitSilenceTap() {
      const diff = this._getDiff();
      this._silenceTapped = true;
      const ctx = this._ensureAudioContext();
      const signedMs = Math.round((ctx.currentTime - this._silenceTargetCtx) * 1000);
      const absMs = Math.abs(signedMs);
      this._silenceLastSignedMs = signedMs;
      if (this._bestSilenceErrMs === null || absMs < this._bestSilenceErrMs) this._bestSilenceErrMs = absMs;

      const pad = document.getElementById('eaPulsePadBtn');
      if (pad) pad.disabled = true;
      if (this._roundWetGain) {
        this._roundWetGain.gain.cancelScheduledValues(ctx.currentTime);
        this._roundWetGain.gain.setTargetAtTime(0.92, ctx.currentTime, 0.03);
      }

      const ok = absMs <= diff.silencePassMs;
      const perfect = absMs <= diff.silencePerfectMs;
      let pts = 0, verdict = '', sfx = 'wrong';
      const dirWord = absMs <= 15 ? 'CLAVADO' : (signedMs < 0 ? 'PRONTO' : 'TARDE');
      const signStr = signedMs >= 0 ? `+${signedMs}ms` : `${signedMs}ms`;

      if (perfect) {
        pts = Math.round(1120 * diff.scoreMult);
        verdict = `METRÓNOMO (${signStr}) · +${pts}`;
        sfx = 'perfect';
      } else if (ok) {
        pts = Math.max(240, Math.round((800 - absMs * 2.1) * diff.scoreMult));
        verdict = `EN TIEMPO (${signStr} ${dirWord}) · +${pts}`;
        sfx = 'correct';
      } else {
        verdict = `${dirWord} (${signStr})`;
      }

      this._lastRoundPrecision = { value: absMs, label: `±${absMs}ms`, lowerIsBetter: true };
      this._shockwaves.push({ r: 10, alpha: 1, color: ok ? '#4ade80' : '#ef4444' });
      this._resolveRound(ok, pts, verdict, sfx, signStr);
    },

    _handleRoundTimeout() {
      if (this._roundPhase !== 'playing') return;
      if (this._curTrial.id === 'pitch') { this._submitPitchLock(); return; }
      if (this._curTrial.id === 'tuner') { this._submitTunerLock(); return; }
      if (this._curTrial.id === 'year') { this._submitYearLock(); return; }
      if (this._curTrial.id === 'silence') { this._resolveRound(false, 0, 'TIEMPO AGOTADO', 'wrong', 'Sin pulso'); return; }
      if (this._curTrial.id === 'impostor') {
        const btn = document.getElementById('eaImpostorBtn');
        if (btn) btn.disabled = true;
        this._resolveRound(false, 0, 'SE ESCAPÓ EL FALLO', 'wrong', 'Sin reflejo');
        return;
      }
      if (this._curTrial.id === 'taptempo') {
        const pad = document.getElementById('eaTapTempoBtn');
        if (pad) pad.disabled = true;
        this._resolveRound(false, 0, `FALTABAN TOQUES (REAL ${this._tapTempoTargetBpm} BPM)`, 'wrong', '--');
        return;
      }
      document.querySelectorAll('.ea-choice-btn').forEach((b, i) => {
        b.disabled = true;
        if (this._curChoices[i] && this._curChoices[i].isCorrect) b.classList.add('is-correct');
        else b.classList.add('is-dimmed');
      });
      this._resolveRound(false, 0, 'TIEMPO AGOTADO', 'wrong', '0x');
    },

    _resolveRound(ok, basePoints, verdictText, sfxType, detailMetric) {
      if (this._roundPhase === 'resolved') return;
      this._roundPhase = 'resolved';
      const diff = this._getDiff();

      if (ok) {
        this._streak += 1;
        if (this._streak > this._bestStreak) this._bestStreak = this._streak;
        const streakBonus = this._streak >= 3 ? Math.round(basePoints * 0.15) : 0;
        this._score += basePoints + streakBonus;
        this._pulseFlash = 1.0;
        this._shockwaves.push({ r: 12, alpha: 1.0, color: sfxType === 'perfect' ? '#f6dfa0' : '#4ade80' });
        this._emitParticles(this._canvasW * 0.5, this._canvasH * 0.5, sfxType === 'perfect' ? '#f6dfa0' : '#4ade80', sfxType === 'perfect' ? 28 : 18);
        if (!this._isDailyMatch && this._formatMode === 'blitz') {
          this._blitzRemainingSec = Math.min((diff.blitzSec || 70) + 18, this._blitzRemainingSec + 2.0);
        }
      } else {
        this._streak = 0;
        this._shockwaves.push({ r: 10, alpha: 0.9, color: '#ef4444' });
        this._emitParticles(this._canvasW * 0.5, this._canvasH * 0.5, '#ef4444', 12);
        if (!this._isDailyMatch && this._formatMode === 'survival') this._lives = Math.max(0, this._lives - 1);
        if (!this._isDailyMatch && this._formatMode === 'blitz') this._blitzRemainingSec = Math.max(0, this._blitzRemainingSec - 2.0);
      }

      const stageBox = document.getElementById('eaStageBox');
      if (stageBox) {
        stageBox.classList.toggle('on-fire', this._streak >= 3);
        if (!ok) {
          stageBox.classList.remove('shake');
          void stageBox.offsetWidth;
          stageBox.classList.add('shake');
          setTimeout(() => stageBox.classList.remove('shake'), 400);
        }
      }

      this._playSfx(sfxType);
      if (this._curTrial && this._curTrial.id) {
        recordTrialOutcome(this._curTrial.id, ok, basePoints, this._lastRoundPrecision);
      }
      this._roundResults.push({
        trial: this._curTrial,
        track: this._curTrack,
        ok,
        points: basePoints,
        detail: detailMetric,
        elapsedMs: Math.round((this._roundElapsedSec || 0) * 1000)
      });

      this._revealCleanTrackAudio();
      this._updateHudUI();
      this._renderRoundPips();

      const fb = document.getElementById('eaFeedbackCard');
      const cover = document.getElementById('eaFbCover');
      const vEl = document.getElementById('eaFbVerdict');
      const tEl = document.getElementById('eaFbTrack');
      const nextBtn = document.getElementById('eaFbNextBtn');

      if (cover) {
        const revealedTrack = this._curTrack;
        const realCover = getRealCoverUrl(revealedTrack);
        cover.src = realCover || './app_logo.png';
        if (!realCover && revealedTrack) {
          fetchCoverForTrack(revealedTrack).then(url => {
            if (url && this._curTrack === revealedTrack && cover.isConnected) {
              cover.src = url;
            }
          }).catch(() => {});
        }
      }
      if (vEl) vEl.textContent = verdictText;
      if (tEl) {
        if (this._curTrial && this._curTrial.id === 'stereoduo' && this._stereoTrackB) {
          tEl.textContent = `L: ${this._curTrack.title} · R: ${this._stereoTrackB.title}`;
        } else if (this._curTrial && this._curTrial.id === 'year') {
          tEl.textContent = `${this._curTrack.title} · ${this._curTrack.artist || ''} (${this._yearTarget})`;
        } else {
          tEl.textContent = `${this._curTrack.title} · ${this._curTrack.artist || ''}`;
        }
      }

      const isLast = this._isDailyMatch
        ? (this._roundIndex + 1 >= this._totalRounds)
        : ((this._formatMode === 'exam' && this._roundIndex + 1 >= this._totalRounds)
          || (this._formatMode === 'survival' && this._lives <= 0)
          || (this._formatMode === 'blitz' && this._blitzRemainingSec <= 0.1));
      if (nextBtn) nextBtn.textContent = isLast ? (this._isDailyMatch ? 'Ranking' : 'Rango') : 'Seguir';
      if (fb) fb.className = `ea-feedback-card visible ${ok ? 'ok' : 'bad'}`;

      if (!this._isDailyMatch && this._formatMode === 'blitz') {
        this._blitzAutoNextTimer = setTimeout(() => {
          if (this._running && this._roundPhase === 'resolved') this._advanceNextRound();
        }, isLast ? 700 : 900);
      }
    },

    _revealCleanTrackAudio() {
      if (!this._audioCtx || !this._curAudioData) return;
      const now = this._audioCtx.currentTime;
      const tid = this._curTrial ? this._curTrial.id : '';

      if (tid === 'xray' && this._roundFilter1 && this._roundFilter2) {
        this._roundFilter1.frequency.setTargetAtTime(18000, now, 0.1);
        this._roundFilter2.frequency.setTargetAtTime(18000, now, 0.1);
      } else if ((tid === 'retro' || tid === 'telephone' || tid === 'ghost' || tid === 'underwater') && this._roundWetGain && this._roundDryGain) {
        this._roundWetGain.gain.setTargetAtTime(0.0, now, 0.08);
        this._roundDryGain.gain.setTargetAtTime(1.0, now, 0.08);
        if (this._vinylNoiseGain) this._vinylNoiseGain.gain.setTargetAtTime(0.0, now, 0.06);
        if (this._underwaterLp) this._underwaterLp.frequency.setTargetAtTime(18000, now, 0.08);
      } else if (tid === 'chopper' && this._chopperGateGain) {
        this._chopperGateGain.gain.setTargetAtTime(1.0, now, 0.03);
      } else if (tid === 'echo' && this._echoWetGain && this._echoDryGain && this._echoFbGain) {
        this._echoFbGain.gain.setTargetAtTime(0.0, now, 0.06);
        this._echoWetGain.gain.setTargetAtTime(0.0, now, 0.08);
        this._echoDryGain.gain.setTargetAtTime(1.0, now, 0.08);
      } else if ((tid === 'chipmunk' || tid === 'speedrun') && this._roundSource) {
        this._roundSource.playbackRate.setTargetAtTime(1.0, now, 0.08);
      } else if (tid === 'tuner') {
        if (this._tunerMusicGain) this._tunerMusicGain.gain.setTargetAtTime(1.05, now, 0.06);
        if (this._tunerBpFilter) { this._tunerBpFilter.Q.setTargetAtTime(0.2, now, 0.06); this._tunerBpFilter.frequency.setTargetAtTime(2600, now, 0.06); }
        if (this._tunerStaticGain) this._tunerStaticGain.gain.setTargetAtTime(0.0, now, 0.05);
        if (this._tunerWhistleGain) this._tunerWhistleGain.gain.setTargetAtTime(0.0, now, 0.04);
      } else if (tid === 'melody') {
        if (this._melodySynthBus) this._melodySynthBus.gain.setTargetAtTime(0.0, now, 0.07);
        if (this._roundDryGain) this._roundDryGain.gain.setTargetAtTime(1.0, now, 0.08);
      } else if (tid === 'eqhunter' && this._eqBandGains) {
        this._eqBandGains.low.gain.setTargetAtTime(1.05, now, 0.05);
        this._eqBandGains.mid.gain.setTargetAtTime(1.05, now, 0.05);
        this._eqBandGains.high.gain.setTargetAtTime(1.05, now, 0.05);
      } else if (tid === 'stereoduo') {
        if (this._stereoGainR) this._stereoGainR.gain.setTargetAtTime(0.0, now, 0.06);
        if (this._stereoGainL) this._stereoGainL.gain.setTargetAtTime(1.0, now, 0.06);
        if (this._stereoPanL) this._stereoPanL.pan.setTargetAtTime(0.0, now, 0.08);
      } else if (tid === 'impostor' && this._roundSource) {
        if (this._roundSource.detune) {
          this._roundSource.detune.cancelScheduledValues(now);
          this._roundSource.detune.setTargetAtTime(0, now, 0.05);
        } else {
          this._roundSource.playbackRate.cancelScheduledValues(now);
          this._roundSource.playbackRate.setTargetAtTime(1.0, now, 0.05);
        }
        if (this._impostorLfoGain) {
          this._impostorLfoGain.gain.cancelScheduledValues(now);
          this._impostorLfoGain.gain.setTargetAtTime(0, now, 0.04);
        }
      } else if (tid === 'mashup') {
        if (this._mashupDecoyGain) this._mashupDecoyGain.gain.setTargetAtTime(0.0, now, 0.06);
        if (this._mashupTargetGain) this._mashupTargetGain.gain.setTargetAtTime(1.0, now, 0.06);
        if (this._mashupTargetPan) this._mashupTargetPan.pan.setTargetAtTime(0.0, now, 0.08);
      } else if (tid === 'reverse' || tid === 'micro' || tid === 'stutter') {
        try { if (this._roundSource) this._roundSource.stop(); } catch (_) {}
        const src = this._audioCtx.createBufferSource();
        src.buffer = this._curAudioData.buffer;
        const revNorm = this._audioCtx.createGain();
        revNorm.gain.setValueAtTime(this._curAudioData.analysis?.normGain || 1.0, now);
        src.connect(revNorm);
        if (this._dspOutBus) revNorm.connect(this._dspOutBus);
        else if (this._roundAnalyser) revNorm.connect(this._roundAnalyser);
        src.start(now, this._curAudioData.analysis.chorusStartSec || 0, 12);
        this._roundSource = src;
        this._roundNodes.push(src, revNorm);
      }
    },

    _advanceNextRound() {
      if (!this._running) return;
      if (this._blitzAutoNextTimer) { clearTimeout(this._blitzAutoNextTimer); this._blitzAutoNextTimer = 0; }
      const gameOver = this._isDailyMatch
        ? (this._roundIndex + 1 >= this._totalRounds)
        : ((this._formatMode === 'exam' && this._roundIndex + 1 >= this._totalRounds)
          || (this._formatMode === 'survival' && this._lives <= 0)
          || (this._formatMode === 'blitz' && this._blitzRemainingSec <= 0.1));
      if (gameOver) this._finishMatch();
      else this._beginRound(this._roundIndex + 1);
    },

    _finishMatch() {
      this._running = false;
      this._matchToken += 1;
      this._flushReadyWaiters();
      if (this._blitzAutoNextTimer) { clearTimeout(this._blitzAutoNextTimer); this._blitzAutoNextTimer = 0; }
      this._stopRoundAudio();
      this._stopRenderLoop();

      if (this._isDailyMatch) {
        this._finishDailyMatch();
        return;
      }

      this._playSfx('fanfare');

      const diff = this._getDiff();
      const total = Math.max(1, this._roundResults.length);
      const hits = this._roundResults.filter(r => r.ok).length;
      const rank = computeRank(this._score, Math.max(total, this._formatMode === 'blitz' ? 7 : total), diff.scoreMult);
      const isNewRecord = saveBestRecord(this._score, rank.grade, rank.title);
      this.syncHomeBadge();
      this._syncLobbySelectorsUI();

      const stamp = document.getElementById('eaSumGrade');
      if (stamp) {
        stamp.textContent = rank.grade;
        stamp.style.color = rank.color;
        stamp.style.borderColor = rank.color;
      }
      const tags = document.getElementById('eaSumTags');
      if (tags) {
        const ytQ = (this._ytSearchQuery || '').trim();
        const fTag = this._getActiveFilterTag();
        const locked = this._selectedTrialId !== 'mix' ? TRIALS.find(t => t.id === this._selectedTrialId) : null;
        const pLbl = this._popularityMode === 'playlist'
          ? (this._availablePlaylists.find(p => p.key === this._selectedPlaylistKey)?.title || 'PLAYLIST')
          : (this._popularityMode === 'youtube' ? (ytQ ? `YT: ${ytQ}` : 'YOUTUBE') : (POPULARITY_MODES[this._popularityMode]?.label || 'YOUTUBE'));
        const fmtLbl = locked ? `SOLO ${locked.short.toUpperCase()}` : (this._formatMode === 'blitz' ? `BLITZ ${diff.blitzSec}S` : (this._formatMode === 'survival' ? 'SUPERVIV.' : 'EXAMEN'));
        tags.textContent = `${diff.label.toUpperCase()} · ${fmtLbl} · ${pLbl.slice(0, 14).toUpperCase()}${fTag ? ` · ${fTag.toUpperCase()}` : ''}${isNewRecord ? ' · RÉCORD' : ''}`;
      }
      document.getElementById('eaSumTitle').textContent = rank.title;
      document.getElementById('eaSumScore').textContent = `${this._score} PUNTOS`;
      document.getElementById('eaSumHits').textContent = `${hits}/${total}`;

      const pitchOrBpm = this._bestPitchAccuracy !== null
        ? `${this._bestPitchAccuracy}%`
        : (this._bestBpmErr !== null ? `+-${this._bestBpmErr}` : '--');
      document.getElementById('eaSumPitch').textContent = pitchOrBpm;
      document.getElementById('eaSumPulse').textContent = this._bestSilenceErrMs !== null ? `${this._bestSilenceErrMs}ms` : '--';

      this._renderDiscoveryList();
      this._showView('summary');
    },

    _renderDiscoveryList() {
      const listEl = document.getElementById('eaDiscoveryList');
      if (!listEl) return;
      const favIds = window.favoriteIdsSet || new Set();

      listEl.innerHTML = this._roundResults.map((res, idx) => {
        const tr = res.track;
        const saved = favIds.has(tr.id);
        return `
          <div class="ea-disc-row">
            <img class="ea-disc-cover" data-disc-cover="${idx}" src="${escHtml(getBestCover(tr))}" alt="">
            <div class="ea-disc-meta">
              <div class="ea-disc-title">${escHtml(tr.title)}</div>
              <div class="ea-disc-sub">${escHtml(tr.artist || '')} · ${escHtml(res.trial.short)} (${res.ok ? 'OK' : 'X'})</div>
            </div>
            <div class="ea-disc-actions">
              <button type="button" class="ea-mini-action ${saved ? 'saved' : ''}" data-fav-idx="${idx}" title="Guardar en favoritas">
                ${saved ? SVG.heartFill : SVG.heart}
              </button>
              <button type="button" class="ea-mini-action piano" data-piano-idx="${idx}" title="Tocar en Piano">
                ${SVG.piano}
              </button>
            </div>
          </div>
        `;
      }).join('');

      this._roundResults.forEach((res, idx) => {
        if (!res || !res.track || getRealCoverUrl(res.track)) return;
        const img = listEl.querySelector(`[data-disc-cover="${idx}"]`);
        if (!img) return;
        fetchCoverForTrack(res.track).then(url => {
          if (url && img.isConnected) img.src = url;
        }).catch(() => {});
      });

      listEl.querySelectorAll('[data-fav-idx]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idx = Number(btn.getAttribute('data-fav-idx'));
          const tr = this._roundResults[idx]?.track;
          if (!tr) return;
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.saveTrackToFavoritesNormalized === 'function') {
            await window.DiscoverHomeApp.saveTrackToFavoritesNormalized(tr, true);
            btn.classList.add('saved');
            btn.innerHTML = SVG.heartFill;
            toast(`Guardada: ${tr.title}`);
          }
        });
      });

      listEl.querySelectorAll('[data-piano-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-piano-idx'));
          const tr = this._roundResults[idx]?.track;
          if (!tr) return;
          this.close();
          if (window.DiscoverHomeApp && typeof window.DiscoverHomeApp.launchPianoGameForTrack === 'function') {
            window.DiscoverHomeApp.launchPianoGameForTrack(tr);
          }
        });
      });
    },

    // -----------------------------------------------------------------------
    // 60 FPS ANALOG CRT OSCILLOSCOPE & DSP TELEMETRY ENGINE
    // -----------------------------------------------------------------------
    _resizeCanvas() {
      if (!this._canvas) return;
      const box = this._canvas.parentElement;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._canvasW = rect.width;
      this._canvasH = rect.height;
      this._canvas.width = Math.round(rect.width * dpr);
      this._canvas.height = Math.round(rect.height * dpr);
      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    _startRenderLoop() {
      this._stopRenderLoop();
      const tick = nowPerf => {
        if (!this._isOpen) return;
        this._updateLiveDSP(nowPerf);
        this._updateLoudnessAGC(nowPerf);
        this._drawCRTStage(nowPerf);
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    },

    _stopRenderLoop() {
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
    },

    // Feed-Forward Real-Time Broadcast RMS AGC (keeps volume rock-steady across all 12 DSP modes!)
    _updateLoudnessAGC(nowPerf) {
      if (!this._audioCtx || !this._preAgcAnalyser || !this._agcGain) return;
      if (this._roundPhase !== 'playing' && this._roundPhase !== 'resolved') return;

      const tid = this._curTrial ? this._curTrial.id : '';
      const ctx = this._audioCtx;

      // Freeze AGC during intentional silences or off-station FM static so it never pumps noise floor
      if (this._roundPhase === 'playing') {
        if (tid === 'silence' && !this._silenceTapped && ctx.currentTime >= this._silenceMuteStartCtx) return;
        if (tid === 'chopper' && !this._chopperIsOpen) return;
        if (tid === 'micro' && nowPerf > this._microFlashActiveUntil) return;
        if (tid === 'tuner' && this._tunerSignalClarity < 0.35) return;
      }

      let sumSq = 0;
      let count = 0;
      if (typeof this._preAgcAnalyser.getFloatTimeDomainData === 'function' && this._agcFloatBuf) {
        this._preAgcAnalyser.getFloatTimeDomainData(this._agcFloatBuf);
        count = this._agcFloatBuf.length;
        for (let i = 0; i < count; i++) {
          const s = this._agcFloatBuf[i];
          sumSq += s * s;
        }
      } else if (this._agcByteBuf) {
        this._preAgcAnalyser.getByteTimeDomainData(this._agcByteBuf);
        count = this._agcByteBuf.length;
        for (let i = 0; i < count; i++) {
          const s = (this._agcByteBuf[i] - 128) / 128;
          sumSq += s * s;
        }
      }
      if (count === 0) return;

      const rms = Math.sqrt(sumSq / count);
      if (rms < 0.005) return; // Gate below noise floor

      const TARGET_RMS = 0.165;
      const desiredGain = clamp(TARGET_RMS / rms, 0.35, 4.5);
      // Fast attack when too loud, smooth natural lift when quiet (e.g. Voz Fantasma / Solo Graves)
      const alpha = desiredGain < this._agcCurrentGain ? 0.24 : 0.085;
      this._agcCurrentGain += (desiredGain - this._agcCurrentGain) * alpha;
      this._agcGain.gain.setTargetAtTime(this._agcCurrentGain, ctx.currentTime, 0.045);
    },

    _updateLiveDSP(nowPerf) {
      if (this._roundPhase !== 'playing' || !this._curTrial) return;

      // Blitz 60s Master Clock
      if (this._formatMode === 'blitz') {
        const dt = clamp((nowPerf - this._blitzLastFramePerf) / 1000, 0, 0.25);
        this._blitzLastFramePerf = nowPerf;
        this._blitzRemainingSec = Math.max(0, this._blitzRemainingSec - dt);
        const bl = document.getElementById('eaHudBlitz');
        if (bl) {
          bl.textContent = `${this._blitzRemainingSec.toFixed(1)}s`;
          bl.classList.toggle('urgent', this._blitzRemainingSec <= 12);
        }
        if (this._blitzRemainingSec <= 0) {
          this._finishMatch();
          return;
        }
      }

      const elapsed = (nowPerf - this._roundStartPerf) / 1000;
      this._roundElapsedSec = elapsed;
      const tid = this._curTrial.id;

      // Timer Bar
      const timerFill = document.getElementById('eaTimerFill');
      if (timerFill) {
        if (tid === 'silence') {
          timerFill.style.transform = this._silenceArmed ? 'scaleX(1)' : `scaleX(${clamp(1 - elapsed / (this._silenceBeatDur * 4 + 0.3), 0, 1)})`;
          timerFill.classList.toggle('danger', false);
        } else {
          const pct = clamp(1 - elapsed / this._roundDurationSec, 0, 1);
          timerFill.style.transform = `scaleX(${pct})`;
          timerFill.classList.toggle('danger', pct < 0.25);
        }
      }

      const multBadge = document.getElementById('eaLiveMultBadge');
      if (multBadge) {
        if (this._curTrial.kind === 'skill') {
          multBadge.textContent = `MAX ${Math.round(1100 * this._getDiff().scoreMult)}`;
        } else {
          multBadge.textContent = `x${this._getCurrentLiveMultiplier().toFixed(1)}`;
        }
      }

      const ctx = this._audioCtx;
      if (!ctx) return;

      // X-Ray lowpass sweep
      if (tid === 'xray' && this._roundFilter1 && this._roundFilter2) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const freq = 165 * Math.pow(16000 / 165, Math.pow(p, 1.48));
        this._roundFilter1.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
        this._roundFilter2.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = freq >= 1000 ? `LPF ${(freq / 1000).toFixed(1)} KHZ` : `LPF ${Math.round(freq)} HZ`;
      }

      // Retro 8-bit equal-power morph
      if (tid === 'retro' && this._roundWetGain && this._roundDryGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const hdMix = Math.pow(p, 1.75);
        const wetG = Math.cos(hdMix * Math.PI * 0.5);
        const dryG = Math.sin(hdMix * Math.PI * 0.5);
        this._roundWetGain.gain.setTargetAtTime(wetG, ctx.currentTime, 0.06);
        this._roundDryGain.gain.setTargetAtTime(dryG, ctx.currentTime, 0.06);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `SENAL HD ${Math.round(hdMix * 100)}%`;
      }

      // Radio 1940 equal-power restore to Hi-Fi
      if (tid === 'telephone' && this._roundWetGain && this._roundDryGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const hiFi = Math.pow(p, 1.7);
        const wetG = 1.1 * Math.cos(hiFi * Math.PI * 0.5);
        const dryG = Math.sin(hiFi * Math.PI * 0.5);
        this._roundWetGain.gain.setTargetAtTime(wetG, ctx.currentTime, 0.06);
        this._roundDryGain.gain.setTargetAtTime(dryG, ctx.currentTime, 0.06);
        if (this._vinylNoiseGain) this._vinylNoiseGain.gain.setTargetAtTime(0.24 * (1 - hiFi), ctx.currentTime, 0.06);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `HI-FI ${Math.round(hiFi * 100)}%`;
      }

      // Chopper rhythmic hard-gate slicer (opens from 22% duty to 96%)
      if (tid === 'chopper' && this._chopperGateGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const duty = 0.22 + Math.pow(p, 1.35) * 0.74;
        this._chopperCurDuty = duty;
        const phase = (elapsed * this._chopperFreqHz) % 1;
        const open = phase < duty;
        this._chopperIsOpen = open;
        this._chopperGateGain.gain.setTargetAtTime(open ? 1.0 : 0.001, ctx.currentTime, 0.006);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `GATE ${Math.round(duty * 100)}% ABIERTO`;
      }

      // Cueva Infinita loudness-controlled equal-power dub delay dry-out
      if (tid === 'echo' && this._echoFbGain && this._echoWetGain && this._echoDryGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const dryMix = clamp(0.08 + Math.pow(p, 1.55) * 0.88, 0.08, 0.96);
        const fb = clamp(0.72 * (1 - p * 0.74), 0.12, 0.72);
        const wetG = 0.92 * Math.cos(dryMix * Math.PI * 0.5);
        const dryG = Math.sin(dryMix * Math.PI * 0.5);
        this._echoFbGain.gain.setTargetAtTime(fb, ctx.currentTime, 0.06);
        this._echoWetGain.gain.setTargetAtTime(wetG, ctx.currentTime, 0.06);
        this._echoDryGain.gain.setTargetAtTime(dryG, ctx.currentTime, 0.06);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `DUB ECO ${Math.round(fb * 100)}%`;
      }

      // Chipmunk / Giant smooth glide toward 1.00x
      if (tid === 'chipmunk' && this._roundSource) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const ease = 1 - Math.pow(1 - p, 1.65);
        const curRate = this._chipmunkStartRate + (1.0 - this._chipmunkStartRate) * ease;
        this._chipmunkCurRate = curRate;
        this._roundSource.playbackRate.setTargetAtTime(curRate, ctx.currentTime, 0.04);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `${(33.3 * curRate).toFixed(1)} RPM · ${curRate.toFixed(2)}X`;
      }

      // Ghost Vocal equal-power crossfade (zero volume jump as vocal returns!)
      if (tid === 'ghost' && this._roundWetGain && this._roundDryGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const dryMix = clamp(this._ghostDryTarget + Math.pow(p, 1.6) * (1 - this._ghostDryTarget) * 0.72, 0.03, 0.95);
        const wetG = Math.cos(dryMix * Math.PI * 0.5);
        const dryG = Math.sin(dryMix * Math.PI * 0.5);
        this._roundDryGain.gain.setTargetAtTime(dryG, ctx.currentTime, 0.06);
        this._roundWetGain.gain.setTargetAtTime(wetG, ctx.currentTime, 0.06);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `VOZ CENTRAL ${Math.round(dryMix * 100)}%`;
      }

      // Silence Beat Drop State Machine
      if (tid === 'silence') {
        const beatPos = (ctx.currentTime - this._silenceStartCtx) / this._silenceBeatDur;
        const beatIdx = Math.floor(beatPos);

        if (beatIdx >= 0 && beatIdx <= 3 && beatIdx !== this._silenceLastLitBeat) {
          this._silenceLastLitBeat = beatIdx;
          this._pulseFlash = 0.72;
          document.querySelectorAll('#eaBeatLeds .ea-beat-led').forEach((el, i) => {
            el.classList.toggle('lit', i <= beatIdx);
          });
        }

        if (beatPos >= 4.0 && !this._silenceArmed) {
          this._silenceArmed = true;
          const pad = document.getElementById('eaPulsePadBtn');
          const m = document.getElementById('eaPulsePadMain');
          const s = document.getElementById('eaPulsePadSub');
          if (pad) { pad.disabled = false; pad.classList.add('armed'); }
          if (m) m.textContent = 'PULSA AL LLEGAR AL "1"';
          if (s) s.textContent = 'Cuenta 4 en silencio (1, 2, 3, 4 -> YA)';
          document.getElementById('eaTelemetryLabel').textContent = 'COMPAS EN SILENCIO';
          document.querySelectorAll('#eaBeatLeds .ea-beat-led').forEach(el => {
            el.classList.remove('lit');
            el.classList.add('silent-phase');
          });
        }

        const lateLimit = Math.max(0.65, this._silenceBeatDur * 1.15);
        if (ctx.currentTime > this._silenceTargetCtx + lateLimit && !this._silenceTapped) {
          this._handleRoundTimeout();
        }
        return;
      }

      // Caza el Fallo timeout monitor (generous window scaled with difficulty)
      if (tid === 'impostor') {
        const diff = this._getDiff();
        const maxWaitSec = Math.max(2.1, diff.impostorPassMs / 1000 + 0.65);
        if (!this._impostorTapped && ctx.currentTime > this._impostorGlitchCtx + maxWaitSec) {
          const btn = document.getElementById('eaImpostorBtn');
          if (btn) btn.disabled = true;
          this._resolveRound(false, 0, 'SE ESCAPO EL FALLO', 'wrong', 'Sin reflejo');
        }
        return;
      }

      // Doble Vinilo smooth crossfade toward target song
      if (tid === 'mashup' && this._mashupTargetGain && this._mashupDecoyGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const soloActive = nowPerf < this._mashupSoloActiveUntil;
        const cross = clamp(0.35 + Math.pow(p, 1.35) * 0.56, 0.35, 0.91);
        this._mashupCrossVal = soloActive ? 0.95 : cross;
        if (!soloActive) {
          const tgtG = 0.58 + cross * 0.50;
          const decG = Math.max(0.16, 1.02 - cross * 0.88);
          this._mashupTargetGain.gain.setTargetAtTime(tgtG, ctx.currentTime, 0.06);
          this._mashupDecoyGain.gain.setTargetAtTime(decG, ctx.currentTime, 0.06);
          const tel = document.getElementById('eaTelemetryLabel');
          if (tel) tel.textContent = `MIX A/B · ${Math.round(cross * 100)}%`;
        }
      }

      // Submarino depth ascent (-120m -> 0m surface)
      if (tid === 'underwater' && this._underwaterLp && this._roundWetGain && this._roundDryGain) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const surf = Math.pow(p, 1.45);
        const depthM = Math.max(0, Math.round(120 * (1 - surf)));
        this._underwaterDepthM = depthM;
        const lpFreq = 340 * Math.pow(12000 / 340, surf);
        this._underwaterLp.frequency.setTargetAtTime(lpFreq, ctx.currentTime, 0.05);
        const wetG = Math.cos(surf * Math.PI * 0.48);
        const dryG = Math.sin(surf * Math.PI * 0.48);
        this._roundWetGain.gain.setTargetAtTime(wetG, ctx.currentTime, 0.06);
        this._roundDryGain.gain.setTargetAtTime(dryG, ctx.currentTime, 0.06);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = depthM <= 3 ? 'SUPERFICIE 0M' : `SONAR -${depthM}M`;
      }

      // Vinilo Rayado progressive groove widening
      if (tid === 'stutter') {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const autoStage = p < 0.28 ? 0 : (p < 0.56 ? 1 : (p < 0.82 ? 2 : 3));
        if (autoStage > this._stutterStage) {
          this._stutterStage = autoStage;
          const stageDurs = [0.46, 0.96, 2.2, 16.0];
          const nextDur = stageDurs[autoStage];
          this._launchStutterLoop(this._stutterOffsetSec + 1.15, nextDur);
          const tel = document.getElementById('eaTelemetryLabel');
          if (tel) tel.textContent = nextDur >= 10 ? 'SURCO LIBRE' : `SURCO ${nextDur.toFixed(2)}S`;
        }
      }

      // Chiptune 8-Bit real-time melody synthesizer sequencer + progressive studio morph
      if (tid === 'melody' && this._melodyContour && this._melodyLeadOsc && this._melodyLeadGain) {
        const { stepSec, frames } = this._melodyContour;
        if (frames && frames.length > 0) {
          const stepIdx = Math.floor(elapsed / stepSec) % frames.length;
          if (stepIdx !== this._melodyLastStep) {
            this._melodyLastStep = stepIdx;
            const fr = frames[stepIdx];
            this._melodyCurNoteLabel = fr.label || '---';
            const nowT = ctx.currentTime;
            if (fr.freq > 50 && fr.amp > 0.05) {
              this._melodyLeadOsc.frequency.setTargetAtTime(fr.freq, nowT, 0.012);
              this._melodyLeadGain.gain.setTargetAtTime(fr.amp * 0.24, nowT, 0.014);
              if (this._melodyBassOsc && this._melodyBassGain) {
                this._melodyBassOsc.frequency.setTargetAtTime(fr.freq * 0.5, nowT, 0.016);
                this._melodyBassGain.gain.setTargetAtTime(fr.amp * 0.19, nowT, 0.018);
              }
            } else {
              this._melodyLeadGain.gain.setTargetAtTime(0.0001, nowT, 0.02);
              if (this._melodyBassGain) this._melodyBassGain.gain.setTargetAtTime(0.0001, nowT, 0.02);
            }
          }
        }
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const dryMix = clamp(Math.pow(Math.max(0, p - 0.18) / 0.82, 1.55) * 0.85, 0, 0.85);
        if (this._melodySynthBus) this._melodySynthBus.gain.setTargetAtTime(0.95 * (1 - dryMix * 0.65), ctx.currentTime, 0.06);
        if (this._roundDryGain) this._roundDryGain.gain.setTargetAtTime(dryMix, ctx.currentTime, 0.06);
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = `8-BIT ${this._melodyCurNoteLabel} · MIX ${Math.round(dryMix * 100)}%`;
      }

      // Rueda Loca rollercoaster oscillating playbackRate + magnetic brake
      if (tid === 'speedrun' && this._roundSource) {
        const p = clamp(elapsed / this._roundDurationSec, 0, 1);
        const brakeActive = nowPerf < this._speedrunBrakeUntil;
        let rate = 1.0;
        if (!brakeActive) {
          const amp = 0.45 * (1 - p * 0.72);
          rate = clamp(1.0 + Math.sin(elapsed * 2.35 + this._speedrunPhase) * amp, 0.52, 1.50);
        }
        this._speedrunCurRate = rate;
        this._roundSource.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.035);
        this._speedrunHistory.push(rate);
        if (this._speedrunHistory.length > 72) this._speedrunHistory.shift();
        const tel = document.getElementById('eaTelemetryLabel');
        if (tel) tel.textContent = brakeActive ? 'FRENO ACTIVO · 1.00X' : `MOTOR ${rate.toFixed(2)}X`;
      }

      if (elapsed >= this._roundDurationSec) {
        this._handleRoundTimeout();
      }
    },

    _emitParticles(x, y, color = '#e5c16c', count = 16) {
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const spd = 1.4 + Math.random() * 4.2;
        this._particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 0.6,
          r: 1.6 + Math.random() * 2.2,
          color,
          life: 1.0
        });
      }
    },

    _drawCRTVuMeters(ctx, w, h, energy) {
      const targetL = clamp(energy * 1.15, 0.04, 1);
      const targetR = clamp(energy * (0.95 + Math.sin(performance.now() * 0.013) * 0.14), 0.04, 1);
      this._vuSmoothL += (targetL - this._vuSmoothL) * 0.28;
      this._vuSmoothR += (targetR - this._vuSmoothR) * 0.28;

      const segs = 10;
      const topY = 30;
      const botY = h - 16;
      const segH = Math.max(4, (botY - topY) / segs - 2.2);
      const barW = 4.5;

      [[6, this._vuSmoothL], [w - 6 - barW, this._vuSmoothR]].forEach(([bx, lvl]) => {
        const litCount = Math.round(lvl * segs);
        for (let i = 0; i < segs; i++) {
          const sy = botY - (i + 1) * (segH + 2.2);
          const isLit = i < litCount;
          let col = '#4ade80';
          if (i >= 8) col = '#ef4444';
          else if (i >= 6) col = '#f59e0b';
          ctx.fillStyle = isLit ? col : 'rgba(244, 234, 213, 0.07)';
          ctx.fillRect(bx, sy, barW, segH);
        }
      });
    },

    _drawCRTStage(nowPerf) {
      const ctx = this._ctx;
      if (!ctx) return;
      const w = this._canvasW;
      const h = this._canvasH;

      ctx.fillStyle = '#040605';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope Graticule with subtle crosshair center ticks
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.058)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const gx = Math.round((w / 8) * i) + 0.5;
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let j = 1; j < 4; j++) {
        const gy = Math.round((h / 4) * j) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      let energy = 0.08;
      if (this._roundAnalyser && this._roundFft && this._roundWave) {
        this._roundAnalyser.getByteFrequencyData(this._roundFft);
        this._roundAnalyser.getByteTimeDomainData(this._roundWave);
        let sum = 0;
        for (let i = 0; i < 36; i++) sum += this._roundFft[i];
        energy = clamp(sum / (36 * 255), 0.04, 1);
      }
      if (this._roundAnalyserR && this._roundWaveR) {
        this._roundAnalyserR.getByteTimeDomainData(this._roundWaveR);
      }

      const tid = this._curTrial ? this._curTrial.id : 'pitch';
      const tSec = nowPerf * 0.001;

      if (tid === 'pitch') this._drawCRTPitch(ctx, w, h, energy);
      else if (tid === 'reverse') this._drawCRTReverseDeck(ctx, w, h, energy, tSec);
      else if (tid === 'xray') this._drawCRTXRay(ctx, w, h);
      else if (tid === 'silence') this._drawCRTSilence(ctx, w, h, energy);
      else if (tid === 'retro') this._drawCRTRetro(ctx, w, h);
      else if (tid === 'chipmunk') this._drawCRTRpmTach(ctx, w, h, energy, tSec);
      else if (tid === 'micro') this._drawCRTMicroFlash(ctx, w, h, nowPerf);
      else if (tid === 'ghost') this._drawCRTGhostLissajous(ctx, w, h, energy);
      else if (tid === 'taptempo') this._drawCRTTapTempo(ctx, w, h, energy, tSec);
      else if (tid === 'telephone') this._drawCRTTelephone(ctx, w, h, energy, tSec);
      else if (tid === 'chopper') this._drawCRTChopper(ctx, w, h, energy, tSec);
      else if (tid === 'echo') this._drawCRTEchoCavern(ctx, w, h, energy, tSec);
      else if (tid === 'impostor') this._drawCRTImpostor(ctx, w, h, energy, tSec);
      else if (tid === 'mashup') this._drawCRTMashup(ctx, w, h, energy, tSec);
      else if (tid === 'underwater') this._drawCRTUnderwater(ctx, w, h, energy, tSec);
      else if (tid === 'stutter') this._drawCRTStutter(ctx, w, h, energy, tSec);
      else if (tid === 'tuner') this._drawCRTTuner(ctx, w, h, energy, tSec);
      else if (tid === 'melody') this._drawCRTMelody(ctx, w, h, energy, tSec);
      else if (tid === 'speedrun') this._drawCRTSpeedrun(ctx, w, h, energy, tSec);
      else if (tid === 'eqhunter') this._drawCRTEqHunter(ctx, w, h, energy, tSec);
      else if (tid === 'stereoduo') this._drawCRTStereoDuo(ctx, w, h, energy, tSec);
      else if (tid === 'year') this._drawCRTYearDial(ctx, w, h, energy, tSec);

      // Recessed dual stereo LED VU-meters on left & right CRT edges
      this._drawCRTVuMeters(ctx, w, h, energy);

      // CRT Spark & Particle Engine
      for (let i = this._particles.length - 1; i >= 0; i--) {
        const pt = this._particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.08;
        pt.vx *= 0.96;
        pt.life -= 0.032;
        if (pt.life <= 0.02) {
          this._particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = clamp(pt.life, 0, 1);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r * pt.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (let i = this._shockwaves.length - 1; i >= 0; i--) {
        const sw = this._shockwaves[i];
        sw.r += 5.5;
        sw.alpha *= 0.91;
        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, sw.r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        if (sw.alpha < 0.04) this._shockwaves.splice(i, 1);
      }

      if (this._pulseFlash > 0.02) {
        ctx.fillStyle = `rgba(229, 193, 108, ${this._pulseFlash * 0.11})`;
        ctx.fillRect(0, 0, w, h);
        this._pulseFlash *= 0.88;
      }
    },

    _drawCRTPitch(ctx, w, h, energy) {
      const cx = w * 0.5;
      const cy = h * 0.66;
      const r = Math.min(w * 0.29, h * 0.56);

      ctx.strokeStyle = 'rgba(244, 234, 213, 0.14)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();

      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * (1.12 + (i / 16) * 0.76);
        const major = i % 4 === 0;
        ctx.strokeStyle = (i === 8 && this._roundPhase === 'resolved') ? '#4ade80' : 'rgba(229, 193, 108, 0.35)';
        ctx.lineWidth = major ? 1.8 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - (major ? 12 : 7)), cy + Math.sin(a) * (r - (major ? 12 : 7)));
        ctx.lineTo(cx + Math.cos(a) * (r + 3), cy + Math.sin(a) * (r + 3));
        ctx.stroke();
      }

      const norm = clamp((this._pitchCurrentRate - 0.65) / 0.70, 0, 1);
      const angle = Math.PI * (1.12 + norm * 0.76);
      ctx.strokeStyle = '#e5c16c';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * (r + 5), cy + Math.sin(angle) * (r + 5));
      ctx.stroke();

      ctx.fillStyle = '#e5c16c';
      ctx.beginPath(); ctx.arc(cx, cy, 5 + energy * 2.5, 0, Math.PI * 2); ctx.fill();

      if (this._roundWave) {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < this._roundWave.length; i++) {
          const x = (i / (this._roundWave.length - 1)) * w;
          const y = h * 0.86 + ((this._roundWave[i] - 128) / 128) * 16;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.fillStyle = this._roundPhase === 'resolved' ? '#4ade80' : '#f3ede0';
      ctx.font = '800 12.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        this._roundPhase === 'resolved' ? `${(this._pitchCurrentRate * 100).toFixed(1)}% (REAL 100%)` : 'DIAL CIEGO · ESCUCHA',
        cx, cy - r * 0.42
      );
    },

    // REDESIGNED: Authentic Studio Cassette / Open-Reel Tape Deck Animation
    _drawCRTReverseDeck(ctx, w, h, energy, tSec) {
      const isFwd = this._reverseFlipActive || this._roundPhase === 'resolved';
      const dir = isFwd ? 1 : -1;
      const accent = isFwd ? '#4ade80' : '#f59e0b';
      const p = clamp(this._roundElapsedSec / Math.max(1, this._roundDurationSec), 0, 1);

      const deckW = Math.min(w * 0.78, 286);
      const deckH = Math.min(h * 0.66, 122);
      const dx = (w - deckW) * 0.5;
      const dy = (h - deckH) * 0.5 + 8;

      // 1. Machined dark cassette shell chassis
      drawRoundedRectPath(ctx, dx, dy, deckW, deckH, 10);
      ctx.fillStyle = '#110f0d';
      ctx.fill();
      ctx.strokeStyle = 'rgba(229, 193, 108, 0.34)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Corner screw rivets
      ctx.fillStyle = 'rgba(229, 193, 108, 0.32)';
      [[dx + 8, dy + 8], [dx + deckW - 8, dy + 8], [dx + 8, dy + deckH - 8], [dx + deckW - 8, dy + deckH - 8]].forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, Math.PI * 2); ctx.fill();
      });

      // 2. Recessed smoked-glass tape window
      const winX = dx + 18;
      const winY = dy + 14;
      const winW = deckW - 36;
      const winH = deckH * 0.60;
      drawRoundedRectPath(ctx, winX, winY, winW, winH, 6);
      ctx.fillStyle = '#060706';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 245, 220, 0.14)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Twin realistic reels with winding dark-brown magnetic tape pancakes
      const spoolY = winY + winH * 0.5;
      const lx = winX + winW * 0.25;
      const rx = winX + winW * 0.75;
      const hubR = Math.min(winH * 0.25, 15);
      const maxTapeR = Math.min(winH * 0.44, 29);

      // Left pancake grows as tape rewinds, right shrinks!
      const leftTapeR = hubR + (maxTapeR - hubR) * (0.45 + p * 0.45);
      const rightTapeR = hubR + (maxTapeR - hubR) * (0.90 - p * 0.45);
      const spin = tSec * 3.8 * dir;

      // Tensioned magnetic tape path from both pancakes around bottom rollers & magnetic head
      const headX = w * 0.5;
      const headY = dy + deckH - 13;
      const rollL = dx + 26;
      const rollR = dx + deckW - 26;
      const rollY = dy + deckH - 15;

      ctx.strokeStyle = '#7c4a1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx - leftTapeR * 0.85, spoolY + leftTapeR * 0.45);
      ctx.lineTo(rollL, rollY);
      ctx.lineTo(headX, headY);
      ctx.lineTo(rollR, rollY);
      ctx.lineTo(rx + rightTapeR * 0.85, spoolY + rightTapeR * 0.45);
      ctx.stroke();

      // Draw both spools
      [[lx, leftTapeR], [rx, rightTapeR]].forEach(([cx, tapeR]) => {
        // Magnetic tape coil (dark sepia oxide with subtle concentric rings)
        ctx.fillStyle = '#2a1a0d';
        ctx.beginPath(); ctx.arc(cx, spoolY, tapeR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(180, 120, 58, 0.26)';
        ctx.lineWidth = 1;
        for (let rr = hubR + 3; rr < tapeR; rr += 3.5) {
          ctx.beginPath(); ctx.arc(cx, spoolY, rr, 0, Math.PI * 2); ctx.stroke();
        }

        // Brushed aluminum inner hub
        ctx.fillStyle = '#1e1b18';
        ctx.beginPath(); ctx.arc(cx, spoolY, hubR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 3 precision NAB drive teeth rotating cleanly
        for (let k = 0; k < 3; k++) {
          const a = spin + (k * Math.PI * 2) / 3;
          ctx.strokeStyle = '#f3ede0';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * (hubR * 0.35), spoolY + Math.sin(a) * (hubR * 0.35));
          ctx.lineTo(cx + Math.cos(a) * (hubR * 0.92), spoolY + Math.sin(a) * (hubR * 0.92));
          ctx.stroke();
        }
        ctx.fillStyle = '#070605';
        ctx.beginPath(); ctx.arc(cx, spoolY, hubR * 0.28, 0, Math.PI * 2); ctx.fill();
      });

      // Guide rollers + glowing magnetic playback head
      [rollL, rollR].forEach(rxPos => {
        ctx.fillStyle = '#8b7e6a';
        ctx.beginPath(); ctx.arc(rxPos, rollY, 3.2, 0, Math.PI * 2); ctx.fill();
      });
      drawRoundedRectPath(ctx, headX - 18, headY - 5, 36, 10, 3);
      ctx.fillStyle = '#25211c';
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Animated direction chevron strip in center of window
      const shift = ((tSec * 24) % 12) * dir;
      ctx.fillStyle = accent;
      ctx.font = '900 11px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isFwd ? 'FWD >>' : '<< REV', w * 0.5 + clamp(shift * 0.18, -3, 3), spoolY + 4);

      // Subtle live phosphor signal trace below deck
      if (this._roundWave) {
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < this._roundWave.length; i++) {
          const x = dx + (i / (this._roundWave.length - 1)) * deckW;
          const y = h - 8 + ((this._roundWave[i] - 128) / 128) * (5 + energy * 10);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },

    _drawCRTXRay(ctx, w, h) {
      const p = this._roundPhase === 'resolved' ? 1 : clamp(this._roundElapsedSec / this._roundDurationSec, 0, 1);
      const padX = 16;
      const innerW = w - padX * 2;
      const cutX = padX + innerW * (0.14 + Math.pow(p, 1.35) * 0.86);
      const bars = 36;
      const bw = innerW / bars;

      for (let i = 0; i < bars; i++) {
        const val = this._roundFft ? this._roundFft[Math.min(i * 2, this._roundFft.length - 1)] / 255 : 0.1;
        const bh = Math.max(4, val * (h * 0.60));
        if (bh > this._xrayPeaks[i]) this._xrayPeaks[i] = bh;
        else this._xrayPeaks[i] = Math.max(4, this._xrayPeaks[i] - 0.9);
        const x = padX + i * bw;
        const active = x <= cutX;
        ctx.fillStyle = active ? '#4ade80' : 'rgba(255, 245, 220, 0.07)';
        ctx.fillRect(x + 1.5, h - bh - 16, bw - 3, bh);
        // Phosphor peak-hold cap
        if (active) {
          ctx.fillStyle = '#f6dfa0';
          ctx.fillRect(x + 1.5, h - this._xrayPeaks[i] - 19, bw - 3, 2);
        }
      }

      if (cutX < w - padX - 2) {
        ctx.fillStyle = 'rgba(4, 6, 5, 0.72)';
        ctx.fillRect(cutX, 0, w - padX - cutX, h - 14);
        ctx.strokeStyle = '#e5c16c';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cutX, 24); ctx.lineTo(cutX, h - 16); ctx.stroke();
      }

      ctx.fillStyle = 'rgba(229, 193, 108, 0.55)';
      ctx.font = '700 8px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'left'; ctx.fillText('80HZ', padX, h - 5);
      ctx.textAlign = 'center'; ctx.fillText('1KHZ', w * 0.5, h - 5);
      ctx.textAlign = 'right'; ctx.fillText('12KHZ', w - padX, h - 5);
    },

    _drawCRTSilence(ctx, w, h, energy) {
      const cx = w * 0.5;
      const cy = h * 0.50;
      const baseR = Math.min(w, h) * 0.25;

      if (this._roundPhase === 'resolved' && this._silenceLastSignedMs !== null) {
        const barW = w * 0.76;
        const bx = (w - barW) * 0.5;
        const by = h * 0.38;
        const diff = this._getDiff();
        const maxRange = 450;

        ctx.fillStyle = 'rgba(244, 234, 213, 0.12)';
        ctx.fillRect(bx, by - 4, barW, 8);
        const passFrac = clamp(diff.silencePassMs / maxRange, 0.08, 0.5);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.28)';
        ctx.fillRect(cx - barW * 0.5 * passFrac, by - 8, barW * passFrac, 16);

        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, by - 14); ctx.lineTo(cx, by + 14); ctx.stroke();

        const normErr = clamp(this._silenceLastSignedMs / maxRange, -1, 1);
        const hitX = cx + normErr * (barW * 0.5);
        const ok = Math.abs(this._silenceLastSignedMs) <= diff.silencePassMs;
        ctx.fillStyle = ok ? '#4ade80' : '#ef4444';
        ctx.beginPath(); ctx.arc(hitX, by, 7, 0, Math.PI * 2); ctx.fill();

        ctx.font = '800 10px ui-monospace, Menlo, monospace';
        ctx.fillStyle = 'rgba(243, 237, 224, 0.6)';
        ctx.textAlign = 'left'; ctx.fillText('PRONTO', bx, by - 14);
        ctx.textAlign = 'right'; ctx.fillText('TARDE', bx + barW, by - 14);
        ctx.textAlign = 'center'; ctx.fillStyle = ok ? '#4ade80' : '#fca5a5';
        ctx.fillText('0 MS', cx, by - 18);
        return;
      }

      ctx.strokeStyle = this._silenceArmed ? 'rgba(74, 222, 128, 0.45)' : 'rgba(245, 158, 11, 0.42)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, baseR, 0, Math.PI * 2); ctx.stroke();

      if (this._audioCtx && this._roundPhase === 'playing') {
        const beatPos = (this._audioCtx.currentTime - this._silenceStartCtx) / this._silenceBeatDur;
        if (beatPos < 0) {
          ctx.fillStyle = '#e5c16c';
          ctx.font = '800 12px ui-monospace, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PREPARADO...', cx, cy + 4);
        } else if (beatPos < 4.0) {
          const frac = beatPos % 1;
          const r = baseR * (1 - frac * 0.5) + energy * 7;
          ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fde68a';
          ctx.font = '900 30px ui-monospace, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(Math.min(4, Math.floor(beatPos) + 1)), cx, cy + 10);
        } else {
          ctx.fillStyle = '#4ade80';
          ctx.font = '800 12.5px ui-monospace, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('1 COMPAS EN SILENCIO', cx, cy - 8);
          ctx.fillStyle = '#f3ede0';
          ctx.font = '900 13px ui-monospace, Menlo, monospace';
          ctx.fillText('1 · 2 · 3 · 4 -> [ 1 ]', cx, cy + 14);
        }
      }
    },

    _drawCRTRetro(ctx, w, h) {
      const p = this._roundPhase === 'resolved' ? 1 : clamp(this._roundElapsedSec / this._roundDurationSec, 0, 1);
      const step = Math.max(1, Math.round(7 - p * 6));
      if (!this._roundWave) return;

      ctx.strokeStyle = p > 0.72 ? '#4ade80' : '#f97316';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const len = this._roundWave.length;
      for (let i = 0; i < len; i += step) {
        const x = (i / (len - 1)) * w;
        const raw = (this._roundWave[i] - 128) / 128;
        const q = p < 0.75 ? Math.round(raw * 4) / 4 : raw;
        const y = h * 0.54 + q * (h * 0.34);
        if (i === 0) ctx.moveTo(x, y);
        else { ctx.lineTo(x, y); if (step > 2) ctx.lineTo(x + (step / len) * w, y); }
      }
      ctx.stroke();
    },

    _drawCRTRpmTach(ctx, w, h, energy, tSec) {
      const cx = w * 0.5;
      const cy = h * 0.64;
      const r = Math.min(w * 0.28, h * 0.52);

      ctx.strokeStyle = 'rgba(244, 234, 213, 0.15)';
      ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

      // Crimson redline arc on right extremity
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.74, Math.PI * 1.9); ctx.stroke();

      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 1.47, Math.PI * 1.53); ctx.stroke();

      const rate = this._roundPhase === 'resolved' ? 1.0 : this._chipmunkCurRate;
      const norm = clamp((rate - 0.5) / 1.4, 0, 1);
      const ang = Math.PI * (1.1 + norm * 0.8);
      ctx.strokeStyle = Math.abs(rate - 1.0) < 0.08 ? '#4ade80' : '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * (r + 5), cy + Math.sin(ang) * (r + 5));
      ctx.stroke();

      const dotR = 14;
      const spin = tSec * 4.5 * rate;
      [w * 0.17, w * 0.83].forEach(px => {
        ctx.strokeStyle = 'rgba(229, 193, 108, 0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, h * 0.56, dotR, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(px + Math.cos(spin) * (dotR - 4), h * 0.56 + Math.sin(spin) * (dotR - 4), 2.5, 0, Math.PI * 2); ctx.fill();
      });

      ctx.fillStyle = '#f3ede0';
      ctx.font = '900 18px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${(33.3 * rate).toFixed(1)} RPM`, cx, cy + 20);
      ctx.fillStyle = 'rgba(229, 193, 108, 0.72)';
      ctx.font = '700 9.5px ui-monospace, Menlo, monospace';
      ctx.fillText(rate > 1.05 ? 'MODO ARDILLA' : (rate < 0.95 ? 'MODO GIGANTE' : '33.3 RPM NOMINAL'), cx, cy - r * 0.38);
    },

    _drawCRTMicroFlash(ctx, w, h, nowPerf) {
      const isLive = nowPerf < this._microFlashActiveUntil;
      const snap = this._microSnapshotWave;
      const cy = h * 0.54;
      // Camera shutter viewfinder corner brackets
      const bx1 = 22, bx2 = w - 22, by1 = 28, by2 = h - 24, bl = 11;
      ctx.strokeStyle = isLive ? '#fb7185' : 'rgba(229, 193, 108, 0.36)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bx1, by1 + bl); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + bl, by1);
      ctx.moveTo(bx2 - bl, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by1 + bl);
      ctx.moveTo(bx1, by2 - bl); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + bl, by2);
      ctx.moveTo(bx2 - bl, by2); ctx.lineTo(bx2, by2); ctx.lineTo(bx2, by2 - bl);
      ctx.stroke();

      if (snap) {
        const barW = (w - 56) / snap.length;
        for (let i = 0; i < snap.length; i++) {
          const amp = snap[i] * (h * 0.56);
          ctx.fillStyle = isLive ? '#fb7185' : 'rgba(251, 113, 133, 0.42)';
          ctx.fillRect(28 + i * barW, cy - amp * 0.5, Math.max(1.5, barW - 1), Math.max(2, amp));
        }
      }
      ctx.fillStyle = isLive ? '#fda4af' : 'rgba(243, 237, 224, 0.68)';
      ctx.font = '800 10px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isLive ? 'CAPTURANDO DESTELLO...' : 'CAPTURA CONGELADA · ADIVINA O PIDE FLASH', w * 0.5, h - 10);
    },

    _drawCRTGhostLissajous(ctx, w, h) {
      const cx = w * 0.5;
      const cy = h * 0.50;
      const scale = Math.min(w * 0.30, h * 0.34);
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.16)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, scale, 0, Math.PI * 2); ctx.stroke();

      if (this._roundWave) {
        const wL = this._roundWave;
        const wR = this._roundWaveR || wL;
        ctx.strokeStyle = this._roundPhase === 'resolved' ? '#4ade80' : '#e2e8f0';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const len = Math.min(wL.length, wR.length);
        for (let i = 0; i < len; i++) {
          const l = (wL[i] - 128) / 128;
          const r = (wR[i] - 128) / 128;
          const px = cx + (l - r) * 0.9 * scale * 1.45;
          const py = cy - (l + r) * 0.7 * scale * 1.45;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      // Stereo phase correlation bar below scope
      const barW = w * 0.52;
      const bx = (w - barW) * 0.5;
      const by = h - 22;
      ctx.fillStyle = 'rgba(244, 234, 213, 0.1)';
      ctx.fillRect(bx, by, barW, 4);
      const corrPos = this._roundPhase === 'resolved' ? 0.85 : clamp(0.18 + this._ghostDryTarget * 0.65, 0.15, 0.85);
      ctx.fillStyle = this._roundPhase === 'resolved' ? '#4ade80' : '#e2e8f0';
      ctx.fillRect(bx + corrPos * barW - 4, by - 2, 8, 8);
      ctx.fillStyle = 'rgba(229, 193, 108, 0.6)';
      ctx.font = '700 8.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORRELACION DE FASE L - R', cx, h - 7);
    },

    _drawCRTTapTempo(ctx, w, h, energy, tSec) {
      const cx = w * 0.5;
      const cy = h * 0.56;
      // Swinging analog metronome pendulum behind slots
      const bpmRef = this._tapTempoResultBpm || 110;
      const swing = Math.sin(tSec * (bpmRef / 60) * Math.PI) * 0.42;
      const pivY = h - 24;
      const armLen = h * 0.44;
      ctx.strokeStyle = 'rgba(229, 193, 108, 0.35)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, pivY);
      ctx.lineTo(cx + Math.sin(swing) * armLen, pivY - Math.cos(swing) * armLen);
      ctx.stroke();
      ctx.fillStyle = '#e5c16c';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(swing) * (armLen * 0.72), pivY - Math.cos(swing) * (armLen * 0.72), 4, 0, Math.PI * 2);
      ctx.fill();

      if (this._roundWave) {
        ctx.strokeStyle = 'rgba(229, 193, 108, 0.32)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < this._roundWave.length; i++) {
          const x = 16 + (i / (this._roundWave.length - 1)) * (w - 32);
          const y = cy + ((this._roundWave[i] - 128) / 128) * (20 + energy * 28);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      const slots = 5;
      const bw = 26;
      const gap = 11;
      const startX = cx - (slots * bw + (slots - 1) * gap) * 0.5;
      for (let i = 0; i < slots; i++) {
        const hit = i < this._tapTempoStamps.length;
        ctx.fillStyle = hit ? '#4ade80' : 'rgba(244, 234, 213, 0.1)';
        ctx.fillRect(startX + i * (bw + gap), cy - 20, bw, 40);
      }
      ctx.fillStyle = this._roundPhase === 'resolved' ? '#4ade80' : '#f3ede0';
      ctx.font = '900 12px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        this._roundPhase === 'resolved' && this._tapTempoResultBpm
          ? `TU TEMPO: ${this._tapTempoResultBpm} BPM · REAL: ${this._tapTempoTargetBpm} BPM`
          : `TOQUES REGISTRADOS: ${this._tapTempoStamps.length} / 5`,
        cx,
        h - 10
      );
    },

    _drawCRTTelephone(ctx, w, h, energy, tSec) {
      const p = this._roundPhase === 'resolved' ? 1 : clamp(this._roundElapsedSec / this._roundDurationSec, 0, 1);
      const cx = w * 0.5;
      const cy = h * 0.54;
      const r = Math.min(w * 0.25, h * 0.35);

      // Warm amber vacuum-tube glow halo behind shellac vinyl
      const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.48);
      grad.addColorStop(0, `rgba(245, 158, 11, ${0.18 + energy * 0.16})`);
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.48, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#14100b';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = p > 0.7 ? '#4ade80' : 'rgba(229, 193, 108, 0.55)';
      ctx.lineWidth = 2; ctx.stroke();

      ctx.strokeStyle = 'rgba(229, 193, 108, 0.16)';
      ctx.lineWidth = 1;
      for (let gr = r * 0.38; gr < r - 3; gr += 5) {
        ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#78350f';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e5c16c';
      ctx.beginPath(); ctx.arc(cx + Math.cos(tSec * 2.6) * (r * 0.16), cy + Math.sin(tSec * 2.6) * (r * 0.16), 2.5, 0, Math.PI * 2); ctx.fill();

      const dustCount = Math.round((1 - p) * 14);
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < dustCount; i++) {
        const sx = 16 + (Math.sin(tSec * 23 + i * 7.1) * 0.5 + 0.5) * (w - 32);
        const sy = 20 + (Math.cos(tSec * 19 + i * 4.3) * 0.5 + 0.5) * (h - 32);
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (this._roundWave) {
        ctx.strokeStyle = p > 0.7 ? '#4ade80' : '#f59e0b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < this._roundWave.length; i++) {
          const x = 16 + (i / (this._roundWave.length - 1)) * (w - 32);
          const y = h * 0.88 + ((this._roundWave[i] - 128) / 128) * (10 + energy * 15);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },

    _drawCRTChopper(ctx, w, h, energy, tSec) {
      const duty = this._roundPhase === 'resolved' ? 1 : this._chopperCurDuty;
      const slices = 16;
      const sw = (w - 38) / slices;
      const cy = h * 0.57;

      // Spinning chopper rotor indicator above gate bars
      const rCx = w * 0.5;
      const rCy = 34;
      const spin = tSec * this._chopperFreqHz * Math.PI * 2;
      ctx.strokeStyle = this._chopperIsOpen ? '#4ade80' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rCx - Math.cos(spin) * 14, rCy - Math.sin(spin) * 5);
      ctx.lineTo(rCx + Math.cos(spin) * 14, rCy + Math.sin(spin) * 5);
      ctx.stroke();

      for (let i = 0; i < slices; i++) {
        const x = 19 + i * sw;
        const openW = Math.max(2, (sw - 4) * duty);
        const barH = (this._chopperIsOpen || this._roundPhase === 'resolved')
          ? 24 + energy * (h * 0.42)
          : 12;
        ctx.fillStyle = this._chopperIsOpen || this._roundPhase === 'resolved' ? '#4ade80' : 'rgba(245, 158, 11, 0.3)';
        ctx.fillRect(x, cy - barH * 0.5, openW, barH);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
        ctx.fillRect(x + openW, cy - 3, Math.max(0, sw - 4 - openW), 6);
      }
    },

    _drawCRTEchoCavern(ctx, w, h, energy, tSec) {
      const cx = w * 0.5;
      const cy = h * 0.54;
      const p = this._roundPhase === 'resolved' ? 1 : clamp(this._roundElapsedSec / this._roundDurationSec, 0, 1);
      const rings = 6;
      const maxR = Math.min(w, h) * 0.44;

      for (let i = 0; i < rings; i++) {
        const phase = ((tSec * 0.85) + i / rings) % 1;
        const r = 10 + phase * maxR;
        const alpha = (1 - phase) * (1 - p * 0.55) * (0.4 + energy * 0.6);
        ctx.strokeStyle = p > 0.72 ? `rgba(74, 222, 128, ${alpha})` : `rgba(229, 193, 108, ${alpha})`;
        ctx.lineWidth = 2.2 - phase * 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#e5c16c';
      ctx.beginPath(); ctx.arc(cx, cy, 5 + energy * 10, 0, Math.PI * 2); ctx.fill();
    },

    // 13. CAZA EL FALLO — Live Pitch Integrity Tape Scope + Reflex ms Bar
    _drawCRTImpostor(ctx, w, h, energy, tSec) {
      const cx = w * 0.5;
      const cy = h * 0.54;

      if (this._roundPhase === 'resolved') {
        const diff = this._getDiff();
        const barW = w * 0.78;
        const bx = (w - barW) * 0.5;
        const by = h * 0.44;
        const ms = this._impostorLastSignedMs;
        const ok = ms !== null && ms >= -65 && ms <= diff.impostorPassMs;

        ctx.fillStyle = 'rgba(244, 234, 213, 0.12)';
        ctx.fillRect(bx, by - 5, barW, 10);

        // Pass window from 0ms to impostorPassMs
        const maxMs = 1500;
        const winW = clamp(diff.impostorPassMs / maxMs, 0.25, 0.85) * barW;
        ctx.fillStyle = 'rgba(74, 222, 128, 0.26)';
        ctx.fillRect(bx, by - 9, winW, 18);

        ctx.strokeStyle = '#e5c16c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, by - 16); ctx.lineTo(bx, by + 16); ctx.stroke();

        if (ms !== null && ms >= -65) {
          const hitX = bx + clamp(ms / maxMs, 0, 1) * barW;
          ctx.fillStyle = ok ? '#4ade80' : '#ef4444';
          ctx.beginPath(); ctx.arc(hitX, by, 7, 0, Math.PI * 2); ctx.fill();
        }

        ctx.font = '900 12px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = ok ? '#4ade80' : '#fca5a5';
        ctx.fillText(
          ms === null ? 'FALLO NO DETECTADO' : (ms < -65 ? `DEMASIADO PRONTO (${ms}MS)` : `TIEMPO DE REACCION: +${Math.max(12, ms)} MS`),
          cx, by + 34
        );
        return;
      }

      // Live blind waveform monitor (intentionally never leaks visual glitch before user hears it!)
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(14, cy); ctx.lineTo(w - 14, cy); ctx.stroke();

      if (this._roundWave) {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let i = 0; i < this._roundWave.length; i++) {
          const x = 14 + (i / (this._roundWave.length - 1)) * (w - 28);
          const y = cy + ((this._roundWave[i] - 128) / 128) * (24 + energy * 34);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Scanning tape-head cursor
      const scanX = 14 + ((tSec * 90) % (w - 28));
      ctx.strokeStyle = 'rgba(229, 193, 108, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(scanX, 24); ctx.lineTo(scanX, h - 24); ctx.stroke();

      ctx.fillStyle = 'rgba(243, 237, 224, 0.72)';
      ctx.font = '800 10px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ANALIZANDO AFINACION EN VIVO · OIDO ALERTA', cx, h - 12);
    },

    // 14. DOBLE VINILO — Dual DJ Decks + Live Crossfader Rail
    _drawCRTMashup(ctx, w, h, energy, tSec) {
      const cy = h * 0.48;
      const r = Math.min(w * 0.165, h * 0.30);
      const lx = w * 0.27;
      const rx = w * 0.73;
      const cross = this._roundPhase === 'resolved' ? 1.0 : this._mashupCrossVal;

      // Deck A (Target — CRT Green) & Deck B (Decoy — Amber)
      const decks = [
        { x: lx, label: 'DECK A', col: '#4ade80', alpha: 0.45 + cross * 0.55, spin: tSec * 3.1 },
        { x: rx, label: 'DECK B', col: '#f59e0b', alpha: 0.2 + (1 - cross) * 0.8, spin: -tSec * 2.7 }
      ];
      decks.forEach(d => {
        ctx.save();
        ctx.globalAlpha = clamp(d.alpha, 0.25, 1);
        ctx.fillStyle = '#12100d';
        ctx.beginPath(); ctx.arc(d.x, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = d.col;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 245, 220, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(d.x, cy, r * 0.68, 0, Math.PI * 2); ctx.stroke();

        // Strobe dot
        ctx.fillStyle = d.col;
        ctx.beginPath();
        ctx.arc(d.x + Math.cos(d.spin) * (r * 0.55), cy + Math.sin(d.spin) * (r * 0.55), 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#070605';
        ctx.beginPath(); ctx.arc(d.x, cy, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = d.col; ctx.lineWidth = 1.4; ctx.stroke();

        ctx.fillStyle = d.col;
        ctx.font = '800 9px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, d.x, cy - r - 6);
        ctx.restore();
      });

      // Center Live DJ Crossfader Rail
      const railW = w * 0.56;
      const railX = (w - railW) * 0.5;
      const railY = h - 22;
      ctx.fillStyle = 'rgba(244, 234, 213, 0.14)';
      ctx.fillRect(railX, railY - 2.5, railW, 5);
      // Knob slides left toward Deck A as target song takes over
      const knobX = railX + (1 - cross) * railW;
      drawRoundedRectPath(ctx, knobX - 8, railY - 9, 16, 18, 3);
      ctx.fillStyle = '#e5c16c';
      ctx.fill();

      ctx.fillStyle = 'rgba(243, 237, 224, 0.6)';
      ctx.font = '800 8.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'right'; ctx.fillText('A', railX - 8, railY + 3);
      ctx.textAlign = 'left'; ctx.fillText('B', railX + railW + 8, railY + 3);
    },

    // 15. SUBMARINO — Rotating Phosphor Submarine Sonar Radar
    _drawCRTUnderwater(ctx, w, h, energy, tSec) {
      const cx = w * 0.5;
      const cy = h * 0.54;
      const maxR = Math.min(w * 0.34, h * 0.42);
      const depth = this._roundPhase === 'resolved' ? 0 : this._underwaterDepthM;

      // Concentric sonar range rings
      for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.14 + i * 0.06})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, (maxR / 3) * i, 0, Math.PI * 2); ctx.stroke();
      }
      // Crosshairs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Rotating phosphor sweep wedge
      const sweepAng = (tSec * 2.1) % (Math.PI * 2);
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, sweepAng - 0.55, sweepAng);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = depth <= 10 ? '#4ade80' : '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAng) * maxR, cy + Math.sin(sweepAng) * maxR);
      ctx.stroke();
      ctx.restore();

      // Reactive sonar audio blips
      for (let b = 0; b < 5; b++) {
        const ba = (b * 1.37 + 0.4) % (Math.PI * 2);
        const br = maxR * (0.28 + ((b * 0.19) % 0.62));
        const delta = Math.abs(((sweepAng - ba + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const glow = clamp(1 - (Math.PI - delta) / 2.2, 0.12, 1);
        ctx.fillStyle = `rgba(125, 211, 252, ${glow * (0.45 + energy * 0.55)})`;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 2.5 + energy * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rising translucent underwater bubbles
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.36)';
      ctx.lineWidth = 1.1;
      for (let b = 0; b < 7; b++) {
        const bx = 24 + ((b * 47) % Math.max(40, w - 48)) + Math.sin(tSec * 2 + b) * 6;
        const by = h - (((tSec * (26 + b * 5) + b * 31) % (h - 20)) + 10);
        const br = 2 + (b % 3);
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.stroke();
      }

      // Depth gauge readout on right side
      ctx.fillStyle = depth <= 10 ? '#4ade80' : '#7dd3fc';
      ctx.font = '900 13px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(depth <= 2 ? '0M · AIRE' : `-${depth}M`, w - 18, h - 14);
    },

    // 16. VINILO RAYADO — Scratched Groove Platter + Bouncing Tonearm + Specular Glint
    _drawCRTStutter(ctx, w, h, energy, tSec) {
      const cx = w * 0.44;
      const cy = h * 0.54;
      const r = Math.min(w * 0.28, h * 0.40);
      const loopDur = this._roundPhase === 'resolved' ? 16 : this._stutterLoopDur;
      const unlocked = loopDur >= 10;

      ctx.fillStyle = '#110f0d';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = unlocked ? '#4ade80' : 'rgba(229, 193, 108, 0.55)';
      ctx.lineWidth = 2; ctx.stroke();

      // Subtle radial vinyl sheen glint
      ctx.save();
      ctx.fillStyle = 'rgba(255, 245, 220, 0.06)';
      const sheenA = (tSec * 0.5) % (Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r - 2, sheenA, sheenA + 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 245, 220, 0.12)';
      ctx.lineWidth = 1;
      for (let gr = r * 0.36; gr < r - 4; gr += 5) {
        ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.stroke();
      }

      const loopAngle = unlocked ? Math.PI * 2 : clamp((loopDur / 3.0) * Math.PI * 1.6, 0.32, Math.PI * 1.7);
      const startA = (tSec * 2.8) % (Math.PI * 2);
      ctx.strokeStyle = unlocked ? '#4ade80' : '#f97316';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.72, startA, startA + loopAngle);
      ctx.stroke();

      ctx.fillStyle = unlocked ? '#14532d' : '#7c2d12';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f3ede0';
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();

      this._stutterBounce *= 0.88;
      const pivotX = cx + r + 24;
      const pivotY = cy - r * 0.65;
      const bounceOffset = Math.sin(tSec * 36) * this._stutterBounce * 7;
      const needleX = cx + r * 0.68 + bounceOffset;
      const needleY = cy + r * 0.24 - this._stutterBounce * 5;

      ctx.fillStyle = '#292524';
      ctx.beginPath(); ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e5c16c'; ctx.lineWidth = 1.6; ctx.stroke();

      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(needleX, needleY);
      ctx.stroke();

      ctx.fillStyle = this._stutterBounce > 0.2 ? '#fb923c' : '#4ade80';
      ctx.beginPath(); ctx.arc(needleX, needleY, 3 + energy * 3 + this._stutterBounce * 3, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = unlocked ? '#4ade80' : '#fdba74';
      ctx.font = '900 10.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(unlocked ? 'SURCO LIBRE' : `BUCLE ${loopDur.toFixed(2)}S`, w - 18, h - 12);
    },

    // 17. DIAL FM 88-108 — Vintage Illuminated FM Tuner Scale + S-Meter + Stereo Beacon
    _drawCRTTuner(ctx, w, h, energy, tSec) {
      const padX = 20;
      const scaleW = w - padX * 2;
      const dialY = h * 0.56;
      const clarity = this._roundPhase === 'resolved' ? 1.0 : this._tunerSignalClarity;
      const curMhz = this._tunerCurMhz || 98.0;

      // Illuminated amber radio glass bezel
      drawRoundedRectPath(ctx, padX, dialY - 26, scaleW, 52, 8);
      ctx.fillStyle = 'rgba(18, 15, 10, 0.92)';
      ctx.fill();
      ctx.strokeStyle = clarity > 0.78 ? 'rgba(74, 222, 128, 0.55)' : 'rgba(229, 193, 108, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // FM frequency graduation ticks (88 to 108 MHz)
      for (let m = 88; m <= 108; m++) {
        const frac = (m - 88) / 20;
        const tx = padX + 10 + frac * (scaleW - 20);
        const major = m % 4 === 0;
        ctx.strokeStyle = major ? 'rgba(246, 223, 160, 0.72)' : 'rgba(246, 223, 160, 0.24)';
        ctx.lineWidth = major ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(tx, dialY - (major ? 10 : 5));
        ctx.lineTo(tx, dialY + (major ? 8 : 4));
        ctx.stroke();
        if (major) {
          ctx.fillStyle = 'rgba(243, 237, 224, 0.75)';
          ctx.font = '800 9px ui-monospace, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(m), tx, dialY + 20);
        }
      }

      // On resolve, show true green broadcast tower frequency marker
      if (this._roundPhase === 'resolved') {
        const tf = clamp((this._tunerTargetMhz - 88) / 20, 0, 1);
        const tx = padX + 10 + tf * (scaleW - 20);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(tx, dialY - 24); ctx.lineTo(tx, dialY + 24); ctx.stroke();
      }

      // Glowing red/amber physical tuning needle
      const nf = clamp((curMhz - 88) / 20, 0, 1);
      const nx = padX + 10 + nf * (scaleW - 20);
      ctx.strokeStyle = clarity > 0.78 ? '#4ade80' : '#f97316';
      ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(nx, dialY - 25); ctx.lineTo(nx, dialY + 25); ctx.stroke();

      // Static snow overlay inside dial when off-station
      const snowCount = Math.round((1 - clarity) * 28);
      ctx.fillStyle = 'rgba(243, 237, 224, 0.35)';
      for (let i = 0; i < snowCount; i++) {
        const sx = padX + 6 + ((Math.sin(tSec * 41 + i * 9.3) * 0.5 + 0.5) * (scaleW - 12));
        const sy = dialY - 22 + ((Math.cos(tSec * 37 + i * 5.7) * 0.5 + 0.5) * 44);
        ctx.fillRect(sx, sy, 2, 1.5);
      }

      // S-METER signal bar + FM STEREO lamp above dial
      const smW = 92;
      const smX = padX + 4;
      const smY = dialY - 40;
      ctx.fillStyle = 'rgba(229, 193, 108, 0.65)';
      ctx.font = '800 8.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SIGNAL', smX, smY);
      const segs = 10;
      const lit = Math.round(clarity * segs);
      for (let i = 0; i < segs; i++) {
        ctx.fillStyle = i < lit ? (i >= 7 ? '#4ade80' : '#f59e0b') : 'rgba(244, 234, 213, 0.1)';
        ctx.fillRect(smX + 40 + i * 6, smY - 7, 4.5, 7);
      }

      const stereoLock = clarity > 0.76;
      ctx.fillStyle = stereoLock ? '#4ade80' : 'rgba(244, 234, 213, 0.22)';
      ctx.textAlign = 'right';
      ctx.fillText(stereoLock ? 'FM STEREO LOCK' : 'BUSCANDO SENAL', w - padX - 4, smY);

      ctx.fillStyle = '#f3ede0';
      ctx.font = '900 13px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        this._roundPhase === 'resolved'
          ? `TU DIAL ${curMhz.toFixed(1)} · EMISORA ${this._tunerTargetMhz.toFixed(1)} MHZ`
          : `${curMhz.toFixed(1)} MHZ`,
        w * 0.5,
        h - 10
      );
    },

    // 18. CHIPTUNE 8-BIT — Scrolling Retro NES Piano-Roll Sequencer
    _drawCRTMelody(ctx, w, h, energy) {
      const padX = 18;
      const topY = 28;
      const botY = h - 22;
      const rollH = botY - topY;
      const rollW = w - padX * 2;
      const contour = this._melodyContour;

      // Retro pixel piano-roll grid rows
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.08)';
      ctx.lineWidth = 1;
      for (let r = 0; r <= 6; r++) {
        const y = topY + (r / 6) * rollH;
        ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - padX, y); ctx.stroke();
      }

      const playX = padX + rollW * 0.34;
      if (contour && contour.frames && contour.frames.length > 0) {
        const frames = contour.frames;
        const curStep = Math.max(0, this._melodyLastStep);
        const visibleSteps = 26;
        const colW = rollW / visibleSteps;
        const startStep = curStep - 8;

        for (let k = 0; k < visibleSteps; k++) {
          const idx = ((startStep + k) % frames.length + frames.length) % frames.length;
          const fr = frames[idx];
          if (!fr || fr.amp <= 0.05) continue;
          const normPitch = clamp((fr.midi - 55) / 29, 0, 1);
          const ny = botY - 8 - normPitch * (rollH - 16);
          const nx = padX + k * colW;
          const isNow = (startStep + k) === curStep;
          ctx.fillStyle = isNow ? '#f6dfa0' : (k < 8 ? 'rgba(74, 222, 128, 0.36)' : '#4ade80');
          ctx.fillRect(nx + 1, ny - 4, Math.max(3, colW - 2), 8);
          if (isNow) {
            ctx.fillStyle = 'rgba(246, 223, 160, 0.24)';
            ctx.fillRect(nx - 2, ny - 7, colW + 4, 14);
          }
        }
      }

      // Vertical neon playhead line
      ctx.strokeStyle = '#f6dfa0';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(playX, topY); ctx.lineTo(playX, botY); ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.font = '900 11px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        this._roundPhase === 'resolved'
          ? 'AUDIO DE ESTUDIO RESTAURADO'
          : `NOTA 8-BIT: ${this._melodyCurNoteLabel} · SYNTH NES`,
        w * 0.5,
        h - 7
      );
    },

    // 19. RUEDA LOCA — Live Rollercoaster Sine Speed Track + Magnetic Brake Glow
    _drawCRTSpeedrun(ctx, w, h, energy, tSec) {
      const padX = 20;
      const topY = 30;
      const botY = h - 24;
      const midY = (topY + botY) * 0.5;
      const spanY = (botY - topY) * 0.44;
      const rate = this._roundPhase === 'resolved' ? 1.0 : this._speedrunCurRate;
      const braking = performance.now() < this._speedrunBrakeUntil;

      // Nominal 1.00x horizon dashed guide
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(padX, midY); ctx.lineTo(w - padX, midY); ctx.stroke();
      ctx.restore();

      // Draw live velocity history ribbon
      const hist = this._speedrunHistory;
      if (hist && hist.length > 1) {
        ctx.strokeStyle = braking ? '#4ade80' : '#f59e0b';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const x = padX + (i / Math.max(1, 71)) * (w - padX * 2);
          const y = midY - clamp((hist[i] - 1.0) / 0.5, -1, 1) * spanY;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Glowing rollercoaster rider orb at leading tip
        const lx = padX + ((hist.length - 1) / 71) * (w - padX * 2);
        const ly = midY - clamp((rate - 1.0) / 0.5, -1, 1) * spanY;
        ctx.fillStyle = braking ? '#4ade80' : '#f6dfa0';
        ctx.beginPath(); ctx.arc(lx, ly, 5 + energy * 3.5, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = 'rgba(243, 237, 224, 0.5)';
      ctx.font = '800 8.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('1.5X', padX, topY + 6);
      ctx.fillText('0.5X', padX, botY);

      ctx.fillStyle = braking ? '#4ade80' : '#f6dfa0';
      ctx.font = '900 12px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        braking ? 'FRENO MAGNETICO · 1.00X' : `VELOCIDAD ACTUAL: ${rate.toFixed(2)}X`,
        w * 0.5,
        h - 8
      );
    },

    // 20. CONSOLA EQ — 3-Column Studio Mastering Isolator Analyzer
    _drawCRTEqHunter(ctx, w, h, energy) {
      const padX = 24;
      const topY = 30;
      const botY = h - 22;
      const colGap = 14;
      const colW = (w - padX * 2 - colGap * 2) / 3;
      const bands = [
        { id: 'low',  title: 'GRAVES', sub: '<250 HZ',  bins: [1, 8] },
        { id: 'mid',  title: 'MEDIOS', sub: '1.2 KHZ',  bins: [9, 28] },
        { id: 'high', title: 'AGUDOS', sub: '>3.2 KHZ', bins: [29, 64] }
      ];

      bands.forEach((b, idx) => {
        const bx = padX + idx * (colW + colGap);
        const active = this._roundPhase === 'resolved' || this._eqActiveBand === b.id;

        drawRoundedRectPath(ctx, bx, topY, colW, botY - topY, 7);
        ctx.fillStyle = active ? 'rgba(74, 222, 128, 0.08)' : 'rgba(244, 234, 213, 0.03)';
        ctx.fill();
        ctx.strokeStyle = active ? '#4ade80' : 'rgba(244, 234, 213, 0.14)';
        ctx.lineWidth = active ? 1.8 : 1;
        ctx.stroke();

        // Compute band energy
        let sum = 0;
        let cnt = 0;
        if (this._roundFft) {
          for (let k = b.bins[0]; k <= Math.min(b.bins[1], this._roundFft.length - 1); k++) {
            sum += this._roundFft[k] / 255;
            cnt++;
          }
        }
        const bLvl = active ? clamp((cnt > 0 ? sum / cnt : energy) * 1.35, 0.12, 1) : 0.06;
        const innerH = botY - topY - 30;
        const barH = bLvl * innerH;

        ctx.fillStyle = active ? '#4ade80' : 'rgba(239, 68, 68, 0.25)';
        drawRoundedRectPath(ctx, bx + 10, botY - 18 - barH, colW - 20, Math.max(4, barH), 4);
        ctx.fill();

        ctx.fillStyle = active ? '#f6dfa0' : 'rgba(243, 237, 224, 0.36)';
        ctx.font = '900 9.5px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.title, bx + colW * 0.5, topY + 13);
        ctx.fillStyle = active ? '#4ade80' : 'rgba(239, 68, 68, 0.55)';
        ctx.font = '800 8px ui-monospace, Menlo, monospace';
        ctx.fillText(active ? 'SOLO ON' : 'MUTE', bx + colW * 0.5, botY - 5);
      });

      ctx.fillStyle = 'rgba(229, 193, 108, 0.72)';
      ctx.font = '800 9.5px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('USA EL RACK INFERIOR PARA CAMBIAR DE BANDA EN VIVO', w * 0.5, h - 6);
    },

    _drawCRTStereoDuo(ctx, w, h, energy, tSec) {
      const padX = 24;
      const traceW = w - padX * 2;
      const topMid = h * 0.36;
      const botMid = h * 0.70;
      const mon = this._stereoMonitorMode || 'mix';

      // Check lock status per channel
      let lockedL = false;
      let lockedR = false;
      if (this._curChoices && this._stereoFoundIndices) {
        this._stereoFoundIndices.forEach(idx => {
          const c = this._curChoices[idx];
          if (c && c.stereoCh === 'L') lockedL = true;
          if (c && c.stereoCh === 'R') lockedR = true;
        });
      }

      // Divider centerline
      ctx.strokeStyle = 'rgba(229, 193, 108, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padX, h * 0.53);
      ctx.lineTo(w - padX, h * 0.53);
      ctx.stroke();
      ctx.setLineDash([]);

      const drawChannelWave = (waveBuf, cy, color, alpha, phaseOffset) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        const len = waveBuf ? waveBuf.length : 128;
        const step = Math.max(1, Math.floor(len / 96));
        for (let i = 0, n = 0; i < len; i += step, n++) {
          const x = padX + (i / (len - 1)) * traceW;
          const raw = waveBuf ? (waveBuf[i] - 128) / 128 : Math.sin(tSec * 7 + n * 0.35 + phaseOffset) * 0.2;
          const y = cy + raw * (h * 0.16);
          if (n === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      };

      const alphaL = mon === 'right' ? 0.25 : 0.95;
      const alphaR = mon === 'left' ? 0.25 : 0.95;
      drawChannelWave(this._roundWave, topMid, lockedL ? '#4ade80' : '#f59e0b', alphaL, 0);
      drawChannelWave(this._roundWaveR || this._roundWave, botMid, lockedR ? '#4ade80' : '#38bdf8', alphaR, 1.9);

      // Channel L & R status pills inside CRT
      const drawBadge = (x, y, label, active, locked, col) => {
        drawRoundedRectPath(ctx, x, y, 108, 17, 4);
        ctx.fillStyle = locked ? 'rgba(16, 42, 26, 0.9)' : 'rgba(10, 9, 8, 0.85)';
        ctx.fill();
        ctx.strokeStyle = locked ? '#4ade80' : (active ? col : 'rgba(255,245,220,0.16)');
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = locked ? '#86efac' : (active ? col : '#9a9080');
        ctx.font = '800 8.5px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 7, y + 11.5);
      };

      drawBadge(padX, h * 0.19, lockedL ? 'L · CLAVADO' : 'CANAL L (IZD)', mon !== 'right', lockedL, '#f6dfa0');
      drawBadge(padX, h * 0.56, lockedR ? 'R · CLAVADO' : 'CANAL R (DER)', mon !== 'left', lockedR, '#7dd3fc');

      ctx.fillStyle = 'rgba(229, 193, 108, 0.72)';
      ctx.font = '800 9px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        mon === 'mix' ? 'AURICULARES RECOMENDADOS · IDENTIFICA AMBAS CANCIONES' : `MONITOR ${mon === 'left' ? 'IZQUIERDO' : 'DERECHO'} AISLADO`,
        w * 0.5,
        h - 6
      );
    },

    _drawCRTYearDial(ctx, w, h, energy) {
      const minY = this._yearMin || 1970;
      const maxY = this._yearMax || 2026;
      const span = Math.max(1, maxY - minY);
      const curY = clamp(this._yearCur || 2000, minY, maxY);
      const padX = 28;
      const railW = w - padX * 2;
      const railY = h * 0.68;

      // Subtle live waveform glow behind year readout
      if (this._roundWave) {
        ctx.save();
        ctx.strokeStyle = 'rgba(229, 193, 108, 0.18)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const len = this._roundWave.length;
        const step = Math.max(1, Math.floor(len / 88));
        for (let i = 0, n = 0; i < len; i += step, n++) {
          const x = padX + (i / (len - 1)) * railW;
          const v = (this._roundWave[i] - 128) / 128;
          const y = h * 0.36 + v * (h * 0.16);
          if (n === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Giant Nixie-style selected year display
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
      ctx.shadowBlur = 14 + energy * 10;
      ctx.fillStyle = '#f6dfa0';
      ctx.font = '900 34px ui-monospace, Menlo, monospace';
      ctx.fillText(String(curY), w * 0.5, h * 0.45);
      ctx.restore();

      // Horizontal brushed-brass chronometer rail
      ctx.strokeStyle = 'rgba(229, 193, 108, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padX, railY);
      ctx.lineTo(w - padX, railY);
      ctx.stroke();

      // Year ticks & labels
      const majorStep = span <= 12 ? 1 : (span <= 25 ? 5 : 10);
      for (let y = minY; y <= maxY; y++) {
        const px = padX + ((y - minY) / span) * railW;
        const isMajor = (y % majorStep === 0) || y === minY || y === maxY;
        const isMid = !isMajor && span > 12 && y % 5 === 0;
        const tickH = isMajor ? 11 : (isMid ? 7 : 3.5);
        ctx.strokeStyle = isMajor ? 'rgba(246, 223, 160, 0.65)' : 'rgba(244, 234, 213, 0.18)';
        ctx.lineWidth = isMajor ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(px, railY - tickH * 0.5);
        ctx.lineTo(px, railY + tickH * 0.5);
        ctx.stroke();

        if (isMajor && (span <= 12 || (y - minY) >= 0)) {
          ctx.fillStyle = 'rgba(205, 193, 170, 0.72)';
          ctx.font = '700 8px ui-monospace, Menlo, monospace';
          ctx.textAlign = 'center';
          const lbl = span <= 12 ? String(y).slice(-2) : String(y);
          ctx.fillText(lbl, px, railY + 18);
        }
      }

      // Tolerance band around cursor (preview of allowed margin)
      const tolW = (this._yearPassTol / span) * railW;
      const curX = padX + ((curY - minY) / span) * railW;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.fillRect(Math.max(padX, curX - tolW), railY - 12, Math.min(railW, tolW * 2), 24);

      // Cursor tuning needle
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(curX, railY - 18);
      ctx.lineTo(curX, railY + 10);
      ctx.stroke();

      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(curX, railY - 18, 4, 0, Math.PI * 2);
      ctx.fill();

      // On reveal, draw true releaseYear target pin in CRT green!
      if (this._roundPhase === 'resolved') {
        const tgtY = clamp(this._yearTarget || curY, minY, maxY);
        const tgtX = padX + ((tgtY - minY) / span) * railW;
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(tgtX, railY - 22);
        ctx.lineTo(tgtX, railY + 12);
        ctx.stroke();

        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(tgtX, railY - 22, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '900 9.5px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`REAL ${this._yearTarget}`, clamp(tgtX, padX + 34, w - padX - 34), railY - 28);
      }
    },

    // -----------------------------------------------------------------------
    // 1080x1350 STUDIO CALIBRATION SHAREABLE PNG CARD
    // -----------------------------------------------------------------------
    async exportShareCard() {
      const total = Math.max(1, this._roundResults.length);
      const hits = this._roundResults.filter(r => r.ok).length;
      const diff = this._getDiff();
      const rank = computeRank(this._score, Math.max(total, this._formatMode === 'blitz' ? 7 : total), diff.scoreMult);

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#090807';
      ctx.fillRect(0, 0, 1080, 1350);

      ctx.strokeStyle = 'rgba(229, 193, 108, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 90; x < 1080; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1350); ctx.stroke(); }
      for (let y = 90; y < 1350; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke(); }

      drawRoundedRectPath(ctx, 48, 48, 984, 1254, 34);
      ctx.strokeStyle = 'rgba(229, 193, 108, 0.5)'; ctx.lineWidth = 3; ctx.stroke();

      const fTag = this._getActiveFilterTag();
      ctx.fillStyle = '#e5c16c';
      ctx.font = '800 22px ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`CONSOLA OA-22 · ${diff.label.toUpperCase()} · ${this._formatMode.toUpperCase()}${fTag ? ` · ${fTag.toUpperCase()}` : ''}`, 540, 132);

      ctx.fillStyle = '#f3ede0';
      ctx.font = '700 68px Georgia, serif';
      ctx.fillText('Oido Arcade', 540, 212);

      drawRoundedRectPath(ctx, 415, 265, 250, 250, 32);
      ctx.fillStyle = '#12100e'; ctx.fill();
      ctx.strokeStyle = rank.color; ctx.lineWidth = 6; ctx.stroke();

      ctx.fillStyle = rank.color;
      ctx.font = '900 128px Georgia, serif';
      ctx.fillText(rank.grade, 540, 434);

      ctx.fillStyle = '#f3ede0';
      ctx.font = '700 54px Georgia, serif';
      ctx.fillText(rank.title, 540, 594);

      ctx.fillStyle = '#4ade80';
      ctx.font = '900 42px ui-monospace, Menlo, monospace';
      ctx.fillText(`${this._score} PUNTOS`, 540, 654);

      const metrics = [
        { val: `${hits}/${total}`, lbl: 'ACIERTOS' },
        { val: this._bestPitchAccuracy !== null ? `${this._bestPitchAccuracy}%` : (this._bestBpmErr !== null ? `+-${this._bestBpmErr}` : '--'), lbl: 'TONO / BPM' },
        { val: this._bestSilenceErrMs !== null ? `${this._bestSilenceErrMs}ms` : '--', lbl: 'PULSO' }
      ];
      metrics.forEach((m, i) => {
        const bx = 92 + i * 310;
        drawRoundedRectPath(ctx, bx, 708, 276, 146, 20);
        ctx.fillStyle = '#141210'; ctx.fill();
        ctx.strokeStyle = 'rgba(244, 234, 213, 0.14)'; ctx.lineWidth = 2; ctx.stroke();

        ctx.fillStyle = '#f3ede0'; ctx.font = '900 44px ui-monospace, Menlo, monospace';
        ctx.fillText(m.val, bx + 138, 782);
        ctx.fillStyle = '#9a9080'; ctx.font = '700 19px ui-monospace, Menlo, monospace';
        ctx.fillText(m.lbl, bx + 138, 826);
      });

      ctx.textAlign = 'left';
      ctx.fillStyle = '#9a9080';
      ctx.font = '800 20px ui-monospace, Menlo, monospace';
      ctx.fillText('REGISTRO DE PRUEBAS', 96, 922);

      this._roundResults.slice(0, 6).forEach((res, i) => {
        const ry = 950 + i * 48;
        drawRoundedRectPath(ctx, 92, ry, 896, 40, 10);
        ctx.fillStyle = '#12100e'; ctx.fill();
        ctx.fillStyle = res.ok ? '#4ade80' : '#ef4444';
        ctx.beginPath(); ctx.arc(116, ry + 20, 6, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#e5c16c'; ctx.font = '800 18px ui-monospace, Menlo, monospace';
        ctx.fillText(res.trial.short.toUpperCase(), 138, ry + 26);

        ctx.fillStyle = '#f3ede0'; ctx.font = '700 20px system-ui, sans-serif';
        const line = `${res.track.title} - ${res.track.artist || ''}`;
        ctx.fillText(line.length > 44 ? line.slice(0, 44) + '...' : line, 290, ry + 27);
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(229, 193, 108, 0.65)';
      ctx.font = '700 20px ui-monospace, Menlo, monospace';
      ctx.fillText('CERTIFICADO OFICIAL · OIDO ARCADE', 540, 1268);

      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('blob_fail');
        const file = new File([blob], `oido-arcade-${rank.grade}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Oido Arcade · Rango ${rank.grade}`,
            text: `He sacado Rango ${rank.grade} (${this._score} pts) en Oido Arcade.`
          });
          toast('Tarjeta compartida');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oido-arcade-${rank.grade}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast('Tarjeta descargada en PNG');
      } catch (_) {
        toast('No se pudo exportar la tarjeta');
      }
    }
  };

  window.EarArcade = EarArcade;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EarArcade.syncHomeBadge());
  } else {
    EarArcade.syncHomeBadge();
  }
})();
