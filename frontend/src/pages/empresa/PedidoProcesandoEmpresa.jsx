// src/pages/empresa/PedidoProcesandoEmpresa.jsx
// Procesa pedido y pago de Empresa/Contratista usando el intent en sessionStorage.
// Simulación: último dígito de la tarjeta par = aprobado, impar = rechazado.

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Progress,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { writeCart } from "../../utils/cartStore";

export default function PedidoProcesandoEmpresa() {
  const navigate = useNavigate();
  const toast = useToast();

  const [msg, setMsg] = useState("Preparando tu pedido para la empresa…");
  const muted = useColorModeValue("gray.600", "gray.300");
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

  // Evitar doble ejecución en StrictMode
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    (async () => {
      try {
        const raw = sessionStorage.getItem("fe_checkout_intent_empresa");
        if (!raw) {
          setMsg("No hay datos para procesar el pedido de empresa.");
          setTimeout(
            () =>
              navigate("/empresa/carrito-empresa", {
                replace: true,
              }),
            1000
          );
          return;
        }

        const intent = JSON.parse(raw);

        // 1) Simular pago en el FRONT si es PAGO_LINEA (tarjeta)
        if (intent.metodo_pago === "PAGO_LINEA") {
          const lastDigitStr = String(intent.tarjeta || "")
            .replace(/\D+/g, "")
            .slice(-1);
          const lastDigit = lastDigitStr
            ? parseInt(lastDigitStr, 10)
            : NaN;
          const aprobado =
            Number.isFinite(lastDigit) && lastDigit % 2 === 0;

          const msgPasarela = aprobado
            ? "Pago aprobado (demo)."
            : "Pago rechazado por pasarela (demo).";

          if (!aprobado) {
            sessionStorage.setItem(
              "fe_last_payment_error_empresa",
              msgPasarela
            );
            setMsg("Pago rechazado. No se creó el pedido.");
            setTimeout(() => {
              navigate("/empresa/carrito-empresa", {
                replace: true,
              });
            }, 1500);
            return;
          }
        }

        // 2) Crear pedido (solo si llegamos aquí)
        setMsg("Creando pedido de empresa…");

        const payload = {
          productos: (intent.items || []).map((it) => ({
            producto_id: it.id,
            cantidad: Math.max(1, Number(it.cantidad) || 1),
          })),
          direccion_id: intent.direccion_id,
          metodo_pago: intent.metodo_pago, // "PAGO_LINEA" | "CONTRAENTREGA"
          entrega: intent.entrega, // "DOMICILIO" | "TIENDA" | "COTIZACION"
          nota: intent.nota || null,
        };

        const res = await api.post("/pedidos/directo", payload);
        const pedidoId = res?.data?.pedido_id || res?.data?.id;
        if (!pedidoId) {
          throw new Error("No se recibió el ID del pedido.");
        }

        // 3) Si es pago en línea, registrar /pagos en background (no bloquea)
        if (intent.metodo_pago === "PAGO_LINEA" && intent.tarjeta) {
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
              sessionStorage.setItem(
                "fe_last_order_error_empresa",
                m
              );
              console.warn("Error registrando pago empresa:", m);
            });
        }

        // 4) Guardar snapshot para PedidoResultadoEmpresa
        const orderSnapshot = {
          pedidoId,
          total: intent.totales?.total,
          envio: intent.totales?.envio,
          metodo_pago: intent.metodo_pago,
          entrega: intent.entrega,
          tarjeta: intent.tarjeta || "",
          direccion_id: intent.direccion_id,
          fecha: new Date().toISOString(),
          paymentStatus:
            intent.metodo_pago === "PAGO_LINEA"
              ? "APPROVED"
              : "SKIPPED",
          paymentError: "",
          items: (intent.items || []).map((it) => ({
            id: it.id,
            nombre: it.nombre,
            cantidad: Math.max(1, Number(it.cantidad) || 1),
            precio_unitario:
              it.precio_oferta ??
              it.precio ??
              it.precio_unitario ??
              0,
            imagen_principal: it.imagen_principal || null,
          })),
        };

        sessionStorage.setItem(
          "fe_last_order_empresa",
          JSON.stringify(orderSnapshot)
        );
        sessionStorage.removeItem("fe_last_order_error_empresa");
        sessionStorage.removeItem("fe_last_payment_error_empresa");
        sessionStorage.removeItem("fe_checkout_intent_empresa");

        // Vaciar carrito de empresa (usa el mismo cartStore que cliente)
        writeCart([]);

        setMsg("¡Listo! Pedido de empresa creado.");
        setTimeout(() => {
          navigate(
            `/empresa/pedido-resultado?ok=1&pedido=${pedidoId}`,
            { replace: true }
          );
        }, 700);
      } catch (e) {
        console.error("Error en PedidoProcesandoEmpresa:", e);
        const m =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo completar el proceso.";

        sessionStorage.setItem("fe_last_order_error_empresa", m);

        toast({
          title: "Proceso interrumpido",
          description: m,
          status: "error",
          duration: 4000,
          isClosable: true,
        });

        setMsg("Ocurrió un error inesperado…");
        setTimeout(() => {
          navigate("/empresa/pedido-resultado?ok=0", {
            replace: true,
          });
        }, 700);
      }
    })();
  }, [navigate, toast]);

  return (
    <Box minH="60vh" bg={pageBg} display="grid" placeItems="center" px={6}>
      <VStack spacing={6}>
        <Spinner size="xl" />
        <Heading size="md">Procesando pedido de empresa…</Heading>
        <Text color={muted}>{msg}</Text>
        <Progress
          w="320px"
          size="sm"
          isIndeterminate
          colorScheme="yellow"
        />
      </VStack>
    </Box>
  );
}
