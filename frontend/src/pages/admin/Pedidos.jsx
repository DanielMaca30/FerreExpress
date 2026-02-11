// src/pages/admin/Pedidos.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  SimpleGrid,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Stack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiShoppingBag,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const fmtDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-CO");
};

const estadoColor = (estado) => {
  switch (estado) {
    case "PENDIENTE":
      return "yellow";
    case "CONFIRMADO":
      return "blue";
    case "ENVIADO":
      return "purple";
    case "ENTREGADO":
      return "green";
    case "CANCELADO":
      return "red";
    default:
      return "gray";
  }
};

const estadoLabel = (estado) => {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente";
    case "CONFIRMADO":
      return "Confirmado";
    case "ENVIADO":
      return "Enviado";
    case "ENTREGADO":
      return "Entregado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return estado || "—";
  }
};

const MotionBox = motion(Box);

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros (backend)
  const [fEstado, setFEstado] = useState("");
  const [fUsuarioId, setFUsuarioId] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  // Búsqueda local (frontend)
  const [searchTerm, setSearchTerm] = useState("");

  // Detalle
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // Cambio de estado
  const [updatingEstado, setUpdatingEstado] = useState(false);

  const toast = useToast();

  // Tokens visuales tipo Admin
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

  const rowHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");
  const scrollThumb = useColorModeValue(
    "rgba(0,0,0,0.25)",
    "rgba(255,255,255,0.18)"
  );

  // ===== Scroll X (barra superior sincronizada) =====
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const syncingRef = useRef(false);
  const [scrollW, setScrollW] = useState(0);
  const [hasXOverflow, setHasXOverflow] = useState(false);

  // Para evitar abrir el detalle cuando el usuario está arrastrando para scrollear
  const rowPointerRef = useRef({ x: 0, y: 0, moved: false });

  const measureScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;

    const sw = el.scrollWidth || 0;
    const cw = el.clientWidth || 0;

    setScrollW(sw);
    setHasXOverflow(sw > cw + 2);
  }, []);

  const syncScrollLeft = useCallback((fromEl, toEl) => {
    if (!fromEl || !toEl) return;
    if (syncingRef.current) return;

    syncingRef.current = true;
    toEl.scrollLeft = fromEl.scrollLeft;

    // libera el lock al siguiente frame
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, []);

  const onTopScroll = useCallback(() => {
    syncScrollLeft(topScrollRef.current, tableScrollRef.current);
  }, [syncScrollLeft]);

  const onTableScroll = useCallback(() => {
    syncScrollLeft(tableScrollRef.current, topScrollRef.current);
  }, [syncScrollLeft]);

  useEffect(() => {
    // medir al montar + al resize + cuando cambia el contenido
    measureScroll();

    const onResize = () => measureScroll();
    window.addEventListener("resize", onResize);

    // ResizeObserver para cambios de layout (columnas/hide, etc.)
    let ro;
    const el = tableScrollRef.current;
    if (el && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => measureScroll());
      ro.observe(el);
      const t = el.querySelector("table");
      if (t) ro.observe(t);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [measureScroll, pedidos.length, loading, searchTerm, fEstado, fUsuarioId, fDesde, fHasta]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (fEstado) params.estado = fEstado;
      if (fUsuarioId.trim()) params.usuario = fUsuarioId.trim();
      if (fDesde) params.desde = fDesde;
      if (fHasta) params.hasta = fHasta;

      const { data } = await api.get("/pedidos", { params });
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cargar pedidos",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
      // deja que el render ocurra y luego mide el overflow
      requestAnimationFrame(() => measureScroll());
    }
  };

  useEffect(() => {
    fetchPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiarFiltros = () => {
    setFEstado("");
    setFUsuarioId("");
    setFDesde("");
    setFHasta("");
    setSearchTerm("");
  };

  const abrirDetalle = async (pedido) => {
    setSelectedPedido(pedido);
    setDetalle(null);
    setDetailOpen(true);
    try {
      setLoadingDetalle(true);
      const { data } = await api.get(`/pedidos/${pedido.id}`);
      setDetalle(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al obtener detalle",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
      setDetailOpen(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setDetailOpen(false);
    setSelectedPedido(null);
    setDetalle(null);
  };

  const changeEstado = async (pedidoId, nuevoEstado) => {
    try {
      setUpdatingEstado(true);
      await api.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
      toast({
        title: "Estado actualizado",
        description: `El pedido #${pedidoId} ahora está en estado ${estadoLabel(
          nuevoEstado
        )}.`,
        status: "success",
        duration: 2500,
      });

      await fetchPedidos();

      if (detalle && detalle.id === pedidoId) {
        try {
          const { data } = await api.get(`/pedidos/${pedidoId}`);
          setDetalle(data);
          setSelectedPedido((prev) =>
            prev && prev.id === pedidoId
              ? { ...prev, estado: data.estado }
              : prev
          );
        } catch {
          // silencioso
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar estado",
        description:
          err?.response?.data?.error ||
          "Revisa reglas de transición en el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setUpdatingEstado(false);
    }
  };

  const renderAccionesEstado = () => {
    if (!detalle) return null;
    const estadoActual = detalle.estado;

    const botones = [];

    if (estadoActual === "PENDIENTE") {
      botones.push(
        <Button
          key="confirmar"
          size="sm"
          leftIcon={<FiCheckCircle />}
          colorScheme="blue"
          onClick={() => changeEstado(detalle.id, "CONFIRMADO")}
          isLoading={updatingEstado}
        >
          Confirmar pedido
        </Button>
      );
      botones.push(
        <Button
          key="cancelar"
          size="sm"
          leftIcon={<FiXCircle />}
          colorScheme="red"
          variant="outline"
          onClick={() => changeEstado(detalle.id, "CANCELADO")}
          isLoading={updatingEstado}
        >
          Cancelar
        </Button>
      );
    } else if (estadoActual === "CONFIRMADO") {
      botones.push(
        <Button
          key="enviar"
          size="sm"
          leftIcon={<FiTruck />}
          colorScheme="purple"
          onClick={() => changeEstado(detalle.id, "ENVIADO")}
          isLoading={updatingEstado}
        >
          Marcar como enviado
        </Button>
      );
      botones.push(
        <Button
          key="cancelar"
          size="sm"
          leftIcon={<FiXCircle />}
          colorScheme="red"
          variant="outline"
          onClick={() => changeEstado(detalle.id, "CANCELADO")}
          isLoading={updatingEstado}
        >
          Cancelar
        </Button>
      );
    } else if (estadoActual === "ENVIADO") {
      botones.push(
        <Button
          key="entregado"
          size="sm"
          leftIcon={<FiCheckCircle />}
          colorScheme="green"
          onClick={() => changeEstado(detalle.id, "ENTREGADO")}
          isLoading={updatingEstado}
        >
          Marcar como entregado
        </Button>
      );
    }

    if (botones.length === 0) {
      return (
        <Text fontSize="sm" color={muted}>
          Este pedido ya está en estado <b>{estadoLabel(estadoActual)}</b>, no
          admite más cambios.
        </Text>
      );
    }

    return (
      <HStack spacing={3} flexWrap="wrap">
        {botones}
      </HStack>
    );
  };

  const subtotalProductos =
    detalle?.detalles?.reduce((acc, d) => acc + Number(d.subtotal || 0), 0) ?? 0;

  // Búsqueda local (no recarga backend)
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      const byId = String(p.id || "").includes(q);
      const byUser = (p.username || "").toLowerCase().includes(q);
      const byEmail = (p.email || "").toLowerCase().includes(q);
      return byId || byUser || byEmail;
    });
  }, [pedidos, searchTerm]);

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 6 }}>
      {/* Header */}
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        spacing={{ base: 3, md: 4 }}
        mb={4}
      >
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={2}>
            <Heading size="lg" color={title}>
              Pedidos
            </Heading>
            <Tag size="sm" variant="subtle" colorScheme="yellow">
              <TagLeftIcon as={FiShoppingBag} />
              <TagLabel>Flujo de ventas</TagLabel>
            </Tag>
          </HStack>
          <Text fontSize="sm" color={muted}>
            Revisa los pedidos, filtra por estado o rango de fechas y gestiona
            el avance del estado desde pendiente hasta entregado.
          </Text>
        </VStack>

        <HStack spacing={2} alignSelf={{ base: "flex-end", md: "center" }}>
          <Tooltip label="Recargar pedidos" hasArrow>
            <IconButton
              size="sm"
              aria-label="Recargar pedidos"
              icon={<FiRefreshCw />}
              variant="ghost"
              onClick={fetchPedidos}
              isLoading={loading}
            />
          </Tooltip>
        </HStack>
      </Stack>

      {/* Filtros */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="2xl"
        boxShadow={shadowSm}
        p={4}
        mb={4}
        sx={{ backdropFilter: "saturate(140%) blur(8px)" }}
      >
        {/* Encabezado filtros + búsqueda local */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={3}
          mb={3}
          align={{ base: "flex-start", md: "center" }}
        >
          <HStack spacing={3}>
            <FiSearch />
            <Text fontSize="sm" color={muted}>
              Filtros de búsqueda (afectan al backend)
            </Text>
          </HStack>

          <Box flex="1" w="100%">
            <Input
              size="sm"
              placeholder="Buscar por ID, cliente o correo (sin recargar)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} mb={3}>
          <Box>
            <Text fontSize="xs" mb={1} color={muted}>
              Estado
            </Text>
            <Select
              size="sm"
              value={fEstado}
              onChange={(e) => setFEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="ENVIADO">Enviado</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          </Box>
          <Box>
            <Text fontSize="xs" mb={1} color={muted}>
              ID de usuario
            </Text>
            <Input
              size="sm"
              value={fUsuarioId}
              onChange={(e) => setFUsuarioId(e.target.value)}
              placeholder="Ej: 12"
            />
          </Box>
          <Box>
            <Text fontSize="xs" mb={1} color={muted}>
              Desde (fecha creación)
            </Text>
            <Input
              type="date"
              size="sm"
              value={fDesde}
              onChange={(e) => setFDesde(e.target.value)}
            />
          </Box>
          <Box>
            <Text fontSize="xs" mb={1} color={muted}>
              Hasta (fecha creación)
            </Text>
            <Input
              type="date"
              size="sm"
              value={fHasta}
              onChange={(e) => setFHasta(e.target.value)}
            />
          </Box>
        </SimpleGrid>

        <HStack justify="flex-end" spacing={2}>
          <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
          <Button
            size="sm"
            leftIcon={<FiSearch />}
            colorScheme="yellow"
            color="black"
            onClick={fetchPedidos}
          >
            Aplicar filtros
          </Button>
        </HStack>
      </Box>

      {/* Tabla principal */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="2xl"
        boxShadow={shadowSm}
        p={4}
        sx={{ backdropFilter: "saturate(140%) blur(8px)" }}
      >
        <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
          <Text fontSize="sm" color={muted}>
            Total en tabla: <b>{pedidosFiltrados.length}</b> (de{" "}
            {pedidos.length} registros cargados)
          </Text>
        </HStack>
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
        ) : pedidosFiltrados.length === 0 ? (
          <VStack py={6} spacing={2}>
            <Text color={muted} fontSize="sm" textAlign="center">
              No se encontraron pedidos con los filtros / búsqueda actuales.
            </Text>
            <Button size="sm" variant="outline" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </VStack>
        ) : (
          <>
            {/* Barra superior de scroll X (sincronizada) */}
            {hasXOverflow && (
              <Box mb={2} display={{ base: "block", xl: "none" }}>
                <HStack justify="space-between" mb={1} flexWrap="wrap">
                  <Text fontSize="xs" color={muted}>
                    Desliza para ver más columnas →
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    Tip: toca cualquier fila para ver el detalle
                  </Text>
                </HStack>

                <Box
                  ref={topScrollRef}
                  overflowX="auto"
                  overflowY="hidden"
                  h="16px"
                  onScroll={onTopScroll}
                  sx={{
                    WebkitOverflowScrolling: "touch",
                    "&::-webkit-scrollbar": { height: "10px" },
                    "&::-webkit-scrollbar-thumb": {
                      background: scrollThumb,
                      borderRadius: "999px",
                    },
                  }}
                >
                  {/* “Espaciador” para crear el ancho scrolleable */}
                  <Box w={`${scrollW}px`} h="1px" />
                </Box>
              </Box>
            )}

            <Box
              ref={tableScrollRef}
              overflowX="auto"
              onScroll={onTableScroll}
              sx={{
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { height: "10px" },
                "&::-webkit-scrollbar-thumb": {
                  background: scrollThumb,
                  borderRadius: "999px",
                },
              }}
            >
              <Table size="sm" minW="980px">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Cliente</Th>
                    <Th display={{ base: "none", md: "table-cell" }}>Email</Th>
                    <Th isNumeric>Total</Th>
                    <Th isNumeric display={{ base: "none", md: "table-cell" }}>
                      Envío
                    </Th>
                    <Th display={{ base: "none", md: "table-cell" }}>Método</Th>
                    <Th>Estado</Th>
                    <Th display={{ base: "none", md: "table-cell" }}>
                      <HStack spacing={1}>
                        <FiCalendar />
                        <Text as="span" fontSize="xs">
                          Creación
                        </Text>
                      </HStack>
                    </Th>
                    <Th textAlign="right">Acciones</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {pedidosFiltrados.map((p) => (
                    <Tr
                      key={p.id}
                      cursor="pointer"
                      _hover={{ bg: rowHoverBg }}
                      transition="background 0.15s ease"
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => {
                        rowPointerRef.current = {
                          x: e.clientX,
                          y: e.clientY,
                          moved: false,
                        };
                      }}
                      onPointerMove={(e) => {
                        const dx = Math.abs(e.clientX - rowPointerRef.current.x);
                        const dy = Math.abs(e.clientY - rowPointerRef.current.y);
                        if (dx > 8 || dy > 8) rowPointerRef.current.moved = true;
                      }}
                      onClick={() => {
                        if (rowPointerRef.current.moved) return;
                        abrirDetalle(p);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          abrirDetalle(p);
                        }
                      }}
                    >
                      <Td>{p.id}</Td>
                      <Td>
                        <Text fontWeight="semibold" noOfLines={1}>
                          {p.username || `Usuario #${p.usuario_id}`}
                        </Text>
                      </Td>
                      <Td display={{ base: "none", md: "table-cell" }}>
                        <Text fontSize="xs" color={muted} noOfLines={1}>
                          {p.email || "—"}
                        </Text>
                      </Td>
                      <Td isNumeric>{fmtCop(p.total)}</Td>
                      <Td
                        isNumeric
                        display={{ base: "none", md: "table-cell" }}
                      >
                        {fmtCop(p.costo_envio)}
                      </Td>
                      <Td display={{ base: "none", md: "table-cell" }}>
                        <Badge variant="subtle" colorScheme="gray">
                          {p.metodo_pago || "—"}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={estadoColor(p.estado)} variant="solid">
                          {estadoLabel(p.estado)}
                        </Badge>
                      </Td>
                      <Td display={{ base: "none", md: "table-cell" }}>
                        <Text fontSize="xs" color={muted}>
                          {fmtDateTime(p.fecha_creacion)}
                        </Text>
                      </Td>

                      {/* Acciones: mantiene el ojito, pero ya no es obligatorio */}
                      <Td
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerMove={(e) => e.stopPropagation()}
                      >
                        <HStack justify="flex-end">
                          <Tooltip label="Ver detalle" hasArrow>
                            <IconButton
                              size="xs"
                              aria-label="Ver detalle"
                              icon={<FiEye />}
                              variant="ghost"
                              onClick={() => abrirDetalle(p)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </>
        )}
      </Box>

      {/* Modal detalle (pestaña emergente centrada + fondo difuminado) */}
      <Modal
        isOpen={detailOpen}
        onClose={cerrarDetalle}
        // móvil full; desde md ya es "pestañita"
        size={{ base: "full", md: "3xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent
          borderRadius={{ base: 0, md: "2xl" }}
          overflow="hidden"
          // clave para que en laptop NO se vea full
          maxH={{ base: "100vh", md: "88vh" }}
          my={{ base: 0, md: 6 }}
          mx={{ base: 0, md: 4 }}
        >
          <ModalHeader borderBottomWidth="1px">
            {detalle ? (
              <Stack
                direction={{ base: "column", md: "row" }}
                spacing={{ base: 3, md: 4 }}
                justify="space-between"
                align={{ base: "flex-start", md: "center" }}
              >
                <VStack align="flex-start" spacing={1}>
                  <HStack spacing={2}>
                    <Heading size="md">Pedido #{detalle.id}</Heading>
                    <Badge colorScheme={estadoColor(detalle.estado)}>
                      {estadoLabel(detalle.estado)}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color={muted}>
                    {detalle.username || `Usuario #${detalle.usuario_id}`} ·{" "}
                    {detalle.email || "sin correo"}
                  </Text>
                </VStack>
                <Box w="full" maxW={{ base: "100%", md: "260px" }}>
                  <EstadoTimeline estado={detalle.estado} />
                </Box>
              </Stack>
            ) : (
              <Heading size="md">Detalle de pedido</Heading>
            )}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {loadingDetalle || !detalle ? (
              <VStack align="stretch" spacing={3} mt={2}>
                <Skeleton height="16px" />
                <Skeleton height="16px" />
                <SkeletonText noOfLines={4} spacing="3" />
              </VStack>
            ) : (
              <VStack align="stretch" spacing={4} mt={2}>
                {/* Info principal */}
                <Box>
                  <Heading size="sm" mb={2}>
                    Información general
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                    <InfoField label="Cliente">
                      {detalle.username || `Usuario #${detalle.usuario_id}`}
                    </InfoField>
                    <InfoField label="Email">{detalle.email || "—"}</InfoField>
                    <InfoField label="Método de pago">
                      {detalle.metodo_pago || "—"}
                    </InfoField>
                    <InfoField label="Tipo de entrega">
                      {detalle.entrega || "—"}
                    </InfoField>
                    <InfoField label="Creado">
                      {fmtDateTime(detalle.fecha_creacion)}
                    </InfoField>
                    {detalle.fecha_envio && (
                      <InfoField label="Enviado">
                        {fmtDateTime(detalle.fecha_envio)}
                      </InfoField>
                    )}
                    {detalle.fecha_entrega && (
                      <InfoField label="Entregado">
                        {fmtDateTime(detalle.fecha_entrega)}
                      </InfoField>
                    )}
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* Productos */}
                <Box>
                  <Heading size="sm" mb={2}>
                    Productos del pedido ({detalle.detalles?.length || 0})
                  </Heading>
                  {detalle.detalles && detalle.detalles.length > 0 ? (
                    <VStack align="stretch" spacing={3}>
                      {detalle.detalles.map((item) => {
                        const img = item.imagen_url
                          ? `${API_BASE_URL}${item.imagen_url}`
                          : "https://via.placeholder.com/80x80?text=Producto";
                        return (
                          <HStack
                            key={`${item.producto_id}-${item.id || item.nombre}`}
                            spacing={3}
                            align="flex-start"
                            border="1px solid"
                            borderColor={border}
                            borderRadius="lg"
                            p={2}
                          >
                            <Box
                              w="64px"
                              h="64px"
                              bg="white"
                              borderRadius="md"
                              border="1px solid"
                              borderColor={border}
                              overflow="hidden"
                              display="grid"
                              placeItems="center"
                            >
                              <Image
                                src={img}
                                alt={item.nombre}
                                maxW="100%"
                                maxH="100%"
                                objectFit="contain"
                                loading="lazy"
                              />
                            </Box>
                            <VStack align="stretch" spacing={1} flex={1}>
                              <Text fontWeight="semibold" noOfLines={2}>
                                {item.nombre}
                              </Text>
                              <HStack justify="space-between" fontSize="sm">
                                <Text color={muted}>
                                  Cantidad: <b>{Number(item.cantidad || 0)}</b>
                                </Text>
                                <Text color={muted}>
                                  P. unitario: <b>{fmtCop(item.precio_unitario)}</b>
                                </Text>
                              </HStack>
                              <Text fontSize="sm">
                                Subtotal: <b>{fmtCop(item.subtotal || 0)}</b>
                              </Text>
                            </VStack>
                          </HStack>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color={muted}>
                      No se encontraron detalles de productos.
                    </Text>
                  )}
                </Box>

                <Divider />

                {/* Totales */}
                <Box>
                  <Heading size="sm" mb={2}>
                    Resumen económico
                  </Heading>
                  <VStack align="stretch" spacing={1} fontSize="sm">
                    <HStack justify="space-between">
                      <Text color={muted}>Subtotal productos</Text>
                      <Text>{fmtCop(subtotalProductos)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color={muted}>Costo de envío</Text>
                      <Text>{fmtCop(detalle.costo_envio)}</Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Total pedido</Text>
                      <Text fontWeight="bold">{fmtCop(detalle.total)}</Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider />

                {/* Acciones de estado */}
                <Box>
                  <Heading size="sm" mb={2}>
                    Gestión de estado
                  </Heading>
                  {renderAccionesEstado()}
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" onClick={cerrarDetalle}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

/* ================== Subcomponentes reutilizables ================== */

function InfoField({ label, children }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  return (
    <Box>
      <Text fontSize="xs" color={subtle}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="medium">
        {children}
      </Text>
    </Box>
  );
}

/* ===== Línea de tiempo simple con animación suave ===== */

const ESTADOS_LINEA = ["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO"];

function EstadoTimeline({ estado }) {
  const subtle = useColorModeValue("gray.500", "gray.400");
  const isCancelado = estado === "CANCELADO";

  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="xs" color={subtle}>
        Progreso del pedido
      </Text>
      <HStack
        spacing={3}
        justify={{ base: "flex-start", md: "flex-end" }}
        flexWrap="wrap"
      >
        {ESTADOS_LINEA.map((st) => {
          const isActive = estado === st;
          const isCompleted =
            ESTADOS_LINEA.indexOf(estado) > ESTADOS_LINEA.indexOf(st);
          return (
            <TimelineStep
              key={st}
              label={estadoLabel(st)}
              isActive={isActive && !isCancelado}
              isCompleted={isCompleted && !isCancelado}
            />
          );
        })}
      </HStack>
      {isCancelado && (
        <Text fontSize="xs" color={subtle}>
          Pedido cancelado: el flujo se detuvo en este estado.
        </Text>
      )}
    </VStack>
  );
}

function TimelineStep({ label, isActive, isCompleted }) {
  const bgActive = useColorModeValue("yellow.400", "yellow.300");
  const bgCompleted = useColorModeValue("green.400", "green.300");
  const bgDefault = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.700", "gray.100");

  const bg = isActive ? bgActive : isCompleted ? bgCompleted : bgDefault;

  return (
    <MotionBox
      initial={{ scale: 0.9, opacity: 0.7 }}
      animate={{
        scale: isActive ? 1.1 : 1,
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <VStack spacing={0.5}>
        <Box
          w="14px"
          h="14px"
          borderRadius="full"
          bg={bg}
          border="2px solid"
          borderColor={bg}
        />
        <Text fontSize="xs" color={textColor}>
          {label}
        </Text>
      </VStack>
    </MotionBox>
  );
}
