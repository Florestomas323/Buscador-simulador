// Lógica pura del buscador y del simulador (sin interfaz), para poder probarla.
import { CATALOGO, ESTADOS_IMPUESTO } from "./datos.js";

export const sinAcentos = (t) =>
  (t || "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Grupos que van AL FINAL de los resultados (la mercancía siempre primero)
const GRUPOS_SECUNDARIOS = ["Premiums", "Miscelaneos", "Literatura de Venta", "Materiales Clientes", "Suministros", "Ordenes de Compra", "Reclutamiento", "Kits Novato"];

export const CATEGORIAS = Array.from(new Set(CATALOGO.map((p) => p.g))).sort((a, b) => a.localeCompare(b, "es"));

// Texto de búsqueda precalculado una sola vez por producto
const compacto = (t) => t.replace(/[^a-z0-9]/g, "");
const INDICE = CATALOGO.map((p) => {
  const hay = sinAcentos([p.c, p.n, p.f, p.k].filter(Boolean).join(" "));
  return { p, hay, hayC: compacto(hay) };
});

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
  }).map((x) => x.p);
  const sec = (p) => (GRUPOS_SECUNDARIOS.includes(p.g) ? 1 : 0);
  return out.sort((a, b) => sec(a) - sec(b));
}

// Número seguro: vacío, texto o negativo → 0
export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const PLANES = [
  { meses: 32, factor: 0.04, destaca: true },
  { meses: 24, factor: 0.05 },
  { meses: 16, factor: 0.07 },
  { meses: 12, factor: 0.09 },
];

export const TASA_MENSUAL = 0.015;

/**
 * Cálculo completo del simulador (misma fórmula que ImpactOS).
 * depMode "pct" usa depPct; "amt" usa depAmt. El depósito nunca pasa del Total de Venta.
 */
export function calcular({ precio, envio, estado, depMode, depPct, depAmt, balance }) {
  const nPrecio = num(precio);
  const nEnvio = num(envio);
  const nBalance = num(balance);
  const tasa = (ESTADOS_IMPUESTO[estado] ? ESTADOS_IMPUESTO[estado][1] : 0) / 100;
  const subtotal = nPrecio + nEnvio;
  const impuesto = subtotal * tasa;
  const totalVenta = subtotal + impuesto;
  // Depósito: base = Total de Venta SOLAMENTE (el balance no afecta el depósito)
  const pedido = depMode === "amt" ? num(depAmt) : totalVenta * (Math.min(100, num(depPct)) / 100);
  const deposito = Math.min(pedido, totalVenta);
  const depositoExcede = pedido > totalVenta + 0.005;
  const pctReal = totalVenta > 0 ? (deposito / totalVenta) * 100 : 0;
  const financeSub = Math.max(0, totalVenta - deposito);
  const financeTotal = financeSub + nBalance;
  const planes = PLANES.map((pl) => ({
    ...pl,
    pago: financeTotal * pl.factor,
    total: financeTotal * pl.factor * pl.meses + deposito,
  }));
  return { nPrecio, nEnvio, nBalance, tasa, subtotal, impuesto, totalVenta, deposito, depositoExcede, pctReal, financeSub, financeTotal, planes };
}

/** Pago personalizado — amortización 1.5% mensual sobre saldo decreciente. */
export function amortizar(financeTotal, pagoMensual, deposito = 0) {
  const pago = num(pagoMensual);
  const MAX = 600;
  if (financeTotal <= 0 || pago <= 0) return null;
  if (pago <= financeTotal * TASA_MENSUAL) return { infinito: true };
  let saldo = financeTotal, meses = 0, totalPagado = 0, totalInteres = 0, ultimo = 0;
  while (saldo > 0.005 && meses < MAX) {
    const interes = saldo * TASA_MENSUAL;
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
