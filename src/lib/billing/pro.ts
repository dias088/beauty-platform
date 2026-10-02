// Единое понятие Pro для всего приложения.
//
// Pro = оплаченный период в masters.boost_until. Всё, что даёт Pro
// (TOP в каталоге, значок, полная статистика), проверяется только по нему.
// Оплатить период можно двумя способами:
//   * разово на 7/30 дней (страница «Буст»), сейчас через админку;
//   * подпиской с автосписанием: webhook биллинга продлевает boost_until
//     до конца оплаченного периода (см. applyBillingEvent).
// Таблица subscriptions хранит только состояние автосписания (карта,
// статус, дата следующего списания) и сама доступ не открывает.
//
// Писать boost_until может только сервер (service_role): обычным
// пользователям колонка закрыта триггером из миграции 13.

/** Pro активен, если оплаченный период ещё не истёк. */
export function isProUntil(proUntil: string | null | undefined, now: Date = new Date()): boolean {
  return proUntil ? new Date(proUntil) > now : false
}

/** Новый конец Pro-периода: не сокращаем уже оплаченное время. */
export function extendProUntil(current: string | null | undefined, until: Date): string {
  const cur = current ? new Date(current) : null
  return (cur && cur > until ? cur : until).toISOString()
}
