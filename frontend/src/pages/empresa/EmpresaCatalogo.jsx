import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Stack,
  Image,
  Skeleton,
  SkeletonText,
  useBreakpointValue,
  useColorModeValue,
  IconButton,
  Tooltip,
  Kbd,
  useToast,
  AspectRatio,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiShoppingCart, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { addToCart } from "../../utils/cartStore";

/* === util dinero === */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

/* === Helpers (IDs seguros + categorías reales) === */
const slugify = (s) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const makeUniqueId = (base, used) => {
  let id = base;
  let i = 2;
  while (used.has(id)) id = `${base}-${i++}`;
  used.add(id);
  return id;
};

/* =================== Página Catálogo Empresa =================== */
export default function EmpresaCatalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // (se deja por si lo usas luego; no se muestra header)
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Responsive: “full-bleed” en mobile (NO TOCAR)
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const subtextColor = useColorModeValue("gray.600", "gray.400");

  // 🔍 término de búsqueda desde la URL (?search=...)
  const rawSearch = searchParams.get("search") || "";
  const searchTerm = rawSearch.trim().toLowerCase();

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
          const batch = res.data?.productos || [];
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

    return () => {
      alive = false;
    };
  }, []);

  // Recién llegado por fecha de creación si existe
  const recientes = useMemo(() => {
    const arr = [...productos];
    arr.sort((a, b) => {
      const ca = a.created_at ? +new Date(a.created_at) : 0;
      const cb = b.created_at ? +new Date(b.created_at) : 0;
      return cb - ca;
    });
    return arr.slice(0, 12);
  }, [productos]);

  // 🔍 Resultados de búsqueda (nombre, marca, categoría, referencia/código)
  const resultadosBusqueda = useMemo(() => {
    if (!searchTerm) return [];
    const norm = (s) => (s || "").toString().toLowerCase();

    return productos.filter((p) => {
      const nombre = norm(p.nombre);
      const marca = norm(p.marca);
      const categoria = norm(p.categoria);
      const ref = norm(p.referencia || p.codigo || "");
      return (
        nombre.includes(searchTerm) ||
        marca.includes(searchTerm) ||
        categoria.includes(searchTerm) ||
        ref.includes(searchTerm)
      );
    });
  }, [productos, searchTerm]);

  /* ================== 2) CATEGORÍAS REALES (todas las que existen) ================== */
  const groupedByCategoria = useMemo(() => {
    const map = new Map(); // label -> Map(productKey -> product)

    for (const p of productos) {
      const labels = new Set();

      // 1) categoria string
      if (p?.categoria && String(p.categoria).trim()) {
        labels.add(String(p.categoria).trim());
      }

      // 2) categorias[] array (si viene del backend)
      if (Array.isArray(p?.categorias) && p.categorias.length) {
        for (const c of p.categorias) {
          const name = (c ?? "").toString().trim();
          if (name) labels.add(name);
        }
      }

      // 3) fallback
      if (!labels.size) labels.add("Sin categoría");

      // clave segura para deduplicar dentro de una categoría
      const key = p?.id ?? `${p?.nombre ?? "producto"}-${Math.random().toString(16).slice(2)}`;

      for (const label of labels) {
        if (!map.has(label)) map.set(label, new Map());
        map.get(label).set(key, p);
      }
    }

    // a array + ordenar
    const entries = Array.from(map.entries()).map(([label, m]) => [label, Array.from(m.values())]);

    // ordenar productos dentro de cada categoría por nombre
    for (const entry of entries) {
      entry[1].sort((a, b) => String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es"));
    }

    // ordenar categorías (Sin categoría al final)
    entries.sort((a, b) => {
      if (a[0] === "Sin categoría") return 1;
      if (b[0] === "Sin categoría") return -1;
      return String(a[0]).localeCompare(String(b[0]), "es");
    });

    return entries;
  }, [productos]);

  const categorySections = useMemo(() => {
    const used = new Set();
    return groupedByCategoria.map(([catName, items]) => {
      const base = `cat-${slugify(catName) || "sin-categoria"}`;
      const id = makeUniqueId(base, used);
      return { id, title: catName, data: items };
    });
  }, [groupedByCategoria]);

  /* ===== acciones ===== */
  // 👉 Rutas adaptadas al contexto empresa (NO TOCAR)
  const onView = (p) => navigate(`/empresa/producto/${p.id}`);

  const onAdd = (p) => {
    addToCart(p, 1);
    toast({
      title: "Agregado al carrito",
      description: p?.nombre ?? "Producto",
      status: "success",
      duration: 1800,
      isClosable: true,
    });
  };

  return (
    <Box
      bg={pageBg}
      minH="100vh"
      // ✅ MOBILE full-bleed: sin padding externo (NO TOCAR)
      px={{ base: 0, md: 6, lg: 10 }}
      py={{ base: 3, md: 6 }}
      // (opcional) para evitar warning por isMobile no usado en lint estricto
      data-mobile={isMobile ? "1" : "0"}
    >
      {/* ===== Resultados de búsqueda (si hay ?search=...) ===== */}
      {searchTerm && (
        <Section
          title={
            resultadosBusqueda.length
              ? `Resultados para “${rawSearch.trim()}” (${resultadosBusqueda.length})`
              : `No encontramos resultados para “${rawSearch.trim()}”`
          }
          mt={0}
        >
          {resultadosBusqueda.length ? (
            <RowScroller
              loading={loading}
              items={resultadosBusqueda}
              renderItem={(p, i) => (
                <ProductCard
                  key={p?.id ?? `srch-${i}`}
                  producto={p}
                  loading={!p}
                  onView={() => onView(p)}
                  onAdd={() => onAdd(p)}
                  subtextColor={subtextColor}
                />
              )}
            />
          ) : (
            <Box px={{ base: 4, md: 0 }}>
              <Text fontSize="sm" color={subtextColor}>
                Prueba con otra palabra clave: marca, medida, referencia o tipo de producto.
              </Text>
            </Box>
          )}
        </Section>
      )}

      {/* ===== Recién llegado ===== */}
      <Section title="Recién llegado para tus proyectos" mt={searchTerm ? 3 : 0}>
        <RowScroller
          loading={loading}
          items={recientes}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `r-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              subtextColor={subtextColor}
            />
          )}
        />
      </Section>

      {/* ===== Secciones por categoría (AHORA: todas las categorías reales) ===== */}
      {categorySections.map((section) => (
        <Section key={section.id} title={section.title} mt={3}>
          <RowScroller
            loading={loading}
            items={section.data}
            renderItem={(p, i) => (
              <ProductCard
                key={p?.id ?? `${section.id}-${i}`}
                producto={p}
                loading={!p}
                onView={() => onView(p)}
                onAdd={() => onAdd(p)}
                subtextColor={subtextColor}
              />
            )}
          />
        </Section>
      ))}
    </Box>
  );
}

/* =================== Subcomponentes base (responsive NO TOCAR) =================== */

function Section({ title, children, mt = 0 }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const innerPx = useBreakpointValue({ base: 4, md: 4 }) ?? 4;

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius={{ base: "0", md: "xl" }}
      boxShadow={{ base: "none", md: "sm" }}
      borderLeftWidth={{ base: 0, md: 1 }}
      borderRightWidth={{ base: 0, md: 1 }}
      px={{ base: 0, md: 4 }}
      py={{ base: 3, md: 4 }}
      mt={mt}
    >
      <Heading px={{ base: innerPx, md: 0 }} fontSize={{ base: "md", md: "lg" }} mb={3}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function RowScroller({ loading, items, renderItem, placeholderCount = 8 }) {
  const scrollerRef = useRef(null);

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const arrowSize = useBreakpointValue({ base: "sm", md: "md" }) ?? "sm";

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const SAFE_ZONE_PADDING = useBreakpointValue({ base: "16px", md: "64px" }) ?? "16px";

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

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || isMobile) return;

    const wheel = (e) => {
      const hasRealHorizontal = Math.abs(e.deltaX) > 0.5;
      const wantsHorizontalByShift = e.shiftKey && Math.abs(e.deltaY) > 0.5;

      if (!hasRealHorizontal && !wantsHorizontalByShift) return;

      e.preventDefault();
      const delta = wantsHorizontalByShift ? e.deltaY : e.deltaX;
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
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
        }}
      >
        {content}
      </HStack>

      <HintHint px={SAFE_ZONE_PADDING} />
    </Box>
  );
}

/* ✅ ProductCard: clickable -> onView, solo botón Añadir (no navega) */
function ProductCard({ producto, loading, onView, onAdd, subtextColor }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const titleColor = useColorModeValue("gray.900", "gray.100");
  const priceColor = useColorModeValue("gray.900", "gray.50");

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
      minW={{ base: "170px", sm: "190px", md: "210px" }}
      maxW={{ base: "170px", sm: "190px", md: "210px" }}
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
          onView();
        }
      }}
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

      <VStack align="stretch" spacing={{ base: 1.5, md: 2 }} p={{ base: 2.5, md: 3 }}>
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

        {/* ✅ Solo botón Añadir (stopPropagation para no navegar) */}
        <Box pt={{ base: 1, md: 2 }} onClick={(e) => e.stopPropagation()}>
          <Button
            w="full"
            size="sm"
            variant="outline"
            leftIcon={<FiShoppingCart />}
            borderColor={ctaBorder}
            color={ctaColor}
            _hover={{ bg: ctaHoverBg, borderColor: ctaHoverBorder }}
            onClick={() => onAdd(producto)}
            minH={{ base: "34px", md: "40px" }}
          >
            Añadir al carrito
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}

function SkeletonCard() {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  return (
    <Box
      minW={{ base: "170px", sm: "190px", md: "210px" }}
      maxW={{ base: "170px", sm: "190px", md: "210px" }}
      bg={cardBg}
      borderRadius={{ base: "xl", md: "2xl" }}
      overflow="hidden"
      boxShadow="xs"
      border="1px solid"
      borderColor={border}
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
        <SkeletonText noOfLines={1} spacing="2" />
        <Skeleton mt={2} h={{ base: "34px", md: "40px" }} borderRadius="md" />
      </Box>
    </Box>
  );
}

function HintHint({ px }) {
  const color = useColorModeValue("gray.500", "gray.400");
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;

  return (
    <HStack mt={2} spacing={2} color={color} fontSize="xs" px={px}>
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