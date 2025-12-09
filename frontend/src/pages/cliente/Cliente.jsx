// src/pages/cliente/Cliente.jsx - VERSIÓN FINAL CORREGIDA UI/UX (Flechas Seguras y Tarjeta Limpia)
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  AspectRatio,
  Flex,
  Tabs,
  TabList,
  Tab,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiShoppingCart,
  FiZap,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi"; 
import api, { API_BASE_URL } from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import PromoHeroFadeBanner from "../public/PromoHeroFadeBanner";
import { addToCart } from "../../utils/cartStore";

/* === Utilidad de formato de dinero (COP) === */
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
  const [activeSection, setActiveSection] = useState("recientes"); 
  
  const stickyNavRef = useRef(null); 
  const sectionRefs = useRef({}); 
  
  // Colores y Espacios
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");
  const subtextColor = useColorModeValue("gray.500", "gray.400"); 

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

  // --- Lógica de filtrado (sin cambios) ---
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

  const recientes = useMemo(() => {
    const arr = [...productos];
    arr.sort((a, b) => {
      const ca = a.created_at ? +new Date(a.created_at) : 0;
      const cb = b.created_at ? +new Date(b.created_at) : 0;
      return cb - ca;
    });
    return arr.slice(0, 12);
  }, [productos]);

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

  /* ===== Lista de secciones para el renderizado y la navegación sticky ===== */
  const categorySections = useMemo(
    () => [
      { id: "recientes", title: "Recién llegado", data: recientes },
      { id: "tuberias", title: "Tuberías & PVC", data: tuberias },
      { id: "cables", title: "Cables & Conductores", data: cables },
      { id: "electrico", title: "Eléctrico", data: electrico },
      { id: "adhesivos", title: "Adhesivos & Selladores", data: adhesivos },
      { id: "pinturas", title: "Pinturas & Acabados", data: pinturas },
      { id: "seguridad", title: "Seguridad Industrial", data: seguridad },
      { id: "jardineria", title: "Jardinería", data: jardineria },
      { id: "plomeria", title: "Plomería", data: plomeria },
      { id: "tornilleria", title: "Tornillería & Fijación", data: tornilleria },
      { id: "soldadura", title: "Soldadura", data: soldadura },
    ],
    [
      recientes, tuberias, cables, electrico, adhesivos, pinturas, seguridad,
      jardineria, plomeria, tornilleria, soldadura,
    ]
  );

  /* ===== Acciones ===== */
  const onView = (p) => navigate(`/cliente/producto/${p.id}`); 
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
    navigate("/cliente/carrito"); 
  };

  /* 🛠️ Intersection Observer y función de scroll */
  const setSectionRef = useCallback((node, id) => {
    if (node) sectionRefs.current[id] = node;
  }, []);

  useEffect(() => {
    const navHeight = stickyNavRef.current ? stickyNavRef.current.offsetHeight : 80;
    const observerOptions = {
      root: null,
      rootMargin: `-${navHeight}px 0px -90% 0px`, 
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, observerOptions);

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categorySections]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const navHeight = stickyNavRef.current ? stickyNavRef.current.offsetHeight : 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      
      const offsetFromTop = window.innerHeight * 0.40;
      const targetScroll = elementPosition - offsetFromTop + navHeight;
      
      window.scrollTo({
        top: Math.max(0, targetScroll), 
        behavior: "smooth",
      });

      setActiveSection(id);
    }
  };


  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>
      {/* ===== 1. Header del cliente (Bienvenida) ===== */}
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
        <Text color={subtextColor}>
          Explora el catálogo y continúa con tus compras.
        </Text>
      </Box>

      {/* ===== 2. Resultados de búsqueda (Prioridad de Flujo UX) ===== */}
      {searchTerm && (
        <Section
          id="search-results"
          title={
            resultadosBusqueda.length
              ? `Resultados para “${rawSearch.trim()}” (${resultadosBusqueda.length})`
              : `No encontramos resultados para “${rawSearch.trim()}”`
          }
          mt={0} 
          setRef={(node) => setSectionRef(node, "search-results")}
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
                  subtextColor={subtextColor}
                />
              )}
            />
          ) : (
            <Text
              fontSize="sm"
              color={subtextColor}
            >
              Prueba buscando por otra palabra clave, por ejemplo una marca o
              tipo de producto.
            </Text>
          )}
        </Section>
      )}

      {/* ===== 3. Banner publicitario delgado (6 imágenes) ===== */}
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
        mt={searchTerm ? 5 : 0} 
        mb={5}
      />

      {/* 4. Navegación Sticky (Corregida UX de Flechas) */}
      <StickyCategoryNav
        ref={stickyNavRef} 
        sections={categorySections}
        scrollToSection={scrollToSection}
        activeSection={activeSection}
      />

      {/* ===== 5. Secciones del Catálogo (Renderizado) ===== */}
      {categorySections.map((section, index) => (
        <Section
          key={section.id}
          id={section.id} 
          title={section.title}
          mt={index === 0 ? 0 : 5} 
          setRef={(node) => setSectionRef(node, section.id)}
        >
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
                onBuy={() => onBuy(p)}
                subtextColor={subtextColor}
              />
            )}
          />
        </Section>
      ))}
    </Box>
  );
}

/* =================== SUBCOMPONENTES REVISADOS Y CORREGIDOS V5 (Flechas Seguras y Tarjeta Limpia) =================== */


function Section({ id, title, children, mt = 0, setRef }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      id={id} 
      ref={setRef}
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


/* 🛠️ FIX: StickyCategoryNav con flechas de scroll SEGURAS */
const StickyCategoryNav = React.forwardRef(({ sections, scrollToSection, activeSection }, ref) => {
  const navBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");
  const activeIndex = sections.findIndex(s => s.id === activeSection);
  
  const tabListRef = useRef(null); 
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const arrowSize = useBreakpointValue({ base: "sm", md: "md" });
  
  // Constantes UX para asegurar el espacio de la flecha
  const SAFE_ZONE_PADDING = { base: "45px", md: "60px" }; // Añade espacio seguro al TabList
  const ARROW_FADE_WIDTH = { base: "35px", md: "45px" }; 
  const ARROW_POS = { base: "0px", md: "5px" }; 

  const fadeStart = useColorModeValue(
    `linear-gradient(to right, white 50%, transparent 100%)`, 
    `linear-gradient(to right, #0f1117 50%, transparent 100%)`
  );
  const fadeEnd = useColorModeValue(
    `linear-gradient(to left, white 50%, transparent 100%)`,
    `linear-gradient(to left, #0f1117 50%, transparent 100%)`
  );

  const handleScroll = useCallback(() => {
    if (!tabListRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabListRef.current;
    
    const isScrollable = scrollWidth > clientWidth + 5; 
    const isStart = scrollLeft < 5;
    const isEnd = scrollWidth - clientWidth - scrollLeft < 5; 

    setShowLeft(isScrollable && !isStart);
    setShowRight(isScrollable && !isEnd);
  }, []);
  
  useEffect(() => {
    handleScroll(); 
    const currentRef = tabListRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      }
    };
  }, [handleScroll]);

  const scrollBy = (px) => tabListRef.current?.scrollBy({ left: px, behavior: "smooth" });


  return (
    <Box
      ref={ref} 
      position="sticky"
      top="0px"
      zIndex={10} 
      bg={navBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius="xl"
      boxShadow="md"
      mb={5}
      px={{ base: 1, md: 4 }} 
      py={2}
    >
      <Box position="relative">
        
        {/* Flecha Izquierda (Posición Ajustada) */}
        {showLeft && (
            <IconButton
              aria-label="Scroll left"
              icon={<FiChevronLeft />}
              size={arrowSize}
              variant="solid"
              isRound
              position="absolute"
              left={ARROW_POS} 
              top="50%"
              transform="translateY(-50%)"
              zIndex={2}
              onClick={() => scrollBy(-150)}
              boxShadow="md"
              bg={useColorModeValue("white", "gray.700")}
            />
        )}
        
        {/* Flecha Derecha (Posición Ajustada) */}
        {showRight && (
            <IconButton
              aria-label="Scroll right"
              icon={<FiChevronRight />}
              size={arrowSize}
              variant="solid"
              isRound
              position="absolute"
              right={ARROW_POS} 
              top="50%"
              transform="translateY(-50%)"
              zIndex={2}
              onClick={() => scrollBy(150)}
              boxShadow="md"
              bg={useColorModeValue("white", "gray.700")}
            />
        )}


        {/* Indicador visual de scroll Izquierda (Ancho Ajustado) */}
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          w={ARROW_FADE_WIDTH} 
          bgImage={fadeStart}
          zIndex={1}
          pointerEvents="none"
        />

        {/* Indicador visual de scroll Derecha (Ancho Ajustado) */}
        <Box
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          w={ARROW_FADE_WIDTH} 
          bgImage={fadeEnd}
          zIndex={1}
          pointerEvents="none"
        />

        <Tabs 
          variant="soft-rounded" 
          colorScheme="yellow" 
          index={activeIndex}
        >
          {/* 🚨 FIX CLAVE: Añadir padding lateral al TabList para crear la zona segura */}
          <TabList 
            ref={tabListRef} 
            overflowX="scroll" 
            py={1} 
            px={SAFE_ZONE_PADDING} // <<<<<<<<<<<< ESTE ES EL CAMBIO CLAVE
            css={{
              "&::-webkit-scrollbar": { display: "none" },
              "-ms-overflow-style": "none",
              "scrollbar-width": "none",
              "scroll-behavior": "smooth",
            }}
          >
            {sections.map((section) => (
              <Tab
                key={section.id}
                size="sm"
                mx={1}
                flexShrink={0} 
                onClick={() => scrollToSection(section.id)}
              >
                {section.title}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      </Box>
    </Box>
  );
});


/* 🛠️ FIX: RowScroller con flechas de scroll SEGURAS */
function RowScroller({ loading, items, renderItem, placeholderCount = 8 }) {
  const ref = useRef(null);
  const [showLeft, setShowLeft] = useState(false); 
  const [showRight, setShowRight] = useState(false); 
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

  // Constantes UX para asegurar el espacio de la flecha
  const SAFE_ZONE_PADDING = { base: "45px", md: "60px" }; // Añade espacio seguro al HStack (para separar productos)
  const ARROW_FADE_WIDTH = { base: "35px", md: "50px" }; 
  const ARROW_POS = { base: "0px", md: "0px" }; 

  const fadeStart = useColorModeValue(
    `linear-gradient(to right, ${pageBg} 50%, rgba(246, 247, 249, 0) 100%)`, 
    `linear-gradient(to right, ${pageBg} 50%, rgba(15, 17, 23, 0) 100%)` 
  );
  const fadeEnd = useColorModeValue(
    `linear-gradient(to left, ${pageBg} 50%, rgba(246, 247, 249, 0) 100%)`,
    `linear-gradient(to left, ${pageBg} 50%, rgba(15, 17, 23, 0) 100%)` 
  );


  const content =
    loading || !items?.length
      ? Array.from({ length: placeholderCount }).map((_, i) => (
          <SkeletonCard key={`sk-${i}`} />
        ))
      : items.map((p, i) => renderItem(p, i));

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    
    const isScrollable = scrollWidth > clientWidth + 10;
    
    const isStart = scrollLeft < 10;
    const isEnd = scrollWidth - clientWidth - scrollLeft < 10; 

    setShowLeft(isScrollable && !isStart);
    setShowRight(isScrollable && !isEnd);
  }, []);
  
  useEffect(() => {
    handleScroll(); 
    const currentRef = ref.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      }
    };
  }, [handleScroll, loading, items]);

  const onWheel = (e) => {
    if (!ref.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        ref.current.scrollLeft += e.deltaY;
    } else {
        ref.current.scrollLeft += e.deltaX;
    }
    // Prevenir scroll vertical de la página al scrollear horizontalmente
    if(Math.abs(e.deltaX) > 5 || e.shiftKey) {
        e.preventDefault();
    }
  };

  const arrowSize = useBreakpointValue({ base: "sm", md: "md" });
  const scrollBy = (px) =>
    ref.current?.scrollBy({ left: px, behavior: "smooth" });

  return (
    <Box position="relative">
      
      {/* Sombras de desvanecimiento para indicar scroll (Ancho Ajustado) */}
      {showLeft && (
        <Box
          pointerEvents="none"
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          w={ARROW_FADE_WIDTH}
          bgImage={fadeStart}
          zIndex={1}
        />
      )}
      {showRight && (
        <Box
          pointerEvents="none"
          position="absolute"
          top={0}
          bottom={0}
          right={0}
          w={ARROW_FADE_WIDTH}
          bgImage={fadeEnd}
          zIndex={1}
        />
      )}

      {/* Botón Izquierda Condicional (Posición Ajustada) */}
      {showLeft && (
        <Tooltip label="Anterior">
          <IconButton
            aria-label="Anterior"
            icon={<FiChevronLeft />}
            size={arrowSize}
            variant="ghost"
            position="absolute"
            left={ARROW_POS} 
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={() => scrollBy(-260)}
          />
        </Tooltip>
      )}

      {/* Botón Derecha Condicional (Posición Ajustada) */}
      {showRight && (
        <Tooltip label="Siguiente">
          <IconButton
            aria-label="Siguiente"
            icon={<FiChevronRight />}
            size={arrowSize}
            variant="ghost"
            position="absolute"
            right={ARROW_POS} 
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            onClick={() => scrollBy(260)}
          />
        </Tooltip>
      )}

      {/* 🚨 FIX CLAVE: Añadir padding lateral al HStack para crear la zona segura */}
      <HStack
        ref={ref}
        spacing={{ base: 3, md: 4 }}
        overflowX="auto"
        py={1}
        px={SAFE_ZONE_PADDING} // <<<<<<<<<<<< ESTE ES EL CAMBIO CLAVE
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


/* 🛠️ ProductCard Simplificado y Clickeable */
function ProductCard({ producto, loading, onView, onAdd, onBuy, subtextColor }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("gray.200", "gray.700");

  if (loading || !producto) return <SkeletonCard />;

  const img = producto.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/600x400?text=Sin+Imagen";

  const price = Number(producto.precio ?? 0); 
  const brandText = producto.marca || ""; 

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
      display="flex"
      flexDirection="column"
      cursor="pointer" 
      onClick={() => onView(producto)} 
    >
      <Box borderBottom="1px solid" borderColor={borderCo}>
        <AspectRatio ratio={4 / 3} w="100%" bg="white">
          <Image
            src={img}
            alt={producto.nombre}
            objectFit="contain"
            loading="lazy"
          />
        </AspectRatio>
      </Box>

      {/* Zona de texto/botones */}
      <VStack align="stretch" spacing={1} p={3} flex="1">
        
        {/* Marca (Solo si existe para un look más limpio) */}
        <Text 
          fontSize="xs" 
          fontWeight="bold" 
          color={subtextColor} 
          textTransform="uppercase" 
          noOfLines={1}
          minH="15px" 
        >
            {brandText}
        </Text>

        <Text noOfLines={2} fontWeight="semibold" minH="40px">
          {producto.nombre}
        </Text>

        <Text fontWeight="bold" fontSize="lg" color="yellow.500" pt={1}>
            {fmtCop(price)}
        </Text>
        <Text fontSize="xs" color={subtextColor} mt="-5px !important">
            IVA Incluido | Unidad
        </Text>
        
        {/* Botones (UX: Stop propagation para que no se active onView) */}
        <Flex 
            pt={2} 
            gap={2} 
            alignItems="center" 
            flexWrap="nowrap"
            // Clave: Prevenir que el clic suba al Box principal (evita navegación)
            onClick={(e) => e.stopPropagation()} 
        >
            {/* 1. Añadir (Acción secundaria) */}
            <Button
                size="sm"
                variant="outline" 
                colorScheme="gray" 
                leftIcon={<FiShoppingCart />}
                onClick={() => onAdd(producto)}
                minH="40px"
                flexGrow={1}
            >
                Añadir
            </Button>
            
            {/* 2. Comprar (Acción primaria) */}
            <Button
                size="sm"
                variant="solid" 
                leftIcon={<FiZap />}
                colorScheme="yellow"
                color="black"
                onClick={() => onBuy(producto)}
                minH="40px"
                flexGrow={1}
            >
                Comprar
            </Button>
        </Flex>
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
      display="flex"
      flexDirection="column"
    >
      <AspectRatio ratio={4 / 3} w="100%">
        <Skeleton w="100%" h="100%" />
      </AspectRatio>
      <Box p={3}>
        <Skeleton height="12px" w="40%" mb={1} /> 
        <Skeleton height="16px" mb={2} />
        <Skeleton height="16px" w="60%" mb={3} />
        <Skeleton height="14px" w="40%" mb={4} />
        <HStack mt={3} spacing={2}>
          <Skeleton h="40px" flex="1" borderRadius="md" />
          <Skeleton h="40px" flex="1" borderRadius="md" />
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
      <HStack display={{ base: 'none', md: 'flex' }}>
        <Kbd>Shift</Kbd>
        <Text>+</Text>
        <Kbd>Wheel</Kbd>
      </HStack>
      <Text display={{ base: 'none', md: 'block' }}>o usa</Text>
      <Kbd>←</Kbd>
      <Text>/</Text>
      <Kbd>→</Kbd>
    </HStack>
  );
}