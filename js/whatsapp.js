export const PHONE = '9647813985853'; // بدون +

export function openWhatsApp(message) {
  const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
}

export function buildSingleBookMessage(gradeName, book, price) {
  return `تحية طيبة، أود طلب هذا الكتاب حسب التفاصيل التالية:

الصف الدراسي: ${gradeName}
اسم المادة: ${book.name}
عدد الصفحات: ${book.pages}
السعر النهائي: ${price.toLocaleString('en-US')} دينار عراقي

يرجى تأكيد توفر الكتاب وإمكانية التوصيل.

مع الشكر والتقدير.
مكتبة المصطفى`;
}

export function buildMultiBookMessage(gradeName, items, totalBooks, deliveryZone, deliveryCost, grandTotal) {
  let msg = `تحية طيبة، أود طلب الكتب التالية:

الصف الدراسي: ${gradeName}

📚 قائمة الكتب:
`;
  items.forEach((item, i) => {
    msg += `${i + 1}. ${item.name} — ${item.pages} صفحة — ${item.price.toLocaleString('en-US')} د.ع\n`;
  });
  msg += `\n💰 مجموع أسعار الكتب: ${totalBooks.toLocaleString('en-US')} دينار عراقي\n`;

  if (deliveryZone && deliveryCost !== null) {
    msg += `🚚 منطقة التوصيل: ${deliveryZone.name}\n`;
    msg += `   أجور التوصيل: ${deliveryCost.toLocaleString('en-US')} دينار عراقي\n`;
    msg += `   💵 المبلغ الإجمالي: ${grandTotal.toLocaleString('en-US')} دينار عراقي\n`;
  }

  msg += `\nيرجى تأكيد توفر الكتب وإمكانية التوصيل.

مع الشكر والتقدير.
مكتبة المصطفى`;
  return msg;
}
