// src/layouts/ClienteLayout.jsx
import {
  Outlet,
  Link as RouterLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
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
  Collapse,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Stack,
  useDisclosure,
  Spinner,
  Badge,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import {
  FiHome,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiLogOut,
  FiSearch,
  FiInfo,
  FiMapPin,
  FiMenu,
  FiBell,
} from "react-icons/fi";
import { FaWhatsapp, FaInstagram, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api, { API_BASE_URL } from "../utils/axiosInstance";
import { cartCountSkus, onCartChanged } from "../utils/cartStore";

const MotionBox = motion(Box);

export default function ClienteLayout() {
  const { user, logout } = useAuth();
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
  const panelBg = useColorModeValue("white", "gray.800");
  const panelSubtleBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const muted = useColorModeValue("gray.600", "gray.300");

  const isMobile = useBreakpointValue({ base: true, md: false });
  const pathname = location.pathname;

  const isActive = (to) => {
    if (to === "/cliente") return pathname === "/cliente" || pathname === "/cliente/";
    return pathname === to || pathname.startsWith(to + "/");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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

  useEffect(() => {
    const onKey = (e) => {
      const input = searchInputRef.current;
      if (!input) return;

      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        input.focus();
        setShowSuggestions((prev) => prev || search.trim().length >= 2);
      }

      if (e.key === "Escape" && document.activeElement === input) {
        input.value = "";
        setSearch("");
        setShowSuggestions(false);
        input.blur();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!showSuggestions) return;

      if (searchInputRef.current && searchInputRef.current.contains(e.target)) return;
      if (suggestionsRef.current && suggestionsRef.current.contains(e.target)) return;

      setShowSuggestions(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

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
      .then((res) => {
        if (!cancelled) setSearchResults(res.data?.productos || []);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error al buscar productos:", err);
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
    if (!producto?.id) return;
    navigate(`/cliente/producto/${producto.id}`);
  };

  const hasQuery = debouncedSearch.length >= 2;
  const hasResults = searchResults && searchResults.length > 0;

  // ================== NOTIFICACIONES (AUTO-REFRESH) ==================
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const notifInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNotificaciones = async ({ silent = false } = {}) => {
    if (!user?.token) return;
    if (notifInFlightRef.current) return;

    notifInFlightRef.current = true;
    try {
      if (!silent) setNotifLoading(true);

      const res = await api.get("/notificaciones", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (mountedRef.current) {
        setNotificaciones(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      // Si falla en background, no “ensucies” UI; solo log
      console.error("Error al cargar notificaciones:", error);
    } finally {
      if (mountedRef.current && !silent) setNotifLoading(false);
      notifInFlightRef.current = false;
    }
  };

  // ✅ Auto refresco: inicial + polling + focus/visibility
  useEffect(() => {
    if (!user?.token) return;

    const NOTIF_POLL_MS = 30000; // <-- AJUSTA AQUÍ
    fetchNotificaciones({ silent: true }); // initial badge load

    const id = setInterval(() => {
      fetchNotificaciones({ silent: true });
    }, NOTIF_POLL_MS);

    const onFocus = () => fetchNotificaciones({ silent: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchNotificaciones({ silent: true });
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.token]);

  const unreadCount = useMemo(
    () => notificaciones.filter((n) => !n.leido).length,
    [notificaciones]
  );

  const handleNotificacionClick = async (notif) => {
    try {
      if (!user?.token) return;

      if (!notif.leido) {
        await api.put(
          `/notificaciones/${notif.id}/leida`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        setNotificaciones((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: 1 } : n))
        );
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  // ================== NAV ==================
  const userDisplayName = user?.username || "Usuario FerreExpress";
  const userEmail = user?.email || "usuario@ferreexpress.com";

  const navLeft = [
    { to: "/cliente", label: "Inicio", icon: FiHome },
    { to: "/cliente/about", label: "Acerca de", icon: FiInfo },
    { to: "/cliente/puntos-fisicos", label: "Puntos físicos", icon: FiMapPin },
  ];

  const navRight = [
    { to: "/cliente/pedidos", label: "Mis pedidos", icon: FiTruck },
    { to: "/cliente/carrito", label: "Carrito", icon: FiShoppingCart },
    { to: "/cliente/perfil", label: "Mi perfil", icon: FiUser },
  ];

  const headerShadow = useMemo(() => "0 3px 14px rgba(0,0,0,0.25)", []);

  // ================== CARRITO ==================
  const [cartSkus, setCartSkus] = useState(() => cartCountSkus());
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    setCartSkus(cartCountSkus());

    const unsubscribe = onCartChanged((detail) => {
      setCartSkus(typeof detail.skus === "number" ? detail.skus : cartCountSkus());

      if (detail.lastAction === "add" && detail.addedUnits > 0) {
        setCartBump(true);
        setTimeout(() => setCartBump(false), 220);
      }
    });

    return unsubscribe;
  }, []);

  // ================== HEADER MÓVIL COMPACTO (SCROLL) ==================
  const [compactHeader, setCompactHeader] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    if (!isMobile) {
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
          const goingDown = diff > DELTA;
          const goingUp = diff < -DELTA;

          if (goingDown && y > MIN_Y_TO_COLLAPSE) setCompactHeader(true);
          if (goingUp) setCompactHeader(false);
        }

        lastScrollYRef.current = y;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  return (
    <Box minH="100vh" bg={bgPage} display="flex" flexDirection="column">
      {/* ===== HEADER CLIENTE ===== */}
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
        <Container maxW="7xl" px={{ base: 3, md: 5 }} py={{ base: 2, md: 3 }}>
          {/* FILA 1 (MOBILE: se oculta al bajar) */}
          <Collapse in={!isMobile || !compactHeader} animateOpacity unmountOnExit>
            <Flex align="center" justify="space-between" gap={{ base: 2, md: 4 }} wrap="nowrap">
              <HStack spacing={3} minW={0}>
                <Image
                  src="/LOGOFERREEXPRESS.jpg"
                  alt="FerreExpress S.A.S."
                  h={{ base: "32px", md: "40px" }}
                  objectFit="contain"
                />
              </HStack>

              <HStack spacing={3}>
                {isMobile ? (
                  <>
                    {/* Carrito móvil */}
                    <Box position="relative">
                      <Tooltip label="Carrito" hasArrow>
                        <IconButton
                          aria-label="Carrito"
                          variant="ghost"
                          color="gray.900"
                          onClick={() => navigate("/cliente/carrito")}
                          icon={
                            <MotionBox
                              display="inline-flex"
                              animate={cartBump ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                              transition={{ duration: 0.25 }}
                            >
                              <FiShoppingCart />
                            </MotionBox>
                          }
                        />
                      </Tooltip>
                      {cartSkus > 0 && (
                        <Box
                          position="absolute"
                          top="2px"
                          right="2px"
                          bg="red.500"
                          color="white"
                          borderRadius="full"
                          minW="16px"
                          h="16px"
                          px={0.5}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="0.65rem"
                          fontWeight="bold"
                          lineHeight="1"
                        >
                          {cartSkus > 9 ? "9+" : cartSkus}
                        </Box>
                      )}
                    </Box>

                    {/* Campanita móvil */}
                    <Popover
                      placement="bottom-end"
                      onOpen={() => fetchNotificaciones({ silent: false })}
                      closeOnBlur
                    >
                      <PopoverTrigger>
                        <Box position="relative">
                          <Tooltip label="Notificaciones" hasArrow>
                            <IconButton
                              aria-label="Notificaciones"
                              icon={<FiBell />}
                              variant="ghost"
                              color="gray.900"
                            />
                          </Tooltip>
                          {unreadCount > 0 && (
                            <Box
                              position="absolute"
                              top="2px"
                              right="2px"
                              bg="red.500"
                              color="white"
                              borderRadius="full"
                              minW="16px"
                              h="16px"
                              px={0.5}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="0.65rem"
                              fontWeight="bold"
                              lineHeight="1"
                            >
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Box>
                          )}
                        </Box>
                      </PopoverTrigger>
                      {renderNotificationsPanel({
                        notifLoading,
                        notificaciones,
                        fetchNotificaciones: () => fetchNotificaciones({ silent: false }),
                        handleNotificacionClick,
                        borderColor,
                      })}
                    </Popover>

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

          {/* FILA 2: Buscador (siempre visible) */}
          <Box mt={{ base: compactHeader ? 0 : 2, md: 3 }} position="relative">
            <Box as="form" onSubmit={handleSearchSubmit}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="100%" pl="3">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  id="cliente-search"
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
                  pr="96px"
                  fontSize={{ base: "sm", md: "sm" }}
                  placeholder="Buscar productos, marcas o códigos…"
                  aria-label="Buscar productos en FerreExpress"
                  value={search}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearch(value);
                    setShowSuggestions(value.trim().length >= 2);
                  }}
                  onFocus={() => {
                    if (search.trim().length >= 2) setShowSuggestions(true);
                  }}
                />
                <InputRightElement width="88px" h="100%" pr="3" justifyContent="flex-end">
                  {!isMobile && (
                    <HStack spacing={2} color="gray.700" fontSize="xs">
                      <Text>Atajo</Text>
                      <Kbd>/</Kbd>
                    </HStack>
                  )}
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
                                <Image src={img} alt={p.nombre} w="100%" h="100%" objectFit="contain" />
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

          {/* FILA 3: DESKTOP */}
          <Box mt={{ base: 0, md: 3 }} display={{ base: "none", md: "block" }}>
            <Divider borderColor="blackAlpha.200" mb={2} opacity={0.5} />
            <Flex mt={1} align="center" justify="space-between" gap={4} wrap="nowrap">
              <Flex
                as="nav"
                align="center"
                gap={2}
                overflowX="auto"
                pb={1}
                sx={{ "::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
              >
                {navLeft.map((item) => (
                  <ClienteNavItem
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
                sx={{ "::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
              >
                <ClienteNavItem
                  to={navRight[0].to}
                  icon={navRight[0].icon}
                  label={navRight[0].label}
                  active={isActive(navRight[0].to)}
                  navInactive={navInactive}
                  navActiveBg={navActiveBg}
                  navActiveColor={navActiveColor}
                />

                <ClienteNavItem
                  to={navRight[1].to}
                  icon={navRight[1].icon}
                  label={navRight[1].label}
                  active={isActive(navRight[1].to)}
                  navInactive={navInactive}
                  navActiveBg={navActiveBg}
                  navActiveColor={navActiveColor}
                  badgeValue={cartSkus}
                  isCart
                  bump={cartBump}
                />

                <Popover
                  placement="bottom-end"
                  onOpen={() => fetchNotificaciones({ silent: false })}
                  closeOnBlur
                >
                  <PopoverTrigger>
                    <Box position="relative">
                      <Tooltip label="Notificaciones" hasArrow>
                        <IconButton
                          aria-label="Notificaciones"
                          icon={<FiBell />}
                          size="sm"
                          variant="ghost"
                          color="gray.900"
                        />
                      </Tooltip>
                      {unreadCount > 0 && (
                        <Box
                          position="absolute"
                          top="-2px"
                          right="-2px"
                          bg="red.500"
                          color="white"
                          borderRadius="full"
                          minW="14px"
                          h="14px"
                          px={0.5}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="0.6rem"
                          fontWeight="bold"
                          lineHeight="1"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Box>
                      )}
                    </Box>
                  </PopoverTrigger>
                  {renderNotificationsPanel({
                    notifLoading,
                    notificaciones,
                    fetchNotificaciones: () => fetchNotificaciones({ silent: false }),
                    handleNotificacionClick,
                    borderColor,
                  })}
                </Popover>

                <Popover placement="bottom-end">
                  <PopoverTrigger>
                    <HStack
                      as="button"
                      spacing={1}
                      px={2.5}
                      py={1.5}
                      borderRadius="full"
                      bg={isActive("/cliente/perfil") ? navActiveBg : "transparent"}
                      color={navInactive}
                      _hover={{
                        textDecoration: "none",
                        bg: "whiteAlpha.800",
                        transform: "translateY(-1px)",
                      }}
                      transition="background 0.15s ease, transform 0.12s ease"
                      flexShrink={0}
                    >
                      <FiUser size={14} />
                      <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                        {userDisplayName}
                      </Text>
                    </HStack>
                  </PopoverTrigger>

                  <PopoverContent
                    w="190px"
                    p={0.5}
                    bg={navActiveBg}
                    borderRadius="lg"
                    boxShadow="xl"
                    borderColor={borderColor}
                    _focus={{ boxShadow: "xl" }}
                  >
                    <VStack spacing={0} align="stretch">
                      <Box px={3} py={2} mb={1}>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                          {userDisplayName}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {userEmail}
                        </Text>
                      </Box>

                      <Divider my={1} borderColor={borderColor} />

                      <Button
                        size="sm"
                        variant="ghost"
                        justifyContent="flex-start"
                        leftIcon={<FiUser />}
                        onClick={() => navigate("/cliente/perfil")}
                        color={navInactive}
                        _hover={{ bg: panelSubtleBg, color: "gray.900" }}
                        borderRadius="md"
                        fontSize="sm"
                      >
                        Mi Perfil
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        justifyContent="flex-start"
                        leftIcon={<FiLogOut />}
                        onClick={handleLogout}
                        color="red.500"
                        _hover={{ bg: "red.50", color: "red.600" }}
                        borderRadius="md"
                        fontSize="sm"
                      >
                        Cerrar Sesión
                      </Button>
                    </VStack>
                  </PopoverContent>
                </Popover>
              </Flex>
            </Flex>
          </Box>
        </Container>
      </Box>

      {/* ===== DRAWER MOBILE ===== */}
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
                  {navRight.map((item) => (
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

              <Button
                leftIcon={<FiLogOut />}
                justifyContent="flex-start"
                variant="outline"
                colorScheme="red"
                size="sm"
                onClick={() => {
                  onClose();
                  handleLogout();
                }}
              >
                <Text fontSize="sm">Cerrar sesión</Text>
              </Button>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ===== CONTENIDO ===== */}
      <Box as="main" flex="1" bg={bgPage} px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }}>
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

            <HStack spacing={{ base: 6, md: 10 }} justify="center" fontSize={{ base: "sm", md: "md" }} fontWeight="medium">
              <Button
                as={RouterLink}
                to="condiciones-uso-cliente"   // ← sin barra inicial
                variant="link"
                color="blue.600"
                _hover={{ color: "blue.700" }}
              >
                Condiciones de uso
              </Button>
              <Button
                as={RouterLink}
                to="avisos-privacidad-cliente" // ← sin barra inicial
                variant="link"
                color="blue.600"
                _hover={{ color: "blue.700" }}
              >
                Avisos de privacidad
              </Button>
            </HStack>

            <HStack spacing={{ base: 5, md: 6 }} justify={{ base: "center", md: "flex-end" }}>
              {[
                { Icon: FaWhatsapp, label: "WhatsApp", color: "#25D366" },
                { Icon: FaInstagram, label: "Instagram", color: "#E4405F" },
                { Icon: FaFacebook, label: "Facebook", color: "#1877F2" },
                { Icon: FaXTwitter, label: "X", color: "#000000" },
              ].map((social) => (
                <MotionBox key={social.label} whileHover={{ scale: 1.22 }} whileTap={{ scale: 0.92 }}>
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
              <Text fontSize={{ base: "xs", md: "sm" }} color={muted} textAlign="center" fontWeight="medium">
                © {new Date().getFullYear()} FerreExpress® • Todos los derechos reservados
              </Text>
            </GridItem>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

/* ===== Item navegación desktop ===== */
function ClienteNavItem({
  to,
  icon: Icon,
  label,
  active,
  navInactive,
  navActiveBg,
  navActiveColor,
  badgeValue = 0,
  isCart,
  bump,
}) {
  const iconNode = isCart ? (
    <MotionBox
      display="inline-flex"
      animate={bump ? { scale: [1, 1.18, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Icon size={16} />
    </MotionBox>
  ) : (
    <Icon size={16} />
  );

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
        {iconNode}
        {badgeValue > 0 && (
          <Box
            position="absolute"
            top="-6px"
            right="-8px"
            bg="red.500"
            color="white"
            borderRadius="full"
            minW="14px"
            h="14px"
            px={0.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="0.6rem"
            fontWeight="bold"
            lineHeight="1"
          >
            {badgeValue > 9 ? "9+" : badgeValue}
          </Box>
        )}
      </Box>
      <Text fontSize="sm" fontWeight={active ? "semibold" : "normal"} noOfLines={1}>
        {label}
      </Text>
    </HStack>
  );
}

/* ===== Panel notificaciones ===== */
function renderNotificationsPanel({
  notifLoading,
  notificaciones,
  fetchNotificaciones,
  handleNotificacionClick,
  borderColor,
}) {
  return (
    <PopoverContent
      w={{ base: "92vw", md: "360px" }}
      maxH="60vh"
      overflowY="auto"
      _focus={{ boxShadow: "lg" }}
    >
      <Box px={3} py={2} borderBottom="1px solid" borderColor={borderColor} bg="whiteAlpha.900">
        <HStack justify="space-between">
          <Text fontWeight="semibold" fontSize="sm">
            Notificaciones
          </Text>
          <Button size="xs" variant="outline" onClick={fetchNotificaciones}>
            Actualizar
          </Button>
        </HStack>
      </Box>

      <Box p={3}>
        {notifLoading ? (
          <HStack spacing={3}>
            <Spinner size="sm" />
            <Text fontSize="sm">Cargando notificaciones…</Text>
          </HStack>
        ) : notificaciones.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            No tienes notificaciones por el momento.
          </Text>
        ) : (
          <Stack spacing={2}>
            {notificaciones.map((n) => (
              <Box
                key={n.id}
                borderRadius="md"
                border="1px solid"
                borderColor={n.leido ? "gray.200" : "yellow.400"}
                bg={n.leido ? "white" : "yellow.50"}
                _hover={{ bg: n.leido ? "gray.50" : "yellow.100" }}
                px={3}
                py={2}
                cursor="pointer"
                onClick={() => handleNotificacionClick(n)}
              >
                <HStack justify="space-between" align="flex-start">
                  <VStack align="flex-start" spacing={0.5}>
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {n.titulo}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {n.mensaje}
                    </Text>
                  </VStack>
                  {!n.leido && (
                    <Badge colorScheme="yellow" fontSize="0.6rem">
                      Nuevo
                    </Badge>
                  )}
                </HStack>

                {n.fecha && (
                  <Text mt={1} fontSize="xs" color="gray.500">
                    {new Date(n.fecha).toLocaleString("es-CO")}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </PopoverContent>
  );
}
