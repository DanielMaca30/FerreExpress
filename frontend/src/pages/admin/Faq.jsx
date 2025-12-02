// src/pages/admin/Faq.jsx
import { useEffect, useMemo, useState, useRef } from "react";
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import {
  FiHelpCircle,
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
} from "react-icons/fi";
import api from "../../utils/axiosInstance";

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-CO");
};

const roleColor = (rol) => {
  switch (rol) {
    case "CLIENTE":
      return "blue";
    case "CONTRATISTA":
      return "purple";
    case "ADMIN":
      return "red";
    case "GENERAL":
    default:
      return "gray";
  }
};

const roleLabel = (rol) => {
  switch (rol) {
    case "CLIENTE":
      return "Clientes";
    case "CONTRATISTA":
      return "Contratistas";
    case "ADMIN":
      return "Administradores";
    case "GENERAL":
    default:
      return "General (todos)";
  }
};

export default function Faq() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Crear FAQ
  const [newFaq, setNewFaq] = useState({
    pregunta: "",
    respuesta: "",
    rol_destino: "GENERAL",
  });
  const [creating, setCreating] = useState(false);
  const createModal = useDisclosure();

  // Editar FAQ
  const [editingFaq, setEditingFaq] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editModal = useDisclosure();

  // Eliminar FAQ
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef();

  // Orden
  const [ordenDrafts, setOrdenDrafts] = useState({});
  const [savingOrdenId, setSavingOrdenId] = useState(null);

  const toast = useToast();

  // Tokens visuales tipo Admin
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

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/faq");
      const list = data || [];
      setFaqs(list);

      const drafts = {};
      list.forEach((f) => {
        drafts[f.id] = f.orden ?? "";
      });
      setOrdenDrafts(drafts);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al cargar FAQ",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const faqsOrdenadas = useMemo(
    () => [...faqs],
    [faqs] // el backend ya las ordena por COALESCE(orden,9999), id
  );

  // === Crear FAQ ===
  const handleCreate = async () => {
    try {
      if (!newFaq.pregunta.trim() || !newFaq.respuesta.trim()) {
        return toast({
          title: "Campos requeridos",
          description: "Pregunta y respuesta son obligatorias.",
          status: "warning",
          duration: 2500,
        });
      }

      setCreating(true);
      await api.post("/faq", {
        pregunta: newFaq.pregunta.trim(),
        respuesta: newFaq.respuesta.trim(),
        rol_destino: newFaq.rol_destino || "GENERAL",
      });

      toast({
        title: "FAQ creada",
        description: "La pregunta frecuente se ha registrado correctamente.",
        status: "success",
        duration: 2500,
      });

      setNewFaq({
        pregunta: "",
        respuesta: "",
        rol_destino: "GENERAL",
      });
      createModal.onClose();
      fetchFaqs();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al crear FAQ",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setCreating(false);
    }
  };

  // === Editar FAQ ===
  const openEdit = (faq) => {
    setEditingFaq(faq);
    setEditForm({
      id: faq.id,
      pregunta: faq.pregunta || "",
      respuesta: faq.respuesta || "",
      rol_destino: faq.rol_destino || "GENERAL",
    });
    editModal.onOpen();
  };

  const saveEdit = async () => {
    if (!editingFaq || !editForm) return;

    try {
      if (!editForm.pregunta.trim() || !editForm.respuesta.trim()) {
        return toast({
          title: "Campos requeridos",
          description: "Pregunta y respuesta son obligatorias.",
          status: "warning",
          duration: 2500,
        });
      }

      setSavingEdit(true);
      await api.put(`/faq/${editingFaq.id}`, {
        pregunta: editForm.pregunta.trim(),
        respuesta: editForm.respuesta.trim(),
        rol_destino: editForm.rol_destino || "GENERAL",
      });

      toast({
        title: "FAQ actualizada",
        description: `La FAQ #${editingFaq.id} fue actualizada.`,
        status: "success",
        duration: 2500,
      });

      editModal.onClose();
      setEditingFaq(null);
      setEditForm(null);
      fetchFaqs();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar FAQ",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // === Eliminar FAQ ===
  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await api.delete(`/faq/${deleteId}`);

      toast({
        title: "FAQ eliminada",
        description: `La pregunta #${deleteId} fue eliminada.`,
        status: "info",
        duration: 2500,
      });

      setDeleteId(null);
      fetchFaqs();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al eliminar FAQ",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  // === Orden FAQ ===
  const saveOrden = async (id) => {
    const current = ordenDrafts[id];
    const orden = Number(current);
    if (Number.isNaN(orden)) {
      return toast({
        title: "Orden inválido",
        description: "Ingresa un número para el orden.",
        status: "warning",
        duration: 2500,
      });
    }

    try {
      setSavingOrdenId(id);
      await api.put(`/faq/${id}/orden`, { orden });

      toast({
        title: "Orden actualizado",
        description: `La posición de la FAQ #${id} fue actualizada.`,
        status: "success",
        duration: 2500,
      });

      fetchFaqs();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar orden",
        description: err?.response?.data?.error || "Revisa el backend.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setSavingOrdenId(null);
    }
  };

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 6 }}>
      {/* Header */}
      <HStack justify="space-between" align="flex-start" mb={4} flexWrap="wrap">
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={2}>
            <Heading size="lg" color={title}>
              Centro de ayuda / FAQ
            </Heading>
            <Tag size="sm" variant="subtle" colorScheme="blue">
              <TagLeftIcon as={FiHelpCircle} />
              <TagLabel>Base de conocimiento</TagLabel>
            </Tag>
          </HStack>
          <Text fontSize="sm" color={muted}>
            Gestiona las preguntas frecuentes que verán los clientes,
            contratistas y otros usuarios en el centro de ayuda.
          </Text>
        </VStack>

        <HStack spacing={2} mt={{ base: 3, md: 0 }}>
          <Tooltip label="Recargar FAQ" hasArrow>
            <IconButton
              size="sm"
              aria-label="Recargar FAQ"
              icon={<FiRefreshCw />}
              variant="ghost"
              onClick={fetchFaqs}
            />
          </Tooltip>
          <Button
            size="sm"
            leftIcon={<FiPlus />}
            colorScheme="yellow"
            color="black"
            onClick={createModal.onOpen}
          >
            Nueva pregunta
          </Button>
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
        <Text fontSize="sm" mb={3} color={muted}>
          Usa el campo <b>rol destino</b> para definir qué público verá cada
          pregunta. El orden controla la prioridad de aparición.
        </Text>

        <Divider my={3} />

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
        ) : faqsOrdenadas.length === 0 ? (
          <VStack py={6} spacing={2}>
            <Text color={muted} fontSize="sm">
              Aún no hay preguntas frecuentes configuradas.
            </Text>
            <Text color={muted} fontSize="xs">
              Crea una nueva pregunta para empezar a construir tu centro de
              ayuda.
            </Text>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Pregunta</Th>
                  <Th>Respuesta</Th>
                  <Th>Rol destino</Th>
                  <Th isNumeric>Orden</Th>
                  <Th>Feedback</Th>
                  <Th>Fechas</Th>
                  <Th textAlign="right">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {faqsOrdenadas.map((f) => {
                  const util = f.util ?? 0;
                  const noUtil = f.no_util ?? 0;
                  const ordenValue = ordenDrafts[f.id] ?? "";

                  return (
                    <Tr key={f.id}>
                      <Td>{f.id}</Td>
                      <Td maxW="260px">
                        <Tooltip label={f.pregunta} hasArrow>
                          <Text fontWeight="semibold" noOfLines={2}>
                            {f.pregunta}
                          </Text>
                        </Tooltip>
                      </Td>
                      <Td maxW="320px">
                        <Tooltip label={f.respuesta} hasArrow>
                          <Text fontSize="sm" color={muted} noOfLines={3}>
                            {f.respuesta}
                          </Text>
                        </Tooltip>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={roleColor(f.rol_destino)}
                          variant="subtle"
                        >
                          {roleLabel(f.rol_destino)}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <HStack justify="flex-end" spacing={1}>
                          <NumberInput
                            size="xs"
                            min={0}
                            value={ordenValue}
                            onChange={(_, v) =>
                              setOrdenDrafts((prev) => ({
                                ...prev,
                                [f.id]: v,
                              }))
                            }
                            w="72px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <Tooltip label="Guardar orden" hasArrow>
                            <IconButton
                              size="xs"
                              aria-label="Guardar orden"
                              icon={<FiSave />}
                              variant="ghost"
                              onClick={() => saveOrden(f.id)}
                              isLoading={savingOrdenId === f.id}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="xs" color={muted}>
                            Útil: {util} · No útil: {noUtil}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="flex-start" spacing={0}>
                          {f.created_at && (
                            <Text fontSize="xs" color={muted}>
                              Creada: {fmtDate(f.created_at)}
                            </Text>
                          )}
                          {f.updated_at && (
                            <Text fontSize="xs" color={muted}>
                              Actualizada: {fmtDate(f.updated_at)}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <HStack justify="flex-end" spacing={1}>
                          <Tooltip label="Editar FAQ" hasArrow>
                            <IconButton
                              size="xs"
                              aria-label="Editar FAQ"
                              icon={<FiEdit2 />}
                              variant="ghost"
                              onClick={() => openEdit(f)}
                            />
                          </Tooltip>
                          <Tooltip label="Eliminar FAQ" hasArrow>
                            <IconButton
                              size="xs"
                              aria-label="Eliminar FAQ"
                              icon={<FiTrash2 />}
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => confirmDelete(f.id)}
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

      {/* Modal: crear FAQ */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva pregunta frecuente</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontSize="xs" mb={1} color={muted}>
                  Pregunta
                </Text>
                <Input
                  size="sm"
                  value={newFaq.pregunta}
                  onChange={(e) =>
                    setNewFaq((prev) => ({ ...prev, pregunta: e.target.value }))
                  }
                  placeholder="Ej: ¿Cómo puedo rastrear mi pedido?"
                />
              </Box>
              <Box>
                <Text fontSize="xs" mb={1} color={muted}>
                  Respuesta
                </Text>
                <Textarea
                  size="sm"
                  value={newFaq.respuesta}
                  onChange={(e) =>
                    setNewFaq((prev) => ({
                      ...prev,
                      respuesta: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe la respuesta de forma clara y breve."
                />
              </Box>
              <Box>
                <Text fontSize="xs" mb={1} color={muted}>
                  Rol destino
                </Text>
                <select
                  value={newFaq.rol_destino}
                  onChange={(e) =>
                    setNewFaq((prev) => ({
                      ...prev,
                      rol_destino: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: "inherit",
                    background: "transparent",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="GENERAL">General (todos)</option>
                  <option value="CLIENTE">Clientes</option>
                  <option value="CONTRATISTA">Contratistas</option>
                </select>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={createModal.onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              color="black"
              leftIcon={<FiPlus />}
              onClick={handleCreate}
              isLoading={creating}
            >
              Crear FAQ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: editar FAQ */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar pregunta frecuente</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editForm ? (
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" mb={1} color={muted}>
                    Pregunta
                  </Text>
                  <Input
                    size="sm"
                    value={editForm.pregunta}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        pregunta: e.target.value,
                      }))
                    }
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" mb={1} color={muted}>
                    Respuesta
                  </Text>
                  <Textarea
                    size="sm"
                    value={editForm.respuesta}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        respuesta: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" mb={1} color={muted}>
                    Rol destino
                  </Text>
                  <select
                    value={editForm.rol_destino}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        rol_destino: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid",
                      borderColor: "inherit",
                      background: "transparent",
                      fontSize: "0.875rem",
                    }}
                  >
                    <option value="GENERAL">General (todos)</option>
                    <option value="CLIENTE">Clientes</option>
                    <option value="CONTRATISTA">Contratistas</option>
                  </select>
                </Box>
              </VStack>
            ) : (
              <Text fontSize="sm" color={muted}>
                Selecciona una FAQ de la tabla para editarla.
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editModal.onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              color="black"
              leftIcon={<FiSave />}
              onClick={saveEdit}
              isLoading={savingEdit}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AlertDialog: eliminar */}
      <AlertDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Eliminar FAQ
          </AlertDialogHeader>
          <AlertDialogBody>
            ¿Seguro que deseas eliminar la pregunta #{deleteId}? Esta acción no
            se puede deshacer.
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