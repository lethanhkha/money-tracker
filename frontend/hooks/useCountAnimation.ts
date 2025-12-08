import { useEffect, useState } from "react";

export function useCountAnimation(
  end: number,
  duration: number = 800,
  start: number = 0
) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (end === start) {
      setCount(end);
      return;
    }

    const startTime = Date.now();
    const difference = end - start;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = start + difference * easeOutQuad(progress);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    const timer = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(timer);
  }, [end, duration, start]);

  return Math.round(count);
}
