// src/pages/cliente/ProductDetail.jsx
// Detalle de producto para CLIENTE convencional
// Mismo diseño moderno que la versión de Empresa, pero sin botón de cotización B2B.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Image,
  Kbd,
  Modal,
  ModalContent,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  usePrefersReducedMotion,
  Icon,
  Flex,
} from "@chakra-ui/react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiShield,
  FiShare2,
  FiTruck,
  FiShoppingBag,
  FiCheck,
  FiFileText, // para botón de ficha técnica
} from "react-icons/fi";
import { motion } from "framer-motion";
import api, { API_BASE_URL } from "../../utils/axiosInstance";
import { addToCart } from "../../utils/cartStore";

/* ====================== Tokens (Diseño Moderno & Clean) ====================== */
const useSurfaceTokens = () => {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("transparent", "gray.700");
  const borderLight = useColorModeValue("gray.100", "gray.700");
  const subtle = useColorModeValue("gray.500", "gray.400");
  const titleCol = useColorModeValue("gray.800", "white");
  const brandColor = "#F9BF20";
  const brandHover = "#E0AC1C";

  const shadowSm = useColorModeValue(
    "0 1px 2px rgba(0,0,0,0.04)",
    "none"
  );
  const shadowMd = useColorModeValue(
    "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
    "0 4px 6px rgba(0,0,0,0.4)"
  );
  const shadowLg = useColorModeValue(
    "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)",
    "0 10px 15px rgba(0,0,0,0.5)"
  );
  const shadowTopBar = useColorModeValue(
    "0 -4px 20px rgba(0,0,0,0.08)",
    "0 -4px 20px rgba(0,0,0,0.4)"
  );

  return {
    cardBg,
    pageBg,
    borderCo,
    borderLight,
    subtle,
    titleCol,
    brandColor,
    brandHover,
    shadowSm,
    shadowMd,
    shadowLg,
    shadowTopBar,
  };
};

/* ====================== Utils (Lógica intacta) ====================== */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const norm = (s) => (s || "").toString().toLowerCase();

const tokenize = (s) =>
  norm(s)
    .split(/[^a-z0-9áéíóúüñ]+/i)
    .filter(Boolean);

const clean = (s = "") =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (s = "", max = 220) =>
  s.length > max ? s.slice(0, max).trimEnd() + "…" : s;

const unitPriceFrom = (p) => {
  const base = Number(p?.precio) || 0;
  if (p?.precio_oferta && Number(p.precio_oferta) > 0)
    return Number(p.precio_oferta);
  if (p?.descuento && Number(p.descuento) > 0)
    return Math.max(0, base * (1 - Number(p.descuento) / 100));
  return base;
};

/* ================= Relacionados ================= */
function useRelatedProducts(producto, id) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const out = [];
        const seen = new Set([String(id)]);
        const cat = norm(producto?.categoria);

        if (cat) {
          const a = await api.get(
            `/productos?limit=24&page=1&categoria=${encodeURIComponent(cat)}`
          );
          (a.data?.productos || []).forEach((p) => {
            if (!seen.has(String(p.id))) {
              seen.add(String(p.id));
              out.push(p);
            }
          });
        }
        if (out.length < 12 && producto?.nombre) {
          const toks = tokenize(producto.nombre)
            .filter((t) => t.length >= 4)
            .slice(0, 3);
          for (const t of toks) {
            const b = await api.get(
              `/productos?limit=24&page=1&nombre=${encodeURIComponent(t)}`
            );
            (b.data?.productos || []).some((p) => {
              if (!seen.has(String(p.id))) {
                seen.add(String(p.id));
                out.push(p);
              }
              return out.length >= 12;
            });
            if (out.length >= 12) break;
          }
        }
        out.sort((a, b) => Number(b?.stock > 0) - Number(a?.stock > 0));
        if (!cancelled) setItems(out.slice(0, 12));
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [producto, id]);

  return { items, loading };
}

/* ===================== SectionCard (Diseño Limpio) ===================== */
const MotionBox = motion(Box);

function SectionCard({
  title,
  subtitle,
  right,
  children,
  id,
  noPadding = false,
}) {
  const { cardBg, shadowLg, titleCol } = useSurfaceTokens();
  const prefersReducedMotion = usePrefersReducedMotion();

  const animatedProps = prefersReducedMotion
    ? {}
    : {
      transition: { duration: 0.3, ease: "easeOut" },
      initial: { opacity: 0, y: 15 },
      animate: { opacity: 1, y: 0 },
    };

  return (
    <MotionBox
      id={id}
      {...animatedProps}
      bg={cardBg}
      borderRadius="2xl"
      boxShadow={shadowLg}
      mb={6}
      overflow="hidden"
    >
      {(title || right) && (
        <Box px={6} pt={6} pb={noPadding ? 0 : 2}>
          <HStack
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={4}
            mb={2}
          >
            <VStack align="start" spacing={0}>
              {title && (
                <Heading size="md" color={titleCol} letterSpacing="-0.01em">
                  {title}
                </Heading>
              )}
              {subtitle && (
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {subtitle}
                </Text>
              )}
            </VStack>
            {right}
          </HStack>
          {!noPadding && <Divider mt={3} opacity={0.6} />}
        </Box>
      )}
      <Box p={noPadding ? 0 : 6}>{children}</Box>
    </MotionBox>
  );
}

/* =========================== Principal (Cliente) =========================== */
export default function ClienteProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const tokens = useSurfaceTokens();
  const {
    pageBg,
    subtle,
    titleCol,
    cardBg,
    borderLight,
    brandColor,
    brandHover,
    shadowLg,
    shadowTopBar,
  } = tokens;

  const [producto, setProducto] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [qty, setQty] = useState(1);

  const lightbox = useDisclosure();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [id]);

  const images = useMemo(() => {
    const list = (imagenes || []).map((i) => `${API_BASE_URL}${i.url}`);
    return list.length
      ? list
      : producto?.imagen_principal
        ? [`${API_BASE_URL}${producto.imagen_principal}`]
        : ["https://via.placeholder.com/800x600?text=Sin+Imagen"];
  }, [imagenes, producto]);

  // 🔑 Ruta relativa que usaremos para el carrito/pasarela
  const mainImagePath = useMemo(() => {
    // Si tienes imágenes en la galería, usa la primera
    if (Array.isArray(imagenes) && imagenes.length > 0 && imagenes[0]?.url) {
      return imagenes[0].url; // 👈 importante: ruta RELATIVA, sin API_BASE_URL
    }
    // Si no, usa la imagen_principal del producto (si existe)
    if (producto?.imagen_principal) {
      return producto.imagen_principal;
    }
    // Si nada, null (la UI ya pondrá placeholder)
    return null;
  }, [imagenes, producto]);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setProducto(null);
        setImagenes([]);

        setLoading(true);
        const res = await api.get(`/productos/${id}`);
        if (!cancelled) setProducto(res.data);

        const imgRes = await api.get(`/productos/${id}/imagenes`);
        if (!cancelled)
          setImagenes(Array.isArray(imgRes.data) ? imgRes.data : []);

        setCurrent(0);
        setQty(1);
      } catch (e) {
        console.error("Detalle producto:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { items: relacionados, loading: relLoading } =
    useRelatedProducts(producto, id);

  const shortDescription = useMemo(
    () =>
      truncate(
        clean(producto?.descripcion || "Sin descripción."),
        180
      ),
    [producto]
  );
  const unitPrice = useMemo(
    () => (producto ? unitPriceFrom(producto) : 0),
    [producto]
  );
  const maxQty = Math.max(1, Math.min(Number(producto?.stock) || 1, 10));
  const clampedQty = Math.max(1, Math.min(Number(qty) || 1, maxQty));
  const totalPrice = unitPrice * clampedQty;

  const share = useCallback(async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: producto?.nombre || "Producto FerreExpress",
          text: "Revisa este producto de FerreExpress",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
      toast({
        title: "Enlace listo para compartir",
        status: "success",
        duration: 1500,
        position: "top",
        isClosable: true,
      });
    } catch {
      toast({
        title: "No se pudo compartir",
        status: "error",
        duration: 1500,
        isClosable: true,
      });
    }
  }, [toast, producto]);

  const goToDescription = useCallback(() => {
    const el =
      document.getElementById("descripcion") ||
      document.getElementById("descripcion-mobile");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleAdd = useCallback(() => {
    if (!producto) return;
    const q = Math.max(1, clampedQty);

    const productForCart = {
      ...producto,
      // Garantizamos que el carrito SIEMPRE tenga una imagen_principal usable
      imagen_principal: producto.imagen_principal ?? mainImagePath,
    };

    addToCart(productForCart, q);
    toast({
      title: "Agregado al carrito",
      description: `${producto.nombre} • ${q} und.`,
      status: "success",
      duration: 1600,
      position: "top-right",
      isClosable: true,
      icon: <Icon as={FiShoppingBag} />,
    });
  }, [producto, clampedQty, toast, mainImagePath]);


  const handleBuyNow = useCallback(() => {
    if (!producto) return;
    const q = Math.max(1, clampedQty);

    const productForCart = {
      ...producto,
      imagen_principal: producto.imagen_principal ?? mainImagePath,
    };

    addToCart(productForCart, q);
    navigate("/cliente/checkout");
  }, [producto, clampedQty, navigate, mainImagePath]);


  const nextImg = useCallback(
    (dir) =>
      setCurrent((c) => (c + dir + images.length) % images.length),
    [images.length]
  );

  const onKeyDownMain = useCallback(
    (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImg(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nextImg(-1);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        lightbox.onOpen();
      }
    },
    [nextImg, lightbox]
  );

  /* =================== Loading Skeleton Moderno =================== */
  if (loading && !producto) {
    return (
      <Box bg={pageBg} minH="100vh" py={{ base: 6, md: 10 }}>
        <Box maxW="1280px" mx="auto" px={{ base: 4, md: 8 }}>
          <Grid templateColumns={{ base: "1fr", lg: "7fr 4fr" }} gap={8}>
            <GridItem>
              <Skeleton
                h={{ base: "350px", md: "550px" }}
                borderRadius="2xl"
                startColor="gray.100"
                endColor="gray.300"
              />
              <HStack mt={6} spacing={4}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    height="80px"
                    w="80px"
                    borderRadius="lg"
                  />
                ))}
              </HStack>
            </GridItem>
            <GridItem>
              <Box bg={cardBg} p={8} borderRadius="2xl" boxShadow={shadowLg}>
                <Skeleton height="24px" w="40%" mb={6} />
                <Skeleton height="48px" w="60%" mb={8} />
                <Skeleton height="56px" borderRadius="xl" mb={4} />
                <Skeleton height="56px" borderRadius="xl" />
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    );
  }

  if (!producto)
    return (
      <Box p={10} textAlign="center">
        <Heading size="md" color="gray.500">
          Producto no encontrado
        </Heading>
        <Button mt={4} onClick={() => navigate("/cliente")}>
          Volver a la tienda
        </Button>
      </Box>
    );

  /* =================== Page =================== */
  return (
    <Box
      bg={pageBg}
      minH="100vh"
      py={{ base: 4, md: 8 }}
      transition="background 0.2s"
    >
      <Box maxW="1280px" mx="auto" px={{ base: 4, md: 6, xl: 8 }}>
        {/* Breadcrumb CLIENTE */}
        <HStack
          mb={6}
          color={subtle}
          fontSize="sm"
          spacing={1}
          overflowX="hidden"
          whiteSpace="nowrap"
        >
          <Text
            as="button"
            _hover={{ color: brandColor, textDecoration: "underline" }}
            onClick={() => navigate("/cliente")}
          >
            Inicio
          </Text>
          <Icon as={FiChevronRight} boxSize={3} />
          {producto.categoria && (
            <>
              <Text
                as="button"
                fontWeight="medium"
                _hover={{
                  color: brandColor,
                  textDecoration: "underline",
                }}
                onClick={() =>
                  navigate(
                    `/cliente?categoria=${encodeURIComponent(
                      producto.categoria
                    )}`
                  )
                }
              >
                {producto.categoria}
              </Text>
              <Icon as={FiChevronRight} boxSize={3} />
            </>
          )}
          <Text
            fontWeight="semibold"
            color={titleCol}
            isTruncated
            maxW="300px"
          >
            {producto.nombre}
          </Text>
        </HStack>

        <Grid
          templateColumns={{ base: "1fr", lg: "58% 38%" }}
          gap={{ base: 6, lg: 10 }}
          alignItems="start"
        >
          {/* === Columna Izquierda: Galería === */}
          <GridItem>
            <MotionBox
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Box
                bg="white"
                borderRadius="2xl"
                overflow="hidden"
                boxShadow={shadowLg}
                position="relative"
                role="group"
              >
                <VStack
                  position="absolute"
                  top={4}
                  left={4}
                  align="start"
                  zIndex={2}
                  spacing={2}
                >
                  {producto.exclusivo && (
                    <Badge
                      colorScheme="purple"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      boxShadow="md"
                    >
                      Exclusivo
                    </Badge>
                  )}
                  {Number(producto.stock) <= 0 && (
                    <Badge
                      colorScheme="red"
                      px={3}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                      boxShadow="md"
                    >
                      Agotado
                    </Badge>
                  )}
                </VStack>

                <Box
                  role="button"
                  aria-label="Ver imagen ampliada"
                  tabIndex={0}
                  onKeyDown={onKeyDownMain}
                  h={{ base: "350px", md: "550px" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="white"
                  cursor="zoom-in"
                  position="relative"
                  onClick={lightbox.onOpen}
                  p={6}
                >
                  <Image
                    src={images[current]}
                    alt={producto.nombre}
                    maxW="100%"
                    maxH="100%"
                    objectFit="contain"
                    transition="transform 0.3s ease"
                    _groupHover={{ transform: "scale(1.02)" }}
                  />

                  {images.length > 1 && (
                    <>
                      <IconButton
                        aria-label="Anterior"
                        icon={<FiChevronLeft />}
                        variant="solid"
                        isRound
                        size="md"
                        position="absolute"
                        left={4}
                        top="50%"
                        transform="translateY(-50%)"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="all 0.2s"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImg(-1);
                        }}
                        boxShadow="lg"
                      />
                      <IconButton
                        aria-label="Siguiente"
                        icon={<FiChevronRight />}
                        variant="solid"
                        isRound
                        size="md"
                        position="absolute"
                        right={4}
                        top="50%"
                        transform="translateY(-50%)"
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="all 0.2s"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImg(1);
                        }}
                        boxShadow="lg"
                      />
                    </>
                  )}
                </Box>
              </Box>

              {producto && Number(producto.stock) > 0 && (
                <Text
                  textAlign="center"
                  mt={3}
                  fontSize="sm"
                  color={subtle}
                  display={{ base: "none", md: "block" }}
                >
                  Haz clic en la imagen para ampliar
                </Text>
              )}

              {images.length > 1 && (
                <HStack
                  mt={4}
                  spacing={3}
                  overflowX="auto"
                  py={2}
                  justify={{ base: "start", md: "center" }}
                  css={{ "&::-webkit-scrollbar": { display: "none" } }}
                >
                  {images.map((src, i) => (
                    <Thumb
                      key={i}
                      src={src}
                      active={i === current}
                      onClick={() => setCurrent(i)}
                      brandColor={brandColor}
                    />
                  ))}
                </HStack>
              )}
            </MotionBox>

            {/* Descripción en Desktop */}
            <Box display={{ base: "none", lg: "block" }} mt={10}>
              <SectionCard title="Descripción del Producto" id="descripcion">
                <Box
                  fontSize="md"
                  color="gray.600"
                  sx={{
                    lineHeight: 1.8,
                    "& p": { mb: 4 },
                    "& ul": { pl: 5, mb: 4 },
                    "& li": { mb: 2 },
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      producto.descripcion?.trim() ||
                      "<p>Sin descripción detallada.</p>",
                  }}
                />
              </SectionCard>

              <SectionCard title="Especificaciones Técnicas" id="ficha-tecnica">
                <SimpleGrid columns={2} spacingY={4} spacingX={8}>
                  {producto.tipo && <Spec label="Tipo" value={producto.tipo} />}
                  {producto.modelo && (
                    <Spec label="Modelo" value={producto.modelo} />
                  )}
                  {producto.marca && (
                    <Spec label="Marca" value={producto.marca} />
                  )}
                  {producto.peso && <Spec label="Peso" value={producto.peso} />}
                </SimpleGrid>
              </SectionCard>
            </Box>
          </GridItem>

          {/* === Columna Derecha: Panel de Compra === */}
          <GridItem
            position={{ lg: "sticky" }}
            top={{ lg: "100px" }}
            zIndex={10}
          >
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              bg={cardBg}
              borderRadius="2xl"
              p={{ base: 5, md: 8 }}
              boxShadow={shadowLg}
              border="1px solid"
              borderColor={useColorModeValue("gray.100", "transparent")}
            >
              {/* Encabezado del Panel */}
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={1}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.400"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {producto.marca || "Producto"}
                  </Text>
                  <Heading
                    as="h1"
                    size="lg"
                    color={titleCol}
                    lineHeight="shorter"
                  >
                    {producto.nombre}
                  </Heading>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {shortDescription}
                  </Text>
                </VStack>
                <VStack align="flex-end" spacing={2}>
                  <Tooltip label="Compartir este producto">
                    <IconButton
                      icon={<FiShare2 />}
                      variant="ghost"
                      rounded="full"
                      onClick={share}
                      aria-label="Compartir"
                      color="gray.400"
                      _hover={{ color: brandColor, bg: "yellow.50" }}
                    />
                  </Tooltip>
                  <Tooltip label="Ir a ficha técnica">
                    <Button
                      size="xs"
                      variant="ghost"
                      leftIcon={<FiFileText />}
                      onClick={goToDescription}
                    >
                      Ficha técnica
                    </Button>
                  </Tooltip>
                </VStack>
              </HStack>

              {/* Precio y Stock */}
              <Divider my={5} borderColor={borderLight} />

              <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                <Box>
                  <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color={titleCol}
                    letterSpacing="-0.02em"
                  >
                    {fmtCop(totalPrice)}
                  </Text>
                  {qty > 1 && (
                    <Text fontSize="sm" color="gray.500">
                      {fmtCop(unitPrice)} por unidad
                    </Text>
                  )}
                </Box>
                {Number(producto.stock) > 0 ? (
                  <Badge
                    colorScheme="green"
                    variant="subtle"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    <HStack spacing={1}>
                      <Icon as={FiCheck} /> <Text>Disponible</Text>
                    </HStack>
                  </Badge>
                ) : (
                  <Badge colorScheme="red" variant="subtle">
                    Agotado
                  </Badge>
                )}
              </Flex>

              {/* Selector de Cantidad */}
              <Box mt={6}>
                <HStack justify="space-between" mb={2}>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={titleCol}
                  >
                    Cantidad
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {producto.stock} uds. disponibles
                  </Text>
                </HStack>
                <Select
                  size="lg"
                  borderRadius="xl"
                  focusBorderColor={brandColor}
                  value={String(clampedQty)}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                  isDisabled={Number(producto.stock) <= 0}
                  cursor="pointer"
                  bg={useColorModeValue("gray.50", "gray.700")}
                  border="none"
                  _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                >
                  {Array.from({ length: maxQty }).map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1} {i === 0 ? "unidad" : "unidades"}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Botones de Acción */}
              <VStack mt={6} spacing={3} w="full">
                <Button
                  w="full"
                  h="54px"
                  fontSize="md"
                  bg={brandColor}
                  color="gray.900"
                  _hover={{
                    bg: brandHover,
                    transform: "translateY(-1px)",
                    boxShadow: "lg",
                  }}
                  _active={{ transform: "translateY(0)" }}
                  onClick={handleBuyNow}
                  isDisabled={Number(producto.stock) <= 0}
                  borderRadius="xl"
                  fontWeight="bold"
                  leftIcon={<Icon as={FiShoppingBag} />}
                >
                  Comprar ahora
                </Button>
                <Button
                  w="full"
                  h="54px"
                  variant="outline"
                  borderColor={useColorModeValue(
                    "gray.300",
                    "gray.600"
                  )}
                  color={titleCol}
                  _hover={{
                    bg: useColorModeValue("gray.50", "gray.700"),
                    borderColor: brandColor,
                  }}
                  onClick={handleAdd}
                  isDisabled={Number(producto.stock) <= 0}
                  borderRadius="xl"
                >
                  Agregar al carrito
                </Button>
              </VStack>

              {/* Beneficios */}
              <VStack
                align="start"
                spacing={3}
                mt={8}
                pt={6}
                borderTop="1px dashed"
                borderColor={borderLight}
              >
                <BenefitItem
                  icon={FiTruck}
                  text="Envío asegurado a todo el país"
                />
                <BenefitItem
                  icon={FiShield}
                  text="Garantía de compra de 30 días"
                />
                <BenefitItem
                  icon={FiRefreshCw}
                  text="Devoluciones fáciles y rápidas"
                />
              </VStack>

              {/* Pagos */}
              <Box mt={6}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="gray.400"
                  mb={3}
                  textTransform="uppercase"
                >
                  Métodos de pago aceptados
                </Text>
                <PaymentMethods
                  logos={[
                    "/Visa.png",
                    "/Mastercard.png",
                    "/PSE.png",
                    "/Nequi.png",
                    "/DaviPlata.png",
                  ]}
                />
              </Box>
            </MotionBox>
          </GridItem>
        </Grid>

        {/* Descripción Móvil */}
        <Box display={{ base: "block", lg: "none" }} mt={8}>
          <SectionCard title="Descripción" id="descripcion-mobile">
            <Box
              fontSize="sm"
              color="gray.600"
              dangerouslySetInnerHTML={{
                __html:
                  producto.descripcion?.trim() ||
                  "<p>Sin descripción.</p>",
              }}
            />
          </SectionCard>
          <SectionCard title="Ficha técnica">
            <SimpleGrid columns={1} spacing={3}>
              {producto.tipo && <Spec label="Tipo" value={producto.tipo} />}
              {producto.marca && (
                <Spec label="Marca" value={producto.marca} />
              )}
              {producto.peso && <Spec label="Peso" value={producto.peso} />}
            </SimpleGrid>
          </SectionCard>
        </Box>

        {/* Productos Relacionados */}
        <Box mt={12}>
          <Heading
            size="lg"
            mb={6}
            color={titleCol}
            letterSpacing="-0.01em"
          >
            También te podría interesar
          </Heading>
          <Box
            bg={cardBg}
            borderRadius="2xl"
            p={6}
            boxShadow={shadowLg}
            position="relative"
          >
            <RowScroller
              loading={relLoading}
              items={relacionados}
              renderItem={(p, i) => (
                <RelatedCard
                  key={p?.id ?? `r-${i}`}
                  producto={p}
                  onClick={() =>
                    navigate(`/cliente/producto/${p.id}`)
                  }
                  brandColor={brandColor}
                />
              )}
            />
            {!relLoading &&
              (!relacionados || relacionados.length === 0) && (
                <Text color={subtle} textAlign="center" py={4}>
                  No hay productos relacionados por el momento.
                </Text>
              )}
          </Box>
        </Box>
      </Box>

      {/* Lightbox */}
      <Modal
        isOpen={lightbox.isOpen}
        onClose={lightbox.onClose}
        size="full"
        isCentered
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(10px)" />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          display="grid"
          placeItems="center"
          p={4}
        >
          <IconButton
            icon={
              <Icon
                as={FiRefreshCw}
                style={{ transform: "rotate(45deg)" }}
              />
            }
            aria-label="Cerrar"
            position="absolute"
            top={4}
            right={4}
            onClick={lightbox.onClose}
            bg="whiteAlpha.200"
            color="white"
            _hover={{ bg: "whiteAlpha.400" }}
            rounded="full"
            size="lg"
            zIndex={10}
          />
          <Image
            src={images[current]}
            alt={producto.nombre}
            maxW="100%"
            maxH="90vh"
            objectFit="contain"
            borderRadius="lg"
            boxShadow="2xl"
          />
        </ModalContent>
      </Modal>

      {/* Barra móvil */}
      <MobileBuyBar
        total={totalPrice}
        onBuy={handleBuyNow}
        onAdd={handleAdd}
        shadowTopBar={shadowTopBar}
        brandColor={brandColor}
      />
    </Box>
  );
}

/* ====================== Subcomponentes Estilizados ====================== */
function Thumb({ src, active, onClick, size = "70px", brandColor }) {
  return (
    <Box
      as="button"
      onClick={onClick}
      w={size}
      h={size}
      bg="white"
      borderRadius="xl"
      overflow="hidden"
      boxShadow={
        active
          ? `0 0 0 2px ${brandColor}`
          : "inset 0 0 0 1px rgba(0,0,0,0.1)"
      }
      opacity={active ? 1 : 0.6}
      _hover={{ opacity: 1, transform: "translateY(-2px)" }}
      transition="all 0.2s ease"
      flexShrink={0}
    >
      <Image
        src={src}
        alt=""
        w="100%"
        h="100%"
        objectFit="cover"
        loading="lazy"
      />
    </Box>
  );
}

function BenefitItem({ icon, text }) {
  return (
    <HStack spacing={3} color="gray.500">
      <Icon as={icon} boxSize={5} color="green.500" />
      <Text fontSize="sm">{text}</Text>
    </HStack>
  );
}

function PaymentMethods({ logos = [] }) {
  return (
    <HStack spacing={3} flexWrap="wrap">
      {logos.map((src, idx) => (
        <Box
          key={`${src}-${idx}`}
          bg="white"
          borderRadius="md"
          h="32px"
          px={2}
          display="grid"
          placeItems="center"
          border="1px solid"
          borderColor="gray.200"
          opacity={0.8}
          _hover={{ opacity: 1 }}
        >
          <Image src={src} alt="Payment" h="16px" objectFit="contain" />
        </Box>
      ))}
    </HStack>
  );
}

function MobileBuyBar({ total, onBuy, onAdd, shadowTopBar, brandColor }) {
  const bg = useColorModeValue(
    "rgba(255,255,255,0.9)",
    "rgba(26,32,44,0.9)"
  );

  return (
    <Box
      display={{ base: "block", lg: "none" }}
      position="sticky"
      bottom={0}
      zIndex={99}
      w="full"
      bg={bg}
      backdropFilter="blur(12px)"
      borderTop="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      boxShadow={shadowTopBar}
      pb="safe-area-inset-bottom"
    >
      <HStack p={4} spacing={3} justify="space-between" align="center">
        <VStack align="start" spacing={0}>
          <Text
            fontSize="xs"
            color="gray.500"
            fontWeight="bold"
            textTransform="uppercase"
          >
            Total
          </Text>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="gray.800"
            lineHeight="1"
          >
            {fmtCop(total)}
          </Text>
        </VStack>
        <HStack spacing={2} flex={1} justify="flex-end">
          <IconButton
            icon={<Icon as={FiShoppingBag} />}
            variant="outline"
            onClick={onAdd}
            aria-label="Añadir al carrito"
            h="48px"
            w="48px"
            borderRadius="xl"
            borderColor="gray.300"
          />
          <Button
            bg={brandColor}
            color="gray.900"
            onClick={onBuy}
            h="48px"
            flex={1}
            borderRadius="xl"
            fontSize="md"
            fontWeight="bold"
            _active={{ bg: "yellow.500" }}
          >
            Comprar
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
}

function Spec({ label, value }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        color="gray.400"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={1}
      >
        {label}
      </Text>
      <Text fontWeight="medium" color="gray.700" fontSize="md">
        {value}
      </Text>
    </Box>
  );
}

function RelatedCard({ producto, onClick, brandColor }) {
  const img = producto?.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/600x400?text=Sin+Imagen";

  if (!producto) return <SkeletonRelated />;

  return (
    <Box
      minW="200px"
      maxW="200px"
      bg="white"
      borderRadius="xl"
      overflow="hidden"
      border="1px solid"
      borderColor="gray.100"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "xl",
        borderColor: brandColor,
      }}
      transition="all 0.3s ease"
      cursor="pointer"
      onClick={onClick}
      scrollSnapAlign="start"
      role="group"
      position="relative"
    >
      <Box
        h="180px"
        bg="gray.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        position="relative"
      >
        <Image
          src={img}
          alt={producto.nombre}
          maxW="100%"
          maxH="100%"
          objectFit="contain"
          transition="transform 0.3s ease"
          _groupHover={{ transform: "scale(1.05)" }}
        />
      </Box>

      <Box p={4}>
        <Text
          noOfLines={2}
          fontSize="sm"
          fontWeight="medium"
          color="gray.700"
          h="40px"
          mb={2}
        >
          {producto.nombre}
        </Text>
        <Text fontWeight="bold" fontSize="lg" color="gray.900">
          {fmtCop(unitPriceFrom(producto))}
        </Text>
        <Text
          fontSize="xs"
          color={brandColor}
          fontWeight="bold"
          mt={1}
        >
          Ver detalles
        </Text>
      </Box>
    </Box>
  );
}

function SkeletonRelated() {
  return (
    <Box minW="200px" maxW="200px" bg="white" borderRadius="xl" p={3}>
      <Skeleton h="140px" borderRadius="lg" mb={3} />
      <SkeletonText noOfLines={2} spacing={2} />
      <Skeleton h="20px" w="60%" mt={4} />
    </Box>
  );
}

function RowScroller({ loading, items, renderItem }) {
  const ref = useRef(null);

  const scrollBy = (px) =>
    ref.current?.scrollBy({ left: px, behavior: "smooth" });

  if (loading && !items?.length) {
    return (
      <HStack spacing={4} overflow="hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRelated key={i} />
        ))}
      </HStack>
    );
  }

  return (
    <Box position="relative" mx={-2}>
      <IconButton
        icon={<FiChevronLeft />}
        isRound
        position="absolute"
        left={-4}
        top="50%"
        transform="translateY(-50%)"
        zIndex={5}
        onClick={() => scrollBy(-300)}
        bg="white"
        shadow="lg"
        display={{ base: "none", md: "flex" }}
        aria-label="Scroll izquierda"
      />
      <IconButton
        icon={<FiChevronRight />}
        isRound
        position="absolute"
        right={-4}
        top="50%"
        transform="translateY(-50%)"
        zIndex={5}
        onClick={() => scrollBy(300)}
        bg="white"
        shadow="lg"
        display={{ base: "none", md: "flex" }}
        aria-label="Scroll derecha"
      />

      <HStack
        ref={ref}
        spacing={4}
        overflowX="auto"
        py={4}
        px={2}
        css={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
        scrollSnapType="x mandatory"
      >
        {items.map((p, i) => renderItem(p, i))}
      </HStack>
    </Box>
  );
}
