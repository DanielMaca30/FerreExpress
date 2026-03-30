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
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* ================= Utils ================= */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

/* ================= Home (catálogo público) ================= */
export default function Home() {
  const [productos, setProductos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("search")?.trim() || "";
  const isSearching = !!searchQuery;

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const mutedHeader = useColorModeValue("gray.600", "gray.300");

  // ✅ RUTAS/LOGICA INTACTAS
  const onView = (p) => navigate(`/producto/${p.id}`);
  const onAdd = () => navigate("/login");
  const onBuy = () => navigate("/login");

  /* ================== 1) CARGA INICIAL: TRAER TODOS (paginado) ================== */
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const all = [];
        const limit = 200; // ajusta si quieres
        const MAX_PAGES = 50; // tope de seguridad
        let page = 1;

        while (page <= MAX_PAGES) {
          const res = await api.get("/productos", { params: { limit, page } });
          const batch = res.data.productos || [];
          all.push(...batch);

          // si ya no hay más resultados, paramos
          if (batch.length < limit) break;
          page++;
        }

        if (alive) setProductos(all);
      } catch (e) {
        console.error("Error productos:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ================== 2) BUSQUEDA (query string) ================== */
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    let alive = true;

    const fetchSearch = async () => {
      setSearchLoading(true);
      try {
        const res = await api.get("/productos", {
          params: { search: searchQuery, limit: 48, page: 1 },
        });
        if (alive) setSearchResults(res.data.productos || []);
      } catch (err) {
        console.error("Error en búsqueda:", err);
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setSearchLoading(false);
      }
    };

    fetchSearch();

    return () => {
      alive = false;
    };
  }, [searchQuery]);

  /* ================== 3) RECIENTES ================== */
  const recientes = useMemo(() => {
    const arr = [...productos];
    arr.sort((a, b) => {
      const ca = a.created_at ? +new Date(a.created_at) : 0;
      const cb = b.created_at ? +new Date(b.created_at) : 0;
      return cb - ca;
    });
    return arr.slice(0, 12);
  }, [productos]);

  /* ================== 4) AGRUPAR POR CATEGORÍA REAL (SIN QUITAR RECIENTES) ================== */
  const getCatLabel = (p) => {
    // prioridad: campo "categoria" string
    if (p?.categoria && String(p.categoria).trim()) return String(p.categoria).trim();

    // alternativa: array "categorias"
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

    // ordenar productos dentro de cada categoría (cambia si prefieres otro criterio)
    for (const [label, arr] of map.entries()) {
      arr.sort((a, b) =>
        String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")
      );
      map.set(label, arr);
    }

    // ordenar categorías alfabéticamente
    const ordered = Array.from(map.entries()).sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]), "es")
    );

    // opcional: ocultar vacías
    return ordered.filter(([, items]) => items.length > 0);
  }, [productos]);

  /* ================== UI ================== */
  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>
      {/* Mensaje de bienvenida siempre visible */}
      <Box
        bg={useColorModeValue("white", "gray.800")}
        border="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        borderRadius="xl"
        boxShadow="sm"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        mb={5}
      >
        <Heading size="md" mb={1}>
          {isSearching ? `Resultados para: "${searchQuery}"` : "Bienvenido a FerreExpress"}
        </Heading>
        <Text color={mutedHeader} fontSize="sm">
          {isSearching
            ? "Explora los productos que coinciden con tu búsqueda"
            : "Explora el catálogo, descubre ofertas y encuentra todo para tus proyectos."}
        </Text>
      </Box>

      <PromoHeroFadeBanner
        images={["/Banner1.png", "/Banner2.png", "/Banner3.jpg", "/Banner4.png"]}
        intervalMs={4500}
        ratio={{ base: 16 / 7, md: 16 / 7, lg: 4 / 1 }}
      />

      {/* ==================== Resultados de búsqueda ==================== */}
      {isSearching && (
        <Box mt={8}>
          {searchLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Buscando productos...</Text>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Heading size="md" mb={4} color="gray.600">
                No encontramos resultados
              </Heading>
              <Text color="gray.500">Prueba con otras palabras o revisa la ortografía</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={6}>
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
          )}
        </Box>
      )}

      {/* ==================== NO búsqueda: secciones ==================== */}
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

          {/* ✅ TODAS las categorías reales (incluye también los recientes) */}
          {groupedByCategoria.map(([catName, items]) => (
            <Section key={catName} title={catName} mt={5}>
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
                placeholderCount={8}
              />
            </Section>
          ))}
        </>
      )}
    </Box>
  );
}

/* =================== Subcomponentes =================== */

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
      <Heading size="md" mb={3}>
        {title}
      </Heading>
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

  const SAFE_ZONE_PADDING = useBreakpointValue({ base: "8px", md: "64px" }) ?? "8px";
  const arrowBg = useColorModeValue("white", "gray.700");
  const arrowHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const arrowBorder = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  const content =
    loading || !items?.length
      ? Array.from({ length: placeholderCount }).map((_, i) => (
          <SkeletonCard key={`sk-${i}`} />
        ))
      : items.map((p, i) => renderItem(p, i));

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    const isScrollable = scrollWidth > clientWidth + 10;
    const isStart = scrollLeft < 10;
    const isEnd = scrollWidth - clientWidth - scrollLeft < 10;

    setShowLeft(isScrollable && !isStart);
    setShowRight(isScrollable && !isEnd);
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

  // wheel horizontal SOLO desktop
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

  const scrollBy = (px) =>
    scrollerRef.current?.scrollBy({ left: px, behavior: "smooth" });

  return (
    <Box position="relative">
      {!isMobile && showLeft && (
        <Tooltip label="Anterior">
          <IconButton
            aria-label="Anterior"
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
            aria-label="Siguiente"
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

      <HintHint />
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

  const ctaBorder = useColorModeValue("red.300", "red.400");
  const ctaColor = useColorModeValue("red.600", "red.300");
  const ctaHoverBg = useColorModeValue("red.50", "whiteAlpha.100");
  const ctaHoverBorder = useColorModeValue("red.400", "red.300");

  if (loading || !producto) return <SkeletonCard />;

  const img = producto.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/600x600?text=Sin+Imagen";

  const price = Number(producto.precio ?? 0);
  const brandText = (producto.marca || "").trim();

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
      _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
      role="button"
      tabIndex={0}
      cursor="pointer"
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView?.();
        }
      }}
      display="flex"
      flexDirection="column"
      sx={{
        scrollSnapAlign: "start",
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover .fe-product-img": { transform: "scale(1.06)" },
        },
      }}
    >
      <Box bg="white" borderBottom="1px solid" borderColor={borderCo}>
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
              transform="scale(1)"
              transition="transform .22s ease"
            />
          </Box>
        </AspectRatio>
      </Box>

      <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} p={{ base: 2.5, md: 3 }} flex="1">
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

        <Text
          textAlign="center"
          color={priceColor}
          fontWeight="600"
          fontSize={{ base: "md", md: "lg" }}
          letterSpacing="-0.01em"
          mt={1}
        >
          {fmtCop(price)}
        </Text>

        <Text textAlign="center" fontSize={{ base: "2xs", md: "xs" }} color={subtextColor} mt="-6px">
          IVA incluido • Unidad
        </Text>

        <Box pt={{ base: 1, md: 2 }} onClick={(e) => e.stopPropagation()}>
          <Button
            w="full"
            size="sm"
            variant="outline"
            borderColor={ctaBorder}
            color={ctaColor}
            _hover={{ bg: ctaHoverBg, borderColor: ctaHoverBorder }}
            onClick={onAdd}
            minH={{ base: "34px", md: "40px" }}
          >
            Agregar al carrito
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

/* ===== Skeleton Card ===== */
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
        <Skeleton height="16px" w="60%" mx="auto" mb={2} />
        <Skeleton height="10px" w="55%" mx="auto" mb={3} />
        <Skeleton h={{ base: "34px", md: "40px" }} borderRadius="md" />
      </Box>
    </Box>
  );
}

/* ===== Hint ===== */
function HintHint() {
  const color = useColorModeValue("gray.500", "gray.400");
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;

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
