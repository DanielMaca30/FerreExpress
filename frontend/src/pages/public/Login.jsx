import { FcGoogle } from "react-icons/fc";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Input,
  FormControl,
  FormLabel,
  Text,
  Heading,
  VStack,
  HStack,
  Link as CLink,
  Divider,
  Flex,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  usePrefersReducedMotion,
  useColorModeValue,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useDisclosure } from "@chakra-ui/react";

import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";
import VerifyResetCodeModal from "../../components/auth/VerifyResetCodeModal";
import ResetPasswordModal from "../../components/auth/ResetPasswordModal";

import { API_BASE_URL } from "../../utils/axiosInstance"; // ajusta ruta

export default function Login() {
  const { login, setUserFromToken } = useAuth(); // ← incluye setUserFromToken
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();

  // 🎨 Fondo y colores
  const bgColor = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");

  // Campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Estado UI
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Bienvenido");

  const emailRef = useRef(null);
  const passRef = useRef(null);

  const isValidEmail = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  // Captura token de Google (?token=...) y persiste sesión
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    const hydrated = setUserFromToken(token);
    const role = hydrated?.role;

    // destino respetando "from"
    const from =
      location.state?.from?.pathname ||
      (role === "CLIENTE"
        ? "/cliente"
        : role === "CONTRATISTA"
          ? "/empresa"
          : role === "ADMIN"
            ? "/admin"
            : "/");

    // limpia el query param visualmente
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());

    navigate(from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailBlur = () => {
    if (!email) setEmailError("Ingresa tu correo.");
    else if (!isValidEmail) setEmailError("Formato de correo no válido.");
    else setEmailError("");
  };

  const focusFirstInvalid = () => {
    if (!email || !isValidEmail) return emailRef.current?.focus();
    if (!password) return passRef.current?.focus();
  };

  const handleLogin = async () => {
    if (!email || !isValidEmail || !password) {
      if (!email) setEmailError("Ingresa tu correo.");
      else if (!isValidEmail) setEmailError("Revisa el formato del correo.");
      if (!password) setError("Ingresa tu contraseña.");
      focusFirstInvalid();
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      const res = await login(email, password);

      if (res.success) {
        const { role } = res.user;
        const roleMsg =
          role === "CLIENTE"
            ? "Bienvenido, Cliente"
            : role === "CONTRATISTA"
              ? "Bienvenido, Empresa"
              : role === "ADMIN"
                ? "Bienvenido, Admin"
                : "Bienvenido";

        setSuccessMsg(roleMsg);
        setSuccessOpen(true);

        // si venías de una ruta protegida, vuelve allá
        const from =
          location.state?.from?.pathname ||
          (role === "CLIENTE"
            ? "/cliente"
            : role === "CONTRATISTA"
              ? "/empresa"
              : role === "ADMIN"
                ? "/admin"
                : "/");

        const delay = prefersReducedMotion ? 400 : 1600;
        setTimeout(() => {
          navigate(from, { replace: true });
        }, delay);
      } else {
        setError(res.message || "Credenciales inválidas");
        toast({
          status: "error",
          title: "No pudimos iniciar sesión",
          description: res.message || "Revisa tu correo y contraseña",
          isClosable: true,
        });
        focusFirstInvalid();
      }
    } catch {
      setError("Error de red. Intenta de nuevo.");
      toast({
        status: "error",
        title: "Error de conexión",
        description: "Intenta nuevamente en unos segundos.",
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modales encadenados
  const forgot = useDisclosure();
  const verify = useDisclosure();
  const reset = useDisclosure();

  const openVerifyFromForgot = () => verify.onOpen();
  const openResetFromVerify = () => reset.onOpen();
  const onResetSuccess = () => {
    toast({
      status: "success",
      title: "Contraseña actualizada",
      description: "Ya puedes iniciar sesión.",
    });
  };

  const pulseProps = prefersReducedMotion
    ? {}
    : {
      initial: { boxShadow: "0 0 0 0 rgba(72,187,120,0.0)" },
      animate: {
        boxShadow: [
          "0 0 0 0 rgba(72,187,120,0.0)",
          "0 0 0 12px rgba(72,187,120,0.12)",
          "0 0 0 0 rgba(72,187,120,0.0)",
        ],
      },
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
    };

  return (
    <>
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="80vh"
        bg={bgColor}
        pt={10}
        pb={20}
      >
        <VStack
          spacing={6}
          w="full"
          maxW={{ base: "90%", sm: "400px", md: "480px" }}
        >
          <Box
            bg={cardBg}
            color={textColor}
            p={{ base: 6, md: 8 }}
            rounded="xl"
            shadow="lg"
            w="full"
          >
            <VStack spacing={3} align="center" mb={4}>
              <Heading size="lg">Iniciar sesión</Heading>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Inicia sesión como cliente o empresa registrada de FerreExpress.
              </Text>
            </VStack>

            {error && (
              <Text color="red.400" mb={2}>
                {error}
              </Text>
            )}

            <VStack spacing={4}>
              <FormControl isInvalid={!!emailError}>
                <FormLabel>Email</FormLabel>
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  focusBorderColor="#f7b500"
                />
                {emailError && (
                  <Text mt={1} fontSize="sm" color="red.400">
                    {emailError}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Contraseña</FormLabel>
                <HStack>
                  <Input
                    id="password"
                    ref={passRef}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    focusBorderColor="#f7b500"
                  />
                  <IconButton
                    aria-label={
                      showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowPass(!showPass)}
                    variant="ghost"
                  />
                </HStack>
              </FormControl>

              <CLink
                as="button"
                type="button"
                fontSize="sm"
                color="blue.400"
                alignSelf="flex-end"
                onClick={forgot.onOpen}
              >
                ¿Olvidaste tu contraseña?
              </CLink>

              <Button
                color="black"
                bg="#f7b500"
                _hover={{ bg: "#e0a800" }}
                w="full"
                onClick={handleLogin}
                isLoading={isLoading}
                loadingText="Validando…"
              >
                Continuar
              </Button>

              <Button
                onClick={() => (window.location.href = `${API_BASE_URL}/api/v1/auth/google`)}
                w="full"
                bg="white"
                color="gray.900"
                border="1px solid"
                borderColor="gray.300"
                leftIcon={<FcGoogle size={20} />}
                _hover={{
                  bg: "white",
                  borderColor: "gray.400",
                  boxShadow: "md",
                }}
              >
                Continuar con Google
              </Button>

              <Divider />
              <Text fontSize="sm" textAlign="center">
                ¿Aún no tienes cuenta?{" "}
                <CLink
                  as={RouterLink}
                  to="/register/cliente"
                  color="blue.400"
                  textDecoration="underline"
                >
                  Regístrate
                </CLink>
              </Text>
              <Text fontSize="sm" textAlign="center">
                ¿Eres empresa?{" "}
                <CLink
                  as={RouterLink}
                  to="/register/empresa"
                  color="blue.400"
                  textDecoration="underline"
                >
                  Regístrate aquí
                </CLink>
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Flex>

      {/* Modales */}
      <ForgotPasswordModal
        isOpen={forgot.isOpen}
        onClose={forgot.onClose}
        onSuccess={openVerifyFromForgot}
      />
      <VerifyResetCodeModal
        isOpen={verify.isOpen}
        onClose={verify.onClose}
        onSuccess={openResetFromVerify}
      />
      <ResetPasswordModal
        isOpen={reset.isOpen}
        onClose={reset.onClose}
        onSuccess={onResetSuccess}
      />

      {/* Modal Éxito */}
      <Modal isOpen={successOpen} onClose={() => { }} isCentered>
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent
          bg={cardBg}
          p={8}
          borderRadius="2xl"
          textAlign="center"
          alignItems="center"
          boxShadow="2xl"
        >
          <Box
            as={motion.div}
            w="88px"
            h="88px"
            borderRadius="full"
            bg="green.500"
            display="grid"
            placeItems="center"
            mb={4}
            {...pulseProps}
          >
            <motion.svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
            >
              <motion.path d="M20 6L9 17l-5-5" />
            </motion.svg>
          </Box>
          <Heading size="md" mb={1}>
            {successMsg}
          </Heading>
          <Text fontSize="sm" color="gray.400">
            Autenticación correcta. Redirigiendo…
          </Text>
        </ModalContent>
      </Modal>
    </>
  );
}
