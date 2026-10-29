# Códigos y Simulador — Impact Enterprises

Mini app con dos funciones, extraídas de ImpactOS:
- **Buscador de Códigos**: 486 productos con los códigos de la Lista de Precios 2026 (nivel 3), búsqueda sin acentos por código, nombre, descripción o palabras clave. Tocar un producto copia su código. Los productos principales salen siempre primero (marcados ★ Principal), luego accesorios y cartuchos, luego repuestos y al final material interno. Licuadora = Power Blender Max; batidor = Blender GO.
- **Simulador de Compra**: impuesto por estado, envío 5% automático, depósito (slider / % / $), balance pendiente, planes 32/24/16/12 meses y pago mensual personalizado (1.5% mensual). **Nevada:** impuesto 8.38% e interés 2% mensual; sus planes se calculan con la fórmula de amortización exacta al 2%.

## Subir a Vercel
1. Crear un repo nuevo en GitHub y subir todo el contenido de esta carpeta (respetando la carpeta `src`).
2. En Vercel: Add New → Project → importar el repo. Vercel detecta Vite solo (build `npm run build`, salida `dist`).
3. Deploy. No necesita variables de entorno ni Firebase.

Archivos: `src/datos.js` (catálogo e impuestos), `src/logica.js` (cálculos), `src/App.jsx` (pantallas).

**Simulador (oct-2026):**
- Planes: 32, 24, 18 y 12 meses. 18 meses usa el factor exacto al 1.5% (6.38%); en Nevada todos los planes al 2% exacto.
- Precio: se escribe el *precio del producto* (se suman envío 5% y taxes) o el *precio total* (ya incluye envío y taxes; el producto se calcula hacia atrás). Al cambiar de estado se mantiene el precio del producto.
- Depósito: 5% por defecto y editable; botones verdes sugeridos 10%, 15% y 20%. El depósito por % se redondea al dólar de arriba.
