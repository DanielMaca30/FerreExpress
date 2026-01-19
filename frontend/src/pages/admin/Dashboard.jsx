// src/pages/admin/Dashboard.jsx
// ✅ Ajuste “layout-aware”: encaja mejor con Sidebar + Topbar
// - Sin Container (evita doble centrado)
// - MaxW controlado dentro del área (no se pierde en pantallas grandes)
// - 2 columnas en XL (mejor uso en PC)
// - Callout compacto estilo iOS (menos alto, más integrado)
// - Framer: motion.create()

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  HStack,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Tag,
  TagLabel,
  TagLeftIcon,
  Button,
  Tooltip,
  Skeleton,
  useColorModeValue,
  useToast,
  Progress,
  Divider,
  Badge,
  usePrefersReducedMotion,
  Stack,
  Grid,
  GridItem,
  Icon,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiFileText,
  FiLifeBuoy,
  FiBox,
  FiTrendingUp,
  FiArrowRight,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const ferreYellow = "#F9BF20";
const MotionBox = motion.create(Box);

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  // 🔧 IMPORTANTE: no uses un gradient fuerte aquí si tu Layout ya “manda” el look
  // Mejor: fondo neutro que se integra con tu topbar/side
  const canvasBg = useColorModeValue("gray.50", "gray.900");
  const glassBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(23,25,35,0.74)");
  const borderCo = useColorModeValue("rgba(226,232,240,0.9)", "rgba(45,55,72,0.75)");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const titleCo = useColorModeValue("gray.800", "whiteAlpha.900");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [prodTotal, setProdTotal] = useState(0);
  const [cotTotal, setCotTotal] = useState(0);
  const [cotPendientes, setCotPendientes] = useState(0);
  const [casosAbiertos, setCasosAbiertos] = useState(0);
  const [casosCriticos, setCasosCriticos] = useState(0);
  const [pedidosTotal, setPedidosTotal] = useState(0);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);
  const [pedidosCompletados, setPedidosCompletados] = useState(0);
  const [pedidosCancelados, setPedidosCancelados] = useState(0);

  const animatedProps = useMemo(() => {
    if (prefersReducedMotion) return {};
    return {
      transition: { duration: 0.18 },
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
    };
  }, [prefersReducedMotion]);

  const loadDashboard = useCallback(
    async (showToast = false) => {
      try {
        setError("");
        setLoading(true);

        const [prodRes, cotRes, casosRes, pedRes] = await Promise.all([
          api.get("/productos", { params: { page: 1, limit: 1 } }),
          api.get("/cotizaciones"),
          api.get("/casos"),
          api.get("/pedidos"),
        ]);

        // Productos
        const prodData = prodRes.data;
        const prodArr = prodData?.productos || prodData || [];
        setProdTotal(Number(prodData?.total || prodArr.length || 0));

        // Cotizaciones
        const cotArr = Array.isArray(cotRes.data) ? cotRes.data : [];
        setCotTotal(cotArr.length);
        setCotPendientes(
          cotArr.filter((c) => {
            const estado = String(c?.estado || "").toUpperCase();
            return estado === "PENDIENTE" || estado === "EN_REVISION";
          }).length
        );

        // Casos
        const casosArr = Array.isArray(casosRes.data) ? casosRes.data : [];
        const abiertos = casosArr.filter((c) => {
          const est = String(c?.estado || "").toUpperCase();
          return est !== "CERRADO" && est !== "RESUELTO";
        });
        setCasosAbiertos(abiertos.length);
        setCasosCriticos(
          abiertos.filter((c) => {
            const pr = String(c?.prioridad || "").toUpperCase();
            return pr === "ALTA" || pr === "CRITICA";
          }).length
        );

        // Pedidos
        const pedArr = Array.isArray(pedRes.data) ? pedRes.data : [];
        setPedidosTotal(pedArr.length);

        const pendientes = pedArr.filter((p) => {
          const estado = String(p?.estado || "").toUpperCase();
          return (
            estado === "PENDIENTE" ||
            estado === "CONFIRMADO" ||
            estado === "ENVIADO" ||
            estado === "PROCESANDO"
          );
        }).length;

        const completados = pedArr.filter(
          (p) => String(p?.estado || "").toUpperCase() === "ENTREGADO"
        ).length;

        const cancelados = pedArr.filter(
          (p) => String(p?.estado || "").toUpperCase() === "CANCELADO"
        ).length;

        setPedidosPendientes(pendientes);
        setPedidosCompletados(completados);
        setPedidosCancelados(cancelados);

        setLastUpdated(new Date());

        if (showToast) {
          toast({ status: "success", title: "Dashboard actualizado", duration: 1400 });
        }
      } catch (e) {
        console.error(e);
        setError("No pudimos cargar el resumen. Revisa tu conexión o el backend.");
        toast({
          status: "error",
          title: "Error al cargar el dashboard",
          description: "Intenta de nuevo en unos segundos.",
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const pedidosPendPct =
      pedidosTotal > 0 ? Math.round((pedidosPendientes / pedidosTotal) * 100) : 0;
    const casosCritPct =
      casosAbiertos > 0 ? Math.round((casosCriticos / casosAbiertos) * 100) : 0;
    const cotPendPct = cotTotal > 0 ? Math.round((cotPendientes / cotTotal) * 100) : 0;

    const needsAttention = pedidosPendPct > 60 || casosCritPct > 50 || cotPendPct > 60;

    return { pedidosPendPct, casosCritPct, cotPendPct, needsAttention };
  }, [pedidosTotal, pedidosPendientes, casosAbiertos, casosCriticos, cotTotal, cotPendientes]);

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return "";
    try {
      return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastUpdated);
    } catch {
      return lastUpdated.toLocaleString("es-CO");
    }
  }, [lastUpdated]);

  return (
    <Box w="full" minH="100%" bg={canvasBg} pb={{ base: 6, md: 8 }}>
      {/* Barra de estado superior */}
      <AnimatePresence>
        {loading && !prefersReducedMotion && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Progress size="xs" isIndeterminate borderRadius="0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔧 En vez de Container: padding “natural” que encaja con el Layout */}
      <Box
        w="full"
        px={{ base: 4, md: 6, lg: 8 }}
        pt={{ base: 4, md: 5 }}
      >
        {/* Zona de contenido: más ancho real en desktop */}
        <Box w="full" maxW="1440px" mx="auto">
          {/* Header */}
          <MotionBox
            {...animatedProps}
            bg={glassBg}
            border="1px solid"
            borderColor={borderCo}
            borderRadius="2xl"
            p={{ base: 4, md: 5 }}
            mb={4}
            style={{ backdropFilter: "saturate(150%) blur(10px)" }}
            boxShadow={useColorModeValue("0 10px 26px rgba(31,38,135,0.10)", "0 10px 26px rgba(0,0,0,0.35)")}
          >
            <HStack justify="space-between" align="start" wrap="wrap" gap={3}>
              <VStack align="start" spacing={1} maxW="3xl">
                <HStack spacing={2} align="center">
                  <Box w="10px" h="10px" borderRadius="full" bg={ferreYellow} />
                  <Text fontSize="xs" color={subtle} fontWeight="semibold" letterSpacing="0.02em">
                    FerreExpress • Admin
                  </Text>

                  <Badge
                    borderRadius="999px"
                    px={2}
                    py={0.5}
                    colorScheme={metrics.needsAttention ? "red" : "green"}
                    variant="subtle"
                  >
                    {metrics.needsAttention ? "Requiere atención" : "Operación estable"}
                  </Badge>
                </HStack>

                <Heading size={{ base: "md", md: "lg" }} color={titleCo} lineHeight="1.15">
                  Panel de Administración
                </Heading>

                <HStack color={subtle} fontSize="sm" spacing={2} align="center" flexWrap="wrap">
                  <Text>
                    Hola{user?.username ? `, ${user.username}` : ""}. Controla productos, pedidos, soporte y cotizaciones.
                  </Text>
                  <Tooltip label="Resumen operativo: usa atajos y tarjetas para ir al módulo">
                    <Box as="span" display="inline-flex" alignItems="center">
                      <Icon as={FiInfo} aria-label="Info del dashboard" />
                    </Box>
                  </Tooltip>
                </HStack>

                {lastUpdated && (
                  <Text fontSize="xs" color={subtle} aria-live="polite">
                    Última actualización: {updatedLabel}
                  </Text>
                )}
              </VStack>

              <HStack spacing={2} align="center">
                <Tooltip hasArrow label="Actualizar datos">
                  <Button
                    leftIcon={<FiRefreshCw />}
                    variant="outline"
                    onClick={() => loadDashboard(true)}
                    isLoading={loading}
                    borderRadius="999px"
                  >
                    Actualizar
                  </Button>
                </Tooltip>

                <Tag borderRadius="999px" bg={useColorModeValue("yellow.50", "whiteAlpha.100")} border="1px solid" borderColor={borderCo}>
                  <TagLeftIcon as={FiShield} color={useColorModeValue("yellow.700", "yellow.300")} />
                  <TagLabel fontWeight="semibold">Admin</TagLabel>
                </Tag>
              </HStack>
            </HStack>

            {/* Callout compacto estilo iOS */}
            <Box mt={4}>
              {error ? (
                <Callout
                  tone="danger"
                  title="No se pudo cargar el dashboard"
                  description={error}
                  actionLabel="Reintentar"
                  onAction={() => loadDashboard(true)}
                />
              ) : (
                <Callout
                  tone={metrics.needsAttention ? "warning" : "ok"}
                  title={metrics.needsAttention ? "Requiere atención" : "Operación estable"}
                  description={
                    metrics.needsAttention
                      ? "Prioriza pedidos pendientes, casos críticos o cotizaciones sin decisión."
                      : "Indicadores en rangos normales. Revisa periódicamente."
                  }
                  actionLabel={metrics.needsAttention ? "Ir a pedidos" : "Ver pedidos"}
                  onAction={() => navigate("/admin/pedidos")}
                />
              )}
            </Box>
          </MotionBox>

          {/* ✅ Layout de contenido: 1 columna en móvil/tablet, 2 columnas en desktop XL */}
          <Grid templateColumns={{ base: "1fr", xl: "1fr 420px" }} gap={4} alignItems="start">
            {/* Columna izquierda */}
            <GridItem>
              <SectionCard
                title="Acciones rápidas"
                subtitle="Atajos para entrar al módulo correcto sin buscar en el menú."
              >
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
                  <QuickAction
                    label="Productos"
                    description="CRUD y catálogo"
                    icon={FiBox}
                    onClick={() => navigate("/admin/productos")}
                  />
                  <QuickAction
                    label="Pedidos"
                    description="Estados y detalle"
                    icon={FiShoppingCart}
                    onClick={() => navigate("/admin/pedidos")}
                  />
                  <QuickAction
                    label="Casos"
                    description="Soporte y SLA"
                    icon={FiLifeBuoy}
                    onClick={() => navigate("/admin/casos")}
                  />
                  <QuickAction
                    label="Cotizaciones"
                    description="Aprobar / anular"
                    icon={FiFileText}
                    onClick={() => navigate("/admin/cotizaciones")}
                  />
                </SimpleGrid>
              </SectionCard>

              <SectionCard
                title="Resumen rápido"
                subtitle="Indicadores clave. Haz clic en cada tarjeta para ir al módulo."
              >
                {loading ? (
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                    <Skeleton h="104px" borderRadius="2xl" />
                    <Skeleton h="104px" borderRadius="2xl" />
                    <Skeleton h="104px" borderRadius="2xl" />
                    <Skeleton h="104px" borderRadius="2xl" />
                  </SimpleGrid>
                ) : (
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                    <StatCard
                      label="Productos"
                      value={prodTotal}
                      colorScheme="purple"
                      hint="Total de referencias"
                      icon={FiBox}
                      onClick={() => navigate("/admin/productos")}
                    />
                    <StatCard
                      label="Pedidos"
                      value={pedidosTotal}
                      colorScheme="green"
                      hint={`${pedidosPendientes} pendientes • ${pedidosCompletados} entregados`}
                      icon={FiShoppingCart}
                      onClick={() => navigate("/admin/pedidos")}
                    />
                    <StatCard
                      label="Casos de soporte"
                      value={casosAbiertos}
                      colorScheme="orange"
                      hint={`${casosCriticos} alta/crit`}
                      icon={FiLifeBuoy}
                      onClick={() => navigate("/admin/casos")}
                    />
                    <StatCard
                      label="Cotizaciones"
                      value={cotTotal}
                      colorScheme="blue"
                      hint={`${cotPendientes} sin decisión`}
                      icon={FiFileText}
                      onClick={() => navigate("/admin/cotizaciones")}
                    />
                  </SimpleGrid>
                )}
              </SectionCard>
            </GridItem>

            {/* Columna derecha (desktop): Salud + Tips */}
            <GridItem>
              <SectionCard
                title="Salud operativa"
                subtitle="Dónde está la carga de trabajo hoy. Útil para priorizar."
                right={
                  <Badge
                    colorScheme={metrics.needsAttention ? "red" : "green"}
                    variant="subtle"
                    borderRadius="999px"
                    px={3}
                    py={1}
                  >
                    {metrics.needsAttention ? "Requiere atención" : "Estable"}
                  </Badge>
                }
              >
                {loading ? (
                  <VStack align="stretch" spacing={3}>
                    <Skeleton h="34px" borderRadius="lg" />
                    <Skeleton h="34px" borderRadius="lg" />
                    <Skeleton h="34px" borderRadius="lg" />
                  </VStack>
                ) : (
                  <VStack align="stretch" spacing={4}>
                    <StatusRow
                      label="Pedidos pendientes por despachar"
                      current={pedidosPendientes}
                      total={pedidosTotal}
                      colorScheme="yellow"
                    />
                    <StatusRow
                      label="Casos abiertos con prioridad alta"
                      current={casosCriticos}
                      total={casosAbiertos}
                      colorScheme="red"
                    />
                    <StatusRow
                      label="Cotizaciones aún sin decisión"
                      current={cotPendientes}
                      total={cotTotal}
                      colorScheme="blue"
                    />

                    <Divider />

                    <HStack justify="space-between" flexWrap="wrap" gap={2}>
                      <Text fontSize="sm" color={subtle}>
                        Cancelados: <b>{pedidosCancelados}</b> • Entregados: <b>{pedidosCompletados}</b>
                      </Text>
                      <Button
                        size="sm"
                        borderRadius="999px"
                        rightIcon={<FiArrowRight />}
                        bg={ferreYellow}
                        _hover={{ filter: "brightness(0.98)" }}
                        onClick={() => navigate("/admin/pedidos")}
                      >
                        Ver pedidos
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </SectionCard>

              <SectionCard
                title="Recomendaciones"
                subtitle="Atajos mentales para operar más rápido."
              >
                <Stack spacing={3}>
                  <TipCard
                    title="Prioriza lo crítico"
                    description="Si suben pedidos pendientes o casos críticos, entra primero ahí para evitar atrasos."
                  />
                  <TipCard
                    title="Busca antes de editar"
                    description="En Productos/Pedidos usa filtros y buscador para ubicar rápido por nombre/estado."
                  />
                  <TipCard
                    title="Confirma con feedback"
                    description="Revisa los toasts al guardar; si falla, corrige sin perder la vista."
                  />
                </Stack>
              </SectionCard>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

/* ================= Subcomponentes ================= */

function SectionCard({ title, subtitle, right, children }) {
  const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(23,25,35,0.74)");
  const borderCo = useColorModeValue("rgba(226,232,240,0.9)", "rgba(45,55,72,0.75)");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const prefersReducedMotion = usePrefersReducedMotion();

  const animatedProps = useMemo(() => {
    if (prefersReducedMotion) return {};
    return {
      transition: { duration: 0.18 },
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
    };
  }, [prefersReducedMotion]);

  return (
    <MotionBox
      {...animatedProps}
      bg={cardBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius="2xl"
      p={{ base: 3, md: 4 }}
      mb={4}
      style={{ backdropFilter: "saturate(150%) blur(10px)" }}
      boxShadow={useColorModeValue("0 8px 22px rgba(31,38,135,0.10)", "0 8px 22px rgba(0,0,0,0.35)")}
    >
      <HStack justify="space-between" align="start" mb={subtitle ? 2 : 3} wrap="wrap" gap={3}>
        <VStack align="start" spacing={0}>
          <Heading size="sm">{title}</Heading>
          {subtitle ? (
            <Text fontSize="sm" color={subtle}>
              {subtitle}
            </Text>
          ) : null}
        </VStack>
        {right}
      </HStack>

      <Divider mb={3} opacity={0.7} />
      {children}
    </MotionBox>
  );
}

function Callout({ tone = "ok", title, description, actionLabel, onAction }) {
  const isWarn = tone === "warning";
  const isDanger = tone === "danger";

  const bg = useColorModeValue(
    isDanger ? "red.50" : isWarn ? "orange.50" : "green.50",
    isDanger ? "whiteAlpha.100" : isWarn ? "whiteAlpha.100" : "whiteAlpha.100"
  );

  const border = useColorModeValue(
    isDanger ? "red.200" : isWarn ? "orange.200" : "green.200",
    "whiteAlpha.200"
  );

  const icon = isDanger ? FiAlertTriangle : isWarn ? FiAlertTriangle : FiCheckCircle;
  const iconCo = useColorModeValue(
    isDanger ? "red.600" : isWarn ? "orange.600" : "green.600",
    isDanger ? "red.300" : isWarn ? "orange.300" : "green.300"
  );

  const subtle = useColorModeValue("gray.700", "gray.200");

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      px={4}
      py={3}
    >
      <HStack align="start" justify="space-between" gap={3} flexWrap="wrap">
        <HStack align="start" spacing={3} flex="1" minW="260px">
          <Box mt="2px">
            <Icon as={icon} color={iconCo} boxSize={5} />
          </Box>
          <VStack align="start" spacing={0.5}>
            <Text fontWeight="semibold" fontSize="sm">
              {title}
            </Text>
            <Text fontSize="sm" color={subtle}>
              {description}
            </Text>
          </VStack>
        </HStack>

        {actionLabel ? (
          <Button
            size="sm"
            borderRadius="999px"
            variant="outline"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </HStack>
    </Box>
  );
}

function QuickAction({ label, description, icon, onClick }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const subtle = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      p={4}
      borderRadius="2xl"
      border="1px solid"
      borderColor={borderColor}
      bg={bg}
      cursor="pointer"
      _hover={{ boxShadow: useColorModeValue("0 10px 18px rgba(31,38,135,0.10)", "0 10px 18px rgba(0,0,0,0.40)") }}
      _focusVisible={{
        outline: "3px solid",
        outlineColor: useColorModeValue("yellow.300", "yellow.500"),
        outlineOffset: "2px",
      }}
      transition="box-shadow 0.15s ease"
    >
      <HStack align="start" spacing={3}>
        <Box
          borderRadius="xl"
          bg={useColorModeValue("yellow.50", "whiteAlpha.100")}
          border="1px solid"
          borderColor={useColorModeValue("yellow.100", "whiteAlpha.200")}
          p={2}
          mt={0.5}
        >
          <Icon as={icon} boxSize={5} color={useColorModeValue("yellow.700", "yellow.300")} />
        </Box>

        <VStack align="start" spacing={0} flex="1">
          <Text fontWeight="semibold" fontSize="sm">
            {label}
          </Text>
          <Text fontSize="xs" color={subtle}>
            {description}
          </Text>
        </VStack>

        <Icon as={FiArrowRight} mt={1} color={useColorModeValue("gray.400", "whiteAlpha.500")} />
      </HStack>
    </Box>
  );
}

function StatCard({ label, value, colorScheme = "blue", hint, icon: IconCmp = FiTrendingUp, onClick }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const prefersReducedMotion = usePrefersReducedMotion();
  const clickable = typeof onClick === "function";

  return (
    <MotionBox
      transition={prefersReducedMotion ? undefined : { duration: 0.18 }}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      p={4}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      bg={bg}
      boxShadow={useColorModeValue("0 6px 16px rgba(31,38,135,0.08)", "0 6px 16px rgba(0,0,0,0.30)")}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      cursor={clickable ? "pointer" : "default"}
      _hover={clickable ? { boxShadow: useColorModeValue("0 12px 22px rgba(31,38,135,0.12)", "0 12px 22px rgba(0,0,0,0.45)") } : undefined}
      _focusVisible={
        clickable
          ? { outline: "3px solid", outlineColor: useColorModeValue("yellow.300", "yellow.500"), outlineOffset: "2px" }
          : undefined
      }
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <HStack justify="space-between" align="flex-start" spacing={3}>
        <VStack align="start" spacing={0}>
          <Text fontSize="sm" color={subtle}>
            {label}
          </Text>
          <Heading size="md" mt={1}>
            {value}
          </Heading>
          {hint ? (
            <Badge mt={2} colorScheme={colorScheme} variant="subtle" borderRadius="999px" px={3} py={1}>
              {hint}
            </Badge>
          ) : null}
        </VStack>
        <Box as={IconCmp} boxSize={6} color={`${colorScheme}.400`} aria-hidden="true" />
      </HStack>
    </MotionBox>
  );
}

function StatusRow({ label, current, total, colorScheme = "yellow" }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <VStack align="stretch" spacing={1}>
      <HStack justify="space-between" align="baseline" flexWrap="wrap" gap={2}>
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="xs" color={subtle}>
          {total === 0 ? "Sin datos aún" : `${current} de ${total} (${pct}%)`}
        </Text>
      </HStack>
      <Progress size="sm" value={total === 0 ? 0 : pct} colorScheme={colorScheme} borderRadius="full" />
    </VStack>
  );
}

function TipCard({ title, description }) {
  const subtle = useColorModeValue("gray.700", "gray.200");
  return (
    <Box
      p={4}
      borderRadius="2xl"
      border="1px dashed"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      bg={useColorModeValue("whiteAlpha.700", "whiteAlpha.50")}
    >
      <HStack align="flex-start" spacing={3}>
        <Box
          borderRadius="xl"
          bg={useColorModeValue("yellow.50", "whiteAlpha.100")}
          border="1px solid"
          borderColor={useColorModeValue("yellow.100", "whiteAlpha.200")}
          p={2}
          mt={0.5}
        >
          <Icon as={FiInfo} boxSize={5} color={useColorModeValue("yellow.700", "yellow.300")} />
        </Box>

        <VStack align="start" spacing={1}>
          <Text fontWeight="semibold" fontSize="sm">
            {title}
          </Text>
          <Text fontSize="xs" color={subtle}>
            {description}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
