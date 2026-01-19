// src/pages/empresa/CarritoEmpresa.jsx
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
  Link,
  Spacer,
} from "@chakra-ui/react";
import { FiTrash2, FiShoppingBag, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/axiosInstance";

// ✅ SOLO importa, no re-exportes CART_KEY aquí (evita duplicidades raras)
import {
  readCart,
  updateQty as storeUpdateQty,
  removeFromCart as storeRemove,
  clearCart as storeClear,
  effectiveUnitPrice,
  CART_KEY,
} from "../../utils/cartStore";

/* =================== util =================== */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const buildImg = (src) => {
  if (!src) return "https://via.placeholder.com/300x200?text=Sin+Imagen";
  const s = String(src);
  if (s.startsWith("http")) return s;
  // asegura slash
  return `${API_BASE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
};

/* =================== Componente =================== */
export default function CarritoEmpresa() {
  const [items, setItems] = useState(() => readCart());
  const [agree, setAgree] = useState(true);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const cancelRef = useRef(null);

  const toast = useToast();
  const navigate = useNavigate();

  // ======== tokens visuales tipo "Admin" / glass ========
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("rgba(255,255,255,0.96)", "rgba(23,25,35,0.86)");
  const border = useColorModeValue("rgba(226,232,240,0.9)", "rgba(45,55,72,0.7)");
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

  // ✅ Sync: cambios desde otras pestañas o desde el store (eventos)
  useEffect(() => {
    const sync = () => setItems(readCart());

    const onStorage = (e) => {
      if (e.key === CART_KEY) sync();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:changed", sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:changed", sync);
    };
  }, []);

  // ✅ Totales calculados desde items (no dependas del storage para UI)
  const { subtotal, totalItems } = useMemo(() => {
    const subtotalCalc = items.reduce((acc, it) => {
      const qty = Math.max(1, Number(it.cantidad) || 1);
      const unit = effectiveUnitPrice(it);
      return acc + unit * qty;
    }, 0);
    const totalItemsCalc = items.reduce((acc, it) => acc + Math.max(1, Number(it.cantidad) || 1), 0);
    return { subtotal: subtotalCalc, totalItems: totalItemsCalc };
  }, [items]);

  // === Acciones de línea ===
  const changeQty = useCallback((id, qty) => {
    const n = Math.max(1, Math.min(99, Number(qty) || 1));
    storeUpdateQty(id, n);       // store persiste + emite cart:changed
    setItems(readCart());        // refleja inmediatamente
  }, []);

  const askRemove = (id) => setPendingRemove(id);

  const confirmRemove = () => {
    if (pendingRemove == null) return;
    storeRemove(pendingRemove);
    setItems(readCart());
    toast({ title: "Producto eliminado del carrito", status: "info", duration: 1400 });
    setPendingRemove(null);
  };

  const clearAll = () => setConfirmClear(true);

  const doClearAll = () => {
    storeClear();
    setItems(readCart());
    toast({ title: "Carrito vaciado", status: "info", duration: 1400 });
    setConfirmClear(false);
  };

  // ✅ Flujo EMPRESA: ir al checkout
  const goCheckout = () => {
    // cierra modales por si acaso (evita overlays raros)
    setPendingRemove(null);
    setConfirmClear(false);

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

    // ✅ navegación robusta en rutas anidadas
    navigate("../checkout-empresa", { relative: "path" });
  };

  const seguirComprando = () => navigate("/empresa/catalogo");

  // ✅ Atajo real: Alt + P
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        goCheckout();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, agree]);

  return (
    <Box
      px={{ base: 3, md: 6, lg: 10 }}
      py={{ base: 4, md: 6 }}
      bg={pageBg}
      // ✅ espacio extra para barra fija móvil
      pb={{ base: items.length ? 24 : 6, md: 6 }}
      minH="100vh"
    >
      <Heading size="lg" color={title} mb={1}>
        Carrito de empresa
      </Heading>

      <HStack justify="space-between" align="baseline" mb={4} spacing={3}>
        <Text color={muted}>
          Revisa cantidades, elimina productos y continúa para generar tu pedido
          como empresa/contratista.
        </Text>

        <HStack fontSize="sm" color={muted} display={{ base: "none", md: "flex" }}>
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
            minH="44px"
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
                const img = buildImg(it?.imagen_principal);
                const unit = effectiveUnitPrice(it);
                const qty = Math.max(1, Number(it.cantidad) || 1);
                const line = unit * qty;
                const hasOffer = Number(it.precio_oferta) > 0 || Number(it.descuento) > 0;

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
                      flexShrink={0}
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
                    <VStack flex={1} align="stretch" spacing={1} minW={0}>
                      <HStack justify="space-between" align="start" wrap="wrap" gap={2}>
                        <VStack align="start" spacing={0} minW={0}>
                          <Text fontWeight="semibold" noOfLines={2}>
                            {it.nombre}
                          </Text>
                          <HStack spacing={1} flexWrap="wrap">
                            {it.marca && (
                              <Badge colorScheme="purple" variant="subtle">
                                {it.marca}
                              </Badge>
                            )}
                            {it.categoria && (
                              <Badge colorScheme="blue" variant="subtle">
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
                          <HStack spacing={2} align="baseline">
                            <Text fontWeight="bold">{fmtCop(unit)}</Text>
                            {hasOffer && (
                              <Text color={muted} as="s">
                                {fmtCop(it.precio)}
                              </Text>
                            )}
                          </HStack>
                          <Text fontSize="sm" color={muted}>
                            Línea:{" "}
                            <Text as="span" fontWeight="semibold">
                              {fmtCop(line)}
                            </Text>
                          </Text>
                        </VStack>
                      </HStack>

                      {/* qty + eliminar */}
                      <HStack justify="space-between" pt={2} wrap="wrap" gap={2}>
                        <HStack>
                          <Text fontSize="sm" color={muted} id={`qty-${it.id}`}>
                            Cantidad:
                          </Text>
                          <NumberInput
                            aria-labelledby={`qty-${it.id}`}
                            size="sm"
                            value={qty}
                            min={1}
                            max={99}
                            onChange={(_, v) => changeQty(it.id, v)}
                            w="92px"
                          >
                            <NumberInputField minH="36px" />
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
                            minW="44px"
                            minH="44px"
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
                  minW="44px"
                  minH="44px"
                />
              </Tooltip>
              <Text color={muted} fontSize="sm">
                Vaciar carrito
              </Text>
            </HStack>
          </Box>

          {/* Resumen (desktop/tablet) */}
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
            display={{ base: "none", lg: "block" }}
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

            {/* ✅ checkbox + links sin romper el toggle */}
            <Box mt={4}>
              <Checkbox isChecked={agree} onChange={(e) => setAgree(e.target.checked)}>
                Acepto condiciones y privacidad
              </Checkbox>

              <Text fontSize="xs" color={muted} mt={2}>
                Ver{" "}
                <Link
                  color="yellow.500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate("/empresa/condiciones-uso-empresa");
                  }}
                >
                  condiciones de uso
                </Link>{" "}
                y{" "}
                <Link
                  color="yellow.500"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate("/empresa/avisos-privacidad-empresa");
                  }}
                >
                  avisos de privacidad
                </Link>
                .
              </Text>
            </Box>

            <VStack mt={4} spacing={2}>
              <Button
                colorScheme="yellow"
                color="black"
                w="full"
                onClick={goCheckout}
                leftIcon={<FiArrowRight />}
                isDisabled={!items.length || !agree}
                minH="44px"
              >
                Continuar a pagar
              </Button>
              <Button variant="outline" w="full" onClick={seguirComprando} minH="44px">
                Seguir comprando
              </Button>
            </VStack>
          </Box>
        </SimpleGrid>
      )}

      {/* ✅ Barra fija móvil (CTA siempre visible) */}
      {items.length > 0 && (
        <Box
          position="fixed"
          left={0}
          right={0}
          bottom={0}
          zIndex={20}
          display={{ base: "block", lg: "none" }}
          bg={useColorModeValue("rgba(255,255,255,0.92)", "rgba(17,24,39,0.92)")}
          backdropFilter="blur(12px)"
          borderTop="1px solid"
          borderColor={border}
          px={3}
          py={3}
          pb="calc(env(safe-area-inset-bottom) + 12px)"
        >
          <HStack spacing={3} align="center">
            <VStack spacing={0} align="start" minW={0}>
              <Text fontSize="xs" color={muted}>
                {totalItems} ítem{totalItems !== 1 ? "s" : ""}
              </Text>
              <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                Total: {fmtCop(subtotal)}
              </Text>
            </VStack>

            <Spacer />

            <Button
              colorScheme="yellow"
              color="black"
              onClick={goCheckout}
              leftIcon={<FiArrowRight />}
              isDisabled={!agree}
              minH="44px"
            >
              Continuar
            </Button>
          </HStack>

          {!agree && (
            <Text mt={2} fontSize="xs" color="orange.400">
              Acepta condiciones y privacidad para continuar.
            </Text>
          )}
        </Box>
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
