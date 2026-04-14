/**
 * Interpola variáveis {{nome}} em um texto usando o store de variáveis do flow.
 */
export function interpolate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return variables[key] ?? '';
  });
}

export function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

/**
 * Avalia uma condição simples: field operator value
 */
export function evaluateCondition(
  field: string,
  operator: string,
  value: string,
  variables: Record<string, string>,
): boolean {
  const actual = variables[field] ?? '';
  switch (operator) {
    case 'eq':
      return actual === value;
    case 'neq':
      return actual !== value;
    case 'contains':
      return actual.toLowerCase().includes(value.toLowerCase());
    case 'not_contains':
      return !actual.toLowerCase().includes(value.toLowerCase());
    case 'starts_with':
      return actual.toLowerCase().startsWith(value.toLowerCase());
    case 'is_empty':
      return actual.trim() === '';
    case 'is_not_empty':
      return actual.trim() !== '';
    default:
      return false;
  }
}
