# 🏢 BuildingTok

<div align="center">

![BuildingTok](https://img.shields.io/badge/BuildingTok-Real%20Estate%20Tokenization-blue?style=for-the-badge)
![Polygon](https://img.shields.io/badge/Polygon-Mainnet-8247E5?style=for-the-badge&logo=polygon)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

**Plataforma de tokenización de bienes raíces que permite inversión fraccionada en propiedades inmobiliarias, con marketplace P2P integrado y distribución automática de dividendos.**

[Demo](https://buildingtok.vercel.app) · [Documentación](./docs) · [Contratos](./contracts)

</div>

---

## ✨ Características

| Característica | Descripción |
|----------------|-------------|
| 🏠 **Tokenización de Propiedades** | Convierte propiedades inmobiliarias en tokens ERC-1155 fraccionados |
| 💰 **Inversión Fraccionada** | Invierte desde montos mínimos en propiedades premium |
| 🔄 **Marketplace P2P** | Compra y vende tokens entre usuarios en el mercado secundario |
| 📈 **Dividendos Automáticos** | Recibe ingresos por alquiler proporcionales a tu inversión |
| 🔐 **KYC Integrado** | Verificación de identidad para cumplimiento regulatorio |
| 💳 **Multi-Pago Crypto** | Soporte para USDT, USDC y MATIC en Polygon |

---

## 🛠 Stack Tecnológico

### Frontend
- **Next.js 15** - App Router con Server Components
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos utilitarios
- **Web3Auth** - Autenticación Web3 social login
- **Zustand** - State management

### Smart Contracts
- **Solidity 0.8.20** - Contratos inteligentes
- **Hardhat** - Framework de desarrollo
- **OpenZeppelin** - Contratos seguros y auditados
- **Polygon Mainnet** - Red de bajo costo

### Backend
- **Next.js API Routes** - Endpoints serverless
- **Prisma ORM** - Base de datos type-safe
- **PostgreSQL** - Base de datos relacional
- **Railway** - Hosting de base de datos

---

## 📋 Smart Contracts

### Contratos Desplegados (Polygon Mainnet)

| Contrato | Dirección | Verificado |
|----------|-----------|------------|
| **PropertyToken** | [`0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0`](https://polygonscan.com/address/0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0) | ✅ |
| **PropertyMarketplace** | [`0x205969FB45AC1992Ca1c99839e57297EF4C057d6`](https://polygonscan.com/address/0x205969FB45AC1992Ca1c99839e57297EF4C057d6) | ✅ |
| **RoyaltyDistributor** | [`0xc07A968973fBe928bD47c59F837397001C2374cE`](https://polygonscan.com/address/0xc07A968973fBe928bD47c59F837397001C2374cE) | ✅ |
| **PaymentProcessor** | [`0xE2828aB33e2649Bd546BcFdfBB11131102Df7A0F`](https://polygonscan.com/address/0xE2828aB33e2649Bd546BcFdfBB11131102Df7A0F) | ✅ |

### Tokens de Pago Soportados

| Token | Dirección | Decimales |
|-------|-----------|-----------|
| **USDT** | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 |
| **USDC** | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` | 6 |
| **MATIC** | Nativo | 18 |

### Descripción de Contratos

```
┌─────────────────────┐     ┌──────────────────────┐
│   PropertyToken     │     │  PropertyMarketplace │
│   (ERC-1155)        │────▶│  (P2P Trading)       │
│                     │     │                      │
│ • Mint propiedades  │     │ • Crear listings     │
│ • Transfer tokens   │     │ • Comprar tokens     │
│ • Burn tokens       │     │ • Cancelar listings  │
└─────────────────────┘     └──────────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│ RoyaltyDistributor  │     │  PaymentProcessor    │
│ (Dividends)         │     │  (Payments)          │
│                     │     │                      │
│ • Crear distribución│     │ • Procesar pagos     │
│ • Claim dividendos  │     │ • Multi-token        │
│ • Snapshot holders  │     │ • Comisiones         │
└─────────────────────┘     └──────────────────────┘
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Configuración

```bash
# Clonar repositorio
git clone https://github.com/rojasjuniore/APP_BUILDING_TOK.git
cd APP_BUILDING_TOK

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Blockchain
NEXT_PUBLIC_CHAIN_ID=137
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Contract Addresses
NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS="0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0"
NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS="0x205969FB45AC1992Ca1c99839e57297EF4C057d6"
NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS="0xc07A968973fBe928bD47c59F837397001C2374cE"
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS="0xE2828aB33e2649Bd546BcFdfBB11131102Df7A0F"

# Web3Auth
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID="your_web3auth_client_id"

# Cloudinary (uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## 📁 Estructura del Proyecto

```
buildingtok/
├── contracts/              # Smart Contracts Solidity
│   ├── PropertyToken.sol       # Token ERC-1155
│   ├── PropertyMarketplace.sol # Marketplace P2P
│   ├── RoyaltyDistributor.sol  # Distribución dividendos
│   └── PaymentProcessor.sol    # Procesador de pagos
│
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── admin/          # Endpoints de admin
│   │   │   ├── properties/     # CRUD propiedades
│   │   │   ├── marketplace/    # Listings
│   │   │   ├── dividends/      # Dividendos
│   │   │   ├── kyc/            # Verificación KYC
│   │   │   └── users/          # Usuarios
│   │   ├── admin/              # Panel administración
│   │   └── (pages)/            # Páginas públicas
│   │
│   ├── components/         # Componentes React
│   │   ├── layout/             # AppShell, Sidebar, etc.
│   │   ├── sections/           # Secciones por página
│   │   ├── panels/             # Slide panels
│   │   ├── ui/                 # Componentes base
│   │   └── icons/              # Iconos SVG
│   │
│   ├── hooks/              # Custom Hooks
│   │   ├── useKYC.ts           # Estado KYC
│   │   └── useMarketplace.ts   # Operaciones marketplace
│   │
│   ├── lib/                # Utilidades
│   │   ├── prisma.ts           # Cliente Prisma
│   │   ├── web3auth/           # Configuración Web3Auth
│   │   └── contracts/          # ABIs y config
│   │
│   ├── store/              # Zustand stores
│   │   └── panels.store.ts     # Estado de paneles
│   │
│   └── services/           # Servicios de negocio
│
├── prisma/
│   └── schema.prisma       # Schema de base de datos
│
├── test/                   # Tests de Hardhat
├── scripts/                # Scripts de deploy y utilidades
└── docs/                   # Documentación adicional
```

---

## 🔄 Flujos Principales

### 1. Compra Primaria (Inversión Inicial)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant W as Web3Auth
    participant A as API
    participant C as Contratos

    U->>W: Conectar wallet
    W-->>U: Wallet conectada
    U->>A: Ver propiedades disponibles
    A-->>U: Lista de propiedades
    U->>C: Aprobar USDT
    C-->>U: Aprobación confirmada
    U->>C: Comprar tokens
    C-->>U: Tokens transferidos
    A->>A: Actualizar portfolio
```

### 2. Marketplace Secundario (P2P)

**Crear Listing:**
1. Usuario selecciona tokens a vender
2. Aprueba PropertyMarketplace para transferir tokens
3. Crea listing con precio deseado
4. Tokens se transfieren al contrato (escrow)

**Comprar desde Listing:**
1. Comprador aprueba USDT al marketplace
2. Ejecuta compra del listing
3. Tokens van al comprador, pago al vendedor
4. Comisión del 2.5% al treasury

**Cancelar Listing:**
1. Vendedor cancela su listing
2. Tokens regresan a su wallet
3. Listing se marca como cancelado

### 3. Distribución de Dividendos

```
Admin deposita rentas
        │
        ▼
┌───────────────────┐
│ createDistribution│ ──▶ Snapshot de holders
└───────────────────┘
        │
        ▼
Usuarios ven dividendos pendientes
        │
        ▼
┌───────────────────┐
│  claimRoyalty()   │ ──▶ Reciben USDT proporcional
└───────────────────┘
```

---

## 📡 API Endpoints

### Propiedades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/properties` | Listar propiedades con filtros |
| GET | `/api/properties/:id` | Detalle de propiedad |
| POST | `/api/properties` | Crear propiedad (admin) |
| PUT | `/api/properties/:id` | Actualizar propiedad (admin) |

### Marketplace

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/marketplace/listings` | Listar listings activos |
| POST | `/api/marketplace/listings` | Crear listing |
| PUT | `/api/marketplace/listings/:id` | Actualizar/comprar listing |
| DELETE | `/api/marketplace/listings/:id` | Cancelar listing |

### Dividendos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dividends` | Listar distribuciones |
| POST | `/api/dividends` | Crear distribución (admin) |
| GET | `/api/user/dividends` | Dividendos del usuario |

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users/:address` | Perfil y portfolio |
| POST | `/api/kyc` | Enviar documentos KYC |
| GET | `/api/kyc/status` | Estado de verificación |

---

## 🔐 Seguridad

### Smart Contracts
- ✅ **ReentrancyGuard** - Protección contra reentrancy
- ✅ **AccessControl** - Roles ADMIN, MINTER, PAUSER
- ✅ **Pausable** - Pausa de emergencia
- ✅ **SafeERC20** - Transferencias seguras

### Backend
- ✅ Validación de inputs en servidor
- ✅ Rate limiting en APIs
- ✅ Autenticación por wallet signature
- ✅ Variables de entorno para secrets

### Base de Datos
- ✅ Prisma con queries parametrizados
- ✅ Transacciones atómicas
- ✅ Soft deletes donde aplica

---

## 🧪 Testing

```bash
# Tests de Smart Contracts
npx hardhat test

# Tests de Frontend
npm test

# Tests con coverage
npm run test:coverage

# Lint
npm run lint
```

---

## 📦 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar producción

# Base de datos
npx prisma studio    # UI para explorar DB
npx prisma db push   # Sincronizar schema
npx prisma generate  # Regenerar cliente

# Smart Contracts
npx hardhat compile  # Compilar contratos
npx hardhat test     # Ejecutar tests
npx hardhat deploy   # Deploy a red
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'feat: agregar funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato, sin cambios de código
refactor: refactorización
test: agregar tests
chore: mantenimiento
```

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

---

<div align="center">

**Desarrollado con ❤️ para democratizar la inversión inmobiliaria**

[⬆ Volver arriba](#-buildingtok)

</div>
