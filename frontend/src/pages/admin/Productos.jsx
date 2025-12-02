// src/pages/admin/Productos.jsx
import { useEffect, useMemo, useRef, useState, memo } from "react";
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
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL } from "../../utils/axiosInstance";

/* =============== Utils =============== */
const MotionBox = motion(Box);

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

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
      >
        <Td fontWeight="medium">{product.id}</Td>

        {/* Nombre (solo lectura en tabla) */}
        <Td>
          <Text fontWeight="medium" noOfLines={2}>
            {product.nombre}
          </Text>
        </Td>

        {/* Precio */}
        <Td isNumeric>{Number(product.precio ?? 0).toLocaleString("es-CO")}</Td>

        {/* Stock */}
        <Td isNumeric>
          <HStack justify="flex-end" spacing={2}>
            <Text>{product.stock}</Text>
            {Number(product.stock) <= 5 && (
              <Tooltip label="Stock bajo">
                <Badge colorScheme="red">Bajo</Badge>
              </Tooltip>
            )}
          </HStack>
        </Td>

        {/* Categoría */}
        <Td>
          <Text fontSize="sm" noOfLines={1}>
            {product.categoria || "Sin categoría"}
          </Text>
        </Td>

        {/* Estado (switch + badge) */}
        <Td>
          <HStack spacing={2}>
            <Badge colorScheme={localActivo ? "green" : "red"}>
              {localActivo ? "Activo" : "Inactivo"}
            </Badge>
            <Switch
              size="sm"
              isChecked={localActivo}
              onChange={(e) => {
                const checked = e.target.checked;
                // Activo -> Inactivo: pedir confirmación
                if (!checked && localActivo) {
                  onOpenConfirm();
                  return;
                }
                // Inactivo -> Activo: aplicar de una vez
                if (checked && !localActivo) {
                  setLocalActivo(true);
                  onSave && onSave({ ...product, activo: true });
                }
              }}
              aria-label="Activar / desactivar producto"
            />
          </HStack>
        </Td>

        {/* Imágenes (solo texto + acciones) */}
        <Td>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="gray.500">
              {product.imagen_principal
                ? "Imágenes registradas"
                : "Sin imágenes aún"}
            </Text>

            <HStack spacing={2}>
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

              <Button
                size="xs"
                leftIcon={<FiUpload />}
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                aria-label={`Subir imágenes de ${
                  product.nombre || `producto ${product.id}`
                }`}
              >
                Subir
              </Button>

              <Tooltip label="Ver todas las imágenes de este producto">
                <IconButton
                  icon={<FiImage />}
                  size="xs"
                  variant="ghost"
                  aria-label="Ver galería"
                  onClick={() => onOpenGallery && onOpenGallery(product)}
                />
              </Tooltip>
            </HStack>
          </VStack>
        </Td>

        {/* Acciones: Editar */}
        <Td>
          <HStack>
            <Tooltip label="Editar producto">
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<FiEdit2 />}
                onClick={() => onOpenEdit && onOpenEdit(product)}
                isLoading={isSaving}
              >
                Editar
              </Button>
            </Tooltip>
          </HStack>
        </Td>
      </motion.tr>

      {/* AlertDialog de confirmación para desactivar */}
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
              <strong>{product.nombre || `#${product.id}`}</strong>? Dejará de
              aparecer en el catálogo público, pero se conservará para pedidos y
              auditoría.
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

  /* ===== Estilos/theme ===== */
  const pageBg = useColorModeValue(
    "linear-gradient(135deg,#f7f7fb 0%,#eef3ff 100%)",
    "linear-gradient(135deg,#0b0f1a 0%,#121826 100%)"
  );
  const subtle = useColorModeValue("gray.600", "gray.300");
  const tableHeadBg = useColorModeValue(
    "rgba(249,250,251,0.8)",
    "blackAlpha.300"
  );

  /* ===== state ===== */
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [prodTotal, setProdTotal] = useState(0);

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
    const id = setTimeout(() => {
      setDebouncedProdQuery(prodQuery.trim());
    }, 250);
    return () => clearTimeout(id);
  }, [prodQuery]);

  /* ====== Carga de productos ====== */
  async function loadProductos(customQuery) {
    setLoading(true);
    const params = {};

    const q =
      typeof customQuery === "string"
        ? customQuery.trim()
        : debouncedProdQuery.trim();

    if (q) params.search = q;
    if (precioMin) params.precioMin = precioMin;
    if (precioMax) params.precioMax = precioMax;
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
    } catch (e) {
      console.error(e);
      toastError(toast, "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  // carga inicial + recarga al cambiar filtros/paginación
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProductos();
    }, 100);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    prodPage,
    prodLimit,
    prodSort,
    prodOrder,
    onlyLowStock,
    verInactivos,
    debouncedProdQuery,
    precioMin,
    precioMax,
  ]);

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
      toast({
        status: "success",
        title: "Producto creado",
        duration: 1500,
      });
      setNewProd({
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        categoria: "",
      });
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
      toast({
        status: "success",
        title: `Producto #${p.id} guardado`,
        duration: 1200,
      });
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
      arr.forEach((file) => {
        fd.append("imagenes", file);
      });

      if (alt) {
        fd.append("alt_text", alt);
      }

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
      await api.patch(
        `/productos/${galleryProduct.id}/imagenes/${img.id}/principal`
      );

      toast({
        status: "success",
        title: "Imagen principal actualizada",
        duration: 1500,
      });

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

  /* ====== Render ====== */
  const pageStyles = {
    bgGradient: pageBg,
    minH: "100%",
    pb: 4,
  };

  return (
    <Box {...pageStyles}>
      {/* barra de estado global cuando recarga tabla */}
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

      {/* ===== Crear producto (solo botón + modal) ===== */}
      <SectionCard
        title="Gestión de productos"
        subtitle="Crea nuevos productos y mantenlos actualizados. Esta sección está pensada para que el administrador trabaje rápido y sin confundirse."
      >
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Text fontSize="sm" color={subtle}>
            Usa el botón para registrar un nuevo producto en el catálogo. Podrás
            definir nombre, categoría, precio, stock y descripción en la ventana
            emergente.
          </Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="yellow"
            variant="solid"
            onClick={onOpenCreate}
          >
            Crear nuevo producto
          </Button>
        </HStack>
      </SectionCard>

      {/* ===== Listado productos + filtros ===== */}
      <SectionCard
        title="Listado de productos"
        subtitle="Filtra por nombre, precio y estado. Los filtros se aplican automáticamente al modificarlos."
      >
        {/* --- Filtros claros y agrupados --- */}
        <Box mb={4}>
          <VStack align="stretch" spacing={3}>
            <Text fontSize="sm" color={subtle}>
              1. Escribe un nombre o palabra clave, 2. Ajusta el rango de
              precios si lo necesitas, 3. Elige cómo ordenar y qué productos
              mostrar. Todo se actualiza automáticamente.
            </Text>

            {/* Fila 1: búsqueda + rango de precio */}
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
            >
              <Box flex="1">
                <Text fontSize="xs" mb={1} color={subtle}>
                  Buscar por nombre
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    id="search-products"
                    placeholder="Ej: taladro, tornillo, pintura blanca"
                    value={prodQuery}
                    onChange={(e) => {
                      setProdQuery(e.target.value);
                      setProdPage(1);
                    }}
                    aria-label="Buscar productos"
                  />
                </InputGroup>
              </Box>

              <Box flex="1">
                <Text fontSize="xs" mb={1} color={subtle}>
                  Rango de precio (COP)
                </Text>
                <HStack spacing={2}>
                  <NumberInput
                    maxW="140px"
                    min={0}
                    value={precioMin}
                    onChange={(_, v) => {
                      setPrecioMin(v || "");
                      setProdPage(1);
                    }}
                  >
                    <NumberInputField
                      placeholder="Mínimo"
                      aria-label="Precio mínimo"
                    />
                  </NumberInput>
                  <Text>—</Text>
                  <NumberInput
                    maxW="140px"
                    min={0}
                    value={precioMax}
                    onChange={(_, v) => {
                      setPrecioMax(v || "");
                      setProdPage(1);
                    }}
                  >
                    <NumberInputField
                      placeholder="Máximo"
                      aria-label="Precio máximo"
                    />
                  </NumberInput>
                </HStack>
              </Box>
            </Stack>

            {/* Fila 2: ordenar */}
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
            >
              <Box flex="1">
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
                  maxW={{ base: "100%", md: "220px" }}
                >
                  <option value="created_at">Fecha de creación</option>
                  <option value="nombre">Nombre</option>
                  <option value="precio">Precio</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="xs" mb={1} color={subtle}>
                  Dirección del orden
                </Text>
                <Select
                  maxW={{ base: "100%", md: "140px" }}
                  value={prodOrder}
                  onChange={(e) => {
                    setProdOrder(e.target.value);
                    setProdPage(1);
                  }}
                  aria-label="Dirección de orden"
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </Select>
              </Box>
            </Stack>

            {/* Fila 3: estado / visibilidad + limpiar */}
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={3}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
            >
              <VStack align="stretch" spacing={2}>
                <HStack>
                  <Switch
                    isChecked={onlyLowStock}
                    onChange={(e) => {
                      setOnlyLowStock(e.target.checked);
                      setProdPage(1);
                    }}
                    aria-label="Filtrar por bajo stock"
                  />
                  <Text fontSize="sm" color={subtle}>
                    Mostrar solo productos con stock bajo (≤ 5)
                  </Text>
                </HStack>

                <HStack>
                  <Switch
                    isChecked={verInactivos}
                    onChange={(e) => {
                      setVerInactivos(e.target.checked);
                      setProdPage(1);
                    }}
                    aria-label="Mostrar también productos inactivos"
                  />
                  <Text fontSize="sm" color={subtle}>
                    Incluir productos inactivos en el listado
                  </Text>
                </HStack>
              </VStack>

              <Box>
                <Tooltip label="Restablecer todos los filtros a sus valores por defecto">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FiFilter />}
                    onClick={clearFilters}
                  >
                    Limpiar filtros
                  </Button>
                </Tooltip>
              </Box>
            </Stack>
          </VStack>
        </Box>

        {/* --- Tabla --- */}
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead
              position="sticky"
              top={0}
              zIndex={1}
              bg={tableHeadBg}
              backdropFilter="blur(6px)"
            >
              <Tr>
                <Th>ID</Th>
                <Th>Nombre</Th>
                <Th isNumeric>Precio</Th>
                <Th isNumeric>Stock</Th>
                <Th>Categoría</Th>
                <Th>Estado</Th>
                <Th>Imágenes</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              <AnimatePresence initial={false}>
                {loading
                  ? Array.from({ length: prodLimit }).map((_, i) => (
                      <Tr key={`sk-${i}`}>
                        <Td colSpan={8}>
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

        {/* --- Paginación --- */}
        <HStack justify="space-between" mt={3} flexWrap="wrap" rowGap={2}>
          <Text fontSize="sm" color={subtle}>
            Total de productos encontrados: {prodTotal}
          </Text>
          <HStack>
            <Text fontSize="sm" color={subtle}>
              Filas por página:
            </Text>
            <Select
              size="sm"
              value={prodLimit}
              onChange={(e) => {
                setProdPage(1);
                setProdLimit(Number(e.target.value));
              }}
              maxW="80px"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </Select>
            <Button
              size="sm"
              onClick={() => setProdPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Text fontSize="sm">Página {prodPage}</Text>
            <Button size="sm" onClick={() => setProdPage((p) => p + 1)}>
              Siguiente
            </Button>
          </HStack>
        </HStack>

        {/* --- Estado vacío --- */}
        {!loading && productos.length === 0 && (
          <EmptyState
            icon={FiSearch}
            title="Sin resultados"
            description="No encontramos productos con los filtros actuales. Prueba limpiarlos o usar un término más general."
            action={
              <Button onClick={clearFilters} leftIcon={<FiFilter />}>
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
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>Crear nuevo producto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Input
                placeholder="Nombre del producto"
                value={newProd.nombre}
                onChange={(e) =>
                  setNewProd((s) => ({
                    ...s,
                    nombre: e.target.value,
                  }))
                }
                aria-label="Nombre del producto"
              />

              <HStack spacing={3}>
                <NumberInput
                  min={0}
                  value={newProd.precio}
                  onChange={(_, v) =>
                    setNewProd((s) => ({ ...s, precio: v || 0 }))
                  }
                >
                  <NumberInputField placeholder="Precio" aria-label="Precio" />
                </NumberInput>
                <NumberInput
                  min={0}
                  value={newProd.stock}
                  onChange={(_, v) =>
                    setNewProd((s) => ({ ...s, stock: v || 0 }))
                  }
                >
                  <NumberInputField placeholder="Stock" aria-label="Stock" />
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
                  onChange={(e) =>
                    setNewProd((s) => ({
                      ...s,
                      categoria: e.target.value,
                    }))
                  }
                  aria-label="Nueva categoría"
                />
              )}

              <Box>
                <Text fontSize="sm" mb={1} color={subtle}>
                  Descripción del producto
                </Text>
                <RichDescriptionEditor
                  value={newProd.descripcion}
                  onChange={(val) =>
                    setNewProd((s) => ({ ...s, descripcion: val }))
                  }
                />
                <Text mt={1} fontSize="xs" color={subtle}>
                  Puedes aplicar negrilla, cursiva y listas. El texto se guarda
                  como HTML para mostrarlo luego en la ficha del cliente.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClose={onCloseCreate}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
              leftIcon={<FiPlus />}
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
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent>
          <ModalHeader>
            Editar producto {editProduct ? `#${editProduct.id}` : ""}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Input
                placeholder="Nombre del producto"
                value={editForm.nombre}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, nombre: e.target.value }))
                }
                aria-label="Nombre del producto"
              />

              <HStack spacing={3}>
                <NumberInput
                  min={0}
                  value={editForm.precio}
                  onChange={(_, v) =>
                    setEditForm((s) => ({ ...s, precio: v || 0 }))
                  }
                  flex="1"
                >
                  <NumberInputField placeholder="Precio" aria-label="Precio" />
                </NumberInput>
                <NumberInput
                  min={0}
                  value={editForm.stock}
                  onChange={(_, v) =>
                    setEditForm((s) => ({ ...s, stock: v || 0 }))
                  }
                  flex="1"
                >
                  <NumberInputField placeholder="Stock" aria-label="Stock" />
                </NumberInput>
              </HStack>

              <Select
                placeholder="Selecciona categoría"
                value={editForm.categoria || ""}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, categoria: e.target.value }))
                }
                aria-label="Categoría"
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
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, activo: e.target.checked }))
                  }
                />
                <Text fontSize="sm">
                  {editForm.activo ? "Producto activo" : "Producto inactivo"}
                </Text>
              </HStack>

              <Box>
                <Text fontSize="sm" mb={1} color={subtle}>
                  Descripción del producto
                </Text>
                <RichDescriptionEditor
                  value={editForm.descripcion}
                  onChange={(val) =>
                    setEditForm((s) => ({ ...s, descripcion: val }))
                  }
                />
                <Text mt={1} fontSize="xs" color={subtle}>
                  Esta descripción se guarda como HTML. Luego puedes mostrarla
                  tal cual al cliente en la ficha de producto.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseEdit}>
              Cancelar
            </Button>
            <Button
              colorScheme="yellow"
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
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
        <ModalContent>
          <ModalHeader>
            Imágenes de{" "}
            {galleryProduct?.nombre || `producto #${galleryProduct?.id || ""}`}
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
                  const isPrincipal =
                    img.es_principal === 1 || img.es_principal === true;

                  return (
                    <Box
                      key={img.id || img.url}
                      borderRadius="md"
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

                      <VStack align="stretch" spacing={1} p={2}>
                        {img.alt_text && (
                          <Text fontSize="xs" noOfLines={2} color={subtle}>
                            {img.alt_text}
                          </Text>
                        )}

                        <Button
                          size="xs"
                          leftIcon={<FiStar />}
                          variant={isPrincipal ? "solid" : "outline"}
                          colorScheme={isPrincipal ? "yellow" : "gray"}
                          isDisabled={isPrincipal}
                          isLoading={savingPrincipalId === img.id}
                          onClick={() => handleSetPrincipal(img)}
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
            <Button onClick={onCloseGallery}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
      <Box as="hr" borderColor={borderCo} mb={3} />
      {children}
    </MotionBox>
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
    <VStack spacing={2} py={6} color={subtle}>
      <IconCmp size={24} />
      <Heading size="sm">{title}</Heading>
      <Text fontSize="sm" textAlign="center">
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

  // Sincroniza el contenido inicial cuando cambia el value desde afuera (ej: abrir modal)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!value) {
      if (el.innerHTML !== "") el.innerHTML = "";
    } else if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

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

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    onChange?.(html);
  };

  const computeIsEmpty = () => {
    const raw = value || "";
    const textOnly = raw.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    return textOnly.length === 0;
  };

  const isEmpty = computeIsEmpty();

  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" borderColor={borderColor}>
      <HStack
        spacing={1}
        px={2}
        py={1}
        borderBottomWidth="1px"
        bg={toolbarBg}
      >
        <Tooltip label="Negrilla">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Negrilla"
            icon={<Text as="span" fontWeight="bold">B</Text>}
            onClick={() => exec("bold")}
          />
        </Tooltip>

        <Tooltip label="Cursiva">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Cursiva"
            icon={<Text as="span" fontStyle="italic">I</Text>}
            onClick={() => exec("italic")}
          />
        </Tooltip>

        <Tooltip label="Subrayado">
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Subrayado"
            icon={<Text as="span" textDecor="underline">U</Text>}
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
