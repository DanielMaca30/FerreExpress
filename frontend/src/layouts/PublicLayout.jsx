// src/layouts/PublicLayout.jsx
import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
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
  Button,                    // ← AQUÍ ESTABA EL PROBLEMA - ahora está importado
  Collapse,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Stack,
  useDisclosure,
  VisuallyHidden,
  Link as CLink,
  Spinner,
  Badge,
  VStack,
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
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api, { API_BASE_URL } from "../utils/axiosInstance";
const MotionBox = motion(Box);

export default function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgPage = useColorModeValue("#f6f7f9", "#0f1117");
  const headerBg = "#f8bd22";
  const footerBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("blackAlpha.200", "blackAlpha.400");
  const navInactive = useColorModeValue("gray.800", "gray.100");
  const navActiveBg = useColorModeValue("white", "whiteAlpha.200");
  const navActiveColor = useColorModeValue("gray.900", "gray.900");
  const muted = useColorModeValue("gray.600", "gray.300");
  const panelBg = useColorModeValue("white", "gray.800");
  const panelSubtleBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const isMobile = useBreakpointValue({ base: true, md: false });
  const pathname = location.pathname;

  const isActive = (to) => {
    if (to === "/Home") {
      return pathname === "/Home" || pathname === "/";
    }
    return pathname === to || pathname.startsWith(to + "/");
  };

  // ================== BUSCADOR + SUGERENCIAS ==================
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const term = search.trim();

    if (!term) return;

    setShowSuggestions(false);
    setSearch(""); // opcional: limpiar el input después de buscar

    // Navegamos a la página principal pública con el parámetro de búsqueda
    navigate(`/Home?search=${encodeURIComponent(term)}`);
    // O si tu página principal es simplemente "/", puedes usar:
    // navigate(`/?search=${encodeURIComponent(term)}`);
  };

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e) => {
      const input = searchInputRef.current;
      if (!input) return;

      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.focus();
        if (search.trim().length >= 2) setShowSuggestions(true);
      }

      if (e.key === "Escape" && document.activeElement === input) {
        setSearch("");
        setShowSuggestions(false);
        input.blur();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!showSuggestions) return;
      if (searchInputRef.current?.contains(e.target)) return;
      if (suggestionsRef.current?.contains(e.target)) return;
      setShowSuggestions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  // Debounce para búsqueda de sugerencias
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Búsqueda real a la API para sugerencias
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    api
      .get("/productos", {
        params: { search: debouncedSearch, limit: 8, page: 1 },
      })
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res.data?.productos || []);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Error buscando productos:", err);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const handleSelectProduct = (producto) => {
    setShowSuggestions(false);
    setSearch("");
    if (producto?.id) {
      navigate(`/producto/${producto.id}`);
    }
  };

  const hasQuery = debouncedSearch.length >= 2;
  const hasResults = searchResults.length > 0;

  // ================== Compact header en mobile ==================
  const [compactHeader, setCompactHeader] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    if (!isMobile || hideNavbar) {
      setCompactHeader(false);
      return;
    }

    lastScrollYRef.current = window.scrollY || 0;

    const MIN_Y_TO_COLLAPSE = 56;
    const DELTA = 10;

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const prev = lastScrollYRef.current;
        const diff = y - prev;

        if (y < 10) {
          setCompactHeader(false);
        } else {
          if (diff > DELTA && y > MIN_Y_TO_COLLAPSE) setCompactHeader(true);
          if (diff < -DELTA) setCompactHeader(false);
        }

        lastScrollYRef.current = y;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const hideNavbarRoutes = ["/forgot-password", "/verify-reset", "/reset-password"];
  const hideNavbar = hideNavbarRoutes.includes(pathname);

  const headerShadow = "0 3px 14px rgba(0,0,0,0.25)";

  // Navegación
  const navLeft = [
    { to: "/Home", label: "Inicio", icon: FiHome },
    { to: "/About", label: "Acerca de", icon: FiInfo },
    { to: "/puntos-fisicos", label: "Puntos físicos", icon: FiMapPin },
  ];

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
            {/* FILA 1 - Logo + acciones */}
            <Collapse in={!isMobile || !compactHeader} animateOpacity unmountOnExit>
              <Flex align="center" justify="space-between" gap={{ base: 2, md: 4 }}>
                <HStack spacing={3} minW={0}>
                  <CLink as={RouterLink} to="/Home" _hover={{ opacity: 0.9 }} aria-label="Ir al inicio">
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
                      <CLink as={RouterLink} to="/Login" aria-label="Carrito">
                        <Tooltip label="Carrito" hasArrow>
                          <IconButton
                            aria-label="Carrito"
                            variant="ghost"
                            color="gray.900"
                            icon={<FiShoppingCart />}
                          />
                        </Tooltip>
                      </CLink>

                      <IconButton
                        aria-label="Menú"
                        icon={<FiMenu />}
                        variant="ghost"
                        color="gray.900"
                        onClick={onOpen}
                      />
                    </>
                  ) : (
                    <Box h="32px" w="1px" />
                  )}
                </HStack>
              </Flex>
            </Collapse>

            {/* FILA 2: BUSCADOR + BOTÓN DE LUPA */}
            <Box mt={{ base: compactHeader ? 0 : 2, md: 3 }} position="relative">
              <Box as="form" onSubmit={handleSearchSubmit}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" h="100%" pl="3">
                    <FiSearch color="gray.400" />
                  </InputLeftElement>

                  <Input
                    id="fe-search"
                    ref={searchInputRef}
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
                    pr={{ base: "80px", md: "120px" }} // espacio para botón + atajo
                    fontSize={{ base: "sm", md: "md" }}
                    placeholder="Buscar productos, marcas o códigos…"
                    aria-label="Buscar productos en FerreExpress"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(e.target.value.trim().length >= 2);
                    }}
                    onFocus={() => {
                      if (search.trim().length >= 2) setShowSuggestions(true);
                    }}
                  />

                  <InputRightElement width="auto" pr={3} h="100%">
                    <HStack spacing={2}>
                      {/* Atajo solo cuando está vacío (desktop) */}
                      {!isMobile && search.trim() === "" && (
                        <HStack spacing={1} color="gray.600" fontSize="xs" pr={2}>
                          <Text>Atajo</Text>
                          <Kbd>/</Kbd>
                        </HStack>
                      )}

                      {/* Botón de búsqueda - aparece cuando hay texto */}
                      {search.trim() !== "" && (
                        <IconButton
                          aria-label="Realizar búsqueda"
                          icon={<FiSearch />}
                          size="sm"
                          variant="ghost"
                          color="gray.600"
                          _hover={{ color: "yellow.700", bg: "yellow.50" }}
                          onClick={handleSearchSubmit}
                        />
                      )}
                    </HStack>
                  </InputRightElement>
                </InputGroup>
              </Box>

              {/* Panel de sugerencias */}
              <AnimatePresence>
                {showSuggestions && (hasQuery || searchLoading) && (
                  <MotionBox
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 8, scale: 1 }}
                    exit={{ opacity: 0, y: 2, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={2}
                    bg={panelBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="xl"
                    boxShadow="lg"
                    zIndex="popover"
                    maxH="360px"
                    overflowY="auto"
                  >
                    {searchLoading && (
                      <HStack px={4} py={3} spacing={3}>
                        <Spinner size="sm" />
                        <Text fontSize="sm" color={muted}>
                          Buscando productos…
                        </Text>
                      </HStack>
                    )}

                    {!searchLoading && hasQuery && !hasResults && (
                      <Box px={4} py={3}>
                        <Text fontSize="sm" color={muted}>
                          No encontramos productos para{" "}
                          <Text as="span" fontWeight="semibold">
                            “{debouncedSearch}”
                          </Text>
                          .
                        </Text>
                      </Box>
                    )}

                    {!searchLoading && hasResults && (
                      <Stack spacing={1} p={2}>
                        {searchResults.map((p) => {
                          const img = p.imagen_principal
                            ? `${API_BASE_URL}${p.imagen_principal}`
                            : "https://via.placeholder.com/80x80?text=Sin+imagen";

                          const price = Number(p.precio ?? 0).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          });

                          return (
                            <Box
                              key={p.id}
                              as="button"
                              type="button"
                              onClick={() => handleSelectProduct(p)}
                              w="100%"
                              textAlign="left"
                              borderRadius="md"
                              _hover={{ bg: panelSubtleBg }}
                              px={2}
                              py={2}
                            >
                              <HStack align="center" spacing={3}>
                                <Box
                                  boxSize="44px"
                                  bg="white"
                                  borderRadius="md"
                                  overflow="hidden"
                                  border="1px solid"
                                  borderColor="blackAlpha.100"
                                  flexShrink={0}
                                >
                                  <Image
                                    src={img}
                                    alt={p.nombre}
                                    w="100%"
                                    h="100%"
                                    objectFit="contain"
                                  />
                                </Box>
                                <VStack align="flex-start" spacing={0.5} flex="1" minW={0}>
                                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                                    {p.nombre}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Text fontSize="sm" fontWeight="bold" color="gray.900">
                                      {price}
                                    </Text>
                                    {p.categoria && (
                                      <Badge
                                        variant="subtle"
                                        colorScheme="yellow"
                                        fontSize="0.65rem"
                                      >
                                        {p.categoria}
                                      </Badge>
                                    )}
                                  </HStack>
                                </VStack>
                              </HStack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}

                    <Box
                      px={4}
                      py={2}
                      borderTop="1px solid"
                      borderColor={borderColor}
                      bg={panelSubtleBg}
                      fontSize="xs"
                      color={muted}
                      display={{ base: "none", md: "flex" }}
                      alignItems="center"
                      gap={2}
                    >
                      <Text>Enter</Text>
                      <Kbd>Enter</Kbd>
                      <Text>• Cerrar</Text>
                      <Kbd>Esc</Kbd>
                    </Box>
                  </MotionBox>
                )}
              </AnimatePresence>
            </Box>

            {/* FILA 3: Navegación desktop */}
            <Box mt={{ base: 0, md: 3 }} display={{ base: "none", md: "block" }}>
              <Divider borderColor="blackAlpha.200" mb={2} opacity={0.5} />
              <Flex mt={1} align="center" justify="space-between" gap={4} wrap="nowrap">
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
                      active={item.label === "Iniciar sesión" ? isActive(item.to) : false}
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

      {/* Drawer Mobile */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="right">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menú de navegación</DrawerHeader>
          <DrawerBody>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb={1}>
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
                <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb={1}>
                  Mi cuenta
                </Text>
                <Stack spacing={1}>
                  {navRight.map((item) => {
                    const isLoginItem = item.label === "Iniciar sesión";
                    const isItemActive = isLoginItem && isActive(item.to);

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

      {/* Contenido principal */}
      <Box as="main" id="main" flex="1" bg={bgPage} px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
        <Container maxW="7xl">
          <Outlet />
        </Container>
      </Box>

      {/* Aquí iría tu footer */}
    </Box>
  );
}

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
      <Text fontSize="sm" fontWeight={active ? "semibold" : "normal"} noOfLines={1}>
        {label}
      </Text>
    </HStack>
  );
}