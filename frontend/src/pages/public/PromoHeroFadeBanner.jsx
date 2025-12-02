// PromoHeroFadeBanner.jsx
import { useEffect, useRef, useState } from "react";
import { Box, Image, HStack, Button, useColorModeValue } from "@chakra-ui/react";

export default function PromoHeroFadeBanner({
  images = [],
  intervalMs = 4000,
  rounded = "2xl",
  // Altura del banner por breakpoint (ajústalo a tu gusto)
  height = { base: "120px", md: "160px", lg: "200px" },
}) {
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const dotBg = useColorModeValue("blackAlpha.600", "whiteAlpha.600");
  const dotActive = useColorModeValue("blackAlpha.900", "whiteAlpha.900");

  // Auto-advance
  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => {
      if (!paused.current) setIdx((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  // Swipe
  const touchStart = useRef(null);
  const onTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 40) {
      setIdx((i) =>
        dx > 0 ? (i - 1 + images.length) % images.length : (i + 1) % images.length
      );
    }
    touchStart.current = null;
  };

  return (
    <Box
      position="relative"
      mb={6}
      h={height}
      borderRadius={rounded}
      overflow="hidden"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Pista con imágenes apiladas en absoluto y crossfade */}
      <Box position="relative" w="100%" h="100%">
        {images.map((src, i) => (
          <Image
            key={src + i}
            src={src}
            alt={`Banner ${i + 1}`}
            objectFit="cover"
            position="absolute"
            inset={0}
            transition="opacity 700ms ease"
            opacity={i === idx ? 1 : 0}
            willChange="opacity"
          />
        ))}
      </Box>

      {/* Dots minimalistas */}
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
        {images.map((_, i) => (
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
    </Box>
  );
}