import React, { FormEvent, useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { store } from "../../App";
import getDate from "../../utils/helpers/getDate";
import "./LockScreen.scss";

export default function LockScreen() {
  const [state, dispatch] = useContext(store);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [touchBusy, setTouchBusy] = useState(false);
  const [clock, setClock] = useState(getDate());
  const lockMethod = state.settings?.prefs?.lockMethod || "password";
  const showPreview = state.settings?.prefs?.lockScreenPreview !== false;

  useEffect(() => {
    const id = window.setInterval(() => setClock(getDate()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const unlock = () => {
    if (password === state.user.password) {
      setError(false);
      dispatch({ type: "auth/UNLOCK" });
      return;
    }
    setError(true);
    setPassword("");
    window.setTimeout(() => setError(false), 500);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    unlock();
  };

  const fakeTouchId = () => {
    setTouchBusy(true);
    window.setTimeout(() => {
      setTouchBusy(false);
      dispatch({ type: "auth/UNLOCK" });
    }, 900);
  };

  return (
    <motion.div
      className="lock-screen"
      initial={{ opacity: 0, scale: 1, filter: "blur(0px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        scale: 1.12,
        filter: "blur(24px)",
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
      }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="lock-top">
        <span className="lock-clock">
          {clock[0]} · {clock[1]}
        </span>
        {showPreview && state.settings?.prefs?.notifications ? (
          <div className="lock-preview">
            {state.settings.prefs.notifications.sms
              ? "1 nouveau message"
              : "Aucune notification"}
          </div>
        ) : null}
      </div>

      <motion.form
        className={`lock-panel ${error ? "shake" : ""}`}
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="lock-avatar">
          {state.user.avatar ? (
            <img src={state.user.avatar} alt="" />
          ) : (
            <img
              src={require("../../assets/images/nxg-logo.png")}
              alt="NXG"
            />
          )}
        </div>

        <h1 className="lock-user">{state.user.name}</h1>

        {lockMethod === "touchid" ? (
          <button
            type="button"
            className={`lock-touchid ${touchBusy ? "busy" : ""}`}
            onClick={fakeTouchId}
          >
            {touchBusy ? "Authentification…" : "Touch ID"}
          </button>
        ) : (
          <>
            <div className="lock-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="lock-icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
              <button
                type="submit"
                className="lock-icon-btn submit"
                aria-label="Unlock"
              >
                ↵
              </button>
            </div>
            <p className="lock-hint">Entrez le mot de passe pour déverrouiller</p>
          </>
        )}
      </motion.form>
    </motion.div>
  );
}
