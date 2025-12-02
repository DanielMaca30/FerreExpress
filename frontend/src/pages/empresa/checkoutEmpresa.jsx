// src/pages/empresa/CheckoutEmpresa.jsx
// Checkout para Empresas / Contratistas
// Flujo: arma un intent y redirige a /empresa/pedido-procesando.

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Input,
  Icon,
  Button,
  Divider,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Badge,
  Radio,
  RadioGroup,
  Stack,
  Skeleton,
  Alert,
  AlertIcon,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Checkbox,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Select,
} from "@chakra-ui/react";
import { FiCreditCard, FiTruck, FiCheckCircle, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import api from "../../utils/axiosInstance";
import {
  readCart,
  onCartChanged,
  effectiveUnitPrice,
} from "../../utils/cartStore";

/* =================== Utils =================== */

const COSTO_ENVIO_FIJO = 10000;

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// Totales con envío dinámico por tipo de entrega
// entrega UI: "ENVIO_DOMICILIO" | "RECOGER_EN_TIENDA" | "COTIZACION"
const computeTotals = (items, entrega) => {
  let subtotal = 0;
  for (const item of items) {
    const unit = effectiveUnitPrice(item);
    const q = Math.max(1, Number(item.cantidad) || 1);
    subtotal += unit * q;
  }

  let costo_envio = 0;
  if (entrega === "ENVIO_DOMICILIO") {
    costo_envio = COSTO_ENVIO_FIJO;
  }

  let total = subtotal + costo_envio;

  if (entrega === "COTIZACION") {
    // Para cotización, visualmente dejamos envío en 0
    total = subtotal;
    costo_envio = 0;
  }

  return { subtotal, costo_envio, total };
};

// Formatea 1111222233334444 → 1111 2222 3333 4444 (solo UI)
const formatCard = (v) =>
  String(v || "")
    .replace(/\D+/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();

// Mapea valores de entrega del UI → backend
const mapEntregaForBackend = (entregaUi, hasCotizacion) => {
  if (hasCotizacion) return "COTIZACION";
  if (entregaUi === "ENVIO_DOMICILIO") return "DOMICILIO";
  if (entregaUi === "RECOGER_EN_TIENDA") return "TIENDA";
  return entregaUi;
};

// Mapea método de pago del UI → backend
const mapMetodoForBackend = (metodoUi) => {
  if (metodoUi === "TARJETA") return "PAGO_LINEA";
  // Efectivo / transferencia = flujo sin pasarela en línea
  return "CONTRAENTREGA";
};

// Estado inicial para el formulario de agregar dirección
const initialDirForm = {
  descripcion: "",
  calle_principal: "",
  nro: "",
  ciudad: "",
  departamento: "",
  pais: "Colombia",
  telefono: "",
  es_principal: false,
};

/* =================== Componentes auxiliares =================== */

const ResumenPedido = ({ items, entrega, selectedCotizacion }) => {
  const { subtotal, costo_envio, total } = useMemo(
    () => computeTotals(items, entrega),
    [items, entrega]
  );
  const cardBg = useColorModeValue("white", "gray.800");

  const totalFinal = selectedCotizacion
    ? selectedCotizacion.total_cotizado
    : total;
  const envioFinal = selectedCotizacion ? 0 : costo_envio;
  const subtotalFinal = selectedCotizacion
    ? totalFinal - envioFinal
    : subtotal;

  return (
    <VStack
      align="stretch"
      p={6}
      bg={cardBg}
      borderRadius="xl"
      shadow="lg"
      spacing={4}
    >
      <Heading size="md" borderBottom="1px" borderColor="gray.200" pb={3}>
        Resumen de Compra
      </Heading>
      <VStack align="stretch" spacing={2} fontSize="md">
        <HStack justify="space-between">
          <Text color="gray.500">Subtotal</Text>
          <Text fontWeight="medium">{fmtCop(subtotalFinal)}</Text>
        </HStack>
        <HStack justify="space-between">
          <Text color="gray.500">Costo de Envío</Text>
          <Text fontWeight="medium">{fmtCop(envioFinal)}</Text>
        </HStack>
      </VStack>
      <Divider />
      <HStack justify="space-between">
        <Heading size="sm">Total a Pagar</Heading>
        <Heading size="md" color="yellow.500">
          {fmtCop(totalFinal)}
        </Heading>
      </HStack>

      {selectedCotizacion && (
        <Alert status="info" mt={4} borderRadius="lg">
          <AlertIcon />
          <Box>
            <Heading size="sm" mb={1}>
              Usando Cotización #{selectedCotizacion.id}
            </Heading>
            <Text fontSize="sm">
              El total se basa en la cotización aprobada. En este flujo no se
              cobra envío adicional.
            </Text>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};

const DireccionCard = ({ direccion, isSelected, onSelect }) => {
  const bgColor = useColorModeValue("gray.50", "gray.700");
  const selectedBg = useColorModeValue("yellow.50", "yellow.900");
  const borderColor = isSelected ? "yellow.500" : "gray.200";

  return (
    <HStack
      align="start"
      p={4}
      bg={isSelected ? selectedBg : bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      spacing={4}
      cursor="pointer"
      onClick={() => onSelect(direccion)}
      transition="all 0.2s"
      _hover={{ shadow: "md" }}
    >
      <Radio
        isChecked={isSelected}
        onChange={() => onSelect(direccion)}
        pt={1}
      >
        <Box />
      </Radio>
      <VStack align="start" flex={1}>
        <HStack spacing={2} wrap="wrap">
          <Text fontWeight="bold">
            {direccion.descripcion || "Dirección"}
          </Text>
          {direccion.es_principal && (
            <Badge colorScheme="green" size="sm">
              Principal
            </Badge>
          )}
        </HStack>
        <Text fontSize="sm" color="gray.500">
          {direccion.calle_principal} #{direccion.nro},{" "}
          {direccion.ciudad}
          {direccion.departamento ? `, ${direccion.departamento}` : ""},{" "}
          {direccion.pais}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Tel: {direccion.telefono || "—"}
        </Text>
      </VStack>
    </HStack>
  );
};

/* =================== Componente principal =================== */

export default function CheckoutEmpresa() {
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState(() => readCart());
  const [loading, setLoading] = useState(true);

  const [direcciones, setDirecciones] = useState([]);
  const [selectedDir, setSelectedDir] = useState(null);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  // UI: "RECOGER_EN_TIENDA" | "ENVIO_DOMICILIO" | "COTIZACION"
  const [entrega, setEntrega] = useState("RECOGER_EN_TIENDA");

  // UI: "EFECTIVO" | "TARJETA"
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");

  // Datos de tarjeta demo
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const {
    isOpen: showAddModal,
    onOpen: openAddModal,
    onClose: closeAddModal,
  } = useDisclosure();
  const [formDir, setFormDir] = useState(initialDirForm);
  const [guardandoDir, setGuardandoDir] = useState(false);

  const [tabIndex, setTabIndex] = useState(0);

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");

  const totals = useMemo(
    () => computeTotals(items, entrega),
    [items, entrega]
  );

  /* ===== Carga inicial ===== */
  useEffect(() => {
    const off = onCartChanged(() => setItems(readCart()));

    const loadData = async () => {
      try {
        setLoading(true);

        const dirRes = await api.get("/direcciones");
        const dirList = Array.isArray(dirRes.data)
          ? dirRes.data
          : dirRes.data?.direcciones || [];
        setDirecciones(dirList);
        if (dirList.length > 0) {
          const principal =
            dirList.find((d) => d.es_principal) || dirList[0];
          setSelectedDir(principal);
        }

        try {
          const cotRes = await api.get(
            "/cotizaciones/mios?estado=APROBADA"
          );
          const listCot = Array.isArray(cotRes.data)
            ? cotRes.data
            : cotRes.data?.cotizaciones || [];
          setCotizaciones(listCot);
        } catch {
          setCotizaciones([]);
        }
      } catch (error) {
        console.error("Error al cargar datos de checkout empresa:", error);
        toast({
          title: "Error de carga",
          description:
            "No se pudieron cargar las direcciones o cotizaciones.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => off?.();
  }, [toast]);

  /* ===== Si seleccionas una cotización, rellenamos con sus productos ===== */
  useEffect(() => {
    if (selectedCotizacion) {
      setItems(
        (selectedCotizacion.productos || []).map((p) => ({
          ...p,
          id: p.producto_id ?? p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio_unitario,
          precio_oferta: undefined,
          imagen_principal: p.imagen_url || p.imagen_principal || null,
        }))
      );
      setEntrega("COTIZACION");
    } else {
      setItems(readCart());
      setEntrega("RECOGER_EN_TIENDA");
    }
  }, [selectedCotizacion]);

  /* ===== Guardar dirección ===== */
  const saveDireccion = async () => {
    if (!formDir.calle_principal || !formDir.ciudad || !formDir.departamento) {
      toast({
        title: "Datos incompletos",
        description:
          "Asegúrate de completar la calle, ciudad y departamento.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setGuardandoDir(true);
    try {
      const res = await api.post("/direcciones", {
        direccion: formDir.descripcion || formDir.calle_principal,
        ciudad: formDir.ciudad,
        departamento: formDir.departamento,
        pais: formDir.pais || "Colombia",
        telefono: formDir.telefono || null,
        es_principal: formDir.es_principal ? 1 : 0,
      });

      const newId = res?.data?.id;
      const listRes = await api.get("/direcciones");
      const list = Array.isArray(listRes.data)
        ? listRes.data
        : listRes.data?.direcciones || [];
      setDirecciones(list);
      const nueva =
        list.find((d) => d.id === Number(newId)) ||
        list.find((d) => d.es_principal) ||
        list[0];
      if (nueva) setSelectedDir(nueva);

      setFormDir(initialDirForm);
      closeAddModal();
      toast({
        title: "Dirección guardada",
        description: "La nueva dirección ha sido añadida.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al guardar dirección:", error);
      toast({
        title: "Error",
        description:
          "No se pudo guardar la dirección. Intenta de nuevo más tarde.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGuardandoDir(false);
    }
  };

  /* ===== Confirmar checkout ===== */
  const handleCheckout = useCallback(() => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "No hay productos para realizar el pedido.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      navigate("/empresa/carrito-empresa");
      return;
    }

    if (entrega === "ENVIO_DOMICILIO" && !selectedDir) {
      toast({
        title: "Dirección requerida",
        description: "Debes seleccionar una dirección para envío a domicilio.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 🚫 Regla de negocio: domicilio NO puede ser contraentrega
    if (entrega === "ENVIO_DOMICILIO" && metodoPago === "EFECTIVO") {
      toast({
        title: "Método de pago no válido",
        description:
          "Para pedidos con envío a domicilio debes pagar con tarjeta (pasarela simulada).",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (metodoPago === "TARJETA" && entrega === "COTIZACION") {
      toast({
        title: "Pago no necesario",
        description:
          "Para cotizaciones aprobadas, usa los mecanismos de pago acordados. Elige 'Efectivo / Transferencia'.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validación de tarjeta si aplica
    let cleanCard = "";
    if (metodoPago === "TARJETA") {
      cleanCard = (cardNumber || "").replace(/\s+/g, "");
      if (cleanCard.length < 12) {
        toast({
          title: "Tarjeta inválida",
          description:
            "El número de tarjeta demo debe tener al menos 12 dígitos.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!cardHolder.trim()) {
        toast({
          title: "Titular requerido",
          description: "Ingresa el nombre del titular de la tarjeta (demo).",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExp)) {
        toast({
          title: "Fecha inválida",
          description: "Usa el formato MM/AA para la fecha de expiración.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv)) {
        toast({
          title: "CVV inválido",
          description: "El CVV debe tener 3 o 4 dígitos.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const entregaBack = mapEntregaForBackend(
      entrega,
      !!selectedCotizacion
    );
    const metodoBack = mapMetodoForBackend(metodoPago);

    const intentPayload = {
      items,
      entrega: entregaBack,      // "DOMICILIO" | "TIENDA" | "COTIZACION"
      entrega_ui: entrega,       // para referencia en front
      direccion_id:
        entrega === "ENVIO_DOMICILIO" && selectedDir
          ? Number(selectedDir.id)
          : null,
      metodo_pago: metodoBack,   // "PAGO_LINEA" | "CONTRAENTREGA"
      metodo_pago_ui: metodoPago,
      nota: null,
      cotizacion_id: selectedCotizacion ? selectedCotizacion.id : null,
      totales: {
        subtotal: totals.subtotal,
        envio: totals.costo_envio,
        total: selectedCotizacion
          ? selectedCotizacion.total_cotizado
          : totals.total,
      },
      tarjeta: metodoPago === "TARJETA" ? cleanCard : "",
      titular: metodoPago === "TARJETA" ? cardHolder.trim() : "",
      exp: metodoPago === "TARJETA" ? cardExp : "",
      cvv: metodoPago === "TARJETA" ? cardCvv : "",
    };

    sessionStorage.setItem(
      "fe_checkout_intent_empresa",
      JSON.stringify(intentPayload)
    );

    // ✅ Ruta corregida según tu App.jsx
    navigate("/empresa/pedido-procesando");
  }, [
    items,
    entrega,
    selectedDir,
    metodoPago,
    selectedCotizacion,
    totals,
    cardNumber,
    cardHolder,
    cardExp,
    cardCvv,
    toast,
    navigate,
  ]);

  /* ===== Render ===== */

  if (loading) {
    return (
      <Box p={8} bg={pageBg} minH="100vh">
        <Heading mb={8}>Checkout de Empresa</Heading>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          <Skeleton
            height="300px"
            gridColumn={{ base: "auto", lg: "span 2" }}
          />
          <Skeleton height="300px" />
        </SimpleGrid>
      </Box>
    );
  }

  const hasCotizaciones = cotizaciones.length > 0;
  const isCarritoEmpty = items.length === 0 && !selectedCotizacion;

  return (
    <Box p={4} bg={pageBg} minH="100vh">
      <Box maxW="1200px" mx="auto">
        <Heading mb={6} size="xl">
          Checkout para Empresas y Contratistas
        </Heading>

        {isCarritoEmpty && (
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            Tu carrito de empresa está vacío. Agrega productos para continuar.
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} mt={8}>
          {/* Columna principal */}
          <VStack
            align="stretch"
            spacing={8}
            gridColumn={{ base: "auto", lg: "span 2" }}
          >
            {/* 1. Carrito vs Cotización */}
            {hasCotizaciones && (
              <Box p={6} bg={cardBg} borderRadius="xl" shadow="lg">
                <Heading size="md" mb={4}>
                  1. ¿Carrito o Cotización Aprobada?
                </Heading>
                <Tabs
                  index={tabIndex}
                  onChange={setTabIndex}
                  variant="soft-rounded"
                  colorScheme="yellow"
                  align="center"
                >
                  <TabList mb="1em">
                    <Tab
                      onClick={() => {
                        setSelectedCotizacion(null);
                      }}
                    >
                      Usar Carrito ({readCart().length} productos)
                    </Tab>
                    <Tab
                      onClick={() => {
                        if (!selectedCotizacion && cotizaciones[0]) {
                          setSelectedCotizacion(cotizaciones[0]);
                        }
                      }}
                    >
                      Usar Cotización Aprobada ({cotizaciones.length})
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Alert status="info" borderRadius="lg">
                        <AlertIcon />
                        Estás comprando los ítems de tu carrito actual.
                      </Alert>
                    </TabPanel>
                    <TabPanel>
                      <Text mb={3}>Selecciona una cotización aprobada:</Text>
                      <Select
                        placeholder="Selecciona una cotización"
                        onChange={(e) => {
                          const cot = cotizaciones.find(
                            (c) => c.id === Number(e.target.value)
                          );
                          setSelectedCotizacion(cot || null);
                        }}
                        value={selectedCotizacion?.id || ""}
                      >
                        {cotizaciones.map((cot) => (
                          <option key={cot.id} value={cot.id}>
                            #{cot.id} - Total:{" "}
                            {fmtCop(cot.total_cotizado)} - (
                            {new Date(
                              cot.fecha_creacion
                            ).toLocaleDateString()}
                            )
                          </option>
                        ))}
                      </Select>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
            )}

            {/* 2. Opción de entrega */}
            <Box p={6} bg={cardBg} borderRadius="xl" shadow="lg">
              <Heading size="md" mb={4}>
                {entrega === "COTIZACION"
                  ? "2. Entrega (definida por la cotización)"
                  : "2. Opción de Entrega"}
              </Heading>

              <RadioGroup
                onChange={setEntrega}
                value={entrega}
                isDisabled={entrega === "COTIZACION"}
              >
                <Stack
                  direction={{ base: "column", md: "row" }}
                  spacing={6}
                >
                  <HStack
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    flex="1"
                    align="start"
                  >
                    <Radio value="RECOGER_EN_TIENDA" pt={1}>
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Icon
                            as={FiCheckCircle}
                            color="yellow.500"
                          />
                          <Text fontWeight="bold">
                            Recoger en tienda
                          </Text>
                        </HStack>
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          ml={6}
                        >
                          Sin costo de envío. Recoge en nuestro
                          almacén.
                        </Text>
                      </VStack>
                    </Radio>
                  </HStack>
                  <HStack
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    flex="1"
                    align="start"
                  >
                    <Radio value="ENVIO_DOMICILIO" pt={1}>
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Icon as={FiTruck} color="yellow.500" />
                          <Text fontWeight="bold">
                            Envío a domicilio
                          </Text>
                        </HStack>
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          ml={6}
                        >
                          Costo fijo: {fmtCop(COSTO_ENVIO_FIJO)} (solo
                          Colombia). Pago solo con tarjeta.
                        </Text>
                      </VStack>
                    </Radio>
                  </HStack>
                </Stack>
              </RadioGroup>
            </Box>

            {/* 3. Direcciones (solo si ENVIO_DOMICILIO) */}
            {entrega === "ENVIO_DOMICILIO" && (
              <Box p={6} bg={cardBg} borderRadius="xl" shadow="lg">
                <Heading size="md" mb={4}>
                  Dirección de Envío
                </Heading>
                <VStack align="stretch" spacing={4}>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    {direcciones.map((dir) => (
                      <DireccionCard
                        key={dir.id}
                        direccion={dir}
                        isSelected={selectedDir?.id === dir.id}
                        onSelect={setSelectedDir}
                      />
                    ))}
                  </SimpleGrid>
                  <Button
                    leftIcon={<FiPlus />}
                    onClick={openAddModal}
                    variant="outline"
                    colorScheme="gray"
                  >
                    Añadir nueva dirección
                  </Button>
                  {!selectedDir && (
                    <Alert status="warning" borderRadius="lg">
                      <AlertIcon />
                      Debes seleccionar una dirección para el envío.
                    </Alert>
                  )}
                </VStack>
              </Box>
            )}

            {/* 4. Método de pago */}
            <Box p={6} bg={cardBg} borderRadius="xl" shadow="lg">
              <Heading size="md" mb={4}>
                {entrega === "COTIZACION"
                  ? "3. Método de Pago (Cotización)"
                  : "3. Método de Pago"}
              </Heading>

              <RadioGroup
                onChange={setMetodoPago}
                value={metodoPago}
                isDisabled={entrega === "COTIZACION"}
              >
                <Stack
                  direction={{ base: "column", md: "row" }}
                  spacing={6}
                >
                  <HStack
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    flex="1"
                    align="start"
                  >
                    <Radio
                      value="EFECTIVO"
                      pt={1}
                      isDisabled={entrega === "ENVIO_DOMICILIO"}
                    >
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Icon
                            as={FiCreditCard}
                            color="yellow.500"
                          />
                          <Text fontWeight="bold">
                            Efectivo / Transferencia
                          </Text>
                        </HStack>
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          ml={6}
                        >
                          Pago contra entrega o transferencia posterior
                          (solo disponible si recoges en tienda).
                        </Text>
                      </VStack>
                    </Radio>
                  </HStack>
                  <HStack
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    flex="1"
                    align="start"
                  >
                    <Radio value="TARJETA" pt={1}>
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Icon
                            as={FiCreditCard}
                            color="yellow.500"
                          />
                          <Text fontWeight="bold">
                            Tarjeta (simulada)
                          </Text>
                        </HStack>
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          ml={6}
                        >
                          Pago en línea simulado. La aprobación se decide
                          con el último dígito.
                        </Text>
                      </VStack>
                    </Radio>
                  </HStack>
                </Stack>
              </RadioGroup>

              {metodoPago === "TARJETA" && entrega !== "COTIZACION" && (
                <SimpleGrid
                  columns={{ base: 1, md: 2 }}
                  gap={3}
                  mt={3}
                >
                  <FormControl isRequired>
                    <FormLabel>Número de tarjeta (demo)</FormLabel>
                    <Input
                      placeholder="1111 2222 3333 4444"
                      inputMode="numeric"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCard(e.target.value))
                      }
                    />
                    <FormHelperText color="gray.500">
                      La aprobación (demo) depende del último dígito:
                      par = aprobado, impar = rechazado.
                    </FormHelperText>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Nombre del titular</FormLabel>
                    <Input
                      placeholder="Nombre Empresa (demo)"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>MM/AA</FormLabel>
                    <Input
                      placeholder="MM/AA"
                      maxLength={5}
                      value={cardExp}
                      onChange={(e) => {
                        const v = e.target.value
                          .replace(/[^\d]/g, "")
                          .slice(0, 4);
                        const fm =
                          v.length <= 2
                            ? v
                            : `${v.slice(0, 2)}/${v.slice(2)}`;
                        setCardExp(fm);
                      }}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>CVV</FormLabel>
                    <Input
                      placeholder="***"
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(
                          e.target.value
                            .replace(/\D+/g, "")
                            .slice(0, 4)
                        )
                      }
                    />
                  </FormControl>
                </SimpleGrid>
              )}

              {entrega === "COTIZACION" && (
                <Alert status="info" mt={4} borderRadius="lg">
                  <AlertIcon />
                  Este flujo asume que el pago de la cotización se
                  realiza por los medios acordados con FerreExpress
                  (transferencia/crédito). Aquí solo se registra el
                  pedido.
                </Alert>
              )}
            </Box>
          </VStack>

          {/* Columna derecha: resumen + botón */}
          <VStack align="stretch" spacing={6}>
            <ResumenPedido
              items={items}
              entrega={entrega}
              selectedCotizacion={selectedCotizacion}
            />

            <Button
              colorScheme="yellow"
              color="black"
              size="lg"
              py={7}
              isDisabled={
                isCarritoEmpty ||
                (entrega === "ENVIO_DOMICILIO" && !selectedDir)
              }
              onClick={handleCheckout}
            >
              Confirmar Pedido{" "}
              {fmtCop(
                selectedCotizacion
                  ? selectedCotizacion.total_cotizado
                  : totals.total
              )}
            </Button>

            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="center"
              pt={2}
            >
              Al confirmar aceptas los términos y condiciones de
              FerreExpress para empresas y contratistas.
            </Text>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Modal para añadir dirección */}
      <Modal isOpen={showAddModal} onClose={closeAddModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Añadir nueva dirección</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Descripción (Ej: Oficina, Bodega)</FormLabel>
                <Input
                  value={formDir.descripcion}
                  onChange={(e) =>
                    setFormDir((s) => ({
                      ...s,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Ej: Bodega Principal"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Calle principal</FormLabel>
                <Input
                  value={formDir.calle_principal}
                  onChange={(e) =>
                    setFormDir((s) => ({
                      ...s,
                      calle_principal: e.target.value,
                    }))
                  }
                  placeholder="Ej: Calle 13"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Número / Detalle</FormLabel>
                <Input
                  value={formDir.nro}
                  onChange={(e) =>
                    setFormDir((s) => ({ ...s, nro: e.target.value }))
                  }
                  placeholder="Ej: 5-30 / Local 101"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Ciudad</FormLabel>
                <Input
                  value={formDir.ciudad}
                  onChange={(e) =>
                    setFormDir((s) => ({ ...s, ciudad: e.target.value }))
                  }
                  placeholder="Ej: Cali"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Departamento</FormLabel>
                <Input
                  value={formDir.departamento}
                  onChange={(e) =>
                    setFormDir((s) => ({
                      ...s,
                      departamento: e.target.value,
                    }))
                  }
                  placeholder="Ej: Valle del Cauca"
                />
              </FormControl>
              <FormControl>
                <FormLabel>País</FormLabel>
                <Input
                  value={formDir.pais}
                  onChange={(e) =>
                    setFormDir((s) => ({ ...s, pais: e.target.value }))
                  }
                  placeholder="Colombia"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Teléfono</FormLabel>
                <Input
                  value={formDir.telefono}
                  onChange={(e) =>
                    setFormDir((s) => ({
                      ...s,
                      telefono: e.target.value,
                    }))
                  }
                  placeholder="+57 3xx xxx xxxx"
                />
              </FormControl>
              <Checkbox
                isChecked={formDir.es_principal}
                onChange={(e) =>
                  setFormDir((s) => ({
                    ...s,
                    es_principal: e.target.checked,
                  }))
                }
              >
                Marcar como principal
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAddModal}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              color="black"
              onClick={saveDireccion}
              isLoading={guardandoDir}
            >
              Guardar dirección
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
