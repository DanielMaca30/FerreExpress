// src/pages/cliente/PerfilCliente.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
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
  SkeletonText,
  Stack,
  Switch,
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
  FiBell,
  FiTruck,
  FiHelpCircle,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiExternalLink,
  FiLifeBuoy, // soporte / casos
  FiSettings, // encabezado de sección ayuda/soporte
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

const MotionBox = motion(Box);

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const ESTADOS_PEDIDO_ACTIVOS = ["PENDIENTE", "PAGADO", "ENVIADO"];

export default function PerfilCliente() {
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // THEME
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accent = useColorModeValue("yellow.500", "yellow.300");
  const stickyBg = useColorModeValue(
    "rgba(255,255,255,0.92)",
    "rgba(26,32,44,0.92)"
  );

  // PERFIL
  const [perfil, setPerfil] = useState(null);
  const [perfilLoading, setPerfilLoading] = useState(true);
  const [perfilSaving, setPerfilSaving] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  // PASSWORD
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // DIRECCIONES
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

  // PEDIDOS (para resumen)
  const [pedidos, setPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);

  // NOTIFICACIONES (resumen)
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // PREFERENCIAS DE NOTIFICACIÓN (por ahora solo front, sin backend)
  const [prefNotif, setPrefNotif] = useState({
    estadoPedido: true,
    soporte: true,
    marketing: false,
  });

  // ==== LOADERS ====

  const loadPerfil = async () => {
    setPerfilLoading(true);
    try {
      const { data } = await api.get("/auth/perfil");
      setPerfil(data || null);
      setNombre(data?.username || "");
      setTelefono(data?.telefono || "");
    } catch (e) {
      toast({
        title: "Error al cargar perfil",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPerfilLoading(false);
    }
  };

  const loadDirecciones = async () => {
    setDirLoading(true);
    try {
      const { data } = await api.get("/direcciones");
      setDirecciones(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        title: "Error al cargar direcciones",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDirLoading(false);
    }
  };

  const loadPedidos = async () => {
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
  };

  const loadNotificaciones = async () => {
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
  };

  useEffect(() => {
    loadPerfil();
    loadDirecciones();
    loadPedidos();
    loadNotificaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==== DERIVADOS ====

  const resumenPedidos = useMemo(() => {
    const totalPedidos = pedidos.length;
    const pedidosActivos = pedidos.filter((p) =>
      ESTADOS_PEDIDO_ACTIVOS.includes(p.estado)
    ).length;
    const totalGastado = pedidos.reduce(
      (acc, p) => acc + Number(p.total || 0),
      0
    );
    return { totalPedidos, pedidosActivos, totalGastado };
  }, [pedidos]);

  const ultimosPedidos = useMemo(() => pedidos.slice(0, 3), [pedidos]);

  const ultimasNotificaciones = useMemo(
    () => notificaciones.slice(0, 3),
    [notificaciones]
  );

  // ==== HANDLERS PERFIL ====

  const handleGuardarPerfil = async () => {
    if (!nombre.trim()) {
      toast({
        title: "Nombre requerido",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    setPerfilSaving(true);
    try {
      await api.put("/auth/perfil", {
        username: nombre.trim(),
        telefono: telefono.trim() || null,
      });
      toast({
        title: "Perfil actualizado",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      await loadPerfil();
    } catch (e) {
      toast({
        title: "No se pudo actualizar",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPerfilSaving(false);
    }
  };

  // ==== HANDLERS PASSWORD ====

  const handleCambiarPassword = async () => {
    if (!oldPassword || !newPassword || !newPassword2) {
      toast({
        title: "Completa todos los campos",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (newPassword !== newPassword2) {
      toast({
        title: "Las contraseñas no coinciden",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setPwSaving(true);
    try {
      await api.put("/auth/change-password", {
        oldPassword,
        newPassword,
      });
      toast({
        title: "Contraseña actualizada",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      setOldPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e) {
      toast({
        title: "No se pudo cambiar la contraseña",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPwSaving(false);
    }
  };

  // ==== HANDLERS DIRECCIONES ====

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
    setDirForm({
      direccion: dir.direccion || "",
      ciudad: dir.ciudad || "",
      departamento: dir.departamento || "",
      pais: dir.pais || "Colombia",
      telefono: dir.telefono || "",
      es_principal: !!dir.es_principal,
    });
    onDirModalOpen();
  };

  const handleChangeDirForm = (field, value) => {
    setDirForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuardarDireccion = async () => {
    if (!dirForm.direccion.trim() || !dirForm.ciudad.trim()) {
      toast({
        title: "Dirección y ciudad son requeridas",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    setDirSaving(true);
    try {
      if (editandoDireccion) {
        await api.put(`/direcciones/${editandoDireccion.id}`, {
          ...dirForm,
        });
        toast({
          title: "Dirección actualizada",
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      } else {
        await api.post("/direcciones", {
          ...dirForm,
        });
        toast({
          title: "Dirección creada",
          status: "success",
          duration: 2500,
          isClosable: true,
        });
      }
      await loadDirecciones();
      onDirModalClose();
    } catch (e) {
      toast({
        title: "No se pudo guardar la dirección",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDirSaving(false);
    }
  };

  const handleEliminarDireccion = async (dir) => {
    if (
      !window.confirm(
        `¿Eliminar la dirección "${dir.direccion}"?\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/direcciones/${dir.id}`);
      toast({
        title: "Dirección eliminada",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      await loadDirecciones();
    } catch (e) {
      toast({
        title: "No se pudo eliminar",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMarcarPrincipal = async (dir) => {
    try {
      await api.put(`/direcciones/${dir.id}`, {
        ...dir,
        es_principal: true,
      });
      toast({
        title: "Dirección marcada como principal",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      await loadDirecciones();
    } catch (e) {
      toast({
        title: "No se pudo actualizar",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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

  // ==== LAYOUT / ANIMACIONES ====

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  const estadoCuentaColor =
    perfil?.estado === "BLOQUEADO"
      ? "red"
      : perfil?.estado === "ACTIVO"
      ? "green"
      : "gray";

  return (
    <Box bg={bgPage} minH="100vh" pb={10}>
      {/* HEADER STICKY */}
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
        <Flex justify="space-between" align="center" gap={3} wrap="wrap">
          <HStack spacing={3}>
            <Avatar size="md" name={perfil?.username || ""} />
            <VStack align="start" spacing={0}>
              <Heading size={{ base: "md", md: "lg" }}>
                Mi perfil de cliente
              </Heading>
              <Text fontSize="sm" color={muted}>
                Gestiona tus datos, direcciones y actividad en FerreExpress
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Recargar todo" hasArrow>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<FiRefreshCw />}
                onClick={() => {
                  loadPerfil();
                  loadDirecciones();
                  loadPedidos();
                  loadNotificaciones();
                }}
              />
            </Tooltip>
            <Button
              size="sm"
              colorScheme="yellow"
              color="gray.800"
              rightIcon={<FiTruck />}
              onClick={() => navigate("/cliente/pedidos")}
            >
              Ver mis pedidos
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* CONTENIDO */}
      <Box px={{ base: 3, md: 6, lg: 10 }} pt={4}>
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={5}
          alignItems="flex-start"
        >
          {/* COLUMNA IZQUIERDA */}
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* DATOS PERSONALES */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
              mb={4}
            >
              {perfilLoading ? (
                <Stack spacing={3}>
                  <Skeleton height="20px" />
                  <SkeletonText noOfLines={3} />
                </Stack>
              ) : (
                <>
                  <HStack mb={3} justify="space-between">
                    <HStack>
                      <Icon as={FiUser} />
                      <Heading size="sm">Información personal</Heading>
                    </HStack>
                    {perfil && (
                      <Tag size="sm" colorScheme={estadoCuentaColor}>
                        <TagLabel>
                          {perfil.estado === "BLOQUEADO"
                            ? "Cuenta bloqueada"
                            : "Cuenta activa"}
                        </TagLabel>
                      </Tag>
                    )}
                  </HStack>

                  <Stack spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Nombre completo</FormLabel>
                      <Input
                        size="sm"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                      />
                    </FormControl>

                    <FormControl isDisabled>
                      <FormLabel fontSize="sm">Correo electrónico</FormLabel>
                      <Input
                        size="sm"
                        value={perfil?.email || ""}
                        isReadOnly
                      />
                      <FormHelperText fontSize="xs">
                        Este correo se usa para iniciar sesión y recibir
                        notificaciones.
                      </FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Teléfono de contacto</FormLabel>
                      <Input
                        size="sm"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: 3001234567"
                      />
                    </FormControl>

                    <FormControl isDisabled>
                      <FormLabel fontSize="sm">Rol</FormLabel>
                      <Input
                        size="sm"
                        value={perfil?.role || "CLIENTE"}
                        isReadOnly
                      />
                    </FormControl>

                    {perfil?.created_at && (
                      <Text fontSize="xs" color={muted}>
                        Cliente desde:{" "}
                        {new Date(perfil.created_at).toLocaleDateString()}
                      </Text>
                    )}

                    <HStack justify="flex-end" pt={2}>
                      <Button
                        size="sm"
                        colorScheme="yellow"
                        color="gray.800"
                        onClick={handleGuardarPerfil}
                        isLoading={perfilSaving}
                      >
                        Guardar cambios
                      </Button>
                    </HStack>
                  </Stack>
                </>
              )}
            </MotionBox>

            {/* SEGURIDAD */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
              mb={4}
            >
              <HStack mb={3} spacing={2}>
                <Icon as={FiLock} />
                <Heading size="sm">Seguridad y credenciales</Heading>
              </HStack>

              <Stack spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Contraseña actual</FormLabel>
                  <Input
                    size="sm"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Nueva contraseña</FormLabel>
                  <Input
                    size="sm"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <FormHelperText fontSize="xs">
                    Mínimo 6 caracteres. Evita usar la misma contraseña de otros
                    servicios.
                  </FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">
                    Confirmar nueva contraseña
                  </FormLabel>
                  <Input
                    size="sm"
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                  />
                </FormControl>

                <HStack justify="space-between" pt={2} flexWrap="wrap">
                  <Tag size="sm" variant="subtle" colorScheme="yellow">
                    <TagLabel>
                      Verificación de correo: pendiente de implementar
                    </TagLabel>
                  </Tag>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    color="gray.800"
                    onClick={handleCambiarPassword}
                    isLoading={pwSaving}
                    leftIcon={<FiLock />}
                  >
                    Actualizar contraseña
                  </Button>
                </HStack>
              </Stack>
            </MotionBox>

            {/* DIRECCIONES */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
            >
              <HStack mb={3} justify="space-between">
                <HStack>
                  <Icon as={FiMapPin} />
                  <Heading size="sm">Direcciones de entrega</Heading>
                </HStack>
                <Button
                  size="sm"
                  leftIcon={<FiPlus />}
                  variant="outline"
                  onClick={abrirCrearDireccion}
                >
                  Nueva dirección
                </Button>
              </HStack>

              {dirLoading ? (
                <Stack spacing={3}>
                  <Skeleton height="60px" borderRadius="md" />
                  <Skeleton height="60px" borderRadius="md" />
                </Stack>
              ) : direcciones.length === 0 ? (
                <Box
                  borderRadius="lg"
                  border="1px dashed"
                  borderColor={borderColor}
                  p={4}
                  textAlign="center"
                >
                  <Text fontSize="sm" color={muted} mb={2}>
                    Aún no tienes direcciones guardadas.
                  </Text>
                  <Button size="sm" onClick={abrirCrearDireccion}>
                    Agregar mi primera dirección
                  </Button>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {direcciones.map((dir) => (
                    <Box
                      key={dir.id}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      p={3}
                      bg={useColorModeValue("gray.50", "gray.700")}
                    >
                      <HStack justify="space-between" mb={1}>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" fontSize="sm">
                            {dir.ciudad || "Sin ciudad"}
                          </Text>
                          {dir.es_principal ? (
                            <Badge colorScheme="yellow" variant="solid">
                              Principal
                            </Badge>
                          ) : (
                            <Badge
                              colorScheme="gray"
                              variant="subtle"
                              cursor="pointer"
                              onClick={() => handleMarcarPrincipal(dir)}
                            >
                              Marcar como principal
                            </Badge>
                          )}
                        </HStack>
                        <HStack spacing={1}>
                          <Tooltip label="Editar" hasArrow>
                            <IconButton
                              aria-label="Editar dirección"
                              size="xs"
                              variant="ghost"
                              icon={<FiExternalLink />}
                              onClick={() => abrirEditarDireccion(dir)}
                            />
                          </Tooltip>
                          <Tooltip label="Eliminar" hasArrow>
                            <IconButton
                              aria-label="Eliminar dirección"
                              size="xs"
                              variant="ghost"
                              icon={<FiTrash2 />}
                              onClick={() => handleEliminarDireccion(dir)}
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>
                      <Text fontSize="sm">{dir.direccion}</Text>
                      {dir.telefono && (
                        <Text fontSize="xs" color={muted}>
                          Tel: {dir.telefono}
                        </Text>
                      )}
                      {(dir.departamento || dir.pais) && (
                        <Text fontSize="xs" color={muted}>
                          {dir.departamento || ""} {dir.departamento && "•"}{" "}
                          {dir.pais || ""}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </MotionBox>
          </MotionBox>

          {/* COLUMNA DERECHA */}
          <MotionBox
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* RESUMEN DE ACTIVIDAD */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
              mb={4}
            >
              <HStack mb={3} spacing={2}>
                <Icon as={FiTruck} />
                <Heading size="sm">Resumen de pedidos</Heading>
              </HStack>

              {pedidosLoading ? (
                <Stack spacing={3}>
                  <Skeleton height="28px" borderRadius="lg" />
                  <Skeleton height="90px" borderRadius="lg" />
                </Stack>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={3}>
                    <Box
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      p={3}
                    >
                      <Text fontSize="xs" color={muted}>
                        Pedidos totales
                      </Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {resumenPedidos.totalPedidos}
                      </Text>
                    </Box>
                    <Box
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      p={3}
                    >
                      <Text fontSize="xs" color={muted}>
                        Pedidos activos
                      </Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {resumenPedidos.pedidosActivos}
                      </Text>
                    </Box>
                    <Box
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      p={3}
                    >
                      <Text fontSize="xs" color={muted}>
                        Total comprado (aprox.)
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" color={accent}>
                        {fmtCop(resumenPedidos.totalGastado)}
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {ultimosPedidos.length > 0 && (
                    <>
                      <Text fontSize="xs" color={muted} mb={1}>
                        Últimos pedidos
                      </Text>
                      <Stack spacing={2}>
                        {ultimosPedidos.map((p) => (
                          <Flex
                            key={p.id}
                            align="center"
                            justify="space-between"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={borderColor}
                            p={2}
                          >
                            <Box>
                              <Text fontSize="sm" fontWeight="semibold">
                                #{p.id}
                              </Text>
                              <Text fontSize="xs" color={muted}>
                                {new Date(
                                  p.fecha_creacion
                                ).toLocaleDateString()}{" "}
                                •{" "}
                                {new Date(
                                  p.fecha_creacion
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </Box>
                            <Box textAlign="right">
                              <Badge
                                colorScheme={
                                  p.estado === "PENDIENTE"
                                    ? "yellow"
                                    : p.estado === "PAGADO"
                                    ? "green"
                                    : p.estado === "ENVIADO"
                                    ? "blue"
                                    : "red"
                                }
                                mb={1}
                              >
                                {p.estado}
                              </Badge>
                              <Text fontSize="sm" fontWeight="bold">
                                {fmtCop(p.total)}
                              </Text>
                            </Box>
                          </Flex>
                        ))}
                      </Stack>
                    </>
                  )}

                  <HStack justify="flex-end" pt={3}>
                    <Button
                      size="sm"
                      rightIcon={<FiArrowRight />}
                      onClick={() => navigate("/cliente/pedidos")}
                    >
                      Ver todos mis pedidos
                    </Button>
                  </HStack>
                </>
              )}
            </MotionBox>

            {/* PREFERENCIAS + NOTIFICACIONES */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
              mb={4}
            >
              <HStack mb={3} spacing={2}>
                <Icon as={FiBell} />
                <Heading size="sm">Notificaciones y preferencias</Heading>
              </HStack>

              <Stack spacing={3} mb={3}>
                <FormControl
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <FormLabel mb="0" fontSize="sm">
                    Estado de mis pedidos
                  </FormLabel>
                  <Switch
                    size="sm"
                    isChecked={prefNotif.estadoPedido}
                    onChange={(e) =>
                      setPrefNotif((p) => ({
                        ...p,
                        estadoPedido: e.target.checked,
                      }))
                    }
                  />
                </FormControl>
                <FormControl
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <FormLabel mb="0" fontSize="sm">
                    Actualizaciones de soporte
                  </FormLabel>
                  <Switch
                    size="sm"
                    isChecked={prefNotif.soporte}
                    onChange={(e) =>
                      setPrefNotif((p) => ({
                        ...p,
                        soporte: e.target.checked,
                      }))
                    }
                  />
                </FormControl>
                <FormControl
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <FormLabel mb="0" fontSize="sm">
                    Promociones y ofertas
                  </FormLabel>
                  <Switch
                    size="sm"
                    isChecked={prefNotif.marketing}
                    onChange={(e) =>
                      setPrefNotif((p) => ({
                        ...p,
                        marketing: e.target.checked,
                      }))
                    }
                  />
                </FormControl>

                <Text fontSize="xs" color={muted}>
                  Estas preferencias son de interfaz. En una versión futura se
                  pueden persistir en el backend en una tabla de
                  preferencias_notificacion.
                </Text>
              </Stack>

              <Divider my={3} />

              <Text fontSize="xs" color={muted} mb={2}>
                Notificaciones recientes
              </Text>

              {notifLoading ? (
                <Stack spacing={2}>
                  <Skeleton height="20px" />
                  <Skeleton height="20px" />
                </Stack>
              ) : ultimasNotificaciones.length === 0 ? (
                <Text fontSize="sm" color={muted}>
                  Aún no tienes notificaciones registradas.
                </Text>
              ) : (
                <Stack spacing={2}>
                  {ultimasNotificaciones.map((n) => (
                    <Flex
                      key={n.id}
                      align="flex-start"
                      justify="space-between"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={borderColor}
                      p={2}
                    >
                      <Box>
                        <Text
                          fontSize="sm"
                          fontWeight={n.leido ? "normal" : "semibold"}
                        >
                          {n.titulo}
                        </Text>
                        <Text fontSize="xs" color={muted}>
                          {n.mensaje}
                        </Text>
                      </Box>
                      <VStack spacing={1} align="flex-end">
                        <Badge
                          colorScheme={n.leido ? "gray" : "yellow"}
                          variant={n.leido ? "subtle" : "solid"}
                        >
                          {n.leido ? "Leída" : "Nueva"}
                        </Badge>
                        {!n.leido && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleMarcarNotifLeida(n.id)}
                            isLoading={notifSaving}
                          >
                            Marcar leída
                          </Button>
                        )}
                      </VStack>
                    </Flex>
                  ))}
                </Stack>
              )}
            </MotionBox>

            {/* AYUDA / PRIVACIDAD / CIERRE */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
            >
              <HStack mb={3} spacing={2}>
                <Icon as={FiSettings} />
                <Heading size="sm">
                  Soporte, ayuda y configuración de cuenta
                </Heading>
              </HStack>

              <Stack spacing={3}>
                <Box>
                  <Text fontSize="xs" color={muted} mb={1}>
                    ¿Necesitas ayuda? Te recomendamos seguir estos pasos:
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    1) Revisa primero las Preguntas frecuentes (FAQ).{" "}
                    2) Si aún necesitas ayuda, abre un caso de soporte
                    personalizado.
                  </Text>
                </Box>

                {/* 1. FAQ / Centro de ayuda */}
                <Box
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                  p={3}
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    Preguntas frecuentes (FAQ)
                  </Text>
                  <Text fontSize="xs" color={muted} mb={2}>
                    Primero revisa aquí las respuestas rápidas sobre pedidos,
                    envíos, pagos y el uso de tu cuenta.
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FiHelpCircle />}
                    onClick={() => navigate("/cliente/AyudaFAQ")}
                  >
                    Ver preguntas frecuentes
                  </Button>
                </Box>

                {/* 2. Soporte personalizado (casos) */}
                <Box
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                  p={3}
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    Soporte personalizado (casos)
                  </Text>
                  <Text fontSize="xs" color={muted} mb={2}>
                    Si no encontraste la respuesta en las preguntas frecuentes
                    o tienes un problema con un pedido o tu cuenta, abre un
                    caso para hablar con el equipo de FerreExpress.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    color="gray.800"
                    leftIcon={<FiLifeBuoy />}
                    onClick={() => navigate("/cliente/casos")}
                  >
                    Abrir un caso de soporte
                  </Button>
                  <Text fontSize="10px" color={muted} mt={1}>
                    Puedes consultar el estado de tus casos abiertos y el
                    historial de solicitudes.
                  </Text>
                </Box>

                {/* 3. Términos y privacidad */}
                <Box
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={borderColor}
                  p={3}
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={1}>
                    Términos y privacidad
                  </Text>
                  <Text fontSize="xs" color={muted} mb={2}>
                    Consulta los términos de uso y el aviso de privacidad de
                    FerreExpress.
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => navigate("/condiciones-uso")}
                    >
                      Términos de uso
                    </Button>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => navigate("/avisos-privacidad")}
                    >
                      Aviso de privacidad
                    </Button>
                  </HStack>
                </Box>
              </Stack>
            </MotionBox>
          </MotionBox>
        </SimpleGrid>
      </Box>

      {/* 🛟 Botón flotante de soporte */}
      <Tooltip label="¿Necesitas ayuda? Abre un caso de soporte" hasArrow>
        <IconButton
          icon={<FiLifeBuoy />}
          aria-label="Abrir casos de soporte"
          colorScheme="yellow"
          color="gray.800"
          size="lg"
          borderRadius="full"
          position="fixed"
          bottom={{ base: 16, md: 10 }}
          right={{ base: 4, md: 10 }}
          boxShadow="0 10px 30px rgba(0,0,0,0.35)"
          onClick={() => navigate("/cliente/casos")}
          _hover={{
            transform: "translateY(-2px)",
            filter: "brightness(1.05)",
          }}
          _active={{ transform: "translateY(0)" }}
          zIndex={20}
        />
      </Tooltip>

      {/* MODAL DIRECCION */}
      <Modal
        isOpen={isDirModalOpen}
        onClose={onDirModalClose}
        isCentered
        size={isMobile ? "full" : "md"}
      >
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          borderRadius={isMobile ? "none" : "2xl"}
          m={isMobile ? 0 : 4}
        >
          <ModalHeader>
            {editandoDireccion ? "Editar dirección" : "Nueva dirección"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={3}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Dirección</FormLabel>
                <Input
                  size="sm"
                  value={dirForm.direccion}
                  onChange={(e) =>
                    handleChangeDirForm("direccion", e.target.value)
                  }
                  placeholder="Ej: Calle 5 # 12-34"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Ciudad</FormLabel>
                <Input
                  size="sm"
                  value={dirForm.ciudad}
                  onChange={(e) =>
                    handleChangeDirForm("ciudad", e.target.value)
                  }
                  placeholder="Ej: Cali"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Departamento</FormLabel>
                <Input
                  size="sm"
                  value={dirForm.departamento}
                  onChange={(e) =>
                    handleChangeDirForm("departamento", e.target.value)
                  }
                  placeholder="Ej: Valle del Cauca"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">País</FormLabel>
                <Input
                  size="sm"
                  value={dirForm.pais}
                  onChange={(e) =>
                    handleChangeDirForm("pais", e.target.value)
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Teléfono de contacto</FormLabel>
                <Input
                  size="sm"
                  value={dirForm.telefono}
                  onChange={(e) =>
                    handleChangeDirForm("telefono", e.target.value)
                  }
                  placeholder="Opcional"
                />
              </FormControl>
              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel mb="0" fontSize="sm">
                  Marcar como dirección principal
                </FormLabel>
                <Switch
                  size="sm"
                  isChecked={dirForm.es_principal}
                  onChange={(e) =>
                    handleChangeDirForm("es_principal", e.target.checked)
                  }
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <HStack w="full" justify="space-between">
              <Button variant="ghost" onClick={onDirModalClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="yellow"
                color="gray.800"
                onClick={handleGuardarDireccion}
                isLoading={dirSaving}
              >
                Guardar dirección
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
