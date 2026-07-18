import {
  createCalcState,
  inputDigit,
  inputDot,
  inputEquals,
  inputOp,
} from "./calcEngine";

describe("calcEngine entry sequence", () => {
  it("replaces display after operator (3 + 5 → 5, not 35)", () => {
    let s = createCalcState();
    s = inputDigit(s, "3");
    expect(s.display).toBe("3");
    s = inputOp(s, "+");
    expect(s.fresh).toBe(true);
    expect(s.display).toBe("3");
    s = inputDigit(s, "5");
    expect(s.display).toBe("5");
    s = inputEquals(s);
    expect(s.display).toBe("8");
  });

  it("appends digits within the same operand", () => {
    let s = createCalcState();
    s = inputDigit(s, "1");
    s = inputDigit(s, "2");
    s = inputDigit(s, "3");
    expect(s.display).toBe("123");
  });

  it("chains operations", () => {
    let s = createCalcState();
    s = inputDigit(s, "3");
    s = inputOp(s, "+");
    s = inputDigit(s, "5");
    s = inputOp(s, "+");
    expect(s.display).toBe("8");
    s = inputDigit(s, "2");
    s = inputEquals(s);
    expect(s.display).toBe("10");
  });

  it("handles decimal after operator", () => {
    let s = createCalcState();
    s = inputDigit(s, "3");
    s = inputOp(s, "+");
    s = inputDot(s);
    s = inputDigit(s, "5");
    expect(s.display).toBe("0,5");
  });
});
