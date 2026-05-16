import React, { createContext, useContext, useState, useEffect } from "react";

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("focus"); // 'focus' or 'break'

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const value = {
    secondsLeft,
    isActive,
    mode,
    start: () => setIsActive(true),
    pause: () => setIsActive(false),
    reset: (mins = 25, newMode = "focus") => {
      setIsActive(false);
      setSecondsLeft(mins * 60);
      setMode(newMode);
    }
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  return useContext(TimerContext);
}