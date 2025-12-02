// src/pages/cliente/AyudaFAQ.jsx
// Ruta sugerida: /cliente/ayuda

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
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
} from "@chakra-ui/react";
import {
  FiSearch,
  FiHelpCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiRefreshCw,
} from "react-icons/fi";
import { motion } from "framer-motion";
import api from "../../utils/axiosInstance";

const MotionBox = motion(Box);

export default function AyudaFAQ() {
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const bgPage = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const accent = useColorModeValue("yellow.500", "yellow.300");

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedbackState, setFeedbackState] = useState({}); // { [id]: 'up' | 'down' }
  const [feedbackSendingId, setFeedbackSendingId] = useState(null);

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

  return (
    <Box bg={bgPage} minH="100vh" pb={10}>
      {/* HEADER */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg={useColorModeValue(
          "rgba(255,255,255,0.92)",
          "rgba(26,32,44,0.92)"
        )}
        backdropFilter="blur(12px)"
        borderBottom="1px solid"
        borderColor={borderColor}
        py={3}
        px={{ base: 3, md: 6, lg: 10 }}
      >
        <HStack justify="space-between" align="center" spacing={3} wrap="wrap">
          <HStack spacing={3}>
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
              <Heading size={isMobile ? "md" : "lg"}>
                Centro de ayuda · Preguntas frecuentes
              </Heading>
              <Text fontSize="sm" color={muted}>
                Encuentra respuestas rápidas sobre pedidos, envíos, pagos y tu
                cuenta en FerreExpress.
              </Text>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Recargar FAQs" hasArrow>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FiRefreshCw />}
                onClick={loadFAQ}
              >
                Actualizar
              </Button>
            </Tooltip>
          </HStack>
        </HStack>
      </Box>

      {/* CONTENIDO */}
      <Box px={{ base: 3, md: 6, lg: 10 }} pt={4}>
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="show"
          maxW="960px"
          mx="auto"
        >
          {/* BUSCADOR + CONTEXTO */}
          <MotionBox
            variants={itemVariants}
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="sm"
            p={4}
            mb={4}
          >
            <Stack spacing={3}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch />
                </InputLeftElement>
                <Input
                  placeholder="Buscar por palabra clave (ej. entrega, pago, pedido)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar en preguntas frecuentes"
                  size="sm"
                />
              </InputGroup>
              <Text fontSize="xs" color={muted}>
                Tip: escribe una palabra clave, por ejemplo{" "}
                <Tag size="sm" variant="subtle" colorScheme="yellow">
                  <TagLabel>envío</TagLabel>
                </Tag>{" "}
                o{" "}
                <Tag size="sm" variant="subtle" colorScheme="yellow">
                  <TagLabel>devolución</TagLabel>
                </Tag>{" "}
                para filtrar las preguntas.
              </Text>
            </Stack>
          </MotionBox>

          {/* LISTADO DE FAQ */}
          <MotionBox
            variants={itemVariants}
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="sm"
            p={{ base: 3, md: 4 }}
          >
            <HStack justify="space-between" align="center" mb={3} flexWrap="wrap">
              <Heading size="sm">Preguntas frecuentes</Heading>
              <HStack spacing={2}>
                <Badge colorScheme="yellow" variant="subtle">
                  {filteredFaqs.length} resultado
                  {filteredFaqs.length === 1 ? "" : "s"}
                </Badge>
                {search && (
                  <Text fontSize="xs" color={muted}>
                    Filtrando por: “{search}”
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
                  Intenta con otras palabras o revisa que tu conexión esté
                  activa.
                </Text>
              </VStack>
            ) : (
              <Accordion allowMultiple defaultIndex={[0]}>
                {filteredFaqs.map((faq) => {
                  const voted = feedbackState[faq.id];
                  const isSending = feedbackSendingId === faq.id;

                  return (
                    <AccordionItem key={faq.id} border="none" mb={2}>
                      <MotionBox
                        variants={itemVariants}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={borderColor}
                        bg={useColorModeValue("gray.50", "gray.750")}
                        _hover={{
                          borderColor: useColorModeValue(
                            "yellow.300",
                            "yellow.500"
                          ),
                        }}
                        transition="border-color 0.15s ease"
                      >
                        <h2>
                          <AccordionButton px={3} py={2}>
                            <HStack flex="1" textAlign="left" spacing={2}>
                              <Badge
                                colorScheme={
                                  faq.rol_destino === "CLIENTE"
                                    ? "blue"
                                    : faq.rol_destino === "CONTRATISTA"
                                    ? "purple"
                                    : "gray"
                                }
                                variant="subtle"
                              >
                                {faq.rol_destino || "GENERAL"}
                              </Badge>
                              <Text fontWeight="semibold" fontSize="sm">
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
                              ¿Esta respuesta te fue útil?
                            </Text>
                            <HStack spacing={1}>
                              <Tooltip label="Sí, me ayudó" hasArrow>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={<FiThumbsUp />}
                                  colorScheme={
                                    voted === "up" ? "green" : "gray"
                                  }
                                  isLoading={isSending && voted !== "down"}
                                  onClick={() => handleFeedback(faq.id, true)}
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
                                  isLoading={isSending && voted !== "up"}
                                  onClick={() => handleFeedback(faq.id, false)}
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
            )}

            {!loading && (
              <Box mt={5} pt={3} borderTop="1px dashed" borderColor={borderColor}>
                <VStack align="start" spacing={1}>
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
                </VStack>
              </Box>
            )}
          </MotionBox>
        </MotionBox>
      </Box>
    </Box>
  );
}