import { useState, useEffect } from "react";

function useWindowSize() {
  const isClient = typeof window !== "undefined";
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>(() => ({
    width: isClient ? window.innerWidth : -1,
    height: isClient ? window.innerHeight : -1,
  }));

  useEffect(() => {
    if (!isClient) return;

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  return windowSize;
}

export default useWindowSize;
