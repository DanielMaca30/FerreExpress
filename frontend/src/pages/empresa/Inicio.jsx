// src/pages/empresa/BeneficiosEmpresa.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
  AlertDialogHeader, AlertDialogOverlay,
  Badge, Box, Button, Card, CardBody, Container, Divider, Flex,
  Heading, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement,
  InputRightElement, Progress, SimpleGrid, Skeleton, Stack, Table,
  TableContainer, Tbody, Td, Text, Th, Thead, Tooltip, Tr, Tag, VStack,
  useColorModeValue, useOutsideClick, usePrefersReducedMotion, useToast,
} from "@chakra-ui/react";
import {
  FiActivity, FiAlertTriangle, FiBox, FiCheckCircle, FiFileText,
  FiInfo, FiLayers, FiPlus, FiRefreshCw, FiSearch, FiShoppingBag,
  FiTag, FiTrash2, FiX, FiZap, FiCalendar, FiUser, FiMail,
} from "react-icons/fi";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import PromoHeroFadeBanner from "../public/PromoHeroFadeBanner";

const MotionBox = motion.create(Box);
const MotionTr  = motion.create(Tr);
const ferreYellow = "#F9BF20";
const IVA_RATE    = 0.19;

const makeSpring = (r) => r ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32, mass: 0.7 };
const fadeUp  = (r) => ({ hidden: { opacity:0, y:10, filter:"blur(6px)" }, show: { opacity:1, y:0, filter:"blur(0px)", transition:{...makeSpring(r), duration:r?0:0.38} } });
const fadeIn  = (r) => ({ hidden: { opacity:0, filter:"blur(6px)" }, show: { opacity:1, filter:"blur(0px)", transition:{...makeSpring(r), duration:r?0:0.35} } });
const stagger = (r) => ({ hidden:{}, show:{ transition: r?{}:{ staggerChildren:0.06, delayChildren:0.04 } } });
const pressable = (r) => ({ whileHover:r?{}:{y:-2,scale:1.01}, whileTap:r?{}:{scale:0.985}, transition:r?{duration:0}:{type:"spring",stiffness:520,damping:30,mass:0.6} });

function formatCurrency(v) { return Number(v||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}); }
function normalizeText(s)  { return String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim(); }
function clamp(n,mn,mx)    { if(!Number.isFinite(n))return mn; return Math.max(mn,Math.min(mx,n)); }
function estadoPedidoMeta(raw) {
  switch(String(raw||"").toUpperCase()){
    case"PENDIENTE":  return{label:"Pendiente", progress:20, scheme:"yellow"};
    case"CONFIRMADO": return{label:"Confirmado",progress:45, scheme:"blue"};
    case"ENVIADO":    return{label:"Enviado",   progress:75, scheme:"purple"};
    case"ENTREGADO":  return{label:"Entregado", progress:100,scheme:"green"};
    case"CANCELADO":  return{label:"Cancelado", progress:0,  scheme:"red"};
    default:          return{label:"En proceso",progress:40, scheme:"gray"};
  }
}

function GlassCard({children,...props}){
  const bg=useColorModeValue("whiteAlpha.900","blackAlpha.400");
  const bc=useColorModeValue("blackAlpha.100","whiteAlpha.200");
  const sh=useColorModeValue("0 18px 60px rgba(0,0,0,0.10)","0 18px 60px rgba(0,0,0,0.35)");
  return <Box bg={bg} border="1px solid" borderColor={bc} backdropFilter="blur(18px)" boxShadow={sh} {...props}>{children}</Box>;
}

function KpiCard({label,value,icon,isLoading}){
  const muted=useColorModeValue("gray.600","gray.400");
  const bc=useColorModeValue("blackAlpha.100","whiteAlpha.200");
  const ibg=useColorModeValue("whiteAlpha.800","blackAlpha.500");
  return(
    <MotionBox variants={fadeUp(false)}>
      <GlassCard rounded="2xl" overflow="hidden">
        <Card bg="transparent" border="none">
          <CardBody p={5}>
            <HStack justify="space-between" align="start">
              <Box>
                <Text fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{label}</Text>
                {isLoading?<Skeleton mt={2} h="28px" w="130px" rounded="md"/>:<Text mt={1} fontSize="2xl" fontWeight="black" lineHeight="1">{value}</Text>}
              </Box>
              <Box border="1px solid" borderColor={bc} bg={ibg} rounded="xl" p={2.5}><Icon as={icon}/></Box>
            </HStack>
          </CardBody>
        </Card>
      </GlassCard>
    </MotionBox>
  );
}

// DiscountBanner compacto — pills horizontales, sin barra de progreso
function DiscountBanner({reglas, loadingReglas, items, borderColor, muted}){
  const rm = usePrefersReducedMotion();

  // Todos los hooks al tope — nunca dentro de condicionales
  const panelBg      = useColorModeValue("gray.50",    "blackAlpha.300");
  const pillBg       = useColorModeValue("white",      "blackAlpha.400");
  const pillBorder   = useColorModeValue("gray.200",   "whiteAlpha.200");
  const greenPillBg  = useColorModeValue("green.50",   "green.900");
  const greenBorder  = useColorModeValue("green.200",  "green.600");
  const yellowAccent = useColorModeValue("yellow.500", "yellow.300");
  const skeletonClr  = useColorModeValue("gray.100",   "whiteAlpha.100");

  if(loadingReglas){
    return(
      <HStack spacing={2} p={3} rounded="xl" border="1px solid" borderColor={borderColor} bg={panelBg} flexWrap="wrap">
        <Skeleton h="28px" w="40px" rounded="full" startColor={skeletonClr}/>
        <Skeleton h="28px" w="150px" rounded="full" startColor={skeletonClr}/>
        <Skeleton h="28px" w="150px" rounded="full" startColor={skeletonClr}/>
      </HStack>
    );
  }
  if(!reglas.length) return null;

  const reglaMP = reglas.find(r => r.tipo === "MISMO_PRODUCTO");
  const reglaVP = reglas.find(r => r.tipo === "VARIOS_PRODUCTOS");

  const calificaMP = reglaMP && items.some(i => Number(i.cantidad) >= Number(reglaMP.umbral_cantidad));
  const calificaVP = reglaVP && items.length >= Number(reglaVP.umbral_items);
  const calificaAlguna = calificaMP || calificaVP;

  const maxCant = items.length ? Math.max(...items.map(i => Number(i.cantidad))) : 0;

  const Pill = ({ regla, califica, labelCorto, textoCorto, tooltipDetalle }) => (
    <Tooltip
      hasArrow
      placement="bottom"
      label={
        <Box p={1} maxW="200px">
          <Text fontSize="xs" fontWeight="bold" mb={0.5}>{tooltipDetalle}</Text>
          <Text fontSize="10px" opacity={0.85}>
            {califica ? "✓ Condición cumplida — se aplica al generar" : "Aún no alcanza el umbral"}
          </Text>
        </Box>
      }
    >
      <HStack
        as="span"
        display="inline-flex"
        spacing={1.5}
        px={3}
        py={1.5}
        rounded="full"
        border="1px solid"
        cursor="default"
        userSelect="none"
        bg={califica ? greenPillBg : pillBg}
        borderColor={califica ? greenBorder : pillBorder}
        transition="box-shadow 0.15s"
        _hover={{ boxShadow: "sm" }}
      >
        <Icon
          as={califica ? FiCheckCircle : FiTag}
          boxSize="12px"
          color={califica ? "green.400" : yellowAccent}
          flexShrink={0}
        />
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={califica ? "green.600" : muted}
          whiteSpace="nowrap"
        >
          {califica ? "✓ " : ""}-{regla.porcentaje}% {labelCorto}
        </Text>
        <Text fontSize="10px" color={muted} whiteSpace="nowrap" opacity={0.8}>
          · {textoCorto}
        </Text>
        {califica && (
          <Badge colorScheme="green" variant="solid" fontSize="9px" rounded="full" px={1.5} py={0}>
            Activo
          </Badge>
        )}
      </HStack>
    </Tooltip>
  );

  return(
    <MotionBox
      initial={{opacity:0, y:4}}
      animate={{opacity:1, y:0}}
      transition={makeSpring(rm)}
    >
      <HStack
        spacing={2}
        px={3}
        py={2}
        rounded="xl"
        border="1px solid"
        borderColor={calificaAlguna ? greenBorder : borderColor}
        bg={panelBg}
        flexWrap="wrap"
        align="center"
        minH="44px"
      >
        {/* Etiqueta izquierda */}
        <HStack spacing={1} flexShrink={0}>
          <Icon as={calificaAlguna ? FiZap : FiTag} boxSize="12px" color={calificaAlguna ? "green.400" : yellowAccent}/>
          <Text fontSize="10px" fontWeight="bold" color={muted} letterSpacing="wider" textTransform="uppercase" whiteSpace="nowrap">
            Descuentos B2B
          </Text>
        </HStack>

        <Box h="16px" w="1px" bg={borderColor} flexShrink={0} display={{base:"none", sm:"block"}}/>

        {/* Pills */}
        <HStack spacing={2} flexWrap="wrap" flex={1}>
          {reglaMP && (
            <Pill
              regla={reglaMP}
              califica={calificaMP}
              labelCorto="volumen"
              textoCorto={calificaMP
                ? `${maxCant} uds.`
                : `${maxCant}/${reglaMP.umbral_cantidad} uds.`}
              tooltipDetalle={`${reglaMP.umbral_cantidad}+ unidades del mismo producto`}
            />
          )}
          {reglaVP && (
            <Pill
              regla={reglaVP}
              califica={calificaVP}
              labelCorto="variedad"
              textoCorto={calificaVP
                ? `${items.length} productos`
                : `${items.length}/${reglaVP.umbral_items} productos`}
              tooltipDetalle={`${reglaVP.umbral_items}+ productos distintos en la proforma`}
            />
          )}
        </HStack>

        {/* Indicador derecho cuando aplica */}
        {calificaAlguna && (
          <HStack spacing={1} flexShrink={0} ml="auto">
            <Icon as={FiZap} color="green.400" boxSize="11px"/>
            <Text fontSize="10px" color="green.500" fontWeight="bold" whiteSpace="nowrap">
              Se aplica al generar
            </Text>
          </HStack>
        )}
      </HStack>
    </MotionBox>
  );
}

// Cabecera estilo proforma
function ProformaHeader({ user, borderColor, muted }) {
  const headerBg   = useColorModeValue("gray.50",  "blackAlpha.400");
  const accentBg   = useColorModeValue("gray.900", "blackAlpha.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const dividerClr = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

  const today    = new Date();
  const vigencia = new Date(today); vigencia.setDate(today.getDate()+7);
  const fmtDate  = (d) => d.toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"});

  return(
    <Box bg={headerBg} rounded="2xl" border="1px solid" borderColor={borderColor} overflow="hidden" mb={5}>
      <Flex direction={{base:"column",md:"row"}} align={{base:"start",md:"center"}} justify="space-between"
        px={{base:4,md:6}} py={4} gap={4} borderBottom="1px solid" borderColor={dividerClr}>
        <HStack spacing={3} align="start">
          <Box bg={ferreYellow} rounded="lg" p={2} flexShrink={0}>
            <Text fontSize="sm" fontWeight="black" color="black" lineHeight="1">FE</Text>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="black" lineHeight="1.2">FerreExpress S.A.S.</Text>
            <Text fontSize="10px" color={labelColor}>NIT 805.030.111-8 · Calle 16 #76-28, Cali</Text>
            <Text fontSize="10px" color={labelColor}>+57 (302) 804 3116 · expressraquel@gmail.com</Text>
          </Box>
        </HStack>
        <Box textAlign={{base:"left",md:"right"}}>
          <Box display="inline-flex" alignItems="center" gap={2}
            bg={accentBg} color="white" px={3} py={1.5} rounded="xl">
            <FiFileText size={13}/>
            <Text fontSize="xs" fontWeight="black" letterSpacing="wider">PROFORMA EN BORRADOR</Text>
          </Box>
          <Text fontSize="10px" color={labelColor} mt={1}>El número se asignará al generar</Text>
        </Box>
      </Flex>
      <SimpleGrid columns={{base:1,md:2}} px={{base:4,md:6}} py={3} gap={4}>
        <Box>
          <Text fontSize="9px" fontWeight="bold" color={labelColor} letterSpacing="wider" textTransform="uppercase" mb={1.5}>Cliente</Text>
          <HStack spacing={2} mb={0.5}>
            <Icon as={FiUser} boxSize={3} color={labelColor}/>
            <Text fontSize="xs" fontWeight="bold">{user?.razon_social||user?.nombre||user?.username||"—"}</Text>
          </HStack>
          <HStack spacing={2}>
            <Icon as={FiMail} boxSize={3} color={labelColor}/>
            <Text fontSize="10px" color={muted}>{user?.email||"—"}</Text>
          </HStack>
        </Box>
        <Box>
          <Text fontSize="9px" fontWeight="bold" color={labelColor} letterSpacing="wider" textTransform="uppercase" mb={1.5}>Vigencia</Text>
          <HStack spacing={2} mb={0.5}>
            <Icon as={FiCalendar} boxSize={3} color={labelColor}/>
            <Text fontSize="10px" color={muted}>Emisión: <Text as="span" fontWeight="bold">{fmtDate(today)}</Text></Text>
          </HStack>
          <HStack spacing={2}>
            <Icon as={FiCalendar} boxSize={3} color={labelColor}/>
            <Text fontSize="10px" color={muted}>Válida hasta: <Text as="span" fontWeight="bold">{fmtDate(vigencia)}</Text></Text>
          </HStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

function CotizadorPro({onCotizacionCreada}){
  const toast = useToast();
  const rm    = usePrefersReducedMotion();
  const { user } = useAuth();

  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [items,             setItems]             = useState([]);
  const [reglas,            setReglas]            = useState([]);
  const [loadingReglas,     setLoadingReglas]     = useState(true);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [loadingCatalogo,   setLoadingCatalogo]   = useState(true);
  const [creando,           setCreando]           = useState(false);
  const [isDropdownOpen,    setDropdownOpen]      = useState(false);
  const [activeIndex,       setActiveIndex]       = useState(0);
  const [isClearOpen,       setClearOpen]         = useState(false);

  const cancelClearRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef    = useRef(null);

  const muted          = useColorModeValue("gray.600","gray.400");
  const mutedLight     = useColorModeValue("gray.400","gray.600");
  const softBg         = useColorModeValue("gray.50","blackAlpha.500");
  const borderColor    = useColorModeValue("blackAlpha.100","whiteAlpha.200");
  const hoverBg        = useColorModeValue("yellow.50","whiteAlpha.100");
  const dropdownBg     = useColorModeValue("white","gray.900");
  const theadBg        = useColorModeValue("gray.800","gray.900");
  const theadColor     = useColorModeValue("white","gray.100");
  const tableBg        = useColorModeValue("white","blackAlpha.400");
  const tableStripe    = useColorModeValue("gray.50","blackAlpha.200");
  const resumeBg       = useColorModeValue("gray.50","blackAlpha.400");
  const resumeBorder   = useColorModeValue("blackAlpha.100","whiteAlpha.200");
  const totalLineBg    = useColorModeValue("gray.900","blackAlpha.700");
  const emptyColor     = useColorModeValue("gray.400","gray.500");
  const emptyBoxBg     = useColorModeValue("gray.50","blackAlpha.500");
  const inputBg        = useColorModeValue("white","blackAlpha.500");
  const tipBg          = useColorModeValue("blue.50","blackAlpha.300");
  const tipBorder      = useColorModeValue("blue.100","whiteAlpha.100");
  const dropItemBorder = useColorModeValue("gray.50","whiteAlpha.100");
  const yellowShadow   = useColorModeValue("0 10px 24px rgba(249,191,32,.25)","0 10px 24px rgba(249,191,32,.12)");
  const toastBg        = useColorModeValue("white","gray.900");
  const toastBorder    = useColorModeValue("gray.200","gray.700");
  const toastMuted     = useColorModeValue("gray.600","gray.400");
  const toastBarBg     = useColorModeValue("gray.100","whiteAlpha.200");
  const discountRowBg  = useColorModeValue("green.50","whiteAlpha.50");
  const discountClr    = useColorModeValue("green.600","green.300");
  const savingsBg      = useColorModeValue("green.50","green.900");
  const savingsBorder  = useColorModeValue("green.200","green.700");
  const sectionLabelClr= useColorModeValue("gray.500","gray.400");

  useOutsideClick({ref:dropdownRef, handler:()=>setDropdownOpen(false)});

  const UNDO_TTL_MS   = 12000;
  const UNDO_TOAST_ID = "cotizador-undo-toast";
  const itemsRef      = useRef([]);
  useEffect(()=>{ itemsRef.current = items; },[items]);
  const undoRef      = useRef(null);
  const undoTimerRef = useRef(null);

  const cloneItems = useCallback((arr)=>{
    try{ return structuredClone(arr); }
    catch{ return (arr||[]).map(x=>({...x})); }
  },[]);

  const openUndoToast = useCallback((snapshot, message)=>{
    if(undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoRef.current = { snapshot, ts: Date.now() };
    undoTimerRef.current = setTimeout(()=>{ undoRef.current = null; }, UNDO_TTL_MS+50);
    toast({
      id: UNDO_TOAST_ID, position:"top-right", duration:UNDO_TTL_MS, isClosable:true,
      render:({onClose})=>(
        <motion.div initial={{opacity:0,y:-8,filter:"blur(6px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} exit={{opacity:0,y:-8,filter:"blur(6px)"}} transition={makeSpring(rm)}>
          <Box bg={toastBg} border="1px solid" borderColor={toastBorder} rounded="2xl" p={3} shadow="2xl">
            <HStack justify="space-between" align="start" spacing={3}>
              <Box>
                <Text fontWeight="black" fontSize="sm">{message}</Text>
                <Text fontSize="xs" color={toastMuted} mt={0.5}>Deshacer disponible por {Math.round(UNDO_TTL_MS/1000)}s</Text>
                <Box mt={2} h="2px" bg={toastBarBg} rounded="full" overflow="hidden">
                  <motion.div initial={{width:"100%"}} animate={{width:0}} transition={rm?{duration:0}:{duration:UNDO_TTL_MS/1000,ease:"linear"}} style={{height:"100%",background:ferreYellow}}/>
                </Box>
              </Box>
              <HStack>
                <Button size="sm" variant="outline" rounded="xl" onClick={()=>{
                  const u=undoRef.current; if(!u?.snapshot) return;
                  setItems(u.snapshot); undoRef.current=null;
                  if(undoTimerRef.current) clearTimeout(undoTimerRef.current); onClose();
                }}>Deshacer</Button>
                <IconButton size="sm" variant="ghost" rounded="xl" aria-label="Cerrar" icon={<FiX/>} onClick={()=>{
                  undoRef.current=null; if(undoTimerRef.current) clearTimeout(undoTimerRef.current); onClose();
                }}/>
              </HStack>
            </HStack>
          </Box>
        </motion.div>
      ),
    });
  },[toast,toastBg,toastBorder,toastMuted,toastBarBg,rm]);

  useEffect(()=>()=>{ if(undoTimerRef.current) clearTimeout(undoTimerRef.current); },[]);

  useEffect(()=>{
    let c=false;
    (async()=>{
      try{
        setLoadingCatalogo(true);
        const res=await api.get("/productos",{params:{page:1,limit:220,sort:"nombre",order:"asc"}});
        const p=Array.isArray(res.data?.productos)?res.data.productos:Array.isArray(res.data)?res.data:[];
        if(!c) setProductosCatalogo(p);
      }catch(e){ if(!c){ console.error(e); toast({title:"No pudimos cargar el catálogo",status:"warning",duration:4500,isClosable:true}); } }
      finally{ if(!c) setLoadingCatalogo(false); }
    })();
    return()=>{ c=true; };
  },[toast]);

  useEffect(()=>{
    let c=false;
    (async()=>{
      try{
        setLoadingReglas(true);
        const res=await api.get("/descuentos/activas");
        if(!c) setReglas(Array.isArray(res.data)?res.data:[]);
      }catch(e){ console.error("Error cargando reglas:",e); if(!c) setReglas([]); }
      finally{ if(!c) setLoadingReglas(false); }
    })();
    return()=>{ c=true; };
  },[]);

  const productosFiltrados = useMemo(()=>{
    const term=normalizeText(searchTerm);
    if(!term) return [];
    return productosCatalogo
      .map(p=>{ const n=normalizeText(p.nombre),s=normalizeText(p.sku||p.codigo||""); return{p,score:(n.startsWith(term)?3:n.includes(term)?2:0)+(s.startsWith(term)?2:s.includes(term)?1:0)}; })
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.p);
  },[productosCatalogo,searchTerm]);

  const calculos = useMemo(()=>{
    const reglaMP=reglas.find(r=>r.tipo==="MISMO_PRODUCTO");
    const reglaVP=reglas.find(r=>r.tipo==="VARIOS_PRODUCTOS");
    const calMP=reglaMP&&items.some(i=>Number(i.cantidad)>=Number(reglaMP.umbral_cantidad));
    const calVP=reglaVP&&items.length>=Number(reglaVP.umbral_items);
    let dRate=0, dLabel="", dDesc="";
    if(calMP&&reglaMP){ dRate=Number(reglaMP.porcentaje)/100; dLabel=`${reglaMP.porcentaje}% volumen`; dDesc=`Descuento por volumen (${reglaMP.porcentaje}%)`; }
    else if(calVP&&reglaVP){ dRate=Number(reglaVP.porcentaje)/100; dLabel=`${reglaVP.porcentaje}% variedad`; dDesc=`Descuento por variedad (${reglaVP.porcentaje}%)`; }
    const totalBruto=items.reduce((acc,i)=>acc+Number(i.precio_unitario||0)*Number(i.cantidad||0),0);
    const baseGravable=totalBruto/(1+IVA_RATE);
    const ivaTotal=totalBruto-baseGravable;
    const dMonto=dRate>0?baseGravable*dRate:0;
    const baseConD=baseGravable-dMonto;
    const ivaConD=baseConD*IVA_RATE;
    const totalConD=baseConD+ivaConD;
    return{ totalBruto, baseGravable, ivaTotal, descuentoRate:dRate, descuentoLabel:dLabel, descuentoDesc:dDesc, descuentoMonto:dMonto, totalConDescuento:totalConD, ivaConDescuento:ivaConD, ahorroTotal:dMonto+(ivaTotal-ivaConD), hayDescuento:dRate>0 };
  },[items,reglas]);

  const handleAddItem = useCallback((producto)=>{
    if(!producto?.id) return;
    const snap=cloneItems(itemsRef.current);
    setItems(prev=>{
      const ex=prev.find(i=>String(i.producto_id)===String(producto.id));
      const pu=Number(producto.precio??producto.precio_unitario??0);
      const sk=producto.sku||producto.codigo||"S/R";
      if(ex) return prev.map(i=>String(i.producto_id)===String(producto.id)?{...i,cantidad:clamp(Number(i.cantidad)+1,1,999)}:i);
      return [...prev,{producto_id:producto.id,nombre:producto.nombre||"Producto",sku:sk,precio_unitario:pu,cantidad:1}];
    });
    setSearchTerm(""); setActiveIndex(0); setDropdownOpen(false);
    requestAnimationFrame(()=>searchInputRef.current?.focus());
    openUndoToast(snap,"Producto agregado (+1)");
  },[cloneItems,openUndoToast]);

  const updateQty  = useCallback((id,v)=>{ setItems(prev=>prev.map(i=>i.producto_id===id?{...i,cantidad:clamp(Number(v),1,999)}:i)); },[]);
  const removeItem = useCallback((id)=>{ const s=cloneItems(itemsRef.current); setItems(prev=>prev.filter(x=>x.producto_id!==id)); openUndoToast(s,"Producto eliminado"); },[cloneItems,openUndoToast]);
  const clearAll   = useCallback(()=>{ const s=cloneItems(itemsRef.current); setItems([]); openUndoToast(s,"Tabla limpiada"); },[cloneItems,openUndoToast]);

  const handleSearchKeyDown = useCallback((e)=>{
    if(!isDropdownOpen&&e.key==="ArrowDown"&&productosFiltrados.length>0){ setDropdownOpen(true); setActiveIndex(0); return; }
    if(e.key==="Escape"){ setDropdownOpen(false); if(!searchTerm) searchInputRef.current?.blur(); return; }
    if(!productosFiltrados.length) return;
    if(e.key==="ArrowDown"){ e.preventDefault(); setDropdownOpen(true); setActiveIndex(i=>(i+1)%productosFiltrados.length); return; }
    if(e.key==="ArrowUp"){ e.preventDefault(); setDropdownOpen(true); setActiveIndex(i=>(i-1+productosFiltrados.length)%productosFiltrados.length); return; }
    if(e.key==="Enter"){ e.preventDefault(); const c=productosFiltrados[activeIndex]||productosFiltrados[0]; if(c) handleAddItem(c); }
  },[activeIndex,handleAddItem,isDropdownOpen,productosFiltrados,searchTerm]);

  const handleCrear = useCallback(async()=>{
    if(!items.length){ toast({title:"Proforma vacía",description:"Agrega al menos un material para continuar.",status:"info",duration:3000}); return; }
    try{
      setCreando(true);
      const res=await api.post("/cotizaciones",{productos:items.map(i=>({producto_id:i.producto_id,cantidad:i.cantidad}))});
      const data=res.data;
      setItems([]); onCotizacionCreada?.();
      toast({ title:"¡Proforma generada!", description:`Total: ${formatCurrency(data?.total??calculos.totalBruto)}${data?.descuento>0?` · Descuento aplicado: ${formatCurrency(data.descuento)}`:""}`, status:"success", duration:6000, isClosable:true });
    }catch(e){ console.error(e); toast({title:"Error al generar la proforma",description:e?.response?.data?.error||"Intenta nuevamente.",status:"error",duration:5000,isClosable:true}); }
    finally{ setCreando(false); }
  },[items,onCotizacionCreada,toast,calculos.totalBruto]);

  const showDropdown = isDropdownOpen && normalizeText(searchTerm).length>0;

  return(
    <MotionBox variants={fadeUp(rm)}>
      <GlassCard rounded="3xl" overflow="visible">
        <Card bg="transparent" border="none">
          <CardBody p={{base:4,md:6}}>

            {/* Cabecera proforma */}
            <ProformaHeader user={user} borderColor={borderColor} muted={muted}/>

            {/* Sección: agregar materiales */}
            <Box mb={5}>
              <HStack spacing={2} mb={3} justify="space-between">
                <HStack spacing={2}>
                  <Text fontSize="10px" fontWeight="bold" color={sectionLabelClr} letterSpacing="wider" textTransform="uppercase">Agregar materiales</Text>
                  <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="gray" fontSize="9px">Enter ↑↓ Esc</Tag>
                </HStack>
                {items.length>0&&(
                  <motion.div {...pressable(rm)}>
                    <Button variant="ghost" size="xs" colorScheme="red" onClick={()=>setClearOpen(true)} leftIcon={<FiTrash2 size={12}/>} rounded="lg" fontSize="xs">Limpiar todo</Button>
                  </motion.div>
                )}
              </HStack>

              {/* Buscador — ancho completo */}
              <Box position="relative" ref={dropdownRef} zIndex={20} mb={3}>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none"><Icon as={FiSearch} color={mutedLight} boxSize={4}/></InputLeftElement>
                  <Input
                    ref={searchInputRef}
                    placeholder="Busca por nombre o SKU del producto…"
                    value={searchTerm}
                    onChange={e=>{ setSearchTerm(e.target.value); setDropdownOpen(true); setActiveIndex(0); }}
                    onFocus={()=>setDropdownOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    rounded="xl" bg={softBg} border="1px solid" borderColor={borderColor}
                    focusBorderColor={ferreYellow} _placeholder={{color:mutedLight,fontSize:"sm"}}
                  />
                  {searchTerm&&(
                    <InputRightElement>
                      <motion.div {...pressable(rm)}>
                        <IconButton aria-label="Limpiar" icon={<FiX/>} size="sm" variant="ghost" rounded="lg"
                          onClick={()=>{ setSearchTerm(""); setDropdownOpen(false); setActiveIndex(0); requestAnimationFrame(()=>searchInputRef.current?.focus()); }}/>
                      </motion.div>
                    </InputRightElement>
                  )}
                </InputGroup>

                <AnimatePresence>
                  {showDropdown&&(
                    <MotionBox
                      initial={{opacity:0,y:-10,filter:"blur(8px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} exit={{opacity:0,y:-10,filter:"blur(8px)"}}
                      transition={makeSpring(rm)}
                      position="absolute" top="110%" left={0} right={0}
                      bg={dropdownBg} shadow="2xl" rounded="2xl" border="1px solid" borderColor={borderColor} zIndex={30} overflow="hidden"
                    >
                      <Box px={4} py={2.5} borderBottom="1px solid" borderColor={borderColor}>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color={muted}>{loadingCatalogo?"Cargando catálogo…":`${productosFiltrados.length} resultado(s)`}</Text>
                          <Tooltip label="Busca por nombre completo o código SKU" hasArrow placement="left">
                            <HStack spacing={1} color={muted} cursor="default"><FiInfo size={11}/><Text fontSize="xs">Ayuda</Text></HStack>
                          </Tooltip>
                        </HStack>
                      </Box>
                      {loadingCatalogo?(
                        <Box p={4}><Stack spacing={2}><Skeleton h="18px" rounded="md"/><Skeleton h="18px" rounded="md"/><Skeleton h="18px" rounded="md"/></Stack></Box>
                      ):!productosFiltrados.length?(
                        <Box p={6} textAlign="center" color={muted}>
                          <Box mx="auto" mb={2} boxSize="40px" rounded="full" bg={emptyBoxBg} display="flex" alignItems="center" justifyContent="center"><FiSearch/></Box>
                          <Text fontSize="sm" fontWeight="black">Sin resultados</Text>
                          <Text fontSize="xs" mt={1}>Prueba con "PVC", "Tornillo", "Cemento" o el SKU del ítem.</Text>
                        </Box>
                      ):(
                        <Box maxH="300px" overflowY="auto">
                          {productosFiltrados.map((p,idx)=>{
                            const isActive=idx===activeIndex;
                            const psiva=Number(p.precio)/(1+IVA_RATE);
                            return(
                              <motion.div key={p.id} layout transition={makeSpring(rm)}>
                                <Flex px={4} py={3} align="center" justify="space-between"
                                  borderBottom="1px solid" borderColor={dropItemBorder}
                                  bg={isActive?hoverBg:"transparent"} _hover={{bg:hoverBg,cursor:"pointer"}}
                                  onMouseEnter={()=>setActiveIndex(idx)} onClick={()=>handleAddItem(p)}>
                                  <Box minW={0} flex={1}>
                                    <Text fontWeight="black" fontSize="sm" noOfLines={1}>{p.nombre}</Text>
                                    <HStack spacing={2} mt={0.5} flexWrap="wrap">
                                      <Badge fontSize="10px" colorScheme="gray" variant="subtle">{p.sku||p.codigo||"S/R"}</Badge>
                                      <Text fontSize="xs" color={muted}>{formatCurrency(psiva)}<Text as="span" fontSize="9px" opacity={0.7}> s/IVA</Text></Text>
                                      <Text fontSize="xs" color={muted} opacity={0.6}>· {formatCurrency(p.precio)}<Text as="span" fontSize="9px" opacity={0.7}> c/IVA</Text></Text>
                                    </HStack>
                                  </Box>
                                  <Icon as={FiPlus} color="yellow.500" flexShrink={0} ml={2}/>
                                </Flex>
                              </motion.div>
                            );
                          })}
                        </Box>
                      )}
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>

              {/* DiscountBanner — debajo del buscador, ancho completo, una sola línea */}
              <DiscountBanner
                reglas={reglas}
                loadingReglas={loadingReglas}
                items={items}
                borderColor={borderColor}
                muted={muted}
              />
            </Box>

            {/* Detalle de la proforma */}
            <Box mb={4}>
              <Text fontSize="10px" fontWeight="bold" color={sectionLabelClr} letterSpacing="wider" textTransform="uppercase" mb={3}>
                Detalle de la proforma
              </Text>
              <Box rounded="xl" overflow="hidden" border="1px solid" borderColor={borderColor}>
                <TableContainer bg={tableBg} overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr bg={theadBg}>
                        <Th color={theadColor} borderColor="transparent" fontSize="10px" letterSpacing="wider">Producto</Th>
                        <Th color={theadColor} borderColor="transparent" isNumeric fontSize="10px" letterSpacing="wider">Cant.</Th>
                        {/* Precio unit oculto en móvil */}
                        <Th color={theadColor} borderColor="transparent" isNumeric fontSize="10px" letterSpacing="wider" display={{base:"none",md:"table-cell"}}>P. Unit. s/IVA</Th>
                        {/* IVA oculto en móvil */}
                        <Th color={theadColor} borderColor="transparent" isNumeric fontSize="10px" letterSpacing="wider" display={{base:"none",lg:"table-cell"}}>IVA (19%)</Th>
                        <Th color={theadColor} borderColor="transparent" isNumeric fontSize="10px" letterSpacing="wider">Subtotal</Th>
                        <Th borderColor="transparent" w="36px"/>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {!items.length?(
                        <Tr>
                          <Td colSpan={6} py={12} textAlign="center" borderColor={borderColor}>
                            <VStack color={emptyColor} spacing={2}>
                              <Box boxSize="40px" rounded="full" bg={emptyBoxBg} display="flex" alignItems="center" justifyContent="center"><FiBox size={18}/></Box>
                              <Text fontSize="sm" fontWeight="black">Sin ítems en esta proforma</Text>
                              <Text fontSize="xs">Usa el buscador de arriba para agregar materiales.</Text>
                            </VStack>
                          </Td>
                        </Tr>
                      ):(
                        <AnimatePresence>
                          {items.map((i,idx)=>{
                            const psiva  = Number(i.precio_unitario)/(1+IVA_RATE);
                            const ivaL   = psiva*IVA_RATE*Number(i.cantidad);
                            const totL   = Number(i.precio_unitario)*Number(i.cantidad);
                            const baseL  = psiva*Number(i.cantidad);
                            const descL  = calculos.hayDescuento ? baseL*calculos.descuentoRate : 0;
                            const isEven = idx%2===0;
                            // Subtotal con descuento aplicado
                            const totConD = calculos.hayDescuento
                              ? totL - descL - (ivaL - (baseL - descL) * IVA_RATE)
                              : totL;

                            return(
                              <MotionTr key={i.producto_id} layout
                                initial={{opacity:0,y:6,filter:"blur(4px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} exit={{opacity:0,y:-4,filter:"blur(4px)"}}
                                transition={makeSpring(rm)}
                                style={{display:"table-row", background: calculos.hayDescuento ? discountRowBg : isEven ? tableStripe : undefined}}>

                                {/* Producto */}
                                <Td borderColor={borderColor} maxW={{base:"140px",md:"260px"}}>
                                  <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{i.nombre}</Text>
                                  <Text fontSize="10px" color={muted}>{i.sku}</Text>
                                </Td>

                                {/* Cantidad */}
                                <Td isNumeric borderColor={borderColor}>
                                  <Box ml="auto" w={{base:"60px",md:"70px"}}>
                                    <Input value={i.cantidad}
                                      onChange={e=>{ const v=clamp(parseInt(e.target.value,10),1,999); if(!Number.isNaN(v)) updateQty(i.producto_id,v); }}
                                      onBlur={e=>{ const v=clamp(parseInt(e.target.value,10),1,999); updateQty(i.producto_id,v); }}
                                      type="number" min={1} max={999} size="sm" rounded="lg" textAlign="center"
                                      fontWeight="black" bg={inputBg} border="1px solid" borderColor={borderColor} focusBorderColor={ferreYellow}/>
                                  </Box>
                                </Td>

                                {/* Precio unit — oculto en móvil */}
                                <Td isNumeric borderColor={borderColor} fontSize="sm" display={{base:"none",md:"table-cell"}}>
                                  {formatCurrency(psiva)}
                                </Td>

                                {/* IVA línea — oculto en móvil y tablet */}
                                <Td isNumeric borderColor={borderColor} fontSize="sm" color={muted} display={{base:"none",lg:"table-cell"}}>
                                  {formatCurrency(ivaL)}
                                </Td>

                                {/* Subtotal — con tachado si hay descuento */}
                                <Td isNumeric borderColor={borderColor} p={{base:2,md:3}}>
                                  {calculos.hayDescuento ? (
                                    <VStack align="flex-end" spacing={0}>
                                      <Text fontSize="xs" color={muted} textDecoration="line-through">
                                        {formatCurrency(totL)}
                                      </Text>
                                      <Text fontWeight="black" fontSize="sm" color={discountClr}>
                                        {formatCurrency(totConD)}
                                      </Text>
                                      <Badge colorScheme="green" variant="subtle" fontSize="9px" rounded="full" px={1.5}>
                                        -{(calculos.descuentoRate*100).toFixed(0)}%
                                      </Badge>
                                    </VStack>
                                  ):(
                                    <Text fontWeight="black" fontSize="sm">{formatCurrency(totL)}</Text>
                                  )}
                                </Td>

                                {/* Eliminar */}
                                <Td isNumeric borderColor={borderColor} p={2}>
                                  <Tooltip label="Quitar ítem (se puede deshacer)" hasArrow>
                                    <motion.div {...pressable(rm)} style={{display:"inline-block"}}>
                                      <IconButton icon={<FiTrash2 size={13}/>} size="xs" variant="ghost" colorScheme="red" rounded="lg" aria-label="Eliminar" onClick={()=>removeItem(i.producto_id)}/>
                                    </motion.div>
                                  </Tooltip>
                                </Td>
                              </MotionTr>
                            );
                          })}
                        </AnimatePresence>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>

            {/* Resumen económico */}
            <AnimatePresence>
              {items.length>0&&(
                <MotionBox variants={fadeIn(rm)} initial="hidden" animate="show" exit="hidden">
                  <Flex justify="flex-end">
                    <Box w={{base:"full",md:"340px"}} rounded="xl" overflow="hidden" border="1px solid" borderColor={resumeBorder}>
                      <Box bg={resumeBg} px={4} py={2.5} borderBottom="1px solid" borderColor={resumeBorder}>
                        <Text fontSize="10px" fontWeight="bold" color={sectionLabelClr} letterSpacing="wider" textTransform="uppercase">Resumen económico</Text>
                      </Box>
                      <VStack align="stretch" spacing={0} bg={tableBg}>
                        <HStack justify="space-between" px={4} py={2.5} borderBottom="1px solid" borderColor={resumeBorder}>
                          <Text fontSize="xs" color={muted}>{items.length} ítem(s) · {items.reduce((a,i)=>a+Number(i.cantidad),0)} unidades</Text>
                        </HStack>
                        <HStack justify="space-between" px={4} py={2.5} borderBottom="1px solid" borderColor={resumeBorder}>
                          <Text fontSize="xs" color={muted}>Base gravable (sin IVA)</Text>
                          <Text fontSize="xs" fontWeight="bold">{formatCurrency(calculos.baseGravable)}</Text>
                        </HStack>
                        <HStack justify="space-between" px={4} py={2.5} borderBottom="1px solid" borderColor={resumeBorder}>
                          <Text fontSize="xs" color={muted}>IVA (19%)</Text>
                          <Text fontSize="xs" fontWeight="bold">{formatCurrency(calculos.ivaTotal)}</Text>
                        </HStack>
                        {calculos.hayDescuento&&(
                          <Box bg={savingsBg} borderBottom="1px solid" borderColor={savingsBorder}>
                            <HStack justify="space-between" px={4} py={2} borderBottom="1px solid" borderColor={savingsBorder}>
                              <HStack spacing={1}><Icon as={FiZap} color="green.400" boxSize={3}/><Text fontSize="xs" color="green.600" fontWeight="bold">{calculos.descuentoDesc}</Text></HStack>
                              <Text fontSize="xs" fontWeight="black" color="green.500">- {formatCurrency(calculos.descuentoMonto)}</Text>
                            </HStack>
                            <HStack justify="space-between" px={4} py={2}>
                              <Text fontSize="xs" color="green.600">IVA ajustado</Text>
                              <Text fontSize="xs" fontWeight="bold" color="green.500">{formatCurrency(calculos.ivaConDescuento)}</Text>
                            </HStack>
                          </Box>
                        )}
                        <HStack justify="space-between" px={4} py={3.5} bg={totalLineBg}>
                          <Text fontSize="sm" fontWeight="black" color="white">{calculos.hayDescuento?"Total con descuento":"Total cotización"}</Text>
                          <Text fontSize="lg" fontWeight="black" color={ferreYellow}>{formatCurrency(calculos.hayDescuento?calculos.totalConDescuento:calculos.totalBruto)}</Text>
                        </HStack>
                        {calculos.hayDescuento&&(
                          <HStack justify="flex-end" px={4} py={2} bg={savingsBg}>
                            <Icon as={FiCheckCircle} color="green.400" boxSize={3}/>
                            <Text fontSize="9px" color="green.600" fontWeight="bold">Ahorro total estimado: {formatCurrency(calculos.ahorroTotal)}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  </Flex>

                  {/* Nota */}
                  <Box mt={4} p={3} rounded="xl" bg={tipBg} border="1px solid" borderColor={tipBorder}>
                    <Text fontSize="10px" color={muted} lineHeight="1.7">
                      <Text as="span" fontWeight="bold">Notas: </Text>
                      Esta proforma es informativa y no constituye factura de venta · Los valores están en COP e incluyen IVA · La vigencia es de 7 días sujeta a disponibilidad de inventario{calculos.hayDescuento?" · El descuento definitivo se confirma al generar.":"."}
                    </Text>
                  </Box>

                  {/* Botón generar */}
                  <Flex justify="flex-end" mt={4}>
                    <motion.div {...pressable(rm)}>
                      <Button colorScheme="yellow" rounded="full" px={8} size="lg"
                        onClick={handleCrear} isLoading={creando} loadingText="Generando proforma…"
                        isDisabled={!items.length||creando} shadow="md" leftIcon={<FiFileText/>}>
                        Generar proforma
                      </Button>
                    </motion.div>
                  </Flex>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Botón deshabilitado cuando vacío */}
            {!items.length&&(
              <Flex justify="flex-end" mt={2}>
                <Button colorScheme="yellow" rounded="full" px={8} isDisabled shadow="md" leftIcon={<FiFileText/>}>Generar proforma</Button>
              </Flex>
            )}

            {/* Confirm limpiar */}
            <AlertDialog isOpen={isClearOpen} leastDestructiveRef={cancelClearRef} onClose={()=>setClearOpen(false)}>
              <AlertDialogOverlay/>
              <AlertDialogContent rounded="2xl">
                <AlertDialogHeader fontWeight="black">¿Limpiar la proforma?</AlertDialogHeader>
                <AlertDialogBody>Se eliminarán todos los ítems. Puedes <b>deshacer</b> después.</AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelClearRef} onClick={()=>setClearOpen(false)} rounded="xl">Cancelar</Button>
                  <Button colorScheme="red" ml={3} rounded="xl" onClick={()=>{ setClearOpen(false); clearAll(); }}>Sí, limpiar</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </CardBody>
        </Card>
      </GlassCard>
    </MotionBox>
  );
}

export default function BeneficiosEmpresa(){
  const{user}=useAuth();
  const navigate=useNavigate();
  const toast=useToast();
  const rm=usePrefersReducedMotion();
  const[data,setData]=useState({cotizaciones:[],pedidos:[],loading:true,lastUpdated:null});

  const bg          =useColorModeValue("gray.50","blackAlpha.900");
  const muted       =useColorModeValue("gray.600","gray.400");
  const borderColor =useColorModeValue("blackAlpha.100","whiteAlpha.200");
  const asesorBg    =useColorModeValue("gray.900","gray.800");
  const asesorBorder=useColorModeValue("blackAlpha.200","whiteAlpha.200");
  const emptyIconClr=useColorModeValue("gray.300","gray.500");

  const loadAll=useCallback(async()=>{
    try{
      setData(prev=>({...prev,loading:true}));
      const[cRes,pRes]=await Promise.all([api.get("/cotizaciones"),api.get("/pedidos/mios")]);
      const cotizaciones=Array.isArray(cRes.data)?cRes.data:Array.isArray(cRes.data?.cotizaciones)?cRes.data.cotizaciones:[];
      const pedidos=Array.isArray(pRes.data)?pRes.data:Array.isArray(pRes.data?.pedidos)?pRes.data.pedidos:[];
      setData({cotizaciones,pedidos,loading:false,lastUpdated:new Date()});
    }catch(e){console.error(e);setData(prev=>({...prev,loading:false}));toast({title:"No pudimos actualizar tus datos",status:"warning",duration:4500,isClosable:true});}
  },[toast]);

  useEffect(()=>{loadAll();},[loadAll]);

  const kpis=useMemo(()=>{
    const cot=data.cotizaciones||[];const ped=data.pedidos||[];
    const vigentes=cot.filter(c=>String(c.estado_vigencia||"").toUpperCase()==="VIGENTE").length;
    const pedidosActivos=ped.filter(p=>!["CANCELADO","ENTREGADO"].includes(String(p.estado||p.estado_pedido||"").toUpperCase())).length;
    const ahorro=cot.filter(c=>["ACEPTADA","CONVERTIDA"].includes(String(c.estado_gestion||"").toUpperCase())).reduce((acc,c)=>acc+Number(c.descuento||0),0);
    return{vigentes,pedidosActivos,ahorro};
  },[data.cotizaciones,data.pedidos]);

  return(
    <Box minH="100vh" bg={bg} pb={10}>
      <MotionConfig transition={makeSpring(rm)}>
        <Container maxW="1200px" pt={{base:6,md:8}}>
          <MotionBox initial="hidden" animate="show" variants={stagger(rm)}>

            {/* Header */}
            <MotionBox variants={fadeUp(rm)}>
              <Flex justify="space-between" align={{base:"start",md:"center"}} mb={7} direction={{base:"column",md:"row"}} gap={4}>
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Tag colorScheme="blue" borderRadius="full">Panel Empresas</Tag>
                    {data.lastUpdated&&<Text fontSize="xs" color={muted}>Actualizado: {data.lastUpdated.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"})}</Text>}
                  </HStack>
                  <Heading size="xl" fontWeight="black" letterSpacing="tight">¡Bienvenido, {user?.nombre?.split(" ")[0]||user?.razon_social||"Empresa"}! 👷‍♂️</Heading>
                  <Text color={muted} fontSize="sm">Gestiona suministros, cotizaciones y pedidos con control total.</Text>
                </VStack>
                <HStack spacing={3} w={{base:"full",md:"auto"}}>
                  <motion.div {...pressable(rm)} style={{width:"100%"}}>
                    <Button leftIcon={<FiLayers/>} variant="solid" bg="gray.800" color="white" _hover={{bg:"black"}} rounded="full" px={6} onClick={()=>navigate("/empresa/catalogo")} w={{base:"full",md:"auto"}}>Ver catálogo</Button>
                  </motion.div>
                  <Tooltip label="Actualizar datos" hasArrow>
                    <motion.div {...pressable(rm)} style={{display:"inline-block"}}>
                      <IconButton aria-label="Actualizar" icon={<FiRefreshCw/>} onClick={loadAll} rounded="full" variant="outline" isLoading={data.loading}/>
                    </motion.div>
                  </Tooltip>
                </HStack>
              </Flex>
            </MotionBox>

            {/* KPIs */}
            <MotionBox variants={stagger(rm)}>
              <SimpleGrid columns={{base:1,md:3}} spacing={4} mb={8}>
                <KpiCard label="Cotizaciones vigentes" value={kpis.vigentes} icon={FiFileText} isLoading={data.loading}/>
                <KpiCard label="Pedidos en curso" value={kpis.pedidosActivos} icon={FiActivity} isLoading={data.loading}/>
                <KpiCard label="Ahorro acumulado" value={formatCurrency(kpis.ahorro)} icon={FiCheckCircle} isLoading={data.loading}/>
              </SimpleGrid>
            </MotionBox>

            {/* Cotizador proforma */}
            <CotizadorPro onCotizacionCreada={loadAll}/>

            {/* Pedidos recientes */}
            <MotionBox variants={fadeUp(rm)} mt={10}>
              <HStack justify="space-between" mb={4}>
                <HStack><Icon as={FiActivity} color="green.400"/><Heading size="md">Mis pedidos recientes</Heading></HStack>
                <motion.div {...pressable(rm)}><Button size="sm" variant="ghost" rounded="xl" onClick={()=>navigate("/empresa/mis-pedidos")}>Ver todos</Button></motion.div>
              </HStack>
              {data.loading?(
                <SimpleGrid columns={{base:1,md:2,lg:4}} spacing={4}>{[1,2,3,4].map(n=><Skeleton key={n} h="110px" rounded="2xl"/>)}</SimpleGrid>
              ):!(data.pedidos||[]).length?(
                <GlassCard rounded="2xl" p={8} textAlign="center" border="1px solid" borderColor={borderColor}>
                  <HStack justify="center" mb={2} color={muted}><FiShoppingBag/><Text fontWeight="black" fontSize="sm">Aún no tienes pedidos</Text></HStack>
                  <Text color={muted} fontSize="xs" mb={4}>Cuando conviertas una proforma en pedido, aparecerá aquí con su progreso.</Text>
                  <motion.div {...pressable(rm)} style={{display:"inline-block"}}><Button size="sm" colorScheme="yellow" rounded="full" onClick={()=>navigate("/empresa/cotizaciones")}>Ver mis proformas</Button></motion.div>
                </GlassCard>
              ):(
                <MotionBox variants={stagger(rm)}>
                  <SimpleGrid columns={{base:1,md:2,lg:4}} spacing={4}>
                    {(data.pedidos||[]).slice(0,4).map(p=>{
                      const meta=estadoPedidoMeta(p.estado||p.estado_pedido||p.estado_pedido_nombre);
                      const metodo=p.metodo_pago||p.metodoPago||"—";
                      return(
                        <MotionBox key={p.id} variants={fadeUp(rm)}>
                          <motion.div {...pressable(rm)}>
                            <GlassCard rounded="2xl" overflow="hidden" cursor="pointer" border="1px solid" borderColor={borderColor} _hover={{borderColor:ferreYellow}} onClick={()=>navigate(`/empresa/mis-pedidos?pedidoId=${p.id}`)}>
                              <Box p={4}>
                                <Flex justify="space-between" align="center" mb={2}>
                                  <VStack align="start" spacing={0}><Text fontSize="10px" fontWeight="bold" color={muted} letterSpacing="wide">ORDEN #{p.id}</Text><Text fontWeight="black" fontSize="sm">{meta.label}</Text></VStack>
                                  <Badge colorScheme={meta.scheme} rounded="full" variant="subtle">{metodo}</Badge>
                                </Flex>
                                <Progress value={meta.progress} size="xs" colorScheme={meta.scheme} rounded="full"/>
                                <Text mt={2} fontSize="xs" color={muted}>Toca para ver detalle y estado.</Text>
                              </Box>
                            </GlassCard>
                          </motion.div>
                        </MotionBox>
                      );
                    })}
                  </SimpleGrid>
                </MotionBox>
              )}
            </MotionBox>

            {/* Fila inferior */}
            <MotionBox variants={stagger(rm)} mt={10}>
              <SimpleGrid columns={{base:1,md:3}} spacing={6}>
                <MotionBox variants={fadeUp(rm)}>
                  <motion.div {...pressable(rm)}>
                    <GlassCard rounded="3xl" overflow="hidden" border="1px solid" borderColor={borderColor}>
                      <PromoHeroFadeBanner images={["/Banner1.png","/Banner2.png","/Banner3.jpg","/Banner4.png"]} ratio={{base:4/1}} height={{base:"160px",md:"190px"}} fit={{base:"contain"}} objectPosition="center" rounded="3xl" mb={0} blurBg blurPx={18} blurOpacity={0.35} showDots intervalMs={4200}/>
                    </GlassCard>
                  </motion.div>
                </MotionBox>
                <MotionBox variants={fadeUp(rm)}>
                  <motion.div {...pressable(rm)} style={{height:"100%"}}>
                    <Card rounded="3xl" bg={asesorBg} color="white" h="full" shadow="2xl" overflow="hidden" border="1px solid" borderColor={asesorBorder}>
                      <CardBody p={6} display="flex" flexDirection="column" justifyContent="space-between">
                        <Box>
                          <HStack mb={3}><Icon as={FiInfo} color="yellow.400"/><Text fontWeight="black">Asesor de proyectos</Text></HStack>
                          <Text fontSize="sm" opacity={0.85} mb={4}>¿Necesitas descuento por volumen, entrega programada o una cotización especial?</Text>
                        </Box>
                        <Box>
                          <Button w="full" colorScheme="yellow" rounded="xl" h="44px" onClick={()=>navigate("/empresa/casos-empresa")}>Contactar asesor</Button>
                          <HStack mt={3} opacity={0.75}><FiAlertTriangle size={12}/><Text fontSize="xs">Adjunta el número de proforma para respuesta más rápida.</Text></HStack>
                        </Box>
                      </CardBody>
                    </Card>
                  </motion.div>
                </MotionBox>
                <MotionBox variants={fadeUp(rm)}>
                  <motion.div {...pressable(rm)} style={{height:"100%"}}>
                    <GlassCard rounded="3xl" border="1px dashed" borderColor={borderColor} overflow="hidden" textAlign="center" h="full" display="flex" alignItems="center" justifyContent="center">
                      <Box py={8} px={6}>
                        <Icon as={FiShoppingBag} boxSize={8} color={emptyIconClr} mb={3}/>
                        <Text fontSize="sm" fontWeight="black" mb={1}>¿Buscas algo específico?</Text>
                        <Text fontSize="xs" color={muted} mb={4}>Explora el catálogo completo con filtros por categoría y precio.</Text>
                        <Button size="sm" variant="link" colorScheme="yellow" onClick={()=>navigate("/empresa/catalogo")}>Explorar todo el catálogo →</Button>
                      </Box>
                    </GlassCard>
                  </motion.div>
                </MotionBox>
              </SimpleGrid>
            </MotionBox>

          </MotionBox>
        </Container>
      </MotionConfig>
    </Box>
  );
}