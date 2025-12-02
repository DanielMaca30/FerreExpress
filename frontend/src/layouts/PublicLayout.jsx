import { Outlet, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Link as CLink,
  Text,
  useColorModeValue,
  Divider,
  Collapse,
  useDisclosure,
  Kbd,
  usePrefersReducedMotion,
  VisuallyHidden,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { FiSearch, FiShoppingCart, FiUser, FiMenu } from "react-icons/fi";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout() {
  const brandBg = "#f9bf20";
  const brandText = useColorModeValue("gray.900", "gray.900");
  const linkColor = useColorModeValue("gray.800", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.300");
  const subtle = useColorModeValue("blackAlpha.200", "whiteAlpha.300");
  const footerBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const prefersReducedMotion = usePrefersReducedMotion();

  const [elevated, setElevated] = useState(false);
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 2);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Atajo "/" para enfocar el buscador y "Esc" para limpiar/blur (usabilidad)
  useEffect(() => {
    const onKey = (e) => {
      const input = document.getElementById("fe-search");
      if (!input) return;
      // evita interceptar si está escribiendo en otro input/textarea
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

  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const isActive = (href) => location.pathname.startsWith(href);

  const hideNavbarRoutes = [
    "/forgot-password",
    "/verify-reset",
    "/reset-password",
  ];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  const headerShadow = useMemo(
    () => (elevated ? "0 3px 14px rgba(0,0,0,.08)" : "0 1px 0 rgba(0,0,0,.06)"),
    [elevated]
  );

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bg={useColorModeValue("#f6f7f9", "#0f1117")}
    >
      {/* ====== NAVBAR ====== */}
      {!hideNavbar && (
        <Box
          as="header"
          position="sticky"
          top="0"
          zIndex="banner"
          bg={brandBg}
          color={brandText}
          borderBottom="1px solid"
          borderColor={subtle}
          boxShadow={headerShadow}
          transition={
            prefersReducedMotion
              ? "none"
              : "box-shadow .18s ease, transform .18s ease"
          }
        >
          <VisuallyHidden as="a" href="#main">
            Saltar al contenido
          </VisuallyHidden>

          <Container
            maxW="8xl"
            px={{ base: 3, md: 5, lg: 8 }}
            py={{ base: 2, md: 3 }}
          >
            {/* ===== Fila 1+2: LOGO + BUSCADOR (en fila en md+, en columna en móvil) ===== */}
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              gap={{ base: 2, md: 4, lg: 6 }}
              mb={{ base: 2, md: 3 }}
            >
              {/* Logo (izquierda en md+) */}
              <HStack flexShrink={0} minH={{ base: "40px", md: "52px" }}>
                <CLink
                  as={RouterLink}
                  to="/Home"
                  _hover={{ opacity: 0.9 }}
                  aria-label="Ir al inicio"
                >
                  <Image
                    src="/LOGOFERREEXPRESS.jpg"
                    alt="FerreExpress S.A.S."
                    h={{ base: "36px", md: "48px", lg: "56px" }}
                    objectFit="contain"
                  />
                </CLink>
              </HStack>

              {/* Buscador (se estira hasta el borde derecho del Container) */}
              <Box
                flex="1" // <- ocupa todo el espacio restante
                w="100%"
                maxW="100%" // <- sin límites, llega al borde derecho
              >
                <InputGroup w="100%">
                  <InputLeftElement pointerEvents="none" h="100%" pl="3">
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    id="fe-search"
                    bg="white"
                    borderColor="gray.200"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{
                      borderColor: "gray.400",
                      boxShadow: "0 0 0 3px rgba(66,153,225,.35)",
                    }}
                    rounded="full"
                    h={{ base: "44px", md: "48px" }}
                    pl="44px"
                    pr="96px"
                    fontSize={{ base: "sm", md: "md" }}
                    placeholder="Buscar productos, marcas y más…"
                    aria-label="Buscar en FerreExpress"
                    boxShadow="0 1.5px 3px rgba(16,24,40,.10)"
                  />
                  <InputRightElement
                    width="88px"
                    h="100%"
                    pr="3"
                    justifyContent="flex-end"
                  >
                    <HStack
                      spacing={2}
                      color={muted}
                      fontSize="xs"
                      display={{ base: "none", sm: "flex" }}
                    >
                      <Text>Atajo</Text>
                      <Kbd>/</Kbd>
                    </HStack>
                  </InputRightElement>
                </InputGroup>
              </Box>
            </Flex>

            {/* ===== Fila 3: NAV + ACCIONES ===== */}
            <Flex
              align="center"
              justify="space-between"
              py={{ base: 1.5, md: 2.5 }}
              gap={{ base: 2, md: 4, lg: 6 }}
              flexWrap="nowrap"
            >
              {/* Izquierda: hamburguesa (solo móvil) + links (solo md+) */}
              <HStack spacing={{ base: 2, md: 5 }}>
                {/* Hamburguesa visible SOLO en móvil */}
                <IconButton
                  aria-label="Abrir menú"
                  icon={<FiMenu />}
                  variant="ghost"
                  color={brandText}
                  minH="44px"
                  onClick={onToggle}
                  display={{ base: "inline-flex", md: "none" }}
                />
                {/* Links ocultos en móvil, visibles en md+ */}
                <HStack
                  spacing={{ md: 5 }}
                  display={{ base: "none", md: "flex" }}
                >
                  <NavLink to="/categorias" active={isActive("/categorias")}>
                    Categorías
                  </NavLink>
                  <NavLink to="/About" active={isActive("/About")}>
                    Acerca de nosotros
                  </NavLink>
                  <NavLink to="/PuntosFisicos" active={isActive("/PuntosFisicos")}>
                    Puntos físicos
                  </NavLink>
                </HStack>
              </HStack>

              {/* Derecha: acciones (alineadas al borde derecho del Container) */}
              <HStack spacing={{ base: 3, md: 4 }} flexShrink={0}>
                <CLink
                  as={RouterLink}
                  to="/Login"
                  fontSize="sm"
                  color={linkColor}
                  _hover={{ textDecoration: "underline" }}
                >
                  Mis pedidos
                </CLink>
                <CLink
                  as={RouterLink}
                  to="/Login"
                  aria-label="Carrito"
                  _hover={{ opacity: 0.9 }}
                >
                  <IconButton
                    icon={<FiShoppingCart />}
                    variant="ghost"
                    color={brandText}
                    minH="44px"
                  />
                </CLink>
                <IconButton
                  aria-label="Cuenta / Iniciar sesión"
                  icon={<FiUser />}
                  variant="ghost"
                  color={brandText}
                  as={RouterLink}
                  to="/Login"
                  minH="44px"
                />
              </HStack>
            </Flex>

            {/* Menú colapsable (móvil): enlaces ocultos arriba aparecen aquí */}
            <Collapse in={isOpen} animateOpacity>
              <Box display={{ base: "block", md: "none" }} py={2}>
                <Divider borderColor={subtle} mb={2} />
                <VStack align="stretch" spacing={1}>
                  <MobileLink to="/categorias">Categorías</MobileLink>
                  <MobileLink to="/About">Acerca de nosotros</MobileLink>
                  <MobileLink to="/PuntosFisicos">Puntos físicos</MobileLink>
                </VStack>
              </Box>
            </Collapse>
          </Container>

          <Divider borderColor={subtle} />
        </Box>
      )}

      {/* ====== CONTENIDO ====== */}
      <Box as="main" flex="1" bg={useColorModeValue("#f6f7f9", "#0f1117")}>
        <Outlet />
      </Box>

      {/* ====== FOOTER ====== */}
      <Box
        as="footer"
        w="full"
        bg={footerBg}
        py={{ base: 3, md: 4 }}
        borderTop="1px solid"
        borderColor={borderColor}
        mt="auto"
        boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
      >
        <Container
          maxW={{ base: "100%", md: "95%", lg: "8xl" }}
          px={{ base: 4, md: 5, lg: 8 }}
          py={{ base: 2, md: 3 }}
        >
          <Grid
            templateColumns={{
              base: "1fr",
              md: "1fr auto 1fr",
            }}
            alignItems="center"
            gap={{ base: 3, md: 4 }}
          >
            <HStack justify={{ base: "center", md: "flex-start" }}>
              <Image
                src="/ferreexpress.png"
                alt="FerreExpress S.A.S."
                h={{ base: "32px", sm: "38px", md: "42px" }}
                objectFit="contain"
              />
            </HStack>

            <HStack
              spacing={{ base: 3, md: 5 }}
              justify="center"
              fontSize={{ base: "xs", md: "sm" }}
            >
              <CLink
                as={RouterLink}
                to="/condiciones-uso"
                color="blue.600"
                textDecoration="underline"
              >
                Condiciones de uso
              </CLink>
              <CLink
                as={RouterLink}
                to="/avisos-privacidad"
                color="blue.600"
                textDecoration="underline"
              >
                Avisos de privacidad
              </CLink>
            </HStack>

            <HStack
              spacing={{ base: 3, md: 4 }}
              color="gray.600"
              justify={{ base: "center", md: "flex-end" }}
            >
              <CLink href="#" aria-label="WhatsApp" _hover={{ color: "black" }}>
                <FaWhatsapp size={18} />
              </CLink>
              <CLink
                href="#"
                aria-label="Instagram"
                _hover={{ color: "black" }}
              >
                <FaInstagram size={18} />
              </CLink>
              <CLink href="#" aria-label="Facebook" _hover={{ color: "black" }}>
                <FaFacebook size={18} />
              </CLink>
              <CLink
                href="#"
                aria-label="X (antes Twitter)"
                _hover={{ color: "black" }}
              >
                <FaXTwitter size={18} />
              </CLink>
            </HStack>

            <GridItem colSpan={{ base: 1, md: 3 }}>
              <Text
                fontSize={{ base: "xs", sm: "sm" }}
                color="gray.600"
                textAlign="center"
              >
                {new Date().getFullYear()} | FerreExpress®
              </Text>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

/* ===== Subcomponentes ===== */
function NavLink({ to, children, icon, active }) {
  const linkColor = useColorModeValue("gray.800", "gray.800");
  const activeColor = useColorModeValue("gray.900", "gray.900");
  return (
    <CLink
      as={RouterLink}
      to={to}
      display="inline-flex"
      alignItems="center"
      gap={icon ? 2 : 0}
      color={active ? activeColor : linkColor}
      fontSize="sm"
      textDecoration={active ? "underline" : "none"}
      _hover={{ textDecoration: "underline" }}
    >
      {icon ?? null}
      {children}
    </CLink>
  );
}

function MobileLink({ to, children }) {
  const linkColor = useColorModeValue("gray.800", "gray.800");
  return (
    <CLink
      as={RouterLink}
      to={to}
      px="1"
      py="1"
      color={linkColor}
      _hover={{ textDecoration: "underline" }}
    >
      {children}
    </CLink>
  );
}
