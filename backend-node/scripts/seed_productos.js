/* scripts/seed_productos.js
 * FerreExpress - Seed con PLAN para imágenes locales
 *
 * Flujo:
 * 1) PLAN_ONLY=1 -> genera scripts/seed_plan.json y scripts/seed_plan.csv (y NO inserta nada)
 * 2) Tú descargas imágenes y las guardas en uploads/seed/ con los nombres del CSV
 * 3) USE_PLAN=1 + REQUIRE_LOCAL_IMAGES=1 -> inserta productos + imágenes usando el plan
 */

const fs = require("fs");
const path = require("path");
const pool = require("../src/db");

// -------------------- Config (ENV) --------------------
const TARGET_TOTAL = Number(process.env.TARGET_TOTAL || 200);
const SEED_IMAGES = process.env.SEED_IMAGES === "1";

// Plan
const PLAN_ONLY = process.env.PLAN_ONLY === "1";
const USE_PLAN = process.env.USE_PLAN === "1";
const PLAN_JSON = process.env.PLAN_JSON || path.join(__dirname, "seed_plan.json");
const PLAN_CSV = process.env.PLAN_CSV || path.join(__dirname, "seed_plan.csv");

// Imágenes locales
const REQUIRE_LOCAL_IMAGES = process.env.REQUIRE_LOCAL_IMAGES === "1";
const IMAGE_EXT_PREFERRED = (process.env.IMAGE_EXT || "jpg").toLowerCase();
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"]; // aceptadas

// Carpeta uploads
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const SEED_UPLOAD_SUBDIR = "seed";
const SEED_UPLOAD_DIR = path.join(UPLOAD_DIR, SEED_UPLOAD_SUBDIR);

// -------------------- Utils --------------------
function slugify(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function moneyRound(n) {
  const x = Math.max(0, Math.round(Number(n) || 0));
  return Math.round(x / 100) * 100;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function findLocalImageFilename(stem, dir) {
  // 1) Preferida primero
  const preferred = `${stem}.${IMAGE_EXT_PREFERRED}`;
  if (fs.existsSync(path.join(dir, preferred))) return preferred;

  // 2) Luego cualquiera de las extensiones permitidas
  for (const ext of IMAGE_EXTS) {
    const f = `${stem}.${ext}`;
    if (fs.existsSync(path.join(dir, f))) return f;
  }
  return null;
}

function writePlanFiles(planned) {
  fs.writeFileSync(PLAN_JSON, JSON.stringify(planned, null, 2), "utf8");

  const header = "nombre,categoria,precio,stock,archivo_sugerido,url\n";
  const lines = planned
    .map((x) =>
      `"${x.nombre.replace(/"/g, '""')}","${(x.categoria || "").replace(/"/g, '""')}","${x.precio}","${x.stock}","${x.file_suggested}","${x.url}"`
    )
    .join("\n");

  fs.writeFileSync(PLAN_CSV, header + lines, "utf8");
}

// -------------------- Catálogo seed --------------------
function buildCandidates() {
  const out = [];

  const add = (nombre, categoria, precio, stock, descripcion) => {
    const name = nombre.trim().slice(0, 100);
    out.push({
      nombre: name,
      categoria: (categoria || "").slice(0, 100),
      precio: moneyRound(precio),
      stock: Number.isInteger(stock) ? stock : 0,
      descripcion: descripcion ? String(descripcion) : null,
    });
  };

  // Tornillería
  const drywallSizes = ['1"', '1-1/4"', '1-5/8"', '2"', '2-1/2"', '3"'];
  const drywallPacks = [
    { und: 12, base: 4500 },
    { und: 100, base: 9000 },
    { und: 600, base: 37900 },
    { und: 2500, base: 59900 },
  ];
  drywallSizes.forEach((sz) => {
    drywallPacks.forEach((p) => {
      add(
        `Tornillo Drywall punta aguda ${sz} x${p.und} und`,
        "Tornillos",
        p.base + (sz.includes("3") ? 3000 : 0),
        randInt(30, 220),
        `Tornillo para placa de yeso y madera. Punta aguda, fosfatado negro. Presentación x${p.und} und.`
      );
    });
  });

  const chazos = ["6mm", "8mm", "10mm", "12mm"];
  chazos.forEach((mm) => {
    add(
      `Chazo nylon ${mm} x100 und`,
      "Fijaciones",
      9000 + Number(mm.replace("mm", "")) * 800,
      randInt(20, 120),
      `Chazo plástico de expansión ${mm}. Ideal para concreto y mampostería. Pack x100.`
    );
  });

  const clavos = [
    { n: 'Clavo corriente 1-1/2" x libra', p: 7000 },
    { n: 'Clavo corriente 2" x libra', p: 7500 },
    { n: 'Clavo corriente 3" x libra', p: 8500 },
    { n: "Grapa para cerca x libra", p: 12000 },
  ];
  clavos.forEach((x) =>
    add(x.n, "Fijaciones", x.p, randInt(15, 80), "Presentación por libra. Acero. Uso general.")
  );

  // Manuales
  const manual = [
    ['Alicate universal 8"', 29900, "Herramientas manuales"],
    ['Alicate punta larga 6"', 24900, "Herramientas manuales"],
    ['Pinza de presión 10"', 35900, "Herramientas manuales"],
    ['Llave ajustable 10"', 32900, "Herramientas manuales"],
    ["Juego destornilladores 6 pcs", 39900, "Herramientas manuales"],
    ['Segueta arco 12"', 21900, "Herramientas manuales"],
    ["Corta tubo PVC 42mm", 58900, "Plomería"],
    ["Cuchilla bisturí + repuesto", 12900, "Herramientas manuales"],
    ["Flexómetro 5m", 18900, "Herramientas manuales"],
    ["Nivel aluminio 60cm", 32900, "Herramientas manuales"],
  ];
  manual.forEach(([n, p, c]) =>
    add(n, c, p, randInt(10, 60), "Herramienta de uso frecuente en obra y hogar. Buena relación costo/beneficio.")
  );

  // Eléctricas
  const electric = [
    ['Taladro percutor 600W 1/2"', 229900, "Herramientas eléctricas", "Taladro percutor 600W para concreto y mampostería. Velocidad variable."],
    ['Pulidora angular 4-1/2" 850W', 189900, "Herramientas eléctricas", 'Pulidora 4-1/2". Ideal para corte y desbaste con discos estándar.'],
    ['Sierra circular 7-1/4" 1400W', 369900, "Herramientas eléctricas", "Sierra circular para madera. Guía y ajuste de profundidad."],
    ["Caladora 500W", 159900, "Herramientas eléctricas", "Caladora para cortes curvos en madera y lámina delgada."],
    ["Pistola de calor 2000W", 149900, "Herramientas eléctricas", "Para termoencogible, pintura, secado rápido. 2 niveles."],
  ];
  electric.forEach(([n, p, c, d]) => add(n, c, p, randInt(5, 25), d));

  // Abrasivos
  const discos = [
    ['Disco corte metal 4-1/2" x unidad', 5900],
    ['Disco desbaste 4-1/2" x unidad', 7900],
    ['Disco flap grano 60 4-1/2" x unidad', 12900],
    ["Lija agua #400 x hoja", 2500],
    ["Lija agua #600 x hoja", 2500],
    ["Lija madera #120 x hoja", 1800],
    ["Lija madera #220 x hoja", 1800],
  ];
  discos.forEach(([n, p]) =>
    add(n, "Abrasivos", p, randInt(30, 250), "Consumible para corte, desbaste o acabado. Uso en metal y/o madera según referencia.")
  );

  // Electricidad / Iluminación
  const breakers = [
    ["Breaker 1P 20A", 19900],
    ["Breaker 1P 30A", 21900],
    ["Breaker 2P 20A", 35900],
    ["Breaker 2P 30A", 38900],
  ];
  breakers.forEach(([n, p]) =>
    add(n, "Cables y electricidad", p, randInt(8, 60), "Protección para circuitos.")
  );

  const led = [
    ["Bombillo LED 9W luz blanca", 5900],
    ["Bombillo LED 12W luz blanca", 7900],
    ["Reflector LED 30W", 29900],
    ["Reflector LED 50W", 44900],
  ];
  led.forEach(([n, p]) =>
    add(n, "Iluminación", p, randInt(15, 120), "Iluminación eficiente. Ideal hogar/obra.")
  );

  add("Cable encauchetado 3x12 Centelsa x metro", "Cables y electricidad", 11900, randInt(80, 300),
    "Cable encauchetado 3x12. Precio por metro.");
  add("Cable encauchetado 3x12 Centelsa rollo 20m", "Cables y electricidad", 117900, randInt(10, 60),
    "Rollo 20m. Cable encauchetado 3x12.");
  add("Cable encauchetado 3x12 Centelsa rollo 100m", "Cables y electricidad", 535000, randInt(2, 20),
    "Rollo 100m. Cable encauchetado 3x12.");

  const tomas = [
    ["Tomacorriente doble blanco", 8900],
    ["Interruptor sencillo blanco", 7900],
    ['Caja octogonal 4"', 4900],
    ['Caja rectangular 2x4"', 3900],
    ["Cinta aislante 18mm x 10m", 4500],
  ];
  tomas.forEach(([n, p]) =>
    add(n, "Cables y electricidad", p, randInt(20, 200), "Accesorio eléctrico de uso común.")
  );

  // Plomería
  const pvc = ['1/2"', '3/4"', '1"', '1-1/4"'];
  pvc.forEach((d) => {
    add(`Tubo PVC presión ${d} x 3m`, "Plomería", 18900 + pvc.indexOf(d) * 8000, randInt(10, 80), "Tubo PVC presión. Largo 3m.");
    add(`Codo PVC presión ${d}`, "Plomería", 2500 + pvc.indexOf(d) * 1200, randInt(30, 200), "Codo PVC presión.");
    add(`Tee PVC presión ${d}`, "Plomería", 2900 + pvc.indexOf(d) * 1400, randInt(30, 200), "Tee PVC presión.");
    add(`Unión PVC presión ${d}`, "Plomería", 2200 + pvc.indexOf(d) * 1100, randInt(30, 200), "Unión PVC presión.");
    add(`Llave de paso PVC ${d}`, "Plomería", 12900 + pvc.indexOf(d) * 5000, randInt(10, 80), "Llave de paso PVC.");
  });

  const griferia = [
    ["Grifo lavaplatos cuello alto", 59900],
    ["Grifo lavamanos sencillo", 49900],
    ["Ducha básica cromada", 45900],
    ["Sifón lavamanos PVC", 12900],
    ["Cinta teflón 12mm x 10m", 4500],
  ];
  griferia.forEach(([n, p]) =>
    add(n, "Plomería", p, randInt(10, 90), "Accesorio para instalación sanitaria/hidráulica.")
  );

  // Sellantes
  const sellantes = [
    ["Silicona transparente 280ml", 12900],
    ["Silicona blanca 280ml", 12900],
    ["Pegante PVC 1/32 gal", 17900],
    ["Pegante PVC 1/8 gal", 34900],
    ["Espuma expansiva PU 750ml", 32900],
    ["Epóxico rápido 2x25ml", 19900],
  ];
  sellantes.forEach(([n, p]) =>
    add(n, "Adhesivos y sellantes", p, randInt(10, 120), "Producto para sellado/pegado.")
  );

  // Pinturas
  const pintura = [
    ['Rodillo felpa 9" + bandeja', 24900],
    ['Brocha 2"', 8900],
    ['Brocha 3"', 12900],
    ["Cinta enmascarar 24mm x 40m", 9900],
    ["Cinta enmascarar 48mm x 40m", 15900],
    ["Anticorrosivo 1/4 gal", 34900],
    ["Esmalte sintético 1/4 gal", 39900],
  ];
  pintura.forEach(([n, p]) =>
    add(n, "Pinturas", p, randInt(10, 150), "Insumo para pintura y acabados.")
  );

  // Construcción
  const constru = [
    ["Yeso en polvo 5kg", 18900],
    ["Boquilla para cerámica 1kg", 12900],
    ["Pegante cerámico 25kg", 38900],
    ['Varilla corrugada 3/8" x 6m', 27900],
    ['Varilla corrugada 1/2" x 6m', 45900],
    ["Malla electrosoldada 2.5mm 1x2m", 32900],
  ];
  constru.forEach(([n, p]) =>
    add(n, "Materiales de construcción", p, randInt(5, 80), "Material para obra gris y acabados.")
  );

  // Jardinería
  add('Manguera bicolor 1/2" x 50 metros', "Jardinería", 186900, randInt(5, 40),
    "Manguera de riego uso pesado. Largo 50m.");
  const jard = [
    ["Tijera de poda", 35900],
    ["Aspersor plástico ajustable", 17900],
    ["Regadera 10L", 22900],
    ["Pala jardinera", 19900],
    ["Rastrillo jardinero", 18900],
  ];
  jard.forEach(([n, p]) => add(n, "Jardinería", p, randInt(10, 80), "Accesorio para cuidado de jardín."));

  // Seguridad
  const epp = [
    ["Guantes nitrilo (par)", 9900],
    ["Guantes vaqueta (par)", 15900],
    ["Gafas de seguridad transparente", 12900],
    ["Tapabocas N95 (unidad)", 7900],
    ["Protector auditivo (par)", 18900],
    ["Casco de seguridad tipo I", 29900],
  ];
  epp.forEach(([n, p]) => add(n, "Seguridad industrial", p, randInt(10, 150), "Elemento de protección personal."));

  // Cerrajería
  const cerra = [
    ["Candado 40mm", 19900],
    ["Candado 50mm", 25900],
    ["Cilindro cerradura 60mm", 32900],
    ['Pasador seguridad 4"', 12900],
    ['Bisagra 3" x par', 9900],
  ];
  cerra.forEach(([n, p]) => add(n, "Cerrajería", p, randInt(10, 120), "Accesorio de cerrajería."));

  // Brocas (variantes)
  const brocaDiam = [3, 4, 5, 6, 8, 10, 12];
  brocaDiam.forEach((d) => {
    add(`Broca concreto ${d}mm`, "Herramientas manuales", 4500 + d * 900, randInt(20, 180), `Broca para concreto ${d}mm.`);
    add(`Broca metal HSS ${d}mm`, "Herramientas manuales", 3900 + d * 850, randInt(20, 180), `Broca HSS metal ${d}mm.`);
    add(`Broca madera ${d}mm`, "Herramientas manuales", 3500 + d * 800, randInt(20, 180), `Broca madera ${d}mm.`);
  });

  return out;
}

// -------------------- Main --------------------
(async () => {
  let conn;
  try {
    console.log("== Seed Productos FerreExpress (PLAN) ==");
    console.log({
      TARGET_TOTAL,
      SEED_IMAGES,
      PLAN_ONLY,
      USE_PLAN,
      REQUIRE_LOCAL_IMAGES,
      PLAN_JSON,
      PLAN_CSV,
      SEED_UPLOAD_DIR,
    });

    await ensureDir(SEED_UPLOAD_DIR);

    // Conteo actual
    const [[countRow]] = await pool.query("SELECT COUNT(*) AS c FROM productos");
    const currentCount = Number(countRow.c || 0);

    if (!PLAN_ONLY && currentCount >= TARGET_TOTAL) {
      console.log(`Ya tienes ${currentCount} productos. No se inserta nada (TARGET_TOTAL=${TARGET_TOTAL}).`);
      process.exit(0);
    }

    // Nombres existentes
    const [existingRows] = await pool.query("SELECT nombre FROM productos");
    const existing = new Set(existingRows.map((r) => String(r.nombre).toLowerCase().trim()));

    let planned = [];

    if (USE_PLAN) {
      if (!fs.existsSync(PLAN_JSON)) {
        throw new Error(`No existe el plan: ${PLAN_JSON}. Primero corre PLAN_ONLY=1 para generarlo.`);
      }
      planned = JSON.parse(fs.readFileSync(PLAN_JSON, "utf8"));
      console.log(`📌 Usando plan: ${planned.length} items`);
    } else {
      const candidatesAll = buildCandidates().filter(
        (p) => !existing.has(p.nombre.toLowerCase().trim())
      );

      shuffle(candidatesAll);

      const needed = Math.max(0, TARGET_TOTAL - currentCount);
      const toInsert = candidatesAll.slice(0, needed);

      if (!toInsert.length) {
        console.log("No hay candidatos nuevos para insertar (todos chocan con nombres existentes).");
        process.exit(0);
      }

      planned = toInsert.map((p) => {
        const stem = slugify(p.nombre);
        const suggested = `${stem}.${IMAGE_EXT_PREFERRED}`;
        return {
          ...p,
          image_stem: stem,
          file_suggested: suggested,
          url: `/uploads/${SEED_UPLOAD_SUBDIR}/${suggested}`,
        };
      });
    }

    // Si solo queremos generar el plan
    if (PLAN_ONLY) {
      writePlanFiles(planned);
      console.log("✅ Plan generado:");
      console.log(" - JSON:", PLAN_JSON);
      console.log(" - CSV :", PLAN_CSV);
      console.log(`📁 Coloca tus imágenes aquí: ${SEED_UPLOAD_DIR}`);
      console.log(`📝 Nómbralas como la columna "archivo_sugerido" (o al menos con el mismo "image_stem" + extensión).`);
      process.exit(0);
    }

    // Validar colisiones (por si cambió DB entre plan y ejecución)
    for (const p of planned) {
      const key = String(p.nombre).toLowerCase().trim();
      if (existing.has(key)) {
        throw new Error(`El producto ya existe en BD (nombre duplicado): "${p.nombre}". Limpia o regenera el plan.`);
      }
    }

    // Validar imágenes locales si aplica
    if (SEED_IMAGES && REQUIRE_LOCAL_IMAGES) {
      const missing = [];
      for (const p of planned) {
        const found = findLocalImageFilename(p.image_stem, SEED_UPLOAD_DIR);
        if (!found) {
          // sugerimos el nombre
          missing.push(p.file_suggested || `${p.image_stem}.${IMAGE_EXT_PREFERRED}`);
        }
      }
      if (missing.length) {
        console.log("❌ Faltan imágenes locales en uploads/seed. Debes crear/guardar estos archivos:");
        missing.slice(0, 80).forEach((m) => console.log(" -", m));
        if (missing.length > 80) console.log(`... y ${missing.length - 80} más`);
        throw new Error("Imágenes faltantes. Descárgalas y vuelve a ejecutar.");
      }
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    let inserted = 0;

    for (let i = 0; i < planned.length; i++) {
      const p = planned[i];

      const [result] = await conn.query(
        `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, activo)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [p.nombre, p.descripcion, p.precio, p.stock, p.categoria]
      );

      const productoId = Number(result.insertId);
      inserted++;

      if (SEED_IMAGES) {
        // Detecta el archivo real (por si guardaste en png/webp/jpg)
        const foundFile = findLocalImageFilename(p.image_stem, SEED_UPLOAD_DIR);

        if (foundFile) {
          const url = `/uploads/${SEED_UPLOAD_SUBDIR}/${foundFile}`;
          await conn.query(
            `INSERT INTO imagenes_producto (producto_id, url, alt_text, es_principal)
             VALUES (?, ?, ?, 1)`,
            [productoId, url, p.nombre]
          );
        } else {
          // Si no exige imágenes, simplemente no inserta imagen
          if (REQUIRE_LOCAL_IMAGES) {
            throw new Error(`No se encontró imagen para "${p.nombre}" (stem: ${p.image_stem})`);
          }
        }
      }

      if (inserted % 5 === 0) {
        console.log(`Progreso: ${inserted}/${planned.length}`);
      }
    }

    await conn.commit();

    console.log(`✅ Seed completado. Insertados: ${inserted}.`);
    console.log(`📌 Objetivo total (TARGET_TOTAL=${TARGET_TOTAL}) se cumple si tu BD tenía el conteo esperado antes de ejecutar.`);
    process.exit(0);
  } catch (err) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }
    console.error("❌ Error en seed:", err.message || err);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
})();