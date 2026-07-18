import { applyOp, formatDisplay, parseLocale } from "./calculatorMath";

describe("calculator math", () => {
  it("parses French decimals", () => {
    expect(parseLocale("12,5")).toBe(12.5);
    expect(parseLocale("1500")).toBe(1500);
  });

  it("formats with comma", () => {
    expect(formatDisplay(12.5)).toBe("12,5");
    expect(formatDisplay(22500000)).toBe("22500000");
  });

  it("multiplies like the screenshot", () => {
    expect(applyOp(1500, 15000, "×")).toBe(22500000);
    expect(formatDisplay(applyOp(1500, 15000, "×"))).toBe("22500000");
  });

  it("handles divide by zero", () => {
    expect(formatDisplay(applyOp(10, 0, "÷"))).toBe("Erreur");
  });

  it("adds and subtracts", () => {
    expect(applyOp(10, 3, "+")).toBe(13);
    expect(applyOp(10, 3, "-")).toBe(7);
  });
});
