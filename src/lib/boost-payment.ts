import 'server-only'

/**
 * Номер Kaspi, на который мастера переводят оплату буста.
 * Задаётся переменной окружения KASPI_BOOST_NUMBER (например, в Vercel),
 * чтобы поменять номер без правки кода.
 *
 * Возвращает номер в виде «+7 777 123 45 67» или null, если переменная
 * не задана или не похожа на казахстанский мобильный номер. Пока номера
 * нет, приём оплаты буста выключен: мастер не должен увидеть чужой номер.
 */
export function getKaspiBoostNumber(): string | null {
  const raw = process.env.KASPI_BOOST_NUMBER?.trim()
  if (!raw) return null

  let digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.length === 10) digits = '7' + digits
  if (!/^77\d{9}$/.test(digits)) {
    console.error('KASPI_BOOST_NUMBER задан в неверном формате, оплата буста выключена')
    return null
  }

  return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
}
