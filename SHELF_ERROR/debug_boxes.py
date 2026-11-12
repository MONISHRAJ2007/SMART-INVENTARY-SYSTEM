import cv2
from color_shelf_detector import color_detector

img = cv2.imread('static/samples/shelf_yellow_oil_with_mismatch.jpg')
boxes = color_detector.segment_shelf_items(img)
print("Boxes found:", len(boxes))
for idx, b in enumerate(boxes):
    crop = img[b['y']:b['y']+b['height'], b['x']:b['x']+b['width']]
    b_mean, g_mean, r_mean = crop.mean(axis=(0,1))
    print("Box", idx, "x:", b["x"], "w:", b["width"], "h:", b["height"], "BGR:", (round(b_mean, 1), round(g_mean, 1), round(r_mean, 1)))
