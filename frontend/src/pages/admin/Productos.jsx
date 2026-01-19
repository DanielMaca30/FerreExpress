// src/pages/admin/Productos.jsx
import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import {
  Box,
  HStack,
  VStack,
  Stack,
  Heading,
  Text,
  Button,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useToast,
  Tooltip,
  Switch,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Image,
  Skeleton,
  usePrefersReducedMotion,
  Progress,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  SimpleGrid,
  Spinner,
  Divider,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiInfo,
  FiUpload,
  FiImage,
  FiStar,
  FiEdit2,
  FiRefreshCw,
  FiBox,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* =============== Motion helper (sin warning) =============== */
const MotionBox = motion.create(Box);
const MotionTr = motion.create(Tr);

const ferreYellow = "#F9BF20";

const PRESET_CATEGORIES = [
  "Ferretería general",
  "Herramientas manuales",
  "Herramientas eléctricas",
  "Fijaciones y tornillería",
  "Adhesivos y sellantes",
  "Pinturas y acabados",
  "Cables y electricidad",
  "Iluminación",
  "Plomería",
  "Tubos y conexiones",
  "Cementos y agregados",
  "Seguridad industrial",
  "Jardinería",
];

const toastError = (toast, message) =>
  toast({ status: "error", title: message, isClosable: true });

/* ================= FILA PRODUCTO ================= */
const ProductRow = memo(function ProductRow({
  product,
  onSave,
  onUpload,
  onOpenGallery,
  onOpenEdit,
  isSaving,
}) {
  const [localActivo, setLocalActivo] = useState(!!product.activo);
  const fileInputRef = useRef(null);

  const {
    isOpen: isConfirmOpen,
    onOpen: onOpenConfirm,
    onClose: onCloseConfirm,
  } = useDisclosure();
  const cancelRef = useRef();

  useEffect(() => {
    setLocalActivo(!!product.activo);
  }, [product.activo]);

  const handleConfirmDeactivate = () => {
    setLocalActivo(false);
    onSave && onSave({ ...product, activo: false });
    onCloseConfirm();
  };

  const hasImages = !!product.imagen_principal;

  return (
    <>
      <MotionTr
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
      >
        <Td fontWeight="medium" fontVariantNumeric="tabular-nums">
          {product.id}
        </Td>

        {/* Producto (nombre + categoría como “caption”) */}
        <Td>
          <VStack align="start" spacing={0} maxW="420px">
            <Text fontWeight="semibold" noOfLines={1}>
              {product.nombre}
            </Text>
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {product.categoria || "Sin categoría"}
            </Text>
          </VStack>
        </Td>

        <Td isNumeric fontVariantNumeric="tabular-nums">
          {Number(product.precio ?? 0).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          })}
        </Td>

        <Td isNumeric fontVariantNumeric="tabular-nums">
          <HStack justify="flex-end" spacing={2}>
            <Text>{Number(product.stock ?? 0).toLocaleString("es-CO")}</Text>
            {Number(product.stock) <= 5 && (
              <Tooltip label="Stock bajo (≤ 5)">
                <Badge colorScheme="red" borderRadius="999px" px={2}>
                  Bajo
                </Badge>
              </Tooltip>
            )}
          </HStack>
        </Td>

        {/* Gestión (compacta): imágenes + estado + editar */}
        <Td>
          <HStack justify="space-between" align="center" spacing={3}>
            {/* Imágenes */}
            <VStack align="start" spacing={1} minW={{ base: "180px", md: "220px" }}>
              <HStack spacing={2}>
                <Tooltip
                  label={
                    hasImages
                      ? "Este producto ya tiene imagen principal registrada."
                      : "Aún no hay imágenes. Sube al menos 1."
                  }
                >
                  <Badge
                    borderRadius="999px"
                    px={3}
                    py={1}
                    bg={hasImages ? "green.50" : "blackAlpha.50"}
                    color={hasImages ? "green.700" : "gray.700"}
                  >
                    {hasImages ? "Imágenes registradas" : "Sin imágenes"}
                  </Badge>
                </Tooltip>

                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  display="none"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    onUpload(product.id, files, product.nombre);
                    e.target.value = "";
                  }}
                />

                <Tooltip label="Subir imágenes">
                  <Button
                    size="xs"
                    leftIcon={<FiUpload />}
                    variant="outline"
                    borderRadius="999px"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={`Subir imágenes de ${product.nombre || `producto ${product.id}`}`}
                  >
                    Subir
                  </Button>
                </Tooltip>

                <Tooltip label="Ver galería">
                  <IconButton
                    icon={<FiImage />}
                    size="xs"
                    variant="ghost"
                    borderRadius="999px"
                    aria-label="Ver galería"
                    onClick={() => onOpenGallery && onOpenGallery(product)}
                  />
                </Tooltip>
              </HStack>
            </VStack>

            {/* Estado + Editar */}
            <HStack spacing={3}>
              <HStack spacing={2}>
                <Badge
                  borderRadius="999px"
                  px={3}
                  py={1}
                  bg={localActivo ? "green.50" : "red.50"}
                  color={localActivo ? "green.700" : "red.700"}
                >
                  {localActivo ? "ACTIVO" : "INACTIVO"}
                </Badge>

                <Switch
                  size="sm"
                  isChecked={localActivo}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    if (!checked && localActivo) {
                      onOpenConfirm();
                      return;
                    }

                    if (checked && !localActivo) {
                      setLocalActivo(true);
                      onSave && onSave({ ...product, activo: true });
                    }
                  }}
                  aria-label="Activar / desactivar producto"
                />
              </HStack>

              <Tooltip label="Editar producto">
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FiEdit2 />}
                  onClick={() => onOpenEdit && onOpenEdit(product)}
                  isLoading={isSaving}
                  borderRadius="999px"
                >
                  Editar
                </Button>
              </Tooltip>
            </HStack>
          </HStack>
        </Td>
      </MotionTr>

      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseConfirm}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Desactivar producto
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Seguro que deseas desactivar{" "}
              <strong>{product.nombre || `#${product.id}`}</strong>? Dejará de aparecer en el
              catálogo público, pero se conservará para pedidos y auditoría.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseConfirm}>
                Cancelar
              </Button>
              <Button colorScheme="red" ml={3} onClick={handleConfirmDeactivate}>
                Desactivar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
});

/* =================== PÁGINA PRINCIPAL =================== */
export default function AdminProductos() {
  const toast = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();

  /* ===== Layout-aware styles ===== */
  const canvasBg = useColorModeValue("gray.50", "gray.900");
  const subtle = useColorModeValue("gray.600", "gray.300");
  const tableHeadBg = useColorModeValue("rgba(249,250,251,0.85)", "blackAlpha.300");

  /* ===== state ===== */
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [prodTotal, setProdTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("");

  const [newProd, setNewProd] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    categoria: "",
  });
  const [newCatMode, setNewCatMode] = useState(false);

  // filtros
  const [prodQuery, setProdQuery] = useState("");
  const [debouncedProdQuery, setDebouncedProdQuery] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [verInactivos, setVerInactivos] = useState(false);
  const [prodSort, setProdSort] = useState("created_at");
  const [prodOrder, setProdOrder] = useState("desc");
  const [prodPage, setProdPage] = useState(1);
  const [prodLimit, setProdLimit] = useState(10);

  const [savingRowId, setSavingRowId] = useState(null);

  // Modal crear producto
  const {
    isOpen: isCreateOpen,
    onOpen: onOpenCreate,
    onClose: onCloseCreate,
  } = useDisclosure();

  // Modal galería
  const {
    isOpen: isGalleryOpen,
    onOpen: onOpenGallery,
    onClose: onCloseGallery,
  } = useDisclosure();
  const [galleryProduct, setGalleryProduct] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [savingPrincipalId, setSavingPrincipalId] = useState(null);

  // Modal editar producto
  const {
    isOpen: isEditOpen,
    onOpen: onOpenEdit,
    onClose: onCloseEdit,
  } = useDisclosure();
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    categoria: "",
    activo: true,
  });

  /* ===== debounce búsqueda ===== */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedProdQuery(prodQuery.trim()), 250);
    return () => clearTimeout(id);
  }, [prodQuery]);

  const stampUpdated = () => {
    try {
      const d = new Date();
      const hh = d.getHours() % 12 || 12;
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ampm = d.getHours() >= 12 ? "p. m." : "a. m.";
      setLastUpdated(`${hh}:${mm} ${ampm}`);
    } catch {
      setLastUpdated("");
    }
  };

  /* ====== Carga de productos ====== */
  const loadProductos = useCallback(
    async (customQuery) => {
      setLoading(true);
      const params = {};

      const q =
        typeof customQuery === "string"
          ? customQuery.trim()
          : debouncedProdQuery.trim();

      if (q) params.search = q;
      if (precioMin !== "") params.precioMin = precioMin;
      if (precioMax !== "") params.precioMax = precioMax;

      params.sort = prodSort;
      params.order = prodOrder;
      params.page = prodPage;
      params.limit = prodLimit;

      if (verInactivos) params.incluirInactivos = 1;

      try {
        const { data } = await api.get("/productos", { params });
        const arr = data?.productos || [];
        const final = onlyLowStock ? arr.filter((x) => Number(x.stock) <= 5) : arr;

        setProductos(final);
        setProdTotal(Number(data?.total || arr.length));
        stampUpdated();
      } catch (e) {
        console.error(e);
        toastError(toast, "Error cargando productos");
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedProdQuery,
      precioMin,
      precioMax,
      prodSort,
      prodOrder,
      prodPage,
      prodLimit,
      verInactivos,
      onlyLowStock,
      toast,
    ]
  );

  useEffect(() => {
    const timeout = setTimeout(() => loadProductos(), 80);
    return () => clearTimeout(timeout);
  }, [loadProductos]);

  /* ====== Categorías (preset + derivadas) ====== */
  const categorias = useMemo(() => {
    const set = new Set(PRESET_CATEGORIES);

    (Array.isArray(productos) ? productos : []).forEach((p) => {
      const c = (p?.categoria || "").trim();
      if (c) set.add(c);
    });

    const nueva = newProd.categoria?.trim();
    if (nueva && !set.has(nueva)) set.add(nueva);

    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [productos, newProd.categoria]);

  /* ====== KPIs (sobre los resultados cargados) ====== */
  const kpis = useMemo(() => {
    const arr = Array.isArray(productos) ? productos : [];
    const activos = arr.filter((p) => !!p.activo).length;
    const inactivos = arr.filter((p) => !p.activo).length;
    const stockBajo = arr.filter((p) => Number(p.stock) <= 5).length;
    return {
      total: Number(prodTotal || arr.length),
      activos,
      inactivos,
      stockBajo,
    };
  }, [productos, prodTotal]);

  /* ====== CRUD Productos ====== */
  const createProducto = async () => {
    const { nombre, precio, stock, categoria, descripcion } = newProd;
    if (!nombre?.trim())
      return toast({
        status: "warning",
        title: "Escribe un nombre de producto",
        isClosable: true,
      });
    if (precio < 0 || stock < 0)
      return toast({
        status: "warning",
        title: "Precio y stock deben ser ≥ 0",
        isClosable: true,
      });

    try {
      await api.post("/productos", {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || "",
        precio: Number(precio),
        stock: Number(stock),
        categoria: categoria?.trim() || null,
      });

      toast({ status: "success", title: "Producto creado", duration: 1500 });

      setNewProd({ nombre: "", descripcion: "", precio: 0, stock: 0, categoria: "" });
      setNewCatMode(false);
      onCloseCreate();
      await loadProductos();
    } catch (e) {
      console.error(e);
      toastError(toast, "No se pudo crear el producto");
    }
  };

  const updateProducto = async (p) => {
    setSavingRowId(p.id);
    try {
      await api.put(`/productos/${p.id}`, {
        nombre: p.nombre,
        descripcion: p.descripcion ?? "",
        precio: Number(p.precio),
        stock: Number(p.stock),
        categoria: (p.categoria ?? "").trim() || null,
        activo: p.activo ? 1 : 0,
      });
      toast({ status: "success", title: `Producto #${p.id} guardado`, duration: 1200 });
      await loadProductos();
    } catch (e) {
      console.error(e);
      toastError(toast, "No se pudo actualizar");
    } finally {
      setSavingRowId(null);
    }
  };

  const uploadImagen = async (prodId, files, alt) => {
    const arr = Array.isArray(files) ? files : Array.from(files || []);
    if (!arr.length) return;

    try {
      const fd = new FormData();
      arr.forEach((file) => fd.append("imagenes", file));
      if (alt) fd.append("alt_text", alt);

      await api.post(`/productos/${prodId}/imagenes`, fd);

      toast({
        status: "success",
        title: arr.length > 1 ? "Imágenes subidas" : "Imagen subida",
        duration: 1200,
      });

      await loadProductos();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || "No se pudo subir la imagen";
      toastError(toast, msg);
    }
  };

  const reloadGalleryImages = async (productId) => {
    try {
      const { data } = await api.get(`/productos/${productId}/imagenes`);
      const arr = Array.isArray(data) ? data : data?.imagenes || [];
      setGalleryImages(arr);
    } catch (e) {
      console.error(e);
      toastError(toast, "No se pudieron recargar las imágenes");
    }
  };

  const openGallery = async (product) => {
    setGalleryProduct(product);
    setGalleryImages([]);
    setLoadingGallery(true);
    onOpenGallery();

    try {
      await reloadGalleryImages(product.id);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleSetPrincipal = async (img) => {
    if (!galleryProduct) return;
    setSavingPrincipalId(img.id);
    try {
      await api.patch(`/productos/${galleryProduct.id}/imagenes/${img.id}/principal`);

      toast({ status: "success", title: "Imagen principal actualizada", duration: 1500 });

      await reloadGalleryImages(galleryProduct.id);
      await loadProductos();
    } catch (e) {
      console.error(e);
      toastError(toast, "No se pudo marcar como principal");
    } finally {
      setSavingPrincipalId(null);
    }
  };

  const handleOpenEdit = (product) => {
    setEditProduct(product);
    setEditForm({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: Number(product.precio ?? 0),
      stock: Number(product.stock ?? 0),
      categoria: product.categoria || "",
      activo: !!product.activo,
    });
    onOpenEdit();
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;

    const payload = {
      ...editProduct,
      nombre: editForm.nombre.trim(),
      descripcion: editForm.descripcion ?? "",
      precio: Number(editForm.precio),
      stock: Number(editForm.stock),
      categoria: (editForm.categoria ?? "").trim() || null,
      activo: editForm.activo ? 1 : 0,
    };

    await updateProducto(payload);
    onCloseEdit();
  };

  /* ====== Limpiar filtros ====== */
  const clearFilters = () => {
    setProdQuery("");
    setDebouncedProdQuery("");
    setPrecioMin("");
    setPrecioMax("");
    setProdSort("created_at");
    setProdOrder("desc");
    setOnlyLowStock(false);
    setVerInactivos(false);
    setProdPage(1);
  };

  const totalPages = useMemo(() => {
    const t = Math.ceil((Number(prodTotal) || 0) / (Number(prodLimit) || 10));
    return Math.max(1, t);
  }, [prodTotal, prodLimit]);

  const canPrev = prodPage > 1;
  const canNext = prodPage < totalPages;

  /* ====== “pills” removibles ====== */
  const pills = useMemo(() => {
    const list = [];
    if (debouncedProdQuery) {
      list.push({
        key: "q",
        label: `Búsqueda: “${debouncedProdQuery}”`,
        onClear: () => {
          setProdQuery("");
          setDebouncedProdQuery("");
          setProdPage(1);
        },
      });
    }
    if (precioMin !== "" || precioMax !== "") {
      list.push({
        key: "p",
        label: `Precio: ${precioMin !== "" ? precioMin : "—"} a ${
          precioMax !== "" ? precioMax : "—"
        }`,
        onClear: () => {
          setPrecioMin("");
          setPrecioMax("");
          setProdPage(1);
        },
      });
    }
    if (onlyLowStock) {
      list.push({
        key: "s",
        label: "Stock bajo (≤ 5)",
        onClear: () => {
          setOnlyLowStock(false);
          setProdPage(1);
        },
      });
    }
    if (verInactivos) {
      list.push({
        key: "i",
        label: "Incluye inactivos",
        onClear: () => {
          setVerInactivos(false);
          setProdPage(1);
        },
      });
    }
    return list;
  }, [debouncedProdQuery, precioMin, precioMax, onlyLowStock, verInactivos]);

  return (
    <Box w="full" bg={canvasBg} minH="100%" pb={{ base: 6, md: 8 }}>
      {/* Barra de estado global cuando recarga tabla */}
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

      {/* Wrapper que respeta Sidebar + Topbar */}
      <Box w="full" px={{ base: 4, md: 6, lg: 8 }} pt={{ base: 4, md: 5 }}>
        <Box w="full" maxW="1440px" mx="auto">
          {/* Header */}
          <HStack justify="space-between" align="start" mb={4} gap={3} flexWrap="wrap">
            <VStack align="start" spacing={1}>
              <HStack spacing={2} wrap="wrap">
                <Badge borderRadius="999px" px={3} py={1} bg="blackAlpha.50">
                  ADMIN · PRODUCTOS
                </Badge>
                {lastUpdated ? (
                  <Text fontSize="xs" color={subtle}>
                    Última actualización: <b>{lastUpdated}</b>
                  </Text>
                ) : null}
              </HStack>

              <Heading size="lg" lineHeight="1.1">
                Productos
              </Heading>
              <Text fontSize="sm" color={subtle}>
                Crea, edita, controla stock e imágenes. En móvil verás tarjetas; en desktop, tabla completa.
              </Text>
            </VStack>

            <HStack spacing={2}>
              <Tooltip label="Recargar">
                <IconButton
                  aria-label="Recargar productos"
                  icon={<FiRefreshCw />}
                  borderRadius="999px"
                  onClick={() => loadProductos()}
                />
              </Tooltip>

              <Button
                leftIcon={<FiPlus />}
                bg={ferreYellow}
                color="black"
                borderRadius="999px"
                _hover={{ filter: "brightness(0.98)" }}
                _active={{ filter: "brightness(0.96)" }}
                onClick={onOpenCreate}
              >
                Crear producto
              </Button>
            </HStack>
          </HStack>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} mb={4}>
            <KpiCard title="Total" value={kpis.total} icon={FiBox} />
            <KpiCard title="Activos" value={kpis.activos} icon={FiCheckCircle} />
            <KpiCard title="Inactivos" value={kpis.inactivos} icon={FiXCircle} />
            <KpiCard title="Stock bajo" value={kpis.stockBajo} icon={FiAlertTriangle} />
          </SimpleGrid>

          {/* Filtros */}
          <SectionCard
            title="Filtros y búsqueda"
            subtitle="Escribe para buscar. Ajusta precio, orden y estado. Se aplica automáticamente."
            right={
              <Tooltip label="Restablecer filtros a valores por defecto">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<FiFilter />}
                  onClick={clearFilters}
                  borderRadius="999px"
                >
                  Limpiar
                </Button>
              </Tooltip>
            }
          >
            <VStack align="stretch" spacing={3}>
              <Stack
                direction={{ base: "column", md: "row" }}
                spacing={3}
                align={{ base: "stretch", md: "center" }}
              >
                <Box flex="1">
                  <Text fontSize="xs" mb={1} color={subtle}>
                    Buscar en productos
                  </Text>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch />
                    </InputLeftElement>
                    <Input
                      placeholder="Ej: taladro, tornillo, pintura blanca"
                      value={prodQuery}
                      onChange={(e) => {
                        setProdQuery(e.target.value);
                        setProdPage(1);
                      }}
                      aria-label="Buscar productos"
                      borderRadius="999px"
                    />
                  </InputGroup>
                </Box>

                <Box w={{ base: "100%", md: "180px" }}>
                  <Text fontSize="xs" mb={1} color={subtle}>
                    Precio mínimo
                  </Text>
                  <NumberInput
                    min={0}
                    value={precioMin}
                    onChange={(valueString) => {
                      setPrecioMin(valueString);
                      setProdPage(1);
                    }}
                  >
                    <NumberInputField placeholder="Mínimo" aria-label="Precio mínimo" borderRadius="999px" />
                  </NumberInput>
                </Box>

                <Box w={{ base: "100%", md: "180px" }}>
                  <Text fontSize="xs" mb={1} color={subtle}>
                    Precio máximo
                  </Text>
                  <NumberInput
                    min={0}
                    value={precioMax}
                    onChange={(valueString) => {
                      setPrecioMax(valueString);
                      setProdPage(1);
                    }}
                  >
                    <NumberInputField placeholder="Máximo" aria-label="Precio máximo" borderRadius="999px" />
                  </NumberInput>
                </Box>
              </Stack>

              <Stack
                direction={{ base: "column", md: "row" }}
                spacing={3}
                align={{ base: "stretch", md: "center" }}
              >
                <Box w={{ base: "100%", md: "240px" }}>
                  <Text fontSize="xs" mb={1} color={subtle}>
                    Ordenar por
                  </Text>
                  <Select
                    value={prodSort}
                    onChange={(e) => {
                      setProdSort(e.target.value);
                      setProdPage(1);
                    }}
                    aria-label="Ordenar por"
                    borderRadius="999px"
                  >
                    <option value="created_at">Fecha de creación</option>
                    <option value="nombre">Nombre</option>
                    <option value="precio">Precio</option>
                  </Select>
                </Box>

                <Box w={{ base: "100%", md: "200px" }}>
                  <Text fontSize="xs" mb={1} color={subtle}>
                    Dirección
                  </Text>
                  <Select
                    value={prodOrder}
                    onChange={(e) => {
                      setProdOrder(e.target.value);
                      setProdPage(1);
                    }}
                    aria-label="Dirección de orden"
                    borderRadius="999px"
                  >
                    <option value="asc">Ascendente</option>
                    <option value="desc">Descendente</option>
                  </Select>
                </Box>

                <Box flex="1" />

                <HStack spacing={4} justify={{ base: "space-between", md: "flex-end" }}>
                  <HStack>
                    <Switch
                      isChecked={onlyLowStock}
                      onChange={(e) => {
                        setOnlyLowStock(e.target.checked);
                        setProdPage(1);
                      }}
                      aria-label="Filtrar por stock bajo"
                    />
                    <Text fontSize="sm" color={subtle}>
                      Solo stock bajo (≤ 5)
                    </Text>
                  </HStack>

                  <HStack>
                    <Switch
                      isChecked={verInactivos}
                      onChange={(e) => {
                        setVerInactivos(e.target.checked);
                        setProdPage(1);
                      }}
                      aria-label="Incluir productos inactivos"
                    />
                    <Text fontSize="sm" color={subtle}>
                      Incluir inactivos
                    </Text>
                  </HStack>
                </HStack>
              </Stack>

              {pills.length ? (
                <HStack wrap="wrap" spacing={2} pt={1}>
                  {pills.map((p) => (
                    <Tag
                      key={p.key}
                      borderRadius="999px"
                      bg="blackAlpha.50"
                      color="gray.800"
                      px={2}
                      py={1}
                    >
                      <TagLabel fontSize="sm">{p.label}</TagLabel>
                      <TagCloseButton onClick={p.onClear} />
                    </Tag>
                  ))}
                </HStack>
              ) : null}
            </VStack>
          </SectionCard>

          {/* Listado */}
          <SectionCard
            title="Listado"
            subtitle="Acciones: subir imágenes, ver galería, activar/desactivar y editar."
          >
            <Box
              overflowX="auto"
              borderRadius="xl"
              border="1px solid"
              borderColor={useColorModeValue("gray.200", "gray.700")}
            >
              <Table size="sm" variant="simple">
                <Thead
                  position="sticky"
                  top={0}
                  zIndex={1}
                  bg={tableHeadBg}
                  backdropFilter="blur(8px)"
                >
                  <Tr>
                    <Th>ID</Th>
                    <Th>PRODUCTO</Th>
                    <Th isNumeric>PRECIO</Th>
                    <Th isNumeric>STOCK</Th>
                    <Th>GESTIÓN</Th>
                  </Tr>
                </Thead>

                <Tbody>
                  <AnimatePresence initial={false}>
                    {loading
                      ? Array.from({ length: prodLimit }).map((_, i) => (
                          <Tr key={`sk-${i}`}>
                            <Td colSpan={5}>
                              <Skeleton height="44px" />
                            </Td>
                          </Tr>
                        ))
                      : productos.map((p) => (
                          <ProductRow
                            key={p.id}
                            product={p}
                            onSave={updateProducto}
                            onUpload={uploadImagen}
                            onOpenGallery={openGallery}
                            onOpenEdit={handleOpenEdit}
                            isSaving={savingRowId === p.id}
                          />
                        ))}
                  </AnimatePresence>
                </Tbody>
              </Table>
            </Box>

            {/* Paginación */}
            <HStack justify="space-between" mt={3} flexWrap="wrap" rowGap={2}>
              <Text fontSize="sm" color={subtle}>
                Total encontrados: {prodTotal} • Página {prodPage} de {totalPages}
              </Text>

              <HStack>
                <Text fontSize="sm" color={subtle}>
                  Filas:
                </Text>
                <Select
                  size="sm"
                  value={prodLimit}
                  onChange={(e) => {
                    setProdPage(1);
                    setProdLimit(Number(e.target.value));
                  }}
                  maxW="90px"
                  borderRadius="999px"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </Select>

                <Button
                  size="sm"
                  onClick={() => setProdPage((p) => Math.max(1, p - 1))}
                  isDisabled={!canPrev}
                  borderRadius="999px"
                >
                  Anterior
                </Button>

                <Button
                  size="sm"
                  onClick={() => setProdPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={!canNext}
                  borderRadius="999px"
                >
                  Siguiente
                </Button>
              </HStack>
            </HStack>

            {!loading && productos.length === 0 && (
              <EmptyState
                title="Sin resultados"
                description="No encontramos productos con los filtros actuales. Prueba limpiarlos o usa un término más general."
                action={
                  <Button
                    onClick={clearFilters}
                    leftIcon={<FiFilter />}
                    borderRadius="999px"
                  >
                    Limpiar filtros
                  </Button>
                }
              />
            )}
          </SectionCard>

          {/* ===== Modal: Crear producto ===== */}
          <Modal
            isOpen={isCreateOpen}
            onClose={onCloseCreate}
            isCentered
            size="lg"
            scrollBehavior="inside"
          >
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
            <ModalContent>
              <ModalHeader>Crear nuevo producto</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={3}>
                  <Input
                    placeholder="Nombre del producto"
                    value={newProd.nombre}
                    onChange={(e) => setNewProd((s) => ({ ...s, nombre: e.target.value }))}
                    aria-label="Nombre del producto"
                    borderRadius="xl"
                  />

                  <HStack spacing={3}>
                    <NumberInput
                      min={0}
                      value={newProd.precio}
                      onChange={(_, v) =>
                        setNewProd((s) => ({ ...s, precio: Number.isFinite(v) ? v : 0 }))
                      }
                      flex="1"
                    >
                      <NumberInputField placeholder="Precio" aria-label="Precio" borderRadius="xl" />
                    </NumberInput>

                    <NumberInput
                      min={0}
                      value={newProd.stock}
                      onChange={(_, v) =>
                        setNewProd((s) => ({ ...s, stock: Number.isFinite(v) ? v : 0 }))
                      }
                      flex="1"
                    >
                      <NumberInputField placeholder="Stock" aria-label="Stock" borderRadius="xl" />
                    </NumberInput>
                  </HStack>

                  <Select
                    placeholder="Selecciona categoría"
                    value={newCatMode ? "__new__" : newProd.categoria || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__new__") {
                        setNewCatMode(true);
                        setNewProd((s) => ({ ...s, categoria: "" }));
                      } else {
                        setNewCatMode(false);
                        setNewProd((s) => ({ ...s, categoria: val }));
                      }
                    }}
                    aria-label="Categoría"
                    borderRadius="xl"
                  >
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__new__">➕ Nueva categoría…</option>
                  </Select>

                  {newCatMode && (
                    <Input
                      placeholder="Nombre de la nueva categoría"
                      value={newProd.categoria}
                      onChange={(e) => setNewProd((s) => ({ ...s, categoria: e.target.value }))}
                      aria-label="Nueva categoría"
                      borderRadius="xl"
                    />
                  )}

                  <Box>
                    <Text fontSize="sm" mb={1} color={subtle}>
                      Descripción del producto
                    </Text>
                    <RichDescriptionEditor
                      value={newProd.descripcion}
                      onChange={(val) => setNewProd((s) => ({ ...s, descripcion: val }))}
                    />
                    <Text mt={1} fontSize="xs" color={subtle}>
                      Puedes aplicar negrilla, cursiva y listas. Se guarda como HTML para mostrar luego en la ficha.
                    </Text>
                  </Box>
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onCloseCreate}>
                  Cancelar
                </Button>
                <Button
                  leftIcon={<FiPlus />}
                  bg={ferreYellow}
                  color="black"
                  borderRadius="999px"
                  _hover={{ filter: "brightness(0.98)" }}
                  _active={{ filter: "brightness(0.96)" }}
                  onClick={createProducto}
                >
                  Guardar producto
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* ===== Modal: Editar producto ===== */}
          <Modal
            isOpen={isEditOpen}
            onClose={onCloseEdit}
            isCentered
            size="lg"
            scrollBehavior="inside"
          >
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
            <ModalContent>
              <ModalHeader>Editar producto {editProduct ? `#${editProduct.id}` : ""}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={3}>
                  <Input
                    placeholder="Nombre del producto"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm((s) => ({ ...s, nombre: e.target.value }))}
                    aria-label="Nombre del producto"
                    borderRadius="xl"
                  />

                  <HStack spacing={3}>
                    <NumberInput
                      min={0}
                      value={editForm.precio}
                      onChange={(_, v) =>
                        setEditForm((s) => ({ ...s, precio: Number.isFinite(v) ? v : 0 }))
                      }
                      flex="1"
                    >
                      <NumberInputField placeholder="Precio" aria-label="Precio" borderRadius="xl" />
                    </NumberInput>
                    <NumberInput
                      min={0}
                      value={editForm.stock}
                      onChange={(_, v) =>
                        setEditForm((s) => ({ ...s, stock: Number.isFinite(v) ? v : 0 }))
                      }
                      flex="1"
                    >
                      <NumberInputField placeholder="Stock" aria-label="Stock" borderRadius="xl" />
                    </NumberInput>
                  </HStack>

                  <Select
                    placeholder="Selecciona categoría"
                    value={editForm.categoria || ""}
                    onChange={(e) => setEditForm((s) => ({ ...s, categoria: e.target.value }))}
                    aria-label="Categoría"
                    borderRadius="xl"
                  >
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>

                  <HStack>
                    <Switch
                      isChecked={editForm.activo}
                      onChange={(e) => setEditForm((s) => ({ ...s, activo: e.target.checked }))}
                    />
                    <Text fontSize="sm">{editForm.activo ? "Producto activo" : "Producto inactivo"}</Text>
                  </HStack>

                  <Box>
                    <Text fontSize="sm" mb={1} color={subtle}>
                      Descripción del producto
                    </Text>
                    <RichDescriptionEditor
                      value={editForm.descripcion}
                      onChange={(val) => setEditForm((s) => ({ ...s, descripcion: val }))}
                    />
                    <Text mt={1} fontSize="xs" color={subtle}>
                      Se guarda como HTML. Luego se muestra tal cual en la ficha de producto.
                    </Text>
                  </Box>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onCloseEdit}>
                  Cancelar
                </Button>
                <Button
                  bg={ferreYellow}
                  color="black"
                  borderRadius="999px"
                  _hover={{ filter: "brightness(0.98)" }}
                  _active={{ filter: "brightness(0.96)" }}
                  onClick={handleSaveEdit}
                  isLoading={savingRowId === (editProduct?.id ?? null)}
                >
                  Guardar cambios
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* ===== Modal: Galería de imágenes ===== */}
          <Modal
            isOpen={isGalleryOpen}
            onClose={onCloseGallery}
            isCentered
            size="xl"
            scrollBehavior="inside"
          >
            <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
            <ModalContent>
              <ModalHeader>
                Imágenes de {galleryProduct?.nombre || `producto #${galleryProduct?.id || ""}`}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {loadingGallery ? (
                  <VStack py={6}>
                    <Spinner />
                    <Text fontSize="sm" color={subtle}>
                      Cargando imágenes…
                    </Text>
                  </VStack>
                ) : galleryImages.length === 0 ? (
                  <Text fontSize="sm" color={subtle}>
                    Este producto aún no tiene imágenes asociadas.
                  </Text>
                ) : (
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                    {galleryImages.map((img) => {
                      const isPrincipal = img.es_principal === 1 || img.es_principal === true;

                      return (
                        <Box
                          key={img.id || img.url}
                          borderRadius="xl"
                          overflow="hidden"
                          border="1px solid"
                          borderColor={
                            isPrincipal
                              ? "yellow.400"
                              : useColorModeValue("gray.200", "gray.700")
                          }
                          position="relative"
                        >
                          {isPrincipal && (
                            <Badge
                              colorScheme="yellow"
                              position="absolute"
                              top={2}
                              left={2}
                              fontSize="0.65rem"
                              borderRadius="999px"
                            >
                              Principal
                            </Badge>
                          )}

                          <Image
                            src={`${API_BASE_URL}${img.url}`}
                            alt={img.alt_text || galleryProduct?.nombre || "Imagen"}
                            w="100%"
                            h="140px"
                            objectFit="cover"
                          />

                          <VStack align="stretch" spacing={2} p={2}>
                            {img.alt_text ? (
                              <Text fontSize="xs" noOfLines={2} color={subtle}>
                                {img.alt_text}
                              </Text>
                            ) : null}

                            <Button
                              size="xs"
                              leftIcon={<FiStar />}
                              variant={isPrincipal ? "solid" : "outline"}
                              colorScheme={isPrincipal ? "yellow" : "gray"}
                              isDisabled={isPrincipal}
                              isLoading={savingPrincipalId === img.id}
                              onClick={() => handleSetPrincipal(img)}
                              borderRadius="999px"
                            >
                              {isPrincipal ? "Principal" : "Hacer principal"}
                            </Button>
                          </VStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}
              </ModalBody>
              <ModalFooter>
                <Button onClick={onCloseGallery} borderRadius="999px">
                  Cerrar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      </Box>
    </Box>
  );
}

/* ================= Subcomponentes UI ================= */
function SectionCard({ title, subtitle, right, children }) {
  const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(23,25,35,0.74)");
  const borderCo = useColorModeValue("rgba(226,232,240,0.9)", "rgba(45,55,72,0.75)");
  const subtle = useColorModeValue("gray.600", "gray.300");
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
      p={{ base: 3, md: 4 }}
      mb={4}
      style={{ backdropFilter: "saturate(150%) blur(10px)" }}
      boxShadow={useColorModeValue(
        "0 8px 22px rgba(31,38,135,0.10)",
        "0 8px 22px rgba(0,0,0,0.35)"
      )}
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

function KpiCard({ title, value, icon: IconCmp }) {
  const cardBg = useColorModeValue("rgba(255,255,255,0.92)", "rgba(23,25,35,0.74)");
  const borderCo = useColorModeValue("rgba(226,232,240,0.9)", "rgba(45,55,72,0.75)");
  const subtle = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderCo}
      borderRadius="2xl"
      p={4}
      style={{ backdropFilter: "saturate(150%) blur(10px)" }}
      boxShadow={useColorModeValue(
        "0 8px 22px rgba(31,38,135,0.08)",
        "0 8px 22px rgba(0,0,0,0.35)"
      )}
    >
      <HStack justify="space-between" align="center">
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color={subtle}>
            {title}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" fontVariantNumeric="tabular-nums">
            {Number(value ?? 0).toLocaleString("es-CO")}
          </Text>
        </VStack>
        <Box
          w="36px"
          h="36px"
          borderRadius="999px"
          bg="blackAlpha.50"
          display="grid"
          placeItems="center"
        >
          <Box as={IconCmp} boxSize={5} />
        </Box>
      </HStack>
    </Box>
  );
}

function EmptyState({
  icon: IconCmp = FiInfo,
  title = "Sin datos",
  description = "No hay información para mostrar.",
  action,
}) {
  const subtle = useColorModeValue("gray.600", "gray.300");
  return (
    <VStack spacing={2} py={8} color={subtle}>
      <Box as={IconCmp} boxSize={6} />
      <Heading size="sm">{title}</Heading>
      <Text fontSize="sm" textAlign="center" maxW="520px">
        {description}
      </Text>
      {action}
    </VStack>
  );
}

/* ===== Editor rico para descripción (WYSIWYG con contentEditable) ===== */
function RichDescriptionEditor({ value, onChange, minHeight = "150px" }) {
  const editorRef = useRef(null);
  const toolbarBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.300");
  const placeholderColor = useColorModeValue("gray.400", "whiteAlpha.400");

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!value) {
      if (el.innerHTML !== "") el.innerHTML = "";
    } else if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange?.(el.innerHTML);
  };

  const exec = (command) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, null);
    handleInput();
  };

  const execBlock = (blockTag) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand("formatBlock", false, blockTag);
    handleInput();
  };

  const isEmpty = useMemo(() => {
    const raw = value || "";
    const textOnly = raw.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    return textOnly.length === 0;
  }, [value]);

  return (
    <Box borderWidth="1px" borderRadius="xl" overflow="hidden" borderColor={borderColor}>
      <HStack spacing={1} px={2} py={1} borderBottomWidth="1px" bg={toolbarBg}>
        <Tooltip label="Negrilla">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Negrilla"
            icon={
              <Text as="span" fontWeight="bold">
                B
              </Text>
            }
            onClick={() => exec("bold")}
          />
        </Tooltip>

        <Tooltip label="Cursiva">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Cursiva"
            icon={
              <Text as="span" fontStyle="italic">
                I
              </Text>
            }
            onClick={() => exec("italic")}
          />
        </Tooltip>

        <Tooltip label="Subrayado">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Subrayado"
            icon={
              <Text as="span" textDecor="underline">
                U
              </Text>
            }
            onClick={() => exec("underline")}
          />
        </Tooltip>

        <Tooltip label="Lista con viñetas">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Lista"
            icon={<Text as="span">• • •</Text>}
            onClick={() => exec("insertUnorderedList")}
          />
        </Tooltip>

        <Tooltip label="Título pequeño">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Título"
            icon={<Text as="span">H</Text>}
            onClick={() => execBlock("h4")}
          />
        </Tooltip>

        <Tooltip label="Limpiar formato">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Limpiar formato"
            icon={<Text as="span">Tx</Text>}
            onClick={() => exec("removeFormat")}
          />
        </Tooltip>
      </HStack>

      <Box position="relative">
        {isEmpty && (
          <Text
            position="absolute"
            top={2}
            left={3}
            fontSize="sm"
            color={placeholderColor}
            pointerEvents="none"
          >
            Describe el producto, materiales, usos, recomendaciones…
          </Text>
        )}

        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          px={3}
          py={2}
          minH={minHeight}
          whiteSpace="pre-wrap"
          _focusWithin={{ outline: "none" }}
        />
      </Box>
    </Box>
  );
}
