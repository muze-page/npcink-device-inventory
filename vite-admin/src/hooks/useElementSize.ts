import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

type ElementSize = {
  width: number;
  height: number;
};

export const useElementSize = <T extends HTMLElement>(
  ref: RefObject<T>
): ElementSize => {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
};
