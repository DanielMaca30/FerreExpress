// src/pages/admin/Cotizaciones.jsx
// ✅ Rediseño UX/UI — Sistema de Filtros Unificado AdminFilterBar
// ✅ Responsive: Cards en móvil, Tabla en desktop con scroll X sincronizado
// ✅ Filtros: buscador instantáneo + selects rápidos + avanzados colapsables
// ✅ Pills removibles individualmente + contador en tiempo real
// ✅ Un solo CTA "Aplicar" amarillo + "Limpiar" ghost

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Collapse,
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
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
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
  TagLabel,
  TagLeftIcon,
  TagCloseButton,
  VStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  useColorModeValue,
  usePrefersReducedMotion,
  useToast,
} from "@chakra-ui/react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  FiRefreshCw,
  FiFilter,
  FiEye,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiSearch,
  FiInfo,
  FiHash,
  FiLayers,
  FiChevronDown,
  FiChevronUp,
  FiSliders,
  FiX,
} from "react-icons/fi";
import api from "../../utils/axiosInstance";

const MotionBox = motion.create(Box);
const ferreYellow = "#F9BF20";

/* =========================================================================
   Motion primitives
   ========================================================================= */
const makeSpring = (reduce) =>
  reduce
    ? { duration: 0 }
    : { type: "spring", stiffness: 380, damping: 32, mass: 0.7 };

const fadeUp = (reduce) => ({
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { ...makeSpring(reduce), duration: reduce ? 0 : 0.38 },
  },
});

const fadeIn = (reduce) => ({
  hidden: { opacity: 0, filter: "blur(6px)" },
  show: {
    opacity: 1, filter: "blur(0px)",
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
   Utils
   ========================================================================= */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");

const getGestionColor  = (e) => ({ PENDIENTE: "yellow", ACEPTADA: "green", RECHAZADA: "red", CONVERTIDA: "blue" }[String(e || "").toUpperCase()] ?? "gray");
const getVigenciaColor = (e) => ({ VIGENTE: "green", VENCIDA: "red" }[String(e || "").toUpperCase()] ?? "gray");

/* =========================================================================
   Tags de estado
   ========================================================================= */
const EstadoGestionTag = ({ value }) => {
  const v = String(value || "—").toUpperCase();
  const icon = { ACEPTADA: FiCheckCircle, RECHAZADA: FiXCircle, CONVERTIDA: FiLayers }[v] ?? FiClock;
  return (
    <Tag size="sm" colorScheme={getGestionColor(v)} variant="subtle" borderRadius="full">
      <TagLeftIcon as={icon} /><TagLabel>{v || "—"}</TagLabel>
    </Tag>
  );
};

const EstadoVigenciaTag = ({ value }) => {
  const v = String(value || "—").toUpperCase();
  return (
    <Tag size="sm" colorScheme={getVigenciaColor(v)} variant="outline" borderRadius="full">
      <TagLeftIcon as={v === "VENCIDA" ? FiAlertTriangle : FiCheckCircle} /><TagLabel>{v || "—"}</TagLabel>
    </Tag>
  );
};

/* =========================================================================
   GlassCard
   ========================================================================= */
function GlassCard({ children, ...props }) {
  const bg     = useColorModeValue("whiteAlpha.900", "blackAlpha.400");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const shadow = useColorModeValue("0 18px 60px rgba(0,0,0,0.10)", "0 18px 60px rgba(0,0,0,0.35)");
  return (
    <Box bg={bg} border="1px solid" borderColor={border} backdropFilter="blur(18px)" boxShadow={shadow} {...props}>
      {children}
    </Box>
  );
}

/* =========================================================================
   KpiCard
   ========================================================================= */
function KpiCard({ label, value, icon, isLoading }) {
  const muted  = useColorModeValue("gray.600", "gray.400");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  return (
    <MotionBox variants={fadeUp(false)}>
      <GlassCard rounded="2xl" overflow="hidden">
        <Card bg="transparent" border="none">
          <CardBody p={{ base: 4, md: 5 }}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{label}</Text>
                {isLoading ? <Skeleton mt={2} h="28px" w="130px" rounded="md" /> : <Text mt={1} fontSize="2xl" fontWeight="black" lineHeight="1">{value}</Text>}
              </Box>
              <Box border="1px solid" borderColor={border} bg={useColorModeValue("whiteAlpha.800", "blackAlpha.500")} rounded="xl" p={2.5}>
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
   ★ AdminFilterBar — componente reutilizable para todas las páginas admin
   =========================================================================
   Props:
     searchValue / onSearchChange / searchPlaceholder
     quickFilters: [{ key, placeholder, value, onChange, options:[{value,label}] }]
     advancedFilters: ReactNode (colapsable con "Más filtros")
     onApply / onClear
     activePills: [{ key, label, onRemove }]
     resultCount / totalCount
     isLoading
   ========================================================================= */
function AdminFilterBar({
  searchValue, onSearchChange, searchPlaceholder = "Buscar…",
  quickFilters = [], advancedFilters = null,
  onApply, onClear,
  activePills = [],
  resultCount, totalCount,
  isLoading = false,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const bg         = useColorModeValue("whiteAlpha.900", "blackAlpha.400");
  const border     = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const shadow     = useColorModeValue("0 18px 60px rgba(0,0,0,0.10)", "0 18px 60px rgba(0,0,0,0.35)");
  const softBg     = useColorModeValue("gray.50", "blackAlpha.500");
  const dropBg     = useColorModeValue("white", "gray.900");
  const muted      = useColorModeValue("gray.500", "gray.400");
  const pillBg     = useColorModeValue("yellow.50", "rgba(249,191,32,0.12)");
  const pillBorder = useColorModeValue("yellow.200", "rgba(249,191,32,0.3)");
  const pillColor  = useColorModeValue("yellow.800", "yellow.200");

  const hasActive = activePills.length > 0 || searchValue?.trim();
  const showCount = typeof resultCount === "number" && typeof totalCount === "number";

  return (
    <Box bg={bg} border="1px solid" borderColor={border} backdropFilter="blur(18px)" boxShadow={shadow} rounded="3xl" overflow="hidden" mb={6}>
      <Box p={{ base: 4, md: 5 }}>

        {/* Fila principal */}
        <Stack direction={{ base: "column", md: "row" }} spacing={3} align={{ base: "stretch", md: "center" }}>

          {/* Buscador */}
          <InputGroup size="md" flex="1" minW={{ md: "220px" }}>
            <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color={muted} boxSize={4} /></InputLeftElement>
            <Input
              placeholder={searchPlaceholder} value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              rounded="2xl" bg={softBg} border="1px solid" borderColor={border}
              focusBorderColor={ferreYellow} _placeholder={{ color: muted, fontSize: "sm" }}
            />
            {searchValue && (
              <InputRightElement>
                <motion.div {...pressable(reduceMotion)}>
                  <IconButton aria-label="Limpiar búsqueda" icon={<FiX />} size="xs" variant="ghost" rounded="full" onClick={() => onSearchChange("")} />
                </motion.div>
              </InputRightElement>
            )}
          </InputGroup>

          {/* Selects rápidos */}
          {quickFilters.map((f) => (
            <Select key={f.key} value={f.value} onChange={(e) => f.onChange(e.target.value)}
              size="md" rounded="2xl" bg={dropBg} border="1px solid" borderColor={border}
              focusBorderColor={ferreYellow} minW={{ base: "full", md: "150px" }} maxW={{ md: "190px" }}>
              <option value="">{f.placeholder}</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          ))}

          {/* Toggle avanzados */}
          {advancedFilters && (
            <motion.div {...pressable(reduceMotion)} style={{ flexShrink: 0 }}>
              <Button
                size="md" variant="outline" rounded="2xl"
                leftIcon={<FiSliders />} rightIcon={showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
                onClick={() => setShowAdvanced((v) => !v)}
                color={showAdvanced ? ferreYellow : undefined}
                borderColor={showAdvanced ? ferreYellow : border}
                w={{ base: "full", md: "auto" }}
              >
                Más filtros
              </Button>
            </motion.div>
          )}

          {/* CTAs */}
          <HStack spacing={2} flexShrink={0} w={{ base: "full", md: "auto" }}>
            {onApply && (
              <motion.div {...pressable(reduceMotion)} style={{ flex: 1 }}>
                <Button leftIcon={<FiFilter />} onClick={onApply} isLoading={isLoading}
                  bg={ferreYellow} color="black" rounded="2xl" px={6}
                  w={{ base: "full", md: "auto" }}
                  _hover={{ filter: "brightness(0.97)" }} _active={{ filter: "brightness(0.94)" }}>
                  Aplicar
                </Button>
              </motion.div>
            )}
            {hasActive && onClear && (
              <motion.div {...pressable(reduceMotion)} style={{ flex: 1 }}>
                <Button variant="ghost" rounded="2xl" onClick={onClear} leftIcon={<FiX />} w={{ base: "full", md: "auto" }}>
                  Limpiar
                </Button>
              </motion.div>
            )}
          </HStack>
        </Stack>

        {/* Filtros avanzados colapsables */}
        {advancedFilters && (
          <Collapse in={showAdvanced} animateOpacity>
            <Box mt={4} pt={4} borderTop="1px solid" borderColor={border}>{advancedFilters}</Box>
          </Collapse>
        )}

        {/* Pills + contador */}
        <AnimatePresence>
          {(activePills.length > 0 || showCount) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
              <Flex mt={4} pt={3} borderTop="1px solid" borderColor={border} justify="space-between" align="center" gap={3} flexWrap="wrap">
                <HStack spacing={2} flexWrap="wrap" flex="1">
                  {activePills.length > 0 ? (
                    activePills.map((pill) => (
                      <motion.div key={pill.key} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}>
                        <Tag size="sm" borderRadius="full" bg={pillBg} border="1px solid" borderColor={pillBorder} color={pillColor}>
                          <TagLabel fontSize="xs">{pill.label}</TagLabel>
                          <TagCloseButton onClick={pill.onRemove} />
                        </Tag>
                      </motion.div>
                    ))
                  ) : (
                    <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="gray">
                      <TagLabel fontSize="xs">Sin filtros activos</TagLabel>
                    </Tag>
                  )}
                </HStack>
                {showCount && (
                  <Text fontSize="xs" color={muted} flexShrink={0}>
                    {resultCount === totalCount ? `${totalCount} resultado${totalCount !== 1 ? "s" : ""}` : `${resultCount} de ${totalCount}`}
                  </Text>
                )}
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>

      </Box>
    </Box>
  );
}

/* =========================================================================
   Main — AdminCotizaciones
   ========================================================================= */
export default function AdminCotizaciones() {
  const toast = useToast();
  const reduceMotion = usePrefersReducedMotion();

  const bg          = useColorModeValue("gray.50", "blackAlpha.900");
  const muted       = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const softBg      = useColorModeValue("gray.50", "blackAlpha.500");
  const headBg      = useColorModeValue("rgba(249,250,251,0.85)", "blackAlpha.300");
  const rowStripe   = useColorModeValue("gray.50", "whiteAlpha.50");
  const rowHover    = useColorModeValue("yellow.50", "whiteAlpha.100");

  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);

  const [estadoGestion,  setEstadoGestion]  = useState("TODOS");
  const [estadoVigencia, setEstadoVigencia] = useState("TODAS");
  const [fechaDesde,     setFechaDesde]     = useState("");
  const [fechaHasta,     setFechaHasta]     = useState("");
  const [searchTerm,     setSearchTerm]     = useState("");

  const [detalleOpen,     setDetalleOpen]     = useState(false);
  const [detalleLoading,  setDetalleLoading]  = useState(false);
  const [detalle,         setDetalle]          = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const topScrollRef   = useRef(null);
  const tableScrollRef = useRef(null);
  const syncingRef     = useRef(false);
  const [scrollMeta,   setScrollMeta] = useState({ w: 0, show: false });

  const syncScroll = (src, dst) => {
    if (!src || !dst || syncingRef.current) return;
    syncingRef.current = true;
    dst.scrollLeft = src.scrollLeft;
    requestAnimationFrame(() => { syncingRef.current = false; });
  };

  const onTopScroll   = () => syncScroll(topScrollRef.current, tableScrollRef.current);
  const onTableScroll = () => syncScroll(tableScrollRef.current, topScrollRef.current);

  const measureScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    setScrollMeta({ w: el.scrollWidth || 0, show: (el.scrollWidth || 0) > (el.clientWidth || 0) + 2 });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measureScroll);
    const onResize = () => measureScroll();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", onResize); };
  }, [measureScroll, cotizaciones.length, loading, searchTerm, estadoGestion, estadoVigencia, fechaDesde, fechaHasta]);

  const descargarPDF = useCallback(async (id) => {
    if (!id) return;
    try {
      const { data } = await api.get(`/cotizaciones/${id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast({ title: "No se pudo abrir el PDF", description: err?.response?.data?.error || "Revisa tu conexión.", status: "error", duration: 3200, isClosable: true });
    }
  }, [toast]);

  const resumen = useMemo(() => {
    const r = { total: cotizaciones.length, pendientes: 0, vigentes: 0, sumaTotal: 0 };
    for (const c of cotizaciones) {
      r.sumaTotal += Number(c.total || 0);
      if (String(c.estado_gestion  || "").toUpperCase() === "PENDIENTE") r.pendientes++;
      if (String(c.estado_vigencia || "").toUpperCase() === "VIGENTE")   r.vigentes++;
    }
    return r;
  }, [cotizaciones]);

  const cotizacionesFiltradas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cotizaciones;
    return cotizaciones.filter((c) =>
      String(c.id || "").includes(q.replace("#", "")) ||
      String(c.username || "").toLowerCase().includes(q) ||
      String(c.email    || "").toLowerCase().includes(q)
    );
  }, [cotizaciones, searchTerm]);

  const fetchCotizaciones = useCallback(async (overrides = {}, showToast = false) => {
    try {
      setLoading(true);
      const gestion  = overrides.estadoGestion  ?? estadoGestion;
      const vigencia = overrides.estadoVigencia ?? estadoVigencia;
      const desde    = overrides.fechaDesde     ?? fechaDesde;
      const hasta    = overrides.fechaHasta     ?? fechaHasta;

      const params = {};
      if (gestion  !== "TODOS") params.estado_gestion  = gestion;
      if (vigencia !== "TODAS") params.estado_vigencia = vigencia;
      if (desde) params.fecha_desde = desde;
      if (hasta) params.fecha_hasta = hasta;

      const { data } = await api.get("/cotizaciones", { params });
      setCotizaciones(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
      if (showToast) toast({ title: "Cotizaciones actualizadas", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: "Error al cargar cotizaciones", description: err?.response?.data?.error || "Intenta de nuevo.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setLoading(false);
      requestAnimationFrame(() => measureScroll());
    }
  }, [estadoGestion, estadoVigencia, fechaDesde, fechaHasta, toast, measureScroll]);

  const resetFiltros = useCallback(() => {
    const next = { estadoGestion: "TODOS", estadoVigencia: "TODAS", fechaDesde: "", fechaHasta: "" };
    setEstadoGestion(next.estadoGestion);
    setEstadoVigencia(next.estadoVigencia);
    setFechaDesde(next.fechaDesde);
    setFechaHasta(next.fechaHasta);
    setSearchTerm("");
    fetchCotizaciones(next, false);
  }, [fetchCotizaciones]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activePills = useMemo(() => {
    const pills = [];
    if (estadoGestion  !== "TODOS")  pills.push({ key: "g", label: `Gestión: ${estadoGestion}`,   onRemove: () => { setEstadoGestion("TODOS");   fetchCotizaciones({ estadoGestion:  "TODOS"  }, false); } });
    if (estadoVigencia !== "TODAS")  pills.push({ key: "v", label: `Vigencia: ${estadoVigencia}`, onRemove: () => { setEstadoVigencia("TODAS");  fetchCotizaciones({ estadoVigencia: "TODAS"  }, false); } });
    if (fechaDesde)                  pills.push({ key: "d", label: `Desde: ${fechaDesde}`,        onRemove: () => { setFechaDesde(""); fetchCotizaciones({ fechaDesde: "" }, false); } });
    if (fechaHasta)                  pills.push({ key: "h", label: `Hasta: ${fechaHasta}`,        onRemove: () => { setFechaHasta(""); fetchCotizaciones({ fechaHasta: "" }, false); } });
    if (searchTerm.trim())           pills.push({ key: "s", label: `"${searchTerm.trim()}"`,      onRemove: () => setSearchTerm("") });
    return pills;
  }, [estadoGestion, estadoVigencia, fechaDesde, fechaHasta, searchTerm]); // eslint-disable-line

  const abrirDetalle = useCallback(async (id) => {
    try {
      setDetalleOpen(true); setDetalleLoading(true); setDetalle(null);
      const { data } = await api.get(`/cotizaciones/${id}`);
      setDetalle(data);
    } catch (err) {
      toast({ title: "Error al cargar detalle", description: err?.response?.data?.error || "No fue posible obtener la cotización.", status: "error", duration: 3500, isClosable: true });
      setDetalleOpen(false);
    } finally {
      setDetalleLoading(false);
    }
  }, [toast]);

  const cambiarEstado = useCallback(async (nuevoEstado) => {
    if (!detalle?.id) return;
    try {
      setCambiandoEstado(true);
      await api.put(`/cotizaciones/${detalle.id}/estado`, { nuevoEstado });
      toast({ title: `Cotización ${String(nuevoEstado).toLowerCase()}`, description: `La cotización #${detalle.id} fue marcada como ${nuevoEstado}.`, status: "success", duration: 2500, isClosable: true });
      fetchCotizaciones({}, false);
      setDetalle((prev) => prev ? { ...prev, estado_gestion: nuevoEstado } : prev);
    } catch (err) {
      toast({ title: "Error al cambiar estado", description: err?.response?.data?.error || "Revisa el backend.", status: "error", duration: 3500, isClosable: true });
    } finally {
      setCambiandoEstado(false);
    }
  }, [detalle?.id, fetchCotizaciones, toast]);

  useEffect(() => {
    fetchCotizaciones({}, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Render ── */
  return (
    <Box minH="100vh" bg={bg} pb={{ base: 10, md: 12 }}>
      <MotionConfig transition={makeSpring(reduceMotion)}>

        <AnimatePresence>
          {loading && !reduceMotion && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Progress size="xs" isIndeterminate />
            </motion.div>
          )}
        </AnimatePresence>

        <Container maxW="1440px" pt={{ base: 6, md: 8 }}>
          <MotionBox initial="hidden" animate="show" variants={stagger(reduceMotion)}>

            {/* HEADER */}
            <MotionBox variants={fadeUp(reduceMotion)}>
              <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={6}>
                <VStack align="start" spacing={1}>
                  <HStack spacing={2} flexWrap="wrap">
                    <Tag borderRadius="full" colorScheme="blue">Admin · Cotizaciones</Tag>
                    {lastUpdated && (
                      <Text fontSize="xs" color={muted}>
                        Actualizado: {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    )}
                  </HStack>
                  <Heading size="xl" fontWeight="black" letterSpacing="tight">Cotizaciones B2B</Heading>
                  <Text color={muted} fontSize="sm">
                    Gestiona cotizaciones, aplica filtros y toma decisiones desde el panel de detalle.
                  </Text>
                </VStack>
                <Tooltip label="Actualizar datos" hasArrow>
                  <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                    <IconButton aria-label="Actualizar" icon={<FiRefreshCw />} onClick={() => fetchCotizaciones({}, true)} rounded="full" variant="outline" isLoading={loading} />
                  </motion.div>
                </Tooltip>
              </Flex>
            </MotionBox>

            {/* KPIs */}
            <MotionBox variants={stagger(reduceMotion)}>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <KpiCard label="Total"         value={resumen.total}             icon={FiHash}        isLoading={loading} />
                <KpiCard label="Pendientes"    value={resumen.pendientes}        icon={FiClock}        isLoading={loading} />
                <KpiCard label="Vigentes"      value={resumen.vigentes}          icon={FiCheckCircle}  isLoading={loading} />
                <KpiCard label="Valor listado" value={fmtCop(resumen.sumaTotal)} icon={FiFileText}     isLoading={loading} />
              </SimpleGrid>
            </MotionBox>

            {/* ★ FILTROS UNIFICADOS */}
            <MotionBox variants={fadeUp(reduceMotion)}>
              <AdminFilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por #ID, cliente o correo…"
                quickFilters={[
                  {
                    key: "gestion", placeholder: "Gestión",
                    value: estadoGestion === "TODOS" ? "" : estadoGestion,
                    onChange: (v) => setEstadoGestion(v || "TODOS"),
                    options: [
                      { value: "PENDIENTE",  label: "Pendiente"  },
                      { value: "ACEPTADA",   label: "Aceptada"   },
                      { value: "RECHAZADA",  label: "Rechazada"  },
                      { value: "CONVERTIDA", label: "Convertida" },
                    ],
                  },
                  {
                    key: "vigencia", placeholder: "Vigencia",
                    value: estadoVigencia === "TODAS" ? "" : estadoVigencia,
                    onChange: (v) => setEstadoVigencia(v || "TODAS"),
                    options: [
                      { value: "VIGENTE", label: "Vigente" },
                      { value: "VENCIDA", label: "Vencida" },
                    ],
                  },
                ]}
                advancedFilters={
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase" mb={1}>Vigencia desde</Text>
                      <Input type="date" size="sm" rounded="xl" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} bg={softBg} border="1px solid" borderColor={borderColor} focusBorderColor={ferreYellow} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase" mb={1}>Vigencia hasta</Text>
                      <Input type="date" size="sm" rounded="xl" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} bg={softBg} border="1px solid" borderColor={borderColor} focusBorderColor={ferreYellow} />
                    </Box>
                  </SimpleGrid>
                }
                onApply={() => fetchCotizaciones({}, true)}
                onClear={resetFiltros}
                activePills={activePills}
                resultCount={cotizacionesFiltradas.length}
                totalCount={cotizaciones.length}
                isLoading={loading}
              />
            </MotionBox>

            {/* LISTADO */}
            <MotionBox variants={fadeUp(reduceMotion)}>
              <GlassCard rounded="3xl" overflow="hidden" border="1px solid" borderColor={borderColor}>
                <Card bg="transparent" border="none">
                  <CardBody p={{ base: 4, md: 6 }}>
                    <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
                      <Box>
                        <Heading size="md">Listado</Heading>
                        <Text fontSize="xs" color={muted} mt={1}>Haz clic en una fila para ver el detalle · Acciones: detalle · PDF</Text>
                      </Box>
                      <motion.div {...pressable(reduceMotion)}>
                        <Button size="sm" variant="outline" rounded="full" onClick={() => { setEstadoGestion("PENDIENTE"); fetchCotizaciones({ estadoGestion: "PENDIENTE" }, true); }}>
                          Ver solo pendientes
                        </Button>
                      </motion.div>
                    </Flex>

                    {loading ? (
                      <Box><Skeleton h="18px" mb={3} rounded="md" /><SkeletonText noOfLines={6} spacing="3" /></Box>
                    ) : cotizacionesFiltradas.length === 0 ? (
                      <Box py={12} textAlign="center">
                        <Icon as={FiInfo} boxSize={6} color={muted} mb={3} />
                        <Text fontSize="sm" color={muted} fontWeight="black">Sin resultados</Text>
                        <Text fontSize="xs" color={muted} mt={1}>Prueba ajustando filtros o borrando la búsqueda.</Text>
                        <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block", marginTop: 14 }}>
                          <Button variant="outline" rounded="full" onClick={resetFiltros}>Limpiar todo</Button>
                        </motion.div>
                      </Box>
                    ) : (
                      <>
                        {/* MOBILE: Cards */}
                        <Stack spacing={3} display={{ base: "flex", md: "none" }}>
                          <AnimatePresence>
                            {cotizacionesFiltradas.map((c) => (
                              <motion.div key={c.id} initial={{ opacity: 0, y: 8, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(6px)" }} transition={makeSpring(reduceMotion)}>
                                <motion.div {...pressable(reduceMotion)}>
                                  <GlassCard rounded="2xl" p={4} border="1px solid" borderColor={borderColor} cursor="pointer" role="button" tabIndex={0} onClick={() => abrirDetalle(c.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") abrirDetalle(c.id); }}>
                                    <Flex justify="space-between" align="start" gap={3}>
                                      <Box minW={0}>
                                        <HStack spacing={2} mb={1}>
                                          <Badge borderRadius="full" variant="subtle" colorScheme="gray">#{c.id}</Badge>
                                          <EstadoGestionTag value={c.estado_gestion} />
                                          <EstadoVigenciaTag value={c.estado_vigencia} />
                                        </HStack>
                                        <Text fontWeight="black" fontSize="sm" noOfLines={1}>{c.username || "—"}</Text>
                                        <Text fontSize="xs" color={muted} noOfLines={1}>{c.email || "sin correo"}</Text>
                                        <HStack mt={3} spacing={4}>
                                          <Box><Text fontSize="10px" color={muted} fontWeight="bold" letterSpacing="wide">TOTAL</Text><Text fontWeight="black">{fmtCop(c.total)}</Text></Box>
                                          <Box><Text fontSize="10px" color={muted} fontWeight="bold" letterSpacing="wide">DESCUENTO</Text><Text fontWeight="black">{c.descuento ? fmtCop(c.descuento) : "—"}</Text></Box>
                                        </HStack>
                                        <HStack mt={3} spacing={3} color={muted} fontSize="xs">
                                          <HStack spacing={1}><FiClock /><Text>Creación: {fmtDate(c.fecha_creacion)}</Text></HStack>
                                          <HStack spacing={1}><FiAlertTriangle /><Text>Vence: {fmtDate(c.fecha_vigencia)}</Text></HStack>
                                        </HStack>
                                      </Box>
                                      <VStack spacing={2} align="end" onClick={(e) => e.stopPropagation()}>
                                        <Tooltip label="Ver detalle" hasArrow><motion.div {...pressable(reduceMotion)}><IconButton aria-label="Ver detalle" icon={<FiEye />} size="sm" variant="outline" rounded="full" onClick={(e) => { e.stopPropagation(); abrirDetalle(c.id); }} /></motion.div></Tooltip>
                                        <Tooltip label="Abrir PDF" hasArrow><motion.div {...pressable(reduceMotion)}><IconButton aria-label="Abrir PDF" icon={<FiFileText />} size="sm" variant="outline" rounded="full" onClick={(e) => { e.stopPropagation(); descargarPDF(c.id); }} /></motion.div></Tooltip>
                                      </VStack>
                                    </Flex>
                                  </GlassCard>
                                </motion.div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </Stack>

                        {/* DESKTOP: Tabla */}
                        <Box display={{ base: "none", md: "block" }}>
                          {scrollMeta.show && (
                            <Box mb={3}>
                              <Box ref={topScrollRef} onScroll={onTopScroll} overflowX="auto" overflowY="hidden" h="14px" borderRadius="full" border="1px solid" borderColor={borderColor} bg={useColorModeValue("whiteAlpha.700", "blackAlpha.300")} backdropFilter="blur(12px)" sx={{ "&::-webkit-scrollbar": { height: "10px" }, "&::-webkit-scrollbar-thumb": { background: useColorModeValue("rgba(0,0,0,0.25)", "rgba(255,255,255,0.25)"), borderRadius: "999px" } }}>
                                <Box w={`${scrollMeta.w}px`} h="1px" />
                              </Box>
                              <Text mt={1} fontSize="xs" color={muted}>Desliza para ver más columnas →</Text>
                            </Box>
                          )}
                          <TableContainer ref={tableScrollRef} onScroll={onTableScroll} rounded="2xl" border="1px solid" borderColor={borderColor} overflowX="auto" overflowY="hidden" bg={useColorModeValue("whiteAlpha.800", "blackAlpha.300")} backdropFilter="blur(14px)" sx={{ "&::-webkit-scrollbar": { height: "10px" }, "&::-webkit-scrollbar-thumb": { background: useColorModeValue("rgba(0,0,0,0.25)", "rgba(255,255,255,0.25)"), borderRadius: "999px" } }}>
                            <Table variant="simple" size="sm" minW="980px">
                              <Thead bg={headBg} backdropFilter="blur(8px)">
                                <Tr>
                                  <Th>ID</Th><Th>Cliente</Th><Th isNumeric>Total</Th><Th isNumeric>Descuento</Th>
                                  <Th>Gestión</Th><Th>Vigencia</Th><Th>Creación</Th><Th>Vence</Th><Th textAlign="right">Acciones</Th>
                                </Tr>
                              </Thead>
                              <Tbody sx={{ "tr:nth-of-type(odd)": { bg: rowStripe } }}>
                                {cotizacionesFiltradas.map((c) => (
                                  <Tr key={c.id} cursor="pointer" role="button" tabIndex={0} _hover={{ bg: rowHover }} onClick={() => abrirDetalle(c.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") abrirDetalle(c.id); }}>
                                    <Td><Badge borderRadius="full" variant="subtle" colorScheme="gray">#{c.id}</Badge></Td>
                                    <Td><VStack align="flex-start" spacing={0} maxW="340px"><Text fontSize="sm" fontWeight="black" noOfLines={1}>{c.username || "—"}</Text><Text fontSize="xs" color={muted} noOfLines={1}>{c.email || "sin correo"}</Text></VStack></Td>
                                    <Td isNumeric fontWeight="black">{fmtCop(c.total)}</Td>
                                    <Td isNumeric>{c.descuento ? fmtCop(c.descuento) : "—"}</Td>
                                    <Td><EstadoGestionTag  value={c.estado_gestion}  /></Td>
                                    <Td><EstadoVigenciaTag value={c.estado_vigencia} /></Td>
                                    <Td>{fmtDate(c.fecha_creacion)}</Td>
                                    <Td>{fmtDate(c.fecha_vigencia)}</Td>
                                    <Td onClick={(e) => e.stopPropagation()}>
                                      <HStack justify="flex-end" spacing={1}>
                                        <Tooltip label="Ver detalle" hasArrow><motion.div {...pressable(reduceMotion)}><IconButton aria-label="Ver detalle" icon={<FiEye />} size="sm" variant="ghost" rounded="full" onClick={(e) => { e.stopPropagation(); abrirDetalle(c.id); }} /></motion.div></Tooltip>
                                        <Tooltip label="Abrir PDF"   hasArrow><motion.div {...pressable(reduceMotion)}><IconButton aria-label="Abrir PDF"   icon={<FiFileText />} size="sm" variant="ghost" rounded="full" onClick={(e) => { e.stopPropagation(); descargarPDF(c.id); }} /></motion.div></Tooltip>
                                      </HStack>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </>
                    )}
                  </CardBody>
                </Card>
              </GlassCard>
            </MotionBox>

          </MotionBox>
        </Container>

        {/* DRAWER DETALLE */}
        <Drawer isOpen={detalleOpen} onClose={() => { setDetalleOpen(false); setDetalle(null); }} size={{ base: "full", md: "md", "2xl": "lg" }}>
          <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <DrawerContent maxW={{ base: "100vw", md: "560px", "2xl": "720px" }} borderLeftRadius={{ base: 0, md: "2xl" }} overflow="hidden">
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">
              {detalle ? (
                <HStack justify="space-between" align="center" gap={3}>
                  <Box>
                    <Heading size="md" fontWeight="black">Cotización #{detalle.id}</Heading>
                    <Text fontSize="sm" color={muted} noOfLines={1}>{detalle.username} · {detalle.email}</Text>
                  </Box>
                  <VStack align="flex-end" spacing={1}>
                    <EstadoGestionTag  value={detalle.estado_gestion}  />
                    <EstadoVigenciaTag value={detalle.estado_vigencia} />
                  </VStack>
                </HStack>
              ) : <Text>Detalle de cotización</Text>}
            </DrawerHeader>

            <DrawerBody>
              {detalleLoading || !detalle ? (
                <Box mt={4}><Skeleton height="18px" mb={2} /><SkeletonText noOfLines={6} spacing="3" /></Box>
              ) : (
                <MotionBox initial="hidden" animate="show" variants={stagger(reduceMotion)}>
                  <VStack align="stretch" spacing={4} mt={2}>

                    <MotionBox variants={fadeIn(reduceMotion)}>
                      <GlassCard rounded="2xl" p={4} border="1px solid" borderColor={borderColor}>
                        <Heading size="sm" mb={1}>Información general</Heading>
                        <Text fontSize="sm" color={muted}>Creada: {fmtDate(detalle.fecha_creacion)} · Vigente hasta: {fmtDate(detalle.fecha_vigencia)}</Text>
                      </GlassCard>
                    </MotionBox>

                    <MotionBox variants={fadeIn(reduceMotion)}>
                      <GlassCard rounded="2xl" p={4} border="1px solid" borderColor={borderColor}>
                        <Heading size="sm" mb={3}>Productos ({detalle.productos?.length || 0})</Heading>
                        {detalle.productos && detalle.productos.length > 0 ? (
                          <TableContainer rounded="xl" border="1px solid" borderColor={borderColor} overflowX="auto">
                            <Table size="sm" variant="simple" minW="560px">
                              <Thead bg={useColorModeValue("gray.50", "blackAlpha.500")}><Tr><Th>Producto</Th><Th isNumeric>Cant.</Th><Th isNumeric>P. Unit.</Th><Th isNumeric>Subtotal</Th></Tr></Thead>
                              <Tbody>
                                {detalle.productos.map((p, idx) => (
                                  <Tr key={p.id ?? `${p.nombre}-${idx}`}>
                                    <Td maxW="320px"><Text noOfLines={2} fontWeight="black" fontSize="sm">{p.nombre}</Text></Td>
                                    <Td isNumeric>{p.cantidad}</Td>
                                    <Td isNumeric>{fmtCop(p.precio_unitario)}</Td>
                                    <Td isNumeric fontWeight="black">{fmtCop(p.subtotal)}</Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        ) : <Text fontSize="sm" color={muted}>Esta cotización no tiene productos asociados.</Text>}
                      </GlassCard>
                    </MotionBox>

                    <MotionBox variants={fadeIn(reduceMotion)}>
                      <GlassCard rounded="2xl" p={4} border="1px solid" borderColor={borderColor}>
                        <Heading size="sm" mb={3}>Resumen económico</Heading>
                        <VStack align="stretch" spacing={2} fontSize="sm">
                          <HStack justify="space-between"><Text color={muted}>Base gravable (sin IVA)</Text><Text fontWeight="black">{fmtCop(detalle.base_iva ?? 0)}</Text></HStack>
                          <HStack justify="space-between"><Text color={muted}>IVA (19%)</Text><Text fontWeight="black">{fmtCop(detalle.iva ?? 0)}</Text></HStack>
                          <HStack justify="space-between"><Text color={muted}>Descuento</Text><Text fontWeight="black">{detalle.descuento ? `- ${fmtCop(detalle.descuento)}` : "—"}</Text></HStack>
                          <Divider />
                          <HStack justify="space-between"><Text fontWeight="black">Total</Text><Text fontWeight="black" fontSize="lg">{fmtCop(detalle.total ?? 0)}</Text></HStack>
                        </VStack>
                      </GlassCard>
                    </MotionBox>

                  </VStack>
                </MotionBox>
              )}
            </DrawerBody>

            <DrawerFooter borderTopWidth="1px">
              {detalle && (
                <HStack w="full" justify="space-between" spacing={3} flexWrap="wrap">
                  <motion.div {...pressable(reduceMotion)}>
                    <Button variant="outline" leftIcon={<FiFileText />} onClick={() => descargarPDF(detalle.id)} rounded="full">Ver PDF</Button>
                  </motion.div>
                  <HStack spacing={2} flexWrap="wrap" justify="flex-end">
                    {String(detalle.estado_gestion || "").toUpperCase() === "PENDIENTE" ? (
                      <>
                        <motion.div {...pressable(reduceMotion)}>
                          <Button size="sm" colorScheme="green" leftIcon={<FiCheckCircle />} onClick={() => cambiarEstado("ACEPTADA")} isLoading={cambiandoEstado} rounded="full">Aceptar</Button>
                        </motion.div>
                        <motion.div {...pressable(reduceMotion)}>
                          <Button size="sm" colorScheme="red" variant="outline" leftIcon={<FiXCircle />} onClick={() => cambiarEstado("RECHAZADA")} isLoading={cambiandoEstado} rounded="full">Rechazar</Button>
                        </motion.div>
                      </>
                    ) : <Text fontSize="xs" color={muted}>Esta cotización ya fue gestionada.</Text>}
                  </HStack>
                </HStack>
              )}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

      </MotionConfig>
    </Box>
  );
}