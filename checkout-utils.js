const CheckoutUtils = (() => {
  const shippingRates = {
    sp: { region: "São Paulo", price: 22.90 },
    southeast: { region: "Sudeste (RJ, ES e MG)", price: 24.90 },
    northeast: { region: "Nordeste", price: 29.90 },
    north: { region: "Norte e parte do Nordeste", price: 39.90 },
    centerWest: { region: "Centro-Oeste", price: 22.90 },
    brasilia: { region: "Brasília e DF", price: 14.90 },
    south: { region: "Sul", price: 27.90 }
  };

  function roundToCents(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function formatCPF(value) {
    const digits = String(value).replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function isValidCPF(value) {
    const digits = String(value).replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    for (let position = 9; position <= 10; position += 1) {
      let sum = 0;
      for (let index = 0; index < position; index += 1) {
        sum += Number(digits[index]) * (position + 1 - index);
      }
      const remainder = (sum * 10) % 11;
      const checkDigit = remainder === 10 ? 0 : remainder;
      if (checkDigit !== Number(digits[position])) return false;
    }

    return true;
  }

  function calculateInstallments(subtotal, count, monthlyRate = 0.03) {
    if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isInteger(count) || count < 1 || count > 12) {
      throw new RangeError("Subtotal ou quantidade de parcelas inválidos.");
    }

    const exactTotal = count <= 3
      ? subtotal
      : subtotal * monthlyRate / (1 - (1 + monthlyRate) ** -count) * count;
    const total = roundToCents(exactTotal);
    return {
      total,
      monthly: roundToCents(total / count),
      interest: roundToCents(total - subtotal)
    };
  }

  function estimateShipping(value) {
    const digits = String(value).replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) return null;

    const firstDigit = digits[0];
    const prefix = digits.slice(0, 2);
    if (["70", "71", "72"].includes(prefix)) return { ...shippingRates.brasilia };

    const rateByPrefix = {
      "0": shippingRates.sp,
      "1": shippingRates.sp,
      "2": shippingRates.southeast,
      "3": shippingRates.southeast,
      "4": shippingRates.northeast,
      "5": shippingRates.northeast,
      "6": shippingRates.north,
      "7": shippingRates.centerWest,
      "8": shippingRates.south,
      "9": shippingRates.south
    };
    return { ...rateByPrefix[firstDigit] };
  }

  return { calculateInstallments, estimateShipping, formatCPF, isValidCPF };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CheckoutUtils;
} else {
  window.LA_CHECKOUT_UTILS = CheckoutUtils;
}
