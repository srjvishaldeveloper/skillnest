from PIL import Image

def upscale_logo():
    img = Image.open("public/skillnest.png").convert("RGBA")
    w, h = img.size
    # 4x upscale for crisp 4K/Retina displays
    new_w, new_h = w * 4, h * 4
    hd_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    hd_img.save("public/skillnest.png", "PNG")
    print(f"skillnest.png upscaled to high resolution ({new_w}x{new_h})!")

if __name__ == "__main__":
    upscale_logo()
