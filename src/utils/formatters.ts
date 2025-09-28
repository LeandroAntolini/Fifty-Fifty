export const formatPhoneNumber = (value: string): string => {
  if (!value) return "";

  // Remove todos os caracteres que não são dígitos
  const digitsOnly = value.replace(/\D/g, '');

  // Limita a 11 dígitos (formato de celular brasileiro com DDD)
  const limitedDigits = digitsOnly.slice(0, 11);
  
  let formatted = limitedDigits;

  if (limitedDigits.length > 2) {
    formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2)}`;
  }
  if (limitedDigits.length > 7) {
    formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
  }

  return formatted;
};