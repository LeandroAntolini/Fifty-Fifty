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
    // Se for 9 dígitos após o DDD (celular)
    if (limitedDigits.length === 11) {
        formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 7)}-${limitedDigits.slice(7)}`;
    } else {
        // Se for 8 dígitos após o DDD (telefone fixo)
        formatted = `(${limitedDigits.slice(0, 2)}) ${limitedDigits.slice(2, 6)}-${limitedDigits.slice(6)}`;
    }
  }

  return formatted;
};

export const toTitleCase = (str: string): string => {
  if (!str) return "";
  const lowerCaseWords = ['de', 'da', 'do', 'dos', 'das', 'e'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowerCaseWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};