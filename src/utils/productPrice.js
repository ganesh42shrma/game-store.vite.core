/**
 * Product sale/discount helpers.
 * Backend: price = original; discountedPrice = optional sale price (must be < price when set).
 * Selling price = discountedPrice when isOnSale && discountedPrice != null, else price.
 */

export function isOnSale(product) {
  if (!product) return false;
  const onSale = product.isOnSale === true;
  const price = product.price != null ? Number(product.price) : 0;
  const discounted = product.discountedPrice != null ? Number(product.discountedPrice) : null;
  return onSale && discounted != null && discounted >= 0 && discounted < price;
}

export function getSellingPrice(product) {
  if (!product) return 0;
  const price = product.price != null ? Number(product.price) : 0;
  if (isOnSale(product)) {
    const d = Number(product.discountedPrice);
    return Number.isFinite(d) && d >= 0 && d < price ? d : price;
  }
  return price;
}
