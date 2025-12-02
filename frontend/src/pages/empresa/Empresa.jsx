import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { FiRefreshCw, FiDownload, FiPlus, FiTrash2 } from "react-icons/fi";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function EmpresaPage() {
  const { user } = useAuth();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const borderCo = useColorModeValue("gray.200", "gray.700");
  const subtle = useColorModeValue("gray.600", "gray.300");

  // ====== state ======
  const [loading, setLoading] = useState(false);

  const [cotizaciones, setCotizaciones] = useState([]);
  const [dirList, setDirList] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [casos, setCasos] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Crear cotización (modal)
  const [cotOpen, setCotOpen] = useState(false);
  const [items, setItems] = useState([{ producto_id: "", cantidad: 1 }]);

  // Crear dirección (modal)
  const [dirOpen, setDirOpen] = useState(false);
  const [dirForm, setDirForm] = useState({
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "Colombia",
    telefono: "",
    es_principal: 0,
  });

  // Crear caso (soporte)
  const [nuevoCaso, setNuevoCaso] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "MEDIA",
  });

  // Pagar pedido (opcional)
  const [pago, setPago] = useState({ pedido_id: "", tarjeta: "" });

  // ====== loaders ======
  async function loadAll() {
    try {
      setLoading(true);
      // Cotizaciones (empresa ve las suyas)
      const c = await api.get("/cotizaciones");
      setCotizaciones(c.data || []);

      // Direcciones del usuario
      const d = await api.get("/direcciones");
      setDirList(d.data || []);

      // Notificaciones del usuario
      const n = await api.get("/notificaciones");
      setNotifs(n.data || []);

      // Casos (empresa ve los suyos)
      const cs = await api.get("/casos");
      setCasos(cs.data || []);

      // FAQ según rol
      const f = await api.get("/faq");
      setFaqs(f.data || []);
    } catch (e) {
      console.error(e);
      toast({
        status: "error",
        title: "Error cargando datos",
        description: "Revisa tu sesión o el backend",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  // ====== Cotizaciones ======
  const addItem = () => setItems((arr) => [...arr, { producto_id: "", cantidad: 1 }]);
  const removeItem = (idx) =>
    setItems((arr) => arr.filter((_, i) => i !== idx));

  const changeItem = (idx, key, val) =>
    setItems((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, [key]: val } : it))
    );

  const crearCotizacion = async () => {
    const productos = items
      .map((it) => ({
        producto_id: Number(it.producto_id),
        cantidad: Number(it.cantidad),
      }))
      .filter((x) => x.producto_id && x.cantidad > 0);

    if (!productos.length) {
      toast({ status: "warning", title: "Agrega al menos un producto" });
      return;
    }

    try {
      const res = await api.post("/cotizaciones", { productos });
      toast({
        status: "success",
        title: "Cotización creada",
        description: `#${res.data?.cotizacion_id} • Total ${fmtCop(res.data?.total)}`,
      });
      setCotOpen(false);
      setItems([{ producto_id: "", cantidad: 1 }]);
      loadAll();
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "Error creando cotización" });
    }
  };

  const descargarPDF = async (id) => {
    try {
      const res = await api.get(`/cotizaciones/${id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo descargar el PDF" });
    }
  };

  // Pedido desde cotización
  const crearPedidoDesdeCotizacion = async (cotizacion_id) => {
    // Requiere direccion_id, metodo_pago y entrega
    const direccion_id = dirList[0]?.id;
    if (!direccion_id) {
      toast({
        status: "warning",
        title: "Primero crea una dirección",
        description: "Ve a la pestaña Direcciones",
      });
      return;
    }
    try {
      const body = {
        cotizacion_id,
        direccion_id,
        metodo_pago: "PAGO_LINEA",
        entrega: "DOMICILIO",
      };
      const res = await api.post("/pedidos/cotizacion", body);
      toast({
        status: "success",
        title: "Pedido creado",
        description: `ID ${res.data?.pedido_id} • Total ${fmtCop(res.data?.total)}`,
      });
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo crear el pedido" });
    }
  };

  // ====== Direcciones ======
  const crearDireccion = async () => {
    try {
      const p = { ...dirForm, es_principal: dirForm.es_principal ? 1 : 0 };
      await api.post("/direcciones", p);
      toast({ status: "success", title: "Dirección creada" });
      setDirOpen(false);
      setDirForm({
        direccion: "",
        ciudad: "",
        departamento: "",
        pais: "Colombia",
        telefono: "",
        es_principal: 0,
      });
      loadAll();
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo crear la dirección" });
    }
  };

  const eliminarDireccion = async (id) => {
    try {
      await api.delete(`/direcciones/${id}`);
      toast({ status: "success", title: "Dirección eliminada" });
      loadAll();
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo eliminar" });
    }
  };

  // ====== Casos (soporte) ======
  const crearCaso = async () => {
    const { titulo, descripcion } = nuevoCaso;
    if (!titulo || !descripcion) {
      toast({ status: "warning", title: "Completa título y descripción" });
      return;
    }
    try {
      await api.post("/casos", nuevoCaso);
      toast({ status: "success", title: "Caso creado" });
      setNuevoCaso({ titulo: "", descripcion: "", prioridad: "MEDIA" });
      loadAll();
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo crear el caso" });
    }
  };

  const cambiarEstadoCaso = async (id, nuevoEstado) => {
    try {
      await api.put(`/casos/${id}/estado`, { nuevoEstado });
      toast({ status: "success", title: `Caso #${id} actualizado` });
      loadAll();
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo actualizar el caso" });
    }
  };

  // ====== Notificaciones ======
  const marcarLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leida`);
      setNotifs((arr) => arr.map((n) => (n.id === id ? { ...n, leido: 1 } : n)));
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo marcar como leída" });
    }
  };

  // ====== Pago simulado ======
  const pagar = async () => {
    const { pedido_id, tarjeta } = pago;
    if (!pedido_id || !tarjeta) {
      toast({ status: "warning", title: "Ingresa pedido y tarjeta" });
      return;
    }
    try {
      const res = await api.post("/pagos", { pedido_id, tarjeta });
      toast({
        status: res.data?.aprobado ? "success" : "error",
        title: res.data?.aprobado ? "Pago aprobado" : "Pago rechazado",
      });
    } catch (e) {
      console.error(e);
      toast({ status: "error", title: "No se pudo procesar el pago" });
    }
  };

  const resumen = useMemo(() => {
    const aceptadas = cotizaciones.filter((c) => c.estado_gestion === "ACEPTADA").length;
    const rechazadas = cotizaciones.filter((c) => c.estado_gestion === "RECHAZADA").length;
    return { total: cotizaciones.length, aceptadas, rechazadas };
  }, [cotizaciones]);

  return (
    <Box bg={pageBg} p={{ base: 3, md: 6 }}>
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderCo}
        borderRadius="xl"
        p={4}
        mb={4}
      >
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Heading size="md">Panel de Empresa</Heading>
            <Text color={subtle} fontSize="sm">
              Bienvenido{user?.username ? `, ${user.username}` : ""}. Gestiona tus cotizaciones, direcciones y soporte.
            </Text>
          </VStack>
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            onClick={loadAll}
            isLoading={loading}
          >
            Actualizar
          </Button>
        </HStack>
      </Box>

      <Tabs variant="enclosed" colorScheme="yellow">
        <TabList>
          <Tab>Resumen</Tab>
          <Tab>Cotizaciones</Tab>
          <Tab>Direcciones</Tab>
          <Tab>Soporte</Tab>
          <Tab>Notificaciones</Tab>
          <Tab>FAQ</Tab>
          <Tab>Pago</Tab>
        </TabList>

        <TabPanels>
          {/* ===== Resumen ===== */}
          <TabPanel>
            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={4}>
              <Heading size="sm" mb={3}>Estado general</Heading>
              <HStack spacing={4}>
                <Badge colorScheme="blue">Cotizaciones: {resumen.total}</Badge>
                <Badge colorScheme="green">Aceptadas: {resumen.aceptadas}</Badge>
                <Badge colorScheme="red">Rechazadas: {resumen.rechazadas}</Badge>
                <Badge colorScheme="purple">Direcciones: {dirList.length}</Badge>
                <Badge colorScheme="orange">Casos: {casos.length}</Badge>
              </HStack>
            </Box>
          </TabPanel>

          {/* ===== Cotizaciones ===== */}
          <TabPanel>
            <HStack mb={3} justify="space-between">
              <Heading size="sm">Tus cotizaciones</Heading>
              <Button leftIcon={<FiPlus />} onClick={() => setCotOpen(true)}>
                Nueva cotización
              </Button>
            </HStack>

            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={3}>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Cliente</Th>
                    <Th isNumeric>Total</Th>
                    <Th>Gestión</Th>
                    <Th>Vigencia</Th>
                    <Th>Vence</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cotizaciones.map((c) => (
                    <Tr key={c.id}>
                      <Td>{c.id}</Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{c.username}</Text>
                          <Text fontSize="xs" color={subtle}>{c.email}</Text>
                        </VStack>
                      </Td>
                      <Td isNumeric>{fmtCop(c.total)}</Td>
                      <Td>
                        <Badge colorScheme={
                          c.estado_gestion === "PENDIENTE"
                            ? "yellow"
                            : c.estado_gestion === "ACEPTADA"
                            ? "green"
                            : c.estado_gestion === "RECHAZADA"
                            ? "red"
                            : "gray"
                        }>
                          {c.estado_gestion}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={c.estado_vigencia === "VIGENTE" ? "green" : "red"}>
                          {c.estado_vigencia}
                        </Badge>
                      </Td>
                      <Td>{new Date(c.fecha_vigencia).toLocaleDateString("es-CO")}</Td>
                      <Td>
                        <HStack>
                          <IconButton
                            aria-label="PDF"
                            size="sm"
                            icon={<FiDownload />}
                            onClick={() => descargarPDF(c.id)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => crearPedidoDesdeCotizacion(c.id)}
                            isDisabled={c.estado_gestion !== "ACEPTADA" || c.estado_vigencia !== "VIGENTE"}
                          >
                            Crear pedido
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {cotizaciones.length === 0 && (
                <Text mt={3} color={subtle}>No tienes cotizaciones aún.</Text>
              )}
            </Box>
          </TabPanel>

          {/* ===== Direcciones ===== */}
          <TabPanel>
            <HStack mb={3} justify="space-between">
              <Heading size="sm">Tus direcciones</Heading>
              <Button leftIcon={<FiPlus />} onClick={() => setDirOpen(true)}>
                Nueva dirección
              </Button>
            </HStack>

            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={3}>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Dirección</Th>
                    <Th>Ciudad</Th>
                    <Th>Departamento</Th>
                    <Th>Teléfono</Th>
                    <Th>Principal</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dirList.map((d) => (
                    <Tr key={d.id}>
                      <Td>{d.id}</Td>
                      <Td>{d.direccion}</Td>
                      <Td>{d.ciudad}</Td>
                      <Td>{d.departamento || "—"}</Td>
                      <Td>{d.telefono || "—"}</Td>
                      <Td>{d.es_principal ? <Badge colorScheme="green">Sí</Badge> : "No"}</Td>
                      <Td>
                        <IconButton
                          aria-label="Eliminar"
                          size="sm"
                          icon={<FiTrash2 />}
                          onClick={() => eliminarDireccion(d.id)}
                          variant="ghost"
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {dirList.length === 0 && (
                <Text mt={3} color={subtle}>Aún no has agregado direcciones.</Text>
              )}
            </Box>
          </TabPanel>

          {/* ===== Soporte / Casos ===== */}
          <TabPanel>
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={borderCo}
              borderRadius="xl"
              p={3}
              mb={4}
            >
              <Heading size="sm" mb={2}>Nuevo caso</Heading>
              <HStack spacing={3} align="start">
                <Input
                  placeholder="Título"
                  value={nuevoCaso.titulo}
                  onChange={(e) => setNuevoCaso((s) => ({ ...s, titulo: e.target.value }))}
                />
                <Select
                  maxW="180px"
                  value={nuevoCaso.prioridad}
                  onChange={(e) => setNuevoCaso((s) => ({ ...s, prioridad: e.target.value }))}
                >
                  <option value="BAJA">BAJA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="ALTA">ALTA</option>
                </Select>
              </HStack>
              <Input
                mt={2}
                placeholder="Describe el problema…"
                value={nuevoCaso.descripcion}
                onChange={(e) => setNuevoCaso((s) => ({ ...s, descripcion: e.target.value }))}
              />
              <HStack mt={3}>
                <Button onClick={crearCaso}>Crear caso</Button>
              </HStack>
            </Box>

            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={3}>
              <Heading size="sm" mb={3}>Tus casos</Heading>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Título</Th>
                    <Th>Estado</Th>
                    <Th>Prioridad</Th>
                    <Th>Acción</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {casos.map((c) => (
                    <Tr key={c.id}>
                      <Td>{c.id}</Td>
                      <Td>{c.titulo}</Td>
                      <Td>{c.estado}</Td>
                      <Td>{c.prioridad}</Td>
                      <Td>
                        <Select
                          size="sm"
                          maxW="180px"
                          onChange={(e) => cambiarEstadoCaso(c.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Cambiar estado…
                          </option>
                          <option value="EN_PROGRESO">EN_PROGRESO</option>
                          <option value="RESUELTO">RESUELTO</option>
                          <option value="CERRADO">CERRADO</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </Select>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {casos.length === 0 && (
                <Text mt={3} color={subtle}>No tienes casos aún.</Text>
              )}
            </Box>
          </TabPanel>

          {/* ===== Notificaciones ===== */}
          <TabPanel>
            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={3}>
              <Heading size="sm" mb={3}>Tus notificaciones</Heading>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Título</Th>
                    <Th>Mensaje</Th>
                    <Th>Tipo</Th>
                    <Th>Leído</Th>
                    <Th>Fecha</Th>
                    <Th>Acción</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {notifs.map((n) => (
                    <Tr key={n.id}>
                      <Td>{n.id}</Td>
                      <Td>{n.titulo}</Td>
                      <Td>{n.mensaje}</Td>
                      <Td>{n.tipo}</Td>
                      <Td>{n.leido ? "Sí" : "No"}</Td>
                      <Td>{new Date(n.fecha).toLocaleString("es-CO")}</Td>
                      <Td>
                        {!n.leido && (
                          <Button size="xs" onClick={() => marcarLeida(n.id)}>
                            Marcar leída
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {notifs.length === 0 && (
                <Text mt={3} color={subtle}>No tienes notificaciones.</Text>
              )}
            </Box>
          </TabPanel>

          {/* ===== FAQ ===== */}
          <TabPanel>
            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={3}>
              <Heading size="sm" mb={3}>Preguntas frecuentes</Heading>
              {faqs.map((f) => (
                <Box key={f.id} p={3} border="1px solid" borderColor={borderCo} borderRadius="md" mb={3}>
                  <Text fontWeight="semibold">{f.pregunta}</Text>
                  <Divider my={2} />
                  <Text fontSize="sm">{f.respuesta}</Text>
                </Box>
              ))}
              {faqs.length === 0 && (
                <Text color={subtle}>No hay preguntas frecuentes por ahora.</Text>
              )}
            </Box>
          </TabPanel>

          {/* ===== Pago simulado ===== */}
          <TabPanel>
            <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl" p={3}>
              <Heading size="sm" mb={3}>Pagar pedido (simulado)</Heading>
              <HStack>
                <NumberInput value={pago.pedido_id} onChange={(_, v) => setPago((s) => ({ ...s, pedido_id: v || "" }))}>
                  <NumberInputField placeholder="ID de pedido" />
                </NumberInput>
                <Input
                  placeholder="Número de tarjeta (último dígito par = aprobado)"
                  value={pago.tarjeta}
                  onChange={(e) => setPago((s) => ({ ...s, tarjeta: e.target.value }))}
                />
                <Button onClick={pagar}>Pagar</Button>
              </HStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ===== Modal: nueva cotización ===== */}
      <Modal isOpen={cotOpen} onClose={() => setCotOpen(false)} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva cotización</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              {items.map((it, idx) => (
                <HStack key={idx}>
                  <NumberInput
                    value={it.producto_id}
                    onChange={(_, v) => changeItem(idx, "producto_id", v || "")}
                  >
                    <NumberInputField placeholder="ID producto" />
                  </NumberInput>
                  <NumberInput
                    min={1}
                    value={it.cantidad}
                    onChange={(_, v) => changeItem(idx, "cantidad", v || 1)}
                  >
                    <NumberInputField placeholder="Cantidad" />
                  </NumberInput>
                  <IconButton
                    aria-label="Eliminar"
                    icon={<FiTrash2 />}
                    onClick={() => removeItem(idx)}
                    variant="ghost"
                  />
                </HStack>
              ))}
              <Button leftIcon={<FiPlus />} variant="ghost" onClick={addItem}>
                Agregar ítem
              </Button>
              <Text fontSize="sm" color={subtle}>
                * Ingresa IDs reales de productos (puedes verlos en /productos del admin).
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={() => setCotOpen(false)}>
                Cancelar
              </Button>
              <Button colorScheme="yellow" onClick={crearCotizacion}>
                Crear
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ===== Modal: nueva dirección ===== */}
      <Modal isOpen={dirOpen} onClose={() => setDirOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva dirección</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={2}>
              <Input
                placeholder="Dirección"
                value={dirForm.direccion}
                onChange={(e) => setDirForm((s) => ({ ...s, direccion: e.target.value }))}
              />
              <Input
                placeholder="Ciudad"
                value={dirForm.ciudad}
                onChange={(e) => setDirForm((s) => ({ ...s, ciudad: e.target.value }))}
              />
              <Input
                placeholder="Departamento"
                value={dirForm.departamento}
                onChange={(e) => setDirForm((s) => ({ ...s, departamento: e.target.value }))}
              />
              <Input
                placeholder="País"
                value={dirForm.pais}
                onChange={(e) => setDirForm((s) => ({ ...s, pais: e.target.value }))}
              />
              <Input
                placeholder="Teléfono"
                value={dirForm.telefono}
                onChange={(e) => setDirForm((s) => ({ ...s, telefono: e.target.value }))}
              />
              <Select
                value={dirForm.es_principal}
                onChange={(e) => setDirForm((s) => ({ ...s, es_principal: Number(e.target.value) }))}
              >
                <option value={0}>¿Principal? No</option>
                <option value={1}>¿Principal? Sí</option>
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button variant="ghost" onClick={() => setDirOpen(false)}>
                Cancelar
              </Button>
              <Button colorScheme="yellow" onClick={crearDireccion}>
                Guardar
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
