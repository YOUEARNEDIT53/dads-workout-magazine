export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateWordCount(
  text: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const errors: string[] = [];

  if (wordCount < min) {
    errors.push(`${fieldName} is too short: ${wordCount} words (minimum: ${min})`);
  }
  if (wordCount > max) {
    errors.push(`${fieldName} is too long: ${wordCount} words (maximum: ${max})`);
  }

  return { isValid: errors.length === 0, errors };
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, errors: [`${fieldName} is required`] };
  }
  return { isValid: true, errors: [] };
}

export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
