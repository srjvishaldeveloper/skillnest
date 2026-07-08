import math
from PIL import Image, ImageDraw

def create_leaf_icon():
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded dark background circle/box
    bg_color = (4, 19, 13, 255) # Deep emerald dark #04130D
    draw.rounded_rectangle([8, 8, size-8, size-8], radius=48, fill=bg_color)

    # Draw vibrant double leaf / single leaf
    # We draw vibrant emerald & lime gradients
    center_x, center_y = size // 2, size // 2 + 10

    # Draw primary leaf shape
    points = []
    # Leaf tip at top (128, 40), bottom at (128, 200)
    for t in range(101):
        p = t / 100.0
        # Right curve
        x = 128 + math.sin(p * math.pi) * 70
        y = 40 + p * 160
        points.append((x, y))

    for t in range(100, -1, -1):
        p = t / 100.0
        # Left curve
        x = 128 - math.sin(p * math.pi) * 70
        y = 40 + p * 160
        points.append((x, y))

    # Fill leaf with vibrant lime/emerald color (#2EE6A6 / #C5F82A)
    draw.polygon(points, fill=(46, 230, 166, 255))

    # Inner highlights / vein details
    # Center stem line
    draw.line([(128, 50), (128, 195)], fill=(4, 19, 13, 220), width=8)

    # Side veins
    draw.line([(128, 90), (165, 70)], fill=(4, 19, 13, 200), width=6)
    draw.line([(128, 120), (90, 100)], fill=(4, 19, 13, 200), width=6)
    draw.line([(128, 150), (165, 130)], fill=(4, 19, 13, 200), width=6)

    # Resize to standard sizes and save
    img_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
    img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)

    img_64.save("src/app/icon.png", "PNG")
    img_64.save("public/icon.png", "PNG")
    img_32.save("src/app/favicon.ico", "ICO")
    img_32.save("public/favicon.ico", "ICO")
    print("Leaf icons created successfully!")

if __name__ == "__main__":
    create_leaf_icon()
