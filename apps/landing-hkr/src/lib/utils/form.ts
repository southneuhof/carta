import type { FormFieldValidationType } from '@prisma/client';

const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  number: /^\d+$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  date: (val: string) => !isNaN(Date.parse(val)),
  file: (val: File | string) => val instanceof File || typeof val === 'string'
};

export function validateField(value: any, type: FormFieldValidationType): boolean {
  if (!value) return true;
  const validator = patterns[type];
  if (typeof validator === 'function') return validator(value);
  return validator.test(value);
}