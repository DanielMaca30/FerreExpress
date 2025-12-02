import { useState, useMemo } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, FormControl, FormLabel, Input, Alert, AlertIcon, Text
} from "@chakra-ui/react";
import api from "../../utils/axiosInstance";

export default function ForgotPasswordModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!isValidEmail) {
      setMsg({ type: "error", text: "Ingresa un correo válido." });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMsg({ type: "success", text: res.data.message || "Código enviado a tu correo." });
      // Espera breve para que el usuario vea el mensaje y luego encadena
      setTimeout(() => {
        onClose?.();
        onSuccess?.(); // → abrir Verify
      }, 600);
    } catch (error) {
      setMsg({ type: "error", text: error.response?.data?.error || "Error al solicitar código." });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setMsg(null);
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Recuperar contraseña</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={3} fontSize="sm" color="gray.600">
            Ingresa tu correo y te enviaremos un código de recuperación.
          </Text>

          {msg && (
            <Alert status={msg.type} mb={3}>
              <AlertIcon />
              {msg.text}
            </Alert>
          )}

          <FormControl isRequired>
            <FormLabel>Correo electrónico</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              isInvalid={!!email && !isValidEmail}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button colorScheme="blue" type="submit" isLoading={loading} isDisabled={!email}>
            Enviar código
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}