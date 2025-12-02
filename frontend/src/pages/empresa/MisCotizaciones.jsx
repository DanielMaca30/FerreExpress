import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
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
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

/* ====================== Tokens de diseño ====================== */
const useSurfaceTokens = () => {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  const borderCo = useColorModeValue("transparent", "gray.700");
  const borderLight = useColorModeValue("gray.200", "gray.700");

  const subtle = useColorModeValue("gray.600", "gray.400");
  const titleCol = useColorModeValue("gray.900", "white");

  const brandColor = "#F9BF20";
  const brandHover = "#E0AC1C";

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
  const shadowTopBar = useColorModeValue(
    "0 -4px 20px rgba(0,0,0,0.08)",
    "0 -4px 20px rgba(0,0,0,0.4)"
  );

  return {
    pageBg,
    cardBg,
    borderCo,
    borderLight,
    subtle,
    titleCol,
    brandColor,
    brandHover,
    shadowSm,
    shadowMd,
    shadowLg,
    shadowTopBar,
  };
};

/* ====================== Helpers ====================== */

const MotionBox = motion(Box);
const MotionTr = motion("tr");

// Estados alineados al backend: estado_gestion = PENDIENTE | ACEPTADA | RECHAZADA | CONVERTIDA
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
  return isNaN(d.getTime()) ? null : d;
}

function isCotizacionVigente(c) {
  if (!c) return false;
  // 1️⃣ Primero usamos el campo de estado de vigencia que viene del backend
  if (c.estado_vigencia) {
    return c.estado_vigencia !== "VENCIDA";
  }

  // 2️⃣ Fallback por fechas si no existiera estado_vigencia
  const hoy = new Date();
  const fin =
    parseDateSafe(c.fecha_vigencia) ||
    parseDateSafe(c.vigencia_hasta) ||
    parseDateSafe(c.fecha_vencimiento) ||
    parseDateSafe(c.vigenciaHasta);
  if (!fin) return true;
  return fin >= hoy;
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

/* ====================== Componente Principal ====================== */

export default function MisCotizaciones() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchParams, setSearchParams] = useSearchParams();
  const prefersReducedMotion = usePrefersReducedMotion();

  const {
    pageBg,
    cardBg,
    borderLight,
    subtle,
    titleCol,
    brandColor,
    brandHover,
    shadowSm,
    shadowMd,
    shadowLg,
  } = useSurfaceTokens();

  // ⚠️ Hooks de color fuera de condicionales
  const emptyBg = useColorModeValue("yellow.50", "yellow.900Alpha.100");
  const theadBg = useColorModeValue("gray.100", "gray.800");
  const productosHeadBg = useColorModeValue("gray.100", "gray.800");

  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("TODAS");
  const [vigenciaFilter, setVigenciaFilter] = useState("TODAS");

  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  /* ============== Carga listado: GET /cotizaciones ============== */

  const fetchCotizaciones = useCallback(
    async (opts = { silent: false }) => {
      try {
        if (!opts.silent) setLoading(true);
        else setReloading(true);
        setErrorMsg("");

        // El backend devuelve un array de cotizaciones filtradas por usuario (CONTRATISTA) o todas (ADMIN)
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
    async (id) => {
      if (!id) return;
      try {
        setLoadingDetalle(true);
        const res = await api.get(`/cotizaciones/${id}`);
        const detalle = normalizeDetalle(res.data);
        setSelectedCotizacion(detalle || null);
        onOpen();
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
        setLoadingDetalle(false);
      }
    },
    [onOpen, toast]
  );

  // Abrir detalle si viene ?cotizacionId= en la URL
  useEffect(() => {
    const idParam = searchParams.get("cotizacionId");
    if (!idParam) return;
    fetchDetalleCotizacion(idParam);
  }, [fetchDetalleCotizacion, searchParams]);

  /* ============== Filtros y métricas ============== */

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
      data = data.filter(
        (c) => (c.estado_gestion || c.estado) === estadoFilter
      );
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

  // Resumen económico del detalle (usa base_iva, iva, descuento, total)
  const resumenEconomico = useMemo(() => {
    if (!selectedCotizacion) {
      return {
        subtotal: 0,
        descuento: 0,
        total: 0,
        baseIva: 0,
        iva: 0,
      };
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

    // Si backend no envía subtotal, lo calculamos
    const subtotalCalculado =
      baseIva + iva > 0 ? baseIva + iva : total + descuento;

    return {
      subtotal: subtotalExplicito || subtotalCalculado,
      descuento,
      total,
      baseIva,
      iva,
    };
  }, [selectedCotizacion]);

  // Info de estado para el panel tipo "Estado: ACEPTADA - VENCIDA/VIGENTE"
  const estadoDetalle = useMemo(() => {
    if (!selectedCotizacion) return null;
    const estadoRaw =
      selectedCotizacion.estado_gestion ||
      selectedCotizacion.estado ||
      "PENDIENTE";
    const meta = ESTADO_COLORS[estadoRaw] || ESTADO_COLORS.PENDIENTE;
    const vigente = isCotizacionVigente(selectedCotizacion);
    return { estadoRaw, ...meta, vigente };
  }, [selectedCotizacion]);

  /* ============== Handlers UI ============== */

  const handleOpenDetalle = (c) => {
    setSearchParams({ cotizacionId: c.id });
    fetchDetalleCotizacion(c.id);
  };

  const handleCloseDetalle = () => {
    setSelectedCotizacion(null);
    setSearchParams({});
    onClose();
  };

  const handleDownloadPdf = async (cotizacion) => {
    try {
      const id = cotizacion.id;
      const res = await api.get(`/cotizaciones/${id}/pdf`, {
        responseType: "blob",
      });
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

  const handleCrearCotizacionDesdeCatalogo = () => {
    navigate("/empresa/catalogo");
  };

  const handleClearFilters = () => {
    setSearch("");
    setEstadoFilter("TODAS");
    setVigenciaFilter("TODAS");
  };

  const renderEstadoTag = (estadoRaw, cotizacion) => {
    const estadoGestion = estadoRaw || "PENDIENTE";
    const info = ESTADO_COLORS[estadoGestion] || ESTADO_COLORS["PENDIENTE"];
    const IconEstado = info.icon;
    const vigente = isCotizacionVigente(cotizacion);
    const isVencida = !vigente;

    return (
      <VStack align="flex-start" spacing={1}>
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
          colorScheme={isVencida ? "red" : "green"}
          variant="subtle"
          borderRadius="full"
          fontSize="0.65rem"
        >
          {isVencida ? "Vencida" : "Vigente"}
        </Badge>
      </VStack>
    );
  };

  const emptyState = (
    <MotionBox
      bg={emptyBg}
      borderRadius="2xl"
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={borderLight}
      p={12}
      textAlign="center"
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <VStack spacing={4}>
        <Icon as={FiFileText} boxSize={12} color={brandColor} />
        <Heading size="md" color={titleCol}>
          Aún no tienes cotizaciones
        </Heading>
        <Text color={subtle} maxW="420px">
          Crea tu primera cotización seleccionando productos del catálogo y
          simulando descuentos por volumen para tus proyectos.
        </Text>
        <Button
          colorScheme="yellow"
          rightIcon={<FiArrowRight />}
          onClick={handleCrearCotizacionDesdeCatalogo}
        >
          Ir al catálogo
        </Button>
      </VStack>
    </MotionBox>
  );

  /* ============== Render principal (PÁGINA) ============== */

  return (
    <Box as="main" bg={pageBg} minH="100vh" py={8}>
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }}>
        <Stack spacing={8}>
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Box>
              <HStack mb={2} spacing={2}>
                <Badge colorScheme="yellow">Empresa / Contratista</Badge>
                <Badge variant="outline" borderColor={borderLight}>
                  Módulo de cotizaciones
                </Badge>
              </HStack>
              <Heading size="lg" color={titleCol}>
                Mis cotizaciones
              </Heading>
              <Text color={subtle} mt={2} maxW="640px" fontSize="sm">
                Revisa el estado, vigencia y detalle de tus cotizaciones antes
                de convertirlas en pedidos formales.
              </Text>
            </Box>
            <HStack>
              <Tooltip label="Recargar listado" hasArrow>
                <IconButton
                  icon={<FiRefreshCw />}
                  isLoading={reloading}
                  onClick={() => fetchCotizaciones({ silent: true })}
                  aria-label="Recargar"
                  borderRadius="full"
                  variant="outline"
                />
              </Tooltip>
              <Button
                colorScheme="yellow"
                rightIcon={<FiArrowRight />}
                onClick={() => navigate("/empresa/inicio")}
              >
                Nueva cotización
              </Button>
            </HStack>
          </Flex>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <MotionBox
              bg={cardBg}
              p={5}
              borderRadius="xl"
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            >
              <Text fontSize="sm" color={subtle}>
                Total cotizaciones
              </Text>
              <Heading size="lg" mt={1} color={titleCol}>
                {stats.total}
              </Heading>
            </MotionBox>

            <MotionBox
              bg={cardBg}
              p={5}
              borderRadius="xl"
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Text fontSize="sm" color={subtle}>
                Vigentes
              </Text>
              <Heading size="lg" mt={1} color={titleCol}>
                {stats.vigentes}
              </Heading>
            </MotionBox>

            <MotionBox
              bg={cardBg}
              p={5}
              borderRadius="xl"
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Text fontSize="sm" color={subtle}>
                Aprobadas
              </Text>
              <Heading size="lg" mt={1} color={titleCol}>
                {stats.aprobadas}
              </Heading>
            </MotionBox>

            <MotionBox
              bg={cardBg}
              p={5}
              borderRadius="xl"
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Text fontSize="sm" color={subtle}>
                Valor total
              </Text>
              <Heading size="lg" mt={1} color={titleCol}>
                {formatCurrency(stats.valorTotal)}
              </Heading>
            </MotionBox>
          </SimpleGrid>

          {/* Filtros */}
          <MotionBox
            bg={cardBg}
            p={5}
            borderRadius="2xl"
            boxShadow={shadowMd}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          >
            <Stack direction={{ base: "column", md: "row" }} spacing={4}>
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
                  <InputLeftElement>
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Código, cliente, comentarios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
                <HStack mt={1} spacing={2} color={subtle} fontSize="xs">
                  <Text>Tip:</Text>
                  <Kbd>Ctrl</Kbd>
                  <Text>+</Text>
                  <Kbd>F</Kbd>
                  <Text>para buscar en toda la página.</Text>
                </HStack>
              </Box>
              <Box>
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
                <Select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <option value="TODAS">Todos</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="ACEPTADA">Aprobadas</option>
                  <option value="RECHAZADA">Rechazadas</option>
                  <option value="CONVERTIDA">Convertidas en pedido</option>
                </Select>
              </Box>
              <Box>
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
                <Select
                  value={vigenciaFilter}
                  onChange={(e) => setVigenciaFilter(e.target.value)}
                >
                  <option value="TODAS">Todas</option>
                  <option value="VIGENTES">Vigentes</option>
                  <option value="VENCIDAS">Vencidas</option>
                </Select>
              </Box>
              <Box alignSelf={{ base: "flex-start", md: "flex-end" }}>
                <HStack>
                  <Tooltip label="Limpiar filtros" hasArrow>
                    <IconButton
                      icon={<FiFilter />}
                      onClick={handleClearFilters}
                      aria-label="Limpiar filtros"
                      borderRadius="full"
                    />
                  </Tooltip>
                  <Button
                    leftIcon={<FiRefreshCw />}
                    isLoading={reloading}
                    onClick={() => fetchCotizaciones({ silent: true })}
                    variant="outline"
                  >
                    Recargar
                  </Button>
                </HStack>
              </Box>
            </Stack>
          </MotionBox>

          {/* Tabla / Listado */}
          <MotionBox
            bg={cardBg}
            borderRadius="2xl"
            boxShadow={shadowLg}
            overflow="hidden"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          >
            <Box
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor={borderLight}
            >
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="semibold" color={titleCol}>
                  {filteredCotizaciones.length} cotización
                  {filteredCotizaciones.length !== 1 && "es"} encontrada
                  {filteredCotizaciones.length !== 1 && "s"}
                </Text>
                {errorMsg && (
                  <HStack spacing={1} color="red.400" fontSize="xs">
                    <Icon as={FiAlertCircle} />
                    <Text noOfLines={1}>{errorMsg}</Text>
                  </HStack>
                )}
              </Flex>
            </Box>

            {loading ? (
              <Stack p={6} spacing={4}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} height="60px" borderRadius="lg" />
                ))}
              </Stack>
            ) : filteredCotizaciones.length === 0 ? (
              <Box p={8}>{emptyState}</Box>
            ) : (
              <Box overflowX="auto">
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
                    {filteredCotizaciones.map((c) => (
                      <MotionTr
                        key={c.id}
                        whileHover={
                          prefersReducedMotion
                            ? {}
                            : { backgroundColor: "rgba(0,0,0,0.02)" }
                        }
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
                            Creada el{" "}
                            {formatDate(c.fecha_creacion || c.creada_en)}
                          </Text>
                        </Td>
                        <Td maxW="260px">
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            noOfLines={1}
                            color={titleCol}
                          >
                            {c.empresa_nombre ||
                              c.cliente_nombre ||
                              c.nombre_empresa ||
                              c.username ||
                              "Sin nombre"}
                          </Text>
                          <Text fontSize="xs" color={subtle} noOfLines={1}>
                            {c.contacto_nombre ||
                              c.contacto_email ||
                              c.email ||
                              "—"}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={0}>
                            <Text fontSize="xs">
                              Vigencia:{" "}
                              {formatDate(
                                c.fecha_creacion ||
                                  c.vigencia_desde ||
                                  c.creada_en
                              )}{" "}
                              {" → "}
                              {formatDate(
                                c.fecha_vigencia ||
                                  c.vigencia_hasta ||
                                  c.fecha_vencimiento ||
                                  c.vigenciaHasta
                              )}
                            </Text>
                            <Text fontSize="xs" color={subtle}>
                              Última actualización:{" "}
                              {formatDate(
                                c.actualizada_en ||
                                  c.updated_at ||
                                  c.fecha_actualizacion
                              )}
                            </Text>
                          </VStack>
                        </Td>
                        <Td isNumeric>
                          <Text fontWeight="semibold" color={titleCol}>
                            {formatCurrency(c.total)}
                          </Text>
                          {(c.descuento_total || c.descuento) && (
                            <Text fontSize="xs" color={subtle}>
                              Descuento:{" "}
                              {formatCurrency(
                                c.descuento_total || c.descuento
                              )}
                            </Text>
                          )}
                        </Td>
                        <Td>{renderEstadoTag(c.estado_gestion || c.estado, c)}</Td>
                        <Td>
                          <HStack justify="flex-end" spacing={1}>
                            <Tooltip label="Descargar PDF" hasArrow>
                              <IconButton
                                size="sm"
                                icon={<FiDownload />}
                                onClick={() => handleDownloadPdf(c)}
                                aria-label="PDF"
                                variant="ghost"
                              />
                            </Tooltip>
                            <Tooltip label="Ver detalle" hasArrow>
                              <IconButton
                                size="sm"
                                icon={<FiArrowRight />}
                                colorScheme="yellow"
                                onClick={() => handleOpenDetalle(c)}
                                aria-label="Detalle"
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </MotionTr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </MotionBox>
        </Stack>
      </Box>

      {/* Drawer Detalle (SIN CAMBIOS DE ESTILO MAYORES) */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={handleCloseDetalle}
        size={{ base: "full", md: "lg" }}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderLight}>
            {selectedCotizacion ? (
              <HStack justify="space-between" align="flex-start" spacing={4}>
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xs" color={subtle} textTransform="uppercase">
                    Cotización
                  </Text>
                  <Heading size="md" color={titleCol}>
                    Cotización N°{" "}
                    {selectedCotizacion.codigo ||
                      selectedCotizacion.id ||
                      "—"}
                  </Heading>
                  <Text fontSize="xs" color={subtle} noOfLines={1}>
                    Cliente:{" "}
                    {selectedCotizacion.empresa_nombre ||
                      selectedCotizacion.cliente_nombre ||
                      selectedCotizacion.nombre_empresa ||
                      selectedCotizacion.username ||
                      "Sin nombre"}
                  </Text>
                </VStack>
                <VStack align="flex-end" spacing={1}>
                  {renderEstadoTag(
                    selectedCotizacion.estado_gestion ||
                      selectedCotizacion.estado,
                    selectedCotizacion
                  )}
                  <Text fontSize="xs" color={subtle}>
                    Creada el{" "}
                    {formatDate(
                      selectedCotizacion.fecha_creacion ||
                        selectedCotizacion.creada_en
                    )}
                  </Text>
                  <Text fontSize="xs" color={subtle}>
                    Vigente hasta:{" "}
                    {formatDate(
                      selectedCotizacion.fecha_vigencia ||
                        selectedCotizacion.vigencia_hasta ||
                        selectedCotizacion.fecha_vencimiento ||
                        selectedCotizacion.vigenciaHasta
                    )}
                  </Text>
                </VStack>
              </HStack>
            ) : (
              "Detalle de cotización"
            )}
          </DrawerHeader>

          <DrawerBody>
            {loadingDetalle && (
              <Stack py={6}>
                <Skeleton height="18px" />
                <SkeletonText noOfLines={5} spacing={2} />
              </Stack>
            )}

            {!loadingDetalle && selectedCotizacion && (
              <Stack spacing={6} py={4}>
                {/* Resumen tipo documento */}
                <Box>
                  <Heading size="sm" mb={2} color={titleCol}>
                    Resumen de la cotización
                  </Heading>
                  <Box
                    borderWidth="1px"
                    borderRadius="xl"
                    borderColor={borderLight}
                    bg={cardBg}
                    p={4}
                    boxShadow={shadowSm}
                  >
                    <Stack spacing={2} fontSize="sm">
                      <Text>
                        <Text as="span" fontWeight="semibold">
                          Cliente:{" "}
                        </Text>
                        {selectedCotizacion.empresa_nombre ||
                          selectedCotizacion.cliente_nombre ||
                          selectedCotizacion.nombre_empresa ||
                          selectedCotizacion.username ||
                          "Sin nombre"}{" "}
                        (
                        {selectedCotizacion.contacto_email ||
                          selectedCotizacion.email ||
                          "sin correo"}
                        )
                      </Text>
                      <Text>
                        <Text as="span" fontWeight="semibold">
                          Fecha creación:{" "}
                        </Text>
                        {formatDate(
                          selectedCotizacion.fecha_creacion ||
                            selectedCotizacion.creada_en
                        )}
                      </Text>
                      <Text>
                        <Text as="span" fontWeight="semibold">
                          Fecha vigencia:{" "}
                        </Text>
                        {formatDate(
                          selectedCotizacion.fecha_vigencia ||
                            selectedCotizacion.vigencia_hasta ||
                            selectedCotizacion.fecha_vencimiento ||
                            selectedCotizacion.vigenciaHasta
                        )}
                      </Text>
                      {estadoDetalle && (
                        <HStack spacing={2} align="center">
                          <Text>
                            <Text as="span" fontWeight="semibold">
                              Estado:{" "}
                            </Text>
                          </Text>
                          <Badge
                            colorScheme={estadoDetalle.colorScheme}
                            borderRadius="full"
                            px={2}
                            py={1}
                            display="inline-flex"
                            alignItems="center"
                            gap={1}
                          >
                            <Icon as={estadoDetalle.icon} boxSize={3.5} />
                            <Text fontSize="xs" fontWeight="semibold">
                              {estadoDetalle.label}
                            </Text>
                          </Badge>
                          <Badge
                            colorScheme={
                              estadoDetalle.vigente ? "green" : "red"
                            }
                            variant="subtle"
                            borderRadius="full"
                            fontSize="0.7rem"
                          >
                            {estadoDetalle.vigente ? "VIGENTE" : "VENCIDA"}
                          </Badge>
                        </HStack>
                      )}
                    </Stack>
                  </Box>

                  {(selectedCotizacion.observaciones ||
                    selectedCotizacion.comentarios) && (
                    <Box mt={3}>
                      <Text fontSize="xs" color={subtle}>
                        Observaciones
                      </Text>
                      <Text fontSize="sm">
                        {selectedCotizacion.observaciones ||
                          selectedCotizacion.comentarios}
                      </Text>
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Productos */}
                <Box>
                  <Heading size="sm" mb={2} color={titleCol}>
                    Productos cotizados
                  </Heading>

                  {!selectedCotizacion.productos ||
                  !selectedCotizacion.productos.length ? (
                    <Text fontSize="sm" color={subtle}>
                      No se encontraron productos asociados en el detalle.
                      Verifica que el endpoint <code>GET /cotizaciones/:id</code>{" "}
                      incluya el arreglo <b>productos</b>.
                    </Text>
                  ) : (
                    <Box
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor={borderLight}
                      overflow="hidden"
                    >
                      <Box px={3} py={2} bg={productosHeadBg}>
                        <HStack justify="space-between">
                          <Text fontSize="xs" fontWeight="semibold">
                            Resumen de productos
                          </Text>
                          <Text fontSize="xs" color={subtle}>
                            {selectedCotizacion.productos.length} ítem
                            {selectedCotizacion.productos.length !== 1 && "s"}
                          </Text>
                        </HStack>
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
                                <Td maxW="220px">
                                  <Text fontSize="sm" noOfLines={2}>
                                    {p.nombre ||
                                      p.producto_nombre ||
                                      "Producto"}
                                  </Text>
                                  {p.descripcion && (
                                    <Text
                                      fontSize="xs"
                                      color={subtle}
                                      noOfLines={1}
                                    >
                                      {p.descripcion}
                                    </Text>
                                  )}
                                </Td>
                                <Td isNumeric>
                                  <Text fontSize="sm">
                                    {Number(p.cantidad) || 0}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text fontSize="sm">
                                    {formatCurrency(
                                      p.precio_unitario ||
                                        p.precio ||
                                        p.valor_unitario
                                    )}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text fontSize="sm" fontWeight="medium">
                                    {formatCurrency(
                                      p.subtotal ||
                                        p.total ||
                                        Number(
                                          (Number(p.cantidad) || 0) *
                                            (Number(
                                              p.precio_unitario ||
                                                p.precio ||
                                                p.valor_unitario ||
                                                0
                                            ) || 0)
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
                        Subtotal (antes de descuento)
                      </Text>
                      <Text fontWeight="medium">
                        {formatCurrency(resumenEconomico.subtotal)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Descuento total
                      </Text>
                      <Text fontWeight="medium">
                        {formatCurrency(resumenEconomico.descuento)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Total cotizado
                      </Text>
                      <Heading size="md" color={titleCol}>
                        {formatCurrency(resumenEconomico.total)}
                      </Heading>
                    </Box>
                  </SimpleGrid>
                  {(resumenEconomico.baseIva || resumenEconomico.iva) && (
                    <Text fontSize="xs" color={subtle} mt={2}>
                      Incluye base gravable (sin IVA):{" "}
                      {formatCurrency(resumenEconomico.baseIva)} e IVA:{" "}
                      {formatCurrency(resumenEconomico.iva)}.
                    </Text>
                  )}
                </Box>

                <Divider />

                {/* Acciones */}
                <HStack justify="space-between">
                  <Button
                    variant="outline"
                    leftIcon={<FiDownload />}
                    onClick={() => handleDownloadPdf(selectedCotizacion)}
                  >
                    Descargar PDF
                  </Button>
                  {/* Aquí más adelante podrías agregar:
                  <Button colorScheme="yellow" rightIcon={<FiArrowRight />}>
                    Convertir en pedido
                  </Button> */}
                </HStack>

                <Text fontSize="xs" color={subtle}>
                  Esta vista es informativa. La aprobación, anulación o
                  conversión de cotizaciones se realiza desde el panel
                  administrativo de FerreExpress según los permisos del rol.
                </Text>
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
