// src/pages/admin/Casos.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useToast,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  TagLeftIcon,
  Select,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  Code,
  Progress,
  usePrefersReducedMotion,
  Textarea,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiLifeBuoy,
  FiChevronRight,
  FiClock,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/axiosInstance";

/* ====== helpers ====== */

const MotionBox = motion(Box);

const ESTADOS = ["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO", "CANCELADO"];
const PRIORIDADES = ["ALTA", "MEDIA", "BAJA"];

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

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

/* ====== componente principal ====== */

export default function Casos() {
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();

  const pageBg = useColorModeValue(
    "linear-gradient(135deg,#f7f7fb 0%,#eef3ff 100%)",
    "linear-gradient(135deg,#0b0f1a 0%,#121826 100%)"
  );
  const subtle = useColorModeValue("gray.600", "gray.300");
  const borderColorSoft = useColorModeValue("gray.200", "whiteAlpha.300");
  const comentarioBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros locales
  const [fEstado, setFEstado] = useState("");
  const [fPrioridad, setFPrioridad] = useState("");
  const [search, setSearch] = useState("");

  // detalle
  const [selected, setSelected] = useState(null);
  const [changingEstado, setChangingEstado] = useState(false);

  // 💬 comentarios
  const [comentarios, setComentarios] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [sendingComentario, setSendingComentario] = useState(false);

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
        description: "Revisa la consola para más detalles.",
        isClosable: true,
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // aplicar filtros/búsqueda en cliente
  const filteredCasos = useMemo(() => {
    const q = search.trim().toLowerCase();
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
          c.usuario_id && String(c.usuario_id),
        ];
        const match = partes.some((p) =>
          (p || "").toString().toLowerCase().includes(q)
        );
        if (!match) return false;
      }

      return true;
    });
  }, [casos, fEstado, fPrioridad, search]);

  // stats rápidos (sobre vista filtrada)
  const stats = useMemo(() => {
    const total = filteredCasos.length;
    const countByEstado = {};
    ESTADOS.forEach((e) => {
      countByEstado[e] = 0;
    });
    filteredCasos.forEach((c) => {
      const key = c.estado || "ABIERTO";
      if (!countByEstado[key]) countByEstado[key] = 0;
      countByEstado[key] += 1;
    });

    // el back ya ordena por fecha_creacion DESC, así que el primero es el más reciente
    const last = casos[0] || null;

    return {
      total,
      abiertos: countByEstado.ABIERTO || 0,
      enProgreso: countByEstado.EN_PROGRESO || 0,
      resueltos: countByEstado.RESUELTO || 0,
      cerrados:
        (countByEstado.CERRADO || 0) + (countByEstado.CANCELADO || 0),
      last,
    };
  }, [filteredCasos, casos]);

  const handleRefresh = () => {
    fetchCasos();
  };

  const handleResetFilters = () => {
    setFEstado("");
    setFPrioridad("");
    setSearch("");
  };

  const handleChangeEstado = async (id, nuevoEstado) => {
    if (!nuevoEstado) return;
    const casoActual = casos.find((c) => c.id === id);
    if (!casoActual || casoActual.estado === nuevoEstado) return;

    try {
      setChangingEstado(true);
      await api.put(`/casos/${id}/estado`, { nuevoEstado });

      setCasos((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                estado: nuevoEstado,
              }
            : c
        )
      );
      setSelected((prev) =>
        prev && prev.id === id ? { ...prev, estado: nuevoEstado } : prev
      );

      toast({
        status: "success",
        title: "Estado actualizado",
        description: `Caso #${id} ahora está en estado ${nuevoEstado}`,
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al actualizar estado",
        description: "Revisa la consola para más detalles.",
        isClosable: true,
      });
    } finally {
      setChangingEstado(false);
    }
  };

  // 💬 cargar comentarios al abrir detalle
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
        description: "No fue posible obtener el historial de comentarios.",
        isClosable: true,
      });
    } finally {
      setLoadingComentarios(false);
    }
  };

  const handleOpenDetalle = (caso) => {
    setSelected(caso);
    setComentarios([]);
    setNuevoComentario("");
    fetchComentarios(caso.id);
  };

  const handleCloseDetalle = () => {
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
      const { data } = await api.post(
        `/casos/${selected.id}/comentarios`,
        { mensaje: msg }
      );

      setComentarios((prev) => [...prev, data]);
      setNuevoComentario("");

      toast({
        status: "success",
        title: "Comentario agregado",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al agregar comentario",
        description: "Intenta de nuevo más tarde.",
        isClosable: true,
      });
    } finally {
      setSendingComentario(false);
    }
  };

  return (
    <Box bgGradient={pageBg} minH="100%" pb={4}>
      {/* barra de carga superior */}
      <AnimatePresence>
        {loading && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Progress size="xs" isIndeterminate borderRadius="0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Resumen de Casos ===== */}
      <SectionCard
        title="Centro de ayuda · Casos"
        subtitle="Visualiza los casos abiertos por los clientes y actualiza su estado."
        right={
          <HStack spacing={2}>
            <Tooltip label="Refrescar">
              <IconButton
                aria-label="Refrescar casos"
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={handleRefresh}
              />
            </Tooltip>
          </HStack>
        }
      >
        <HStack spacing={4} wrap="wrap">
          <KpiCard
            label="Casos (vista actual)"
            value={stats.total}
            icon={FiLifeBuoy}
            colorScheme="purple"
          />
          <KpiCard
            label="Abiertos"
            value={stats.abiertos}
            icon={FiAlertCircle}
            colorScheme="blue"
          />
          <KpiCard
            label="En progreso"
            value={stats.enProgreso}
            icon={FiClock}
            colorScheme="orange"
          />
          <KpiCard
            label="Resueltos"
            value={stats.resueltos}
            icon={FiCheckCircle}
            colorScheme="green"
          />
          <KpiCard
            label="Cerrados/Cancelados"
            value={stats.cerrados}
            icon={FiXCircle}
            colorScheme="gray"
          />

          {stats.last && (
            <HStack
              spacing={3}
              px={4}
              py={2}
              borderRadius="lg"
              border="1px solid"
              borderColor={useColorModeValue(
                "gray.200",
                "whiteAlpha.300"
              )}
              bg={useColorModeValue("white", "whiteAlpha.50")}
            >
              <FiClock />
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color={subtle}>
                  Último caso creado
                </Text>
                <Text fontSize="sm" noOfLines={1}>
                  #{stats.last.id} · {stats.last.titulo}
                </Text>
                <Text fontSize="xs" color={subtle}>
                  {formatDateTime(stats.last.fecha_creacion)}
                </Text>
              </VStack>
            </HStack>
          )}
        </HStack>
      </SectionCard>

      {/* ===== Listado con filtros ===== */}
      <SectionCard
        title="Listado de casos"
        subtitle="Filtra por estado, prioridad o busca por título, descripción o ID."
        right={
          <HStack spacing={3} wrap="wrap">
            <InputGroup maxW="260px">
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Buscar (ID, título, descripción...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar casos"
              />
            </InputGroup>

            <Select
              placeholder="Estado"
              value={fEstado}
              onChange={(e) => setFEstado(e.target.value)}
              maxW="180px"
              size="sm"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {estadoMeta[e]?.label ?? e}
                </option>
              ))}
            </Select>

            <Select
              placeholder="Prioridad"
              value={fPrioridad}
              onChange={(e) => setFPrioridad(e.target.value)}
              maxW="180px"
              size="sm"
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {prioridadMeta[p]?.label ?? p}
                </option>
              ))}
            </Select>

            <Button
              size="sm"
              leftIcon={<FiFilter />}
              onClick={() => {}}
            >
              Filtrar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetFilters}
            >
              Limpiar
            </Button>
          </HStack>
        }
      >
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead
              position="sticky"
              top={0}
              zIndex={1}
              bg={useColorModeValue(
                "rgba(249,250,251,0.95)",
                "blackAlpha.500"
              )}
              backdropFilter="blur(6px)"
            >
              <Tr>
                <Th>Fecha</Th>
                <Th>Estado</Th>
                <Th>Prioridad</Th>
                <Th>Título</Th>
                <Th>Usuario ID</Th>
                <Th isNumeric>Detalle</Th>
              </Tr>
            </Thead>
            <Tbody>
              <AnimatePresence initial={false}>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Tr key={`sk-${i}`}>
                        <Td colSpan={6}>
                          <Progress size="xs" isIndeterminate />
                        </Td>
                      </Tr>
                    ))
                  : filteredCasos.map((c) => (
                      <motion.tr
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleOpenDetalle(c)}
                      >
                        <Td>{formatDateTime(c.fecha_creacion)}</Td>
                        <Td>
                          <EstadoTag estado={c.estado} />
                        </Td>
                        <Td>
                          <PrioridadTag prioridad={c.prioridad} />
                        </Td>
                        <Td maxW="320px">
                          <Text noOfLines={2}>{c.titulo}</Text>
                        </Td>
                        <Td>{c.usuario_id ?? "—"}</Td>
                        <Td isNumeric>
                          <Tooltip label="Ver detalle">
                            <IconButton
                              aria-label="Ver detalle del caso"
                              icon={<FiChevronRight />}
                              size="xs"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetalle(c);
                              }}
                            />
                          </Tooltip>
                        </Td>
                      </motion.tr>
                    ))}
              </AnimatePresence>
            </Tbody>
          </Table>
        </Box>

        {!loading && filteredCasos.length === 0 && (
          <EmptyState
            title="Sin casos"
            description="No se encontraron casos para los filtros seleccionados."
          />
        )}
      </SectionCard>

      {/* ===== Drawer detalle ===== */}
      <Drawer
        isOpen={!!selected}
        placement="right"
        size="md"
        onClose={handleCloseDetalle}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {selected
              ? `Caso #${selected.id} · ${selected.titulo}`
              : "Detalle de caso"}
          </DrawerHeader>
          <DrawerBody>
            {selected && (
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    ID de caso
                  </Text>
                  <Code>#{selected.id}</Code>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Usuario ID
                  </Text>
                  <HStack>
                    <FiUser />
                    <Text fontSize="sm">
                      {selected.usuario_id ?? "—"}
                    </Text>
                  </HStack>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Fecha de creación
                  </Text>
                  <Text fontSize="sm">
                    {formatDateTime(selected.fecha_creacion)}
                  </Text>
                </HStack>

                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color={subtle}>
                      Estado actual
                    </Text>
                    <EstadoTag estado={selected.estado} />
                  </VStack>

                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color={subtle}>
                      Prioridad
                    </Text>
                    <PrioridadTag prioridad={selected.prioridad} />
                  </VStack>
                </HStack>

                <Box>
                  <Text fontSize="sm" color={subtle} mb={1}>
                    Cambiar estado
                  </Text>
                  <Select
                    size="sm"
                    value={selected.estado || "ABIERTO"}
                    onChange={(e) =>
                      handleChangeEstado(selected.id, e.target.value)
                    }
                    isDisabled={changingEstado}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {estadoMeta[e]?.label ?? e}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" color={subtle} mb={1}>
                    Descripción
                  </Text>
                  <Box
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColorSoft}
                    p={2}
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {selected.descripcion || "—"}
                  </Box>
                </Box>

                {/* 💬 Historial de comentarios */}
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" color={subtle}>
                      Historial de comentarios
                    </Text>
                    <Text fontSize="xs" color={subtle}>
                      {comentarios.length}{" "}
                      {comentarios.length === 1
                        ? "mensaje"
                        : "mensajes"}
                    </Text>
                  </HStack>
                  <Box
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColorSoft}
                    p={2}
                    maxH="220px"
                    overflowY="auto"
                    fontSize="sm"
                    bg={useColorModeValue("white", "whiteAlpha.50")}
                  >
                    {loadingComentarios ? (
                      <Text fontSize="xs" color={subtle}>
                        Cargando comentarios...
                      </Text>
                    ) : comentarios.length === 0 ? (
                      <Text fontSize="xs" color={subtle}>
                        Aún no hay comentarios en este caso.
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {comentarios.map((com) => (
                          <Box
                            key={com.id}
                            borderRadius="md"
                            bg={comentarioBg}
                            p={2}
                          >
                            <HStack justify="space-between" mb={1}>
                              <Tag
                                size="xs"
                                variant="subtle"
                                colorScheme={
                                  com.role === "ADMIN" ? "purple" : "blue"
                                }
                              >
                                <TagLeftIcon as={FiUser} />
                                <TagLabel>
                                  {com.username || "Usuario"}
                                </TagLabel>
                              </Tag>
                              <Text fontSize="xs" color={subtle}>
                                {formatDateTime(com.fecha_creacion)}
                              </Text>
                            </HStack>
                            <Text whiteSpace="pre-wrap">
                              {com.mensaje}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </Box>

                {/* ✏️ Añadir comentario */}
                <Box>
                  <Text fontSize="sm" color={subtle} mb={1}>
                    Añadir comentario
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    <Textarea
                      size="sm"
                      rows={3}
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder="Escribe una actualización o mensaje para este caso..."
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
                        Enviar comentario
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={handleCloseDetalle}>
              Cerrar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

/* ====== subcomponentes UI ====== */

function SectionCard({ title, subtitle, right, children }) {
  const cardBg = useColorModeValue(
    "rgba(255,255,255,0.9)",
    "rgba(23,25,35,0.7)"
  );
  const borderCo = useColorModeValue(
    "rgba(226,232,240,0.8)",
    "rgba(45,55,72,0.7)"
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const animatedProps = prefersReducedMotion
    ? {}
    : {
        transition: { duration: 0.18 },
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <MotionBox
      {...animatedProps}
      bg={cardBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius="2xl"
      p={3}
      mb={4}
      style={{ backdropFilter: "saturate(150%) blur(10px)" }}
      boxShadow={useColorModeValue(
        "0 8px 24px rgba(31,38,135,0.12)",
        "0 8px 24px rgba(0,0,0,0.35)"
      )}
    >
      <HStack
        justify="space-between"
        align="start"
        mb={subtitle ? 1 : 3}
        wrap="wrap"
        gap={3}
      >
        <VStack align="start" spacing={0}>
          <Heading size="sm">{title}</Heading>
          {subtitle && (
            <Text
              fontSize="sm"
              color={useColorModeValue("gray.600", "gray.300")}
            >
              {subtitle}
            </Text>
          )}
        </VStack>
        {right}
      </HStack>
      <Box as="hr" borderColor={borderCo} mb={3} />
      {children}
    </MotionBox>
  );
}

function EmptyState({
  icon: IconCmp = FiInfo,
  title = "Sin datos",
  description = "No hay información para mostrar.",
}) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  return (
    <VStack spacing={2} py={6} color={subtle}>
      <IconCmp size={22} />
      <Heading size="sm">{title}</Heading>
      <Text fontSize="sm" textAlign="center">
        {description}
      </Text>
    </VStack>
  );
}

function KpiCard({ label, value, icon: IconCmp, colorScheme = "gray" }) {
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
      minW="190px"
    >
      <Tag colorScheme={colorScheme} borderRadius="full">
        <TagLeftIcon as={IconCmp} />
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

function EstadoTag({ estado }) {
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

function PrioridadTag({ prioridad }) {
  const meta = prioridadMeta[prioridad] || {
    label: prioridad || "—",
    color: "gray",
  };
  return (
    <Tag size="sm" colorScheme={meta.color} borderRadius="full">
      <TagLabel>{meta.label}</TagLabel>
    </Tag>
  );
}
