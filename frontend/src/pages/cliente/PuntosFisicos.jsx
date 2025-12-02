import { useMemo } from "react";
import {
  Box, Heading, Text, Button, HStack, VStack, Badge, useColorModeValue, useToast,
  Divider, Kbd, Tooltip, AspectRatio, usePrefersReducedMotion, Image,
} from "@chakra-ui/react";
import { keyframes } from "@chakra-ui/system";
import { motion } from "framer-motion";
import { FiMap, FiNavigation, FiExternalLink, FiCopy, FiShare2, FiMapPin } from "react-icons/fi";

const ADDRESS_TEXT = "Calle 16 #76-28, Prados del Limonar, Cali, Valle del Cauca, Colombia";

export default function PuntosFisicos() {
  const toast = useToast();
  const prefersReduced = usePrefersReducedMotion();
  const pageBg = useColorModeValue("#f6f7f9", "#0f1117");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const fgMuted = useColorModeValue("gray.600", "gray.300");

  const q = encodeURIComponent(ADDRESS_TEXT);
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const mapsDirUrl   = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const wazeUrl      = `https://waze.com/ul?q=${q}`;
  const iframeSrc    = `https://www.google.com/maps?q=${q}&t=m&z=16&output=embed&hl=es`;

  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "HardwareStore",
    name: "FerreExpress",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Calle 16 #76-28, Prados del Limonar",
      addressLocality: "Cali",
      addressRegion: "Valle del Cauca",
      addressCountry: "CO",
    },
    description: "Punto físico de FerreExpress para retiro de pedidos y atención al cliente.",
  }), []);

  const pulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(56,178,172,0); }
    35% { box-shadow: 0 0 0 10px rgba(56,178,172,.25); }
    100% { box-shadow: 0 0 0 0 rgba(56,178,172,0); }
  `;
  const MotionBox = motion(Box);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS_TEXT);
      toast({ title: "Dirección copiada", description: ADDRESS_TEXT, status: "success", duration: 1800, isClosable: true });
    } catch {
      toast({ title: "No se pudo copiar", description: "Intenta de nuevo.", status: "error", duration: 1800, isClosable: true });
    }
  };

  const onShare = async () => {
    const shareData = { title: "FerreExpress – Punto físico", text: "Punto físico FerreExpress", url: mapsSearchUrl };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(mapsSearchUrl);
        toast({ title: "Enlace copiado", description: "Pégalo donde quieras compartir.", status: "info", duration: 2000, isClosable: true });
      }
    } catch {}
  };

  const heroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(59,130,246,0.08))",
    "linear-gradient(135deg, rgba(13,148,136,0.12), rgba(59,130,246,0.12))"
  );

  return (
    <Box bg={pageBg} px={{ base: 3, md: 6, lg: 10 }} py={{ base: 4, md: 6 }}>
      {/* Hero */}
      <MotionBox
        bg={heroBg}
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.32, ease: [0.2, 0, 0, 1] }}
      >
        <VStack align="start" spacing={3}>
          <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>Puntos físicos</Badge>
          <Heading size={{ base: "lg", md: "xl" }}>Nuestro punto físico en Cali</Heading>
          <Text color={fgMuted}>Visítanos para asesoría, retiro de pedidos y atención al cliente.</Text>
          <HStack spacing={2} flexWrap="wrap">
            <Button leftIcon={<FiMapPin />} colorScheme="teal" onClick={() => window.open(mapsSearchUrl, "_blank", "noopener")}>
              Abrir en Google Maps
            </Button>
            <Button leftIcon={<FiNavigation />} variant="outline" onClick={() => window.open(mapsDirUrl, "_blank", "noopener")}>
              Cómo llegar
            </Button>
            <Tooltip label="Abrir en Waze">
              <Button leftIcon={<FiExternalLink />} variant="ghost" onClick={() => window.open(wazeUrl, "_blank", "noopener")}>
                Waze
              </Button>
            </Tooltip>
            <Tooltip label="Copiar dirección">
              <Button leftIcon={<FiCopy />} variant="ghost" onClick={onCopy}>Copiar</Button>
            </Tooltip>
            <Tooltip label="Compartir">
              <Button leftIcon={<FiShare2 />} variant="ghost" onClick={onShare}>Compartir</Button>
            </Tooltip>
          </HStack>
        </VStack>
      </MotionBox>

      {/* Tarjeta con dirección y mapa */}
      <Box mt={5} bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" boxShadow="sm">
        <HStack align={{ base: "stretch", md: "start" }} spacing={0} flexDir={{ base: "column", md: "row" }}>
          {/* Columna info */}
          <Box flex={{ md: "0 0 380px" }} p={{ base: 4, md: 5 }}>
            <VStack align="start" spacing={3}>
              <Box
                w="full" role="group" position="relative" overflow="hidden"
                border="0" borderTopRadius="xl" _hover={{ boxShadow: "md" }}
                mt={{ base: -3, md: -4 }} mx={0} mb={3} cursor="pointer"
                onClick={() => window.open(mapsSearchUrl, "_blank", "noopener")}
                aria-label="Abrir ubicación en Google Maps"
              >
                <AspectRatio ratio={{ base: 16 / 9, md: 21 / 9 }}>
                  <Image
                    src="/LogoPequeño.jpg"  // asegúrate que exista en /public o ajusta la ruta
                    alt="Punto físico de FerreExpress en Cali"
                    objectFit="cover" objectPosition="center 40%" loading="lazy" display="block"
                  />
                </AspectRatio>
                <Box position="absolute" inset={0} bgGradient="linear(to-t, blackAlpha.400 5%, transparent 60%)" pointerEvents="none" />
                <HStack position="absolute" bottom={2} left={2} spacing={2}>
                  <Badge colorScheme="teal" borderRadius="full">PRADOS DEL LIMONAR</Badge>
                  <Button size="xs" variant="solid" colorScheme="teal" leftIcon={<FiMap />}
                    onClick={(e) => { e.stopPropagation(); window.open(mapsSearchUrl, "_blank", "noopener"); }}>
                    Ver mapa
                  </Button>
                </HStack>
              </Box>

              <Heading size="md">FerreExpress — Punto físico</Heading>
              <Text fontWeight="medium">Dirección:</Text>
              <Box border="1px dashed" borderColor={border} borderRadius="md" p={3} animation={`${pulse} 1.2s ease-out 1`}>
                <Text>{ADDRESS_TEXT}</Text>
              </Box>

              <VStack align="start" spacing={1} fontSize="sm" color={fgMuted}>
                <HStack><Kbd>Ctrl</Kbd><Text>+</Text><Kbd>C</Kbd><Text>para copiar la dirección</Text></HStack>
                <Text>Único punto físico actualmente.</Text>
              </VStack>

              <HStack pt={2} spacing={2} wrap="wrap">
                <Button leftIcon={<FiMap />} onClick={() => window.open(mapsSearchUrl, "_blank", "noopener")} size="sm">Ver mapa</Button>
                <Button leftIcon={<FiNavigation />} onClick={() => window.open(mapsDirUrl, "_blank", "noopener")} size="sm" variant="outline">Rutas (Google)</Button>
                <Button leftIcon={<FiExternalLink />} onClick={() => window.open(wazeUrl, "_blank", "noopener")} size="sm" variant="ghost">Waze</Button>
              </HStack>
              <Divider />
              <Text fontSize="sm" color={fgMuted}>Sugerencia: al tocar “Cómo llegar”, Google Maps calculará la ruta desde tu ubicación.</Text>
            </VStack>
          </Box>

          {/* Columna mapa */}
          <Box flex="1" borderTop={{ base: "1px solid", md: "0" }} borderTopColor={border}>
            <AspectRatio ratio={16 / 9} w="100%">
              <Box as="iframe" title="Ubicación FerreExpress en Google Maps" src={iframeSrc} loading="lazy" border={0} aria-label="Mapa del punto físico" />
            </AspectRatio>
          </Box>
        </HStack>
      </Box>

      {/* JSON-LD SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Box>
  );
}