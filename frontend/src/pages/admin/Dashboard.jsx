// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from "react";
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
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

// Framer helper
const MotionBox = motion(Box);

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  // estilos base (alineado con AdminProductos)
  const pageBg = useColorModeValue(
    "linear-gradient(135deg,#f7f7fb 0%,#eef3ff 100%)",
    "linear-gradient(135deg,#0b0f1a 0%,#121826 100%)"
  );
  const cardBg = useColorModeValue(
    "rgba(255,255,255,0.9)",
    "rgba(23,25,35,0.7)"
  );
  const borderCo = useColorModeValue(
    "rgba(226,232,240,0.8)",
    "rgba(45,55,72,0.7)"
  );
  const subtle = useColorModeValue("gray.600", "gray.300");

  const [loading, setLoading] = useState(false);
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

  const pageStyles = {
    bgGradient: pageBg,
    minH: "100%",
    pb: 4,
  };

  const animatedProps = prefersReducedMotion
    ? {}
    : {
        transition: { duration: 0.18 },
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      };

  // ====== Carga del resumen ======
  const loadDashboard = async (showToast = false) => {
    try {
      setLoading(true);

      const [prodRes, cotRes, casosRes, pedRes] = await Promise.all([
        // pedimos sólo 1 producto pero usamos el "total" que expone el backend
        api.get("/productos", { params: { page: 1, limit: 1 } }),
        api.get("/cotizaciones"),
        api.get("/casos"),
        api.get("/pedidos"),
      ]);

      // ---- Productos ----
      const prodData = prodRes.data;
      const prodArr = prodData?.productos || prodData || [];
      setProdTotal(Number(prodData?.total || prodArr.length));

      // ---- Cotizaciones ----
      const cotArr = cotRes.data || [];
      setCotTotal(cotArr.length);
      const cotPend = cotArr.filter((c) => {
        const estado = (c.estado || "").toUpperCase();
        return estado === "PENDIENTE" || estado === "EN_REVISION";
      }).length;
      setCotPendientes(cotPend);

      // ---- Casos/soporte ----
      const casosArr = casosRes.data || [];
      const abiertos = casosArr.filter(
        (c) =>
          (c.estado || "").toUpperCase() !== "CERRADO" &&
          (c.estado || "").toUpperCase() !== "RESUELTO"
      );
      setCasosAbiertos(abiertos.length);

      const criticos = abiertos.filter((c) => {
        const prioridad = (c.prioridad || "").toUpperCase();
        return prioridad === "ALTA" || prioridad === "CRITICA";
      }).length;
      setCasosCriticos(criticos);

      // ---- Pedidos ----
      const pedArr = pedRes.data || [];
      setPedidosTotal(pedArr.length);

      const pendientes = pedArr.filter((p) => {
        const estado = (p.estado || "").toUpperCase();
        return (
          estado === "PENDIENTE" ||
          estado === "CONFIRMADO" ||
          estado === "ENVIADO" ||
          estado === "PROCESANDO"
        );
      }).length;
      const completados = pedArr.filter(
        (p) => (p.estado || "").toUpperCase() === "ENTREGADO"
      ).length;
      const cancelados = pedArr.filter(
        (p) => (p.estado || "").toUpperCase() === "CANCELADO"
      ).length;

      setPedidosPendientes(pendientes);
      setPedidosCompletados(completados);
      setPedidosCancelados(cancelados);

      setLastUpdated(new Date());

      if (showToast) {
        toast({
          status: "success",
          title: "Datos del dashboard actualizados",
          duration: 1500,
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        status: "error",
        title: "Error al cargar el resumen",
        description: "Intenta de nuevo en unos segundos.",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ratios para barras (evitar divisiones por 0)
  const pedidosPendPct =
    pedidosTotal > 0 ? Math.round((pedidosPendientes / pedidosTotal) * 100) : 0;
  const casosCritPct =
    casosAbiertos > 0
      ? Math.round((casosCriticos / casosAbiertos) * 100)
      : 0;
  const cotPendPct =
    cotTotal > 0 ? Math.round((cotPendientes / cotTotal) * 100) : 0;

  return (
    <Box {...pageStyles}>
      {/* barra de estado superior */}
      <AnimatePresence>
        {loading && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Progress size="xs" isIndeterminate borderRadius="0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header del panel */}
      <MotionBox
        {...animatedProps}
        bg={cardBg}
        border="1px solid"
        borderColor={borderCo}
        borderRadius="2xl"
        p={4}
        mb={4}
        style={{ backdropFilter: "saturate(150%) blur(10px)" }}
        boxShadow={useColorModeValue(
          "0 10px 30px rgba(31,38,135,0.15)",
          "0 10px 30px rgba(0,0,0,0.35)"
        )}
      >
        <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
          <VStack align="start" spacing={1}>
            <Heading size="md">Panel de Administración</Heading>
            <HStack color={subtle} fontSize="sm" align="center" spacing={2}>
              <Text>
                Hola{user?.username ? `, ${user.username}` : ""}. Aquí ves de un
                vistazo cómo va la operación de FerreExpress.
              </Text>
              <Tooltip label="Este panel resume productos, pedidos, casos y cotizaciones del backend">
                <span>
                  <FiInfo />
                </span>
              </Tooltip>
            </HStack>
            {lastUpdated && (
              <Text fontSize="xs" color={subtle} aria-live="polite">
                Última actualización: {lastUpdated.toLocaleString("es-CO")}
              </Text>
            )}
          </VStack>

          <HStack>
            <Tooltip hasArrow label="Actualizar datos">
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={() => loadDashboard(true)}
                isLoading={loading}
              >
                Actualizar
              </Button>
            </Tooltip>
            <Tag colorScheme="purple" variant="subtle">
              <TagLeftIcon as={FiShield} />
              <TagLabel>Admin</TagLabel>
            </Tag>
          </HStack>
        </HStack>
      </MotionBox>

      {/* Tarjetas de resumen rápido */}
      <SectionCard
        title="Resumen rápido"
        subtitle="Indicadores clave del día a día. Puedes hacer clic en las tarjetas para ir al módulo correspondiente."
      >
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            <Skeleton h="96px" />
            <Skeleton h="96px" />
            <Skeleton h="96px" />
            <Skeleton h="96px" />
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            <StatCard
              label="Productos"
              value={prodTotal}
              color="purple"
              hint="Total de referencias activas/inactivas"
              icon={FiBox}
              onClick={() => navigate("/admin/productos")}
            />
            <StatCard
              label="Pedidos"
              value={pedidosTotal}
              color="green"
              hint={`${pedidosPendientes} pendientes, ${pedidosCompletados} entregados`}
              icon={FiShoppingCart}
              onClick={() => navigate("/admin/pedidos")}
            />
            <StatCard
              label="Casos de soporte"
              value={casosAbiertos}
              color="orange"
              hint={`${casosCriticos} con prioridad alta`}
              icon={FiLifeBuoy}
              onClick={() => navigate("/admin/casos")}
            />
            <StatCard
              label="Cotizaciones"
              value={cotTotal}
              color="blue"
              hint={`${cotPendientes} pendientes de aprobación`}
              icon={FiFileText}
              onClick={() => navigate("/admin/cotizaciones")}
            />
          </SimpleGrid>
        )}
      </SectionCard>

      {/* Salud operativa */}
      <SectionCard
        title="Salud operativa"
        subtitle="Visualiza rápidamente dónde está la carga de trabajo hoy. Ideal para priorizar qué atender primero."
        right={
          <Badge
            colorScheme={
              pedidosPendPct > 60 || casosCritPct > 50 ? "red" : "green"
            }
            variant="subtle"
          >
            {pedidosPendPct > 60 || casosCritPct > 50
              ? "Requiere atención"
              : "Operación estable"}
          </Badge>
        }
      >
        {loading ? (
          <VStack align="stretch" spacing={3}>
            <Skeleton h="32px" />
            <Skeleton h="32px" />
            <Skeleton h="32px" />
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
          </VStack>
        )}
      </SectionCard>

      {/* Sugerencias y buenas prácticas */}
      <SectionCard
        title="Recomendaciones rápidas"
        subtitle="Pequeñas pistas de uso para que la administración diaria sea más fluida."
      >
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          align="stretch"
        >
          <TipCard
            title="Prioriza desde el dashboard"
            description="Si ves que los pedidos pendientes o los casos críticos suben mucho, entra primero a esos módulos. Así reduces el riesgo de atrasos y reclamos."
          />
          <TipCard
            title="Busca antes de editar"
            description="En Productos y Pedidos, usa primero los buscadores y filtros. Están pensados para encontrar rápido por nombre, estado y rango de fechas/precios."
          />
          <TipCard
            title="Cambios con feedback claro"
            description="Siempre que guardes cambios, revisa el mensaje de confirmación (toast). Si algo falla, el mensaje te dirá qué revisar sin perder la vista actual."
          />
        </Stack>
      </SectionCard>
    </Box>
  );
}

/* ================= Subcomponentes UI ================= */
function SectionCard({ title, subtitle, right, children }) {
  const cardBg = useColorModeValue(
    "rgba(255,255,255,0.9)",
    "rgba(23,25,35,0.7)"
  );
  const borderCo = useColorModeValue(
    "rgba(226,232,240,0.8)",
    "rgba(45,55,72,0.7)"
  );
  const prefersReducedMotion = usePrefersReducedMotion();
  const animatedProps = prefersReducedMotion
    ? {}
    : {
        transition: { duration: 0.18 },
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <MotionBox
      {...animatedProps}
      bg={cardBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius="2xl"
      p={3}
      mb={4}
      style={{ backdropFilter: "saturate(150%) blur(10px)" }}
      boxShadow={useColorModeValue(
        "0 8px 24px rgba(31,38,135,0.12)",
        "0 8px 24px rgba(0,0,0,0.35)"
      )}
    >
      <HStack
        justify="space-between"
        align="start"
        mb={subtitle ? 1 : 3}
        wrap="wrap"
        gap={3}
      >
        <VStack align="start" spacing={0}>
          <Heading size="sm">{title}</Heading>
          {subtitle && (
            <Text
              fontSize="sm"
              color={useColorModeValue("gray.600", "gray.300")}
            >
              {subtitle}
            </Text>
          )}
        </VStack>
        {right}
      </HStack>
      <Divider mb={3} />
      {children}
    </MotionBox>
  );
}

function StatCard({
  label,
  value,
  color = "blue",
  hint,
  icon: IconCmp = FiTrendingUp,
  onClick,
}) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const hoverShadow = useColorModeValue(
    "0 10px 24px rgba(31,38,135,0.18)",
    "0 10px 24px rgba(0,0,0,0.55)"
  );
  const clickable = typeof onClick === "function";

  return (
    <MotionBox
      transition={{ duration: 0.18 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      p={4}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bg}
      boxShadow={useColorModeValue(
        "0 6px 18px rgba(31,38,135,0.10)",
        "0 6px 18px rgba(0,0,0,0.35)"
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      cursor={clickable ? "pointer" : "default"}
      _hover={
        clickable
          ? {
              transform: "translateY(-2px)",
              boxShadow: hoverShadow,
            }
          : undefined
      }
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
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
          {hint && (
            <Badge mt={2} colorScheme={color} variant="subtle">
              {hint}
            </Badge>
          )}
        </VStack>
        <Box
          as={IconCmp}
          boxSize={6}
          color={`${color}.400`}
          aria-hidden="true"
        />
      </HStack>
    </MotionBox>
  );
}

function StatusRow({ label, current, total, colorScheme = "yellow" }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <VStack align="stretch" spacing={1}>
      <HStack justify="space-between">
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="xs" color={subtle}>
          {total === 0
            ? "Sin datos aún"
            : `${current} de ${total} (${pct}%)`}
        </Text>
      </HStack>
      <Progress
        size="sm"
        value={total === 0 ? 0 : pct}
        colorScheme={colorScheme}
        borderRadius="full"
      />
    </VStack>
  );
}

function TipCard({ title, description }) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  return (
    <Box
      p={3}
      borderRadius="lg"
      border="1px dashed"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      bg={useColorModeValue("whiteAlpha.700", "whiteAlpha.50")}
    >
      <HStack align="flex-start" spacing={3}>
        <Box as={FiInfo} mt={1} color="yellow.500" />
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