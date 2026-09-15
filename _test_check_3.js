
    const libarchivePath = './assets/vendor/libarchive/libarchive.js';
    import(libarchivePath).catch(() => import('./vendor/libarchive/libarchive.js')).then(({ Archive }) => {
      window.Archive = Archive;
      const workerUrl = new URL('./assets/vendor/libarchive/worker-bundle.js', window.location.href).href;
      Archive.init({ workerUrl });
      console.log('[Libarchive] WebAssembly worker bundle inicializado:', workerUrl);
    }).catch(e => {
      console.warn('[Libarchive] Inicialización de libarchive:', e);
    });
  