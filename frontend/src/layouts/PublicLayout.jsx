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
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Stack,
  Grid,
  GridItem,
  useDisclosure,
  VisuallyHidden,
  Link as CLink,
  Spinner,
  Badge,
  VStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Divider as ChakraDivider,
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
  FiClock,
  FiX,
  FiTrendingUp,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
} from "react-icons/fa6";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api, { API_BASE_URL } from "../utils/axiosInstance";

const MotionBox = motion(Box);

/* ===== Constantes de historial ===== */
const HISTORY_KEY = "fe_search_history";
const MAX_HISTORY = 6;
const POPULAR_SEARCHES = ["Taladro", "Cemento", "Pintura", "Cable", "Tubería", "Tornillos"];

const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveToHistory = (term) => {
  if (!term?.trim()) return;
  const prev = getHistory().filter((h) => h.toLowerCase() !== term.toLowerCase());
  const next = [term.trim(), ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
};

const removeFromHistory = (term) => {
  const next = getHistory().filter((h) => h !== term);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
};

/* ====================================================== */

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

  const pathname = location.pathname;
  const hideNavbarRoutes = ["/forgot-password", "/verify-reset", "/reset-password"];
  const hideNavbar = hideNavbarRoutes.includes(pathname);

  const isDesktopLarge = useBreakpointValue({ base: false, lg: true });
  const showDesktopNav = !!isDesktopLarge;
  const useDrawerNav = !showDesktopNav;
  const hideOnScroll = useBreakpointValue({ base: true, md: true, lg: false });

  const isActive = (to) => {
    if (to === "/Home") return pathname === "/Home" || pathname === "/";
    return pathname === to || pathname.startsWith(to + "/");
  };

  /* ===== BUSCADOR ===== */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Cargar historial al montar
  useEffect(() => { setSearchHistory(getHistory()); }, []);

  const handleSearchSubmit = useCallback((term) => {
    const q = (term ?? search).trim();
    if (!q) return;
    saveToHistory(q);
    setSearchHistory(getHistory());
    setShowSuggestions(false);
    setSearch("");
    navigate(`/Home?search=${encodeURIComponent(q)}`);
  }, [search, navigate]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearchSubmit();
  };

  const handleRemoveHistory = (e, term) => {
    e.stopPropagation();
    removeFromHistory(term);
    setSearchHistory(getHistory());
  };

  const clearAllHistory = (e) => {
    e.stopPropagation();
    localStorage.removeItem(HISTORY_KEY);
    setSearchHistory([]);
  };

  /* Atajos teclado */
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
        else setShowSuggestions(true); // mostrar historial/populares al abrir con /
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

  /* Click fuera */
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

  /* Debounce */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* API sugerencias */
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    api
      .get("/productos", { params: { search: debouncedSearch, limit: 8, page: 1 } })
      .then((res) => { if (!cancelled) setSearchResults(res.data?.productos || []); })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const handleSelectProduct = (producto) => {
    setShowSuggestions(false);
    setSearch("");
    if (producto?.id) navigate(`/producto/${producto.id}`);
  };

  const hasQuery = debouncedSearch.length >= 2;
  const hasResults = searchResults.length > 0;
  const showHistoryPanel = !hasQuery && showSuggestions;
  const showResultsPanel = hasQuery && showSuggestions;

  /* ===== HEADER HIDE ON SCROLL ===== */
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const hideHeaderRef = useRef(false);

  useLayoutEffect(() => {
    if (hideNavbar) return;
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.getBoundingClientRect().height || 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [hideNavbar]);

  useEffect(() => {
    if (hideNavbar || !hideOnScroll) {
      hideHeaderRef.current = false;
      setHideHeader(false);
      return;
    }
    let lastY = window.scrollY || 0;
    let ticking = false;
    const THRESHOLD = Math.max(90, headerH + 12);
    const DELTA = 10;

    const onScroll = () => {
      if (isOpen || showSuggestions) return;
      if (document.activeElement === searchInputRef.current) return;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        const diff = y - lastY;
        let next = hideHeaderRef.current;
        if (y < 10) next = false;
        else if (diff > DELTA && y > THRESHOLD) next = true;
        else if (diff < -DELTA) next = false;
        if (next !== hideHeaderRef.current) {
          hideHeaderRef.current = next;
          setHideHeader(next);
          if (next) setShowSuggestions(false);
        }
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideNavbar, hideOnScroll, headerH, isOpen, showSuggestions]);

  const headerShadow = "0 3px 14px rgba(0,0,0,0.25)";
  const effectiveHeaderH = hideNavbar ? 0 : headerH;

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

  const logoH = useBreakpointValue({ base: "28px", sm: "30px", md: "34px", lg: "36px", "2xl": "40px" });
  const searchH = useBreakpointValue({ base: "40px", md: "44px", lg: "44px", "2xl": "46px" });
  const searchFont = useBreakpointValue({ base: "sm", md: "md" });

  /* ===== Redes sociales (sin X hasta tener cuenta real) ===== */
  const socials = [
    {
      Icon: FaWhatsapp,
      label: "WhatsApp",
      color: "#25D366",
      url: "https://wa.me/message/YJTPSMKGHFBAH1",
    },
    {
      Icon: FaInstagram,
      label: "Instagram",
      color: "#E4405F",
      url: "https://www.instagram.com/ferreexpress.sas?igsh=MXVkMWNwbTVpZGRrZg==",
    },
    {
      Icon: FaFacebook,
      label: "Facebook",
      color: "#1877F2",
      url: "https://www.facebook.com/profile.php?id=61569576237043",
    },
    // Añade X aquí cuando tengas la cuenta: { Icon: FaXTwitter, label: "X", color: "#000", url: "https://x.com/tu_cuenta" }
  ];

  return (
    <Box bg={bgPage} minH="100dvh">

      {/* ===== HEADER ===== */}
      {!hideNavbar && (
        <MotionBox
          as="header"
          ref={headerRef}
          position="fixed"
          top={0} left={0} right={0}
          zIndex="overlay"
          bg={headerBg}
          borderBottom="1px solid"
          borderColor={borderColor}
          boxShadow={headerShadow}
          animate={{ y: hideOnScroll && hideHeader ? -effectiveHeaderH : 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ willChange: "transform", pointerEvents: hideOnScroll && hideHeader ? "none" : "auto" }}
        >
          <VisuallyHidden as="a" href="#main">Saltar al contenido</VisuallyHidden>

          <Container maxW="7xl" px={{ base: 3, sm: 4, md: 5, lg: 6, "2xl": 8 }} py={{ base: 2, md: 3 }}>

            {/* FILA 1 — Logo + acciones móvil */}
            <Flex align="center" justify="space-between" gap={{ base: 2, md: 4 }}>
              <CLink as={RouterLink} to="/Home" _hover={{ opacity: 0.9 }} aria-label="Ir al inicio">
                <Image
                  src="/LOGOFERREEXPRESS.jpg"
                  alt="FerreExpress S.A.S."
                  h={logoH}
                  objectFit="contain"
                />
              </CLink>

              <HStack spacing={2}>
                {useDrawerNav && (
                  <>
                    <Tooltip label="Carrito" hasArrow>
                      <IconButton
                        as={RouterLink}
                        to="/Login"
                        aria-label="Ir al carrito"
                        variant="ghost"
                        color="gray.900"
                        icon={<FiShoppingCart />}
                      />
                    </Tooltip>
                    <IconButton
                      aria-label="Abrir menú de navegación"
                      icon={<FiMenu />}
                      variant="ghost"
                      color="gray.900"
                      onClick={() => { setShowSuggestions(false); onOpen(); }}
                    />
                  </>
                )}
              </HStack>
            </Flex>

            {/* FILA 2 — Buscador */}
            <Box mt={{ base: 2, md: 3 }} position="relative">
              <Box as="form" onSubmit={handleFormSubmit} role="search" aria-label="Buscar productos">
                <InputGroup>
                  <InputLeftElement pointerEvents="none" h="100%" pl="3">
                    <FiSearch color="gray.400" aria-hidden="true" />
                  </InputLeftElement>

                  <Input
                    id="fe-search"
                    ref={searchInputRef}
                    bg="white"
                    borderColor="gray.200"
                    _hover={{ borderColor: "gray.300" }}
                    _focus={{ borderColor: "gray.500", boxShadow: "0 0 0 3px rgba(51,65,85,0.4)" }}
                    rounded="full"
                    h={searchH}
                    pl="44px"
                    pr={{ base: "64px", md: "84px", "2xl": "120px" }}
                    fontSize={searchFont}
                    placeholder="Buscar productos, marcas o códigos…"
                    aria-label="Buscar productos en FerreExpress"
                    aria-autocomplete="list"
                    aria-controls="search-suggestions"
                    aria-expanded={showSuggestions}
                    value={search}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearch(v);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                  />

                  <InputRightElement width="auto" pr={3} h="100%">
                    <HStack spacing={2}>
                      {showDesktopNav && search.trim() === "" && (
                        <HStack spacing={1} color="gray.600" fontSize="xs" pr={2}>
                          <Text>Atajo</Text>
                          <Kbd>/</Kbd>
                        </HStack>
                      )}
                      {search.trim() !== "" && (
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Limpiar búsqueda"
                            icon={<FiX />}
                            size="sm"
                            variant="ghost"
                            color="gray.500"
                            onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
                          />
                          <IconButton
                            aria-label="Buscar"
                            icon={<FiSearch />}
                            size="sm"
                            variant="ghost"
                            color="gray.600"
                            _hover={{ color: "yellow.700", bg: "yellow.50" }}
                            type="submit"
                          />
                        </HStack>
                      )}
                    </HStack>
                  </InputRightElement>
                </InputGroup>
              </Box>

              {/* Panel de sugerencias / historial */}
              <AnimatePresence>
                {showSuggestions && (showHistoryPanel || showResultsPanel) && (
                  <MotionBox
                    id="search-suggestions"
                    role="listbox"
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
                    maxH={{ base: "60vh", md: "400px" }}
                    overflowY="auto"
                    overscrollBehavior="contain"
                  >

                    {/* ---- Panel historial / búsquedas populares (sin query) ---- */}
                    {showHistoryPanel && (
                      <Box p={3}>
                        {searchHistory.length > 0 && (
                          <>
                            <Flex align="center" justify="space-between" mb={2}>
                              <HStack spacing={1} color={muted} fontSize="xs">
                                <FiClock size={12} />
                                <Text fontWeight="medium">Búsquedas recientes</Text>
                              </HStack>
                              <Button
                                size="xs"
                                variant="ghost"
                                color={muted}
                                onClick={clearAllHistory}
                                fontSize="xs"
                              >
                                Borrar todo
                              </Button>
                            </Flex>
                            <Stack spacing={1} mb={3}>
                              {searchHistory.map((term) => (
                                <Flex
                                  key={term}
                                  as="button"
                                  type="button"
                                  role="option"
                                  align="center"
                                  justify="space-between"
                                  px={2}
                                  py={1.5}
                                  borderRadius="md"
                                  _hover={{ bg: panelSubtleBg }}
                                  onClick={() => handleSearchSubmit(term)}
                                  w="100%"
                                >
                                  <HStack spacing={2}>
                                    <Box color={muted}><FiClock size={13} /></Box>
                                    <Text fontSize="sm">{term}</Text>
                                  </HStack>
                                  <IconButton
                                    aria-label={`Eliminar ${term} del historial`}
                                    icon={<FiX />}
                                    size="xs"
                                    variant="ghost"
                                    color={muted}
                                    onClick={(e) => handleRemoveHistory(e, term)}
                                    minW="auto"
                                    h="auto"
                                    p={1}
                                  />
                                </Flex>
                              ))}
                            </Stack>
                            <Divider mb={3} />
                          </>
                        )}

                        <HStack spacing={1} color={muted} fontSize="xs" mb={2}>
                          <FiTrendingUp size={12} />
                          <Text fontWeight="medium">Búsquedas populares</Text>
                        </HStack>
                        <Flex gap={2} flexWrap="wrap">
                          {POPULAR_SEARCHES.map((term) => (
                            <Button
                              key={term}
                              size="xs"
                              variant="outline"
                              borderRadius="full"
                              onClick={() => handleSearchSubmit(term)}
                              _hover={{ bg: "yellow.50", borderColor: "yellow.400" }}
                            >
                              {term}
                            </Button>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {/* ---- Panel resultados (con query) ---- */}
                    {showResultsPanel && (
                      <>
                        {searchLoading && (
                          <HStack px={4} py={3} spacing={3}>
                            <Spinner size="sm" />
                            <Text fontSize="sm" color={muted}>Buscando productos…</Text>
                          </HStack>
                        )}

                        {!searchLoading && hasQuery && !hasResults && (
                          <Box px={4} py={3}>
                            <Text fontSize="sm" color={muted}>
                              Sin resultados para{" "}
                              <Text as="span" fontWeight="semibold">"{debouncedSearch}"</Text>.
                            </Text>
                            <Text fontSize="xs" color={muted} mt={1}>
                              Intenta con: {POPULAR_SEARCHES.slice(0, 3).join(", ")}
                            </Text>
                          </Box>
                        )}

                        {!searchLoading && hasResults && (
                          <Stack spacing={1} p={2}>
                            {searchResults.map((p) => {
                              const img = p.imagen_principal
                                ? `${API_BASE_URL}${p.imagen_principal}`
                                : "/img/sin-imagen.png";
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
                                  role="option"
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
                                        w="100%" h="100%"
                                        objectFit="contain"
                                        fallbackSrc="/img/sin-imagen.png"
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
                                          <Badge variant="subtle" colorScheme="yellow" fontSize="0.65rem">
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

                        {/* Ver todos los resultados */}
                        {!searchLoading && hasResults && (
                          <Box
                            px={4}
                            py={2}
                            borderTop="1px solid"
                            borderColor={borderColor}
                            bg={panelSubtleBg}
                          >
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="yellow"
                              onClick={() => handleSearchSubmit()}
                              w="100%"
                            >
                              Ver todos los resultados de "{debouncedSearch}"
                            </Button>
                          </Box>
                        )}

                        {/* Pie del panel en desktop */}
                        <Box
                          px={4}
                          py={2}
                          borderTop="1px solid"
                          borderColor={borderColor}
                          bg={panelSubtleBg}
                          fontSize="xs"
                          color={muted}
                          display={{ base: "none", "2xl": "flex" }}
                          alignItems="center"
                          gap={2}
                        >
                          <Text>Buscar</Text>
                          <Kbd>Enter</Kbd>
                          <Text>• Cerrar</Text>
                          <Kbd>Esc</Kbd>
                        </Box>
                      </>
                    )}
                  </MotionBox>
                )}
              </AnimatePresence>
            </Box>

            {/* FILA 3 — Nav desktop */}
            {showDesktopNav && (
              <Box mt={3}>
                <Divider borderColor="blackAlpha.200" mb={2} opacity={0.5} />
                <Flex mt={1} align="center" justify="space-between" gap={4} wrap="nowrap">
                  <Flex as="nav" aria-label="Navegación principal" align="center" gap={2} pb={1}>
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
                  <Flex as="nav" aria-label="Navegación de cuenta" align="center" gap={2} pb={1}>
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
            )}
          </Container>
        </MotionBox>
      )}

      {/* ===== DRAWER móvil/tablet ===== */}
      <Drawer
        isOpen={useDrawerNav ? isOpen : false}
        onClose={onClose}
        placement="right"
        size={{ base: "full", sm: "sm" }}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton aria-label="Cerrar menú" />
          <DrawerHeader>
            <Image src="/LOGOFERREEXPRESS.jpg" alt="FerreExpress" h="32px" objectFit="contain" />
          </DrawerHeader>
          <DrawerBody>
            <Stack spacing={5}>
              <Box>
                <Text fontSize="xs" textTransform="uppercase" fontWeight="semibold" color="gray.500" mb={2}>
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

              <Divider />

              <Box>
                <Text fontSize="xs" textTransform="uppercase" fontWeight="semibold" color="gray.500" mb={2}>
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

              <Divider />

              {/* Búsquedas populares en el drawer */}
              <Box>
                <Text fontSize="xs" textTransform="uppercase" fontWeight="semibold" color="gray.500" mb={2}>
                  Búsquedas populares
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {POPULAR_SEARCHES.map((term) => (
                    <Button
                      key={term}
                      size="xs"
                      variant="outline"
                      borderRadius="full"
                      onClick={() => {
                        onClose();
                        handleSearchSubmit(term);
                      }}
                      _hover={{ bg: "yellow.50", borderColor: "yellow.400" }}
                    >
                      {term}
                    </Button>
                  ))}
                </Flex>
              </Box>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ===== Contenido principal ===== */}
      <MotionBox
        style={{
          paddingTop: effectiveHeaderH,
          minHeight: `calc(100dvh + ${effectiveHeaderH}px)`,
          willChange: "transform",
        }}
        animate={{ y: hideOnScroll && hideHeader ? -effectiveHeaderH : 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        display="flex"
        flexDirection="column"
      >
        <Box as="main" id="main" flex="1" bg={bgPage} px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
          <Container maxW="7xl">
            <Outlet />
          </Container>
        </Box>

        {/* ===== FOOTER ===== */}
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
          <Container maxW={{ base: "100%", md: "95%", lg: "8xl" }} px={{ base: 4, md: 6, lg: 8 }}>
            <Grid
              templateColumns={{ base: "1fr", md: "1fr auto 1fr" }}
              alignItems="center"
              gap={{ base: 6, md: 8 }}
            >
              {/* Logo */}
              <HStack justify={{ base: "center", md: "flex-start" }}>
                <Image
                  src="/LOGOFERREEXPRESS.png"
                  alt="FerreExpress S.A.S."
                  h={{ base: "36px", sm: "42px", md: "48px" }}
                  objectFit="contain"
                  transition="transform 0.2s"
                  _hover={{ transform: "scale(1.06)" }}
                />
              </HStack>

              {/* Links legales */}
              <HStack
                spacing={{ base: 6, md: 10 }}
                justify="center"
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="medium"
              >
                <CLink
                  as={RouterLink}
                  to="/condiciones-uso"
                  color="blue.600"
                  _hover={{ color: "blue.700", textDecoration: "underline" }}
                >
                  Condiciones de uso
                </CLink>
                <CLink
                  as={RouterLink}
                  to="/avisos-privacidad"
                  color="blue.600"
                  _hover={{ color: "blue.700", textDecoration: "underline" }}
                >
                  Política de privacidad
                </CLink>
              </HStack>

              {/* Redes sociales */}
              <HStack spacing={{ base: 5, md: 6 }} justify={{ base: "center", md: "flex-end" }}>
                {socials.map((social) => (
                  <MotionBox key={social.label} whileHover={{ scale: 1.22 }} whileTap={{ scale: 0.92 }}>
                    <IconButton
                      as="a"
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visitar FerreExpress en ${social.label}`}
                      icon={<social.Icon size={24} />}
                      variant="ghost"
                      color={muted}
                      _hover={{ color: social.color, bg: "blackAlpha.100" }}
                      rounded="full"
                    />
                  </MotionBox>
                ))}
              </HStack>

              {/* Copyright */}
              <GridItem colSpan={{ base: 1, md: 3 }} mt={{ base: 6, md: 8 }}>
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  color={muted}
                  textAlign="center"
                  fontWeight="medium"
                >
                  © {new Date().getFullYear()} FerreExpress® • Todos los derechos reservados
                </Text>
              </GridItem>
            </Grid>
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
}

/* ===== PublicNavItem ===== */
function PublicNavItem({ to, icon: Icon, label, active, navInactive, navActiveBg, navActiveColor }) {
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
    >
      <Icon size={16} aria-hidden="true" />
      <Text fontSize="sm" fontWeight={active ? "semibold" : "normal"} noOfLines={1}>
        {label}
      </Text>
    </HStack>
  );
}