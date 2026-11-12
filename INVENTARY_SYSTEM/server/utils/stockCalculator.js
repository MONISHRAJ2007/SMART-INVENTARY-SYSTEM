/**
 * Calculates current stock using Math.floor to avoid over-counting due to sensor noise.
 * Example: 4999g / 250g = 19.996 => 19 units (NOT 20 units).
 * @param {number} shelfWeight - Measured weight on shelf in grams
 * @param {number} unitWeight - Single item unit weight in grams
 * @returns {number} Calculated stock units
 */
const calculateStock = (shelfWeight, unitWeight) => {
  if (!unitWeight || unitWeight <= 0 || !shelfWeight || shelfWeight <= 0) {
    return 0;
  }
  return Math.floor(shelfWeight / unitWeight);
};

module.exports = { calculateStock };
