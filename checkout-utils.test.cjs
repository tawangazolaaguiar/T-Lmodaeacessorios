const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateInstallments, estimateShipping, formatCPF, isValidCPF } = require("./checkout-utils.js");

test("validates and formats Brazilian CPFs", () => {
  assert.equal(isValidCPF("529.982.247-25"), true);
  assert.equal(isValidCPF("111.111.111-11"), false);
  assert.equal(isValidCPF("52998224724"), false);
  assert.equal(formatCPF("52998224725"), "529.982.247-25");
});

test("estimates shipping by CEP region and rejects incomplete CEPs", () => {
  assert.deepEqual(estimateShipping("70040-010"), { region: "Brasília e DF", price: 14.90 });
  assert.deepEqual(estimateShipping("01001-000"), { region: "São Paulo", price: 22.90 });
  assert.deepEqual(estimateShipping("99999-999"), { region: "Sul", price: 27.90 });
  assert.equal(estimateShipping("12345"), null);
});

test("applies no interest through three installments and 3% monthly thereafter", () => {
  assert.deepEqual(calculateInstallments(120, 3), { total: 120, monthly: 40, interest: 0 });
  const fourPayments = calculateInstallments(120, 4);
  assert.equal(fourPayments.total, 129.13);
  assert.equal(fourPayments.interest, 9.13);
  assert.throws(() => calculateInstallments(120, 13), RangeError);
});
