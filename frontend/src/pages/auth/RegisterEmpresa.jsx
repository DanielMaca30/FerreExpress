import { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  IconButton,
  InputGroup,
  InputRightElement,
  Link,
  Divider,
  useToast,
  Progress,
  List,
  ListItem,
  ListIcon,
  Flex,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  usePrefersReducedMotion,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  FormHelperText,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";

export default function RegisterEmpresa() {
  // 🎨 Esquema visual (igual al Login/Registro Cliente) + dark correcto con #
  const bgColor = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subtleText = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const listText = useColorModeValue("gray.700", "gray.200");
  const prefersReducedMotion = usePrefersReducedMotion();

  const toast = useToast();
  const navigate = useNavigate();

  // Campos
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nit: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  // Errores
  const [emailError, setEmailError] = useState("");
  const [nitError, setNitError] = useState("");
  const [passError, setPassError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [globalError, setGlobalError] = useState("");

  // Visibilidad
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Éxito
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("¡Empresa registrada!");

  // Refs
  const emailRef = useRef(null);
  const nitRef = useRef(null);
  const passRef = useRef(null);
  const confirmRef = useRef(null);

  const isValidEmail = useMemo(() => {
    if (!formData.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  }, [formData.email]);

  // NIT: dígitos con opcional guion y dígito verificador (flexible)
  const isValidNIT = useMemo(() => {
    if (!formData.nit) return false;
    const nit = formData.nit.trim();
    // Acepta "900123456-7" o "9001234567" (mín 5)
    return /^(\d{5,}-?\d?)$/.test(nit);
  }, [formData.nit]);

  const handleChange = (e) => {
    setGlobalError("");
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (name === "email") setEmailError("");
    if (name === "nit") setNitError("");
    if (name === "password") setPassError("");
    if (name === "confirm") setConfirmError("");
  };

  // Fortaleza de contraseña
  const requirements = useMemo(() => {
    const p = formData.password || "";
    return {
      length: p.length >= 6,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /\d/.test(p),
      symbol: /[^A-Za-z0-9]/.test(p),
      notEmail: p && formData.email && !p.includes(formData.email.split("@")[0]),
      notUsername: p && formData.username && !p.toLowerCase().includes(formData.username.toLowerCase()),
      notNit: p && formData.nit && !p.includes(formData.nit.replace("-", "")),
    };
  }, [formData.password, formData.email, formData.username, formData.nit]);

  const { score, label, colorScheme } = useMemo(() => {
    let s = 0;
    if (requirements.length) s += 20;
    if (requirements.upper) s += 16;
    if (requirements.lower) s += 16;
    if (requirements.number) s += 16;
    if (requirements.symbol) s += 16;
    if (requirements.notEmail) s += 8;
    if (requirements.notUsername) s += 4;
    if (requirements.notNit) s += 4;

    let lbl = "Débil";
    let color = "red";
    if (s >= 35 && s < 60) {
      lbl = "Aceptable";
      color = "orange";
    }
    if (s >= 60 && s < 85) {
      lbl = "Buena";
      color = "yellow";
    }
    if (s >= 85) {
      lbl = "Fuerte";
      color = "green";
    }
    return { score: s, label: lbl, colorScheme: color };
  }, [requirements]);

  const validate = () => {
    let ok = true;

    if (!formData.username.trim()) ok = false;

    if (!formData.email) {
      setEmailError("Ingresa tu correo.");
      ok = false;
    } else if (!isValidEmail) {
      setEmailError("Revisa el formato del correo (ej: nombre@dominio.com).");
      ok = false;
    }

    if (!formData.nit) {
      setNitError("Ingresa el NIT.");
      ok = false;
    } else if (!isValidNIT) {
      setNitError("Formato de NIT no válido. Usa solo números, ej: 900123456-7.");
      ok = false;
    }

    if (!formData.password) {
      setPassError("Ingresa una contraseña.");
      ok = false;
    } else if (!requirements.length) {
      setPassError("La contraseña debe tener al menos 6 caracteres.");
      ok = false;
    } else if (!(requirements.upper && requirements.lower && requirements.number && requirements.symbol)) {
      setPassError("Usa mayúscula, minúscula, número y símbolo.");
      ok = false;
    } else if (!(requirements.notEmail && requirements.notUsername && requirements.notNit)) {
      setPassError("Evita usar correo, nombre de empresa o NIT en la contraseña.");
      ok = false;
    }

    if (!formData.confirm) {
      setConfirmError("Confirma tu contraseña.");
      ok = false;
    } else if (formData.confirm !== formData.password) {
      setConfirmError("Las contraseñas no coinciden.");
      ok = false;
    }

    if (!ok) {
      setTimeout(() => {
        if (emailError || !formData.email || !isValidEmail) emailRef.current?.focus();
        else if (nitError || !formData.nit || !isValidNIT) nitRef.current?.focus();
        else if (passError || !formData.password) passRef.current?.focus();
        else if (confirmError || !formData.confirm) confirmRef.current?.focus();
      }, 0);
    }
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    setEmailError("");
    setNitError("");
    setPassError("");
    setConfirmError("");

    if (!validate()) return;

    try {
      setLoading(true);
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        nit: formData.nit.replace(/-/g, "").trim(), // normalizamos (sin guion)
        password: formData.password,
      };

      const res = await api.post("/auth/register/empresa", payload);

      toast({
        title: "Registro exitoso",
        description: `Empresa ${res.data?.username ?? payload.username} registrada correctamente`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setSuccessMsg("¡Empresa registrada!");
      setSuccessOpen(true);

      const delay = prefersReducedMotion ? 500 : 1400;
      setTimeout(() => navigate("/login"), delay);
    } catch (error) {
      const msg = error?.response?.data?.error || "Error del servidor";
      setGlobalError(msg);
      toast({
        title: "Error al registrarse",
        description: msg,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
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

  // ✅ Responsive “full-bleed” en móvil
  const cardRadius = { base: "none", sm: "2xl" };
  const cardShadow = { base: "none", sm: "lg" };
  const cardBorderW = { base: "0", sm: "1px" };

  // ====== Layout: fondo + card (mismo patrón que Login) ======
  return (
    <Flex
      direction="column"
      minH="100vh"
      bg={bgColor}
      align="center"
      justify={{ base: "flex-start", md: "center" }}
      pt={{ base: 0, sm: 8 }}
      pb={{ base: 0, sm: 10 }}
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
          border="1px solid"
          borderColor={borderColor}
          borderWidth={cardBorderW}
          w="full"
          minH={{ base: "100vh", sm: "auto" }}
          pt={{ base: 10, sm: 6 }}
        >
          <VStack spacing={2} align="center" mb={4}>
            <Heading size="lg">Registro de empresa</Heading>
            <Text fontSize="sm" color={subtleText} textAlign="center">
              Registra tu empresa para acceder a cotizaciones, descuentos y pedidos.
            </Text>
          </VStack>

          {globalError && (
            <Alert status="error" variant="subtle" borderRadius="lg" mb={4}>
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">No pudimos continuar</AlertTitle>
                <AlertDescription fontSize="sm">{globalError}</AlertDescription>
              </Box>
            </Alert>
          )}

          {loading && (
            <Box mb={4}>
              <Progress size="xs" isIndeterminate borderRadius="full" />
              <Text mt={2} fontSize="xs" color={subtleText}>
                Registrando empresa…
              </Text>
            </Box>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <VStack spacing={4} align="stretch">
              {/* Razón social / nombre */}
              <FormControl isRequired>
                <FormLabel htmlFor="username">Nombre o razón social</FormLabel>
                <Input
                  id="username"
                  name="username"
                  placeholder="Ej. Ferre Express S.A.S."
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="organization"
                  focusBorderColor="#f7b500"
                  h={{ base: "44px", sm: "48px" }}
                  rounded="lg"
                />
                <FormHelperText color={subtleText}>Tal como aparece en tu RUT o documentos.</FormHelperText>
              </FormControl>

              {/* NIT */}
              <FormControl isRequired isInvalid={!!nitError}>
                <FormLabel htmlFor="nit">NIT</FormLabel>
                <Input
                  id="nit"
                  name="nit"
                  placeholder="Ej. 900123456-7"
                  value={formData.nit}
                  onChange={handleChange}
                  onBlur={() => {
                    if (!formData.nit) setNitError("Ingresa el NIT.");
                    else if (!isValidNIT) setNitError("Formato de NIT no válido. Ej: 900123456-7");
                    else setNitError("");
                  }}
                  ref={nitRef}
                  aria-describedby={nitError ? "nit-error" : undefined}
                  aria-invalid={!!nitError}
                  focusBorderColor="#f7b500"
                  h={{ base: "44px", sm: "48px" }}
                  rounded="lg"
                />
                {nitError ? (
                  <Text id="nit-error" mt={1} fontSize="sm" color="red.600">
                    {nitError}
                  </Text>
                ) : (
                  <FormHelperText color={subtleText}>Puedes escribirlo con o sin guion.</FormHelperText>
                )}
              </FormControl>

              {/* Email */}
              <FormControl isRequired isInvalid={!!emailError}>
                <FormLabel htmlFor="email">Correo empresarial</FormLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="contacto@tuempresa.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => {
                    if (!formData.email) setEmailError("Ingresa tu correo.");
                    else if (!isValidEmail) setEmailError("Revisa el formato del correo.");
                    else setEmailError("");
                  }}
                  ref={emailRef}
                  aria-describedby={emailError ? "email-error" : undefined}
                  aria-invalid={!!emailError}
                  focusBorderColor="#f7b500"
                  h={{ base: "44px", sm: "48px" }}
                  rounded="lg"
                />
                {emailError ? (
                  <Text id="email-error" mt={1} fontSize="sm" color="red.600">
                    {emailError}
                  </Text>
                ) : (
                  <FormHelperText color={subtleText}>Te enviaremos confirmaciones y soporte.</FormHelperText>
                )}
              </FormControl>

              {/* Password */}
              <FormControl isRequired isInvalid={!!passError}>
                <FormLabel htmlFor="password">Contraseña</FormLabel>
                <InputGroup>
                  <Input
                    id="password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    ref={passRef}
                    focusBorderColor="#f7b500"
                    aria-describedby={passError ? "pass-error" : undefined}
                    h={{ base: "44px", sm: "48px" }}
                    rounded="lg"
                  />
                  <InputRightElement h={{ base: "44px", sm: "48px" }}>
                    <IconButton
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPass((v) => !v)}
                      icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                    />
                  </InputRightElement>
                </InputGroup>

                {/* Fortaleza */}
                <HStack mt={2} align="center" spacing={3}>
                  <Progress value={score} colorScheme={colorScheme} height="8px" flex="1" rounded="md" />
                  <Text fontSize="sm" color={`${colorScheme}.600`} minW="72px" textAlign="right">
                    {label}
                  </Text>
                </HStack>

                {/* Checklist */}
                <Box mt={2}>
                  <List spacing={1} fontSize="sm" color={listText}>
                    <ListItem>
                      <ListIcon
                        as={requirements.length ? CheckCircleIcon : WarningIcon}
                        color={requirements.length ? "green.500" : "gray.400"}
                      />
                      Mínimo 6 caracteres
                    </ListItem>
                    <ListItem>
                      <ListIcon
                        as={requirements.upper ? CheckCircleIcon : WarningIcon}
                        color={requirements.upper ? "green.500" : "gray.400"}
                      />
                      Al menos 1 mayúscula
                    </ListItem>
                    <ListItem>
                      <ListIcon
                        as={requirements.lower ? CheckCircleIcon : WarningIcon}
                        color={requirements.lower ? "green.500" : "gray.400"}
                      />
                      Al menos 1 minúscula
                    </ListItem>
                    <ListItem>
                      <ListIcon
                        as={requirements.number ? CheckCircleIcon : WarningIcon}
                        color={requirements.number ? "green.500" : "gray.400"}
                      />
                      Al menos 1 número
                    </ListItem>
                    <ListItem>
                      <ListIcon
                        as={requirements.symbol ? CheckCircleIcon : WarningIcon}
                        color={requirements.symbol ? "green.500" : "gray.400"}
                      />
                      Al menos 1 símbolo
                    </ListItem>
                  </List>
                  {passError && (
                    <Text id="pass-error" mt={2} fontSize="sm" color="red.600">
                      {passError}
                    </Text>
                  )}
                </Box>
              </FormControl>

              {/* Confirm */}
              <FormControl isRequired isInvalid={!!confirmError}>
                <FormLabel htmlFor="confirm">Confirmar contraseña</FormLabel>
                <InputGroup>
                  <Input
                    id="confirm"
                    name="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirm}
                    onChange={handleChange}
                    autoComplete="new-password"
                    ref={confirmRef}
                    focusBorderColor="#f7b500"
                    placeholder="Repite la contraseña"
                    aria-describedby={confirmError ? "confirm-error" : undefined}
                    h={{ base: "44px", sm: "48px" }}
                    rounded="lg"
                  />
                  <InputRightElement h={{ base: "44px", sm: "48px" }}>
                    <IconButton
                      aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowConfirm((v) => !v)}
                      icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                    />
                  </InputRightElement>
                </InputGroup>
                {confirmError ? (
                  <Text id="confirm-error" mt={1} fontSize="sm" color="red.600">
                    {confirmError}
                  </Text>
                ) : (
                  <FormHelperText color={subtleText}>Confirma para evitar errores de tipeo.</FormHelperText>
                )}
              </FormControl>

              <Button
                type="submit"
                color="black"
                bg="#f7b500"
                _hover={{ bg: "#e0a800" }}
                w="full"
                isLoading={loading}
                loadingText="Registrando…"
                h={{ base: "44px", sm: "48px" }}
                rounded="lg"
              >
                Registrar empresa
              </Button>

              <Text fontSize="xs" color={subtleText} textAlign="left">
                Al continuar, aceptas las{" "}
                <Link color="blue.400" textDecoration="underline">
                  Condiciones de uso
                </Link>{" "}
                y el{" "}
                <Link color="blue.400" textDecoration="underline">
                  Aviso de privacidad
                </Link>{" "}
                de FerreExpress.
              </Text>

              <Divider />

              <Text textAlign="center" fontSize="sm" color={subtleText}>
                ¿Ya tienes cuenta?{" "}
                <Link color="blue.400" textDecoration="underline" onClick={() => navigate("/Login")}>
                  Inicia Sesion
                </Link>
              </Text>

              <Text textAlign="center" fontSize="sm" color={subtleText}>
                ¿Eres nuevo cliente?{" "}
                <Link color="blue.400" textDecoration="underline" onClick={() => navigate("/register/cliente")}>
                  Regístrate aquí
                </Link>
              </Text>
            </VStack>
          </form>
        </Box>

        {/* MODAL ÉXITO */}
        <Modal isOpen={successOpen} onClose={() => {}} isCentered closeOnOverlayClick={false}>
          <ModalOverlay bg="blackAlpha.400" />
          <ModalContent
            bg={cardBg}
            p={8}
            borderRadius="2xl"
            textAlign="center"
            alignItems="center"
            boxShadow="2xl"
            role="alertdialog"
            aria-live="assertive"
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
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={prefersReducedMotion ? {} : { pathLength: 0 }}
                animate={prefersReducedMotion ? {} : { pathLength: 1 }}
                transition={prefersReducedMotion ? {} : { duration: 0.6, ease: "easeOut" }}
              >
                <motion.path d="M20 6L9 17l-5-5" />
              </motion.svg>
            </Box>

            <Heading size="md" mb={1}>
              {successMsg}
            </Heading>
            <Text fontSize="sm" color={subtleText}>
              Registro correcto. Redirigiendo al inicio de sesión…
            </Text>
          </ModalContent>
        </Modal>
      </VStack>
    </Flex>
  );
}
