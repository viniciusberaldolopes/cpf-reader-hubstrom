// Remove pontos, traço e qualquer outro caractere que não seja número.
export function normalizeCpf(cpf) {
  const cpfAsString = String(cpf);

  return cpfAsString.replace(/\D/g, "");
}

// Calcula um dos dois dígitos verificadores usando o módulo 11.
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

  // Um CPF sempre precisa ter exatamente 11 números.
  if (digits.length !== 11) {
    return false;
  }

  // Sequências como 000.000.000-00 passam pelo cálculo, mas não são CPFs válidos.
  const allDigitsAreEqual = /^(\d)\1{10}$/.test(digits);

  if (allDigitsAreEqual) {
    return false;
  }

  // Primeiro dígito: utiliza os nove primeiros números, com pesos de 10 a 2.
  const firstNineDigits = digits.slice(0, 9);
  const calculatedFirstDigit = calculateDigit(firstNineDigits, 10);
  const informedFirstDigit = Number(digits[9]);

  if (calculatedFirstDigit !== informedFirstDigit) {
    return false;
  }

  // Segundo dígito: repete o cálculo incluindo o primeiro verificador.
  const firstTenDigits = digits.slice(0, 10);
  const calculatedSecondDigit = calculateDigit(firstTenDigits, 11);
  const informedSecondDigit = Number(digits[10]);

  return calculatedSecondDigit === informedSecondDigit;
}

export function extractCpfs(text) {
  // O teste pede somente CPFs que já estejam no formato XXX.XXX.XXX-XX.
  const cpfPattern = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  const matches = String(text).match(cpfPattern) || [];

  // O Set impede que o mesmo CPF apareça mais de uma vez no resultado do PDF.
  const uniqueCpfs = [...new Set(matches)];

  return uniqueCpfs.map((cpf) => ({
    type: "CPF",
    formatted: cpf,
    normalized: normalizeCpf(cpf),
    isValid: isValidCpf(cpf),
  }));
}

export function normalizeCnpj(cnpj) {
  return String(cnpj)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function cnpjCharacterValue(character) {
  // Regra oficial: o valor usado no cálculo corresponde ao código ASCII menos 48.
  return character.charCodeAt(0) - 48;
}

function calculateCnpjDigit(base, weights) {
  const sum = [...base].reduce(
    (total, character, index) =>
      total + cnpjCharacterValue(character) * weights[index],
    0
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(cnpj) {
  const value = normalizeCnpj(cnpj);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(value)) return false;
  if (/^(\d)\1{13}$/.test(value)) return false;

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const firstDigit = calculateCnpjDigit(value.slice(0, 12), firstWeights);
  if (firstDigit !== Number(value[12])) return false;

  const secondDigit = calculateCnpjDigit(value.slice(0, 13), secondWeights);
  return secondDigit === Number(value[13]);
}

export function extractCnpjs(text) {
  const cnpjPattern =
    /\b[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}\b/gi;
  const matches = String(text).toUpperCase().match(cnpjPattern) || [];
  const uniqueCnpjs = [...new Set(matches)];

  return uniqueCnpjs.map((cnpj) => ({
    type: "CNPJ",
    formatted: cnpj,
    normalized: normalizeCnpj(cnpj),
    isValid: isValidCnpj(cnpj),
  }));
}

export function extractDocuments(text) {
  return [...extractCpfs(text), ...extractCnpjs(text)];
}
