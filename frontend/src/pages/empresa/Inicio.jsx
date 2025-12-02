import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tooltip,
  Tag,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInfo,
  FiPercent,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
  FiPlus,
  FiTrash2,
  FiSearch,
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import PromoHeroFadeBanner from "../public/PromoHeroFadeBanner";

const MotionBox = (props) => (
  <Box
    as={motion.div}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    {...props}
  />
);

const ferreYellow = "#F9BF20";

function formatCurrency(value) {
  const num = Number(value || 0);
  return num.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function diffInDays(fechaIso) {
  if (!fechaIso) return null;
  const hoy = new Date();
  const fecha = new Date(fechaIso);
  const msDiff = fecha.getTime() - hoy.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

/* =========================================================================
   SUBCOMPONENTE: Cotizador rápido – protagonista, tabla horizontal tipo “Excel”
   ========================================================================= */
function CotizadorRapido({ onCotizacionCreada }) {
  const toast = useToast();
  const navigate = useNavigate();

  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [items, setItems] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [creando, setCreando] = useState(false);
  const [ultimoResumen, setUltimoResumen] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const theadBg = useColorModeValue("gray.50", "gray.700");
  const zebraBg = useColorModeValue("gray.50", "gray.900");
  const successBg = useColorModeValue("green.50", "green.900");
  const successBorderColor = useColorModeValue("green.200", "green.600");
  const successTextColor = useColorModeValue("green.800", "green.100");
  const successIconBg = useColorModeValue("green.500", "green.400");
  const successIconColor = useColorModeValue("white", "gray.900");
  const searchContainerBg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    let cancelado = false;

    const fetchCatalogo = async () => {
      try {
        setLoadingCatalogo(true);
        const res = await api.get("/productos", {
          params: { page: 1, limit: 50, sort: "nombre", order: "asc" },
        });
        if (!cancelado) {
          setProductosCatalogo(res.data?.productos || []);
        }
      } catch (err) {
        if (!cancelado) {
          console.error("Error cargando catálogo para cotizador rápido", err);
          toast({
            title: "No se pudo cargar el catálogo",
            description: "Intenta recargar la página en unos minutos.",
            status: "error",
            duration: 6000,
            isClosable: true,
          });
        }
      } finally {
        if (!cancelado) setLoadingCatalogo(false);
      }
    };

    fetchCatalogo();
    return () => {
      cancelado = true;
    };
  }, [toast]);

  // 🔎 Filtro por texto (reconocimiento > memoria)
  const productosFiltrados = useMemo(() => {
    if (!searchTerm) return productosCatalogo;
    const term = searchTerm.toLowerCase();
    return productosCatalogo.filter((p) => {
      const nombre = p.nombre?.toLowerCase() || "";
      const sku = p.sku?.toLowerCase() || "";
      const codigo = p.codigo?.toLowerCase() || "";
      return (
        nombre.includes(term) ||
        sku.includes(term) ||
        codigo.includes(term)
      );
    });
  }, [productosCatalogo, searchTerm]);

  const handleAgregarItem = () => {
    if (!productoSeleccionado) {
      toast({
        title: "Selecciona un producto",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    const qty = Number(cantidad || 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser un entero positivo.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    const producto = productosCatalogo.find(
      (p) => String(p.id) === String(productoSeleccionado)
    );
    if (!producto) {
      toast({
        title: "Producto no encontrado",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    setItems((prev) => {
      const existing = prev.find(
        (i) => String(i.producto_id) === String(producto.id)
      );
      if (existing) {
        return prev.map((i) =>
          String(i.producto_id) === String(producto.id)
            ? { ...i, cantidad: i.cantidad + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio_unitario: Number(producto.precio),
          cantidad: qty,
        },
      ];
    });

    setCantidad(1);
    setProductoSeleccionado("");
  };

  const handleQuitarItem = (producto_id) => {
    setItems((prev) =>
      prev.filter((i) => String(i.producto_id) !== String(producto_id))
    );
  };

  const handleCambiarCantidad = (producto_id, nuevaCantidad) => {
    const qty = Number(nuevaCantidad || 0);
    if (!Number.isFinite(qty) || qty <= 0) return;
    setItems((prev) =>
      prev.map((i) =>
        String(i.producto_id) === String(producto_id)
          ? { ...i, cantidad: qty }
          : i
      )
    );
  };

  const totalBrutoLocal = useMemo(
    () =>
      items.reduce(
        (acc, item) =>
          acc + Number(item.precio_unitario) * Number(item.cantidad),
        0
      ),
    [items]
  );

  const handleCrearCotizacion = async () => {
    if (items.length === 0) {
      toast({
        title: "No hay productos en la cotización",
        description: "Agrega al menos un producto para cotizar.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    try {
      setCreando(true);
      setUltimoResumen(null);

      const payload = {
        productos: items.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
        })),
      };

      const res = await api.post("/cotizaciones", payload);

      setUltimoResumen(res.data);
      onCotizacionCreada?.(res.data);

      toast({
        title: "Cotización creada",
        description: `Total con IVA: ${formatCurrency(
          res.data.total
        )}${
          res.data.descuento
            ? ` · Ahorro por descuentos: ${formatCurrency(
                res.data.descuento
              )}`
            : ""
        }`,
        status: "success",
        duration: 6000,
        isClosable: true,
      });

      setItems([]);
    } catch (err) {
      console.error("Error al crear cotización rápida", err);
      const msg =
        err.response?.data?.error ||
        "No se pudo crear la cotización. Intenta de nuevo.";
      toast({
        title: "Error al crear cotización",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setCreando(false);
    }
  };

  const ultimaId = ultimoResumen?.cotizacion_id || ultimoResumen?.id || null;

  return (
    <MotionBox
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      rounded="2xl"
      p={{ base: 5, md: 6 }}
      shadow="xl"
      _hover={{ shadow: "2xl", transform: "translateY(-4px)" }}
      transition="all 0.25s ease-out"
    >
      {/* Header del módulo de cotización */}
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        mb={4}
        gap={4}
      >
        <VStack align="flex-start" spacing={2}>
          <HStack spacing={3}>
            <Badge
              px={3}
              py={1}
              rounded="full"
              colorScheme="yellow"
              variant="solid"
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              Nueva cotización
            </Badge>
            {items.length > 0 && (
              <Tag size="sm" variant="subtle" colorScheme="gray" rounded="full">
                {items.length} ítem(s) · {formatCurrency(totalBrutoLocal)}
              </Tag>
            )}
          </HStack>
          <Heading size="lg">Arma tu cotización</Heading>
          <Text fontSize="sm" color={muted} maxW="2xl">
            Selecciona productos, ajusta cantidades y genera tu cotización
            formal con descuentos B2B para tu obra.
          </Text>
        </VStack>

        <Tooltip label="Recargar catálogo" hasArrow>
          <IconButton
            aria-label="Recargar catálogo"
            icon={<FiRefreshCw />}
            size="md"
            variant="ghost"
            rounded="full"
            border="1px solid"
            borderColor={borderColor}
            onClick={async () => {
              try {
                setLoadingCatalogo(true);
                const res = await api.get("/productos", {
                  params: {
                    page: 1,
                    limit: 50,
                    sort: "nombre",
                    order: "asc",
                  },
                });
                setProductosCatalogo(res.data?.productos || []);
              } catch (error) {
                console.error("Error recargando catálogo", error);
                toast({
                  title: "No se pudo recargar el catálogo",
                  status: "error",
                  duration: 4000,
                  isClosable: true,
                });
              } finally {
                setLoadingCatalogo(false);
              }
            }}
          />
        </Tooltip>
      </Flex>

      {/* Feedback visual de éxito al crear cotización */}
      {ultimoResumen && (
        <MotionBox
          mt={2}
          mb={4}
          w="100%"
          border="1px solid"
          borderColor={successBorderColor}
          bg={successBg}
          rounded="2xl"
          p={{ base: 4, md: 5 }}
        >
          <HStack align="flex-start" spacing={4}>
            <Flex
              align="center"
              justify="center"
              rounded="full"
              bg={successIconBg}
              color={successIconColor}
              boxSize={{ base: "48px", md: "56px" }}
              flexShrink={0}
            >
              <FiCheckCircle size={28} />
            </Flex>
            <VStack align="flex-start" spacing={1} flex="1">
              <Heading size="sm" color={successTextColor}>
                ¡Cotización creada correctamente!
              </Heading>
              <Text fontSize="sm" color={successTextColor}>
                Total con IVA:{" "}
                <Box as="span" fontWeight="semibold">
                  {formatCurrency(ultimoResumen.total)}
                </Box>
                {ultimoResumen.descuento > 0 && (
                  <>
                    {" "}
                    · Ahorro:{" "}
                    <Box as="span" fontWeight="semibold">
                      {formatCurrency(ultimoResumen.descuento)}
                    </Box>
                  </>
                )}
              </Text>
              {ultimaId && (
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  rightIcon={<FiArrowRight />}
                  onClick={() =>
                    navigate(
                      `/empresa/cotizaciones?cotizacionId=${ultimaId}`
                    )
                  }
                  w={{ base: "100%", md: "auto" }}
                >
                  Ver detalle de la cotización
                </Button>
              )}
            </VStack>
          </HStack>
        </MotionBox>
      )}

      <Stack spacing={6}>
        {/* PASO 1: Buscar producto + elegir + cantidad */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color={muted}
            >
              Paso 1 · Busca y añade productos
            </Text>
            <Kbd fontSize="xs">Ctrl + F</Kbd>
          </HStack>

          <Flex
            direction={{ base: "column", md: "row" }}
            gap={4}
            align={{ base: "stretch", md: "flex-end" }}
          >
            <Box flex={{ base: "1", md: "3" }}>
              <Box
                border="1px solid"
                borderColor={borderColor}
                rounded="2xl"
                p={3}
                bg={searchContainerBg}
              >
                <InputGroup size="md" mb={3}>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch size={16} />
                  </InputLeftElement>
                  <Input
                    placeholder="Nombre, referencia o código del producto…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Buscar producto para cotizar"
                    rounded="xl"
                    border="1px solid"
                    borderColor={borderColor}
                    bg={cardBg}
                    _focus={{
                      borderColor: ferreYellow,
                      boxShadow: `0 0 0 1px ${ferreYellow}`,
                    }}
                  />
                </InputGroup>

                {loadingCatalogo ? (
                  <Skeleton h="44px" rounded="xl" />
                ) : productosCatalogo.length === 0 ? (
                  <Box p={3}>
                    <Text fontSize="xs" color={muted}>
                      No hay productos activos en el catálogo.
                    </Text>
                  </Box>
                ) : productosFiltrados.length === 0 ? (
                  <Box p={3}>
                    <Text fontSize="xs" color={muted}>
                      Sin resultados para la búsqueda actual.
                    </Text>
                  </Box>
                ) : (
                  <Box
                    mt={1}
                    maxH="260px"
                    overflowY="auto"
                    border="1px solid"
                    borderColor={borderColor}
                    rounded="xl"
                    bg={cardBg}
                    shadow="lg"
                  >
                    {productosFiltrados.slice(0, 12).map((p) => (
                      <HStack
                        key={p.id}
                        px={3}
                        py={2}
                        spacing={3}
                        cursor="pointer"
                        _hover={{
                          bg: useColorModeValue("gray.50", "gray.700"),
                        }}
                        onClick={() => {
                          setProductoSeleccionado(String(p.id));
                          setSearchTerm(p.nombre || "");
                        }}
                      >
                        <Box flex="1">
                          <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                            {p.nombre}
                          </Text>
                          <Text fontSize="xs" color={muted}>
                            {p.sku || p.codigo || "Sin referencia"} ·{" "}
                            {formatCurrency(p.precio)}
                          </Text>
                        </Box>
                        <Tag
                          size="sm"
                          colorScheme="yellow"
                          variant="subtle"
                          rounded="full"
                        >
                          Seleccionar
                        </Tag>
                      </HStack>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            <Box flex={{ base: "1", md: "1" }}>
              <Text fontSize="xs" color={muted} mb={1}>
                Cantidad
              </Text>
              <NumberInput
                size="md"
                min={1}
                value={cantidad}
                onChange={(_, v) => setCantidad(Number.isFinite(v) ? v : 1)}
              >
                <NumberInputField rounded="xl" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>

            <Box flex={{ base: "1", md: "1" }}>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="yellow"
                variant="solid"
                size="md"
                w="full"
                rounded="xl"
                onClick={handleAgregarItem}
                isDisabled={loadingCatalogo || !productosCatalogo.length}
              >
                Agregar a la tabla
              </Button>
            </Box>
          </Flex>
        </Box>

        {/* PASO 2: Tabla horizontal tipo Excel */}
        <Box>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.08em"
            color={muted}
            mb={2}
          >
            Paso 2 · Revisa cantidades y totales
          </Text>
          <Box
            border="1px solid"
            borderColor={borderColor}
            rounded="2xl"
            overflowX="auto"
          >
            {items.length === 0 ? (
              <Box p={5}>
                <Text fontSize="sm" color={muted}>
                  Usa el buscador para encontrar un producto y pulsa{" "}
                  <Kbd>Agregar a la tabla</Kbd>.
                </Text>
              </Box>
            ) : (
              <Table size="md">
                <Thead bg={theadBg}>
                  <Tr>
                    <Th w="40%">Producto</Th>
                    <Th isNumeric>Cantidad</Th>
                    <Th isNumeric>Precio unit.</Th>
                    <Th isNumeric>Subtotal</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((item) => {
                    const subtotal =
                      Number(item.precio_unitario) * Number(item.cantidad);
                    return (
                      <Tr
                        key={item.producto_id}
                        _hover={{ bg: zebraBg }}
                        transition="background-color 0.15s ease-out"
                      >
                        <Td maxW="320px">
                          <Text noOfLines={2} fontSize="sm">
                            {item.nombre}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          <NumberInput
                            size="sm"
                            min={1}
                            value={item.cantidad}
                            onChange={(_, v) =>
                              handleCambiarCantidad(item.producto_id, v)
                            }
                            maxW="100px"
                            ml="auto"
                          >
                            <NumberInputField rounded="lg" />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Td>
                        <Td isNumeric fontSize="sm">
                          {formatCurrency(item.precio_unitario)}
                        </Td>
                        <Td isNumeric fontSize="sm">
                          {formatCurrency(subtotal)}
                        </Td>
                        <Td textAlign="right">
                          <Tooltip label="Quitar producto" hasArrow>
                            <IconButton
                              aria-label="Quitar"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              rounded="full"
                              onClick={() =>
                                handleQuitarItem(item.producto_id)
                              }
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    );
                  })}
                  <Tr bg="yellow.50" _dark={{ bg: "yellow.900/30" }}>
                    <Td colSpan={3}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Total estimado (antes de descuentos B2B e impuestos)
                      </Text>
                    </Td>
                    <Td isNumeric fontWeight="semibold">
                      {formatCurrency(totalBrutoLocal)}
                    </Td>
                    <Td />
                  </Tr>
                </Tbody>
              </Table>
            )}
          </Box>
        </Box>

        {/* PASO 3: Acciones y resumen de última cotización creada */}
        <Flex
          mt={1}
          pt={2}
          direction={{ base: "column", md: "row" }}
          gap={4}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
        >
          <HStack spacing={3} flexWrap="wrap">
            <Button
              colorScheme="yellow"
              leftIcon={<FiFileText />}
              onClick={handleCrearCotizacion}
              isLoading={creando}
              loadingText="Creando cotización..."
              size="lg"
              w={{ base: "100%", md: "auto" }}
              rounded="full"
            >
              Generar cotización formal
            </Button>

            <Button
              size="sm"
              variant="outline"
              rounded="full"
              onClick={() => navigate("/empresa/cotizaciones")}
            >
              Ver mis cotizaciones
            </Button>

            {items.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setItems([])}
                rounded="full"
              >
                Limpiar tabla
              </Button>
            )}
          </HStack>

          {ultimoResumen && (
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              align={{ base: "flex-start", md: "center" }}
              flexWrap="wrap"
              border="1px solid"
              borderColor={borderColor}
              rounded="2xl"
              p={3}
              bg={useColorModeValue("gray.50", "gray.900")}
            >
              <HStack spacing={2}>
                <Badge colorScheme="green" variant="subtle" rounded="full">
                  Cotización #{ultimaId}
                </Badge>
                <Tag
                  size="sm"
                  colorScheme="blue"
                  variant="subtle"
                  rounded="full"
                >
                  {ultimoResumen.estado_gestion || "INICIAL"} ·{" "}
                  {ultimoResumen.estado_vigencia || "VIGENTE"}
                </Tag>
              </HStack>

              <VStack
                align="flex-start"
                spacing={1}
                fontSize="sm"
                color={muted}
              >
                <Text>
                  Total:{" "}
                  <Box as="span" fontWeight="semibold">
                    {formatCurrency(ultimoResumen.total)}
                  </Box>
                </Text>
                {ultimoResumen.descuento > 0 && (
                  <HStack spacing={1}>
                    <FiPercent size={14} />
                    <Text>
                      Ahorro:{" "}
                      <Box as="span" fontWeight="semibold" color="green.400">
                        {formatCurrency(ultimoResumen.descuento)}
                      </Box>
                    </Text>
                  </HStack>
                )}
                {ultimoResumen.fecha_vigencia && (
                  <Text fontSize="xs">
                    Vigente hasta:{" "}
                    <Box as="span" fontWeight="medium">
                      {new Date(
                        ultimoResumen.fecha_vigencia
                      ).toLocaleDateString("es-CO")}
                    </Box>
                  </Text>
                )}
              </VStack>

              {ultimaId && (
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    leftIcon={<FiArrowRight />}
                    onClick={() =>
                      navigate(`/empresa/cotizaciones?cotizacionId=${ultimaId}`)
                    }
                    rounded="full"
                  >
                    Ver detalle
                  </Button>
                </HStack>
              )}
            </Stack>
          )}
        </Flex>
      </Stack>
    </MotionBox>
  );
}

/* =========================================================================
   SUBCOMPONENTE: TipsEmpresa – ahora se muestra ARRIBA del layout principal
   ========================================================================= */
function TipsEmpresa() {
  const muted = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tipBg = useColorModeValue("gray.50", "gray.900");

  return (
    <MotionBox
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      rounded="2xl"
      p={{ base: 4, md: 6 }}
      shadow="lg"
    >
      <HStack mb={4} spacing={3} align="flex-start">
        <Box
          rounded="full"
          bg={useColorModeValue("gray.100", "gray.700")}
          p={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <FiInfo size={20} />
        </Box>
        <VStack align="flex-start" spacing={1}>
          <Heading size="md">Tips rápidos para usar este inicio</Heading>
          <Text fontSize="sm" color={muted} maxW="3xl">
            En tres pasos: revisa estos tips, arma tu cotización en la tabla y
            haz seguimiento a vigencias y pedidos desde los paneles laterales.
          </Text>
        </VStack>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <VStack
          align="flex-start"
          spacing={2}
          p={3}
          rounded="xl"
          border="1px solid"
          borderColor={borderColor}
          bg={tipBg}
        >
          <HStack spacing={2}>
            <FiPercent size={22} />
            <Text fontWeight="semibold" fontSize="sm">
              Descuentos por volumen
            </Text>
          </HStack>
          <Text fontSize="xs" color={muted}>
            Agrupa materiales por obra para maximizar el descuento B2B en una
            sola cotización.
          </Text>
        </VStack>
        <VStack
          align="flex-start"
          spacing={2}
          p={3}
          rounded="xl"
          border="1px solid"
          borderColor={borderColor}
          bg={tipBg}
        >
          <HStack spacing={2}>
            <FiShoppingBag size={22} />
            <Text fontWeight="semibold" fontSize="sm">
              De cotización a pedido
            </Text>
          </HStack>
          <Text fontSize="xs" color={muted}>
            Convierte a pedido solo cotizaciones <Kbd>ACEPTADA</Kbd> y{" "}
            <Kbd>VIGENTE</Kbd> para evitar reprocesos en obra.
          </Text>
        </VStack>
        <VStack
          align="flex-start"
          spacing={2}
          p={3}
          rounded="xl"
          border="1px solid"
          borderColor={borderColor}
          bg={tipBg}
        >
          <HStack spacing={2}>
            <FiAlertTriangle size={22} />
            <Text fontWeight="semibold" fontSize="sm">
              Flujo de estados
            </Text>
          </HStack>
          <Text fontSize="xs" color={muted}>
            Tus pedidos pasan por PENDIENTE → PAGADO → CONFIRMADO → ENVIADO →
            ENTREGADO. Usa este flujo como checklist.
          </Text>
        </VStack>
      </SimpleGrid>
    </MotionBox>
  );
}

/* =========================================================================
   PÁGINA PRINCIPAL: BeneficiosEmpresa (Inicio Empresa)
   ========================================================================= */
export default function BeneficiosEmpresa() {
  const { user } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);

  const toast = useToast();
  const navigate = useNavigate();

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [cotRes, pedRes] = await Promise.all([
        api.get("/cotizaciones"),
        api.get("/pedidos/mios"),
      ]);

      setCotizaciones(Array.isArray(cotRes.data) ? cotRes.data : []);
      setPedidos(Array.isArray(pedRes.data) ? pedRes.data : []);
    } catch (err) {
      console.error("Error cargando datos", err);
      toast({
        title: "Error al cargar información",
        description: err.response?.data?.error || "Intenta más tarde",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos, reloadFlag]);

  const resumen = useMemo(() => {
    const totalCotizaciones = cotizaciones.length;
    const cotAprobadas = cotizaciones.filter(
      (c) => c.estado_gestion === "ACEPTADA"
    ).length;
    const cotConvertidas = cotizaciones.filter(
      (c) => c.estado_gestion === "CONVERTIDA"
    ).length;
    const cotRechazadas = cotizaciones.filter(
      (c) => c.estado_gestion === "RECHAZADA"
    ).length;
    const vigentes = cotizaciones.filter(
      (c) => c.estado_vigencia === "VIGENTE"
    );
    const vencidas = cotizaciones.filter(
      (c) => c.estado_vigencia === "VENCIDA"
    );

    const cotParaAhorro = cotizaciones.filter((c) =>
      ["ACEPTADA", "CONVERTIDA"].includes(c.estado_gestion)
    );
    const ahorroTotal = cotParaAhorro.reduce(
      (acc, c) => acc + Number(c.descuento || 0),
      0
    );
    const baseAntesDescuento = cotParaAhorro.reduce(
      (acc, c) => acc + (Number(c.total) + Number(c.descuento || 0)),
      0
    );
    const descuentoPromedio =
      baseAntesDescuento > 0 ? (ahorroTotal / baseAntesDescuento) * 100 : 0;

    const proximasAVencer = [...vigentes]
      .sort(
        (a, b) =>
          new Date(a.fecha_vigencia) - new Date(b.fecha_vigencia)
      )
      .slice(0, 3);

    const totalPedidos = pedidos.length;
    const pedidosActivos = pedidos.filter(
      (p) => !["CANCELADO", "ENTREGADO"].includes(p.estado)
    ).length;

    return {
      totalCotizaciones,
      cotAprobadas,
      cotConvertidas,
      cotRechazadas,
      vigentes: vigentes.length,
      vencidas: vencidas.length,
      ahorroTotal,
      descuentoPromedio,
      totalPedidos,
      pedidosActivos,
      proximasAVencer,
    };
  }, [cotizaciones, pedidos]);

  const handleCotizacionCreada = () => {
    setReloadFlag((v) => v + 1);
  };

  return (
    <Box
      bg={bg}
      minH="100vh"
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 8 }}
    >
      <Stack spacing={8} maxW="7xl" mx="auto">
        {/* Header saludo + publicidad arriba (sin saturar) */}
        <MotionBox
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="2xl"
          p={{ base: 5, md: 6 }}
          boxShadow="xl"
        >
          <Flex
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            align="stretch"
            gap={6}
          >
            <Box flex="1">
              <Heading size="xl" mb={2}>
                ¡Hola
                {user
                  ? `, ${user.razon_social || user.nombre || user.email}`
                  : ""}!
              </Heading>
              <Text color={muted} fontSize="md" maxW="3xl">
                Desde aquí puedes crear cotizaciones para tus obras y seguir tus
                pedidos y descuentos como empresa.
              </Text>
              <HStack mt={4} spacing={3} flexWrap="wrap">
                <Button
                  size="lg"
                  colorScheme="yellow"
                  leftIcon={<FiFileText />}
                  onClick={() => {
                    const anchor = document.getElementById(
                      "nueva-cotizacion-anchor"
                    );
                    if (anchor) {
                      anchor.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  w={{ base: "100%", md: "auto" }}
                  rounded="full"
                >
                  Ir a nueva cotización
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  leftIcon={<FiShoppingBag />}
                  onClick={() => navigate("/empresa/catalogo")}
                  w={{ base: "100%", md: "auto" }}
                  rounded="full"
                >
                  Ver catálogo
                </Button>
              </HStack>
            </Box>

            <Box
              flex={{ base: "none", lg: "1" }}
              minW={{ lg: "320px" }}
              borderRadius="2xl"
              overflow="hidden"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="lg"
            >
              <PromoHeroFadeBanner
                images={[
                  "/Publicidad1.png",
                  "/Publicidad2.png",
                  "/publicidad3.jpg",
                  "/Publicidad4.png",
                  "/publicidad5.jpg",
                  "/publicidad6.jpg",
                ]}
                height={{ base: "110px", md: "140px", lg: "150px" }}
              />
            </Box>
          </Flex>
        </MotionBox>

        {/* 🆕 Tips arriba, visibles de una */}
        <TipsEmpresa />

        {/* Grid principal: Cotizador (2/3) + Sidebar de KPIs (1/3) */}
        <SimpleGrid
          columns={{ base: 1, xl: 3 }}
          spacing={8}
          alignItems="flex-start"
        >
          {/* Columna principal: solo Cotizador (ancla) */}
          <Box
            id="nueva-cotizacion-anchor"
            gridColumn={{ base: "span 1", xl: "span 2" }}
          >
            <CotizadorRapido onCotizacionCreada={handleCotizacionCreada} />
          </Box>

          {/* Columna lateral: KPIs resumidos */}
          <Stack
            gridColumn={{ base: "span 1", xl: "span 1" }}
            spacing={6}
          >
            {/* KPIs resumidos – visibilidad de estado sin saturar */}
            <MotionBox>
              {loading ? (
                <SimpleGrid columns={{ base: 1 }} spacing={4}>
                  {[...Array(3)].map((_, i) => (
                    <Box
                      key={i}
                      bg={cardBg}
                      rounded="2xl"
                      border="1px solid"
                      borderColor={borderColor}
                      p={6}
                      shadow="lg"
                    >
                      <Skeleton h="18px" w="40%" mb={3} />
                      <Skeleton h="32px" w="60%" mb={3} />
                      <SkeletonText noOfLines={2} />
                    </Box>
                  ))}
                </SimpleGrid>
              ) : (
                <SimpleGrid columns={{ base: 1 }} spacing={4}>
                  {/* Tarjeta Cotizaciones */}
                  <MotionBox
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    rounded="2xl"
                    p={6}
                    shadow="lg"
                    whileHover={{ y: -4, boxShadow: "xl" }}
                    transition="all 0.2s ease-out"
                  >
                    <HStack justify="space-between" mb={3} align="flex-start">
                      <Stat>
                        <StatLabel fontSize="sm">Cotizaciones</StatLabel>
                        <StatNumber fontSize="2xl">
                          {resumen.totalCotizaciones}
                        </StatNumber>
                        <StatHelpText fontSize="xs">
                          {resumen.cotAprobadas} aceptadas ·{" "}
                          {resumen.cotConvertidas} convertidas
                        </StatHelpText>
                      </Stat>
                      <Box
                        rounded="full"
                        bg={useColorModeValue("yellow.50", "yellow.900")}
                        p={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <FiFileText size={28} />
                      </Box>
                    </HStack>
                    <Divider my={3} />
                    <HStack spacing={2} flexWrap="wrap">
                      <Tag size="sm" colorScheme="green" variant="subtle">
                        Vigentes: {resumen.vigentes}
                      </Tag>
                      <Tag size="sm" colorScheme="red" variant="subtle">
                        Vencidas: {resumen.vencidas}
                      </Tag>
                      {resumen.cotRechazadas > 0 && (
                        <Tag
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                        >
                          Rechazadas: {resumen.cotRechazadas}
                        </Tag>
                      )}
                    </HStack>
                  </MotionBox>

                  {/* Tarjeta Ahorro */}
                  <MotionBox
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    rounded="2xl"
                    p={6}
                    shadow="lg"
                    whileHover={{ y: -4, boxShadow: "xl" }}
                    transition="all 0.2s ease-out"
                  >
                    <HStack justify="space-between" mb={3} align="flex-start">
                      <Stat>
                        <StatLabel fontSize="sm">
                          Ahorro por descuentos
                        </StatLabel>
                        <StatNumber fontSize="2xl">
                          {formatCurrency(resumen.ahorroTotal)}
                        </StatNumber>
                        <StatHelpText fontSize="xs">
                          Promedio: {resumen.descuentoPromedio.toFixed(1)}%
                        </StatHelpText>
                      </Stat>
                      <Box
                        rounded="full"
                        bg={useColorModeValue("green.50", "green.900")}
                        p={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <FiTrendingUp size={28} />
                      </Box>
                    </HStack>
                  </MotionBox>

                  {/* Tarjeta Pedidos */}
                  <MotionBox
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    rounded="2xl"
                    p={6}
                    shadow="lg"
                    whileHover={{ y: -4, boxShadow: "xl" }}
                    transition="all 0.2s ease-out"
                  >
                    <HStack justify="space-between" mb={3} align="flex-start">
                      <Stat>
                        <StatLabel fontSize="sm">Pedidos</StatLabel>
                        <StatNumber fontSize="2xl">
                          {resumen.totalPedidos}
                        </StatNumber>
                        <StatHelpText fontSize="xs">
                          {resumen.pedidosActivos} en curso
                        </StatHelpText>
                      </Stat>
                      <Box
                        rounded="full"
                        bg={useColorModeValue("blue.50", "blue.900")}
                        p={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <FiCheckCircle size={28} />
                      </Box>
                    </HStack>
                  </MotionBox>
                </SimpleGrid>
              )}
            </MotionBox>
          </Stack>
        </SimpleGrid>

        {/* Vigencias próximas – ahora ancho completo como los Tips */}
        <MotionBox
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          rounded="2xl"
          p={6}
          shadow="lg"
        >
          <HStack justify="space-between" mb={3}>
            <HStack spacing={3}>
              <Box
                rounded="full"
                bg={useColorModeValue("orange.50", "orange.900")}
                p={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FiClock size={20} />
              </Box>
              <VStack align="flex-start" spacing={0}>
                <Heading size="sm">Próximas a vencer</Heading>
                <Text fontSize="xs" color={muted}>
                  Controla tus vigencias antes de que expiren.
                </Text>
              </VStack>
            </HStack>
            <IconButton
              aria-label="Actualizar"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              rounded="full"
              onClick={() => setReloadFlag((v) => v + 1)}
            />
          </HStack>

          <Divider my={3} />

          {loading ? (
            <Stack spacing={3}>
              <Skeleton h="18px" />
              <Skeleton h="18px" />
              <Skeleton h="18px" />
            </Stack>
          ) : resumen.proximasAVencer.length === 0 ? (
            <Text fontSize="sm" color={muted}>
              No hay cotizaciones próximas a vencer.
            </Text>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2, xl: 3 }}
              spacing={4}
              mt={1}
            >
              {resumen.proximasAVencer.map((c) => {
                const dias = diffInDays(c.fecha_vigencia);
                let colorScheme = "green";
                if (dias !== null) {
                  if (dias <= 1) colorScheme = "red";
                  else if (dias <= 3) colorScheme = "orange";
                }

                const goToCotizacion = () => {
                  // Redirige a MisCotizaciones con la cotización seleccionada
                  navigate(`/empresa/cotizaciones?cotizacionId=${c.id}`);
                };

                return (
                  <Box
                    key={c.id}
                    border="1px solid"
                    borderColor={borderColor}
                    rounded="xl"
                    p={4}
                    role="button"
                    cursor="pointer"
                    _hover={{
                      shadow: "md",
                      transform: "translateY(-2px)",
                      borderColor: ferreYellow,
                    }}
                    transition="all 0.15s ease-out"
                    onClick={goToCotizacion}
                  >
                    <HStack justify="space-between" align="flex-start">
                      <VStack align="flex-start" spacing={1}>
                        <HStack spacing={2} flexWrap="wrap">
                          <Badge
                            colorScheme="yellow"
                            variant="subtle"
                            rounded="full"
                          >
                            Cotización #{c.id}
                          </Badge>
                          <Tag
                            size="sm"
                            colorScheme="blue"
                            variant="subtle"
                            rounded="full"
                          >
                            {c.estado_gestion} · {c.estado_vigencia}
                          </Tag>
                        </HStack>
                        <Text fontSize="sm">
                          Total:{" "}
                          <Box as="span" fontWeight="semibold">
                            {formatCurrency(c.total)}
                          </Box>
                        </Text>
                        <Text fontSize="xs" color={muted}>
                          Vence{" "}
                          {new Date(
                            c.fecha_vigencia
                          ).toLocaleDateString("es-CO")}
                        </Text>
                      </VStack>
                      <VStack align="flex-end" spacing={2}>
                        <Tag
                          size="sm"
                          colorScheme={colorScheme}
                          variant="solid"
                          rounded="full"
                        >
                          {dias === null
                            ? "Sin fecha"
                            : dias < 0
                            ? "Vencida"
                            : dias === 0
                            ? "Hoy"
                            : `En ${dias} día${dias > 1 ? "s" : ""}`}
                        </Tag>
                        <IconButton
                          icon={<FiArrowRight />}
                          size="xs"
                          variant="ghost"
                          aria-label="Ver cotización"
                          rounded="full"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToCotizacion();
                          }}
                        />
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}

          <Box mt={4} textAlign="right">
            <Button
              size="sm"
              variant="outline"
              rightIcon={<FiArrowRight />}
              rounded="full"
              onClick={() => navigate("/empresa/cotizaciones")}
            >
              Ver todas las cotizaciones
            </Button>
          </Box>
        </MotionBox>
      </Stack>
    </Box>
  );
}
