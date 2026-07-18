import React, { useCallback, useContext, useEffect, useReducer } from "react";
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

  const focusCalc = useCallback(() => {
    dispatchApp({ type: "onTop/SET", payload: "calculator" });
  }, [dispatchApp]);

  useEffect(() => {
    if (!open || minimized) return;
    const onKey = (e: KeyboardEvent) => {
      if (appState.onTop !== "calculator") return;
      const k = e.key;
      if (k >= "0" && k <= "9") {
        e.preventDefault();
        dispatch({ type: "digit", d: k });
      } else if (k === "." || k === ",") {
        e.preventDefault();
        dispatch({ type: "dot" });
      } else if (k === "+") {
        e.preventDefault();
        dispatch({ type: "op", op: "+" });
      } else if (k === "-") {
        e.preventDefault();
        dispatch({ type: "op", op: "-" });
      } else if (k === "*" || k === "x" || k === "X") {
        e.preventDefault();
        dispatch({ type: "op", op: "×" });
      } else if (k === "/") {
        e.preventDefault();
        dispatch({ type: "op", op: "÷" });
      } else if (k === "Enter" || k === "=") {
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
  }, [open, minimized, appState.onTop]);

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
      <div className="calculator-hit" onMouseDown={() => focusCalc()}>
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
