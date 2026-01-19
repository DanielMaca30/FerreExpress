// src/pages/cliente/MisCasos.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  SkeletonText,
  Stack,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  Tag,
  TagLabel,
  TagLeftIcon,
  useBreakpointValue,
  useColorModeValue,
  usePrefersReducedMotion,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FiLifeBuoy,
  FiPlus,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiInfo,
  FiHelpCircle,
  FiTruck,
  FiUser,
  FiChevronRight,
  FiX,
  FiZap,
} from "react-icons/fi";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import api from "../../utils/axiosInstance";

/* =========================================================================
   Constantes / helpers (MISMA LÓGICA, SOLO DISEÑO)
   ========================================================================= */

const ferreYellow = "#F9BF20";

const ESTADOS = ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO", "CANCELADO"];
const PRIORIDADES = ["ALTA", "MEDIA", "BAJA"];

const estadoMeta = {
  ABIERTO: { label: "Abierto", scheme: "blue", icon: FiAlertCircle },
  EN_PROGRESO: { label: "En progreso", scheme: "orange", icon: FiClock },
  RESUELTO: { label: "Resuelto", scheme: "green", icon: FiCheckCircle },
  CERRADO: { label: "Cerrado", scheme: "gray", icon: FiXCircle },
  CANCELADO: { label: "Cancelado", scheme: "red", icon: FiXCircle },
};

const prioridadMeta = {
  ALTA: { label: "Alta", scheme: "red" },
  MEDIA: { label: "Media", scheme: "yellow" },
  BAJA: { label: "Baja", scheme: "green" },
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
};

const norm = (s) => (s || "").toString().toLowerCase();

/* =========================================================================
   Motion primitives (mismo look & feel BeneficiosEmpresa)
   ========================================================================= */

const MotionBox = motion.create(Box);
const MotionTr = motion.create(Tr);

const makeSpring = (reduce) =>
  reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32, mass: 0.7 };

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
   UI helper (Glass/iOS)
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

function EstadoPill({ estado }) {
  const meta = estadoMeta[estado] || { label: estado || "—", scheme: "gray", icon: FiInfo };
  return (
    <Tag size="sm" variant="subtle" colorScheme={meta.scheme} borderRadius="full">
      <TagLeftIcon as={meta.icon} />
      <TagLabel fontWeight="black">{meta.label}</TagLabel>
    </Tag>
  );
}

function PrioridadPill({ prioridad }) {
  const meta = prioridadMeta[prioridad] || { label: prioridad || "—", scheme: "gray" };
  const icon = prioridad === "ALTA" ? FiZap : prioridad === "MEDIA" ? FiAlertCircle : FiClock;

  return (
    <Tag size="sm" variant="subtle" colorScheme={meta.scheme} borderRadius="full">
      <TagLeftIcon as={icon} />
      <TagLabel fontWeight="black">{meta.label}</TagLabel>
    </Tag>
  );
}

function KpiChip({ label, value, icon, scheme = "gray" }) {
  const muted = useColorModeValue("gray.600", "gray.400");
  return (
    <GlassCard rounded="2xl" p={3}>
      <HStack justify="space-between" align="center">
        <HStack spacing={2} minW={0}>
          <Tag size="sm" variant="subtle" colorScheme={scheme} borderRadius="full">
            <TagLeftIcon as={icon} />
            <TagLabel fontWeight="black">{value}</TagLabel>
          </Tag>
          <Text fontSize="xs" color={muted} noOfLines={1}>
            {label}
          </Text>
        </HStack>
      </HStack>
    </GlassCard>
  );
}

/* =========================================================================
   Card mobile (clic en TODO el caso)
   ========================================================================= */
function CasoCard({ caso, onOpen, getRespuestaMeta }) {
  const reduceMotion = usePrefersReducedMotion();
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const hoverBg = useColorModeValue("yellow.50", "whiteAlpha.100");

  const respuestaMeta = getRespuestaMeta(caso);

  return (
    <MotionBox variants={fadeUp(reduceMotion)}>
      <motion.div {...pressable(reduceMotion)}>
        <GlassCard
          rounded="3xl"
          overflow="hidden"
          cursor="pointer"
          border="1px solid"
          borderColor={borderColor}
          _hover={{ borderColor: ferreYellow }}
          onClick={() => onOpen(caso)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(caso);
            }
          }}
        >
          <Box p={4} _hover={{ bg: hoverBg }} transition="background .12s">
            <HStack justify="space-between" align="start" mb={2}>
              <Box minW={0}>
                <Text fontSize="10px" fontWeight="bold" color={muted} letterSpacing="wide">
                  CASO #{caso.id}
                </Text>
                <Text fontWeight="black" fontSize="sm" noOfLines={1}>
                  {caso.titulo}
                </Text>
              </Box>
              <Icon as={FiChevronRight} color={muted} mt={1} />
            </HStack>

            <HStack spacing={2} flexWrap="wrap" mb={2}>
              <EstadoPill estado={caso.estado} />
              <PrioridadPill prioridad={caso.prioridad} />
              <Badge
                colorScheme={respuestaMeta.colorScheme}
                variant={respuestaMeta.colorScheme === "purple" ? "solid" : "subtle"}
                rounded="full"
                fontSize="10px"
              >
                {respuestaMeta.label}
              </Badge>
            </HStack>

            <Text fontSize="xs" color={muted}>
              Creado: {formatDateTime(caso.fecha_creacion)}
            </Text>

            <Text mt={2} fontSize="sm" color={muted} noOfLines={2}>
              {caso.descripcion || "Sin descripción."}
            </Text>

            <Text fontSize="xs" color={muted} mt={3}>
              Toca para abrir el hilo.
            </Text>
          </Box>
        </GlassCard>
      </motion.div>
    </MotionBox>
  );
}

/* =========================================================================
   Componente principal
   ========================================================================= */

export default function MisCasos() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reduceMotion = usePrefersReducedMotion();

  const bg = useColorModeValue("gray.50", "blackAlpha.900");
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const softBg = useColorModeValue("gray.50", "blackAlpha.500");
  const dropdownBg = useColorModeValue("white", "gray.900");

  const isMobile = useBreakpointValue({ base: true, md: false });

  const focusRing = { boxShadow: "0 0 0 3px rgba(249,191,32,0.55)" };

  // datos
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // filtros
  const [fEstado, setFEstado] = useState("");
  const [fPrioridad, setFPrioridad] = useState("");
  const [search, setSearch] = useState("");

  // detalle/hilo
  const [selected, setSelected] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [sendingComentario, setSendingComentario] = useState(false);

  // crear caso
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPrioridad, setFormPrioridad] = useState("MEDIA");

  // auto open
  const [autoOpenedId, setAutoOpenedId] = useState(null);

  // ✅ Siempre que entro aquí, me llevo al inicio de la página
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // no-op
      }
    }, 40);
    return () => clearTimeout(t);
  }, []);

  /* ==== cargar casos ==== */
  const fetchCasos = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/casos");
      setCasos(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al cargar casos",
        description: "No fue posible cargar tus casos de soporte.",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  /* ==== filtros en memoria ==== */
  const filteredCasos = useMemo(() => {
    const q = norm(search);
    return casos.filter((c) => {
      if (fEstado && c.estado !== fEstado) return false;
      if (fPrioridad && c.prioridad !== fPrioridad) return false;

      if (q) {
        const partes = [c.id && String(c.id), c.titulo, c.descripcion, c.prioridad, c.estado];
        const match = partes.some((p) => norm(p).includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [casos, fEstado, fPrioridad, search]);

  const hasFilters = useMemo(() => Boolean(fEstado || fPrioridad || search.trim()), [fEstado, fPrioridad, search]);

  /* ==== stats pequeños ==== */
  const stats = useMemo(() => {
    const total = filteredCasos.length;
    const abiertos = filteredCasos.filter((c) => c.estado === "ABIERTO").length;
    const enProgreso = filteredCasos.filter((c) => c.estado === "EN_PROGRESO").length;
    const resueltos = filteredCasos.filter((c) => c.estado === "RESUELTO").length;
    return { total, abiertos, enProgreso, resueltos };
  }, [filteredCasos]);

  /* ==== meta de última respuesta ==== */
  const getRespuestaMeta = (caso) => {
    const rawRol = (caso && (caso.ultima_respuesta_rol || caso.ultima_respuesta_role)) || "";
    const rol = rawRol.toUpperCase();
    const tieneDatos = Boolean(rawRol);

    if (rol === "ADMIN") return { label: "Equipo respondió", colorScheme: "purple" };
    if (rol === "CLIENTE") return { label: "Esperando respuesta", colorScheme: "gray" };
    if (!tieneDatos) return { label: "Sin respuestas aún", colorScheme: "gray" };
    return { label: "Actualizado", colorScheme: "blue" };
  };

  /* ==== comentarios ==== */
  const fetchComentarios = async (id) => {
    if (!id) return;
    try {
      setLoadingComentarios(true);
      const { data } = await api.get(`/casos/${id}/comentarios`);
      setComentarios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al cargar comentarios",
        description: "No fue posible obtener el hilo de este caso.",
      });
    } finally {
      setLoadingComentarios(false);
    }
  };

  const openDetalle = (caso) => {
    setSelected(caso);
    setComentarios([]);
    setNuevoComentario("");
    fetchComentarios(caso.id);
  };

  const closeDetalle = () => {
    setSelected(null);
    setComentarios([]);
    setNuevoComentario("");
  };

  const handleAddComentario = async () => {
    if (!selected?.id) return;
    const msg = nuevoComentario.trim();
    if (!msg) return;

    try {
      setSendingComentario(true);
      const { data } = await api.post(`/casos/${selected.id}/comentarios`, { mensaje: msg });
      setComentarios((prev) => [...prev, data]);
      setNuevoComentario("");
      toast({ status: "success", title: "Comentario enviado", duration: 2000 });
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al enviar comentario",
        description: "Intenta nuevamente en unos segundos.",
      });
    } finally {
      setSendingComentario(false);
    }
  };

  // ✅ Autoscroll al último mensaje cuando se abre o se actualiza el hilo
  useEffect(() => {
    if (!selected || comentarios.length === 0) return;
    const timer = setTimeout(() => {
      const el = document.getElementById("comentarios-container");
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [selected, comentarios]);

  /* ==== crear caso ==== */
  const resetCreateForm = () => {
    setFormTitulo("");
    setFormDescripcion("");
    setFormPrioridad("MEDIA");
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (creating) return;
    setIsCreateOpen(false);
  };

  const handleCreateCaso = async () => {
    if (!formTitulo.trim() || !formDescripcion.trim()) {
      toast({
        status: "warning",
        title: "Campos incompletos",
        description: "Por favor escribe un título y una descripción.",
      });
      return;
    }

    try {
      setCreating(true);
      const { data } = await api.post("/casos", {
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim(),
        prioridad: formPrioridad,
      });

      setCasos((prev) => [
        {
          id: data.id,
          titulo: formTitulo.trim(),
          descripcion: formDescripcion.trim(),
          prioridad: formPrioridad,
          estado: data.estado || "ABIERTO",
          fecha_creacion: new Date().toISOString(),
        },
        ...prev,
      ]);

      toast({
        status: "success",
        title: "Caso creado",
        description: "Tu caso fue creado correctamente. Podrás seguir aquí las respuestas.",
      });

      setIsCreateOpen(false);
      resetCreateForm();
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al crear caso",
        description: "Revisa tu conexión o intenta más tarde.",
      });
    } finally {
      setCreating(false);
    }
  };

  const limpiarFiltros = () => {
    setFEstado("");
    setFPrioridad("");
    setSearch("");
  };

  /* ==== abrir automáticamente si viene de notificación: ?casoId=123 ==== */
  useEffect(() => {
    const param = searchParams.get("casoId");
    if (!param || !casos.length) return;

    const id = Number(param);
    if (!id || autoOpenedId === id) return;

    const found = casos.find((c) => c.id === id);
    if (found) {
      openDetalle(found);
      setAutoOpenedId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, casos]);

  /* ==== copiar título del caso ==== */
  const handleCopyTituloCaso = () => {
    if (!selected) return;
    const text = `Caso #${selected.id} · ${selected.titulo}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast({
        status: "success",
        title: "Título copiado",
        description: "El identificador del caso se copió al portapapeles.",
        duration: 2000,
      });
    }
  };

  return (
    <Box minH="100vh" bg={bg} pb={10}>
      <MotionConfig transition={makeSpring(reduceMotion)}>
        <Container maxW="1200px" pt={{ base: 6, md: 8 }}>
          <MotionBox initial="hidden" animate="show" variants={stagger(reduceMotion)}>
            {/* =================== HEADER (Glass / iOS) =================== */}
            <MotionBox variants={fadeUp(reduceMotion)}>
              <GlassCard rounded="3xl" overflow="hidden">
                <Box p={{ base: 4, md: 6 }}>
                  <Flex
                    justify="space-between"
                    align={{ base: "start", md: "center" }}
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
                          boxShadow={useColorModeValue(
                            "0 10px 24px rgba(249,191,32,.25)",
                            "0 10px 24px rgba(249,191,32,.12)"
                          )}
                        >
                          <FiLifeBuoy size={20} />
                        </Box>
                      </motion.div>

                      <Box>
                        <HStack spacing={2} flexWrap="wrap">
                          <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="yellow">
                            <TagLabel>Mi cuenta</TagLabel>
                          </Tag>
                          <FiChevronRight size={12} />
                          <Tag size="sm" borderRadius="full" variant="outline" colorScheme="yellow">
                            <TagLabel>Soporte y casos</TagLabel>
                          </Tag>

                          {lastUpdated && (
                            <Text fontSize="xs" color={muted}>
                              Actualizado:{" "}
                              {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          )}
                        </HStack>

                        <Heading mt={2} size="lg" fontWeight="black" letterSpacing="tight">
                          Soporte y casos
                        </Heading>
                        <Text fontSize="sm" color={muted} mt={1}>
                          Crea solicitudes, consulta su estado y revisa el hilo con el equipo de FerreExpress.
                        </Text>

                        <HStack spacing={2} mt={3} flexWrap="wrap">
                          <Button
                            size="xs"
                            variant="ghost"
                            leftIcon={<FiHelpCircle />}
                            onClick={() => navigate("/cliente/ayuda")}
                            _focus={focusRing}
                            rounded="full"
                          >
                            Centro de ayuda
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            leftIcon={<FiTruck />}
                            onClick={() => navigate("/cliente/pedidos")}
                            _focus={focusRing}
                            rounded="full"
                          >
                            Mis pedidos
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            leftIcon={<FiUser />}
                            onClick={() => navigate("/cliente/perfil")}
                            _focus={focusRing}
                            rounded="full"
                          >
                            Mi perfil
                          </Button>
                        </HStack>
                      </Box>
                    </HStack>

                    <HStack spacing={3} w={{ base: "full", md: "auto" }}>
                      <Tooltip label="Recargar" hasArrow>
                        <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                          <IconButton
                            aria-label="Recargar casos"
                            icon={<FiRefreshCw />}
                            variant="outline"
                            rounded="full"
                            onClick={() => fetchCasos()}
                            isLoading={loading}
                            _focus={focusRing}
                          />
                        </motion.div>
                      </Tooltip>

                      <motion.div {...pressable(reduceMotion)} style={{ width: "100%" }}>
                        <Button
                          leftIcon={<FiPlus />}
                          colorScheme="yellow"
                          color="black"
                          rounded="full"
                          px={6}
                          onClick={handleOpenCreate}
                          w={{ base: "full", md: "auto" }}
                        >
                          Nuevo caso
                        </Button>
                      </motion.div>
                    </HStack>
                  </Flex>

                  <Divider my={5} borderColor={borderColor} />

                  {/* KPIs (discretos) */}
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <KpiChip label="Casos (vista)" value={stats.total} icon={FiLifeBuoy} scheme="gray" />
                    <KpiChip label="Abiertos" value={stats.abiertos} icon={FiAlertCircle} scheme="blue" />
                    <KpiChip label="En progreso" value={stats.enProgreso} icon={FiClock} scheme="orange" />
                    <KpiChip label="Resueltos" value={stats.resueltos} icon={FiCheckCircle} scheme="green" />
                  </SimpleGrid>
                </Box>
              </GlassCard>
            </MotionBox>

            {/* =================== LISTADO + FILTROS (Glass) =================== */}
            <MotionBox variants={fadeUp(reduceMotion)} mt={6}>
              <GlassCard rounded="3xl" overflow="hidden">
                <Box p={{ base: 4, md: 6 }}>
                  <Flex
                    justify="space-between"
                    align={{ base: "start", md: "center" }}
                    gap={4}
                    direction={{ base: "column", md: "row" }}
                    mb={4}
                  >
                    <Box>
                      <Heading size="sm" fontWeight="black">
                        Tus casos de soporte
                      </Heading>
                      <Text fontSize="xs" color={muted} mt={1}>
                        Tip: abre un caso tocándolo (en móvil o en la fila completa).
                      </Text>
                    </Box>

                    <HStack spacing={2} flexWrap="wrap">
                      <Badge colorScheme="yellow" variant="subtle" rounded="full">
                        {filteredCasos.length} CASO{filteredCasos.length === 1 ? "" : "S"}
                      </Badge>
                      {hasFilters && (
                        <Tag size="sm" variant="subtle" colorScheme="blue" borderRadius="full">
                          <TagLabel>Filtros activos</TagLabel>
                        </Tag>
                      )}
                      {hasFilters && (
                        <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiX />}
                            onClick={limpiarFiltros}
                            rounded="full"
                          >
                            Limpiar
                          </Button>
                        </motion.div>
                      )}
                    </HStack>
                  </Flex>

                  {/* Filtros */}
                  <Stack direction={{ base: "column", md: "row" }} spacing={3} align="stretch" mb={5}>
                    <InputGroup size="lg" flex="1">
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar por título, descripción o ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        rounded="2xl"
                        bg={softBg}
                        border="1px solid"
                        borderColor={borderColor}
                        focusBorderColor={ferreYellow}
                        _placeholder={{ color: useColorModeValue("gray.400", "gray.500"), fontSize: "sm" }}
                      />
                    </InputGroup>

                    <HStack spacing={3} align="stretch">
                      <Select
                        value={fEstado}
                        onChange={(e) => setFEstado(e.target.value)}
                        rounded="2xl"
                        bg={dropdownBg}
                        border="1px solid"
                        borderColor={borderColor}
                        minW={{ base: "full", md: "190px" }}
                        h="48px"
                      >
                        <option value="">Estado (todos)</option>
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {estadoMeta[e]?.label ?? e}
                          </option>
                        ))}
                      </Select>

                      <Select
                        value={fPrioridad}
                        onChange={(e) => setFPrioridad(e.target.value)}
                        rounded="2xl"
                        bg={dropdownBg}
                        border="1px solid"
                        borderColor={borderColor}
                        minW={{ base: "full", md: "190px" }}
                        h="48px"
                      >
                        <option value="">Prioridad (todas)</option>
                        {PRIORIDADES.map((p) => (
                          <option key={p} value={p}>
                            {prioridadMeta[p]?.label ?? p}
                          </option>
                        ))}
                      </Select>
                    </HStack>
                  </Stack>

                  {/* Contenido listado */}
                  {loading ? (
                    isMobile ? (
                      <VStack align="stretch" spacing={4}>
                        {[1, 2, 3].map((i) => (
                          <GlassCard key={i} rounded="3xl" p={5}>
                            <Skeleton h="16px" mb={2} rounded="md" />
                            <SkeletonText noOfLines={2} spacing="2" />
                          </GlassCard>
                        ))}
                      </VStack>
                    ) : (
                      <TableContainer rounded="2xl" border="1px solid" borderColor={borderColor} overflow="hidden">
                        <Table size="sm" variant="simple">
                          <Thead bg={useColorModeValue("gray.50", "blackAlpha.500")}>
                            <Tr>
                              <Th>Fecha</Th>
                              <Th>Estado</Th>
                              <Th>Prioridad</Th>
                              <Th>Atención</Th>
                              <Th>Título</Th>
                              <Th textAlign="right"> </Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {[1, 2, 3].map((i) => (
                              <Tr key={i}>
                                <Td><Skeleton h="16px" rounded="md" /></Td>
                                <Td><Skeleton h="16px" rounded="md" /></Td>
                                <Td><Skeleton h="16px" rounded="md" /></Td>
                                <Td><Skeleton h="16px" rounded="md" /></Td>
                                <Td><SkeletonText noOfLines={1} spacing="2" /></Td>
                                <Td textAlign="right"><Skeleton h="16px" rounded="md" /></Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )
                  ) : filteredCasos.length === 0 ? (
                    <GlassCard rounded="3xl" p={{ base: 7, md: 10 }} textAlign="center">
                      <VStack spacing={2} color={muted}>
                        <Box
                          boxSize="44px"
                          rounded="full"
                          bg={useColorModeValue("gray.50", "blackAlpha.500")}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <FiInfo />
                        </Box>

                        <Text fontWeight="black">
                          {hasFilters
                            ? "No hay casos que coincidan con los filtros."
                            : "Aún no tienes casos de soporte."}
                        </Text>

                        <Text fontSize="sm">
                          {hasFilters
                            ? "Prueba otra búsqueda o limpia filtros."
                            : "Crea tu primer caso y el equipo te responderá por el hilo."}
                        </Text>

                        <HStack pt={3} spacing={3} justify="center" flexWrap="wrap">
                          {hasFilters && (
                            <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                              <Button variant="outline" rounded="full" onClick={limpiarFiltros}>
                                Limpiar filtros
                              </Button>
                            </motion.div>
                          )}
                          <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                            <Button
                              colorScheme="yellow"
                              color="black"
                              rounded="full"
                              onClick={handleOpenCreate}
                              leftIcon={<FiPlus />}
                            >
                              Crear caso
                            </Button>
                          </motion.div>
                        </HStack>
                      </VStack>
                    </GlassCard>
                  ) : isMobile ? (
                    <MotionBox variants={stagger(reduceMotion)}>
                      <VStack align="stretch" spacing={4}>
                        {filteredCasos.map((c) => (
                          <CasoCard key={c.id} caso={c} onOpen={openDetalle} getRespuestaMeta={getRespuestaMeta} />
                        ))}
                      </VStack>
                    </MotionBox>
                  ) : (
                    <GlassCard
                      rounded="3xl"
                      overflow="hidden"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead bg={useColorModeValue("gray.50", "blackAlpha.500")}>
                            <Tr>
                              <Th>Fecha</Th>
                              <Th>Estado</Th>
                              <Th>Prioridad</Th>
                              <Th>Atención</Th>
                              <Th>Título</Th>
                              <Th textAlign="right"> </Th>
                            </Tr>
                          </Thead>

                          <Tbody>
                            <AnimatePresence initial={false}>
                              {filteredCasos.map((c) => {
                                const respuestaMeta = getRespuestaMeta(c);
                                return (
                                  <MotionTr
                                    key={c.id}
                                    layout
                                    initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                                    transition={makeSpring(reduceMotion)}
                                    style={{ display: "table-row" }}
                                    cursor="pointer"
                                    onClick={() => openDetalle(c)} // ✅ fila completa abre el hilo
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openDetalle(c);
                                      }
                                    }}
                                    _hover={{ bg: useColorModeValue("yellow.50", "whiteAlpha.100") }}
                                  >
                                    <Td whiteSpace="nowrap">{formatDateTime(c.fecha_creacion)}</Td>
                                    <Td><EstadoPill estado={c.estado} /></Td>
                                    <Td><PrioridadPill prioridad={c.prioridad} /></Td>
                                    <Td>
                                      <Badge
                                        colorScheme={respuestaMeta.colorScheme}
                                        variant={respuestaMeta.colorScheme === "purple" ? "solid" : "subtle"}
                                        rounded="full"
                                        fontSize="10px"
                                      >
                                        {respuestaMeta.label}
                                      </Badge>
                                    </Td>
                                    <Td maxW="520px">
                                      <Text fontWeight="black" noOfLines={1}>
                                        {c.titulo}
                                      </Text>
                                      <Text fontSize="xs" color={muted} noOfLines={1}>
                                        {c.descripcion || "Sin descripción"}
                                      </Text>
                                    </Td>
                                    <Td textAlign="right">
                                      <HStack justify="flex-end" color={muted}>
                                        <Text fontSize="xs">Abrir</Text>
                                        <Icon as={FiChevronRight} />
                                      </HStack>
                                    </Td>
                                  </MotionTr>
                                );
                              })}
                            </AnimatePresence>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </GlassCard>
                  )}
                </Box>
              </GlassCard>
            </MotionBox>
          </MotionBox>
        </Container>

        {/* =================== Modal crear caso (Glass + blur) =================== */}
        <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} isCentered trapFocus size={{ base: "full", md: "lg" }}>
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
          <ModalContent borderRadius={{ base: 0, md: "2xl" }} overflow="hidden">
            <ModalHeader>Nuevo caso de soporte</ModalHeader>
            <ModalCloseButton disabled={creating} />
            <ModalBody bg={bg} py={6}>
              <GlassCard rounded="3xl" p={5}>
                <Stack spacing={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Título del caso
                    </Text>
                    <Input
                      value={formTitulo}
                      onChange={(e) => setFormTitulo(e.target.value)}
                      placeholder="Ej: Problema con mi pedido, error en la factura…"
                      rounded="2xl"
                      bg={softBg}
                      border="1px solid"
                      borderColor={borderColor}
                      focusBorderColor={ferreYellow}
                      _focus={focusRing}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Prioridad
                    </Text>
                    <Select
                      value={formPrioridad}
                      onChange={(e) => setFormPrioridad(e.target.value)}
                      rounded="2xl"
                      bg={dropdownBg}
                      border="1px solid"
                      borderColor={borderColor}
                      h="48px"
                    >
                      <option value="ALTA">Alta</option>
                      <option value="MEDIA">Media</option>
                      <option value="BAJA">Baja</option>
                    </Select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Describe lo que sucede
                    </Text>
                    <Textarea
                      rows={6}
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      placeholder="Qué pasó, qué esperabas y datos clave (número de pedido, fecha, etc.)."
                      rounded="2xl"
                      bg={softBg}
                      border="1px solid"
                      borderColor={borderColor}
                      focusBorderColor={ferreYellow}
                    />
                  </Box>

                  <HStack spacing={2} color={muted}>
                    <FiInfo />
                    <Text fontSize="xs">
                      Entre más contexto incluyas (IDs), más rápida será la respuesta.
                    </Text>
                  </HStack>
                </Stack>
              </GlassCard>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseCreate} isDisabled={creating}>
                Cancelar
              </Button>
              <Button
                colorScheme="yellow"
                color="black"
                onClick={handleCreateCaso}
                isLoading={creating}
                rounded="full"
                px={7}
              >
                Crear caso
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* =================== Modal detalle / hilo (Glass + blur) =================== */}
        <Modal isOpen={!!selected} onClose={closeDetalle} isCentered trapFocus size={{ base: "full", md: "xl" }}>
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
          <ModalContent
            borderRadius={{ base: 0, md: "2xl" }}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            maxH={{ base: "100vh", md: "82vh" }}
          >
            <ModalHeader id="caso-detalle-titulo">
              {selected ? (
                <Text
                  as="span"
                  cursor="pointer"
                  onClick={handleCopyTituloCaso}
                  title="Click para copiar el identificador del caso"
                >
                  {`Caso #${selected.id} · ${selected.titulo}`}
                </Text>
              ) : (
                "Detalle de caso"
              )}
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody bg={bg} flex="1" overflowY="auto">
              {selected && (
                <Stack spacing={5} py={2}>
                  {/* Meta */}
                  <GlassCard rounded="3xl" p={5}>
                    <HStack justify="space-between" align="start" flexWrap="wrap" spacing={3}>
                      <Box>
                        <Text fontSize="10px" fontWeight="bold" color={muted} letterSpacing="wide">
                          DATOS DEL CASO
                        </Text>
                        <HStack mt={2} spacing={2} flexWrap="wrap">
                          <EstadoPill estado={selected.estado} />
                          <PrioridadPill prioridad={selected.prioridad} />
                          <Tag size="sm" variant="subtle" borderRadius="full" colorScheme="gray">
                            <TagLabel>Creado: {formatDateTime(selected.fecha_creacion)}</TagLabel>
                          </Tag>
                        </HStack>
                      </Box>

                      <Badge
                        colorScheme={getRespuestaMeta(selected).colorScheme}
                        variant={getRespuestaMeta(selected).colorScheme === "purple" ? "solid" : "subtle"}
                        rounded="full"
                      >
                        {getRespuestaMeta(selected).label}
                      </Badge>
                    </HStack>
                  </GlassCard>

                  {/* Descripción */}
                  <MotionBox variants={fadeIn(reduceMotion)} initial="hidden" animate="show">
                    <GlassCard rounded="3xl" p={5}>
                      <Text fontSize="10px" fontWeight="bold" color={muted} letterSpacing="wide" mb={2}>
                        DESCRIPCIÓN
                      </Text>
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {selected.descripcion || "—"}
                      </Text>
                    </GlassCard>
                  </MotionBox>

                  {/* Hilo */}
                  <GlassCard rounded="3xl" p={5}>
                    <HStack justify="space-between" mb={3} flexWrap="wrap">
                      <HStack spacing={2}>
                        <Icon as={FiMessageSquare} color="yellow.500" />
                        <Heading size="sm">Conversación</Heading>
                      </HStack>

                      <HStack spacing={2}>
                        <Tag size="sm" variant="subtle" borderRadius="full" colorScheme="gray">
                          <TagLabel>
                            {loadingComentarios
                              ? "Cargando…"
                              : comentarios.length === 1
                              ? "1 mensaje"
                              : `${comentarios.length} mensajes`}
                          </TagLabel>
                        </Tag>

                        <Tooltip label="Actualizar hilo" hasArrow>
                          <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                            <IconButton
                              aria-label="Actualizar hilo"
                              icon={<FiRefreshCw />}
                              size="sm"
                              rounded="full"
                              variant="outline"
                              onClick={() => fetchComentarios(selected.id)}
                              isDisabled={loadingComentarios}
                            />
                          </motion.div>
                        </Tooltip>
                      </HStack>
                    </HStack>

                    <Box
                      id="comentarios-container"
                      maxH={{ base: "44vh", md: "320px" }}
                      overflowY="auto"
                      border="1px solid"
                      borderColor={borderColor}
                      rounded="2xl"
                      p={3}
                      bg={useColorModeValue("whiteAlpha.800", "blackAlpha.300")}
                      backdropFilter="blur(12px)"
                    >
                      {loadingComentarios ? (
                        <VStack align="stretch" spacing={2}>
                          <Skeleton h="18px" rounded="md" />
                          <SkeletonText noOfLines={3} spacing="2" />
                        </VStack>
                      ) : comentarios.length === 0 ? (
                        <Text fontSize="sm" color={muted}>
                          Aún no hay mensajes en este caso. El equipo te responderá aquí cuando revise tu solicitud.
                        </Text>
                      ) : (
                        <VStack align="stretch" spacing={3}>
                          {comentarios.map((com) => {
                            const esAdmin = com.role === "ADMIN";
                            const nombre = esAdmin ? "Equipo FerreExpress" : com.username || "Tú";

                            const bubbleBg = useColorModeValue(
                              esAdmin ? "whiteAlpha.900" : "yellow.50",
                              esAdmin ? "blackAlpha.500" : "rgba(236, 201, 75, 0.12)"
                            );

                            return (
                              <HStack
                                key={com.id}
                                align="flex-start"
                                spacing={3}
                                borderRadius="2xl"
                                bg={bubbleBg}
                                p={3}
                                border="1px solid"
                                borderColor={borderColor}
                              >
                                <Avatar
                                  size="sm"
                                  name={nombre}
                                  bg={esAdmin ? "purple.500" : "blue.500"}
                                  color="white"
                                />
                                <Box flex="1" minW={0}>
                                  <HStack justify="space-between" align="center" mb={1} spacing={2} flexWrap="wrap">
                                    <Badge
                                      colorScheme={esAdmin ? "purple" : "yellow"}
                                      variant="subtle"
                                      rounded="full"
                                      fontSize="10px"
                                    >
                                      {nombre}
                                    </Badge>
                                    <Text fontSize="xs" color={muted}>
                                      {formatDateTime(com.fecha_creacion)}
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" whiteSpace="pre-wrap">
                                    {com.mensaje}
                                  </Text>
                                </Box>
                              </HStack>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  </GlassCard>

                  {/* Nuevo comentario */}
                  <GlassCard rounded="3xl" p={5}>
                    <HStack spacing={2} mb={2} color={muted}>
                      <FiInfo />
                      <Text fontSize="xs">
                        Enter envía • Shift+Enter salto de línea
                      </Text>
                    </HStack>

                    <Textarea
                      rows={4}
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder="Escribe una actualización, pregunta o respuesta…"
                      rounded="2xl"
                      bg={softBg}
                      border="1px solid"
                      borderColor={borderColor}
                      focusBorderColor={ferreYellow}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComentario();
                        }
                      }}
                    />

                    <HStack justify="flex-end" spacing={2} mt={3}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNuevoComentario("")}
                        isDisabled={!nuevoComentario.trim() || sendingComentario}
                        rounded="full"
                      >
                        Limpiar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="yellow"
                        color="black"
                        onClick={handleAddComentario}
                        isLoading={sendingComentario}
                        isDisabled={!nuevoComentario.trim()}
                        leftIcon={<FiMessageSquare />}
                        rounded="full"
                        px={6}
                      >
                        Enviar
                      </Button>
                    </HStack>
                  </GlassCard>
                </Stack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button onClick={closeDetalle} rounded="full">
                Cerrar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* FAB Mobile (mismo estilo) */}
        {isMobile && (
          <motion.div {...pressable(reduceMotion)} style={{ position: "fixed", right: 18, bottom: 18, zIndex: 50 }}>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="yellow"
              color="black"
              rounded="full"
              size="lg"
              boxShadow="2xl"
              onClick={handleOpenCreate}
            >
              Nuevo caso
            </Button>
          </motion.div>
        )}
      </MotionConfig>
    </Box>
  );
}
