import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_fonts():
    """Carga fuentes del sistema con jerarquía de respaldo segura."""
    fonts_dir = r"C:\Windows\Fonts"
    
    def try_font(names, size, default="arial.ttf"):
        for name in names:
            p = os.path.join(fonts_dir, name)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    pass
        return ImageFont.truetype(os.path.join(fonts_dir, default), size)

    return {
        "title_lg": try_font(["bahnschrift.ttf", "segoeuib.ttf", "arialbd.ttf"], 54),
        "title_port": try_font(["bahnschrift.ttf", "segoeuib.ttf", "arialbd.ttf"], 60),
        "sub_land": try_font(["segoeui.ttf", "arial.ttf"], 23),
        "sub_port": try_font(["segoeui.ttf", "arial.ttf"], 27),
        "badge_land": try_font(["segoeuib.ttf", "arialbd.ttf"], 18),
        "badge_port": try_font(["segoeuib.ttf", "arialbd.ttf"], 20),
        "card_title": try_font(["segoeuib.ttf", "arialbd.ttf"], 19),
        "card_desc": try_font(["segoeui.ttf", "arial.ttf"], 16),
        "footer": try_font(["segoeuib.ttf", "arialbd.ttf"], 17),
        "chip_port": try_font(["segoeuib.ttf", "arialbd.ttf"], 19)
    }

def create_rounded_mask(size, radius, supersample=4):
    """Genera máscara redondeada ultra suave con antialiasing."""
    w, h = size
    sw, sh = w * supersample, h * supersample
    srad = radius * supersample
    mask = Image.new("L", (sw, sh), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (sw - 1, sh - 1)], radius=srad, fill=255)
    return mask.resize((w, h), Image.Resampling.LANCZOS)

def create_ambient_bg(raw_img, cw, ch, primary_glow, secondary_glow):
    """Crea fondo ambient neón oscuro basado en la propia captura."""
    canvas = Image.new("RGBA", (cw, ch), (8, 6, 14, 255))
    scale = max(cw / raw_img.width, ch / raw_img.height)
    bw, bh = int(raw_img.width * scale), int(raw_img.height * scale)
    bg = raw_img.resize((bw, bh), Image.Resampling.LANCZOS)
    cx = (bw - cw) // 2
    cy = (bh - ch) // 2
    bg = bg.crop((cx, cy, cx + cw, cy + ch))
    bg = bg.filter(ImageFilter.GaussianBlur(55))
    darken = Image.new("RGBA", (cw, ch), (6, 4, 12, 205))
    bg = Image.alpha_composite(bg, darken)
    canvas.paste(bg, (0, 0))

    # Glows neón
    glow = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    if cw > ch: # Landscape
        gdraw.ellipse([(cw - 650, 60), (cw + 100, ch - 40)], fill=(*primary_glow[:3], 55))
        gdraw.ellipse([(80, 80), (750, 600)], fill=(*secondary_glow[:3], 35))
    else: # Portrait
        gdraw.ellipse([(-100, ch//3), (cw + 100, ch - 200)], fill=(*primary_glow[:3], 48))
        gdraw.ellipse([(100, 100), (cw - 100, 700)], fill=(*secondary_glow[:3], 36))

    glow = glow.filter(ImageFilter.GaussianBlur(85))
    return Image.alpha_composite(canvas, glow)

def create_phone_mockup(raw_img, phone_h, radius=32, bezel=9):
    """Crea mockup de teléfono flotante con bisel metálico titanio y reflejos."""
    aspect = raw_img.width / raw_img.height
    phone_w = int(phone_h * aspect)
    sw, sh = phone_w - bezel * 2, phone_h - bezel * 2

    # Pantalla redondeada
    screen_resized = raw_img.resize((sw, sh), Image.Resampling.LANCZOS)
    smask = create_rounded_mask((sw, sh), radius - 8)
    screen_round = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    screen_round.paste(screen_resized, (0, 0), mask=smask)

    # Chasis exterior
    frame = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(frame)
    fdraw.rounded_rectangle(
        [(0, 0), (phone_w - 1, phone_h - 1)],
        radius=radius,
        fill=(20, 18, 28, 255),
        outline=(95, 85, 125, 230),
        width=3
    )
    frame.paste(screen_round, (bezel, bezel), mask=smask)

    # Borde de luz superior sutil
    fdraw.line([(radius, 1), (phone_w - radius, 1)], fill=(200, 215, 255, 140), width=2)

    # Sombra paralela profunda
    spad = 50
    shadow = Image.new("RGBA", (phone_w + spad * 2, phone_h + spad * 2), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rounded_rectangle(
        [(spad, spad + 14), (spad + phone_w, spad + phone_h + 14)],
        radius=radius,
        fill=(0, 0, 0, 220)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(32))

    return frame, shadow, phone_w, phone_h, spad

def draw_pill_badge(draw_layer, xy, text, font, accent_color):
    """Dibuja un badge tipo píldora de cristal con punto brillante."""
    x, y = xy
    bbox = font.getbbox(text)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pw, ph = bw + 42, bh + 18

    badge = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(badge)
    r, g, b = accent_color[:3]
    bdraw.rounded_rectangle(
        [(0, 0), (pw - 1, ph - 1)],
        radius=ph // 2,
        fill=(r, g, b, 45),
        outline=(r, g, b, 210),
        width=2
    )
    # Punto brillante
    bdraw.ellipse([(14, ph // 2 - 4), (22, ph // 2 + 4)], fill=(r, g, b, 255))
    bdraw.text((28, (ph - bh) // 2 - bbox[1]), text, font=font, fill=(255, 255, 255, 255))
    draw_layer.alpha_composite(badge, (x, y))
    return pw, ph

def generate_landscape_screenshot(data, fonts, logo_img, out_path):
    """Genera captura apaisada panorámica 16:9 (1600x900) para itch.io."""
    cw, ch = 1600, 900
    raw = Image.open(data["raw_path"]).convert("RGBA")
    canvas = create_ambient_bg(raw, cw, ch, data["primary_color"], data["secondary_color"])

    lx = 90
    # 1. Pill Badge
    b_text = data["badge"]
    draw_pill_badge(canvas, (lx, 85), b_text, fonts["badge_land"], data["primary_color"])

    # 2. Títulos
    tdraw = ImageDraw.Draw(canvas)
    t1 = data["title_1"]
    t2 = data["title_2"]
    tdraw.text((lx, 155), t1, font=fonts["title_lg"], fill=(255, 255, 255, 255))
    tdraw.text((lx, 225), t2, font=fonts["title_lg"], fill=data["primary_color"])

    # 3. Subtítulo
    sub = data["subtitle"]
    tdraw.text((lx, 320), sub, font=fonts["sub_land"], fill=(210, 215, 235, 240), spacing=8)

    # 4. Tres tarjetas de características
    card_y = 430
    for title, desc in data["cards"]:
        cw_card, ch_card = 730, 70
        card = Image.new("RGBA", (cw_card, ch_card), (0, 0, 0, 0))
        cdraw = ImageDraw.Draw(card)
        cdraw.rounded_rectangle(
            [(0, 0), (cw_card - 1, ch_card - 1)],
            radius=14,
            fill=(18, 15, 26, 175),
            outline=(60, 52, 85, 190),
            width=1
        )
        # Punto neón temático
        cdraw.ellipse([(18, 18), (28, 28)], fill=data["primary_color"])
        cdraw.text((42, 12), title, font=fonts["card_title"], fill=(255, 255, 255, 255))
        cdraw.text((42, 38), desc, font=fonts["card_desc"], fill=(170, 175, 195, 220))
        canvas.alpha_composite(card, (lx, card_y))
        card_y += 84

    # 5. Logo y marca en el pie
    if logo_img:
        logo_sm = logo_img.resize((56, 56), Image.Resampling.LANCZOS)
        canvas.alpha_composite(logo_sm, (lx, 735))
        tdraw.text((lx + 70, 750), "PIANO COMMUNITY  •  THE ULTIMATE RHYTHM PLATFORM", font=fonts["footer"], fill=(140, 145, 170, 210))

    # 6. Mockup del móvil en el lateral derecho
    phone_h = 760
    frame, shadow, pw, ph, spad = create_phone_mockup(raw, phone_h)
    px = cw - pw - 90
    py = (ch - ph) // 2
    canvas.alpha_composite(shadow, (px - spad, py - spad))
    canvas.alpha_composite(frame, (px, py))

    # Guardar
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.convert("RGB").save(out_path, quality=95, optimize=True)
    print(f"  [OK] Creada captura panorámica: {out_path}")

def generate_portrait_screenshot(data, fonts, out_path):
    """Genera captura vertical estilo póster tienda / móvil (1080x1920)."""
    cw, ch = 1080, 1920
    raw = Image.open(data["raw_path"]).convert("RGBA")
    canvas = create_ambient_bg(raw, cw, ch, data["primary_color"], data["secondary_color"])

    # 1. Pill Badge centrado
    b_text = data["badge"]
    bbox = fonts["badge_port"].getbbox(b_text)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pw_badge = bw + 44
    px_badge = (cw - pw_badge) // 2
    draw_pill_badge(canvas, (px_badge, 85), b_text, fonts["badge_port"], data["primary_color"])

    # 2. Títulos centrados
    tdraw = ImageDraw.Draw(canvas)
    t1 = data["title_1"]
    t2 = data["title_2"]
    bb1 = fonts["title_port"].getbbox(t1)
    bb2 = fonts["title_port"].getbbox(t2)
    w1 = bb1[2] - bb1[0]
    w2 = bb2[2] - bb2[0]
    tdraw.text(((cw - w1) // 2, 160), t1, font=fonts["title_port"], fill=(255, 255, 255, 255))
    tdraw.text(((cw - w2) // 2, 235), t2, font=fonts["title_port"], fill=data["primary_color"])

    # 3. Subtítulo centrado
    sub_lines = data["subtitle_port"]
    sub_y = 330
    for sline in sub_lines:
        sbb = fonts["sub_port"].getbbox(sline)
        sw = sbb[2] - sbb[0]
        tdraw.text(((cw - sw) // 2, sub_y), sline, font=fonts["sub_port"], fill=(210, 215, 235, 240))
        sub_y += 38

    # 4. Fila de Chips/Pills temáticos centrados
    chips = data["chips_port"]
    chip_w_list = []
    for c in chips:
        cbb = fonts["chip_port"].getbbox(c)
        chip_w_list.append(cbb[2] - cbb[0] + 34)
    total_w = sum(chip_w_list) + (len(chips) - 1) * 14
    start_cx = (cw - total_w) // 2

    chip_y = 425
    for idx, c in enumerate(chips):
        cur_w = chip_w_list[idx]
        card = Image.new("RGBA", (cur_w, 38), (0, 0, 0, 0))
        cdraw = ImageDraw.Draw(card)
        cdraw.rounded_rectangle([(0, 0), (cur_w - 1, 37)], radius=19, fill=(24, 20, 34, 190), outline=(75, 65, 100, 180), width=1)
        cdraw.ellipse([(12, 15), (18, 21)], fill=data["primary_color"])
        cdraw.text((24, 7), c, font=fonts["chip_port"], fill=(230, 235, 250, 240))
        canvas.alpha_composite(card, (start_cx, chip_y))
        start_cx += cur_w + 14

    # 5. Mockup de teléfono vertical grande
    phone_h = 1330
    frame, shadow, pw, ph, spad = create_phone_mockup(raw, phone_h, radius=38, bezel=11)
    px = (cw - pw) // 2
    py = 505
    canvas.alpha_composite(shadow, (px - spad, py - spad))
    canvas.alpha_composite(frame, (px, py))

    # Guardar
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.convert("RGB").save(out_path, quality=95, optimize=True)
    print(f"  [OK] Creada captura vertical: {out_path}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_dir = os.path.join(base_dir, "assets", "screenshots_raw")
    logo_path = os.path.join(base_dir, "app", "static", "logo.png")
    logo_img = Image.open(logo_path).convert("RGBA") if os.path.exists(logo_path) else None

    fonts = get_fonts()

    screenshots_data = [
        {
            "id": "1_yt_playlists",
            "raw_path": os.path.join(raw_dir, "1_yt_playlists_raw.png"),
            "badge": "YOUTUBE SYNC  •  ZERO SETUP",
            "title_1": "IMPORT YOUR",
            "title_2": "YOUTUBE PLAYLISTS",
            "primary_color": (255, 45, 95, 255), # Crimson YouTube neón
            "secondary_color": (0, 220, 255, 255),
            "subtitle": "Paste any YouTube playlist or video link to stream and play instantly.\nMillions of songs turned into rhythm stages automatically.",
            "subtitle_port": [
                "Paste any YouTube playlist or video link to play instantly.",
                "Millions of songs turned into rhythm stages automatically."
            ],
            "cards": [
                ("1-Click Playlist Import", "Paste your favorite URL and watch your library populate in real time."),
                ("Direct Audio Streaming", "No manual file conversions needed — stream high-quality audio on the fly."),
                ("Custom Speed & Controls", "Fine-tune tempo, speed multipliers and lane difficulty to your style.")
            ],
            "chips_port": ["1-Click Import", "Direct Audio Stream", "Infinite Library"]
        },
        {
            "id": "2_editor",
            "raw_path": os.path.join(raw_dir, "2_editor_raw.png"),
            "badge": "BUILT-IN STUDIO SUITE  •  PRO CHARTING",
            "title_1": "CREATE YOUR OWN",
            "title_2": "CUSTOM BEATMAPS",
            "primary_color": (255, 184, 0, 255), # Cyber Amber / Gold neón
            "secondary_color": (0, 240, 255, 255),
            "subtitle": "Craft precision rhythm charts with an intuitive drag-and-drop timeline.\nAdd hold tracks, swipe triggers, and sync directly to any audio.",
            "subtitle_port": [
                "Craft precision rhythm charts with an intuitive editor timeline.",
                "Place hold notes, swipe triggers, and sync to any audio track."
            ],
            "cards": [
                ("Precision Snap Grid", "1/4, 1/8, 1/16 snapping with real-time audio waveform alignment."),
                ("Holds, Taps & Swipes", "Place complex rhythm patterns, sustained hold sliders, and multi-lane notes."),
                ("Publish & Share Instantly", "Test-play in real time and share your beatmaps with the global community.")
            ],
            "chips_port": ["Precision Snap Grid", "Holds & Swipes", "Instant Live Preview"]
        },
        {
            "id": "3_infinite_tracks",
            "raw_path": os.path.join(raw_dir, "3_infinite_tracks_raw.png"),
            "badge": "OSU! & CLONE HERO ENGINE  •  HUGE LIBRARY",
            "title_1": "(ALMOST) INFINITE",
            "title_2": "COMMUNITY TRACKS",
            "primary_color": (176, 38, 255, 255), # Violeta eléctrico
            "secondary_color": (0, 229, 255, 255),
            "subtitle": "Explore thousands of legendary community charts from osu! and Clone Hero.\nSearch by song, filter by difficulty, and push your reaction speed.",
            "subtitle_port": [
                "Explore thousands of legendary charts from osu! & Clone Hero.",
                "Search songs, filter difficulty, and push your reaction speed."
            ],
            "cards": [
                ("Native osu! & CH Support", "Play classic .osu beatmaps and Clone Hero charts with zero friction."),
                ("Tiered Difficulty Ratings", "From 1-Star chill warmups to 8-Star+ challenges."),
                ("Speed Mods & Multipliers", "Practice tricky song sections from 0.5x up to 2.0x hyperspeed.")
            ],
            "chips_port": ["osu! & Clone Hero", "All Difficulty Tiers", "Speed 0.5x - 2.0x"]
        },
        {
            "id": "4_custom_effects",
            "raw_path": os.path.join(raw_dir, "4_custom_effects_raw.png"),
            "badge": "NEXT-GEN RHYTHM ACTION  •  HYPER VISUALS",
            "title_1": "ELECTRIFYING",
            "title_2": "CUSTOM EFFECTS",
            "primary_color": (0, 240, 255, 255), # Cian láser neón
            "secondary_color": (255, 0, 128, 255),
            "subtitle": "Feel every beat with explosive neon lightning, dynamic lane particles,\nreactive score feedback, and interchangeable visual stage skins.",
            "subtitle_port": [
                "Feel every beat with explosive lightning & dynamic lane particles.",
                "Ultra-fluid 60+ FPS feedback and interchangeable stage skins."
            ],
            "cards": [
                ("Reactive Lightning & Bursts", "Laser-sharp electric arcs and particle fireworks on Perfect+ hits."),
                ("Unlockable Stage Skins", "Customize lane textures with Fire, Turbo, Shield, and Retro cyber themes."),
                ("Ultra-Fluid 60+ FPS", "Silky smooth audio-visual latency compensation for perfect timing.")
            ],
            "chips_port": ["Reactive Lightning", "Particle Bursts", "Custom Stage Skins"]
        }
    ]

    out_base = os.path.join(base_dir, "screenshots")
    out_land = os.path.join(out_base, "landscape")
    out_port = os.path.join(out_base, "portrait")

    print("[*] Generando capturas elegantes de alta definición...")
    for item in screenshots_data:
        print(f"\n--- Procesando: {item['id']} ---")
        # 1. Landscape 1600x900 (itch.io desktop / galería)
        p_land = os.path.join(out_land, f"{item['id']}.png")
        generate_landscape_screenshot(item, fonts, logo_img, p_land)

        # 2. Portrait 1080x1920 (móvil / app store / póster)
        p_port = os.path.join(out_port, f"{item['id']}.png")
        generate_portrait_screenshot(item, fonts, p_port)

        # 3. Guardar también directamente en screenshots/ la versión panorámica principal
        p_main = os.path.join(out_base, f"{item['id']}.png")
        generate_landscape_screenshot(item, fonts, logo_img, p_main)

    print("\n[OK] Todas las capturas se han generado exitosamente en 'screenshots/'!")

if __name__ == "__main__":
    main()
