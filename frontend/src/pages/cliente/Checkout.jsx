// src/pages/cliente/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Heading, Text, HStack, VStack, Input, Textarea, Button, Divider,
  useColorModeValue, useToast, SimpleGrid, Badge, Radio, RadioGroup, Stack,
  Skeleton, Alert, AlertIcon, AlertTitle, AlertDescription, Tooltip,
  FormControl, FormLabel, FormHelperText, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Checkbox, Tabs, TabList,
  TabPanels, Tab, TabPanel, Tag, TagLabel, Image
} from "@chakra-ui/react";
import { FiCreditCard, FiTruck, FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* ✅ Store del carrito */
import {
  readCart,
  writeCart,
  effectiveUnitPrice,
  onCartChanged,
} from "../../utils/cartStore";

/* =================== Utils =================== */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// Totales con envío dinámico por tipo de entrega
const computeTotals = (items, entrega) => {
  let subtotal = 0;
  for (const it of items) {
    const unit = effectiveUnitPrice(it);
    const q = Math.max(1, Number(it.cantidad) || 1);
    subtotal += unit * q;
  }
  const envio = items.length ? (entrega === "DOMICILIO" ? 10000 : 0) : 0;
  return { subtotal, envio, total: subtotal + envio };
};

// Formatea 1111222233334444 → 1111 2222 3333 4444 (solo UI)
const formatCard = (v) =>
  String(v || "")
    .replace(/\D+/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();

/* =================== Componente de Logos =================== */
const PaymentMethods = ({ logos }) => {
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgBox = useColorModeValue("white", "gray.700");

  return (
    <HStack spacing={2} wrap="wrap" mt={1} mb={2}>
      {logos.map((logo, index) => (
        <Box
          key={index}
          p={1}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          bg={bgBox}
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="40px" // Altura fija del contenedor
          w="60px" // Ancho fijo para uniformidad
        >
          <Image
            src={logo}
            alt="Método de pago"
            maxH="100%"
            maxW="100%"
            objectFit="contain"
            fallbackSrc="https://via.placeholder.com/60x40?text=..." // Fallback por si la imagen falla
          />
        </Box>
      ))}
    </HStack>
  );
};

/* =================== Página Principal =================== */
export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();

  // Paleta / tokens visuales
  const muted   = useColorModeValue("gray.600", "gray.300");
  const cardBg  = useColorModeValue("white", "gray.850");
  const border  = useColorModeValue("gray.200", "gray.700");
  const pageBg  = useColorModeValue("#f6f7f9", "#0f1117");
  const shadowSm = useColorModeValue("0 6px 18px rgba(31,38,135,0.10)", "0 6px 18px rgba(0,0,0,0.35)");
  const shadowMd = useColorModeValue("0 8px 24px rgba(31,38,135,0.12)", "0 8px 24px rgba(0,0,0,0.35)");

  // Carrito
  const [items, setItems] = useState(() => readCart());

  // Tabs (0 = Entrega, 1 = Pago)
  const [tabIndex, setTabIndex] = useState(0);

  // Entrega/Dirección
  const [entrega, setEntrega] = useState("DOMICILIO"); // "DOMICILIO" | "TIENDA"
  const [direcciones, setDirecciones] = useState([]);
  const [direccionId, setDireccionId] = useState("");
  const [cargandoDir, setCargandoDir] = useState(true);

  // Modal “Agregar dirección”
  const [showAddModal, setShowAddModal] = useState(false);
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [formDir, setFormDir] = useState({
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "Colombia",
    telefono: "",
    es_principal: false,
  });

  // Pago
  const [metodoPago, setMetodoPago] = useState("PAGO_LINEA"); // "PAGO_LINEA" | "CONTRAENTREGA"
  const [tarjeta, setTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");

  // Otros
  const [nota, setNota] = useState("");
  const [acepto, setAcepto] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [errorTop, setErrorTop] = useState("");

  // Totales
  const { subtotal, envio, total } = useMemo(
    () => computeTotals(items, entrega),
    [items, entrega]
  );

  /* ===== Ciclo de vida & sync ===== */
  useEffect(() => {
    if (!items.length) {
      toast({ title: "Tu carrito está vacío", status: "warning", duration: 1500 });
      navigate("/cliente/carrito", { replace: true });
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setCargandoDir(true);
        const res = await api.get("/direcciones");
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.direcciones || [];
        setDirecciones(list);
        const principal = list.find((d) => d.es_principal) || list[0];
        if (principal) setDireccionId(String(principal.id));
      } catch {
        // opcional
      } finally {
        mounted = false;
        setCargandoDir(false);
      }
    })();

    const off = onCartChanged(() => setItems(readCart()));
    return () => off?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tabs bloqueados hasta cumplir requisitos
  const readyForPago =
    entrega === "TIENDA" || (entrega === "DOMICILIO" && !!direccionId);

  const handleTabChange = (next) => {
    if (next === 1 && !readyForPago) return;
    setTabIndex(next);
  };

  const goToPago = () => {
    setErrorTop("");
    if (entrega === "DOMICILIO" && !direccionId) {
      setErrorTop("Selecciona una dirección para el envío.");
      return;
    }
    setTabIndex(1);
  };

  const goBackEntrega = () => setTabIndex(0);

  /* ===== Crear/guardar nueva dirección ===== */
  const saveDireccion = async () => {
    setErrorTop("");
    if (!formDir.direccion.trim() || !formDir.ciudad.trim()) {
      setErrorTop("Dirección y ciudad son requeridas.");
      return;
    }
    setGuardandoDir(true);
    try {
      const payload = {
        direccion: formDir.direccion.trim(),
        ciudad: formDir.ciudad.trim(),
        departamento: formDir.departamento?.trim() || null,
        pais: formDir.pais?.trim() || "Colombia",
        telefono: formDir.telefono?.trim() || null,
        es_principal: formDir.es_principal ? 1 : 0,
      };
      const res = await api.post("/direcciones", payload);
      const newId = res?.data?.id;

      const listRes = await api.get("/direcciones");
      const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.direcciones || [];
      setDirecciones(list);
      if (newId) setDireccionId(String(newId));

      setShowAddModal(false);
      setFormDir({
        direccion: "",
        ciudad: "",
        departamento: "",
        pais: "Colombia",
        telefono: "",
        es_principal: false,
      });
      toast({ title: "Dirección creada", status: "success", duration: 1500 });
    } catch (e) {
      const msg = e?.response?.data?.error || "No se pudo crear la dirección";
      setErrorTop(msg);
      toast({ title: "Error", description: msg, status: "error", duration: 2200 });
    } finally {
      setGuardandoDir(false);
    }
  };

  /* ===== Confirmar: back crea pedido y procesa pago simulado ===== */
  const pagar = async () => {
    setErrorTop("");

    // 1) Validaciones previas
    if (!items.length) {
      toast({ title: "Carrito vacío", status: "warning", duration: 1500 });
      return;
    }
    if (!acepto) {
      setErrorTop("Debes aceptar las condiciones de uso y privacidad para continuar.");
      return;
    }
    if (entrega === "DOMICILIO" && !direccionId) {
      setErrorTop("Selecciona una dirección para el envío.");
      setTabIndex(0);
      return;
    }

    // 2) Validación simple de tarjeta (solo si es pago en línea)
    if (metodoPago === "PAGO_LINEA") {
      const cardRaw = (tarjeta || "").replace(/\s+/g, "");
      if (cardRaw.length < 12) {
        setErrorTop("Número de tarjeta muy corto. Usa un demo de 12 a 19 dígitos.");
        return;
      }
      if (!titular.trim()) {
        setErrorTop("Ingresa el nombre del titular.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(exp)) {
        setErrorTop("Fecha inválida. Usa formato MM/AA.");
        return;
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        setErrorTop("CVV inválido (3–4 dígitos).");
        return;
      }
    }

    // 3) Guardar intención para que la pantalla de procesamiento ejecute el flujo real
    const intent = {
      items,
      entrega,                                            // "DOMICILIO" | "TIENDA"
      direccion_id: entrega === "DOMICILIO" ? Number(direccionId) : null,
      metodo_pago: metodoPago,                            // "PAGO_LINEA" | "CONTRAENTREGA"
      tarjeta: (tarjeta || "").replace(/\s+/g, ""),       // limpio espacios
      titular,
      exp,
      cvv,
      nota: nota?.trim() || null,
      totales: { subtotal, envio, total },
    };
    sessionStorage.setItem("fe_checkout_intent", JSON.stringify(intent));

    // 4) Ir a pantalla de carga/procesamiento
    navigate("/cliente/pedido-procesando");
  };


  /* =================== UI =================== */
  return (
    <Box px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }} bg={pageBg}>
      <Heading size="lg" mb={1}>Finalizar compra</Heading>
      <Text color={muted} mb={4}>Completa los pasos para confirmar tu pedido.</Text>

      {errorTop && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>Revisa la información</AlertTitle>
            <AlertDescription>{errorTop}</AlertDescription>
          </Box>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={{ base: 3, md: 4 }}>
        {/* Columna principal con Tabs (pasarela) */}
        <Box gridColumn={{ lg: "1 / span 2" }}>
          <Tabs index={tabIndex} onChange={handleTabChange} variant="enclosed" isFitted>
            <TabList
              bg={cardBg}
              border="1px solid"
              borderColor={border}
              borderRadius="lg"
              boxShadow={shadowSm}
            >
              <Tab _selected={{ bg: useColorModeValue("gray.50","gray.800"), borderColor: "transparent" }}>
                1. Entrega / Dirección
              </Tab>
              <Tab
                isDisabled={!readyForPago}
                _selected={{ bg: useColorModeValue("gray.50","gray.800"), borderColor: "transparent" }}
              >
                2. Pago
              </Tab>
            </TabList>

            <TabPanels mt={3}>
              {/* ====== Tab 1: Entrega / Dirección ====== */}
              <TabPanel p={0}>
                <Box
                  bg={cardBg}
                  border="1px solid"
                  borderColor={border}
                  borderRadius="lg"
                  p={{ base: 3, md: 4 }}
                  boxShadow={shadowSm}
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack><FiTruck /><Heading size="md">Entrega</Heading></HStack>
                    <Badge colorScheme="teal">Paso 1/2</Badge>
                  </HStack>

                  <RadioGroup value={entrega} onChange={setEntrega}>
                    <Stack direction={{ base: "column", md: "row" }}>
                      <Radio value="DOMICILIO">Domicilio</Radio>
                      <Radio value="TIENDA">Retiro en tienda</Radio>
                    </Stack>
                  </RadioGroup>

                  {entrega === "DOMICILIO" ? (
                    <Box mt={3}>
                      {cargandoDir ? (
                        <VStack align="stretch" spacing={2}>
                          <Skeleton height="38px" />
                          <Skeleton height="38px" />
                        </VStack>
                      ) : (
                        <>
                          {direcciones.length > 0 ? (
                            <FormControl>
                              <FormLabel color={muted} fontSize="sm">Selecciona una dirección</FormLabel>
                              <VStack align="stretch" spacing={2}>
                                {direcciones.map((d) => (
                                  <Button
                                    key={d.id}
                                    onClick={() => setDireccionId(String(d.id))}
                                    variant={String(d.id) === String(direccionId) ? "solid" : "outline"}
                                    justifyContent="space-between"
                                    size="sm"
                                  >
                                    <HStack spacing={3} align="center">
                                      <Tag size="sm" colorScheme={d.es_principal ? "green" : "gray"}>
                                        <TagLabel>{d.es_principal ? "Principal" : "Secundaria"}</TagLabel>
                                      </Tag>
                                      <Text fontSize="sm" noOfLines={1}>
                                        {d.direccion} — {d.ciudad}{d.departamento ? `, ${d.departamento}` : ""}{d.pais ? `, ${d.pais}` : ""}
                                      </Text>
                                    </HStack>
                                    <Text fontSize="xs" color={muted} noOfLines={1}>{d.telefono || ""}</Text>
                                  </Button>
                                ))}
                              </VStack>
                              <FormHelperText color={muted} mt={2}>
                                ¿No ves tu dirección? Agrégala abajo.
                              </FormHelperText>
                            </FormControl>
                          ) : (
                            <Text color={muted} fontSize="sm" mt={2}>
                              Aún no tienes direcciones guardadas. Crea una nueva para continuar.
                            </Text>
                          )}

                          <Button mt={3} size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                            Agregar nueva dirección
                          </Button>
                        </>
                      )}
                    </Box>
                  ) : (
                    <Box mt={3}>
                      <Text color={muted} fontSize="sm">
                        Retirarás tu pedido en el punto físico. El costo de envío es 0.
                      </Text>
                    </Box>
                  )}

                  <HStack justify="flex-end" mt={4}>
                    <Button
                      colorScheme="yellow"
                      color="black"
                      onClick={goToPago}
                      isDisabled={entrega === "DOMICILIO" && !direccionId}
                      boxShadow={shadowMd}
                    >
                      Continuar a Pago
                    </Button>
                  </HStack>
                </Box>
              </TabPanel>

              {/* ====== Tab 2: Pago ====== */}
              <TabPanel p={0}>
                <Box
                  bg={cardBg}
                  border="1px solid"
                  borderColor={border}
                  borderRadius="lg"
                  p={{ base: 3, md: 4 }}
                  boxShadow={shadowSm}
                >
                  <HStack justify="space-between" mb={2} align="center">
                    <HStack><FiCreditCard /><Heading size="md">Pago</Heading></HStack>
                    <Badge colorScheme="teal">Paso 2/2</Badge>
                  </HStack>

                  {/* ======================= MODIFICACIÓN AQUI ======================= */}
                  {/* Medios recomendados / marcas aceptadas (IMÁGENES) */}
                  <VStack align="stretch" spacing={2} mb={3}>
                    <Text color={muted} fontSize="sm">Medios aceptados:</Text>
                    <PaymentMethods
                      logos={[
                        "/Visa.png",
                        "/Mastercard.png",
                        "/PSE.png",
                        "/Nequi.png",
                        "/DaviPlata.png"
                      ]}
                    />
                  </VStack>
                  {/* ================================================================= */}

                  <RadioGroup
                    value={
                      entrega === "TIENDA"
                        ? metodoPago
                        : metodoPago === "CONTRAENTREGA" ? "PAGO_LINEA" : metodoPago
                    }
                    onChange={setMetodoPago}
                  >
                    <VStack align="stretch">
                      <Radio value="PAGO_LINEA">Pago en línea (simulado)</Radio>
                      <Radio value="CONTRAENTREGA" isDisabled={entrega !== "TIENDA"}>
                        Contraentrega {entrega !== "TIENDA" && <Text as="span" color={muted}>(solo disponible en retiro)</Text>}
                      </Radio>
                    </VStack>
                  </RadioGroup>

                  {/* Datos demo de tarjeta solo cuando aplica */}
                  {metodoPago === "PAGO_LINEA" && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} mt={3}>
                      <FormControl isRequired>
                        <FormLabel>Número de tarjeta (demo)</FormLabel>
                        <Input
                          placeholder="1111 2222 3333 4444"
                          inputMode="numeric"
                          maxLength={19}
                          value={tarjeta}
                          onChange={(e) => setTarjeta(formatCard(e.target.value))}
                        />
                        <FormHelperText color="gray.500">
                          La aprobación final la decide el backend (simulado).
                        </FormHelperText>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Nombre del titular</FormLabel>
                        <Input
                          placeholder="Nombre Apellido (demo)"
                          value={titular}
                          onChange={(e) => setTitular(e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>MM/AA</FormLabel>
                        <Input
                          placeholder="MM/AA"
                          maxLength={5}
                          value={exp}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                            const fm = v.length <= 2 ? v : `${v.slice(0, 2)}/${v.slice(2)}`;
                            setExp(fm);
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
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D+/g, "").slice(0, 4))}
                        />
                      </FormControl>
                    </SimpleGrid>
                  )}

                  <Box mt={3}>
                    <FormControl>
                      <FormLabel color={muted} fontSize="sm">Nota para el pedido (opcional)</FormLabel>
                      <Textarea
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        placeholder="Instrucciones, referencias, horarios…"
                      />
                    </FormControl>
                  </Box>

                  <Checkbox mt={4} isChecked={acepto} onChange={(e) => setAcepto(e.target.checked)}>
                    Acepto las{" "}
                    <Button variant="link" onClick={() => navigate("/condiciones-uso")}>condiciones de uso</Button>{" "}
                    y los{" "}
                    <Button variant="link" onClick={() => navigate("/avisos-privacidad")}>avisos de privacidad</Button>.
                  </Checkbox>

                  <HStack justify="space-between" mt={4} flexWrap="wrap" gap={2}>
                    <Button variant="outline" onClick={goBackEntrega} isDisabled={enviando}>
                      Volver a Entrega
                    </Button>
                    <Tooltip hasArrow isDisabled={acepto} label="Debes aceptar condiciones y privacidad">
                      <Button
                        colorScheme="yellow"
                        color="black"
                        leftIcon={<FiCheckCircle />}
                        onClick={pagar}
                        isLoading={enviando}
                        isDisabled={!acepto || enviando}
                        boxShadow={shadowMd}
                      >
                        Confirmar y {metodoPago === "PAGO_LINEA" ? "pagar (demo)" : "crear pedido"}
                      </Button>
                    </Tooltip>
                  </HStack>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* ===== Columna derecha: Resumen (con detalle de productos) ===== */}
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={border}
          borderRadius="lg"
          p={{ base: 3, md: 4 }}
          position={{ lg: "sticky" }}
          top={{ lg: 16 }}
          alignSelf="start"
          boxShadow={shadowSm}
        >
          <Heading size="md" mb={3}>Resumen</Heading>

          {/* Lista de productos (responsive) */}
          <VStack align="stretch" spacing={2} mb={3}>
            {items.map((it) => {
              const unit = effectiveUnitPrice(it);
              const qty = Math.max(1, Number(it.cantidad) || 1);
              const line = unit * qty;
              const src = it.imagen_principal
                ? it.imagen_principal.startsWith("http")
                  ? it.imagen_principal
                  : `${API_BASE_URL}${it.imagen_principal}`
                : "https://via.placeholder.com/300x200?text=Sin+Imagen";
              return (
                <HStack
                  key={it.id}
                  align="stretch"
                  spacing={3}
                  border="1px solid"
                  borderColor={border}
                  borderRadius="md"
                  p={2}
                >
                  <Box
                    w={{ base: "64px", md: "72px" }}
                    h={{ base: "64px", md: "72px" }}
                    bg="white"
                    border="1px solid"
                    borderColor={border}
                    borderRadius="md"
                    display="grid"
                    placeItems="center"
                    overflow="hidden"
                    flexShrink={0}
                  >
                    <Image
                      src={src}
                      alt={it.nombre}
                      maxW="100%"
                      maxH="100%"
                      objectFit="contain"
                      loading="lazy"
                    />
                  </Box>

                  <VStack align="stretch" spacing={0} flex="1" minW={0}>
                    <Text fontWeight="semibold" noOfLines={1}>{it.nombre}</Text>
                    <Text fontSize="sm" color={muted}>
                      {qty} × {fmtCop(unit)}
                    </Text>
                  </VStack>

                  <Text fontWeight="bold" whiteSpace="nowrap">{fmtCop(line)}</Text>
                </HStack>
              );
            })}
          </VStack>

          <VStack align="stretch" spacing={2} fontSize="sm" mb={2}>
            <HStack justify="space-between">
              <Text color={muted}>Ítems (SKUs)</Text>
              <Text>{items.length}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={muted}>Subtotal</Text>
              <Text>{fmtCop(subtotal)}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color={muted}>Envío</Text>
              <Text>{fmtCop(envio)}</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="bold">Total</Text>
              <Text fontWeight="bold">{fmtCop(total)}</Text>
            </HStack>
          </VStack>

          <VStack align="stretch" spacing={1} mt={3} fontSize="xs" color={muted}>
            <Text>
              La pasarela es simulada en backend. Aquí no pedimos datos sensibles reales;
              al confirmar, se crea el pedido y el servidor procesa el pago.
            </Text>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* ========= Modal: Agregar Dirección ========= */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar dirección</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <FormControl isRequired>
                <FormLabel>Dirección</FormLabel>
                <Input
                  value={formDir.direccion}
                  onChange={(e) => setFormDir((s) => ({ ...s, direccion: e.target.value }))}
                  placeholder="Calle 12 #34-56 Apto 301"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Ciudad</FormLabel>
                <Input
                  value={formDir.ciudad}
                  onChange={(e) => setFormDir((s) => ({ ...s, ciudad: e.target.value }))}
                  placeholder="Cali"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Departamento</FormLabel>
                <Input
                  value={formDir.departamento}
                  onChange={(e) => setFormDir((s) => ({ ...s, departamento: e.target.value }))}
                  placeholder="Valle del Cauca"
                />
              </FormControl>
              <FormControl>
                <FormLabel>País</FormLabel>
                <Input
                  value={formDir.pais}
                  onChange={(e) => setFormDir((s) => ({ ...s, pais: e.target.value }))}
                  placeholder="Colombia"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Teléfono</FormLabel>
                <Input
                  value={formDir.telefono}
                  onChange={(e) => setFormDir((s) => ({ ...s, telefono: e.target.value }))}
                  placeholder="+57 3xx xxx xxxx"
                />
              </FormControl>
              <Checkbox
                isChecked={formDir.es_principal}
                onChange={(e) => setFormDir((s) => ({ ...s, es_principal: e.target.checked }))}
              >
                Marcar como principal
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button colorScheme="yellow" color="black" onClick={saveDireccion} isLoading={guardandoDir}>
              Guardar dirección
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}