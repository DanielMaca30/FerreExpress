// src/pages/cliente/PedidoProcesando.jsx
import { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { writeCart } from "../../utils/cartStore";

export default function PedidoProcesando() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Preparando tu pedido…");
  const muted = useColorModeValue("gray.600", "gray.300");
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

  // Para evitar doble ejecución en StrictMode (solo este guard)
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    (async () => {
      try {
        const raw = sessionStorage.getItem("fe_checkout_intent");
        if (!raw) {
          setMsg("No hay datos para procesar el pedido.");
          setTimeout(
            () => navigate("/cliente/carrito", { replace: true }),
            1000
          );
          return;
        }

        const intent = JSON.parse(raw);

        // ===== 1) Simular pago en el FRONT antes de llamar al backend =====
        if (intent.metodo_pago === "PAGO_LINEA") {
          const lastDigitStr = String(intent.tarjeta || "")
            .replace(/\D+/g, "")
            .slice(-1);
          const lastDigit = lastDigitStr ? parseInt(lastDigitStr, 10) : NaN;
          const aprobado =
            Number.isFinite(lastDigit) && lastDigit % 2 === 0;

          const msgPasarela = aprobado
            ? "Pago aprobado (demo)."
            : "Pago rechazado por pasarela (demo).";

          if (!aprobado) {
            // ❌ NO se crea pedido si el pago es rechazado
            sessionStorage.setItem(
              "fe_last_payment_error",
              msgPasarela
            );
            setMsg("Pago rechazado. No se creó el pedido.");
            setTimeout(() => {
              navigate("/cliente/carrito", { replace: true });
            }, 1500);
            return;
          }
        }

        // ===== 2) Crear pedido (solo si llegamos aquí) =====
        setMsg("Creando pedido…");

        const payload = {
          productos: intent.items.map((it) => ({
            producto_id: it.id,
            cantidad: it.cantidad,
          })),
          direccion_id: intent.direccion_id,
          metodo_pago: intent.metodo_pago, // "PAGO_LINEA" | "CONTRAENTREGA"
          entrega: intent.entrega, // "DOMICILIO" | "TIENDA"
          nota: intent.nota,
        };

        const res = await api.post("/pedidos/directo", payload);
        const pedidoId = res?.data?.pedido_id || res?.data?.id;

        if (!pedidoId) {
          throw new Error("No se recibió el ID del pedido.");
        }

        // ===== 3) Si es PAGO_LINEA, disparar /pagos en background (NO bloquear) =====
        if (intent.metodo_pago === "PAGO_LINEA") {
          api
            .post("/pagos", {
              pedido_id: pedidoId,
              tarjeta: intent.tarjeta,
            })
            .catch((err) => {
              const m =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "No se pudo registrar el pago.";
              sessionStorage.setItem("fe_last_order_error", m);
              console.warn("Error registrando pago:", m);
            });
        }

        // ===== 4) Guardar snapshot para PedidoResultado =====
        const orderSnapshot = {
          pedidoId,
          total: intent.totales?.total,
          envio: intent.totales?.envio,
          metodo_pago: intent.metodo_pago,
          entrega: intent.entrega,
          direccion_id: intent.direccion_id,
          fecha: new Date().toISOString(),
          paymentStatus:
            intent.metodo_pago === "PAGO_LINEA"
              ? "APPROVED"
              : "SKIPPED",
          paymentError: "",
          items: intent.items.map((it) => ({
            id: it.id,
            nombre: it.nombre,
            cantidad: Math.max(1, Number(it.cantidad) || 1),
            precio_unitario: it.precio_oferta ?? it.precio ?? 0,
            imagen_principal: it.imagen_principal || null,
          })),
        };

        sessionStorage.setItem(
          "fe_last_order",
          JSON.stringify(orderSnapshot)
        );
        sessionStorage.removeItem("fe_last_order_error");
        sessionStorage.removeItem("fe_last_payment_error");
        sessionStorage.removeItem("fe_checkout_intent");

        // ===== 5) Vaciar carrito y navegar al resultado OK =====
        writeCart([]);

        setMsg("¡Listo! Pedido creado.");
        setTimeout(() => {
          navigate(
            `/cliente/pedido-resultado?ok=1&pedido=${pedidoId}`,
            { replace: true }
          );
        }, 700);
      } catch (e) {
        const m =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo completar el proceso.";

        sessionStorage.setItem("fe_last_order_error", m);
        setMsg("Ocurrió un error inesperado…");

        setTimeout(() => {
          navigate(`/cliente/pedido-resultado?ok=0`, {
            replace: true,
          });
        }, 700);
      }
    })();
  }, [navigate]);

  return (
    <Box minH="60vh" bg={pageBg} display="grid" placeItems="center" px={6}>
      <VStack spacing={6}>
        <Spinner size="xl" />
        <Heading size="md">Procesando…</Heading>
        <Text color={muted}>{msg}</Text>
        <Progress w="320px" size="sm" isIndeterminate />
      </VStack>
    </Box>
  );
}
