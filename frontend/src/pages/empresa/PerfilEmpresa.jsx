// src/pages/empresa/PerfilEmpresa.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
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
  FiPhone,
  FiMail,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiStar,
  FiCheck,
  FiBell,
  FiTruck,
  FiHelpCircle,
  FiArrowRight,
  FiExternalLink,
  FiLifeBuoy,
  FiSettings,
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

export default function PerfilEmpresa() {
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // THEME
  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const subtleBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accent = "#F9BF20";
  const stickyBg = useColorModeValue(
    "rgba(255,255,255,0.92)",
    "rgba(26,32,44,0.92)"
  );
  const accentSoft = useColorModeValue("yellow.50", "yellow.900Alpha");

  // ---- Perfil de usuario (empresa/contratista) ----
  const [perfil, setPerfil] = useState(null);
  const [perfilForm, setPerfilForm] = useState({
    username: "",
    telefono: "",
  });
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

  // ---- Cambio de contraseña ----
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [changingPass, setChangingPass] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // ---- Pedidos (resumen) ----
  const [pedidos, setPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);

  // ---- Notificaciones (resumen) ----
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // ---- Preferencias de notificación (solo front) ----
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
      console.error("Error cargando perfil/direcciones:", error);
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
      console.error("Error al cargar pedidos:", e);
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
      console.error("Error al cargar notificaciones:", e);
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

  const estadoEmpresaColor =
    perfil?.estado === "BLOQUEADO"
      ? "red"
      : perfil?.estado === "ACTIVO"
      ? "green"
      : "gray";

  const isEmpresaBloqueada = perfil?.estado === "BLOQUEADO";

  // ==== HANDLERS PERFIL ====
  const handlePerfilChange = (field) => (e) => {
    setPerfilForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
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
          ? {
              ...prev,
              username: perfilForm.username.trim(),
              telefono: perfilForm.telefono?.trim() || null,
            }
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
      console.error("Error al actualizar perfil:", error);
      const msg =
        error?.response?.data?.error || "No se pudo actualizar el perfil.";
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
      es_principal: direcciones.length === 0, // primera dirección -> principal por defecto
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

  const handleDireccionChange = (field) => (e) => {
    const value =
      e && e.target
        ? e.target.type === "checkbox"
          ? e.target.checked
          : e.target.value
        : e;
    setDireccionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      console.error("Error al guardar dirección:", error);
      const msg =
        error?.response?.data?.error ||
        "No se pudo guardar la dirección. Intenta de nuevo.";
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
    const ok = window.confirm(
      `¿Seguro que deseas eliminar la dirección "${dir.direccion}"?`
    );
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
      console.error("Error al eliminar dirección:", error);
      const msg =
        error?.response?.data?.error ||
        "No se pudo eliminar la dirección. Intenta de nuevo.";
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
        description:
          "Se actualizó la dirección principal para tus pedidos y domicilios.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      const { data } = await api.get("/direcciones");
      setDirecciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al marcar dirección principal:", error);
      const msg =
        error?.response?.data?.error ||
        "No se pudo actualizar la dirección principal.";
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
    setPassForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !passForm.oldPassword ||
      !passForm.newPassword ||
      !passForm.confirmNewPassword
    ) {
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

      setPassForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      const msg =
        error?.response?.data?.error ||
        "No se pudo cambiar la contraseña. Revisa tus datos.";
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

  // ==== ANIMACIONES ====
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

  // ================== RENDER ==================
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
            <Avatar
              size="md"
              name={perfil?.username || "Empresa"}
              bg={accent}
              color="gray.900"
            />
            <VStack align="start" spacing={0}>
              <Heading size={{ base: "md", md: "lg" }}>
                Mi perfil de empresa / contratista
              </Heading>
              <Text fontSize="sm" color={muted}>
                Administra los datos de tu cuenta, la información de la empresa
                y la actividad en FerreExpress.
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            {perfil && (
              <Tag size="sm" colorScheme={estadoEmpresaColor}>
                <TagLabel>
                  {perfil.estado === "BLOQUEADO"
                    ? "Cuenta bloqueada"
                    : "Cuenta activa"}
                </TagLabel>
              </Tag>
            )}
            {perfil && (
              <Tag size="sm" variant="outline" colorScheme="yellow">
                <TagLabel>
                  Rol:{" "}
                  {perfil.role === "CONTRATISTA"
                    ? "Empresa / Contratista"
                    : perfil.role}
                </TagLabel>
              </Tag>
            )}
            <Tooltip label="Recargar todo" hasArrow>
              <IconButton
                size="sm"
                variant="ghost"
                icon={<FiRefreshCw />}
                onClick={() => {
                  fetchPerfilYDirecciones();
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
              onClick={() => navigate("/empresa/mis-pedidos")}
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
          <MotionBox variants={containerVariants} initial="hidden" animate="show">
            {/* DATOS DE CUENTA / EMPRESA */}
            <MotionBox
              variants={itemVariants}
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              boxShadow="sm"
              p={4}
              mb={4}
              as="form"
              onSubmit={handleSubmitPerfil}
            >
              {loadingPerfil ? (
                <Stack spacing={3}>
                  <Skeleton height="20px" />
                  <SkeletonText noOfLines={3} />
                </Stack>
              ) : (
                <>
                  <HStack mb={3} justify="space-between">
                    <HStack>
                      <Icon as={FiUser} />
                      <Heading size="sm">Datos de la cuenta</Heading>
                    </HStack>
                    {perfil?.created_at && (
                      <Text fontSize="xs" color={muted}>
                        Cliente empresa desde:{" "}
                        {new Date(perfil.created_at).toLocaleDateString(
                          "es-CO"
                        )}
                      </Text>
                    )}
                  </HStack>

                  <Stack spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Nombre de contacto</FormLabel>
                      <Input
                        size="sm"
                        value={perfilForm.username}
                        onChange={handlePerfilChange("username")}
                        placeholder="Nombre del contacto principal"
                      />
                      <FormHelperText fontSize="xs" color={muted}>
                        Se usará en cotizaciones, correos y comunicaciones.
                      </FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Teléfono de contacto</FormLabel>
                      <InputGroup size="sm">
                        <Input
                          value={perfilForm.telefono || ""}
                          onChange={handlePerfilChange("telefono")}
                          placeholder="+57 300 000 0000"
                        />
                        <InputRightElement>
                          <Icon as={FiPhone} fontSize="sm" color={muted} />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <FormControl isReadOnly>
                      <FormLabel fontSize="sm">Correo de acceso</FormLabel>
                      <InputGroup size="sm">
                        <Input value={perfil?.email || ""} />
                        <InputRightElement>
                          <Icon as={FiMail} fontSize="sm" color={muted} />
                        </InputRightElement>
                      </InputGroup>
                      <FormHelperText fontSize="xs" color={muted}>
                        Se usa para ingresar y recibir notificaciones
                        transaccionales.
                      </FormHelperText>
                    </FormControl>

                    {perfil?.nit && (
                      <FormControl isReadOnly>
                        <FormLabel fontSize="sm">NIT de la empresa</FormLabel>
                        <Input size="sm" value={perfil.nit} />
                        <FormHelperText fontSize="xs" color={muted}>
                          Definido al registrar tu empresa en la plataforma.
                        </FormHelperText>
                      </FormControl>
                    )}

                    <FormControl isReadOnly>
                      <FormLabel fontSize="sm">Rol</FormLabel>
                      <Input
                        size="sm"
                        value={
                          perfil?.role === "CONTRATISTA"
                            ? "EMPRESA / CONTRATISTA"
                            : perfil?.role || "EMPRESA"
                        }
                      />
                    </FormControl>

                    <HStack justify="flex-end" pt={2}>
                      <Button
                        type="submit"
                        size="sm"
                        colorScheme="yellow"
                        color="gray.800"
                        isLoading={savingPerfil}
                        leftIcon={<FiCheck />}
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
              as="form"
              onSubmit={handleChangePassword}
            >
              <HStack mb={3} spacing={2}>
                <Icon as={FiLock} />
                <Heading size="sm">Seguridad y acceso</Heading>
              </HStack>

              <Stack spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Contraseña actual</FormLabel>
                  <InputGroup size="sm">
                    <Input
                      type={showOldPass ? "text" : "password"}
                      value={passForm.oldPassword}
                      onChange={handlePassChange("oldPassword")}
                      placeholder="••••••••"
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowOldPass((v) => !v)}
                      >
                        {showOldPass ? "Ocultar" : "Ver"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Nueva contraseña</FormLabel>
                  <InputGroup size="sm">
                    <Input
                      type={showNewPass ? "text" : "password"}
                      value={passForm.newPassword}
                      onChange={handlePassChange("newPassword")}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowNewPass((v) => !v)}
                      >
                        {showNewPass ? "Ocultar" : "Ver"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormHelperText fontSize="xs">
                    Evita usar la misma contraseña de otros sistemas de tu
                    empresa.
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">
                    Confirmar nueva contraseña
                  </FormLabel>
                  <InputGroup size="sm">
                    <Input
                      type={showConfirmPass ? "text" : "password"}
                      value={passForm.confirmNewPassword}
                      onChange={handlePassChange("confirmNewPassword")}
                      placeholder="Repite la nueva contraseña"
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setShowConfirmPass((v) => !v)}
                      >
                        {showConfirmPass ? "Ocultar" : "Ver"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <HStack justify="space-between" pt={2} flexWrap="wrap">
                  <Tag size="sm" variant="subtle" colorScheme="yellow">
                    <TagLabel>
                      Segundo factor / verificación correo: pendiente de
                      implementar
                    </TagLabel>
                  </Tag>
                  <Button
                    type="submit"
                    size="sm"
                    colorScheme="yellow"
                    color="gray.800"
                    isLoading={changingPass}
                    leftIcon={<FiLock />}
                  >
                    Actualizar contraseña
                  </Button>
                </HStack>
              </Stack>
            </MotionBox>

            {/* DIRECCIONES EMPRESA */}
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
                  <Heading size="sm">Direcciones de la empresa</Heading>
                </HStack>
                <Button
                  size="sm"
                  leftIcon={<FiPlus />}
                  variant="outline"
                  onClick={openCrearDireccion}
                  isDisabled={savingDireccion}
                >
                  Nueva dirección
                </Button>
              </HStack>

              <Text fontSize="xs" color={muted} mb={3}>
                Estas direcciones se usan en el checkout, para envíos a bodega o
                sede y como referencia en cotizaciones y pedidos B2B.
              </Text>

              {loadingDirecciones ? (
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
                    Aún no tienes direcciones registradas para tu empresa.
                  </Text>
                  <Button size="sm" onClick={openCrearDireccion}>
                    Registrar primera dirección
                  </Button>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {direcciones.map((dir) => (
                    <Box
                      key={dir.id}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={dir.es_principal ? accent : borderColor}
                      bg={dir.es_principal ? accentSoft : subtleBg}
                      p={3}
                    >
                      <HStack justify="space-between" align="flex-start">
                        <VStack align="flex-start" spacing={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="semibold" fontSize="sm">
                              {dir.direccion}
                            </Text>
                            {dir.es_principal ? (
                              <Badge
                                colorScheme="yellow"
                                display="flex"
                                alignItems="center"
                                gap={1}
                              >
                                <Icon as={FiStar} /> Principal
                              </Badge>
                            ) : null}
                          </HStack>
                          <Text fontSize="xs" color={muted}>
                            {dir.ciudad}
                            {dir.departamento ? `, ${dir.departamento}` : ""} ·{" "}
                            {dir.pais || "Colombia"}
                          </Text>
                          {dir.telefono && (
                            <Text fontSize="xs" color={muted}>
                              Tel: {dir.telefono}
                            </Text>
                          )}
                        </VStack>

                        <HStack spacing={1}>
                          {!dir.es_principal && (
                            <Tooltip label="Marcar como principal" hasArrow>
                              <IconButton
                                aria-label="Marcar como principal"
                                icon={<FiStar />}
                                size="xs"
                                variant="ghost"
                                onClick={() => handleMarcarPrincipal(dir)}
                                isDisabled={savingDireccion}
                              />
                            </Tooltip>
                          )}
                          <Tooltip label="Editar" hasArrow>
                            <IconButton
                              aria-label="Editar dirección"
                              size="xs"
                              variant="ghost"
                              icon={<FiExternalLink />}
                              onClick={() => openEditarDireccion(dir)}
                              isDisabled={savingDireccion}
                            />
                          </Tooltip>
                          <Tooltip label="Eliminar" hasArrow>
                            <IconButton
                              aria-label="Eliminar dirección"
                              size="xs"
                              variant="ghost"
                              icon={<FiTrash2 />}
                              onClick={() => handleDeleteDireccion(dir)}
                              isDisabled={savingDireccion}
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </Stack>
              )}
            </MotionBox>
          </MotionBox>

          {/* COLUMNA DERECHA */}
          <MotionBox variants={containerVariants} initial="hidden" animate="show">
            {/* RESUMEN DE PEDIDOS */}
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
                <Heading size="sm">Resumen de pedidos de empresa</Heading>
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
                                ).toLocaleDateString("es-CO")}{" "}
                                •{" "}
                                {new Date(
                                  p.fecha_creacion
                                ).toLocaleTimeString("es-CO", {
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

                  <HStack justify="flex-end" pt={3} spacing={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      rightIcon={<FiArrowRight />}
                      onClick={() => navigate("/empresa/cotizaciones")}
                    >
                      Ver mis cotizaciones
                    </Button>
                    <Button
                      size="sm"
                      rightIcon={<FiArrowRight />}
                      onClick={() => navigate("/empresa/mis-pedidos")}
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
                    Estado de mis pedidos y cotizaciones
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
                    Promociones y ofertas B2B
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
                  preferencias_notificacion por empresa.
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

            {/* AYUDA / SOPORTE / TÉRMINOS */}
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
                    ¿Necesitas ayuda con tus pedidos B2B o cotizaciones?
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    1) Revisa primero las Preguntas frecuentes (FAQ) para
                    empresas. 2) Si aún necesitas ayuda, abre un caso de soporte
                    para hablar con el equipo de FerreExpress.
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
                    Preguntas frecuentes (FAQ) para empresas
                  </Text>
                  <Text fontSize="xs" color={muted} mb={2}>
                    Revisa respuestas rápidas sobre cotizaciones por volumen,
                    plazos de entrega, medios de pago y gestión de tu empresa.
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FiHelpCircle />}
                    onClick={() => navigate("/empresa/AyudaFAQ")}
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
                    Si tienes un problema con un pedido, una cotización o tu
                    cuenta de empresa, abre un caso para hacer seguimiento con
                    el equipo de FerreExpress.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    color="gray.800"
                    leftIcon={<FiLifeBuoy />}
                    onClick={() => navigate("/empresa/casos-empresa")}
                  >
                    Abrir un caso de soporte
                  </Button>
                  <Text fontSize="10px" color={muted} mt={1}>
                    Podrás consultar el estado de tus casos abiertos y el
                    historial de solicitudes de tu empresa.
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
                    Consulta las condiciones de uso y el aviso de privacidad que
                    aplican a tu empresa en FerreExpress.
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

      {/* 🛟 Botón flotante de soporte empresa */}
      {!isEmpresaBloqueada && (
        <Tooltip
          label="¿Necesitas ayuda? Abre un caso de soporte para tu empresa"
          hasArrow
        >
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
            onClick={() => navigate("/empresa/casos-empresa")}
            _hover={{
              transform: "translateY(-2px)",
              filter: "brightness(1.05)",
            }}
            _active={{ transform: "translateY(0)" }}
            zIndex={20}
          />
        </Tooltip>
      )}

      {/* MODAL DIRECCIÓN */}
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
            {editingDireccion ? "Editar dirección" : "Nueva dirección"}
          </ModalHeader>
          <ModalCloseButton />
          <Box as="form" onSubmit={handleSubmitDireccion}>
            <ModalBody>
              <Stack spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Dirección</FormLabel>
                  <Input
                    size="sm"
                    value={direccionForm.direccion}
                    onChange={handleDireccionChange("direccion")}
                    placeholder="Ej: Calle 16 #76-28, Bodega 2"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Ciudad</FormLabel>
                  <Input
                    size="sm"
                    value={direccionForm.ciudad}
                    onChange={handleDireccionChange("ciudad")}
                    placeholder="Ej: Cali"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Departamento</FormLabel>
                  <Input
                    size="sm"
                    value={direccionForm.departamento}
                    onChange={handleDireccionChange("departamento")}
                    placeholder="Ej: Valle del Cauca"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">País</FormLabel>
                  <Input
                    size="sm"
                    value={direccionForm.pais}
                    onChange={handleDireccionChange("pais")}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Teléfono de contacto</FormLabel>
                  <Input
                    size="sm"
                    value={direccionForm.telefono}
                    onChange={handleDireccionChange("telefono")}
                    placeholder="+57 300 000 0000"
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
                    isChecked={direccionForm.es_principal}
                    onChange={handleDireccionChange("es_principal")}
                    colorScheme="yellow"
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <HStack w="full" justify="space-between">
                <Button
                  variant="ghost"
                  onClick={onDirModalClose}
                  isDisabled={savingDireccion}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  colorScheme="yellow"
                  color="gray.800"
                  isLoading={savingDireccion}
                  leftIcon={<FiCheck />}
                >
                  Guardar dirección
                </Button>
              </HStack>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>
    </Box>
  );
}
