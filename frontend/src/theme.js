// src/theme.js
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  breakpoints: {
    base: "0px",    // móvil pequeño
    sm: "480px",    // móvil grande
    md: "768px",    // tablet
    lg: "960px",    // laptop (cubre 1366px con zoom hasta ~140%)
    lmd: "1200px",  // laptop grande / desktop pequeño
    xl: "1440px",   // desktop estándar
    "2xl": "1920px", // desktop grande
  },

  colors: {
    brandYellow: {
      50: "#fff9e6",
      100: "#fff1b8",
      200: "#ffe680",
      300: "#ffda47",
      400: "#ffce1f",
      500: "#f7b500",
      600: "#d19800",
      700: "#a37300",
      800: "#705000",
      900: "#3e2c00",
    },
    brandGray: {
      50: "#f9fafb",
      100: "#f2f4f7",
      200: "#e4e7ec",
      300: "#d0d5dd",
      400: "#98a2b3",
      500: "#667085",
      600: "#475467",
      700: "#344054",
      800: "#1d2939",
      900: "#0f1728",
    },
    brandBlack: "#0f1117",
  },

  // ✅ así es como va
  fonts: {
    heading:
      "Inter, Poppins, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    body:
      "Inter, Poppins, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },

  shadows: {
    outline: "0 0 0 3px rgba(247,181,0,0.45)",
    card: "0 4px 12px rgba(0,0,0,0.08)",
  },

  radii: {
    none: "0",
    sm: "6px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "28px",
  },

  components: {
    Button: {
      baseStyle: {
        _focusVisible: {
          boxShadow: "0 0 0 3px rgba(247,181,0,0.45)",
        },
      },
      variants: {
        solid: {
          bg: "brandYellow.500",
          color: "black",
          _hover: { bg: "brandYellow.400" },
          _active: { bg: "brandYellow.600" },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          _focusVisible: {
            boxShadow: "0 0 0 3px rgba(247,181,0,0.35)",
            borderColor: "brandYellow.500",
          },
        },
      },
    },
    Link: {
      baseStyle: {
        color: "blue.400",
        textDecoration: "underline",
        _hover: { textDecoration: "underline", color: "blue.500" },
      },
    },
    Container: {
      baseStyle: {
        maxW: "8xl",
        px: { base: 4, md: 8, lmd: 10 },
      },
    },
  },

  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
});

export default theme;
