// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// ================== LAYOUTS ==================
import PublicLayout from "./layouts/PublicLayout";
import ClienteLayout from "./layouts/ClienteLayout";
import EmpresaLayout from "./layouts/EmpresaLayout";
import AdminLayout from "./layouts/AdminLayout";

// ================== PÁGINAS PÚBLICAS ==================
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import ProductDetail from "./pages/public/ProductDetail";
import About from "./pages/public/About";
import PuntosFisicos from "./pages/public/PuntosFisicos";
import CondicionesUsoPublic from "./pages/public/legal/CondicionesUso";
import AvisosPrivacidadPublic from "./pages/public/legal/AvisosPrivacidad";

// ================== AUTH (REGISTRO) ==================
import RegisterCliente from "./pages/auth/RegisterCliente";
import RegisterEmpresa from "./pages/auth/RegisterEmpresa";

// ================== ZONA PRIVADA CLIENTE ==================
import Cliente from "./pages/cliente/Cliente";
import ClienteAbout from "./pages/cliente/About";
import ClientePuntosFisicos from "./pages/cliente/PuntosFisicos";
import Carrito from "./pages/cliente/Carrito";
import Checkout from "./pages/cliente/Checkout";
import ClienteProductDetail from "./pages/cliente/ProductDetail";
import MisPedidos from "./pages/cliente/MisPedidos";
import PedidoProcesando from "./pages/cliente/PedidoProcesando";
import PedidoResultado from "./pages/cliente/PedidoResultado";
import Perfil from "./pages/cliente/Perfil";
import MisCasos from "./pages/cliente/MisCasos";
import AyudaFAQ from "./pages/cliente/AyudaFAQ";
import CondicionesUsoCliente from "./pages/cliente/legal/CondicionesUsoCliente";
import AvisosPrivacidadCliente from "./pages/cliente/legal/AvisosPrivacidadCliente";

// ================== ZONA PRIVADA EMPRESA / CONTRATISTA ==================
import EmpresaCatalogo from "./pages/empresa/EmpresaCatalogo";
import EmpresaAbout from "./pages/empresa/About";
import EmpresaPuntosFisicos from "./pages/empresa/PuntosFisicos";
import EmpresaProductDetail from "./pages/empresa/ProductDetail";
import Inicio from "./pages/empresa/Inicio";
import MisCotizaciones from "./pages/empresa/MisCotizaciones";
import MisPedidosEmpresa from "./pages/empresa/MisPedidosEmpresa";
import CarritoEmpresa from "./pages/empresa/CarritoEmpresa";
import CheckoutEmpresa from "./pages/empresa/checkoutEmpresa";
import PedidoProcesandoEmpresa from "./pages/empresa/PedidoProcesandoEmpresa";
import PedidoResultadoEmpresa from "./pages/empresa/PedidoResultadoEmpresa";
import PerfilEmpresa from "./pages/empresa/PerfilEmpresa";
import MisCasosEmpresa from "./pages/empresa/MisCasosEmpresa";
import CondicionesUsoEmpresa from "./pages/empresa/legal/CondicionesUsoEmpresa";
import AvisosPrivacidadEmpresa from "./pages/empresa/legal/AvisosPrivacidadEmpresa";
import AyudaFAQEmpresa from "./pages/empresa/AyudaFAQEmpresa";

// ================== ZONA PRIVADA ADMIN ==================
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProductos from "./pages/admin/Productos";
import AdminPedidos from "./pages/admin/Pedidos";
import AdminCotizaciones from "./pages/admin/Cotizaciones";
import AdminCasos from "./pages/admin/Casos";
import AdminFaq from "./pages/admin/Faq";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminDescuentos from "./pages/admin/Descuentos";
import AdminAuditoria from "./pages/admin/Auditoria";

// ================== GUARD ==================
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <Routes>
      {/* ========== PÚBLICO ========== */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/Home" element={<Navigate to="/home" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/Login" element={<Navigate to="/login" replace />} />

        <Route path="/producto/:id" element={<ProductDetail />} />

        <Route path="/about" element={<About />} />
        <Route path="/About" element={<Navigate to="/about" replace />} />

        <Route path="/puntos-fisicos" element={<PuntosFisicos />} />
        <Route
          path="/PuntosFisicos"
          element={<Navigate to="/puntos-fisicos" replace />}
        />

        <Route path="/condiciones-uso" element={<CondicionesUsoPublic />} />
        <Route path="/avisos-privacidad" element={<AvisosPrivacidadPublic />} />

        {/* Registro */}
        <Route path="/register/cliente" element={<RegisterCliente />} />
        <Route path="/register/empresa" element={<RegisterEmpresa />} />
      </Route>

      {/* ========== CLIENTE (PROTEGIDO) ========== */}
      <Route element={<PrivateRoute allowedRoles={["CLIENTE"]} />}>
        <Route path="/cliente" element={<ClienteLayout />}>
          <Route index element={<Cliente />} />

          <Route path="casos" element={<MisCasos />} />
          <Route path="ayuda" element={<AyudaFAQ />} />
          <Route path="categorias" element={<Cliente />} />
          <Route path="ofertas" element={<Cliente />} />
          <Route path="about" element={<ClienteAbout />} />
          <Route path="puntos-fisicos" element={<ClientePuntosFisicos />} />
          <Route path="carrito" element={<Carrito />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="producto/:id" element={<ClienteProductDetail />} />
          <Route path="faq" element={<AyudaFAQ />} />
          <Route path="condiciones-uso-cliente" element={<CondicionesUsoCliente />} />
          <Route path="avisos-privacidad-cliente" element={<AvisosPrivacidadCliente />} />

          <Route path="perfil" element={<Perfil />} />

          <Route path="pedido-procesando" element={<PedidoProcesando />} />
          <Route path="pedido-resultado" element={<PedidoResultado />} />

          <Route path="pedidos" element={<MisPedidos />} />
          <Route path="mis-pedidos" element={<MisPedidos />} />
        </Route>
      </Route>
      <Route path="/Cliente" element={<Navigate to="/cliente" replace />} />

      {/* ========== EMPRESA / CONTRATISTA (PROTEGIDO) ========== */}
      <Route element={<PrivateRoute allowedRoles={["CONTRATISTA"]} />}>
        <Route path="/empresa" element={<EmpresaLayout />}>
          <Route index element={<Inicio />} />

          <Route path="catalogo" element={<EmpresaCatalogo />} />
          <Route path="about" element={<EmpresaAbout />} />
          <Route path="puntos-fisicos" element={<EmpresaPuntosFisicos />} />
          <Route path="producto/:id" element={<EmpresaProductDetail />} />

          <Route path="cotizaciones" element={<MisCotizaciones />} />
          <Route path="mis-pedidos" element={<MisPedidosEmpresa />} />

          <Route path="carrito-empresa" element={<CarritoEmpresa />} />
          <Route path="checkout-empresa" element={<CheckoutEmpresa />} />
          <Route path="pedido-procesando" element={<PedidoProcesandoEmpresa />} />
          <Route path="pedido-resultado" element={<PedidoResultadoEmpresa />} />

          <Route path="perfil-empresa" element={<PerfilEmpresa />} />
          <Route path="casos-empresa" element={<MisCasosEmpresa />} />
          <Route path="/empresa/ayuda" element={<AyudaFAQEmpresa />} />

          {/* ✅ Nuevas legales empresa */}
          <Route path="condiciones-uso-empresa" element={<CondicionesUsoEmpresa />} />
          <Route path="avisos-privacidad-empresa" element={<AvisosPrivacidadEmpresa />} />
        </Route>
      </Route>
      <Route path="/Empresa" element={<Navigate to="/empresa" replace />} />

      {/* ========== ADMIN (PROTEGIDO) ========== */}
      <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />

          <Route path="productos" element={<AdminProductos />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="cotizaciones" element={<AdminCotizaciones />} />
          <Route path="casos" element={<AdminCasos />} />
          <Route path="faq" element={<AdminFaq />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="descuentos" element={<AdminDescuentos />} />
          <Route path="auditoria" element={<AdminAuditoria />} />
        </Route>
      </Route>
      <Route path="/Admin" element={<Navigate to="/admin" replace />} />

      {/* ========== Fallback ========== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
