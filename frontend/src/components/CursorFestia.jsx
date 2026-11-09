import { useEffect, useRef } from "react";
import "./CursorFestia.css";

export default function CursorFestia() {
  const punto = useRef(null);
  const aro = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.body.classList.add("cursor-festia");

    let x = 0, y = 0, ax = 0, ay = 0, raf;
    const mover = (e) => { x = e.clientX; y = e.clientY; };
    const over = (e) =>
      aro.current?.classList.toggle("grande", !!e.target.closest("a, button, select, label, [role='button']"));

    const loop = () => {
      ax += (x - ax) * 0.18;
      ay += (y - ay) * 0.18;
      if (punto.current) punto.current.style.transform = `translate(${x}px, ${y}px)`;
      if (aro.current) aro.current.style.transform = `translate(${ax}px, ${ay}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseover", over);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseover", over);
      document.body.classList.remove("cursor-festia");
    };
  }, []);

  return (
    <>
      <div ref={aro} className="cf-aro" />
      <div ref={punto} className="cf-punto" />
    </>
  );
}