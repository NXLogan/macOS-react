import React, { useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { store } from "../../App";
import "./BootScreen.scss";
import BootSound from "../../assets/audio/bootsound.mp3";

export default function BootScreen() {
  const [state, dispatch] = useContext(store);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      const bootUpWindow = document.getElementById("boot");
      bootUpWindow?.classList.remove("bootup-window");
      bootUpWindow?.classList.add("vanished");
      playSound();
    }, 3350);

    const t2 = window.setTimeout(() => {
      dispatch({
        type: "booting/FINISH",
      });
    }, 4350);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // Boot sequence runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animations = {
    initial: { width: "0px" },
    animate: { width: "166px" },
  };

  let audio = new Audio(BootSound);
  audio.volume = 0.4;

  const playSound = () => {
    if (!state.soundPlayed) {
      dispatch({
        type: "sound/PLAY",
      });

      setTimeout(() => {
        if (document.getElementById("boot") === null) {
          return;
        } else {
          audio.play();
        }
      }, 2200);
    }
  };

  return (
    <div className="bootup-window boot" id="boot" onMouseEnter={playSound}>
      <img
        alt="NXG"
        className="logo"
        src={require("../../assets/images/nxg-boot.png")}
      />
      <div className="boot-brand">NXGos</div>
      <div className="bar-container">
        <div className="bar-background" />
        <motion.div
          className="bar"
          variants={animations}
          initial="initial"
          animate="animate"
          transition={{ ease: "easeInOut", duration: 2.1, delay: 0.4 }}
        />
      </div>
    </div>
  );
}
