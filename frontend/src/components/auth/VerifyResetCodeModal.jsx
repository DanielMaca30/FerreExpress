import { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, FormControl, FormLabel, Input, Alert, AlertIcon, Text
} from "@chakra-ui/react";
import api from "../../utils/axiosInstance";

export default function VerifyResetCodeModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!code.trim()) {
      setMsg({ type: "error", text: "Ingresa el código que recibiste." });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-reset", { codigo: code.trim() });
      localStorage.setItem("tempResetToken", res.data.token);
      setMsg({ type: "success", text: "Código verificado." });
      setTimeout(() => {
        onClose?.();
        onSuccess?.(); // → abrir Reset
      }, 500);
    } catch (error) {
      setMsg({ type: "error", text: error.response?.data?.error || "Código incorrecto" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setMsg(null);
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.400" />
      <ModalContent as="form" onSubmit={handleVerify}>
        <ModalHeader>Verificar código</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={3} fontSize="sm" color="gray.600">
            Introduce el código de 6 dígitos que recibiste.
          </Text>
          {msg && (
            <Alert status={msg.type} mb={3}>
              <AlertIcon />
              {msg.text}
            </Alert>
          )}
          <FormControl isRequired>
            <FormLabel>Código</FormLabel>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              pattern="\d*"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button colorScheme="blue" type="submit" isLoading={loading} isDisabled={!code}>
            Verificar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}