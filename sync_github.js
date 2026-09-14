import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_OWNER = 'Bruala33';
const REPO_NAME = 'renacer';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

async function sync() {
  console.log(`[GitHub Sync] Verificando repositorio ${REPO_OWNER}/${REPO_NAME}...`);

  const authUrl = GITHUB_TOKEN
    ? `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`
    : `https://github.com/${REPO_OWNER}/${REPO_NAME}.git`;

  const tempDir = path.join('/tmp', `repo_sync_${Date.now()}`);

  try {
    console.log(`[GitHub Sync] Intentando clonar última versión...`);
    execSync(`git clone --depth 1 "${authUrl}" "${tempDir}"`, {
      stdio: 'pipe',
    });
    console.log(`[GitHub Sync] Clonación exitosa. Sincronizando cambios...`);

    // Sincronizar directorios clave manteniendo la configuración web
    const syncDirs = ['app/static', 'android', 'assets', 'screenshots'];
    for (const d of syncDirs) {
      const src = path.join(tempDir, d);
      const dest = path.join(process.cwd(), d);
      if (fs.existsSync(src)) {
        console.log(`[GitHub Sync] Actualizando ${d}...`);
        execSync(`cp -ru "${src}/." "${dest}/" 2>/dev/null || cp -r "${src}/." "${dest}/"`, { stdio: 'inherit' });
      }
    }

    // Copiar otros archivos sueltos relevantes si existen
    const files = fs.readdirSync(tempDir);
    for (const f of files) {
      if (['.git', 'node_modules', 'server.js', 'package.json'].includes(f)) continue;
      const src = path.join(tempDir, f);
      const dest = path.join(process.cwd(), f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
      }
    }

    // Limpieza
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`[GitHub Sync] Sincronización finalizada con éxito.`);
    process.exit(0);
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    console.error(`[GitHub Sync Error] No fue posible clonar el repositorio.`);
    if (stderr.includes('could not read Username') || stderr.includes('Authentication failed') || stderr.includes('Repository not found')) {
      console.error(`Causa: El repositorio "${REPO_OWNER}/${REPO_NAME}" es privado o requiere autenticación.`);
      console.error(`Solución: Configura la variable GITHUB_TOKEN en el entorno/Settings con un token de acceso personal (PAT).`);
    } else {
      console.error(stderr);
    }
    process.exit(1);
  }
}

sync();
