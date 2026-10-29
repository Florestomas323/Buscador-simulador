// Lógica pura del buscador y del simulador (sin interfaz), para poder probarla.
import { CATALOGO, ESTADOS_IMPUESTO } from "./datos.js";

export const sinAcentos = (t) =>
  (t || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Orden de los resultados por tipo de producto:
//   0 = producto principal (la olla, la licuadora, el filtro que se vende)
//   1 = accesorio o cartucho de un producto principal (jarras, conjuntos, cartuchos, prefiltros)
//   2 = parte de reemplazo  ·  3 = material interno, premios, papelería
const GRUPOS_SECUNDARIOS = ["Premiums", "Miscelaneos", "Literatura de Venta", "Materiales Clientes", "Suministros", "Ordenes de Compra", "Reclutamiento", "Kits Novato"];
const GRUPOS_REPUESTO = ["Partes de Reemplazo"];
// Accesorios y consumibles que la lista mete en Electrodomésticos o Filtración
const ACCESORIOS = new Set([
  // Licuadora Power Blender Max
  "RP8217", "PE0050", "PE0051", "RP8218",
  // Batidor Blender GO
  "PE0028", "PE0029",
  // Filtración: cartuchos, prefiltros, paquetes de reemplazo, válvulas y kits
  "RP8200", "RP8202", "RP8203", "RP8204", "RP9003", "WF0075", "WF0080", "RP0140", "WF0382",
  "WF0491", "WF0490", "WF0530", "RP4621", "WF0060", "RP6196", "RP6186", "WF0654",
]);
export const nivelProducto = (p) =>
  GRUPOS_SECUNDARIOS.includes(p.g) ? 3 : GRUPOS_REPUESTO.includes(p.g) ? 2 : ACCESORIOS.has(p.c) ? 1 : 0;
export const esPrincipal = (p) => nivelProducto(p) === 0;

export const CATEGORIAS = Array.from(new Set(CATALOGO.map((p) => p.g))).sort((a, b) => a.localeCompare(b, "es"));

// Texto de búsqueda precalculado una sola vez por producto
const compacto = (t) => t.replace(/[^a-z0-9]/g, "");
const INDICE = CATALOGO.map((p, i) => {
  const hay = sinAcentos([p.c, p.n, p.f, p.k].filter(Boolean).join(" "));
  const titulo = sinAcentos([p.n, p.f].filter(Boolean).join(" ")); // nombre + descripción (sin palabras clave)
  const inicios = sinAcentos([p.n, p.f].filter(Boolean).join("|")).split("|").map((t) => t.trim());
  return { p, i, hay, hayC: compacto(hay), titulo, inicios, codigo: sinAcentos(p.c) };
});

// Qué tan directo es el resultado (menor = más arriba), dentro del mismo tipo de producto:
//   0 = el nombre empieza con lo que buscaste ("licuadora…")  ·  1 = está en el nombre/descripción
//   2 = solo está en las palabras clave
function relevancia(x, toks) {
  if (!toks.length) return 0;
  if (x.inicios.some((t) => t.startsWith(toks[0])) && toks.every((t) => x.titulo.includes(t))) return 0;
  if (toks.every((t) => x.titulo.includes(t))) return 1;
  return 2;
}

// Búsqueda abierta: cada palabra puede estar en código, nombre, descripción o palabras clave, sin acentos.
// "presion 10" encuentra "Olla de presión de 10 litros".
export function filtrarCatalogo(q, cat = "ALL") {
  // Signos pegados al inicio/fin de una palabra ("+pop", "(5", "capas,") no cuentan
  const toks = sinAcentos(q).trim().split(/\s+/)
    .map((t) => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter(Boolean);
  const out = INDICE.filter(({ p, hay, hayC }) => {
    if (cat !== "ALL" && p.g !== cat) return false;
    // Si la palabra trae signos, también compara sin espacios ni signos: "ollas&sarten" = "ollas & sarten"
    return toks.every((t) => {
      if (hay.includes(t)) return true;
      const tc = compacto(t); // solo si la palabra trae signos por dentro
      return tc !== t && tc.length > 0 && hayC.includes(tc);
    });
  });
  // Orden: 1) el código exacto que escribiste  2) productos principales antes que repuestos y material interno
  //        3) los que lo dicen en el nombre antes que los que solo lo tienen en palabras clave  4) orden de la lista
  const exacto = toks.length === 1 ? toks[0] : null;
  const clave = (x) => [x.codigo === exacto ? 0 : 1, nivelProducto(x.p), relevancia(x, toks), x.i];
  return out
    .map((x) => ({ x, k: clave(x) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2] || a.k[3] - b.k[3])
    .map(({ x }) => x.p);
}

// Número seguro: vacío, texto o negativo → 0
export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const TASA_MENSUAL = 0.015;

// Pago mensual por cada $1 financiado, a `tasa` mensual durante `meses`
export const factorAmortizacion = (tasa, meses) => tasa / (1 - Math.pow(1 + tasa, -meses));

// Planes fijos. 32, 24 y 12 meses usan los factores de siempre (amortización al 1.5% redondeada).
// 18 meses usa el factor EXACTO al 1.5% (6.38%): redondeado a 6% no alcanzaría a pagar la deuda.
export const PLANES = [
  { meses: 32, factor: 0.04, destaca: true },
  { meses: 24, factor: 0.05 },
  { meses: 18, factor: factorAmortizacion(TASA_MENSUAL, 18) },
  { meses: 12, factor: 0.09 },
];

export const ENVIO_PCT = 0.05;              // envío automático: 5% del precio del producto
export const DEPOSITOS_SUGERIDOS = [10, 15, 20];

// Impuesto del estado como fracción (8.25% → 0.0825)
export const tasaImpuesto = (estado) => (ESTADOS_IMPUESTO[estado] ? ESTADOS_IMPUESTO[estado][1] : 0) / 100;

/**
 * Precio del producto a partir del PRECIO TOTAL (que ya incluye envío y taxes).
 *   envío automático (5%):  total = precio × 1.05 × (1 + tax)   →  precio = total ÷ (1.05 × (1 + tax))
 *   envío escrito a mano:   total = (precio + envío) × (1 + tax) →  precio = total ÷ (1 + tax) − envío
 */
export function precioDesdeTotal(total, estado, envioManual = null) {
  const T = num(total);
  const t = tasaImpuesto(estado);
  const p = envioManual == null ? T / ((1 + ENVIO_PCT) * (1 + t)) : T / (1 + t) - num(envioManual);
  return Math.max(0, p);
}

// Depósito por porcentaje: siempre en dólares cerrados, redondeado hacia arriba ($56.83 → $57)
export const redondearDeposito = (monto) => (monto > 0 ? Math.ceil(monto - 1e-6) : 0);

// Estados con interés mensual propio. En esos estados TODOS los planes fijos se recalculan
// con la fórmula de amortización exacta a esa tasa.
export const INTERES_POR_ESTADO = { NV: 0.02 };
export const interesMensual = (estado) => INTERES_POR_ESTADO[estado] ?? TASA_MENSUAL;

/**
 * Cálculo completo del simulador (misma fórmula que ImpactOS).
 * depMode "pct" usa depPct; "amt" usa depAmt. El depósito nunca pasa del Total de Venta.
 */
export function calcular({ precio, envio, estado, depMode, depPct, depAmt, balance }) {
  const nPrecio = num(precio);
  const nEnvio = num(envio);
  const nBalance = num(balance);
  const tasa = tasaImpuesto(estado);
  const subtotal = nPrecio + nEnvio;
  const impuesto = subtotal * tasa;
  const totalVenta = subtotal + impuesto;
  // Depósito: base = Total de Venta SOLAMENTE (el balance no afecta el depósito)
  // Por porcentaje se redondea a dólares cerrados; un monto escrito a mano se respeta tal cual
  const pedido = depMode === "amt" ? num(depAmt) : redondearDeposito(totalVenta * (Math.min(100, num(depPct)) / 100));
  const deposito = Math.min(pedido, totalVenta);
  const depositoExcede = pedido > totalVenta + 0.005;
  const pctReal = totalVenta > 0 ? (deposito / totalVenta) * 100 : 0;
  const financeSub = Math.max(0, totalVenta - deposito);
  const financeTotal = financeSub + nBalance;
  const interes = interesMensual(estado);
  const propio = estado in INTERES_POR_ESTADO;
  const planes = PLANES.map((pl) => {
    const factor = propio ? factorAmortizacion(interes, pl.meses) : pl.factor;
    return { ...pl, factor, pago: financeTotal * factor, total: financeTotal * factor * pl.meses + deposito };
  });
  return { nPrecio, nEnvio, nBalance, tasa, interes, subtotal, impuesto, totalVenta, deposito, depositoExcede, pctReal, financeSub, financeTotal, planes };
}

/** Pago personalizado — amortización sobre saldo decreciente (1.5% mensual general; Nevada 2%). */
export function amortizar(financeTotal, pagoMensual, deposito = 0, tasa = TASA_MENSUAL) {
  const pago = num(pagoMensual);
  const MAX = 600;
  if (financeTotal <= 0 || pago <= 0) return null;
  if (pago <= financeTotal * tasa) return { infinito: true };
  let saldo = financeTotal, meses = 0, totalPagado = 0, totalInteres = 0, ultimo = 0;
  while (saldo > 0.005 && meses < MAX) {
    const interes = saldo * tasa;
    totalInteres += interes;
    saldo += interes;
    meses++;
    if (saldo <= pago) { ultimo = saldo; totalPagado += saldo; saldo = 0; }
    else { totalPagado += pago; saldo -= pago; ultimo = pago; }
  }
  return { meses, ultimo, totalPagado: totalPagado + deposito, totalInteres };
}

export const fmtC = (n) =>
  "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export { ESTADOS_IMPUESTO };
