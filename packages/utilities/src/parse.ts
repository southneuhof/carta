import { formatCurrency, formatDate, formatDateTime, formatDelta, formatHour, formatLargeNumber, formatMonth, formatNumber, formatTime } from './format'

export type Formatter = (value: any) => any

export interface ParserConfig {
  locale?: string
  currency?: string
  dictionary?: Record<string, Record<string, string>>
  formatters?: Record<string, Formatter>
}

function createDefaultFormatters(locale: string, currency: string): Record<string, Formatter> {
  return {
    number: (value) => formatNumber(value, locale),
    largeNumber: (value) => formatLargeNumber(value, locale),
    currency: (value) => formatCurrency(value, locale, currency),
    month: (value) => formatMonth(value, undefined, locale),
    date: (value) => formatDate(value, undefined, locale),
    time: (value) => formatTime(value, undefined, locale),
    datetime: (value) => formatDateTime(value, undefined, locale),
    hour: formatHour,
    delta: formatDelta,
  }
}

let activeLocale = 'id-ID'
let activeCurrency = 'IDR'
let customFormatters: Record<string, Formatter> = {}
let parserConfig: { dictionary: Record<string, Record<string, string>>; formatters: Record<string, Formatter> } = {
  dictionary: {},
  formatters: createDefaultFormatters(activeLocale, activeCurrency),
}

export function configureParser(options: ParserConfig) {
  if (options.locale) activeLocale = options.locale
  if (options.currency) activeCurrency = options.currency
  if (options.formatters) customFormatters = { ...customFormatters, ...options.formatters }
  parserConfig = {
    dictionary: { ...parserConfig.dictionary, ...(options.dictionary || {}) },
    formatters: { ...createDefaultFormatters(activeLocale, activeCurrency), ...customFormatters },
  }
}

export function resetParserConfigForTests() {
  activeLocale = 'id-ID'
  activeCurrency = 'IDR'
  customFormatters = {}
  parserConfig = {
    dictionary: {},
    formatters: createDefaultFormatters(activeLocale, activeCurrency),
  }
}

export function hasFormatter(key: string): boolean {
  return Object.hasOwn(parserConfig.formatters, key)
}

export function parse(key: string, value: any): any {
  if (!parserConfig.formatters[key]) return parserConfig.dictionary[key]?.[value] || value
  return parserConfig.formatters[key](value)
}
