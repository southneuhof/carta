import { createParser } from '@southneuhof/is-vue-framework/utils/parse'
import { formatCurrency, formatDate, formatDateTime, formatDelta, formatHour, formatLargeNumber, formatMonth, formatNumber, formatTime } from '@/utils/common'
import { dictionary } from '@/app/configs/dictionary'

const formatterMap: Record<string, any> = {
  number: formatNumber,
  largeNumber: formatLargeNumber,
  currency: formatCurrency,
  month: formatMonth,
  date: formatDate,
  time: formatTime,
  datetime: formatDateTime,
  hour: formatHour,
  delta: formatDelta
}

export const parse = createParser({
  dictionary: dictionary,
  formatters: formatterMap,
})
