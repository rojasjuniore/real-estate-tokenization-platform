# Arquitectura del Sistema - TokenByU

## Resumen Ejecutivo

TokenByU es una plataforma de tokenización de bienes raíces construida sobre Polygon blockchain. Permite la inversión fraccionada en propiedades inmobiliarias mediante tokens ERC1155, con un marketplace P2P y distribución automatizada de dividendos.

---

## 1. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Next.js    │  │    Wagmi     │  │  Web3Auth    │  │   Zustand    │    │
│  │   React 19   │  │   + Viem     │  │   (Social)   │  │   (State)    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────────┘    │
└─────────┼─────────────────┼─────────────────┼───────────────────────────────┘
          │                 │                 │
          │    HTTP/REST    │   JSON-RPC      │   OAuth 2.0
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Next.js API)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  API Routes  │  │  Services    │  │  JWT Auth    │  │  Middleware  │    │
│  │  (51 total)  │  │  (Business)  │  │  (7 days)    │  │  (Validate)  │    │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────┼───────────────────────────────────────────────────────────────────┘
          │
          │    Prisma ORM
          ▼
┌─────────────────────┐     ┌─────────────────────────────────────────────────┐
│    PostgreSQL       │     │              POLYGON BLOCKCHAIN                  │
│  ┌───────────────┐  │     │  ┌──────────────┐  ┌──────────────────────────┐│
│  │ 12 Modelos    │  │     │  │PropertyToken │  │PropertyMarketplace       ││
│  │ - User        │  │     │  │  (ERC1155)   │  │  (P2P Trading)           ││
│  │ - Property    │  │     │  └──────────────┘  └──────────────────────────┘│
│  │ - Listing     │  │     │  ┌──────────────┐  ┌──────────────────────────┐│
│  │ - Portfolio   │  │     │  │RoyaltyDist.  │  │PaymentProcessor          ││
│  │ - Dividend    │  │     │  │  (Dividends) │  │  (USDC/USDT/MATIC)       ││
│  │ - KYC         │  │     │  └──────────────┘  └──────────────────────────┘│
│  │ - Transaction │  │     └─────────────────────────────────────────────────┘
│  └───────────────┘  │
└─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Cloudinary  │  │   Alchemy    │  │   Pinata     │  │  Web3Auth    │    │
│  │  (Imágenes)  │  │  (RPC/Index) │  │   (IPFS)     │  │  (OAuth)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Frontend** | Next.js | 15.x | Framework React con SSR |
| | React | 19.x | Librería UI |
| | Wagmi | 3.1.x | Hooks Web3 |
| | Zustand | 5.x | State management |
| | TailwindCSS | 3.x | Estilos |
| **Backend** | Next.js API Routes | 15.x | REST API |
| | Prisma | 6.19.x | ORM |
| | Jose | 5.x | JWT tokens |
| **Database** | PostgreSQL | 15+ | Base de datos principal |
| **Blockchain** | Polygon | Mainnet/Amoy | Red blockchain |
| | Solidity | 0.8.20 | Smart contracts |
| | Hardhat | 2.x | Desarrollo/deploy |
| **Servicios** | Cloudinary | - | Storage de imágenes |
| | Alchemy | - | RPC + Webhooks |
| | Pinata | - | IPFS storage |
| | Web3Auth | - | Social login |

---

## 3. Arquitectura de Smart Contracts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SMART CONTRACTS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     PropertyToken (ERC1155)                       │  │
│  │  • createProperty(tokenId, supply, metadataUri, royaltyFee)      │  │
│  │  • balanceOf(account, tokenId)                                    │  │
│  │  • safeTransferFrom(from, to, tokenId, amount)                   │  │
│  │  • setApprovalForAll(operator, approved)                          │  │
│  │  Roles: DEFAULT_ADMIN, MINTER, PAUSER                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              │ approves                                 │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   PropertyMarketplace                             │  │
│  │  • createListing(tokenId, amount, price, paymentToken)           │  │
│  │  • buy(listingId, amount)                                         │  │
│  │  • cancelListing(listingId)                                       │  │
│  │  • setKYCApproved(user, approved)                                │  │
│  │  • setMarketplaceFee(basisPoints)                                │  │
│  │  Verificaciones: KYC, tokens aprobados, fees                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              │ payments                                 │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   PaymentProcessor                                │  │
│  │  • acceptedPaymentTokens: [USDC, USDT, MATIC]                    │  │
│  │  • processPayment(token, from, to, amount)                       │  │
│  │  • setKYCApproved(user, approved)                                │  │
│  │  • addPaymentToken(token) / removePaymentToken(token)            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   RoyaltyDistributor                              │  │
│  │  • createDistribution(tokenId, amount, paymentToken)             │  │
│  │  • claim(distributionId)                                          │  │
│  │  • getClaimableAmount(distributionId, user)                      │  │
│  │  Snapshot de holders al momento de distribución                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Redes Soportadas:**
- Polygon Mainnet (Chain ID: 137)
- Polygon Amoy Testnet (Chain ID: 80002)

---

## 4. Flujos de Datos Principales

### 4.1 Registro y Autenticación

```
Usuario                  Frontend                  API                    DB
   │                        │                       │                      │
   │──Login via Web3Auth───►│                       │                      │
   │                        │──POST /api/auth/login─►│                      │
   │                        │                       │──findOrCreate User──►│
   │                        │                       │◄──────User data──────│
   │                        │                       │──Generate JWT─────────
   │                        │◄──Set HTTP-only cookie│                      │
   │◄──Autenticado─────────│                       │                      │
```

### 4.2 Compra de Tokens

```
Usuario                  Frontend                Smart Contract           DB
   │                        │                       │                      │
   │──Selecciona propiedad─►│                       │                      │
   │──Cantidad + Pago──────►│                       │                      │
   │                        │──approve(USDC)───────►│                      │
   │◄──Confirma en wallet───│                       │                      │
   │                        │──buy(listingId)──────►│                      │
   │                        │                       │──Transfer tokens─────│
   │                        │                       │──Transfer payment────│
   │                        │◄──TX confirmada───────│                      │
   │                        │──POST /api/transactions│─────Record TX──────►│
   │◄──Compra exitosa───────│                       │                      │
```

### 4.3 Distribución de Dividendos

```
Admin                    Frontend              Smart Contract              DB
   │                        │                       │                      │
   │──Crear distribución───►│                       │                      │
   │                        │──approve(USDC)───────►│                      │
   │                        │──createDistribution()─►│                      │
   │                        │                       │──Snapshot holders────│
   │                        │◄──distributionId──────│                      │
   │                        │──POST /api/dividends──│──────────────────────►│
   │◄──Distribución creada──│                       │                      │
   │                        │                       │                      │
Usuario                     │                       │                      │
   │──Ver dividendos───────►│                       │                      │
   │                        │──claim(distId)───────►│                      │
   │                        │                       │──Transfer payment────│
   │◄──Dividendo reclamado──│                       │                      │
```

---

## 5. Estructura del Proyecto

```
tokenbyu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes (51 endpoints)
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── kyc/           # Verificación KYC
│   │   │   ├── marketplace/   # Marketplace P2P
│   │   │   ├── admin/         # Panel admin
│   │   │   ├── properties/    # Gestión propiedades
│   │   │   └── dividends/     # Dividendos
│   │   ├── admin/             # Páginas admin
│   │   ├── marketplace/       # Páginas marketplace
│   │   ├── profile/           # Perfil usuario
│   │   └── ...
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   ├── admin/            # Admin específicos
│   │   ├── marketplace/      # Marketplace específicos
│   │   └── ...
│   ├── hooks/                 # Custom hooks
│   │   ├── useMarketplace.ts # Interacción marketplace
│   │   ├── usePropertyToken.ts
│   │   ├── useRoyalties.ts
│   │   └── ...
│   ├── lib/                   # Utilidades
│   │   ├── web3/             # Config blockchain
│   │   ├── cloudinary/       # Config Cloudinary
│   │   └── ...
│   ├── services/              # Lógica de negocio
│   │   ├── marketplace.service.ts
│   │   ├── property.service.ts
│   │   ├── dividend.service.ts
│   │   └── ...
│   └── store/                 # Zustand stores
├── contracts/                 # Smart contracts Solidity
│   ├── PropertyToken.sol
│   ├── PropertyMarketplace.sol
│   ├── RoyaltyDistributor.sol
│   └── PaymentProcessor.sol
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── e2e/                       # Tests E2E (Playwright)
├── docs/                      # Documentación
└── hardhat.config.ts          # Config deploy contracts
```

---

## 6. Patrones de Diseño

### 6.1 Arquitectura en Capas

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Presentación** | UI/UX, estado local | React Components, Zustand |
| **API** | Validación, routing, auth | Next.js API Routes |
| **Servicios** | Lógica de negocio | marketplace.service.ts |
| **Datos** | Persistencia | Prisma + PostgreSQL |
| **Blockchain** | Transacciones on-chain | Smart Contracts |

### 6.2 Patrones Utilizados

- **Repository Pattern**: Services encapsulan acceso a datos
- **Factory Pattern**: Creación de tokens/distribuciones
- **Observer Pattern**: Webhooks de Alchemy para eventos blockchain
- **Singleton**: Configuración del sistema (SystemConfig)
- **Strategy Pattern**: Múltiples tokens de pago

### 6.3 Estado de Frontend (Zustand)

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZUSTAND STORES                               │
├───────────────────┬───────────────────┬────────────────────────┤
│ navigationStore   │ notificationStore │ propertyStore          │
│ • currentSection  │ • notifications[] │ • currentProperty      │
│ • breadcrumbs     │ • addNotification │ • setProperty          │
│ • navigate()      │ • removeOldest()  │ • clearProperty        │
└───────────────────┴───────────────────┴────────────────────────┘
```

---

## 7. Seguridad

### 7.1 Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEGURIDAD MULTICAPA                           │
├─────────────────────────────────────────────────────────────────┤
│  1. AUTENTICACIÓN                                                │
│     └─ Web3Auth (Social) + JWT (7 días) + HTTP-only cookies     │
├─────────────────────────────────────────────────────────────────┤
│  2. AUTORIZACIÓN                                                 │
│     └─ Roles on-chain: DEFAULT_ADMIN, ADMIN, MINTER, PAUSER    │
│     └─ Cache de 60s para verificación admin                     │
├─────────────────────────────────────────────────────────────────┤
│  3. KYC                                                          │
│     └─ Documentos en Cloudinary (URLs firmadas)                 │
│     └─ Aprobación dual: Marketplace + PaymentProcessor          │
├─────────────────────────────────────────────────────────────────┤
│  4. SMART CONTRACTS                                              │
│     └─ OpenZeppelin (auditado)                                  │
│     └─ ReentrancyGuard                                          │
│     └─ Pausable (circuit breaker)                               │
│     └─ AccessControl                                            │
├─────────────────────────────────────────────────────────────────┤
│  5. VALIDACIÓN                                                   │
│     └─ Server-side validation en todas las rutas                │
│     └─ Sanitización de inputs                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Roles del Sistema

| Rol | Scope | Permisos |
|-----|-------|----------|
| DEFAULT_ADMIN_ROLE | Contratos | Control total, otorga otros roles |
| ADMIN_ROLE | App + Contratos | Panel admin, pausar, configurar |
| MINTER_ROLE | PropertyToken | Crear nuevas propiedades |
| PAUSER_ROLE | Todos | Pausar contratos en emergencia |
| USER | App | Comprar, vender, reclamar dividendos |

---

## 8. Integraciones Externas

| Servicio | Uso | Datos Intercambiados |
|----------|-----|---------------------|
| **Web3Auth** | Login social | OAuth tokens, user info |
| **Alchemy** | RPC + Webhooks | Transacciones, eventos |
| **Cloudinary** | Storage | Imágenes KYC, propiedades |
| **Pinata** | IPFS | Metadata de tokens |
| **Polygon RPC** | Blockchain | Transacciones on-chain |

---

## 9. Escalabilidad

### 9.1 Estrategias Implementadas

- **Caché de admin**: 60s TTL para roles on-chain
- **Paginación**: Todas las listas con limit/offset
- **Índices DB**: En campos frecuentemente consultados
- **Lazy loading**: Componentes y rutas bajo demanda

### 9.2 Puntos de Escalado Futuro

- **Read replicas**: PostgreSQL para lecturas
- **Redis**: Cache distribuido
- **CDN**: Cloudinary ya proporciona
- **Sharding**: Por propertyId si necesario

---

## 10. Monitoreo y Observabilidad

| Componente | Herramienta | Métricas |
|------------|-------------|----------|
| API | Next.js logs | Request/response times |
| Blockchain | Alchemy Dashboard | TX confirmations, gas |
| Database | Prisma Logs | Query performance |
| Storage | Cloudinary Dashboard | Bandwidth, storage |

---

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPONENTES FRONTEND                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PROVIDERS                                    │   │
│  │  WagmiProvider → QueryClientProvider → Web3AuthProvider             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         │                          │                          │            │
│         ▼                          ▼                          ▼            │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐        │
│  │   PAGES     │          │  COMPONENTS │          │   HOOKS     │        │
│  │ /marketplace│          │ PropertyCard│          │useMarketplace│        │
│  │ /admin      │          │ ListingCard │          │usePropertyToken│      │
│  │ /profile    │          │ KYCUpload   │          │useRoyalties  │        │
│  │ /dividends  │          │ AdminSidebar│          │useFaucet     │        │
│  └─────────────┘          └─────────────┘          └─────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ API Calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                      │
│                                                                              │
│  /api/auth/*     /api/kyc/*     /api/marketplace/*    /api/admin/*         │
│  /api/properties/* /api/dividends/*  /api/health      /api/uploads/*       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Prisma ORM
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICES                                        │
│                                                                              │
│  marketplace.service    property.service    dividend.service                │
│  kyc.service            user.service        blockchainSync.service          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
