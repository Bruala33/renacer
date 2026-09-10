import os
from PIL import Image, ImageFilter, ImageDraw

def create_rounded_mask(size, radius, supersample=4):
    """Crea una máscara de esquinas redondeadas con antialiasing de alta calidad."""
    w, h = size
    sw, sh = w * supersample, h * supersample
    sradius = radius * supersample
    mask = Image.new("L", (sw, sh), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (sw - 1, sh - 1)], radius=sradius, fill=255)
    return mask.resize((w, h), Image.Resampling.LANCZOS)

def create_rounded_border(size, radius, border_width=2, border_color=(255, 255, 255, 160), supersample=4):
    """Crea un borde brillante sutil para la tarjeta con esquinas redondeadas."""
    w, h = size
    sw, sh = w * supersample, h * supersample
    sradius = radius * supersample
    sbw = border_width * supersample
    border_img = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(border_img)
    draw.rounded_rectangle([(0, 0), (sw - 1, sh - 1)], radius=sradius, outline=border_color, width=sbw)
    return border_img.resize((w, h), Image.Resampling.LANCZOS)

def create_drop_shadow(size, radius, offset=(4, 12), blur=24, shadow_color=(0, 0, 0, 200)):
    """Genera una sombra paralela difuminada y suave."""
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

def create_radial_glow(size, color=(0, 229, 255, 110), blur=50):
    """Genera un resplandor o brillo tenue circular/elíptico difuminado."""
    w, h = size
    pad = blur * 2
    canvas_w = w + pad * 2
    canvas_h = h + pad * 2
    glow_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow_img)
    draw.ellipse([(pad, pad), (pad + w - 1, pad + h - 1)], fill=color)
    return glow_img.filter(ImageFilter.GaussianBlur(blur)), pad

def generate_cover():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Localizar imágenes fuente
    preview_candidates = [
        os.path.join(base_dir, "preview.png"),
        os.path.join(base_dir, "app", "static", "preview.png")
    ]
    logo_candidates = [
        os.path.join(base_dir, "logo.png"),
        os.path.join(base_dir, "app", "static", "logo.png")
    ]

    preview_path = next((p for p in preview_candidates if os.path.exists(p)), None)
    logo_path = next((p for p in logo_candidates if os.path.exists(p)), None)

    if not preview_path or not logo_path:
        raise FileNotFoundError(f"No se encontraron preview.png ({preview_path}) o logo.png ({logo_path})")

    print(f"[*] preview.png: {preview_path}")
    print(f"[*] logo.png: {logo_path}")

    canvas_w, canvas_h = 630, 500
    target_cover = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 255))

    # --- 1. FONDO AMBIENTE NEÓN ---
    # preview.png ampliado a todo el tamaño con aspecto 'cover'
    preview_raw = Image.open(preview_path).convert("RGBA")
    pw, ph = preview_raw.size

    scale_bg = max(canvas_w / pw, canvas_h / ph)
    bg_w, bg_h = int(pw * scale_bg), int(ph * scale_bg)
    bg_resized = preview_raw.resize((bg_w, bg_h), Image.Resampling.LANCZOS)

    # Centrar y recortar a 630x500
    crop_x = (bg_w - canvas_w) // 2
    crop_y = int((bg_h - canvas_h) * 0.45) # Enfoque hacia la parte superior/media de la pista
    bg_cropped = bg_resized.crop((crop_x, crop_y, crop_x + canvas_w, crop_y + canvas_h))

    # Desenfoque gaussiano fuerte
    bg_blurred = bg_cropped.filter(ImageFilter.GaussianBlur(radius=28))

    # Capa oscura semitransparente para dar ambiente neón sin distraer
    dark_overlay = Image.new("RGBA", (canvas_w, canvas_h), (8, 6, 18, 155))
    bg_composed = Image.alpha_composite(bg_blurred, dark_overlay)

    # Vignette o viñeteado en los bordes para mayor profundidad
    vignette = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    vdraw.rectangle([(0, 0), (canvas_w, canvas_h)], fill=(4, 2, 10, 70))
    bg_composed = Image.alpha_composite(bg_composed, vignette)

    target_cover.paste(bg_composed, (0, 0))

    # --- 2. DERECHA: PREVIEW ESCALADO VERTICAL (430px de alto) ---
    phone_h = 430
    phone_w = int(pw * (phone_h / ph)) # ~194px
    phone_img = preview_raw.resize((phone_w, phone_h), Image.Resampling.LANCZOS)

    # Esquinas redondeadas (radio 20px)
    corner_radius = 20
    mask = create_rounded_mask((phone_w, phone_h), corner_radius)
    phone_rounded = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
    phone_rounded.paste(phone_img, (0, 0), mask=mask)

    # Borde sutil brillante
    border = create_rounded_border((phone_w, phone_h), corner_radius, border_width=2, border_color=(200, 235, 255, 150))
    phone_rounded = Image.alpha_composite(phone_rounded, border)

    # Posición derecha: margen de unos 45px
    phone_x = canvas_w - phone_w - 45 # ~391
    phone_y = (canvas_h - phone_h) // 2 # 35

    # Sombra paralela para el preview
    shadow_img, pad = create_drop_shadow((phone_w, phone_h), corner_radius, offset=(0, 12), blur=26, shadow_color=(0, 0, 0, 220))
    target_cover.alpha_composite(shadow_img, (phone_x - pad, phone_y - pad))

    # Pegar preview encima de la sombra
    target_cover.alpha_composite(phone_rounded, (phone_x, phone_y))

    # --- 3. IZQUIERDA: LOGO CON BRILLO TENUE ---
    logo_raw = Image.open(logo_path).convert("RGBA")
    lw, lh = logo_raw.size
    target_logo_w = 270
    target_logo_h = int(lh * (target_logo_w / lw))
    logo_resized = logo_raw.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)

    # Centrado verticalmente y centrado en el área izquierda disponible
    available_left_w = phone_x
    logo_x = max(20, (available_left_w - target_logo_w) // 2)
    logo_y = (canvas_h - target_logo_h) // 2

    # Brillo tenue debajo del logo (doble capa: resplandor cian suave + resplandor magenta/violeta neón)
    glow_cyan, cpad = create_radial_glow((target_logo_w + 30, target_logo_h + 30), color=(0, 210, 255, 95), blur=40)
    glow_pink, ppad = create_radial_glow((target_logo_w + 10, target_logo_h + 10), color=(240, 30, 140, 65), blur=30)

    target_cover.alpha_composite(glow_cyan, (logo_x - 15 - cpad, logo_y - 15 - cpad))
    target_cover.alpha_composite(glow_pink, (logo_x - 5 - ppad, logo_y - 5 - ppad))

    # Pegar logo centrado
    target_cover.alpha_composite(logo_resized, (logo_x, logo_y))

    # --- 4. GUARDAR RESULTADO ---
    final_output = target_cover.convert("RGB") # PNG estándar 24-bit de alta fidelidad
    out_path = os.path.join(base_dir, "cover.png")
    final_output.save(out_path, format="PNG", optimize=True)
    print(f"[OK] Portada guardada exitosamente en: {out_path}")
    print(f"     Dimensiones: {final_output.size[0]}x{final_output.size[1]} px")

    # Copiar también a dist_itch si existe para facilidad
    dist_cover = os.path.join(base_dir, "dist_itch", "cover.png")
    if os.path.exists(os.path.dirname(dist_cover)):
        final_output.save(dist_cover, format="PNG", optimize=True)
        print(f"[OK] Copia adicional guardada en dist_itch/cover.png")

if __name__ == "__main__":
    generate_cover()
