// src/pages/empresa/MisCasosEmpresa.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
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
  Textarea,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
  usePrefersReducedMotion,
  useToast,
  VStack,
  Spacer,
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
  FiFilter,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import api from "../../utils/axiosInstance";

const MotionBox = motion.create(Box);
const MotionTr = motion.create(Tr);

const ferreYellow = "#F9BF20";

/* =========================================================================
   Motion primitives (mismo estilo BeneficiosEmpresa)
   ========================================================================= */
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
   UI helpers (Glass/iOS)
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
   Helpers datos
   ========================================================================= */
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

const norm = (s) => (s || "").toString().toLowerCase();
const parseTime = (iso) => {
  const t = new Date(iso || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
};

// endpoints
const CASOS_BASE = "/casos";

/* =========================================================================
   UI pills
   ========================================================================= */
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
  return (
    <Tag size="sm" variant="subtle" colorScheme={meta.scheme} borderRadius="full">
      <TagLabel fontWeight="black">{meta.label}</TagLabel>
    </Tag>
  );
}

function ActiveFiltersChips({ fEstado, fPrioridad, search, orden }) {
  const chips = [];
  if (search?.trim()) chips.push({ label: `Búsqueda: “${search.trim()}”`, scheme: "yellow" });
  if (fEstado) chips.push({ label: `Estado: ${estadoMeta[fEstado]?.label ?? fEstado}`, scheme: "blue" });
  if (fPrioridad) chips.push({ label: `Prioridad: ${prioridadMeta[fPrioridad]?.label ?? fPrioridad}`, scheme: "yellow" });
  if (orden === "ANTIGUOS") chips.push({ label: "Orden: antiguos", scheme: "gray" });

  if (!chips.length) return null;

  return (
    <HStack spacing={2} flexWrap="wrap">
      {chips.map((c, idx) => (
        <Tag key={idx} size="sm" borderRadius="full" variant="subtle" colorScheme={c.scheme}>
          <TagLabel>{c.label}</TagLabel>
        </Tag>
      ))}
    </HStack>
  );
}

/* =========================================================================
   Mobile card (clic en TODO)
   ========================================================================= */
function CaseCard({ caso, onOpen }) {
  const reduceMotion = usePrefersReducedMotion();
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const hoverBg = useColorModeValue("yellow.50", "whiteAlpha.100");

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
          onClick={onOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
        >
          <Box p={4} _hover={{ bg: hoverBg }} transition="background .12s">
            <HStack justify="space-between" align="start" mb={2}>
              <Box>
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
              <Tag size="sm" variant="subtle" borderRadius="full" colorScheme="gray">
                <TagLeftIcon as={FiClock} />
                <TagLabel>{formatDateTime(caso.fecha_creacion)}</TagLabel>
              </Tag>
            </HStack>

            {caso.descripcion ? (
              <Text fontSize="sm" color={muted} noOfLines={2}>
                {caso.descripcion}
              </Text>
            ) : (
              <Text fontSize="sm" color={muted} noOfLines={2}>
                Sin descripción.
              </Text>
            )}

            <Text fontSize="xs" color={muted} mt={3}>
              Toca para abrir la conversación.
            </Text>
          </Box>
        </GlassCard>
      </motion.div>
    </MotionBox>
  );
}

/* =========================================================================
   Página
   ========================================================================= */
export default function MisCasosEmpresa() {
  const toast = useToast();
  const reduceMotion = usePrefersReducedMotion();
  const [searchParams] = useSearchParams();

  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen: isFiltersOpen, onOpen: openFilters, onClose: closeFilters } = useDisclosure();

  // Theme
  const bg = useColorModeValue("gray.50", "blackAlpha.900");
  const muted = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const softBg = useColorModeValue("gray.50", "blackAlpha.500");
  const dropdownBg = useColorModeValue("white", "gray.900");
  const rowHover = useColorModeValue("yellow.50", "whiteAlpha.100");

  // Data
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filters
  const [fEstado, setFEstado] = useState("");
  const [fPrioridad, setFPrioridad] = useState("");
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState("NUEVOS"); // NUEVOS | ANTIGUOS

  // Detail / thread
  const [selected, setSelected] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [sendingComentario, setSendingComentario] = useState(false);
  const bottomRef = useRef(null);

  // Create case
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPrioridad, setFormPrioridad] = useState("MEDIA");

  // Auto open
  const [autoOpenedId, setAutoOpenedId] = useState(null);

  const filtersActive = useMemo(() => {
    return !!(fEstado || fPrioridad || (search || "").trim() || orden !== "NUEVOS");
  }, [fEstado, fPrioridad, search, orden]);

  /* ---------------- fetch cases ---------------- */
  const fetchCasos = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(CASOS_BASE);
      setCasos(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast({
        title: "No pudimos cargar tus casos",
        description: "Revisa tu conexión e intenta actualizar.",
        status: "warning",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCasos();
  }, [fetchCasos]);

  /* ---------------- filtered + sorted ---------------- */
  const filteredCasos = useMemo(() => {
    const q = norm(search);
    const base = (casos || []).filter((c) => {
      if (fEstado && c.estado !== fEstado) return false;
      if (fPrioridad && c.prioridad !== fPrioridad) return false;

      if (q) {
        const parts = [c.id && String(c.id), c.titulo, c.descripcion, c.prioridad, c.estado];
        return parts.some((p) => norm(p).includes(q));
      }
      return true;
    });

    base.sort((a, b) => {
      const ta = parseTime(a.fecha_creacion);
      const tb = parseTime(b.fecha_creacion);
      return orden === "NUEVOS" ? tb - ta : ta - tb;
    });

    return base;
  }, [casos, fEstado, fPrioridad, search, orden]);

  const countLabel = useMemo(() => {
    if (loading) return "Cargando…";
    const total = casos.length;
    const shown = filteredCasos.length;
    if (!total) return "Sin casos";
    if (shown === total) return `${shown} casos`;
    return `${shown} de ${total} casos`;
  }, [loading, casos.length, filteredCasos.length]);

  /* ---------------- comments ---------------- */
  const fetchComentarios = useCallback(async (id) => {
    if (!id) return;
    try {
      setLoadingComentarios(true);
      const { data } = await api.get(`${CASOS_BASE}/${id}/comentarios`);
      setComentarios(Array.isArray(data) ? data : []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      console.error(err);
      toast({
        title: "No pudimos cargar el hilo",
        description: "Intenta nuevamente en unos segundos.",
        status: "warning",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setLoadingComentarios(false);
    }
  }, [toast]);

  const openDetalle = useCallback((caso) => {
    if (!caso) return;
    setSelected(caso);
    setComentarios([]);
    setNuevoComentario("");
    fetchComentarios(caso.id);
  }, [fetchComentarios]);

  const closeDetalle = useCallback(() => {
    setSelected(null);
    setComentarios([]);
    setNuevoComentario("");
  }, []);

  const handleAddComentario = useCallback(async () => {
    if (!selected?.id) return;
    const msg = nuevoComentario.trim();
    if (!msg) return;

    try {
      setSendingComentario(true);
      const { data } = await api.post(`${CASOS_BASE}/${selected.id}/comentarios`, { mensaje: msg });
      setComentarios((prev) => [...prev, data]);
      setNuevoComentario("");
      toast({
        title: "Mensaje enviado",
        status: "success",
        duration: 1600,
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al enviar",
        description: "Intenta de nuevo en unos segundos.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSendingComentario(false);
    }
  }, [nuevoComentario, selected?.id, toast]);

  const onComentarioKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!sendingComentario && nuevoComentario.trim()) handleAddComentario();
    }
  };

  /* ---------------- create case ---------------- */
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
        title: "Campos incompletos",
        description: "Escribe un título y una descripción para crear el caso.",
        status: "info",
        duration: 3500,
      });
      return;
    }

    try {
      setCreating(true);
      const { data } = await api.post(CASOS_BASE, {
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim(),
        prioridad: formPrioridad,
      });

      const nuevo = {
        id: data.id,
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim(),
        prioridad: formPrioridad,
        estado: data.estado || "ABIERTO",
        fecha_creacion: data.fecha_creacion || new Date().toISOString(),
      };

      setCasos((prev) => [nuevo, ...(prev || [])]);

      toast({
        title: "Caso creado",
        description: "Se abrió tu solicitud. Puedes responder en el hilo.",
        status: "success",
        duration: 4200,
        isClosable: true,
      });

      setIsCreateOpen(false);
      resetCreateForm();

      // abre el hilo para dar feedback inmediato
      openDetalle(nuevo);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al crear caso",
        description: "Revisa tu conexión o intenta más tarde.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setFEstado("");
    setFPrioridad("");
    setSearch("");
    setOrden("NUEVOS");
  };

  /* ---------------- auto open ?casoId ---------------- */
  useEffect(() => {
    const param = searchParams.get("casoId");
    if (!param || !casos.length) return;

    const id = Number(param);
    if (!id || autoOpenedId === id) return;

    const found = casos.find((c) => Number(c.id) === id);
    if (found) {
      openDetalle(found);
      setAutoOpenedId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, casos]);

  return (
    <Box minH="100vh" bg={bg} pb={10}>
      <MotionConfig transition={makeSpring(reduceMotion)}>
        <Container maxW="1200px" pt={{ base: 6, md: 8 }}>
          <MotionBox initial="hidden" animate="show" variants={stagger(reduceMotion)}>
            {/* HEADER */}
            <MotionBox variants={fadeUp(reduceMotion)}>
              <GlassCard rounded="3xl" overflow="hidden">
                <Card bg="transparent" border="none">
                  <CardBody p={{ base: 4, md: 6 }}>
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
                            <Heading size="md">Soporte y casos (Empresa)</Heading>
                            <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="gray">
                              <TagLeftIcon as={FiInfo} />
                              <TagLabel>{countLabel}</TagLabel>
                            </Tag>
                            {lastUpdated && (
                              <Text fontSize="xs" color={muted}>
                                Actualizado:{" "}
                                {lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                              </Text>
                            )}
                          </HStack>

                          <Text fontSize="xs" color={muted} mt={1}>
                            Abre un caso y conversa con el equipo. Prioridad + estado visibles, seguimiento claro.
                          </Text>

                          {filtersActive && (
                            <Box mt={2}>
                              <ActiveFiltersChips
                                fEstado={fEstado}
                                fPrioridad={fPrioridad}
                                search={search}
                                orden={orden}
                              />
                            </Box>
                          )}
                        </Box>
                      </HStack>

                      <HStack spacing={3} w={{ base: "full", md: "auto" }}>
                        <Tooltip label="Actualizar" hasArrow>
                          <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                            <IconButton
                              aria-label="Actualizar casos"
                              icon={<FiRefreshCw />}
                              onClick={() => fetchCasos()}
                              rounded="full"
                              variant="outline"
                              isLoading={loading}
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

                    {/* TOOLBAR */}
                    <Stack spacing={3}>
                      <Flex gap={3} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }}>
                        <InputGroup size="lg" flex="1">
                          <InputLeftElement pointerEvents="none">
                            <FiSearch color="gray.400" />
                          </InputLeftElement>
                          <Input
                            placeholder="Buscar por ID, título, descripción…"
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

                        {isMobile ? (
                          <HStack>
                            <motion.div {...pressable(reduceMotion)} style={{ width: "100%" }}>
                              <Button
                                leftIcon={<FiFilter />}
                                variant="outline"
                                rounded="2xl"
                                onClick={openFilters}
                                w="full"
                              >
                                Filtros
                              </Button>
                            </motion.div>

                            {filtersActive && (
                              <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                                <Button variant="ghost" rounded="2xl" onClick={clearFilters}>
                                  Limpiar
                                </Button>
                              </motion.div>
                            )}
                          </HStack>
                        ) : (
                          <HStack spacing={3} align="center">
                            <Select
                              value={fEstado}
                              onChange={(e) => setFEstado(e.target.value)}
                              rounded="2xl"
                              bg={dropdownBg}
                              border="1px solid"
                              borderColor={borderColor}
                              minW="170px"
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
                              minW="170px"
                            >
                              <option value="">Prioridad (todas)</option>
                              {PRIORIDADES.map((p) => (
                                <option key={p} value={p}>
                                  {prioridadMeta[p]?.label ?? p}
                                </option>
                              ))}
                            </Select>

                            <Select
                              value={orden}
                              onChange={(e) => setOrden(e.target.value)}
                              rounded="2xl"
                              bg={dropdownBg}
                              border="1px solid"
                              borderColor={borderColor}
                              minW="170px"
                            >
                              <option value="NUEVOS">Orden: más nuevos</option>
                              <option value="ANTIGUOS">Orden: más antiguos</option>
                            </Select>

                            {filtersActive && (
                              <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                                <Button variant="ghost" rounded="2xl" onClick={clearFilters}>
                                  Limpiar
                                </Button>
                              </motion.div>
                            )}
                          </HStack>
                        )}
                      </Flex>

                      <HStack spacing={2} color={muted}>
                        <FiInfo />
                        <Text fontSize="xs">
                          Tip: abre cualquier caso tocándolo. En el hilo puedes enviar con <b>Ctrl + Enter</b>.
                        </Text>
                      </HStack>
                    </Stack>
                  </CardBody>
                </Card>
              </GlassCard>
            </MotionBox>

            {/* LIST */}
            <MotionBox variants={fadeUp(reduceMotion)} mt={6}>
              {loading ? (
                <VStack align="stretch" spacing={4}>
                  {[1, 2, 3, 4].map((i) => (
                    <GlassCard key={i} rounded="3xl" p={5}>
                      <Skeleton h="16px" mb={2} rounded="md" />
                      <SkeletonText noOfLines={2} spacing="2" />
                    </GlassCard>
                  ))}
                </VStack>
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
                    <Text fontWeight="black">No hay casos con estos filtros</Text>
                    <Text fontSize="sm">Prueba otra búsqueda o limpia los filtros.</Text>
                    <HStack pt={3} spacing={3} w="full" justify="center" flexWrap="wrap">
                      {filtersActive && (
                        <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                          <Button variant="outline" rounded="full" onClick={clearFilters}>
                            Limpiar filtros
                          </Button>
                        </motion.div>
                      )}
                      <motion.div {...pressable(reduceMotion)} style={{ display: "inline-block" }}>
                        <Button colorScheme="yellow" color="black" rounded="full" onClick={handleOpenCreate}>
                          Crear caso
                        </Button>
                      </motion.div>
                    </HStack>
                  </VStack>
                </GlassCard>
              ) : (
                <>
                  {/* MOBILE: cards */}
                  {isMobile ? (
                    <MotionBox variants={stagger(reduceMotion)}>
                      <VStack align="stretch" spacing={4}>
                        {filteredCasos.map((c) => (
                          <CaseCard key={c.id} caso={c} onOpen={() => openDetalle(c)} />
                        ))}
                      </VStack>
                    </MotionBox>
                  ) : (
                    /* DESKTOP: table, filas clicables completas */
                    <GlassCard rounded="3xl" overflow="hidden">
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead bg={useColorModeValue("gray.50", "blackAlpha.500")}>
                            <Tr>
                              <Th>ID</Th>
                              <Th>Fecha</Th>
                              <Th>Estado</Th>
                              <Th>Prioridad</Th>
                              <Th>Título</Th>
                              <Th textAlign="right"> </Th>
                            </Tr>
                          </Thead>

                          <Tbody>
                            <AnimatePresence initial={false}>
                              {filteredCasos.map((c) => (
                                <MotionTr
                                  key={c.id}
                                  layout
                                  initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                                  transition={makeSpring(reduceMotion)}
                                  style={{ display: "table-row" }}
                                  cursor="pointer"
                                  onClick={() => openDetalle(c)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      openDetalle(c);
                                    }
                                  }}
                                >
                                  <Td fontWeight="black">#{c.id}</Td>
                                  <Td whiteSpace="nowrap">{formatDateTime(c.fecha_creacion)}</Td>
                                  <Td>
                                    <EstadoPill estado={c.estado} />
                                  </Td>
                                  <Td>
                                    <PrioridadPill prioridad={c.prioridad} />
                                  </Td>
                                  <Td maxW="680px">
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

                                  {/* hover row feel */}
                                  <Td display="none" />
                                </MotionTr>
                              ))}
                            </AnimatePresence>
                          </Tbody>
                        </Table>
                      </TableContainer>

                      {/* row hover overlay (sutil) */}
                      <Box
                        pointerEvents="none"
                        position="absolute"
                        inset={0}
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                      />
                    </GlassCard>
                  )}
                </>
              )}
            </MotionBox>
          </MotionBox>
        </Container>

        {/* FILTERS DRAWER (mobile bottom) */}
        <Drawer isOpen={isFiltersOpen} placement="bottom" onClose={closeFilters}>
          <DrawerOverlay />
          <DrawerContent borderTopRadius="2xl">
            <DrawerCloseButton />
            <DrawerHeader>Filtros</DrawerHeader>
            <DrawerBody pb={6}>
              <Stack spacing={4}>
                <FormControl>
                  <FormLabel>Estado</FormLabel>
                  <Select value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
                    <option value="">Todos</option>
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {estadoMeta[e]?.label ?? e}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Prioridad</FormLabel>
                  <Select value={fPrioridad} onChange={(e) => setFPrioridad(e.target.value)}>
                    <option value="">Todas</option>
                    {PRIORIDADES.map((p) => (
                      <option key={p} value={p}>
                        {prioridadMeta[p]?.label ?? p}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Orden</FormLabel>
                  <Select value={orden} onChange={(e) => setOrden(e.target.value)}>
                    <option value="NUEVOS">Más nuevos</option>
                    <option value="ANTIGUOS">Más antiguos</option>
                  </Select>
                </FormControl>

                <HStack>
                  <Button flex="1" variant="outline" onClick={clearFilters}>
                    Limpiar
                  </Button>
                  <Button flex="1" colorScheme="yellow" color="black" onClick={closeFilters}>
                    Aplicar
                  </Button>
                </HStack>
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* CREATE MODAL (Glass + blur) */}
        <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} isCentered size={{ base: "full", md: "lg" }}>
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
          <ModalContent borderRadius={{ base: 0, md: "2xl" }} overflow="hidden">
            <ModalHeader>Nuevo caso de soporte</ModalHeader>
            <ModalCloseButton disabled={creating} />
            <ModalBody bg={bg} py={6}>
              <GlassCard rounded="2xl" p={5}>
                <Stack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Título</FormLabel>
                    <Input
                      value={formTitulo}
                      onChange={(e) => setFormTitulo(e.target.value)}
                      placeholder="Ej: Error en cotización #123 / Facturación / Acceso…"
                      rounded="2xl"
                      bg={softBg}
                      border="1px solid"
                      borderColor={borderColor}
                      focusBorderColor={ferreYellow}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Prioridad</FormLabel>
                    <Select
                      value={formPrioridad}
                      onChange={(e) => setFormPrioridad(e.target.value)}
                      rounded="2xl"
                      bg={useColorModeValue("white", "gray.900")}
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <option value="ALTA">Alta</option>
                      <option value="MEDIA">Media</option>
                      <option value="BAJA">Baja</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Descripción</FormLabel>
                    <Textarea
                      rows={6}
                      value={formDescripcion}
                      onChange={(e) => setFormDescripcion(e.target.value)}
                      placeholder="Qué pasó, qué esperabas y datos clave (ID cotización/pedido, NIT, etc.)."
                      rounded="2xl"
                      bg={softBg}
                      border="1px solid"
                      borderColor={borderColor}
                      focusBorderColor={ferreYellow}
                    />
                  </FormControl>

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
              <Button variant="ghost" onClick={handleCloseCreate} isDisabled={creating}>
                Cancelar
              </Button>
              <Button
                colorScheme="yellow"
                color="black"
                onClick={handleCreateCaso}
                isLoading={creating}
                loadingText="Creando…"
                rounded="full"
                px={7}
              >
                Crear caso
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* DETAIL / THREAD MODAL (Glass + composer pinned) */}
        <Modal isOpen={!!selected} onClose={closeDetalle} isCentered size={{ base: "full", md: "xl" }}>
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
          <ModalContent
            borderRadius={{ base: 0, md: "2xl" }}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            maxH={{ base: "100vh", md: "82vh" }}
          >
            <ModalHeader>
              <VStack align="start" spacing={1}>
                <Heading size="md" noOfLines={1}>
                  {selected ? `Caso #${selected.id}` : "Detalle"}
                </Heading>
                <Text fontSize="sm" color={muted} noOfLines={1}>
                  {selected?.titulo || "—"}
                </Text>

                {selected && (
                  <HStack spacing={2} flexWrap="wrap" pt={1}>
                    <EstadoPill estado={selected.estado} />
                    <PrioridadPill prioridad={selected.prioridad} />
                    <Tag size="sm" variant="subtle" borderRadius="full" colorScheme="gray">
                      <TagLeftIcon as={FiClock} />
                      <TagLabel>Creado: {formatDateTime(selected.fecha_creacion)}</TagLabel>
                    </Tag>
                  </HStack>
                )}
              </VStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody flex="1" overflowY="auto" bg={bg} py={5}>
              {selected && (
                <Stack spacing={5}>
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
                  <MotionBox variants={fadeIn(reduceMotion)} initial="hidden" animate="show">
                    <HStack justify="space-between" mb={3}>
                      <HStack spacing={2}>
                        <Icon as={FiMessageSquare} color="yellow.500" />
                        <Heading size="sm">Conversación</Heading>
                      </HStack>

                      <HStack spacing={2}>
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

                        <Tag size="sm" variant="subtle" borderRadius="full" colorScheme="gray">
                          <TagLabel>
                            {loadingComentarios
                              ? "Cargando…"
                              : comentarios.length === 1
                              ? "1 mensaje"
                              : `${comentarios.length} mensajes`}
                          </TagLabel>
                        </Tag>
                      </HStack>
                    </HStack>

                    <GlassCard rounded="3xl" p={4}>
                      {loadingComentarios ? (
                        <VStack align="stretch" spacing={2}>
                          <Skeleton h="16px" rounded="md" />
                          <SkeletonText noOfLines={3} spacing="2" />
                        </VStack>
                      ) : comentarios.length === 0 ? (
                        <VStack py={8} spacing={2} color={muted}>
                          <Box
                            boxSize="44px"
                            rounded="full"
                            bg={useColorModeValue("gray.50", "blackAlpha.500")}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <FiMessageSquare />
                          </Box>
                          <Text fontWeight="black" fontSize="sm">
                            Aún no hay mensajes
                          </Text>
                          <Text fontSize="xs" textAlign="center">
                            El equipo responderá aquí. Si tienes IDs (cotización/pedido), compártelos para acelerar.
                          </Text>
                        </VStack>
                      ) : (
                        <VStack align="stretch" spacing={3}>
                          {comentarios.map((com) => {
                            const isAdmin = com.role === "ADMIN";
                            const bubbleBg = useColorModeValue(
                              isAdmin ? "whiteAlpha.800" : "yellow.50",
                              isAdmin ? "blackAlpha.500" : "rgba(236, 201, 75, 0.12)"
                            );

                            return (
                              <Flex key={com.id} justify={isAdmin ? "flex-start" : "flex-end"}>
                                <Box
                                  maxW="92%"
                                  bg={bubbleBg}
                                  border="1px solid"
                                  borderColor={borderColor}
                                  borderRadius="2xl"
                                  p={3}
                                >
                                  <HStack justify="space-between" mb={1} spacing={3} flexWrap="wrap">
                                    <Badge
                                      colorScheme={isAdmin ? "purple" : "yellow"}
                                      rounded="full"
                                      variant="subtle"
                                    >
                                      {isAdmin ? "Equipo FerreExpress" : com.username || "Tu empresa"}
                                    </Badge>
                                    <Text fontSize="xs" color={muted}>
                                      {formatDateTime(com.fecha_creacion)}
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" whiteSpace="pre-wrap">
                                    {com.mensaje}
                                  </Text>
                                </Box>
                              </Flex>
                            );
                          })}
                          <div ref={bottomRef} />
                        </VStack>
                      )}
                    </GlassCard>
                  </MotionBox>
                </Stack>
              )}
            </ModalBody>

            {/* Composer pinned */}
            <ModalFooter bg={useColorModeValue("whiteAlpha.900", "blackAlpha.400")} backdropFilter="blur(14px)">
              <Box w="full">
                <FormControl>
                  <Textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    onKeyDown={onComentarioKeyDown}
                    placeholder="Escribe un mensaje… (Ctrl + Enter para enviar)"
                    rows={isMobile ? 3 : 2}
                    rounded="2xl"
                    bg={useColorModeValue("white", "gray.900")}
                    border="1px solid"
                    borderColor={borderColor}
                    focusBorderColor={ferreYellow}
                  />
                </FormControl>

                <HStack mt={3}>
                  <motion.div {...pressable(reduceMotion)} style={{ width: "100%" }}>
                    <Button variant="outline" rounded="full" onClick={closeDetalle} w="full">
                      Cerrar
                    </Button>
                  </motion.div>
                  <motion.div {...pressable(reduceMotion)} style={{ width: "100%" }}>
                    <Button
                      colorScheme="yellow"
                      color="black"
                      rounded="full"
                      onClick={handleAddComentario}
                      isLoading={sendingComentario}
                      isDisabled={!nuevoComentario.trim()}
                      leftIcon={<FiMessageSquare />}
                      w="full"
                    >
                      Enviar
                    </Button>
                  </motion.div>
                </HStack>
              </Box>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </MotionConfig>
    </Box>
  );
}
