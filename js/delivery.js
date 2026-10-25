export const DELIVERY_ZONES = {
  ramtha:  { name: 'داخل الرميثة', cost: 1000 },
  muthanna: { name: 'داخل محافظة المثنى (خارج الرميثة)', cost: 3000 },
  iraq:    { name: 'بقية المحافظات العراقية', cost: 5000 }
};

export function getDeliveryCost(zoneId) {
  return DELIVERY_ZONES[zoneId]?.cost ?? null;
}

export function getDeliveryName(zoneId) {
  return DELIVERY_ZONES[zoneId]?.name ?? '';
}
