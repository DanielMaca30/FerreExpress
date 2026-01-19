// src/pages/empresa/BeneficiosEmpresa.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  Tag,
  VStack,
  useColorModeValue,
  useOutsideClick,
  usePrefersReducedMotion,
  useToast,
} from "@chakra-ui/react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBox,
  FiCheckCircle,
  FiFileText,
  FiInfo,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import PromoHeroFadeBanner from "../public/PromoHeroFadeBanner";

const MotionBox = motion.create(Box);
const MotionTr = motion.create(Tr);

const ferreYellow = "#F9BF20";

/* =========================================================================
   iOS / Modern motion primitives
   ========================================================================= */
const makeSpring = (reduce) =>
  reduce
    ? { duration: 0 }
    : { type: "spring", stiffness: 380, damping: 32, mass: 0.7 };

const fadeUp = (reduce) => ({
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...makeSpring(reduce), duration: reduce ? 0 : 0.38 },
  },
});

const fadeIn = (reduce) => ({
  hidden: { opacity: 0, filter: "blur(6px)" },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { ...makeSpring(reduce), duration: reduce ? 0 : 0.35 },
  },
});

const stagger = (reduce) => ({
  hidden: {},
  show: { transition: reduce ? {} : { staggerChildren: 0.06, delayChildren: 0.04 } },
});

const pressable = (reduce) => ({
  whileHover: reduce ? {} : { y: -2, scale: 1.01 },
  whileTap: reduce ? {} : { scale: 0.985 },
  transition: reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30, mass: 0.6 },
});

/* =========================================================================
   UTILIDADES
   ========================================================================= */
function formatCurrency(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}
function normalizeText(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}
function estadoPedidoMeta(estadoRaw) {
  const estado = String(estadoRaw || "").toUpperCase();
  switch (estado) {
    case "PENDIENTE":
      return { label: "Pendiente", progress: 20, scheme: "yellow" };
    case "CONFIRMADO":
      return { label: "Confirmado", progress: 45, scheme: "blue" };
    case "ENVIADO":
      return { label: "Enviado", progress: 75, scheme: "purple" };
    case "ENTREGADO":
      return { label: "Entregado", progress: 100, scheme: "green" };
    case "CANCELADO":
      return { label: "Cancelado", progress: 0, scheme: "red" };
    default:
      return { label: estado || "En proceso", progress: 40, scheme: "gray" };
  }
}

/* =========================================================================
   UI helpers (Glass / iOS)
   ========================================================================= */
function GlassCard({ children, ...props }) {
  const bg = useColorModeValue("whiteAlpha.900", "blackAlpha.400");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const shadow = useColorModeValue(
    "0 18px 60px rgba(0,0,0,0.10)",
    "0 18px 60px rgba(0,0,0,0.35)"
  );

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={border}
      backdropFilter="blur(18px)"
      boxShadow={shadow}
      {...props}
    >
      {children}
    </Box>
  );
}

/* =========================================================================
   KPI Card
   ========================================================================= */
function KpiCard({ label, value, icon, isLoading }) {
  const muted = useColorModeValue("gray.600", "gray.400");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

  return (
    <MotionBox variants={fadeUp(false)}>
      <GlassCard rounded="2xl" overflow="hidden">
        <Card bg="transparent" border="none">
          <CardBody p={5}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">
                  {label}
                </Text>
                {isLoading ? (
                  <Skeleton mt={2} h="28px" w="130px" rounded="md" />
                ) : (
                  <Text mt={1} fontSize="2xl" fontWeight="black" lineHeight="1">
                    {value}
                  </Text>
                )}
              </Box>

              <Box
                border="1px solid"
                borderColor={border}
                bg={useColorModeValue("whiteAlpha.800", "blackAlpha.500")}
                rounded="xl"
                p={2.5}
              >
                <Icon as={icon} />
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </GlassCard>
    </MotionBox>
  );
}

/* =========================================================================
   Cotizador Pro (iOS smooth + modern microinteractions + UNDO robusto)
   ========================================================================= */
function CotizadorPro({ onCotizacionCreada }) {
  const toast = useToast();
  const reduceMotion = usePrefersReducedMotion();

  // Datos
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [items, setItems] = useState([]);

  // UI
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [creando, setCreando] = useState(false);

  // Dropdown / teclado
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Confirm dialog (limpiar)
  const [isClearOpen, setClearOpen] = useState(false);
  const cancelClearRef = useRef(null);

  // Refs
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Theme
  const muted = useColorModeValue("gray.600", "gray.400");
  const softBg = useColorModeValue("gray.50", "blackAlpha.500");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const hoverBg = useColorModeValue("yellow.50", "whiteAlpha.100");
  const dropdownBg = useColorModeValue("white", "gray.900");

  // Toast colors (NO hooks inside toast render)
  const toastBg = useColorModeValue("white", "gray.900");
  const toastBorder = useColorModeValue("gray.200", "gray.700");
  const toastMuted = useColorModeValue("gray.600", "gray.400");

  useOutsideClick({
    ref: dropdownRef,
    handler: () => setDropdownOpen(false),
  });

  /* ---------- UNDO (FIX REAL) ---------- */
  const UNDO_TTL_MS = 12000;
  const UNDO_TOAST_ID = "cotizador-undo-toast";

  const itemsRef = useRef([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const undoRef = useRef(null); // { snapshot, ts }
  const undoTimerRef = useRef(null);

  const cloneItems = useCallback((arr) => {
    try {
      return structuredClone(arr);
    } catch {
      return (arr || []).map((x) => ({ ...x }));
    }
  }, []);

  const openUndoToast = useCallback(
    (snapshot, message) => {
      // limpia timer anterior
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

      undoRef.current = { snapshot, ts: Date.now() };

      // ✅ si expira, invalida el undo (y el toast se cierra solo)
      undoTimerRef.current = setTimeout(() => {
        undoRef.current = null;
      }, UNDO_TTL_MS + 50);

      toast({
        id: UNDO_TOAST_ID, // un solo toast, se reemplaza
        position: "top-right",
        duration: UNDO_TTL_MS,
        isClosable: true,
        render: ({ onClose }) => (
          <motion.div
            initial={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={makeSpring(reduceMotion)}
          >
            <Box bg={toastBg} border="1px solid" borderColor={toastBorder} rounded="2xl" p={3} shadow="2xl">
              <HStack justify="space-between" align="start" spacing={3}>
                <Box>
                  <Text fontWeight="black" fontSize="sm">
                    {message}
                  </Text>
                  <Text fontSize="xs" color={toastMuted} mt={0.5}>
                    Deshacer disponible por {Math.round(UNDO_TTL_MS / 1000)}s
                  </Text>

                  {/* mini “countdown bar” iOS */}
                  <Box mt={2} h="2px" bg={useColorModeValue("gray.100", "whiteAlpha.200")} rounded="full" overflow="hidden">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: 0 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: UNDO_TTL_MS / 1000, ease: "linear" }}
                      style={{ height: "100%", background: ferreYellow }}
                    />
                  </Box>
                </Box>

                <HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    rounded="xl"
                    onClick={() => {
                      const u = undoRef.current;
                      if (!u?.snapshot) return;

                      setItems(u.snapshot);

                      undoRef.current = null;
                      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                      onClose();
                    }}
                  >
                    Deshacer
                  </Button>

                  <IconButton
                    size="sm"
                    variant="ghost"
                    rounded="xl"
                    aria-label="Cerrar"
                    icon={<FiX />}
                    onClick={() => {
                      undoRef.current = null;
                      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
                      onClose();
                    }}
                  />
                </HStack>
              </HStack>
            </Box>
          </motion.div>
        ),
      });
    },
    [toast, toastBg, toastBorder, toastMuted, reduceMotion]
  );

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);
  /* ---------- /UNDO ---------- */

  useEffect(() => {
    let cancelled = false;

    const fetchCatalogo = async () => {
      try {
        setLoadingCatalogo(true);
        const res = await api.get("/productos", {
          params: { page: 1, limit: 220, sort: "nombre", order: "asc" },
        });

        const productos =
          Array.isArray(res.data?.productos) ? res.data.productos : Array.isArray(res.data) ? res.data : [];

        if (!cancelled) setProductosCatalogo(productos);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast({
            title: "No pudimos cargar el catálogo",
            description: "Revisa tu conexión e intenta actualizar.",
            status: "warning",
            duration: 4500,
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) setLoadingCatalogo(false);
      }
    };

    fetchCatalogo();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const productosFiltrados = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return [];

    return productosCatalogo
      .map((p) => {
        const nombre = normalizeText(p.nombre);
        const sku = normalizeText(p.sku || p.codigo || "");
        const score =
          (nombre.startsWith(term) ? 3 : nombre.includes(term) ? 2 : 0) +
          (sku.startsWith(term) ? 2 : sku.includes(term) ? 1 : 0);
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.p);
  }, [productosCatalogo, searchTerm]);

  const total = useMemo(() => {
    return items.reduce((acc, i) => acc + Number(i.precio_unitario || 0) * Number(i.cantidad || 0), 0);
  }, [items]);

  const handleAddItem = useCallback(
    (producto) => {
      if (!producto?.id) return;

      const snapshot = cloneItems(itemsRef.current);

      setItems((prev) => {
        const existing = prev.find((i) => String(i.producto_id) === String(producto.id));
        const precioUnit = Number(producto.precio ?? producto.precio_unitario ?? 0);
        const sku = producto.sku || producto.codigo || "S/R";

        if (existing) {
          return prev.map((i) =>
            String(i.producto_id) === String(producto.id)
              ? { ...i, cantidad: clamp(Number(i.cantidad) + 1, 1, 999) }
              : i
          );
        }

        return [
          ...prev,
          {
            producto_id: producto.id,
            nombre: producto.nombre || "Producto",
            sku,
            precio_unitario: precioUnit,
            cantidad: 1,
          },
        ];
      });

      setSearchTerm("");
      setActiveIndex(0);
      setDropdownOpen(false);
      requestAnimationFrame(() => searchInputRef.current?.focus());

      openUndoToast(snapshot, "Producto agregado (+1)");
    },
    [cloneItems, openUndoToast]
  );

  const updateQty = useCallback((id, valueNumber) => {
    const qty = clamp(Number(valueNumber), 1, 999);
    setItems((prev) => prev.map((i) => (i.producto_id === id ? { ...i, cantidad: qty } : i)));
  }, []);

  const removeItem = useCallback(
    (id) => {
      const snapshot = cloneItems(itemsRef.current);
      setItems((prev) => prev.filter((x) => x.producto_id !== id));
      openUndoToast(snapshot, "Producto eliminado");
    },
    [cloneItems, openUndoToast]
  );

  const clearAll = useCallback(() => {
    const snapshot = cloneItems(itemsRef.current);
    setItems([]);
    openUndoToast(snapshot, "Tabla limpiada");
  }, [cloneItems, openUndoToast]);

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (!isDropdownOpen && e.key === "ArrowDown" && productosFiltrados.length > 0) {
        setDropdownOpen(true);
        setActiveIndex(0);
        return;
      }
      if (e.key === "Escape") {
        setDropdownOpen(false);
        if (!searchTerm) searchInputRef.current?.blur();
        return;
      }
      if (!productosFiltrados.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownOpen(true);
        setActiveIndex((i) => (i + 1) % productosFiltrados.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownOpen(true);
        setActiveIndex((i) => (i - 1 + productosFiltrados.length) % productosFiltrados.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const chosen = productosFiltrados[activeIndex] || productosFiltrados[0];
        if (chosen) handleAddItem(chosen);
      }
    },
    [activeIndex, handleAddItem, isDropdownOpen, productosFiltrados, searchTerm]
  );

  const handleCrear = useCallback(async () => {
    if (items.length === 0) {
      toast({
        title: "Tu cotización está vacía",
        description: "Agrega al menos un material para continuar.",
        status: "info",
        duration: 3000,
      });
      return;
    }

    try {
      setCreando(true);
      const payload = {
        productos: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      };

      const res = await api.post("/cotizaciones", payload);
      const data = res.data;

      setItems([]);
      onCotizacionCreada?.();

      toast({
        title: "Cotización generada",
        description: `Total estimado: ${formatCurrency(data?.total ?? total)}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error al generar la cotización",
        description: e?.response?.data?.error || "Intenta nuevamente. Si persiste, contacta soporte.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreando(false);
    }
  }, [items, onCotizacionCreada, toast, total]);

  const showDropdown = isDropdownOpen && normalizeText(searchTerm).length > 0;

  return (
    <MotionBox variants={fadeUp(reduceMotion)}>
      <GlassCard rounded="3xl" overflow="visible">
        <Card bg="transparent" border="none">
          <CardBody p={{ base: 4, md: 6 }}>
            {/* Header */}
            <Flex
              justify="space-between"
              align={{ base: "start", md: "center" }}
              mb={5}
              gap={4}
              direction={{ base: "column", md: "row" }}
            >
              <HStack align="start" spacing={3}>
                <motion.div {...pressable(reduceMotion)}>
                  <Box
                    bg={ferreYellow}
                    p={2}
                    rounded="xl"
                    color="black"
                    boxShadow={useColorModeValue("0 10px 24px rgba(249,191,32,.25)", "0 10px 24px rgba(249,191,32,.12)")}
                  >
                    <FiFileText size={20} />
                  </Box>
                </motion.div>

                <Box>
                  <Heading size="md">Cotizador de Obra</Heading>
                  <Text fontSize="xs" color={muted}>
                    Busca y agrega materiales (+1). Ajusta cantidades en la tabla y genera la cotización.
                  </Text>
                </Box>
              </HStack>

              <HStack w={{ base: "full", md: "auto" }} justify={{ base: "flex-end", md: "flex-end" }}>
                {items.length > 0 && (
                  <motion.div {...pressable(reduceMotion)}>
                    <Button
                      variant="ghost"
                      size="sm"
                      colorScheme="red"
                      onClick={() => setClearOpen(true)}
                      leftIcon={<FiTrash2 />}
                      rounded="xl"
                    >
                      Limpiar
                    </Button>
                  </motion.div>
                )}

                <motion.div {...pressable(reduceMotion)} style={{ width: "100%" }}>
                  <Button
                    colorScheme="yellow"
                    rounded="full"
                    px={7}
                    onClick={handleCrear}
                    isLoading={creando}
                    loadingText="Generando..."
                    isDisabled={items.length === 0 || creando}
                    shadow="md"
                    w={{ base: "full", md: "auto" }}
                  >
                    Generar cotización
                  </Button>
                </motion.div>
              </HStack>
            </Flex>

            <Divider mb={5} borderColor={borderColor} />

            {/* Buscador */}
            <Box position="relative" ref={dropdownRef} zIndex={20}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.400" />
                </InputLeftElement>

                <Input
                  ref={searchInputRef}
                  placeholder="Busca cemento, varilla, PVC, herramientas…"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDropdownOpen(true);
                    setActiveIndex(0);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  rounded="2xl"
                  bg={softBg}
                  border="1px solid"
                  borderColor={borderColor}
                  focusBorderColor={ferreYellow}
                  _placeholder={{ color: useColorModeValue("gray.400", "gray.500"), fontSize: "sm" }}
                />

                {searchTerm && (
                  <InputRightElement>
                    <motion.div {...pressable(reduceMotion)}>
                      <IconButton
                        aria-label="Limpiar búsqueda"
                        icon={<FiX />}
                        size="sm"
                        variant="ghost"
                        rounded="xl"
                        onClick={() => {
                          setSearchTerm("");
                          setDropdownOpen(false);
                          setActiveIndex(0);
                          requestAnimationFrame(() => searchInputRef.current?.focus());
                        }}
                      />
                    </motion.div>
                  </InputRightElement>
                )}
              </InputGroup>

              <HStack mt={2} spacing={2} flexWrap="wrap">
                <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="gray">
                  Enter: agregar +1
                </Tag>
                <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="gray">
                  ↑↓: navegar
                </Tag>
                <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="gray">
                  Esc: cerrar
                </Tag>
              </HStack>

              {/* Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <MotionBox
                    initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                    transition={makeSpring(reduceMotion)}
                    position="absolute"
                    top="110%"
                    left={0}
                    right={0}
                    bg={dropdownBg}
                    shadow="2xl"
                    rounded="2xl"
                    border="1px solid"
                    borderColor={borderColor}
                    zIndex={30}
                    overflow="hidden"
                  >
                    <Box px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={muted}>
                          {loadingCatalogo ? "Cargando catálogo…" : `${productosFiltrados.length} resultado(s)`}
                        </Text>
                        <Tooltip label="Puedes buscar por SKU o parte del nombre" hasArrow placement="left">
                          <HStack spacing={1} color={muted}>
                            <FiInfo />
                            <Text fontSize="xs">Ayuda</Text>
                          </HStack>
                        </Tooltip>
                      </HStack>
                    </Box>

                    {loadingCatalogo ? (
                      <Box p={4}>
                        <Stack spacing={2}>
                          <Skeleton h="18px" rounded="md" />
                          <Skeleton h="18px" rounded="md" />
                          <Skeleton h="18px" rounded="md" />
                        </Stack>
                      </Box>
                    ) : productosFiltrados.length === 0 ? (
                      <Box p={6} textAlign="center" color={muted}>
                        <Box
                          mx="auto"
                          mb={2}
                          boxSize="40px"
                          rounded="full"
                          bg={useColorModeValue("gray.50", "blackAlpha.500")}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <FiSearch />
                        </Box>
                        <Text fontSize="sm" fontWeight="black">
                          Sin resultados
                        </Text>
                        <Text fontSize="xs" mt={1}>
                          Prueba “PVC”, “Tornillo”, “Cemento”, etc.
                        </Text>
                      </Box>
                    ) : (
                      <Box maxH="320px" overflowY="auto">
                        {productosFiltrados.map((p, idx) => {
                          const isActive = idx === activeIndex;
                          return (
                            <motion.div key={p.id} layout transition={makeSpring(reduceMotion)}>
                              <Flex
                                px={4}
                                py={3}
                                align="center"
                                justify="space-between"
                                borderBottom="1px solid"
                                borderColor={useColorModeValue("gray.50", "whiteAlpha.100")}
                                bg={isActive ? hoverBg : "transparent"}
                                _hover={{ bg: hoverBg, cursor: "pointer" }}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onClick={() => handleAddItem(p)}
                              >
                                <Box minW={0}>
                                  <Text fontWeight="black" fontSize="sm" noOfLines={1}>
                                    {p.nombre}
                                  </Text>
                                  <HStack spacing={2} mt={0.5}>
                                    <Badge fontSize="10px" colorScheme="gray" variant="subtle">
                                      {p.sku || p.codigo || "S/R"}
                                    </Badge>
                                    <Text fontSize="xs" color={muted}>
                                      {formatCurrency(p.precio)}
                                    </Text>
                                  </HStack>
                                </Box>
                                <Icon as={FiPlus} color="yellow.500" />
                              </Flex>
                            </motion.div>
                          );
                        })}
                      </Box>
                    )}
                  </MotionBox>
                )}
              </AnimatePresence>
            </Box>

            {/* Tabla */}
            <Box mt={5}>
              <TableContainer
                rounded="2xl"
                border="1px solid"
                borderColor={borderColor}
                minH="160px"
                overflow="hidden"
                bg={useColorModeValue("whiteAlpha.800", "blackAlpha.300")}
                backdropFilter="blur(14px)"
              >
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue("gray.50", "blackAlpha.500")}>
                    <Tr>
                      <Th>Material</Th>
                      <Th isNumeric>Cantidad</Th>
                      <Th isNumeric>Subtotal</Th>
                      <Th />
                    </Tr>
                  </Thead>

                  <Tbody>
                    {items.length === 0 ? (
                      <Tr>
                        <Td colSpan={4} py={12} textAlign="center">
                          <VStack color={useColorModeValue("gray.400", "gray.500")} spacing={2}>
                            <Box
                              boxSize="44px"
                              rounded="full"
                              bg={useColorModeValue("gray.50", "blackAlpha.500")}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <FiBox size={20} />
                            </Box>
                            <Text fontSize="sm" fontWeight="black">
                              Agrega productos para comenzar
                            </Text>
                            <Text fontSize="xs">Busca y presiona Enter para agregar +1.</Text>
                          </VStack>
                        </Td>
                      </Tr>
                    ) : (
                      <AnimatePresence>
                        {items.map((i) => (
                          <MotionTr
                            key={i.producto_id}
                            layout
                            initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                            transition={makeSpring(reduceMotion)}
                            style={{ display: "table-row" }}
                          >
                            <Td fontWeight="black" fontSize="xs" maxW="320px">
                              <Text noOfLines={1}>{i.nombre}</Text>
                              <Text fontSize="10px" color={muted} fontWeight="normal">
                                {i.sku}
                              </Text>
                            </Td>

                            <Td isNumeric>
                              <Box ml="auto" w="92px">
                                <Input
                                  value={i.cantidad}
                                  onChange={(e) => {
                                    const v = clamp(parseInt(e.target.value, 10), 1, 999);
                                    if (!Number.isNaN(v)) updateQty(i.producto_id, v);
                                  }}
                                  onBlur={(e) => {
                                    const v = clamp(parseInt(e.target.value, 10), 1, 999);
                                    updateQty(i.producto_id, v);
                                  }}
                                  type="number"
                                  min={1}
                                  max={999}
                                  size="sm"
                                  rounded="xl"
                                  textAlign="center"
                                  fontWeight="black"
                                  bg={useColorModeValue("whiteAlpha.900", "blackAlpha.500")}
                                  border="1px solid"
                                  borderColor={borderColor}
                                  focusBorderColor={ferreYellow}
                                />
                              </Box>
                            </Td>

                            <Td isNumeric fontWeight="black">
                              {formatCurrency(Number(i.precio_unitario) * Number(i.cantidad))}
                            </Td>

                            <Td isNumeric>
                              <Tooltip label="Eliminar (se puede deshacer)" hasArrow>
                                <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    rounded="xl"
                                    aria-label="Eliminar producto"
                                    onClick={() => removeItem(i.producto_id)}
                                  />
                                </motion.div>
                              </Tooltip>
                            </Td>
                          </MotionTr>
                        ))}
                      </AnimatePresence>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>

              {items.length > 0 && (
                <MotionBox
                  mt={4}
                  p={4}
                  rounded="2xl"
                  border="1px solid"
                  borderColor={borderColor}
                  bg={useColorModeValue("whiteAlpha.900", "blackAlpha.400")}
                  backdropFilter="blur(18px)"
                  variants={fadeIn(reduceMotion)}
                >
                  <Flex justify="flex-end">
                    <HStack spacing={6} align="baseline">
                      <Text color={muted} fontSize="sm" fontWeight="bold" letterSpacing="wide">
                        TOTAL ESTIMADO
                      </Text>
                      <Text fontSize="xl" fontWeight="black">
                        {formatCurrency(total)}
                      </Text>
                    </HStack>
                  </Flex>
                </MotionBox>
              )}
            </Box>

            {/* Confirm limpiar */}
            <AlertDialog isOpen={isClearOpen} leastDestructiveRef={cancelClearRef} onClose={() => setClearOpen(false)}>
              <AlertDialogOverlay />
              <AlertDialogContent rounded="2xl">
                <AlertDialogHeader fontWeight="black">¿Limpiar la tabla?</AlertDialogHeader>
                <AlertDialogBody>
                  Esto eliminará todos los materiales. (Luego puedes <b>deshacer</b> el cambio).
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelClearRef} onClick={() => setClearOpen(false)} rounded="xl">
                    Cancelar
                  </Button>
                  <Button
                    colorScheme="red"
                    ml={3}
                    rounded="xl"
                    onClick={() => {
                      setClearOpen(false);
                      clearAll();
                    }}
                  >
                    Sí, limpiar
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Micro-ayuda */}
            <Box mt={5}>
              <HStack spacing={2} color={muted} mb={2}>
                <FiInfo />
                <Text fontSize="xs" fontWeight="bold">
                  Tip
                </Text>
              </HStack>
              <Text fontSize="xs" color={muted}>
                Agrega rápido con <b>Enter</b>. Ajusta cantidades en la tabla. Si el producto no aparece, intenta por SKU.
              </Text>
            </Box>
          </CardBody>
        </Card>
      </GlassCard>
    </MotionBox>
  );
}

/* =========================================================================
   PÁGINA PRINCIPAL (Dashboard)
   ========================================================================= */
export default function BeneficiosEmpresa() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const reduceMotion = usePrefersReducedMotion();

  const [data, setData] = useState({
    cotizaciones: [],
    pedidos: [],
    loading: true,
    lastUpdated: null,
  });

  const bg = useColorModeValue("gray.50", "blackAlpha.900");
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

  const loadAll = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true }));

      const [cRes, pRes] = await Promise.all([api.get("/cotizaciones"), api.get("/pedidos/mios")]);

      const cotizaciones = Array.isArray(cRes.data)
        ? cRes.data
        : Array.isArray(cRes.data?.cotizaciones)
          ? cRes.data.cotizaciones
          : [];

      const pedidos = Array.isArray(pRes.data)
        ? pRes.data
        : Array.isArray(pRes.data?.pedidos)
          ? pRes.data.pedidos
          : [];

      setData({
        cotizaciones,
        pedidos,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (e) {
      console.error(e);
      setData((prev) => ({ ...prev, loading: false }));
      toast({
        title: "No pudimos actualizar tus datos",
        description: "Intenta de nuevo. Si persiste, revisa el backend o tu red.",
        status: "warning",
        duration: 4500,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const kpis = useMemo(() => {
    const cot = data.cotizaciones || [];
    const ped = data.pedidos || [];

    const vigentes = cot.filter((c) => String(c.estado_vigencia || "").toUpperCase() === "VIGENTE").length;

    const pedidosActivos = ped.filter((p) => {
      const estado = String(p.estado || p.estado_pedido || "").toUpperCase();
      return !["CANCELADO", "ENTREGADO"].includes(estado);
    }).length;

    const ahorro = cot
      .filter((c) => ["ACEPTADA", "CONVERTIDA"].includes(String(c.estado_gestion || "").toUpperCase()))
      .reduce((acc, c) => acc + Number(c.descuento || 0), 0);

    return { vigentes, pedidosActivos, ahorro };
  }, [data.cotizaciones, data.pedidos]);

  return (
    <Box minH="100vh" bg={bg} pb={10}>
      <MotionConfig transition={makeSpring(reduceMotion)}>
        <Container maxW="1200px" pt={{ base: 6, md: 8 }}>
          <MotionBox initial="hidden" animate="show" variants={stagger(reduceMotion)}>
            {/* HEADER */}
            <MotionBox variants={fadeUp(reduceMotion)}>
              <Flex
                justify="space-between"
                align={{ base: "start", md: "center" }}
                mb={7}
                direction={{ base: "column", md: "row" }}
                gap={4}
              >
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Tag colorScheme="blue" borderRadius="full">
                      Panel Empresas
                    </Tag>
                    {data.lastUpdated && (
                      <Text fontSize="xs" color={muted}>
                        Última actualización:{" "}
                        {data.lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                  </HStack>

                  <Heading size="xl" fontWeight="black" letterSpacing="tight">
                    ¡Bienvenido, {user?.nombre?.split(" ")[0] || user?.razon_social || "Empresa"}! 👷‍♂️
                  </Heading>
                  <Text color={muted} fontSize="sm">
                    Gestiona suministros, cotizaciones y pedidos con control total.
                  </Text>
                </VStack>

                <HStack spacing={3} w={{ base: "full", md: "auto" }}>
                  <motion.div {...pressable(reduceMotion)} style={{ width: "100%" }}>
                    <Button
                      leftIcon={<FiLayers />}
                      variant="solid"
                      bg="gray.800"
                      color="white"
                      _hover={{ bg: "black" }}
                      rounded="full"
                      px={6}
                      onClick={() => navigate("/empresa/catalogo")}
                      w={{ base: "full", md: "auto" }}
                    >
                      Ver catálogo completo
                    </Button>
                  </motion.div>

                  <Tooltip label="Actualizar datos" hasArrow>
                    <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                      <IconButton
                        aria-label="Actualizar"
                        icon={<FiRefreshCw />}
                        onClick={loadAll}
                        rounded="full"
                        variant="outline"
                        isLoading={data.loading}
                      />
                    </motion.div>
                  </Tooltip>
                </HStack>
              </Flex>
            </MotionBox>

            {/* KPIs */}
            <MotionBox variants={stagger(reduceMotion)}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
                <KpiCard label="Cotizaciones vigentes" value={kpis.vigentes} icon={FiFileText} isLoading={data.loading} />
                <KpiCard label="Pedidos en curso" value={kpis.pedidosActivos} icon={FiActivity} isLoading={data.loading} />
                <KpiCard label="Ahorro acumulado" value={formatCurrency(kpis.ahorro)} icon={FiCheckCircle} isLoading={data.loading} />
              </SimpleGrid>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={8} alignItems="start">
              {/* IZQUIERDA */}
              <Box gridColumn={{ lg: "span 8" }}>
                <CotizadorPro onCotizacionCreada={loadAll} />

                {/* PEDIDOS RECIENTES */}
                <MotionBox variants={fadeUp(reduceMotion)} mt={10}>
                  <HStack justify="space-between" mb={4}>
                    <HStack>
                      <Icon as={FiActivity} color="green.400" />
                      <Heading size="md">Mis pedidos recientes</Heading>
                    </HStack>

                    <motion.div {...pressable(reduceMotion)}>
                      <Button size="sm" variant="ghost" rounded="xl" onClick={() => navigate("/empresa/mis-pedidos")}>
                        Ver todos
                      </Button>
                    </motion.div>
                  </HStack>

                  {data.loading ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Skeleton h="110px" rounded="2xl" />
                      <Skeleton h="110px" rounded="2xl" />
                    </SimpleGrid>
                  ) : (data.pedidos || []).length === 0 ? (
                    <GlassCard rounded="2xl" p={8} textAlign="center" border="1px solid" borderColor={borderColor}>
                      <HStack justify="center" mb={2} color={muted}>
                        <FiShoppingBag />
                        <Text fontWeight="black" fontSize="sm">
                          Aún no tienes pedidos
                        </Text>
                      </HStack>
                      <Text color={muted} fontSize="xs" mb={4}>
                        Cuando conviertas una cotización en pedido, aparecerá aquí con su progreso.
                      </Text>
                      <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                        <Button size="sm" colorScheme="yellow" rounded="full" onClick={() => navigate("/empresa/cotizaciones")}>
                          Ir a cotizaciones
                        </Button>
                      </motion.div>
                    </GlassCard>
                  ) : (
                    <MotionBox variants={stagger(reduceMotion)}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {(data.pedidos || []).slice(0, 4).map((p) => {
                          const estadoRaw = p.estado || p.estado_pedido || p.estado_pedido_nombre || "PENDIENTE";
                          const meta = estadoPedidoMeta(estadoRaw);
                          const metodo = p.metodo_pago || p.metodoPago || "—";

                          return (
                            <MotionBox key={p.id} variants={fadeUp(reduceMotion)}>
                              <motion.div {...pressable(reduceMotion)}>
                                <GlassCard
                                  rounded="2xl"
                                  overflow="hidden"
                                  cursor="pointer"
                                  border="1px solid"
                                  borderColor={borderColor}
                                  _hover={{ borderColor: ferreYellow }}
                                  onClick={() => navigate(`/empresa/mis-pedidos?pedidoId=${p.id}`)}
                                >
                                  <Box p={4}>
                                    <Flex justify="space-between" align="center" mb={2}>
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="10px" fontWeight="bold" color={muted} letterSpacing="wide">
                                          ORDEN #{p.id}
                                        </Text>
                                        <Text fontWeight="black" fontSize="sm">
                                          {meta.label}
                                        </Text>
                                      </VStack>
                                      <Badge colorScheme={meta.scheme} rounded="full" variant="subtle">
                                        {metodo}
                                      </Badge>
                                    </Flex>

                                    <Progress value={meta.progress} size="xs" colorScheme={meta.scheme} rounded="full" />
                                    <Text mt={2} fontSize="xs" color={muted}>
                                      Toca para ver detalle y estado.
                                    </Text>
                                  </Box>
                                </GlassCard>
                              </motion.div>
                            </MotionBox>
                          );
                        })}
                      </SimpleGrid>
                    </MotionBox>
                  )}
                </MotionBox>
              </Box>

              {/* DERECHA */}
              <Box gridColumn={{ lg: "span 4" }}>
                <Stack spacing={6}>
                  {/* Banner 1920x480 => 4:1 + contenedor más grande */}
                  <MotionBox variants={fadeUp(reduceMotion)}>
                    <motion.div {...pressable(reduceMotion)}>
                      <GlassCard rounded="3xl" overflow="hidden" border="1px solid" borderColor={borderColor}>
                        <PromoHeroFadeBanner
                          images={["/Publicidad1.png", "/Publicidad2.png", "/publicidad3.jpg", "/Publicidad4.png"]}
                          ratio={{ base: 4 / 1, md: 4 / 1, lg: 4 / 1 }}
                          height={{ base: "175px", md: "220px", lg: "245px" }}
                          fit={{ base: "contain", md: "contain", lg: "contain" }}
                          objectPosition="center"
                          rounded="3xl"
                          mb={0}
                          blurBg={true}
                          blurPx={18}
                          blurOpacity={0.35}
                          showDots={true}
                          intervalMs={4200}
                        />
                      </GlassCard>
                    </motion.div>
                  </MotionBox>

                  {/* Soporte */}
                  <MotionBox variants={fadeUp(reduceMotion)}>
                    <motion.div {...pressable(reduceMotion)}>
                      <Card
                        rounded="3xl"
                        bg={useColorModeValue("gray.900", "gray.800")}
                        color="white"
                        w="full"
                        shadow="2xl"
                        overflow="hidden"
                        border="1px solid"
                        borderColor={useColorModeValue("blackAlpha.200", "whiteAlpha.200")}
                      >
                        <CardBody p={6}>
                          <HStack mb={3}>
                            <Icon as={FiInfo} color="yellow.400" />
                            <Text fontWeight="black">Asesor de proyectos</Text>
                          </HStack>

                          <Text fontSize="sm" opacity={0.85} mb={4}>
                            ¿Necesitas descuento por volumen, entrega programada o una cotización especial?
                          </Text>

                          <Button w="full" colorScheme="yellow" rounded="xl" h="48px" onClick={() => navigate("/empresa/casos-empresa")}>
                            Contactar asesor
                          </Button>

                          <HStack mt={3} opacity={0.85}>
                            <FiAlertTriangle />
                            <Text fontSize="xs">Adjunta el número de cotización/pedido para respuesta más rápida.</Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    </motion.div>
                  </MotionBox>

                  {/* Acceso rápido */}
                  <MotionBox variants={fadeUp(reduceMotion)}>
                    <motion.div {...pressable(reduceMotion)}>
                      <GlassCard rounded="3xl" border="1px dashed" borderColor={borderColor} overflow="hidden" textAlign="center">
                        <Box py={8} px={6}>
                          <Icon as={FiShoppingBag} boxSize={8} color={useColorModeValue("gray.300", "gray.500")} mb={3} />
                          <Text fontSize="xs" color={muted} mb={4}>
                            ¿Buscas algo muy específico?
                          </Text>
                          <Button size="sm" variant="link" colorScheme="yellow" onClick={() => navigate("/empresa/catalogo")}>
                            Explorar todo el catálogo
                          </Button>
                        </Box>
                      </GlassCard>
                    </motion.div>
                  </MotionBox>
                </Stack>
              </Box>
            </SimpleGrid>
          </MotionBox>
        </Container>
      </MotionConfig>
    </Box>
  );
}
