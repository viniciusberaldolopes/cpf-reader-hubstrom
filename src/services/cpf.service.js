export function normalizeCpf(cpf) {
  const cpfAsString = String(cpf);

  return cpfAsString.replace(/\D/g, "");
}

function calculateDigit(base, initialWeight) {
  let sum = 0;

  for (let index = 0; index < base.length; index += 1) {
    const digit = Number(base[index]);
    const weight = initialWeight - index;

    sum += digit * weight;
  }

  const remainder = sum % 11;

  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(cpf) {
  const digits = normalizeCpf(cpf);

  if (digits.length !== 11) {
    return false;
  }

  const allDigitsAreEqual = /^(\d)\1{10}$/.test(digits);

  if (allDigitsAreEqual) {
    return false;
  }

  const firstNineDigits = digits.slice(0, 9);
  const calculatedFirstDigit = calculateDigit(firstNineDigits, 10);
  const informedFirstDigit = Number(digits[9]);

  if (calculatedFirstDigit !== informedFirstDigit) {
    return false;
  }

  const firstTenDigits = digits.slice(0, 10);
  const calculatedSecondDigit = calculateDigit(firstTenDigits, 11);
  const informedSecondDigit = Number(digits[10]);

  return calculatedSecondDigit === informedSecondDigit;
}

export function extractCpfs(text) {
  const cpfPattern = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  const matches = String(text).match(cpfPattern) || [];
  const uniqueCpfs = [...new Set(matches)];

  return uniqueCpfs.map((cpf) => ({
    formatted: cpf,
    normalized: normalizeCpf(cpf),
    isValid: isValidCpf(cpf),
  }));
}
