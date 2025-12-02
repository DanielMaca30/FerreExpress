// src/pages/empresa/MisCotizaciones.jsx
// Pantalla "Mis Cotizaciones" para Empresas / Contratistas
// Estilo alineado a ProductDetail.jsx (tokens, cards, sombras, amarillo FerreExpress)

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
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
  useColorModeValue,
  useDisclosure,
  usePrefersReducedMotion,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFilter,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

/* ====================== Tokens (mismos de ProductDetail) ====================== */
const useSurfaceTokens = () => {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  const borderCo = useColorModeValue("transparent", "gray.700");
  const borderLight = useColorModeValue("gray.100", "gray.700");

  const subtle = useColorModeValue("gray.500", "gray.400");
  const titleCol = useColorModeValue("gray.800", "white");

  const brandColor = "#F9BF20";
  const brandHover = "#E0AC1C";

  const shadowSm = useColorModeValue(
    "0 1px 2px rgba(0,0,0,0.04)",
    "none"
  );
  const shadowMd = useColorModeValue(
    "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
    "0 4px 6px rgba(0,0,0,0.4)"
  );
  const shadowLg = useColorModeValue(
    "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)",
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

const ESTADO_COLORS = {
  PENDIENTE: { colorScheme: "yellow", icon: FiClock, label: "Pendiente" },
  APROBADA: { colorScheme: "green", icon: FiCheckCircle, label: "Aprobada" },
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
  const hoy = new Date();
  const fin =
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

/* ====================== Component ====================== */

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
    shadowMd,
    shadowLg,
  } = useSurfaceTokens();

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
        const cliente =
          (
            c.empresa_nombre ||
            c.cliente_nombre ||
            c.nombre_empresa ||
            c.contacto_nombre ||
            ""
          ).toLowerCase();
        return (
          codigo.includes(s) || obs.includes(s) || cliente.includes(s)
        );
      });
    }

    if (estadoFilter !== "TODAS") {
      data = data.filter((c) => c.estado === estadoFilter);
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
    const aprobadas = cotizaciones.filter((c) => c.estado === "APROBADA").length;
    const vencidas = cotizaciones.filter((c) => !isCotizacionVigente(c)).length;
    const valorTotal = cotizaciones.reduce(
      (acc, c) => acc + (Number(c.total) || 0),
      0
    );
    return { total, vigentes, aprobadas, vencidas, valorTotal };
  }, [cotizaciones]);

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
    // Catálogo empresa/contratista (ajusta si la ruta es distinta)
    navigate("/empresa/catalogo");
  };

  const handleClearFilters = () => {
    setSearch("");
    setEstadoFilter("TODAS");
    setVigenciaFilter("TODAS");
  };

  const renderEstadoTag = (estadoRaw, cotizacion) => {
    const estado = estadoRaw || "PENDIENTE";
    const info = ESTADO_COLORS[estado] || ESTADO_COLORS.PENDIENTE;
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
      borderRadius="2xl"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={borderLight}
      bg={useColorModeValue("yellow.50", "yellow.900Alpha.100")}
      p={8}
      textAlign="center"
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <VStack spacing={4}>
        <Icon as={FiFileText} boxSize={10} color={brandColor} />
        <Heading size="md" color={titleCol}>
          Aún no tienes cotizaciones
        </Heading>
        <Text fontSize="sm" color={subtle} maxW="420px">
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

  /* ============== Render principal ============== */

  return (
    <Box
      as="main"
      bg={pageBg}
      minH="100vh"
      py={{ base: 4, md: 8 }}
      transition="background 0.2s"
    >
      <Box maxW="1280px" mx="auto" px={{ base: 4, md: 6, xl: 8 }}>
        <Stack spacing={6}>
          {/* Header */}
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={4}
          >
            <Box>
              <HStack mb={2} spacing={2} wrap="wrap">
                <Badge colorScheme="yellow" borderRadius="full" px={3} py={1}>
                  Empresa / Contratista
                </Badge>
                <Badge
                  variant="outline"
                  borderRadius="full"
                  px={3}
                  py={1}
                  borderColor={borderLight}
                >
                  Módulo de cotizaciones
                </Badge>
              </HStack>
              <Heading
                size="lg"
                color={titleCol}
                letterSpacing="-0.02em"
              >
                Mis cotizaciones
              </Heading>
              <Text fontSize="sm" color={subtle} mt={2} maxW="640px">
                Consulta el historial de cotizaciones, revisa su vigencia, estado
                y detalle de productos antes de convertirlas en pedidos formales.
              </Text>
            </Box>

            <HStack spacing={2} alignSelf={{ base: "stretch", md: "center" }}>
              <Tooltip label="Recargar listado" hasArrow>
                <IconButton
                  aria-label="Recargar"
                  icon={<FiRefreshCw />}
                  variant="outline"
                  onClick={() => fetchCotizaciones({ silent: true })}
                  isLoading={reloading}
                  borderRadius="full"
                />
              </Tooltip>
              <Button
                colorScheme="yellow"
                rightIcon={<FiArrowRight />}
                onClick={handleCrearCotizacionDesdeCatalogo}
              >
                Nueva cotización
              </Button>
            </HStack>
          </Flex>

          {/* KPIs */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 4 }}
            spacing={4}
          >
            <MotionBox
              bg={cardBg}
              borderRadius="2xl"
              p={4}
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            >
              <Text fontSize="xs" color={subtle} textTransform="uppercase">
                Total cotizaciones
              </Text>
              <Heading size="md" mt={1} color={titleCol}>
                {stats.total}
              </Heading>
            </MotionBox>

            <MotionBox
              bg={cardBg}
              borderRadius="2xl"
              p={4}
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Text fontSize="xs" color={subtle} textTransform="uppercase">
                Cotizaciones vigentes
              </Text>
              <Heading size="md" mt={1} color={titleCol}>
                {stats.vigentes}
              </Heading>
            </MotionBox>

            <MotionBox
              bg={cardBg}
              borderRadius="2xl"
              p={4}
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Text fontSize="xs" color={subtle} textTransform="uppercase">
                Cotizaciones aprobadas
              </Text>
              <Heading size="md" mt={1} color={titleCol}>
                {stats.aprobadas}
              </Heading>
            </MotionBox>

            <MotionBox
              bg={cardBg}
              borderRadius="2xl"
              p={4}
              boxShadow={shadowMd}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Text fontSize="xs" color={subtle} textTransform="uppercase">
                Valor total cotizado
              </Text>
              <Heading size="md" mt={1} color={titleCol}>
                {formatCurrency(stats.valorTotal)}
              </Heading>
            </MotionBox>
          </SimpleGrid>

          {/* Filtros */}
          <MotionBox
            bg={cardBg}
            borderRadius="2xl"
            p={4}
            boxShadow={shadowMd}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          >
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              align="flex-start"
            >
              <Box flex="2" w="full">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  mb={1}
                  textTransform="uppercase"
                  color={subtle}
                  letterSpacing="wider"
                >
                  Buscar
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar por código, cliente o comentario"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
                <HStack mt={1} spacing={2} color={subtle} fontSize="xs">
                  <Text>Tip:</Text>
                  <Kbd>Ctrl</Kbd>
                  <Text>+</Text>
                  <Kbd>F</Kbd>
                  <Text>para buscar en la página.</Text>
                </HStack>
              </Box>

              <Box flex="1" w="full">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  mb={1}
                  textTransform="uppercase"
                  color={subtle}
                  letterSpacing="wider"
                >
                  Estado
                </Text>
                <Select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <option value="TODAS">Todos los estados</option>
                  <option value="PENDIENTE">Pendientes</option>
                  <option value="APROBADA">Aprobadas</option>
                  <option value="RECHAZADA">Rechazadas</option>
                  <option value="CONVERTIDA">Convertidas en pedido</option>
                </Select>
              </Box>

              <Box flex="1" w="full">
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  mb={1}
                  textTransform="uppercase"
                  color={subtle}
                  letterSpacing="wider"
                >
                  Vigencia
                </Text>
                <Select
                  value={vigenciaFilter}
                  onChange={(e) => setVigenciaFilter(e.target.value)}
                >
                  <option value="TODAS">Todas</option>
                  <option value="VIGENTES">Solo vigentes</option>
                  <option value="VENCIDAS">Solo vencidas</option>
                </Select>
              </Box>

              <Box
                flexShrink={0}
                alignSelf={{ base: "stretch", md: "flex-end" }}
              >
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  mb={1}
                  textTransform="uppercase"
                  color={subtle}
                  letterSpacing="wider"
                >
                  Acciones
                </Text>
                <HStack spacing={2}>
                  <Tooltip label="Limpiar filtros" hasArrow>
                    <IconButton
                      aria-label="Limpiar filtros"
                      icon={<FiFilter />}
                      variant="ghost"
                      onClick={handleClearFilters}
                      borderRadius="full"
                    />
                  </Tooltip>
                  <Button
                    leftIcon={<FiRefreshCw />}
                    variant="outline"
                    onClick={() => fetchCotizaciones({ silent: true })}
                    isLoading={reloading}
                  >
                    Recargar
                  </Button>
                </HStack>
              </Box>
            </Stack>
          </MotionBox>

          {/* Listado */}
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
              <Stack p={4} spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    py={3}
                    borderBottomWidth={i === 3 ? 0 : "1px"}
                    borderColor={borderLight}
                  >
                    <Skeleton height="18px" mb={2} />
                    <SkeletonText noOfLines={2} spacing={2} />
                  </Box>
                ))}
              </Stack>
            ) : filteredCotizaciones.length === 0 ? (
              <Box p={6}>{emptyState}</Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue("gray.100", "gray.750")}>
                    <Tr>
                      <Th>Código</Th>
                      <Th>Cliente / contacto</Th>
                      <Th>Fechas</Th>
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
                              "Sin nombre"}
                          </Text>
                          <Text
                            fontSize="xs"
                            color={subtle}
                            noOfLines={1}
                          >
                            {c.contacto_nombre ||
                              c.contacto_email ||
                              "—"}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={0}>
                            <Text fontSize="xs">
                              Vigencia:{" "}
                              {formatDate(c.vigencia_desde)} {" → "}
                              {formatDate(
                                c.vigencia_hasta ||
                                  c.fecha_vencimiento ||
                                  c.vigenciaHasta
                              )}
                            </Text>
                            <Text fontSize="xs" color={subtle}>
                              Última actualización:{" "}
                              {formatDate(
                                c.actualizada_en || c.updated_at
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
                        <Td>{renderEstadoTag(c.estado, c)}</Td>
                        <Td>
                          <HStack spacing={1} justify="flex-end">
                            <Tooltip label="Descargar PDF" hasArrow>
                              <IconButton
                                aria-label="Descargar PDF"
                                icon={<FiDownload />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadPdf(c)}
                              />
                            </Tooltip>
                            <Tooltip label="Ver detalle" hasArrow>
                              <IconButton
                                aria-label="Ver detalle"
                                icon={<FiArrowRight />}
                                size="sm"
                                bg={brandColor}
                                _hover={{ bg: brandHover }}
                                color="gray.900"
                                onClick={() => handleOpenDetalle(c)}
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

      {/* Drawer Detalle */}
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
              <HStack justify="space-between" align="flex-start">
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xs" color={subtle}>
                    Detalle de cotización
                  </Text>
                  <Heading size="md" color={titleCol}>
                    {selectedCotizacion.codigo ||
                      `COT-${selectedCotizacion.id}`}
                  </Heading>
                </VStack>
                <VStack align="flex-end" spacing={1}>
                  {renderEstadoTag(
                    selectedCotizacion.estado,
                    selectedCotizacion
                  )}
                  <Text fontSize="xs" color={subtle}>
                    Vigente hasta:{" "}
                    {formatDate(
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
                {/* Info general */}
                <Box>
                  <Heading size="sm" mb={2} color={titleCol}>
                    Información general
                  </Heading>
                  <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    spacing={3}
                  >
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Cliente / empresa
                      </Text>
                      <Text fontWeight="medium">
                        {selectedCotizacion.empresa_nombre ||
                          selectedCotizacion.cliente_nombre ||
                          selectedCotizacion.nombre_empresa ||
                          "Sin nombre"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Contacto
                      </Text>
                      <Text fontWeight="medium">
                        {selectedCotizacion.contacto_nombre ||
                          selectedCotizacion.contacto_email ||
                          "—"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Fecha de creación
                      </Text>
                      <Text fontWeight="medium">
                        {formatDate(
                          selectedCotizacion.fecha_creacion ||
                            selectedCotizacion.creada_en
                        )}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Vigencia
                      </Text>
                      <Text fontWeight="medium">
                        {formatDate(selectedCotizacion.vigencia_desde)}{" "}
                        {" → "}
                        {formatDate(
                          selectedCotizacion.vigencia_hasta ||
                            selectedCotizacion.fecha_vencimiento ||
                            selectedCotizacion.vigenciaHasta
                        )}
                      </Text>
                    </Box>
                  </SimpleGrid>

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
                      No se encontraron productos asociados en el detalle. Verifica
                      que el endpoint <code>GET /cotizaciones/:id</code> incluya
                      el arreglo <b>productos</b>.
                    </Text>
                  ) : (
                    <Box
                      borderWidth="1px"
                      borderRadius="lg"
                      borderColor={borderLight}
                      overflow="hidden"
                    >
                      <Box
                        px={3}
                        py={2}
                        bg={useColorModeValue("gray.100", "gray.750")}
                      >
                        <HStack justify="space-between">
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                          >
                            Resumen de productos
                          </Text>
                          <Text fontSize="xs" color={subtle}>
                            {selectedCotizacion.productos.length} ítem
                            {selectedCotizacion.productos.length !== 1 &&
                              "s"}
                          </Text>
                        </HStack>
                      </Box>
                      <Box maxH="260px" overflowY="auto">
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Producto</Th>
                              <Th isNumeric>Cant.</Th>
                              <Th isNumeric>Precio unit.</Th>
                              <Th isNumeric>Subtotal</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {selectedCotizacion.productos.map((p, idx) => (
                              <Tr
                                key={`${p.id || p.producto_id}-${idx}`}
                              >
                                <Td maxW="220px">
                                  <Text
                                    fontSize="sm"
                                    noOfLines={2}
                                  >
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
                                  <Text
                                    fontSize="sm"
                                    fontWeight="medium"
                                  >
                                    {formatCurrency(
                                      p.subtotal ||
                                        p.total ||
                                        (Number(p.cantidad || 0) *
                                          Number(
                                            p.precio_unitario ||
                                              p.precio ||
                                              p.valor_unitario ||
                                              0
                                          ))
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
                  <SimpleGrid
                    columns={{ base: 1, md: 3 }}
                    spacing={3}
                  >
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Subtotal
                      </Text>
                      <Text fontWeight="medium">
                        {formatCurrency(
                          selectedCotizacion.subtotal ||
                            selectedCotizacion.subtotal_sin_descuento ||
                            selectedCotizacion.total
                        )}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Descuento total
                      </Text>
                      <Text fontWeight="medium">
                        {formatCurrency(
                          selectedCotizacion.descuento_total ||
                            selectedCotizacion.descuento ||
                            0
                        )}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={subtle}>
                        Total cotizado
                      </Text>
                      <Heading size="md" color={titleCol}>
                        {formatCurrency(selectedCotizacion.total)}
                      </Heading>
                    </Box>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Acciones */}
                <HStack justify="space-between">
                  <Button
                    variant="outline"
                    leftIcon={<FiDownload />}
                    onClick={() =>
                      handleDownloadPdf(selectedCotizacion)
                    }
                  >
                    Descargar PDF
                  </Button>
                  {/* Aquí más adelante podrías agregar:
                  <Button colorScheme="yellow" rightIcon={<FiArrowRight />}>
                    Convertir en pedido
                  </Button> */}
                </HStack>

                <Text fontSize="xs" color={subtle}>
                  Esta vista es informativa. La aprobación o anulación de
                  cotizaciones se realiza desde el panel administrativo de
                  FerreExpress según los permisos del rol.
                </Text>
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
