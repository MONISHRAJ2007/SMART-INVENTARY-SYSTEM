import cv2
import numpy as np

def segment_shelf_products(img):
    h, w, _ = img.shape
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detect shelf area: products are located between y=15% and y=85%
    y_min, y_max = int(h * 0.15), int(h * 0.85)
    shelf_roi = gray[y_min:y_max, :]

    # Edge detection
    edges = cv2.Canny(shelf_roi, 30, 100)
    
    # Dilate vertically to connect text and packaging parts within the same product
    kernel_vert = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 45))
    dilated = cv2.dilate(edges, kernel_vert, iterations=2)
    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    closed = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, kernel_close)

    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    raw_boxes = []
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        if bw > 30 and bh > 60:
            raw_boxes.append({"x": x, "y": y + y_min, "width": bw, "height": bh})

    # Sort left to right
    raw_boxes.sort(key=lambda b: b["x"])

    # Merge boxes that horizontally overlap or are very close (same product column)
    merged = []
    for b in raw_boxes:
        if not merged:
            merged.append(b)
        else:
            prev = merged[-1]
            # Check overlap or proximity
            if b["x"] < prev["x"] + prev["width"] * 0.7:
                # Merge into previous box
                new_x = min(prev["x"], b["x"])
                new_y = min(prev["y"], b["y"])
                new_w = max(prev["x"] + prev["width"], b["x"] + b["width"]) - new_x
                new_h = max(prev["y"] + prev["height"], b["y"] + b["height"]) - new_y
                merged[-1] = {"x": new_x, "y": new_y, "width": new_w, "height": new_h}
            else:
                merged.append(b)

    return merged

img = cv2.imread('static/samples/shelf_yellow_oil_with_mismatch.jpg')
products = segment_shelf_products(img)
print("Products segmented:", len(products))
for idx, p in enumerate(products):
    crop = img[p['y']:p['y']+p['height'], p['x']:p['x']+p['width']]
    b_m, g_m, r_m = crop.mean(axis=(0,1))
    print(f"Product #{idx+1} at x={p['x']}, w={p['width']}, h={p['height']} -> BGR=({b_m:.1f}, {g_m:.1f}, {r_m:.1f})")
