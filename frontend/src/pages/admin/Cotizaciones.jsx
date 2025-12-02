// src/pages/admin/Cotizaciones.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tag,
  TagLabel,
  TagLeftIcon,
  Button,
  IconButton,
  Select,
  Input,
  useColorModeValue,
  useToast,
  Skeleton,
  SkeletonText,
  Divider,
  Badge,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  SimpleGrid,
  Tooltip,
  Progress,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

const MotionBox = motion(Box);

/* ================== helpers visuales ================== */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("es-CO") : "—");

const getGestionColor = (estado) => {
  switch (estado) {
    case "PENDIENTE":
      return "yellow";
    case "ACEPTADA":
      return "green";
    case "RECHAZADA":
      return "red";
    default:
      return "gray";
  }
};

const getVigenciaColor = (estado) => {
  switch (estado) {
    case "VIGENTE":
      return "green";
    case "VENCIDA":
      return "red";
    default:
      return "gray";
  }
};

const EstadoGestionTag = ({ value }) => {
  const color = getGestionColor(value);
  const icon =
    value === "ACEPTADA"
      ? FiCheckCircle
      : value === "RECHAZADA"
        ? FiXCircle
        : FiClock;
  return (
    <Tag size="sm" colorScheme={color} variant="subtle">
      <TagLeftIcon as={icon} />
      <TagLabel>{value || "—"}</TagLabel>
    </Tag>
  );
};

const EstadoVigenciaTag = ({ value }) => {
  const color = getVigenciaColor(value);
  const icon = value === "VENCIDA" ? FiAlertTriangle : FiCheckCircle;
  return (
    <Tag size="sm" colorScheme={color} variant="outline">
      <TagLeftIcon as={icon} />
      <TagLabel>{value || "—"}</TagLabel>
    </Tag>
  );
};

/* ================== main ================== */
export default function AdminCotizaciones() {
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();

  /* ===== estilos ===== */
  const pageBg = useColorModeValue(
    "linear-gradient(135deg,#f7f7fb 0%,#eef3ff 100%)",
    "linear-gradient(135deg,#0b0f1a 0%,#121826 100%)"
  );
  const subtle = useColorModeValue("gray.600", "gray.300");
  const border = useColorModeValue("gray.200", "gray.700");
  const stripeBg = useColorModeValue("gray.50", "whiteAlpha.50");

  /* ===== estado remoto ===== */
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===== filtros remotos ===== */
  const [estadoGestion, setEstadoGestion] = useState("TODOS");
  const [estadoVigencia, setEstadoVigencia] = useState("TODAS");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  /* ===== búsqueda local ===== */
  const [searchTerm, setSearchTerm] = useState("");

  /* ===== detalle ===== */
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const descargarPDF = async (id) => {
    if (!id) return;
    try {
      const { data } = await api.get(`/cotizaciones/${id}/pdf`, {
        responseType: "blob", // 👈 importante para PDF
      });

      const blob = new Blob([data], { type: "application/pdf" });
      const fileURL = window.URL.createObjectURL(blob);

      // Abrir en nueva pestaña
      window.open(fileURL, "_blank", "noopener,noreferrer");

      // Liberar URL después de un rato
      setTimeout(() => {
        window.URL.revokeObjectURL(fileURL);
      }, 60_000);
    } catch (err) {
      console.error("Error al descargar PDF de cotización:", err);
      toast({
        title: "No se pudo abrir el PDF",
        description:
          err?.response?.data?.error ||
          "Revisa tu conexión o el backend e inténtalo de nuevo.",
        status: "error",
        duration: 3000,
      });
    }
  };


  /* ====== resumen derivado (heurística: visibilidad de estado del sistema) ====== */
  const resumen = useMemo(() => {
    const base = {
      total: cotizaciones.length,
      pendientes: 0,
      aceptadas: 0,
      rechazadas: 0,
      vigentes: 0,
      vencidas: 0,
      sumaTotal: 0,
    };
    for (const c of cotizaciones) {
      base.sumaTotal += Number(c.total || 0);
      if (c.estado_gestion === "PENDIENTE") base.pendientes++;
      if (c.estado_gestion === "ACEPTADA") base.aceptadas++;
      if (c.estado_gestion === "RECHAZADA") base.rechazadas++;
      if (c.estado_vigencia === "VIGENTE") base.vigentes++;
      if (c.estado_vigencia === "VENCIDA") base.vencidas++;
    }
    return base;
  }, [cotizaciones]);

  /* ====== filtro local (buscador) ====== */
  const cotizacionesFiltradas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cotizaciones;

    return cotizaciones.filter((c) => {
      const byId = String(c.id || "").includes(q);
      const byUser = (c.username || "").toLowerCase().includes(q);
      const byEmail = (c.email || "").toLowerCase().includes(q);
      return byId || byUser || byEmail;
    });
  }, [cotizaciones, searchTerm]);

  const anyFilterApplied =
    estadoGestion !== "TODOS" ||
    estadoVigencia !== "TODAS" ||
    fechaDesde ||
    fechaHasta ||
    searchTerm.trim() !== "";

  /* ================== API ================== */
  const fetchCotizaciones = async (showToast = false) => {
    try {
      setLoading(true);
      const params = {};
      if (estadoGestion !== "TODOS") params.estado_gestion = estadoGestion;
      if (estadoVigencia !== "TODAS") params.estado_vigencia = estadoVigencia;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const { data } = await api.get("/cotizaciones", { params });
      setCotizaciones(Array.isArray(data) ? data : []);
      if (showToast) {
        toast({
          title: "Cotizaciones actualizadas",
          description: "Se aplicaron los filtros seleccionados.",
          status: "success",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cargar cotizaciones",
        description:
          err?.response?.data?.error || "Intenta de nuevo más tarde.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFiltros = () => {
    setEstadoGestion("TODOS");
    setEstadoVigencia("TODAS");
    setFechaDesde("");
    setFechaHasta("");
    setSearchTerm("");
    fetchCotizaciones();
  };

  const abrirDetalle = async (id) => {
    try {
      setDetalleOpen(true);
      setDetalleLoading(true);
      setDetalle(null);
      const { data } = await api.get(`/cotizaciones/${id}`);
      setDetalle(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cargar detalle",
        description:
          err?.response?.data?.error ||
          "No fue posible obtener la información de la cotización.",
        status: "error",
        duration: 3000,
      });
      setDetalleOpen(false);
    } finally {
      setDetalleLoading(false);
    }
  };

  const abrirPDF = () => {
    if (!detalle?.id) return;
    descargarPDF(detalle.id);
  };

  const cambiarEstado = async (nuevoEstado) => {
    if (!detalle?.id) return;
    try {
      setCambiandoEstado(true);
      await api.put(`/cotizaciones/${detalle.id}/estado`, { nuevoEstado });

      toast({
        title: `Cotización ${nuevoEstado.toLowerCase()}`,
        description: `La cotización #${detalle.id} fue marcada como ${nuevoEstado}.`,
        status: "success",
        duration: 2500,
      });

      // Refrescar lista
      fetchCotizaciones();
      // Actualizar detalle en el drawer
      setDetalle((prev) =>
        prev ? { ...prev, estado_gestion: nuevoEstado } : prev
      );
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cambiar estado",
        description:
          err?.response?.data?.error ||
          "Revisa el backend o tus permisos para gestionar cotizaciones.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setCambiandoEstado(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchCotizaciones(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedCardProps = prefersReducedMotion
    ? {}
    : {
      transition: { duration: 0.18 },
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
    };

  return (
    <Box bgGradient={pageBg} minH="100%" pb={4}>
      {/* barra de estado global (visibilidad de sistema) */}
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

      {/* ===== HEADER + RESUMEN ===== */}
      <SectionCard
        title="Cotizaciones B2B"
        subtitle="Revisa, filtra y gestiona las cotizaciones realizadas por contratistas. Desde aquí puedes ver el detalle, revisar su vigencia y tomar decisiones rápidas."
        right={
          <HStack spacing={2}>
            <Tooltip label="Recargar datos del backend">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiRefreshCw />}
                onClick={() => fetchCotizaciones(true)}
                isLoading={loading}
              >
                Actualizar
              </Button>
            </Tooltip>
          </HStack>
        }
      >
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={3}>
          <SummaryPill
            label="Total cotizaciones"
            value={resumen.total}
            colorScheme="gray"
            helper="Máx. 100 últimas según backend"
          />
          <SummaryPill
            label="Pendientes por gestionar"
            value={resumen.pendientes}
            colorScheme="yellow"
            helper="Recomendación: priorízalas hoy"
          />
          <SummaryPill
            label="Aceptadas vigentes"
            value={resumen.aceptadas}
            extra={`Vigentes: ${resumen.vigentes}`}
            colorScheme="green"
            helper="Listas para convertir en pedido"
          />
          <SummaryPill
            label="Valor total filtrado"
            value={fmtCop(resumen.sumaTotal)}
            colorScheme="blue"
            helper="Suma de las cotizaciones listadas"
          />
        </SimpleGrid>
      </SectionCard>

      {/* ===== FILTROS + LISTADO ===== */}
      <SectionCard
        title="Listado y filtros"
        subtitle="Los filtros se aplican sobre el backend y el buscador funciona en esta tabla. Usa ambos para acotar lo que necesitas."
      >
        {/* Filtros principales (remotos) */}
        <VStack align="stretch" spacing={3} mb={3}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={3}>
            <FilterField
              label="Estado de gestión"
              helper="Cómo está la cotización en tu flujo interno."
            >
              <Select
                size="sm"
                value={estadoGestion}
                onChange={(e) => setEstadoGestion(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="ACEPTADA">Aceptada</option>
                <option value="RECHAZADA">Rechazada</option>
              </Select>
            </FilterField>

            <FilterField
              label="Estado de vigencia"
              helper="Si la fecha límite para usarla sigue activa."
            >
              <Select
                size="sm"
                value={estadoVigencia}
                onChange={(e) => setEstadoVigencia(e.target.value)}
              >
                <option value="TODAS">Todas</option>
                <option value="VIGENTE">Vigente</option>
                <option value="VENCIDA">Vencida</option>
              </Select>
            </FilterField>

            <FilterField
              label="Vigencia desde"
              helper="Fecha mínima de vencimiento."
            >
              <Input
                size="sm"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </FilterField>

            <FilterField
              label="Vigencia hasta"
              helper="Fecha máxima de vencimiento."
            >
              <Input
                size="sm"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </FilterField>
          </SimpleGrid>

          {/* Acciones de filtros remotos */}
          <HStack spacing={3} justify="space-between" flexWrap="wrap">
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<FiFilter />}
                onClick={() => fetchCotizaciones(true)}
                isDisabled={loading}
              >
                Aplicar filtros al backend
              </Button>
              <Tooltip label="Ver sólo cotizaciones pendientes (atajo rápido)">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEstadoGestion("PENDIENTE");
                    fetchCotizaciones(true);
                  }}
                >
                  Solo pendientes
                </Button>
              </Tooltip>
              <IconButton
                size="sm"
                aria-label="Limpiar filtros"
                icon={<FiRefreshCw />}
                onClick={resetFiltros}
                variant="ghost"
              />
            </HStack>

            {/* Buscador local sobre la tabla (reconocimiento > recuerdo) */}
            <HStack spacing={2} maxW={{ base: "100%", md: "320px" }} w="100%">
              <FilterField
                label="Buscar en resultados"
                helper="Filtra por ID, nombre o correo del cliente (solo sobre la tabla actual)."
                fullWidth
              >
                <HStack w="100%">
                  <Box flex="1">
                    <Input
                      size="sm"
                      placeholder="Ej: #10, Juan, correo@cliente.com"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Box>
                  <Box color={subtle}>
                    <FiSearch />
                  </Box>
                </HStack>
              </FilterField>
            </HStack>
          </HStack>

          {/* Resumen de filtros activos (visibilidad de estado) */}
          <HStack
            spacing={2}
            fontSize="xs"
            color={subtle}
            flexWrap="wrap"
            mt={1}
          >
            <FiInfo />
            <Text>Filtros activos:</Text>
            {!anyFilterApplied && (
              <Badge colorScheme="gray" variant="subtle">
                Ninguno (lista completa del backend)
              </Badge>
            )}
            {estadoGestion !== "TODOS" && (
              <Badge colorScheme="yellow">Gestión: {estadoGestion}</Badge>
            )}
            {estadoVigencia !== "TODAS" && (
              <Badge colorScheme="green">Vigencia: {estadoVigencia}</Badge>
            )}
            {fechaDesde && (
              <Badge colorScheme="blue">Desde: {fechaDesde}</Badge>
            )}
            {fechaHasta && (
              <Badge colorScheme="blue">Hasta: {fechaHasta}</Badge>
            )}
            {searchTerm.trim() && (
              <Badge colorScheme="purple">
                Buscar: “{searchTerm.trim()}”
              </Badge>
            )}
            <Text ml="auto" fontSize="xs">
              Mostrando {cotizacionesFiltradas.length} de{" "}
              {cotizaciones.length} cotizaciones cargadas
            </Text>
          </HStack>
        </VStack>

        <Divider mb={3} />

        {/* Tabla principal */}
        <Box
          border="1px solid"
          borderColor={border}
          borderRadius="xl"
          overflow="hidden"
        >
          {loading ? (
            <Box p={4}>
              <Skeleton height="16px" mb={3} />
              <Skeleton height="16px" mb={3} />
              <Skeleton height="16px" mb={3} />
              <SkeletonText noOfLines={4} spacing="3" mt="4" />
            </Box>
          ) : cotizacionesFiltradas.length === 0 ? (
            <Box p={6} textAlign="center">
              <Text fontSize="sm" color={subtle}>
                No hay cotizaciones que coincidan con los filtros y la
                búsqueda actual.
              </Text>
              <Button
                mt={3}
                size="sm"
                variant="outline"
                onClick={resetFiltros}
              >
                Limpiar filtros y búsqueda
              </Button>
            </Box>
          ) : (
            <Table
              size="sm"
              variant="striped"
              colorScheme="gray"
              sx={{
                "tbody tr:nth-of-type(odd)": {
                  bg: stripeBg,
                },
              }}
            >
              <Thead bg={useColorModeValue("gray.100", "whiteAlpha.100")}>
                <Tr>
                  <Th>ID</Th>
                  <Th>Cliente</Th>
                  <Th isNumeric>Total</Th>
                  <Th isNumeric>Descuento</Th>
                  <Th>Gestión</Th>
                  <Th>Vigencia</Th>
                  <Th>Creación</Th>
                  <Th>Vence</Th>
                  <Th textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {cotizacionesFiltradas.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Badge colorScheme="gray" variant="subtle">
                        #{c.id}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {c.username || "—"}
                        </Text>
                        <Text fontSize="xs" color={subtle}>
                          {c.email || "sin correo"}
                        </Text>
                      </VStack>
                    </Td>
                    <Td isNumeric>{fmtCop(c.total)}</Td>
                    <Td isNumeric>
                      {c.descuento ? fmtCop(c.descuento) : "—"}
                    </Td>
                    <Td>
                      <EstadoGestionTag value={c.estado_gestion} />
                    </Td>
                    <Td>
                      <EstadoVigenciaTag value={c.estado_vigencia} />
                    </Td>
                    <Td>{fmtDate(c.fecha_creacion)}</Td>
                    <Td>{fmtDate(c.fecha_vigencia)}</Td>
                    <Td>
                      <HStack justify="flex-end" spacing={1}>
                        <Tooltip label="Ver detalle">
                          <IconButton
                            aria-label="Ver detalle"
                            icon={<FiEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirDetalle(c.id)}
                          />
                        </Tooltip>
                        <Tooltip label="Abrir versión PDF">
                          <IconButton
                            aria-label="Abrir PDF"
                            icon={<FiFileText />}
                            size="sm"
                            variant="ghost"
                            onClick={() => descargarPDF(c.id)}
                          />
                        </Tooltip>

                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </SectionCard>

      {/* Drawer de detalle (manteniendo tu patrón de panel emergente) */}
      <Drawer
        isOpen={detalleOpen}
        onClose={() => {
          setDetalleOpen(false);
          setDetalle(null);
        }}
        size="lg"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {detalle ? (
              <HStack justify="space-between" align="center">
                <Box>
                  <Heading size="md">Cotización #{detalle.id}</Heading>
                  <Text fontSize="sm" color={subtle}>
                    Cliente: {detalle.username} · {detalle.email}
                  </Text>
                </Box>
                <VStack align="flex-end" spacing={1}>
                  <EstadoGestionTag value={detalle.estado_gestion} />
                  <EstadoVigenciaTag value={detalle.estado_vigencia} />
                </VStack>
              </HStack>
            ) : (
              <Text>Detalle de cotización</Text>
            )}
          </DrawerHeader>
          <DrawerBody>
            {detalleLoading || !detalle ? (
              <Box mt={4}>
                <Skeleton height="18px" mb={2} />
                <SkeletonText noOfLines={4} spacing="3" />
              </Box>
            ) : (
              <VStack align="stretch" spacing={4} mt={2}>
                {/* info principal */}
                <Box>
                  <Heading size="sm" mb={1}>
                    Información general
                  </Heading>
                  <Text fontSize="sm" color={subtle}>
                    Creada: {fmtDate(detalle.fecha_creacion)} · Vigente hasta:{" "}
                    {fmtDate(detalle.fecha_vigencia)}
                  </Text>
                </Box>

                <Divider />

                {/* productos */}
                <Box>
                  <Heading size="sm" mb={2}>
                    Productos ({detalle.productos?.length || 0})
                  </Heading>
                  {detalle.productos && detalle.productos.length > 0 ? (
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Producto</Th>
                          <Th isNumeric>Cant.</Th>
                          <Th isNumeric>P. Unit.</Th>
                          <Th isNumeric>Subtotal</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {detalle.productos.map((p) => (
                          <Tr key={p.id}>
                            <Td>{p.nombre}</Td>
                            <Td isNumeric>{p.cantidad}</Td>
                            <Td isNumeric>{fmtCop(p.precio_unitario)}</Td>
                            <Td isNumeric>{fmtCop(p.subtotal)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text fontSize="sm" color={subtle}>
                      Esta cotización no tiene productos asociados.
                    </Text>
                  )}
                </Box>

                {/* resumen económico */}
                <Box>
                  <Heading size="sm" mb={2}>
                    Resumen económico
                  </Heading>
                  <VStack align="stretch" spacing={1} fontSize="sm">
                    <HStack justify="space-between">
                      <Text color={subtle}>Base gravable (sin IVA)</Text>
                      <Text>{fmtCop(detalle.base_iva ?? 0)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color={subtle}>IVA (19%)</Text>
                      <Text>{fmtCop(detalle.iva ?? 0)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color={subtle}>Descuento</Text>
                      <Text>
                        {detalle.descuento
                          ? `- ${fmtCop(detalle.descuento)}`
                          : "—"}
                      </Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Total</Text>
                      <Text fontWeight="bold">
                        {fmtCop(detalle.total ?? 0)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            )}
          </DrawerBody>
          <DrawerFooter borderTopWidth="1px">
            {detalle && (
              <HStack w="full" justify="space-between" spacing={3}>
                <Button
                  variant="outline"
                  leftIcon={<FiFileText />}
                  onClick={abrirPDF}
                >
                  Ver PDF
                </Button>

                <HStack spacing={2}>
                  {detalle.estado_gestion === "PENDIENTE" ? (
                    <>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FiCheckCircle />}
                        onClick={() => cambiarEstado("ACEPTADA")}
                        isLoading={cambiandoEstado}
                      >
                        Marcar como aceptada
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FiXCircle />}
                        onClick={() => cambiarEstado("RECHAZADA")}
                        isLoading={cambiandoEstado}
                      >
                        Marcar como rechazada
                      </Button>
                    </>
                  ) : (
                    <Text fontSize="xs" color={subtle}>
                      Esta cotización ya fue gestionada.
                    </Text>
                  )}
                </HStack>
              </HStack>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

/* ================== Subcomponentes UI reutilizables ================== */

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
      <Divider mb={3} />
      {children}
    </MotionBox>
  );
}

function SummaryPill({ label, value, extra, helper, colorScheme = "gray" }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  return (
    <MotionBox
      transition={{ duration: 0.18 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      p={3}
      border="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      borderRadius="lg"
      bg={useColorModeValue("white", "gray.800")}
    >
      <Text fontSize="xs" color={subtle} mb={1}>
        {label}
      </Text>
      <Heading size="md">{value}</Heading>
      {extra && (
        <Text fontSize="xs" color={subtle} mt={0.5}>
          {extra}
        </Text>
      )}
      {helper && (
        <Badge mt={2} colorScheme={colorScheme} variant="subtle">
          {helper}
        </Badge>
      )}
    </MotionBox>
  );
}

function FilterField({ label, helper, children, fullWidth = false }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  return (
    <Box w={fullWidth ? "100%" : "auto"}>
      <Text fontSize="xs" mb={1} color={subtle}>
        {label}
      </Text>
      {children}
      {helper && (
        <Text fontSize="xs" mt={1} color={subtle}>
          {helper}
        </Text>
      )}
    </Box>
  );
}