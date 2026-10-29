# Códigos y Simulador — Impact Enterprises

Mini app con dos funciones, extraídas de ImpactOS:
- **Buscador de Códigos**: 486 productos con los códigos de la Lista de Precios 2026 (nivel 3), búsqueda sin acentos por código, nombre, descripción o palabras clave. Tocar un producto copia su código. Los productos principales salen siempre primero (marcados ★ Principal), luego accesorios y cartuchos, luego repuestos y al final material interno. Licuadora = Power Blender Max; batidor = Blender GO.
- **Simulador de Compra**: impuesto por estado, envío 5% automático, depósito (slider / % / $), balance pendiente, planes 32/24/16/12 meses y pago mensual personalizado (1.5% mensual). **Nevada:** impuesto 8.38% e interés 2% mensual; sus planes se calculan con la fórmula de amortización exacta al 2%.

## Subir a Vercel
1. Crear un repo nuevo en GitHub y subir todo el contenido de esta carpeta (respetando la carpeta `src`).
2. En Vercel: Add New → Project → importar el repo. Vercel detecta Vite solo (build `npm run build`, salida `dist`).
3. Deploy. No necesita variables de entorno ni Firebase.

Archivos: `src/datos.js` (catálogo e impuestos), `src/logica.js` (cálculos), `src/App.jsx` (pantallas).
