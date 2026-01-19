// src/pages/cliente/Carrito.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { FiTrash2, FiShoppingBag, FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { API_BASE_URL } from "../../utils/axiosInstance";

import {
  readCart,
  updateQty as storeUpdateQty,
  removeFromCart as storeRemove,
  clearCart as storeClear,
  effectiveUnitPrice,
  CART_KEY,
  onCartChanged,
} from "../../utils/cartStore";

/* =================== util =================== */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function Carrito() {
  const [items, setItems] = useState(() => readCart());
  const [agree, setAgree] = useState(true);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const cancelRef = useRef(null);

  const toast = useToast();
  const navigate = useNavigate();

  // ======== tokens visuales ========
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

  // ✅ Sync carrito: (1) mismo tab via onCartChanged, (2) otras pestañas via storage
  useEffect(() => {
    const sync = () => setItems(readCart());

    const off = onCartChanged?.(sync);

    const onStorage = (e) => {
      if (e.key === CART_KEY) sync();
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      off?.();
    };
  }, []);

  // Totales
  const subtotal = useMemo(() => {
    let sum = 0;
    for (const it of items) {
      const unit = effectiveUnitPrice(it);
      const q = Math.max(1, Number(it.cantidad) || 1);
      sum += unit * q;
    }
    return sum;
  }, [items]);

  // === Acciones ===
  const changeQty = useCallback((id, qty) => {
    const n = Math.max(1, Math.min(99, Number(qty) || 1));
    storeUpdateQty(id, n); // store escribe + emite evento
    setItems(readCart());  // refresco inmediato
  }, []);

  const askRemove = (id) => setPendingRemove(id);

  const confirmRemove = () => {
    if (pendingRemove == null) return;
    storeRemove(pendingRemove); // store escribe + emite evento
    setItems(readCart());
    toast({ title: "Producto eliminado", status: "info", duration: 1200 });
    setPendingRemove(null);
  };

  const clearAll = () => setConfirmClear(true);

  const doClearAll = () => {
    storeClear(); // store escribe + emite evento
    setItems(readCart());
    toast({ title: "Carrito vaciado", status: "info", duration: 1200 });
    setConfirmClear(false);
  };

  const goCheckout = () => {
    if (!items.length) {
      return toast({ title: "Tu carrito está vacío", status: "warning", duration: 1500 });
    }
    if (!agree) {
      return toast({ title: "Debes aceptar condiciones y privacidad", status: "warning", duration: 1600 });
    }
    navigate("/cliente/checkout");
  };

  return (
    <Box px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }} bg={pageBg}>
      <Heading size="lg" color={title} mb={1}>
        Tu carrito
      </Heading>

      <HStack justify="space-between" align="baseline" mb={4} flexWrap="wrap" gap={2}>
        <Text color={muted}>Revisa cantidades, elimina productos y continúa al pago.</Text>
        <HStack fontSize="sm" color={muted}>
          <Text>Atajo:</Text>
          <Kbd>Alt</Kbd> + <Kbd>P</Kbd> <Text>para pagar</Text>
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
          <Heading size="md">Tu carrito está vacío</Heading>
          <Text color={muted}>Explora el catálogo y agrega productos para verlos aquí.</Text>

          <Button
            leftIcon={<FiShoppingBag />}
            as={RouterLink}
            to="/cliente"
            colorScheme="yellow"
            color="black"
            type="button"
          >
            Ir al catálogo
          </Button>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={5}>
          {/* Lista */}
          <Box gridColumn={{ lg: "1 / span 2" }}>
            <VStack align="stretch" spacing={3}>
              {items.map((it) => {
                const img = it?.imagen_principal
                  ? `${API_BASE_URL}${it.imagen_principal}`
                  : "https://via.placeholder.com/300x200?text=Sin+Imagen";

                const unit = effectiveUnitPrice(it);
                const q = Math.max(1, Number(it.cantidad) || 1);
                const line = unit * q;
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

                    <VStack flex={1} align="stretch" spacing={1}>
                      <HStack justify="space-between" align="start" wrap="wrap" gap={2}>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">{it.nombre}</Text>
                          <HStack spacing={1} flexWrap="wrap">
                            {it.marca && <Badge colorScheme="purple" variant="subtle">{it.marca}</Badge>}
                            {it.categoria && <Badge colorScheme="blue" variant="subtle">{it.categoria}</Badge>}
                            {hasOffer && <Badge colorScheme="green" variant="solid">Oferta</Badge>}
                          </HStack>
                        </VStack>

                        <VStack spacing={0} align="end">
                          <HStack spacing={2} align="baseline">
                            <Text fontWeight="bold">{fmtCop(unit)}</Text>
                            {hasOffer && <Text color={muted} as="s">{fmtCop(it.precio)}</Text>}
                          </HStack>
                          <Text fontSize="sm" color={muted}>
                            Línea:{" "}
                            <Text as="span" fontWeight="semibold">
                              {fmtCop(line)}
                            </Text>
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack justify="space-between" pt={2} wrap="wrap" gap={2}>
                        <HStack>
                          <Text fontSize="sm" color={muted} id={`qty-${it.id}`}>
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
                            type="button"
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
                  type="button"
                />
              </Tooltip>
              <Text color={muted} fontSize="sm">Vaciar carrito</Text>
            </HStack>
          </Box>

          {/* Resumen */}
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
            <Heading size="md" mb={3}>Resumen</Heading>

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

            <VStack align="stretch" spacing={3} mt={4}>
              <Checkbox
                isChecked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                colorScheme="yellow"
                size="md"
              >
                Acepto las condiciones de uso y avisos de privacidad
              </Checkbox>

              {/* ✅ RUTAS CORRECTAS desde /cliente/carrito */}
              <Text fontSize="sm" color={muted} pl={6}>
                Al continuar, confirmas que has leído y aceptas nuestras{" "}
                <Button
                  as={RouterLink}
                  to="../condiciones-uso-cliente"
                  variant="link"
                  color="blue.600"
                  fontWeight="normal"
                  _hover={{ textDecoration: "underline" }}
                  type="button"
                >
                  condiciones de uso
                </Button>{" "}
                y{" "}
                <Button
                  as={RouterLink}
                  to="../avisos-privacidad-cliente"
                  variant="link"
                  color="blue.600"
                  fontWeight="normal"
                  _hover={{ textDecoration: "underline" }}
                  type="button"
                >
                  avisos de privacidad
                </Button>
                .
              </Text>
            </VStack>

            <VStack mt={4} spacing={2}>
              <Button
                colorScheme="yellow"
                color="black"
                w="full"
                onClick={goCheckout}
                leftIcon={<FiArrowRight />}
                isDisabled={!items.length || !agree}
                type="button"
              >
                Continuar a pagar
              </Button>

              <Button
                variant="outline"
                w="full"
                as={RouterLink}
                to="/cliente"
                type="button"
              >
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
          <AlertDialogBody>¿Deseas eliminar este producto del carrito?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setPendingRemove(null)} type="button">
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmRemove} ml={3} type="button">
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
          <AlertDialogHeader>Vaciar carrito</AlertDialogHeader>
          <AlertDialogBody>Se eliminarán todos los productos. ¿Deseas continuar?</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setConfirmClear(false)} type="button">
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={doClearAll} ml={3} type="button">
              Vaciar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}
