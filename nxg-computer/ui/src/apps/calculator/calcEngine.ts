import { applyOp, CalcOp, formatDisplay, parseLocale } from "./calculatorMath";

export type CalcState = {
  display: string;
  expr: string;
  acc: number | null;
  op: CalcOp;
  /** Next digit replaces display instead of appending */
  fresh: boolean;
};

export function createCalcState(): CalcState {
  return {
    display: "0",
    expr: "",
    acc: null,
    op: null,
    fresh: true,
  };
}

export function inputDigit(state: CalcState, d: string): CalcState {
  let display: string;
  if (state.fresh || state.display === "0" || state.display === "Erreur") {
    display = d;
  } else if (state.display.replace(",", "").replace("-", "").length >= 12) {
    display = state.display;
  } else {
    display = state.display + d;
  }
  return { ...state, display, fresh: false };
}

export function inputDot(state: CalcState): CalcState {
  let display: string;
  if (state.fresh || state.display === "Erreur") {
    display = "0,";
  } else if (state.display.includes(",")) {
    display = state.display;
  } else {
    display = `${state.display},`;
  }
  return { ...state, display, fresh: false };
}

export function inputOp(state: CalcState, next: CalcOp): CalcState {
  if (!next) return state;
  const cur = parseLocale(state.display);
  if (state.acc !== null && state.op && !state.fresh) {
    const result = applyOp(state.acc, cur, state.op);
    return {
      display: formatDisplay(result),
      expr: `${formatDisplay(result)}${next}`,
      acc: result,
      op: next,
      fresh: true,
    };
  }
  return {
    ...state,
    acc: cur,
    expr: `${formatDisplay(cur)}${next}`,
    op: next,
    fresh: true,
  };
}

export function inputEquals(state: CalcState): CalcState {
  if (state.acc === null || !state.op) return state;
  const cur = parseLocale(state.display);
  const result = applyOp(state.acc, cur, state.op);
  return {
    display: formatDisplay(result),
    expr: `${formatDisplay(state.acc)}${state.op}${formatDisplay(cur)}`,
    acc: null,
    op: null,
    fresh: true,
  };
}

export function inputClear(): CalcState {
  return createCalcState();
}

export function inputNeg(state: CalcState): CalcState {
  if (state.display === "0" || state.display === "Erreur") return state;
  const display = state.display.startsWith("-")
    ? state.display.slice(1)
    : `-${state.display}`;
  return { ...state, display, fresh: false };
}

export function inputPercent(state: CalcState): CalcState {
  return {
    ...state,
    display: formatDisplay(parseLocale(state.display) / 100),
    fresh: true,
  };
}

export function inputBack(state: CalcState): CalcState {
  if (state.fresh) return state;
  if (state.display.length <= 1 || state.display === "Erreur") {
    return { ...state, display: "0", fresh: true };
  }
  return { ...state, display: state.display.slice(0, -1) };
}
