// src/pages/cliente/MisCasos.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  HStack,
  VStack,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tag,
  TagLabel,
  TagLeftIcon,
  Tooltip,
  Divider,
  Skeleton,
  SkeletonText,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  SimpleGrid,
  Stack,
  InputGroup,
  InputLeftElement,
  useBreakpointValue,
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
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

/* ==== helpers ==== */

const ESTADOS = ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO", "CANCELADO"];
const PRIORIDADES = ["ALTA", "MEDIA", "BAJA"];

const estadoMeta = {
  ABIERTO: { label: "Abierto", color: "blue", icon: FiAlertCircle },
  EN_PROGRESO: { label: "En progreso", color: "orange", icon: FiClock },
  RESUELTO: { label: "Resuelto", color: "green", icon: FiCheckCircle },
  CERRADO: { label: "Cerrado", color: "gray", icon: FiXCircle },
  CANCELADO: { label: "Cancelado", color: "red", icon: FiXCircle },
};

const prioridadMeta = {
  ALTA: { label: "Alta", color: "red" },
  MEDIA: { label: "Media", color: "yellow" },
  BAJA: { label: "Baja", color: "green" },
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const norm = (s) => (s || "").toString().toLowerCase();

const MotionBox = motion(Box);

/* ==== componente principal ==== */

export default function MisCasos() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.300");
  const title = useColorModeValue("gray.900", "gray.100");
  const shadowSm = useColorModeValue(
    "0 6px 18px rgba(31,38,135,0.10)",
    "0 6px 18px rgba(0,0,0,0.35)"
  );
  const comentarioBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const isMobile = useBreakpointValue({ base: true, md: false });
  const stickyOffset = useBreakpointValue({ base: "64px", md: "72px" });

  const focusRing = {
    boxShadow: "0 0 0 3px rgba(249,191,32,0.7)",
  };

  // datos principales
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // para abrir automáticamente desde ?casoId=
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

  const fetchCasos = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/casos");
      setCasos(Array.isArray(data) ? data : []);
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
  };

  useEffect(() => {
    fetchCasos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ==== filtros en memoria ==== */

  const filteredCasos = useMemo(() => {
    const q = norm(search);

    return casos.filter((c) => {
      if (fEstado && c.estado !== fEstado) return false;
      if (fPrioridad && c.prioridad !== fPrioridad) return false;

      if (q) {
        const partes = [
          c.id && String(c.id),
          c.titulo,
          c.descripcion,
          c.prioridad,
          c.estado,
        ];
        const match = partes.some((p) => norm(p).includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [casos, fEstado, fPrioridad, search]);

  const hasFilters = useMemo(
    () => Boolean(fEstado || fPrioridad || search.trim()),
    [fEstado, fPrioridad, search]
  );

  /* ==== stats pequeños ==== */

  const stats = useMemo(() => {
    const total = filteredCasos.length;
    const abiertos = filteredCasos.filter((c) => c.estado === "ABIERTO")
      .length;
    const enProgreso = filteredCasos.filter(
      (c) => c.estado === "EN_PROGRESO"
    ).length;
    const resueltos = filteredCasos.filter(
      (c) => c.estado === "RESUELTO"
    ).length;

    return { total, abiertos, enProgreso, resueltos };
  }, [filteredCasos]);

  /* ==== meta de última respuesta (si el backend la expone) ==== */

  const getRespuestaMeta = (caso) => {
    const rawRol =
      (caso && (caso.ultima_respuesta_rol || caso.ultima_respuesta_role)) ||
      "";
    const rol = rawRol.toUpperCase();
    const tieneDatos = Boolean(rawRol);

    if (rol === "ADMIN") {
      return {
        label: "Equipo respondió",
        colorScheme: "purple",
      };
    }
    if (rol === "CLIENTE") {
      return {
        label: "Esperando respuesta",
        colorScheme: "gray",
      };
    }
    if (!tieneDatos) {
      return {
        label: "Sin respuestas aún",
        colorScheme: "gray",
      };
    }
    return {
      label: "Actualizado",
      colorScheme: "blue",
    };
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
      const { data } = await api.post(`/casos/${selected.id}/comentarios`, {
        mensaje: msg,
      });
      setComentarios((prev) => [...prev, data]);
      setNuevoComentario("");
      toast({
        status: "success",
        title: "Comentario enviado",
        duration: 2000,
      });
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
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
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

      // insertar arriba
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
        description:
          "Tu caso fue creado correctamente. Podrás seguir aquí las respuestas.",
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

  /* ==== animaciones suaves ==== */

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  /* ==== copia de título de caso (modal) ==== */

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

  /* ==== render principal ==== */

  return (
    <Box bg={pageBg} minH="100vh" py={{ base: 4, md: 6 }} pb={10}>
      <Box px={{ base: 3, md: 6, lg: 8 }}>
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="show"
          maxW="960px"
          mx="auto"
        >
          {/* =================== CARD DE CONTEXTO / BREADCRUMB / KPIs =================== */}
          <MotionBox
            variants={itemVariants}
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            borderRadius="2xl"
            boxShadow={shadowSm}
            p={{ base: 4, md: 5 }}
            mb={4}
            role="region"
            aria-labelledby="mis-casos-header"
          >
            <Stack spacing={4}>
              {/* Breadcrumb suave: Mi cuenta > Soporte y casos */}
              <HStack spacing={1} fontSize="xs" color={muted}>
                <Text>Estás en</Text>
                <Tag size="sm" variant="subtle" colorScheme="yellow">
                  <TagLabel>Mi cuenta</TagLabel>
                </Tag>
                <FiChevronRight size={12} />
                <Tag size="sm" variant="outline" colorScheme="yellow">
                  <TagLabel>Soporte y casos</TagLabel>
                </Tag>
              </HStack>

              {/* Título + acciones principales */}
              <HStack
                justify="space-between"
                align="flex-start"
                flexWrap="wrap"
                spacing={4}
              >
                <HStack spacing={3} align="center">
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg={useColorModeValue("yellow.100", "yellow.900")}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiLifeBuoy size={20} color="#F5A623" />
                  </Box>
                  <VStack align="flex-start" spacing={0}>
                    <Heading id="mis-casos-header" size="lg" color={title}>
                      Soporte y casos
                    </Heading>
                    <Text fontSize="sm" color={muted}>
                      Crea solicitudes, consulta su estado y revisa el hilo de
                      conversación con el equipo de FerreExpress.
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={2}>
                  <Tooltip label="Recargar lista de casos">
                    <IconButton
                      aria-label="Recargar casos"
                      icon={<FiRefreshCw />}
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchCasos()}
                      _focus={focusRing}
                    />
                  </Tooltip>
                  {!isMobile && (
                    <Button
                      size="sm"
                      leftIcon={<FiPlus />}
                      colorScheme="yellow"
                      color="black"
                      onClick={handleOpenCreate}
                      _focus={focusRing}
                    >
                      Nuevo caso
                    </Button>
                  )}
                </HStack>
              </HStack>

              {/* Atajos rápidos para contexto */}
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={<FiHelpCircle />}
                  onClick={() => navigate("/cliente/ayuda")}
                  _focus={focusRing}
                >
                  Ir al Centro de ayuda
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={<FiTruck />}
                  onClick={() => navigate("/cliente/pedidos")}
                  _focus={focusRing}
                >
                  Ver mis pedidos
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<FiUser />}
                  onClick={() => navigate("/cliente/perfil")}
                  _focus={focusRing}
                >
                  Ir a mi perfil
                </Button>
              </HStack>

              <Divider />

              {/* Resumen rápido (KPIs) */}
              <Box>
                <Text fontSize="xs" mb={2} color={muted}>
                  Resumen de tus casos en la vista actual
                </Text>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  <Tooltip label="Incluye solo casos visibles con los filtros actuales">
                    <Box>
                      <Kpi
                        label="Casos (vista actual)"
                        value={stats.total}
                        icon={FiLifeBuoy}
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip label="Casos con estado Abierto">
                    <Box>
                      <Kpi
                        label="Abiertos"
                        value={stats.abiertos}
                        icon={FiAlertCircle}
                        colorScheme="blue"
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip label="Casos que estamos gestionando actualmente">
                    <Box>
                      <Kpi
                        label="En progreso"
                        value={stats.enProgreso}
                        icon={FiClock}
                        colorScheme="orange"
                      />
                    </Box>
                  </Tooltip>
                  <Tooltip label="Casos marcados como resueltos">
                    <Box>
                      <Kpi
                        label="Resueltos"
                        value={stats.resueltos}
                        icon={FiCheckCircle}
                        colorScheme="green"
                      />
                    </Box>
                  </Tooltip>
                </SimpleGrid>
              </Box>
            </Stack>
          </MotionBox>

          {/* =================== CARD DE LISTADO / FILTROS (con sticky) =================== */}
          <MotionBox
            variants={itemVariants}
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            borderRadius="2xl"
            boxShadow={shadowSm}
            p={4}
            role="region"
            aria-labelledby="mis-casos-listado"
          >
            <Box position="relative">
              {/* Header + filtros sticky */}
              <Box
                position="sticky"
                top={stickyOffset}
                bg={cardBg}
                zIndex="10"
                pt={3}
                pb={3}
                borderBottom="1px solid"
                borderColor={border}
                backdropFilter="blur(8px)"
              >
                {/* Encabezado de listado */}
                <HStack
                  justify="space-between"
                  align="center"
                  mb={3}
                  flexWrap="wrap"
                >
                  <Heading id="mis-casos-listado" size="sm">
                    Tus casos de soporte
                  </Heading>
                  <HStack spacing={2}>
                    <Badge
                      colorScheme="yellow"
                      variant="subtle"
                      aria-live="polite"
                    >
                      {filteredCasos.length} CASO
                      {filteredCasos.length === 1 ? "" : "S"}
                    </Badge>
                    {hasFilters && (
                      <Tag size="sm" variant="subtle" colorScheme="blue">
                        <TagLabel>Filtros activos</TagLabel>
                      </Tag>
                    )}
                  </HStack>
                </HStack>

                {/* Filtros */}
                <Stack
                  direction={{ base: "column", md: "row" }}
                  spacing={3}
                  align="stretch"
                >
                  <Box flex="1">
                    <Text fontSize="xs" mb={1} color={muted}>
                      Buscar
                    </Text>
                    <InputGroup size="sm">
                      <InputLeftElement pointerEvents="none">
                        <FiSearch size={14} />
                      </InputLeftElement>
                      <Input
                        placeholder="Buscar por título, descripción o ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </InputGroup>
                  </Box>

                  <HStack spacing={3} align="flex-end">
                    <Box minW="150px">
                      <Text fontSize="xs" mb={1} color={muted}>
                        Estado
                      </Text>
                      <Select
                        size="sm"
                        value={fEstado}
                        onChange={(e) => setFEstado(e.target.value)}
                      >
                        <option value="">Todos</option>
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {estadoMeta[e]?.label ?? e}
                          </option>
                        ))}
                      </Select>
                    </Box>
                    <Box minW="150px">
                      <Text fontSize="xs" mb={1} color={muted}>
                        Prioridad
                      </Text>
                      <Select
                        size="sm"
                        value={fPrioridad}
                        onChange={(e) => setFPrioridad(e.target.value)}
                      >
                        <option value="">Todas</option>
                        {PRIORIDADES.map((p) => (
                          <option key={p} value={p}>
                            {prioridadMeta[p]?.label ?? p}
                          </option>
                        ))}
                      </Select>
                    </Box>
                    {hasFilters && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FiX />}
                        onClick={limpiarFiltros}
                        _focus={focusRing}
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </HStack>
                </Stack>
              </Box>

              {/* Listado debajo del header sticky */}
              <Box pt={4}>
                {loading ? (
                  isMobile ? (
                    <VStack align="stretch" spacing={3}>
                      {[1, 2, 3].map((i) => (
                        <Box
                          key={i}
                          p={3}
                          borderRadius="lg"
                          border="1px solid"
                          borderColor={border}
                        >
                          <Skeleton height="18px" mb={2} />
                          <SkeletonText noOfLines={2} spacing="2" />
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Table size="sm">
                      <Thead>
                        <Tr role="row">
                          <Th>Fecha</Th>
                          <Th>Estado</Th>
                          <Th>Prioridad</Th>
                          <Th>Atención</Th>
                          <Th>Título</Th>
                          <Th>Acciones</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {[1, 2, 3].map((i) => (
                          <Tr key={i} role="row">
                            <Td role="cell">
                              <Skeleton height="16px" />
                            </Td>
                            <Td role="cell">
                              <Skeleton height="16px" />
                            </Td>
                            <Td role="cell">
                              <Skeleton height="16px" />
                            </Td>
                            <Td role="cell">
                              <Skeleton height="16px" />
                            </Td>
                            <Td role="cell">
                              <SkeletonText noOfLines={1} spacing="2" />
                            </Td>
                            <Td role="cell">
                              <Skeleton height="16px" />
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )
                ) : filteredCasos.length === 0 ? (
                  <VStack py={6} spacing={2}>
                    <FiInfo />
                    <Text fontSize="sm" color={muted} textAlign="center">
                      {hasFilters
                        ? "No hay casos que coincidan con los filtros aplicados."
                        : "Aún no tienes casos de soporte creados."}
                    </Text>
                    {hasFilters && (
                      <Button
                        size="sm"
                        variant="link"
                        onClick={limpiarFiltros}
                      >
                        Limpiar filtros y ver todos los casos
                      </Button>
                    )}
                    {!hasFilters && (
                      <Button
                        size="sm"
                        leftIcon={<FiPlus />}
                        colorScheme="yellow"
                        color="black"
                        onClick={handleOpenCreate}
                        _focus={focusRing}
                      >
                        Crear primer caso
                      </Button>
                    )}
                  </VStack>
                ) : isMobile ? (
                  // ✅ Cards en mobile
                  <VStack align="stretch" spacing={3}>
                    {filteredCasos.map((c) => (
                      <CasoCard
                        key={c.id}
                        caso={c}
                        border={border}
                        muted={muted}
                        comentarioBg={comentarioBg}
                        onOpen={openDetalle}
                        getRespuestaMeta={getRespuestaMeta}
                      />
                    ))}
                  </VStack>
                ) : (
                  // ✅ Tabla solo en desktop
                  <Table size="sm">
                    <Thead>
                      <Tr role="row">
                        <Th>Fecha</Th>
                        <Th>Estado</Th>
                        <Th>Prioridad</Th>
                        <Th>Atención</Th>
                        <Th>Título</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredCasos.map((c) => {
                        const respuestaMeta = getRespuestaMeta(c);
                        const tieneSinLeer = Boolean(c.tiene_sin_leer);
                        return (
                          <Tr key={c.id} _hover={{ bg: "blackAlpha.50" }} role="row">
                            <Td role="cell">{formatDateTime(c.fecha_creacion)}</Td>
                            <Td role="cell">
                              <EstadoPill estado={c.estado} />
                            </Td>
                            <Td role="cell">
                              <PrioridadPill prioridad={c.prioridad} />
                            </Td>
                            <Td role="cell">
                              <Badge
                                colorScheme={respuestaMeta.colorScheme}
                                variant={
                                  respuestaMeta.colorScheme === "purple"
                                    ? "solid"
                                    : "subtle"
                                }
                                fontSize="2xs"
                              >
                                {respuestaMeta.label}
                              </Badge>
                            </Td>
                            <Td role="cell" maxW="320px">
                              <Text noOfLines={2}>{c.titulo}</Text>
                            </Td>
                            <Td role="cell">
                              <HStack spacing={2}>
                                <Tooltip label="Ver hilo de soporte">
                                  <IconButton
                                    size="xs"
                                    aria-label="Ver hilo de soporte"
                                    icon={<FiMessageSquare />}
                                    onClick={() => openDetalle(c)}
                                    variant={tieneSinLeer ? "solid" : "outline"}
                                    colorScheme={tieneSinLeer ? "red" : "gray"}
                                    _focus={focusRing}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </Box>
          </MotionBox>
        </MotionBox>
      </Box>

      {/* ✅ FAB para nuevo caso en mobile */}
      {isMobile && (
        <Button
          position="fixed"
          bottom="20px"
          right="20px"
          borderRadius="full"
          colorScheme="yellow"
          color="black"
          size="lg"
          boxShadow="lg"
          onClick={handleOpenCreate}
          leftIcon={<FiPlus />}
          _focus={focusRing}
        >
          Nuevo caso
        </Button>
      )}

      {/* Modal crear caso */}
      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} isCentered trapFocus>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nuevo caso de soporte</ModalHeader>
          <ModalCloseButton disabled={creating} />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Título del caso
                </Text>
                <Input
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ej: Problema con mi pedido, error en la factura..."
                  isInvalid={!formTitulo.trim() && formTitulo !== ""}
                  errorBorderColor="red.300"
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Prioridad
                </Text>
                <Select
                  value={formPrioridad}
                  onChange={(e) => setFormPrioridad(e.target.value)}
                >
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>
                  Describe lo que sucede
                </Text>
                <Textarea
                  rows={4}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Cuéntanos qué pasó, qué esperabas que ocurriera y cualquier dato que creas importante (número de pedido, fecha, etc.)."
                  isInvalid={!formDescripcion.trim() && formDescripcion !== ""}
                  errorBorderColor="red.300"
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseCreate}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              color="black"
              onClick={handleCreateCaso}
              isLoading={creating}
            >
              Crear caso
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal detalle/hilo */}
      <Modal
        isOpen={!!selected}
        onClose={closeDetalle}
        size="xl"
        isCentered
        trapFocus
      >
        <ModalOverlay />
        <ModalContent maxH="80vh" display="flex">
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
          <ModalBody overflowY="auto">
            {selected && (
              <VStack align="stretch" spacing={3}>
                {/* meta */}
                <Box>
                  <Text fontSize="xs" color={muted} mb={1}>
                    Datos del caso
                  </Text>
                  <HStack spacing={3} flexWrap="wrap">
                    <EstadoPill estado={selected.estado} />
                    <PrioridadPill prioridad={selected.prioridad} />
                    <Tag size="sm" variant="subtle">
                      <TagLabel>
                        Creado: {formatDateTime(selected.fecha_creacion)}
                      </TagLabel>
                    </Tag>
                  </HStack>
                </Box>

                <Box>
                  <Text fontSize="xs" color={muted} mb={1}>
                    Descripción
                  </Text>
                  <Box
                    border="1px solid"
                    borderColor={border}
                    borderRadius="md"
                    p={2}
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {selected.descripcion || "—"}
                  </Box>
                </Box>

                {/* Hilo de comentarios */}
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color={muted}>
                      Hilo de conversación
                    </Text>
                    <Text fontSize="xs" color={muted}>
                      {loadingComentarios
                        ? "Cargando..."
                        : comentarios.length === 1
                        ? "1 mensaje"
                        : `${comentarios.length} mensajes`}
                    </Text>
                  </HStack>
                  <Box
                    id="comentarios-container"
                    border="1px solid"
                    borderColor={border}
                    borderRadius="md"
                    p={2}
                    maxH="220px"
                    overflowY="auto"
                    bg={useColorModeValue("white", "whiteAlpha.50")}
                  >
                    {loadingComentarios ? (
                      <VStack align="stretch" spacing={2}>
                        <Skeleton height="18px" />
                        <SkeletonText noOfLines={2} spacing="2" />
                      </VStack>
                    ) : comentarios.length === 0 ? (
                      <Text fontSize="xs" color={muted}>
                        Aún no hay mensajes en este caso. El equipo te
                        responderá aquí cuando revise tu solicitud.
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {comentarios.map((com) => {
                          const esAdmin = com.role === "ADMIN";
                          const nombre = esAdmin
                            ? "Equipo FerreExpress"
                            : com.username || "Tú";
                          return (
                            <HStack
                              key={com.id}
                              align="flex-start"
                              spacing={3}
                              borderRadius="md"
                              bg={comentarioBg}
                              p={2}
                            >
                              <Avatar
                                size="sm"
                                name={nombre}
                                bg={esAdmin ? "purple.500" : "blue.500"}
                                color="white"
                              />
                              <Box flex="1">
                                <HStack
                                  justify="space-between"
                                  align="center"
                                  mb={1}
                                  spacing={2}
                                >
                                  <Text
                                    fontWeight="semibold"
                                    fontSize="sm"
                                  >
                                    {nombre}
                                  </Text>
                                  <Text fontSize="xs" color={muted}>
                                    {formatDateTime(com.fecha_creacion)}
                                  </Text>
                                </HStack>
                                <Text
                                  fontSize="sm"
                                  whiteSpace="pre-wrap"
                                >
                                  {com.mensaje}
                                </Text>
                              </Box>
                            </HStack>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                </Box>

                {/* Nuevo comentario */}
                <Box>
                  <Text fontSize="xs" color={muted} mb={1}>
                    Escribe un nuevo mensaje
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    <Textarea
                      rows={3}
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder="Escribe una actualización, pregunta o respuesta para el equipo de soporte."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComentario();
                        }
                      }}
                    />
                    <HStack justify="flex-end" spacing={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNuevoComentario("")}
                        isDisabled={
                          !nuevoComentario.trim() || sendingComentario
                        }
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
                      >
                        Enviar mensaje
                      </Button>
                    </HStack>
                    <Text fontSize="xs" color={muted}>
                      Consejo: puedes presionar <b>Enter</b> para enviar y{" "}
                      <b>Shift + Enter</b> para saltar de línea.
                    </Text>
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={closeDetalle}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

/* ==== subcomponentes UI ==== */

function Kpi({ label, value, icon: IconCmp, colorScheme = "gray" }) {
  const bg = useColorModeValue("white", "whiteAlpha.100");
  const borderCo = useColorModeValue("gray.200", "whiteAlpha.300");
  return (
    <HStack
      spacing={3}
      px={3}
      py={2}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderCo}
      bg={bg}
      minW="0"
    >
      <Tag colorScheme={colorScheme} borderRadius="full">
        {IconCmp && <TagLeftIcon as={IconCmp} />}
        <TagLabel>{value}</TagLabel>
      </Tag>
      <VStack align="start" spacing={0}>
        <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>
          {label}
        </Text>
      </VStack>
    </HStack>
  );
}

function EstadoPill({ estado }) {
  const meta = estadoMeta[estado] || {
    label: estado || "—",
    color: "gray",
    icon: FiInfo,
  };
  return (
    <Tag size="sm" colorScheme={meta.color} borderRadius="full">
      <TagLeftIcon as={meta.icon} />
      <TagLabel>{meta.label}</TagLabel>
    </Tag>
  );
}

function PrioridadPill({ prioridad }) {
  const meta = prioridadMeta[prioridad] || {
    label: prioridad || "—",
    color: "gray",
  };

  const icon =
    prioridad === "ALTA"
      ? FiZap
      : prioridad === "MEDIA"
      ? FiAlertCircle
      : FiClock;

  return (
    <Tag size="sm" colorScheme={meta.color} borderRadius="full">
      <TagLeftIcon as={icon} />
      <TagLabel>{meta.label}</TagLabel>
    </Tag>
  );
}

/* ==== Card de caso para mobile ==== */

function CasoCard({ caso, border, muted, comentarioBg, onOpen, getRespuestaMeta }) {
  const respuestaMeta = getRespuestaMeta(caso);
  const tieneSinLeer = Boolean(caso.tiene_sin_leer);

  return (
    <Box
      border="1px solid"
      borderColor={border}
      borderRadius="lg"
      p={3}
      bg={comentarioBg}
    >
      <HStack justify="space-between" align="flex-start" mb={1}>
        <HStack spacing={2}>
          <EstadoPill estado={caso.estado} />
          <PrioridadPill prioridad={caso.prioridad} />
        </HStack>
        <Badge
          colorScheme={respuestaMeta.colorScheme}
          variant={
            respuestaMeta.colorScheme === "purple" ? "solid" : "subtle"
          }
          fontSize="2xs"
        >
          {respuestaMeta.label}
        </Badge>
      </HStack>

      <Text fontSize="sm" fontWeight="semibold" noOfLines={2} mb={1}>
        {caso.titulo}
      </Text>
      <Text fontSize="xs" color={muted} mb={2}>
        Creado: {formatDateTime(caso.fecha_creacion)}
      </Text>

      <HStack justify="space-between" align="center">
        <Text fontSize="xs" color={muted}>
          ID: #{caso.id}
        </Text>
        <Button
          size="xs"
          rightIcon={<FiMessageSquare />}
          onClick={() => onOpen(caso)}
          variant={tieneSinLeer ? "solid" : "outline"}
          colorScheme={tieneSinLeer ? "red" : "gray"}
        >
          Ver hilo
        </Button>
      </HStack>
    </Box>
  );
}
