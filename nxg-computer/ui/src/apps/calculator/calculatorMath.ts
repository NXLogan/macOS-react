export type CalcOp = "+" | "-" | "×" | "÷" | null;

export function formatDisplay(n: number): string {
  if (!Number.isFinite(n)) return "Erreur";
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1e10 || (abs > 0 && abs < 1e-6)) {
    s = n.toExponential(6).replace(".", ",");
  } else {
    s = String(n).replace(".", ",");
    if (s.includes(",")) {
      const [a, b] = s.split(",");
      const trimmed = b.slice(0, 8).replace(/0+$/, "");
      s = trimmed ? `${a},${trimmed}` : a;
    }
  }
  return s;
}

export function parseLocale(s: string): number {
  return parseFloat(s.replace(",", ".").replace(/\s/g, ""));
}

export function applyOp(a: number, b: number, operator: CalcOp): number {
  if (!operator) return b;
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}
