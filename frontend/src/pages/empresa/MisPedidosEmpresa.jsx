// src/pages/empresa/MisPedidosEmpresa.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
  usePrefersReducedMotion,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAlertCircle,
  FiArrowDown,
  FiArrowRight,
  FiArrowUp,
  FiCalendar,
  FiEye,
  FiFilter,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

const MotionBox = motion.create(Box);

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const useSurfaceTokens = () => {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderLight = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.400");
  const titleCol = useColorModeValue("gray.900", "white");

  const brand = "#F9BF20";

  const shadowSm = useColorModeValue(
    "0 1px 2px rgba(0,0,0,0.04)",
    "0 1px 2px rgba(0,0,0,0.4)"
  );
  const shadowMd = useColorModeValue(
    "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
    "0 4px 6px rgba(0,0,0,0.4)"
  );
  const shadowLg = useColorModeValue(
    "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
    "0 10px 15px rgba(0,0,0,0.5)"
  );

  return { pageBg, cardBg, borderLight, subtle, titleCol, brand, shadowSm, shadowMd, shadowLg };
};

const EstadoBadge = ({ estado }) => {
  const map = {
    PENDIENTE: { cs: "yellow", label: "PENDIENTE" },
    CONFIRMADO: { cs: "purple", label: "CONFIRMADO" },
    ENVIADO: { cs: "blue", label: "ENVIADO" },
    ENTREGADO: { cs: "green", label: "ENTREGADO" },
    CANCELADO: { cs: "red", label: "CANCELADO" },
    PAGADO: { cs: "green", label: "PAGADO" },
  };
  const meta = map[String(estado || "").toUpperCase()] || { cs: "gray", label: estado || "—" };

  return (
    <Badge
      colorScheme={meta.cs}
      borderRadius="full"
      px={2.5}
      py={1}
      fontSize="0.72rem"
      display="inline-flex"
      alignItems="center"
      lineHeight="1"
    >
      {meta.label}
    </Badge>
  );
};

/* ====================== Stepper ====================== */
const FLOW_STEPS = [
  { key: "PENDIENTE", label: "Pendiente", hint: "Recibido" },
  { key: "CONFIRMADO", label: "Confirmado", hint: "Validado" },
  { key: "ENVIADO", label: "Enviado", hint: "En ruta" },
  { key: "ENTREGADO", label: "Entregado", hint: "Finalizado" },
];

const flowIndexFromEstado = (estadoRaw) => {
  const e = String(estadoRaw || "").trim().toUpperCase();
  if (e === "CANCELADO") return -1;
  if (e === "PAGADO") return FLOW_STEPS.findIndex((s) => s.key === "CONFIRMADO");
  const idx = FLOW_STEPS.findIndex((s) => s.key === e);
  return idx >= 0 ? idx : 0;
};

function PedidoStepper({ estado, brandColor }) {
  const current = flowIndexFromEstado(estado);
  const muted = useColorModeValue("gray.600", "gray.400");
  const track = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const vertical = useBreakpointValue({ base: true, md: false });
  const accent = brandColor || useColorModeValue("yellow.500", "yellow.300");

  if (current === -1) {
    return (
      <Alert status="error" variant="subtle" borderRadius="lg" bg={cardBg} border="1px solid" borderColor={borderColor}>
        <AlertIcon />
        <Box>
          <AlertTitle>Pedido cancelado</AlertTitle>
          <AlertDescription color={muted}>
            Este pedido fue cancelado y no continuará con el proceso de envío.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  const Circle = ({ done }) => (
    <Box
      w="24px"
      h="24px"
      borderRadius="full"
      bg={done ? accent : "transparent"}
      border="2px solid"
      borderColor={done ? accent : track}
      display="grid"
      placeItems="center"
      flex="0 0 auto"
    >
      <Box w="8px" h="8px" borderRadius="full" bg={done ? "white" : track} />
    </Box>
  );

  if (vertical) {
    return (
      <VStack align="stretch" spacing={1}>
        {FLOW_STEPS.map((s, idx) => {
          const done = idx <= current;
          const isLast = idx === FLOW_STEPS.length - 1;

          return (
            <Box key={s.key}>
              <HStack align="flex-start" spacing={3}>
                <Box pt="2px">
                  <Circle done={done} />
                </Box>
                <VStack align="start" spacing={0} minW={0} flex={1}>
                  <Text fontSize="sm" fontWeight={idx === current ? "bold" : "semibold"}>
                    {s.label}
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    {s.hint}
                  </Text>
                </VStack>
              </HStack>

              {!isLast && (
                <HStack spacing={3} align="stretch" mt={1}>
                  <Box w="24px" display="grid" placeItems="center">
                    <Box w="2px" h="18px" bg={idx < current ? accent : track} borderRadius="full" />
                  </Box>
                  <Box />
                </HStack>
              )}
            </Box>
          );
        })}
      </VStack>
    );
  }

  return (
    <HStack w="full" spacing={0} align="center">
      {FLOW_STEPS.map((s, idx) => {
        const done = idx <= current;
        const isLast = idx === FLOW_STEPS.length - 1;

        return (
          <Flex key={s.key} align="center" flex="1" minW={0}>
            <VStack spacing={1} align="center" flex="0 0 auto">
              <Circle done={done} />
              <Text
                fontSize="xs"
                color={muted}
                fontWeight={idx === current ? "bold" : "semibold"}
                noOfLines={1}
              >
                {s.label}
              </Text>
            </VStack>

            {!isLast && <Box flex="1" h="2px" bg={idx < current ? accent : track} mx={3} borderRadius="full" />}
          </Flex>
        );
      })}
    </HStack>
  );
}

function parseDateSafe(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateShort(v) {
  const d = parseDateSafe(v);
  if (!d) return "—";
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
}

function formatTimeShort(v) {
  const d = parseDateSafe(v);
  if (!d) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildImg(src) {
  if (!src) return "https://via.placeholder.com/300x200?text=Sin+Imagen";
  const s = String(src);
  if (s.startsWith("http")) return s;
  return `${API_BASE_URL}${s}`;
}

export default function MisPedidosEmpresa() {
  const toast = useToast();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFiltersOpen, onOpen: onOpenFilters, onClose: onCloseFilters } = useDisclosure();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialFocusRef = useRef(null);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const { pageBg, cardBg, borderLight, subtle, titleCol, brand, shadowSm, shadowMd, shadowLg } =
    useSurfaceTokens();

  const theadBg = useColorModeValue("gray.100", "gray.800");
  const emptyBg = useColorModeValue("yellow.50", "yellow.900Alpha.100");
  const rowHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  const [det, setDet] = useState(null);
  const [detLoading, setDetLoading] = useState(false);

  // ✅ Guard anti-loop: evita reabrir el mismo pedido por URL una y otra vez
  const lastAutoOpenedIdRef = useRef(null);

  const updateParams = useCallback(
    (mutator, opts = { replace: true }) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      setSearchParams(next, opts);
    },
    [searchParams, setSearchParams]
  );

  const load = useCallback(
    async (opts = { silent: false }) => {
      try {
        if (opts.silent) setReloading(true);
        else setLoading(true);
        setErrorMsg("");

        const { data } = await api.get("/pedidos/mios");
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || "Error inesperado";
        setErrorMsg(msg);
        toast({
          title: "Error al cargar pedidos",
          description: msg,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        setReloading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const openDetalle = useCallback(
    async (pedidoId, { fromCheckout = false } = {}) => {
      if (!pedidoId) return;

      // ✅ si se abre manual o automático, marcamos el ID para no duplicar
      lastAutoOpenedIdRef.current = String(pedidoId);

      setDet(null);
      setDetLoading(true);
      onOpen();

      updateParams((p) => {
        p.set("pedidoId", String(pedidoId));
        p.delete("pedido");
      });

      try {
        const { data } = await api.get(`/pedidos/${pedidoId}/mio`);
        setDet(data);

        if (fromCheckout) {
          toast({
            title: "¡Pedido creado exitosamente!",
            status: "success",
            duration: 2500,
            position: "top",
            isClosable: true,
          });
        }
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || "No fue posible cargar el detalle.";
        toast({
          title: "No se pudo cargar el detalle",
          description: msg,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        // cerramos limpio
        setDet(null);
        setDetLoading(false);
        updateParams((p) => {
          p.delete("pedidoId");
          p.delete("pedido");
        });
        onClose();
      } finally {
        setDetLoading(false);
      }
    },
    [onOpen, onClose, toast, updateParams]
  );

  const closeDetalle = useCallback(() => {
    // ✅ Clave: borrar params ANTES de cerrar (y el guard evita re-open incluso si tarda)
    const keepBlockId = String(searchParams.get("pedidoId") || searchParams.get("pedido") || "");
    if (keepBlockId) lastAutoOpenedIdRef.current = keepBlockId;

    updateParams((p) => {
      p.delete("pedidoId");
      p.delete("pedido");
    });

    setDet(null);
    setDetLoading(false);
    onClose();
  }, [onClose, updateParams, searchParams]);

  // ✅ Auto-open por URL (UNA SOLA VEZ por ID)
  useEffect(() => {
    if (loading) return;

    const pidCheckout = searchParams.get("pedido");
    const pid = pidCheckout || searchParams.get("pedidoId");

    if (!pid) {
      lastAutoOpenedIdRef.current = null;
      return;
    }

    if (lastAutoOpenedIdRef.current === String(pid)) return;

    lastAutoOpenedIdRef.current = String(pid);
    openDetalle(pid, { fromCheckout: Boolean(pidCheckout) });
  }, [loading, searchParams, openDetalle]);

  const handleResetFilters = () => {
    setQ("");
    setEstadoFilter("");
    setDateFrom("");
    setDateTo("");
    setSortDesc(true);
  };

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (q.trim()) c++;
    if (estadoFilter) c++;
    if (dateFrom) c++;
    if (dateTo) c++;
    if (!sortDesc) c++;
    return c;
  }, [q, estadoFilter, dateFrom, dateTo, sortDesc]);

  const filtered = useMemo(() => {
    let list = rows.slice();

    const qq = q.trim().toLowerCase();
    if (qq) {
      const onlyDigits = /^[0-9]+$/.test(qq);
      list = list.filter((r) => {
        const idStr = String(r.id ?? "");
        const estado = String(r.estado ?? "").toLowerCase();
        const metodo = String(r.metodo_pago ?? "").toLowerCase();
        const entrega = String(r.entrega ?? "").toLowerCase();
        if (onlyDigits) return idStr.includes(qq);
        return idStr.includes(qq) || estado.includes(qq) || metodo.includes(qq) || entrega.includes(qq);
      });
    }

    if (estadoFilter) list = list.filter((r) => r.estado === estadoFilter);

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);
      list = list.filter((r) => {
        const d = parseDateSafe(r.fecha_creacion);
        return d ? d >= from : true;
      });
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`);
      list = list.filter((r) => {
        const d = parseDateSafe(r.fecha_creacion);
        return d ? d <= to : true;
      });
    }

    list.sort((a, b) => {
      const da = parseDateSafe(a.fecha_creacion)?.getTime() ?? 0;
      const db = parseDateSafe(b.fecha_creacion)?.getTime() ?? 0;
      const diff = db - da;
      return sortDesc ? diff : -diff;
    });

    return list;
  }, [rows, q, estadoFilter, dateFrom, dateTo, sortDesc]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pendientes = filtered.filter((r) => r.estado === "PENDIENTE").length;
    const enProceso = filtered.filter((r) => r.estado === "CONFIRMADO" || r.estado === "ENVIADO").length;
    const entregados = filtered.filter((r) => r.estado === "ENTREGADO").length;
    const valor = filtered.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    return { total, pendientes, enProceso, entregados, valor };
  }, [filtered]);

  const goToCatalogo = () => navigate("/empresa/catalogo");

  const emptyState = (
    <MotionBox
      bg={emptyBg}
      borderRadius="2xl"
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={borderLight}
      p={{ base: 8, md: 12 }}
      textAlign="center"
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 18 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <VStack spacing={4}>
        <Icon as={FiPackage} boxSize={12} color={brand} />
        <Heading size="md" color={titleCol}>
          Aún no tienes pedidos
        </Heading>
        <Text color={subtle} maxW="520px" fontSize="sm">
          Cuando conviertas tus compras en pedidos, aquí podrás ver su estado, detalle e historial para tu empresa.
        </Text>
        <Button colorScheme="yellow" rightIcon={<FiArrowRight />} onClick={goToCatalogo} minH="44px">
          Ir al catálogo
        </Button>
      </VStack>
    </MotionBox>
  );

  const FiltersDesktop = (
    <MotionBox
      bg={cardBg}
      p={5}
      borderRadius="2xl"
      boxShadow={shadowMd}
      borderWidth="1px"
      borderColor={borderLight}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
    >
      <Stack direction={{ base: "column", md: "row" }} spacing={4}>
        <Box flex={2}>
          <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
            Buscar
          </Text>
          <InputGroup>
            <InputLeftElement>
              <FiSearch />
            </InputLeftElement>
            <Input placeholder="ID, estado, método, entrega…" value={q} onChange={(e) => setQ(e.target.value)} minH="44px" />
          </InputGroup>
          <HStack mt={2} spacing={2} color={subtle} fontSize="xs" flexWrap="wrap">
            <Text>Tip:</Text>
            <Kbd>Ctrl</Kbd>
            <Text>+</Text>
            <Kbd>F</Kbd>
            <Text>para buscar en toda la página.</Text>
          </HStack>
        </Box>

        <Box minW={{ md: "190px" }}>
          <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
            Estado
          </Text>
          <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} minH="44px">
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="ENVIADO">Enviado</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </Select>
        </Box>

        <Box minW={{ md: "170px" }}>
          <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
            Desde
          </Text>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} minH="44px" />
        </Box>

        <Box minW={{ md: "170px" }}>
          <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
            Hasta
          </Text>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} minH="44px" />
        </Box>

        <Box alignSelf={{ md: "flex-end" }}>
          <HStack>
            <Tooltip label={sortDesc ? "Más recientes primero" : "Más antiguos primero"} hasArrow>
              <IconButton
                icon={sortDesc ? <FiArrowDown /> : <FiArrowUp />}
                onClick={() => setSortDesc((s) => !s)}
                aria-label="Ordenar por fecha"
                borderRadius="full"
                minW="44px"
                minH="44px"
                variant="outline"
              />
            </Tooltip>

            <Tooltip label="Resetear filtros" hasArrow>
              <IconButton
                icon={<FiX />}
                onClick={handleResetFilters}
                aria-label="Resetear filtros"
                borderRadius="full"
                minW="44px"
                minH="44px"
                variant="outline"
                isDisabled={activeFiltersCount === 0}
              />
            </Tooltip>

            <Button leftIcon={<FiRefreshCw />} onClick={() => load({ silent: true })} variant="outline" isLoading={reloading} minH="44px">
              Recargar
            </Button>
          </HStack>
        </Box>
      </Stack>
    </MotionBox>
  );

  const FiltersMobileBar = (
    <Box
      position="sticky"
      top="72px"
      zIndex={6}
      bg={useColorModeValue("rgba(248,249,251,0.92)", "rgba(17,24,39,0.92)")}
      backdropFilter="blur(12px)"
      borderBottom="1px solid"
      borderColor={borderLight}
      py={3}
    >
      <HStack spacing={2}>
        <InputGroup flex={1}>
          <InputLeftElement>
            <FiSearch />
          </InputLeftElement>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (ID, estado, método...)"
            bg={cardBg}
            borderColor={borderLight}
            minH="44px"
          />
        </InputGroup>

        <Tooltip label="Filtros" hasArrow>
          <IconButton
            icon={<FiFilter />}
            onClick={onOpenFilters}
            aria-label="Abrir filtros"
            borderRadius="full"
            minW="44px"
            minH="44px"
            variant="outline"
          />
        </Tooltip>

        <Tooltip label="Reset" hasArrow>
          <IconButton
            icon={<FiX />}
            onClick={handleResetFilters}
            aria-label="Resetear filtros"
            borderRadius="full"
            minW="44px"
            minH="44px"
            variant="outline"
            isDisabled={activeFiltersCount === 0}
          />
        </Tooltip>
      </HStack>

      {(estadoFilter || dateFrom || dateTo || !sortDesc) && (
        <HStack mt={2} spacing={2} flexWrap="wrap">
          <Badge variant="subtle" borderRadius="full">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} activo{activeFiltersCount !== 1 ? "s" : ""}
          </Badge>
          {estadoFilter && (
            <Badge borderRadius="full" colorScheme="yellow">
              Estado: {estadoFilter}
            </Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge borderRadius="full" variant="outline">
              <Icon as={FiCalendar} mr={1} />
              {dateFrom || "…"} → {dateTo || "…"}
            </Badge>
          )}
        </HStack>
      )}
    </Box>
  );

  return (
    <Box as="main" bg={pageBg} minH="100vh" pb={10}>
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }}>
        <Stack spacing={6} py={{ base: 5, md: 8 }}>
          <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
            <Box>
              <HStack mb={2} spacing={2} flexWrap="wrap">
                <Badge colorScheme="yellow">Empresa / Contratista</Badge>
                <Badge variant="outline" borderColor={borderLight}>
                  Módulo de pedidos
                </Badge>
                {errorMsg && (
                  <HStack spacing={1} color="red.400" fontSize="xs">
                    <Icon as={FiAlertCircle} />
                    <Text noOfLines={1}>{errorMsg}</Text>
                  </HStack>
                )}
              </HStack>

              <Heading size="lg" color={titleCol}>
                Mis pedidos
              </Heading>
              <Text color={subtle} mt={2} maxW="720px" fontSize="sm">
                Consulta el estado de tus pedidos, revisa el detalle y mantén control de entregas y costos de envío.
              </Text>
            </Box>

            <HStack spacing={2} justify={{ base: "flex-start", md: "flex-end" }}>
              <Tooltip label="Recargar listado" hasArrow>
                <IconButton
                  icon={<FiRefreshCw />}
                  isLoading={reloading}
                  onClick={() => load({ silent: true })}
                  aria-label="Recargar"
                  borderRadius="full"
                  variant="outline"
                  minW="44px"
                  minH="44px"
                />
              </Tooltip>

              <Button colorScheme="yellow" rightIcon={<FiArrowRight />} onClick={goToCatalogo} minH="44px">
                Ir al catálogo
              </Button>
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
            <MotionBox bg={cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderLight} boxShadow={shadowMd}>
              <Text fontSize="sm" color={subtle}>Total</Text>
              <Heading size="lg" mt={1} color={titleCol}>{loading ? "—" : stats.total}</Heading>
            </MotionBox>
            <MotionBox bg={cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderLight} boxShadow={shadowMd}>
              <Text fontSize="sm" color={subtle}>Pendientes</Text>
              <Heading size="lg" mt={1} color={titleCol}>{loading ? "—" : stats.pendientes}</Heading>
            </MotionBox>
            <MotionBox bg={cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderLight} boxShadow={shadowMd}>
              <Text fontSize="sm" color={subtle}>En proceso</Text>
              <Heading size="lg" mt={1} color={titleCol}>{loading ? "—" : stats.enProceso}</Heading>
            </MotionBox>
            <MotionBox bg={cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderLight} boxShadow={shadowMd}>
              <Text fontSize="sm" color={subtle}>Entregados</Text>
              <Heading size="lg" mt={1} color={titleCol}>{loading ? "—" : stats.entregados}</Heading>
            </MotionBox>
            <MotionBox bg={cardBg} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderLight} boxShadow={shadowMd}>
              <Text fontSize="sm" color={subtle}>Valor (filtrado)</Text>
              <Heading size="md" mt={2} color={titleCol}>{loading ? "—" : fmtCop(stats.valor)}</Heading>
            </MotionBox>
          </SimpleGrid>

          {isMobile ? FiltersMobileBar : FiltersDesktop}

          <MotionBox bg={cardBg} borderRadius="2xl" boxShadow={shadowLg} overflow="hidden" borderWidth="1px" borderColor={borderLight}>
            <Box px={4} py={3} borderBottomWidth="1px" borderColor={borderLight}>
              <Flex justify="space-between" align="center" gap={2}>
                <Text fontSize="sm" fontWeight="semibold" color={titleCol}>
                  {loading ? "Cargando..." : `${filtered.length} pedido${filtered.length !== 1 ? "s" : ""}`}
                </Text>
                {!loading && activeFiltersCount > 0 && (
                  <Badge variant="subtle" borderRadius="full">
                    {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} activo{activeFiltersCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </Flex>
            </Box>

            {loading ? (
              <Stack p={6} spacing={4}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height="64px" borderRadius="lg" />
                ))}
              </Stack>
            ) : filtered.length === 0 ? (
              <Box p={{ base: 5, md: 8 }}>{emptyState}</Box>
            ) : isMobile ? (
              <Box p={4}>
                <VStack spacing={3} align="stretch">
                  {filtered.map((r) => (
                    <MotionBox
                      key={r.id}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="xl"
                      p={4}
                      borderWidth="1px"
                      borderColor={borderLight}
                      boxShadow={shadowSm}
                      whileHover={prefersReducedMotion ? {} : { y: -1 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => openDetalle(r.id)}
                      cursor="pointer"
                    >
                      <HStack justify="space-between" align="start" spacing={3}>
                        <VStack align="start" spacing={0} minW={0}>
                          <Text fontSize="xs" color={subtle}>Pedido</Text>
                          <Text fontWeight="bold" fontSize="lg" noOfLines={1}>#{r.id}</Text>
                          <Text fontSize="xs" color={subtle} noOfLines={1}>
                            {formatDateShort(r.fecha_creacion)} • {formatTimeShort(r.fecha_creacion)}
                          </Text>
                        </VStack>

                        <VStack align="end" spacing={2}>
                          <EstadoBadge estado={r.estado} />
                          <Text fontWeight="bold" color={titleCol}>{fmtCop(r.total)}</Text>
                        </VStack>
                      </HStack>

                      <Divider my={3} />

                      <HStack justify="space-between" fontSize="sm">
                        <Text color={subtle}>Método</Text>
                        <Text fontWeight="medium">{r.metodo_pago || "—"}</Text>
                      </HStack>
                      <HStack justify="space-between" fontSize="sm" mt={1}>
                        <Text color={subtle}>Entrega</Text>
                        <Text fontWeight="medium" noOfLines={1}>{r.entrega || "—"}</Text>
                      </HStack>

                      <HStack justify="flex-end" mt={3}>
                        <Button
                          size="sm"
                          leftIcon={<FiEye />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetalle(r.id);
                          }}
                          minH="44px"
                        >
                          Ver detalle
                        </Button>
                      </HStack>
                    </MotionBox>
                  ))}
                </VStack>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="md">
                  <Thead bg={theadBg}>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Fecha</Th>
                      <Th>Método</Th>
                      <Th>Entrega</Th>
                      <Th isNumeric>Total</Th>
                      <Th>Estado</Th>
                      <Th />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filtered.map((r) => (
                      <Tr key={r.id} _hover={{ bg: rowHoverBg }}>
                        <Td>
                          <Badge colorScheme="yellow" borderRadius="full" px={3} py={1} fontSize="xs">
                            #{r.id}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontWeight="medium" color={titleCol}>{formatDateShort(r.fecha_creacion)}</Text>
                          <Text fontSize="xs" color={subtle}>{formatTimeShort(r.fecha_creacion)}</Text>
                        </Td>
                        <Td><Text noOfLines={1}>{r.metodo_pago || "—"}</Text></Td>
                        <Td maxW="260px"><Text noOfLines={1}>{r.entrega || "—"}</Text></Td>
                        <Td isNumeric>
                          <Text fontWeight="semibold" color={titleCol}>{fmtCop(r.total)}</Text>
                        </Td>
                        <Td><EstadoBadge estado={r.estado} /></Td>
                        <Td>
                          <HStack justify="flex-end">
                            <Tooltip label="Ver detalle" hasArrow>
                              <IconButton
                                icon={<FiEye />}
                                aria-label="Ver detalle"
                                colorScheme="yellow"
                                onClick={() => openDetalle(r.id)}
                                borderRadius="full"
                                minW="44px"
                                minH="44px"
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </MotionBox>
        </Stack>
      </Box>

      <Drawer isOpen={isFiltersOpen} placement="bottom" onClose={onCloseFilters} size="full">
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderLight}>
            <HStack justify="space-between" pr={10}>
              <HStack spacing={2}>
                <Icon as={FiFilter} />
                <Text>Filtros</Text>
              </HStack>
              <Badge variant="subtle" borderRadius="full">
                {activeFiltersCount} activo{activeFiltersCount !== 1 ? "s" : ""}
              </Badge>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <Stack spacing={4} py={4}>
              <Box>
                <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
                  Estado
                </Text>
                <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} minH="44px">
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="ENVIADO">Enviado</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </Select>
              </Box>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
                    Desde
                  </Text>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} minH="44px" />
                </Box>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
                    Hasta
                  </Text>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} minH="44px" />
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
                  Orden
                </Text>
                <Button
                  leftIcon={sortDesc ? <FiArrowDown /> : <FiArrowUp />}
                  onClick={() => setSortDesc((s) => !s)}
                  variant="outline"
                  w="full"
                  minH="44px"
                >
                  {sortDesc ? "Más recientes primero" : "Más antiguos primero"}
                </Button>
              </Box>

              <Divider />

              <HStack>
                <Button
                  leftIcon={<FiX />}
                  onClick={handleResetFilters}
                  variant="outline"
                  w="full"
                  minH="44px"
                  isDisabled={activeFiltersCount === 0}
                >
                  Resetear
                </Button>
                <Button colorScheme="yellow" onClick={onCloseFilters} w="full" minH="44px">
                  Aplicar
                </Button>
              </HStack>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ✅ MODAL DETALLE (FIX scroll + FIX isCentered mobile) */}
      <Modal
        isOpen={isOpen}
        onClose={closeDetalle}
        size={isMobile ? "full" : "2xl"}
        isCentered={!isMobile}
        motionPreset="slideInBottom"
        scrollBehavior="inside"
        closeOnOverlayClick
        closeOnEsc
        initialFocusRef={initialFocusRef}
      >
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent
          borderRadius={isMobile ? "0" : "2xl"}
          m={isMobile ? 0 : 4}
          h={isMobile ? "100dvh" : "auto"}
          maxH={isMobile ? "100dvh" : "calc(100dvh - 3rem)"}
          overflow="hidden"
        >
          <ModalHeader>
            <HStack justify="space-between" align="start" pr={10}>
              <VStack align="start" spacing={0} minW={0}>
                <Text fontSize="xs" color={subtle} textTransform="uppercase">
                  Detalle del pedido
                </Text>
                <Heading size="md" color={titleCol} noOfLines={1}>
                  {det?.id ? `Pedido #${det.id}` : "Pedido"}
                </Heading>
              </VStack>
              {det?.estado && <EstadoBadge estado={det.estado} />}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <AnimatePresence mode="wait">
              {detLoading ? (
                <MotionBox key="loading" initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Stack spacing={3}>
                    <Skeleton height="20px" />
                    <Skeleton height="16px" />
                    <Skeleton height="120px" borderRadius="lg" />
                    <SkeletonText noOfLines={5} mt={4} spacing={2} />
                  </Stack>
                </MotionBox>
              ) : det ? (
                <MotionBox key="content" initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Stack spacing={5}>
                    <Box
                      p={4}
                      bg={useColorModeValue("gray.50", "gray.700")}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderLight}
                      boxShadow={shadowSm}
                    >
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} fontSize="sm">
                        <HStack justify="space-between">
                          <Text color={subtle}>Fecha</Text>
                          <Text fontWeight="medium">
                            {formatDateShort(det.fecha_creacion)} • {formatTimeShort(det.fecha_creacion)}
                          </Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text color={subtle}>Método</Text>
                          <Text fontWeight="medium">{det.metodo_pago || "—"}</Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text color={subtle}>Entrega</Text>
                          <Text fontWeight="medium" noOfLines={1}>{det.entrega || "—"}</Text>
                        </HStack>

                        <HStack justify="space-between">
                          <Text color={subtle}>Costo envío</Text>
                          <Text fontWeight="medium">{fmtCop(det.costo_envio)}</Text>
                        </HStack>
                      </SimpleGrid>

                      <Divider my={3} />

                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg">Total</Text>
                        <Text fontWeight="bold" fontSize="lg" color={brand}>{fmtCop(det.total)}</Text>
                      </HStack>
                    </Box>

                    <Box>
                      <HStack justify="space-between" mb={3}>
                        <Heading size="sm" color={titleCol}>Seguimiento</Heading>
                        <EstadoBadge estado={det.estado} />
                      </HStack>

                      <Box p={4} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderLight} boxShadow={shadowSm}>
                        <PedidoStepper estado={det.estado} brandColor={brand} />
                        <Divider my={3} />
                        <HStack justify="space-between">
                          <Text fontSize="sm" color={subtle}>Estado actual</Text>
                          <EstadoBadge estado={det.estado} />
                        </HStack>
                      </Box>
                    </Box>

                    <Box>
                      <HStack justify="space-between" mb={3}>
                        <Heading size="sm" color={titleCol}>Productos del pedido</Heading>
                        <Badge variant="outline" borderColor={borderLight} borderRadius="full">
                          {(det.detalles?.length || 0)} ítem{(det.detalles?.length || 0) !== 1 ? "s" : ""}
                        </Badge>
                      </HStack>

                      {!det.detalles?.length ? (
                        <Text fontSize="sm" color={subtle}>No se encontraron detalles de productos para este pedido.</Text>
                      ) : (
                        <VStack align="stretch" spacing={3}>
                          {det.detalles.map((d, i) => {
                            const src = buildImg(d.imagen_url);
                            const precio = Number(d.precio_unitario) || 0;
                            const cant = Number(d.cantidad) || 0;
                            const subtotalLinea = Number(d.subtotal) || precio * cant;

                            return (
                              <Box key={`${d.producto_id}-${i}`} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderLight} p={3}>
                                <HStack align="start" spacing={3}>
                                  <Box
                                    boxSize="64px"
                                    borderRadius="lg"
                                    overflow="hidden"
                                    bg="white"
                                    borderWidth="1px"
                                    borderColor={borderLight}
                                    flexShrink={0}
                                    display="grid"
                                    placeItems="center"
                                  >
                                    <Image src={src} alt={d.nombre} boxSize="64px" objectFit="contain" loading="lazy" />
                                  </Box>

                                  <VStack align="start" spacing={1} flex={1} minW={0}>
                                    <Text fontWeight="semibold" noOfLines={2}>{d.nombre}</Text>
                                    <Text fontSize="xs" color={subtle}>
                                      {fmtCop(precio)} c/u × {cant}
                                    </Text>
                                  </VStack>

                                  <VStack align="end" spacing={1} flexShrink={0}>
                                    <Text fontWeight="bold">{fmtCop(subtotalLinea)}</Text>
                                  </VStack>
                                </HStack>
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>

                    <HStack justify="space-between" pt={1}>
                      <Button ref={initialFocusRef} variant="outline" onClick={closeDetalle} minH="44px">
                        Cerrar
                      </Button>

                      <Button
                        rightIcon={<FiArrowRight />}
                        onClick={() => {
                          closeDetalle();
                          goToCatalogo();
                        }}
                        minH="44px"
                      >
                        Seguir comprando
                      </Button>
                    </HStack>
                  </Stack>
                </MotionBox>
              ) : null}
            </AnimatePresence>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}