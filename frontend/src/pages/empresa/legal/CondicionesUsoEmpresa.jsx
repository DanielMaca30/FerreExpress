// src/pages/CondicionesUso.jsx
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
  FiFileText,
  FiUser,
  FiCheckSquare,
  FiPackage,
  FiTruck,
  FiRefreshCcw,
  FiShield,
  FiGlobe,
  FiLock,
  FiUsers,
  FiEdit3,
  FiMail,
  FiSmartphone,
  FiMessageSquare,
  FiCheckCircle,
  FiBookOpen,    // ← Reemplazamos FiGavel por este (libro de leyes)
} from "react-icons/fi";

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const sections = [
  { icon: FiFileText, title: "Aceptación de las condiciones", items: ["Al acceder o usar ferreexpress.com (el “Sitio”) y sus servicios (el “Servicio”), aceptas plenamente estas Condiciones de Uso.", "Si no estás de acuerdo, debes abstenerte de utilizar el Sitio."] },
  { icon: FiUser, title: "Usuarios y roles", items: ["Cliente Convencional y Contratista/Empresa: crean cuenta, gestionan cotizaciones y pedidos.", "Administrador: gestiona catálogo, pedidos, casos de soporte y reglas comerciales.", "El uso de cada módulo está sujeto a permisos por rol y autenticación segura con JWT.", "Eres responsable de la confidencialidad de tus credenciales y de toda actividad realizada con tu cuenta."] },
  { icon: FiCheckSquare, title: "Registro y veracidad de la información", items: ["Debes proporcionar datos veraces, completos y actualizados.", "Para Contratista/Empresa se requiere NIT y, cuando corresponda, documentos de acreditación.", "FerreExpress se reserva el derecho de validar, suspender o cerrar cuentas ante inconsistencias o uso indebido."] },
  { icon: FiPackage, title: "Catálogo, precios y disponibilidad", items: ["Los productos, precios, imágenes y descripciones pueden variar sin previo aviso.", "Los precios pueden incluir o excluir impuestos según el régimen tributario aplicable.", "La disponibilidad de stock se confirma al convertir una cotización o al confirmar el pedido."] },
  { icon: FiFileText, title: "Cotizaciones y proformas B2B", items: ["Las cotizaciones para Contratistas/Empresas tienen vigencia visible (5–15 días calendario).", "Pueden incluir descuentos por volumen o condiciones especiales.", "Al vencer la vigencia, precios y disponibilidad pueden cambiar.", "Convertir a pedido implica revalidación de stock, dirección y costos de envío."] },
  { icon: FiCheckCircle, title: "Pedido, pago y confirmación", items: ["El pedido se considera aceptado cuando: (a) recibimos tu solicitud, (b) validamos stock y precio, (c) confirmamos el pago, y (d) enviamos confirmación por correo y panel.", "Los métodos de pago se informan en el checkout.", "Las transacciones pueden ser rechazadas por controles antifraude o decisión de la entidad financiera."] },
  { icon: FiTruck, title: "Envíos y entregas", items: ["El costo de envío se calcula según ciudad, sector o reglas internas.", "Los plazos de entrega son estimados y pueden verse afectados por factores externos (clima, transportadora, etc.).", "Te notificaremos el estado del envío en tu panel y por correo electrónico."] },
  { icon: FiRefreshCcw, title: "Devoluciones, cambios y garantías", items: ["Devoluciones y cambios: dentro de los plazos legales y políticas publicadas (producto sin uso, empaque original).", "Garantías: según fabricante y normativa vigente. Debes abrir caso en el Centro de Ayuda.", "Reembolsos: se procesan por el mismo medio de pago tras validación."] },
  { icon: FiMessageSquare, title: "Centro de Ayuda y SLA", items: ["Puedes abrir casos por facturación, entrega, producto, devoluciones, etc.", "Los casos tienen estados visibles y SLA definidos en tu panel de usuario."] },
  { icon: FiShield, title: "Uso aceptable y prohibiciones", items: ["Queda prohibido: vulnerar la seguridad, eludir controles de acceso, realizar scraping, publicar contenido ilícito o usar el Sitio con fines fraudulentos."] },
  { icon: FiGlobe, title: "Propiedad intelectual", items: ["Todo el contenido del Sitio (marcas, textos, imágenes, código) es propiedad de FerreExpress o sus licenciantes.", "No adquieres derechos de propiedad intelectual por el uso del Sitio."] },
  { icon: FiLock, title: "Limitación de responsabilidad", items: ["El Sitio se ofrece “tal cual” y “según disponibilidad”.", "FerreExpress no será responsable por daños indirectos, lucro cesante o actos de terceros, salvo dolo o culpa grave."] },
  { icon: FiFileText, title: "Datos personales y cookies", items: ["El tratamiento de tus datos se rige por nuestro Aviso de Privacidad y Política de Cookies."] },
  { icon: FiUsers, title: "Menores de edad", items: ["El Sitio está dirigido exclusivamente a personas mayores de 18 años."] },
  { icon: FiEdit3, title: "Modificaciones", items: ["Podemos actualizar estas Condiciones en cualquier momento.", "Los cambios sustanciales serán notificados por correo electrónico o banner destacado."] },
  { icon: FiBookOpen, title: "Ley aplicable y jurisdicción", items: ["Estas Condiciones se rigen por las leyes de la República de Colombia.", "Cualquier controversia será resuelta ante los jueces competentes de Santiago de Cali, Valle del Cauca."] },
];

export default function CondicionesUso() {
  useEffect(() => window.scrollTo(0, 0), []);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Gracias por contactarnos. Te responderemos lo antes posible.",
      status: "success",
      duration: 7000,
      isClosable: true,
      position: "top",
    });
    onClose();
    setFormData({ nombre: "", email: "", telefono: "", mensaje: "" });
  };

  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  return (
    <>
      <Box minH="100vh" bg={bg} py={{ base: 12, md: 20 }}>
        <Container maxW="4xl">
          {/* Header */}
          <MotionVStack spacing={8} textAlign="center" mb={16} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Heading as="h1" size={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="gray.800" _dark={{ color: "white" }}>
              Términos y Condiciones de Uso
            </Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} color="gray.600" maxW="2xl">
              Condiciones generales del Sitio web y servicios
            </Text>
            <VStack spacing={3} color={muted} fontSize="sm" fontWeight="medium">
              <Text>Última actualización: 06 de octubre de 2025</Text>
              <Text>Titular: FerreExpress S.A.S. • NIT 805.030.111-8</Text>
              <HStack><FiSmartphone /><Text>Calle 16 #76-28, Prados del Limonar, Cali, Colombia</Text></HStack>
            </VStack>
          </MotionVStack>

          <Divider />

          {/* Secciones */}
          <VStack spacing={12} align="stretch" mt={16}>
            {sections.map((section, index) => (
              <MotionBox
                key={section.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
              >
                <Box bg={cardBg} rounded="xl" border="1px" borderColor={borderColor} overflow="hidden" boxShadow="lg" _hover={{ boxShadow: "xl" }} transition="all 0.3s">
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
                        <ListItem key={i} display="flex" alignItems="flex-start" fontSize={{ base: "md", md: "lg" }} color="gray.700" _dark={{ color: "gray.200" }} lineHeight="tall">
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

          {/* Contacto final */}
          <MotionBox initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} mt={20}>
            <Box bg={cardBg} rounded="2xl" border="3px" borderColor="#f8bd22" p={{ base: 10, md: 14 }} textAlign="center" boxShadow="2xl">
              <FiMail size={68} color="#f8bd22" />
              <Heading size="2xl" mt={6} mb={4} color="gray.800" _dark={{ color: "white" }}>
                ¿Dudas sobre los Términos y Condiciones?
              </Heading>
              <Text fontSize="lg" color={muted} maxW="3xl" mx="auto" mb={6}>
                Contáctanos y con gusto resolveremos tus inquietudes legales o comerciales.
              </Text>
              <Text fontSize="3xl" fontWeight="extrabold" color="#f8bd22">
                ferreexpressltda@hotmail.com
              </Text>
              <Text mt={4} fontSize="md" color={muted}>
                También al +57 316 175 9511
              </Text>
            </Box>
          </MotionBox>

          <Text textAlign="center" mt={16} color={muted} fontSize="sm">
            © {new Date().getFullYear()} FerreExpress S.A.S. • Todos los derechos reservados
          </Text>
        </Container>

        {/* Botón flotante */}
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
          onClick={onOpen}
          zIndex={999}
        >
          Contactar por dudas legales
        </Button>

        {/* Modal de contacto */}
        <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack><FiMail size={24} /><Text>Contactar por Términos y Condiciones</Text></HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  <FormControl isRequired><FormLabel>Nombre completo</FormLabel><Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} /></FormControl>
                  <FormControl isRequired><FormLabel>Correo electrónico</FormLabel><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></FormControl>
                  <FormControl><FormLabel>Teléfono</FormLabel><Input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} /></FormControl>
                  <FormControl isRequired><FormLabel>Mensaje o duda</FormLabel><Textarea rows={5} placeholder="Escribe aquí tu consulta sobre los Términos y Condiciones..." value={formData.mensaje} onChange={e => setFormData({ ...formData, mensaje: e.target.value })} /></FormControl>
                </VStack>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button ml={3} bg="#f8bd22" color="gray.900" _hover={{ bg: "#e0a800" }} onClick={handleSubmit}>
                Enviar mensaje
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}