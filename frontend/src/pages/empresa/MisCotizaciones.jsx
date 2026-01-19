import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
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
  useColorModeValue,
  useDisclosure,
  usePrefersReducedMotion,
  useToast,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  Spacer,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiCreditCard,
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

/* ====================== Ruta de Checkout / Pasarela ====================== */
const CHECKOUT_EMPRESA_PATH = "/empresa/checkout-empresa";

/* ====================== Tokens de diseño ====================== */
const useSurfaceTokens = () => {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderLight = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.400");
  const titleCol = useColorModeValue("gray.900", "white");
  const brandColor = "#F9BF20";

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

  return {
    pageBg,
    cardBg,
    borderLight,
    subtle,
    titleCol,
    brandColor,
    shadowSm,
    shadowMd,
    shadowLg,
  };
};

/* ====================== Helpers ====================== */
// ✅ framer-motion v11: motion.create()
const motionCreate = motion?.create ? motion.create : (c) => motion(c);
const MotionBox = motionCreate(Box);
const MotionTr = motionCreate(Tr);

const ESTADO_COLORS = {
  PENDIENTE: { colorScheme: "yellow", icon: FiClock, label: "Pendiente" },
  ACEPTADA: { colorScheme: "green", icon: FiCheckCircle, label: "Aprobada" },
  RECHAZADA: { colorScheme: "red", icon: FiX, label: "Rechazada" },
  CONVERTIDA: {
    colorScheme: "blue",
    icon: FiFileText,
    label: "Convertida en pedido",
  },
};

function parseDateSafe(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isCotizacionVigente(c) {
  if (!c) return false;
  if (c.estado_vigencia) return c.estado_vigencia !== "VENCIDA";

  const hoy = new Date();
  const fin =
    parseDateSafe(c.fecha_vigencia) ||
    parseDateSafe(c.vigencia_hasta) ||
    parseDateSafe(c.fecha_vencimiento) ||
    parseDateSafe(c.vigenciaHasta);

  if (!fin) return true;
  return fin >= hoy;
}

function getEstadoGestion(c) {
  return (c?.estado_gestion || c?.estado || "PENDIENTE").toUpperCase();
}

// ✅ SOLO pagable si: ACEPTADA + VIGENTE
function canPagarCotizacion(c) {
  return getEstadoGestion(c) === "ACEPTADA" && isCotizacionVigente(c);
}

function formatDate(value) {
  const d = parseDateSafe(value);
  if (!d) return "-";
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function normalizeList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.cotizaciones)) return raw.cotizaciones;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function normalizeDetalle(raw) {
  if (!raw) return null;
  if (raw.cotizacion) return raw.cotizacion;
  if (raw.data) return raw.data;
  return raw;
}

function getUrlCotizacionId() {
  return new URLSearchParams(window.location.search).get("cotizacionId");
}

/* ====================== UI helpers ====================== */
function EstadoPills({ estadoRaw, cotizacion, compact = false }) {
  const estadoGestion = (estadoRaw || "PENDIENTE").toUpperCase();
  const info = ESTADO_COLORS[estadoGestion] || ESTADO_COLORS.PENDIENTE;
  const IconEstado = info.icon;
  const vigente = isCotizacionVigente(cotizacion);

  const Wrap = compact ? HStack : VStack;
  const wrapProps = compact
    ? { spacing: 2, align: "center", flexWrap: "wrap" }
    : { spacing: 1, align: "flex-start" };

  return (
    <Wrap {...wrapProps}>
      <Badge
        colorScheme={info.colorScheme}
        borderRadius="full"
        px={2}
        py={1}
        display="inline-flex"
        alignItems="center"
        gap={1}
      >
        <Icon as={IconEstado} boxSize={3.5} />
        <Text fontSize="xs" fontWeight="semibold">
          {info.label}
        </Text>
      </Badge>

      <Badge
        colorScheme={!vigente ? "red" : "green"}
        variant="subtle"
        borderRadius="full"
        fontSize="0.65rem"
      >
        {!vigente ? "Vencida" : "Vigente"}
      </Badge>
    </Wrap>
  );
}

function ProductoItemCard({ p, subtle, borderLight }) {
  const nombre = p.nombre || p.producto_nombre || "Producto";
  const cantidad = Number(p.cantidad) || 0;
  const precio = p.precio_unitario || p.precio || p.valor_unitario || 0;
  const subtotal =
    p.subtotal || p.total || Number(cantidad * (Number(precio) || 0));

  return (
    <Box borderWidth="1px" borderRadius="lg" p={3} borderColor={borderLight}>
      <HStack justify="space-between" align="start" gap={3}>
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" noOfLines={2}>
            {nombre}
          </Text>
          {p.descripcion && (
            <Text fontSize="xs" color={subtle} noOfLines={1}>
              {p.descripcion}
            </Text>
          )}
        </Box>
        <VStack align="end" spacing={0} flexShrink={0}>
          <Text fontSize="xs" color={subtle}>
            Cant.
          </Text>
          <Text fontWeight="semibold">{cantidad}</Text>
        </VStack>
      </HStack>

      <HStack justify="space-between" mt={3}>
        <Text fontSize="sm" color={subtle}>
          {formatCurrency(precio)} c/u
        </Text>
        <Text fontWeight="semibold">{formatCurrency(subtotal)}</Text>
      </HStack>
    </Box>
  );
}

/* ====================== Componente Principal ====================== */
export default function MisCotizaciones() {
  const navigate = useNavigate();
  const toast = useToast();
  const detalleModal = useDisclosure();
  const filtrosDrawer = useDisclosure();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = usePrefersReducedMotion();

  const isMobile = useBreakpointValue({ base: true, md: false });
  const detailSize = useBreakpointValue({ base: "full", md: "xl", lg: "2xl" });

  const {
    pageBg,
    cardBg,
    borderLight,
    subtle,
    titleCol,
    brandColor,
    shadowSm,
    shadowMd,
    shadowLg,
  } = useSurfaceTokens();

  const emptyBg = useColorModeValue("yellow.50", "yellow.900Alpha.100");
  const theadBg = useColorModeValue("gray.100", "gray.800");
  const productosHeadBg = useColorModeValue("gray.100", "gray.800");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");
  const [vigenciaFilter, setVigenciaFilter] = useState("TODAS");

  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // ✅ Para evitar que una respuesta “tarde” reabra el modal:
  const detalleReqIdRef = useRef(0);
  // ✅ Guard para evitar re-fetch del mismo id
  const lastIdRef = useRef(null);

  /* ============== Carga listado: GET /cotizaciones ============== */
  const fetchCotizaciones = useCallback(
    async (opts = { silent: false }) => {
      try {
        if (!opts.silent) setLoading(true);
        else setReloading(true);

        setErrorMsg("");

        const res = await api.get("/cotizaciones");
        const list = normalizeList(res.data);
        setCotizaciones(list || []);
      } catch (err) {
        console.error("Error cargando cotizaciones", err);
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "No fue posible cargar tus cotizaciones. Intenta nuevamente.";
        setErrorMsg(msg);
        toast({
          title: "Error al cargar cotizaciones",
          description: msg,
          status: "error",
          duration: 6000,
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
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  /* ============== Carga detalle: GET /cotizaciones/:id ============== */
  const fetchDetalleCotizacion = useCallback(
    async (idRaw) => {
      const id = String(idRaw || "").trim();
      if (!id) return;

      const reqId = ++detalleReqIdRef.current;

      try {
        setLoadingDetalle(true);

        const res = await api.get(`/cotizaciones/${id}`);
        const detalle = normalizeDetalle(res.data);

        // ✅ Si el usuario ya cerró / cambió el id en URL, NO reabrimos.
        const current = getUrlCotizacionId();
        if (String(current || "") !== String(id)) return;

        // ✅ Si esta respuesta no es la última, ignorar.
        if (reqId !== detalleReqIdRef.current) return;

        setSelectedCotizacion(detalle || null);
      } catch (err) {
        console.error("Error cargando detalle cotización", err);
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "No fue posible cargar el detalle de la cotización.";
        toast({
          title: "Error al cargar detalle",
          description: msg,
          status: "error",
          duration: 6000,
          isClosable: true,
        });
      } finally {
        if (reqId === detalleReqIdRef.current) {
          setLoadingDetalle(false);
        }
      }
    },
    [toast]
  );

  // ✅ ÚNICA fuente de verdad: query ?cotizacionId=
  useEffect(() => {
    const idParam = searchParams.get("cotizacionId");

    if (idParam) {
      detalleModal.onOpen();

      // ✅ solo fetchea si cambió el id
      if (lastIdRef.current !== String(idParam)) {
        lastIdRef.current = String(idParam);
        fetchDetalleCotizacion(idParam);
      }
      return;
    }

    // si no hay param: cerrar + limpiar
    lastIdRef.current = null;
    detalleModal.onClose();
    setSelectedCotizacion(null);
    detalleReqIdRef.current++; // mata requests en vuelo
    setLoadingDetalle(false);
  }, [searchParams, fetchDetalleCotizacion, detalleModal]);

  /* ============== Filtros ============== */
  const filteredCotizaciones = useMemo(() => {
    let data = [...cotizaciones];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((c) => {
        const codigo = (c.codigo || `COT-${c.id}`).toString().toLowerCase();
        const obs = (c.observaciones || c.comentarios || "").toLowerCase();
        const cliente = (
          c.username ||
          c.empresa_nombre ||
          c.cliente_nombre ||
          c.nombre_empresa ||
          c.contacto_nombre ||
          ""
        ).toLowerCase();
        const contacto = (c.email || c.contacto_email || "").toLowerCase();
        return (
          codigo.includes(s) ||
          obs.includes(s) ||
          cliente.includes(s) ||
          contacto.includes(s)
        );
      });
    }

    if (estadoFilter !== "TODAS") {
      data = data.filter((c) => (c.estado_gestion || c.estado) === estadoFilter);
    }

    if (vigenciaFilter === "VIGENTES") {
      data = data.filter((c) => isCotizacionVigente(c));
    } else if (vigenciaFilter === "VENCIDAS") {
      data = data.filter((c) => !isCotizacionVigente(c));
    }

    return data;
  }, [cotizaciones, search, estadoFilter, vigenciaFilter]);

  const stats = useMemo(() => {
    const total = cotizaciones.length;
    const vigentes = cotizaciones.filter((c) => isCotizacionVigente(c)).length;
    const aprobadas = cotizaciones.filter(
      (c) => (c.estado_gestion || c.estado) === "ACEPTADA"
    ).length;
    const vencidas = cotizaciones.filter((c) => !isCotizacionVigente(c)).length;
    const valorTotal = cotizaciones.reduce(
      (acc, c) => acc + (Number(c.total) || 0),
      0
    );
    return { total, vigentes, aprobadas, vencidas, valorTotal };
  }, [cotizaciones]);

  const resumenEconomico = useMemo(() => {
    if (!selectedCotizacion) {
      return { subtotal: 0, descuento: 0, total: 0, baseIva: 0, iva: 0 };
    }

    const total =
      Number(selectedCotizacion.total) ||
      Number(selectedCotizacion.total_cotizacion) ||
      0;

    const descuento =
      Number(
        selectedCotizacion.descuento_total ||
          selectedCotizacion.descuento ||
          0
      ) || 0;

    const baseIva =
      Number(selectedCotizacion.base_iva) ||
      Number(selectedCotizacion.baseIva) ||
      0;

    const iva =
      Number(selectedCotizacion.iva) ||
      Number(selectedCotizacion.total_iva) ||
      0;

    const subtotalExplicito =
      Number(selectedCotizacion.subtotal) ||
      Number(selectedCotizacion.subtotal_sin_descuento) ||
      0;

    const subtotalCalculado = baseIva + iva > 0 ? baseIva + iva : total + descuento;

    return {
      subtotal: subtotalExplicito || subtotalCalculado,
      descuento,
      total,
      baseIva,
      iva,
    };
  }, [selectedCotizacion]);

  /* ============== Handlers UI ============== */
  const handleOpenDetalle = (c) => {
    setSearchParams({ cotizacionId: String(c.id) });
  };

  const handleCloseDetalle = () => {
    detalleReqIdRef.current++;
    lastIdRef.current = null;
    setLoadingDetalle(false);
    setSelectedCotizacion(null);

    setSearchParams({}, { replace: true });
    detalleModal.onClose();
  };

  const handleDownloadPdf = async (cotizacion) => {
    try {
      const id = cotizacion.id;
      const res = await api.get(`/cotizaciones/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const codigo = cotizacion.codigo || `cotizacion-${id}`;
      link.href = url;
      link.download = `${codigo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error descargando PDF", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "No se pudo descargar el PDF de la cotización.";
      toast({
        title: "Descarga fallida",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  // ✅ AHORA: Nueva cotización -> /empresa (tu URL http://localhost:5173/empresa)
  const handleCrearNuevaCotizacion = () => {
    navigate("/empresa");
  };

  const handleClearFilters = () => {
    setSearch("");
    setEstadoFilter("TODAS");
    setVigenciaFilter("TODAS");
  };

  const handleIrAPasarela = (cot) => {
    if (!cot?.id) return;
    handleCloseDetalle();
    navigate(`${CHECKOUT_EMPRESA_PATH}?cotizacionId=${encodeURIComponent(cot.id)}`, {
      state: { cotizacionId: cot.id, cotizacion: cot },
    });
  };

  const handleIrAPasarelaListado = (cot) => {
    if (!cot?.id) return;
    navigate(`${CHECKOUT_EMPRESA_PATH}?cotizacionId=${encodeURIComponent(cot.id)}`, {
      state: { cotizacionId: cot.id, cotizacion: cot },
    });
  };

  const emptyState = (
    <MotionBox
      bg={emptyBg}
      borderRadius="2xl"
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={borderLight}
      p={{ base: 7, md: 12 }}
      textAlign="center"
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <VStack spacing={4}>
        <Icon as={FiFileText} boxSize={11} color={brandColor} />
        <Heading size="md" color={titleCol}>
          Aún no tienes cotizaciones
        </Heading>
        <Text color={subtle} maxW="420px" fontSize="sm">
          Crea tu primera cotización y revisa vigencia/estado antes de pagar.
        </Text>
        <Button
          colorScheme="yellow"
          rightIcon={<FiArrowRight />}
          onClick={handleCrearNuevaCotizacion}
          h="46px"
          w={{ base: "full", sm: "auto" }}
        >
          Ir al inicio empresa
        </Button>
      </VStack>
    </MotionBox>
  );

  const filtrosActivos =
    (estadoFilter !== "TODAS" ? 1 : 0) + (vigenciaFilter !== "TODAS" ? 1 : 0);

  /* ====================== Render ====================== */
  return (
    <Box
      as="main"
      bg={pageBg}
      minH="100vh"
      py={{ base: 4, md: 8 }}
      pb={{ base: "84px", md: 8 }} // ✅ espacio para barra fija mobile
    >
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }}>
        <Stack spacing={{ base: 5, md: 8 }}>
          {/* Header (mobile-first) */}
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={{ base: 3, md: 4 }}
          >
            <Box>
              <HStack mb={2} spacing={2} flexWrap="wrap">
                <Badge colorScheme="yellow">Empresa / Contratista</Badge>
                <Badge variant="outline" borderColor={borderLight}>
                  Cotizaciones
                </Badge>
              </HStack>

              <Heading size={{ base: "md", md: "lg" }} color={titleCol}>
                Mis cotizaciones
              </Heading>

              <Text color={subtle} mt={2} maxW="640px" fontSize={{ base: "sm", md: "sm" }}>
                Revisa estado y vigencia antes de pagar o convertir.
              </Text>
            </Box>

            {/* Desktop actions (en mobile se van a la barra fija) */}
            <HStack
              justify={{ base: "space-between", md: "flex-end" }}
              w={{ base: "full", md: "auto" }}
              display={{ base: "none", md: "flex" }}
            >
              <Tooltip label="Recargar listado" hasArrow>
                <IconButton
                  icon={<FiRefreshCw />}
                  isLoading={reloading}
                  onClick={() => fetchCotizaciones({ silent: true })}
                  aria-label="Recargar"
                  borderRadius="full"
                  variant="outline"
                  h="44px"
                  w="44px"
                />
              </Tooltip>

              <Button
                colorScheme="yellow"
                rightIcon={<FiArrowRight />}
                onClick={handleCrearNuevaCotizacion}
                h="44px"
              >
                Nueva cotización
              </Button>
            </HStack>
          </Flex>

          {/* KPIs (compactos en mobile) */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
            <MotionBox bg={cardBg} p={{ base: 4, md: 5 }} borderRadius="xl" boxShadow={shadowMd}>
              <Text fontSize="xs" color={subtle}>
                Total
              </Text>
              <Heading size={{ base: "md", md: "lg" }} mt={1} color={titleCol}>
                {stats.total}
              </Heading>
            </MotionBox>

            <MotionBox bg={cardBg} p={{ base: 4, md: 5 }} borderRadius="xl" boxShadow={shadowMd}>
              <Text fontSize="xs" color={subtle}>
                Vigentes
              </Text>
              <Heading size={{ base: "md", md: "lg" }} mt={1} color={titleCol}>
                {stats.vigentes}
              </Heading>
            </MotionBox>

            <MotionBox bg={cardBg} p={{ base: 4, md: 5 }} borderRadius="xl" boxShadow={shadowMd}>
              <Text fontSize="xs" color={subtle}>
                Aprobadas
              </Text>
              <Heading size={{ base: "md", md: "lg" }} mt={1} color={titleCol}>
                {stats.aprobadas}
              </Heading>
            </MotionBox>

            <MotionBox bg={cardBg} p={{ base: 4, md: 5 }} borderRadius="xl" boxShadow={shadowMd}>
              <Text fontSize="xs" color={subtle}>
                Valor total
              </Text>
              <Heading size={{ base: "md", md: "lg" }} mt={1} color={titleCol} noOfLines={1}>
                {formatCurrency(stats.valorTotal)}
              </Heading>
            </MotionBox>
          </SimpleGrid>

          {/* Filtros: mobile (simple) + desktop (completo) */}
          <MotionBox bg={cardBg} p={{ base: 4, md: 5 }} borderRadius="2xl" boxShadow={shadowMd}>
            <Stack direction={{ base: "column", md: "row" }} spacing={{ base: 3, md: 4 }}>
              {/* Search */}
              <Box flex={2}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={subtle}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Buscar
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} />
                  </InputLeftElement>
                  <Input
                    placeholder="Código, cliente, comentarios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    h="44px"
                  />
                </InputGroup>

                <HStack mt={1} spacing={2} color={subtle} fontSize="xs" display={{ base: "none", md: "flex" }}>
                  <Text>Tip:</Text>
                  <Kbd>Ctrl</Kbd>
                  <Text>+</Text>
                  <Kbd>F</Kbd>
                  <Text>para buscar en toda la página.</Text>
                </HStack>
              </Box>

              {/* Desktop selects */}
              <Box w={{ base: "full", md: "220px" }} display={{ base: "none", md: "block" }}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={subtle}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Estado
                </Text>
                <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} h="44px">
                  <option value="TODAS">Todos</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="ACEPTADA">Aprobadas</option>
                  <option value="RECHAZADA">Rechazadas</option>
                  <option value="CONVERTIDA">Convertidas</option>
                </Select>
              </Box>

              <Box w={{ base: "full", md: "220px" }} display={{ base: "none", md: "block" }}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={subtle}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Vigencia
                </Text>
                <Select value={vigenciaFilter} onChange={(e) => setVigenciaFilter(e.target.value)} h="44px">
                  <option value="TODAS">Todas</option>
                  <option value="VIGENTES">Vigentes</option>
                  <option value="VENCIDAS">Vencidas</option>
                </Select>
              </Box>

              {/* Desktop actions */}
              <Box alignSelf={{ base: "flex-start", md: "flex-end" }} display={{ base: "none", md: "block" }}>
                <HStack>
                  <Tooltip label="Limpiar filtros" hasArrow>
                    <IconButton
                      icon={<FiX />}
                      onClick={handleClearFilters}
                      aria-label="Limpiar filtros"
                      borderRadius="full"
                      h="44px"
                      w="44px"
                      variant="outline"
                    />
                  </Tooltip>
                  <Button
                    leftIcon={<FiRefreshCw />}
                    isLoading={reloading}
                    onClick={() => fetchCotizaciones({ silent: true })}
                    variant="outline"
                    h="44px"
                  >
                    Recargar
                  </Button>
                </HStack>
              </Box>

              {/* Mobile actions: Filtros + limpiar (abre Drawer) */}
              <HStack spacing={2} display={{ base: "flex", md: "none" }}>
                <Button
                  leftIcon={<FiFilter />}
                  variant="outline"
                  h="44px"
                  w="full"
                  onClick={filtrosDrawer.onOpen}
                >
                  Filtros{filtrosActivos ? ` (${filtrosActivos})` : ""}
                </Button>
                <IconButton
                  icon={<FiX />}
                  aria-label="Limpiar"
                  variant="outline"
                  h="44px"
                  w="44px"
                  onClick={handleClearFilters}
                />
              </HStack>

              {/* Chips informativos (mobile) */}
              <HStack spacing={2} mt={{ base: 2, md: 0 }} display={{ base: "flex", md: "none" }} flexWrap="wrap">
                <Badge variant="subtle" borderRadius="full">
                  Estado: {estadoFilter}
                </Badge>
                <Badge variant="subtle" borderRadius="full">
                  Vigencia: {vigenciaFilter}
                </Badge>
              </HStack>
            </Stack>
          </MotionBox>

          {/* Listado */}
          <MotionBox bg={cardBg} borderRadius="2xl" boxShadow={shadowLg} overflow="hidden">
            <Box px={4} py={3} borderBottomWidth="1px" borderColor={borderLight}>
              <Flex justify="space-between" align="center" gap={3}>
                <Text fontSize="sm" fontWeight="semibold" color={titleCol}>
                  {filteredCotizaciones.length} cotización
                  {filteredCotizaciones.length !== 1 && "es"} encontrada
                  {filteredCotizaciones.length !== 1 && "s"}
                </Text>

                {errorMsg && (
                  <HStack spacing={1} color="red.400" fontSize="xs" maxW="55%">
                    <Icon as={FiAlertCircle} />
                    <Text noOfLines={1}>{errorMsg}</Text>
                  </HStack>
                )}
              </Flex>
            </Box>

            {loading ? (
              <Stack p={6} spacing={4}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} height="72px" borderRadius="lg" />
                ))}
              </Stack>
            ) : filteredCotizaciones.length === 0 ? (
              <Box p={6}>{emptyState}</Box>
            ) : (
              <>
                {/* ✅ Mobile: Cards (más cómodas) */}
                <Box display={{ base: "block", md: "none" }} p={4}>
                  <Stack spacing={3}>
                    {filteredCotizaciones.map((c) => {
                      const codigo = c.codigo || `COT-${c.id}`;
                      const cliente =
                        c.empresa_nombre ||
                        c.cliente_nombre ||
                        c.nombre_empresa ||
                        c.username ||
                        "Sin nombre";

                      const pagable = canPagarCotizacion(c);

                      return (
                        <MotionBox
                          key={c.id}
                          borderWidth="1px"
                          borderColor={borderLight}
                          borderRadius="2xl"
                          p={4}
                          whileHover={prefersReducedMotion ? {} : { y: -1 }}
                          transition={{ duration: 0.15 }}
                        >
                          <HStack justify="space-between" align="start" gap={3}>
                            <Box flex={1} minW={0}>
                              <HStack spacing={2} flexWrap="wrap">
                                <Badge
                                  colorScheme="yellow"
                                  borderRadius="full"
                                  px={3}
                                  py={1}
                                  fontSize="xs"
                                >
                                  {codigo}
                                </Badge>
                                <EstadoPills estadoRaw={c.estado_gestion || c.estado} cotizacion={c} compact />
                              </HStack>

                              <Text mt={2} fontWeight="semibold" noOfLines={1} color={titleCol}>
                                {cliente}
                              </Text>

                              <Text fontSize="xs" color={subtle} noOfLines={1}>
                                {c.contacto_nombre || c.contacto_email || c.email || "—"}
                              </Text>
                            </Box>

                            <VStack align="end" spacing={0} flexShrink={0}>
                              <Text fontWeight="bold" color={titleCol}>
                                {formatCurrency(c.total)}
                              </Text>
                              <Text fontSize="xs" color={subtle}>
                                {formatDate(c.fecha_creacion || c.creada_en)}
                              </Text>
                              <Tooltip label="Descargar PDF" hasArrow>
                                <IconButton
                                  icon={<FiDownload />}
                                  aria-label="Descargar PDF"
                                  variant="ghost"
                                  h="40px"
                                  w="40px"
                                  mt={1}
                                  onClick={() => handleDownloadPdf(c)}
                                />
                              </Tooltip>
                            </VStack>
                          </HStack>

                          <Text mt={3} fontSize="xs" color={subtle}>
                            Vigencia hasta:{" "}
                            {formatDate(
                              c.fecha_vigencia ||
                                c.vigencia_hasta ||
                                c.fecha_vencimiento ||
                                c.vigenciaHasta
                            )}
                          </Text>

                          {/* Acciones (touch-friendly) */}
                          <SimpleGrid columns={pagable ? 2 : 1} spacing={2} mt={4}>
                            <Button
                              w="full"
                              colorScheme="yellow"
                              rightIcon={<FiArrowRight />}
                              h="46px"
                              onClick={() => handleOpenDetalle(c)}
                            >
                              Ver detalle
                            </Button>

                            {pagable && (
                              <Button
                                w="full"
                                leftIcon={<FiCreditCard />}
                                colorScheme="yellow"
                                variant="outline"
                                h="46px"
                                onClick={() => handleIrAPasarelaListado(c)}
                              >
                                Pagar
                              </Button>
                            )}
                          </SimpleGrid>
                        </MotionBox>
                      );
                    })}
                  </Stack>
                </Box>

                {/* ✅ Desktop: Tabla */}
                <Box display={{ base: "none", md: "block" }} overflowX="auto">
                  <Table variant="simple" size="md">
                    <Thead bg={theadBg}>
                      <Tr>
                        <Th>Código</Th>
                        <Th>Cliente / contacto</Th>
                        <Th>Vigencia / Fechas</Th>
                        <Th isNumeric>Total</Th>
                        <Th>Estado</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredCotizaciones.map((c) => {
                        const pagable = canPagarCotizacion(c);

                        return (
                          <MotionTr
                            key={c.id}
                            whileHover={prefersReducedMotion ? {} : { backgroundColor: rowHoverBg }}
                            transition={{ duration: 0.15 }}
                          >
                            <Td>
                              <HStack spacing={2}>
                                <Badge
                                  colorScheme="yellow"
                                  borderRadius="full"
                                  px={3}
                                  py={1}
                                  fontSize="xs"
                                >
                                  {c.codigo || `COT-${c.id}`}
                                </Badge>
                              </HStack>
                              <Text fontSize="xs" color={subtle} mt={1}>
                                Creada el {formatDate(c.fecha_creacion || c.creada_en)}
                              </Text>
                            </Td>

                            <Td maxW="260px">
                              <Text fontSize="sm" fontWeight="semibold" noOfLines={1} color={titleCol}>
                                {c.empresa_nombre ||
                                  c.cliente_nombre ||
                                  c.nombre_empresa ||
                                  c.username ||
                                  "Sin nombre"}
                              </Text>
                              <Text fontSize="xs" color={subtle} noOfLines={1}>
                                {c.contacto_nombre || c.contacto_email || c.email || "—"}
                              </Text>
                            </Td>

                            <Td>
                              <VStack align="flex-start" spacing={0}>
                                <Text fontSize="xs">
                                  Vigencia:{" "}
                                  {formatDate(c.fecha_creacion || c.vigencia_desde || c.creada_en)} →{" "}
                                  {formatDate(
                                    c.fecha_vigencia ||
                                      c.vigencia_hasta ||
                                      c.fecha_vencimiento ||
                                      c.vigenciaHasta
                                  )}
                                </Text>
                                <Text fontSize="xs" color={subtle}>
                                  Última actualización:{" "}
                                  {formatDate(c.actualizada_en || c.updated_at || c.fecha_actualizacion)}
                                </Text>
                              </VStack>
                            </Td>

                            <Td isNumeric>
                              <Text fontWeight="semibold" color={titleCol}>
                                {formatCurrency(c.total)}
                              </Text>
                              {(c.descuento_total || c.descuento) && (
                                <Text fontSize="xs" color={subtle}>
                                  Descuento: {formatCurrency(c.descuento_total || c.descuento)}
                                </Text>
                              )}
                            </Td>

                            <Td>
                              <EstadoPills estadoRaw={c.estado_gestion || c.estado} cotizacion={c} />
                            </Td>

                            <Td>
                              <HStack justify="flex-end" spacing={1}>
                                {pagable && (
                                  <Tooltip label="Pagar cotización" hasArrow>
                                    <IconButton
                                      size="sm"
                                      icon={<FiCreditCard />}
                                      onClick={() => handleIrAPasarelaListado(c)}
                                      aria-label="Pagar"
                                      colorScheme="yellow"
                                      h="40px"
                                      w="40px"
                                    />
                                  </Tooltip>
                                )}

                                <Tooltip label="Descargar PDF" hasArrow>
                                  <IconButton
                                    size="sm"
                                    icon={<FiDownload />}
                                    onClick={() => handleDownloadPdf(c)}
                                    aria-label="PDF"
                                    variant="ghost"
                                    h="40px"
                                    w="40px"
                                  />
                                </Tooltip>

                                <Tooltip label="Ver detalle" hasArrow>
                                  <IconButton
                                    size="sm"
                                    icon={<FiArrowRight />}
                                    colorScheme="yellow"
                                    onClick={() => handleOpenDetalle(c)}
                                    aria-label="Detalle"
                                    h="40px"
                                    w="40px"
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </MotionTr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </>
            )}
          </MotionBox>
        </Stack>
      </Box>

      {/* ===================== Drawer Filtros (mobile) ===================== */}
      <Drawer
        isOpen={filtrosDrawer.isOpen}
        placement="bottom"
        onClose={filtrosDrawer.onClose}
      >
        <DrawerOverlay />
        <DrawerContent borderTopRadius="2xl">
          <DrawerCloseButton />
          <DrawerHeader>Filtros</DrawerHeader>

          <DrawerBody>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
                  Estado
                </Text>
                <Select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} h="46px">
                  <option value="TODAS">Todos</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="ACEPTADA">Aprobadas</option>
                  <option value="RECHAZADA">Rechazadas</option>
                  <option value="CONVERTIDA">Convertidas</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="bold" color={subtle} mb={1} textTransform="uppercase" letterSpacing="wider">
                  Vigencia
                </Text>
                <Select value={vigenciaFilter} onChange={(e) => setVigenciaFilter(e.target.value)} h="46px">
                  <option value="TODAS">Todas</option>
                  <option value="VIGENTES">Vigentes</option>
                  <option value="VENCIDAS">Vencidas</option>
                </Select>
              </Box>
            </Stack>
          </DrawerBody>

          <DrawerFooter>
            <HStack w="full" spacing={2}>
              <Button variant="outline" w="full" h="46px" onClick={handleClearFilters} leftIcon={<FiX />}>
                Limpiar
              </Button>
              <Button colorScheme="yellow" w="full" h="46px" onClick={filtrosDrawer.onClose}>
                Aplicar
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ===================== MODAL Detalle ===================== */}
      <Modal
        isOpen={detalleModal.isOpen}
        onClose={handleCloseDetalle}
        isCentered
        size={detailSize}
        scrollBehavior="inside"
        motionPreset={prefersReducedMotion ? "none" : "slideInBottom"}
      >
        <ModalOverlay />
        <ModalContent
          borderRadius={{ base: "0", md: "2xl" }}
          overflow="hidden"
          // ✅ Mobile full-screen friendly layout
          display="flex"
          flexDir="column"
          maxH={{ base: "100vh", md: "auto" }}
        >
          <ModalCloseButton />

          <ModalHeader borderBottomWidth="1px" borderColor={borderLight} pr={12}>
            {selectedCotizacion ? (
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={subtle} textTransform="uppercase">
                  Detalle de cotización
                </Text>
                <HStack justify="space-between" w="full" align="start" gap={3}>
                  <Box>
                    <Heading size="md" color={titleCol}>
                      {selectedCotizacion.codigo || `COT-${selectedCotizacion.id}`}
                    </Heading>
                    <Text fontSize="sm" color={subtle} noOfLines={1}>
                      {selectedCotizacion.empresa_nombre ||
                        selectedCotizacion.cliente_nombre ||
                        selectedCotizacion.nombre_empresa ||
                        selectedCotizacion.username ||
                        "Sin nombre"}
                    </Text>
                  </Box>

                  <Box textAlign="right">
                    <EstadoPills
                      estadoRaw={selectedCotizacion.estado_gestion || selectedCotizacion.estado}
                      cotizacion={selectedCotizacion}
                      compact
                    />
                    <Text fontSize="xs" color={subtle} mt={1}>
                      Vigente hasta:{" "}
                      {formatDate(
                        selectedCotizacion.fecha_vigencia ||
                          selectedCotizacion.vigencia_hasta ||
                          selectedCotizacion.fecha_vencimiento ||
                          selectedCotizacion.vigenciaHasta
                      )}
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            ) : (
              "Detalle de cotización"
            )}
          </ModalHeader>

          <ModalBody flex="1" overflowY="auto">
            {loadingDetalle && (
              <Stack py={6}>
                <Skeleton height="18px" />
                <SkeletonText noOfLines={6} spacing={2} />
              </Stack>
            )}

            {!loadingDetalle && selectedCotizacion && (
              <Stack spacing={6} py={4}>
                {/* Resumen */}
                <Box>
                  <Heading size="sm" mb={2} color={titleCol}>
                    Resumen
                  </Heading>
                  <Box
                    borderWidth="1px"
                    borderRadius="xl"
                    borderColor={borderLight}
                    bg={cardBg}
                    p={4}
                    boxShadow={shadowSm}
                  >
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} fontSize="sm">
                      <Box>
                        <Text color={subtle} fontSize="xs">
                          Cliente
                        </Text>
                        <Text fontWeight="semibold">
                          {selectedCotizacion.empresa_nombre ||
                            selectedCotizacion.cliente_nombre ||
                            selectedCotizacion.nombre_empresa ||
                            selectedCotizacion.username ||
                            "Sin nombre"}
                        </Text>
                        <Text fontSize="xs" color={subtle} noOfLines={1}>
                          {selectedCotizacion.contacto_email || selectedCotizacion.email || "sin correo"}
                        </Text>
                      </Box>

                      <Box>
                        <Text color={subtle} fontSize="xs">
                          Fechas
                        </Text>
                        <Text>
                          <Text as="span" fontWeight="semibold">
                            Creación:
                          </Text>{" "}
                          {formatDate(selectedCotizacion.fecha_creacion || selectedCotizacion.creada_en)}
                        </Text>
                        <Text>
                          <Text as="span" fontWeight="semibold">
                            Vigencia:
                          </Text>{" "}
                          {formatDate(
                            selectedCotizacion.fecha_vigencia ||
                              selectedCotizacion.vigencia_hasta ||
                              selectedCotizacion.fecha_vencimiento ||
                              selectedCotizacion.vigenciaHasta
                          )}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  {(selectedCotizacion.observaciones || selectedCotizacion.comentarios) && (
                    <Box mt={3}>
                      <Text fontSize="xs" color={subtle}>
                        Observaciones
                      </Text>
                      <Text fontSize="sm">
                        {selectedCotizacion.observaciones || selectedCotizacion.comentarios}
                      </Text>
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Productos */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Heading size="sm" color={titleCol}>
                      Productos
                    </Heading>
                    <Text fontSize="xs" color={subtle}>
                      {(selectedCotizacion.productos || []).length} ítem(s)
                    </Text>
                  </HStack>

                  {!selectedCotizacion.productos || !selectedCotizacion.productos.length ? (
                    <Text fontSize="sm" color={subtle}>
                      No se encontraron productos asociados.
                    </Text>
                  ) : isMobile ? (
                    <Stack spacing={3}>
                      {selectedCotizacion.productos.map((p, idx) => (
                        <ProductoItemCard
                          key={`${p.id || p.producto_id}-${idx}`}
                          p={p}
                          subtle={subtle}
                          borderLight={borderLight}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Box borderWidth="1px" borderRadius="lg" borderColor={borderLight} overflow="hidden">
                      <Box px={3} py={2} bg={productosHeadBg}>
                        <Text fontSize="xs" fontWeight="semibold">
                          Resumen de productos
                        </Text>
                      </Box>
                      <Box maxH="260px" overflowY="auto">
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Producto</Th>
                              <Th isNumeric>Cant.</Th>
                              <Th isNumeric>Precio C/U</Th>
                              <Th isNumeric>Subtotal</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {selectedCotizacion.productos.map((p, idx) => (
                              <Tr key={`${p.id || p.producto_id}-${idx}`}>
                                <Td maxW="280px">
                                  <Text fontSize="sm" noOfLines={2}>
                                    {p.nombre || p.producto_nombre || "Producto"}
                                  </Text>
                                  {p.descripcion && (
                                    <Text fontSize="xs" color={subtle} noOfLines={1}>
                                      {p.descripcion}
                                    </Text>
                                  )}
                                </Td>
                                <Td isNumeric>
                                  <Text fontSize="sm">{Number(p.cantidad) || 0}</Text>
                                </Td>
                                <Td isNumeric>
                                  <Text fontSize="sm">
                                    {formatCurrency(p.precio_unitario || p.precio || p.valor_unitario)}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {formatCurrency(
                                      p.subtotal ||
                                        p.total ||
                                        Number(
                                          (Number(p.cantidad) || 0) *
                                            (Number(p.precio_unitario || p.precio || p.valor_unitario || 0) || 0)
                                        )
                                    )}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Totales */}
                <Box>
                  <Heading size="sm" mb={2} color={titleCol}>
                    Resumen económico
                  </Heading>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Subtotal
                      </Text>
                      <Text fontWeight="medium">{formatCurrency(resumenEconomico.subtotal)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Descuento
                      </Text>
                      <Text fontWeight="medium">{formatCurrency(resumenEconomico.descuento)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Total
                      </Text>
                      <Heading size="md" color={titleCol}>
                        {formatCurrency(resumenEconomico.total)}
                      </Heading>
                    </Box>
                  </SimpleGrid>

                  {(resumenEconomico.baseIva || resumenEconomico.iva) && (
                    <Text fontSize="xs" color={subtle} mt={2}>
                      Base sin IVA: {formatCurrency(resumenEconomico.baseIva)} • IVA:{" "}
                      {formatCurrency(resumenEconomico.iva)}
                    </Text>
                  )}
                </Box>

                <Text fontSize="xs" color={subtle}>
                  * Esta vista es informativa. El pago/conversión depende del flujo definido.
                </Text>
              </Stack>
            )}
          </ModalBody>

          {/* ✅ Footer sticky (especialmente útil en mobile) */}
          <ModalFooter borderTopWidth="1px" borderColor={borderLight}>
            <HStack w="full" justify="space-between" gap={3} flexWrap="wrap">
              <Button variant="outline" onClick={handleCloseDetalle} h="46px">
                Cerrar
              </Button>

              <HStack spacing={2}>
                <Button
                  leftIcon={<FiDownload />}
                  variant="outline"
                  onClick={() => selectedCotizacion && handleDownloadPdf(selectedCotizacion)}
                  isDisabled={!selectedCotizacion}
                  h="46px"
                >
                  PDF
                </Button>

                {selectedCotizacion && canPagarCotizacion(selectedCotizacion) && (
                  <Button
                    leftIcon={<FiCreditCard />}
                    colorScheme="yellow"
                    onClick={() => handleIrAPasarela(selectedCotizacion)}
                    h="46px"
                  >
                    Pagar
                  </Button>
                )}
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===================== Barra fija inferior (mobile) ===================== */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        zIndex={10}
        bg={cardBg}
        borderTopWidth="1px"
        borderColor={borderLight}
        px={4}
        py={3}
        sx={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        boxShadow="0 -6px 16px rgba(0,0,0,0.08)"
      >
        <HStack spacing={2}>
          <IconButton
            icon={<FiRefreshCw />}
            aria-label="Recargar"
            variant="outline"
            h="46px"
            w="46px"
            isLoading={reloading}
            onClick={() => fetchCotizaciones({ silent: true })}
          />
          <Button
            colorScheme="yellow"
            w="full"
            h="46px"
            rightIcon={<FiArrowRight />}
            onClick={handleCrearNuevaCotizacion}
          >
            Nueva cotización
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
