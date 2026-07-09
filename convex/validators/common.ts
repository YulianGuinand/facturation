export function validateSiren(siren: string): boolean {
  if (!/^\d{9}$/.test(siren)) return false;
  return luhnCheck(siren);
}

export function validateSiret(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false;
  return luhnCheck(siret);
}

export function validateVatNumber(vatNumber: string): boolean {
  return /^FR[A-Z0-9]{2}\d{9}$/.test(vatNumber);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^0[1-9]\d{8}$/.test(phone.replace(/[\s.-]/g, ""));
}

export function validateIban(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleaned)) return false;
  return true;
}

export function validateBic(bic: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic.toUpperCase());
}

export function validatePostalCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isNonNegativeNumber(value: number): boolean {
  return typeof value === "number" && value >= 0 && isFinite(value);
}

export function isPositiveNumber(value: number): boolean {
  return typeof value === "number" && value > 0 && isFinite(value);
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}
