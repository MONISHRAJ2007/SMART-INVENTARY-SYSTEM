import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_sample_shelves(output_dir="static/samples"):
    os.makedirs(output_dir, exist_ok=True)
    
    width = 900
    height = 550

    def draw_shelf_background(draw, shelf_label):
        # Store shelf rack background
        # Wall / background
        draw.rectangle([0, 0, width, height], fill="#1e293b")
        # Metal shelf back panel with vertical slats
        for x in range(0, width, 60):
            draw.line([(x, 0), (x, height)], fill="#334155", width=2)
        # Shelf ledge 1 (top support)
        draw.rectangle([0, 80, width, 100], fill="#475569")
        draw.line([(0, 100), (width, 100)], fill="#64748b", width=3)
        # Shelf main rack base (bottom)
        draw.rectangle([0, 420, width, 480], fill="#334155")
        draw.rectangle([0, 480, width, height], fill="#1e293b")
        draw.line([(0, 420), (width, 420)], fill="#94a3b8", width=4)
        
        # Shelf barcode / label strip on edge of shelf
        draw.rectangle([30, 430, 220, 465], fill="#f8fafc")
        draw.rectangle([32, 432, 218, 463], outline="#0f172a", width=1)
        # Draw shelf sign
        draw.text((45, 435), f"ZONE: {shelf_label}", fill="#0f172a")
        
        # Shelf barcode lines on strip
        for bx in range(160, 210, 4):
            draw.line([(bx, 436), (bx, 460)], fill="#000000", width=2)

    def draw_tea_powder_box(draw, x, y, w, h, slot_num):
        # Packaged Tea Powder - Green pouch / box with gold & white leaf graphics
        # Box shadow
        draw.rectangle([x+4, y+6, x+w+4, y+h+6], fill="#0f172a")
        # Main box body - rich emerald/forest green
        draw.rectangle([x, y, x+w, y+h], fill="#047857", outline="#065f46", width=2)
        # Top banner (gold strip)
        draw.rectangle([x, y, x+w, y+28], fill="#d97706")
        draw.text((x+8, y+6), "PREMIUM FMCG", fill="#ffffff")
        # Center badge
        draw.rounded_rectangle([x+8, y+36, x+w-8, y+h-40], radius=8, fill="#064e3b", outline="#10b981")
        draw.text((x+12, y+48), "TEA POWDER", fill="#fef08a")
        draw.text((x+18, y+68), "250g Net", fill="#a7f3d0")
        draw.text((x+10, y+92), "Organic Ceylon", fill="#ecfdf5")
        # Stylized tea leaves pattern
        draw.ellipse([x+w//2-18, y+h-75, x+w//2+18, y+h-45], fill="#10b981", outline="#34d399")
        # Barcode at bottom of packet
        draw.rectangle([x+10, y+h-30, x+w-10, y+h-8], fill="#ffffff")
        for bx in range(x+14, x+w-14, 4):
            draw.line([(bx, y+h-28), (bx, y+h-10)], fill="#000000", width=2)

    def draw_book(draw, x, y, w, h, title="DATA STRUCTURES", author="Dr. Kumar", color="#1d4ed8"):
        # Book object with spine, title, paper edges
        draw.rectangle([x+5, y+5, x+w+5, y+h+5], fill="#0f172a")
        # Main book cover
        draw.rectangle([x, y, x+w, y+h], fill=color, outline="#1e3a8a", width=3)
        # Spine strip
        draw.rectangle([x, y, x+16, y+h], fill="#172554")
        # Book pages edge
        draw.rectangle([x+w-12, y+4, x+w, y+h-4], fill="#fef08a", outline="#cbd5e1")
        for py in range(y+8, y+h-8, 6):
            draw.line([(x+w-10, py), (x+w-2, py)], fill="#94a3b8", width=1)
        # Book cover text
        draw.rectangle([x+24, y+30, x+w-20, y+90], fill="#ffffff")
        draw.text((x+28, y+36), "ACADEMIC", fill="#1e3a8a")
        draw.text((x+28, y+54), "TEXTBOOK", fill="#dc2626")
        draw.text((x+28, y+70), title[:12], fill="#0f172a")
        
        draw.text((x+24, y+110), "VOL. 2", fill="#ffffff")
        draw.text((x+24, y+135), author, fill="#93c5fd")
        draw.text((x+24, y+h-50), "ISBN: 9789360", fill="#cbd5e1")
        # Barcode
        draw.rectangle([x+24, y+h-32, x+w-20, y+h-12], fill="#ffffff")
        for bx in range(x+28, x+w-24, 4):
            draw.line([(bx, y+h-30), (bx, y+h-14)], fill="#000000", width=2)

    def draw_soda_can(draw, x, y, w, h):
        # Misplaced beverage item (e.g. Cola can)
        draw.rectangle([x+4, y+6, x+w+4, y+h+6], fill="#0f172a")
        # Red can
        draw.rounded_rectangle([x, y, x+w, y+h], radius=14, fill="#b91c1c", outline="#991b1b", width=2)
        # Silver rim top
        draw.rectangle([x+4, y, x+w-4, y+16], fill="#e2e8f0")
        # Silver rim bottom
        draw.rectangle([x+4, y+h-14, x+w-4, y+h], fill="#cbd5e1")
        # White packaging stripes (no brand words)
        draw.rectangle([x+10, y+50, x+w-10, y+54], fill="#ffffff")
        draw.rectangle([x+15, y+75, x+w-15, y+78], fill="#ffffff")

    # ==========================================
    # 1. Shelf A Clean: All 3 slots have 'tea powder'
    # ==========================================
    img1 = Image.new("RGB", (width, height))
    d1 = ImageDraw.Draw(img1)
    draw_shelf_background(d1, "SHELF A (TEA POWDER)")
    draw_tea_powder_box(d1, 80, 200, 160, 220, 1)
    draw_tea_powder_box(d1, 360, 200, 160, 220, 2)
    draw_tea_powder_box(d1, 640, 200, 160, 220, 3)
    img1.save(os.path.join(output_dir, "shelf_a_clean.jpg"), quality=95)

    # ==========================================
    # 2. Shelf A with MISPLACED BOOK in Slot 2!
    # (Customer took textbook from Shelf B and dumped it on Shelf A)
    # ==========================================
    img2 = Image.new("RGB", (width, height))
    d2 = ImageDraw.Draw(img2)
    draw_shelf_background(d2, "SHELF A (TEA POWDER)")
    # Slot 1: Tea powder (Correct)
    draw_tea_powder_box(d2, 80, 200, 160, 220, 1)
    # Slot 2: MISPLACED BOOK! (Wrong Product!)
    draw_book(d2, 360, 180, 160, 240, title="DATA STRUCT", author="Dr. Kumar", color="#1e40af")
    # Slot 3: Tea powder (Correct)
    draw_tea_powder_box(d2, 640, 200, 160, 220, 3)
    img2.save(os.path.join(output_dir, "shelf_a_with_misplaced_book.jpg"), quality=95)

    # ==========================================
    # 3. Shelf B Clean: All slots have 'books'
    # ==========================================
    img3 = Image.new("RGB", (width, height))
    d3 = ImageDraw.Draw(img3)
    draw_shelf_background(d3, "SHELF B (BOOKS)")
    draw_book(d3, 80, 180, 160, 240, title="PHYSICS II", author="H. Resnick", color="#7c3aed")
    draw_book(d3, 360, 180, 160, 240, title="CALCULUS", author="J. Stewart", color="#1e40af")
    draw_book(d3, 640, 180, 160, 240, title="ALGORITHMS", author="Cormen", color="#0f766e")
    img3.save(os.path.join(output_dir, "shelf_b_clean.jpg"), quality=95)

    # ==========================================
    # 4. Shelf B with MISPLACED TEA POWDER in Slot 1!
    # (Customer took tea powder from Shelf A and left it on Shelf B)
    # ==========================================
    img4 = Image.new("RGB", (width, height))
    d4 = ImageDraw.Draw(img4)
    draw_shelf_background(d4, "SHELF B (BOOKS)")
    # Slot 1: MISPLACED TEA POWDER! (Wrong Product!)
    draw_tea_powder_box(d4, 80, 200, 160, 220, 1)
    # Slot 2: Books (Correct)
    draw_book(d4, 360, 180, 160, 240, title="CALCULUS", author="J. Stewart", color="#1e40af")
    # Slot 3: Books (Correct)
    draw_book(d4, 640, 180, 160, 240, title="ALGORITHMS", author="Cormen", color="#0f766e")
    img4.save(os.path.join(output_dir, "shelf_b_with_misplaced_tea.jpg"), quality=95)

    # ==========================================
    # 5. Shelf A with Foreign Item (Cola Can in Slot 3)
    # ==========================================
    img5 = Image.new("RGB", (width, height))
    d5 = ImageDraw.Draw(img5)
    draw_shelf_background(d5, "SHELF A (TEA POWDER)")
    draw_tea_powder_box(d5, 80, 200, 160, 220, 1)
    draw_tea_powder_box(d5, 360, 200, 160, 220, 2)
    # Slot 3: Soda Can (Unassigned / Wrong item)
    draw_soda_can(d5, 660, 230, 120, 190)
    img5.save(os.path.join(output_dir, "shelf_a_with_foreign_item.jpg"), quality=95)

    print("Sample shelf images successfully generated in:", output_dir)

if __name__ == "__main__":
    create_sample_shelves()
