// src/pages/admin/Descuentos.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Button,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Switch,
  Tooltip,
  Divider,
  Skeleton,
  SkeletonText,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Tag,
  TagLabel,
  TagLeftIcon,
} from "@chakra-ui/react";
import {
  FiSliders,
  FiPercent,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiPlus,
} from "react-icons/fi";
import api from "../../utils/axiosInstance";

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString("es-CO");
};

export default function Descuentos() {
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Crear regla
  const [form, setForm] = useState({
    tipo: "MISMO_PRODUCTO",
    umbral_cantidad: 12,
    umbral_items: 3,
    porcentaje: 5,
    activo: true,
    vigente: true,
  });
  const [creating, setCreating] = useState(false);

  // Editar regla
  const [editing, setEditing] = useState(null); // regla original
  const [editForm, setEditForm] = useState(null); // copia editable
  const [savingEdit, setSavingEdit] = useState(false);
  const editModal = useDisclosure();

  // Eliminar
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef();

  const toast = useToast();

  // Tokens visuales tipo Admin (glass)
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

  const fetchReglas = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/descuentos");
      setReglas(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cargar reglas de descuento",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReglas();
  }, []);

  const reglasOrdenadas = useMemo(
    () => [...reglas].sort((a, b) => (b.id || 0) - (a.id || 0)),
    [reglas]
  );

  const handleCreate = async () => {
    try {
      if (!form.porcentaje || Number(form.porcentaje) <= 0) {
        return toast({
          title: "Porcentaje inválido",
          description: "Ingresa un porcentaje mayor a 0.",
          status: "warning",
          duration: 2500,
        });
      }

      setCreating(true);

      const payload = {
        tipo: form.tipo,
        umbral_cantidad:
          form.tipo === "MISMO_PRODUCTO"
            ? Number(form.umbral_cantidad) || null
            : null,
        umbral_items:
          form.tipo === "VARIOS_PRODUCTOS"
            ? Number(form.umbral_items) || null
            : null,
        porcentaje: Number(form.porcentaje) || 0,
        activo: form.activo,
      };

      await api.post("/descuentos", payload);

      toast({
        title: "Regla creada",
        description: "La regla de descuento se creó correctamente.",
        status: "success",
        duration: 2500,
      });

      // Reset suave del formulario
      setForm((prev) => ({
        ...prev,
        umbral_cantidad: 12,
        umbral_items: 3,
        porcentaje: 5,
      }));

      fetchReglas();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al crear regla",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (regla) => {
    setEditing(regla);
    setEditForm({
      ...regla,
      activo: !!regla.activo,
      vigente: !!regla.vigente,
      version: regla.version ?? 1,
      umbral_cantidad: regla.umbral_cantidad ?? "",
      umbral_items: regla.umbral_items ?? "",
    });
    editModal.onOpen();
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    try {
      setSavingEdit(true);

      const payload = {
        tipo: editForm.tipo,
        umbral_cantidad:
          editForm.tipo === "MISMO_PRODUCTO"
            ? Number(editForm.umbral_cantidad) || null
            : null,
        umbral_items:
          editForm.tipo === "VARIOS_PRODUCTOS"
            ? Number(editForm.umbral_items) || null
            : null,
        porcentaje: Number(editForm.porcentaje) || 0,
        activo: !!editForm.activo,
        vigente: !!editForm.vigente,
        version: Number(editForm.version) || 1,
      };

      await api.put(`/descuentos/${editing.id}`, payload);

      toast({
        title: "Regla actualizada",
        description: `La regla #${editing.id} fue actualizada.`,
        status: "success",
        duration: 2500,
      });

      editModal.onClose();
      setEditing(null);
      setEditForm(null);
      fetchReglas();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar regla",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.delete(`/descuentos/${deleteId}`);

      toast({
        title: "Regla eliminada",
        description: `La regla #${deleteId} fue eliminada.`,
        status: "info",
        duration: 2500,
      });

      setDeleteId(null);
      fetchReglas();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al eliminar regla",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  const friendlyTipo = (tipo) => {
    if (tipo === "MISMO_PRODUCTO") return "Mismo producto";
    if (tipo === "VARIOS_PRODUCTOS") return "Varios productos";
    return tipo;
  };

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 6 }}>
      <HStack justify="space-between" align="flex-start" mb={4} flexWrap="wrap">
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={2}>
            <Heading size="lg" color={title}>
              Reglas de descuento
            </Heading>
            <Tag size="sm" variant="subtle" colorScheme="yellow">
              <TagLeftIcon as={FiSliders} />
              <TagLabel>Motor de promociones</TagLabel>
            </Tag>
          </HStack>
          <Text fontSize="sm" color={muted}>
            Define las reglas que aplican a las cotizaciones y pedidos
            (descuentos por volumen de compra).
          </Text>
        </VStack>

        <HStack spacing={2} mt={{ base: 3, md: 0 }}>
          <Tooltip label="Recargar lista" hasArrow>
            <IconButton
              size="sm"
              aria-label="Recargar reglas"
              icon={<FiRefreshCw />}
              onClick={fetchReglas}
              variant="ghost"
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* Card principal */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={border}
        borderRadius="2xl"
        boxShadow={shadowSm}
        p={4}
        sx={{ backdropFilter: "saturate(140%) blur(8px)" }}
      >
        {/* Formulario: crear nueva regla */}
        <VStack align="stretch" spacing={3} mb={4}>
          <HStack justify="space-between" align="center">
            <HStack spacing={2}>
              <Badge colorScheme="yellow" variant="subtle">
                Nuevo
              </Badge>
              <Text fontWeight="semibold" fontSize="sm">
                Crear regla de descuento
              </Text>
            </HStack>
          </HStack>

          <HStack spacing={3} flexWrap="wrap" align="flex-end">
            <Box minW="180px">
              <Text fontSize="xs" mb={1} color={muted}>
                Tipo de regla
              </Text>
              <Select
                size="sm"
                value={form.tipo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, tipo: e.target.value }))
                }
              >
                <option value="MISMO_PRODUCTO">
                  Mismo producto (cantidad por ítem)
                </option>
                <option value="VARIOS_PRODUCTOS">
                  Varios productos (cantidad de ítems distintos)
                </option>
              </Select>
            </Box>

            {form.tipo === "MISMO_PRODUCTO" && (
              <Box minW="150px">
                <Text fontSize="xs" mb={1} color={muted}>
                  Umbral cantidad (por producto)
                </Text>
                <NumberInput
                  size="sm"
                  min={1}
                  value={form.umbral_cantidad}
                  onChange={(_, v) =>
                    setForm((prev) => ({ ...prev, umbral_cantidad: v }))
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            )}

            {form.tipo === "VARIOS_PRODUCTOS" && (
              <Box minW="150px">
                <Text fontSize="xs" mb={1} color={muted}>
                  Umbral ítems distintos
                </Text>
                <NumberInput
                  size="sm"
                  min={1}
                  value={form.umbral_items}
                  onChange={(_, v) =>
                    setForm((prev) => ({ ...prev, umbral_items: v }))
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            )}

            <Box minW="130px">
              <Text fontSize="xs" mb={1} color={muted}>
                Porcentaje descuento (%)
              </Text>
              <HStack>
                <NumberInput
                  size="sm"
                  min={1}
                  max={100}
                  value={form.porcentaje}
                  onChange={(_, v) =>
                    setForm((prev) => ({ ...prev, porcentaje: v }))
                  }
                  w="100%"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FiPercent size={14} />
              </HStack>
            </Box>

            <HStack align="center" spacing={3}>
              <HStack>
                <Switch
                  size="sm"
                  isChecked={form.activo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, activo: e.target.checked }))
                  }
                />
                <Text fontSize="xs" color={muted}>
                  Activa
                </Text>
              </HStack>
              <HStack>
                <Switch
                  size="sm"
                  isChecked={form.vigente}
                  isDisabled
                />
                <Text fontSize="xs" color={muted}>
                  Vigente (por defecto)
                </Text>
              </HStack>
            </HStack>

            <Button
              leftIcon={<FiPlus />}
              size="sm"
              colorScheme="yellow"
              color="black"
              onClick={handleCreate}
              isLoading={creating}
            >
              Agregar regla
            </Button>
          </HStack>
        </VStack>

        <Divider my={3} />

        {/* Tabla de reglas */}
        {loading ? (
          <VStack align="stretch" spacing={3}>
            {[1, 2, 3].map((i) => (
              <Box key={i} p={3} borderRadius="lg" border="1px solid" borderColor={border}>
                <Skeleton height="16px" mb={2} />
                <SkeletonText noOfLines={2} spacing="2" />
              </Box>
            ))}
          </VStack>
        ) : reglasOrdenadas.length === 0 ? (
          <VStack py={6} spacing={2}>
            <Text color={muted} fontSize="sm">
              Aún no hay reglas de descuento configuradas.
            </Text>
            <Text color={muted} fontSize="xs">
              Crea una regla arriba para activar el motor de promociones.
            </Text>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Tipo</Th>
                  <Th isNumeric>Umbral</Th>
                  <Th isNumeric>% Desc.</Th>
                  <Th>Estado</Th>
                  <Th isNumeric>Versión</Th>
                  <Th>Fechas</Th>
                  <Th textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reglasOrdenadas.map((r) => {
                  const activo = !!r.activo;
                  const vigente = !!r.vigente;
                  const umbral =
                    r.tipo === "MISMO_PRODUCTO"
                      ? r.umbral_cantidad
                      : r.umbral_items;

                  return (
                    <Tr key={r.id}>
                      <Td>{r.id}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            r.tipo === "MISMO_PRODUCTO" ? "purple" : "blue"
                          }
                          variant="subtle"
                        >
                          {friendlyTipo(r.tipo)}
                        </Badge>
                      </Td>
                      <Td isNumeric>{umbral ?? "—"}</Td>
                      <Td isNumeric>{r.porcentaje}%</Td>
                      <Td>
                        <HStack spacing={1}>
                          <Badge
                            colorScheme={activo ? "green" : "gray"}
                            variant="subtle"
                          >
                            {activo ? "Activa" : "Inactiva"}
                          </Badge>
                          <Badge
                            colorScheme={vigente ? "yellow" : "red"}
                            variant="subtle"
                          >
                            {vigente ? "Vigente" : "No vigente"}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td isNumeric>{r.version ?? 1}</Td>
                      <Td>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="xs" color={muted}>
                            Creada: {fmtDate(r.created_at)}
                          </Text>
                          {r.updated_at && (
                            <Text fontSize="xs" color={muted}>
                              Actualizada: {fmtDate(r.updated_at)}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <HStack justify="flex-end" spacing={1}>
                          <Tooltip label="Editar regla" hasArrow>
                            <IconButton
                              size="xs"
                              aria-label="Editar regla"
                              icon={<FiEdit2 />}
                              variant="ghost"
                              onClick={() => openEdit(r)}
                            />
                          </Tooltip>
                          <Tooltip label="Eliminar regla" hasArrow>
                            <IconButton
                              size="xs"
                              aria-label="Eliminar regla"
                              icon={<FiTrash2 />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => confirmDelete(r.id)}
                            />
                          </Tooltip>
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

      {/* Modal edición */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar regla de descuento</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editForm ? (
              <VStack align="stretch" spacing={3}>
                <HStack spacing={3}>
                  <Box flex={1}>
                    <Text fontSize="xs" mb={1} color={muted}>
                      Tipo de regla
                    </Text>
                    <Select
                      size="sm"
                      value={editForm.tipo}
                      onChange={(e) =>
                        handleEditChange("tipo", e.target.value)
                      }
                    >
                      <option value="MISMO_PRODUCTO">
                        Mismo producto (cantidad por ítem)
                      </option>
                      <option value="VARIOS_PRODUCTOS">
                        Varios productos (cantidad de ítems distintos)
                      </option>
                    </Select>
                  </Box>
                  <Box w="120px">
                    <Text fontSize="xs" mb={1} color={muted}>
                      Versión
                    </Text>
                    <NumberInput
                      size="sm"
                      min={1}
                      value={editForm.version}
                      onChange={(_, v) => handleEditChange("version", v)}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                </HStack>

                {editForm.tipo === "MISMO_PRODUCTO" && (
                  <Box>
                    <Text fontSize="xs" mb={1} color={muted}>
                      Umbral cantidad (por producto)
                    </Text>
                    <NumberInput
                      size="sm"
                      min={1}
                      value={editForm.umbral_cantidad}
                      onChange={(_, v) =>
                        handleEditChange("umbral_cantidad", v)
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                )}

                {editForm.tipo === "VARIOS_PRODUCTOS" && (
                  <Box>
                    <Text fontSize="xs" mb={1} color={muted}>
                      Umbral ítems distintos
                    </Text>
                    <NumberInput
                      size="sm"
                      min={1}
                      value={editForm.umbral_items}
                      onChange={(_, v) =>
                        handleEditChange("umbral_items", v)
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                )}

                <Box>
                  <Text fontSize="xs" mb={1} color={muted}>
                    Porcentaje descuento (%)
                  </Text>
                  <HStack>
                    <NumberInput
                      size="sm"
                      min={1}
                      max={100}
                      value={editForm.porcentaje}
                      onChange={(_, v) =>
                        handleEditChange("porcentaje", v)
                      }
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FiPercent size={14} />
                  </HStack>
                </Box>

                <HStack spacing={4}>
                  <HStack>
                    <Switch
                      size="sm"
                      isChecked={!!editForm.activo}
                      onChange={(e) =>
                        handleEditChange("activo", e.target.checked)
                      }
                    />
                    <Text fontSize="xs" color={muted}>
                      Activa
                    </Text>
                  </HStack>
                  <HStack>
                    <Switch
                      size="sm"
                      isChecked={!!editForm.vigente}
                      onChange={(e) =>
                        handleEditChange("vigente", e.target.checked)
                      }
                    />
                    <Text fontSize="xs" color={muted}>
                      Vigente
                    </Text>
                  </HStack>
                </HStack>

                <Box>
                  <Text fontSize="xs" mb={1} color={muted}>
                    ID regla (solo lectura)
                  </Text>
                  <Input size="sm" value={editing?.id ?? ""} isReadOnly />
                </Box>
              </VStack>
            ) : (
              <Text fontSize="sm" color={muted}>
                Selecciona una regla para editar.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={editModal.onClose} variant="ghost">
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              color="black"
              leftIcon={<FiSliders />}
              onClick={saveEdit}
              isLoading={savingEdit}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dialog eliminar */}
      <AlertDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Eliminar regla
          </AlertDialogHeader>
          <AlertDialogBody>
            ¿Seguro que deseas eliminar la regla #{deleteId}? Esta acción no se
            puede deshacer.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              colorScheme="red"
              onClick={doDelete}
              ml={3}
              isLoading={deleting}
            >
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}