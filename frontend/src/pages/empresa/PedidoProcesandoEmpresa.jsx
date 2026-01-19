// src/pages/empresa/PedidoProcesandoEmpresa.jsx
// Procesa pedido y pago de Empresa/Contratista usando el intent en sessionStorage.
// ✅ Pago: se hace en BACKEND (/pagos/simular) para respetar tu pasarela demo.
// ✅ Pedido: si viene de cotización -> /pedidos/desde-cotizacion; si no -> /pedidos/directo.

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
          setTimeout(() => {
            navigate("/empresa/checkout-empresa", { replace: true });
          }, 900);
          return;
        }

        const intent = JSON.parse(raw);

        const isCotizacionFlow =
          intent?.entrega === "COTIZACION" || !!intent?.cotizacion_id;

        const montoTotal =
          Number(intent?.totales?.total ?? intent?.totales?.monto ?? 0) || 0;

        // ----------------------------
        // 1) PASARELA (BACKEND) si es pago en línea
        // ----------------------------
        if (intent.metodo_pago === "PAGO_LINEA") {
          setMsg("Redirigiendo a pasarela de pago…");

          // Validaciones mínimas
          if (!intent.tarjeta) {
            const m = "No se recibió tarjeta para procesar el pago.";
            sessionStorage.setItem("fe_last_payment_error_empresa", m);
            setMsg(m);
            setTimeout(() => {
              navigate(
                isCotizacionFlow && intent.cotizacion_id
                  ? `/empresa/checkout-empresa?cotizacionId=${intent.cotizacion_id}`
                  : "/empresa/checkout-empresa",
                { replace: true }
              );
            }, 900);
            return;
          }

          setMsg("Procesando pago (pasarela demo)…");

          // ✅ Tu backend: último dígito par/aprobado, impar/rechazado
          const payRes = await api.post("/pagos/simular", {
            tarjeta: intent.tarjeta,
            monto: montoTotal,
          });

          const aprobado =
            payRes?.data?.aprobado === true ||
            payRes?.data?.approved === true ||
            payRes?.data?.status === "APPROVED";

          if (!aprobado) {
            const backendMsg =
              payRes?.data?.message ||
              payRes?.data?.error ||
              "Pago rechazado por pasarela (demo).";

            sessionStorage.setItem(
              "fe_last_payment_error_empresa",
              backendMsg
            );

            setMsg("Pago rechazado. No se creó el pedido.");
            setTimeout(() => {
              navigate(
                isCotizacionFlow && intent.cotizacion_id
                  ? `/empresa/checkout-empresa?cotizacionId=${intent.cotizacion_id}`
                  : "/empresa/checkout-empresa",
                { replace: true }
              );
            }, 1200);
            return;
          }
        }

        // ----------------------------
        // 2) CREAR PEDIDO
        // ----------------------------
        setMsg(isCotizacionFlow ? "Convirtiendo cotización a pedido…" : "Creando pedido de empresa…");

        let pedidoId = null;

        if (isCotizacionFlow) {
          if (!intent.cotizacion_id) {
            throw new Error("Falta cotizacion_id para crear pedido desde cotización.");
          }

          // ✅ Usa tu endpoint real
          const res = await api.post("/pedidos/desde-cotizacion", {
            cotizacion_id: Number(intent.cotizacion_id),
            metodo_pago: intent.metodo_pago,  // "PAGO_LINEA" | "CONTRAENTREGA"
            entrega: intent.entrega,                // "TIENDA" | "DOMICILIO"
            nota: intent.nota || null,
            // direccion_id normalmente no aplica en cotización (si aplica en tu lógica, envíala)
            direccion_id: intent.direccion_id ?? null,
          });

          pedidoId = res?.data?.pedido_id || res?.data?.id;
        } else {
          const payload = {
            productos: (intent.items || []).map((it) => ({
              producto_id: it.id,
              cantidad: Math.max(1, Number(it.cantidad) || 1),
            })),
            direccion_id: intent.direccion_id,
            metodo_pago: intent.metodo_pago, // "PAGO_LINEA" | "CONTRAENTREGA"
            entrega: intent.entrega,         // "DOMICILIO" | "TIENDA"
            nota: intent.nota || null,
          };

          const res = await api.post("/pedidos/directo", payload);
          pedidoId = res?.data?.pedido_id || res?.data?.id;
        }

        if (!pedidoId) {
          throw new Error("No se recibió el ID del pedido.");
        }

        // ----------------------------
        // 3) (Opcional) Registrar pago en background (si tienes /pagos)
        // ----------------------------
        if (intent.metodo_pago === "PAGO_LINEA" && intent.tarjeta) {
          api
            .post("/pagos", {
              pedido_id: pedidoId,
              tarjeta: intent.tarjeta,
              monto: montoTotal,
              referencia: isCotizacionFlow ? `COT-${intent.cotizacion_id}` : null,
            })
            .catch((err) => {
              const m =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "No se pudo registrar el pago.";
              // No rompemos el flujo, solo lo guardamos
              sessionStorage.setItem("fe_last_order_error_empresa", m);
              console.warn("Error registrando pago empresa:", m);
            });
        }

        // ----------------------------
        // 4) Snapshot para Resultado
        // ----------------------------
        const orderSnapshot = {
          pedidoId,
          total: intent.totales?.total,
          envio: intent.totales?.envio,
          metodo_pago: intent.metodo_pago,
          entrega: intent.entrega,
          cotizacion_id: intent.cotizacion_id || null,
          tarjeta: intent.tarjeta || "",
          direccion_id: intent.direccion_id,
          fecha: new Date().toISOString(),
          paymentStatus:
            intent.metodo_pago === "PAGO_LINEA" ? "APPROVED" : "SKIPPED",
          paymentError: "",
          items: (intent.items || []).map((it) => ({
            id: it.id,
            nombre: it.nombre,
            cantidad: Math.max(1, Number(it.cantidad) || 1),
            precio_unitario:
              it.precio_oferta ?? it.precio ?? it.precio_unitario ?? 0,
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

        // ✅ Solo vaciar carrito si el pedido fue desde carrito (NO desde cotización)
        if (!isCotizacionFlow) {
          writeCart([]);
        }

        setMsg("¡Listo! Pedido de empresa creado.");
        setTimeout(() => {
          navigate(`/empresa/pedido-resultado?ok=1&pedido=${pedidoId}`, {
            replace: true,
          });
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
          navigate("/empresa/pedido-resultado?ok=0", { replace: true });
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
        <Progress w="320px" size="sm" isIndeterminate colorScheme="yellow" />
      </VStack>
    </Box>
  );
}