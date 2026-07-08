from PIL import Image

def crop_exact_leaf():
    img = Image.open("public/skillnest.png").convert("RGBA")
    h = img.height

    # Exact leaf emblem is in columns 0 to 67
    left_part = img.crop((0, 0, 67, h))
    leaf_bbox = left_part.getbbox()
    print("Exact Leaf BBox:", leaf_bbox)

    if leaf_bbox:
        leaf = left_part.crop(leaf_bbox)
        lw, lh = leaf.size

        # Create a square canvas with subtle padding
        max_dim = max(lw, lh) + 12
        square_img = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))

        # Center the exact leaf emblem
        offset_x = (max_dim - lw) // 2
        offset_y = (max_dim - lh) // 2
        square_img.paste(leaf, (offset_x, offset_y), leaf)

        # Resize to standard icon dimensions
        icon_32 = square_img.resize((32, 32), Image.Resampling.LANCZOS)
        icon_64 = square_img.resize((64, 64), Image.Resampling.LANCZOS)
        icon_128 = square_img.resize((128, 128), Image.Resampling.LANCZOS)

        # Overwrite all icon files
        icon_64.save("src/app/icon.png", "PNG")
        icon_64.save("public/icon.png", "PNG")
        icon_128.save("src/app/apple-icon.png", "PNG")
        icon_32.save("src/app/favicon.ico", "ICO")
        icon_32.save("public/favicon.ico", "ICO")

        print("Precision crop complete! Saved exact left leaf emblem as icons.")

if __name__ == "__main__":
    crop_exact_leaf()
