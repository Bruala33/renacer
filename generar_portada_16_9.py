import os
import math
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageEnhance

def create_rounded_mask(size, radius, supersample=4):
    w, h = size
    sw, sh = w * supersample, h * supersample
    sradius = radius * supersample
    mask = Image.new("L", (sw, sh), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (sw - 1, sh - 1)], radius=sradius, fill=255)
    return mask.resize((w, h), Image.Resampling.LANCZOS)

def create_rounded_border(size, radius, border_width=3, border_color=(255, 255, 255, 180), supersample=4):
    w, h = size
    sw, sh = w * supersample, h * supersample
    sradius = radius * supersample
    sbw = border_width * supersample
    border_img = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(border_img)
    draw.rounded_rectangle([(0, 0), (sw - 1, sh - 1)], radius=sradius, outline=border_color, width=sbw)
    return border_img.resize((w, h), Image.Resampling.LANCZOS)

def create_drop_shadow(size, radius, offset=(0, 24), blur=45, shadow_color=(0, 0, 0, 240)):
    w, h = size
    pad = blur * 2
    canvas_w = w + pad * 2
    canvas_h = h + pad * 2
    shadow_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow_img)
    x0 = pad + offset[0]
    y0 = pad + offset[1]
    draw.rounded_rectangle([(x0, y0), (x0 + w - 1, y0 + h - 1)], radius=radius, fill=shadow_color)
    return shadow_img.filter(ImageFilter.GaussianBlur(blur)), pad

def create_radial_glow(size, color=(0, 240, 255, 120), blur=60):
    w, h = size
    pad = blur * 2
    canvas_w = w + pad * 2
    canvas_h = h + pad * 2
    glow_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow_img)
    draw.ellipse([(pad, pad), (pad + w - 1, pad + h - 1)], fill=color)
    return glow_img.filter(ImageFilter.GaussianBlur(blur)), pad

def draw_pill_note(width, height, color=(0, 242, 254), border_color=(255, 255, 255), glow_radius=16, has_tail=False, tail_h=120):
    """Dibuja una nota rítmica de píldora idéntica al juego con opción de estela de pulsación sostenida."""
    pad = glow_radius * 2 + 10
    total_w = width + pad * 2
    total_h = height + (tail_h if has_tail else 0) + pad * 2
    img = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    r = height // 2
    note_top_y = pad + (tail_h if has_tail else 0)

    # Estela de pulsación (hold note)
    if has_tail:
        tail_w = int(width * 0.82)
        tx = pad + (width - tail_w) // 2
        for ty in range(tail_h):
            prog = ty / tail_h
            alp = int(25 + 95 * prog)
            draw.line([(tx, pad + ty), (tx + tail_w, pad + ty)], fill=(color[0], color[1], color[2], alp), width=1)
        draw.line([(tx, pad), (tx + tail_w, pad)], fill=(255, 255, 255, 160), width=2)

    # Resplandor exterior
    glow_layer = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow_layer)
    gdraw.rounded_rectangle([(pad - 5, note_top_y - 5), (pad + width + 4, note_top_y + height + 4)], radius=r + 5, fill=(color[0], color[1], color[2], 190))
    glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))
    img.alpha_composite(glow_blurred)

    # Cuerpo principal de la nota
    draw.rounded_rectangle([(pad, note_top_y), (pad + width - 1, note_top_y + height - 1)], radius=r, fill=(color[0], color[1], color[2], 250), outline=border_color, width=2)
    # Reflejo interior brillante
    draw.rounded_rectangle([(pad + 5, note_top_y + 3), (pad + width - 6, note_top_y + height // 2)], radius=r // 2, fill=(255, 255, 255, 175))

    return img, pad

def generate_perfect_cover_16_9():
    target_w, target_h = 1920, 1080
    base_dir = r"c:\Users\popey\Downloads\Beatstar_limpio\renacer"
    preview_path = os.path.join(base_dir, "app", "static", "preview.png")
    logo_path = os.path.join(base_dir, "app", "static", "logo.png")

    preview_raw = Image.open(preview_path).convert("RGBA")
    pw, ph = preview_raw.size

    # --- 1. FONDO AMBIENTE MODERNO Y ELEGANTE (Sin IA, 100% representativo del juego) ---
    canvas = Image.new("RGBA", (target_w, target_h), (6, 4, 12, 255))
    draw = ImageDraw.Draw(canvas)

    # Gradiente vertical suave
    for y in range(target_h):
        prog = y / target_h
        r = int(5 + 8 * prog)
        g = int(4 + 6 * prog)
        b = int(11 + 18 * prog)
        draw.line([(0, y), (target_w, y)], fill=(r, g, b, 255))

    # Resplandores ambientales envolventes
    glow_logo_amb, lpad = create_radial_glow((1150, 950), color=(190, 0, 120, 45), blur=150)
    canvas.alpha_composite(glow_logo_amb, (-120 - lpad, 40 - lpad))

    glow_game_amb, rpad = create_radial_glow((1200, 1000), color=(0, 205, 255, 52), blur=160)
    canvas.alpha_composite(glow_game_amb, (target_w - 1050 - rpad, target_h - 920 - rpad))

    glow_hold_amb, hpad = create_radial_glow((650, 520), color=(0, 255, 160, 38), blur=115)
    canvas.alpha_composite(glow_hold_amb, (target_w - 680 - hpad, target_h - 520 - hpad))

    # --- 2. NOTAS RÍTMICAS FLOTANTES DISPUESTAS ARMONIOSAMENTE ---
    notes_layer = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))

    # Nota 1: Fondo desenfocado suave (arriba izquierda)
    n1, n1_p = draw_pill_note(130, 30, color=(0, 242, 254), glow_radius=16)
    notes_layer.alpha_composite(n1.filter(ImageFilter.GaussianBlur(radius=6)), (130 - n1_p, 180 - n1_p))

    # Nota 2: Nota magenta sutil en la zona central alta
    n2, n2_p = draw_pill_note(115, 26, color=(255, 0, 130), glow_radius=14)
    notes_layer.alpha_composite(n2.filter(ImageFilter.GaussianBlur(radius=4)), (980 - n2_p, 130 - n2_p))

    # Nota 3: Nota cian nítida en el espacio central
    n3, n3_p = draw_pill_note(150, 36, color=(0, 242, 254), glow_radius=16)
    notes_layer.alpha_composite(n3, (1130 - n3_p, 340 - n3_p))

    # Nota 4: Nota esmeralda con estela sostenida en la parte baja
    n4, n4_p = draw_pill_note(125, 30, color=(0, 255, 160), glow_radius=15, has_tail=True, tail_h=95)
    notes_layer.alpha_composite(n4, (1020 - n4_p, 640 - n4_p))

    # Nota 5: Nota magenta nítida abajo a la izquierda
    n5, n5_p = draw_pill_note(120, 28, color=(255, 0, 140), glow_radius=14)
    notes_layer.alpha_composite(n5, (160 - n5_p, 800 - n5_p))

    canvas.alpha_composite(notes_layer)

    # Destellos de notas / partículas sutiles de ritmo
    particles = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(particles)
    sparkles = [
        (1050, 280, 3, (0, 242, 254, 180)),
        (1160, 420, 4, (0, 242, 254, 220)),
        (1240, 360, 3, (255, 255, 255, 210)),
        (1000, 620, 3, (0, 255, 160, 190)),
        (1140, 750, 4, (0, 255, 160, 220)),
        (220, 760, 3, (255, 0, 140, 180)),
        (280, 840, 4, (255, 0, 140, 200)),
        (190, 230, 3, (0, 242, 254, 160)),
    ]
    for sx, sy, sr, scol in sparkles:
        pdraw.ellipse([(sx - sr, sy - sr), (sx + sr, sy + sr)], fill=scol)
    p_glow = particles.filter(ImageFilter.GaussianBlur(radius=4))
    canvas.alpha_composite(p_glow)
    canvas.alpha_composite(particles)

    # Línea de onda de audio sutil en la base
    wave_layer = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    wdraw = ImageDraw.Draw(wave_layer)
    wave_y = int(target_h * 0.90)
    for x in range(0, target_w, 4):
        freq = math.sin(x * 0.012) * math.cos(x * 0.004)
        amp = int(math.pow(abs(freq), 1.4) * 22)
        alp = int(22 + 32 * abs(freq))
        wdraw.line([(x, wave_y - amp), (x, wave_y + amp)], fill=(0, 242, 254, alp), width=2)
    wave_glow = wave_layer.filter(ImageFilter.GaussianBlur(radius=5))
    canvas.alpha_composite(wave_glow)
    canvas.alpha_composite(wave_layer)

    # --- 3. DERECHA: TELÉFONO MOCKUP ELEGANTE CON GAMEPLAY ---
    phone_h = 840
    phone_w = int(pw * (phone_h / ph)) # ~378px
    phone_img = preview_raw.resize((phone_w, phone_h), Image.Resampling.LANCZOS)

    corner_r = 40
    mask = create_rounded_mask((phone_w, phone_h), corner_r)
    phone_screen = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    phone_screen.paste(phone_img, (0, 0), mask=mask)

    # Bisel metálico y borde sutil
    border_cyan = create_rounded_border((phone_w, phone_h), corner_r, border_width=3, border_color=(0, 242, 254, 210))
    border_inner = create_rounded_border((phone_w, phone_h), corner_r, border_width=1, border_color=(255, 255, 255, 140))
    phone_screen = Image.alpha_composite(phone_screen, border_cyan)
    phone_screen = Image.alpha_composite(phone_screen, border_inner)

    # Notch superior
    notch_w, notch_h = 70, 7
    notch = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    ndraw = ImageDraw.Draw(notch)
    nx0 = (phone_w - notch_w) // 2
    ndraw.rounded_rectangle([(nx0, 12), (nx0 + notch_w, 12 + notch_h)], radius=notch_h // 2, fill=(255, 255, 255, 65))
    phone_screen = Image.alpha_composite(phone_screen, notch)

    # Reflejo diagonal de cristal templado
    glass = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    gldraw = ImageDraw.Draw(glass)
    gldraw.polygon([(0, 0), (phone_w, 0), (phone_w, int(phone_h * 0.28)), (0, int(phone_h * 0.44))], fill=(255, 255, 255, 22))
    phone_screen = Image.alpha_composite(phone_screen, glass)

    # Posición derecha
    phone_x = target_w - phone_w - 150
    phone_y = (target_h - phone_h) // 2

    # Aura neón trasera del teléfono
    glow_phone_c, cpad = create_radial_glow((phone_w + 140, phone_h + 140), color=(0, 242, 254, 90), blur=75)
    glow_phone_p, ppad = create_radial_glow((phone_w + 90, phone_h + 90), color=(255, 0, 128, 65), blur=55)
    canvas.alpha_composite(glow_phone_c, (phone_x - 70 - cpad, phone_y - 70 - cpad))
    canvas.alpha_composite(glow_phone_p, (phone_x - 45 - ppad, phone_y - 45 - ppad))

    # Sombra suave y realista del teléfono
    shadow_img, spad = create_drop_shadow((phone_w, phone_h), corner_r, offset=(18, 30), blur=50, shadow_color=(0, 0, 0, 245))
    canvas.alpha_composite(shadow_img, (phone_x - spad, phone_y - spad))

    # Pegar teléfono
    canvas.alpha_composite(phone_screen, (phone_x, phone_y))

    # --- 4. IZQUIERDA: LOGO OFICIAL AMPLIO CON RESPLANDOR NEÓN ---
    left_area_w = phone_x
    logo_raw = Image.open(logo_path).convert("RGBA")
    lw, lh = logo_raw.size
    logo_w = 460
    logo_h = int(lh * (logo_w / lw))
    logo_resized = logo_raw.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

    logo_x = (left_area_w - logo_w) // 2
    logo_y = (target_h - logo_h) // 2 - 50

    # Doble resplandor neón idéntico al de cover.png (cian suave + magenta vibrante)
    glow_logo_cyan, lcpad = create_radial_glow((logo_w + 100, logo_h + 100), color=(0, 210, 255, 120), blur=60)
    glow_logo_pink, lppad = create_radial_glow((logo_w + 50, logo_h + 50), color=(240, 30, 140, 90), blur=45)
    canvas.alpha_composite(glow_logo_cyan, (logo_x - 50 - lcpad, logo_y - 50 - lcpad))
    canvas.alpha_composite(glow_logo_pink, (logo_x - 25 - lppad, logo_y - 25 - lppad))

    # Pegar logo oficial
    canvas.alpha_composite(logo_resized, (logo_x, logo_y))

    # --- 5. TIPOGRAFÍA ELEGANTE Y LIMPIA DEBAJO DEL LOGO ---
    fdraw = ImageDraw.Draw(canvas)
    font_sub = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 26)
    font_details = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", 18)

    # Subtítulo prémium
    sub_text = "RHYTHM GAME REIMAGINED"
    sb = fdraw.textbbox((0, 0), sub_text, font=font_sub)
    sw, sh = sb[2] - sb[0], sb[3] - sb[1]
    sub_x = logo_x + (logo_w - sw) // 2
    sub_y = logo_y + logo_h + 36

    for dx in range(-3, 4):
        for dy in range(-3, 4):
            fdraw.text((sub_x + dx, sub_y + dy), sub_text, font=font_sub, fill=(2, 1, 6, 230))
    fdraw.text((sub_x, sub_y), sub_text, font=font_sub, fill=(255, 255, 255, 250))

    # Línea divisoria cian brillante con degradado suave
    line_w = 360
    line_x = logo_x + (logo_w - line_w) // 2
    line_y = sub_y + sh + 20
    for lx in range(line_w):
        prog = lx / line_w
        alpha = int(math.sin(prog * math.pi) * 220)
        fdraw.line([(line_x + lx, line_y), (line_x + lx, line_y)], fill=(0, 242, 254, alpha), width=2)

    # Características clave auténticas del juego
    det_text = "COMMUNITY CHARTS   •   YOUTUBE IMPORT   •   0ms LATENCY"
    db = fdraw.textbbox((0, 0), det_text, font=font_details)
    dw, dh = db[2] - db[0], db[3] - db[1]
    det_x = logo_x + (logo_w - dw) // 2
    det_y = line_y + 22

    for dx in range(-2, 3):
        for dy in range(-2, 3):
            fdraw.text((det_x + dx, det_y + dy), det_text, font=font_details, fill=(2, 1, 6, 220))
    fdraw.text((det_x, det_y), det_text, font=font_details, fill=(0, 242, 254, 235))

    # Viñeteado cinematográfico envolvente en los bordes
    vignette = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    for y in range(160):
        alp = int((1.0 - y / 160) * 180)
        vdraw.line([(0, y), (target_w, y)], fill=(3, 2, 7, alp))
        vdraw.line([(0, target_h - 1 - y), (target_w, target_h - 1 - y)], fill=(3, 2, 7, alp))
    for x in range(160):
        alp = int((1.0 - x / 160) * 160)
        vdraw.line([(x, 0), (x, target_h)], fill=(3, 2, 7, alp))
        vdraw.line([(target_w - 1 - x, 0), (target_w - 1 - x, target_h)], fill=(3, 2, 7, alp))
    canvas.alpha_composite(vignette)

    # --- 6. GUARDAR RESULTADO MASTER ---
    final_output = canvas.convert("RGB")
    out_master = os.path.join(base_dir, "cover_16_9.png")
    final_output.save(out_master, format="PNG", quality=95)
    print(f"[OK] Perfected 16:9 cinematic cover saved to: {out_master}")

    # Copiar a app/static y dist_itch
    for d in ["app/static", "dist_itch"]:
        dp = os.path.join(base_dir, d, "cover_16_9.png")
        if os.path.exists(os.path.dirname(dp)):
            final_output.save(dp, format="PNG", quality=95)
            print(f"[OK] Copied to: {dp}")

    # Copiar a artefactos para visualización
    art_path = r"C:\Users\popey\.gemini\antigravity\brain\9dacf7bc-d014-47b4-94b3-f4276fc4ad85\cover_16_9.png"
    final_output.save(art_path, format="PNG", quality=95)

if __name__ == "__main__":
    generate_perfect_cover_16_9()
