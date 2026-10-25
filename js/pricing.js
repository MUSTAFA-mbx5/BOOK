// قواعد التسعير — عدّلها هنا عند الحاجة
export const PRICE_PER_PAGE = 40;   // سعر الصفحة (د.ع)
export const BINDING_COST = 500;    // تكلفة الجلاد (د.ع)
export const ROUNDING_UNIT = 250;   // وحدة التقريب لأعلى

/**
 * السعر النهائي = تقريب لأعلى مضاعف لـ 250
 *   بعد (صفحات × 40 + 500)
 */
export function finalPrice(pages) {
  if (!Number.isFinite(pages) || pages <= 0) return 0;
  const base = pages * PRICE_PER_PAGE + BINDING_COST;
  return Math.ceil(base / ROUNDING_UNIT) * ROUNDING_UNIT;
}

export function formatPrice(value) {
  return Number(value).toLocaleString('en-US') + ' د.ع';
}
