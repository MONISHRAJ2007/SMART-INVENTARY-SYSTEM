/**
 * Inventory Verification comparing Expected Shelf Weight vs Actual Shelf Weight
 * @param {number} expectedStock - Current stock count stored in DB
 * @param {number} unitWeight - Unit weight of the product in grams
 * @param {number} actualShelfWeight - Measured weight from ESP32 in grams
 * @param {number} toleranceGrams - Allowed variance tolerance in grams (e.g., 50g)
 */
const verifyInventory = (
  expectedStock,
  unitWeight,
  actualShelfWeight,
  toleranceGrams = 50
) => {
  const expectedShelfWeight = (expectedStock || 0) * (unitWeight || 0);
  const weightDifference = Math.abs(expectedShelfWeight - (actualShelfWeight || 0));
  const isDiscrepant = weightDifference > toleranceGrams;

  return {
    expectedShelfWeight,
    actualShelfWeight: actualShelfWeight || 0,
    weightDifference,
    discrepancyStatus: isDiscrepant ? 'Discrepancy' : 'Verified',
    isDiscrepant,
    toleranceGrams,
  };
};

module.exports = { verifyInventory };
