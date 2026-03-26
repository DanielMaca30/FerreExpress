// src/pages/auth/Login.jsx
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
  ModalBody,
  usePrefersReducedMotion,
  useColorModeValue,
  Checkbox,
  FormErrorMessage,
  FormHelperText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Progress,
  Spacer,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, InfoIcon } from "@chakra-ui/icons";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useDisclosure } from "@chakra-ui/react";

import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";
import VerifyResetCodeModal from "../../components/auth/VerifyResetCodeModal";
import ResetPasswordModal from "../../components/auth/ResetPasswordModal";

import { API_BASE_URL } from "../../utils/axiosInstance";

const MotionBox = motion(Box);

const LS_LAST_EMAIL = "fe_last_email"; // ✅ recordar SOLO email (seguro)
const LS_REMEMBER_PREF = "fe_remember_session_pref"; // ✅ recordar preferencia del checkbox

export default function Login() {
  const { login, setUserFromToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();

  // 🎨 Colores
  const bgColor = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtleText = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  // Campos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // ✅ “Mantener sesión” (NO guarda contraseña; solo mejora experiencia con token)
  const [rememberMe, setRememberMe] = useState(true);

  // Estados UI
  const [formError, setFormError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Feedback “Nielsen”: estado del sistema + éxito
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("Bienvenido");
  const [redirectTo, setRedirectTo] = useState("/");

  // Heurística: prevención de errores (caps lock)
  const [capsOn, setCapsOn] = useState(false);

  // Refs para enfoque
  const emailRef = useRef(null);
  const passRef = useRef(null);

  // Modales encadenados
  const forgot = useDisclosure();
  const verify = useDisclosure();
  const reset = useDisclosure();

  // ✅ Validación email
  const isValidEmail = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  // ✅ Estado “puedo enviar”
  const canSubmit = useMemo(() => {
    return isValidEmail && password.trim().length > 0 && !isLoading;
  }, [isValidEmail, password, isLoading]);

  // ✅ Mensaje útil si viene de una ruta protegida (visibilidad del estado + contexto)
  const cameFromProtected = Boolean(location.state?.from?.pathname);

  // ✅ Hidratar preferencia + email recordado (sin contraseña)
  useEffect(() => {
    try {
      const pref = localStorage.getItem(LS_REMEMBER_PREF);
      if (pref === "0") setRememberMe(false);
      if (pref === "1") setRememberMe(true);
    } catch { }

    try {
      const last = localStorage.getItem(LS_LAST_EMAIL);
      if (last) setEmail(last);
    } catch { }

    // autofocus (control del usuario)
    setTimeout(() => {
      if (emailRef.current) emailRef.current.focus();
    }, 50);
  }, []);

  // ✅ Guardar preferencia del checkbox (no sensible)
  useEffect(() => {
    try {
      localStorage.setItem(LS_REMEMBER_PREF, rememberMe ? "1" : "0");
    } catch { }
  }, [rememberMe]);

  // ✅ Captura token de Google (?token=...) y persiste sesión
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) return;

    const hydrated = setUserFromToken(token);
    const role = hydrated?.role;

    const from =
      location.state?.from?.pathname ||
      (role === "CLIENTE"
        ? "/cliente"
        : role === "CONTRATISTA"
          ? "/empresa"
          : role === "ADMIN"
            ? "/admin"
            : "/");

    // limpia query param
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());

    navigate(from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Validaciones “bonitas” (Heurística: prevenir + mensajes claros) =====
  const validateEmail = (value) => {
    const v = (value || "").trim();
    if (!v) return "Ingresa tu correo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de correo no válido.";
    return "";
  };

  const validatePassword = (value) => {
    const v = (value || "").trim();
    if (!v) return "Ingresa tu contraseña.";
    if (v.length < 6) return "Revisa tu contraseña (mínimo 6 caracteres).";
    return "";
  };

  const focusFirstInvalid = () => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    if (eErr) return emailRef.current?.focus();
    if (pErr) return passRef.current?.focus();
  };

  const handleEmailBlur = () => setEmailError(validateEmail(email));
  const handlePassBlur = () => setPassError(validatePassword(password));

  // ✅ CapsLock detector (ayuda para recuperar de errores)
  const handlePassKey = (e) => {
    const on = e.getModifierState && e.getModifierState("CapsLock");
    setCapsOn(Boolean(on));
  };

  // ===== Submit (ENTER automático por form) =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPassError(pErr);
    setFormError("");

    if (eErr || pErr) {
      setFormError("Revisa los campos marcados para continuar.");
      focusFirstInvalid();
      return;
    }

    try {
      setIsLoading(true);

      // ✅ extra arg no rompe si tu login solo acepta (email, pass)
      // si luego decides usar rememberMe en AuthContext, ya está listo.
      const res = await login(email.trim(), password, { rememberMe });

      if (res?.success) {
        // ✅ recordar email (no contraseña)
        try {
          localStorage.setItem(LS_LAST_EMAIL, email.trim());
        } catch { }

        const role = res?.user?.role;

        const roleMsg =
          role === "CLIENTE"
            ? "Bienvenido, Cliente"
            : role === "CONTRATISTA"
              ? "Bienvenido, Empresa"
              : role === "ADMIN"
                ? "Bienvenido, Admin"
                : "Bienvenido";

        const from =
          location.state?.from?.pathname ||
          (role === "CLIENTE"
            ? "/cliente"
            : role === "CONTRATISTA"
              ? "/empresa"
              : role === "ADMIN"
                ? "/admin"
                : "/");

        setSuccessMsg(roleMsg);
        setRedirectTo(from);
        setSuccessOpen(true);

        // Visibilidad del estado: redirección con delay corto
        const delay = prefersReducedMotion ? 250 : 900;
        setTimeout(() => {
          navigate(from, { replace: true });
        }, delay);
      } else {
        const msg = res?.message || "Credenciales inválidas. Verifica tu correo y contraseña.";
        setFormError(msg);

        // Heurística: ayudar a diagnosticar
        toast({
          status: "error",
          title: "No pudimos iniciar sesión",
          description: msg,
          isClosable: true,
        });

        focusFirstInvalid();
      }
    } catch (err) {
      setFormError("Error de conexión. Intenta nuevamente en unos segundos.");
      toast({
        status: "error",
        title: "Error de red",
        description: "No pudimos conectar con el servidor. Reintenta.",
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Encadenar modales correctamente =====
  const openVerifyFromForgot = () => {
    forgot.onClose();
    verify.onOpen();
  };
  const openResetFromVerify = () => {
    verify.onClose();
    reset.onOpen();
  };
  const onResetSuccess = () => {
    reset.onClose();
    toast({
      status: "success",
      title: "Contraseña actualizada",
      description: "Ya puedes iniciar sesión.",
      isClosable: true,
    });
    // UX: vuelve a enfocar email
    setTimeout(() => emailRef.current?.focus(), 50);
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

  // ✅ Responsive “full-bleed” en móvil: sin sombra, sin bordes, sin esquinas redondeadas.
  const cardRadius = { base: "none", sm: "2xl" };
  const cardShadow = { base: "none", sm: "lg" };
  const cardBorderW = { base: "0", sm: "1px" };

  return (
    <>
      <Flex
        direction="column"
        align="center"
        justify={{ base: "flex-start", md: "center" }}
        minH="100vh"
        bg={bgColor}
        pt={{ base: 0, sm: 10 }}
        pb={{ base: 0, sm: 20 }}
      >
        <VStack
          spacing={6}
          w="full"
          maxW={{ base: "100%", sm: "420px", md: "480px" }}
          px={{ base: 0, sm: 4 }}
        >
          <Box
            bg={cardBg}
            color={textColor}
            p={{ base: 6, md: 8 }}
            rounded={cardRadius}
            shadow={cardShadow}
            w="full"
            border="1px solid"
            borderColor={borderColor}
            borderWidth={cardBorderW}
            minH={{ base: "100vh", sm: "auto" }}
            display="flex"
            flexDirection="column"
            justifyContent={{ base: "flex-start", sm: "initial" }}
          >
            <VStack spacing={2} align="center" mb={4} pt={{ base: 4, sm: 0 }}>
              <Heading size="lg">Iniciar sesión</Heading>
              <Text fontSize="sm" color={subtleText} textAlign="center">
                Accede como cliente o empresa registrada de FerreExpress.
              </Text>
            </VStack>

            {/* ✅ Feedback contextual (Nielsen: visibilidad del estado del sistema) */}
            {cameFromProtected && (
              <Alert status="info" variant="left-accent" borderRadius="lg" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Necesitas iniciar sesión</AlertTitle>
                  <AlertDescription fontSize="sm">
                    Para continuar, valida tu acceso y te redirigimos automáticamente.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* ✅ Error de formulario (Nielsen: reconocer/diagnosticar/recuperar) */}
            {formError && (
              <Alert status="error" variant="subtle" borderRadius="lg" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">No pudimos continuar</AlertTitle>
                  <AlertDescription fontSize="sm">{formError}</AlertDescription>
                </Box>
              </Alert>
            )}

            {/* ✅ Estado visible al enviar */}
            {isLoading && (
              <Box mb={4}>
                <Progress size="xs" isIndeterminate borderRadius="full" />
                <Text mt={2} fontSize="xs" color={subtleText}>
                  Validando credenciales…
                </Text>
              </Box>
            )}

            {/* ✅ Form real (ENTER automático + estándares de navegador) */}
            <Box as="form" onSubmit={handleSubmit} autoComplete="on">
              <VStack spacing={4}>
                <FormControl isInvalid={!!emailError}>
                  <HStack justify="space-between" mb={1}>
                    <FormLabel mb={0}>Correo</FormLabel>
                    <Tooltip
                      label="Tip: usa un correo válido (ej. nombre@dominio.com)"
                      hasArrow
                      placement="top"
                    >
                      <InfoIcon color={subtleText} />
                    </Tooltip>
                  </HStack>

                  <Input
                    ref={emailRef}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                      if (formError) setFormError("");
                    }}
                    onBlur={handleEmailBlur}
                    focusBorderColor="#f7b500"
                    autoComplete="username"
                    h={{ base: "44px", sm: "48px" }}
                    rounded="lg"
                  />
                  {!emailError ? (
                    <FormHelperText color={subtleText}>
                      Puedes presionar <b>Enter</b> para continuar.
                    </FormHelperText>
                  ) : (
                    <FormErrorMessage>{emailError}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!passError}>
                  <HStack justify="space-between" mb={1}>
                    <FormLabel mb={0}>Contraseña</FormLabel>
                    {capsOn && (
                      <Text fontSize="xs" color="orange.400" fontWeight="semibold">
                        Caps Lock activado
                      </Text>
                    )}
                  </HStack>

                  <HStack>
                    <Input
                      ref={passRef}
                      id="password"
                      name="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passError) setPassError("");
                        if (formError) setFormError("");
                      }}
                      onBlur={handlePassBlur}
                      onKeyDown={handlePassKey}
                      onKeyUp={handlePassKey}
                      focusBorderColor="#f7b500"
                      autoComplete="current-password"
                      h={{ base: "44px", sm: "48px" }}
                      rounded="lg"
                    />

                    <Tooltip label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"} hasArrow placement="top">
                      <IconButton
                        type="button"
                        aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                        icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPass((s) => !s)}
                        variant="ghost"
                      />
                    </Tooltip>
                  </HStack>

                  {passError ? (
                    <FormErrorMessage>{passError}</FormErrorMessage>
                  ) : (
                    <FormHelperText color={subtleText}>
                      Asegúrate de escribirla exactamente como la guardaste.
                    </FormHelperText>
                  )}
                </FormControl>

                {/* ✅ Control y libertad (recordar sesión) + recuperación (olvidé clave) */}
                <HStack w="full" align="center" pt={1}>
                  <Checkbox
                    isChecked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    colorScheme="yellow"
                  >
                    <HStack spacing={1} align="center">
                      <Text fontSize="sm">Mantener sesión iniciada</Text>
                      <Tooltip
                        label="Mantiene tu sesión activa en este dispositivo. Recomendado solo en equipos personales."
                        hasArrow
                        placement="top"
                        closeOnClick
                        closeDelay={0}
                      >
                        <InfoIcon
                          boxSize={3}
                          color={subtleText}
                          cursor="help"
                          flexShrink={0}
                        />
                      </Tooltip>
                    </HStack>
                  </Checkbox>

                  <Spacer />

                  <CLink as="button" type="button" fontSize="sm" color="blue.400" onClick={forgot.onOpen}>
                    ¿Olvidaste tu contraseña?
                  </CLink>
                </HStack>

                <Button
                  type="submit"
                  color="black"
                  bg="#f7b500"
                  _hover={{ bg: "#e0a800" }}
                  w="full"
                  isLoading={isLoading}
                  loadingText="Validando…"
                  isDisabled={!canSubmit}
                  h={{ base: "44px", sm: "48px" }}
                  rounded="lg"
                >
                  Continuar
                </Button>
              </VStack>
            </Box>

            <VStack spacing={4} mt={5}>
              <Button
                type="button"
                onClick={() => (window.location.href = `${API_BASE_URL}/api/v1/auth/google`)}
                w="full"
                bg="white"
                color="gray.900"
                border="1px solid"
                borderColor="gray.300"
                leftIcon={<FcGoogle size={20} />}
                _hover={{ bg: "white", borderColor: "gray.400", boxShadow: "md" }}
                h={{ base: "44px", sm: "48px" }}
                rounded="lg"
              >
                Continuar con Google
              </Button>

              <Divider />

              <Text fontSize="sm" textAlign="center" color={subtleText}>
                ¿Aún no tienes cuenta?{" "}
                <CLink as={RouterLink} to="/register/cliente" color="blue.400" textDecoration="underline">
                  Regístrate
                </CLink>
              </Text>

              <Text fontSize="sm" textAlign="center" color={subtleText}>
                ¿Eres empresa?{" "}
                <CLink as={RouterLink} to="/register/empresa" color="blue.400" textDecoration="underline">
                  Regístrate aquí
                </CLink>
              </Text>
            </VStack>
          </Box>

          {/* Microcopy útil (Nielsen: ayuda/documentación ligera) */}
          <Text
            fontSize="xs"
            color={subtleText}
            textAlign="center"
            maxW="460px"
            px={{ base: 4, sm: 0 }}
            pb={{ base: 6, sm: 0 }}
          >
            Si este es un equipo compartido, desactiva <b>“Mantener sesión iniciada”</b>.
          </Text>
        </VStack>
      </Flex>

      {/* ===== Modales ===== */}
      <ForgotPasswordModal isOpen={forgot.isOpen} onClose={forgot.onClose} onSuccess={openVerifyFromForgot} />
      <VerifyResetCodeModal isOpen={verify.isOpen} onClose={verify.onClose} onSuccess={openResetFromVerify} />
      <ResetPasswordModal isOpen={reset.isOpen} onClose={reset.onClose} onSuccess={onResetSuccess} />

      {/* ===== Modal Éxito (estado del sistema visible + opción de control) ===== */}
      <Modal isOpen={successOpen} onClose={() => setSuccessOpen(false)} isCentered closeOnOverlayClick={false}>
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent bg={cardBg} borderRadius="2xl" boxShadow="2xl" overflow="hidden">
          <ModalBody p={8} textAlign="center">
            <Box
              as={motion.div}
              w="88px"
              h="88px"
              borderRadius="full"
              bg="green.500"
              display="grid"
              placeItems="center"
              mx="auto"
              mb={4}
              {...pulseProps}
            >
              <motion.svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <motion.path d="M20 6L9 17l-5-5" />
              </motion.svg>
            </Box>

            <Heading size="md" mb={1}>
              {successMsg}
            </Heading>
            <Text fontSize="sm" color={subtleText} mb={5}>
              Autenticación correcta. Redirigiendo…
            </Text>

            <HStack justify="center" spacing={3}>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccessOpen(false);
                  navigate(redirectTo, { replace: true });
                }}
              >
                Ir ahora
              </Button>
              <Button
                bg="#f7b500"
                color="black"
                _hover={{ bg: "#e0a800" }}
                onClick={() => {
                  setSuccessOpen(false);
                  navigate(redirectTo, { replace: true });
                }}
              >
                Continuar
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}