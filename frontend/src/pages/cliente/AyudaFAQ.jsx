// src/pages/cliente/AyudaFAQ.jsx
// Ruta sugerida: /cliente/ayuda

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Icon,
  IconButton,
  Stack,
  HStack,
  VStack,
  Badge,
  Button,
  useToast,
  useColorModeValue,
  useBreakpointValue,
  Skeleton,
  SkeletonText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  TagLabel,
  Tooltip,
  Divider,
  Collapse,
  VisuallyHidden,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiHelpCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiRefreshCw,
  FiChevronRight,
  FiTruck,
  FiUser,
  FiX,
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

const MotionBox = motion(Box);

export default function AyudaFAQ() {
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accent = useColorModeValue("yellow.500", "yellow.300");

  const stackSpacing = useBreakpointValue({ base: 3, md: 4 });
  const searchSize = useBreakpointValue({ base: "sm", md: "md" });
  const stickyOffset = useBreakpointValue({ base: "64px", md: "72px" });

  const focusRing = {
    boxShadow: "0 0 0 3px rgba(249,191,32,0.7)",
  };

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedbackState, setFeedbackState] = useState({}); // { [id]: 'up' | 'down' }
  const [feedbackSendingId, setFeedbackSendingId] = useState(null);
  const [topicShortcut, setTopicShortcut] = useState("");

  // ✅ Siempre que entro a la pantalla, me llevo al inicio
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // no-op
      }
    }, 40);
    return () => clearTimeout(t);
  }, []);

  const loadFAQ = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/faq");
      setFaqs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error al cargar las preguntas frecuentes",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQ();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredFaqs = useMemo(() => {
    if (!normalizedSearch) return faqs;
    return faqs.filter((f) => {
      const q = (f.pregunta || "").toLowerCase();
      const a = (f.respuesta || "").toLowerCase();
      return q.includes(normalizedSearch) || a.includes(normalizedSearch);
    });
  }, [faqs, normalizedSearch]);

  const handleFeedback = async (id, util) => {
    if (feedbackState[id]) {
      toast({
        title: "Ya registraste tu opinión",
        description: "Solo puedes votar una vez por pregunta.",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    try {
      setFeedbackSendingId(id);
      await api.post(`/faq/${id}/feedback`, { util });
      setFeedbackState((prev) => ({
        ...prev,
        [id]: util ? "up" : "down",
      }));
      toast({
        title: "¡Gracias por tu feedback!",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "No se pudo registrar el feedback",
        description: e?.response?.data?.error || e.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFeedbackSendingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  const shortcuts = [
    { value: "pedido", label: "Pedidos" },
    { value: "envío", label: "Envíos" },
    { value: "pago", label: "Pagos" },
    { value: "factura", label: "Facturas" },
    { value: "cuenta", label: "Cuenta" },
  ];

  const handleShortcutClick = (value) => {
    setTopicShortcut(value);
    setSearch(value);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (topicShortcut) {
      setTopicShortcut("");
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setTopicShortcut("");
  };

  // Agrupación opcional por categoría si existe faq.categoria
  const hasCategories = useMemo(
    () => filteredFaqs.some((f) => f.categoria),
    [filteredFaqs]
  );

  const categories = useMemo(() => {
    if (!hasCategories) return [];
    const set = new Set(filteredFaqs.map((f) => f.categoria || "Otros"));
    return Array.from(set);
  }, [filteredFaqs, hasCategories]);

  // Solo uso Tabs si hay muchas FAQs y no hay búsqueda activa
  const useTabs = hasCategories && filteredFaqs.length > 10 && !normalizedSearch;

  const renderFaqAccordion = (list) => (
    <Accordion allowMultiple defaultIndex={[0]}>
      {list.map((faq) => {
        const voted = feedbackState[faq.id];
        const isSending = feedbackSendingId === faq.id;
        const alreadyVoted = Boolean(voted);

        let badgeIcon = FiHelpCircle;
        if (faq.rol_destino === "CLIENTE") badgeIcon = FiUser;
        else if (faq.rol_destino === "CONTRATISTA") badgeIcon = FiTruck;

        return (
          <AccordionItem key={faq.id} border="none" mb={2}>
            <MotionBox
              variants={itemVariants}
              borderRadius="xl"
              border="1px solid"
              borderColor={borderColor}
              bg={useColorModeValue("gray.50", "gray.750")}
              _hover={{
                borderColor: useColorModeValue("yellow.300", "yellow.500"),
                boxShadow: "sm",
              }}
              transition="border-color 0.15s ease, box-shadow 0.15s ease"
            >
              <h2>
                <AccordionButton px={3} py={2}>
                  <HStack
                    flex="1"
                    textAlign="left"
                    spacing={2}
                    align="center"
                  >
                    <Badge
                      colorScheme={
                        faq.rol_destino === "CLIENTE"
                          ? "blue"
                          : faq.rol_destino === "CONTRATISTA"
                          ? "purple"
                          : "gray"
                      }
                      variant="subtle"
                      display="inline-flex"
                      alignItems="center"
                    >
                      <Icon
                        as={badgeIcon}
                        boxSize={3}
                        mr={1}
                        aria-hidden="true"
                      />
                      {faq.rol_destino || "GENERAL"}
                    </Badge>
                    <Text fontWeight="semibold" fontSize="md" noOfLines={2}>
                      {faq.pregunta}
                    </Text>
                  </HStack>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pt={0} px={3} pb={3}>
                <Text
                  fontSize="sm"
                  color={muted}
                  whiteSpace="pre-line"
                  mb={2}
                >
                  {faq.respuesta}
                </Text>

                <HStack justify="space-between" align="center">
                  <Text fontSize="xs" color={muted}>
                    {alreadyVoted
                      ? "Gracias, registramos tu opinión."
                      : "¿Esta respuesta te fue útil?"}
                  </Text>
                  <HStack spacing={1}>
                    <Tooltip label="Sí, me ayudó" hasArrow>
                      <Button
                        size="xs"
                        variant="ghost"
                        leftIcon={<FiThumbsUp />}
                        colorScheme={voted === "up" ? "green" : "gray"}
                        isLoading={isSending && (!voted || voted === "up")}
                        isDisabled={alreadyVoted}
                        onClick={() => handleFeedback(faq.id, true)}
                        _focus={focusRing}
                      >
                        Sí
                      </Button>
                    </Tooltip>
                    <Tooltip label="No, no me ayudó" hasArrow>
                      <Button
                        size="xs"
                        variant="ghost"
                        leftIcon={<FiThumbsDown />}
                        colorScheme={voted === "down" ? "red" : "gray"}
                        isLoading={isSending && (!voted || voted === "down")}
                        isDisabled={alreadyVoted}
                        onClick={() => handleFeedback(faq.id, false)}
                        _focus={focusRing}
                      >
                        No
                      </Button>
                    </Tooltip>
                  </HStack>
                </HStack>
              </AccordionPanel>
            </MotionBox>
          </AccordionItem>
        );
      })}
    </Accordion>
  );

  return (
    <Box bg={bgPage} minH="100vh" py={{ base: 4, md: 6 }} pb={10}>
      <Box px={{ base: 3, md: 6, lg: 10 }}>
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="show"
          maxW="960px"
          mx="auto"
        >
          {/* =============== CABECERA + CONTEXTO + BUSCADOR =============== */}
          <MotionBox
            role="region"
            aria-labelledby="ayuda-faq-header"
            variants={itemVariants}
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="sm"
            p={{ base: 4, md: 5 }}
            mb={4}
          >
            <Stack spacing={stackSpacing}>
              {/* Breadcrumb suave: ¿Dónde estoy? */}
              <HStack spacing={1} fontSize="xs" color={muted}>
                <Text>Estás en</Text>
                <Tag size="sm" variant="subtle" colorScheme="gray">
                  <TagLabel>Mi cuenta</TagLabel>
                </Tag>
                <Icon
                  as={FiChevronRight}
                  boxSize={3}
                  opacity={0.7}
                  aria-hidden="true"
                />
                <Tag size="sm" variant="outline" colorScheme="gray">
                  <TagLabel>Centro de ayuda</TagLabel>
                </Tag>
              </HStack>

              {/* Título principal + botón de recarga */}
              <HStack
                justify="space-between"
                align="flex-start"
                spacing={4}
                flexWrap="wrap"
              >
                <HStack spacing={3} align="center">
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg={useColorModeValue("yellow.100", "yellow.900")}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiHelpCircle} boxSize={5} color={accent} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Heading id="ayuda-faq-header" size={isMobile ? "md" : "lg"}>
                      Centro de ayuda · Preguntas frecuentes
                    </Heading>
                    <Text fontSize="sm" color={muted}>
                      Encuentra respuestas rápidas sobre tus pedidos, envíos,
                      pagos y tu cuenta sin salir de FerreExpress.
                    </Text>
                  </VStack>
                </HStack>

                <Tooltip label="Recargar FAQs" hasArrow>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiRefreshCw />}
                    onClick={loadFAQ}
                    _focus={focusRing}
                  >
                    Actualizar
                  </Button>
                </Tooltip>
              </HStack>

              <Divider />

              {/* Buscador sticky con sombra al activarse */}
              <Box
                role="search"
                aria-label="Buscar en preguntas frecuentes"
                position="sticky"
                top={stickyOffset}
                zIndex="10"
                bg={cardBg}
                pt={2}
                pb={3}
                boxShadow={search ? "md" : "none"}
                transition="box-shadow 0.2s ease"
              >
                <Stack spacing={2}>
                  <InputGroup size={searchSize}>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} aria-hidden="true" />
                    </InputLeftElement>
                    <Input
                      placeholder="¿En qué podemos ayudarte hoy? (ej. entrega, pago, pedido)"
                      value={search}
                      onChange={handleSearchChange}
                      aria-label="Buscar en preguntas frecuentes"
                      focusBorderColor="yellow.400"
                      _focusVisible={focusRing}
                    />
                    {search && (
                      <InputRightElement>
                        <IconButton
                          aria-label="Limpiar búsqueda"
                          icon={<FiX />}
                          size="xs"
                          variant="ghost"
                          onClick={handleClearSearch}
                          _focus={focusRing}
                          transition="transform 0.2s"
                          _hover={{ transform: "rotate(90deg)" }}
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                  <Text fontSize="xs" color={muted}>
                    Escribe una palabra clave como{" "}
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      <TagLabel>envío</TagLabel>
                    </Tag>{" "}
                    o{" "}
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      <TagLabel>devolución</TagLabel>
                    </Tag>{" "}
                    y te mostraremos las respuestas relacionadas.
                  </Text>
                </Stack>
              </Box>

              {/* Atajos colapsables en mobile */}
              <Collapse in={!isMobile || (!search && isMobile)} animateOpacity>
                <HStack spacing={2} flexWrap="wrap" mt={2}>
                  {shortcuts.map((s) => (
                    <Box key={s.value}>
                      <Button
                        size="xs"
                        variant={topicShortcut === s.value ? "solid" : "ghost"}
                        colorScheme="gray"
                        onClick={() => handleShortcutClick(s.value)}
                        aria-describedby={`shortcut-desc-${s.value}`}
                        _focus={focusRing}
                      >
                        {s.label}
                      </Button>
                      <VisuallyHidden id={`shortcut-desc-${s.value}`}>
                        Filtrar preguntas relacionadas con {s.label}
                      </VisuallyHidden>
                    </Box>
                  ))}
                </HStack>
              </Collapse>
            </Stack>
          </MotionBox>

          {/* =============== LISTADO DE FAQ =============== */}
          <MotionBox
            role="region"
            aria-labelledby="ayuda-faq-list"
            variants={itemVariants}
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="sm"
            p={{ base: 3, md: 4 }}
          >
            <HStack
              justify="space-between"
              align="center"
              mb={3}
              flexWrap="wrap"
            >
              <Heading id="ayuda-faq-list" size="sm">
                Preguntas frecuentes
              </Heading>
              <HStack spacing={2}>
                <Badge colorScheme="yellow" variant="subtle">
                  {filteredFaqs.length} RESULTADO
                  {filteredFaqs.length === 1 ? "" : "S"}
                </Badge>
                {search && (
                  <Text fontSize="xs" color={muted}>
                    Buscando: “{search}”
                  </Text>
                )}
              </HStack>
            </HStack>

            <Divider mb={3} />

            {loading ? (
              <Stack spacing={3}>
                <Skeleton height="24px" />
                <SkeletonText noOfLines={3} />
                <Skeleton height="24px" />
                <SkeletonText noOfLines={3} />
              </Stack>
            ) : filteredFaqs.length === 0 ? (
              <VStack spacing={3} py={6}>
                <Icon as={FiHelpCircle} boxSize={6} color={muted} />
                <Text fontWeight="semibold" fontSize="sm">
                  No encontramos preguntas que coincidan con tu búsqueda.
                </Text>
                <Text fontSize="xs" color={muted} textAlign="center">
                  Prueba con otra palabra clave o abre un caso para que el
                  equipo te ayude de forma personalizada.
                </Text>
                <Button
                  size="sm"
                  colorScheme="yellow"
                  color="black"
                  leftIcon={<FiHelpCircle />}
                  onClick={() => navigate("/cliente/casos")}
                  _focus={focusRing}
                >
                  Abrir un caso de soporte
                </Button>
              </VStack>
            ) : useTabs ? (
              <Tabs variant="soft-rounded" colorScheme="gray" isLazy mt={1}>
                <TabList>
                  <Tab _focus={focusRing}>
                    Todas ({filteredFaqs.length})
                  </Tab>
                  {categories.map((cat) => {
                    const count = filteredFaqs.filter(
                      (f) => (f.categoria || "Otros") === cat
                    ).length;
                    return (
                      <Tab key={cat} _focus={focusRing}>
                        {cat} ({count})
                      </Tab>
                    );
                  })}
                </TabList>
                <TabPanels mt={3}>
                  <TabPanel px={0}>{renderFaqAccordion(filteredFaqs)}</TabPanel>
                  {categories.map((cat) => {
                    const list = filteredFaqs.filter(
                      (f) => (f.categoria || "Otros") === cat
                    );
                    return (
                      <TabPanel key={cat} px={0}>
                        {renderFaqAccordion(list)}
                      </TabPanel>
                    );
                  })}
                </TabPanels>
              </Tabs>
            ) : (
              renderFaqAccordion(filteredFaqs)
            )}

            {/* Bloque final de ayuda + atajos contextuales */}
            {!loading && filteredFaqs.length > 0 && (
              <Box
                mt={5}
                pt={3}
                borderTop="1px dashed"
                borderColor={borderColor}
              >
                <VStack align="start" spacing={2}>
                  <Text fontSize="xs" color={muted}>
                    ¿No encontraste lo que buscabas?
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    Puedes abrir un{" "}
                    <Tag
                      as="span"
                      size="sm"
                      variant="subtle"
                      colorScheme="yellow"
                    >
                      <TagLabel>caso de soporte</TagLabel>
                    </Tag>{" "}
                    desde tu perfil o la sección de soporte para recibir ayuda
                    personalizada.
                  </Text>

                  <HStack spacing={2} flexWrap="wrap" pt={1}>
                    <Text fontSize="xs" color={muted} mr={1}>
                      Continuar en:
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      leftIcon={<FiTruck />}
                      onClick={() => navigate("/cliente/pedidos")}
                      _focus={focusRing}
                    >
                      Mis pedidos
                    </Button>
                    <Button
                      size="xs"
                      variant="solid"
                      colorScheme="yellow"
                      color="black"
                      leftIcon={<FiHelpCircle />}
                      onClick={() => navigate("/cliente/casos")}
                      _focus={focusRing}
                    >
                      Abrir caso
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      leftIcon={<FiUser />}
                      onClick={() => navigate("/cliente/perfil")}
                      _focus={focusRing}
                    >
                      Ir a mi perfil
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}
          </MotionBox>
        </MotionBox>
      </Box>
    </Box>
  );
}
