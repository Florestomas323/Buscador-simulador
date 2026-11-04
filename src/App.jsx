import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Check, Star, Calculator, ScanSearch, AlertTriangle, Tag, Plus, Minus, Trash2, Gift, Package, ChevronDown, ChevronUp, MapPin, Sparkles, Eye, Pencil } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { CATALOGO } from "./datos.js";
import { CATEGORIAS, filtrarCatalogo, esPrincipal, calcular, amortizar, fmtC, ESTADOS_IMPUESTO, precioDesdeTotal, ENVIO_PCT, DEPOSITOS_SUGERIDOS,
  PRECIOS, GRUPOS_PRECIOS, buscarPrecios, calcularPaquete, PROMOCIONES, PORCENTAJES_PROMO,
  hayListaDePrecios, ESTADO_INICIAL } from "./logica.js";

const TC = {
  bg: "#f0f2f5", panel: "#ffffff", border: "#d0d4dc",
  blue: "#1a3a6b", blueMid: "#2756a8", blueLight: "#4a7fd4", bluePale: "#e8edf8", borderHi: "#b8cae8",
  red: "#c0392b", green: "#1d8a4f", text: "#2c2c2c", mut: "#8a8a8a",
  serif: "'Playfair Display', Georgia, serif",
  glow: "0 2px 12px rgba(26,58,107,.10)", glowLg: "0 6px 28px rgba(26,58,107,.14)",
};
const inp = { background: "#fff", border: "2px solid " + TC.border, color: "#111" };

/* ── Copiar al portapapeles (con respaldo para iPhone) ── */
function fallbackCopy(txt) {
  const ta = document.createElement("textarea");
  ta.value = txt;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed"; ta.style.top = "0"; ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length);
  try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ }
  document.body.removeChild(ta);
}
function copiarTexto(txt, ok) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok).catch(() => { fallbackCopy(txt); ok(); });
    } else { fallbackCopy(txt); ok(); }
  } catch (e) { fallbackCopy(txt); ok(); }
}

/* ══════════ BUSCADOR DE CÓDIGOS ══════════ */
const LIMITE = 100;
function BuscadorCodigos() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [copiado, setCopiado] = useState(null);
  const items = useMemo(() => filtrarCatalogo(q, cat), [q, cat]);
  const mostrar = items.slice(0, LIMITE);
  const pick = (p) => copiarTexto(p.c, () => {
    setCopiado(p.c);
    setTimeout(() => setCopiado((c) => (c === p.c ? null : c)), 1600);
  });
  const chip = (activo) => activo
    ? { background: TC.blueMid, color: "#fff", border: "1.5px solid " + TC.blueMid }
    : { background: TC.bg, color: "#5a5a5a", border: "1.5px solid " + TC.border };

  return (
    <div className="rounded-2xl p-5" style={{ background: TC.panel, border: "1px solid " + TC.border, boxShadow: TC.glow }}>
      <div className="text-lg font-bold" style={{ fontFamily: TC.serif, color: TC.blue }}>Buscador de Códigos</div>
      <div className="text-xs mb-4" style={{ color: TC.mut }}>{CATALOGO.length} productos · Toca un producto para copiar su código</div>
      <div className="relative mb-2">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TC.blueLight }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: tamalera, sartén, CO9846…"
          inputMode="search" type="search" autoComplete="off" autoCorrect="off" spellCheck={false}
          className="w-full rounded-lg pl-9 pr-3 py-2.5 text-base font-semibold outline-none" style={{ ...inp, background: TC.bg }} />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2" style={{ WebkitOverflowScrolling: "touch" }}>
        <button onClick={() => setCat("ALL")} className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={chip(cat === "ALL")}>Todos</button>
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={chip(cat === c)}>{c}</button>
        ))}
      </div>
      <div className="text-xs font-bold mb-2" style={{ color: TC.mut }}>{items.length} producto{items.length !== 1 ? "s" : ""}</div>
      <div className="rounded-xl overflow-y-auto" style={{ border: "1px solid " + TC.border, maxHeight: "60vh", background: "#fff" }}>
        {mostrar.length === 0 && (
          <div className="text-center py-10" style={{ color: TC.mut }}>
            <Search size={30} strokeWidth={1.25} className="mx-auto mb-2 opacity-40" />
            <div className="text-sm font-bold">Sin resultados. Prueba otra palabra o código.</div>
          </div>
        )}
        {mostrar.map((p, i) => (
          <button key={p.c} onClick={() => pick(p)} className="w-full text-left flex items-start gap-3 px-3 py-3 active:scale-[.99] transition"
            style={{ borderBottom: i < mostrar.length - 1 ? "1px solid " + TC.bg : "none" }}>
            <span className="text-[11px] font-black px-2 py-1 rounded-md whitespace-nowrap inline-flex items-center gap-1"
              style={{ background: copiado === p.c ? TC.green : TC.blue, color: "#fff", letterSpacing: ".04em" }}>
              {copiado === p.c ? <><Check size={12} />Copiado</> : p.c}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold leading-snug" style={{ color: TC.text }}>{p.f || p.n}</span>
              {p.f && p.f !== p.n && <span className="block text-[10px] mt-0.5" style={{ color: TC.mut }}>{p.n}</span>}
              <span className="flex flex-wrap items-center gap-1.5 mt-1">
                {esPrincipal(p) && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                    style={{ background: "#fdf3d7", color: "#8a6100", letterSpacing: ".06em" }}>
                    <Star size={9} fill="currentColor" />Principal
                  </span>
                )}
                <span className="text-[10px] font-black uppercase" style={{ color: TC.blueMid, letterSpacing: ".08em" }}>{p.g}</span>
              </span>
            </span>
          </button>
        ))}
        {items.length > LIMITE && (
          <div className="px-3 py-3 text-center text-xs italic" style={{ color: TC.mut }}>+ {items.length - LIMITE} más — refina tu búsqueda</div>
        )}
      </div>
    </div>
  );
}


/* ══════════ LISTA DE PRECIOS Y PAQUETES ══════════ */
const LIMITE_PRECIOS = 80;
// Paquetes con promoción elegida por el vendedor (false = ocultar "Agregar al paquete" y la vista Paquete)
const MOSTRAR_PAQUETES = true;
const PRECIO_POR_ID = Object.fromEntries(PRECIOS.map((x) => [x.id, x]));
const AMARILLO = { fondo: "#fff8db", borde: "#e0b100", texto: "#8a6100" };

function EtiquetaTipo({ tipo }) {
  if (tipo === "regalo") return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: "#e9f7ef", color: TC.green, letterSpacing: ".05em" }}>
      <Gift size={10} />Set con regalo
    </span>
  );
  if (tipo === "oferta") return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: AMARILLO.fondo, color: AMARILLO.texto, letterSpacing: ".05em" }}>
      <Star size={10} fill="currentColor" />Oferta especial
    </span>
  );
  return null;
}

function Codigos({ cod, copiado, onCopiar }) {
  if (!cod.length) return <span className="text-[10px] italic" style={{ color: TC.mut }}>Sin código en la lista</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {cod.map((c) => (
        <button key={c.c + c.l} onClick={() => onCopiar(c.c)} className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md transition active:scale-95"
          style={{ background: copiado === c.c ? TC.green : TC.blue, color: "#fff", letterSpacing: ".04em" }}>
          {copiado === c.c ? <><Check size={10} />Copiado</> : <>{c.c}{c.l && <span className="font-bold opacity-75">· {c.l}</span>}</>}
        </button>
      ))}
    </span>
  );
}

function TarjetaPrecio({ x, cant, copiado, onCopiar, onAgregar, onSimular }) {
  const [abierto, setAbierto] = useState(false);
  const detalles = x.piezas || x.nota;
  return (
    <div className="px-3 py-3" style={{ borderBottom: "1px solid " + TC.bg }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold leading-snug" style={{ color: TC.text }}>{x.n}</div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <EtiquetaTipo tipo={x.tipo} />
            <span className="text-[10px] font-black uppercase" style={{ color: TC.blueMid, letterSpacing: ".08em" }}>{x.g}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black leading-tight" style={{ fontFamily: TC.serif, color: TC.blue }}>{fmtC(x.p)}</div>
          <div className="text-[9px]" style={{ color: TC.mut }}>+ tax y envío</div>
        </div>
      </div>
      <div className="mt-2"><Codigos cod={x.cod} copiado={copiado} onCopiar={onCopiar} /></div>
      {detalles && (
        <button onClick={() => setAbierto(!abierto)} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: TC.blueMid }}>
          {abierto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}{x.tipo === "regalo" ? "Ver regalos y piezas" : "Ver detalles"}
        </button>
      )}
      {abierto && (
        <div className="mt-1.5 rounded-lg p-2 text-[11px] leading-relaxed space-y-1" style={{ background: TC.bg, color: "#555" }}>
          {x.nota && <div>{x.nota}</div>}
          {x.piezas && <div>{x.piezas}</div>}
        </div>
      )}
      <div className={"grid gap-2 mt-2.5 " + (MOSTRAR_PAQUETES ? "grid-cols-2" : "grid-cols-1")}>
        {MOSTRAR_PAQUETES && <button onClick={() => onAgregar(x.id)} className="inline-flex items-center justify-center gap-1 rounded-lg py-2 text-[12px] font-black transition active:scale-95"
          style={cant ? { background: TC.green, color: "#fff", border: "2px solid " + TC.green } : { background: "#e9f7ef", color: TC.green, border: "2px solid #9fd8b6" }}>
          <Plus size={13} />{cant ? `En paquete (${cant})` : "Agregar al paquete"}
        </button>}
        <button onClick={() => onSimular(x)} className="inline-flex items-center justify-center gap-1 rounded-lg py-2 text-[12px] font-black transition active:scale-95"
          style={{ background: TC.bluePale, color: TC.blue, border: "2px solid " + TC.borderHi }}>
          <Calculator size={13} />Simular
        </button>
      </div>
    </div>
  );
}

function ListaPrecios({ onFinanciar, activo, estado, onIrSimulador }) {
  const [vista, setVista] = useState("individual"); // 'individual' | 'paquete'
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState("ALL");
  const [paquete, setPaquete] = useState([]); // [{ id, cant }]
  const [copiado, setCopiado] = useState(null);
  // Promoción: la elige el vendedor antes de mostrarle el paquete al cliente
  const [promo, setPromo] = useState("");        // nombre de la lista, "__otro" o "" (ninguno)
  const [promoOtro, setPromoOtro] = useState(""); // texto cuando eligen "Otro"
  const [promoPct, setPromoPct] = useState(0);    // 0 = sin descuento
  const [modoCliente, setModoCliente] = useState(false);

  const items = useMemo(() => buscarPrecios(q, grupo), [q, grupo]);
  const lineas = paquete.map((l) => ({ ...PRECIO_POR_ID[l.id], cant: l.cant }));
  const pk = calcularPaquete(lineas, promoPct);
  const nombrePromo = (promo === "__otro" ? promoOtro.trim() : promo) || (pk.pct ? "Descuento especial" : "");
  const quitarPromo = () => { setPromo(""); setPromoOtro(""); setPromoPct(0); };
  const enPaquete = (id) => (paquete.find((l) => l.id === id) || {}).cant || 0;

  const copiar = (c) => copiarTexto(c, () => { setCopiado(c); setTimeout(() => setCopiado((x) => (x === c ? null : x)), 1600); });
  const agregar = (id) => setPaquete((ps) => ps.some((l) => l.id === id) ? ps.map((l) => (l.id === id ? { ...l, cant: l.cant + 1 } : l)) : [...ps, { id, cant: 1 }]);
  const cambiarCant = (id, d) => setPaquete((ps) => ps.map((l) => (l.id === id ? { ...l, cant: l.cant + d } : l)).filter((l) => l.cant > 0));
  const quitar = (id) => setPaquete((ps) => ps.filter((l) => l.id !== id));
  const simular = (x) => onFinanciar(x.p, "Desde Lista de Precios: " + x.n);
  const financiarPaquete = () => onFinanciar(pk.total,
    `Paquete de ${pk.unidades} producto${pk.unidades !== 1 ? "s" : ""}` + (pk.pct ? ` · ${nombrePromo} ${pk.pct}%` : ""));
  const irAlPaquete = () => { setVista("paquete"); try { window.scrollTo(0, 0); } catch (e) { /* sin scroll */ } };

  const chip = (on) => on
    ? { background: TC.blueMid, color: "#fff", border: "1.5px solid " + TC.blueMid }
    : { background: TC.bg, color: "#5a5a5a", border: "1.5px solid " + TC.border };
  const seg = (on) => on ? { background: "#fff", color: TC.blue, boxShadow: TC.glow } : { color: "#5a5a5a" };
  const mostrar = items.slice(0, LIMITE_PRECIOS);

  const nombreEstado = ESTADOS_IMPUESTO[estado] ? ESTADOS_IMPUESTO[estado][0] : estado;

  // Estado sin lista de precios cargada: aviso y acceso al simulador
  if (!hayListaDePrecios(estado)) return (
    <div className="rounded-2xl p-5 text-center" style={{ background: TC.panel, border: "1px solid " + TC.border, boxShadow: TC.glow }}>
      <div className="text-lg font-bold" style={{ fontFamily: TC.serif, color: TC.blue }}>Lista de Precios</div>
      <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase mt-1 px-2 py-0.5 rounded" style={{ background: TC.bluePale, color: TC.blueMid, letterSpacing: ".06em" }}>
        <MapPin size={11} />{nombreEstado}
      </div>
      <div className="mx-auto my-5 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: TC.bg }}>
        <Tag size={26} strokeWidth={1.5} style={{ color: TC.mut }} />
      </div>
      <div className="text-[15px] font-black" style={{ color: TC.text }}>Lista de precios no disponible para {nombreEstado}</div>
      <div className="text-xs mt-1.5 leading-relaxed" style={{ color: TC.mut }}>
        Por ahora la lista de precios es solo para Texas. Puedes calcular el financiamiento en el Simulador escribiendo el precio a mano.
      </div>
      <button onClick={onIrSimulador} className="mt-5 w-full rounded-xl py-3 text-[14px] font-black text-white inline-flex items-center justify-center gap-2" style={{ background: TC.blue }}>
        <Calculator size={16} />Ir al Simulador
      </button>
    </div>
  );

  return (
    <div className="space-y-3" style={{ paddingBottom: vista === "individual" && paquete.length && activo ? 76 : 0 }}>
      <div className="rounded-2xl p-5" style={{ background: TC.panel, border: "1px solid " + TC.border, boxShadow: TC.glow }}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-bold" style={{ fontFamily: TC.serif, color: TC.blue }}>Lista de Precios</div>
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2 py-0.5 rounded shrink-0" style={{ background: TC.bluePale, color: TC.blueMid, letterSpacing: ".06em" }}>
            <MapPin size={11} />{nombreEstado}
          </span>
        </div>
        <div className="text-xs mb-3" style={{ color: TC.mut }}>{vista === "paquete" && modoCliente ? "Precios de venta 2026" : 'Precios de venta 2026 · antes de tax y envío · toca "Simular" para calcular el financiamiento'}</div>
        {MOSTRAR_PAQUETES && !(vista === "paquete" && modoCliente) && <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-4" style={{ background: TC.bg, border: "1px solid " + TC.border }}>
          <button onClick={() => setVista("individual")} className="rounded-lg py-2 text-[13px] font-black inline-flex items-center justify-center gap-1.5" style={seg(vista === "individual")}>
            <Tag size={14} />Precio individual
          </button>
          <button onClick={() => setVista("paquete")} className="rounded-lg py-2 text-[13px] font-black inline-flex items-center justify-center gap-1.5" style={seg(vista === "paquete")}>
            <Package size={14} />Paquete{pk.unidades ? ` (${pk.unidades})` : ""}
          </button>
        </div>}

        {vista === "individual" && (<>
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TC.blueLight }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: sartén, licuadora, CO9655…"
              inputMode="search" type="search" autoComplete="off" autoCorrect="off" spellCheck={false}
              className="w-full rounded-lg pl-9 pr-3 py-2.5 text-base font-semibold outline-none" style={{ ...inp, background: TC.bg }} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2" style={{ WebkitOverflowScrolling: "touch" }}>
            <button onClick={() => setGrupo("ALL")} className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={chip(grupo === "ALL")}>Todos</button>
            {GRUPOS_PRECIOS.map((g) => (
              <button key={g} onClick={() => setGrupo(g)} className="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={chip(grupo === g)}>{g}</button>
            ))}
          </div>
          <div className="text-xs font-bold mb-2" style={{ color: TC.mut }}>{items.length} producto{items.length !== 1 ? "s" : ""} con precio · toca un código para copiarlo</div>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid " + TC.border, background: "#fff" }}>
            {mostrar.length === 0 && (
              <div className="text-center py-10" style={{ color: TC.mut }}>
                <Search size={30} strokeWidth={1.25} className="mx-auto mb-2 opacity-40" />
                <div className="text-sm font-bold">Sin resultados. Prueba otra palabra o código.</div>
              </div>
            )}
            {mostrar.map((x) => (
              <TarjetaPrecio key={x.id} x={x} cant={enPaquete(x.id)} copiado={copiado} onCopiar={copiar} onAgregar={agregar} onSimular={simular} />
            ))}
            {items.length > LIMITE_PRECIOS && (
              <div className="px-3 py-3 text-center text-xs italic" style={{ color: TC.mut }}>+ {items.length - LIMITE_PRECIOS} más — refina tu búsqueda</div>
            )}
          </div>
        </>)}

        {MOSTRAR_PAQUETES && vista === "paquete" && (<>
          {lineas.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ color: TC.mut, background: TC.bg }}>
              <Package size={30} strokeWidth={1.25} className="mx-auto mb-2 opacity-50" />
              <div className="text-sm font-bold">El paquete está vacío</div>
              <div className="text-xs mt-1">Agrega productos desde "Precio individual"</div>
              <button onClick={() => { setModoCliente(false); setVista("individual"); }} className="mt-3 px-4 py-2 rounded-lg text-[12px] font-black text-white" style={{ background: TC.blueMid }}>Ir a la lista de precios</button>
            </div>
          ) : modoCliente ? (<>
            {/* ── VISTA PARA EL CLIENTE: sin controles ── */}
            {pk.pct > 0 && (
              <div className="rounded-2xl px-4 py-4 text-center text-white mb-3" style={{ background: "linear-gradient(135deg, #1d8a4f 0%, #136b3b 100%)", boxShadow: TC.glowLg }}>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] opacity-90"><Sparkles size={12} />Promoción</div>
                <div className="text-2xl font-bold leading-tight mt-1" style={{ fontFamily: TC.serif }}>{nombrePromo}</div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-[13px] font-black" style={{ background: "rgba(255,255,255,.18)" }}>{pk.pct}% de descuento</div>
              </div>
            )}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid " + TC.border }}>
              {lineas.map((x) => (
                <div key={x.id} className="px-3 py-2.5 bg-white flex items-start justify-between gap-3" style={{ borderBottom: "1px solid " + TC.bg }}>
                  <div className="text-[13px] font-bold leading-snug" style={{ color: TC.text }}>{x.cant > 1 && <span style={{ color: TC.blueMid }}>{x.cant} × </span>}{x.n}</div>
                  <div className="text-[13px] font-black shrink-0" style={{ color: TC.text }}>{fmtC(x.p * x.cant)}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 mt-3">
              {pk.pct > 0 ? (<>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[13px] font-semibold" style={{ color: "#5a5a5a" }}>Precio regular</span>
                  <span className="text-[14px] font-bold line-through" style={{ color: TC.mut }}>{fmtC(pk.suma)}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#e9f7ef" }}>
                  <span className="text-[13px] font-black" style={{ color: TC.green }}>Tu ahorro</span>
                  <span className="text-[14px] font-black" style={{ color: TC.green }}>− {fmtC(pk.descuento)}</span>
                </div>
              </>) : null}
              <div className="flex items-center justify-between px-3 py-3 rounded-lg" style={{ background: TC.bluePale }}>
                <span className="text-[14px] font-black" style={{ color: TC.blue }}>{pk.pct > 0 ? "Precio especial" : "Precio del paquete"}</span>
                <span className="text-2xl font-black" style={{ fontFamily: TC.serif, color: TC.blue }}>{fmtC(pk.total)}</span>
              </div>
            </div>
            <div className="text-[10px] mt-1 text-center" style={{ color: TC.mut }}>Precios antes de tax y envío</div>
            <button onClick={financiarPaquete} className="w-full mt-4 rounded-xl py-3 text-[14px] font-black text-white inline-flex items-center justify-center gap-2 transition active:scale-[.98]" style={{ background: TC.blue }}>
              <Calculator size={16} />Ver planes de pago
            </button>
            <button onClick={() => setModoCliente(false)} className="w-full mt-3 py-1.5 text-[11px] font-bold inline-flex items-center justify-center gap-1" style={{ color: TC.mut }}>
              <Pencil size={11} />Volver a editar
            </button>
          </>) : (<>
            {/* ── VISTA DEL VENDEDOR: productos, promoción y totales ── */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid " + TC.border }}>
              {lineas.map((x) => (
                <div key={x.id} className="px-3 py-3 bg-white" style={{ borderBottom: "1px solid " + TC.bg }}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold leading-snug" style={{ color: TC.text }}>{x.n}</div>
                      <div className="mt-1"><Codigos cod={x.cod} copiado={copiado} onCopiar={copiar} /></div>
                    </div>
                    <button onClick={() => quitar(x.id)} aria-label="Quitar producto" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: TC.red }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center rounded-lg overflow-hidden" style={{ border: "1.5px solid " + TC.border }}>
                      <button onClick={() => cambiarCant(x.id, -1)} aria-label="Menos" className="w-9 h-8 flex items-center justify-center" style={{ background: TC.bg }}><Minus size={14} /></button>
                      <span className="w-9 text-center text-[14px] font-black">{x.cant}</span>
                      <button onClick={() => cambiarCant(x.id, 1)} aria-label="Más" className="w-9 h-8 flex items-center justify-center" style={{ background: TC.bg }}><Plus size={14} /></button>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-black" style={{ color: TC.text }}>{fmtC(x.p * x.cant)}</div>
                      {x.cant > 1 && <div className="text-[10px]" style={{ color: TC.mut }}>{x.cant} × {fmtC(x.p)}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promoción */}
            <div className="rounded-xl p-3 mt-4" style={{ background: TC.bg, border: "1px solid " + TC.border }}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px] font-black inline-flex items-center gap-1.5" style={{ color: TC.green }}><Sparkles size={14} />Promoción</div>
                {(promo || promoPct > 0) && <button onClick={quitarPromo} className="text-[11px] font-bold" style={{ color: TC.red }}>Quitar promoción</button>}
              </div>
              <div className="text-[11px] mt-0.5 mb-2" style={{ color: TC.mut }}>Elígela antes de mostrarle el paquete al cliente</div>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-black mb-1" style={{ color: TC.text }}>Especial</label>
                  <div className="relative">
                    <select value={promo} onChange={(e) => setPromo(e.target.value)} aria-label="Especial"
                      className="appearance-none w-full rounded-lg pl-3 pr-8 py-2.5 text-[15px] font-bold outline-none"
                      style={{ ...inp, borderColor: promo ? TC.green : TC.border, color: promo ? TC.green : "#6b7280" }}>
                      <option value="">Elegir especial…</option>
                      {PROMOCIONES.map((n) => <option key={n} value={n}>{n}</option>)}
                      <option value="__otro">Otro (escribir)…</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: promo ? TC.green : TC.mut }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black mb-1" style={{ color: TC.text }}>Descuento</label>
                  <div className="relative">
                    <select value={promoPct} onChange={(e) => setPromoPct(Number(e.target.value))} aria-label="Porcentaje de descuento"
                      className="appearance-none w-full rounded-lg pl-3 pr-8 py-2.5 text-[15px] font-black outline-none"
                      style={{ ...inp, borderColor: promoPct ? TC.green : TC.border, color: promoPct ? TC.green : "#6b7280" }}>
                      <option value={0}>0%</option>
                      {PORCENTAJES_PROMO.map((pc) => <option key={pc} value={pc}>{pc}%</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: promoPct ? TC.green : TC.mut }} />
                  </div>
                </div>
              </div>
              {promo === "__otro" && (
                <input value={promoOtro} onChange={(e) => setPromoOtro(e.target.value)} placeholder="Ej. Especial día de las madres" maxLength={40}
                  className="w-full mt-2 rounded-lg px-3 py-2 text-base font-semibold outline-none" style={inp} />
              )}
            </div>

            <div className="space-y-1 mt-3">
              <Fila l={`Suma de ${pk.unidades} producto${pk.unidades !== 1 ? "s" : ""}`} v={fmtC(pk.suma)} />
              <Fila l={pk.pct ? `${nombrePromo} (${pk.pct}%)` : "Sin promoción"} v={pk.descuento > 0 ? "− " + fmtC(pk.descuento) : fmtC(0)} pale />
              <Fila l="Precio del paquete" v={fmtC(pk.total)} strong pale />
            </div>
            <div className="text-[10px] mt-1 text-center" style={{ color: TC.mut }}>El descuento se aplica sobre el total y el precio se redondea a la decena de arriba · precios antes de tax y envío</div>

            <button onClick={() => { setModoCliente(true); try { window.scrollTo(0, 0); } catch (e) { /* sin scroll */ } }} className="w-full mt-4 rounded-xl py-3 text-[14px] font-black text-white inline-flex items-center justify-center gap-2 transition active:scale-[.98]" style={{ background: TC.green }}>
              <Eye size={16} />Mostrar al cliente
            </button>
            <button onClick={financiarPaquete} className="w-full mt-2 rounded-xl py-3 text-[14px] font-black text-white inline-flex items-center justify-center gap-2 transition active:scale-[.98]" style={{ background: TC.blue }}>
              <Calculator size={16} />Financiar este paquete
            </button>
            <button onClick={() => { setPaquete([]); quitarPromo(); }} className="w-full mt-2 rounded-xl py-2.5 text-[12px] font-black inline-flex items-center justify-center gap-1.5" style={{ background: "#fff", color: TC.red, border: "1.5px solid #fecaca" }}>
              <Trash2 size={13} />Vaciar paquete
            </button>
          </>)}
        </>)}
      </div>

      {/* Barra del paquete mientras navegas la lista */}
      {MOSTRAR_PAQUETES && vista === "individual" && paquete.length > 0 && activo && (
        <div className="fixed left-0 right-0 bottom-0 z-20 px-4" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button onClick={irAlPaquete}
            className="max-w-2xl mx-auto w-full rounded-2xl px-4 py-3 flex items-center justify-between text-white" style={{ background: TC.green, boxShadow: TC.glowLg }}>
            <span className="inline-flex items-center gap-2 text-[13px] font-black"><Package size={16} />Paquete · {pk.unidades} producto{pk.unidades !== 1 ? "s" : ""}{pk.pct ? ` · ${pk.pct}%` : ""}</span>
            <span className="text-[15px] font-black">{fmtC(pk.total)} ›</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════ SIMULADOR DE COMPRA ══════════ */
function Fila({ l, v, strong, pale, neg }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg" style={pale ? { background: TC.bluePale } : {}}>
      <span className={"text-[13px] min-w-0 " + (strong ? "font-black" : "font-semibold")} style={{ color: strong ? TC.blue : "#5a5a5a" }}>{l}</span>
      <span className={"text-[14px] whitespace-nowrap shrink-0 " + (strong ? "font-black" : "font-bold")} style={{ color: neg ? TC.red : strong ? TC.blue : TC.text }}>{v}</span>
    </div>
  );
}
function CampoDinero({ value, onChange, chico, activo }) {
  return (
    <div className="relative">
      <span className={"absolute top-1/2 -translate-y-1/2 font-black " + (chico ? "left-2.5 text-sm" : "left-3")} style={{ color: TC.blueMid }}>$</span>
      <input type="number" inputMode="decimal" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00"
        className={"w-full rounded-lg outline-none font-bold " + (chico ? "pl-6 pr-2 py-2 text-base" : "pl-7 pr-3 py-2.5 text-base")}
        style={activo === false ? { ...inp, background: "#f7f8fa", color: "#6b7280", borderStyle: "dashed" } : activo ? { ...inp, borderColor: TC.blueMid } : inp} />
    </div>
  );
}
const Etiqueta = ({ t, nota }) => (
  <label className="block text-[13px] font-black mb-1.5" style={{ color: TC.text }}>
    {t} {nota && <span className="font-normal text-xs" style={{ color: TC.mut }}>({nota})</span>}
  </label>
);
const Ayuda = ({ t }) => <div className="text-[11px] mt-1" style={{ color: TC.mut }}>{t}</div>;

const ESTADOS_ORDEN = Object.entries(ESTADOS_IMPUESTO).sort((a, b) => a[1][0].localeCompare(b[1][0]));

function SimuladorCompra({ carga, estado, setEstado }) {
  // Precio: se escribe el del producto O el total (con envío y taxes); el otro se calcula
  const [modoPrecio, setModoPrecio] = useState("producto"); // 'producto' | 'total'
  const [precioTxt, setPrecioTxt] = useState("");
  const [totalTxt, setTotalTxt] = useState("");
  const [envioTxt, setEnvioTxt] = useState("");
  const [envioManual, setEnvioManual] = useState(false);
  const [depPct, setDepPct] = useState("5");
  const [depAmt, setDepAmt] = useState("");
  const [depMode, setDepMode] = useState("pct"); // 'pct' | 'amt'
  const [balance, setBalance] = useState("");
  const [pagoCustom, setPagoCustom] = useState("");
  const [origen, setOrigen] = useState(""); // de dónde vino el precio (Lista de Precios / paquete)

  // Precio enviado desde la Lista de Precios o desde un paquete
  useEffect(() => {
    if (!carga) return;
    setPrecioTxt(String(carga.precio)); setModoPrecio("producto"); setOrigen(carga.origen || "");
  }, [carga]);

  const envioFijo = envioManual ? envioTxt : null;
  const precioNum = modoPrecio === "total" ? precioDesdeTotal(totalTxt, estado, envioFijo) : parseFloat(precioTxt) || 0;
  const envioNum = envioManual ? parseFloat(envioTxt) || 0 : precioNum * ENVIO_PCT;

  const r = calcular({ precio: precioNum, envio: envioNum, estado, depMode, depPct, depAmt, balance });
  const custom = useMemo(() => amortizar(r.financeTotal, pagoCustom, r.deposito, r.interes), [pagoCustom, r.financeTotal, r.deposito, r.interes]);

  // Lo que se ve en cada campo: el que escribiste tal cual; el otro, calculado
  const precioMostrar = modoPrecio === "producto" ? precioTxt : precioNum > 0 ? precioNum.toFixed(2) : "";
  const totalMostrar = modoPrecio === "total" ? totalTxt : r.totalVenta > 0 ? r.totalVenta.toFixed(2) : "";
  const envioMostrar = envioManual ? envioTxt : precioNum > 0 ? envioNum.toFixed(2) : "";
  const totalImposible = modoPrecio === "total" && parseFloat(totalTxt) > 0 && precioNum <= 0;

  const cambiarPrecio = (v) => { setPrecioTxt(v); setModoPrecio("producto"); setOrigen(""); };
  const cambiarTotal = (v) => { setTotalTxt(v); setModoPrecio("total"); setOrigen(""); };
  // Al cambiar de estado (aquí o arriba) se mantiene el PRECIO DEL PRODUCTO (el total sube o baja con el tax)
  const precioAnterior = useRef(precioNum);
  const estadoAnterior = useRef(estado);
  useEffect(() => {
    if (estadoAnterior.current !== estado) {
      if (modoPrecio === "total" && precioAnterior.current > 0) { setPrecioTxt(precioAnterior.current.toFixed(2)); setModoPrecio("producto"); }
      estadoAnterior.current = estado;
    }
  }, [estado]);
  useEffect(() => { precioAnterior.current = precioNum; });
  const cambiarEstado = (e) => setEstado(e);
  // Si borran el envío, vuelve a calcularse solo al 5%
  const cambiarEnvio = (v) => {
    if (v === "") { setEnvioManual(false); setEnvioTxt(""); return; }
    setEnvioTxt(v); setEnvioManual(true);
  };
  const cambiarPct = (v) => { setDepPct(v); setDepMode("pct"); };
  const cambiarAmt = (v) => { setDepAmt(v); setDepMode("amt"); };

  // Los 3 controles del depósito se muestran sincronizados
  const pctTexto = depMode === "pct" ? depPct : r.pctReal.toFixed(1);
  const amtTexto = depMode === "amt" ? depAmt : r.deposito > 0 ? r.deposito.toFixed(2) : "";
  const infinito = custom && custom.infinito;
  const pctActivo = depMode === "pct" ? parseFloat(depPct) : null;
  const tasaTxt = ESTADOS_IMPUESTO[estado] ? ESTADOS_IMPUESTO[estado][1].toFixed(2) + "%" : "0%";

  return (
    <div className="space-y-3">
      {/* CONFIGURA TU COMPRA */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: TC.panel, border: "1px solid " + TC.border, boxShadow: TC.glow }}>
        <div>
          <div className="text-lg font-bold" style={{ fontFamily: TC.serif, color: TC.blue }}>Configura tu Compra</div>
          <div className="text-xs" style={{ color: TC.mut }}>Escribe el precio del producto o el precio total</div>
        </div>
        <div>
          <Etiqueta t="Estado de Envío" />
          <select value={estado} onChange={(e) => cambiarEstado(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-base font-bold outline-none" style={inp}>
            {ESTADOS_ORDEN.map(([k, [n, t]]) => <option key={k} value={k}>{n} ({t.toFixed(2)}%)</option>)}
          </select>
        </div>
        <div className="rounded-xl p-3 space-y-3" style={{ background: TC.bg, border: "1px solid " + TC.border }}>
          <div>
            <Etiqueta t="Precio del Producto" nota={modoPrecio === "total" ? "calculado del total" : "sin envío ni taxes"} />
            <CampoDinero value={precioMostrar} onChange={cambiarPrecio} activo={modoPrecio === "producto"} />
            {origen && modoPrecio === "producto" && (
              <div className="text-[11px] mt-1 font-bold inline-flex items-center gap-1" style={{ color: TC.green }}><Tag size={11} />{origen}</div>
            )}
          </div>
          <div>
            <Etiqueta t="Precio Total" nota="incluye taxes y envío" />
            <CampoDinero value={totalMostrar} onChange={cambiarTotal} activo={modoPrecio === "total"} />
            {totalImposible
              ? <div className="text-[11px] mt-1 font-bold" style={{ color: TC.red }}>El envío escrito a mano es mayor que el total; revisa el envío.</div>
              : modoPrecio === "total" && <Ayuda t={`Calculando hacia atrás: el total ya trae envío y tax de ${tasaTxt}, por eso el producto sale más bajo`} />}
          </div>
        </div>
        <div>
          <Etiqueta t="Costo de Envío" nota="promedio 5%, editable" />
          <CampoDinero value={envioMostrar} onChange={cambiarEnvio} />
          <Ayuda t={envioManual ? "Editado a mano · bórralo para volver al 5% automático" : "Se calcula automático al 5% del precio del producto · puedes editarlo"} />
        </div>
        <div>
          <Etiqueta t="Depósito Inicial" nota="5% por defecto, editable" />
          <div className="inline-block text-[13px] font-black text-white px-3 py-1 rounded-md mb-2" style={{ background: TC.blue }}>
            {Math.round(r.pctReal)}% · {fmtC(r.deposito)}
          </div>
          <input type="range" min="0" max="100" step="1" value={Math.min(100, Math.round(depMode === "pct" ? parseFloat(depPct) || 0 : r.pctReal))}
            onChange={(e) => cambiarPct(e.target.value)} className="w-full" style={{ accentColor: TC.blueMid }} />
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <label className="block text-[11px] font-black mb-1" style={{ color: TC.text }}>Porcentaje (%)</label>
              <input type="number" inputMode="decimal" min="0" max="100" step="1" value={pctTexto} onChange={(e) => cambiarPct(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-base font-bold outline-none" style={inp} />
            </div>
            <div>
              <label className="block text-[11px] font-black mb-1" style={{ color: TC.text }}>Monto ($)</label>
              <CampoDinero value={amtTexto} onChange={cambiarAmt} chico />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] font-black mb-1.5" style={{ color: TC.green }}>Depósitos sugeridos</div>
            <div className="grid grid-cols-3 gap-2">
              {DEPOSITOS_SUGERIDOS.map((pc) => {
                const on = pctActivo === pc;
                const monto = calcular({ precio: precioNum, envio: envioNum, estado, depMode: "pct", depPct: pc }).deposito;
                return (
                  <button key={pc} onClick={() => cambiarPct(String(pc))} className="rounded-xl py-2 text-center transition active:scale-95"
                    style={on ? { background: TC.green, color: "#fff", border: "2px solid " + TC.green } : { background: "#e9f7ef", color: TC.green, border: "2px solid #9fd8b6" }}>
                    <div className="text-[15px] font-black leading-tight">{pc}%</div>
                    <div className="text-[11px] font-bold" style={{ opacity: on ? 0.9 : 0.8 }}>{monto > 0 ? fmtC(monto) : "—"}</div>
                  </button>
                );
              })}
            </div>
          </div>
          {r.depositoExcede
            ? <div className="text-[11px] mt-1 font-bold" style={{ color: TC.red }}>El depósito no puede pasar del Total de Venta ({fmtC(r.totalVenta)}); se toma ese máximo.</div>
            : <Ayuda t="El depósito por % se redondea al dólar de arriba · slider, % y $ se sincronizan" />}
        </div>
        <div>
          <Etiqueta t="Balance Pendiente" nota="deuda anterior del cliente" />
          <CampoDinero value={balance} onChange={setBalance} />
          <Ayuda t="Se suma al monto a financiar después del depósito" />
        </div>
      </div>

      {/* RESUMEN DE INVERSIÓN */}
      <div className="rounded-2xl p-5" style={{ background: TC.panel, border: "2px solid " + TC.blue, boxShadow: TC.glowLg }}>
        <div className="text-center mb-4">
          <div className="text-xl font-black" style={{ fontFamily: TC.serif, color: TC.blue }}>Resumen de Inversión</div>
          <div className="text-[11px] tracking-[.4em]" style={{ color: TC.blueLight }}>◆ ◆ ◆</div>
        </div>
        <div className="space-y-1">
          <Fila l="Precio del producto" v={fmtC(r.nPrecio)} />
          <Fila l="Costo de envío" v={fmtC(r.nEnvio)} />
          <Fila l="Subtotal" v={fmtC(r.subtotal)} />
          <Fila l={"Impuesto (" + (r.tasa * 100).toFixed(2) + "%)"} v={fmtC(r.impuesto)} />
          <Fila l="Total de Venta" v={fmtC(r.totalVenta)} strong />
          <Fila l={"Depósito inicial (" + r.pctReal.toFixed(1) + "%)"} v={"− " + fmtC(r.deposito)} pale />
          <Fila l="Monto a financiar (venta)" v={fmtC(r.financeSub)} pale />
          {r.nBalance > 0 && <Fila l="Balance pendiente" v={"+ " + fmtC(r.nBalance)} neg />}
          <Fila l="Monto Total a Financiar" v={fmtC(r.financeTotal)} strong pale />
        </div>

        <div className="text-[11px] font-black uppercase tracking-widest mt-5 mb-2" style={{ color: TC.mut }}>Opciones de Financiamiento</div>
        <div className="grid grid-cols-2 gap-2">
          {r.planes.map((pl) => {
            // Recomendados (18 y 12) = verde · resto = blanco · el de 32 solo lleva el aviso en gris
            const caja = pl.destaca ? { border: "2px solid " + TC.green, background: "#e9f7ef" }
              : { border: "1px solid " + TC.border, background: "#fff" };
            const colorPago = pl.destaca ? TC.green : TC.blue;
            return (
            <div key={pl.meses} className="rounded-xl p-3 text-center" style={caja}>
              {pl.destaca && <div className="text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1" style={{ color: TC.green }}><Star size={10} fill="currentColor" />Recomendado</div>}
              {pl.minimo && <div className="text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 leading-tight" style={{ color: TC.mut }}><AlertTriangle size={10} />Pago mínimo · No recomendado</div>}
              <div className="text-[12px] font-black" style={{ color: TC.text }}>{pl.meses} Meses</div>
              <div className="text-xl font-black my-0.5" style={{ fontFamily: TC.serif, color: colorPago }}>{fmtC(pl.pago)}<span className="text-[10px] font-bold ml-1" style={{ color: TC.mut }}>por mes</span></div>
              <div className="text-[10px]" style={{ color: TC.mut }}>Total a pagar: <b style={{ color: TC.text }}>{fmtC(pl.total)}</b></div>
            </div>
            );
          })}
        </div>

        <div className="text-[11px] font-black uppercase tracking-widest mt-5 mb-2" style={{ color: TC.mut }}>Pago Mensual Personalizado</div>
        <div className="rounded-xl p-4" style={{ background: TC.bg, border: "1px solid " + TC.border }}>
          <Etiqueta t="¿Cuánto puedes pagar al mes?" />
          <div className="mb-3"><CampoDinero value={pagoCustom} onChange={setPagoCustom} /></div>
          <div className="rounded-xl p-4 text-center" style={{ background: "#fff", border: "2px solid " + (infinito ? TC.red : TC.blue) }}>
            <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: TC.mut }}>Meses exactos para liquidar</div>
            <div className="text-3xl font-black" style={{ fontFamily: TC.serif, color: infinito ? TC.red : TC.blue }}>
              {!custom ? "—" : infinito ? "∞" : custom.meses + " mes" + (custom.meses !== 1 ? "es" : "")}
            </div>
            {infinito && <div className="text-[11px] mt-1 font-bold" style={{ color: TC.red }}>El pago no cubre los intereses</div>}
            {custom && !infinito && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-left">
                <div><div className="text-[9px] font-black uppercase" style={{ color: TC.mut }}>Último pago</div><div className="text-[12px] font-black" style={{ color: TC.text }}>{fmtC(custom.ultimo)}</div></div>
                <div><div className="text-[9px] font-black uppercase" style={{ color: TC.mut }}>Total pagado</div><div className="text-[12px] font-black" style={{ color: TC.text }}>{fmtC(custom.totalPagado)}</div></div>
                <div><div className="text-[9px] font-black uppercase" style={{ color: TC.mut }}>Intereses</div><div className="text-[12px] font-black" style={{ color: TC.text }}>{fmtC(custom.totalInteres)}</div></div>
              </div>
            )}
          </div>
          <div className="text-[10px] mt-2 text-center" style={{ color: TC.mut }}>Interés simulado: {(r.interes * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}% mensual sobre saldo decreciente{estado === "NV" ? " (Nevada)" : ""}</div>
        </div>
        <div className="text-[10px] mt-3 text-center italic" style={{ color: TC.mut }}>Los montos son una estimación con fines informativos. Los impuestos pueden variar según condado.</div>
      </div>
    </div>
  );
}

/* ══════════ APP ══════════ */
const CLAVE_ESTADO = "impact_estado";
function leerEstadoGuardado() {
  try { const e = window.localStorage.getItem(CLAVE_ESTADO); if (e && ESTADOS_IMPUESTO[e]) return e; } catch (err) { /* sin almacenamiento */ }
  return ESTADO_INICIAL;
}

export default function App() {
  const [tab, setTab] = useState("buscador");
  const [estado, setEstadoBase] = useState(leerEstadoGuardado);
  const setEstado = (e) => {
    setEstadoBase(e);
    try { window.localStorage.setItem(CLAVE_ESTADO, e); } catch (err) { /* sin almacenamiento */ }
  };
  const [carga, setCarga] = useState(null);
  const financiar = (precio, origen) => {
    setCarga({ precio, origen, n: Date.now() });
    setTab("simulador");
    try { window.scrollTo(0, 0); } catch (e) { /* sin scroll */ }
  };
  const Tab = ({ id, icon: I, t }) => (
    <button onClick={() => setTab(id)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[13px] font-black transition"
      style={tab === id ? { background: "#fff", color: TC.blue, boxShadow: TC.glow } : { color: "rgba(255,255,255,.85)" }}>
      <I size={16} />{t}
    </button>
  );
  return (
    <div className="min-h-screen" style={{ background: TC.bg }}>
      <header className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: TC.blue, paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="text-white text-xl font-bold leading-tight" style={{ fontFamily: TC.serif }}>Impact <span className="italic" style={{ color: "#9fbcf0" }}>Enterprises</span></div>
              <div className="text-[9px] tracking-[0.12em] text-white/70 font-semibold uppercase whitespace-nowrap">Códigos, Precios y Simulador</div>
            </div>
            {/* Estado para toda la app (Precios y Simulador) */}
            <label className="relative shrink-0 mt-0.5">
              <span className="sr-only">Estado</span>
              <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9fbcf0" }} />
              <select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado"
                className="appearance-none rounded-full pl-7 pr-7 py-1.5 text-[13px] font-black outline-none"
                style={{ background: "rgba(255,255,255,.14)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", maxWidth: 140 }}>
                {ESTADOS_ORDEN.map(([k, [n]]) => <option key={k} value={k} style={{ color: "#111" }}>{n}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#fff" }} />
            </label>
          </div>
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,.12)" }}>
            <Tab id="buscador" icon={ScanSearch} t="Buscador" />
            <Tab id="precios" icon={Tag} t="Precios" />
            <Tab id="simulador" icon={Calculator} t="Simulador" />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        {/* Las pestañas quedan montadas para no perder lo escrito ni el paquete al cambiar */}
        <div style={{ display: tab === "buscador" ? "block" : "none" }}><BuscadorCodigos /></div>
        <div style={{ display: tab === "precios" ? "block" : "none" }}><ListaPrecios onFinanciar={financiar} activo={tab === "precios"} estado={estado} onIrSimulador={() => setTab("simulador")} /></div>
        <div style={{ display: tab === "simulador" ? "block" : "none" }}><SimuladorCompra carga={carga} estado={estado} setEstado={setEstado} /></div>
      </main>
      <Analytics />
    </div>
  );
}
