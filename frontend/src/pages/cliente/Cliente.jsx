// src/pages/cliente/Cliente.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  Skeleton,
  SkeletonText,
  useBreakpointValue,
  useColorModeValue,
  IconButton,
  Tooltip,
  Kbd,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiShoppingCart,
  FiEye,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import PromoHeroFadeBanner from "../public/PromoHeroFadeBanner";
import { addToCart } from "../../utils/cartStore";

/* === util dinero === */
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

/* =================== Página Cliente =================== */
export default function Cliente() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");

  // 🔍 término de búsqueda desde la URL (?search=...)
  const rawSearch = searchParams.get("search") || "";
  const searchTerm = rawSearch.trim().toLowerCase();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/productos?limit=60&page=1");
        setProductos(res.data?.productos || []);
      } catch (e) {
        console.error("Error productos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtro por categoría (tolerante a "categorias" array o "categoria" string)
  const byCat = (needleArr, fallbackSlice = 10) => {
    const norm = (s) => (s || "").toString().toLowerCase();
    const hit = productos.filter((p) => {
      const c1 = norm(p.categoria);
      const cs = Array.isArray(p.categorias) ? p.categorias.map(norm) : [];
      return needleArr.some(
        (n) => c1.includes(n) || cs.some((x) => x.includes(n))
      );
    });
    return (hit.length ? hit : productos).slice(0, fallbackSlice);
  };

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

  // Secciones por categoría
  const tuberias = useMemo(
    () => byCat(["tuber", "pvc", "cpvc", "hidraul"], 10),
    [productos]
  );
  const cables = useMemo(
    () => byCat(["cable", "conductor", "alambr"], 10),
    [productos]
  );
  const electrico = useMemo(
    () => byCat(["eléctr", "breaker", "tomacorr", "ilumin", "led"], 10),
    [productos]
  );
  const adhesivos = useMemo(
    () => byCat(["adhes", "pegante", "silicon", "soldadura en frío"], 10),
    [productos]
  );
  const pinturas = useMemo(
    () => byCat(["pintur", "esmalte", "látex", "rodillo"], 10),
    [productos]
  );
  const seguridad = useMemo(
    () => byCat(["seguridad", "guante", "casc", "protección"], 10),
    [productos]
  );
  const jardineria = useMemo(
    () => byCat(["jardín", "poda", "manguera"], 10),
    [productos]
  );
  const plomeria = useMemo(
    () => byCat(["plomer", "válvula", "mezclador", "sifón"], 10),
    [productos]
  );
  const tornilleria = useMemo(
    () => byCat(["tornillo", "tuerca", "arandela", "fijación"], 10),
    [productos]
  );
  const soldadura = useMemo(
    () => byCat(["sold", "electrodo", "estaño", "soplete"], 10),
    [productos]
  );

  /* ===== acciones ===== */
  const onView = (p) => navigate(`/cliente/producto/${p.id}`); // detalle PRIVADO
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
  const onBuy = (p) => {
    addToCart(p, 1);
    navigate("/cliente/carrito"); // o "/cliente/checkout" si prefieres ir directo al checkout
  };

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>
      {/* ===== Header del cliente ===== */}
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
          ¡Hola
          {user
            ? `, ${user.nombre || user.name || user.username || user.email}`
            : ""}
          !
        </Heading>
        <Text color={useColorModeValue("gray.600", "gray.300")}>
          Explora el catálogo y continúa con tus compras.
        </Text>
      </Box>

      {/* ===== Banner publicitario delgado (6 imágenes) ===== */}
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

      {/* ===== Resultados de búsqueda (si hay ?search=...) ===== */}
      {searchTerm && (
        <Section
          title={
            resultadosBusqueda.length
              ? `Resultados para “${rawSearch.trim()}” (${resultadosBusqueda.length})`
              : `No encontramos resultados para “${rawSearch.trim()}”`
          }
          mt={5}
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
                  onBuy={() => onBuy(p)}
                />
              )}
            />
          ) : (
            <Text
              fontSize="sm"
              color={useColorModeValue("gray.600", "gray.300")}
            >
              Prueba buscando por otra palabra clave, por ejemplo una marca o
              tipo de producto.
            </Text>
          )}
        </Section>
      )}

      {/* ===== Recién llegado (solo precio base) ===== */}
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
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      {/* ===== Secciones por categoría (precio único para cliente convencional) ===== */}
      <Section title="Tuberías & PVC" mt={5}>
        <RowScroller
          loading={loading}
          items={tuberias}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `t-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Cables & Conductores" mt={5}>
        <RowScroller
          loading={loading}
          items={cables}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `c-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Eléctrico" mt={5}>
        <RowScroller
          loading={loading}
          items={electrico}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `e-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Adhesivos & Selladores" mt={5}>
        <RowScroller
          loading={loading}
          items={adhesivos}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `a-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Pinturas & Acabados" mt={5}>
        <RowScroller
          loading={loading}
          items={pinturas}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `p-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Seguridad Industrial" mt={5}>
        <RowScroller
          loading={loading}
          items={seguridad}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `s-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Jardinería" mt={5}>
        <RowScroller
          loading={loading}
          items={jardineria}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `j-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Plomería" mt={5}>
        <RowScroller
          loading={loading}
          items={plomeria}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `pl-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Tornillería & Fijación" mt={5}>
        <RowScroller
          loading={loading}
          items={tornilleria}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `to-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>

      <Section title="Soldadura" mt={5}>
        <RowScroller
          loading={loading}
          items={soldadura}
          renderItem={(p, i) => (
            <ProductCard
              key={p?.id ?? `so-${i}`}
              producto={p}
              loading={!p}
              onView={() => onView(p)}
              onAdd={() => onAdd(p)}
              onBuy={() => onBuy(p)}
            />
          )}
        />
      </Section>
    </Box>
  );
}

/* =================== Subcomponentes base =================== */

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

function ProductCard({ producto, loading, onView, onAdd, onBuy }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");

  if (loading || !producto) return <SkeletonCard />;

  const img = producto.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/600x400?text=Sin+Imagen";

  const price = Number(producto.precio ?? 0); // precio único para CLIENTE convencional

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
      <Box position="relative" borderBottom="1px solid" borderColor={borderCo}>
        <Box h="160px" bg="white" display="grid" placeItems="center">
          <Image
            src={img}
            alt={producto.nombre}
            maxW="100%"
            maxH="100%"
            objectFit="contain"
            loading="lazy"
          />
        </Box>
      </Box>

      <VStack align="stretch" spacing={2} p={3}>
        <Text noOfLines={2} fontWeight="semibold">
          {producto.nombre}
        </Text>

        {/* Solo precio base (sin precio_oferta ni descuento visual) */}
        <HStack spacing={2} align="baseline">
          <Text fontWeight="bold">{fmtCop(price)}</Text>
        </HStack>

        <HStack pt={1} spacing={1} flexWrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FiEye />}
            onClick={onView}
            minH="44px"
          >
            Ver
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<FiShoppingCart />}
            onClick={onAdd}
            minH="44px"
          >
            Añadir
          </Button>
          <Button
            size="sm"
            leftIcon={<FiZap />}
            colorScheme="yellow"
            color="black"
            onClick={onBuy}
            minH="44px"
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
