// src/pages/empresa/MisPedidosEmpresa.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  Badge,
  HStack,
  VStack,
  Button,
  IconButton,
  Skeleton,
  SkeletonText,
  useToast,
  Divider,
  SimpleGrid,
  Image,
  Tooltip,
  Select,
  Input,
  useDisclosure,
  Stack,
  Icon,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import {
  FiEye,
  FiRefreshCw,
  FiArrowRight,
  FiTag,
  FiArrowDown,
  FiArrowUp,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

const MotionBox = motion(Box);
const MotionGrid = motion(SimpleGrid);

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// Badge de estado alineado a tus ESTADOS_VALIDOS:
// PENDIENTE, CONFIRMADO, ENVIADO, ENTREGADO, CANCELADO
const EstadoBadge = ({ estado }) => {
  const map = {
    PENDIENTE: "yellow",
    CONFIRMADO: "purple",
    ENVIADO: "blue",
    ENTREGADO: "green",
    CANCELADO: "red",
  };
  return (
    <Badge
      colorScheme={map[estado] || "gray"}
      variant="subtle"
      fontSize="0.75rem"
      px={2}
      py={0.5}
    >
      {estado}
    </Badge>
  );
};

// Orden de secciones
const SECTION_ORDER = [
  "PENDIENTE",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

const SECTION_LABEL = {
  PENDIENTE: "Pendientes por gestionar",
  CONFIRMADO: "Confirmados / en preparación",
  ENVIADO: "En camino",
  ENTREGADO: "Entregados",
  CANCELADO: "Cancelados",
};

export default function MisPedidosEmpresa() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Hook para leer URL params

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [det, setDet] = useState(null);
  const [detLoading, setDetLoading] = useState(false);
  const initialFocusRef = useRef(null);

  // Estados de lista
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDesc, setSortDesc] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState({
    PENDIENTE: true,
    CONFIRMADO: true,
  });

  // Temas
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accent = useColorModeValue("yellow.500", "yellow.300");
  const stickyBg = useColorModeValue(
    "rgba(255,255,255,0.92)",
    "rgba(26,32,44,0.92)"
  );
  const sectionHoverBg = useColorModeValue("gray.50", "gray.700");
  const cardItemBg = useColorModeValue("gray.50", "gray.700");

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Cargar pedidos del usuario (empresa/contratista)
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/pedidos/mios");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        title: "Error al cargar pedidos",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Función para abrir detalle
  const openDetalle = async (pedidoId) => {
    setDet(null);
    setDetLoading(true);
    onOpen();
    try {
      const { data } = await api.get(`/pedidos/${pedidoId}/mio`);
      setDet(data);
    } catch (e) {
      toast({
        title: "No se pudo cargar el detalle",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
      onClose();
    } finally {
      setDetLoading(false);
    }
  };

  // Efecto: si venimos de Checkout con ?pedido=ID, abrimos el modal automáticamente
  useEffect(() => {
    const pedidoParam = searchParams.get("pedido");
    if (pedidoParam && !loading && rows.length > 0) {
      // Intentamos abrir el modal
      openDetalle(pedidoParam);
      
      // Limpiamos el query param para que al recargar no se reabra forzosamente
      setSearchParams({}, { replace: true });
      
      toast({
        title: "¡Pedido creado exitosamente!",
        status: "success",
        duration: 3000,
        position: "top",
        isClosable: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, rows]); // Se ejecuta cuando termina de cargar la lista

  // Filtros + búsqueda + agrupación
  const { pinned, groups, totalCount } = useMemo(() => {
    let list = rows.slice();

    // Búsqueda por ID de pedido
    if (searchTerm) {
      list = list.filter((r) => String(r.id).includes(searchTerm));
    }

    // Filtros
    if (estadoFilter) list = list.filter((r) => r.estado === estadoFilter);
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      list = list.filter((r) => new Date(r.fecha_creacion) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      list = list.filter((r) => new Date(r.fecha_creacion) <= to);
    }

    // Orden por fecha
    list.sort((a, b) => {
      const diff =
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      return sortDesc ? diff : -diff;
    });

    const pinnedItem = list[0] || null;

    // Agrupar por estado
    const byEstado = {};
    SECTION_ORDER.forEach((e) => (byEstado[e] = []));
    list.forEach((r) => {
      if (!byEstado[r.estado]) byEstado[r.estado] = [];
      byEstado[r.estado].push(r);
    });

    return {
      pinned: pinnedItem,
      groups: byEstado,
      totalCount: list.length,
    };
  }, [rows, estadoFilter, dateFrom, dateTo, sortDesc, searchTerm]);

  // Animaciones
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const toggleSection = (estado) => {
    setOpenSections((prev) => ({
      ...prev,
      [estado]: !prev[estado],
    }));
  };

  const goToCatalogo = () => {
    navigate("/empresa/catalogo");
  };

  return (
    <Box bg={bgPage} minH="100vh" pb={10}>
      {/* Header fijo */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg={stickyBg}
        backdropFilter="blur(12px)"
        borderBottom="1px solid"
        borderColor={borderColor}
        py={3}
        px={{ base: 3, md: 6, lg: 10 }}
      >
        <HStack
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={3}
        >
          <VStack align="start" spacing={0}>
            <Heading
              size={{ base: "md", md: "lg" }}
              color={useColorModeValue("gray.800", "white")}
            >
              Mis pedidos (Empresa)
            </Heading>
            <Text fontSize="sm" color={muted}>
              {totalCount} pedido{totalCount !== 1 ? "s" : ""} en total
            </Text>
          </VStack>

          <HStack spacing={2}>
            <Tooltip label="Recargar" hasArrow>
              <IconButton
                icon={<FiRefreshCw />}
                onClick={load}
                size="sm"
                variant="ghost"
                aria-label="Recargar pedidos"
              />
            </Tooltip>
            <Button
              size="sm"
              onClick={goToCatalogo}
              colorScheme="yellow"
              color="gray.800"
              rightIcon={<FiArrowRight />}
            >
              Ir al catálogo
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Filtros compactos */}
      <Box px={{ base: 3, md: 6, lg: 10 }} py={3}>
        <Stack
          direction={{ base: "column", sm: "row" }}
          spacing={3}
          bg={cardBg}
          p={3}
          borderRadius="xl"
          border="1px solid"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <HStack flex={1} minW={0}>
            <Icon as={FiSearch} color={muted} />
            <Input
              placeholder="Buscar por #ID de pedido"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value.replace(/\D/g, ""))
              }
              size="sm"
              variant="filled"
              bg="transparent"
              _focus={{ bg: "transparent", borderColor: accent }}
            />
          </HStack>

          <Select
            size="sm"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            maxW="160px"
          >
            <option value="">Todos los estados</option>
            {SECTION_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Input
            type="date"
            size="sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            maxW="150px"
          />
          <Input
            type="date"
            size="sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            maxW="150px"
          />

          <Tooltip
            label={
              sortDesc
                ? "Más recientes primero"
                : "Más antiguos primero"
            }
          >
            <IconButton
              icon={sortDesc ? <FiArrowDown /> : <FiArrowUp />}
              onClick={() => setSortDesc((s) => !s)}
              size="sm"
              variant="ghost"
              aria-label="Ordenar por fecha"
            />
          </Tooltip>
        </Stack>
      </Box>

      {/* Contenido principal */}
      <Box px={{ base: 3, md: 6, lg: 10 }}>
        {loading ? (
          <Stack spacing={4}>
            <Skeleton height="140px" borderRadius="xl" />
            <Skeleton height="100px" borderRadius="lg" />
          </Stack>
        ) : totalCount === 0 ? (
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            textAlign="center"
            py={16}
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="md"
            border="1px solid"
            borderColor={borderColor}
          >
            <Heading size="lg" mb={2}>
              Aún no tienes pedidos
            </Heading>
            <Text color={muted} mb={6}>
              Crea tus primeros pedidos desde el catálogo de FerreExpress.
            </Text>
            <Button
              colorScheme="yellow"
              size="lg"
              onClick={goToCatalogo}
              rightIcon={<FiArrowRight />}
            >
              Ir al catálogo
            </Button>
          </MotionBox>
        ) : (
          <VStack spacing={6} align="stretch">
            {/* Pedido más reciente destacado */}
            {pinned && (
              <MotionBox
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                bg={cardBg}
                borderRadius="2xl"
                p={{ base: 4, md: 5 }}
                border="2px solid"
                borderColor={accent}
                boxShadow="lg"
                position="relative"
                overflow="hidden"
              >
                <Box position="absolute" top={2} right={2}>
                  <Badge
                    colorScheme="yellow"
                    variant="solid"
                    fontSize="xs"
                  >
                    Más reciente
                  </Badge>
                </Box>

                <HStack
                  justify="space-between"
                  mb={3}
                  flexWrap="wrap"
                  gap={2}
                >
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color={muted}>
                      Pedido empresa
                    </Text>
                    <Text fontWeight="bold" fontSize="xl">
                      #{pinned.id}
                    </Text>
                  </VStack>
                  <EstadoBadge estado={pinned.estado} />
                </HStack>

                <SimpleGrid
                  columns={{ base: 1, sm: 2 }}
                  spacing={3}
                  fontSize="sm"
                >
                  <HStack>
                    <Text color={muted}>Fecha:</Text>
                    <Text>
                      {new Date(
                        pinned.fecha_creacion
                      ).toLocaleDateString()}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text color={muted}>Hora:</Text>
                    <Text>
                      {new Date(
                        pinned.fecha_creacion
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </HStack>
                  <HStack>
                    <Text color={muted}>Método:</Text>
                    <Text fontWeight="medium">
                      {pinned.metodo_pago}
                    </Text>
                  </HStack>
                  <HStack
                    justify="flex-end"
                    fontWeight="bold"
                    fontSize="lg"
                  >
                    <Text>Total:</Text>
                    <Text color={accent}>{fmtCop(pinned.total)}</Text>
                  </HStack>
                </SimpleGrid>

                <HStack justify="flex-end" mt={4}>
                  <Button
                    size="sm"
                    leftIcon={<FiEye />}
                    onClick={() => openDetalle(pinned.id)}
                  >
                    Ver detalle
                  </Button>
                </HStack>
              </MotionBox>
            )}

            {/* Secciones colapsables por estado */}
            <MotionBox
              variants={container}
              initial="hidden"
              animate="show"
            >
              {SECTION_ORDER.map((estado) => {
                const items = groups[estado] || [];
                if (items.length === 0) return null;
                const isOpen = openSections[estado] ?? false;

                return (
                  <MotionBox key={estado} variants={item}>
                    <Box
                      bg={cardBg}
                      borderRadius="xl"
                      overflow="hidden"
                      border="1px solid"
                      borderColor={borderColor}
                      boxShadow="sm"
                    >
                      {/* Header de sección */}
                      <HStack
                        align="center"
                        p={3}
                        cursor="pointer"
                        _hover={{ bg: sectionHoverBg }}
                        transition="0.2s"
                        onClick={() => toggleSection(estado)}
                        userSelect="none"
                      >
                        <HStack flex={1} spacing={3}>
                          <Icon as={FiTag} />
                          <Heading size="sm">
                            {SECTION_LABEL[estado]}
                          </Heading>
                          <Badge
                            ml={2}
                            colorScheme={
                              estado === "PENDIENTE"
                                ? "yellow"
                                : estado === "CONFIRMADO"
                                ? "purple"
                                : estado === "ENVIADO"
                                ? "blue"
                                : estado === "ENTREGADO"
                                ? "green"
                                : "red"
                            }
                          >
                            {items.length}
                          </Badge>
                        </HStack>
                        <Icon
                          as={isOpen ? FiChevronUp : FiChevronDown}
                        />
                      </HStack>

                      <Box
                        as={motion.div}
                        initial={false}
                        animate={{
                          height: isOpen ? "auto" : 0,
                          opacity: isOpen ? 1 : 0,
                        }}
                        style={{
                          overflow: "hidden",
                          borderTop: isOpen
                            ? `1px solid ${borderColor}`
                            : "none",
                        }}
                      >
                        {isOpen && (
                          <Box p={3}>
                            <MotionGrid
                              columns={{
                                base: 1,
                                md: 2,
                                xl: 3,
                              }}
                              spacing={3}
                              variants={container}
                              initial="hidden"
                              animate="show"
                            >
                              {items.map((r) => (
                                <MotionBox
                                  key={r.id}
                                  variants={item}
                                  whileHover={{ y: -2 }}
                                  transition={{ duration: 0.2 }}
                                  bg={cardItemBg}
                                  p={3}
                                  borderRadius="lg"
                                  cursor="pointer"
                                  onClick={() => openDetalle(r.id)}
                                  _hover={{ shadow: "md" }}
                                >
                                  <HStack
                                    justify="space-between"
                                    mb={2}
                                  >
                                    <Text
                                      fontWeight="bold"
                                      fontSize="sm"
                                    >
                                      #{r.id}
                                    </Text>
                                    <EstadoBadge
                                      estado={r.estado}
                                    />
                                  </HStack>
                                  <Text
                                    fontSize="xs"
                                    color={muted}
                                    mb={2}
                                  >
                                    {new Date(
                                      r.fecha_creacion
                                    ).toLocaleDateString()}{" "}
                                    •{" "}
                                    {new Date(
                                      r.fecha_creacion
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </Text>
                                  <HStack
                                    justify="space-between"
                                    fontSize="sm"
                                  >
                                    <Text color={muted}>Total</Text>
                                    <Text fontWeight="bold">
                                      {fmtCop(r.total)}
                                    </Text>
                                  </HStack>
                                </MotionBox>
                              ))}
                            </MotionGrid>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </MotionBox>
                );
              })}
            </MotionBox>
          </VStack>
        )}
      </Box>

      {/* MODAL DETALLE */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={isMobile ? "full" : "xl"}
        isCentered
        motionPreset="slideInBottom"
        initialFocusRef={initialFocusRef}
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius={isMobile ? "none" : "2xl"}
          m={isMobile ? 0 : 4}
        >
          <ModalHeader>Detalle del pedido (Empresa)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AnimatePresence mode="wait">
              {detLoading ? (
                <MotionBox
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Stack spacing={3}>
                    <Skeleton height="20px" />
                    <Skeleton height="16px" />
                    <Skeleton height="100px" borderRadius="lg" />
                    <SkeletonText noOfLines={4} mt={4} />
                  </Stack>
                </MotionBox>
              ) : det ? (
                <MotionBox
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <VStack align="stretch" spacing={4}>
                    {/* Cabecera resumen */}
                    <Box
                      p={4}
                      bg={cardBg}
                      borderRadius="lg"
                      border="1px dashed"
                      borderColor={borderColor}
                    >
                      <SimpleGrid
                        columns={2}
                        spacingY={2}
                        fontSize="sm"
                      >
                        <Text color={muted}>ID</Text>
                        <Text fontWeight="bold">#{det.id}</Text>

                        <Text color={muted}>Fecha</Text>
                        <Text>
                          {new Date(
                            det.fecha_creacion
                          ).toLocaleString()}
                        </Text>

                        <Text color={muted}>Estado</Text>
                        <EstadoBadge estado={det.estado} />

                        <Text color={muted}>Método de pago</Text>
                        <Text>{det.metodo_pago}</Text>

                        <Text color={muted}>Entrega</Text>
                        <Text>{det.entrega || "—"}</Text>

                        <Text color={muted}>Costo envío</Text>
                        <Text>{fmtCop(det.costo_envio)}</Text>
                      </SimpleGrid>

                      <Divider my={3} />

                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg">
                          Total
                        </Text>
                        <Text
                          fontWeight="bold"
                          fontSize="lg"
                          color={accent}
                        >
                          {fmtCop(det.total)}
                        </Text>
                      </HStack>
                    </Box>

                    {/* Productos */}
                    <Box>
                      <Heading size="sm" mb={3}>
                        Productos del pedido
                      </Heading>
                      <VStack align="stretch" spacing={3}>
                        {det.detalles?.map((d, i) => {
                          const src = d.imagen_url
                            ? String(d.imagen_url).startsWith(
                                "http"
                              )
                              ? d.imagen_url
                              : `${API_BASE_URL}${d.imagen_url}`
                            : "https://via.placeholder.com/300x200?text=Sin+Imagen";
                          return (
                            <HStack
                              key={`${d.producto_id}-${i}`}
                              align="center"
                              p={3}
                              bg={cardBg}
                              borderRadius="lg"
                              border="1px solid"
                              borderColor={borderColor}
                            >
                              <Image
                                src={src}
                                alt={d.nombre}
                                boxSize="60px"
                                objectFit="contain"
                                borderRadius="md"
                                bg="white"
                                p={1}
                                border="1px solid"
                                borderColor={borderColor}
                              />
                              <VStack
                                align="start"
                                flex={1}
                                spacing={0}
                                minW={0}
                              >
                                <Text
                                  fontWeight="semibold"
                                  noOfLines={1}
                                >
                                  {d.nombre}
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color={muted}
                                >
                                  {fmtCop(
                                    d.precio_unitario
                                  )}{" "}
                                  c/u × {d.cantidad}
                                </Text>
                              </VStack>
                              <Text fontWeight="bold">
                                {fmtCop(d.subtotal)}
                              </Text>
                            </HStack>
                          );
                        })}
                      </VStack>
                    </Box>
                  </VStack>
                </MotionBox>
              ) : null}
            </AnimatePresence>
          </ModalBody>
          <ModalFooter>
            <HStack w="full" justify="space-between">
              <Button
                ref={initialFocusRef}
                variant="ghost"
                onClick={onClose}
              >
                Cerrar
              </Button>
              <HStack>
                <Button
                  rightIcon={<FiArrowRight />}
                  onClick={() => {
                    onClose();
                    navigate("/empresa");
                  }}
                >
                  Seguir comprando para la empresa
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}