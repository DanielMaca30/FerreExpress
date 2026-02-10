// src/pages/cliente/Cliente.jsx
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
  useBreakpointValue,
  useColorModeValue,
  IconButton,
  Tooltip,
  Kbd,
  useToast,
  AspectRatio,
  Tabs,
  TabList,
  Tab,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiCheck } from "react-icons/fi";
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

/* === Helpers (IDs seguros + categorías reales) === */
const slugify = (s) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const makeUniqueId = (base, used) => {
  let id = base;
  let i = 2;
  while (used.has(id)) id = `${base}-${i++}`;
  used.add(id);
  return id;
};

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

  // ✅ Responsive: “full-bleed” en mobile
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;

  // Colores base
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const subtextColor = useColorModeValue("gray.600", "gray.400");

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

  /* ================== 2) RECIENTES ================== */
  const recientes = useMemo(() => {
    const arr = [...productos];
    arr.sort((a, b) => {
      const ca = a.created_at ? +new Date(a.created_at) : 0;
      const cb = b.created_at ? +new Date(b.created_at) : 0;
      return cb - ca;
    });
    return arr.slice(0, 12);
  }, [productos]);

  /* ================== 3) BÚSQUEDA (local, sin quitar nada) ================== */
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

  /* ================== 4) CATEGORÍAS REALES (todas las que existen) ================== */
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

    // ordenar productos dentro de cada categoría (cambia criterio si quieres)
    for (const [label, arr] of map.entries()) {
      arr.sort((a, b) =>
        String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es")
      );
      map.set(label, arr);
    }

    // ordenar categorías alfabéticamente, dejando "Sin categoría" al final
    const ordered = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === "Sin categoría") return 1;
      if (b[0] === "Sin categoría") return -1;
      return String(a[0]).localeCompare(String(b[0]), "es");
    });

    return ordered;
  }, [productos]);

  /* ===== Lista de secciones (SIN byCat/keys; ahora es dinámico y completo) ===== */
  const categorySections = useMemo(() => {
    const used = new Set(["recientes"]);

    const catSections = groupedByCategoria.map(([catName, items]) => {
      const base = `cat-${slugify(catName) || "sin-categoria"}`;
      const id = makeUniqueId(base, used);
      return { id, title: catName, data: items };
    });

    // ✅ “Recién llegado” primero, PERO los recientes también se ven en su categoría (NO los quitamos)
    return [{ id: "recientes", title: "Recién llegado", data: recientes }, ...catSections];
  }, [groupedByCategoria, recientes]);

  const navIds = useMemo(() => new Set(categorySections.map((s) => s.id)), [categorySections]);

  /* ===== Acciones ===== */
  const onView = (p) => navigate(`/cliente/producto/${p.id}`);
  const onAdd = (p) => {
    addToCart(p, 1);
    toast({
      title: "Agregado al carrito",
      description: p?.nombre ?? "Producto",
      status: "success",
      duration: 1600,
      isClosable: true,
    });
  };

  /* ===== Intersection Observer ===== */
  const setSectionRef = useCallback((node, id) => {
    if (node) sectionRefs.current[id] = node;
  }, []);

  useEffect(() => {
    const navHeight = stickyNavRef.current ? stickyNavRef.current.offsetHeight : 80;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          if (navIds.has(id)) setActiveSection(id);
        });
      },
      {
        root: null,
        rootMargin: `-${navHeight}px 0px -90% 0px`,
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [navIds]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    const navHeight = stickyNavRef.current ? stickyNavRef.current.offsetHeight : 80;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetFromTop = window.innerHeight * 0.4;
    const targetScroll = elementPosition - offsetFromTop + navHeight;

    window.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
    setActiveSection(id);
  };

  return (
    <Box
      bg={pageBg}
      // ✅ MOBILE full-bleed: sin padding externo (evita “tarjeta flotante”)
      px={{ base: 0, md: 6, lg: 10 }}
      py={{ base: 3, md: 6 }}
      minH="100vh"
    >
      {/* ===== 1. Header del cliente ===== */}
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderCo}
        borderRadius={{ base: "0", md: "xl" }}
        boxShadow={{ base: "none", md: "sm" }}
        // ✅ en mobile: sin borde lateral para que sea full width “clean”
        borderLeftWidth={{ base: 0, md: 1 }}
        borderRightWidth={{ base: 0, md: 1 }}
        px={{ base: 4, md: 4 }}
        py={{ base: 3.5, md: 4 }}
        mb={{ base: 3, md: 5 }}
      >
        <Heading fontSize={{ base: "lg", md: "xl" }} mb={1}>
          ¡Hola{user ? `, ${user.nombre || user.name || user.username || user.email}` : ""}!
        </Heading>
        <Text color={subtextColor} fontSize={{ base: "sm", md: "md" }}>
          Explora el catálogo y continúa con tus compras.
        </Text>
      </Box>

      {/* ===== 2. Resultados de búsqueda ===== */}
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
                  subtextColor={subtextColor}
                />
              )}
            />
          ) : (
            <Box px={{ base: 4, md: 0 }}>
              <Text fontSize="sm" color={subtextColor}>
                Prueba buscando por otra palabra clave (marca, medida o referencia).
              </Text>
            </Box>
          )}
        </Section>
      )}

      {/* ===== 3. Banner ===== */}
      <PromoHeroFadeBanner
        images={["/Banner1.png", "/Banner2.png", "/Banner3.jpg", "/Banner4.png"]}
        mt={searchTerm ? 4 : 0}
        mb={{ base: 3, md: 5 }}
        ratio={{ base: 16 / 7, md: 16 / 7, lg: 4 / 1 }}
        // ✅ mobile full-bleed: sin redondeo
        rounded={{ base: "0", md: "2xl" }}
      />

      {/* ===== 4. Navegación Sticky ===== */}
      <StickyCategoryNav
        ref={stickyNavRef}
        sections={categorySections}
        scrollToSection={scrollToSection}
        activeSection={activeSection}
      />

      {/* ===== 5. Secciones del Catálogo (AHORA: todas las categorías reales) ===== */}
      {categorySections.map((section, index) => (
        <Section
          key={section.id}
          id={section.id}
          title={section.title}
          mt={index === 0 ? 0 : { base: 3, md: 5 }}
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
                subtextColor={subtextColor}
              />
            )}
          />
        </Section>
      ))}
    </Box>
  );
}

/* =================== SUBCOMPONENTES =================== */

function Section({ id, title, children, mt = 0, setRef }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");

  // ✅ padding interno alineado con el scroller (menos “doble padding”)
  const innerPx = useBreakpointValue({ base: 4, md: 4 }) ?? 4;

  return (
    <Box
      id={id}
      ref={setRef}
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius={{ base: "0", md: "xl" }}
      boxShadow={{ base: "none", md: "sm" }}
      borderLeftWidth={{ base: 0, md: 1 }}
      borderRightWidth={{ base: 0, md: 1 }}
      // ✅ en mobile evitamos padding externo: full-bleed
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

/* ===== StickyCategoryNav (mobile: iOS Action Sheet / desktop: tabs + flechas) ===== */
const StickyCategoryNav = React.forwardRef(({ sections, scrollToSection, activeSection }, ref) => {
  // ✅ Hooks arriba (SIEMPRE)
  const navBg = useColorModeValue("white", "gray.800");
  const borderCo = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const subtle = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const muted = useColorModeValue("gray.600", "gray.300");

  const mobileBtnBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const overlayBg = useColorModeValue("blackAlpha.400", "blackAlpha.600");

  const sheetBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(17,19,25,0.92)");
  const handleBg = useColorModeValue("blackAlpha.300", "whiteAlpha.300");

  const selectedChipBg = useColorModeValue("yellow.400", "yellow.300");
  const closeBtnBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const closeBtnHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const arrowSize = useBreakpointValue({ base: "sm", md: "md" }) ?? "sm";

  const { isOpen, onOpen, onClose } = useDisclosure();

  // ✅ FIX: colores de flechas (NO hooks dentro del JSX condicional)
  const desktopArrowBg = useColorModeValue("white", "gray.700");
  const desktopArrowHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  // seguridad del active
  const safeActive = sections.some((s) => s.id === activeSection) ? activeSection : sections[0]?.id;
  const activeTitle = sections.find((s) => s.id === safeActive)?.title || "Explorar";

  // Desktop tabs index
  const activeIndexRaw = sections.findIndex((s) => s.id === safeActive);
  const activeIndex = activeIndexRaw >= 0 ? activeIndexRaw : 0;

  // Desktop arrows
  const tabListRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const SAFE_ZONE_PADDING = "52px";

  const handleScroll = useCallback(() => {
    const el = tabListRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    const isScrollable = scrollWidth > clientWidth + 5;
    const isStart = scrollLeft < 5;
    const isEnd = scrollWidth - clientWidth - scrollLeft < 5;

    setShowLeft(isScrollable && !isStart);
    setShowRight(isScrollable && !isEnd);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    handleScroll();
    const el = tabListRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, isMobile]);

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
      borderRadius={{ base: "0", md: "xl" }}
      boxShadow={{ base: "none", md: "md" }}
      borderLeftWidth={{ base: 0, md: 1 }}
      borderRightWidth={{ base: 0, md: 1 }}
      mb={{ base: 3, md: 5 }}
      px={{ base: 4, md: 4 }}
      py={{ base: 3, md: 2 }}
    >
      {/* ✅ MOBILE: selector iOS */}
      {isMobile ? (
        <>
          <HStack justify="space-between" align="center" spacing={3}>
            <VStack align="flex-start" spacing={0} minW={0}>
              <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                Categorías
              </Text>
              <Text fontSize="xs" color={muted} noOfLines={1}>
                Toca para cambiar
              </Text>
            </VStack>

            <Button
              onClick={onOpen}
              size="sm"
              variant="outline"
              rightIcon={<FiChevronDown />}
              borderRadius="full"
              bg={mobileBtnBg}
              backdropFilter="blur(12px)"
              borderColor={borderCo}
              boxShadow="sm"
              px={4}
              minH="40px"
              maxW="65%"
              w="auto"
            >
              <Text noOfLines={1}>{activeTitle}</Text>
            </Button>
          </HStack>

          <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
            <DrawerOverlay bg={overlayBg} />
            <DrawerContent
              bg={sheetBg}
              borderTopRadius="2xl"
              overflow="hidden"
              boxShadow="2xl"
              backdropFilter="blur(18px)"
            >
              <Box w="44px" h="5px" bg={handleBg} borderRadius="full" mx="auto" mt={3} mb={2} />

              <DrawerBody p={0}>
                <Box px={4} pb={3}>
                  <Text fontWeight="semibold" fontSize="md">
                    Explorar categorías
                  </Text>
                  <Text fontSize="sm" color={muted}>
                    Selecciona una para saltar al catálogo
                  </Text>
                </Box>

                <Divider borderColor={borderCo} />

                <Box maxH="55vh" overflowY="auto" px={2} py={2}>
                  {sections.map((s) => {
                    const selected = s.id === safeActive;
                    return (
                      <Button
                        key={s.id}
                        w="full"
                        variant="ghost"
                        justifyContent="space-between"
                        borderRadius="xl"
                        px={4}
                        py={6}
                        mb={1}
                        bg={selected ? subtle : "transparent"}
                        _hover={{ bg: subtle }}
                        onClick={() => {
                          scrollToSection(s.id);
                          onClose();
                        }}
                      >
                        <Text fontSize="md" noOfLines={1}>
                          {s.title}
                        </Text>

                        <Box
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          bg={selected ? selectedChipBg : "transparent"}
                          color={selected ? "black" : muted}
                          border={selected ? "none" : "1px solid"}
                          borderColor={borderCo}
                        >
                          {selected ? <FiCheck /> : null}
                        </Box>
                      </Button>
                    );
                  })}
                </Box>

                <Box px={3} pb={3} pt={1}>
                  <Button
                    w="full"
                    borderRadius="xl"
                    bg={closeBtnBg}
                    _hover={{ bg: closeBtnHoverBg }}
                    onClick={onClose}
                  >
                    Cerrar
                  </Button>
                </Box>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        /* ✅ DESKTOP: tabs + flechas */
        <Box position="relative">
          {showLeft && (
            <IconButton
              aria-label="Scroll left"
              icon={<FiChevronLeft />}
              size={arrowSize}
              variant="solid"
              isRound
              position="absolute"
              left="6px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={2}
              onClick={() => scrollBy(-180)}
              bg={desktopArrowBg}
              border="1px solid"
              borderColor={borderCo}
              _hover={{ bg: desktopArrowHoverBg }}
              boxShadow="sm"
            />
          )}

          {showRight && (
            <IconButton
              aria-label="Scroll right"
              icon={<FiChevronRight />}
              size={arrowSize}
              variant="solid"
              isRound
              position="absolute"
              right="6px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={2}
              onClick={() => scrollBy(180)}
              bg={desktopArrowBg}
              border="1px solid"
              borderColor={borderCo}
              _hover={{ bg: desktopArrowHoverBg }}
              boxShadow="sm"
            />
          )}

          <Tabs variant="soft-rounded" colorScheme="yellow" index={activeIndex}>
            <TabList
              ref={tabListRef}
              overflowX="auto"
              py={1}
              px={SAFE_ZONE_PADDING}
              css={{
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
                scrollBehavior: "smooth",
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
      )}
    </Box>
  );
});

/* ===== RowScroller (mobile: SIN flechas; desktop: flechas + padding seguro) ===== */
function RowScroller({ loading, items, renderItem, placeholderCount = 8 }) {
  const scrollerRef = useRef(null);

  // ✅ Hooks siempre arriba
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const arrowSize = useBreakpointValue({ base: "sm", md: "md" }) ?? "sm";

  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // ✅ MENOS padding acumulado + mejor alineación con títulos (mobile)
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
        }}
      >
        {content}
      </HStack>

      <HintHint px={SAFE_ZONE_PADDING} />
    </Box>
  );
}

/* ===== ProductCard ===== */
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
      onClick={() => onView(producto)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(producto);
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
            onClick={() => onAdd(producto)}
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
      minW={{ base: "170px", sm: "190px", md: "210px" }}
      maxW={{ base: "170px", sm: "190px", md: "210px" }}
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