// src/pages/admin/Auditoria.jsx
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
  Progress,
  Tag,
  TagLabel,
  TagLeftIcon,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  Code,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiInfo,
  FiActivity,
  FiClock,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/axiosInstance";

/* =============== Utils =============== */
const MotionBox = motion(Box);

const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const resumenCambios = (cambiosRaw) => {
  if (!cambiosRaw) return "—";
  try {
    const parsed = JSON.parse(cambiosRaw);
    if (typeof parsed === "string") return parsed;
    return JSON.stringify(parsed);
  } catch {
    return cambiosRaw.toString();
  }
};

const prettyCambios = (cambiosRaw) => {
  if (!cambiosRaw) return "";
  try {
    const parsed = JSON.parse(cambiosRaw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return cambiosRaw.toString();
  }
};

/* =================== Página principal =================== */
export default function Auditoria() {
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();

  const pageBg = useColorModeValue(
    "linear-gradient(135deg,#f7f7fb 0%,#eef3ff 100%)",
    "linear-gradient(135deg,#0b0f1a 0%,#121826 100%)"
  );
  const subtle = useColorModeValue("gray.600", "gray.300");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros que VAN al backend (controller)
  const [fAccion, setFAccion] = useState("");
  const [fEntidad, setFEntidad] = useState("");
  const [fUsuarioId, setFUsuarioId] = useState("");

  // búsqueda local (sobre el array que devuelve el backend)
  const [search, setSearch] = useState("");

  // detalle seleccionado
  const [selected, setSelected] = useState(null);

  const fetchAuditoria = async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (fAccion.trim()) params.accion = fAccion.trim();
      if (fEntidad.trim()) params.entidad = fEntidad.trim();
      if (fUsuarioId.trim()) params.usuario_id = fUsuarioId.trim();

      const { data } = await api.get("/auditoria", { params });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error al cargar la auditoría",
        description: "Revisa la consola del navegador para más detalles.",
        isClosable: true,
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // cargar al entrar
  useEffect(() => {
    fetchAuditoria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // datos filtrados localmente
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const partes = [
        l.accion,
        l.entidad,
        l.username,
        l.email,
        l.entidad_id && String(l.entidad_id),
        resumenCambios(l.cambios),
      ];
      return partes.some((p) =>
        (p || "").toString().toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  // stats rápidos
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const entidadesSet = new Set();
    const usuariosSet = new Set();
    filteredLogs.forEach((l) => {
      if (l.entidad) entidadesSet.add(l.entidad);
      if (l.usuario_id) usuariosSet.add(l.usuario_id);
    });
    const last = logs[0] || null; // ya viene ordered by fecha DESC
    return {
      total,
      entidades: entidadesSet.size,
      usuarios: usuariosSet.size,
      last,
    };
  }, [filteredLogs, logs]);

  // exportar CSV de la vista actual
  const exportCsv = () => {
    if (!filteredLogs.length) {
      toast({
        status: "info",
        title: "No hay registros para exportar",
      });
      return;
    }

    const header = [
      "id",
      "fecha",
      "accion",
      "entidad",
      "entidad_id",
      "usuario_id",
      "username",
      "email",
      "cambios",
    ];

    const rows = filteredLogs.map((l) => [
      l.id ?? "",
      formatDateTime(l.fecha),
      l.accion ?? "",
      l.entidad ?? "",
      l.entidad_id ?? "",
      l.usuario_id ?? "",
      l.username ?? "",
      l.email ?? "",
      resumenCambios(l.cambios).replace(/\s+/g, " "),
    ]);

    const csv =
      [header.join(";")]
        .concat(rows.map((r) => r.join(";")))
        .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyFilters = () => {
    fetchAuditoria();
  };

  const handleResetFilters = () => {
    setFAccion("");
    setFEntidad("");
    setFUsuarioId("");
    setSearch("");
    fetchAuditoria({ silent: false });
  };

  const handleRefresh = () => {
    fetchAuditoria();
  };

  return (
    <Box bgGradient={pageBg} minH="100%" pb={4}>
      {/* barra de progreso superior */}
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

      {/* ===== Resumen rápido ===== */}
      <SectionCard
        title="Auditoría del sistema"
        subtitle="Registros de quién hizo qué, sobre qué entidad y cuándo (máx. 100 últimos eventos)."
        right={
          <HStack spacing={2}>
            <Tooltip label="Refrescar">
              <IconButton
                aria-label="Refrescar auditoría"
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
                onClick={handleRefresh}
              />
            </Tooltip>
            <Tooltip label="Exportar vista actual (CSV)">
              <IconButton
                aria-label="Exportar CSV"
                icon={<FiDownload />}
                size="sm"
                variant="outline"
                onClick={exportCsv}
              />
            </Tooltip>
          </HStack>
        }
      >
        <HStack spacing={4} wrap="wrap">
          <KpiCard
            label="Eventos (vista actual)"
            value={stats.total}
            icon={FiActivity}
            colorScheme="purple"
          />
          <KpiCard
            label="Entidades distintas"
            value={stats.entidades}
            icon={FiInfo}
            colorScheme="blue"
          />
          <KpiCard
            label="Usuarios distintos"
            value={stats.usuarios}
            icon={FiUser}
            colorScheme="green"
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
                  Último evento (global)
                </Text>
                <Text fontSize="sm" noOfLines={1}>
                  {stats.last.entidad} · {stats.last.accion}
                </Text>
                <Text fontSize="xs" color={subtle}>
                  {formatDateTime(stats.last.fecha)}
                </Text>
              </VStack>
            </HStack>
          )}
        </HStack>
      </SectionCard>

      {/* ===== Historial con filtros ===== */}
      <SectionCard
        title="Historial de auditoría"
        subtitle="Puedes filtrar por acción, entidad o usuario, y hacer búsqueda rápida en los resultados."
        right={
          <HStack spacing={3} wrap="wrap">
            <InputGroup maxW="260px">
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Buscar en resultados (texto libre)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar localmente"
              />
            </InputGroup>

            <Input
              placeholder="Acción (exacta, ej: CREAR, ACTUALIZAR)"
              value={fAccion}
              onChange={(e) => setFAccion(e.target.value)}
              maxW="220px"
              aria-label="Filtro acción"
            />
            <Input
              placeholder="Entidad (ej: PRODUCTO, PEDIDO)"
              value={fEntidad}
              onChange={(e) => setFEntidad(e.target.value)}
              maxW="220px"
              aria-label="Filtro entidad"
            />
            <Input
              placeholder="ID de usuario"
              value={fUsuarioId}
              onChange={(e) => setFUsuarioId(e.target.value)}
              maxW="140px"
              aria-label="Filtro usuario_id"
            />

            <Button
              size="sm"
              leftIcon={<FiFilter />}
              onClick={handleApplyFilters}
            >
              Aplicar filtros
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
                <Th>Entidad</Th>
                <Th>Acción</Th>
                <Th>Usuario</Th>
                <Th>Entidad ID</Th>
                <Th>Detalle</Th>
              </Tr>
            </Thead>
            <Tbody>
              <AnimatePresence initial={false}>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Tr key={`sk-${i}`}>
                        <Td colSpan={6}>
                          <Progress size="xs" isIndeterminate />
                        </Td>
                      </Tr>
                    ))
                  : filteredLogs.map((log) => (
                      <motion.tr
                        key={log.id}
                        layout
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelected(log)}
                      >
                        <Td>{formatDateTime(log.fecha)}</Td>
                        <Td>
                          {log.entidad ? (
                            <Tag size="sm" colorScheme="blue">
                              <TagLabel>{log.entidad}</TagLabel>
                            </Tag>
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td>{log.accion || "—"}</Td>
                        <Td>
                          {log.username || log.email
                            ? `${log.username || ""}${
                                log.username && log.email ? " · " : ""
                              }${log.email || ""}`
                            : log.usuario_id || "—"}
                        </Td>
                        <Td>{log.entidad_id ?? "—"}</Td>
                        <Td maxW="320px">
                          <Text
                            noOfLines={2}
                            title={resumenCambios(log.cambios)}
                          >
                            {resumenCambios(log.cambios)}
                          </Text>
                        </Td>
                      </motion.tr>
                    ))}
              </AnimatePresence>
            </Tbody>
          </Table>
        </Box>

        {!loading && filteredLogs.length === 0 && (
          <EmptyState
            title="Sin eventos"
            description="No se encontraron registros para los filtros seleccionados."
          />
        )}
      </SectionCard>

      {/* ===== Drawer de detalle ===== */}
      <Drawer
        isOpen={!!selected}
        placement="right"
        size="md"
        onClose={() => setSelected(null)}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Detalle del evento
          </DrawerHeader>
          <DrawerBody>
            {selected && (
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    ID
                  </Text>
                  <Code>{selected.id}</Code>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Fecha
                  </Text>
                  <Text fontSize="sm">
                    {formatDateTime(selected.fecha)}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Usuario ID
                  </Text>
                  <Text fontSize="sm">
                    {selected.usuario_id ?? "—"}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Username
                  </Text>
                  <Text fontSize="sm">
                    {selected.username || "—"}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Email
                  </Text>
                  <Text fontSize="sm">
                    {selected.email || "—"}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Entidad
                  </Text>
                  <Text fontSize="sm">
                    {selected.entidad || "—"}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Entidad ID
                  </Text>
                  <Text fontSize="sm">
                    {selected.entidad_id ?? "—"}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={subtle}>
                    Acción
                  </Text>
                  <Text fontSize="sm">
                    {selected.accion || "—"}
                  </Text>
                </HStack>

                <Box>
                  <Text fontSize="sm" color={subtle} mb={1}>
                    Cambios (JSON / texto)
                  </Text>
                  <Code
                    whiteSpace="pre-wrap"
                    fontSize="xs"
                    display="block"
                  >
                    {prettyCambios(selected.cambios)}
                  </Code>
                </Box>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

/* ================= Subcomponentes UI ================= */
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
      minW="180px"
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