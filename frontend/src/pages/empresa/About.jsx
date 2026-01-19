// src/pages/empresa/About.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Image,
  Badge,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  Kbd,
  List,
  ListItem,
  Divider,
  usePrefersReducedMotion,
  Icon,
  Stack,
  AspectRatio,
  useBreakpointValue,
} from "@chakra-ui/react";
import { keyframes } from "@chakra-ui/system";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiBox,
  FiActivity,
  FiTrendingUp,
  FiCheckCircle,
  FiTruck,
  FiFileText,
  FiLayers,
  FiChevronsRight,
  FiLock,
  FiClock,
  FiAlertTriangle,
  FiMapPin,
  FiHelpCircle,
  FiHome,
  FiInfo,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

// ================= Utils locales =================
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// ✅ Rutas reales (según tu router)
const ROUTES = {
  home: "/empresa",
  catalogo: "/empresa/catalogo",
  about: "/empresa/about",
  puntos: "/empresa/puntos-fisicos",
  cotizaciones: "/empresa/cotizaciones",
  pedidos: "/empresa/mis-pedidos",
  carrito: "/empresa/carrito-empresa",
  checkout: "/empresa/checkout-empresa",
  perfil: "/empresa/perfil-empresa",
  casos: "/empresa/casos-empresa",
  producto: (id) => `/empresa/producto/${id}`,
};

// Wrapper con animación de entrada
const MotionSection = ({ children }) => {
  const prefersReduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2, margin: "-80px" }}
      transition={{
        duration: prefersReduced ? 0 : 0.32,
        ease: [0.2, 0, 0, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default function EmpresaAbout() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const stickyTop = useBreakpointValue({ base: "64px", md: "72px" });
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

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

  const destacados = useMemo(() => {
    const withDeal = productos.filter(
      (p) => p.precio_oferta || p.descuento > 0 || p.oferta
    );
    return (withDeal.length ? withDeal : productos).slice(0, 12);
  }, [productos]);

  // ✅ detalle del producto en EMPRESA
  const onView = (p) => navigate(ROUTES.producto(p.id));

  return (
    <Box
      bg={pageBg}
      px={{ base: 3, md: 6, lg: 10 }}
      py={{ base: 4, md: 6 }}
      // ✅ espacio extra abajo para no tapar contenido con el dock mobile
      pb={{ base: 24, md: 6 }}
    >
      <MotionSection>
        <HeroEmpresa
          loading={loading}
          items={destacados}
          onView={onView}
          onGoCatalogo={() => navigate(ROUTES.catalogo)}
          onGoCotizaciones={() => navigate(ROUTES.cotizaciones)}
          onGoGuia={() => scrollToId("guia-rapida-empresa", { pulse: true })}
          onGoSobre={() => scrollToId("sobre-ferreexpress", { pulse: true })}
          onGoBeneficios={() => scrollToId("beneficios-empresa", { pulse: true })}
        />
      </MotionSection>

      {/* ✅ Navegación sticky (mobile-first) para reconocimiento > memoria */}
      <MotionSection>
        <StickyChips top={stickyTop} />
      </MotionSection>

      <MotionSection>
        <Section title="Acciones rápidas" mt={5} id="acciones-rapidas">
          <QuickActions
            onGoCatalogo={() => navigate(ROUTES.catalogo)}
            onGoCotizaciones={() => navigate(ROUTES.cotizaciones)}
            onGoPedidos={() => navigate(ROUTES.pedidos)}
            onGoCarrito={() => navigate(ROUTES.carrito)}
            onGoCasos={() => navigate(ROUTES.casos)}
            onGoPuntos={() => navigate(ROUTES.puntos)}
          />
          <Text
            mt={3}
            color={useColorModeValue("gray.600", "gray.300")}
            fontSize="sm"
          >
            Pensado para móvil: entra directo a lo que necesitas (menos pasos,
            más control).
          </Text>
        </Section>
      </MotionSection>

      {/* ✅ SOBRE FERREEXPRESS (empresa + ecommerce) */}
      <MotionSection>
        <Section title="Sobre FerreExpress" mt={5} id="sobre-ferreexpress">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoCard icon={FiHome} title="Quiénes somos">
              <Text>
                FerreExpress S.A.S. es una empresa ferretera enfocada en atender
                compras por obra y abastecimiento recurrente. Nuestro objetivo es
                reducir tiempos muertos y mejorar la trazabilidad de materiales.
              </Text>
              <CalloutNote>
                Este módulo Empresa está diseñado para que cotices, compartas
                proformas y conviertas a pedido con información clara y estados visibles.
              </CalloutNote>
            </InfoCard>

            <InfoCard icon={FiInfo} title="Qué es esta plataforma (e-commerce)">
              <BulletList
                items={[
                  "Catálogo digital con búsqueda y fichas claras para decisiones rápidas.",
                  "Cotizaciones (proformas) con vigencia visible y descuentos por volumen.",
                  "Conversión a pedido con validación de stock en el momento clave.",
                  "Soporte por casos para resolver bloqueos de forma trazable.",
                ]}
              />
            </InfoCard>

            <InfoCard icon={FiMapPin} title="Puntos físicos y cobertura">
              <Text>
                Si prefieres coordinar retiro o confirmar disponibilidad con atención en
                punto físico, aquí puedes ver ubicaciones y datos de contacto.
              </Text>
              <Button
                mt={3}
                colorScheme="teal"
                rightIcon={<FiChevronsRight />}
                onClick={() => navigate(ROUTES.puntos)}
              >
                Ver puntos físicos
              </Button>
            </InfoCard>

            <InfoCard icon={FiLock} title="Confianza y seguridad">
              <BulletList
                items={[
                  "Acceso por rol (CONTRATISTA) para separar funciones y datos.",
                  "Sesión protegida con token (JWT) y buenas prácticas de credenciales.",
                  "Trazabilidad en estados de cotización/pedido y acciones relevantes.",
                ]}
              />
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section
          title="Beneficios para Contratista / Empresa"
          mt={5}
          id="beneficios-empresa"
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoCard icon={FiLayers} title="Cotizaciones por obra (B2B)">
              <BulletList
                items={[
                  "Arma tu lista de materiales por proyecto u obra.",
                  "Modifica cantidades rápido sin perderte (ideal en campo).",
                  "Desglose claro por ítem y total general.",
                ]}
              />
            </InfoCard>

            <InfoCard icon={FiClock} title="Vigencia visible y estados claros">
              <BulletList
                items={[
                  "La cotización muestra fecha y estado de vigencia.",
                  "Alertas cuando está por vencer para no perder condiciones.",
                  "Evita decisiones con información desactualizada.",
                ]}
              />
            </InfoCard>

            <InfoCard icon={FiTrendingUp} title="Descuentos por volumen">
              <BulletList
                items={[
                  "Visualiza precio base, descuento aplicado y precio final.",
                  "Ahorro total por ítem y por cotización (para aprobación interna).",
                  "Coherencia entre pantalla y proforma.",
                ]}
              />
            </InfoCard>

            <InfoCard icon={FiShoppingCart} title="Convertir a pedido (controlado)">
              <BulletList
                items={[
                  "Convierte la cotización manteniendo el detalle aprobado.",
                  "Validación de stock antes de crear el pedido (prevención de errores).",
                  "Reduce reprocesos y compras duplicadas.",
                ]}
              />
            </InfoCard>

            <InfoCard icon={FiTruck} title="Seguimiento de pedidos">
              <BulletList
                items={[
                  "Consulta pedidos por estado y revisa detalle.",
                  "Traza lo pedido vs. lo recibido para control de obra.",
                  "Soporta decisiones rápidas cuando hay cambios.",
                ]}
              />
            </InfoCard>

            <InfoCard icon={FiHelpCircle} title="Soporte por casos (trazable)">
              <BulletList
                items={[
                  "Si algo no cuadra (stock, vigencia, precio), abre un caso.",
                  "Obtén radicado y seguimiento (sin depender de mensajes sueltos).",
                  "Mejor control para ti y para la operación.",
                ]}
              />
              <Button
                mt={3}
                variant="outline"
                rightIcon={<FiChevronsRight />}
                onClick={() => navigate(ROUTES.casos)}
              >
                Ir a mis casos
              </Button>
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section title="Guía rápida (flujo recomendado)" mt={5} id="guia-rapida-empresa">
          <StepList
            steps={[
              {
                title: "1) Entra al catálogo",
                desc: "Busca referencias y revisa fichas para seleccionar lo que necesitas.",
                icon: FiBox,
                action: { label: "Abrir catálogo", onClick: () => navigate(ROUTES.catalogo) },
              },
              {
                title: "2) Genera cotización",
                desc: "Crea la cotización con cantidades por obra y revisa descuentos por volumen.",
                icon: FiFileText,
                action: { label: "Ver cotizaciones", onClick: () => navigate(ROUTES.cotizaciones) },
              },
              {
                title: "3) Valida vigencia",
                desc: "Asegúrate de que esté vigente antes de convertir o compartir internamente.",
                icon: FiClock,
              },
              {
                title: "4) Convierte a pedido",
                desc: "Convierte cuando ya esté aprobado, con validación de stock al final.",
                icon: FiShoppingCart,
                action: { label: "Ver carrito", onClick: () => navigate(ROUTES.carrito) },
              },
              {
                title: "5) Haz seguimiento",
                desc: "Consulta tus pedidos y su detalle para trazabilidad en obra.",
                icon: FiTruck,
                action: { label: "Ir a pedidos", onClick: () => navigate(ROUTES.pedidos) },
              },
            ]}
          />

          {/* Tip desktop (no estorba en móvil) */}
          <HStack
            spacing={2}
            mt={4}
            color={useColorModeValue("gray.700", "gray.300")}
            display={{ base: "none", md: "flex" }}
          >
            <Kbd>Ctrl</Kbd>
            <Text fontSize="sm">+ barra de búsqueda para encontrar referencias rápido</Text>
          </HStack>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section title="Estados y decisiones rápidas" mt={5} id="estados-decision">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoCard icon={FiLayers} title="Estados (referencia práctica)">
              <VStack align="stretch" spacing={2}>
                <StateRow
                  badgeColor="gray"
                  name="Borrador"
                  desc="La estás armando; puedes editar sin problema."
                />
                <StateRow
                  badgeColor="teal"
                  name="Vigente"
                  desc="Lista para compartir o convertir (ideal)."
                />
                <StateRow
                  badgeColor="orange"
                  name="Por vencer"
                  desc="Actúa ya: revisa/convierte para no perder condiciones."
                />
                <StateRow
                  badgeColor="red"
                  name="Caducada"
                  desc="Regenera o actualiza antes de convertir para evitar inconsistencias."
                />
              </VStack>
            </InfoCard>

            <InfoCard icon={FiAlertTriangle} title="Cómo evitar errores al convertir">
              <BulletList
                items={[
                  "Verifica que esté vigente antes de convertir.",
                  "Revisa cantidades finales (especialmente alto volumen).",
                  "Si aparece aviso de stock, ajusta cantidades o cambia referencia.",
                  "Si algo no cuadra, abre un caso (mejor que improvisar).",
                ]}
              />
              <Button
                mt={3}
                colorScheme="teal"
                variant="outline"
                rightIcon={<FiChevronsRight />}
                onClick={() => navigate(ROUTES.casos)}
              >
                Abrir/Ver casos
              </Button>
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>
    </Box>
  );
}

/* =================== Subcomponentes reutilizables =================== */

function HeroEmpresa({
  loading,
  items = [],
  onView,
  onGoCatalogo,
  onGoCotizaciones,
  onGoGuia,
  onGoSobre,
  onGoBeneficios,
}) {
  const fg = useColorModeValue("gray.700", "gray.300");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(59,130,246,0.08))",
    "linear-gradient(135deg, rgba(13,148,136,0.12), rgba(59,130,246,0.12))"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const prefersReduced = usePrefersReducedMotion();

  return (
    <Box bg={heroBg} borderRadius="xl" p={{ base: 4, md: 6 }}>
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={{ base: 4, md: 8 }}
        align={{ base: "stretch", md: "center" }}
      >
        <VStack align="start" spacing={3} flex={1}>
          <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
            FerreExpress S.A.S. • Contratista / Empresa
          </Badge>

          <Heading size={{ base: "lg", md: "xl" }} lineHeight="1.15">
            Compra por obra con cotizaciones, vigencia y control
          </Heading>

          <Text color={fg}>
            Aquí encuentras lo esencial para tu operación: catálogo rápido, cotizaciones con
            descuentos por volumen, proforma y conversión a pedido con estados claros.
          </Text>

          {/* Chips (scroll) = reconocimiento > memoria */}
          <HStack spacing={2} flexWrap="wrap">
            <Button size="sm" variant="outline" onClick={onGoBeneficios}>
              Beneficios
            </Button>
            <Button size="sm" variant="outline" onClick={onGoGuia}>
              Guía rápida
            </Button>
            <Button size="sm" variant="outline" onClick={onGoSobre}>
              Sobre FerreExpress
            </Button>
          </HStack>

          {/* CTAs */}
          <Stack direction={{ base: "column", sm: "row" }} spacing={3} w="full">
            <Button
              rightIcon={<FiChevronsRight />}
              colorScheme="teal"
              onClick={onGoCatalogo}
              w={{ base: "full", sm: "auto" }}
              h="44px"
            >
              Ir al catálogo
            </Button>
            <Button
              variant="outline"
              onClick={onGoCotizaciones}
              w={{ base: "full", sm: "auto" }}
              h="44px"
            >
              Ver cotizaciones
            </Button>
          </Stack>
        </VStack>

        {/* Mini grid de destacados */}
        <Box flex={1} w="full">
          <Box
            borderRadius="xl"
            p={4}
            bg={cardBg}
            border="1px solid"
            borderColor={border}
          >
            <HStack justify="space-between" mb={3}>
              <Heading size="sm">Destacados</Heading>
              <Badge variant="subtle" colorScheme="blue">
                Catálogo
              </Badge>
            </HStack>

            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3}>
              {(loading ? Array.from({ length: 8 }) : (items || []).slice(0, 8)).map((p, i) =>
                loading ? (
                  <MiniSkeletonCard key={`mini-${i}`} />
                ) : (
                  <motion.div
                    key={p?.id ?? `mini-${i}`}
                    initial={{
                      opacity: 0,
                      scale: prefersReduced ? 1 : 0.98,
                    }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: prefersReduced ? 0 : 0.02 * i,
                      duration: prefersReduced ? 0 : 0.22,
                      ease: [0.2, 0, 0, 1],
                    }}
                  >
                    <CompactProductCard producto={p} onView={() => onView(p)} />
                  </motion.div>
                )
              )}
            </SimpleGrid>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

function StickyChips({ top }) {
  const cardBg = useColorModeValue("rgba(255,255,255,0.78)", "rgba(26,32,44,0.70)");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      position="sticky"
      top={top}
      zIndex={20}
      mt={4}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      bg={cardBg}
      backdropFilter="blur(10px)"
      px={3}
      py={2}
    >
      <HStack spacing={2} flexWrap="wrap" justify="space-between">
        <HStack spacing={2} flexWrap="wrap">
          <Button size="sm" variant="ghost" onClick={() => scrollToId("beneficios-empresa", { pulse: true })}>
            Beneficios
          </Button>
          <Button size="sm" variant="ghost" onClick={() => scrollToId("guia-rapida-empresa", { pulse: true })}>
            Guía
          </Button>
          <Button size="sm" variant="ghost" onClick={() => scrollToId("sobre-ferreexpress", { pulse: true })}>
            FerreExpress
          </Button>
          <Button size="sm" variant="ghost" onClick={() => scrollToId("destacados", { pulse: true })}>
            Destacados
          </Button>
        </HStack>

        <Badge borderRadius="full" px={3} py={1} colorScheme="teal" variant="subtle">
          Modo Empresa
        </Badge>
      </HStack>
    </Box>
  );
}

function QuickActions({
  onGoCatalogo,
  onGoCotizaciones,
  onGoPedidos,
  onGoCarrito,
  onGoCasos,
  onGoPuntos,
}) {
  // Botones grandes en móvil (tap-friendly)
  return (
    <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={3}>
      <Button onClick={onGoCatalogo} leftIcon={<FiBox />} colorScheme="teal" variant="solid" h="44px">
        Catálogo
      </Button>
      <Button onClick={onGoCotizaciones} leftIcon={<FiFileText />} variant="outline" h="44px">
        Cotizaciones
      </Button>
      <Button onClick={onGoPedidos} leftIcon={<FiTruck />} variant="outline" h="44px">
        Mis pedidos
      </Button>
      <Button onClick={onGoCarrito} leftIcon={<FiShoppingCart />} variant="outline" h="44px">
        Carrito
      </Button>
      <Button onClick={onGoCasos} leftIcon={<FiHelpCircle />} variant="outline" h="44px">
        Soporte
      </Button>
      <Button onClick={onGoPuntos} leftIcon={<FiMapPin />} variant="outline" h="44px">
        Puntos
      </Button>
    </SimpleGrid>
  );
}

function StepList({ steps = [] }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");
  const chipBg = useColorModeValue("teal.50", "whiteAlpha.100");
  const chipFg = useColorModeValue("teal.700", "teal.200");

  return (
    <VStack align="stretch" spacing={3}>
      {steps.map((s, idx) => (
        <Box key={idx} border="1px solid" borderColor={border} borderRadius="lg" p={3}>
          <HStack align="start" spacing={3}>
            <Box
              w="36px"
              h="36px"
              borderRadius="lg"
              bg={chipBg}
              display="grid"
              placeItems="center"
              flexShrink={0}
            >
              <Icon as={s.icon} color={chipFg} boxSize={5} />
            </Box>

            <Box flex={1}>
              <HStack justify="space-between" align="start" gap={2}>
                <Heading size="sm">{s.title}</Heading>
                <Badge borderRadius="full" px={2} py={0.5} bg={chipBg} color={chipFg} flexShrink={0}>
                  Paso {idx + 1}
                </Badge>
              </HStack>

              <Text mt={1} color={muted}>
                {s.desc}
              </Text>

              {s.action && (
                <Button
                  mt={3}
                  size="sm"
                  variant="outline"
                  rightIcon={<FiChevronsRight />}
                  onClick={s.action.onClick}
                  h="40px"
                >
                  {s.action.label}
                </Button>
              )}
            </Box>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

function Section({ title, children, mt = 0, id }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const sectionId = id || (title ? slugify(title) : undefined);

  const pulse = keyframes`
    0%   { box-shadow: 0 0 0 0 rgba(56,178,172,0); }
    30%  { box-shadow: 0 0 0 6px rgba(56,178,172,.28); }
    100% { box-shadow: 0 0 0 0 rgba(56,178,172,0); }
  `;
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      whileHover={prefersReduced ? {} : { y: -1 }}
      transition={{ duration: prefersReduced ? 0 : 0.15 }}
    >
      <Box
        id={sectionId}
        bg={cardBg}
        sx={{
          "&:target, &[data-pulse='true']": {
            animation: `${pulse} 900ms ease-out`,
          },
        }}
        border="1px solid"
        borderColor={border}
        borderRadius="xl"
        boxShadow="sm"
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 4 }}
        mt={mt}
      >
        {title && (
          <Heading size="md" mb={3}>
            {title}
          </Heading>
        )}
        {children}
      </Box>
    </motion.div>
  );
}

function InfoCard({ icon: IconCmp, title, children }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const prefersReduced = usePrefersReducedMotion();
  const iconBg = useColorModeValue("teal.50", "whiteAlpha.100");
  const iconFg = useColorModeValue("teal.700", "teal.200");

  return (
    <motion.div
      whileHover={prefersReduced ? {} : { y: -2 }}
      transition={{ duration: prefersReduced ? 0 : 0.18 }}
    >
      <Box p={4} bg={cardBg} border="1px solid" borderColor={border} borderRadius="lg">
        {title && (
          <HStack mb={2} spacing={3} align="center">
            {IconCmp && (
              <Box
                w="36px"
                h="36px"
                borderRadius="lg"
                bg={iconBg}
                display="grid"
                placeItems="center"
                flexShrink={0}
              >
                <Icon as={IconCmp} color={iconFg} boxSize={5} />
              </Box>
            )}
            <Heading size="sm">{title}</Heading>
          </HStack>
        )}
        {typeof children === "string" ? <Text>{children}</Text> : children}
      </Box>
    </motion.div>
  );
}

function BulletList({ items = [] }) {
  const color = useColorModeValue("gray.700", "gray.300");
  return (
    <List spacing={2} color={color}>
      {items.map((t, i) => (
        <ListItem key={i}>
          <HStack align="start" spacing={2}>
            <Box as={FiCheckCircle} mt={1} />
            <Text>{t}</Text>
          </HStack>
        </ListItem>
      ))}
    </List>
  );
}

function StateRow({ badgeColor = "gray", name, desc }) {
  const muted = useColorModeValue("gray.600", "gray.300");
  return (
    <HStack align="start" spacing={3}>
      <Badge colorScheme={badgeColor} borderRadius="full" px={3} py={1} flexShrink={0}>
        {name}
      </Badge>
      <Text color={muted}>{desc}</Text>
    </HStack>
  );
}

function CalloutNote({ children }) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.100");
  const border = useColorModeValue("gray.200", "gray.700");
  const fg = useColorModeValue("gray.700", "gray.300");
  return (
    <Box mt={3} p={3} bg={bg} border="1px solid" borderColor={border} borderRadius="lg">
      <Text fontSize="sm" color={fg}>
        {children}
      </Text>
    </Box>
  );
}

function CompactProductCard({ producto, onView }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");

  const img = producto?.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/400x300?text=Sin+Imagen";

  const price = producto?.precio ?? 0;
  const dealPrice = producto?.precio_oferta
    ? producto.precio_oferta
    : producto?.descuento > 0
    ? price * (1 - Number(producto.descuento) / 100)
    : null;

  return (
    <Box
      onClick={onView}
      cursor="pointer"
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius="lg"
      overflow="hidden"
      _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
      transition="all .15s ease"
    >
      {/* ✅ FIX: imágenes no se salen ni tapan contenido */}
      <AspectRatio ratio={4 / 3} w="full">
        <Box
          bg="white"
          overflow="hidden"
          display="grid"
          placeItems="center"
          borderBottom="1px solid"
          borderColor={border}
          p={2}
        >
          <Image
            src={img}
            alt={producto?.nombre}
            w="100%"
            h="100%"
            objectFit="contain"
            loading="lazy"
          />
        </Box>
      </AspectRatio>

      <VStack spacing={1} align="stretch" p={2}>
        <Text noOfLines={1} fontWeight="semibold" fontSize="sm">
          {producto?.nombre}
        </Text>

        <HStack spacing={2} align="baseline">
          {dealPrice ? (
            <>
              <Text fontWeight="bold" fontSize="sm">
                {fmtCop(dealPrice)}
              </Text>
              <Text color={muted} textDecoration="line-through" fontSize="xs">
                {fmtCop(price)}
              </Text>
            </>
          ) : (
            <Text fontWeight="bold" fontSize="sm">
              {fmtCop(price)}
            </Text>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

function MiniSkeletonCard() {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="lg" overflow="hidden">
      <AspectRatio ratio={4 / 3} w="full">
        <Skeleton />
      </AspectRatio>
      <Box p={2}>
        <Skeleton height="12px" mb={2} />
        <Skeleton height="12px" w="60%" />
      </Box>
    </Box>
  );
}

function MobileDock({ onHome, onCatalogo, onCotizaciones, onCarrito }) {
  const bg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(17,24,39,0.86)");
  const border = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      display={{ base: "block", md: "none" }}
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={50}
      bg={bg}
      backdropFilter="blur(10px)"
      borderTop="1px solid"
      borderColor={border}
      px={3}
      pt={2}
      pb="calc(env(safe-area-inset-bottom) + 10px)"
    >
      <SimpleGrid columns={4} spacing={2}>
        <Button onClick={onHome} leftIcon={<FiHome />} variant="ghost" h="44px">
          Inicio
        </Button>
        <Button onClick={onCatalogo} leftIcon={<FiBox />} variant="ghost" h="44px">
          Catálogo
        </Button>
        <Button onClick={onCotizaciones} leftIcon={<FiFileText />} variant="ghost" h="44px">
          Coti
        </Button>
        <Button onClick={onCarrito} leftIcon={<FiShoppingCart />} variant="ghost" h="44px">
          Carrito
        </Button>
      </SimpleGrid>
    </Box>
  );
}

function FooterNote() {
  const fg = useColorModeValue("gray.600", "gray.400");
  return (
    <VStack align="stretch" mt={5} mb={2}>
      <Divider />
      <Text fontSize="sm" color={fg}>
        © {new Date().getFullYear()} FerreExpress S.A.S. — Módulo Contratista / Empresa
      </Text>
    </VStack>
  );
}

/* =================== Utilidades =================== */

function scrollToId(id, { offset, pulse = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const headerOffset = Number.isFinite(offset) ? offset : getStickyHeaderOffset();
  const y = window.pageYOffset + el.getBoundingClientRect().top - headerOffset - 8;
  window.scrollTo({ top: y, behavior: "smooth" });
  if (history.pushState) history.pushState(null, "", `#${id}`);
  else window.location.hash = `#${id}`;
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  if (pulse) {
    el.setAttribute("data-pulse", "true");
    setTimeout(() => el.removeAttribute("data-pulse"), 1000);
  }
}

function getStickyHeaderOffset() {
  const candidates = ["[data-sticky-header='true']", "#site-header", "header"];
  for (const sel of candidates) {
    const node = document.querySelector(sel);
    if (!node) continue;
    const style = getComputedStyle(node);
    if (style.position === "sticky" || style.position === "fixed") {
      return Math.ceil(node.getBoundingClientRect().height);
    }
  }
  return 84;
}

function slugify(s = "") {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
