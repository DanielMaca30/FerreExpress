// src/layouts/EmpresaLayout.jsx
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
  FiBriefcase,
  FiFileText,
} from "react-icons/fi";
import { FaWhatsapp, FaInstagram, FaFacebook, FaXTwitter } from "react-icons/fa6";
import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api, { API_BASE_URL } from "../utils/axiosInstance";
import { cartCountSkus, onCartChanged } from "../utils/cartStore";

const MotionBox = motion(Box);

export default function EmpresaLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const disclosure = useDisclosure();
  const { isOpen, onOpen, onClose } = disclosure;

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

  const pathname = location.pathname;
  const basePath = "/empresa";

  // ✅ Nav completa en PC (lg+). Drawer en móvil/tablet.
  const showDesktopNav = useBreakpointValue({ base: false, lg: true });
  const useDrawerNav = !showDesktopNav;

  // ✅ Ocultar header SOLO en móvil/tablet (base/md). NO en PC.
  const hideOnScroll = useBreakpointValue({ base: true, md: true, lg: false });

  const isActive = (to) => {
    if (to === basePath) return pathname === basePath || pathname === `${basePath}/`;
    return pathname === to || pathname.startsWith(to + "/");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ===== Búsqueda y sugerencias =====
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
    // Si prefieres que SIEMPRE vaya al catálogo:
    // navigate(`${basePath}/catalogo?search=${encodeURIComponent(term)}`);
    navigate(`${basePath}?search=${encodeURIComponent(term)}`);
  };

  // Atajo "/" y "Esc"
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
        setSearch("");
        setShowSuggestions(false);
        input.blur();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [search]);

  // Click fuera cierra sugerencias
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

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  // Sugerencias desde backend
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
        if (!cancelled) console.error("Error al buscar productos (empresa):", err);
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
    navigate(`${basePath}/producto/${producto.id}`);
  };

  const hasQuery = debouncedSearch.length >= 2;
  const hasResults = Array.isArray(searchResults) && searchResults.length > 0;

  // ===== Notificaciones =====
  const [notificaciones, setNotificaciones] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifInFlightRef = useRef(false);

  const fetchNotificaciones = useCallback(
    async ({ silent = false } = {}) => {
      if (notifInFlightRef.current) return;
      if (!user?.token) return;

      notifInFlightRef.current = true;
      if (!silent) setNotifLoading(true);

      try {
        const res = await api.get("/notificaciones", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotificaciones(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      } finally {
        notifInFlightRef.current = false;
        if (!silent) setNotifLoading(false);
      }
    },
    [user?.token]
  );

  useEffect(() => {
    if (!user?.token) return;

    fetchNotificaciones({ silent: true });

    const id = setInterval(() => fetchNotificaciones({ silent: true }), 20000);

    const onFocus = () => fetchNotificaciones({ silent: true });
    const onVis = () => {
      if (document.visibilityState === "visible") fetchNotificaciones({ silent: true });
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user?.token, fetchNotificaciones]);

  const isRead = (n) => n?.leido === 1 || n?.leido === true || n?.leido === "1";
  const unreadCount = useMemo(
    () => notificaciones.filter((n) => !isRead(n)).length,
    [notificaciones]
  );

  const handleNotificacionClick = async (notif) => {
    try {
      if (!notif?.id) return;

      if (!isRead(notif)) {
        await api.put(
          `/notificaciones/${notif.id}/leida`,
          {},
          {
            headers: {
              Authorization: user?.token ? `Bearer ${user.token}` : undefined,
            },
          }
        );

        setNotificaciones((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: 1 } : n))
        );
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  // ===== Navegación =====
  const profileLabel =
    user?.razon_social || user?.nombre_empresa || user?.username || "Mi empresa";

  const userDisplayName =
    user?.razon_social || user?.nombre_empresa || user?.username || "Usuario empresa";

  const userEmail = user?.contact_email || user?.email || "empresa@ferreexpress.com";

  const navLeft = [
    { to: `${basePath}`, label: "Inicio", icon: FiHome },
    { to: `${basePath}/catalogo`, label: "Catálogo", icon: FiBriefcase },
    { to: `${basePath}/about`, label: "Acerca de", icon: FiInfo },
    { to: `${basePath}/puntos-fisicos`, label: "Puntos físicos", icon: FiMapPin },
  ];

  const navRight = [
    { to: `${basePath}/cotizaciones`, label: "Mis Cotizaciones", icon: FiFileText },
    { to: `${basePath}/mis-pedidos`, label: "Mis Pedidos", icon: FiTruck },
    { to: `${basePath}/carrito-empresa`, label: "Carrito", icon: FiShoppingCart },
    { to: `${basePath}/perfil-empresa`, label: profileLabel, icon: FiUser },
  ];

  const headerShadow = useMemo(() => "0 3px 14px rgba(0,0,0,0.25)", []);

  // ===== CARRITO: SKUs + animación =====
  const [cartSkus, setCartSkus] = useState(() => cartCountSkus());
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    setCartSkus(cartCountSkus());

    const unsubscribe = onCartChanged((detail) => {
      setCartSkus(typeof detail?.skus === "number" ? detail.skus : cartCountSkus());

      if (detail?.lastAction === "add" && detail?.addedUnits > 0) {
        setCartBump(true);
        setTimeout(() => setCartBump(false), 220);
      }
    });

    return unsubscribe;
  }, []);

  // ===== HEADER HIDE (PRO) =====
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(0);

  const [hideHeader, setHideHeader] = useState(false);
  const hideHeaderRef = useRef(false);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => setHeaderH(el.getBoundingClientRect().height || 0);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!hideOnScroll) {
      hideHeaderRef.current = false;
      setHideHeader(false);
      return;
    }

    let lastY = window.scrollY || 0;
    let ticking = false;

    const THRESHOLD = Math.max(90, headerH + 12);
    const DELTA = 10;

    const onScroll = () => {
      // Evita toggles cuando hay overlays/focus
      if (isOpen) return;
      if (notifOpen) return;
      if (showSuggestions) return;
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
  }, [hideOnScroll, headerH, isOpen, notifOpen, showSuggestions]);

  const logoH = useBreakpointValue({ base: "28px", sm: "30px", md: "34px", lg: "36px" });
  const searchH = useBreakpointValue({ base: "40px", md: "44px", lg: "44px" });
  const searchFont = useBreakpointValue({ base: "sm", md: "md" });

  const effectiveHeaderH = headerH;

  return (
    <Box bg={bgPage} minH="100vh">
      {/* ===== HEADER EMPRESA (fixed + hide solo base/md) ===== */}
      <MotionBox
        as="header"
        ref={headerRef}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex="overlay"
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        boxShadow={headerShadow}
        animate={{ y: hideOnScroll && hideHeader ? -effectiveHeaderH : 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          willChange: "transform",
          pointerEvents: hideOnScroll && hideHeader ? "none" : "auto",
        }}
      >
        <Container maxW="7xl" px={{ base: 3, sm: 4, md: 5, lg: 6 }} py={{ base: 2, md: 3 }}>
          {/* FILA 1: Logo + modo + acciones (solo Drawer mode) */}
          <Flex align="center" justify="space-between" gap={{ base: 2, md: 4 }} wrap="nowrap">
            <HStack spacing={3} minW={0}>
              <Image
                src="/LOGOFERREEXPRESS.jpg"
                alt="FerreExpress S.A.S."
                h={logoH}
                objectFit="contain"
              />

              <Box
                display={{ base: "none", md: "block" }}
                ml={2}
                pl={3}
                borderLeft="1px solid"
                borderColor="blackAlpha.300"
              >
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  color="gray.800"
                  fontWeight="semibold"
                >
                  Modo contratista
                </Text>
                <Text fontSize="xs" color="gray.800">
                  Centraliza compras y beneficios para tu empresa.
                </Text>
              </Box>
            </HStack>

            <HStack spacing={2}>
              {/* ✅ En móvil/tablet: iconos + menú. En PC (lg+): NO (para no duplicar carrito) */}
              {useDrawerNav && (
                <>
                  {/* Carrito */}
                  <Box position="relative">
                    <Tooltip label="Carrito empresa" hasArrow>
                      <IconButton
                        aria-label="Carrito empresa"
                        variant="ghost"
                        color="gray.900"
                        onClick={() => navigate(`${basePath}/carrito-empresa`)}
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

                  {/* Notificaciones */}
                  <Popover
                    placement="bottom-end"
                    closeOnBlur
                    onOpen={() => {
                      setNotifOpen(true);
                      fetchNotificaciones({ silent: false });
                    }}
                    onClose={() => setNotifOpen(false)}
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
                    onClick={() => {
                      setShowSuggestions(false);
                      onOpen();
                    }}
                  />
                </>
              )}
            </HStack>
          </Flex>

          {/* FILA 2: Buscador */}
          <Box mt={{ base: 2, md: 3 }} position="relative">
            <Box as="form" onSubmit={handleSearchSubmit}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" h="100%" pl="3">
                  <FiSearch />
                </InputLeftElement>

                <Input
                  id="empresa-search"
                  ref={searchInputRef}
                  bg="white"
                  borderColor="gray.200"
                  _hover={{ borderColor: "gray.300" }}
                  _focus={{
                    borderColor: "gray.500",
                    boxShadow: "0 0 0 3px rgba(51,65,85,0.4)",
                  }}
                  rounded="full"
                  h={searchH}
                  pl="44px"
                  pr={{ base: "64px", md: "84px", lg: "120px" }}
                  fontSize={searchFont}
                  placeholder="Buscar productos para tu obra o proyecto…"
                  aria-label="Buscar productos para contratista en FerreExpress"
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

                <InputRightElement width="auto" h="100%" pr="3">
                  {showDesktopNav && search.trim() === "" && (
                    <HStack spacing={2} color="gray.700" fontSize="xs">
                      <Text>Atajo</Text>
                      <Kbd>/</Kbd>
                    </HStack>
                  )}
                </InputRightElement>
              </InputGroup>
            </Box>

            {/* Sugerencias */}
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
                  maxH={{ base: "55vh", md: "360px" }}
                  overflowY="auto"
                  overscrollBehavior="contain"
                  sx={{ WebkitOverflowScrolling: "touch" }}
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
                        . Prueba con otra referencia, medida o línea de producto.
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
                    <Text>Presiona</Text>
                    <Kbd>Enter</Kbd>
                    <Text>para ver resultados o</Text>
                    <Kbd>Esc</Kbd>
                    <Text>para cerrar.</Text>
                  </Box>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>

          {/* FILA 3: NAV COMPLETA SOLO en PC (lg+) */}
          {showDesktopNav && (
            <Box mt={3}>
              <Divider borderColor="blackAlpha.200" mb={2} opacity={0.5} />
              <Flex mt={1} align="center" justify="space-between" gap={4} wrap="nowrap">
                {/* IZQUIERDA */}
                <Flex
                  as="nav"
                  align="center"
                  gap={2}
                  overflowX="auto"
                  pb={1}
                  sx={{ "::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
                >
                  {navLeft.map((item) => (
                    <EmpresaNavItem
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

                {/* DERECHA */}
                <Flex as="nav" align="center" gap={3} flexWrap="wrap" justify="flex-end" pb={1}>
                  <HStack spacing={2} flexWrap="wrap" justify="flex-end">
                    <EmpresaNavItem
                      to={navRight[0].to}
                      icon={navRight[0].icon}
                      label={navRight[0].label}
                      active={isActive(navRight[0].to)}
                      navInactive={navInactive}
                      navActiveBg={navActiveBg}
                      navActiveColor={navActiveColor}
                    />
                    <EmpresaNavItem
                      to={navRight[1].to}
                      icon={navRight[1].icon}
                      label={navRight[1].label}
                      active={isActive(navRight[1].to)}
                      navInactive={navInactive}
                      navActiveBg={navActiveBg}
                      navActiveColor={navActiveColor}
                    />
                    <EmpresaNavItem
                      to={navRight[2].to}
                      icon={navRight[2].icon}
                      label={navRight[2].label}
                      active={isActive(navRight[2].to)}
                      navInactive={navInactive}
                      navActiveBg={navActiveBg}
                      navActiveColor={navActiveColor}
                      badgeValue={cartSkus}
                      isCart
                      bump={cartBump}
                    />
                  </HStack>

                  <HStack spacing={2}>
                    <Popover
                      placement="bottom-end"
                      closeOnBlur
                      onOpen={() => {
                        setNotifOpen(true);
                        fetchNotificaciones({ silent: false });
                      }}
                      onClose={() => setNotifOpen(false)}
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
                          bg={isActive(`${basePath}/perfil-empresa`) ? navActiveBg : "transparent"}
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
                            onClick={() => navigate(`${basePath}/perfil-empresa`)}
                            color={navInactive}
                            _hover={{ bg: panelSubtleBg, color: "gray.900" }}
                            borderRadius="md"
                            fontSize="sm"
                          >
                            Perfil empresa
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
                            Cerrar sesión
                          </Button>
                        </VStack>
                      </PopoverContent>
                    </Popover>
                  </HStack>
                </Flex>
              </Flex>
            </Box>
          )}
        </Container>
      </MotionBox>

      {/* ===== DRAWER (móvil/tablet) ===== */}
      <Drawer
        isOpen={useDrawerNav ? isOpen : false}
        onClose={onClose}
        placement="right"
        size={{ base: "full", sm: "sm" }}
      >
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
                  Mi cuenta empresa
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

      {/* ===== CONTENIDO + FOOTER (se mueven con el header cuando se esconde) ===== */}
      <MotionBox
        style={{ paddingTop: effectiveHeaderH, willChange: "transform" }}
        animate={{ y: hideOnScroll && hideHeader ? -effectiveHeaderH : 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        minH="100vh"
        display="flex"
        flexDirection="column"
      >
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

              <HStack
                spacing={{ base: 6, md: 10 }}
                justify="center"
                fontSize={{ base: "sm", md: "md" }}
                fontWeight="medium"
              >
                <Button
                  as={RouterLink}
                  to="/empresa/condiciones-uso-empresa"
                  variant="link"
                  color="blue.600"
                  _hover={{ color: "blue.700" }}
                >
                  Condiciones de uso
                </Button>
                <Button
                  as={RouterLink}
                  to="/empresa/avisos-privacidad-empresa"
                  variant="link"
                  color="blue.600"
                  _hover={{ color: "blue.700" }}
                >
                  Avisos de privacidad
                </Button>
              </HStack>

              <HStack spacing={{ base: 5, md: 6 }} justify={{ base: "center", md: "flex-end" }}>
                {[
                  { Icon: FaWhatsapp, label: "WhatsApp", color: "#25D366", url: "https://wa.me/message/YJTPSMKGHFBAH1" },
                  { Icon: FaInstagram, label: "Instagram", color: "#E4405F", url: "https://www.instagram.com/ferreexpress.sas?igsh=MXVkMWNwbTVpZGRrZg==" },
                  { Icon: FaFacebook, label: "Facebook", color: "#1877F2", url: "https://www.facebook.com/profile.php?id=61569576237043&sk=about" },
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
      </MotionBox>
    </Box>
  );
}

/* ===== Item de navegación Empresa (DESKTOP) ===== */
function EmpresaNavItem({
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

/* ===== Panel reutilizable de notificaciones ===== */
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
            {notificaciones.map((n) => {
              const read = n?.leido === 1 || n?.leido === true || n?.leido === "1";

              return (
                <Box
                  key={n.id}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={read ? "gray.200" : "yellow.400"}
                  bg={read ? "white" : "yellow.50"}
                  _hover={{ bg: read ? "gray.50" : "yellow.100" }}
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

                    {!read && (
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
              );
            })}
          </Stack>
        )}
      </Box>
    </PopoverContent>
  );
}