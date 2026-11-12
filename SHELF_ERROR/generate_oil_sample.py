import os
from PIL import Image, ImageDraw, ImageFont

def create_oil_shelf():
    os.makedirs("static/samples", exist_ok=True)
    w, h = 900, 550

    def draw_shelf_back(draw):
        draw.rectangle([0, 0, w, h], fill="#334155")
        for x in range(0, w, 50):
            draw.line([(x, 0), (x, h)], fill="#475569", width=2)
        # White shelf metal bars
        draw.rectangle([0, 100, w, 120], fill="#e2e8f0")
        draw.rectangle([0, 420, w, 460], fill="#cbd5e1")
        draw.rectangle([20, 430, 200, 455], fill="#ef4444")
        draw.text((30, 435), "COOKING OIL SECTION", fill="#ffffff")

    def draw_yellow_oil_pouch(draw, x, y, width=130, height=240, label="Bimoli"):
        # Bright Yellow / Golden cooking oil pouch
        draw.rectangle([x+4, y+6, x+width+4, y+height+6], fill="#1e293b")
        # Pouch body
        draw.rounded_rectangle([x, y, x+width, y+height], radius=16, fill="#eab308", outline="#ca8a04", width=3)
        # Golden oil gradient simulation
        draw.rounded_rectangle([x+8, y+35, x+width-8, y+height-40], radius=10, fill="#facc15", outline="#d97706")
        # Top banner red text
        draw.text((x+25, y+10), label, fill="#dc2626")
        draw.text((x+20, y+50), "Minyak Goreng", fill="#854d0e")
        draw.text((x+30, y+75), "Pouch 2L", fill="#713f12")
        draw.ellipse([x+width//2-25, y+height-95, x+width//2+25, y+height-55], fill="#f59e0b")
        # Price tag / barcode at bottom
        draw.rectangle([x+15, y+height-30, x+width-15, y+height-10], fill="#ffffff")
        for bx in range(x+20, x+width-20, 4):
            draw.line([(bx, y+height-28), (bx, y+height-12)], fill="#000000", width=2)
    def draw_blue_misplaced_box(draw, x, y, width=130, height=240):
        # Clean misplaced blue product packaging (no brand/detergent words)
        draw.rectangle([x+4, y+6, x+width+4, y+height+6], fill="#1e293b")
        draw.rectangle([x, y, x+width, y+height], fill="#2563eb", outline="#1d4ed8", width=3)
        draw.rounded_rectangle([x+10, y+20, x+width-10, y+80], radius=6, outline="#ffffff", width=2)
        draw.rounded_rectangle([x+10, y+95, x+width-10, y+160], radius=6, outline="#60a5fa", width=1)
        draw.rectangle([x+15, y+height-30, x+width-15, y+height-10], fill="#ffffff")
        for bx in range(x+20, x+width-20, 4):
            draw.line([(bx, y+height-28), (bx, y+height-12)], fill="#000000", width=2)

    # 1. Clean Yellow Oil Shelf (All 5 pouches are yellow Bimoli)
    img_clean = Image.new("RGB", (w, h))
    d_clean = ImageDraw.Draw(img_clean)
    draw_shelf_back(d_clean)
    positions = [40, 210, 380, 550, 720]
    for pos in positions:
        draw_yellow_oil_pouch(d_clean, pos, 180)
    img_clean.save("static/samples/shelf_yellow_oil_clean.jpg", quality=95)

    # 2. Mismatched Oil Shelf (Position 3 has a blue detergent box left by customer)
    img_mis = Image.new("RGB", (w, h))
    d_mis = ImageDraw.Draw(img_mis)
    draw_shelf_back(d_mis)
    for idx, pos in enumerate(positions):
        if idx == 2:
            # Customer left a blue detergent box on the yellow oil shelf!
            draw_blue_misplaced_box(d_mis, pos, 180)
        else:
            draw_yellow_oil_pouch(d_mis, pos, 180)
    img_mis.save("static/samples/shelf_yellow_oil_with_mismatch.jpg", quality=95)

    print("Yellow oil shelf test images generated successfully!")

if __name__ == "__main__":
    create_oil_shelf()
