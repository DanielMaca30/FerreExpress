// src/pages/empresa/PerfilEmpresa.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  AvatarBadge,
  Badge,
  Box,
  Button,
  Container,
  Divider,
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
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
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
} from "@chakra-ui/react";

import {
  FiRefreshCw,
  FiUser,
  FiLock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiBell,
  FiTruck,
  FiHelpCircle,
  FiArrowRight,
  FiLifeBuoy,
  FiHome,
  FiPackage,
} from "react-icons/fi";

import api from "../../utils/axiosInstance";

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const ESTADOS_PEDIDO_ACTIVOS = ["PENDIENTE", "PAGADO", "ENVIADO"];

// =====================
// Tabs Custom (igual Cliente)
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
// Stat Card (igual Cliente)
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

export default function PerfilEmpresa() {
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // THEME (igual Cliente)
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const brandColor = "yellow.400";

  // ---- Perfil ----
  const [perfil, setPerfil] = useState(null);
  const [perfilForm, setPerfilForm] = useState({ username: "", telefono: "" });
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [savingPerfil, setSavingPerfil] = useState(false);

  // ---- Direcciones ----
  const [direcciones, setDirecciones] = useState([]);
  const [loadingDirecciones, setLoadingDirecciones] = useState(true);
  const [savingDireccion, setSavingDireccion] = useState(false);

  const {
    isOpen: isDirModalOpen,
    onOpen: onDirModalOpen,
    onClose: onDirModalClose,
  } = useDisclosure();

  const [editingDireccion, setEditingDireccion] = useState(null);
  const [direccionForm, setDireccionForm] = useState({
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "Colombia",
    telefono: "",
    es_principal: false,
  });

  // ---- Cambio contraseña ----
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [changingPass, setChangingPass] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ---- Pedidos ----
  const [pedidos, setPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);

  // ---- Notificaciones ----
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // ---- Preferencias (solo front) ----
  const [prefNotif, setPrefNotif] = useState({
    estadoPedido: true,
    soporte: true,
    marketing: false,
  });

  // ================== FETCH INICIAL ==================
  const fetchPerfilYDirecciones = useCallback(async () => {
    try {
      setLoadingPerfil(true);
      setLoadingDirecciones(true);

      const [perfilRes, dirRes] = await Promise.all([
        api.get("/auth/perfil"),
        api.get("/direcciones"),
      ]);

      const p = perfilRes.data;
      setPerfil(p);
      setPerfilForm({
        username: p.username || "",
        telefono: p.telefono || "",
      });

      setDirecciones(Array.isArray(dirRes.data) ? dirRes.data : []);
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        "No se pudo cargar tu perfil de empresa. Intenta nuevamente.";
      toast({
        title: "Error al cargar perfil",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setLoadingPerfil(false);
      setLoadingDirecciones(false);
    }
  }, [toast]);

  const loadPedidos = useCallback(async () => {
    setPedidosLoading(true);
    try {
      const { data } = await api.get("/pedidos/mios");
      setPedidos(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        title: "Error al cargar pedidos",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
    } finally {
      setPedidosLoading(false);
    }
  }, [toast]);

  const loadNotificaciones = useCallback(async () => {
    setNotifLoading(true);
    try {
      const { data } = await api.get("/notificaciones");
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        title: "Error al cargar notificaciones",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
    } finally {
      setNotifLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPerfilYDirecciones();
    loadPedidos();
    loadNotificaciones();
  }, [fetchPerfilYDirecciones, loadPedidos, loadNotificaciones]);

  // ==== DERIVADOS ====
  const resumenPedidos = useMemo(() => {
    const totalPedidos = pedidos.length;
    const pedidosActivos = pedidos.filter((p) =>
      ESTADOS_PEDIDO_ACTIVOS.includes(p.estado)
    ).length;
    const totalGastado = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
    return { totalPedidos, pedidosActivos, totalGastado };
  }, [pedidos]);

  const ultimosPedidos = useMemo(() => pedidos.slice(0, 3), [pedidos]);
  const ultimasNotificaciones = useMemo(() => notificaciones.slice(0, 3), [notificaciones]);

  const estadoEmpresaColor =
    perfil?.estado === "BLOQUEADO"
      ? "red"
      : perfil?.estado === "ACTIVO"
      ? "green"
      : "gray";

  const isEmpresaBloqueada = perfil?.estado === "BLOQUEADO";

  // ==== HANDLERS PERFIL ====
  const handlePerfilChange = (field) => (e) => {
    setPerfilForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmitPerfil = async (e) => {
    e.preventDefault();
    if (!perfilForm.username.trim()) {
      toast({
        title: "Nombre requerido",
        description: "El nombre de contacto no puede estar vacío.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setSavingPerfil(true);
      await api.put("/auth/perfil", {
        username: perfilForm.username.trim(),
        telefono: perfilForm.telefono?.trim() || null,
      });

      setPerfil((prev) =>
        prev
          ? { ...prev, username: perfilForm.username.trim(), telefono: perfilForm.telefono?.trim() || null }
          : prev
      );

      toast({
        title: "Perfil actualizado",
        description: "Tus datos básicos de empresa se guardaron correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      const msg = error?.response?.data?.error || "No se pudo actualizar el perfil.";
      toast({
        title: "Error al actualizar perfil",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setSavingPerfil(false);
    }
  };

  // ==== HANDLERS DIRECCIONES ====
  const openCrearDireccion = () => {
    setEditingDireccion(null);
    setDireccionForm({
      direccion: "",
      ciudad: "",
      departamento: "",
      pais: "Colombia",
      telefono: perfilForm.telefono || "",
      es_principal: direcciones.length === 0,
    });
    onDirModalOpen();
  };

  const openEditarDireccion = (dir) => {
    setEditingDireccion(dir);
    setDireccionForm({
      direccion: dir.direccion || "",
      ciudad: dir.ciudad || "",
      departamento: dir.departamento || "",
      pais: dir.pais || "Colombia",
      telefono: dir.telefono || "",
      es_principal: !!dir.es_principal,
    });
    onDirModalOpen();
  };

  const handleDireccionChange = (field, value) => {
    setDireccionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitDireccion = async (e) => {
    e.preventDefault();

    const payload = {
      direccion: direccionForm.direccion.trim(),
      ciudad: direccionForm.ciudad.trim(),
      departamento: direccionForm.departamento?.trim() || null,
      pais: direccionForm.pais?.trim() || "Colombia",
      telefono: direccionForm.telefono?.trim() || null,
      es_principal: direccionForm.es_principal ? 1 : 0,
    };

    if (!payload.direccion || !payload.ciudad) {
      toast({
        title: "Campos requeridos",
        description: "La dirección y la ciudad son obligatorias.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setSavingDireccion(true);

      if (editingDireccion) {
        await api.put(`/direcciones/${editingDireccion.id}`, payload);
        toast({
          title: "Dirección actualizada",
          description: "La dirección se actualizó correctamente.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        await api.post("/direcciones", payload);
        toast({
          title: "Dirección creada",
          description: "La nueva dirección se registró correctamente.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }

      const { data } = await api.get("/direcciones");
      setDirecciones(Array.isArray(data) ? data : []);
      onDirModalClose();
    } catch (error) {
      const msg =
        error?.response?.data?.error || "No se pudo guardar la dirección. Intenta de nuevo.";
      toast({
        title: "Error al guardar dirección",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setSavingDireccion(false);
    }
  };

  const handleDeleteDireccion = async (dir) => {
    const ok = window.confirm(`¿Seguro que deseas eliminar la dirección "${dir.direccion}"?`);
    if (!ok) return;

    try {
      setSavingDireccion(true);
      await api.delete(`/direcciones/${dir.id}`);
      toast({
        title: "Dirección eliminada",
        description: "La dirección se eliminó correctamente.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      const { data } = await api.get("/direcciones");
      setDirecciones(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg =
        error?.response?.data?.error || "No se pudo eliminar la dirección. Intenta de nuevo.";
      toast({
        title: "Error al eliminar dirección",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setSavingDireccion(false);
    }
  };

  const handleMarcarPrincipal = async (dir) => {
    try {
      setSavingDireccion(true);
      await api.put(`/direcciones/${dir.id}`, {
        direccion: dir.direccion,
        ciudad: dir.ciudad,
        departamento: dir.departamento,
        pais: dir.pais,
        telefono: dir.telefono,
        es_principal: 1,
      });
      toast({
        title: "Dirección principal actualizada",
        description: "Se actualizó la dirección principal para tu empresa.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      const { data } = await api.get("/direcciones");
      setDirecciones(Array.isArray(data) ? data : []);
    } catch (error) {
      const msg =
        error?.response?.data?.error || "No se pudo actualizar la dirección principal.";
      toast({
        title: "Error al actualizar dirección principal",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setSavingDireccion(false);
    }
  };

  // ==== HANDLERS CONTRASEÑA ====
  const handlePassChange = (field) => (e) => {
    setPassForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passForm.oldPassword || !passForm.newPassword || !passForm.confirmNewPassword) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos para cambiar la contraseña.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (passForm.newPassword !== passForm.confirmNewPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Verifica la nueva contraseña y su confirmación.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (passForm.newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setChangingPass(true);
      await api.put("/auth/change-password", {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword,
      });

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña se cambió correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setPassForm({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error) {
      const msg =
        error?.response?.data?.error || "No se pudo cambiar la contraseña. Revisa tus datos.";
      toast({
        title: "Error al cambiar contraseña",
        description: msg,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setChangingPass(false);
    }
  };

  // ==== HANDLERS NOTIFICACIONES ====
  const handleMarcarNotifLeida = async (id) => {
    setNotifSaving(true);
    try {
      await api.put(`/notificaciones/${id}/leida`);
      await loadNotificaciones();
    } catch (e) {
      toast({
        title: "No se pudo marcar como leída",
        description: e?.response?.data?.error || e.message,
        status: "error",
      });
    } finally {
      setNotifSaving(false);
    }
  };

  // ================== RENDER ==================
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
          {/* HEADER (igual estilo Cliente) */}
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
                    name={perfil?.username || "Empresa"}
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
                  {loadingPerfil ? (
                    <Skeleton height="32px" w="260px" borderRadius="md" />
                  ) : (
                    <Heading size="lg" color={useColorModeValue("gray.800", "white")}>
                      Hola, {perfil?.username?.split(" ")[0] || "Empresa"}
                    </Heading>
                  )}

                  <Text color="gray.500" fontSize="md" fontWeight="medium">
                    Panel Empresa FerreExpress
                  </Text>

                  <HStack mt={1} spacing={2} flexWrap="wrap">
                    <Tag size="sm" variant="solid" colorScheme="yellow" borderRadius="full">
                      <TagLabel fontWeight="bold">Empresa / Contratista</TagLabel>
                    </Tag>

                    {perfil && (
                      <Tag size="sm" variant="subtle" colorScheme={estadoEmpresaColor} borderRadius="full">
                        <TagLabel fontWeight="bold">
                          {perfil.estado === "BLOQUEADO" ? "Cuenta bloqueada" : "Cuenta activa"}
                        </TagLabel>
                      </Tag>
                    )}
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
                  onClick={() => {
                    fetchPerfilYDirecciones();
                    loadPedidos();
                    loadNotificaciones();
                  }}
                  isLoading={loadingPerfil}
                  w={{ base: "full", sm: "auto" }}
                >
                  Actualizar
                </Button>

                <Button
                  colorScheme="yellow"
                  leftIcon={<FiTruck />}
                  onClick={() => navigate("/empresa/mis-pedidos")}
                  boxShadow="md"
                  w={{ base: "full", sm: "auto" }}
                >
                  Mis Pedidos
                </Button>
              </Stack>
            </Flex>
          </Box>

          {/* TABS (igual Cliente) */}
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
                <CustomTab icon={FiUser} label="Datos de Cuenta" isMobile={isMobile} />
                <CustomTab icon={FiMapPin} label="Direcciones" isMobile={isMobile} />
                <CustomTab icon={FiLock} label="Seguridad" isMobile={isMobile} />
                <CustomTab icon={FiBell} label="Notificaciones" isMobile={isMobile} />
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
                    helpText="En proceso / en camino"
                    bgCard={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Total Comprado (Histórico)"
                    number={fmtCop(resumenPedidos.totalGastado)}
                    icon={FiPackage}
                    helpText="Acumulado aproximado"
                    bgCard={cardBg}
                    borderColor={borderColor}
                  />
                  <StatCard
                    label="Total de Pedidos"
                    number={resumenPedidos.totalPedidos}
                    icon={FiRefreshCw}
                    helpText="Transacciones registradas"
                    bgCard={cardBg}
                    borderColor={borderColor}
                  />
                </SimpleGrid>

                <Grid templateColumns={{ base: "1fr", lg: "3fr 2fr" }} gap={8}>
                  {/* Últimos pedidos */}
                  <GridItem>
                    <Flex justify="space-between" align="center" mb={5} gap={3} wrap="wrap">
                      <Heading size="sm">Pedidos Recientes</Heading>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="yellow"
                          rightIcon={<FiArrowRight />}
                          onClick={() => navigate("/empresa/mis-pedidos")}
                        >
                          Ver todos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          rightIcon={<FiArrowRight />}
                          onClick={() => navigate("/empresa/cotizaciones")}
                        >
                          Cotizaciones
                        </Button>
                      </HStack>
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
                            cursor="pointer"
                            onClick={() => navigate("/empresa/mis-pedidos")}
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
                                  {p.fecha_creacion
                                    ? new Date(p.fecha_creacion).toLocaleDateString("es-CO")
                                    : "—"}
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
                          <Text color="gray.500">Aún no tienes pedidos recientes.</Text>
                        </Box>
                      )}
                    </Stack>
                  </GridItem>

                  {/* Avisos / Accesos */}
                  <GridItem>
                    <Heading size="sm" mb={5}>
                      Avisos y Accesos Rápidos
                    </Heading>

                    <Stack spacing={4}>
                      <Box
                        p={5}
                        bg="yellow.50"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="yellow.200"
                      >
                        <HStack mb={3}>
                          <Icon as={FiBell} color="yellow.600" boxSize={5} />
                          <Text fontSize="md" fontWeight="bold" color="yellow.800">
                            Notificaciones recientes
                          </Text>
                        </HStack>

                        {notifLoading ? (
                          <Skeleton height="44px" borderRadius="lg" />
                        ) : ultimasNotificaciones.length === 0 ? (
                          <Text fontSize="sm" color="gray.700">
                            No tienes notificaciones por ahora.
                          </Text>
                        ) : (
                          <Stack spacing={3}>
                            {ultimasNotificaciones.map((n) => (
                              <Flex
                                key={n.id}
                                p={3}
                                bg={n.leido ? "whiteAlpha.700" : "yellow.100"}
                                border="1px solid"
                                borderColor={n.leido ? "yellow.200" : "yellow.300"}
                                borderRadius="lg"
                                align="flex-start"
                                justify="space-between"
                                gap={3}
                              >
                                <Box>
                                  <Text fontWeight={n.leido ? "semibold" : "bold"} fontSize="sm">
                                    {n.titulo}
                                  </Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {n.mensaje}
                                  </Text>
                                </Box>

                                {!n.leido && (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="yellow"
                                    onClick={() => handleMarcarNotifLeida(n.id)}
                                    isLoading={notifSaving}
                                  >
                                    Marcar
                                  </Button>
                                )}
                              </Flex>
                            ))}
                          </Stack>
                        )}
                      </Box>

                      <Box
                        p={5}
                        bg={useColorModeValue("gray.50", "gray.900")}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={borderColor}
                      >
                        <HStack mb={3}>
                          <Icon as={FiArrowRight} color="gray.500" boxSize={5} />
                          <Text fontSize="md" fontWeight="bold" color={useColorModeValue("gray.800", "white")}>
                            Acciones rápidas
                          </Text>
                        </HStack>

                        <Stack spacing={3}>
                          <Button
                            colorScheme="yellow"
                            w="full"
                            onClick={() => navigate("/empresa/cotizaciones")}
                          >
                            Ir a Cotizaciones
                          </Button>
                          <Button
                            variant="outline"
                            w="full"
                            onClick={() => navigate("/empresa/mis-pedidos")}
                          >
                            Ver Pedidos
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </GridItem>
                </Grid>
              </TabPanel>

              {/* TAB 2: DATOS CUENTA */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Datos de la Cuenta Empresa
                </Heading>
                <Text color="gray.500" mb={8}>
                  Ajusta el contacto principal y revisa la información base de tu cuenta.
                </Text>

                <Box maxW="760px" as="form" onSubmit={handleSubmitPerfil}>
                  <Stack spacing={6}>
                    {loadingPerfil ? (
                      <Stack spacing={3}>
                        <Skeleton height="44px" />
                        <Skeleton height="44px" />
                        <Skeleton height="44px" />
                      </Stack>
                    ) : (
                      <>
                        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                          <FormControl isRequired>
                            <FormLabel fontWeight="bold">Nombre de contacto</FormLabel>
                            <Input
                              size="lg"
                              value={perfilForm.username}
                              onChange={handlePerfilChange("username")}
                              placeholder="Nombre del contacto principal"
                              bg={useColorModeValue("white", "gray.700")}
                            />
                            <FormHelperText>
                              Se usará en cotizaciones, correos y comunicaciones.
                            </FormHelperText>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontWeight="bold">Teléfono de contacto</FormLabel>
                            <InputGroup size="lg">
                              <Input
                                value={perfilForm.telefono || ""}
                                onChange={handlePerfilChange("telefono")}
                                placeholder="Ej: 300 123 4567"
                                bg={useColorModeValue("white", "gray.700")}
                              />
                              <InputRightElement>
                                <Icon as={FiPhone} color="gray.400" />
                              </InputRightElement>
                            </InputGroup>
                          </FormControl>
                        </Grid>

                        <FormControl isDisabled>
                          <FormLabel fontWeight="bold">Correo (ID de cuenta)</FormLabel>
                          <InputGroup size="lg">
                            <Input
                              value={perfil?.email || ""}
                              bg={useColorModeValue("gray.100", "gray.600")}
                              cursor="not-allowed"
                            />
                            <InputRightElement>
                              <Icon as={FiMail} color="gray.400" />
                            </InputRightElement>
                          </InputGroup>
                          <FormHelperText>
                            Por seguridad, el correo no se puede cambiar directamente.
                          </FormHelperText>
                        </FormControl>

                        {perfil?.nit && (
                          <FormControl isDisabled>
                            <FormLabel fontWeight="bold">NIT</FormLabel>
                            <Input size="lg" value={perfil.nit} cursor="not-allowed" />
                            <FormHelperText>Definido al registrar tu empresa en la plataforma.</FormHelperText>
                          </FormControl>
                        )}

                        <FormControl isDisabled>
                          <FormLabel fontWeight="bold">Rol</FormLabel>
                          <Input
                            size="lg"
                            value={
                              perfil?.role === "CONTRATISTA"
                                ? "EMPRESA / CONTRATISTA"
                                : perfil?.role || "EMPRESA"
                            }
                            cursor="not-allowed"
                          />
                        </FormControl>

                        <Divider my={2} />

                        <HStack justify="flex-end">
                          <Button
                            type="submit"
                            size="lg"
                            colorScheme="yellow"
                            isLoading={savingPerfil}
                            leftIcon={<FiCheck />}
                            loadingText="Guardando..."
                          >
                            Guardar Cambios
                          </Button>
                        </HStack>
                      </>
                    )}
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
                    <Heading size="md">Direcciones de la Empresa</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Gestiona sedes, bodegas o puntos de entrega frecuentes.
                    </Text>
                  </Box>

                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="yellow"
                    onClick={openCrearDireccion}
                    isDisabled={savingDireccion}
                    w={{ base: "full", sm: "auto" }}
                  >
                    Nueva Dirección
                  </Button>
                </Flex>

                {loadingDirecciones && (
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                    <Skeleton height="180px" borderRadius="xl" />
                    <Skeleton height="180px" borderRadius="xl" />
                  </SimpleGrid>
                )}

                {!loadingDirecciones && direcciones.length === 0 && (
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
                      Agrega tu primera dirección para agilizar envíos y pedidos.
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="yellow"
                      onClick={openCrearDireccion}
                    >
                      Agregar Dirección
                    </Button>
                  </Flex>
                )}

                {!loadingDirecciones && direcciones.length > 0 && (
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
                                {dir.departamento ? `| ${dir.departamento}` : ""}
                              </Text>
                            </Heading>
                          </HStack>

                          <Text fontSize="lg" fontWeight="bold" mb={1}>
                            {dir.direccion}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            País: {dir.pais || "Colombia"}
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
                              onClick={() => openEditarDireccion(dir)}
                              aria-label="Editar"
                              isDisabled={savingDireccion}
                            />
                          </Tooltip>

                          <Tooltip label="Eliminar">
                            <IconButton
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteDireccion(dir)}
                              aria-label="Eliminar"
                              isDisabled={savingDireccion}
                            />
                          </Tooltip>

                          {!dir.es_principal && (
                            <Button
                              size="sm"
                              variant="ghost"
                              colorScheme="yellow"
                              onClick={() => handleMarcarPrincipal(dir)}
                              isDisabled={savingDireccion}
                            >
                              Hacer Principal
                            </Button>
                          )}
                        </HStack>
                      </Flex>
                    ))}
                  </SimpleGrid>
                )}
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
                    as="form"
                    onSubmit={handleChangePassword}
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
                        <InputGroup size="lg">
                          <Input
                            type={showOldPass ? "text" : "password"}
                            bg={cardBg}
                            value={passForm.oldPassword}
                            onChange={handlePassChange("oldPassword")}
                            placeholder="••••••••"
                          />
                          <InputRightElement>
                            <Button variant="ghost" size="sm" onClick={() => setShowOldPass((v) => !v)}>
                              {showOldPass ? "Ocultar" : "Ver"}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" fontSize="sm">
                          Nueva Contraseña
                        </FormLabel>
                        <InputGroup size="lg">
                          <Input
                            type={showNewPass ? "text" : "password"}
                            bg={cardBg}
                            value={passForm.newPassword}
                            onChange={handlePassChange("newPassword")}
                            placeholder="Mínimo 6 caracteres"
                          />
                          <InputRightElement>
                            <Button variant="ghost" size="sm" onClick={() => setShowNewPass((v) => !v)}>
                              {showNewPass ? "Ocultar" : "Ver"}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                        <FormHelperText>Mínimo 6 caracteres.</FormHelperText>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" fontSize="sm">
                          Confirmar Nueva Contraseña
                        </FormLabel>
                        <InputGroup size="lg">
                          <Input
                            type={showConfirmPass ? "text" : "password"}
                            bg={cardBg}
                            value={passForm.confirmNewPassword}
                            onChange={handlePassChange("confirmNewPassword")}
                            placeholder="Repite la nueva contraseña"
                          />
                          <InputRightElement>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowConfirmPass((v) => !v)}
                            >
                              {showConfirmPass ? "Ocultar" : "Ver"}
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      <Button
                        type="submit"
                        size="lg"
                        colorScheme="yellow"
                        w="full"
                        mt={2}
                        isLoading={changingPass}
                        leftIcon={<FiLock />}
                      >
                        Actualizar Contraseña
                      </Button>
                    </Stack>
                  </Box>
                </Flex>
              </TabPanel>

              {/* TAB 5: NOTIFICACIONES */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Notificaciones y Preferencias
                </Heading>
                <Text color="gray.500" mb={6}>
                  Ajustes visuales y mensajes recientes del sistema.
                </Text>

                {/* Preferencias rápidas (igual estilo Cliente) */}
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
                      <Text fontWeight="medium">Pedidos y Cotizaciones</Text>
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
                      <Text fontWeight="medium">Ofertas B2B</Text>
                    </HStack>
                  </Stack>

                  <Text mt={4} fontSize="xs" color="gray.500">
                    Estas preferencias son de interfaz (no se guardan en backend por ahora).
                  </Text>
                </Box>

                <Divider my={4} />

                <Heading size="sm" mb={4}>
                  Notificaciones recientes
                </Heading>

                <VStack spacing={4} align="stretch">
                  {notifLoading && <Skeleton height="80px" borderRadius="xl" />}

                  {!notifLoading && ultimasNotificaciones.length === 0 && (
                    <Box
                      p={8}
                      textAlign="center"
                      border="1px dashed"
                      borderColor={borderColor}
                      borderRadius="xl"
                    >
                      <Icon as={FiBell} boxSize={8} color="gray.300" mb={2} />
                      <Text color="gray.500">Aún no tienes notificaciones.</Text>
                    </Box>
                  )}

                  {!notifLoading &&
                    ultimasNotificaciones.map((n) => (
                      <Flex
                        key={n.id}
                        p={5}
                        bg={
                          n.leido
                            ? cardBg
                            : useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)")
                        }
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
                            isLoading={notifSaving}
                          >
                            Marcar como leída
                          </Button>
                        )}
                      </Flex>
                    ))}
                </VStack>
              </TabPanel>

              {/* TAB 6: AYUDA */}
              <TabPanel p={0}>
                <Heading size="md" mb={2}>
                  Centro de Ayuda Empresa
                </Heading>
                <Text color="gray.500" mb={8}>
                  Si tienes dudas sobre cotizaciones B2B, pedidos o tu cuenta, aquí tienes accesos rápidos.
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
                      Soporte Personalizado
                    </Heading>
                    <Text fontSize="md" color="gray.500" mb={6} px={4}>
                      Si tienes un problema con un pedido, una cotización o tu cuenta, abre un caso y haz seguimiento.
                    </Text>
                    <Button
                      colorScheme="yellow"
                      size="lg"
                      onClick={() => navigate("/empresa/casos-empresa")}
                      w="full"
                      isDisabled={isEmpresaBloqueada}
                    >
                      Abrir Ticket de Soporte
                    </Button>
                    {isEmpresaBloqueada && (
                      <Text mt={3} fontSize="xs" color="red.500">
                        Tu cuenta está bloqueada: algunas acciones pueden estar restringidas.
                      </Text>
                    )}
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
                      Respuestas rápidas sobre cotizaciones por volumen, plazos de entrega, medios de pago y más.
                    </Text>
                    <Button
                      colorScheme="blue"
                      variant="outline"
                      size="lg"
                      onClick={() => navigate("/empresa/ayuda")}
                      w="full"
                      bg={cardBg}
                    >
                      Ver FAQ
                    </Button>
                  </Flex>
                </SimpleGrid>

                <Box
                  mt={8}
                  p={6}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="2xl"
                  bg={useColorModeValue("gray.50", "gray.900")}
                >
                  <Heading size="sm" mb={2}>
                    Términos y privacidad
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Consulta las condiciones de uso y el aviso de privacidad que aplican a tu empresa.
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate("/empresa/condiciones-uso-empresa")}
                    >
                      Términos de uso
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate("/empresa/avisos-privacidad-empresa")}
                    >
                      Aviso de privacidad
                    </Button>
                  </HStack>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>

      {/* 🛟 Botón flotante soporte (igual vibe Cliente) */}
      {!isEmpresaBloqueada && (
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
            onClick={() => navigate("/empresa/casos-empresa")}
            zIndex={99}
            _hover={{ transform: "scale(1.1)" }}
            transition="all 0.2s"
          />
        </Tooltip>
      )}

      {/* MODAL DIRECCIÓN (estilo Cliente) */}
      <Modal
        isOpen={isDirModalOpen}
        onClose={savingDireccion ? () => {} : onDirModalClose}
        isCentered
        size={isMobile ? "full" : "lg"}
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius={isMobile ? 0 : "2xl"}>
          <ModalHeader borderBottom="1px solid" borderColor={borderColor} py={4}>
            {editingDireccion ? "Editar Dirección" : "Nueva Dirección de la Empresa"}
          </ModalHeader>
          <ModalCloseButton top={4} disabled={savingDireccion} />

          <Box as="form" onSubmit={handleSubmitDireccion}>
            <ModalBody py={6} bg={bgPage}>
              <Stack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">Dirección Exacta</FormLabel>
                  <Input
                    size="lg"
                    bg={cardBg}
                    value={direccionForm.direccion}
                    onChange={(e) => handleDireccionChange("direccion", e.target.value)}
                    placeholder="Calle, Carrera, Número, Bodega..."
                  />
                  <FormHelperText>Incluye detalles como sede, torre, piso o referencia.</FormHelperText>
                </FormControl>

                <HStack spacing={4} align="start">
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold">Ciudad</FormLabel>
                    <Input
                      size="lg"
                      bg={cardBg}
                      value={direccionForm.ciudad}
                      onChange={(e) => handleDireccionChange("ciudad", e.target.value)}
                      placeholder="Ej: Cali"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontWeight="bold">Departamento</FormLabel>
                    <Input
                      size="lg"
                      bg={cardBg}
                      value={direccionForm.departamento}
                      onChange={(e) => handleDireccionChange("departamento", e.target.value)}
                      placeholder="Ej: Valle del Cauca"
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel fontWeight="bold">País</FormLabel>
                  <Input
                    size="lg"
                    bg={cardBg}
                    value={direccionForm.pais}
                    onChange={(e) => handleDireccionChange("pais", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontWeight="bold">Teléfono de contacto (Opcional)</FormLabel>
                  <Input
                    size="lg"
                    bg={cardBg}
                    value={direccionForm.telefono}
                    onChange={(e) => handleDireccionChange("telefono", e.target.value)}
                    placeholder="Ej: 300 123 4567"
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
                      Esta será la dirección por defecto en pedidos/cotizaciones.
                    </Text>
                  </Box>
                  <Switch
                    id="es-principal"
                    size="lg"
                    isChecked={!!direccionForm.es_principal}
                    onChange={(e) => handleDireccionChange("es_principal", e.target.checked)}
                    colorScheme="yellow"
                  />
                </Flex>
              </Stack>
            </ModalBody>

            <ModalFooter borderTop="1px solid" borderColor={borderColor} py={4} bg={cardBg}>
              <Button variant="ghost" size="lg" mr={3} onClick={onDirModalClose} isDisabled={savingDireccion}>
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="yellow"
                size="lg"
                isLoading={savingDireccion}
                leftIcon={<FiCheck />}
              >
                Guardar Dirección
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>
    </Box>
  );
}
