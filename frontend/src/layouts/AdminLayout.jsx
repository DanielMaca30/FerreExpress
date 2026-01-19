// src/layouts/AdminLayout.jsx
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
  useDisclosure,
  Kbd,
  VisuallyHidden,
  Grid,
  GridItem,
  Button,
  Tooltip,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Badge,
  Spinner,
  Icon,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  Portal,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useToast,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiUser,
  FiMenu,
  FiHome,
  FiBox,
  FiFileText,
  FiShoppingCart,
  FiUsers,
  FiLifeBuoy,
  FiHelpCircle,
  FiSettings,
  FiLogOut,
  FiChevronsLeft,
  FiChevronsRight,
  FiArrowRight,
  FiHash,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";

/* ===== Navegación Admin ===== */
const NAV = [
  { id: "resumen", label: "Dashboard", icon: FiHome, to: "/admin" },
  { id: "productos", label: "Productos", icon: FiBox, to: "/admin/productos" },
  { id: "cotizaciones", label: "Cotizaciones", icon: FiFileText, to: "/admin/cotizaciones" },
  { id: "pedidos", label: "Pedidos", icon: FiShoppingCart, to: "/admin/pedidos" },
  { id: "usuarios", label: "Usuarios", icon: FiUsers, to: "/admin/usuarios" },
  { id: "casos", label: "Casos", icon: FiLifeBuoy, to: "/admin/casos" },
  { id: "faq", label: "FAQ", icon: FiHelpCircle, to: "/admin/faq" },
  { id: "descuentos", label: "Descuentos", icon: FiFileText, to: "/admin/descuentos" },
  { id: "auditoria", label: "Auditoría", icon: FiFileText, to: "/admin/auditoria" },
  { id: "ajustes", label: "Ajustes", icon: FiSettings, to: "/admin", disabled: true },
];

const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function AdminLayout() {
  const brandBg = "#f9bf20"; // ✅ NO CAMBIAR
  const brandText = "white";
  const subtle = "rgba(255,255,255,.14)";

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const topBg = brandBg;
  const topText = brandText;

  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure(); // drawer menú (mobile)

  // =========================
  //  SEARCH (Spotlight iOS-like)
  // =========================
  const searchPopover = useDisclosure(); // desktop popover
  const searchMobile = useDisclosure(); // mobile top drawer
  const searchInputRef = useRef(null);

  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [prodResults, setProdResults] = useState([]);
  const qTrim = q.trim();

  // Modal detalle rápido (Pedido/Cotización/Producto)
  const detailDisc = useDisclosure();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null); // { type:'pedido'|'cotizacion'|'producto', data:any }

  const glassBg = useColorModeValue("whiteAlpha.950", "rgba(18,20,26,.92)");
  const glassBorder = useColorModeValue("gray.200", "gray.700");

  // ✅ Cerrar “overlays” de búsqueda siempre que abramos otra cosa
  const closeSearchOverlays = useCallback(() => {
    searchPopover.onClose();
    searchMobile.onClose();
  }, [searchPopover, searchMobile]);

  const closeDetail = useCallback(() => {
    setDetail(null);
    detailDisc.onClose();
  }, [detailDisc]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openPedidoById = async (id) => {
    try {
      closeSearchOverlays();
      setDetailLoading(true);
      const { data } = await api.get(`/pedidos/${id}`);
      setDetail({ type: "pedido", data });
      detailDisc.onOpen();
    } catch (e) {
      toast({
        title: "No se encontró el pedido",
        description: `Pedido #${id} no existe o no tienes permisos.`,
        status: "warning",
        duration: 2800,
        isClosable: true,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openCotizacionById = async (id) => {
    try {
      closeSearchOverlays();
      setDetailLoading(true);
      const { data } = await api.get(`/cotizaciones/${id}`);
      setDetail({ type: "cotizacion", data });
      detailDisc.onOpen();
    } catch (e) {
      toast({
        title: "No se encontró la cotización",
        description: `Cotización #${id} no existe o no tienes permisos.`,
        status: "warning",
        duration: 2800,
        isClosable: true,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const openProductoById = async (id) => {
    try {
      closeSearchOverlays();
      setDetailLoading(true);
      const { data } = await api.get(`/productos/${id}`);
      setDetail({ type: "producto", data });
      detailDisc.onOpen();
    } catch (e) {
      toast({
        title: "No se encontró el producto",
        description: `Producto #${id} no existe.`,
        status: "warning",
        duration: 2600,
        isClosable: true,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Debounce: buscar productos cuando haya texto (2+ chars)
  useEffect(() => {
    const term = qTrim;
    const onlyDigits = /^\d+$/.test(term);

    // ✅ Si es número, NO hacemos búsqueda de productos (evita ruido)
    if (!term || term.length < 2 || onlyDigits) {
      setProdResults([]);
      setSearching(false);
      return;
    }

    let alive = true;
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        // Admin: incluir inactivos para gestionar catálogo
        const { data } = await api.get("/productos", {
          params: { search: term, page: 1, limit: 6, incluirInactivos: "1" },
        });
        if (!alive) return;
        setProdResults(data?.productos || []);
      } catch (e) {
        if (!alive) return;
        setProdResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 240);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [qTrim]);

  const openSearchDesktop = () => {
    searchPopover.onOpen();
    // foco micro-delay para UX
    setTimeout(() => searchInputRef.current?.focus?.(), 0);
  };

  const openSearchMobile = () => {
    searchMobile.onOpen();
    setTimeout(() => document.getElementById("fe-search-mobile")?.focus?.(), 0);
  };

  const handleSubmitSearch = () => {
    const term = qTrim;
    if (!term) return;

    const onlyDigits = /^\d+$/.test(term);
    if (onlyDigits) {
      // Heurística: número = acciones por ID
      searchPopover.onOpen();
      return;
    }

    // Texto: ya hay resultados, y además damos CTA a ir a Productos filtrado
    searchPopover.onOpen();
  };

  // Atajo "/" → enfocar buscador (desktop)
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || e.target.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        openSearchDesktop();
      }

      if (e.key === "Escape") {
        if (detailDisc.isOpen) closeDetail();
        if (searchPopover.isOpen) searchPopover.onClose();
        if (searchMobile.isOpen) searchMobile.onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailDisc.isOpen, searchPopover.isOpen, searchMobile.isOpen]);

  // Sidebar colapsable (persistente)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fe_sidebar_collapsed") || "false");
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem("fe_sidebar_collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const QuickActions = ({ compact = false }) => (
    <HStack
      spacing={2}
      wrap="wrap"
      justify={compact ? "flex-start" : "space-between"}
    >
      <Tag
        cursor="pointer"
        onClick={() => {
          closeSearchOverlays();
          navigate("/admin");
        }}
        border="1px solid"
        borderColor={glassBorder}
        bg={glassBg}
        rounded="full"
        px={3}
        py={1.5}
      >
        <TagLeftIcon as={FiHome} />
        <TagLabel>Dashboard</TagLabel>
      </Tag>

      <Tag
        cursor="pointer"
        onClick={() => {
          closeSearchOverlays();
          navigate("/admin/productos");
        }}
        border="1px solid"
        borderColor={glassBorder}
        bg={glassBg}
        rounded="full"
        px={3}
        py={1.5}
      >
        <TagLeftIcon as={FiBox} />
        <TagLabel>Productos</TagLabel>
      </Tag>

      <Tag
        cursor="pointer"
        onClick={() => {
          closeSearchOverlays();
          navigate("/admin/pedidos");
        }}
        border="1px solid"
        borderColor={glassBorder}
        bg={glassBg}
        rounded="full"
        px={3}
        py={1.5}
      >
        <TagLeftIcon as={FiShoppingCart} />
        <TagLabel>Pedidos</TagLabel>
      </Tag>

      <Tag
        cursor="pointer"
        onClick={() => {
          closeSearchOverlays();
          navigate("/admin/cotizaciones");
        }}
        border="1px solid"
        borderColor={glassBorder}
        bg={glassBg}
        rounded="full"
        px={3}
        py={1.5}
      >
        <TagLeftIcon as={FiFileText} />
        <TagLabel>Cotizaciones</TagLabel>
      </Tag>

      <Tag
        cursor="pointer"
        onClick={() => {
          closeSearchOverlays();
          navigate("/admin/usuarios");
        }}
        border="1px solid"
        borderColor={glassBorder}
        bg={glassBg}
        rounded="full"
        px={3}
        py={1.5}
      >
        <TagLeftIcon as={FiUsers} />
        <TagLabel>Usuarios</TagLabel>
      </Tag>
    </HStack>
  );

  const SearchResultsBlock = ({ inDrawer = false }) => {
    const term = qTrim;
    const onlyDigits = /^\d+$/.test(term);

    // ✅ HOOKS fuera del map (evita errores)
    const resultBg = useColorModeValue("white", "gray.900");
    const resultBorder = useColorModeValue("gray.200", "gray.700");
    const resultHoverBg = useColorModeValue("gray.50", "gray.800");
    const thumbBg = useColorModeValue("gray.100", "gray.800");

    return (
      <Stack spacing={4}>
        <Box>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Accesos rápidos
          </Text>
          <QuickActions compact={inDrawer} />
        </Box>

        {term ? (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.500">
                Resultados
              </Text>
              <Text fontSize="xs" color="gray.500">
                Texto = productos • Número = abrir por ID
              </Text>
            </HStack>

            {/* ✅ Si es número: acciones por ID (más útil y claro) */}
            {onlyDigits && (
              <Stack spacing={2}>
                <Button
                  leftIcon={<Icon as={FiHash} />}
                  rightIcon={<Icon as={FiArrowRight} />}
                  variant="outline"
                  rounded="xl"
                  onClick={() => openPedidoById(term)}
                  isLoading={detailLoading}
                >
                  Ver pedido #{term}
                </Button>

                <Button
                  leftIcon={<Icon as={FiHash} />}
                  rightIcon={<Icon as={FiArrowRight} />}
                  variant="outline"
                  rounded="xl"
                  onClick={() => openCotizacionById(term)}
                  isLoading={detailLoading}
                >
                  Ver cotización #{term}
                </Button>

                <Button
                  leftIcon={<Icon as={FiHash} />}
                  rightIcon={<Icon as={FiArrowRight} />}
                  variant="outline"
                  rounded="xl"
                  onClick={() => openProductoById(term)}
                  isLoading={detailLoading}
                >
                  Ver producto #{term}
                </Button>

                <Button
                  variant="ghost"
                  rounded="xl"
                  onClick={() => {
                    closeSearchOverlays();
                    navigate("/admin/usuarios", { state: { q: term } });
                  }}
                >
                  Ir a Usuarios (filtrar por “{term}”)
                </Button>
              </Stack>
            )}

            {/* ✅ Texto: productos */}
            {!onlyDigits && (
              <Box>
                {searching ? (
                  <HStack py={4} justify="center">
                    <Spinner />
                    <Text fontSize="sm" color="gray.500">
                      Buscando productos…
                    </Text>
                  </HStack>
                ) : prodResults.length === 0 ? (
                  <Box
                    border="1px solid"
                    borderColor={glassBorder}
                    bg={glassBg}
                    rounded="2xl"
                    p={4}
                  >
                    <Text fontSize="sm" color="gray.600">
                      Sin resultados para “{term}”.
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Tip: prueba otra palabra o escribe un ID (ej: 12).
                    </Text>

                    <Button
                      mt={3}
                      onClick={() => {
                        closeSearchOverlays();
                        navigate(`/admin/productos`, { state: { q: term } });
                      }}
                      variant="outline"
                      rounded="xl"
                      rightIcon={<Icon as={FiArrowRight} />}
                    >
                      Buscar en Productos
                    </Button>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {prodResults.map((p) => (
                      <Button
                        key={p.id}
                        variant="ghost"
                        justifyContent="space-between"
                        rounded="2xl"
                        py={6}
                        px={4}
                        bg={resultBg}
                        border="1px solid"
                        borderColor={resultBorder}
                        _hover={{ bg: resultHoverBg }}
                        onClick={() => openProductoById(p.id)}
                      >
                        <HStack spacing={3} minW={0} overflow="hidden">
                          <Box
                            w="42px"
                            h="42px"
                            rounded="xl"
                            overflow="hidden"
                            bg={thumbBg}
                            flex="0 0 auto"
                          >
                            {p.imagen_principal ? (
                              <Image
                                src={p.imagen_principal}
                                alt={p.nombre}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                              />
                            ) : (
                              <Flex w="100%" h="100%" align="center" justify="center">
                                <Icon as={FiBox} color="gray.500" />
                              </Flex>
                            )}
                          </Box>

                          <Box minW={0} textAlign="left">
                            <Text fontWeight="semibold" noOfLines={1}>
                              {p.nombre}
                            </Text>
                            <HStack spacing={2} mt={0.5}>
                              <Badge colorScheme={p.activo ? "green" : "red"}>
                                {p.activo ? "Activo" : "Inactivo"}
                              </Badge>
                              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                Stock: {p.stock ?? 0}
                              </Text>
                            </HStack>
                          </Box>
                        </HStack>

                        <HStack spacing={3} flex="0 0 auto">
                          <Text fontWeight="bold">{fmtCop(p.precio)}</Text>
                          <Icon as={FiArrowRight} />
                        </HStack>
                      </Button>
                    ))}

                    <Button
                      onClick={() => {
                        closeSearchOverlays();
                        navigate(`/admin/productos`, { state: { q: term } });
                      }}
                      variant="outline"
                      rounded="xl"
                      rightIcon={<Icon as={FiArrowRight} />}
                    >
                      Ir a Productos
                    </Button>
                  </VStack>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box
            border="1px solid"
            borderColor={glassBorder}
            bg={glassBg}
            rounded="2xl"
            p={4}
          >
            <Text fontSize="sm" color="gray.600">
              Busca productos por nombre o escribe un número para abrir Pedido/Cotización/Producto.
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Ejemplos: “taladro”, “cemento”, “12”.
            </Text>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Flex minH="100vh" bg={pageBg} direction="row">
      {/* ===== Sidebar (desktop) ===== */}
      <Box
        as="aside"
        display={{ base: "none", md: "block" }}
        w={collapsed ? "84px" : "270px"}
        bg={useColorModeValue("white", "gray.900")}
        borderRight="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        position="sticky"
        top="0"
        h="100vh"
        transition="width .18s ease"
      >
        <SidebarContent
          brandBg={brandBg}
          collapsed={collapsed}
          onToggle={() => setCollapsed((s) => !s)}
        />
      </Box>

      {/* ===== Drawer (mobile) ===== */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={useColorModeValue("white", "gray.900")}>
          <DrawerHeader
            borderBottom="1px solid"
            borderColor={useColorModeValue("gray.200", "gray.700")}
          >
            Menú
          </DrawerHeader>
          <DrawerBody p="0">
            <SidebarContent
              brandBg={brandBg}
              collapsed={false}
              onToggle={() => {}}
              onItemClick={onClose}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ===== Columna derecha ===== */}
      <Flex direction="column" flex="1" minW={0}>
        {/* Header (amarillo) */}
        <Box
          as="header"
          position="sticky"
          top="0"
          zIndex="banner"
          bg={topBg}
          color={topText}
          borderBottom="1px solid"
          borderColor={subtle}
          boxShadow="0 1px 0 rgba(0,0,0,.10)"
        >
          <VisuallyHidden as="a" href="#main">
            Saltar al contenido
          </VisuallyHidden>

          <Container maxW="8xl" px={{ base: 3, md: 5, lg: 8 }}>
            <Grid templateColumns="auto 1fr auto" alignItems="center" gap={4} h="68px">
              {/* Izquierda: botón (mobile) + logo */}
              <HStack spacing={3}>
                <IconButton
                  aria-label="Abrir menú"
                  icon={<FiMenu />}
                  variant="ghost"
                  color={brandText}
                  onClick={onOpen}
                  display={{ base: "inline-flex", md: "none" }}
                />
                <CLink
                  as={RouterLink}
                  to="/admin"
                  _hover={{ opacity: 0.9, textDecoration: "none" }}
                  textDecoration="none"
                  aria-label="Ir al panel"
                >
                  <Image
                    src="/LOGOFERREEXPRESS.jpg"
                    alt="FerreExpress S.A.S."
                    h={{ base: "36px", md: "44px" }}
                    objectFit="contain"
                  />
                </CLink>
              </HStack>

              {/* Centro: buscador pill centrado (desktop/tablet) */}
              <Box justifySelf="center" w="100%">
                <Popover
                  isOpen={searchPopover.isOpen}
                  onClose={searchPopover.onClose}
                  placement="bottom"
                  closeOnBlur
                  gutter={10}
                  autoFocus={false}           // ✅ FIX: NO robar foco al abrir
                  returnFocusOnClose={false}  // ✅ UX mejor: no “rebota” raro
                  isLazy
                >
                  <PopoverAnchor>
                    <InputGroup
                      display={{ base: "none", md: "flex" }}
                      maxW="680px"
                      mx="auto"
                      onMouseDown={() => {
                        // ✅ asegura foco siempre (iOS-like)
                        setTimeout(() => searchInputRef.current?.focus?.(), 0);
                        if (!searchPopover.isOpen) searchPopover.onOpen();
                      }}
                    >
                      <InputLeftElement pointerEvents="none" color="white" pl="3">
                        <FiSearch />
                      </InputLeftElement>

                      <Input
                        ref={searchInputRef}
                        bg="white"
                        color="gray.800"
                        borderColor="whiteAlpha.600"
                        _hover={{ borderColor: "white" }}
                        _focus={{
                          borderColor: "white",
                          boxShadow: "0 0 0 3px rgba(255,255,255,.35)",
                        }}
                        rounded="full"
                        h="44px"
                        pl="44px"
                        pr="110px"
                        placeholder="Buscar productos… o escribe un ID (pedido/cotización/producto)"
                        aria-label="Buscar en el panel de administración"
                        boxShadow="0 1.5px 3px rgba(0,0,0,.10)"
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          if (!searchPopover.isOpen) searchPopover.onOpen();
                        }}
                        onFocus={() => searchPopover.onOpen()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmitSearch();
                          }
                        }}
                      />

                      <InputRightElement w="auto" h="100%" pr="3" color="white">
                        <HStack spacing={2} fontSize="xs">
                          <Text>Atajo</Text>
                          <Kbd color="black">/</Kbd>
                        </HStack>
                      </InputRightElement>
                    </InputGroup>
                  </PopoverAnchor>

                  <Portal>
                    <PopoverContent
                      w="680px"
                      maxW="calc(100vw - 24px)"
                      border="1px solid"
                      borderColor={glassBorder}
                      bg={glassBg}
                      backdropFilter="blur(14px)"
                      rounded="2xl"
                      overflow="hidden"
                      boxShadow="0 18px 50px rgba(0,0,0,.20)"
                    >
                      <PopoverHeader borderBottom="1px solid" borderColor={glassBorder}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Búsqueda</Text>
                          <Text fontSize="xs" color="gray.500">
                            Enter para ver acciones • Esc para cerrar
                          </Text>
                        </HStack>
                      </PopoverHeader>
                      <PopoverBody p={4}>
                        <SearchResultsBlock />
                      </PopoverBody>
                    </PopoverContent>
                  </Portal>
                </Popover>
              </Box>

              {/* Derecha: search mobile + cuenta + salir */}
              <HStack spacing={2} justifySelf="end">
                {/* Search (mobile) */}
                <Tooltip label="Buscar">
                  <IconButton
                    aria-label="Buscar"
                    icon={<FiSearch />}
                    variant="ghost"
                    color={brandText}
                    onClick={openSearchMobile}
                    display={{ base: "inline-flex", md: "none" }}
                    minH="44px"
                  />
                </Tooltip>

                <Tooltip label={user?.username || "Cuenta"}>
                  <IconButton
                    aria-label="Cuenta"
                    icon={<FiUser />}
                    variant="ghost"
                    color={brandText}
                    as={RouterLink}
                    to="/admin"
                    minH="44px"
                  />
                </Tooltip>

                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="whiteAlpha"
                  onClick={handleLogout}
                  leftIcon={<FiLogOut />}
                >
                  Salir
                </Button>
              </HStack>
            </Grid>

            <Divider borderColor={subtle} />
          </Container>
        </Box>

        {/* Drawer Search (mobile - top) */}
        <Drawer
          isOpen={searchMobile.isOpen}
          placement="top"
          onClose={searchMobile.onClose}
          size="full"
        >
          <DrawerOverlay />
          <DrawerContent bg={useColorModeValue("white", "gray.900")}>
            <DrawerHeader borderBottom="1px solid" borderColor={useColorModeValue("gray.200", "gray.700")}>
              <HStack justify="space-between">
                <Text fontWeight="bold">Buscar</Text>
                <Button variant="ghost" onClick={searchMobile.onClose}>
                  Cerrar
                </Button>
              </HStack>
            </DrawerHeader>
            <DrawerBody>
              <Box maxW="780px" mx="auto" pt={3}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" color="gray.500">
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    id="fe-search-mobile"
                    rounded="full"
                    h="48px"
                    bg={useColorModeValue("gray.50", "gray.800")}
                    border="1px solid"
                    borderColor={useColorModeValue("gray.200", "gray.700")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar productos… o escribe un ID"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmitSearch();
                      }
                    }}
                  />
                </InputGroup>

                <Box mt={4}>
                  <SearchResultsBlock inDrawer />
                </Box>
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Modal detalle rápido */}
        <Modal isOpen={detailDisc.isOpen} onClose={closeDetail} size={{ base: "full", md: "xl" }}>
          <ModalOverlay />
          <ModalContent rounded={{ base: "0", md: "2xl" }} overflow="hidden">
            <ModalHeader>
              {detail?.type === "pedido" && "Detalle de pedido"}
              {detail?.type === "cotizacion" && "Detalle de cotización"}
              {detail?.type === "producto" && "Detalle de producto"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {detailLoading ? (
                <HStack py={10} justify="center">
                  <Spinner />
                </HStack>
              ) : !detail ? null : detail.type === "pedido" ? (
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold">Pedido #{detail.data?.id}</Text>
                    <Badge colorScheme="blue">{detail.data?.estado}</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Cliente: {detail.data?.username} • {detail.data?.email}
                  </Text>
                  <Text mt={2} fontWeight="bold">
                    Total: {fmtCop(detail.data?.total)}
                  </Text>

                  <Divider my={4} />
                  <Text fontWeight="semibold" mb={2}>
                    Ítems
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {(detail.data?.detalles || []).map((d) => (
                      <Box
                        key={d.id || `${d.producto_id}-${d.nombre}`}
                        p={3}
                        rounded="xl"
                        border="1px solid"
                        borderColor={useColorModeValue("gray.200", "gray.700")}
                      >
                        <HStack justify="space-between">
                          <Text fontWeight="semibold" noOfLines={1}>
                            {d.nombre}
                          </Text>
                          <Text fontWeight="bold">{fmtCop(d.subtotal)}</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Cant: {d.cantidad} • Unit: {fmtCop(d.precio_unitario)}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              ) : detail.type === "cotizacion" ? (
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold">Cotización #{detail.data?.id}</Text>
                    <HStack>
                      <Badge>{detail.data?.estado_gestion}</Badge>
                      <Badge colorScheme={detail.data?.estado_vigencia === "VIGENTE" ? "green" : "red"}>
                        {detail.data?.estado_vigencia}
                      </Badge>
                    </HStack>
                  </HStack>

                  <Text fontSize="sm" color="gray.600">
                    Cliente: {detail.data?.username} • {detail.data?.email}
                  </Text>

                  <Text mt={2} fontWeight="bold">
                    Total: {fmtCop(detail.data?.total)}
                  </Text>

                  <Divider my={4} />
                  <Text fontWeight="semibold" mb={2}>
                    Ítems
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {(detail.data?.productos || []).map((d) => (
                      <Box
                        key={d.id || `${d.producto_id}-${d.nombre}`}
                        p={3}
                        rounded="xl"
                        border="1px solid"
                        borderColor={useColorModeValue("gray.200", "gray.700")}
                      >
                        <HStack justify="space-between">
                          <Text fontWeight="semibold" noOfLines={1}>
                            {d.nombre}
                          </Text>
                          <Text fontWeight="bold">{fmtCop(d.subtotal)}</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Cant: {d.cantidad} • Unit: {fmtCop(d.precio_unitario)}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              ) : (
                <Box>
                  <HStack spacing={3} mb={3}>
                    <Box
                      w="64px"
                      h="64px"
                      rounded="2xl"
                      overflow="hidden"
                      bg={useColorModeValue("gray.100", "gray.800")}
                    >
                      {detail.data?.imagenes?.[0]?.url ? (
                        <Image
                          src={detail.data.imagenes[0].url}
                          alt={detail.data?.nombre}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      ) : (
                        <Flex w="100%" h="100%" align="center" justify="center">
                          <Icon as={FiBox} color="gray.500" />
                        </Flex>
                      )}
                    </Box>

                    <Box minW={0}>
                      <Text fontWeight="bold" noOfLines={1}>
                        {detail.data?.nombre}
                      </Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {detail.data?.descripcion || "Sin descripción"}
                      </Text>
                      <HStack mt={1}>
                        <Badge colorScheme={detail.data?.activo ? "green" : "red"}>
                          {detail.data?.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          Stock: {detail.data?.stock ?? 0}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>

                  <Text fontWeight="bold">Precio: {fmtCop(detail.data?.precio)}</Text>

                  <Divider my={4} />
                  <Button
                    rightIcon={<FiArrowRight />}
                    rounded="xl"
                    onClick={() => {
                      // ✅ FIX: cerrar modal antes de navegar
                      closeDetail();
                      navigate("/admin/productos", {
                        state: { openProductId: detail.data?.id },
                      });
                    }}
                  >
                    Ir a Productos
                  </Button>
                </Box>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" onClick={closeDetail}>
                Cerrar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Main */}
        <Box as="main" id="main" flex="1" bg={useColorModeValue("#f6f7f9", "#0f1117")} p={{ base: 3, md: 6 }}>
          <Outlet />
        </Box>

        {/* Footer */}
        <Footer
          footerBg={useColorModeValue("white", "gray.900")}
          borderColor={useColorModeValue("gray.200", "gray.700")}
        />
      </Flex>
    </Flex>
  );
}

/* ===== Sidebar ===== */
function SidebarContent({ brandBg, collapsed, onToggle, onItemClick }) {
  const location = useLocation();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textCo = useColorModeValue("gray.800", "gray.100");
  const activeBg = useColorModeValue("yellow.50", "rgba(249,191,32,.10)");
  const hoverBg = useColorModeValue("gray.50", "gray.800");

  const pathname = location.pathname || "";

  return (
    <VStack align="stretch" spacing={0} h="full">
      {/* Marca + toggle */}
      <HStack px="4" py="3" borderBottom="1px solid" borderColor={borderColor} justify="space-between">
        <HStack spacing={3} minW={0} overflow="hidden">
          <Image src="/LogoPequeño1.jpg" alt="FerreExpress" h="30px" objectFit="contain" />
          {!collapsed && (
            <VStack align="start" spacing={0} lineHeight="1.1">
              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                Ferre Express S.A.S.
              </Text>
              <Text fontSize="xs" color="gray.500">
                Administración
              </Text>
            </VStack>
          )}
        </HStack>

        <Tooltip label={collapsed ? "Expandir menú" : "Colapsar menú"}>
          <IconButton
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            icon={collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
            variant="ghost"
            onClick={onToggle}
            size="sm"
          />
        </Tooltip>
      </HStack>

      {/* Navegación */}
      <VStack as="nav" align="stretch" spacing={1} py="2" overflowY="auto" flex="1" px={collapsed ? 2 : 3}>
        {NAV.map((item) => {
          const isActive =
            item.to === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname.startsWith(item.to);

          const commonProps = {
            key: item.id,
            onClick: item.disabled ? undefined : onItemClick,
            isDisabled: item.disabled,
          };

          if (collapsed) {
            return (
              <Tooltip key={item.id} label={item.label} placement="right">
                <IconButton
                  as={RouterLink}
                  to={item.disabled ? "#" : item.to}
                  aria-label={item.label}
                  icon={<Icon as={item.icon} boxSize={5} />}
                  variant="ghost"
                  color={textCo}
                  bg={isActive ? activeBg : "transparent"}
                  _hover={{ bg: isActive ? activeBg : hoverBg }}
                  borderLeft={isActive ? `3px solid ${brandBg}` : "3px solid transparent"}
                  rounded="xl"
                  {...commonProps}
                />
              </Tooltip>
            );
          }

          return (
            <Button
              as={RouterLink}
              to={item.disabled ? "#" : item.to}
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              justifyContent="flex-start"
              variant="ghost"
              color={textCo}
              bg={isActive ? activeBg : "transparent"}
              _hover={{ bg: isActive ? activeBg : hoverBg }}
              borderLeft={isActive ? `3px solid ${brandBg}` : "3px solid transparent"}
              rounded="xl"
              px={4}
              py={6}
              sx={{ textDecoration: "none !important" }}
              {...commonProps}
            >
              {item.label}
            </Button>
          );
        })}
      </VStack>
    </VStack>
  );
}

/* ===== Footer ===== */
function Footer({ footerBg, borderColor }) {
  return (
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
      <Container maxW={{ base: "100%", md: "95%", lg: "8xl" }} px={{ base: 4, md: 5, lg: 8 }} py={{ base: 2, md: 3 }}>
        <Grid templateColumns={{ base: "1fr", md: "1fr auto 1fr" }} alignItems="center" gap={{ base: 3, md: 4 }}>
          <HStack justify={{ base: "center", md: "flex-start" }}>
            <Image
              src="/LOGOFERREEXPRESS.png"
              alt="FerreExpress S.A.S."
              h={{ base: "32px", sm: "38px", md: "42px" }}
              objectFit="contain"
            />
          </HStack>

          <HStack spacing={{ base: 3, md: 5 }} justify="center" fontSize={{ base: "xs", md: "sm" }}>
            <CLink as={RouterLink} to="/condiciones-uso" color="blue.600" textDecoration="underline">
              Condiciones de uso
            </CLink>
            <CLink as={RouterLink} to="/avisos-privacidad" color="blue.600" textDecoration="underline">
              Avisos de privacidad
            </CLink>
          </HStack>

          <HStack spacing={{ base: 3, md: 4 }} color="gray.600" justify={{ base: "center", md: "flex-end" }}>
            <CLink href="#" aria-label="WhatsApp" _hover={{ color: "black" }}>
              <FaWhatsapp size={18} />
            </CLink>
            <CLink href="#" aria-label="Instagram" _hover={{ color: "black" }}>
              <FaInstagram size={18} />
            </CLink>
            <CLink href="#" aria-label="Facebook" _hover={{ color: "black" }}>
              <FaFacebook size={18} />
            </CLink>
            <CLink href="#" aria-label="X (antes Twitter)" _hover={{ color: "black" }}>
              <FaXTwitter size={18} />
            </CLink>
          </HStack>

          <GridItem colSpan={{ base: 1, md: 3 }}>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.600" textAlign="center">
              {new Date().getFullYear()} | FerreExpress®
            </Text>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}
