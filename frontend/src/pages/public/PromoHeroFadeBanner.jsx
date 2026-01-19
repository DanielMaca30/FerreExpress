// src/pages/public/PromoHeroFadeBanner.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Image,
  HStack,
  Button,
  AspectRatio,
  useColorModeValue,
  usePrefersReducedMotion,
  useBreakpointValue,
} from "@chakra-ui/react";

const ferreYellow = "#F9BF20";

export default function PromoHeroFadeBanner({
  images = [],
  intervalMs = 4000,
  rounded = "2xl",
  ratio = { base: 16 / 7, md: 16 / 7, lg: 4 / 1 },
  height,
  showDots = true,
  fit = { base: "contain", md: "contain", lg: "contain" },
  objectPosition = "center",
  mb = 6,
  blurBg = true,
  blurPx = 18,
  blurOpacity = 0.35,
}) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );

  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const dotBg = useColorModeValue("blackAlpha.600", "whiteAlpha.600");
  const dotActive = useColorModeValue("blackAlpha.900", "whiteAlpha.900");
  const frameBg = useColorModeValue("gray.100", "gray.900");

  // ratio final según breakpoint (solo si NO hay height)
  const computedRatio = useBreakpointValue(
    typeof ratio === "number" ? { base: ratio } : ratio
  );

  useEffect(() => {
    if (!safeImages.length || safeImages.length === 1 || prefersReducedMotion) return;
    const id = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % safeImages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [safeImages.length, intervalMs, prefersReducedMotion]);

  // Swipe
  const touchStart = useRef(null);
  const onTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStart.current == null || safeImages.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) {
      setIdx((i) =>
        dx > 0
          ? (i - 1 + safeImages.length) % safeImages.length
          : (i + 1) % safeImages.length
      );
    }
    touchStart.current = null;
  };

  if (!safeImages.length) return null;

  const Slides = (
    <Box position="relative" w="100%" h="100%" bg={frameBg}>
      {safeImages.map((src, i) => (
        <Box
          key={src + i}
          position="absolute"
          inset={0}
          opacity={i === idx ? 1 : 0}
          transition="opacity 700ms ease"
          willChange="opacity"
        >
          {/* Fondo blur (siempre cover) para que "contain" se vea premium */}
          {blurBg && (
            <Image
              src={src}
              alt=""
              position="absolute"
              inset={0}
              w="100%"
              h="100%"
              objectFit="cover"
              filter={`blur(${blurPx}px)`}
              transform="scale(1.08)"
              opacity={blurOpacity}
              pointerEvents="none"
              draggable={false}
              loading="lazy"
            />
          )}

          {/* Imagen principal (sin recorte en responsive) */}
          <Image
            src={src}
            alt={`Banner ${i + 1}`}
            position="absolute"
            inset={0}
            w="100%"
            h="100%"
            objectFit={fit}
            objectPosition={objectPosition}
            draggable={false}
            loading={i === 0 ? "eager" : "lazy"}
          />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box
      position="relative"
      mb={mb}
      borderRadius={rounded}
      overflow="hidden"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ✅ Si hay height, se usa height (ideal para Cliente/Empresa). Si no, ratio. */}
      {height ? (
        <Box w="100%" h={height}>
          {Slides}
        </Box>
      ) : (
        <AspectRatio ratio={computedRatio ?? 16 / 7}>
          {Slides}
        </AspectRatio>
      )}

      {showDots && safeImages.length > 1 && (
        <HStack
          spacing={2}
          position="absolute"
          bottom={2}
          left="50%"
          transform="translateX(-50%)"
          bg={useColorModeValue("whiteAlpha.700", "blackAlpha.700")}
          px={2}
          py={0.5}
          borderRadius="full"
          backdropFilter="blur(6px)"
        >
          {safeImages.map((_, i) => (
            <Button
              key={i}
              size="xs"
              minW="7px"
              h="7px"
              p={0}
              borderRadius="full"
              aria-label={`Ir al banner ${i + 1}`}
              bg={i === idx ? dotActive : dotBg}
              _hover={{ bg: dotActive }}
              onClick={() => setIdx(i)}
            />
          ))}
        </HStack>
      )}
    </Box>
  );
}
