import PromoHeroFadeBanner from "./PromoHeroFadeBanner";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  Skeleton,
  useBreakpointValue,
  useColorModeValue,
  IconButton,
  Tooltip,
  Kbd,
  AspectRatio,
  SimpleGrid,
  Spinner,
  Badge,
  ScaleFade,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiShoppingCart,
  FiLogIn,
  FiEye,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* ================= Utils ================= */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const FALLBACK_IMG = "/img/sin-imagen.png";

/* ================= Home ================= */
export default function Home() {
  const [productos, setProductos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("search")?.trim() || "";
  const isSearching = !!searchQuery;

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const mutedHeader = useColorModeValue("gray.600", "gray.300");
  const scrollBtnBg = useColorModeValue("gray.800", "gray.200");
  const scrollBtnColor = useColorModeValue("white", "gray.900");
  const welcomeBg = useColorModeValue("white", "gray.800");
  const welcomeBorder = useColorModeValue("gray.200", "gray.700");

  const onView = (p) => navigate(`/producto/${p.id}`);
  const onAdd = () => navigate("/login");
  const onBuy = () => navigate("/login");

  /* ---- Botón volver arriba ---- */
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* ---- Carga inicial (1 sola petición rápida) ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/productos", { params: { limit: 200, page: 1 } });
        if (alive) setProductos(res.data.productos || []);
      } catch (e) {
        console.error("Error productos:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ---- Búsqueda ---- */
  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return; }
    let alive = true;
    (async () => {
      setSearchLoading(true);
      try {
        const res = await api.get("/productos", {
          params: { search: searchQuery, limit: 48, page: 1 },
        });
        if (alive) setSearchResults(res.data.productos || []);
      } catch {
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setSearchLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [searchQuery]);

  /* ---- Recientes ---- */
  const recientes = useMemo(() => {
    return [...productos]
      .sort((a, b) => {
        const ca = a.created_at ? +new Date(a.created_at) : 0;
        const cb = b.created_at ? +new Date(b.created_at) : 0;
        return cb - ca;
      })
      .slice(0, 12);
  }, [productos]);

  /* ---- Agrupación por categoría ---- */
  const getCatLabel = (p) => {
    if (p?.categoria && String(p.categoria).trim()) return String(p.categoria).trim();
    if (Array.isArray(p?.categorias) && p.categorias.length) {
      const first = p.categorias.find(Boolean);
      if (first) return String(first).trim();
    }
    return "Sin categoría";
  };

  const groupedByCategoria = useMemo(() => {
    const map = new Map();
    for (const p of productos) {
      const label = getCatLabel(p);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(p);
    }
    for (const [label, arr] of map.entries()) {
      arr.sort((a, b) =>
        String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")
      );
      map.set(label, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "es"))
      .filter(([, items]) => items.length > 0);
  }, [productos]);

  /* ---- UI ---- */
  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>

      {/* Bienvenida + badge IVA */}
      <Box
        bg={welcomeBg}
        border="1px solid"
        borderColor={welcomeBorder}
        borderRadius="xl"
        boxShadow="sm"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        mb={5}
      >
        <Heading size="md" mb={1}>
          {isSearching ? `Resultados para: "${searchQuery}"` : "Bienvenido a FerreExpress"}
        </Heading>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Text color={mutedHeader} fontSize="sm">
            {isSearching
              ? "Explora los productos que coinciden con tu búsqueda"
              : "Explora el catálogo, descubre ofertas y encuentra todo para tus proyectos."}
          </Text>
          <Badge colorScheme="green" variant="subtle" fontSize="xs" px={2} py={1} borderRadius="md">
            Todos los precios incluyen IVA
          </Badge>
        </HStack>
      </Box>

      <PromoHeroFadeBanner
        images={["/Banner1.png", "/Banner2.png", "/Banner3.jpg", "/Banner4.png"]}
        intervalMs={4500}
        ratio={{ base: 16 / 7, md: 16 / 7, lg: 4 / 1 }}
      />

      {/* Resultados de búsqueda */}
      {isSearching && (
        <Box mt={8}>
          {searchLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Buscando productos...</Text>
            </Box>
          ) : searchResults.length === 0 ? (
            <EmptySearch
              query={searchQuery}
              onCategoryClick={(cat) => navigate(`/Home?search=${encodeURIComponent(cat)}`)}
            />
          ) : (
            <>
              <Text fontSize="sm" color={mutedHeader} mb={4}>
                {searchResults.length} producto{searchResults.length !== 1 ? "s" : ""} encontrado{searchResults.length !== 1 ? "s" : ""}
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
                {searchResults.map((p) => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    loading={false}
                    onView={() => onView(p)}
                    onAdd={onAdd}
                    onBuy={onBuy}
                  />
                ))}
              </SimpleGrid>
            </>
          )}
        </Box>
      )}

      {/* Secciones del catálogo */}
      {!isSearching && (
        <>
          <Section title="Recién llegado" mt={5}>
            <RowScroller
              loading={loading}
              items={recientes}
              renderItem={(p, i) => (
                <ProductCard
                  key={p?.id ?? `r-${i}`}
                  producto={p}
                  loading={!p}
                  onView={() => onView(p)}
                  onAdd={onAdd}
                  onBuy={onBuy}
                />
              )}
            />
          </Section>

          {groupedByCategoria.map(([catName, items]) => (
            <LazyCategorySection
              key={catName}
              catName={catName}
              items={items}
              loading={loading}
              onView={onView}
              onAdd={onAdd}
              onBuy={onBuy}
            />
          ))}
        </>
      )}

      {/* Botón volver arriba */}
      <ScaleFade initialScale={0.8} in={showScrollTop}>
        <IconButton
          aria-label="Volver arriba"
          icon={<Text fontSize="lg">↑</Text>}
          onClick={scrollToTop}
          position="fixed"
          bottom={{ base: "20px", md: "32px" }}
          right={{ base: "16px", md: "28px" }}
          zIndex={10}
          bg={scrollBtnBg}
          color={scrollBtnColor}
          borderRadius="full"
          boxShadow="lg"
          size="md"
          _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
          transition="all 0.2s"
        />
      </ScaleFade>
    </Box>
  );
}

/* ===== Lazy load de categorías ===== */
function LazyCategorySection({ catName, items, loading, onView, onAdd, onBuy }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const placeholderBg = useColorModeValue("white", "gray.800");
  const placeholderBorder = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Box ref={ref}>
      {visible ? (
        <Section title={catName} mt={5}>
          <RowScroller
            loading={loading}
            items={items}
            renderItem={(p, i) => (
              <ProductCard
                key={p?.id ?? `${catName}-${i}`}
                producto={p}
                loading={!p}
                onView={() => onView(p)}
                onAdd={onAdd}
                onBuy={onBuy}
              />
            )}
          />
        </Section>
      ) : (
        <Box
          mt={5}
          borderRadius="xl"
          bg={placeholderBg}
          border="1px solid"
          borderColor={placeholderBorder}
          p={4}
          minH="200px"
        >
          <Skeleton height="20px" width="160px" mb={4} />
          <HStack spacing={3}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </HStack>
        </Box>
      )}
    </Box>
  );
}

/* ===== Estado vacío búsqueda ===== */
function EmptySearch({ query, onCategoryClick }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const popularCategories = ["Herramientas", "Eléctrico", "Plomería", "Pintura", "Tornillos", "Pegamentos"];

  return (
    <Box textAlign="center" py={12}>
      <Text fontSize="4xl" mb={3}>🔍</Text>
      <Heading size="md" mb={2}>Sin resultados para "{query}"</Heading>
      <Text color={muted} fontSize="sm" mb={6}>
        Intenta con otras palabras o explora estas categorías:
      </Text>
      <HStack spacing={2} justify="center" flexWrap="wrap">
        {popularCategories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant="outline"
            borderRadius="full"
            onClick={() => onCategoryClick(cat)}
            _hover={{ bg: "yellow.50", borderColor: "yellow.400" }}
          >
            {cat}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}

/* ===== Section ===== */
function Section({ title, children, mt = 0 }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      boxShadow="sm"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
      mt={mt}
    >
      <Heading size="md" mb={3}>{title}</Heading>
      {children}
    </Box>
  );
}

/* ===== RowScroller ===== */
function RowScroller({ loading, items, renderItem, placeholderCount = 8 }) {
  const scrollerRef = useRef(null);
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const arrowSize = useBreakpointValue({ base: "sm", md: "md" }) ?? "sm";

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const SAFE_ZONE_PADDING = useBreakpointValue({ base: "8px", md: "64px" }) ?? "8px";
  const arrowBg = useColorModeValue("white", "gray.700");
  const arrowHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const arrowBorder = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  const content =
    loading || !items?.length
      ? Array.from({ length: placeholderCount }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
      : items.map((p, i) => renderItem(p, i));

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const scrollable = scrollWidth > clientWidth + 10;
    const atStart = scrollLeft < 10;
    const atEnd = scrollWidth - clientWidth - scrollLeft < 10;
    setIsScrollable(scrollable);
    setShowLeft(scrollable && !atStart);
    setShowRight(scrollable && !atEnd);
    if (scrollLeft > 20) setHasScrolled(true);
  }, []);

  useEffect(() => {
    handleScroll();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, loading, items]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || isMobile) return;
    const wheel = (e) => {
      const isTrackpadHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const wantsHorizontal = e.shiftKey || isTrackpadHorizontal;
      if (!wantsHorizontal) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      const delta = e.shiftKey ? e.deltaY : e.deltaX;
      if (!delta) return;
      e.preventDefault();
      el.scrollLeft += delta;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [isMobile]);

  const scrollBy = (px) => scrollerRef.current?.scrollBy({ left: px, behavior: "smooth" });

  return (
    <Box position="relative">
      {!isMobile && showLeft && (
        <Tooltip label="Anterior">
          <IconButton
            aria-label="Desplazar a la izquierda"
            icon={<FiChevronLeft />}
            size={arrowSize}
            variant="solid"
            isRound
            position="absolute"
            left="6px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            bg={arrowBg}
            border="1px solid"
            borderColor={arrowBorder}
            _hover={{ bg: arrowHoverBg }}
            boxShadow="sm"
            onClick={() => scrollBy(-280)}
          />
        </Tooltip>
      )}

      {!isMobile && showRight && (
        <Tooltip label="Siguiente">
          <IconButton
            aria-label="Desplazar a la derecha"
            icon={<FiChevronRight />}
            size={arrowSize}
            variant="solid"
            isRound
            position="absolute"
            right="6px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            bg={arrowBg}
            border="1px solid"
            borderColor={arrowBorder}
            _hover={{ bg: arrowHoverBg }}
            boxShadow="sm"
            onClick={() => scrollBy(280)}
          />
        </Tooltip>
      )}

      <HStack
        ref={scrollerRef}
        spacing={{ base: 3, md: 4 }}
        overflowX="auto"
        py={1}
        px={SAFE_ZONE_PADDING}
        css={{
          scrollPaddingInline: SAFE_ZONE_PADDING,
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {content}
      </HStack>

      {/* Hint: solo si hay overflow Y el usuario aún no scrolló */}
      {isScrollable && !hasScrolled && <ScrollHint isMobile={isMobile} />}
    </Box>
  );
}

/* ===== ProductCard ===== */
function ProductCard({ producto, loading, onView, onAdd }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const titleColor = useColorModeValue("gray.900", "gray.100");
  const priceColor = useColorModeValue("gray.900", "gray.50");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const oldPriceColor = useColorModeValue("gray.400", "gray.500");
  const hintBg = useColorModeValue("yellow.50", "gray.700");
  const detailHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");

  const ctaBorder = useColorModeValue("red.300", "red.400");
  const ctaColor = useColorModeValue("red.600", "red.300");
  const ctaHoverBg = useColorModeValue("red.50", "whiteAlpha.100");
  const ctaHoverBorder = useColorModeValue("red.400", "red.300");

  const [showHint, setShowHint] = useState(false);

  if (loading || !producto) return <SkeletonCard />;

  const img = producto.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : FALLBACK_IMG;

  const price = Number(producto.precio ?? 0);
  const brandText = (producto.marca || "").trim();

  /* -- Stock -- */
  const stock =
    producto.stock !== null && producto.stock !== undefined
      ? Number(producto.stock)
      : null;
  const stockBajo = stock !== null && stock > 0 && stock <= 5;
  const sinStock = stock !== null && stock === 0;

  /* -- Descuento -- */
  const precioOriginal = producto.precio_original
    ? Number(producto.precio_original)
    : null;
  const descuento =
    precioOriginal && precioOriginal > price
      ? Math.round(((precioOriginal - price) / precioOriginal) * 100)
      : null;

  const handleAddClick = (e) => {
    e.stopPropagation();
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2500);
  };

  return (
    <Box
      minW={{ base: "150px", sm: "165px", md: "210px" }}
      maxW={{ base: "150px", sm: "165px", md: "210px" }}
      bg={cardBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius={{ base: "xl", md: "2xl" }}
      overflow="hidden"
      boxShadow="xs"
      transition="transform .16s ease, box-shadow .16s ease"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
      as="article"
      cursor="pointer"
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(); }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver ${producto.nombre}`}
      display="flex"
      flexDirection="column"
      position="relative"
      sx={{
        scrollSnapAlign: "start",
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover .fe-product-img": { transform: "scale(1.06)" },
        },
      }}
    >
      {/* ---- Imagen + badges ---- */}
      <Box bg="white" borderBottom="1px solid" borderColor={borderCo} position="relative">

        {/* Badge descuento */}
        {descuento && (
          <Badge
            position="absolute"
            top="8px"
            left="8px"
            zIndex={1}
            colorScheme="red"
            borderRadius="md"
            fontSize="10px"
          >
            -{descuento}%
          </Badge>
        )}

        {/* Badge stock bajo (debajo del descuento si existe) */}
        {stockBajo && (
          <Badge
            position="absolute"
            top={descuento ? "28px" : "8px"}
            left="8px"
            zIndex={1}
            colorScheme="orange"
            borderRadius="md"
            fontSize="10px"
          >
            Últimas {stock} uds.
          </Badge>
        )}

        {/* Badge agotado */}
        {sinStock && (
          <Badge
            position="absolute"
            top="8px"
            left="8px"
            zIndex={1}
            colorScheme="gray"
            borderRadius="md"
            fontSize="10px"
          >
            Agotado
          </Badge>
        )}

        <AspectRatio ratio={1} w="100%">
          <Box overflow="hidden" w="100%" h="100%">
            <Image
              className="fe-product-img"
              src={img}
              alt={producto.nombre}
              w="100%"
              h="100%"
              objectFit="contain"
              objectPosition="center"
              loading="lazy"
              fallbackSrc={FALLBACK_IMG}
              transform="scale(1)"
              transition="transform .22s ease"
              opacity={sinStock ? 0.5 : 1}
            />
          </Box>
        </AspectRatio>
      </Box>

      {/* ---- Cuerpo ---- */}
      <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} p={{ base: 2.5, md: 3 }} flex="1">

        {/* Marca */}
        {brandText ? (
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            color={subtextColor}
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="0.06em"
            textAlign="center"
            noOfLines={1}
          >
            {brandText}
          </Text>
        ) : (
          <Box h={{ base: "8px", md: "10px" }} />
        )}

        {/* Nombre */}
        <Text
          color={titleColor}
          fontWeight="600"
          textAlign="center"
          fontSize={{ base: "sm", md: "sm" }}
          lineHeight="1.2"
          noOfLines={2}
          minH={{ base: "34px", md: "36px" }}
        >
          {producto.nombre}
        </Text>

        {/* Bloque de precios */}
        <VStack spacing={0} mt={1}>
          {/* Precio actual */}
          <Text
            textAlign="center"
            color={priceColor}
            fontWeight="700"
            fontSize={{ base: "md", md: "lg" }}
            letterSpacing="-0.01em"
          >
            {fmtCop(price)}
          </Text>
          {/* Precio original tachado si hay descuento */}
          {precioOriginal && descuento && (
            <Text
              textAlign="center"
              color={oldPriceColor}
              fontSize="xs"
              textDecoration="line-through"
            >
              {fmtCop(precioOriginal)}
            </Text>
          )}
          {/* IVA incluido — en cada tarjeta */}
          <Text
            textAlign="center"
            fontSize={{ base: "2xs", md: "xs" }}
            color={subtextColor}
            mt="2px"
          >
            IVA incluido
          </Text>
        </VStack>

        {/* Hint de login al intentar agregar */}
        {showHint && (
          <Box
            bg={hintBg}
            border="1px solid"
            borderColor="yellow.300"
            borderRadius="md"
            p={2}
            textAlign="center"
          >
            <HStack justify="center" spacing={1}>
              <FiLogIn size={12} />
              <Text fontSize="2xs" color={subtextColor} fontWeight="medium">
                Inicia sesión para comprar
              </Text>
            </HStack>
          </Box>
        )}

        {/* Botones */}
        <Box pt={{ base: 1, md: 1.5 }} onClick={(e) => e.stopPropagation()}>
          <Button
            w="full"
            size="sm"
            variant="outline"
            borderColor={ctaBorder}
            color={ctaColor}
            _hover={{ bg: ctaHoverBg, borderColor: ctaHoverBorder }}
            onClick={handleAddClick}
            minH={{ base: "34px", md: "38px" }}
            leftIcon={<FiShoppingCart size={14} />}
            isDisabled={sinStock}
            mb={1.5}
          >
            {sinStock ? "Agotado" : "Agregar"}
          </Button>
          <Button
            w="full"
            size="sm"
            variant="ghost"
            color={subtextColor}
            _hover={{ bg: detailHoverBg }}
            onClick={onView}
            minH={{ base: "30px", md: "34px" }}
            leftIcon={<FiEye size={13} />}
            fontSize="xs"
          >
            Ver detalles
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

/* ===== SkeletonCard ===== */
function SkeletonCard() {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  return (
    <Box
      minW={{ base: "150px", sm: "165px", md: "210px" }}
      maxW={{ base: "150px", sm: "165px", md: "210px" }}
      bg={cardBg}
      borderRadius={{ base: "xl", md: "2xl" }}
      overflow="hidden"
      boxShadow="xs"
      border="1px solid"
      borderColor={border}
      display="flex"
      flexDirection="column"
      sx={{ scrollSnapAlign: "start" }}
    >
      <AspectRatio ratio={1} w="100%">
        <Skeleton w="100%" h="100%" />
      </AspectRatio>
      <Box p={{ base: 2.5, md: 3 }}>
        <Skeleton height="10px" w="45%" mx="auto" mb={2} />
        <Skeleton height="14px" mb={2} />
        <Skeleton height="14px" w="70%" mx="auto" mb={3} />
        <Skeleton height="18px" w="55%" mx="auto" mb={1} />
        <Skeleton height="10px" w="40%" mx="auto" mb={3} />
        <Skeleton h={{ base: "34px", md: "38px" }} borderRadius="md" mb={1.5} />
        <Skeleton h={{ base: "30px", md: "34px" }} borderRadius="md" />
      </Box>
    </Box>
  );
}

/* ===== ScrollHint ===== */
function ScrollHint({ isMobile }) {
  const color = useColorModeValue("gray.500", "gray.400");
  return (
    <HStack mt={2} spacing={2} color={color} fontSize="xs">
      <Text>Desliza para ver más</Text>
      {!isMobile && (
        <>
          <HStack>
            <Kbd>Shift</Kbd>
            <Text>+</Text>
            <Kbd>Wheel</Kbd>
          </HStack>
          <Text>o usa</Text>
          <Kbd>←</Kbd>
          <Text>/</Text>
          <Kbd>→</Kbd>
        </>
      )}
    </HStack>
  );
}