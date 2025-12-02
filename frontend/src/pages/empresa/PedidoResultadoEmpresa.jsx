// src/pages/empresa/PedidoResultadoEmpresa.jsx

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

// Formatea a COP
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function PedidoResultadoEmpresa() {
  const [params] = useSearchParams();
  const ok = params.get("ok") === "1";
  const pedido = params.get("pedido");
  const navigate = useNavigate();

  const muted = useColorModeValue("gray.600", "gray.300");
  const cardBg = useColorModeValue("white", "gray.850");
  const border = useColorModeValue("gray.200", "gray.700");
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

  const last = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("fe_last_order_empresa") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const lastErr = useMemo(
    () => sessionStorage.getItem("fe_last_order_error_empresa") || "",
    []
  );

  useEffect(() => {
    if (ok) {
      sessionStorage.removeItem("fe_last_order_error_empresa");
    }

    const t = setTimeout(
      () =>
        navigate(
          pedido
            ? `/empresa/mis-pedidos?pedido=${pedido}`
            : "/empresa/mis-pedidos",
          { replace: true }
        ),
      2500
    );
    return () => clearTimeout(t);
  }, [navigate, pedido, ok]);

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
        boxShadow="xl"
      >
        <HStack justify="space-between">
          <Heading size="md">
            {ok
              ? "¡Pedido de empresa confirmado!"
              : "No se pudo completar"}
          </Heading>
          <Badge
            colorScheme={ok ? "green" : "red"}
            fontSize="0.8em"
            p={1}
            borderRadius="md"
          >
            {ok ? "Éxito" : "Error"}
          </Badge>
        </HStack>

        <Text color={muted}>
          {ok
            ? "Tu pedido de empresa fue creado correctamente. En segundos te llevamos a ‘Mis pedidos de empresa’."
            : lastErr ||
              "Hubo un problema al crear/pagar tu pedido de empresa. Por favor, revisa tus datos o intenta de nuevo."}
        </Text>

        <Divider />

        {/* Ticket / factura minimalista */}
        <VStack align="stretch" spacing={2} fontSize="sm">
          <HStack justify="space-between">
            <Text color={muted}>Pedido</Text>
            <Text fontWeight="semibold" data-testid="order-id">
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
          <HStack justify="space-between" pt={1}>
            <Text fontWeight="bold" fontSize="md">
              Total
            </Text>
            <Text
              fontWeight="extrabold"
              fontSize="md"
              color={ok ? "green.500" : "red.500"}
            >
              {fmtCop(last?.total)}
            </Text>
          </HStack>
        </VStack>

        <Divider />

        <HStack justify="flex-end" pt={2}>
          <Button
            onClick={() =>
              navigate(
                pedido
                  ? `/empresa/mis-pedidos?pedido=${pedido}`
                  : "/empresa/mis-pedidos",
                { replace: true }
              )
            }
            variant="solid"
            colorScheme="yellow"
            color="black"
          >
            Ir a Mis pedidos de empresa
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
