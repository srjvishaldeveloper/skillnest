from PIL import Image

def generate_hd_leaf():
    img = Image.open("public/skillnest.png").convert("RGBA")
    h = img.height

    # Exact emblem is in columns 0 to 67
    left_part = img.crop((0, 0, 67, h))
    leaf_bbox = left_part.getbbox()

    if leaf_bbox:
        leaf = left_part.crop(leaf_bbox)
        lw, lh = leaf.size

        # Create 512x512 high resolution square canvas
        canvas_size = 512
        # Padding factor
        target_h = int(canvas_size * 0.85)
        aspect = lw / float(lh)
        target_w = int(target_h * aspect)

        hd_leaf = leaf.resize((target_w, target_h), Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        offset_x = (canvas_size - target_w) // 2
        offset_y = (canvas_size - target_h) // 2
        canvas.paste(hd_leaf, (offset_x, offset_y), hd_leaf)

        canvas.save("public/leaf.png", "PNG")
        print("Ultra-HD 512x512 leaf.png generated successfully!")

if __name__ == "__main__":
    generate_hd_leaf()
