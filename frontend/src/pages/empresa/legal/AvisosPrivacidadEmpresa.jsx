// src/pages/AvisosPrivacidad.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  chakra,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  FiDatabase,
  FiFileText,
  FiBookOpen,
  FiPackage,
  FiClock,
  FiEye,
  FiLock,
  FiMonitor,
  FiUsers,
  FiRefreshCw,
  FiMail,
  FiSmartphone,
  FiMessageSquare,
  FiCheckCircle,
  FiUserCheck,
} from "react-icons/fi";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const sections = [
  {
    icon: FiDatabase,
    title: "Datos que recolectamos",
    items: [
      "Identificación y contacto: nombre completo, cédula/NIT, teléfono, correo electrónico y dirección.",
      "Información de cuenta: usuario, contraseña (cifrada con bcrypt), rol y tokens de autenticación.",
      "Datos transaccionales: cotizaciones, pedidos, direcciones de envío, facturación y devoluciones.",
      "Pagos: únicamente referencias y estado (no almacenamos datos de tarjetas).",
      "Soporte: casos abiertos, comunicaciones y archivos adjuntos.",
      "Datos técnicos: dirección IP, tipo de dispositivo y navegación básica (con fines de seguridad y mejora).",
    ],
  },
  {
    icon: FiFileText,
    title: "Finalidades del tratamiento",
    items: [
      "Gestionar el registro y acceso seguro a la plataforma.",
      "Procesar cotizaciones, pedidos, descuentos y garantías.",
      "Coordinar envíos, facturación electrónica y atención posventa.",
      "Atender solicitudes en el Centro de Ayuda.",
      "Prevenir fraude y mejorar continuamente nuestro servicio.",
      "Enviar notificaciones transaccionales y, con autorización expresa, comunicaciones comerciales.",
    ],
  },
  {
    icon: FiBookOpen,
    title: "Base legal del tratamiento",
    items: [
      "Autorización expresa del titular.",
      "Ejecución del contrato de compraventa y garantías.",
      "Cumplimiento de obligaciones legales y tributarias.",
      "Interés legítimo en la seguridad y mejora del servicio.",
    ],
  },
  {
    icon: FiPackage,
    title: "Cesión y encargados del tratamiento",
    items: [
      "Compartimos datos únicamente con aliados necesarios: logística, pagos, mensajería, hosting y analítica.",
      "Todos operan bajo contratos de confidencialidad y protección de datos.",
      "Pueden estar ubicados en Colombia o países con nivel adecuado de protección.",
    ],
  },
  {
    icon: FiClock,
    title: "Tiempo de conservación",
    items: [
      "Durante la relación comercial y los plazos legales obligatorios (facturación, garantías, impuestos).",
      "Posteriormente, los datos se bloquean o suprimen conforme a la normativa vigente.",
    ],
  },
  {
    icon: FiEye,
    title: "Derechos del titular (Ley de Habeas Data)",
    items: [
      "Conocer, actualizar y rectificar sus datos personales.",
      "Revocar la autorización o solicitar la supresión de los datos.",
      "Obtener prueba de la autorización otorgada.",
      "Presentar quejas ante la Superintendencia de Industria y Comercio.",
      "Ejercer estos derechos gratuitamente enviando solicitud a <strong>ferreexpressltda@hotmail.com</strong>",
    ],
  },
  {
    icon: FiLock,
    title: "Medidas de seguridad",
    items: [
      "Cifrado de contraseñas con algoritmo bcrypt.",
      "Tokens JWT con expiración corta y control de acceso por roles.",
      "Registros de actividad y monitoreo continuo.",
      "Medidas técnicas y organizativas actualizadas periódicamente.",
    ],
  },
  {
    icon: FiMonitor,
    title: "Cookies y tecnologías similares",
    items: [
      "Utilizamos cookies técnicas, de funcionalidad y analíticas.",
      "El usuario puede configurar o rechazar su uso en cualquier momento.",
      "Consulte nuestra Política de Cookies para mayor detalle.",
    ],
  },
  {
    icon: FiUsers,
    title: "Menores de edad",
    items: [
      "No recolectamos datos de menores de edad sin autorización expresa de padres o representantes legales.",
      "En caso de detectar información sin consentimiento, se procederá a su eliminación inmediata.",
    ],
  },
  {
    icon: FiRefreshCw,
    title: "Actualizaciones del aviso",
    items: [
      "Cualquier modificación será publicada con nueva fecha de vigencia.",
      "Cambios sustanciales serán comunicados por correo electrónico o banner destacado.",
    ],
  },
];

export default function AvisosPrivacidad() {
  // Siempre inicia arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    email: "",
    telefono: "",
    tipoSolicitud: "",
    mensaje: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Solicitud ARCO:", formData);

    toast({
      title: "Solicitud enviada con éxito",
      description: "Te responderemos en un plazo máximo de 15 días hábiles.",
      status: "success",
      duration: 8000,
      isClosable: true,
      position: "top",
    });

    onClose();
    setFormData({
      nombre: "",
      documento: "",
      email: "",
      telefono: "",
      tipoSolicitud: "",
      mensaje: "",
    });
  };

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  return (
    <>
      <Box minH="100vh" bg={bg} py={{ base: 12, md: 20 }}>
        <Container maxW="4xl">
          {/* Header elegante */}
          <MotionVStack
            spacing={8}
            textAlign="center"
            mb={16}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Heading
              as="h1"
              size={{ base: "2xl", md: "3xl" }}
              fontWeight="bold"
              color="gray.800"
              _dark={{ color: "white" }}
            >
              Aviso de Privacidad
            </Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600" maxW="2xl">
              Tratamiento de Datos Personales – Ley 1581 de 2012
            </Text>

            <VStack spacing={3} color={muted} fontSize="sm" fontWeight="medium">
              <Text>Última actualización: 06 de octubre de 2025</Text>
              <Text>Responsable: FerreExpress S.A.S. • NIT 805.030.111-8</Text>
              <HStack>
                <FiSmartphone />
                <Text>Calle 16 #76-28, Prados del Limonar, Cali, Colombia</Text>
              </HStack>
            </VStack>
          </MotionVStack>

          <Divider />

          {/* Secciones con animación al scroll */}
          <VStack spacing={12} align="stretch" mt={16}>
            {sections.map((section, index) => (
              <MotionBox
                key={section.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
              >
                <Box
                  bg={cardBg}
                  rounded="xl"
                  border="1px"
                  borderColor={borderColor}
                  overflow="hidden"
                  boxShadow="lg"
                  transition="all 0.3s"
                  _hover={{ boxShadow: "xl" }}
                >
                  <Box bg="gray.800" color="white" px={8} py={6}>
                    <HStack spacing={4}>
                      <section.icon size={28} />
                      <Heading as="h2" size="lg" fontWeight="semibold">
                        {section.title}
                      </Heading>
                    </HStack>
                  </Box>

                  <Box p={{ base: 7, md: 10 }}>
                    <List spacing={5}>
                      {section.items.map((item, i) => (
                        <ListItem
                          key={i}
                          display="flex"
                          alignItems="flex-start"
                          fontSize={{ base: "md", md: "lg" }}
                          color="gray.700"
                          _dark={{ color: "gray.200" }}
                          lineHeight="tall"
                        >
                          <ListIcon as={FiCheckCircle} color="#f8bd22" mt={1.5} mr={4} flexShrink={0} />
                          <chakra.span dangerouslySetInnerHTML={{ __html: item }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              </MotionBox>
            ))}
          </VStack>

          {/* Caja final de contacto */}
          <MotionBox
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            mt={20}
          >
            <Box
              bg={cardBg}
              rounded="2xl"
              border="3px"
              borderColor="#f8bd22"
              p={{ base: 10, md: 14 }}
              textAlign="center"
              boxShadow="2xl"
            >
              <FiMail size={68} color="#f8bd22" />
              <Heading size="2xl" mt={6} mb={4} color="gray.800" _dark={{ color: "white" }}>
                Ejercicio de Derechos ARCO
              </Heading>
              <Text fontSize="lg" color={muted} maxW="3xl" mx="auto" mb={6}>
                Para conocer, actualizar, rectificar, suprimir o revocar la autorización de tus datos personales, contáctanos:
              </Text>
              <Text fontSize="3xl" fontWeight="extrabold" color="#f8bd22" letterSpacing="wide">
                ferreexpressltda@hotmail.com
              </Text>
              <Text mt={4} fontSize="md" color={muted}>
                Plazo máximo de respuesta: <strong>15 días hábiles</strong>
              </Text>
            </Box>
          </MotionBox>

          <Text textAlign="center" mt={16} color={muted} fontSize="sm">
            © {new Date().getFullYear()} FerreExpress S.A.S. • Todos los derechos reservados
          </Text>
        </Container>

        {/* Botón flotante profesional */}
        <Button
          position="fixed"
          bottom={{ base: 4, md: 8 }}
          right={{ base: 4, md: 8 }}
          size="lg"
          bg="#f8bd22"
          color="gray.900"
          fontWeight="bold"
          shadow="2xl"
          rounded="full"
          px={8}
          py={7}
          leftIcon={<FiMessageSquare size={22} />}
          _hover={{ bg: "#e0a800", transform: "translateY(-4px)" }}
          _active={{ transform: "scale(0.95)" }}
          onClick={onOpen}
          zIndex={999}
        >
          Ejercer mis derechos
        </Button>

        {/* Modal del formulario */}
        <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }} motionPreset="slideInBottom">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader fontSize="xl" fontWeight="bold">
              <HStack>
                <FiUserCheck size={24} />
                <Text>Ejercicio de Derechos ARCO</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={5} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Nombre completo</FormLabel>
                    <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Documento (C.C. / NIT)</FormLabel>
                    <Input value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Correo electrónico</FormLabel>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Teléfono</FormLabel>
                    <Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Tipo de solicitud</FormLabel>
                    <Input placeholder="Ej: Conocer mis datos, rectificar, suprimir, revocar..." value={formData.tipoSolicitud} onChange={(e) => setFormData({ ...formData, tipoSolicitud: e.target.value })} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Mensaje adicional (opcional)</FormLabel>
                    <Textarea rows={4} placeholder="Detalla tu solicitud..." value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} />
                  </FormControl>
                </VStack>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button ml={3} bg="#f8bd22" color="gray.900" _hover={{ bg: "#e0a800" }} onClick={handleSubmit}>
                Enviar solicitud
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}