const fs = require("fs");
const path = require("path");
const pool = require("../src/db");

const MIN_PER_CATEGORY = Number(process.env.MIN_PER_CATEGORY || 5);
const SEED_IMAGES = process.env.SEED_IMAGES === "1";
const REQUIRE_LOCAL_IMAGES = process.env.REQUIRE_LOCAL_IMAGES === "1";
const IMAGE_EXT = (process.env.IMAGE_EXT || "jpg").toLowerCase();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const SEED_SUBDIR = "seed";
const SEED_DIR = path.join(UPLOAD_DIR, SEED_SUBDIR);

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];

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

function existsAnyExt(stem) {
  // Prioriza IMAGE_EXT, luego busca cualquiera
  const preferred = `${stem}.${IMAGE_EXT}`;
  if (fs.existsSync(path.join(SEED_DIR, preferred))) return preferred;

  for (const ext of IMAGE_EXTS) {
    const f = `${stem}.${ext}`;
    if (fs.existsSync(path.join(SEED_DIR, f))) return f;
  }
  return null;
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function getCountsByCategoria() {
  const [rows] = await pool.query(`
    SELECT TRIM(categoria) AS categoria, COUNT(*) AS c
    FROM productos
    WHERE activo = 1 AND categoria IS NOT NULL AND TRIM(categoria) <> ''
    GROUP BY TRIM(categoria)
  `);
  const m = new Map();
  for (const r of rows) m.set(String(r.categoria), Number(r.c));
  return m;
}

// ✅ Catálogo fijo (determinista) para que tú sepas qué imágenes bajar
function catalog() {
  const mk = (nombre, categoria, precio, stock, descripcion) => ({
    nombre,
    categoria,
    precio: moneyRound(precio),
    stock,
    descripcion,
  });

  return [
    // Cementos y agregados (4)
    mk("Arena lavada bulto", "Cementos y agregados", 12000, 50, "Agregado fino para morteros y concretos."),
    mk("Grava bulto", "Cementos y agregados", 14000, 50, "Agregado grueso para concretos y rellenos."),
    mk("Cal hidratada 25kg", "Cementos y agregados", 32000, 20, "Cal para revoques y mezclas."),
    mk("Mortero listo 25kg", "Cementos y agregados", 28900, 30, "Mortero premezclado para pega y repello."),

    // Disolventes (4)
    mk("Acetona 1 litro", "Disolventes", 17900, 30, "Acetona para limpieza y desengrase."),
    mk("Varsol 1 litro", "Disolventes", 15900, 40, "Solvente tipo varsol para limpieza."),
    mk("Aguarras mineral 1 litro", "Disolventes", 16900, 35, "Aguarrás mineral para dilución y limpieza."),
    mk("Removedor de pintura 1 litro", "Disolventes", 24900, 25, "Removedor para decapado de pintura."),

    // Pinturas (4)
    mk("Pintura vinilo interior 1 galón blanca", "Pinturas", 69900, 12, "Pintura vinílica interior color blanco."),
    mk("Pintura vinilo exterior 1 galón blanca", "Pinturas", 84900, 10, "Pintura vinílica exterior color blanco."),
    mk("Anticorrosivo 1/4 gal", "Pinturas", 34900, 20, "Base anticorrosiva para metal."),
    mk("Rodillo felpa 9 pulgadas con bandeja", "Pinturas", 24900, 25, "Kit rodillo + bandeja."),

    // Abrasivos (3)
    mk('Disco corte metal 4-1/2" x unidad', "Abrasivos", 5900, 120, "Disco para corte de metal."),
    mk('Disco flap grano 60 4-1/2" x unidad', "Abrasivos", 12900, 80, "Disco flap para desbaste/acabado."),
    mk("Lija agua #400 x hoja", "Abrasivos", 2500, 200, "Lija para acabado fino."),

    // Adhesivos y sellantes (3)
    mk("Silicona transparente 280ml", "Adhesivos y sellantes", 12900, 50, "Sellante multiusos."),
    mk("Pegante PVC 1/32 gal", "Adhesivos y sellantes", 17900, 35, "Pegante para tubería PVC."),
    mk("Sellador acrilico 280ml", "Adhesivos y sellantes", 9900, 60, "Sellador para grietas y juntas."),

    // Fijaciones (3)
    mk("Chazo nylon 6mm x100 und", "Fijaciones", 12900, 60, "Chazo de expansión 6mm."),
    mk("Remache pop 1/8 x50 und", "Fijaciones", 11900, 30, "Remache para lámina y perfilería."),
    mk("Anclaje mariposa drywall x10 und", "Fijaciones", 9900, 40, "Anclaje tipo mariposa para drywall."),

    // Iluminación (3)
    mk("Bombillo LED 12W luz blanca", "Iluminación", 7900, 140, "Bombillo LED 12W."),
    mk("Panel LED 18W incrustar", "Iluminación", 25900, 40, "Panel LED para cielo raso."),
    mk("Tira LED 5 metros luz blanca", "Iluminación", 34900, 25, "Tira LED decorativa 5m."),

    // Materiales de construcción (3)
    mk("Pegante ceramico 25kg", "Materiales de construcción", 38900, 20, "Pegante para cerámica."),
    mk("Boquilla para ceramica 1kg", "Materiales de construcción", 12900, 40, "Boquilla para juntas."),
    mk("Yeso en polvo 5kg", "Materiales de construcción", 18900, 30, "Yeso para resanes."),

    // Herramientas eléctricas (2)
    mk("Caladora 500W", "Herramientas eléctricas", 159900, 8, "Caladora para cortes curvos."),
    mk("Pistola de calor 2000W", "Herramientas eléctricas", 149900, 6, "Para termoencogible y pintura."),

    // Jardinería (2)
    mk("Aspersor plastico ajustable", "Jardinería", 17900, 30, "Aspersor para riego."),
    mk("Pala jardinera metalica", "Jardinería", 19900, 25, "Pala para jardín."),

    // Cables y electricidad (1)
    mk("Tomacorriente doble blanco", "Cables y electricidad", 8900, 120, "Toma doble estándar."),
  ];
}

(async () => {
  let conn;
  try {
    console.log("== Seed mínimo por categoría ==");
    console.log({ MIN_PER_CATEGORY, SEED_IMAGES, REQUIRE_LOCAL_IMAGES, IMAGE_EXT });

    // 1) Conteo por categoría (actual)
    const counts = await getCountsByCategoria();

    // 2) Nombres existentes (evitar duplicados por nombre)
    const [existingRows] = await pool.query("SELECT nombre FROM productos");
    const existing = new Set(existingRows.map((r) => String(r.nombre).toLowerCase().trim()));

    // 3) Calcular plan: solo categorías < MIN_PER_CATEGORY
    const all = catalog();

    const plan = [];
    const needByCat = [];

    for (const [cat, c] of counts.entries()) {
      if (c < MIN_PER_CATEGORY) {
        needByCat.push({ categoria: cat, faltan: MIN_PER_CATEGORY - c });
      }
    }

    // Si hay categorías que no aparecen en counts (0 productos), no saldrán aquí.
    // Si luego quieres incluirlas también, lo ajustamos.

    // Armar plan determinista
    for (const need of needByCat) {
      const poolCat = all.filter((p) => p.categoria === need.categoria);
      let taken = 0;

      for (const p of poolCat) {
        if (taken >= need.faltan) break;
        if (existing.has(p.nombre.toLowerCase().trim())) continue;

        const stem = slugify(p.nombre);
        const fileSuggested = `${stem}.${IMAGE_EXT}`;
        const url = `/uploads/${SEED_SUBDIR}/${fileSuggested}`;

        plan.push({ ...p, fileSuggested, url });
        taken++;
      }

      if (taken < need.faltan) {
        console.warn(
          `⚠️ No hay suficientes candidatos para "${need.categoria}". Faltan ${need.faltan - taken}.`
        );
      }
    }

    if (!plan.length) {
      console.log(`Ya todas tus categorías existentes tienen >= ${MIN_PER_CATEGORY}. No se inserta nada.`);
      process.exit(0);
    }

    // 4) Validar imágenes si aplica
    if (SEED_IMAGES) {
      await ensureDir(SEED_DIR);

      if (REQUIRE_LOCAL_IMAGES) {
        const missing = [];
        for (const p of plan) {
          const stem = slugify(p.nombre);
          const found = existsAnyExt(stem);
          if (!found) missing.push(p.fileSuggested);
          else {
            p.fileSuggested = found;
            p.url = `/uploads/${SEED_SUBDIR}/${found}`;
          }
        }
        if (missing.length) {
          console.error("❌ Faltan imágenes en uploads/seed. Debes crear estos archivos:");
          missing.forEach((m) => console.error(" -", m));
          process.exit(1);
        }
      }
    }

    // 5) Insertar en DB (transacción)
    conn = await pool.getConnection();
    await conn.beginTransaction();

    let inserted = 0;

    for (const p of plan) {
      const [result] = await conn.query(
        `INSERT INTO productos (nombre, descripcion, precio, stock, categoria, activo)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [p.nombre, p.descripcion || null, p.precio, p.stock, p.categoria]
      );

      const productoId = Number(result.insertId);
      inserted++;

      if (SEED_IMAGES) {
        await conn.query(
          `INSERT INTO imagenes_producto (producto_id, url, alt_text, es_principal)
           VALUES (?, ?, ?, 1)`,
          [productoId, p.url, p.nombre]
        );
      }
    }

    await conn.commit();
    console.log(`✅ Listo. Insertados: ${inserted}.`);
    if (SEED_IMAGES) console.log(`🖼️ Imágenes asociadas desde /uploads/${SEED_SUBDIR}/...`);

    process.exit(0);
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    console.error("❌ Error seed:", err);
    process.exit(1);
  } finally {
    if (conn) conn.release();
  }
})();
