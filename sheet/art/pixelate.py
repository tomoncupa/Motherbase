# CHARACTER SHEET's sprite engine, prototype. Not a build step: run by hand.
#   py -3 sheet/art/pixelate.py
# Keys out the white background, drops the sword into the knight's near hand,
# shrinks to 96px tall, cuts to 32 colours, adds a 1px dark outline, and writes
# knight96.png (base alone, then base with sword) at 4x beside this file.
from PIL import Image, ImageEnhance, ImageFilter
import math, os

HERE = os.path.dirname(os.path.abspath(__file__))
HEIGHT, COLORS = 96, 32
HAND = (168, 562)        # the knight's near gauntlet, in knight-base.png pixels
SWORD_LEN = 0.55         # sword length as a share of the knight's height
GRIP = (0.80, 0.16)      # grip point as a share of the sword's cropped box

def keyed(path):
    im = Image.open(path).convert("RGB")
    px = im.load()
    a = Image.new("L", im.size, 0); ap = a.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b = px[x, y]
            if (255 - r) + (255 - g) + (255 - b) > 45:
                ap[x, y] = 255
    rgba = im.convert("RGBA"); rgba.putalpha(a.filter(ImageFilter.MedianFilter(3)))
    return rgba

def pixelate(img, H=HEIGHT, colors=COLORS):
    img = img.crop(img.getbbox())
    W = round(img.size[0] * H / img.size[1])
    rgb = Image.new("RGB", img.size, (255, 255, 255)); rgb.paste(img, (0, 0), img)
    small = rgb.resize((W, H), Image.LANCZOS)
    small = ImageEnhance.Color(ImageEnhance.Contrast(small).enhance(1.15)).enhance(1.2)
    mask = img.split()[3].resize((W, H), Image.BOX).point(lambda v: 255 if v > 110 else 0)
    q = small.quantize(colors=colors, method=Image.MAXCOVERAGE, dither=Image.NONE).convert("RGB")
    pad = 2
    out = Image.new("RGBA", (W + pad * 2, H + pad * 2), (0, 0, 0, 0))
    op, qp, mp = out.load(), q.load(), mask.load()
    for y in range(H):
        for x in range(W):
            if mp[x, y]:
                op[x + pad, y + pad] = qp[x, y] + (255,)
    o2 = out.copy(); p2 = o2.load()
    for y in range(out.size[1]):
        for x in range(out.size[0]):
            if op[x, y][3] == 0 and any(0 <= x+a < out.size[0] and 0 <= y+c < out.size[1] and op[x+a, y+c][3] for a, c in ((1,0),(-1,0),(0,1),(0,-1))):
                p2[x, y] = (16, 14, 20, 255)
    return o2

knight = keyed(os.path.join(HERE, "knight-base.png"))
sword = keyed(os.path.join(HERE, "sword.png"))
kb = knight.getbbox(); kh = kb[3] - kb[1]
sw = sword.crop(sword.getbbox())
s = SWORD_LEN * kh / math.hypot(*sw.size)
sw = sw.resize((round(sw.size[0] * s), round(sw.size[1] * s)), Image.LANCZOS)
comp = Image.new("RGBA", knight.size, (0, 0, 0, 0))
comp.paste(sw, (round(HAND[0] - GRIP[0] * sw.size[0]), round(HAND[1] - GRIP[1] * sw.size[1])), sw)
comp = Image.alpha_composite(comp, knight)   # sword behind, so the gauntlet covers the grip

Z, gap = 4, 30
imgs = [p.resize((p.size[0] * Z, p.size[1] * Z), Image.NEAREST) for p in (pixelate(knight), pixelate(comp))]
sheet = Image.new("RGB", (sum(i.size[0] for i in imgs) + gap * 3, max(i.size[1] for i in imgs) + gap * 2), (14, 20, 29))
x = gap
for i in imgs:
    sheet.paste(i, (x, sheet.size[1] - gap - i.size[1]), i); x += i.size[0] + gap
sheet.save(os.path.join(HERE, "knight96.png"))
