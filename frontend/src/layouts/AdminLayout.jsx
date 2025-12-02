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
  FiBell,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";

/* ===== Navegación Admin → ahora con rutas reales ===== */
const NAV = [
  { id: "resumen", label: "Dashboard", icon: FiHome, to: "/admin" },
  {
    id: "productos",
    label: "Productos",
    icon: FiBox,
    to: "/admin/productos",
  },
  {
    id: "cotizaciones",
    label: "Cotizaciones",
    icon: FiFileText,
    to: "/admin/cotizaciones",
  },
  {
    id: "pedidos",
    label: "Pedidos",
    icon: FiShoppingCart,
    to: "/admin/pedidos",
  },
  {
    id: "usuarios",
    label: "Usuarios",
    icon: FiUsers,
    to: "/admin/usuarios",
  },
  {
    id: "casos",
    label: "Casos",
    icon: FiLifeBuoy,
    to: "/admin/casos",
  },
  {
    id: "faq",
    label: "FAQ",
    icon: FiHelpCircle,
    to: "/admin/faq",
  },
  {
    id: "descuentos",
    label: "Descuentos",
    icon: FiFileText,
    to: "/admin/descuentos",
  },
  {
    id: "auditoria",
    label: "Auditoría",
    icon: FiFileText,
    to: "/admin/auditoria",
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icon: FiSettings,
    to: "/admin",
    disabled: true,
  },
];

export default function AdminLayout() {
  const brandBg = "#f9bf20";
  const brandText = "white";
  const subtle = "rgba(255,255,255,.14)";

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const topBg = brandBg;
  const topText = brandText;

  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ===== Notificaciones (admin) =====
  const notifDisc = useDisclosure();
  const [notis, setNotis] = useState([]);
  const [loadingNoti, setLoadingNoti] = useState(false);
  const unreadCount = useMemo(
    () => notis.filter((n) => !n.leido).length,
    [notis]
  );

  const loadNotis = async () => {
    try {
      setLoadingNoti(true);
      const { data } = await api.get("/notificaciones");
      setNotis(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNoti(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      // Intento 1: /notificaciones/:id
      await api.put(`/notificaciones/${id}`);
    } catch {
      try {
        // Intento 2: /notificaciones/:id/leida
        await api.put(`/notificaciones/${id}/leida`);
      } catch (e) {
        console.error("No se pudo marcar notificación:", e);
      }
    } finally {
      loadNotis();
    }
  };

  useEffect(() => {
    loadNotis();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Atajo "/" → enfocar buscador (desktop)
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing =
        tag === "input" ||
        tag === "textarea" ||
        e.target.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        const input = document.getElementById("fe-search");
        if (input) input.focus();
      }
      if (e.key === "Escape" && document.activeElement?.id === "fe-search") {
        document.activeElement.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sidebar colapsable (persistente)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("fe_sidebar_collapsed") || "false"
      );
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem(
      "fe_sidebar_collapsed",
      JSON.stringify(collapsed)
    );
  }, [collapsed]);

  return (
    <Flex minH="100vh" bg={pageBg} direction="row">
      {/* ===== Sidebar (desktop) ===== */}
      <Box
        as="aside"
        display={{ base: "none", md: "block" }}
        w={collapsed ? "80px" : "260px"}
        bg={useColorModeValue("white", "gray.900")}
        borderRight="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        position="sticky"
        top="0"
        h="100vh"
        transition="width .18s ease"
      >
        <SidebarContent
          onItemClick={() => {}}
          brandBg={brandBg}
          collapsed={collapsed}
          onToggle={() => setCollapsed((s) => !s)}
        />
      </Box>

      {/* ===== Drawer (mobile) ===== */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent
          bg={useColorModeValue("white", "gray.900")}
        >
          <DrawerHeader
            borderBottom="1px solid"
            borderColor={useColorModeValue("gray.200", "gray.700")}
          >
            Menú
          </DrawerHeader>
          <DrawerBody p="0">
            <SidebarContent
              onItemClick={onClose}
              brandBg={brandBg}
              collapsed={false}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ===== Columna derecha ===== */}
      <Flex direction="column" flex="1" minW={0}>
        {/* Header (branding + buscador centrado) */}
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
            {/* Grid: [logo] [search centered] [acciones] */}
            <Grid
              templateColumns="auto 1fr auto"
              alignItems="center"
              gap={4}
              h="68px"
            >
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
                  _hover={{ opacity: 0.9 }}
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

              {/* Centro: buscador pill centrado */}
              <Box justifySelf="center" w="100%">
                <InputGroup
                  display={{ base: "none", md: "flex" }}
                  maxW="640px"
                  mx="auto"
                >
                  <InputLeftElement
                    pointerEvents="none"
                    color="white"
                    pl="3"
                  >
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    id="fe-search"
                    bg="white"
                    color="gray.800"
                    borderColor="whiteAlpha.600"
                    _hover={{ borderColor: "white" }}
                    _focus={{
                      borderColor: "white",
                      boxShadow:
                        "0 0 0 3px rgba(255,255,255,.35)",
                    }}
                    rounded="full"
                    h="44px"
                    pl="44px"
                    pr="96px"
                    placeholder="Buscar productos, pedidos, usuarios…"
                    aria-label="Buscar en el panel de administración"
                    boxShadow="0 1.5px 3px rgba(0,0,0,.10)"
                  />
                  <InputRightElement
                    w="auto"
                    h="100%"
                    pr="3"
                    color="white"
                  >
                    <HStack spacing={2} fontSize="xs">
                      <Text>Atajo</Text>
                      <Kbd color="black">/</Kbd>
                    </HStack>
                  </InputRightElement>
                </InputGroup>
              </Box>

              {/* Derecha: notifs + cuenta + salir */}
              <HStack spacing={2} justifySelf="end">
                <Box position="relative">
                  <Tooltip label="Notificaciones">
                    <IconButton
                      aria-label="Notificaciones"
                      icon={<FiBell />}
                      variant="ghost"
                      color={brandText}
                      onClick={() => {
                        notifDisc.onOpen();
                        loadNotis();
                      }}
                      minH="44px"
                    />
                  </Tooltip>
                  {unreadCount > 0 && (
                    <Badge
                      position="absolute"
                      top="0"
                      right="0"
                      transform="translate(20%, -20%)"
                      rounded="full"
                      px="1.5"
                      py="0.5"
                      fontSize="10px"
                      bg="red.500"
                      color="white"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Box>

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

        {/* Drawer Notificaciones */}
        <Drawer
          isOpen={notifDisc.isOpen}
          placement="right"
          onClose={notifDisc.onClose}
          size="sm"
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHeader
              borderBottom="1px solid"
              borderColor={useColorModeValue(
                "gray.200",
                "gray.700"
              )}
            >
              Notificaciones
            </DrawerHeader>
            <DrawerBody>
              {loadingNoti ? (
                <HStack py={4} justify="center">
                  <Spinner />
                </HStack>
              ) : notis.length === 0 ? (
                <Text color="gray.500">
                  No tienes notificaciones.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {notis.map((n) => (
                    <Box
                      key={n.id}
                      border="1px solid"
                      borderColor={useColorModeValue(
                        "gray.200",
                        "gray.700"
                      )}
                      rounded="md"
                      p={3}
                      bg={
                        n.leido
                          ? "transparent"
                          : useColorModeValue(
                              "yellow.50",
                              "rgba(249,191,32,.08)"
                            )
                      }
                    >
                      <HStack
                        justify="space-between"
                        align="start"
                      >
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="semibold">
                            {n.titulo}
                          </Text>
                          <Text
                            fontSize="sm"
                            color="gray.600"
                          >
                            {n.mensaje}
                          </Text>
                          <HStack spacing={2} mt={1}>
                            <Badge>{n.tipo}</Badge>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                            >
                              {new Date(
                                n.fecha
                              ).toLocaleString("es-CO")}
                            </Text>
                          </HStack>
                        </VStack>
                        {!n.leido && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => markAsRead(n.id)}
                          >
                            Marcar leída
                          </Button>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main: aquí React Router pinta Dashboard, Productos, Usuarios, etc. */}
        <Box
          as="main"
          id="main"
          flex="1"
          bg={useColorModeValue("#f6f7f9", "#0f1117")}
          p={{ base: 3, md: 6 }}
        >
          <Outlet />
        </Box>

        {/* Footer original */}
        <Footer
          footerBg={useColorModeValue("white", "gray.900")}
          borderColor={useColorModeValue("gray.200", "gray.700")}
        />
      </Flex>
    </Flex>
  );
}

/* ===== Sidebar ===== */
function SidebarContent({ onItemClick, brandBg, collapsed, onToggle }) {
  const location = useLocation();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textCo = useColorModeValue("gray.800", "gray.100");
  const activeBg = useColorModeValue(
    "yellow.50",
    "rgba(249,191,32,.10)"
  );
  const hoverBg = useColorModeValue("gray.50", "gray.800");

  const pathname = location.pathname || "";

  return (
    <VStack align="stretch" spacing={0} h="full">
      {/* Marca + toggle */}
      <HStack
        px="4"
        py="3"
        borderBottom="1px solid"
        borderColor={borderColor}
        justify="space-between"
      >
        <HStack spacing={3} minW={0} overflow="hidden">
          <Image
            src="/LogoPequeño1.jpg"
            alt="FerreExpress"
            h="30px"
            objectFit="contain"
          />
          {!collapsed && (
            <VStack
              align="start"
              spacing={0}
              lineHeight="1.1"
            >
              <Text
                fontWeight="bold"
                fontSize="sm"
                noOfLines={1}
              >
                Ferre Express S.A.S.
              </Text>
              <Text fontSize="xs" color="gray.500">
                Administración
              </Text>
            </VStack>
          )}
        </HStack>
        <Tooltip
          label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <IconButton
            aria-label="Colapsar menú"
            icon={
              collapsed ? (
                <FiChevronsRight />
              ) : (
                <FiChevronsLeft />
              )
            }
            variant="ghost"
            onClick={onToggle}
            size="sm"
          />
        </Tooltip>
      </HStack>

      {/* Navegación */}
      <VStack
        as="nav"
        align="stretch"
        spacing={0}
        py="2"
        overflowY="auto"
        flex="1"
      >
        {NAV.map((item) => {
          const isActive =
            item.to === "/admin"
              ? pathname === "/admin" ||
                pathname === "/admin/"
              : pathname.startsWith(item.to);

          return (
            <CLink
              as={RouterLink}
              key={item.id}
              to={item.disabled ? "#" : item.to}
              onClick={item.disabled ? undefined : onItemClick}
              aria-disabled={item.disabled}
              _hover={{ textDecoration: "none" }}
              opacity={item.disabled ? 0.55 : 1}
            >
              <HStack
                px="4"
                py="3"
                spacing={3}
                bg={isActive ? activeBg : "transparent"}
                _hover={{
                  bg: isActive ? activeBg : hoverBg,
                }}
                borderLeft={
                  isActive
                    ? `3px solid ${brandBg}`
                    : "3px solid transparent"
                }
                transition="all .15s ease"
              >
                <Box
                  as={item.icon}
                  boxSize={5}
                  color={textCo}
                />
                {!collapsed && (
                  <Text color={textCo} fontSize="sm">
                    {item.label}
                  </Text>
                )}
              </HStack>
            </CLink>
          );
        })}
      </VStack>
    </VStack>
  );
}

/* ===== Footer original ===== */
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
          <HStack
            justify={{ base: "center", md: "flex-start" }}
          >
            <Image
              src="/LOGOFERREEXPRESS.png"
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
            <CLink
              href="#"
              aria-label="WhatsApp"
              _hover={{ color: "black" }}
            >
              <FaWhatsapp size={18} />
            </CLink>
            <CLink
              href="#"
              aria-label="Instagram"
              _hover={{ color: "black" }}
            >
              <FaInstagram size={18} />
            </CLink>
            <CLink
              href="#"
              aria-label="Facebook"
              _hover={{ color: "black" }}
            >
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
  );
}