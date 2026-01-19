// src/pages/cliente/PerfilCliente.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  AvatarBadge,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagLabel,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  InputGroup,
  InputLeftElement,
  Textarea,
  FormErrorMessage,
} from "@chakra-ui/react";

import {
  FiRefreshCw,
  FiUser,
  FiLock,
  FiMapPin,
  FiBell,
  FiTruck,
  FiHelpCircle,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiLifeBuoy,
  FiShield,
  FiPackage,
  FiHome,
  FiArrowRight,
  FiBriefcase,
  FiHash,
  FiPhone,
  FiMessageSquare,
  FiChevronsRight,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

// --- UTILIDADES ---
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const ESTADOS_PEDIDO_ACTIVOS = ["PENDIENTE", "PAGADO", "ENVIADO"];

// =====================
// Tabs Custom (mejorado)
// =====================
function CustomTab({ icon, label, isMobile, ...props }) {
  const selectedColor = useColorModeValue("yellow.800", "yellow.200");
  const selectedBg = useColorModeValue("yellow.50", "whiteAlpha.100");
  const selectedIconColor = useColorModeValue("yellow.600", "yellow.300");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const baseIconColor = useColorModeValue("gray.500", "gray.300");
  const baseTextColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Tab
      justifyContent={isMobile ? "center" : "flex-start"}
      py={4}
      px={6}
      borderRight={isMobile ? "none" : "3px solid transparent"}
      borderBottom={isMobile ? "3px solid transparent" : "none"}
      _hover={{ bg: hoverBg }}
      transition="all 0.2s"
      flexShrink={0}
      sx={{
        "&[aria-selected=true]": {
          color: selectedColor,
          bg: selectedBg,
          borderRightColor: isMobile ? "transparent" : "yellow.400",
          borderBottomColor: isMobile ? "yellow.400" : "transparent",
        },
        "&[aria-selected=true] .tabIcon": { color: selectedIconColor },
        "&[aria-selected=true] .tabLabel": { color: selectedColor },
      }}
      {...props}
    >
      <Icon
        as={icon}
        mr={isMobile ? 2 : 4}
        boxSize={5}
        className="tabIcon"
        color={baseIconColor}
      />
      <Text
        className="tabLabel"
        fontWeight="medium"
        color={baseTextColor}
        fontSize={isMobile ? "sm" : "md"}
      >
        {label}
      </Text>
    </Tab>
  );
}

// =====================
// Stat Card
// =====================
function StatCard({ label, number, icon, helpText, bgCard, borderColor }) {
  return (
    <Stat
      px={5}
      py={4}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      bg={bgCard}
      boxShadow="sm"
      transition="transform 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
    >
      <Flex justify="space-between" align="flex-start">
        <Box>
          <StatLabel color="gray.500" fontWeight="medium">
            {label}
          </StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold" my={1}>
            {number}
          </StatNumber>
          <StatHelpText fontSize="sm" color="gray.400" mb={0}>
            {helpText}
          </StatHelpText>
        </Box>
        <Flex p={3} bg="yellow.100" borderRadius="lg" align="center" justify="center">
          <Icon as={icon} color="yellow.700" boxSize={6} />
        </Flex>
      </Flex>
    </Stat>
  );
}

// =========================================
// COMPONENTE PRINCIPAL: PerfilCliente
// =========================================
export default function PerfilCliente() {
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const { user, loading: authLoading, setUserFromToken } = useAuth();

  // THEME
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const brandColor = "yellow.400";

  // === Estados ===
  const [perfil, setPerfil] = useState(null);
  const [perfilLoading, setPerfilLoading] = useState(true);
  const [perfilSaving, setPerfilSaving] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const [direcciones, setDirecciones] = useState([]);
  const [dirLoading, setDirLoading] = useState(true);
  const [dirSaving, setDirSaving] = useState(false);
  const {
    isOpen: isDirModalOpen,
    onOpen: onDirModalOpen,
    onClose: onDirModalClose,
  } = useDisclosure();
  const [editandoDireccion, setEditandoDireccion] = useState(null);
  const [dirForm, setDirForm] = useState({
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "Colombia",
    telefono: "",
    es_principal: false,
  });

  const [pedidos, setPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);

  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  const [prefNotif, setPrefNotif] = useState({
    estadoPedido: true,
    soporte: true,
    marketing: false,
  });

  // ✅ Modal Convertir Empresa
  const convertirModal = useDisclosure();

  // ✅ Notificaciones: paginación
  const [notifPageSize, setNotifPageSize] = useState(10); // 5 o 10
  const [notifPage, setNotifPage] = useState(0);

  // === CARGA DE DATOS ===
  const loadData = async () => {
    setPerfilLoading(true);
    setPedidosLoading(true);
    setNotifLoading(true);
    setDirLoading(true);

    try {
      const [perfilRes, dirRes, pedRes, notifRes] = await Promise.allSettled([
        api.get("/auth/perfil"),
        api.get("/direcciones"),
        api.get("/pedidos/mios"),
        api.get("/notificaciones"),
      ]);

      if (perfilRes.status === "fulfilled") {
        setPerfil(perfilRes.value.data);
        setNombre(perfilRes.value.data?.username || "");
        setTelefono(perfilRes.value.data?.telefono || "");
      }
      if (dirRes.status === "fulfilled") {
        setDirecciones(Array.isArray(dirRes.value.data) ? dirRes.value.data : []);
      }
      if (pedRes.status === "fulfilled") {
        setPedidos(Array.isArray(pedRes.value.data) ? pedRes.value.data : []);
      }
      if (notifRes.status === "fulfilled") {
        setNotificaciones(Array.isArray(notifRes.value.data) ? notifRes.value.data : []);
      }
    } catch (e) {
      // Silencioso para no spamear
    } finally {
      setPerfilLoading(false);
      setPedidosLoading(false);
      setNotifLoading(false);
      setDirLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === CALCULADOS ===
  const resumenPedidos = useMemo(() => {
    const totalPedidos = pedidos.length;
    const pedidosActivos = pedidos.filter((p) =>
      ESTADOS_PEDIDO_ACTIVOS.includes(p.estado)
    ).length;
    const totalGastado = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
    return { totalPedidos, pedidosActivos, totalGastado };
  }, [pedidos]);

  const pedidosOrdenados = useMemo(() => {
    return [...pedidos].sort(
      (a, b) => new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0)
    );
  }, [pedidos]);

  const ultimosPedidos = useMemo(() => pedidosOrdenados.slice(0, 3), [pedidosOrdenados]);

  // ✅ Notificaciones ordenadas + paginadas (últimas primero)
  const notifsOrdenadas = useMemo(() => {
    const getTime = (n) => {
      const raw =
        n?.fecha_creacion || n?.created_at || n?.createdAt || n?.fecha || null;
      const t = raw ? new Date(raw).getTime() : NaN;
      if (!Number.isNaN(t)) return t;
      // fallback: por id (asumiendo creciente)
      return Number(n?.id || 0);
    };

    return [...notificaciones].sort((a, b) => getTime(b) - getTime(a));
  }, [notificaciones]);

  const notifTotal = notifsOrdenadas.length;
  const notifTotalPages = Math.max(1, Math.ceil(notifTotal / notifPageSize));

  const notifStart = notifPage * notifPageSize;
  const notifEnd = Math.min(notifStart + notifPageSize, notifTotal);

  const notifsPagina = useMemo(() => {
    return notifsOrdenadas.slice(notifStart, notifEnd);
  }, [notifsOrdenadas, notifStart, notifEnd]);

  // Reset page cuando cambia el size o llega nueva data
  useEffect(() => {
    setNotifPage(0);
  }, [notifPageSize, notifTotal]);

  // === HANDLERS ===
  const handleGuardarPerfil = async () => {
    if (!nombre.trim()) return;
    setPerfilSaving(true);
    try {
      await api.put("/auth/perfil", {
        username: nombre.trim(),
        telefono: telefono.trim() || null,
      });
      toast({ title: "Perfil actualizado", status: "success", duration: 2000 });
      loadData();
    } catch (e) {
      toast({ title: "Error", status: "error" });
    } finally {
      setPerfilSaving(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!oldPassword || !newPassword || !newPassword2) return;

    if (newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "Debe tener al menos 6 caracteres.",
        status: "warning",
      });
      return;
    }

    if (newPassword !== newPassword2) {
      toast({
        title: "No coinciden",
        description: "Confirma la nueva contraseña correctamente.",
        status: "warning",
      });
      return;
    }

    setPwSaving(true);
    try {
      await api.put("/auth/change-password", { oldPassword, newPassword });
      toast({ title: "Contraseña actualizada", status: "success" });
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e) {
      toast({
        title: "Error",
        description: e.response?.data?.error,
        status: "error",
      });
    } finally {
      setPwSaving(false);
    }
  };

  const abrirCrearDireccion = () => {
    setEditandoDireccion(null);
    setDirForm({
      direccion: "",
      ciudad: "",
      departamento: "",
      pais: "Colombia",
      telefono: "",
      es_principal: direcciones.length === 0,
    });
    onDirModalOpen();
  };

  const abrirEditarDireccion = (dir) => {
    setEditandoDireccion(dir);
    setDirForm({ ...dir, es_principal: !!dir.es_principal });
    onDirModalOpen();
  };

  const handleChangeDirForm = (field, value) => {
    setDirForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardarDireccion = async () => {
    if (!dirForm.direccion.trim()) return;
    setDirSaving(true);
    try {
      if (editandoDireccion)
        await api.put(`/direcciones/${editandoDireccion.id}`, { ...dirForm });
      else await api.post("/direcciones", { ...dirForm });

      toast({ title: "Dirección guardada", status: "success" });
      loadData();
      onDirModalClose();
    } catch (e) {
      toast({ title: "Error", status: "error" });
    } finally {
      setDirSaving(false);
    }
  };

  const handleEliminarDireccion = async (dir) => {
    if (!window.confirm("¿Eliminar dirección?")) return;
    try {
      await api.delete(`/direcciones/${dir.id}`);
      loadData();
    } catch (e) {}
  };

  const handleMarcarPrincipal = async (dir) => {
    try {
      await api.put(`/direcciones/${dir.id}`, { ...dir, es_principal: true });
      loadData();
    } catch (e) {}
  };

  const handleMarcarNotifLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leida`);
      loadData();
    } catch (e) {}
  };

  const roleUpper = String(user?.role || "").toUpperCase();
  const yaEsEmpresa = roleUpper === "CONTRATISTA" || roleUpper === "EMPRESA";

  // =========================================
  // RENDER
  // =========================================
  return (
    <Box bg={bgPage} minH="100vh" py={8}>
      <Container maxW="container.xl">
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="xl"
          border="1px solid"
          borderColor={borderColor}
          overflow="hidden"
        >
          {/* HEADER */}
          <Box
            borderBottom="1px solid"
            borderColor={borderColor}
            bg={useColorModeValue("white", "gray.800")}
            p={{ base: 5, md: 8 }}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "start", md: "center" }}
              justify="space-between"
              gap={6}
            >
              <HStack spacing={5}>
                <Box position="relative">
                  <Avatar
                    size="xl"
                    name={perfil?.username}
                    src="https://bit.ly/broken-link"
                    border="4px solid"
                    borderColor={brandColor}
                    showBorder
                  >
                    <AvatarBadge
                      boxSize="1em"
                      bg={perfil?.estado === "ACTIVO" ? "green.400" : "red.400"}
                      border="3px solid white"
                    />
                  </Avatar>
                </Box>

                <VStack align="start" spacing={1}>
                  {perfilLoading ? (
                    <Skeleton height="32px" w="250px" borderRadius="md" />
                  ) : (
                    <Heading size="lg" color={useColorModeValue("gray.800", "white")}>
                      Hola, {perfil?.username?.split(" ")[0] || "Cliente"}
                    </Heading>
                  )}
                  <Text color="gray.500" fontSize="md" fontWeight="medium">
                    Panel de Gestión FerreExpress
                  </Text>

                  <HStack mt={1}>
                    <Tag
                      size="sm"
                      variant="solid"
                      colorScheme="yellow"
                      borderRadius="full"
                    >
                      <TagLabel fontWeight="bold">Cliente Verificado</TagLabel>
                    </Tag>
                  </HStack>
                </VStack>
              </HStack>

              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={3}
                w={{ base: "full", md: "auto" }}
              >
                <Button
                  variant="outline"
                  leftIcon={<FiRefreshCw />}
                  onClick={loadData}
                  isLoading={perfilLoading}
                  w={{ base: "full", sm: "auto" }}
                >
                  Actualizar
                </Button>

                <Button
                  colorScheme="yellow"
                  leftIcon={<FiTruck />}
                  onClick={() => navigate("/cliente/pedidos")}
                  boxShadow="md"
                  w={{ base: "full", sm: "auto" }}
                >
                  Mis Pedidos
                </Button>
              </Stack>
            </Flex>
          </Box>

          {/* TABS */}
          <Tabs
            orientation={isMobile ? "horizontal" : "vertical"}
            variant="unstyled"
            colorScheme="yellow"
            defaultIndex={0}
            isLazy
            minH="520px"
          >
            <TabList
              borderRight={!isMobile ? "1px solid" : "none"}
              borderBottom={isMobile ? "1px solid" : "none"}
              borderColor={borderColor}
              w={!isMobile ? "280px" : "100%"}
              bg={useColorModeValue("gray.50", "gray.900")}
              py={isMobile ? 2 : 6}
              overflowX={isMobile ? "auto" : "visible"}
              whiteSpace={isMobile ? "nowrap" : "normal"}
              css={{
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <Stack
                spacing={isMobile ? 0 : 1}
                direction={isMobile ? "row" : "column"}
                px={isMobile ? 2 : 4}
                w="full"
              >
                <CustomTab icon={FiHome} label="Resumen General" isMobile={isMobile} />
                <CustomTab icon={FiUser} label="Datos Personales" isMobile={isMobile} />
                <CustomTab icon={FiMapPin} label="Mis Direcciones" isMobile={isMobile} />
                <CustomTab icon={FiShield} label="Seguridad" isMobile={isMobile} />
                <CustomTab icon={FiBell} label="Notificaciones" isMobile={isMobile} />
                {/* ✅ NUEVO */}
                <CustomTab icon={FiBriefcase} label="Perfil Empresa" isMobile={isMobile} />
                <CustomTab icon={FiHelpCircle} label="Ayuda y Soporte" isMobile={isMobile} />
              </Stack>
            </TabList>

            <TabPanels px={{ base: 5, md: 10 }} py={{ base: 6, md: 8 }} bg={cardBg}>
              {/* TAB 1: RESUMEN */}
              <TabPanel p={0}>
                <Heading size="md" mb={6}>
                  Resumen de Actividad
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
                  <StatCard
                    label="Pedidos Activos"
                    number={resumenPedidos.pedidosActivos}
                    icon={FiTruck}
                    helpText="En proceso de entrega"
                    bgCard={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Total Gastado Histórico"
                    number={fmtCop(resumenPedidos.totalGastado)}
                    icon={FiPackage}
                    helpText="Acumulado en compras"
                    bgCard={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Total de Pedidos"
                    number={resumenPedidos.totalPedidos}
                    icon={FiRefreshCw}
                    helpText="Transacciones finalizadas"
                    bgCard={cardBg}
                    borderColor={borderColor}
                  />
                </SimpleGrid>

                <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={8}>
                  {/* Últimos pedidos */}
                  <GridItem>
                    <Flex justify="space-between" align="center" mb={5}>
                      <Heading size="sm">Pedidos Recientes</Heading>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="yellow"
                        rightIcon={<FiArrowRight />}
                        onClick={() => navigate("/cliente/pedidos")}
                      >
                        Ver historial completo
                      </Button>
                    </Flex>

                    <Stack spacing={4}>
                      {pedidosLoading && (
                        <Stack>
                          <Skeleton height="60px" />
                          <Skeleton height="60px" />
                        </Stack>
                      )}

                      {!pedidosLoading &&
                        ultimosPedidos.map((p) => (
                          <Flex
                            key={p.id}
                            p={4}
                            bg={useColorModeValue("gray.50", "gray.700")}
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="xl"
                            align="center"
                            justify="space-between"
                            _hover={{ borderColor: brandColor, boxShadow: "sm" }}
                            transition="all 0.2s"
                            role="group"
                          >
                            <HStack spacing={4}>
                              <Icon
                                as={FiPackage}
                                boxSize={8}
                                color="gray.400"
                                _groupHover={{ color: brandColor }}
                              />
                              <Box>
                                <Text fontWeight="bold" fontSize="md">
                                  Pedido #{p.id}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {new Date(p.fecha_creacion).toLocaleDateString()}
                                </Text>
                              </Box>
                            </HStack>

                            <Box textAlign="right">
                              <Badge
                                colorScheme={
                                  p.estado === "PENDIENTE"
                                    ? "orange"
                                    : String(p.estado || "").includes("PAGADO")
                                    ? "green"
                                    : "blue"
                                }
                                variant="subtle"
                                px={2}
                                py={1}
                                borderRadius="full"
                                mb={1}
                              >
                                {p.estado}
                              </Badge>
                              <Text fontWeight="extrabold" fontSize="md">
                                {fmtCop(p.total)}
                              </Text>
                            </Box>
                          </Flex>
                        ))}

                      {!pedidosLoading && ultimosPedidos.length === 0 && (
                        <Box
                          textAlign="center"
                          p={5}
                          border="2px dashed"
                          borderColor={borderColor}
                          borderRadius="lg"
                        >
                          <Text color="gray.500">No tienes pedidos recientes.</Text>
                        </Box>
                      )}
                    </Stack>
                  </GridItem>

                  {/* Novedades */}
                  <GridItem>
                    <Heading size="sm" mb={5}>
                      Novedades y Avisos
                    </Heading>

                    <Stack spacing={4}>
                      <Alert
                        status="info"
                        variant="subtle"
                        flexDirection="column"
                        alignItems="start"
                        p={5}
                        borderRadius="xl"
                        bg="blue.50"
                        border="1px solid"
                        borderColor="blue.100"
                      >
                        <HStack mb={2}>
                          <AlertIcon boxSize={5} mr={2} />
                          <AlertTitle fontSize="md" fontWeight="bold">
                            Horario Festivo
                          </AlertTitle>
                        </HStack>
                        <AlertDescription fontSize="sm" color="blue.700">
                          Este lunes festivo nuestra bodega no operará. Planifica tus pedidos.
                        </AlertDescription>
                      </Alert>

                      <Box
                        p={5}
                        bg="yellow.50"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="yellow.200"
                      >
                        <HStack mb={3}>
                          <Icon as={FiLifeBuoy} color="yellow.600" boxSize={5} />
                          <Text fontSize="md" fontWeight="bold" color="yellow.800">
                            ¿Ventas al por mayor?
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color="yellow.900" mb={4}>
                          Si eres contratista o necesitas grandes volúmenes, conviértete a Empresa y
                          accede al flujo B2B.
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="yellow"
                          w="full"
                          onClick={() => convertirModal.onOpen()}
                        >
                          Convertirme a Empresa
                        </Button>
                      </Box>
                    </Stack>
                  </GridItem>
                </Grid>
              </TabPanel>

              {/* TAB 2: DATOS PERSONALES */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Mi Información Personal
                </Heading>
                <Text color="gray.500" mb={8}>
                  Actualiza tus datos de contacto básicos para que podamos ubicarte.
                </Text>

                <Box maxW="700px">
                  <Stack spacing={6}>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                      <FormControl>
                        <FormLabel fontWeight="bold">Nombre de Usuario</FormLabel>
                        <Input
                          size="lg"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          bg={useColorModeValue("white", "gray.700")}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="bold">Teléfono de Contacto</FormLabel>
                        <Input
                          size="lg"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          placeholder="Ej: 300 123 4567"
                          bg={useColorModeValue("white", "gray.700")}
                        />
                      </FormControl>
                    </Grid>

                    <FormControl isDisabled>
                      <FormLabel fontWeight="bold">Correo (ID de cuenta)</FormLabel>
                      <Input
                        size="lg"
                        value={perfil?.email || ""}
                        bg={useColorModeValue("gray.100", "gray.600")}
                        cursor="not-allowed"
                      />
                      <FormHelperText>
                        Por seguridad, el correo no se puede cambiar directamente.
                      </FormHelperText>
                    </FormControl>

                    <Divider my={4} />

                    <HStack justify="flex-end">
                      <Button
                        size="lg"
                        colorScheme="yellow"
                        onClick={handleGuardarPerfil}
                        isLoading={perfilSaving}
                        loadingText="Guardando..."
                      >
                        Guardar Cambios
                      </Button>
                    </HStack>
                  </Stack>
                </Box>
              </TabPanel>

              {/* TAB 3: DIRECCIONES */}
              <TabPanel p={0}>
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                  align={{ base: "start", sm: "center" }}
                  mb={8}
                  gap={4}
                >
                  <Box>
                    <Heading size="md">Libreta de Direcciones</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Gestiona tus puntos de entrega frecuentes.
                    </Text>
                  </Box>
                  <Button leftIcon={<FiPlus />} colorScheme="yellow" onClick={abrirCrearDireccion}>
                    Nueva Dirección
                  </Button>
                </Flex>

                {dirLoading && (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                    <Skeleton height="180px" borderRadius="xl" />
                    <Skeleton height="180px" borderRadius="xl" />
                  </SimpleGrid>
                )}

                {!dirLoading && direcciones.length === 0 && (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={16}
                    border="2px dashed"
                    borderColor={borderColor}
                    borderRadius="xl"
                    bg={useColorModeValue("gray.50", "gray.900")}
                  >
                    <Icon as={FiMapPin} boxSize={12} color="gray.300" mb={4} />
                    <Heading size="sm" color="gray.500" mb={2}>
                      No tienes direcciones guardadas
                    </Heading>
                    <Text fontSize="sm" color="gray.400" mb={4}>
                      Agrega tu primera dirección para agilizar tus pedidos.
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="yellow"
                      onClick={abrirCrearDireccion}
                    >
                      Agregar Dirección
                    </Button>
                  </Flex>
                )}

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                  {direcciones.map((dir) => (
                    <Flex
                      key={dir.id}
                      direction="column"
                      justify="space-between"
                      p={5}
                      border="2px solid"
                      borderColor={dir.es_principal ? brandColor : borderColor}
                      bg={
                        dir.es_principal
                          ? useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)")
                          : cardBg
                      }
                      borderRadius="xl"
                      position="relative"
                      transition="all 0.2s"
                      _hover={{ boxShadow: "md" }}
                    >
                      {dir.es_principal && (
                        <Badge
                          position="absolute"
                          top={4}
                          right={4}
                          colorScheme="yellow"
                          variant="solid"
                          borderRadius="full"
                          px={3}
                        >
                          Principal
                        </Badge>
                      )}

                      <Box>
                        <HStack mb={3}>
                          <Icon
                            as={FiMapPin}
                            color={dir.es_principal ? "yellow.600" : "gray.400"}
                            boxSize={5}
                          />
                          <Heading size="sm">
                            {dir.ciudad}{" "}
                            <Text as="span" fontWeight="normal" color="gray.500">
                              | {dir.departamento}
                            </Text>
                          </Heading>
                        </HStack>

                        <Text fontSize="lg" fontWeight="bold" mb={1}>
                          {dir.direccion}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          País: {dir.pais}
                        </Text>
                        <Text fontSize="sm" color="gray.600" mb={4}>
                          Teléfono contacto: {dir.telefono || "No registrado"}
                        </Text>
                      </Box>

                      <HStack
                        spacing={2}
                        pt={4}
                        borderTop="1px solid"
                        borderColor={borderColor}
                        justify="flex-end"
                      >
                        <Tooltip label="Editar">
                          <IconButton
                            icon={<FiEdit2 />}
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirEditarDireccion(dir)}
                            aria-label="Editar"
                          />
                        </Tooltip>

                        <Tooltip label="Eliminar">
                          <IconButton
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleEliminarDireccion(dir)}
                            aria-label="Eliminar"
                          />
                        </Tooltip>

                        {!dir.es_principal && (
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="yellow"
                            onClick={() => handleMarcarPrincipal(dir)}
                          >
                            Hacer Principal
                          </Button>
                        )}
                      </HStack>
                    </Flex>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* TAB 4: SEGURIDAD */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Seguridad y Contraseña
                </Heading>
                <Text color="gray.500" mb={8}>
                  Mantén tu cuenta segura actualizando tu contraseña periódicamente.
                </Text>

                <Flex justify="center">
                  <Box
                    w="full"
                    maxW="550px"
                    p={{ base: 6, md: 8 }}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="2xl"
                    bg={useColorModeValue("gray.50", "gray.900")}
                  >
                    <HStack mb={6} justify="center">
                      <Icon as={FiLock} color="yellow.500" boxSize={6} />
                      <Heading size="sm">Cambiar Contraseña</Heading>
                    </HStack>

                    <Stack spacing={5}>
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" fontSize="sm">
                          Contraseña Actual
                        </FormLabel>
                        <Input
                          type="password"
                          size="lg"
                          bg={cardBg}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" fontSize="sm">
                          Nueva Contraseña
                        </FormLabel>
                        <Input
                          type="password"
                          size="lg"
                          bg={cardBg}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <FormHelperText>Mínimo 6 caracteres.</FormHelperText>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" fontSize="sm">
                          Confirmar Nueva Contraseña
                        </FormLabel>
                        <Input
                          type="password"
                          size="lg"
                          bg={cardBg}
                          value={newPassword2}
                          onChange={(e) => setNewPassword2(e.target.value)}
                        />
                      </FormControl>

                      <Button
                        size="lg"
                        colorScheme="yellow"
                        w="full"
                        mt={4}
                        onClick={handleCambiarPassword}
                        isLoading={pwSaving}
                      >
                        Actualizar Contraseña
                      </Button>
                    </Stack>
                  </Box>
                </Flex>
              </TabPanel>

              {/* TAB 5: NOTIFICACIONES (✅ PAGINADAS) */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Centro de Notificaciones
                </Heading>
                <Text color="gray.500" mb={6}>
                  Historial de alertas y mensajes importantes del sistema.
                </Text>

                {/* Preferencias rápidas */}
                <Box
                  bg={useColorModeValue("gray.50", "gray.800")}
                  p={6}
                  borderRadius="xl"
                  mb={6}
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <Heading
                    size="xs"
                    mb={4}
                    textTransform="uppercase"
                    color="gray.500"
                    letterSpacing="wider"
                  >
                    Preferencias de Alerta (Visuales)
                  </Heading>

                  <Stack direction={{ base: "column", sm: "row" }} spacing={{ base: 4, sm: 8 }}>
                    <HStack>
                      <Switch
                        size="md"
                        isChecked={prefNotif.estadoPedido}
                        onChange={(e) =>
                          setPrefNotif((p) => ({ ...p, estadoPedido: e.target.checked }))
                        }
                        colorScheme="yellow"
                      />
                      <Text fontWeight="medium">Pedidos</Text>
                    </HStack>

                    <HStack>
                      <Switch
                        size="md"
                        isChecked={prefNotif.soporte}
                        onChange={(e) =>
                          setPrefNotif((p) => ({ ...p, soporte: e.target.checked }))
                        }
                        colorScheme="yellow"
                      />
                      <Text fontWeight="medium">Soporte</Text>
                    </HStack>

                    <HStack>
                      <Switch
                        size="md"
                        isChecked={prefNotif.marketing}
                        onChange={(e) =>
                          setPrefNotif((p) => ({ ...p, marketing: e.target.checked }))
                        }
                        colorScheme="yellow"
                      />
                      <Text fontWeight="medium">Ofertas</Text>
                    </HStack>
                  </Stack>
                </Box>

                {/* ✅ Controles de paginación */}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  gap={3}
                  align={{ base: "stretch", md: "center" }}
                  justify="space-between"
                  mb={4}
                >
                  <HStack spacing={3}>
                    <Text fontSize="sm" color="gray.500">
                      Mostrando{" "}
                      <b>{notifTotal === 0 ? 0 : notifStart + 1}</b>–<b>{notifEnd}</b> de{" "}
                      <b>{notifTotal}</b>
                    </Text>

                    <HStack>
                      <Text fontSize="sm" color="gray.500">
                        Ver:
                      </Text>
                      <Select
                        size="sm"
                        value={notifPageSize}
                        onChange={(e) => setNotifPageSize(Number(e.target.value))}
                        w="90px"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                      </Select>
                    </HStack>
                  </HStack>

                  <HStack justify={{ base: "flex-end", md: "flex-end" }}>
                    <Button
                      size="sm"
                      leftIcon={<FiChevronLeft />}
                      variant="outline"
                      onClick={() => setNotifPage((p) => Math.max(0, p - 1))}
                      isDisabled={notifPage <= 0}
                    >
                      Anterior
                    </Button>

                    <Text fontSize="sm" color="gray.500">
                      Página <b>{Math.min(notifPage + 1, notifTotalPages)}</b> / <b>{notifTotalPages}</b>
                    </Text>

                    <Button
                      size="sm"
                      rightIcon={<FiChevronRight />}
                      variant="outline"
                      onClick={() => setNotifPage((p) => Math.min(notifTotalPages - 1, p + 1))}
                      isDisabled={notifPage >= notifTotalPages - 1}
                    >
                      Siguiente
                    </Button>
                  </HStack>
                </Flex>

                {/* Lista */}
                <VStack spacing={4} align="stretch">
                  {notifLoading && <Skeleton height="80px" borderRadius="xl" />}

                  {!notifLoading &&
                    notifsPagina.map((n) => (
                      <Flex
                        key={n.id}
                        p={5}
                        bg={n.leido ? cardBg : useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)")}
                        border="1px solid"
                        borderColor={n.leido ? borderColor : "yellow.300"}
                        borderRadius="xl"
                        justify="space-between"
                        align={{ base: "start", sm: "center" }}
                        direction={{ base: "column", sm: "row" }}
                        gap={4}
                      >
                        <HStack align="start" spacing={4}>
                          <Flex
                            mt={1}
                            boxSize={8}
                            bg={n.leido ? "gray.100" : "yellow.200"}
                            borderRadius="full"
                            align="center"
                            justify="center"
                          >
                            <Icon
                              as={FiBell}
                              color={n.leido ? "gray.500" : "yellow.800"}
                              boxSize={4}
                            />
                          </Flex>

                          <Box>
                            <Text
                              fontWeight={n.leido ? "semibold" : "bold"}
                              fontSize="md"
                              color={n.leido ? "gray.700" : useColorModeValue("black", "white")}
                            >
                              {n.titulo}
                            </Text>
                            <Text fontSize="sm" color={n.leido ? "gray.500" : "gray.700"} mt={1}>
                              {n.mensaje}
                            </Text>
                          </Box>
                        </HStack>

                        {!n.leido && (
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="yellow"
                            onClick={() => handleMarcarNotifLeida(n.id)}
                            alignSelf={{ base: "flex-end", sm: "center" }}
                          >
                            Marcar como leída
                          </Button>
                        )}
                      </Flex>
                    ))}

                  {!notifLoading && notifTotal === 0 && (
                    <Box
                      p={8}
                      textAlign="center"
                      border="1px dashed"
                      borderColor={borderColor}
                      borderRadius="xl"
                    >
                      <Icon as={FiBell} boxSize={8} color="gray.300" mb={2} />
                      <Text color="gray.500">No tienes notificaciones.</Text>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* ✅ TAB 6: PERFIL EMPRESA (nuevo) */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Perfil Empresa
                </Heading>
                <Text color="gray.500" mb={6}>
                  Accede a proformas B2B, descuentos por volumen y flujo por proyecto.
                </Text>

                {authLoading ? (
                  <Skeleton h="120px" borderRadius="xl" />
                ) : yaEsEmpresa ? (
                  <Alert status="success" borderRadius="xl" variant="subtle" mb={6}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Ya tienes perfil Empresa</AlertTitle>
                      <AlertDescription>
                        Tu cuenta ya es Contratista/Empresa. Puedes ir al panel Empresa cuando quieras.
                      </AlertDescription>
                      <HStack mt={4}>
                        <Button colorScheme="yellow" onClick={() => navigate("/empresa")}>
                          Ir a panel Empresa
                        </Button>
                      </HStack>
                    </Box>
                  </Alert>
                ) : (
                  <Box
                    p={{ base: 5, md: 6 }}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="2xl"
                    bg={useColorModeValue("yellow.50", "whiteAlpha.50")}
                  >
                    <HStack align="start" spacing={4}>
                      <Flex
                        boxSize="44px"
                        borderRadius="xl"
                        bg={useColorModeValue("yellow.100", "whiteAlpha.200")}
                        align="center"
                        justify="center"
                        flex="0 0 auto"
                      >
                        <Icon as={FiBriefcase} boxSize={6} color={useColorModeValue("yellow.700", "yellow.200")} />
                      </Flex>

                      <Box flex={1}>
                        <Heading size="sm" mb={1}>
                          Convertirte a Contratista
                        </Heading>
                        <Text fontSize="sm" color="gray.600">
                          Te pedimos lo esencial (NIT y Razón Social). Luego podrás completar tu perfil Empresa.
                        </Text>

                        <HStack mt={4} spacing={3}>
                          <Button colorScheme="yellow" onClick={convertirModal.onOpen}>
                            Convertirme ahora
                          </Button>
                          <Button variant="outline" onClick={() => navigate("/cliente/about")}>
                            Ver propuesta
                          </Button>
                        </HStack>
                      </Box>
                    </HStack>
                  </Box>
                )}
              </TabPanel>

              {/* TAB 7: AYUDA */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Centro de Ayuda
                </Heading>
                <Text color="gray.500" mb={8}>
                  ¿Tienes alguna duda o inconveniente? Estamos para ayudarte.
                </Text>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                  <Flex
                    direction="column"
                    p={8}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="2xl"
                    bg={cardBg}
                    textAlign="center"
                    align="center"
                    _hover={{ borderColor: brandColor, boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <Icon as={FiLifeBuoy} boxSize={12} color="yellow.500" mb={6} />
                    <Heading size="md" mb={3}>
                      Soporte Técnico
                    </Heading>
                    <Text fontSize="md" color="gray.500" mb={6} px={4}>
                      Si tienes problemas con un pedido, garantía o tu cuenta, abre un caso personalizado.
                    </Text>
                    <Button
                      colorScheme="yellow"
                      size="lg"
                      onClick={() => navigate("/cliente/casos")}
                      w="full"
                    >
                      Abrir Ticket de Soporte
                    </Button>
                  </Flex>

                  <Flex
                    direction="column"
                    p={8}
                    border="1px solid"
                    borderColor="blue.100"
                    borderRadius="2xl"
                    bg={useColorModeValue("blue.50", "gray.800")}
                    textAlign="center"
                    align="center"
                    _hover={{ boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <Icon as={FiHelpCircle} boxSize={12} color="blue.500" mb={6} />
                    <Heading size="md" mb={3}>
                      Preguntas Frecuentes (FAQ)
                    </Heading>
                    <Text fontSize="md" color="gray.500" mb={6} px={4}>
                      Encuentra respuestas rápidas sobre tiempos de envío, métodos de pago y devoluciones.
                    </Text>
                    <Button
                      colorScheme="blue"
                      variant="outline"
                      size="lg"
                      onClick={() => navigate("/cliente/faq")}
                      w="full"
                      bg={cardBg}
                    >
                      Ver FAQ
                    </Button>
                  </Flex>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>

      {/* Modal Dirección */}
      <Modal
        isOpen={isDirModalOpen}
        onClose={onDirModalClose}
        isCentered
        size={isMobile ? "full" : "lg"}
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius={isMobile ? 0 : "2xl"}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} py={4}>
            {editandoDireccion ? "Editar Dirección" : "Nueva Dirección de Entrega"}
          </ModalHeader>
          <ModalCloseButton top={4} />
          <ModalBody py={6} bg={bgPage}>
            <Stack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">Dirección Exacta</FormLabel>
                <Input
                  size="lg"
                  bg={cardBg}
                  value={dirForm.direccion}
                  onChange={(e) => handleChangeDirForm("direccion", e.target.value)}
                  placeholder="Calle, Carrera, Número, Barrio..."
                />
                <FormHelperText>Incluye detalles como torre o apartamento.</FormHelperText>
              </FormControl>

              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Ciudad</FormLabel>
                  <Input
                    size="lg"
                    bg={cardBg}
                    value={dirForm.ciudad}
                    onChange={(e) => handleChangeDirForm("ciudad", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="bold">Departamento</FormLabel>
                  <Input
                    size="lg"
                    bg={cardBg}
                    value={dirForm.departamento}
                    onChange={(e) => handleChangeDirForm("departamento", e.target.value)}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontWeight="bold">Teléfono de quien recibe (Opcional)</FormLabel>
                <Input
                  size="lg"
                  bg={cardBg}
                  value={dirForm.telefono}
                  onChange={(e) => handleChangeDirForm("telefono", e.target.value)}
                  placeholder="Ej: 300..."
                />
              </FormControl>

              <Flex
                align="center"
                bg={useColorModeValue("yellow.50", "gray.700")}
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="yellow.200"
                justify="space-between"
              >
                <Box>
                  <FormLabel htmlFor="es-principal" mb="0" fontWeight="bold">
                    Dirección Principal
                  </FormLabel>
                  <Text fontSize="xs" color="gray.500">
                    Esta será la dirección por defecto en tus pedidos.
                  </Text>
                </Box>
                <Switch
                  id="es-principal"
                  size="lg"
                  isChecked={dirForm.es_principal}
                  onChange={(e) => handleChangeDirForm("es_principal", e.target.checked)}
                  colorScheme="yellow"
                />
              </Flex>
            </Stack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor={borderColor} py={4} bg={cardBg}>
            <Button variant="ghost" size="lg" mr={3} onClick={onDirModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              size="lg"
              onClick={handleGuardarDireccion}
              isLoading={dirSaving}
            >
              Guardar Dirección
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ✅ Modal convertir Empresa (mismo formulario que About) */}
      <ConvertirEmpresaModal
        isOpen={convertirModal.isOpen}
        onClose={convertirModal.onClose}
        onConverted={(token) => {
          const hydrated = setUserFromToken?.(token);
          const newRole = String(hydrated?.role || "").toUpperCase();

          toast({
            title: "Listo ✅",
            description:
              newRole === "CONTRATISTA" || newRole === "EMPRESA"
                ? "Tu cuenta ahora es Empresa/Contratista. Bienvenido al panel Empresa."
                : "Tu cuenta fue actualizada.",
            status: "success",
            duration: 3200,
            isClosable: true,
          });

          convertirModal.onClose();
          navigate("/empresa");
        }}
      />

      {/* Botón flotante soporte */}
      <Tooltip label="¿Necesitas ayuda? Contáctanos" placement="left" hasArrow>
        <IconButton
          icon={<Icon as={FiLifeBuoy} boxSize={6} />}
          aria-label="Soporte"
          colorScheme="yellow"
          size="lg"
          isRound
          position="fixed"
          bottom={6}
          right={6}
          boxShadow="0 6px 20px rgba(236, 201, 75, 0.4)"
          onClick={() => navigate("/cliente/casos")}
          zIndex={99}
          _hover={{ transform: "scale(1.1)" }}
          transition="all 0.2s"
        />
      </Tooltip>
    </Box>
  );
}

/* =================== MODAL: convertir a Empresa (copiado de About) =================== */
function ConvertirEmpresaModal({ isOpen, onClose, onConverted }) {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const fg = useColorModeValue("gray.700", "gray.300");

  const [form, setForm] = useState({
    nit: "",
    razon_social: "",
    telefono: "",
    cargo: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSubmitting(false);
  }, [isOpen]);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e = {};
    const nit = (form.nit || "").trim();
    const rs = (form.razon_social || "").trim();

    if (!nit) e.nit = "El NIT es requerido";
    if (nit && nit.length < 6) e.nit = "NIT inválido (muy corto)";

    if (!rs) e.razon_social = "La razón social es requerida";
    if (rs && rs.length < 3) e.razon_social = "Razón social inválida";

    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);

    if (Object.keys(e).length) {
      toast({
        title: "Revisa el formulario",
        description: "Completa los campos obligatorios.",
        status: "warning",
        duration: 2400,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nit: form.nit.trim(),
        razon_social: form.razon_social.trim(),
        telefono: form.telefono?.trim() || null,
        cargo: form.cargo?.trim() || null,
        mensaje: form.mensaje?.trim() || null,
      };

      const res = await api.post("/auth/convertir-empresa", payload);

      const token = res.data?.token;
      if (!token) throw new Error("El backend no devolvió token");

      onConverted?.(token);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "No se pudo convertir la cuenta";

      toast({
        title: "No se pudo convertir",
        description: msg,
        status: "error",
        duration: 3200,
        isClosable: true,
      });
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      isCentered
      size={{ base: "full", md: "lg" }}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
      <ModalContent
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius={{ base: "0", md: "2xl" }}
        overflow="hidden"
      >
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md">Convertir a Contratista</Heading>
            <Text fontSize="sm" color={fg}>
              Accede a proformas B2B, descuentos por volumen y flujo por proyecto.
            </Text>
          </VStack>
        </ModalHeader>

        <ModalCloseButton disabled={submitting} />

        <ModalBody pb={2}>
          <Alert status="info" borderRadius="lg" mb={4}>
            <AlertIcon />
            Solo te pedimos lo esencial. Luego podrás completar tu perfil Empresa.
          </Alert>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.nit} isRequired>
              <FormLabel>NIT</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiHash} />
                </InputLeftElement>
                <Input
                  placeholder="900123456-7"
                  value={form.nit}
                  onChange={(e) => setField("nit", e.target.value)}
                />
              </InputGroup>
              <FormErrorMessage>{errors.nit}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.razon_social} isRequired>
              <FormLabel>Razón social</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiBriefcase} />
                </InputLeftElement>
                <Input
                  placeholder="Ferretería XYZ S.A.S."
                  value={form.razon_social}
                  onChange={(e) => setField("razon_social", e.target.value)}
                />
              </InputGroup>
              <FormErrorMessage>{errors.razon_social}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Teléfono (opcional)</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiPhone} />
                </InputLeftElement>
                <Input
                  placeholder="3001234567"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Cargo (opcional)</FormLabel>
              <Input
                placeholder="Compras / Obra / Residente"
                value={form.cargo}
                onChange={(e) => setField("cargo", e.target.value)}
              />
            </FormControl>
          </SimpleGrid>

          <FormControl mt={4}>
            <FormLabel>Mensaje (opcional)</FormLabel>
            <InputGroup>
              <InputLeftElement alignSelf="start" mt={2}>
                <Icon as={FiMessageSquare} />
              </InputLeftElement>
              <Textarea
                pl={10}
                minH="92px"
                resize="vertical"
                placeholder="Cuéntanos qué tipo de compras o proyectos manejas..."
                value={form.mensaje}
                onChange={(e) => setField("mensaje", e.target.value)}
              />
            </InputGroup>
          </FormControl>

          <Text mt={3} fontSize="xs" color={fg}>
            Al continuar, tu cuenta cambiará de rol a <b>CONTRATISTA</b> y se actualizará tu sesión.
          </Text>
        </ModalBody>

        <ModalFooter>
          <HStack w="full" justify="space-between">
            <Button variant="ghost" onClick={onClose} isDisabled={submitting}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              rightIcon={<FiChevronsRight />}
              onClick={submit}
              isLoading={submitting}
              loadingText="Convirtiendo..."
            >
              Convertirme ahora
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
