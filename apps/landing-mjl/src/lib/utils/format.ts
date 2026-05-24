export function formatCurrency(num: number | undefined | null, locale = 'ID', currency = 'IDR') {
  return num != null ? new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num) : '-'
}

export function formatDate(date: string | undefined | null, options?: Intl.DateTimeFormatOptions, locale = 'id-ID') {
  return date ? new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', ...(options ? options : {}) }) : '-'
}

export function formatTime(date: string | undefined | null, options?: Intl.DateTimeFormatOptions, locale = 'id-ID') {
  return date ? new Date(date).toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', ...(options ? options : {}) }) : '-'
}

export function formatDateTime(date: string | undefined | null, options?: Intl.DateTimeFormatOptions, locale = 'id-ID') {
  return date ? new Date(date).toLocaleString(locale, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', ...(options ? options : {}) }) : '-'
}

export function formatNumber(num: number | undefined | null, locale = 'id-ID') {
  return num != null ? new Intl.NumberFormat(locale, { style: 'decimal' }).format(num) : '-'
}

export const formatterMap = {
  number: formatNumber,
  currency: formatCurrency,
  date: formatDate,
  time: formatTime,
  datetime: formatDateTime,
}

export const formatData = (value: any, type: keyof typeof formatterMap, locale = 'id-ID') => {
  if (formatterMap[type]) {
    return formatterMap[type](value, locale)
  }
  return value
}