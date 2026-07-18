import React, { useCallback, useContext, useEffect, useState } from "react";
import { store } from "../../App";
import TrafficLights from "../../desktop/WindowChrome/TrafficLights";
import AppWindowShell from "../../desktop/WindowChrome/AppWindowShell";
import {
  applyOp,
  CalcOp,
  formatDisplay,
  parseLocale,
} from "./calculatorMath";
import "./CalculatorApp.scss";

type Op = CalcOp;

export default function CalculatorApp() {
  const [state, dispatch] = useContext(store);
  const open = Boolean(state.openApps?.calculator);

  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);

  const pressDigit = useCallback(
    (d: string) => {
      setDisplay((prev) => {
        if (fresh || prev === "0" || prev === "Erreur") return d;
        if (prev.replace(",", "").replace("-", "").length >= 12) return prev;
        return prev + d;
      });
      setFresh(false);
    },
    [fresh]
  );

  const pressDot = useCallback(() => {
    setDisplay((prev) => {
      if (fresh || prev === "Erreur") return "0,";
      if (prev.includes(",")) return prev;
      return `${prev},`;
    });
    setFresh(false);
  }, [fresh]);

  const applyOperator = (a: number, b: number, operator: Op): number =>
    applyOp(a, b, operator);

  const pressOp = useCallback(
    (next: Op) => {
      const cur = parseLocale(display);
      if (acc !== null && op && !fresh) {
        const result = applyOperator(acc, cur, op);
        setAcc(result);
        setDisplay(formatDisplay(result));
        setExpr(`${formatDisplay(result)}${next}`);
      } else {
        setAcc(cur);
        setExpr(`${formatDisplay(cur)}${next}`);
      }
      setOp(next);
      setFresh(true);
    },
    [acc, display, fresh, op]
  );

  const pressEquals = useCallback(() => {
    if (acc === null || !op) return;
    const cur = parseLocale(display);
    const result = applyOperator(acc, cur, op);
    setExpr(`${formatDisplay(acc)}${op}${formatDisplay(cur)}`);
    setDisplay(formatDisplay(result));
    setAcc(null);
    setOp(null);
    setFresh(true);
  }, [acc, display, op]);

  const pressClear = useCallback(() => {
    setDisplay("0");
    setExpr("");
    setAcc(null);
    setOp(null);
    setFresh(true);
  }, []);

  const pressNeg = useCallback(() => {
    setDisplay((prev) => {
      if (prev === "0" || prev === "Erreur") return prev;
      if (prev.startsWith("-")) return prev.slice(1);
      return `-${prev}`;
    });
    setFresh(false);
  }, []);

  const pressPercent = useCallback(() => {
    setDisplay((prev) => formatDisplay(parseLocale(prev) / 100));
    setFresh(true);
  }, []);

  const pressBack = useCallback(() => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === "Erreur") return "0";
      return prev.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (state.onTop !== "calculator") return;
      const k = e.key;
      if (k >= "0" && k <= "9") pressDigit(k);
      else if (k === "." || k === ",") pressDot();
      else if (k === "+") pressOp("+");
      else if (k === "-") pressOp("-");
      else if (k === "*" || k === "x") pressOp("×");
      else if (k === "/") pressOp("÷");
      else if (k === "Enter" || k === "=") {
        e.preventDefault();
        pressEquals();
      } else if (k === "Escape") pressClear();
      else if (k === "Backspace") pressBack();
      else if (k === "%") pressPercent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    open,
    state.onTop,
    pressDigit,
    pressDot,
    pressOp,
    pressEquals,
    pressClear,
    pressBack,
    pressPercent,
  ]);

  if (!open) return null;

  const closeApp = () => {
    dispatch({ type: "apps/CLOSE", payload: "calculator" });
  };

  const clearLabel = display === "0" && !op && acc === null ? "AC" : "C";

  const Btn = ({
    label,
    kind,
    onClick,
  }: {
    label: React.ReactNode;
    kind: "fn" | "num" | "op";
    onClick: () => void;
  }) => (
    <button
      type="button"
      className={`calc-btn calc-${kind}`}
      onClick={onClick}
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
        className="calculator-hit"
        onMouseDown={() =>
          dispatch({ type: "onTop/SET", payload: "calculator" })
        }
      >
        <header className="calc-titlebar">
          <TrafficLights appId="calculator" onClose={closeApp} />
        </header>

        <div className="calc-display">
          <div className="calc-expr">{expr || "\u00A0"}</div>
          <div className="calc-value">{display}</div>
        </div>

        <div className="calc-pad">
          <Btn
            label={clearLabel}
            kind="fn"
            onClick={() => {
              if (clearLabel === "C" && !fresh) {
                setDisplay("0");
                setFresh(true);
              } else pressClear();
            }}
          />
          <Btn label="+/−" kind="fn" onClick={pressNeg} />
          <Btn label="%" kind="fn" onClick={pressPercent} />
          <Btn label="÷" kind="op" onClick={() => pressOp("÷")} />

          <Btn label="7" kind="num" onClick={() => pressDigit("7")} />
          <Btn label="8" kind="num" onClick={() => pressDigit("8")} />
          <Btn label="9" kind="num" onClick={() => pressDigit("9")} />
          <Btn label="×" kind="op" onClick={() => pressOp("×")} />

          <Btn label="4" kind="num" onClick={() => pressDigit("4")} />
          <Btn label="5" kind="num" onClick={() => pressDigit("5")} />
          <Btn label="6" kind="num" onClick={() => pressDigit("6")} />
          <Btn label="−" kind="op" onClick={() => pressOp("-")} />

          <Btn label="1" kind="num" onClick={() => pressDigit("1")} />
          <Btn label="2" kind="num" onClick={() => pressDigit("2")} />
          <Btn label="3" kind="num" onClick={() => pressDigit("3")} />
          <Btn label="+" kind="op" onClick={() => pressOp("+")} />

          <Btn
            label={<span className="calc-grid-ico" aria-hidden />}
            kind="num"
            onClick={pressClear}
          />
          <Btn label="0" kind="num" onClick={() => pressDigit("0")} />
          <Btn label="," kind="num" onClick={pressDot} />
          <Btn label="=" kind="op" onClick={pressEquals} />
        </div>
      </div>
    </AppWindowShell>
  );
}
