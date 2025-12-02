// src/pages/cliente/MisCasos.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
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
} from "react-icons/fi";
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

/* ==== componente principal ==== */

export default function MisCasos() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue(
    "rgba(255,255,255,0.98)",
    "rgba(23,25,35,0.92)"
  );
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.300");
  const title = useColorModeValue("gray.900", "gray.100");
  const shadowSm = useColorModeValue(
    "0 6px 18px rgba(31,38,135,0.10)",
    "0 6px 18px rgba(0,0,0,0.35)"
  );

  const comentarioBg = useColorModeValue("gray.50", "whiteAlpha.100");

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

  return (
    <Box
      bg={pageBg}
      px={{ base: 3, md: 6, lg: 8 }}
      py={{ base: 4, md: 6 }}
      minH="100%"
    >
      {/* Header */}
      <HStack
        justify="space-between"
        align="flex-start"
        mb={4}
        flexWrap="wrap"
        gap={3}
      >
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={2}>
            <Heading size="lg" color={title}>
              Soporte y casos
            </Heading>
            <Tag size="sm" variant="subtle" colorScheme="purple">
              <TagLeftIcon as={FiLifeBuoy} />
              <TagLabel>Tus solicitudes</TagLabel>
            </Tag>
          </HStack>
          <Text fontSize="sm" color={muted}>
            Aquí puedes crear casos de soporte, revisar su estado y ver el hilo
            de conversación con el equipo de FerreExpress.
          </Text>
        </VStack>

        <HStack spacing={2}>
          <Tooltip label="Recargar">
            <IconButton
              aria-label="Recargar casos"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={() => fetchCasos()}
            />
          </Tooltip>
          <Button
            size="sm"
            leftIcon={<FiPlus />}
            colorScheme="yellow"
            color="black"
            onClick={handleOpenCreate}
          >
            Nuevo caso
          </Button>
        </HStack>
      </HStack>

      {/* Resumen rápido */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="2xl"
        boxShadow={shadowSm}
        p={4}
        mb={4}
      >
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <Kpi
            label="Casos (vista actual)"
            value={stats.total}
            icon={FiLifeBuoy}
          />
          <Kpi
            label="Abiertos"
            value={stats.abiertos}
            icon={FiAlertCircle}
            colorScheme="blue"
          />
          <Kpi
            label="En progreso"
            value={stats.enProgreso}
            icon={FiClock}
            colorScheme="orange"
          />
          <Kpi
            label="Resueltos"
            value={stats.resueltos}
            icon={FiCheckCircle}
            colorScheme="green"
          />
        </SimpleGrid>
      </Box>

      {/* Filtros + listado */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="2xl"
        boxShadow={shadowSm}
        p={4}
      >
        {/* Filtros */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={3}
          mb={3}
          align="stretch"
        >
          <Input
            size="sm"
            placeholder="Buscar por título o descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<FiSearch />}
          />
          <HStack spacing={3}>
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFEstado("");
                setFPrioridad("");
                setSearch("");
              }}
            >
              Limpiar
            </Button>
          </HStack>
        </Stack>

        <Divider mb={3} />

        {loading ? (
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
        ) : filteredCasos.length === 0 ? (
          <VStack py={6} spacing={2}>
            <FiInfo />
            <Text fontSize="sm" color={muted}>
              Aún no tienes casos de soporte con los filtros actuales.
            </Text>
            <Button
              size="sm"
              leftIcon={<FiPlus />}
              colorScheme="yellow"
              color="black"
              onClick={handleOpenCreate}
            >
              Crear primer caso
            </Button>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th>Prioridad</Th>
                  <Th>Título</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredCasos.map((c) => (
                  <Tr key={c.id} _hover={{ bg: "blackAlpha.50" }}>
                    <Td>{formatDateTime(c.fecha_creacion)}</Td>
                    <Td>
                      <EstadoPill estado={c.estado} />
                    </Td>
                    <Td>
                      <PrioridadPill prioridad={c.prioridad} />
                    </Td>
                    <Td maxW="320px">
                      <Text noOfLines={2}>{c.titulo}</Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="Ver hilo de soporte">
                          <IconButton
                            size="xs"
                            aria-label="Ver hilo de soporte"
                            icon={<FiMessageSquare />}
                            onClick={() => openDetalle(c)}
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
      </Box>

      {/* Modal crear caso */}
      <Modal isOpen={isCreateOpen} onClose={handleCloseCreate} isCentered>
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
      <Modal isOpen={!!selected} onClose={closeDetalle} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent maxH="80vh" display="flex">
          <ModalHeader>
            {selected
              ? `Caso #${selected.id} · ${selected.titulo}`
              : "Detalle de caso"}
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
                                <TagLeftIcon as={FiMessageSquare} />
                                <TagLabel>
                                  {com.role === "ADMIN"
                                    ? "Equipo FerreExpress"
                                    : com.username || "Tú"}
                                </TagLabel>
                              </Tag>
                              <Text fontSize="xs" color={muted}>
                                {formatDateTime(com.fecha_creacion)}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" whiteSpace="pre-wrap">
                              {com.mensaje}
                            </Text>
                          </Box>
                        ))}
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
                    />
                    <HStack justify="flex-end" spacing={2}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNuevoComentario("")}
                        isDisabled={!nuevoComentario.trim() || sendingComentario}
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
  return (
    <Tag size="sm" colorScheme={meta.color} borderRadius="full">
      <TagLabel>{meta.label}</TagLabel>
    </Tag>
  );
}
