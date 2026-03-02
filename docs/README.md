# BuildingTok - Documentación Completa

**Sistema de Tokenización de Bienes Raíces en Blockchain**

---

## Índice de Documentación

Esta carpeta contiene toda la documentación del proyecto BuildingTok, organizada por categorías.

---

## Documentación Principal

### Sistema y Arquitectura

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [WHITEPAPER.md](./WHITEPAPER.md) | Whitepaper técnico completo del sistema | ✅ Actualizado |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura técnica, smart contracts, selectores, flujos | ✅ Actualizado |
| [USER_GUIDE.md](./USER_GUIDE.md) | Guía para usuarios finales | ✅ Actualizado |
| [DATA_FLOW.md](./DATA_FLOW.md) | Flujos de datos y patrones de arquitectura | ✅ |
| [SCHEMAS.md](./SCHEMAS.md) | Esquemas de base de datos y modelos | ✅ |
| [API_REFERENCE.md](./API_REFERENCE.md) | Referencia de endpoints API | ✅ |

### Desarrollo y Deploy

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [ROADMAP.md](./ROADMAP.md) | Plan de desarrollo y roadmap | ✅ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guía de despliegue | ✅ |
| [WEB3AUTH_SETUP.md](./WEB3AUTH_SETUP.md) | Configuración de Web3Auth | ✅ |
| [VERSION_LOG.md](./VERSION_LOG.md) | Historial de versiones | ✅ |
| [BUG_REFERENCE.md](./BUG_REFERENCE.md) | Bugs conocidos y soluciones | ✅ |

### UI/UX y Diseño

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [UX_DESIGN_SYSTEM.md](./UX_DESIGN_SYSTEM.md) | Sistema de diseño UX completo | ✅ |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tokens de diseño, colores, tipografía | ✅ |
| [UI_COMPONENTS.md](./UI_COMPONENTS.md) | Especificaciones de componentes | ✅ |
| [USER_FLOWS.md](./USER_FLOWS.md) | Flujos de usuario detallados | ✅ |
| [WIREFRAMES.md](./WIREFRAMES.md) | Wireframes ASCII de páginas | ✅ |
| [RESPONSIVE_INTERACTIONS.md](./RESPONSIVE_INTERACTIONS.md) | Diseño responsive y animaciones | ✅ |
| [DESIGN_IMPLEMENTATION_GUIDE.md](./DESIGN_IMPLEMENTATION_GUIDE.md) | Guía de implementación | ✅ |
| [FIGMA_IMPLEMENTATION_PLAN.md](./FIGMA_IMPLEMENTATION_PLAN.md) | Plan de implementación Figma | ✅ |

### Administración

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [ADMIN_PANEL.md](./ADMIN_PANEL.md) | Documentación del panel admin | ✅ |
| [ADMIN_PANEL_PROPOSAL.md](./ADMIN_PANEL_PROPOSAL.md) | Propuesta de panel admin | ✅ |

---

## Resumen del Sistema

### Arquitectura de Smart Contracts

```
┌─────────────────────┐     ┌──────────────────────┐
│   PropertyToken     │     │  PropertyMarketplace │
│   (ERC-1155)        │────►│   (P2P Trading)      │
│                     │     │                      │
│ • Crear propiedades │     │ • Crear listings     │
│ • Transferir tokens │     │ • Comprar tokens     │
│ • Quemar tokens     │     │ • Cancelar listings  │
└──────────┬──────────┘     └──────────┬───────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│ RoyaltyDistributor  │     │  PaymentProcessor    │
│   (Dividendos)      │     │    (Pagos)           │
│                     │     │                      │
│ • Crear distribución│     │ • Procesar pagos     │
│ • Reclamar royalty  │     │ • Multi-token        │
│ • Snapshot holders  │     │ • Comisiones         │
└─────────────────────┘     └──────────────────────┘
```

### Direcciones de Contratos (Polygon Mainnet)

| Contrato | Dirección | PolygonScan |
|----------|-----------|-------------|
| PropertyToken | `0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0` | [Ver](https://polygonscan.com/address/0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0) |
| PropertyMarketplace | `0x205969FB45AC1992Ca1c99839e57297EF4C057d6` | [Ver](https://polygonscan.com/address/0x205969FB45AC1992Ca1c99839e57297EF4C057d6) |
| RoyaltyDistributor | `0xc07A968973fBe928bD47c59F837397001C2374cE` | [Ver](https://polygonscan.com/address/0xc07A968973fBe928bD47c59F837397001C2374cE) |
| PaymentProcessor | `0xE2828aB33e2649Bd546BcFdfBB11131102Df7A0F` | [Ver](https://polygonscan.com/address/0xE2828aB33e2649Bd546BcFdfBB11131102Df7A0F) |

### Selectores de Funciones Clave

| Contrato | Función | Selector |
|----------|---------|----------|
| PropertyMarketplace | `createListing` | `0x8ebaae08` |
| PropertyMarketplace | `cancelListing` | `0x305a67a8` |
| PropertyMarketplace | `buy` | `0xd6febde8` |
| RoyaltyDistributor | `createDistribution` | `0x4a0f5ef2` |
| RoyaltyDistributor | `claim` | `0x379607f5` |
| ERC1155 | `setApprovalForAll` | `0xa22cb465` |
| ERC20 | `approve` | `0x095ea7b3` |

### Stack Tecnológico

```
Frontend          Backend           Blockchain
─────────         ───────           ──────────
Next.js 15        API Routes        Polygon Mainnet
React 18          Prisma ORM        Solidity 0.8.20
TypeScript        PostgreSQL        ERC-1155
TailwindCSS       Railway           OpenZeppelin
Zustand           Cloudinary        Hardhat
Web3Auth
```

### Tokens de Pago Soportados

| Token | Dirección | Decimales |
|-------|-----------|-----------|
| USDT | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 |
| USDC | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` | 6 |
| MATIC | Nativo | 18 |

---

## Quick Start para Desarrolladores

```bash
# Clonar repositorio
git clone https://github.com/rojasjuniore/APP_BUILDING_TOK.git
cd APP_BUILDING_TOK

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar cliente Prisma
npx prisma generate

# Aplicar schema a DB
npx prisma db push

# Iniciar desarrollo
npm run dev
```

---

## Estructura del Proyecto

```
Tokenbyu/
├── contracts/              # Smart Contracts Solidity
│   ├── tokens/                 # PropertyToken (ERC-1155)
│   ├── marketplace/            # PropertyMarketplace
│   ├── royalties/              # RoyaltyDistributor
│   └── payments/               # PaymentProcessor
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/                # API Routes
│   │   └── admin/              # Panel administración
│   ├── components/         # Componentes React
│   ├── hooks/              # Custom Hooks (marketplace, royalties)
│   ├── lib/                # Utilidades y configuración
│   │   ├── prisma.ts           # Cliente Prisma
│   │   ├── web3auth/           # Web3Auth Context
│   │   └── contracts/          # ABIs y config
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
│
├── prisma/
│   └── schema.prisma       # Schema de base de datos
│
├── docs/                   # Esta carpeta de documentación
│   ├── WHITEPAPER.md           # Whitepaper técnico
│   ├── ARCHITECTURE.md         # Arquitectura detallada
│   ├── USER_GUIDE.md           # Guía de usuario
│   └── ...                     # Más documentos
│
├── scripts/                # Scripts de utilidad
└── test/                   # Tests de Hardhat
```

---

## Flujos Principales

### 1. Compra de Tokens (Marketplace)

```
Usuario                      Frontend                    Blockchain
   │                            │                            │
   │  1. Selecciona tokens      │                            │
   ├───────────────────────────►│                            │
   │                            │  2. approve(USDT)          │
   │                            ├───────────────────────────►│
   │                            │                            │
   │                            │  3. buy(listingId, amount) │
   │                            ├───────────────────────────►│
   │                            │                            │
   │  4. Tokens en wallet       │◄───────────────────────────│
   │◄───────────────────────────│                            │
```

### 2. Reclamar Dividendos

```
Usuario                      Frontend                    Blockchain
   │                            │                            │
   │  1. Ver dividendos         │                            │
   ├───────────────────────────►│  getClaimableAmount()     │
   │                            ├───────────────────────────►│
   │                            │                            │
   │  2. Reclamar               │  claim(distributionId)     │
   ├───────────────────────────►├───────────────────────────►│
   │                            │                            │
   │  3. USDT en wallet         │◄───────────────────────────│
   │◄───────────────────────────│                            │
```

---

## Documentos por Rol

### Para Desarrolladores Frontend

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Selectores, flujos de TX
2. [WEB3AUTH_SETUP.md](./WEB3AUTH_SETUP.md) - Configuración Web3Auth
3. [UI_COMPONENTS.md](./UI_COMPONENTS.md) - Componentes UI
4. [API_REFERENCE.md](./API_REFERENCE.md) - Endpoints disponibles

### Para Desarrolladores Backend

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura completa
2. [SCHEMAS.md](./SCHEMAS.md) - Modelos de datos
3. [DATA_FLOW.md](./DATA_FLOW.md) - Flujos de sincronización
4. [API_REFERENCE.md](./API_REFERENCE.md) - Especificaciones API

### Para Desarrolladores Blockchain

1. [WHITEPAPER.md](./WHITEPAPER.md) - Especificaciones técnicas
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Contratos y selectores
3. Carpeta `contracts/` - Código fuente Solidity

### Para Diseñadores UI/UX

1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Tokens de diseño
2. [UI_COMPONENTS.md](./UI_COMPONENTS.md) - Especificaciones
3. [WIREFRAMES.md](./WIREFRAMES.md) - Wireframes
4. [USER_FLOWS.md](./USER_FLOWS.md) - Flujos de usuario

### Para Stakeholders / Inversores

1. [WHITEPAPER.md](./WHITEPAPER.md) - Visión general del sistema
2. [USER_GUIDE.md](./USER_GUIDE.md) - Cómo usar la plataforma
3. [ROADMAP.md](./ROADMAP.md) - Plan de desarrollo

---

## Mantenimiento de Documentación

### Cuándo Actualizar

| Evento | Documentos a Actualizar |
|--------|-------------------------|
| Bug fix | BUG_REFERENCE.md |
| Nueva feature | ROADMAP.md, API_REFERENCE.md |
| Cambio de API | API_REFERENCE.md |
| Cambio de schema | SCHEMAS.md |
| Nuevo contrato/función | ARCHITECTURE.md, WHITEPAPER.md |
| Release | VERSION_LOG.md |

### Convención de Commits para Docs

```
docs: descripción breve del cambio

docs(architecture): añadir nuevos selectores de funciones
docs(api): documentar endpoint de dividendos
docs(user-guide): actualizar flujo de compra
```

---

## Enlaces Útiles

### Proyecto

- **Demo**: [buildingtok.vercel.app](https://buildingtok.vercel.app)
- **GitHub**: [APP_BUILDING_TOK](https://github.com/rojasjuniore/APP_BUILDING_TOK)
- **PolygonScan**: [Contratos verificados](https://polygonscan.com/address/0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0)

### Tecnologías

- [Next.js Docs](https://nextjs.org/docs)
- [Web3Auth Docs](https://web3auth.io/docs)
- [Polygon Docs](https://docs.polygon.technology)
- [OpenZeppelin](https://docs.openzeppelin.com)
- [Prisma Docs](https://www.prisma.io/docs)

---

**Versión**: 2.0.0
**Última actualización**: Diciembre 2024
**Estado**: Producción en Polygon Mainnet

---

**© 2024 BuildingTok. Todos los derechos reservados.**
