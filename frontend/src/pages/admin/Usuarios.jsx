// src/pages/admin/Usuarios.jsx
import { useEffect, useMemo, useState } from "react";
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
} from "@chakra-ui/react";
import {
  FiUsers,
  FiRefreshCw,
  FiSearch,
  FiMail,
  FiUser,
  FiLock,
  FiUnlock,
} from "react-icons/fi";
import api from "../../utils/axiosInstance";

/* ==== helpers ==== */

const fmtDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-CO");
};

const roleLabel = (role) => {
  switch (role) {
    case "CLIENTE":
      return "Cliente";
    case "CONTRATISTA":
      return "Contratista";
    case "ADMIN":
      return "Admin";
    default:
      return role || "—";
  }
};

const roleColor = (role) => {
  switch (role) {
    case "CLIENTE":
      return "green";
    case "CONTRATISTA":
      return "purple";
    case "ADMIN":
      return "orange";
    default:
      return "gray";
  }
};

const estadoLabel = (estado) => {
  if (!estado || estado === "ACTIVO") return "Activo";
  if (estado === "BLOQUEADO") return "Bloqueado";
  return estado;
};

const estadoColor = (estado) => {
  if (!estado || estado === "ACTIVO") return "green";
  if (estado === "BLOQUEADO") return "red";
  return "gray";
};

const norm = (s) => (s || "").toString().toLowerCase();

/* ==== componente principal ==== */

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros "en edición"
  const [filters, setFilters] = useState({
    rol: "",
    estado: "",
    search: "",
  });

  // filtros aplicados (solo cambian al darle clic a "Aplicar filtros")
  const [appliedFilters, setAppliedFilters] = useState({
    rol: "",
    estado: "",
    search: "",
  });

  const [updatingId, setUpdatingId] = useState(null);

  const toast = useToast();

  // tokens visuales coherentes con el resto del Admin
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

  // 👇 AQUÍ el cambio importante: usar /admin/usuarios
  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/usuarios");
      setUsuarios(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cargar usuarios",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeFiltro = (field) => (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const aplicarFiltros = () => {
    setAppliedFilters(filters);
  };

  const limpiarFiltros = () => {
    const base = { rol: "", estado: "", search: "" };
    setFilters(base);
    setAppliedFilters(base);
  };

  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    const { rol, estado, search } = appliedFilters;
    const q = norm(search);

    return usuarios.filter((u) => {
      const r = (u.role || "").toUpperCase();
      const e = (u.estado || "ACTIVO").toUpperCase();

      if (rol && r !== rol) return false;
      if (estado && e !== estado) return false;

      if (q) {
        const hayCoincidencia =
          norm(u.username).includes(q) || norm(u.email).includes(q);
        if (!hayCoincidencia) return false;
      }

      return true;
    });
  }, [usuarios, appliedFilters]);

  // 👇 AQUÍ el otro cambio importante: usar /admin/usuarios/:id/estado
  const toggleEstado = async (u) => {
    const actual = u.estado || "ACTIVO";
    const nuevoEstado = actual === "ACTIVO" ? "BLOQUEADO" : "ACTIVO";

    try {
      setUpdatingId(u.id);
      await api.put(`/admin/usuarios/${u.id}/estado`, {
        estado: nuevoEstado,
      });

      toast({
        title: "Usuario actualizado",
        description: `Usuario #${u.id} ahora está ${estadoLabel(
          nuevoEstado
        )}.`,
        status: "success",
        duration: 2500,
      });

      // actualizar en memoria sin reconsultar todo
      setUsuarios((prev) =>
        prev.map((usr) =>
          usr.id === u.id ? { ...usr, estado: nuevoEstado } : usr
        )
      );
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar usuario",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 6 }}>
      {/* Header */}
      <HStack justify="space-between" align="flex-start" mb={4} flexWrap="wrap">
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={2}>
            <Heading size="lg" color={title}>
              Usuarios
            </Heading>
            <Tag size="sm" variant="subtle" colorScheme="blue">
              <TagLeftIcon as={FiUsers} />
              <TagLabel>Gestión de cuentas</TagLabel>
            </Tag>
          </HStack>
          <Text fontSize="sm" color={muted}>
            Administra las cuentas de clientes, contratistas y administradores.
            Puedes filtrar, revisar datos básicos y bloquear/reactivar usuarios.
          </Text>
        </VStack>

        <HStack spacing={2} mt={{ base: 3, md: 0 }}>
          <Tooltip label="Recargar usuarios" hasArrow>
            <IconButton
              size="sm"
              aria-label="Recargar usuarios"
              icon={<FiRefreshCw />}
              variant="ghost"
              onClick={fetchUsuarios}
            />
          </Tooltip>
        </HStack>
      </HStack>

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
        <HStack spacing={3} mb={3} align="center">
          <FiSearch />
          <Text fontSize="sm" color={muted}>
            Filtros de búsqueda
          </Text>
        </HStack>

        <HStack spacing={3} flexWrap="wrap" mb={3}>
          <Box minW="180px">
            <Text fontSize="xs" mb={1} color={muted}>
              Rol
            </Text>
            <Select
              size="sm"
              value={filters.rol}
              onChange={onChangeFiltro("rol")}
            >
              <option value="">Todos</option>
              <option value="CLIENTE">Cliente</option>
              <option value="CONTRATISTA">Contratista</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Box>

          <Box minW="180px">
            <Text fontSize="xs" mb={1} color={muted}>
              Estado de la cuenta
            </Text>
            <Select
              size="sm"
              value={filters.estado}
              onChange={onChangeFiltro("estado")}
            >
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </Select>
          </Box>

          <Box flex="1 1 220px">
            <Text fontSize="xs" mb={1} color={muted}>
              Buscar (nombre o correo)
            </Text>
            <Input
              size="sm"
              value={filters.search}
              onChange={onChangeFiltro("search")}
              placeholder="Ej: juan, cliente@correo.com"
            />
          </Box>
        </HStack>

        <HStack justify="flex-end" spacing={2}>
          <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
            Limpiar
          </Button>
          <Button
            size="sm"
            leftIcon={<FiSearch />}
            colorScheme="yellow"
            color="black"
            onClick={aplicarFiltros}
          >
            Aplicar filtros
          </Button>
        </HStack>
      </Box>

      {/* Tabla usuarios */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="2xl"
        boxShadow={shadowSm}
        p={4}
        sx={{ backdropFilter: "saturate(140%) blur(8px)" }}
      >
        <HStack justify="space-between" mb={3}>
          <Text fontSize="sm" color={muted}>
            Total registros: <b>{filteredUsuarios.length}</b>
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
        ) : filteredUsuarios.length === 0 ? (
          <VStack py={6} spacing={2}>
            <Text color={muted} fontSize="sm">
              No se encontraron usuarios con los filtros actuales.
            </Text>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Usuario</Th>
                  <Th>Correo</Th>
                  <Th>Rol</Th>
                  <Th>Estado</Th>
                  <Th>Teléfono / NIT</Th>
                  <Th>
                    <HStack spacing={1}>
                      <FiUser />
                      <Text as="span" fontSize="xs">
                        Creado
                      </Text>
                    </HStack>
                  </Th>
                  <Th textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsuarios.map((u) => {
                  const estadoEf = u.estado || "ACTIVO";
                  return (
                    <Tr key={u.id}>
                      <Td>{u.id}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <FiUser />
                          <VStack align="flex-start" spacing={0}>
                            <Text fontSize="sm" fontWeight="semibold">
                              {u.username}
                            </Text>
                            <Text fontSize="xs" color={muted}>
                              {roleLabel(u.role)}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <FiMail />
                          <Text fontSize="xs" color={muted} noOfLines={1}>
                            {u.email}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={roleColor(u.role)} variant="subtle">
                          {roleLabel(u.role)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={estadoColor(estadoEf)}
                          variant="solid"
                        >
                          {estadoLabel(estadoEf)}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="xs">
                            {u.telefono || (
                              <span style={{ color: "#718096" }}>—</span>
                            )}
                          </Text>
                          {u.nit && (
                            <Text fontSize="xs" color={muted}>
                              NIT: {u.nit}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color={muted}>
                          {fmtDateTime(u.created_at)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack justify="flex-end">
                          {estadoEf === "ACTIVO" ? (
                            <Tooltip
                              label="Bloquear usuario"
                              hasArrow
                              placement="top"
                            >
                              <IconButton
                                size="xs"
                                aria-label="Bloquear usuario"
                                icon={<FiLock />}
                                variant="outline"
                                colorScheme="red"
                                isLoading={updatingId === u.id}
                                onClick={() => toggleEstado(u)}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip
                              label="Reactivar usuario"
                              hasArrow
                              placement="top"
                            >
                              <IconButton
                                size="xs"
                                aria-label="Reactivar usuario"
                                icon={<FiUnlock />}
                                variant="outline"
                                colorScheme="green"
                                isLoading={updatingId === u.id}
                                onClick={() => toggleEstado(u)}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </Box>
  );
}
