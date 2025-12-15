import { useMemo, useRef, useState } from "react";
import {
    Box, Button, Heading, Text, VStack, HStack, FormControl, FormLabel, Input, IconButton, InputGroup, InputRightElement, Link, Divider, useToast, Progress, List, ListItem, ListIcon,
    Flex, Image, Container, Grid, GridItem, useColorModeValue, Modal, ModalOverlay, ModalContent, usePrefersReducedMotion
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { FcGoogle } from "react-icons/fc";
import { FaWhatsapp, FaInstagram, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";
import { API_BASE_URL } from "../../utils/axiosInstance"; // ajusta ruta

export default function RegisterCliente() {
    const bgPage = useColorModeValue("#f6f7f9", "0f1117")
    const cardBg = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const prefersReducedMotion = usePrefersReducedMotion();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirm: "",
    });
    const [loading, setLoading] = useState(false);

    const [emailError, setEmailError] = useState("");
    const [passError, setPassError] = useState("");
    const [confirmError, setConfirmError] = useState("");
    const [globalError, setGlobalError] = useState("");

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ✅ Éxito: modal con animación
    const [successOpen, setSuccessOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState("¡Cuenta creada!");

    const toast = useToast();
    const navigate = useNavigate();

    const emailRef = useRef(null);
    const passRef = useRef(null);
    const confirmRef = useRef(null);

    const isValidEmail = useMemo(() => {
        if (!formData.email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    }, [formData.email]);

    const handleChange = (e) => {
        setGlobalError("");
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        if (name === "email") setEmailError("");
        if (name === "password") setPassError("");
        if (name === "confirm") setConfirmError("");
    };

    // --------- Password strength ----------
    const requirements = useMemo(() => {
        const p = formData.password || "";
        return {
            length: p.length >= 6,
            upper: /[A-Z]/.test(p),
            lower: /[a-z]/.test(p),
            number: /\d/.test(p),
            symbol: /[^A-Za-z0-9]/.test(p),
            notEmail: p && formData.email && !p.includes(formData.email.split("@")[0]),
            notUsername:
                p && formData.username && !p.toLowerCase().includes(formData.username.toLowerCase()),
        };
    }, [formData.password, formData.email, formData.username]);

    const { score, label, colorScheme } = useMemo(() => {
        let s = 0;
        if (requirements.length) s += 20;
        if (requirements.upper) s += 16;
        if (requirements.lower) s += 16;
        if (requirements.number) s += 16;
        if (requirements.symbol) s += 16;
        if (requirements.notEmail) s += 8;
        if (requirements.notUsername) s += 8;

        let lbl = "Débil";
        let color = "red";
        if (s >= 35 && s < 60) { lbl = "Aceptable"; color = "orange"; }
        if (s >= 60 && s < 85) { lbl = "Buena"; color = "yellow"; }
        if (s >= 85) { lbl = "Fuerte"; color = "green"; }
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

        if (!formData.password) {
            setPassError("Ingresa una contraseña.");
            ok = false;
        } else if (!requirements.length) {
            setPassError("La contraseña debe tener al menos 6 caracteres.");
            ok = false;
        } else if (!(requirements.upper && requirements.lower && requirements.number && requirements.symbol)) {
            setPassError("Usa mayúscula, minúscula, número y símbolo.");
            ok = false;
        } else if (!requirements.notEmail || !requirements.notUsername) {
            setPassError("Evita usar tu nombre de usuario o correo en la contraseña.");
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
        setPassError("");
        setConfirmError("");

        if (!validate()) return;

        try {
            setLoading(true);
            const payload = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password,
            };

            const res = await api.post("/auth/register/cliente", payload);

            // Toast + Modal de éxito
            toast({
                title: "Registro exitoso",
                description: `Bienvenido ${res.data?.username ?? payload.username}`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            setSuccessMsg("¡Cuenta creada!");
            setSuccessOpen(true);

            const delay = prefersReducedMotion ? 500 : 1400;
            setTimeout(() => navigate("/login"), delay);
        } catch (error) {
            setGlobalError(error.response?.data?.error || "Error del servidor");
            toast({
                title: "Error al registrarse",
                description: error.response?.data?.error || "Error del servidor",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Animación del check
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

    // ====== LAYOUT (footer sticky; no tapa el contenido) ======
    return (
        <Flex direction="column" minH="100vh" bg={bgPage}>
            {/* MAIN */}
            <Box
                as="main"
                flex="1"
                display="flex"
                alignItems="flex-start"
                justifyContent="center"
                pt={{ base: 4, md: 8 }}
                pb={{ base: 6, md: 10 }}
            >
                {/* Logo + Card */}
                <VStack spacing={{ base: 4, md: 6 }} w="full" maxW={{ base: "90%", sm: "400px", md: "480px" }}>
                    <Box
                        bg={cardBg}
                        color={textColor}
                        p={{ base: 5, sm: 6, md: 8 }}
                        rounded="xl"
                        shadow="lg"
                        w="full"
                        textAlign="left"
                    >
                        <Heading size={{ base: "md", sm: "lg" }} mb={1}>
                            Crear Cuenta
                        </Heading>

                        {/* Error global accesible */}
                        <Box aria-live="assertive" minH={globalError ? "1.25rem" : "0"} mb={globalError ? 2 : 0}>
                            {globalError && <Text color="red.600" fontSize="sm">{globalError}</Text>}
                        </Box>

                        <form onSubmit={handleSubmit} noValidate>
                            <VStack spacing={4} align="stretch">
                                {/* Nombre */}
                                <FormControl isRequired>
                                    <FormLabel htmlFor="username">Nombre</FormLabel>
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="Nombres y apellidos"
                                        value={formData.username}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        focusBorderColor="#f7b500"
                                    />
                                </FormControl>

                                {/* Email */}
                                <FormControl isRequired isInvalid={!!emailError}>
                                    <FormLabel htmlFor="email">Correo electrónico</FormLabel>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        placeholder="nombre@empresa.com"
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
                                    />
                                    {emailError && (
                                        <Text id="email-error" mt={1} fontSize="sm" color="red.600">
                                            {emailError}
                                        </Text>
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
                                        />
                                        <InputRightElement>
                                            <IconButton
                                                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowPass((v) => !v)}
                                                icon={showPass ? <ViewOffIcon /> : <ViewIcon />}
                                            />
                                        </InputRightElement>
                                    </InputGroup>

                                    {/* Barra de fortaleza */}
                                    <HStack mt={2} align="center" spacing={3}>
                                        <Progress value={score} colorScheme={colorScheme} height="8px" flex="1" rounded="md" />
                                        <Text fontSize="sm" color={`${colorScheme}.600`} minW="72px" textAlign="right">
                                            {label}
                                        </Text>
                                    </HStack>

                                    {/* Checklist */}
                                    <Box mt={2}>
                                        <List spacing={1} fontSize="sm" color="gray.700">
                                            <ListItem>
                                                <ListIcon as={requirements.length ? CheckCircleIcon : WarningIcon}
                                                    color={requirements.length ? "green.500" : "gray.400"} />
                                                Mínimo 6 caracteres
                                            </ListItem>
                                            <ListItem>
                                                <ListIcon as={requirements.upper ? CheckCircleIcon : WarningIcon}
                                                    color={requirements.upper ? "green.500" : "gray.400"} />
                                                Al menos 1 mayúscula
                                            </ListItem>
                                            <ListItem>
                                                <ListIcon as={requirements.lower ? CheckCircleIcon : WarningIcon}
                                                    color={requirements.lower ? "green.500" : "gray.400"} />
                                                Al menos 1 minúscula
                                            </ListItem>
                                            <ListItem>
                                                <ListIcon as={requirements.number ? CheckCircleIcon : WarningIcon}
                                                    color={requirements.number ? "green.500" : "gray.400"} />
                                                Al menos 1 número
                                            </ListItem>
                                            <ListItem>
                                                <ListIcon as={requirements.symbol ? CheckCircleIcon : WarningIcon}
                                                    color={requirements.symbol ? "green.500" : "gray.400"} />
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
                                    <FormLabel htmlFor="confirm">Confirmar Contraseña</FormLabel>
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
                                        />
                                        <InputRightElement>
                                            <IconButton
                                                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                                            />
                                        </InputRightElement>
                                    </InputGroup>
                                    {confirmError && (
                                        <Text id="confirm-error" mt={1} fontSize="sm" color="red.600">
                                            {confirmError}
                                        </Text>
                                    )}
                                </FormControl>

                                {/* Google */}
                                <Button
                                    type="button"
                                    onClick={() => (window.location.href = `${API_BASE_URL}/api/v1/auth/google`)}
                                    w="full"
                                    h={{ base: "45px", sm: "50px" }}
                                    rounded="lg"
                                    bg="white"
                                    color="gray.900"
                                    border="1px solid"
                                    borderColor="gray.300"
                                    leftIcon={<FcGoogle size={20} />}
                                    fontWeight="medium"
                                    _hover={{ bg: "white", borderColor: "gray.400", boxShadow: "md" }}
                                >
                                    Sign in with Google
                                </Button>

                                <Button
                                    type="submit"
                                    color="black"
                                    bg="#f7b500"
                                    _hover={{ bg: "#e0a800" }}
                                    w="full"
                                    isLoading={loading}
                                    loadingText="Creando cuenta…"
                                >
                                    Continuar
                                </Button>

                                <Text fontSize="xs" color="gray.600" textAlign="left">
                                    Al continuar, aceptas las{" "}
                                    <Link
                                        as={RouterLink}
                                        to="/condiciones-uso"
                                        color="blue.400"
                                        textDecoration="underline"
                                    >
                                        Condiciones de uso
                                    </Link>{" "}
                                    y el{" "}
                                    <Link
                                        as={RouterLink}
                                        to="/avisos-privacidad"
                                        color="blue.400"
                                        textDecoration="underline"
                                    >
                                        Aviso de privacidad
                                    </Link>{" "}

                                    de FerreExpress.
                                </Text>

                                <Divider />

                                <Text textAlign="center" fontSize="sm" color="gray.700">
                                    ¿Ya tienes una cuenta?{" "}
                                    <Link
                                        color="blue.400"
                                        textDecoration="underline"
                                        onClick={() => navigate("/login")}
                                    >
                                        Inicia Sesión
                                    </Link>
                                </Text>

                                <Text textAlign="center" fontSize="sm" color="gray.700">
                                    ¿Eres empresa?{" "}
                                    <Link
                                        color="blue.400"
                                        textDecoration="underline"
                                        onClick={() => navigate("/register/empresa")}
                                    >
                                        Regístrate aquí
                                    </Link>
                                </Text>
                            </VStack>
                        </form>
                    </Box>
                </VStack>
            </Box>

            {/* MODAL ÉXITO */}
            <Modal isOpen={successOpen} onClose={() => { }} isCentered>
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

                    <Heading size="md" mb={1}>{successMsg}</Heading>
                    <Text fontSize="sm" color="gray.400">Registro correcto. Redirigiendo al inicio de sesión…</Text>
                </ModalContent>
            </Modal>
        </Flex>
    );
}