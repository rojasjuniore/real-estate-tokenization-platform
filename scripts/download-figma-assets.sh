#!/bin/bash

# Script para descargar assets SVG de Figma
# Ejecutar: bash scripts/download-figma-assets.sh
# Requiere: servidor Figma MCP activo en localhost:3845

ASSETS_DIR="public/assets/icons/figma"

# Crear directorio si no existe
mkdir -p "$ASSETS_DIR"

echo "Descargando assets de Figma..."

# SlidePanel shape curvo
curl -s "http://localhost:3845/assets/cf3825b12c0a7f4108fd9fb9d9943e59afd308d2.svg" -o "$ASSETS_DIR/slide-panel-shape.svg"
echo "✓ slide-panel-shape.svg"

# Icon Soporte (auriculares)
curl -s "http://localhost:3845/assets/111707ad6149fddb084528c150abd1ead1554248.svg" -o "$ASSETS_DIR/icon-soporte-outer.svg"
curl -s "http://localhost:3845/assets/5ac2d775e31e4098bb76d4b5c4cac25a5d226a18.svg" -o "$ASSETS_DIR/icon-soporte-inner.svg"
echo "✓ icon-soporte (2 files)"

# Icon Respaldo (escudo)
curl -s "http://localhost:3845/assets/9137270e9c7c2f300b61dd842137084dea681eed.svg" -o "$ASSETS_DIR/icon-respaldo.svg"
echo "✓ icon-respaldo.svg"

# Icon Sesion (persona con login)
curl -s "http://localhost:3845/assets/e9b35815c9cae37d1cff4339a237c17d95579fcc.svg" -o "$ASSETS_DIR/icon-sesion-1.svg"
curl -s "http://localhost:3845/assets/651b9c4d18db3932f7a5960834d08f40cbe3e20b.svg" -o "$ASSETS_DIR/icon-sesion-2.svg"
curl -s "http://localhost:3845/assets/abbecdc9c3c0511232491718b59d1e76b5436d3a.svg" -o "$ASSETS_DIR/icon-sesion-3.svg"
curl -s "http://localhost:3845/assets/855642e96d58656c0f41cc2262cdeaa1161c4152.svg" -o "$ASSETS_DIR/icon-sesion-4.svg"
echo "✓ icon-sesion (4 files)"

# Icon Proyectos (documento con edificio)
curl -s "http://localhost:3845/assets/d8112e5a58d7a4380a2a9d180e0940a320a9a799.svg" -o "$ASSETS_DIR/icon-proyectos-1.svg"
curl -s "http://localhost:3845/assets/d20cf8f72f2bc21fb6a17e0f2aaabc91a0fb35d6.svg" -o "$ASSETS_DIR/icon-proyectos-2.svg"
curl -s "http://localhost:3845/assets/9208c344089b94896e194f0a5a6904ee34cec082.svg" -o "$ASSETS_DIR/icon-proyectos-3.svg"
curl -s "http://localhost:3845/assets/817bf1b8bd31dfab46356854e792451d501d360c.svg" -o "$ASSETS_DIR/icon-proyectos-4.svg"
echo "✓ icon-proyectos (4 files)"

# Icon Buscar
curl -s "http://localhost:3845/assets/2fd56cc23643656b6410769a0ff3083da926b8b6.svg" -o "$ASSETS_DIR/icon-buscar.svg"
echo "✓ icon-buscar.svg"

# Social Login Icons
curl -s "http://localhost:3845/assets/b4dfc5a7946ba8d2611394513b74460fbdedf1e3.svg" -o "$ASSETS_DIR/icon-google.svg"
curl -s "http://localhost:3845/assets/8f2a626998640accc4effdd5d783829070fa7b70.svg" -o "$ASSETS_DIR/icon-facebook.svg"
curl -s "http://localhost:3845/assets/e4ada80a1adecf61f6998e22de6726172a88b43d.svg" -o "$ASSETS_DIR/icon-apple-leaf.svg"
curl -s "http://localhost:3845/assets/61e46f57e43499a7c108aecbf906d3bcdb7c63c9.svg" -o "$ASSETS_DIR/icon-apple-body.svg"
echo "✓ social icons (4 files)"

# Redes sociales footer
curl -s "http://localhost:3845/assets/8f818c40779f204fdb021cb895895279afe80743.svg" -o "$ASSETS_DIR/icon-linkedin.svg"
curl -s "http://localhost:3845/assets/cb8efe63add30a820beaa900ec3a310c5a989d17.svg" -o "$ASSETS_DIR/icon-instagram.svg"
curl -s "http://localhost:3845/assets/b58a1a60249a2ebba723ad30371b05f05bf7ebcd.svg" -o "$ASSETS_DIR/icon-youtube.svg"
curl -s "http://localhost:3845/assets/1d06006f19db3d47b800440abacba45f6758586a.svg" -o "$ASSETS_DIR/icon-facebook-footer.svg"
echo "✓ footer social icons (4 files)"

echo ""
echo "Assets descargados en: $ASSETS_DIR"
ls -la "$ASSETS_DIR"
