import React, { useCallback, useContext, useEffect, useReducer, useRef } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import {
  CalcState,
  createCalcState,
  inputBack,
  inputClear,
  inputDigit,
  inputDot,
  inputEquals,
  inputNeg,
  inputOp,
  inputPercent,
} from "./calcEngine";
import { CalcOp } from "./calculatorMath";
import "./CalculatorApp.scss";

type Action =
  | { type: "digit"; d: string }
  | { type: "dot" }
  | { type: "op"; op: CalcOp }
  | { type: "equals" }
  | { type: "clear" }
  | { type: "neg" }
  | { type: "percent" }
  | { type: "back" }
  | { type: "clear-entry" };

function reducer(state: CalcState, action: Action): CalcState {
  switch (action.type) {
    case "digit":
      return inputDigit(state, action.d);
    case "dot":
      return inputDot(state);
    case "op":
      return inputOp(state, action.op);
    case "equals":
      return inputEquals(state);
    case "clear":
      return inputClear();
    case "neg":
      return inputNeg(state);
    case "percent":
      return inputPercent(state);
    case "back":
      return inputBack(state);
    case "clear-entry":
      return { ...state, display: "0", fresh: true };
    default:
      return state;
  }
}

export default function CalculatorApp() {
  const [appState, dispatchApp] = useContext(store);
  const open = Boolean(appState.openApps?.calculator);
  const minimized = Boolean(appState.windowChrome?.calculator?.minimized);
  const [calc, dispatch] = useReducer(reducer, undefined, createCalcState);
  const onTopRef = useRef(appState.onTop);
  onTopRef.current = appState.onTop;
  const hitRef = useRef<HTMLDivElement>(null);

  const focusCalc = useCallback(() => {
    dispatchApp({ type: "onTop/SET", payload: "calculator" });
    hitRef.current?.focus({ preventScroll: true });
  }, [dispatchApp]);

  useEffect(() => {
    if (open && !minimized) {
      // Ensure keyboard works as soon as the window is shown
      dispatchApp({ type: "onTop/SET", payload: "calculator" });
      window.setTimeout(() => hitRef.current?.focus({ preventScroll: true }), 40);
    }
  }, [open, minimized, dispatchApp]);

  useEffect(() => {
    if (!open || minimized) return;

    const digitFromEvent = (e: KeyboardEvent): string | null => {
      if (/^Digit[0-9]$/.test(e.code) || /^Numpad[0-9]$/.test(e.code)) {
        return e.code.slice(-1);
      }
      if (e.key >= "0" && e.key <= "9") return e.key;
      return null;
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(
          "input, textarea, select, [contenteditable='true']"
        )
      ) {
        return;
      }

      const top = onTopRef.current;
      const inCalc = Boolean(
        target?.closest?.(
          "[data-app-window='calculator'], .calculator-window, .calculator-hit"
        )
      );
      // Ignore only when another app is clearly frontmost and focus isn't in calc
      if (
        top &&
        top !== "calculator" &&
        top !== "wallpaper" &&
        !inCalc
      ) {
        return;
      }

      const digit = digitFromEvent(e);
      if (digit) {
        e.preventDefault();
        dispatch({ type: "digit", d: digit });
        return;
      }

      const k = e.key;
      const code = e.code;

      if (
        k === "." ||
        k === "," ||
        code === "NumpadDecimal" ||
        code === "Period" ||
        code === "Comma"
      ) {
        e.preventDefault();
        dispatch({ type: "dot" });
      } else if (k === "+" || code === "NumpadAdd") {
        e.preventDefault();
        dispatch({ type: "op", op: "+" });
      } else if (k === "-" || code === "NumpadSubtract" || code === "Minus") {
        e.preventDefault();
        dispatch({ type: "op", op: "-" });
      } else if (
        k === "*" ||
        k === "x" ||
        k === "X" ||
        code === "NumpadMultiply"
      ) {
        e.preventDefault();
        dispatch({ type: "op", op: "×" });
      } else if (k === "/" || code === "NumpadDivide" || code === "Slash") {
        e.preventDefault();
        dispatch({ type: "op", op: "÷" });
      } else if (k === "Enter" || k === "=" || code === "NumpadEnter") {
        e.preventDefault();
        dispatch({ type: "equals" });
      } else if (k === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        dispatch({ type: "clear" });
      } else if (k === "Backspace") {
        e.preventDefault();
        dispatch({ type: "back" });
      } else if (k === "%") {
        e.preventDefault();
        dispatch({ type: "percent" });
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, minimized]);

  if (!open) return null;

  const closeApp = () => {
    dispatchApp({ type: "apps/CLOSE", payload: "calculator" });
  };

  const clearLabel =
    calc.display === "0" && !calc.op && calc.acc === null ? "AC" : "C";

  const press = (action: Action) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focusCalc();
    dispatch(action);
  };

  const Btn = ({
    label,
    kind,
    action,
  }: {
    label: React.ReactNode;
    kind: "fn" | "num" | "op";
    action: Action;
  }) => (
    <button
      type="button"
      className={`calc-btn calc-${kind}`}
      onClick={press(action)}
      onMouseDown={() => focusCalc()}
    >
      {label}
    </button>
  );

  return (
    <AppWindowShell
      appId="calculator"
      handle=".calc-titlebar"
      defaultPosition={{ x: 280, y: 90 }}
      windowClassName="calculator-window"
      windowId="calculator-window"
    >
      <div
        ref={hitRef}
        className="calculator-hit"
        tabIndex={0}
        onMouseDown={() => focusCalc()}
        onFocus={() =>
          dispatchApp({ type: "onTop/SET", payload: "calculator" })
        }
      >
        <header className="calc-titlebar">
          <TrafficLights appId="calculator" onClose={closeApp} />
        </header>

        <div className="calc-display">
          <div className="calc-expr">{calc.expr || "\u00A0"}</div>
          <div className="calc-value">{calc.display}</div>
        </div>

        <div className="calc-pad">
          <Btn
            label={clearLabel}
            kind="fn"
            action={
              clearLabel === "C" && !calc.fresh
                ? { type: "clear-entry" }
                : { type: "clear" }
            }
          />
          <Btn label="+/−" kind="fn" action={{ type: "neg" }} />
          <Btn label="%" kind="fn" action={{ type: "percent" }} />
          <Btn label="÷" kind="op" action={{ type: "op", op: "÷" }} />

          <Btn label="7" kind="num" action={{ type: "digit", d: "7" }} />
          <Btn label="8" kind="num" action={{ type: "digit", d: "8" }} />
          <Btn label="9" kind="num" action={{ type: "digit", d: "9" }} />
          <Btn label="×" kind="op" action={{ type: "op", op: "×" }} />

          <Btn label="4" kind="num" action={{ type: "digit", d: "4" }} />
          <Btn label="5" kind="num" action={{ type: "digit", d: "5" }} />
          <Btn label="6" kind="num" action={{ type: "digit", d: "6" }} />
          <Btn label="−" kind="op" action={{ type: "op", op: "-" }} />

          <Btn label="1" kind="num" action={{ type: "digit", d: "1" }} />
          <Btn label="2" kind="num" action={{ type: "digit", d: "2" }} />
          <Btn label="3" kind="num" action={{ type: "digit", d: "3" }} />
          <Btn label="+" kind="op" action={{ type: "op", op: "+" }} />

          <Btn
            label={<span className="calc-grid-ico" aria-hidden />}
            kind="num"
            action={{ type: "clear" }}
          />
          <Btn label="0" kind="num" action={{ type: "digit", d: "0" }} />
          <Btn label="," kind="num" action={{ type: "dot" }} />
          <Btn label="=" kind="op" action={{ type: "equals" }} />
        </div>
      </div>
    </AppWindowShell>
  );
}
