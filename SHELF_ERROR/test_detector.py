from detector import detector_instance

def run_tests():
    print("========================================")
    print("TEST 1: Shelf A Clean (Only Tea Powder)")
    r1 = detector_instance.analyze_shelf_image("static/samples/shelf_a_clean.jpg", "Shelf A")
    print(f"Has Mismatch: {r1['hasMismatch']} | Correct: {r1['correctCount']} | Mismatches: {r1['mismatchCount']}")
    assert r1['hasMismatch'] == False, "Expected no mismatch on clean shelf!"
    print("PASSED TEST 1")

    print("\n========================================")
    print("TEST 2: Shelf A with Misplaced Book in Slot 2")
    r2 = detector_instance.analyze_shelf_image("static/samples/shelf_a_with_misplaced_book.jpg", "Shelf A")
    print(f"Has Mismatch: {r2['hasMismatch']} | Correct: {r2['correctCount']} | Mismatches: {r2['mismatchCount']}")
    assert r2['hasMismatch'] == True, "Expected mismatch on shelf with misplaced book!"
    for m in r2['mismatches']:
        print(f"  [ALERT] Detected: '{m['detectedItem']}' in {m['slot']} | Expected: '{m['expectedItem']}' -> Rightful: {m['rightfulShelf']}")
        assert m['detectedItem'] == "books"
        assert m['rightfulShelf'] == "Shelf B"
    print("PASSED TEST 2")

    print("\n========================================")
    print("TEST 3: Shelf B with Misplaced Tea in Slot 1")
    r3 = detector_instance.analyze_shelf_image("static/samples/shelf_b_with_misplaced_tea.jpg", "Shelf B")
    print(f"Has Mismatch: {r3['hasMismatch']} | Correct: {r3['correctCount']} | Mismatches: {r3['mismatchCount']}")
    assert r3['hasMismatch'] == True, "Expected mismatch on shelf with misplaced tea!"
    for m in r3['mismatches']:
        print(f"  [ALERT] Detected: '{m['detectedItem']}' in {m['slot']} | Expected: '{m['expectedItem']}' -> Rightful: {m['rightfulShelf']}")
        assert m['detectedItem'] == "tea powder"
        assert m['rightfulShelf'] == "Shelf A"
    print("PASSED TEST 3")

    print("\n========================================")
    print("TEST 4: Shelf A with Foreign Item (Cola Can in Slot 3)")
    r4 = detector_instance.analyze_shelf_image("static/samples/shelf_a_with_foreign_item.jpg", "Shelf A")
    print(f"Has Mismatch: {r4['hasMismatch']} | Correct: {r4['correctCount']} | Mismatches: {r4['mismatchCount']}")
    assert r4['hasMismatch'] == True, "Expected mismatch on foreign beverage can!"
    for m in r4['mismatches']:
        print(f"  [ALERT] Detected: '{m['detectedItem']}' in {m['slot']} | Expected: '{m['expectedItem']}' -> Action: {m['action']}")
    print("\n========================================")
    print("TEST 5: Robust Color Detection on Soap Shelf (Hammam with Unwanted Cinthol)")
    from color_shelf_detector import robust_color_detector
    r5 = robust_color_detector.analyze_shelf("static/samples/shelf_soap_with_cinthol_mismatch.jpg", "Shelf A")
    print(f"Dominant: {r5['dominantColor']} | Total Items: {r5['totalDetected']} | Mismatches: {r5['mismatchCount']}")
    assert r5['hasMismatch'] == True, "Expected mismatch on soap shelf with Cinthol!"
    assert r5['mismatchCount'] == 1, f"Expected exactly 1 unwanted product, found {r5['mismatchCount']}!"
    m5 = r5['mismatches'][0]
    print(f"  [ALERT] Detected: '{m5['detectedItem']}' in {m5['slot']} -> Color: {m5['colorName']} ({m5['colorDistanceScore']}%)")
    assert "Tier 2" in m5['slot'] and "Slot 4" in m5['slot'], f"Expected Tier 2 Slot 4, got {m5['slot']}"
    print("PASSED TEST 5: EXACTLY 1 UNWANTED PRODUCT DETECTED IN TIER 2 SLOT 4 WITH 0 FALSE POSITIVES!")

    print("\n========================================")
    print("TEST 6: Multi-tier Oil Rack with Multiple Anomalies")
    r6 = robust_color_detector.analyze_shelf("static/samples/real_oil_shelf_multiple_mismatches.jpg", "Shelf A")
    print(f"Dominant: {r6['dominantColor']} | Total Items: {r6['totalDetected']} | Mismatches: {r6['mismatchCount']}")
    assert r6['hasMismatch'] == True, "Expected mismatches on multi-tier oil rack!"
    assert r6['mismatchCount'] >= 2, f"Expected at least 2 mismatches, found {r6['mismatchCount']}"
    print("PASSED TEST 6")

    print("\n========================================")
    print("TEST 7: Single-Tier Cooking Oil Shelf with Blue Anomaly")
    r7 = robust_color_detector.analyze_shelf("static/samples/shelf_yellow_oil_with_mismatch.jpg", "Shelf A")
    print(f"Dominant: {r7['dominantColor']} | Total Items: {r7['totalDetected']} | Mismatches: {r7['mismatchCount']}")
    assert r7['hasMismatch'] == True, "Expected mismatch on yellow oil shelf with blue box!"
    print("PASSED TEST 7")

    print("\nALL 7 COMPUTER VISION MISMATCH DETECTION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
