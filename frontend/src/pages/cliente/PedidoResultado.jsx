// src/pages/cliente/PedidoResultado.jsx
import { useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function PedidoResultado() {
  const [params] = useSearchParams();
  const ok = params.get("ok") === "1"; // viene de PedidoProcesando
  const pedido = params.get("pedido");
  const navigate = useNavigate();
  const muted = useColorModeValue("gray.600", "gray.300");
  const cardBg = useColorModeValue("white", "gray.850");
  const border = useColorModeValue("gray.200", "gray.700");
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

  const last = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("fe_last_order") || "{}");
    } catch {
      return {};
    }
  }, []);

  const lastErr = useMemo(
    () => sessionStorage.getItem("fe_last_order_error") || "",
    []
  );

  // Título según caso
  const title = useMemo(() => {
    if (ok) return "¡Pedido confirmado!";
    if (last?.paymentStatus === "REJECTED") return "Pago rechazado";
    return "No se pudo completar";
  }, [ok, last]);

  // Mensaje principal según caso
  const mainMessage = useMemo(() => {
    if (ok) {
      if (last?.metodo_pago === "CONTRAENTREGA") {
        return "Tu pedido fue creado correctamente. Pagas al momento de recibir o retirar.";
      }
      if (last?.paymentStatus === "APPROVED") {
        return "Tu pedido fue creado y el pago en línea fue aprobado.";
      }
      return "Tu pedido fue creado correctamente.";
    }

    // ok === false
    if (last?.paymentStatus === "REJECTED") {
      return (
        last?.paymentError ||
        "Tu pedido quedó creado, pero el pago en línea fue rechazado. Puedes intentar nuevamente desde ‘Mis pedidos’."
      );
    }

    return lastErr || "Hubo un problema al crear/pagar tu pedido.";
  }, [ok, last, lastErr]);

  useEffect(() => {
    // Auto-redirige a Mis pedidos después de unos segundos
    const t = setTimeout(
      () => navigate("/cliente/pedidos", { replace: true }),
      2500
    );
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <Box
      minH="60vh"
      bg={pageBg}
      display="grid"
      placeItems="center"
      px={4}
      py={8}
    >
      <VStack
        spacing={4}
        align="stretch"
        border="1px solid"
        borderColor={border}
        bg={cardBg}
        borderRadius="lg"
        p={{ base: 4, md: 6 }}
        w={{ base: "100%", sm: "520px" }}
      >
        <HStack justify="space-between">
          <Heading size="md">{title}</Heading>
          <Badge colorScheme={ok ? "green" : "red"}>
            {ok ? "Éxito" : "Atención"}
          </Badge>
        </HStack>

        <Text color={muted}>{mainMessage}</Text>

        <Divider />

        {/* “Ticket / factura” minimalista */}
        <VStack align="stretch" spacing={2} fontSize="sm">
          <HStack justify="space-between">
            <Text color={muted}>Pedido</Text>
            <Text fontWeight="semibold">
              #{pedido || last?.pedidoId || "—"}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text color={muted}>Método</Text>
            <Text>{last?.metodo_pago || "—"}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color={muted}>Entrega</Text>
            <Text>{last?.entrega || "—"}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color={muted}>Envío</Text>
            <Text>{fmtCop(last?.envio)}</Text>
          </HStack>
          <Divider />
          <HStack justify="space-between">
            <Text fontWeight="bold">Total</Text>
            <Text fontWeight="bold">{fmtCop(last?.total)}</Text>
          </HStack>
        </VStack>

        <Divider />

        <HStack justify="flex-end" pt={2}>
          <Button
            onClick={() => navigate("/cliente/pedidos", { replace: true })}
            variant="outline"
          >
            Ir a Mis pedidos
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
