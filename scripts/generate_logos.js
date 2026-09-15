import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background & Glow Gradients -->
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#1f1402" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#0a0701" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
    </radialGradient>

    <linearGradient id="neonGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff4c2"/>
      <stop offset="35%" stop-color="#fbbf24"/>
      <stop offset="70%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>

    <linearGradient id="goldKeyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="30%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <linearGradient id="whiteKeyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#ede7db"/>
      <stop offset="100%" stop-color="#c4bbaa"/>
    </linearGradient>

    <linearGradient id="blackKeyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2d2a32"/>
      <stop offset="25%" stop-color="#141218"/>
      <stop offset="85%" stop-color="#070609"/>
      <stop offset="100%" stop-color="#1b1822"/>
    </linearGradient>

    <linearGradient id="text3DGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#fdf6e2"/>
      <stop offset="65%" stop-color="#e2c896"/>
      <stop offset="100%" stop-color="#b89352"/>
    </linearGradient>

    <linearGradient id="textSideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#916c2d"/>
      <stop offset="100%" stop-color="#4e350c"/>
    </linearGradient>

    <!-- Filters for Neon Glow -->
    <filter id="glowLight" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur1"/>
      <feGaussianBlur stdDeviation="20" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="intenseGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b1"/>
      <feGaussianBlur stdDeviation="15" result="b2"/>
      <feGaussianBlur stdDeviation="35" result="b3"/>
      <feMerge>
        <feMergeNode in="b3"/>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="12" flood-color="#000000" flood-opacity="0.95"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="#000000"/>
  <rect width="1024" height="1024" fill="url(#bgGlow)"/>

  <!-- ============================================== -->
  <!-- GRAND PIANO NEON FRAME (DOUBLE CONTOUR GLOW) -->
  <!-- ============================================== -->
  <g filter="url(#intenseGlow)">
    <!-- Outer Glow Shell -->
    <path d="M 160 840 
             L 110 840 Q 95 840 95 825 L 95 620 Q 95 600 110 600 
             L 160 600 Q 170 600 170 590 L 170 120 Q 170 90 200 90 
             L 520 90 Q 550 90 580 115 
             C 650 175, 710 240, 770 330 
             C 830 420, 880 470, 910 500 Q 925 515 925 535 
             L 925 600 Q 940 600 940 620 
             L 940 825 Q 940 840 925 840 
             L 870 840 L 870 870 Q 870 880 860 880 L 840 880 Q 830 880 830 870 L 830 840 
             L 200 840 L 200 870 Q 200 880 190 880 L 170 880 Q 160 880 160 870 Z" 
          fill="#060509" stroke="#f59e0b" stroke-width="12" stroke-linejoin="round"/>
    
    <!-- Inner Accent Neon Stroke -->
    <path d="M 180 820 
             L 125 820 L 125 620 L 180 620 L 185 130 Q 185 110 205 110 
             L 515 110 Q 540 110 565 130 
             C 635 190, 695 255, 755 345 
             C 815 435, 865 485, 895 515 Q 905 525 905 545 
             L 905 620 L 915 620 L 915 820 
             L 180 820 Z" 
          fill="none" stroke="#fff4c2" stroke-width="5" stroke-linejoin="round" opacity="0.95"/>
  </g>

  <!-- ============================================== -->
  <!-- RHYTHM LANES & FALLING NOTES INSIDE PIANO -->
  <!-- ============================================== -->
  <g>
    <!-- Vertical Track Lanes -->
    <!-- Lane 1 (Left) -->
    <line x1="300" y1="110" x2="270" y2="460" stroke="#f59e0b" stroke-width="4" stroke-opacity="0.75"/>
    <!-- Lane 2 (Center-Left) -->
    <line x1="420" y1="110" x2="385" y2="460" stroke="#f59e0b" stroke-width="4" stroke-opacity="0.75"/>
    <!-- Lane 3 (Center-Right) -->
    <line x1="570" y1="120" x2="540" y2="460" stroke="#f59e0b" stroke-width="4" stroke-opacity="0.75"/>
    <!-- Lane 4 (Right) -->
    <line x1="720" y1="280" x2="705" y2="460" stroke="#f59e0b" stroke-width="4" stroke-opacity="0.75"/>

    <!-- Horizontal Target Bar -->
    <line x1="185" y1="440" x2="880" y2="440" stroke="#fbbf24" stroke-width="5" opacity="0.85" filter="url(#glowLight)"/>

    <!-- Target Rings -->
    <circle cx="462" cy="440" r="28" fill="none" stroke="#fbbf24" stroke-width="6" filter="url(#glowLight)"/>
    <circle cx="622" cy="440" r="28" fill="none" stroke="#fbbf24" stroke-width="6" filter="url(#glowLight)"/>

    <!-- Top Left Note (with electric zig-zag) -->
    <g filter="url(#intenseGlow)">
      <rect x="295" y="140" width="115" height="38" rx="14" fill="url(#goldKeyGrad)" stroke="#ffffff" stroke-width="3"/>
      
      <!-- Electric Zig-Zag Lightning Trail -->
      <path d="M 352 178 
               L 348 240 
               L 362 260 
               L 342 310 
               L 358 335 
               L 338 385 
               L 345 420" 
            fill="none" stroke="#fff4c2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 352 178 
               L 348 240 
               L 362 260 
               L 342 310 
               L 358 335 
               L 338 385 
               L 345 420" 
            fill="none" stroke="#f59e0b" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>

      <!-- Lower Hit Note on Left Lane -->
      <rect x="225" y="420" width="155" height="42" rx="14" fill="url(#goldKeyGrad)" stroke="#ffffff" stroke-width="4"/>
    </g>

    <!-- Top Center Note -->
    <g filter="url(#glowLight)">
      <rect x="430" y="86" width="130" height="38" rx="12" fill="url(#goldKeyGrad)" stroke="#fff" stroke-width="3"/>
      <rect x="420" y="210" width="150" height="42" rx="14" fill="url(#goldKeyGrad)" stroke="#fff" stroke-width="3"/>
    </g>

    <!-- Mid Right Note -->
    <g filter="url(#glowLight)">
      <rect x="590" y="305" width="150" height="42" rx="14" fill="url(#goldKeyGrad)" stroke="#fff" stroke-width="3"/>
    </g>
  </g>

  <!-- ============================================== -->
  <!-- 3D PIANO KEYBOARD -->
  <!-- ============================================== -->
  <g id="keyboard3D" filter="url(#shadow3D)">
    <!-- White Keys Base Platform -->
    <rect x="130" y="475" width="764" height="150" rx="12" fill="#1e1a17"/>

    <!-- 7 Rendered 3D White Keys -->
    <!-- Key 1 -->
    <g>
      <rect x="135" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="137" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>
    <!-- Key 2 -->
    <g>
      <rect x="242" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="244" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>
    <!-- Key 3 -->
    <g>
      <rect x="349" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="351" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>
    <!-- Key 4 -->
    <g>
      <rect x="456" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="458" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>
    <!-- Key 5 -->
    <g>
      <rect x="563" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="565" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>
    <!-- Key 6 -->
    <g>
      <rect x="670" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="672" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>
    <!-- Key 7 -->
    <g>
      <rect x="777" y="480" width="98" height="140" rx="10" fill="url(#whiteKeyGrad)" stroke="#8f8373" stroke-width="2"/>
      <rect x="779" y="605" width="94" height="12" rx="5" fill="#a89a87"/>
    </g>

    <!-- 3D Black Keys -->
    <!-- Black Key 1 -->
    <rect x="205" y="475" width="56" height="85" rx="6" fill="url(#blackKeyGrad)" stroke="#443e4d" stroke-width="1.5"/>
    <rect x="210" y="550" width="46" height="8" rx="2" fill="#110f14"/>

    <!-- Black Key 2 -->
    <rect x="312" y="475" width="56" height="85" rx="6" fill="url(#blackKeyGrad)" stroke="#443e4d" stroke-width="1.5"/>
    <rect x="317" y="550" width="46" height="8" rx="2" fill="#110f14"/>

    <!-- Black Key 3 -->
    <rect x="526" y="475" width="56" height="85" rx="6" fill="url(#blackKeyGrad)" stroke="#443e4d" stroke-width="1.5"/>
    <rect x="531" y="550" width="46" height="8" rx="2" fill="#110f14"/>

    <!-- Black Key 4 -->
    <rect x="633" y="475" width="56" height="85" rx="6" fill="url(#blackKeyGrad)" stroke="#443e4d" stroke-width="1.5"/>
    <rect x="638" y="550" width="46" height="8" rx="2" fill="#110f14"/>

    <!-- Black Key 5 -->
    <rect x="740" y="475" width="56" height="85" rx="6" fill="url(#blackKeyGrad)" stroke="#443e4d" stroke-width="1.5"/>
    <rect x="745" y="550" width="46" height="8" rx="2" fill="#110f14"/>
  </g>

  <!-- ============================================== -->
  <!-- 3D EMBOSSED "PIANO" METALLIC GOLD TYPOGRAPHY -->
  <!-- ============================================== -->
  <g id="pianoTextGroup">
    <!-- 3D Extrusion Depth Shadows -->
    <g fill="url(#textSideGrad)">
      <!-- Depth layers for P -->
      <text x="165" y="784" font-family="'Outfit', 'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="168" letter-spacing="4">PIANO</text>
      <text x="165" y="780" font-family="'Outfit', 'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="168" letter-spacing="4">PIANO</text>
      <text x="165" y="776" font-family="'Outfit', 'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="168" letter-spacing="4">PIANO</text>
      <text x="165" y="772" font-family="'Outfit', 'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="168" letter-spacing="4">PIANO</text>
    </g>

    <!-- Dark Outlines around letters -->
    <text x="165" y="768" font-family="'Outfit', 'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="168" letter-spacing="4" fill="#000000" stroke="#000000" stroke-width="14" stroke-linejoin="round">PIANO</text>

    <!-- Front Beveled Metallic Face -->
    <text x="165" y="768" font-family="'Outfit', 'Montserrat', 'Arial Black', sans-serif" font-weight="900" font-size="168" letter-spacing="4" fill="url(#text3DGrad)" stroke="#ffffff" stroke-width="3.5" stroke-linejoin="round">PIANO</text>
  </g>

  <!-- ============================================== -->
  <!-- GLOWING CURSIVE "Community" SCRIPT -->
  <!-- ============================================== -->
  <g id="communityScriptGroup" filter="url(#intenseGlow)">
    <!-- Shadow for Script -->
    <text x="260" y="890" font-family="'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive" font-style="italic" font-weight="bold" font-size="140" fill="#000000" stroke="#000000" stroke-width="12">Community</text>
    
    <!-- Outer Glow Stroke -->
    <text x="260" y="890" font-family="'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive" font-style="italic" font-weight="bold" font-size="140" fill="none" stroke="#f59e0b" stroke-width="10">Community</text>
    
    <!-- Crisp Golden Core -->
    <text x="260" y="890" font-family="'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive" font-style="italic" font-weight="bold" font-size="140" fill="#ffffff" stroke="#fff4c2" stroke-width="3">Community</text>
  </g>
</svg>
`;

async function generateAllAssets() {
  console.log('[Logo Generator] Writing logo.svg...');
  const staticDir = path.join(__dirname, '..', 'app', 'static');
  const androidAssetsDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'www');
  
  const svgPath = path.join(staticDir, 'logo.svg');
  const appSvgPath = path.join(staticDir, 'app_logo.svg');
  fs.writeFileSync(svgPath, svgContent.trim());
  fs.writeFileSync(appSvgPath, svgContent.trim());

  const svgBuffer = Buffer.from(svgContent);

  // Generate PNGs for web static
  const sizes = [
    { name: 'logo.png', size: 512 },
    { name: 'app_logo.png', size: 512 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon.png', size: 256 },
    { name: 'favicon.png', size: 96 },
    { name: 'preview.png', size: 600 }
  ];

  for (const item of sizes) {
    const outPath = path.join(staticDir, item.name);
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png({ quality: 95 })
      .toFile(outPath);
    console.log(`[Logo Generator] Generated ${item.name} (${item.size}x${item.size})`);

    // Copy to android assets if exists
    if (fs.existsSync(androidAssetsDir)) {
      const androidOutPath = path.join(androidAssetsDir, item.name);
      fs.copyFileSync(outPath, androidOutPath);
    }
  }

  console.log('[Logo Generator] All assets successfully generated!');
}

generateAllAssets().catch(err => {
  console.error('[Logo Generator] Error:', err);
  process.exit(1);
});
