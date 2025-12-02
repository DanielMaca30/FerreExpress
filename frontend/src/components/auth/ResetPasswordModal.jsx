import { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, FormControl, FormLabel, Input, Alert, AlertIcon, Text, Progress, HStack
} from "@chakra-ui/react";
import api from "../../utils/axiosInstance";

export default function ResetPasswordModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // mini métrica fuerza
  const score = Math.min(
    100,
    (password.length >= 6 ? 40 : 0) +
      (/[A-Z]/.test(password) ? 15 : 0) +
      (/[a-z]/.test(password) ? 15 : 0) +
      (/\d/.test(password) ? 15 : 0) +
      (/[^A-Za-z0-9]/.test(password) ? 15 : 0)
  );
  const scheme = score < 40 ? "red" : score < 65 ? "yellow" : "green";

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (password !== confirm) {
      setMsg({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    if (password.length < 6) {
      setMsg({ type: "error", text: "La contraseña debe tener mínimo 6 caracteres" });
      return;
    }

    const token = localStorage.getItem("tempResetToken");
    if (!token) {
      setMsg({ type: "error", text: "Token temporal no encontrado, repite el proceso" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/auth/reset-password", { password }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg({ type: "success", text: res.data.message || "Contraseña actualizada" });
      localStorage.removeItem("tempResetToken");
      setTimeout(() => {
        onClose?.();
        onSuccess?.(); // opcional: toast en Login
      }, 700);
    } catch (error) {
      setMsg({ type: "error", text: error.response?.data?.error || "Error al cambiar contraseña" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setConfirm("");
    setMsg(null);
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent as="form" onSubmit={handleReset}>
        <ModalHeader>Restablecer contraseña</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={3} fontSize="sm" color="gray.600">
            Crea tu nueva contraseña.
          </Text>

          {msg && (
            <Alert status={msg.type} mb={3}>
              <AlertIcon />
              {msg.text}
            </Alert>
          )}

          <FormControl isRequired mb={2}>
            <FormLabel>Nueva contraseña</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <HStack mt={2}>
              <Progress value={score} colorScheme={scheme} height="8px" flex="1" rounded="md" />
              <Text fontSize="xs" color={`${scheme}.600`} minW="70px" textAlign="right">
                {scheme === "red" ? "Débil" : scheme === "yellow" ? "Aceptable" : "Fuerte"}
              </Text>
            </HStack>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Confirmar contraseña</FormLabel>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          </FormControl>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button colorScheme="blue" type="submit" isLoading={loading}>
            Actualizar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}