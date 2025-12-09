// src/layouts/PublicLayout.jsx
import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  useBreakpointValue,
  Tooltip,
  Image,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Kbd,
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Stack,
  useDisclosure,
  Grid,
  GridItem,
  VisuallyHidden,
  Link as CLink,
} from "@chakra-ui/react";
import {
  FiHome,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiSearch,
  FiInfo,
  FiMapPin,
  FiMenu,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { useEffect } from "react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

export default function PublicLayout() {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgPage = useColorModeValue("#f6f7f9", "#0f1117");
  const headerBg = "#f8bd22"; // igual que ClienteLayout
  const footerBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("blackAlpha.200", "blackAlpha.400");
  const navInactive = useColorModeValue("gray.800", "gray.100");
  const navActiveBg = useColorModeValue("white", "whiteAlpha.200");
  const navActiveColor = useColorModeValue("gray.900", "gray.900");
  const muted = useColorModeValue("gray.600", "gray.300");

  const isMobile = useBreakpointValue({ base: true, md: false });
  const pathname = location.pathname;

  const isActive = (to) => {
    if (to === "/Home") {
      return pathname === "/Home" || pathname === "/";
    }
    return pathname === to || pathname.startsWith(to + "/");
  };

  // Atajo "/" para enfocar buscador, "Esc" para limpiar
  useEffect(() => {
    const onKey = (e) => {
      const input = document.getElementById("fe-search");
      if (!input) return;

      const tag = (e.target.tagName || "").toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || e.target.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.focus();
      }
      if (e.key === "Escape" && document.activeElement === input) {
        input.value = "";
        input.blur();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hideNavbarRoutes = [
    "/forgot-password",
    "/verify-reset",
    "/reset-password",
  ];
  const hideNavbar = hideNavbarRoutes.includes(pathname);

  const headerShadow = "0 3px 14px rgba(0,0,0,0.25)";

  // Navegación pública, SIN el botón de Categorías
  const navLeft = [
    { to: "/Home", label: "Inicio", icon: FiHome },
    { to: "/About", label: "Acerca de", icon: FiInfo },
    { to: "/PuntosFisicos", label: "Puntos físicos", icon: FiMapPin },
  ];

  // Todos llevan a /Login, pero SOLO "Iniciar sesión" se marca activo
  const navRight = [
    { to: "/Login", label: "Mis pedidos", icon: FiTruck },
    { to: "/Login", label: "Carrito", icon: FiShoppingCart },
    { to: "/Login", label: "Iniciar sesión", icon: FiUser },
  ];

  return (
    <Box minH="100vh" bg={bgPage} display="flex" flexDirection="column">
      {/* ===== HEADER ===== */}
      {!hideNavbar && (
        <Box
          as="header"
          position="sticky"
          top={0}
          zIndex="overlay"
          bg={headerBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          boxShadow={headerShadow}
        >
          <VisuallyHidden as="a" href="#main">
            Saltar al contenido
          </VisuallyHidden>

          <Container maxW="7xl" px={{ base: 3, md: 5 }} py={{ base: 2, md: 3 }}>
            {/* FILA 1: Logo + acciones (igual estructura que ClienteLayout) */}
            <Flex
              align="center"
              justify="space-between"
              gap={{ base: 2, md: 4 }}
              wrap="nowrap"
            >
              <HStack spacing={3} minW={0}>
                <CLink
                  as={RouterLink}
                  to="/Home"
                  _hover={{ opacity: 0.9 }}
                  aria-label="Ir al inicio"
                >
                  <Image
                    src="/LOGOFERREEXPRESS.jpg"
                    alt="FerreExpress S.A.S."
                    h={{ base: "32px", md: "40px" }}
                    objectFit="contain"
                  />
                </CLink>
              </HStack>

              <HStack spacing={3}>
                {isMobile ? (
                  <>
                    {/* Carrito móvil (lleva a /Login como antes) */}
                    <CLink
                      as={RouterLink}
                      to="/Login"
                      aria-label="Carrito"
                      _hover={{ opacity: 0.9 }}
                    >
                      <Tooltip label="Carrito" hasArrow>
                        <IconButton
                          aria-label="Carrito"
                          variant="ghost"
                          color="gray.900"
                          icon={<FiShoppingCart />}
                        />
                      </Tooltip>
                    </CLink>

                    {/* Menú móvil (abre Drawer) */}
                    <IconButton
                      aria-label="Menú"
                      icon={<FiMenu />}
                      variant="ghost"
                      color="gray.900"
                      onClick={onOpen}
                    />
                  </>
                ) : (
                  // En escritorio el menú queda en la Fila 3, igual que ClienteLayout
                  <Box h="32px" w="1px" />
                )}
              </HStack>
            </Flex>

            {/* FILA 2: Buscador (clonado de ClienteLayout) */}
            <Box mt={{ base: 2, md: 3 }}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="100%" pl="3">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  id="fe-search"
                  bg="white"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{
                    borderColor: "gray.500",
                    boxShadow: "0 0 0 3px rgba(51,65,85,0.4)",
                  }}
                  rounded="full"
                  h={{ base: "40px", md: "44px" }}
                  pl="44px"
                  pr="96px"
                  fontSize={{ base: "sm", md: "sm" }}
                  placeholder="Buscar productos, marcas o códigos…"
                  aria-label="Buscar productos en FerreExpress"
                />
                <InputRightElement
                  width="88px"
                  h="100%"
                  pr="3"
                  justifyContent="flex-end"
                >
                  {!isMobile && (
                    <HStack spacing={2} color="gray.700" fontSize="xs">
                      <Text>Atajo</Text>
                      <Kbd>/</Kbd>
                    </HStack>
                  )}
                </InputRightElement>
              </InputGroup>
            </Box>

            {/* FILA 3: Navegación desktop (pills como ClienteLayout) */}
            <Box
              mt={{ base: 0, md: 3 }}
              display={{ base: "none", md: "block" }}
            >
              <Divider borderColor="blackAlpha.200" mb={2} opacity={0.5} />
              <Flex
                mt={1}
                align="center"
                justify="space-between"
                gap={4}
                wrap="nowrap"
              >
                {/* IZQUIERDA: Navegación informativa */}
                <Flex
                  as="nav"
                  align="center"
                  gap={2}
                  overflowX="auto"
                  pb={1}
                  sx={{
                    "::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                  }}
                >
                  {navLeft.map((item) => (
                    <PublicNavItem
                      key={item.to}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      active={isActive(item.to)}
                      navInactive={navInactive}
                      navActiveBg={navActiveBg}
                      navActiveColor={navActiveColor}
                    />
                  ))}
                </Flex>

                {/* DERECHA: Accesos a cuenta (solo "Iniciar sesión" se marca activo) */}
                <Flex
                  as="nav"
                  align="center"
                  gap={2}
                  overflowX="auto"
                  pb={1}
                  sx={{
                    "::-webkit-scrollbar": { display: "none" },
                    scrollbarWidth: "none",
                  }}
                >
                  {navRight.map((item) => (
                    <PublicNavItem
                      key={item.to + item.label}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      active={
                        item.label === "Iniciar sesión"
                          ? isActive(item.to)
                          : false
                      }
                      navInactive={navInactive}
                      navActiveBg={navActiveBg}
                      navActiveColor={navActiveColor}
                    />
                  ))}
                </Flex>
              </Flex>
            </Box>
          </Container>
        </Box>
      )}

      {/* ===== DRAWER MOBILE (MENÚ HAMBURGUESA) ===== */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menú de navegación</DrawerHeader>
          <DrawerBody>
            <Stack spacing={4}>
              <Box>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  color="gray.500"
                  mb={1}
                >
                  Explorar
                </Text>
                <Stack spacing={1}>
                  {navLeft.map((item) => (
                    <Button
                      key={item.to}
                      as={RouterLink}
                      to={item.to}
                      leftIcon={<item.icon />}
                      justifyContent="flex-start"
                      variant={isActive(item.to) ? "solid" : "ghost"}
                      colorScheme={isActive(item.to) ? "yellow" : "gray"}
                      size="sm"
                      onClick={onClose}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </Box>

              <Box>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  color="gray.500"
                  mb={1}
                >
                  Mi cuenta
                </Text>
                <Stack spacing={1}>
                  {navRight.map((item) => {
                    const isLoginItem = item.label === "Iniciar sesión";
                    const isItemActive =
                      isLoginItem && isActive(item.to); // Sólo este se marca

                    return (
                      <Button
                        key={item.to + item.label}
                        as={RouterLink}
                        to={item.to}
                        leftIcon={<item.icon />}
                        justifyContent="flex-start"
                        variant={isItemActive ? "solid" : "ghost"}
                        colorScheme={isItemActive ? "yellow" : "gray"}
                        size="sm"
                        onClick={onClose}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ===== CONTENIDO ===== */}
      <Box
        as="main"
        id="main"
        flex="1"
        bg={bgPage}
        px={{ base: 2, md: 4 }}
        py={{ base: 3, md: 4 }}
      >
        <Container maxW="7xl">
          <Outlet />
        </Container>
      </Box>

      {/* ===== FOOTER (clonado de ClienteLayout) ===== */}
      <Box
        as="footer"
        w="full"
        bg={footerBg}
        py={{ base: 6, md: 8 }}
        borderTop="1px solid"
        borderColor={borderColor}
        mt="auto"
        boxShadow="0 -4px 20px rgba(0,0,0,0.06)"
      >
        <Container
          maxW={{ base: "100%", md: "95%", lg: "8xl" }}
          px={{ base: 4, md: 6, lg: 8 }}
        >
          <Grid
            templateColumns={{
              base: "1fr",
              md: "1fr auto 1fr",
            }}
            alignItems="center"
            gap={{ base: 6, md: 8 }}
          >
            <HStack justify={{ base: "center", md: "flex-start" }}>
              <Image
                src="/ferreexpress.png"
                alt="FerreExpress S.A.S."
                h={{ base: "36px", sm: "42px", md: "48px" }}
                objectFit="contain"
                transition="transform 0.2s"
                _hover={{ transform: "scale(1.06)" }}
              />
            </HStack>

            <HStack
              spacing={{ base: 6, md: 10 }}
              justify="center"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="medium"
            >
              <Button
                as={RouterLink}
                to="/condiciones-uso"
                variant="link"
                color="blue.600"
                _hover={{ color: "blue.700" }}
              >
                Condiciones de uso
              </Button>
              <Button
                as={RouterLink}
                to="/avisos-privacidad"
                variant="link"
                color="blue.600"
                _hover={{ color: "blue.700" }}
              >
                Avisos de privacidad
              </Button>
            </HStack>

            <HStack
              spacing={{ base: 5, md: 6 }}
              justify={{ base: "center", md: "flex-end" }}
            >
              {[
                { Icon: FaWhatsapp, label: "WhatsApp", color: "#25D366" },
                { Icon: FaInstagram, label: "Instagram", color: "#E4405F" },
                { Icon: FaFacebook, label: "Facebook", color: "#1877F2" },
                { Icon: FaXTwitter, label: "X", color: "#000000" },
              ].map((social) => (
                <MotionBox
                  key={social.label}
                  whileHover={{ scale: 1.22 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <IconButton
                    as="a"
                    href="#"
                    target="_blank"
                    rel="noopener"
                    aria-label={social.label}
                    icon={<social.Icon size={24} />}
                    variant="ghost"
                    color={muted}
                    _hover={{ color: social.color, bg: "blackAlpha.100" }}
                    rounded="full"
                  />
                </MotionBox>
              ))}
            </HStack>

            <GridItem colSpan={{ base: 1, md: 3 }} mt={{ base: 6, md: 8 }}>
              <Text
                fontSize={{ base: "xs", md: "sm" }}
                color={muted}
                textAlign="center"
                fontWeight="medium"
              >
                © {new Date().getFullYear()} FerreExpress® • Todos los derechos
                reservados
              </Text>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

/* ===== Item de navegación estilo ClienteLayout ===== */
function PublicNavItem({
  to,
  icon: Icon,
  label,
  active,
  navInactive,
  navActiveBg,
  navActiveColor,
}) {
  return (
    <HStack
      as={RouterLink}
      to={to}
      spacing={2}
      px={3}
      py={1.5}
      borderRadius="full"
      bg={active ? navActiveBg : "transparent"}
      color={active ? navActiveColor : navInactive}
      _hover={{
        textDecoration: "none",
        bg: active ? navActiveBg : "whiteAlpha.800",
        transform: active ? "none" : "translateY(-1px)",
      }}
      transition="background 0.15s ease, transform 0.12s ease"
      flexShrink={0}
      aria-current={active ? "page" : undefined}
      position="relative"
    >
      <Box position="relative">
        <Icon size={16} />
      </Box>
      <Text
        fontSize="sm"
        fontWeight={active ? "semibold" : "normal"}
        noOfLines={1}
      >
        {label}
      </Text>
    </HStack>
  );
}
