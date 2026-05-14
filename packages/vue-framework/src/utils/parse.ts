import { formatCurrency, formatDate, formatDateTime, formatDelta, formatHour, formatLargeNumber, formatMonth, formatNumber, formatTime } from './format'

export type Formatter = (value: any) => any

export interface ParserConfig {
  dictionary?: Record<string, Record<string, string>>
  formatters?: Record<string, Formatter>
}

const defaultFormatters: Record<string, Formatter> = {
  number: formatNumber,
  largeNumber: formatLargeNumber,
  currency: formatCurrency,
  month: formatMonth,
  date: formatDate,
  time: formatTime,
  datetime: formatDateTime,
  hour: formatHour,
  delta: formatDelta,
}

let parserConfig: Required<ParserConfig> = {
  dictionary: {},
  formatters: {},
}

export function createParser(options?: ParserConfig) {
  const dictionary = options?.dictionary || {}
  const formatters = { ...defaultFormatters, ...(options?.formatters || {}) }

  return (key: string, value: any): any => {
    if (!formatters[key]) return dictionary[key]?.[value] || value
    return formatters[key](value)
  }
}

export function configureParser(options: ParserConfig) {
  parserConfig = {
    dictionary: { ...parserConfig.dictionary, ...(options.dictionary || {}) },
    formatters: { ...parserConfig.formatters, ...(options.formatters || {}) },
  }
}

export function resetParserConfigForTests() {
  parserConfig = {
    dictionary: {},
    formatters: {},
  }
}

export function parse(key: string, value: any): any {
  return createParser(parserConfig)(key, value)
}
