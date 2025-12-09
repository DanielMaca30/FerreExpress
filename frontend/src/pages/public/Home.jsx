// src/pages/public/Home.jsx
import PromoHeroFadeBanner from "./PromoHeroFadeBanner";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  Badge,
  Skeleton,
  SkeletonText,
  useBreakpointValue,
  useColorModeValue,
  IconButton,
  Tooltip,
  Kbd,
  SimpleGrid,
  AspectRatio,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiEye,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* ================= Utils ================= */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const norm = (s) => (s || "").toString().toLowerCase();

/* ================= Home (catálogo público) ================= */
export default function Home() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");
  const mutedHeader = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/productos?limit=60&page=1");
        setProductos(res.data.productos || []);
      } catch (e) {
        console.error("Error productos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- helpers de filtro por categoría ----
  const byCat = (needleArr, fallbackSlice = 12) => {
    const hit = productos.filter((p) => {
      const c1 = norm(p.categoria);
      const cs = Array.isArray(p.categorias) ? p.categorias.map(norm) : [];
      return needleArr.some(
        (n) => c1.includes(n) || cs.some((x) => x.includes(n))
      );
    });
    return (hit.length ? hit : productos).slice(0, fallbackSlice);
  };

  const ofertas = useMemo(() => {
    const withDeal = productos.filter(
      (p) => p.precio_oferta || Number(p.descuento) > 0 || p.oferta
    );
    return (withDeal.length ? withDeal : productos).slice(0, 12);
  }, [productos]);

  const recientes = useMemo(() => {
    const arr = [...productos];
    arr.sort((a, b) => {
      const ca = a.created_at ? +new Date(a.created_at) : 0;
      const cb = b.created_at ? +new Date(b.created_at) : 0;
      return cb - ca;
    });
    return arr.slice(0, 12);
  }, [productos]);

  /* ===== Mapa de categorías ===== */
  const CATEGORY_MAP = [
    { title: "Ferretería general", keys: ["ferreter", "general", "obra"] },
    {
      title: "Herramientas manuales",
      keys: ["martillo", "destornill", "llave", "manual"],
    },
    {
      title: "Herramientas eléctricas",
      keys: [
        "taladro",
        "esmeril",
        "eléctr",
        "dremel",
        "sierra",
        "rotomartillo",
      ],
    },
    {
      title: "Fijaciones y tornillería",
      keys: ["tornillo", "tuerca", "arandela", "fijación", "taco"],
    },
    {
      title: "Adhesivos y sellantes",
      keys: ["adhes", "pegante", "silicon", "sell", "soldadura en frío"],
    },
    {
      title: "Pinturas y acabados",
      keys: ["pintur", "esmalte", "látex", "rodillo", "brocha", "masilla"],
    },
    {
      title: "Cables y electricidad",
      keys: ["cable", "conductor", "alambr", "breaker", "tomacorr"],
    },
    {
      title: "Iluminación",
      keys: ["lumin", "bombillo", "led", "reflector", "panel"],
    },
    {
      title: "Plomería",
      keys: ["plomer", "grifer", "mezclador", "válvula", "sifón"],
    },
    {
      title: "Tubos y conexiones",
      keys: ["tuber", "pvc", "cpvc", "hidraul", "conexión"],
    },
    {
      title: "Cementos y agregados",
      keys: ["cement", "mortero", "yeso", "arena", "grava"],
    },
    {
      title: "Seguridad industrial",
      keys: ["seguridad", "guante", "casco", "protección", "botas"],
    },
    {
      title: "Jardinería",
      keys: ["jardín", "manguera", "poda", "riego", "tierra"],
    },
  ];

  // acciones (catálogo público):
  const onView = (p) => navigate(`/producto/${p.id}`); // detalle público
  const onAdd = () => navigate("/login"); // invita a iniciar sesión
  const onBuy = () => navigate("/login");

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>
      {/* ===== Header tipo Cliente (pero público) ===== */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderCo}
        borderRadius="xl"
        boxShadow="sm"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        mb={5}
      >
        <Heading size="md" mb={1}>
          Bienvenido a FerreExpress
        </Heading>
        <Text color={mutedHeader} fontSize="sm">
          Explora el catálogo, descubre ofertas y encuentra todo para tus
          proyectos de ferretería, electricidad y más.
        </Text>
      </Box>

      {/* ===== Publicidad (6 imágenes con carrusel animado tipo Cliente) ===== */}
      <PromoHeroFadeBanner
        images={[
          "/Publicidad1.png",
          "/Publicidad2.png",
          "/publicidad3.jpg",
          "/Publicidad4.png",
          "/publicidad5.jpg",
          "/publicidad6.jpg",
        ]}
        height={{ base: "110px", md: "150px", lg: "400px" }}
      />

      {/* ===== Ofertas y Recién llegado ===== */}
      <Section title="Ofertas especiales" mt={5}>
        <RowScroller
          loading={loading}
          items={ofertas}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `o-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={onAdd}
              onBuy={onBuy}
              showDealBadge
            />
          )}
        />
      </Section>

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

      {/* ===== Secciones dinámicas por categoría (lista solicitada) ===== */}
      {CATEGORY_MAP.map(({ title, keys }, idx) => (
        <Section key={title} title={title} mt={5}>
          <RowScroller
            loading={loading}
            items={byCat(keys, 12)}
            renderItem={(p, i) => (
              <ProductCard
                key={p?.id ?? `${idx}-${i}`}
                producto={p}
                loading={!p}
                onView={() => onView(p)}
                onAdd={onAdd}
                onBuy={onBuy}
              />
            )}
          />
        </Section>
      ))}
    </Box>
  );
}

/* =================== Subcomponentes =================== */

/* ---- Carrusel de promociones (queda disponible si lo quieres usar luego) ---- */
function PromoCarousel({ images = [] }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const trackRef = useRef(null);
  const hoverRef = useRef(false);
  const step = useBreakpointValue({ base: 1, sm: 1, md: 1 });

  // Duplicamos para efecto infinito suave
  const loopImages = [...images, ...images];

  useEffect(() => {
    let id;
    const el = trackRef.current;
    if (!el) return;

    const tick = () => {
      if (hoverRef.current) return;
      const card = el.querySelector("[data-card='promo']");
      if (!card) return;
      const cardWidth = card.getBoundingClientRect().width + 16;
      el.scrollBy({ left: (step ?? 1) * cardWidth, behavior: "smooth" });

      const maxScroll = el.scrollWidth / 2;
      if (el.scrollLeft >= maxScroll) {
        el.scrollLeft = el.scrollLeft - maxScroll;
      }
    };

    id = setInterval(tick, 3000);
    const onVisibility = () => {
      if (document.hidden) clearInterval(id);
      else id = setInterval(tick, 3000);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [images.length, step]);

  const arrowSize = useBreakpointValue({ base: "sm", md: "md" });
  const scrollBy = (px) =>
    trackRef.current?.scrollBy({ left: px, behavior: "smooth" });

  const cardW = useBreakpointValue({
    base: "100%",
    sm: "calc(50% - 12px)",
    md: "calc(33.333% - 12px)",
  });

  return (
    <Box
      mb={5}
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      px={{ base: 2, md: 3 }}
      py={{ base: 2, md: 3 }}
      position="relative"
      overflow="hidden"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      <Heading size="sm" mb={2} px={{ base: 1, md: 2 }}>
        Promociones
      </Heading>

      <Tooltip label="Anterior">
        <IconButton
          aria-label="Anterior"
          icon={<FiChevronLeft />}
          size={arrowSize}
          variant="ghost"
          position="absolute"
          left={1}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scrollBy(-400)}
        />
      </Tooltip>

      <Tooltip label="Siguiente">
        <IconButton
          aria-label="Siguiente"
          icon={<FiChevronRight />}
          size={arrowSize}
          variant="ghost"
          position="absolute"
          right={1}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scrollBy(400)}
        />
      </Tooltip>

      <HStack
        ref={trackRef}
        spacing={4}
        overflowX="auto"
        py={1}
        px={1}
        css={{ scrollbarWidth: "thin" }}
        scrollSnapType="x mandatory"
      >
        {loopImages.map((src, i) => (
          <Box
            key={`${src}-${i}`}
            data-card="promo"
            flex="0 0 auto"
            w={cardW}
            border="1px solid"
            borderColor={border}
            borderRadius="lg"
            overflow="hidden"
            _hover={{ boxShadow: "md" }}
            scrollSnapAlign="start"
          >
            <AspectRatio ratio={16 / 9}>
              <Image
                src={src}
                alt={`Promoción ${i + 1}`}
                objectFit="cover"
                loading="lazy"
              />
            </AspectRatio>
          </Box>
        ))}
      </HStack>

      <HintHint />
    </Box>
  );
}

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

function RowScroller({ loading, items, renderItem, placeholderCount = 8 }) {
  const ref = useRef(null);
  const fadeStart = useColorModeValue(
    "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))",
    "linear-gradient(to right, rgba(26,32,44,1), rgba(26,32,44,0))"
  );
  const fadeEnd = useColorModeValue(
    "linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))",
    "linear-gradient(to left, rgba(26,32,44,1), rgba(26,32,44,0))"
  );

  const content =
    loading || !items?.length
      ? Array.from({ length: placeholderCount }).map((_, i) => (
          <SkeletonCard key={`sk-${i}`} />
        ))
      : items.map((p, i) => renderItem(p, i));

  const onWheel = (e) => {
    if (!ref.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY))
      ref.current.scrollLeft += e.deltaY;
  };

  const arrowSize = useBreakpointValue({ base: "sm", md: "md" });
  const scrollBy = (px) =>
    ref.current?.scrollBy({ left: px, behavior: "smooth" });

  return (
    <Box position="relative">
      <Box
        pointerEvents="none"
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        w="30px"
        bgImage={fadeStart}
        zIndex={1}
      />
      <Box
        pointerEvents="none"
        position="absolute"
        top={0}
        bottom={0}
        right={0}
        w="30px"
        bgImage={fadeEnd}
        zIndex={1}
      />

      <Tooltip label="Anterior">
        <IconButton
          aria-label="Anterior"
          icon={<FiChevronLeft />}
          size={arrowSize}
          variant="ghost"
          position="absolute"
          left={1}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scrollBy(-260)}
        />
      </Tooltip>

      <Tooltip label="Siguiente">
        <IconButton
          aria-label="Siguiente"
          icon={<FiChevronRight />}
          size={arrowSize}
          variant="ghost"
          position="absolute"
          right={1}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
          onClick={() => scrollBy(260)}
        />
      </Tooltip>

      <HStack
        ref={ref}
        spacing={{ base: 3, md: 4 }}
        overflowX="auto"
        py={1}
        px={1}
        css={{ scrollbarWidth: "thin" }}
        onWheel={onWheel}
        scrollSnapType="x mandatory"
      >
        {content}
      </HStack>

      <HintHint />
    </Box>
  );
}

/* ---- Card de producto con estilo tipo Cliente pero soportando ofertas ---- */
function ProductCard({
  producto,
  loading,
  onView,
  onAdd,
  onBuy,
  showDealBadge,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");

  if (loading || !producto) return <SkeletonCard />;

  const img = producto.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/600x400?text=Sin+Imagen";

  const price = Number(producto.precio ?? 0);
  const dealPrice = producto.precio_oferta
    ? Number(producto.precio_oferta)
    : Number(producto.descuento) > 0
    ? price * (1 - Number(producto.descuento) / 100)
    : null;

  return (
    <Box
      minW={{ base: "220px", md: "240px" }}
      maxW={{ base: "220px", md: "240px" }}
      bg={cardBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xs"
      _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
      transition="all .15s ease"
      scrollSnapAlign="start"
      role="group"
    >
      {/* Imagen con relación 4:3 y oferta en la esquina (como en Home original) */}
      <Box position="relative" borderBottom="1px solid" borderColor={borderCo}>
        {showDealBadge &&
          (Number(producto.descuento) > 0 || producto.precio_oferta) && (
            <Badge
              position="absolute"
              top={2}
              left={2}
              colorScheme="red"
              rounded="md"
              zIndex={1}
            >
              {producto.descuento ? `${producto.descuento}% OFF` : "OFERTA"}
            </Badge>
          )}
        <AspectRatio ratio={4 / 3} bg="white">
          <Image
            src={img}
            alt={producto.nombre}
            objectFit="contain"
            loading="lazy"
          />
        </AspectRatio>
      </Box>

      <VStack align="stretch" spacing={2} p={3}>
        <Text
          noOfLines={2}
          fontWeight="semibold"
          title={producto.nombre}
          minH="42px"
        >
          {producto.nombre}
        </Text>

        <HStack spacing={2} align="baseline" minH="24px">
          {dealPrice ? (
            <>
              <Text fontWeight="bold">{fmtCop(dealPrice)}</Text>
              <Text color={muted} textDecoration="line-through" fontSize="sm">
                {fmtCop(price)}
              </Text>
            </>
          ) : (
            <Text fontWeight="bold">{fmtCop(price)}</Text>
          )}
        </HStack>

        <HStack pt={1} spacing={1} flexWrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FiEye />}
            onClick={onView}
            minH="40px"
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FiShoppingCart />}
            onClick={onAdd}
            minH="40px"
          >
            Añadir
          </Button>
          <Button
            size="sm"
            leftIcon={<FiZap />}
            colorScheme="yellow"
            color="black"
            onClick={onBuy}
            minH="40px"
            flexGrow={{ base: 1, sm: 0 }}
            w={{ base: "100%", sm: "auto" }}
          >
            Comprar
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

function SkeletonCard() {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box
      minW={{ base: "220px", md: "240px" }}
      maxW={{ base: "220px", md: "240px" }}
      bg={cardBg}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xs"
      border="1px solid"
      borderColor={border}
      scrollSnapAlign="start"
    >
      <Skeleton h="160px" w="100%" />
      <Box p={3}>
        <Skeleton height="16px" mb={2} />
        <Skeleton height="16px" w="60%" mb={2} />
        <SkeletonText noOfLines={2} spacing="2" />
        <HStack mt={3} spacing={2}>
          <Skeleton h="36px" w="84px" borderRadius="md" />
          <Skeleton h="36px" w="84px" borderRadius="md" />
          <Skeleton h="36px" flex="1" borderRadius="md" />
        </HStack>
      </Box>
    </Box>
  );
}

function HintHint() {
  const color = useColorModeValue("gray.500", "gray.400");
  return (
    <HStack mt={2} spacing={2} color={color} fontSize="xs">
      <Text>Desliza para ver más</Text>
      <HStack>
        <Kbd>Shift</Kbd>
        <Text>+</Text>
        <Kbd>Wheel</Kbd>
      </HStack>
      <Text>o usa</Text>
      <Kbd>←</Kbd>
      <Text>/</Text>
      <Kbd>→</Kbd>
    </HStack>
  );
}