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
import { FiChevronLeft, FiChevronRight, FiHome, FiGrid } from "react-icons/fi";
import { MdChevronRight } from "react-icons/md";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* ================= Utils ================= */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

/* ================= Home ================= */
export default function Home() {
  const [productos, setProductos] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchQuery = searchParams.get("search")?.trim() || "";
  const isSearching = !!searchQuery;

  const pageBg = useColorModeValue("#f2f3f5", "#0f1117");
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;

  const onView = (p) => navigate(`/producto/${p.id}`);
  const onAdd = () => navigate("/login");
  const onBuy = () => navigate("/login");

  /* ====== Carga inicial ====== */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const all = [];
        const limit = 200;
        const MAX_PAGES = 50;
        let page = 1;
        while (page <= MAX_PAGES) {
          const res = await api.get("/productos", { params: { limit, page } });
          const batch = res.data.productos || [];
          all.push(...batch);
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
    return () => { alive = false; };
  }, []);

  /* ====== Búsqueda ====== */
  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); return; }
    let alive = true;
    const fetchSearch = async () => {
      setSearchLoading(true);
      try {
        const res = await api.get("/productos", {
          params: { search: searchQuery, limit: 48, page: 1 },
        });
        if (alive) setSearchResults(res.data.productos || []);
      } catch (err) {
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setSearchLoading(false);
      }
    };
    fetchSearch();
    return () => { alive = false; };
  }, [searchQuery]);

  useEffect(() => {
    if (isSearching) setActiveCategory(null);
  }, [isSearching]);

  /* ====== Recientes ====== */
  const recientes = useMemo(() => {
    const arr = [...productos];
    arr.sort((a, b) => {
      const ca = a.created_at ? +new Date(a.created_at) : 0;
      const cb = b.created_at ? +new Date(b.created_at) : 0;
      return cb - ca;
    });
    return arr.slice(0, 12);
  }, [productos]);

  /* ====== Categorías ====== */
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
      arr.sort((a, b) => String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es"));
      map.set(label, arr);
    }
    const ordered = Array.from(map.entries()).sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]), "es")
    );
    return ordered.filter(([, items]) => items.length > 0);
  }, [productos]);

  const categoryNames = useMemo(() => groupedByCategoria.map(([name]) => name), [groupedByCategoria]);

  const activeCategoryItems = useMemo(() => {
    if (!activeCategory) return [];
    return groupedByCategoria.find(([name]) => name === activeCategory)?.[1] || [];
  }, [activeCategory, groupedByCategoria]);

  /* ====== UI ====== */
  return (
    <Box bg={pageBg} minH="100vh">

      {/* ===== BARRA DE CATEGORÍAS STICKY ===== */}
      {!isSearching && (
        <CategoryBar
          categories={categoryNames}
          active={activeCategory}
          onSelect={setActiveCategory}
          loading={loading}
        />
      )}

      <Box px={{ base: 0, md: 6, lg: 10 }} py={{ base: 0, md: 4 }}>

        {/* ===== BÚSQUEDA ===== */}
        {isSearching && (
          <Box px={{ base: 3, md: 0 }} pt={{ base: 3, md: 0 }}>
            <BreadcrumbNav
              crumbs={[
                { label: "Inicio", onClick: () => navigate("/") },
                { label: `"${searchQuery}"`, active: true },
              ]}
            />
            <Box mt={3}>
              {searchLoading ? (
                <Box textAlign="center" py={16}>
                  <Spinner size="xl" />
                  <Text mt={4} color="gray.500">Buscando productos...</Text>
                </Box>
              ) : searchResults.length === 0 ? (
                <EmptyState title="Sin resultados" subtitle="Prueba con otras palabras o revisa la ortografía." />
              ) : (
                <>
                  <SectionHeader
                    title={`${searchResults.length} resultado${searchResults.length !== 1 ? "s" : ""}`}
                    subtle
                  />
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={{ base: 3, md: 5 }} mt={3}>
                    {searchResults.map((p) =>
                      isMobile ? (
                        <ProductCardGrid key={p.id} producto={p} onView={() => onView(p)} onAdd={onAdd} />
                      ) : (
                        <ProductCard key={p.id} producto={p} onView={() => onView(p)} onAdd={onAdd} onBuy={onBuy} />
                      )
                    )}
                  </SimpleGrid>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ===== CATEGORÍA ACTIVA ===== */}
        {!isSearching && activeCategory && (
          <Box px={{ base: 3, md: 0 }} pt={{ base: 3, md: 4 }}>
            <BreadcrumbNav
              crumbs={[
                { label: "Inicio", onClick: () => setActiveCategory(null) },
                { label: "Categorías", onClick: () => setActiveCategory(null) },
                { label: activeCategory, active: true },
              ]}
            />
            <Box mt={3}>
              {loading ? (
                <Box textAlign="center" py={16}><Spinner size="xl" /></Box>
              ) : activeCategoryItems.length === 0 ? (
                <EmptyState title="Sin productos" subtitle="Esta categoría no tiene productos aún." />
              ) : (
                <>
                  <SectionHeader title={activeCategory} count={activeCategoryItems.length} />
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={{ base: 3, md: 5 }} mt={3}>
                    {activeCategoryItems.map((p) =>
                      isMobile ? (
                        <ProductCardGrid key={p.id} producto={p} onView={() => onView(p)} onAdd={onAdd} />
                      ) : (
                        <ProductCard key={p.id} producto={p} onView={() => onView(p)} onAdd={onAdd} onBuy={onBuy} />
                      )
                    )}
                  </SimpleGrid>
                </>
              )}
            </Box>
          </Box>
        )}

        {/* ===== VISTA GENERAL ===== */}
        {!isSearching && !activeCategory && (
          <>
            <WelcomeBanner isMobile={isMobile} />

            <PromoHeroFadeBanner
              images={["/Banner1.png", "/Banner2.png", "/Banner3.jpg", "/Banner4.png"]}
              intervalMs={4500}
              ratio={{ base: 16 / 7, md: 16 / 7, lg: 4 / 1 }}
            />

            {isMobile ? (
              <MobileSection title="Recién llegado" loading={loading} items={recientes} onView={onView} onAdd={onAdd} />
            ) : (
              <DesktopSection title="Recién llegado" mt={5}>
                <RowScroller loading={loading} items={recientes}
                  renderItem={(p, i) => (
                    <ProductCard key={p?.id ?? `r-${i}`} producto={p} loading={!p}
                      onView={() => onView(p)} onAdd={onAdd} onBuy={onBuy} />
                  )}
                />
              </DesktopSection>
            )}

            {groupedByCategoria.map(([catName, items]) =>
              isMobile ? (
                <MobileSection key={catName} title={catName} loading={loading} items={items} onView={onView} onAdd={onAdd} />
              ) : (
                <DesktopSection key={catName} title={catName} mt={5}>
                  <RowScroller loading={loading} items={items}
                    renderItem={(p, i) => (
                      <ProductCard key={p?.id ?? `${catName}-${i}`} producto={p} loading={!p}
                        onView={() => onView(p)} onAdd={onAdd} onBuy={onBuy} />
                    )}
                    placeholderCount={8}
                  />
                </DesktopSection>
              )
            )}
          </>
        )}

        {isMobile && <Box h={8} />}
      </Box>
    </Box>
  );
}

/* ==========================================================
   CATEGORY BAR — sticky, horizontal scroll, chips
========================================================== */
function CategoryBar({ categories, active, onSelect, loading }) {
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const shadow = useColorModeValue(
    "0 2px 8px rgba(0,0,0,0.06)",
    "0 2px 8px rgba(0,0,0,0.3)"
  );

  const chipBg = useColorModeValue("gray.100", "gray.800");
  const chipColor = useColorModeValue("gray.700", "gray.300");
  const chipBorder = useColorModeValue("gray.200", "gray.600");
  const chipHover = useColorModeValue("gray.200", "gray.700");
  const activeChipBg = useColorModeValue("red.600", "red.500");
  const activeChipShadow = "0 2px 10px rgba(229,62,62,0.4)";

  if (loading) {
    return (
      <Box position="sticky" top={0} zIndex={100} bg={bg}
        borderBottom="1px solid" borderColor={borderColor} boxShadow={shadow}
        px={{ base: 3, md: 6, lg: 10 }} py={2.5}>
        <HStack spacing={2}>
          {[80, 110, 90, 120, 75, 100].map((w, i) => (
            <Skeleton key={i} h="32px" w={`${w}px`} borderRadius="full" flexShrink={0} />
          ))}
        </HStack>
      </Box>
    );
  }

  const allCats = ["Todos", ...categories];

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={100}
      bg={bg}
      borderBottom="1px solid"
      borderColor={borderColor}
      boxShadow={shadow}
    >
      <Box
        overflowX="auto"
        px={{ base: 3, md: 6, lg: 10 }}
        py={2.5}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <HStack spacing={2} width="max-content">
          {allCats.map((cat) => {
            const isAll = cat === "Todos";
            const isActive = isAll ? active === null : active === cat;
            return (
              <Box
                key={cat}
                as="button"
                display="inline-flex"
                alignItems="center"
                gap="6px"
                px={{ base: 3, md: 4 }}
                py={{ base: 1.5, md: 2 }}
                borderRadius="full"
                border="1px solid"
                borderColor={isActive ? "transparent" : chipBorder}
                bg={isActive ? activeChipBg : chipBg}
                color={isActive ? "white" : chipColor}
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight={isActive ? "700" : "500"}
                whiteSpace="nowrap"
                cursor="pointer"
                flexShrink={0}
                boxShadow={isActive ? activeChipShadow : "none"}
                transition="all 0.18s cubic-bezier(.4,0,.2,1)"
                _hover={{
                  bg: isActive ? "red.700" : chipHover,
                  transform: isActive ? "none" : "translateY(-1px)",
                  boxShadow: isActive ? activeChipShadow : "sm",
                }}
                _active={{ transform: "scale(0.95)" }}
                onClick={() => onSelect(isAll ? null : cat)}
              >
                {isAll && <Box as={FiGrid} boxSize="11px" flexShrink={0} />}
                <Text as="span">{cat}</Text>
              </Box>
            );
          })}
        </HStack>
      </Box>
    </Box>
  );
}

/* ==========================================================
   BREADCRUMB NAV
========================================================== */
function BreadcrumbNav({ crumbs }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const activeColor = useColorModeValue("gray.800", "gray.100");
  const hoverColor = useColorModeValue("red.600", "red.400");

  return (
    <HStack spacing={1} fontSize={{ base: "xs", md: "sm" }} color={mutedColor} flexWrap="wrap">
      {crumbs.map((crumb, i) => (
        <HStack key={i} spacing={1} align="center">
          {i > 0 && <Box as={MdChevronRight} boxSize="14px" opacity={0.5} />}
          {crumb.active ? (
            <Text fontWeight="600" color={activeColor} noOfLines={1} maxW="200px">
              {crumb.label}
            </Text>
          ) : (
            <HStack
              as="button"
              spacing={1}
              align="center"
              onClick={crumb.onClick}
              cursor="pointer"
              transition="color 0.15s"
              _hover={{ color: hoverColor }}
            >
              {i === 0 && <Box as={FiHome} boxSize="12px" />}
              <Text as="span">{crumb.label}</Text>
            </HStack>
          )}
        </HStack>
      ))}
    </HStack>
  );
}

/* ==========================================================
   SECTION HEADER
========================================================== */
function SectionHeader({ title, count, subtle = false }) {
  const color = useColorModeValue("gray.800", "gray.100");
  const countColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("red.600", "red.400");

  return (
    <HStack spacing={3} align="center" py={1}>
      {!subtle && <Box w="3px" h="22px" bg={accentColor} borderRadius="full" flexShrink={0} />}
      <Heading as="h2" size={{ base: "md", md: "lg" }} color={color}
        fontWeight="700" letterSpacing="-0.02em" noOfLines={1}>
        {title}
      </Heading>
      {count != null && (
        <Text fontSize="sm" color={countColor} fontWeight="400">
          ({count} producto{count !== 1 ? "s" : ""})
        </Text>
      )}
    </HStack>
  );
}

/* ==========================================================
   EMPTY STATE
========================================================== */
function EmptyState({ title, subtitle }) {
  const color = useColorModeValue("gray.500", "gray.400");
  const headColor = useColorModeValue("gray.700", "gray.200");
  return (
    <Box textAlign="center" py={16}>
      <Text fontSize="3xl" mb={3}>📦</Text>
      <Heading size="md" mb={2} color={headColor}>{title}</Heading>
      <Text color={color} fontSize="sm">{subtitle}</Text>
    </Box>
  );
}

/* ==========================================================
   WELCOME BANNER
========================================================== */
function WelcomeBanner({ isMobile }) {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  if (isMobile) {
    return (
      <Box bg={bg} px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
        <Heading size="sm" mb={0.5} letterSpacing="-0.01em">Bienvenido a FerreExpress</Heading>
        <Text color={mutedColor} fontSize="xs">
          Explora el catálogo y encuentra todo para tus proyectos.
        </Text>
      </Box>
    );
  }

  return (
    <Box bg={bg} border="1px solid" borderColor={borderColor}
      borderRadius="xl" boxShadow="sm" px={5} py={4} mb={5}>
      <Heading size="md" mb={1} letterSpacing="-0.01em">Bienvenido a FerreExpress</Heading>
      <Text color={mutedColor} fontSize="sm">
        Explora el catálogo, descubre ofertas y encuentra todo para tus proyectos.
      </Text>
    </Box>
  );
}

/* ==========================================================
   MOBILE SECTION
========================================================== */
function MobileSection({ title, loading, items, onView, onAdd }) {
  const headingBg = useColorModeValue("white", "gray.900");
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const accentColor = useColorModeValue("red.500", "red.400");
  const dividerColor = useColorModeValue("gray.200", "gray.700");

  const displayItems = loading || !items?.length ? Array.from({ length: 6 }) : items;

  return (
    <Box mt={4}>
      <Box bg={headingBg} px={4} py={2.5}
        borderTop="1px solid" borderBottom="1px solid" borderColor={dividerColor}
        display="flex" alignItems="center" gap={2}>
        <Box w="3px" h="18px" bg={accentColor} borderRadius="full" flexShrink={0} />
        <Heading size="sm" color={headingColor} fontWeight="700"
          letterSpacing="-0.01em" noOfLines={1}>
          {title}
        </Heading>
      </Box>
      <Box px={3} pt={3} pb={1}>
        <SimpleGrid columns={2} spacing={3}>
          {displayItems.map((p, i) =>
            !p ? (
              <SkeletonCardGrid key={`sk-${i}`} />
            ) : (
              <ProductCardGrid key={p.id ?? i} producto={p} onView={() => onView(p)} onAdd={onAdd} />
            )
          )}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

/* ==========================================================
   PRODUCT CARD GRID (móvil)
========================================================== */
function ProductCardGrid({ producto, loading, onView, onAdd }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "gray.100");
  const priceColor = useColorModeValue("gray.900", "gray.50");
  const subtextColor = useColorModeValue("gray.500", "gray.400");
  const ctaBorder = useColorModeValue("red.300", "red.400");
  const ctaColor = useColorModeValue("red.600", "red.300");
  const ctaHoverBg = useColorModeValue("red.50", "whiteAlpha.100");
  const ctaHoverBorder = useColorModeValue("red.400", "red.300");

  if (loading || !producto) return <SkeletonCardGrid />;

  const img = producto.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/400x400?text=Sin+Imagen";
  const price = Number(producto.precio ?? 0);
  const brandText = (producto.marca || "").trim();

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderCo} borderRadius="xl"
      overflow="hidden" boxShadow="xs"
      transition="transform .15s ease, box-shadow .15s ease"
      _active={{ transform: "scale(0.97)" }}
      role="button" tabIndex={0} cursor="pointer" onClick={onView}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(); } }}
      display="flex" flexDirection="column">
      <Box bg="white" borderBottom="1px solid" borderColor={borderCo}>
        <AspectRatio ratio={1} w="100%">
          <Box overflow="hidden" w="100%" h="100%">
            <Image src={img} alt={producto.nombre} w="100%" h="100%"
              objectFit="contain" objectPosition="center" loading="lazy" />
          </Box>
        </AspectRatio>
      </Box>
      <VStack align="stretch" spacing={1} p={2.5} flex="1">
        {brandText && (
          <Text fontSize="9px" color={subtextColor} fontWeight="700"
            textTransform="uppercase" letterSpacing="0.08em" noOfLines={1}>
            {brandText}
          </Text>
        )}
        <Text color={titleColor} fontWeight="600" fontSize="xs"
          lineHeight="1.3" noOfLines={2} minH="30px">
          {producto.nombre}
        </Text>
        <Text color={priceColor} fontWeight="700" fontSize="sm"
          letterSpacing="-0.02em" mt={0.5}>
          {fmtCop(price)}
        </Text>
        <Text fontSize="9px" color={subtextColor} mt="-2px">IVA incluido</Text>
        <Box pt={1.5} onClick={(e) => e.stopPropagation()}>
          <Button w="full" size="xs" variant="outline"
            borderColor={ctaBorder} color={ctaColor}
            _hover={{ bg: ctaHoverBg, borderColor: ctaHoverBorder }}
            onClick={onAdd} minH="32px" fontSize="11px" fontWeight="600">
            Agregar
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

/* ==========================================================
   SKELETON GRID (móvil)
========================================================== */
function SkeletonCardGrid() {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box bg={cardBg} borderRadius="xl" overflow="hidden" boxShadow="xs"
      border="1px solid" borderColor={border} display="flex" flexDirection="column">
      <AspectRatio ratio={1} w="100%"><Skeleton w="100%" h="100%" /></AspectRatio>
      <Box p={2.5}>
        <Skeleton height="8px" w="40%" mb={2} />
        <Skeleton height="12px" mb={1.5} />
        <Skeleton height="12px" w="75%" mb={2} />
        <Skeleton height="14px" w="55%" mb={2} />
        <Skeleton height="8px" w="45%" mb={2} />
        <Skeleton height="32px" borderRadius="md" />
      </Box>
    </Box>
  );
}

/* ==========================================================
   DESKTOP SECTION
========================================================== */
function DesktopSection({ title, children, mt = 0 }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box bg={cardBg} border="1px solid" borderColor={border}
      borderRadius="xl" boxShadow="sm" px={4} py={4} mt={mt}>
      <Heading size="md" mb={3} letterSpacing="-0.01em">{title}</Heading>
      {children}
    </Box>
  );
}

/* ==========================================================
   ROW SCROLLER (desktop)
========================================================== */
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

  const content = loading || !items?.length
    ? Array.from({ length: placeholderCount }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
    : items.map((p, i) => renderItem(p, i));

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isScrollable = scrollWidth > clientWidth + 10;
    setShowLeft(isScrollable && scrollLeft >= 10);
    setShowRight(isScrollable && scrollWidth - clientWidth - scrollLeft >= 10);
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
      const isTrackpadH = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!e.shiftKey && !isTrackpadH) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      e.preventDefault();
      el.scrollLeft += e.shiftKey ? e.deltaY : e.deltaX;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [isMobile]);

  const scrollBy = (px) => scrollerRef.current?.scrollBy({ left: px, behavior: "smooth" });

  return (
    <Box position="relative">
      {!isMobile && showLeft && (
        <Tooltip label="Anterior">
          <IconButton aria-label="Anterior" icon={<FiChevronLeft />} size={arrowSize}
            variant="solid" isRound position="absolute" left="6px" top="50%"
            transform="translateY(-50%)" zIndex={2} bg={arrowBg}
            border="1px solid" borderColor={arrowBorder}
            _hover={{ bg: arrowHoverBg }} boxShadow="sm"
            onClick={() => scrollBy(-280)} />
        </Tooltip>
      )}
      {!isMobile && showRight && (
        <Tooltip label="Siguiente">
          <IconButton aria-label="Siguiente" icon={<FiChevronRight />} size={arrowSize}
            variant="solid" isRound position="absolute" right="6px" top="50%"
            transform="translateY(-50%)" zIndex={2} bg={arrowBg}
            border="1px solid" borderColor={arrowBorder}
            _hover={{ bg: arrowHoverBg }} boxShadow="sm"
            onClick={() => scrollBy(280)} />
        </Tooltip>
      )}
      <HStack ref={scrollerRef} spacing={{ base: 3, md: 4 }} overflowX="auto" py={1}
        px={SAFE_ZONE_PADDING}
        css={{
          scrollPaddingInline: SAFE_ZONE_PADDING,
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}>
        {content}
      </HStack>
      <HintHint />
    </Box>
  );
}

/* ==========================================================
   PRODUCT CARD (desktop)
========================================================== */
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
      bg={cardBg} border="1px solid" borderColor={borderCo}
      borderRadius={{ base: "xl", md: "2xl" }} overflow="hidden" boxShadow="xs"
      transition="transform .16s ease, box-shadow .16s ease"
      _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
      role="button" tabIndex={0} cursor="pointer" onClick={onView}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onView?.(); } }}
      display="flex" flexDirection="column"
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
            <Image className="fe-product-img" src={img} alt={producto.nombre}
              w="100%" h="100%" objectFit="contain" objectPosition="center"
              loading="lazy" transform="scale(1)" transition="transform .22s ease" />
          </Box>
        </AspectRatio>
      </Box>
      <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} p={{ base: 2.5, md: 3 }} flex="1">
        {brandText ? (
          <Text fontSize={{ base: "2xs", md: "xs" }} color={subtextColor} fontWeight="semibold"
            textTransform="uppercase" letterSpacing="0.06em" textAlign="center" noOfLines={1}>
            {brandText}
          </Text>
        ) : <Box h={{ base: "8px", md: "10px" }} />}
        <Text color={titleColor} fontWeight="600" textAlign="center"
          fontSize={{ base: "sm", md: "sm" }} lineHeight="1.2" noOfLines={2}
          minH={{ base: "34px", md: "36px" }}>
          {producto.nombre}
        </Text>
        <Text textAlign="center" color={priceColor} fontWeight="600"
          fontSize={{ base: "md", md: "lg" }} letterSpacing="-0.01em" mt={1}>
          {fmtCop(price)}
        </Text>
        <Text textAlign="center" fontSize={{ base: "2xs", md: "xs" }} color={subtextColor} mt="-6px">
          IVA incluido • Unidad
        </Text>
        <Box pt={{ base: 1, md: 2 }} onClick={(e) => e.stopPropagation()}>
          <Button w="full" size="sm" variant="outline" borderColor={ctaBorder}
            color={ctaColor} _hover={{ bg: ctaHoverBg, borderColor: ctaHoverBorder }}
            onClick={onAdd} minH={{ base: "34px", md: "40px" }}>
            Agregar al carrito
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

/* ==========================================================
   SKELETON CARD (desktop)
========================================================== */
function SkeletonCard() {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  return (
    <Box minW={{ base: "150px", sm: "165px", md: "210px" }}
      maxW={{ base: "150px", sm: "165px", md: "210px" }}
      bg={cardBg} borderRadius={{ base: "xl", md: "2xl" }} overflow="hidden"
      boxShadow="xs" border="1px solid" borderColor={border}
      display="flex" flexDirection="column" sx={{ scrollSnapAlign: "start" }}>
      <AspectRatio ratio={1} w="100%"><Skeleton w="100%" h="100%" /></AspectRatio>
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

/* ==========================================================
   HINT (desktop only)
========================================================== */
function HintHint() {
  const color = useColorModeValue("gray.500", "gray.400");
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  if (isMobile) return null;
  return (
    <HStack mt={2} spacing={2} color={color} fontSize="xs">
      <Text>Desliza para ver más</Text>
      <HStack><Kbd>Shift</Kbd><Text>+</Text><Kbd>Wheel</Kbd></HStack>
      <Text>o usa</Text>
      <Kbd>←</Kbd><Text>/</Text><Kbd>→</Kbd>
    </HStack>
  );
}