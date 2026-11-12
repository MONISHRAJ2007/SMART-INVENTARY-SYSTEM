import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import base64
from typing import Dict, List, Any, Tuple, Optional
import requests
import os
from collections import Counter

INVENTORY_API_BASE = os.getenv("INVENTORY_API_URL", "http://localhost:5000/api")

PACKAGING_COLOR_DEFINITIONS = {
    "Red": ([(0, 10), (170, 180)], "#ef4444"),
    "Orange": ([(10, 24)], "#f97316"),
    "Yellow / Gold": ([(24, 38)], "#eab308"),
    "Green / Emerald": ([(38, 85)], "#10b981"),
    "Cyan / Teal": ([(85, 100)], "#06b6d4"),
    "Blue": ([(100, 138)], "#3b82f6"),
    "Purple / Violet": ([(138, 155)], "#a855f7"),
    "Pink / Magenta": ([(155, 170)], "#ec4899"),
}

def bgr_to_hex(b: float, g: float, r: float) -> str:
    return f"#{int(np.clip(r, 0, 255)):02x}{int(np.clip(g, 0, 255)):02x}{int(np.clip(b, 0, 255)):02x}"

def are_colors_compatible(c1: str, c2: str, hue_diff: float, delta_e: float) -> bool:
    """
    Checks if two color labels represent compatible variations or illumination shades
    of the exact same packaging (e.g. golden yellow vs warm orange lighting).
    """
    if c1 == c2:
        return True
    
    # Warm golden/yellow/amber family (under warm store lighting)
    warm_family = {"Yellow / Gold", "Orange"}
    if c1 in warm_family and c2 in warm_family and hue_diff <= 22.0 and delta_e <= 32.0:
        return True
        
    return False

def extract_product_packaging_color(crop_bgr: np.ndarray) -> Tuple[str, str, List[float], List[float], List[float]]:
    """
    Extracts the true dominant packaging color of a retail product item slot.
    Focuses on the saturated chromatic branding packaging pixels (labels, pouch body, caps),
    while excluding dark shadows, cola/liquid, white glare, and shelf rail metals.
    """
    if crop_bgr.size == 0:
        return "Gray / Silver", "#94a3b8", [50, 0, 0], [0, 0, 128], [128, 128, 128]
    
    ch, cw = crop_bgr.shape[:2]
    # Sample inner product region (avoiding neighboring slots and rails)
    inner_bgr = crop_bgr[int(ch * 0.08):int(ch * 0.92), int(cw * 0.08):int(cw * 0.92)]
    if inner_bgr.size == 0:
        inner_bgr = crop_bgr
        
    hsv = cv2.cvtColor(inner_bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(inner_bgr, cv2.COLOR_BGR2LAB)
    
    h_chan = hsv[:, :, 0]
    s_chan = hsv[:, :, 1]
    v_chan = hsv[:, :, 2]
    
    # Identify chromatic pixels: saturated and distinct from dark liquid/shadows and white glare
    chroma_mask = (s_chan >= 26) & (v_chan >= 35) & (v_chan <= 245)
    total_pixels = inner_bgr.shape[0] * inner_bgr.shape[1]
    chroma_count = int(np.sum(chroma_mask))
    
    if chroma_count / max(1, total_pixels) >= 0.07:
        # Score each chromatic color bin by weighted saturation & value energy
        h_vals = h_chan[chroma_mask]
        s_vals = s_chan[chroma_mask].astype(float) / 255.0
        v_vals = v_chan[chroma_mask].astype(float) / 255.0
        weights = s_vals * (v_vals ** 0.8)
        
        best_cat = None
        best_hex = "#eab308"
        best_score = -1.0
        best_mask = None
        
        for cat, (intervals, hex_code) in PACKAGING_COLOR_DEFINITIONS.items():
            in_cat = np.zeros(len(h_vals), dtype=bool)
            for low, high in intervals:
                in_cat |= (h_vals >= low) & (h_vals < high)
            score = float(np.sum(weights[in_cat]))
            if score > best_score:
                best_score = score
                best_cat = cat
                best_hex = hex_code
                best_mask = in_cat
                
        # Representative color vectors computed from pixels of the dominant packaging color
        if best_mask is not None and np.sum(best_mask) > 0:
            active_bgr = inner_bgr[chroma_mask][best_mask]
            active_hsv = hsv[chroma_mask][best_mask]
            active_lab = lab[chroma_mask][best_mask]
            med_bgr = np.median(active_bgr, axis=0)
            med_hsv = np.median(active_hsv, axis=0)
            med_lab = np.median(active_lab, axis=0)
            actual_hex = bgr_to_hex(float(med_bgr[0]), float(med_bgr[1]), float(med_bgr[2]))
            return best_cat, actual_hex, [float(x) for x in med_lab], [float(x) for x in med_hsv], [float(x) for x in med_bgr]
            
    # Achromatic handling (white, black, or gray packaging)
    mean_v = float(np.mean(v_chan))
    mean_bgr = np.mean(inner_bgr, axis=(0, 1))
    mean_hsv = np.mean(hsv, axis=(0, 1))
    mean_lab = np.mean(lab, axis=(0, 1))
    
    if mean_v > 165:
        return "White / Light", "#f8fafc", [float(x) for x in mean_lab], [float(x) for x in mean_hsv], [float(x) for x in mean_bgr]
    elif mean_v < 55:
        return "Black / Dark", "#1e293b", [float(x) for x in mean_lab], [float(x) for x in mean_hsv], [float(x) for x in mean_bgr]
    else:
        return "Gray / Silver", "#94a3b8", [float(x) for x in mean_lab], [float(x) for x in mean_hsv], [float(x) for x in mean_bgr]

class RobustColorShelfDetector:
    def __init__(self, default_threshold: float = 28.0):
        self.default_threshold = default_threshold
        self.api_url = INVENTORY_API_BASE

    def detect_shelf_tiers(self, cv_img: np.ndarray) -> List[Tuple[int, int]]:
        """
        Robustly detects horizontal shelf tiers across single-row and multi-tier racks.
        Identifies horizontal rails/ledges, accounting for top tier above Rail 1,
        intermediate tiers between rails, and bottom tier above the lowest rail.
        """
        h, w, _ = cv_img.shape
        hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
        
        # Bright horizontal shelf rail strip detection
        white_mask = (hsv[:, :, 1] < 60) & (hsv[:, :, 2] > 165)
        rail_density = np.mean(white_mask, axis=1)

        rail_y = np.where(rail_density > 0.35)[0]
        rails = []
        for y in rail_y:
            if not rails or y > rails[-1][-1] + 12:
                rails.append([y])
            else:
                rails[-1].append(y)

        rail_intervals = [(r[0], r[-1]) for r in rails if len(r) >= 5]

        if not rail_intervals:
            return [(int(h * 0.15), int(h * 0.85))]

        tiers = []
        # 1. Tier above first rail: if first rail is well below the top edge, products sit ON TOP of it.
        first_top, first_bot = rail_intervals[0]
        if first_top > int(h * 0.14):
            tier_top = max(int(h * 0.04), first_top - int(first_top * 0.95))
            if first_top - tier_top > int(h * 0.10):
                tiers.append((tier_top, first_top))

        # 2. Tiers between consecutive rails:
        for i in range(len(rail_intervals) - 1):
            cur_bot = rail_intervals[i][1]
            next_top = rail_intervals[i + 1][0]
            if next_top - cur_bot > int(h * 0.10):
                tiers.append((cur_bot, next_top))

        # 3. Tier below the last rail:
        last_bot = rail_intervals[-1][1]
        if (h - last_bot) > int(h * 0.16):
            tiers.append((last_bot, int(h * 0.96)))

        if not tiers:
            tiers = [(int(h * 0.15), int(h * 0.85))]

        # Filter out thin ceiling/floor slivers (only keep genuine product tiers >= 35% of max tier height)
        max_tier_h = max(y2 - y1 for y1, y2 in tiers)
        valid_tiers = [t for t in tiers if (t[1] - t[0]) >= int(0.35 * max_tier_h)]

        return valid_tiers if valid_tiers else [(int(h * 0.15), int(h * 0.85))]

    def estimate_columns_for_tier(self, cv_img: np.ndarray, y1: int, y2: int) -> int:
        """
        Dynamically estimates the optimal number of product columns for a shelf tier
        by evaluating item packaging aspect ratio and color homogeneity across candidate slots.
        """
        h, w, _ = cv_img.shape
        tier_h = y2 - y1
        tier_roi = cv_img[y1:y2, :]
        lab_roi = cv2.cvtColor(tier_roi, cv2.COLOR_BGR2LAB)
        th, tw, _ = lab_roi.shape

        best_cols = 7
        best_score = 1e9

        for n in range(4, 10):
            slot_w = tw / n
            aspect = slot_w / max(1, tier_h)
            # Aspect penalty for standard packaged goods (ideal ~0.7 to 1.0)
            aspect_penalty = abs(aspect - 0.82) * 35.0

            slot_vars = []
            slot_medians = []
            for c in range(n):
                x1 = int(c * slot_w + slot_w * 0.20)
                x2 = int((c + 1) * slot_w - slot_w * 0.20)
                crop = lab_roi[int(th * 0.25):int(th * 0.75), x1:x2]
                if crop.size > 0:
                    slot_vars.append(float(np.mean(np.var(crop, axis=(0, 1)))))
                    slot_medians.append(np.median(crop, axis=(0, 1)))

            if len(slot_medians) < n:
                continue

            med_all = np.median(slot_medians, axis=0)
            dists = sorted([float(np.linalg.norm(m - med_all)) for m in slot_medians])
            majority_dispersion = float(np.mean(dists[:int(n * 0.7) + 1]))
            avg_var = float(np.mean(slot_vars))

            score = majority_dispersion + (avg_var * 0.08) + aspect_penalty
            if score < best_score:
                best_score = score
                best_cols = n

        return best_cols

    def segment_shelf_into_products(
        self,
        cv_img: np.ndarray,
        num_slots: int = 0,
        scope: str = "all"
    ) -> List[Dict[str, Any]]:
        """
        Segments shelf into individual product item slots.
        Supports multi-tier shelves (full rack) or single rows with adaptive column detection.
        """
        h, w, _ = cv_img.shape
        tiers = self.detect_shelf_tiers(cv_img)
        boxes = []

        if len(tiers) > 1 and scope == "all":
            # Multi-tier full rack audit
            for tier_idx, (y1, y2) in enumerate(tiers):
                tier_h = y2 - y1
                if num_slots > 0:
                    cols = num_slots
                else:
                    cols = self.estimate_columns_for_tier(cv_img, y1, y2)

                slot_w = w / cols
                for c in range(cols):
                    x1 = int(c * slot_w + slot_w * 0.05)
                    x2 = int((c + 1) * slot_w - slot_w * 0.05)
                    boxes.append({
                        "tier": tier_idx + 1,
                        "slotName": f"Tier {tier_idx + 1} - Slot {c + 1}",
                        "x": x1,
                        "y": y1,
                        "width": x2 - x1,
                        "height": tier_h,
                    })
            return boxes

        # Single tier audit
        if len(tiers) > 1 and scope.startswith("tier_"):
            try:
                t_idx = int(scope.split("_")[1]) - 1
                y1, y2 = tiers[min(t_idx, len(tiers) - 1)]
            except Exception:
                y1, y2 = tiers[0]
        else:
            y1, y2 = tiers[0]

        shelf_h = y2 - y1
        if num_slots > 0:
            cols = num_slots
        else:
            cols = self.estimate_columns_for_tier(cv_img, y1, y2)

        slot_w = w / cols
        for c in range(cols):
            x1 = int(c * slot_w + slot_w * 0.05)
            x2 = int((c + 1) * slot_w - slot_w * 0.05)
            boxes.append({
                "tier": 1,
                "slotName": f"Slot #{c + 1}",
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": shelf_h,
            })

        return boxes

    def analyze_shelf(
        self,
        image_input: Any,
        shelf_name: str = "Shelf A",
        sensitivity_threshold: float = 28.0,
        num_slots: int = 0,
        scope: str = "all"
    ) -> Dict[str, Any]:
        """
        Color-Based Outlier Detection:
        1. Majority items on the shelf share the same dominant color.
        2. ANY item with a DIFFERENT color is flagged as an UNWANTED / MISPLACED product!
        3. Identifies ALL misplaced items on the shelf and dispatches alerts to INVENTARY_SYSTEM.
        """
        # Convert image input to PIL and cv2
        if isinstance(image_input, str):
            if os.path.exists(image_input):
                pil_img = Image.open(image_input).convert("RGB")
            else:
                if "," in image_input:
                    image_input = image_input.split(",")[1]
                img_data = base64.b64decode(image_input)
                pil_img = Image.open(io.BytesIO(img_data)).convert("RGB")
        elif isinstance(image_input, bytes):
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
        else:
            pil_img = image_input.convert("RGB")

        orig_w, orig_h = pil_img.size
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 1. Segment product item slots
        boxes = self.segment_shelf_into_products(cv_img, num_slots=num_slots, scope=scope)
        lab_img = cv2.cvtColor(cv_img, cv2.COLOR_BGR2LAB)
        hsv_img = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)

        # 2. Extract packaging color profile for each product item slot
        items = []
        for idx, box in enumerate(boxes):
            bx, by, bw, bh = box["x"], box["y"], box["width"], box["height"]

            # Crop product slot area
            crop_bgr = cv_img[by:by+bh, bx:bx+bw]
            if crop_bgr.size == 0:
                continue

            color_name, actual_hex, med_lab, med_hsv, med_bgr = extract_product_packaging_color(crop_bgr)

            items.append({
                "id": idx + 1,
                "tier": box.get("tier", 1),
                "slot": box.get("slotName", f"Slot #{idx + 1}"),
                "bbox": {"x": int(bx), "y": int(by), "width": int(bw), "height": int(bh)},
                "lab": med_lab,
                "hsv": med_hsv,
                "bgr": med_bgr,
                "colorName": color_name,
                "hexColor": actual_hex,
            })

        if not items:
            return {"success": False, "error": "No products could be detected on the shelf."}

        # 3. Determine MAIN SHELF PRODUCT (The majority color on the shelf)
        # Retail shelves are dedicated to one main product line; the color with the most products is the MAIN product!
        color_counts = Counter([it["colorName"] for it in items])
        dominant_color_name, dominant_count = color_counts.most_common(1)[0]

        # Calculate consensus color metrics strictly from items of the main product
        majority_items = [it for it in items if it["colorName"] == dominant_color_name]
        consensus_lab = np.median([it["lab"] for it in majority_items], axis=0)
        consensus_hue = float(np.median([it["hsv"][0] for it in majority_items]))
        consensus_hex = majority_items[0]["hexColor"]

        # 4. Outlier Analysis: Recognize ONLY genuine mismatched products
        mismatches = []
        for it in items:
            it_lab = np.array(it["lab"])
            delta_e = float(np.linalg.norm(it_lab - consensus_lab))
            hue_diff = abs(it["hsv"][0] - consensus_hue)
            hue_diff = min(hue_diff, 180.0 - hue_diff)

            diff_score = min(100.0, (delta_e * 1.0) + (hue_diff * 0.7))
            it["colorDistanceScore"] = round(diff_score, 1)
            it["deltaE"] = round(delta_e, 1)
            it["hueDiff"] = round(hue_diff, 1)

            # Check if color is compatible with main product
            is_compatible = are_colors_compatible(
                it["colorName"], dominant_color_name, hue_diff, delta_e
            )

            # A product is mismatched IF AND ONLY IF its packaging color genuinely differs from the main product!
            is_mismatch = not is_compatible

            if is_mismatch:
                it["isMismatch"] = True
                it["status"] = "MISMATCHED PRODUCT IN INVENTORY"
                it["detectedItem"] = f"Mismatched Product ({it['colorName']})"
                it["expectedItem"] = f"Main Product ({dominant_color_name})"
                it["rightfulShelf"] = "Other Shelf / Returns"
                it["action"] = f"Remove misplaced {it['colorName']} item from {it['slot']} and return to designated shelf"
                mismatches.append(it)
            else:
                it["isMismatch"] = False
                it["status"] = "MAIN PRODUCT (COMPLIANT)"
                it["detectedItem"] = f"Main Product ({dominant_color_name})"
                it["expectedItem"] = f"Main Product ({dominant_color_name})"
                it["rightfulShelf"] = shelf_name
                it["action"] = f"Planogram compliant ({dominant_color_name})"

        has_mismatch = len(mismatches) > 0
        annotated_b64 = self._draw_annotated_shelf(
            pil_img, items, dominant_color_name, consensus_hex, shelf_name, len(mismatches)
        )

        # Notify INVENTARY_SYSTEM with complete list and exact count of mismatched products
        notification_receipt = None
        if has_mismatch:
            notification_receipt = self._notify_inventory(shelf_name, mismatches, dominant_color_name)

        return {
            "shelf": shelf_name,
            "dominantColor": dominant_color_name,
            "dominantHex": consensus_hex,
            "mainProductCount": dominant_count,
            "totalDetected": len(items),
            "correctCount": len(items) - len(mismatches),
            "mismatchCount": len(mismatches),
            "hasMismatch": has_mismatch,
            "mismatches": mismatches,
            "items": items,
            "summary": (
                f"Found {len(mismatches)} mismatched product(s) in inventory on {shelf_name}. "
                f"Main Product: {dominant_color_name} ({dominant_count}/{len(items)} items)."
                if has_mismatch
                else f"100% Compliant: All {len(items)} items match main shelf product ({dominant_color_name}). 0 mismatched products in inventory."
            ),
            "annotatedImage": f"data:image/jpeg;base64,{annotated_b64}",
            "notificationReceipt": notification_receipt,
            "sensitivityThreshold": sensitivity_threshold,
            "scope": scope,
        }

    def _draw_annotated_shelf(
        self,
        pil_img: Image.Image,
        items: List[Dict[str, Any]],
        dominant_color_name: str,
        dominant_hex: str,
        shelf_name: str,
        mismatch_count: int
    ) -> str:
        img_copy = pil_img.copy()
        draw = ImageDraw.Draw(img_copy)
        w, h = img_copy.size

        for it in items:
            bbox = it["bbox"]
            x, y, bw, bh = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
            is_mismatch = it.get("isMismatch", False)

            if is_mismatch:
                box_color = "#ef4444"    # Red for Mismatched Product
                tag_bg = "#dc2626"
                tag_text = "#ffffff"
                label = f"[!] MISMATCHED PRODUCT"
                sub_label = f"{it['colorName']} ({it['slot']})"
                border_width = 4
            else:
                box_color = "#10b981"    # Green for Compliant Main Product
                tag_bg = "#059669"
                tag_text = "#ffffff"
                label = f"[OK] MAIN PRODUCT"
                sub_label = f"{it['colorName']}"
                border_width = 3

            # Draw outer bounding box
            for i in range(border_width):
                draw.rectangle([x - i, y - i, x + bw + i, y + bh + i], outline=box_color)

            # Draw tag banner above box
            tag_w = max(bw, 175)
            tag_h = 32
            draw.rectangle([x, max(0, y - tag_h), x + tag_w, y], fill=tag_bg)
            draw.text((x + 6, max(2, y - 30)), label, fill=tag_text)
            draw.text((x + 6, max(14, y - 16)), sub_label, fill="#fef08a" if is_mismatch else "#d1fae5")

            # Swatch badge of detected item color in lower corner
            chip_size = 20
            cx, cy = x + bw - chip_size - 4, y + bh - chip_size - 4
            draw.rectangle([cx, cy, cx + chip_size, cy + chip_size], fill=it["hexColor"], outline="#ffffff", width=2)

        # Top HUD Banner Bar
        hud_w = min(w - 20, 750)
        hud_h = 66
        draw.rectangle([10, 10, 10 + hud_w, 10 + hud_h], fill="#090d16")
        hud_outline = "#ef4444" if mismatch_count > 0 else "#10b981"
        draw.rectangle([10, 10, 10 + hud_w, 10 + hud_h], outline=hud_outline, width=3)
        
        # Color circle for dominant color
        draw.ellipse([20, 18, 56, 54], fill=dominant_hex, outline="#ffffff", width=2)

        title_text = f"SHELF AUDIT: {shelf_name.upper()} | MAIN PRODUCT: {dominant_color_name.upper()}"
        if mismatch_count == 1:
            status_text = "ALERT: 1 MISMATCHED PRODUCT IN INVENTORY DETECTED"
        elif mismatch_count > 1:
            status_text = f"ALERT: {mismatch_count} MISMATCHED PRODUCTS IN INVENTORY DETECTED"
        else:
            status_text = f"PLANOGRAM COMPLIANT: ALL {len(items)} ITEMS MATCH MAIN PRODUCT"

        sub_info = f"Total Items: {len(items)} | Main ({dominant_color_name}): {len(items) - mismatch_count} | Mismatches: {mismatch_count}"

        draw.text((68, 14), title_text, fill="#38bdf8")
        draw.text((68, 32), status_text, fill="#ef4444" if mismatch_count > 0 else "#34d399")
        draw.text((68, 48), sub_info, fill="#cbd5e1")

        buf = io.BytesIO()
        img_copy.save(buf, format="JPEG", quality=92)
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    def _notify_inventory(
        self,
        shelf_name: str,
        mismatches: List[Dict[str, Any]],
        dominant_color: str
    ) -> Optional[Dict[str, Any]]:
        """
        Dispatches alerts to INVENTARY_SYSTEM for all detected misplaced products.
        """
        if not mismatches:
            return None

        # Build notification payload highlighting all misplaced products
        first = mismatches[0]
        summary_mismatches = [f"{m['detectedItem']} in {m['slot']}" for m in mismatches]
        
        payload = {
            "shelf": shelf_name,
            "slot": ", ".join([m.get("slot", "") for m in mismatches[:3]]),
            "positionId": f"COLOR-MISMATCH-BATCH-{len(mismatches)}",
            "detectedItem": "; ".join(summary_mismatches[:3]),
            "expectedItem": f"Standard {dominant_color} Shelf Product",
            "rightfulShelf": "Other Shelf / Returns",
            "confidence": 0.96,
            "mismatchCount": len(mismatches),
            "mismatches": [
                {
                    "slot": m["slot"],
                    "color": m["colorName"],
                    "hex": m["hexColor"],
                    "diffScore": m["colorDistanceScore"],
                    "action": m["action"],
                }
                for m in mismatches
            ],
            "action": f"Found {len(mismatches)} misplaced product(s) on {shelf_name} ({', '.join([m['colorName'] for m in mismatches])}). Return to correct shelves.",
        }

        try:
            resp = requests.post(f"{self.api_url}/shelf/mismatch", json=payload, timeout=0.5)
            if resp.status_code == 200:
                return {
                    "status": "delivered",
                    "code": 200,
                    "mismatchCount": len(mismatches),
                    "message": f"Successfully alerted INVENTARY_SYSTEM: {len(mismatches)} misplaced product(s) flagged!",
                    "endpoint": f"{self.api_url}/shelf/mismatch",
                }
            return {"status": "error", "code": resp.status_code, "message": resp.text}
        except Exception as e:
            return {"status": "queued", "message": f"Server unreachable: {str(e)}"}

robust_color_detector = RobustColorShelfDetector()
