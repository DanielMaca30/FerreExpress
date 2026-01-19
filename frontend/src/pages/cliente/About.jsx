// src/pages/cliente/About.jsx  (o donde lo tengas)
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
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  FormErrorMessage,
  InputGroup,
  InputLeftElement,
  Icon,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { keyframes } from "@chakra-ui/system";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiBox,
  FiShield,
  FiUsers,
  FiActivity,
  FiTrendingUp,
  FiCheckCircle,
  FiTruck,
  FiFileText,
  FiLayers,
  FiChevronsRight,
  FiLock,
  FiHash,
  FiBriefcase,
  FiPhone,
  FiMessageSquare,
} from "react-icons/fi";
import api, { API_BASE_URL } from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

// ================= Utils locales =================
const fmtCop = (n) =>
  Number(n ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

// =========================================
// About Page (FerreExpress) — animaciones + scroll preciso + relieve
// =========================================

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

export default function About() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const toast = useToast();
  const { user, loading: authLoading, setUserFromToken } = useAuth();

  const modal = useDisclosure();

  // ✅ Esta página es “solo cliente”:
  useEffect(() => {
    if (authLoading) return;
    if (!user?.token) {
      toast({
        title: "Inicia sesión",
        description: "Para ver la propuesta y convertir tu cuenta, debes iniciar sesión.",
        status: "info",
        duration: 3500,
        isClosable: true,
      });
      navigate("/login?from=/about");
      return;
    }
  }, [authLoading, user, navigate, toast]);

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

  const ofertas = useMemo(() => {
    const withDeal = productos.filter(
      (p) => p?.precio_oferta || Number(p?.descuento) > 0 || p?.oferta
    );
    return (withDeal.length ? withDeal : productos).slice(0, 12);
  }, [productos]);

  const onView = (p) => navigate(`/producto/${p.id}`);
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");

  const onClickVerPropuesta = () => {
    // Si ya es contratista, no tiene sentido convertir
    const role = (user?.role || "").toUpperCase();
    if (role === "CONTRATISTA" || role === "EMPRESA") {
      toast({
        title: "Ya eres Contratista",
        description: "Te llevamos a tu panel de Empresa.",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      navigate("/empresa");
      return;
    }
    modal.onOpen();
  };

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>
      <MotionSection>
        <HeroAbout
          loading={loading}
          items={ofertas}
          onView={onView}
          onGoProposal={onClickVerPropuesta} // ✅ abre modal
          onGoHow={() => scrollToId("como-funciona-por-rol", { pulse: true })}
        />
      </MotionSection>

      {/* ✅ Modal de conversión */}
      <ConvertirEmpresaModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onConverted={(token) => {
          // actualiza localStorage + axios header + role
          const hydrated = setUserFromToken?.(token);
          const newRole = (hydrated?.role || "").toUpperCase();

          toast({
            title: "Listo ✅",
            description:
              newRole === "CONTRATISTA"
                ? "Tu cuenta ahora es Contratista. Bienvenido al panel Empresa."
                : "Tu cuenta fue actualizada.",
            status: "success",
            duration: 3200,
            isClosable: true,
          });

          modal.onClose();
          navigate("/empresa"); // ajusta si tu ruta es otra
        }}
      />

      <MotionSection>
        <Section title="Propuesta de valor" mt={5} id="propuesta-de-valor">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoCard icon={FiBox} title="Catálogo claro y búsqueda rápida">
              <Text>
                Fichas técnicas organizadas, filtros y resultados relevantes para decidir mejor.
              </Text>
            </InfoCard>
            <InfoCard icon={FiFileText} title="Proformas B2B con vigencia visible">
              <Text>
                Cotizaciones con descuentos por volumen y conversión a pedido validando stock.
              </Text>
            </InfoCard>
            <InfoCard icon={FiShoppingCart} title="Compra segura y sin fricción">
              <Text>
                Carrito persistente y flujo de pago listo para demo con pasarela simulada end-to-end.
              </Text>
            </InfoCard>
            <InfoCard icon={FiUsers} title="Soporte por rol con SLA">
              <Text>
                Centro de ayuda con FAQ por tipo de usuario y apertura de casos con estados y tiempos
                de respuesta.
              </Text>
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section title="Cómo funciona (por rol)" mt={5} id="como-funciona-por-rol">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <InfoCard icon={FiShoppingCart} title="Cliente convencional">
              <BulletList
                items={[
                  "Explora catálogo, compara y añade al carrito.",
                  "Solicita cotización si requieres validar cantidades.",
                  "Pago y seguimiento de pedidos en tiempo real.",
                ]}
              />
            </InfoCard>
            <InfoCard icon={FiLayers} title="Contratista / Empresa">
              <BulletList
                items={[
                  "Proformas con vigencia y anexos por proyecto.",
                  "Descuentos por volumen y condiciones específicas.",
                  "Convierte la proforma en pedido al aprobar.",
                ]}
              />
            </InfoCard>
            <InfoCard icon={FiShield} title="Administrador">
              <BulletList
                items={[
                  "Gestiona productos, precios, inventario y pedidos.",
                  "Administra casos de soporte con estados y SLA.",
                  "Monitorea métricas operativas.",
                ]}
              />
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section title="Principios y seguridad" mt={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoCard title="Principios" icon={FiCheckCircle}>
              <BulletList
                items={[
                  "Claridad: precio, disponibilidad y condiciones visibles.",
                  "Eficiencia: menos pasos, más resultados.",
                  "B2B & B2C: compras individuales y por proyecto.",
                  "Accesibilidad: UI responsive y coherente.",
                ]}
              />
            </InfoCard>
            <InfoCard title="Seguridad y datos" icon={FiLock}>
              <BulletList
                items={[
                  "Autenticación por rol (JWT) para Cliente, Empresa y Admin.",
                  "Credenciales protegidas: contraseñas hasheadas y env vars.",
                  "Trazabilidad de estados en cotizaciones, pedidos y casos.",
                ]}
              />
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section title="Lo que estamos construyendo" mt={5}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <InfoCard icon={FiTruck} title="Logística y entregas flexibles">
              <Text>Integraciones de última milla y métodos de envío por zona y prioridad.</Text>
            </InfoCard>
            <InfoCard icon={FiActivity} title="Métricas operativas en tiempo real">
              <Text>Visibilidad de tiempos de preparación, pedidos activos y estado de casos.</Text>
            </InfoCard>
            <InfoCard icon={FiTrendingUp} title="Experiencia móvil optimizada">
              <Text>Mejoras continuas para navegación, accesibilidad y rendimiento.</Text>
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section title="Contexto del mercado" mt={5}>
          <InfoCard>
            <Text>
              La digitalización del comercio en Colombia mantiene un crecimiento sostenido... En
              ferretería y construcción, la migración a plataformas digitales agiliza compras
              recurrentes, cotizaciones y abastecimiento por proyecto.
            </Text>
          </InfoCard>
        </Section>
      </MotionSection>

      <MotionSection>
        <Section mt={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <InfoCard title="Visión">
              <Text>Ser la plataforma de referencia en compras ferreteras en Colombia...</Text>
            </InfoCard>
            <InfoCard title="¿Por qué FerreExpress?">
              <BulletList
                items={[
                  "Proformas con vigencia y descuentos por volumen.",
                  "Estados visibles y comunicación proactiva.",
                  "Arquitectura escalable para integrar logística, pagos y analítica.",
                  "Soporte por rol con centro de ayuda, casos y SLA.",
                ]}
              />
            </InfoCard>
          </SimpleGrid>
        </Section>
      </MotionSection>

      <FooterNote />
    </Box>
  );
}

/* =================== MODAL: convertir a Empresa =================== */

function ConvertirEmpresaModal({ isOpen, onClose, onConverted }) {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const fg = useColorModeValue("gray.700", "gray.300");

  const [form, setForm] = useState({
    nit: "",
    razon_social: "",
    telefono: "",
    cargo: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSubmitting(false);
  }, [isOpen]);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e = {};
    const nit = (form.nit || "").trim();
    const rs = (form.razon_social || "").trim();

    if (!nit) e.nit = "El NIT es requerido";
    if (nit && nit.length < 6) e.nit = "NIT inválido (muy corto)";

    if (!rs) e.razon_social = "La razón social es requerida";
    if (rs && rs.length < 3) e.razon_social = "Razón social inválida";

    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast({
        title: "Revisa el formulario",
        description: "Completa los campos obligatorios.",
        status: "warning",
        duration: 2400,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nit: form.nit.trim(),
        razon_social: form.razon_social.trim(),
        telefono: form.telefono?.trim() || null,
        cargo: form.cargo?.trim() || null,
        mensaje: form.mensaje?.trim() || null,
      };

      const res = await api.post("/auth/convertir-empresa", payload);

      const token = res.data?.token;
      if (!token) {
        throw new Error("El backend no devolvió token");
      }

      onConverted?.(token);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo convertir la cuenta";

      toast({
        title: "No se pudo convertir",
        description: msg,
        status: "error",
        duration: 3200,
        isClosable: true,
      });
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={submitting ? () => {} : onClose} isCentered size={{ base: "full", md: "lg" }}>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
      <ModalContent bg={cardBg} border="1px solid" borderColor={border} borderRadius={{ base: "0", md: "2xl" }} overflow="hidden">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md">Convertir a Contratista</Heading>
            <Text fontSize="sm" color={fg}>
              Accede a proformas B2B, descuentos por volumen y flujo por proyecto.
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton disabled={submitting} />

        <ModalBody pb={2}>
          <Alert status="info" borderRadius="lg" mb={4}>
            <AlertIcon />
            Solo te pedimos lo esencial. Luego podrás completar tu perfil Empresa.
          </Alert>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isInvalid={!!errors.nit} isRequired>
              <FormLabel>NIT</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiHash} />
                </InputLeftElement>
                <Input
                  placeholder="900123456-7"
                  value={form.nit}
                  onChange={(e) => setField("nit", e.target.value)}
                />
              </InputGroup>
              <FormErrorMessage>{errors.nit}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.razon_social} isRequired>
              <FormLabel>Razón social</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiBriefcase} />
                </InputLeftElement>
                <Input
                  placeholder="Ferretería XYZ S.A.S."
                  value={form.razon_social}
                  onChange={(e) => setField("razon_social", e.target.value)}
                />
              </InputGroup>
              <FormErrorMessage>{errors.razon_social}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Teléfono (opcional)</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FiPhone} />
                </InputLeftElement>
                <Input
                  placeholder="3001234567"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Cargo (opcional)</FormLabel>
              <Input
                placeholder="Compras / Obra / Residente"
                value={form.cargo}
                onChange={(e) => setField("cargo", e.target.value)}
              />
            </FormControl>
          </SimpleGrid>

          <FormControl mt={4}>
            <FormLabel>Mensaje (opcional)</FormLabel>
            <InputGroup>
              <InputLeftElement alignSelf="start" mt={2}>
                <Icon as={FiMessageSquare} />
              </InputLeftElement>
              <Textarea
                pl={10}
                minH="92px"
                resize="vertical"
                placeholder="Cuéntanos qué tipo de compras o proyectos manejas..."
                value={form.mensaje}
                onChange={(e) => setField("mensaje", e.target.value)}
              />
            </InputGroup>
          </FormControl>

          <Text mt={3} fontSize="xs" color={fg}>
            Al continuar, tu cuenta cambiará de rol a <b>CONTRATISTA</b> y se actualizará tu sesión.
          </Text>
        </ModalBody>

        <ModalFooter>
          <HStack w="full" justify="space-between">
            <Button variant="ghost" onClick={onClose} isDisabled={submitting}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              rightIcon={<FiChevronsRight />}
              onClick={submit}
              isLoading={submitting}
              loadingText="Convirtiendo..."
            >
              Convertirme ahora
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* =================== Subcomponentes reutilizables =================== */

function HeroAbout({ loading, items = [], onView, onGoProposal, onGoHow }) {
  const fg = useColorModeValue("gray.700", "gray.300");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(59,130,246,0.08))",
    "linear-gradient(135deg, rgba(13,148,136,0.12), rgba(59,130,246,0.12))"
  );
  const prefersReduced = usePrefersReducedMotion();

  return (
    <Box bg={heroBg} borderRadius="xl" p={{ base: 4, md: 6 }}>
      <HStack
        align={{ base: "start", md: "center" }}
        spacing={{ base: 4, md: 8 }}
        flexDir={{ base: "column", md: "row" }}
      >
        <VStack align="start" spacing={3} flex={1}>
          <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
            FerreExpress S.A.S.
          </Badge>
          <Heading size={{ base: "lg", md: "xl" }}>
            Compras ferreteras simples, transparentes y rápidas
          </Heading>
          <Text color={fg}>
            Plataforma de comercio electrónico para ferretería y materiales de construcción.
          </Text>

          <HStack>
            <Button
              rightIcon={<FiChevronsRight />}
              colorScheme="teal"
              onClick={onGoProposal}
            >
              Ver propuesta
            </Button>
            <Button variant="outline" onClick={onGoHow}>
              Cómo funciona
            </Button>
          </HStack>
        </VStack>

        <Box flex={1} w="full">
          <Box
            borderRadius="xl"
            p={4}
            bg={useColorModeValue("white", "gray.800")}
            border="1px solid"
            borderColor={useColorModeValue("gray.200", "gray.700")}
          >
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3}>
              {(loading ? Array.from({ length: 8 }) : (items || []).slice(0, 8)).map(
                (p, i) =>
                  loading ? (
                    <MiniSkeletonCard key={`mini-${i}`} />
                  ) : (
                    <motion.div
                      key={p?.id ?? `mini-${i}`}
                      initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: prefersReduced ? 0 : 0.02 * i,
                        duration: prefersReduced ? 0 : 0.24,
                        ease: [0.2, 0, 0, 1],
                      }}
                    >
                      <CompactProductCard producto={p} onView={() => onView(p)} />
                    </motion.div>
                  )
              )}
            </SimpleGrid>

            <HStack spacing={2} mt={3} color={fg}>
              <Kbd>Ctrl</Kbd>
              <Text fontSize="sm">+ Búsqueda rápida de productos</Text>
            </HStack>
          </Box>
        </Box>
      </HStack>
    </Box>
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
          "&:target, &[data-pulse='true']": { animation: `${pulse} 900ms ease-out` },
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

  return (
    <motion.div
      whileHover={prefersReduced ? {} : { y: -2 }}
      transition={{ duration: prefersReduced ? 0 : 0.18 }}
    >
      <Box p={4} bg={cardBg} border="1px solid" borderColor={border} borderRadius="lg">
        {title && (
          <HStack mb={2} spacing={2}>
            {IconCmp && <IconCmp />}
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

/* =================== CARD PRODUCTO (FIX IMAGENES) =================== */
function CompactProductCard({ producto, onView }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");

  const img = producto?.imagen_principal
    ? `${API_BASE_URL}${producto.imagen_principal}`
    : "https://via.placeholder.com/400x300?text=Sin+Imagen";

  const price = Number(producto?.precio ?? 0);
  const dealPrice = producto?.precio_oferta
    ? Number(producto.precio_oferta)
    : Number(producto?.descuento) > 0
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
      <Box
        h={{ base: "84px", md: "96px" }}
        bg={useColorModeValue("white", "gray.900")}
        borderBottom="1px solid"
        borderColor={border}
        overflow="hidden"
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        lineHeight="0"
        px={2}
        py={2}
      >
        <Image
          src={img}
          alt={producto?.nombre || "Producto"}
          w="100%"
          h="100%"
          objectFit="contain"
          objectPosition="center"
          display="block"
          draggable={false}
          loading="lazy"
          fallback={<Skeleton w="100%" h="100%" />}
        />
      </Box>

      <VStack spacing={1} align="stretch" p={2} minH="56px">
        <Text noOfLines={1} fontWeight="semibold" fontSize="sm">
          {producto?.nombre}
        </Text>

        <HStack spacing={2} align="baseline" justify="space-between">
          <HStack spacing={2} align="baseline" minW={0}>
            {dealPrice ? (
              <>
                <Text fontWeight="bold" fontSize="sm">
                  {fmtCop(dealPrice)}
                </Text>
                <Text
                  color={muted}
                  textDecoration="line-through"
                  fontSize="xs"
                  noOfLines={1}
                >
                  {fmtCop(price)}
                </Text>
              </>
            ) : (
              <Text fontWeight="bold" fontSize="sm">
                {fmtCop(price)}
              </Text>
            )}
          </HStack>
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
      <Skeleton h={{ base: "84px", md: "96px" }} w="100%" />
      <Box p={2}>
        <Skeleton height="12px" mb={2} />
        <Skeleton height="12px" w="60%" />
      </Box>
    </Box>
  );
}

function FooterNote() {
  const fg = useColorModeValue("gray.600", "gray.400");
  return (
    <VStack align="stretch" mt={5} mb={2}>
      <Divider />
      <Text fontSize="sm" color={fg}>
        © {new Date().getFullYear()} FerreExpress S.A.S. — Sobre Nosotros
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