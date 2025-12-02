// src/pages/empresa/CarritoEmpresa.jsx
// Carrito para Empresas / Contratistas
// Misma vista que el carrito de Cliente, pero orientado a pedido normal
// (lleva a /empresa/checkout, NO crea cotización aquí).

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Image,
  Button,
  IconButton,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  Checkbox,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Tooltip,
  Kbd,
} from "@chakra-ui/react";
import {
  FiTrash2,
  FiShoppingBag,
  FiArrowRight,
  FiRefreshCw,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/axiosInstance";

export { CART_KEY } from "../../utils/cartStore";

// ---- usa TU store central para sincronizar contador/animación en la navbar ----
import {
  readCart,
  writeCart,
  updateQty as storeUpdateQty,
  removeFromCart as storeRemove,
  clearCart as storeClear,
  effectiveUnitPrice,
  cartTotals,
  CART_KEY,
} from "../../utils/cartStore";

/* =================== util =================== */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

/* =================== Componente =================== */
export default function CarritoEmpresa() {
  const [items, setItems] = useState(() => readCart());
  const [agree, setAgree] = useState(true);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const cancelRef = useRef();

  const toast = useToast();
  const navigate = useNavigate();

  // ======== tokens visuales tipo "Admin" / glass ========
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue(
    "rgba(255,255,255,0.96)",
    "rgba(23,25,35,0.86)"
  );
  const border = useColorModeValue(
    "rgba(226,232,240,0.9)",
    "rgba(45,55,72,0.7)"
  );
  const muted = useColorModeValue("gray.600", "gray.300");
  const title = useColorModeValue("gray.900", "gray.100");
  const shadowSm = useColorModeValue(
    "0 6px 18px rgba(31,38,135,0.10)",
    "0 6px 18px rgba(0,0,0,0.35)"
  );
  const shadowLg = useColorModeValue(
    "0 10px 30px rgba(31,38,135,0.15)",
    "0 10px 30px rgba(0,0,0,0.45)"
  );

  // ======== sincroniza con cambios del carrito (misma pestaña u otras) ========
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CART_KEY) setItems(readCart());
    };
    const onCustom = () => setItems(readCart());
    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:changed", onCustom);
    };
  }, []);

  // Guarda en LS y emite evento en cada cambio local
  useEffect(() => {
    writeCart(items, { lastAction: "empresa:carrito:set" });
  }, [items]);

  // Totales (usa la misma lógica de store → coherencia)
  const { subtotal } = useMemo(() => cartTotals(), [items]);

  // === Acciones de línea ===
  const changeQty = (id, qty) => {
    const n = Math.max(1, Math.min(99, Number(qty) || 1));
    storeUpdateQty(id, n); // esto ya emite cart:changed
    setItems(readCart());
  };

  const askRemove = (id) => setPendingRemove(id);
  const confirmRemove = () => {
    if (pendingRemove == null) return;
    storeRemove(pendingRemove);
    setItems(readCart());
    toast({
      title: "Producto eliminado del carrito",
      status: "info",
      duration: 1400,
    });
    setPendingRemove(null);
  };

  const clearAll = () => setConfirmClear(true);
  const doClearAll = () => {
    storeClear();
    setItems(readCart());
    toast({ title: "Carrito vaciado", status: "info", duration: 1400 });
    setConfirmClear(false);
  };

  // === Flujo EMPRESA: ir al checkout de pedido normal ===
  const goCheckout = () => {
    if (!items.length) {
      return toast({
        title: "Tu carrito está vacío",
        description: "Agrega productos desde el catálogo de empresa.",
        status: "warning",
        duration: 1800,
      });
    }
    if (!agree) {
      return toast({
        title: "Debes aceptar condiciones y privacidad",
        status: "warning",
        duration: 2000,
      });
    }
    navigate("/empresa/checkout-empresa");
  };

  const seguirComprando = () => {
    // puedes cambiar a "/empresa" si prefieres el dashboard
    navigate("/empresa/catalogo");
  };

  return (
    <Box px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }} bg={pageBg}>
      <Heading size="lg" color={title} mb={1}>
        Carrito de empresa
      </Heading>
      <HStack justify="space-between" align="baseline" mb={4} spacing={3}>
        <Text color={muted}>
          Revisa cantidades, elimina productos y continúa para generar tu
          pedido como empresa/contratista.
        </Text>
        <HStack
          fontSize="sm"
          color={muted}
          display={{ base: "none", md: "flex" }}
        >
          <Text>Atajo:</Text>
          <Kbd>Alt</Kbd> + <Kbd>P</Kbd>
          <Text>para pagar</Text>
        </HStack>
      </HStack>

      {items.length === 0 ? (
        <VStack
          bg={cardBg}
          border="1px solid"
          borderColor={border}
          borderRadius="2xl"
          p={8}
          spacing={3}
          boxShadow={shadowLg}
          sx={{ backdropFilter: "saturate(140%) blur(8px)" }}
        >
          <Image
            src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
            alt=""
            boxSize="72px"
            opacity={0.9}
          />
          <Heading size="md">Tu carrito de empresa está vacío</Heading>
          <Text color={muted} textAlign="center">
            Explora el catálogo de FerreExpress para empresas y agrega materiales
            para tu próximo pedido.
          </Text>
          <Button
            leftIcon={<FiShoppingBag />}
            onClick={() => navigate("/empresa/catalogo")}
            colorScheme="yellow"
            color="black"
          >
            Ir al catálogo de empresa
          </Button>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5}>
          {/* Lista de items */}
          <Box gridColumn={{ lg: "1 / span 2" }}>
            <VStack align="stretch" spacing={3}>
              {items.map((it) => {
                const img = it?.imagen_principal
                  ? `${API_BASE_URL}${it.imagen_principal}`
                  : "https://via.placeholder.com/300x200?text=Sin+Imagen";
                const unit = effectiveUnitPrice(it);
                const line =
                  unit * Math.max(1, Number(it.cantidad) || 1);
                const hasOffer =
                  Number(it.precio_oferta) > 0 ||
                  Number(it.descuento) > 0;
                return (
                  <HStack
                    key={it.id}
                    bg={cardBg}
                    border="1px solid"
                    borderColor={border}
                    borderRadius="xl"
                    p={3}
                    align="stretch"
                    spacing={3}
                    boxShadow={shadowSm}
                    sx={{ backdropFilter: "saturate(140%) blur(6px)" }}
                  >
                    {/* imagen */}
                    <Box
                      w="96px"
                      h="96px"
                      bg="white"
                      border="1px solid"
                      borderColor={border}
                      borderRadius="lg"
                      display="grid"
                      placeItems="center"
                      overflow="hidden"
                    >
                      <Image
                        src={img}
                        alt={it.nombre}
                        maxW="100%"
                        maxH="100%"
                        objectFit="contain"
                        loading="lazy"
                      />
                    </Box>

                    {/* info */}
                    <VStack flex={1} align="stretch" spacing={1}>
                      <HStack
                        justify="space-between"
                        align="start"
                        wrap="wrap"
                        gap={2}
                      >
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{it.nombre}</Text>
                          <HStack spacing={1} flexWrap="wrap">
                            {it.marca && (
                              <Badge
                                colorScheme="purple"
                                variant="subtle"
                              >
                                {it.marca}
                              </Badge>
                            )}
                            {it.categoria && (
                              <Badge
                                colorScheme="blue"
                                variant="subtle"
                              >
                                {it.categoria}
                              </Badge>
                            )}
                            {hasOffer && (
                              <Badge colorScheme="green" variant="solid">
                                Oferta
                              </Badge>
                            )}
                          </HStack>
                        </VStack>

                        <VStack spacing={0} align="end">
                          {/* precio unitario (con oferta si aplica) */}
                          <HStack spacing={2} align="baseline">
                            <Text fontWeight="bold">
                              {fmtCop(unit)}
                            </Text>
                            {hasOffer && (
                              <Text color={muted} as="s">
                                {fmtCop(it.precio)}
                              </Text>
                            )}
                          </HStack>
                          {/* total de línea */}
                          <Text fontSize="sm" color={muted}>
                            Línea:{" "}
                            <Text as="span" fontWeight="semibold">
                              {fmtCop(line)}
                            </Text>
                          </Text>
                        </VStack>
                      </HStack>

                      {/* qty + eliminar */}
                      <HStack
                        justify="space-between"
                        pt={2}
                        wrap="wrap"
                        gap={2}
                      >
                        <HStack>
                          <Text
                            fontSize="sm"
                            color={muted}
                            id={`qty-${it.id}`}
                          >
                            Cantidad:
                          </Text>
                          <NumberInput
                            aria-labelledby={`qty-${it.id}`}
                            size="sm"
                            value={it.cantidad}
                            min={1}
                            max={99}
                            onChange={(_, v) => changeQty(it.id, v)}
                            w="92px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </HStack>

                        <Tooltip label="Eliminar producto" hasArrow>
                          <IconButton
                            aria-label={`Eliminar ${it.nombre}`}
                            icon={<FiTrash2 />}
                            variant="ghost"
                            onClick={() => askRemove(it.id)}
                          />
                        </Tooltip>
                      </HStack>
                    </VStack>
                  </HStack>
                );
              })}
            </VStack>

            <HStack mt={4} spacing={2}>
              <Tooltip label="Vaciar carrito" hasArrow>
                <IconButton
                  aria-label="Vaciar carrito"
                  icon={<FiRefreshCw />}
                  variant="ghost"
                  onClick={clearAll}
                />
              </Tooltip>
              <Text color={muted} fontSize="sm">
                Vaciar carrito
              </Text>
            </HStack>
          </Box>

          {/* Resumen + acción principal: ir al CHECKOUT EMPRESA */}
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            borderRadius="2xl"
            p={4}
            position={{ lg: "sticky" }}
            top={{ lg: 16 }}
            alignSelf="start"
            boxShadow={shadowLg}
            sx={{ backdropFilter: "saturate(140%) blur(8px)" }}
          >
            <Heading size="md" mb={3}>
              Resumen
            </Heading>

            <VStack align="stretch" spacing={2} fontSize="sm">
              <HStack justify="space-between">
                <Text color={muted}>Subtotal</Text>
                <Text>{fmtCop(subtotal)}</Text>
              </HStack>

              <HStack justify="space-between">
                <Text color={muted}>Envío</Text>
                <Text color={muted}>Se calcula en el checkout</Text>
              </HStack>

              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="bold">Total</Text>
                <Text fontWeight="bold">{fmtCop(subtotal)}</Text>
              </HStack>
            </VStack>

            <Checkbox
              mt={4}
              isChecked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            >
              Acepto las{" "}
              <Button
                variant="link"
                onClick={() => navigate("/condiciones-uso")}
              >
                condiciones de uso
              </Button>{" "}
              y los{" "}
              <Button
                variant="link"
                onClick={() => navigate("/avisos-privacidad")}
              >
                avisos de privacidad
              </Button>{" "}
              para pedidos de mi empresa.
            </Checkbox>

            <VStack mt={4} spacing={2}>
              <Button
                colorScheme="yellow"
                color="black"
                w="full"
                onClick={goCheckout}
                leftIcon={<FiArrowRight />}
                isDisabled={!items.length || !agree}
              >
                Continuar a pagar
              </Button>
              <Button variant="outline" w="full" onClick={seguirComprando}>
                Seguir comprando
              </Button>
            </VStack>
          </Box>
        </SimpleGrid>
      )}

      {/* Dialog: eliminar item */}
      <AlertDialog
        isOpen={pendingRemove != null}
        onClose={() => setPendingRemove(null)}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Eliminar producto</AlertDialogHeader>
          <AlertDialogBody>
            ¿Deseas eliminar este producto del carrito de empresa?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setPendingRemove(null)}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmRemove} ml={3}>
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: vaciar carrito */}
      <AlertDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Vaciar carrito de empresa</AlertDialogHeader>
          <AlertDialogBody>
            Se eliminarán todos los productos del carrito. ¿Deseas continuar?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setConfirmClear(false)}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={doClearAll} ml={3}>
              Vaciar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}
