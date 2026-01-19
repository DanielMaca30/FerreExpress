import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePrefersReducedMotion } from "@chakra-ui/react";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Si hay hash (#seccion), el navegador debe manejar ese scroll
    if (hash) return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [pathname, search, hash, reduceMotion]);

  return null;
}
