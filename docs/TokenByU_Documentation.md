\newpage

# TokenByU - Documentación Completa

**Sistema de Tokenización de Bienes Raíces en Blockchain**

**Versión:** 0.1.0 (Beta)
**Fecha:** Diciembre 2024
**Estado:** Producción en Polygon Mainnet

---

\tableofcontents

\newpage

# 1. README - Índice de Documentación

## Resumen del Sistema

TokenByU es una plataforma de tokenización de bienes raíces construida sobre Polygon blockchain. Permite la inversión fraccionada en propiedades inmobiliarias mediante tokens ERC1155, con un marketplace P2P y distribución automatizada de dividendos.

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

| Contrato | Dirección |
|----------|-----------|
| PropertyToken | `0x1F3b6d4E1dbb471017dbcE4A6206E03E0674C4D0` |
| PropertyMarketplace | `0x205969FB45AC1992Ca1c99839e57297EF4C057d6` |
| RoyaltyDistributor | `0xc07A968973fBe928bD47c59F837397001C2374cE` |
| PaymentProcessor | `0xE2828aB33e2649Bd546BcFdfBB11131102Df7A0F` |

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15, React 18, TypeScript, TailwindCSS, Zustand |
| Backend | API Routes, Prisma ORM, PostgreSQL |
| Blockchain | Polygon Mainnet, Solidity 0.8.20, ERC-1155, OpenZeppelin |
| Auth | Web3Auth |

### Tokens de Pago Soportados

| Token | Dirección | Decimales |
|-------|-----------|-----------|
| USDT | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | 6 |
| USDC | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` | 6 |
| MATIC | Nativo | 18 |

### Quick Start para Desarrolladores

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

### Estructura del Proyecto

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
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # Utilidades y configuración
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
│
├── prisma/
│   └── schema.prisma       # Schema de base de datos
│
├── docs/                   # Documentación
└── test/                   # Tests
```

\newpage

# 2. Arquitectura del Sistema

## 2.1 Arquitectura de Alto Nivel

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

## 2.2 Stack Tecnológico

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

## 2.3 Arquitectura de Smart Contracts

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

## 2.4 Flujos de Datos Principales

### 2.4.1 Registro y Autenticación

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

### 2.4.2 Compra de Tokens

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

### 2.4.3 Distribución de Dividendos

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

## 2.5 Patrones de Diseño

### 2.5.1 Arquitectura en Capas

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Presentación** | UI/UX, estado local | React Components, Zustand |
| **API** | Validación, routing, auth | Next.js API Routes |
| **Servicios** | Lógica de negocio | marketplace.service.ts |
| **Datos** | Persistencia | Prisma + PostgreSQL |
| **Blockchain** | Transacciones on-chain | Smart Contracts |

### 2.5.2 Patrones Utilizados

- **Repository Pattern**: Services encapsulan acceso a datos
- **Factory Pattern**: Creación de tokens/distribuciones
- **Observer Pattern**: Webhooks de Alchemy para eventos blockchain
- **Singleton**: Configuración del sistema (SystemConfig)
- **Strategy Pattern**: Múltiples tokens de pago

## 2.6 Seguridad

### Capas de Seguridad

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

### Roles del Sistema

| Rol | Scope | Permisos |
|-----|-------|----------|
| DEFAULT_ADMIN_ROLE | Contratos | Control total, otorga otros roles |
| ADMIN_ROLE | App + Contratos | Panel admin, pausar, configurar |
| MINTER_ROLE | PropertyToken | Crear nuevas propiedades |
| PAUSER_ROLE | Todos | Pausar contratos en emergencia |
| USER | App | Comprar, vender, reclamar dividendos |

## 2.7 Integraciones Externas

| Servicio | Uso | Datos Intercambiados |
|----------|-----|---------------------|
| **Web3Auth** | Login social | OAuth tokens, user info |
| **Alchemy** | RPC + Webhooks | Transacciones, eventos |
| **Cloudinary** | Storage | Imágenes KYC, propiedades |
| **Pinata** | IPFS | Metadata de tokens |
| **Polygon RPC** | Blockchain | Transacciones on-chain |

\newpage

# 3. API Reference

## 3.1 Información General

**Base URL:** `https://your-domain.com/api`

**Formato de Respuesta:**
```json
{
  "success": true | false,
  "data": {} | null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje descriptivo"
  } | null
}
```

**Autenticación:**
- Header: `x-wallet-address: 0x...`
- Cookie: `auth-token` (HTTP-only, 7 días)

## 3.2 Autenticación (Auth)

### POST /api/auth/login

Crea sesión de usuario o registra nuevo usuario.

**Request:**
```json
{
  "walletAddress": "0x1234...",
  "email": "user@example.com",
  "name": "Nombre Usuario",
  "profileImage": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxyz123",
      "walletAddress": "0x1234...",
      "email": "user@example.com",
      "name": "Nombre Usuario",
      "role": "USER",
      "kycStatus": "NONE"
    },
    "token": "eyJhbG..."
  }
}
```

### POST /api/auth/logout

Cierra la sesión actual.

### GET /api/auth/session

Obtiene la sesión actual.

### POST /api/auth/verify

Verifica firma de mensaje.

## 3.3 KYC

### POST /api/kyc

Envía documentos KYC.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "idFrontUrl": "https://cloudinary.com/...",
  "idBackUrl": "https://cloudinary.com/...",
  "selfieUrl": "https://cloudinary.com/..."
}
```

### GET /api/kyc/status

Consulta estado de KYC.

### POST /api/kyc/upload

Sube documento KYC a Cloudinary.

**Request:** FormData
- `file`: Archivo (JPEG, PNG, WebP, max 5MB)
- `documentType`: `"idFront"` | `"idBack"` | `"selfie"`

## 3.4 Propiedades

### GET /api/properties

Lista propiedades con filtros.

**Query Parameters:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| status | string | - | Filtrar por estado |
| type | string | - | Filtrar por tipo |
| page | int | 1 | Página |
| limit | int | 10 | Por página |

### POST /api/properties

Crea nueva propiedad (Admin).

### GET /api/properties/{id}

Obtiene detalle de propiedad.

### PATCH /api/properties/{id}

Actualiza propiedad (Admin).

### GET /api/properties/{id}/listings

Lista listings activos de la propiedad.

### GET /api/properties/{id}/dividends

Lista dividendos de la propiedad.

### GET /api/properties/next-token-id

Obtiene siguiente tokenId disponible.

## 3.5 Marketplace

### GET /api/marketplace/listings

Lista todos los listings.

**Query Parameters:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| propertyId | string | Filtrar por propiedad |
| seller | address | Filtrar por vendedor |
| status | string | ACTIVE, SOLD, CANCELLED |
| page | int | Página |
| limit | int | Por página |

### POST /api/marketplace/listings

Crea nuevo listing.

### GET /api/marketplace/listings/{id}

Obtiene detalle del listing.

### PUT /api/marketplace/listings/{id}

Actualiza estado del listing (venta/cancelación).

### DELETE /api/marketplace/listings/{id}

Cancela listing.

## 3.6 Usuarios

### GET /api/users

Lista todos los usuarios (Admin).

### GET /api/users/{address}

Obtiene perfil de usuario.

### PUT /api/users/{address}

Actualiza perfil de usuario.

### GET /api/users/{address}/portfolio

Obtiene portfolio del usuario.

### GET /api/users/{address}/transactions

Obtiene transacciones del usuario.

### POST /api/users/{address}/profile-image

Sube imagen de perfil.

### DELETE /api/users/{address}/profile-image

Elimina imagen de perfil.

## 3.7 Transacciones

### GET /api/transactions

Lista transacciones del usuario.

### GET /api/transactions/{hash}

Obtiene detalle de transacción.

## 3.8 Dividendos

### GET /api/dividends

Lista dividendos reclamables del usuario.

### POST /api/dividends/claim

Prepara claim de dividendos.

### PUT /api/dividends/claim

Confirma claim de dividendos.

### GET /api/dividends/history

Historial de dividendos reclamados.

## 3.9 Admin

### GET /api/admin/check

Verifica si usuario es admin.

### GET /api/admin/dashboard

Dashboard con métricas.

### GET /api/admin/kyc

Lista submissions KYC.

### GET /api/admin/kyc/{id}

Obtiene detalle de submission KYC.

### PUT /api/admin/kyc/{id}

Aprueba o rechaza KYC.

### GET /api/admin/dividends

Lista todos los dividendos (Admin).

### POST /api/admin/dividends

Crea nueva distribución de dividendos.

### GET /api/admin/dividends/{id}

Detalle de dividendo con estadísticas.

### POST /api/admin/dividends/{id}/distribute

Ejecuta distribución on-chain.

### DELETE /api/admin/dividends/{id}

Cancela dividendo pendiente.

### GET /api/admin/roles

Consulta roles de una wallet.

### POST /api/admin/roles

Otorga o revoca roles.

### GET /api/admin/roles/history

Historial de cambios de roles.

### POST /api/upload

Sube imágenes (Admin).

## 3.10 Códigos de Error

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| UNAUTHORIZED | 401 | No autenticado |
| FORBIDDEN | 403 | Sin permisos |
| NOT_FOUND | 404 | Recurso no encontrado |
| BAD_REQUEST | 400 | Datos inválidos |
| CONFLICT | 409 | Conflicto de datos |
| INTERNAL_ERROR | 500 | Error interno |
| KYC_REQUIRED | 403 | KYC requerido |
| KYC_NOT_APPROVED | 403 | KYC no aprobado |
| LISTING_NOT_FOUND | 404 | Listing no existe |
| INSUFFICIENT_BALANCE | 400 | Balance insuficiente |

## 3.11 Rate Limits

| Endpoint | Límite |
|----------|--------|
| /api/auth/* | 10 req/min |
| /api/kyc/upload | 5 req/min |
| /api/upload | 10 req/min |
| Otros | 100 req/min |

## 3.12 Resumen de Endpoints

| Módulo | Endpoints | Auth Requerido |
|--------|-----------|----------------|
| Auth | 4 | Parcial |
| KYC | 3 | Sí |
| Properties | 7 | Parcial |
| Marketplace | 5 | Parcial |
| Users | 7 | Parcial |
| Transactions | 2 | Sí |
| Dividends | 4 | Sí |
| Admin | 12 | Admin |
| Otros | 4 | No |
| **Total** | **48** | - |

\newpage

# 4. Manual de Usuario

## 4.1 Introducción

TokenByU es una plataforma de inversión en bienes raíces tokenizados. Permite comprar fracciones de propiedades inmobiliarias como tokens digitales en la blockchain de Polygon, recibir dividendos y comerciar en el marketplace.

## 4.2 Primeros Pasos

### Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Wallet de criptomonedas (MetaMask recomendado) o cuenta de email/social
- Tokens USDC, USDT o MATIC para inversiones

### Crear Cuenta / Conectar Wallet

1. Visita la plataforma en el navegador
2. Click en **"Conectar Wallet"**
3. Elige tu método de conexión:
   - **MetaMask/Coinbase:** Conecta tu wallet existente
   - **Email/Social:** Usa Web3Auth para crear wallet automáticamente
4. Firma el mensaje de verificación
5. Tu cuenta está creada automáticamente

### Configurar Red Polygon

Si usas MetaMask, configura la red Polygon:

```
Network Name: Polygon Mainnet
RPC URL: https://polygon-rpc.com
Chain ID: 137
Symbol: MATIC
Explorer: https://polygonscan.com
```

## 4.3 Verificación KYC

### Por qué es necesario

El KYC (Know Your Customer) es requerido para:
- Comprar tokens de propiedades
- Vender en el marketplace
- Reclamar dividendos

### Proceso de Verificación

1. Ve a **Perfil > KYC**
2. Prepara los siguientes documentos:
   - Foto del frente de tu identificación (INE/Pasaporte)
   - Foto del reverso de tu identificación
   - Selfie sosteniendo tu identificación
3. Sube cada documento en la sección correspondiente
4. Click en **"Enviar para Revisión"**
5. Espera la aprobación (1-3 días hábiles)

### Estados del KYC

| Estado | Descripción |
|--------|-------------|
| Sin enviar | No has iniciado el proceso |
| Pendiente | Documentos enviados, en revisión |
| Aprobado | Puedes operar en la plataforma |
| Rechazado | Revisa las notas del admin y reenvía |

## 4.4 Explorar Propiedades

### Catálogo

1. Ve a **Explorar** en el menú principal
2. Usa los filtros para encontrar propiedades:
   - **Tipo:** Residencial, Comercial, Industrial, Mixto
   - **Precio:** Rango de precio por fracción
   - **ROI Estimado:** Rendimiento esperado
   - **Estado:** Activas, Vendidas, etc.

### Detalles de Propiedad

Cada propiedad muestra:
- **Galería de imágenes**
- **Ubicación** con mapa interactivo
- **Descripción** detallada
- **Documentos** legales (escrituras, avalúos)
- **Métricas:**
  - Precio por fracción
  - Total de fracciones
  - Fracciones disponibles
  - ROI estimado
  - Historial de dividendos

## 4.5 Comprar Tokens

### Compra Directa (Propiedades Nuevas)

1. Selecciona una propiedad con fracciones disponibles
2. Click en **"Comprar Fracciones"**
3. Ingresa la cantidad de fracciones
4. Selecciona token de pago (USDC/USDT/MATIC)
5. Revisa el resumen:
   - Cantidad de tokens
   - Precio total
   - Fee de plataforma
6. Click en **"Aprobar"** para autorizar el gasto
7. Confirma la transacción en tu wallet
8. Click en **"Comprar"** para finalizar

### Compra en Marketplace (P2P)

1. Ve a **Marketplace**
2. Encuentra listados de otros usuarios
3. Click en **"Comprar"** en el listado deseado
4. Sigue el proceso de aprobación y confirmación

### Tokens de Pago

| Token | Descripción |
|-------|-------------|
| USDC | Stablecoin de Circle (recomendado) |
| USDT | Stablecoin de Tether |
| MATIC | Token nativo de Polygon |

## 4.6 Tu Portfolio

### Ver Inversiones

1. Ve a **Perfil > Portfolio**
2. Visualiza todas tus propiedades:
   - Nombre de propiedad
   - Tokens que posees
   - Valor actual
   - Rendimiento

### Historial de Transacciones

En **Perfil > Transacciones** puedes ver:
- Fecha y hora
- Tipo (Compra/Venta/Dividendo)
- Cantidad
- Hash de transacción (click para ver en explorer)

## 4.7 Marketplace

### Crear Listado de Venta

1. Ve a **Marketplace > Mis Listados**
2. Click en **"Nuevo Listado"**
3. Selecciona la propiedad y cantidad de tokens
4. Establece el precio por token
5. Selecciona token de pago aceptado
6. Confirma en tu wallet
7. Tu listado aparece en el marketplace

### Gestionar Listados

- **Editar precio:** Click en "Editar" para cambiar precio
- **Cancelar:** Click en "Cancelar" para retirar del marketplace
- **Ver ofertas:** Revisa ofertas recibidas

## 4.8 Dividendos

### Cómo Funcionan

Los dividendos son distribuciones de ganancias de las propiedades:
- Se distribuyen periódicamente (mensual/trimestral)
- Se calculan proporcional a tus tokens
- Se pagan en USDC/USDT

### Reclamar Dividendos

1. Ve a **Perfil > Dividendos**
2. Verás dividendos pendientes de cobro
3. Click en **"Reclamar"** en cada dividendo
4. Confirma la transacción
5. Los tokens se envían a tu wallet

## 4.9 Seguridad

### Protege tu Cuenta

1. **Nunca compartas tu seed phrase**
2. **Verifica siempre las URLs** antes de firmar
3. **Usa autenticación de dos factores** si tu wallet lo soporta
4. **Revisa los detalles** de cada transacción antes de firmar

### Qué Hacer si...

**Perdí acceso a mi wallet:**
- Si usaste Web3Auth, recupera con tu email/social
- Si usaste MetaMask, usa tu seed phrase de respaldo

**Veo una transacción que no reconozco:**
- Contacta soporte inmediatamente
- No apruebes más transacciones

## 4.10 Glosario

| Término | Definición |
|---------|------------|
| **Token** | Representación digital de una fracción de propiedad |
| **Wallet** | Cartera digital para almacenar criptomonedas |
| **Gas** | Comisión pagada por transacciones en blockchain |
| **USDC/USDT** | Stablecoins (1 token = 1 USD) |
| **Dividendo** | Distribución de ganancias a holders |
| **KYC** | Verificación de identidad |
| **Polygon** | Red blockchain donde opera TokenByU |

\newpage

# 5. Manual de Administrador

## 5.1 Introducción

Este manual cubre las funcionalidades del panel de administración de TokenByU. Solo usuarios con rol ADMIN pueden acceder a estas funciones.

## 5.2 Acceso al Panel Admin

### Requisitos

- Wallet con rol ADMIN en el contrato PropertyToken
- KYC aprobado
- Conexión a la red correcta (Polygon Mainnet/Amoy)

### Verificación de Rol

El sistema verifica tu rol admin:
1. Consulta on-chain al contrato PropertyToken
2. Verifica `hasRole(ADMIN_ROLE, address)` o `hasRole(DEFAULT_ADMIN_ROLE, address)`
3. Cache de 60 segundos para optimizar

### Acceder

1. Conecta tu wallet admin
2. Ve a `/admin` o click en "Admin" en el menú
3. Si no tienes rol, verás mensaje de error

## 5.3 Dashboard

### Métricas Principales

| Métrica | Descripción |
|---------|-------------|
| **Usuarios Totales** | Número de wallets registradas |
| **KYC Pendientes** | Submissions esperando revisión |
| **Propiedades Activas** | Propiedades publicadas |
| **Volumen Total** | Suma de todas las transacciones |
| **Dividendos Distribuidos** | Total de dividendos pagados |

### Alertas

El dashboard muestra alertas para:
- KYC pendientes > 5
- Propiedades pendientes de revisión
- Errores en webhooks
- Contratos pausados

## 5.4 Gestión de Usuarios

### Lista de Usuarios

Accede en **Admin > Usuarios**

**Filtros disponibles:**
- Búsqueda por wallet/email/nombre
- Estado de KYC
- Rol (User/Admin)
- Fecha de registro

**Información mostrada:**
- Wallet address
- Email
- Nombre
- KYC Status
- # de propiedades
- # de transacciones
- Fecha registro

### Acciones

| Acción | Descripción |
|--------|-------------|
| Ver detalle | Información completa del usuario |
| Editar | Modificar nombre/email |
| Cambiar rol | Otorgar/revocar rol admin |

## 5.5 Gestión de KYC

### Cola de Revisión

**Admin > KYC** muestra submissions pendientes ordenadas por fecha (más antiguas primero).

### Revisar Submission

Para cada submission:

1. **Documentos a revisar:**
   - ID Frontal (foto clara, datos legibles)
   - ID Reverso (datos coinciden)
   - Selfie (persona = foto ID, documento visible)

2. **Verificaciones:**
   - [ ] Documento no expirado
   - [ ] Fotos claras, sin edición
   - [ ] Datos coinciden
   - [ ] Selfie verificable

3. **Acciones:**
   - **Aprobar:** Usuario puede operar
   - **Rechazar:** Incluir notas con razón

## 5.6 Gestión de Propiedades

### Crear Nueva Propiedad

1. Click **"Nueva Propiedad"**
2. Completa el formulario:

**Información Básica:**
- Nombre
- Descripción
- Ubicación
- Tipo (Comercial, Residencial, etc.)

**Imágenes:**
- Sube 5-10 fotos de alta calidad
- Formatos: JPG, PNG
- Tamaño máximo: 5MB por imagen

**Documentos:**
- Escrituras (PDF)
- Avalúo (PDF)
- Planos (PDF)

**Financieros:**
- Total de fracciones
- Precio por fracción
- ROI estimado
- Timeline

### Flujo de Aprobación

```
DRAFT → PENDING_REVIEW → APPROVED/REJECTED → ACTIVE
```

### Mintear Tokens

Una vez APPROVED:

1. Ve a **Propiedad > Acciones > Mintear**
2. Verifica: Token ID, Supply, Metadata URI, Royalty fee
3. Click **"Mintear Tokens"**
4. Confirma transacción en wallet
5. Espera confirmación (30-60 segundos)
6. Propiedad cambia a ACTIVE

## 5.7 Gestión de Contratos

### Vista de Contratos

**Admin > Contratos** muestra:

| Contrato | Funciones |
|----------|-----------|
| PropertyToken | Mintear, pausar, roles |
| Marketplace | Pausar, fees, treasury |
| RoyaltyDistributor | Pausar, distribuir |

### Acciones Disponibles

- **Pausar/Despausar:** Detiene operaciones
- **Grant/Revoke Roles:** Gestión de permisos
- **Set Fee:** Cambiar comisión
- **Set Treasury:** Cambiar wallet de fees
- **Add/Remove Payment Token:** Gestionar tokens aceptados

## 5.8 Distribución de Dividendos

### Crear Distribución

1. Ve a **Admin > Dividendos > Nueva Distribución**
2. Selecciona: Propiedad, Monto total, Token de pago, Período
3. Sistema calcula automáticamente: Monto por token, Lista de beneficiarios
4. Click **"Crear Distribución"**

### Aprobar y Ejecutar

1. Distribución creada en estado PENDING
2. Revisa beneficiarios y montos
3. Click **"Aprobar Tokens"** (allowance al contrato)
4. Click **"Distribuir"** para ejecutar on-chain
5. Estado cambia a DISTRIBUTED

## 5.9 Roles y Permisos

### Roles On-Chain

| Rol | Permisos |
|-----|----------|
| DEFAULT_ADMIN_ROLE | Control total, puede otorgar otros roles |
| ADMIN_ROLE | Acceso a panel admin |
| MINTER_ROLE | Puede mintear tokens |
| PAUSER_ROLE | Puede pausar contratos |

### Otorgar Rol Admin

1. Ve a **Admin > Usuarios**
2. Busca al usuario
3. Click **"Cambiar Rol"**
4. Selecciona "Admin"
5. Confirma transacción on-chain

### Auditoría de Roles

Todos los cambios de roles se registran:
- Wallet afectada
- Acción realizada
- Quién ejecutó
- Timestamp
- TX Hash

## 5.10 Checklists

### Checklist Diario Admin

```
[ ] Revisar KYC pendientes
[ ] Verificar propiedades en revisión
[ ] Revisar alertas del dashboard
[ ] Verificar estado de contratos
[ ] Revisar webhooks por errores
```

### Checklist Semanal

```
[ ] Revisar métricas del dashboard
[ ] Verificar volumen de transacciones
[ ] Revisar claims de dividendos pendientes
[ ] Backup de configuración
[ ] Revisar roles de usuarios
```

\newpage

# 6. Modelo de Datos

## 6.1 Diagrama Entidad-Relación

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      User        │         │    KYCSubmission │         │    Transaction   │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │────────►│ id (PK)          │         │ id (PK)          │
│ walletAddress    │◄────────│ userId (FK,UQ)   │         │ userId (FK)      │◄───┐
│ email            │         │ idFrontUrl       │         │ propertyId (FK)  │    │
│ name             │         │ idBackUrl        │         │ type             │    │
│ profileImage     │         │ selfieUrl        │         │ txHash (UQ)      │    │
│ role             │         │ status           │         │ amount           │    │
│ kycStatus        │         │ adminNotes       │         │ tokenAmount      │    │
│ createdAt        │         │ reviewedBy       │         │ paymentToken     │    │
│ updatedAt        │         │ reviewedAt       │         │ status           │    │
└────────┬─────────┘         │ createdAt        │         │ createdAt        │    │
         │                   │ updatedAt        │         └──────────────────┘    │
         │                   └──────────────────┘                                  │
         │                                                                         │
         │ 1:N                                                                     │
         ▼                                                                         │
┌──────────────────┐                                                               │
│    Portfolio     │                                                               │
├──────────────────┤                                                               │
│ id (PK)          │         ┌──────────────────┐                                  │
│ userId (FK)      │◄────────│    Property      │                                  │
│ propertyId (FK)  │────────►├──────────────────┤                                  │
│ tokenAmount      │         │ id (PK)          │──────────────────────────────────┘
│ updatedAt        │         │ tokenId (UQ)     │
└──────────────────┘         │ name             │
                             │ description      │
                             │ location         │
                             │ propertyType     │
                             │ totalFractions   │
                             │ pricePerFraction │
                             │ status           │
                             │ createdAt        │
                             └────────┬─────────┘
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
                      ▼               ▼               ▼
             ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
             │   Listing    │ │   Dividend   │ │  Portfolio   │
             ├──────────────┤ ├──────────────┤ │  (arriba)    │
             │ id (PK)      │ │ id (PK)      │ └──────────────┘
             │ onChainId(UQ)│ │ propertyId(FK)│
             │ propertyId(FK)│ │ totalAmount  │
             │ seller       │ │ amountPerToken│
             │ buyer        │ │ paymentToken │
             │ amount       │ │ period       │
             │ pricePerToken│ │ status       │
             │ status       │ └──────┬───────┘
             │ createdAt    │        │
             └──────────────┘        │ 1:N
                                     ▼
                             ┌──────────────┐
                             │DividendClaim │
                             ├──────────────┤
                             │ id (PK)      │
                             │ dividendId(FK)│
                             │ userAddress  │
                             │ amount       │
                             │ claimed      │
                             │ txHash       │
                             │ claimedAt    │
                             └──────────────┘
```

## 6.2 Descripción de Entidades

### User

Representa a cada usuario de la plataforma, identificado por su wallet address.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `walletAddress` | String | Dirección de wallet (único) |
| `email` | String? | Email opcional |
| `name` | String? | Nombre display |
| `profileImage` | String? | URL de imagen de perfil |
| `role` | UserRole | USER \| ADMIN |
| `kycStatus` | KYCStatus | NONE \| PENDING \| APPROVED \| REJECTED |
| `createdAt` | DateTime | Fecha de registro |
| `updatedAt` | DateTime | Última actualización |

### KYCSubmission

Documentos de verificación KYC enviados por el usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `userId` | String | FK a User (único) |
| `idFrontUrl` | String | URL Cloudinary del ID frontal |
| `idBackUrl` | String | URL Cloudinary del ID reverso |
| `selfieUrl` | String | URL Cloudinary del selfie |
| `status` | KYCStatus | Estado de la verificación |
| `adminNotes` | String? | Notas del admin |
| `reviewedBy` | String? | Wallet del admin que revisó |
| `reviewedAt` | DateTime? | Fecha de revisión |

### Property

Propiedad inmobiliaria tokenizada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `tokenId` | BigInt? | ID del token en blockchain (único) |
| `name` | String | Nombre de la propiedad |
| `description` | String | Descripción completa |
| `location` | String | Ubicación física |
| `propertyType` | PropertyType | RESIDENTIAL \| COMMERCIAL \| INDUSTRIAL \| MIXED |
| `totalFractions` | Int | Total de fracciones/tokens |
| `availableFractions` | Int | Fracciones disponibles |
| `pricePerFraction` | Decimal(18,6) | Precio por fracción en USD |
| `estimatedROI` | Decimal(5,2) | ROI estimado % |
| `status` | PropertyStatus | Estado de la propiedad |

### Listing

Listado de venta en el marketplace.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `onChainListingId` | Int? | ID del listing en el contrato (único) |
| `propertyId` | String | FK a Property |
| `seller` | String | Wallet del vendedor |
| `buyer` | String? | Wallet del comprador (si vendido) |
| `amount` | Int | Cantidad inicial listada |
| `pricePerToken` | Decimal(18,6) | Precio por token |
| `paymentToken` | String | Token de pago |
| `status` | ListingStatus | ACTIVE \| SOLD \| CANCELLED |

### Portfolio

Tokens que posee cada usuario por propiedad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `userId` | String | FK a User |
| `propertyId` | String | FK a Property |
| `tokenAmount` | Int | Cantidad de tokens |
| `updatedAt` | DateTime | Última actualización |

### Dividend

Distribución de dividendos por propiedad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `propertyId` | String | FK a Property |
| `totalAmount` | Decimal(18,6) | Monto total a distribuir |
| `amountPerToken` | Decimal(18,6) | Monto por token |
| `paymentToken` | String | Token de pago |
| `period` | String | Período (ej: "Q1-2024") |
| `status` | DividendStatus | PENDING \| DISTRIBUTED \| CANCELLED |

### DividendClaim

Reclamo de dividendo por usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `dividendId` | String | FK a Dividend |
| `userAddress` | String | Wallet del usuario |
| `amount` | Decimal(18,6) | Monto a reclamar |
| `claimed` | Boolean | Si ya fue reclamado |
| `txHash` | String? | TX del claim |
| `claimedAt` | DateTime? | Fecha del claim |

## 6.3 Enumeraciones

### UserRole
- `USER` - Usuario regular
- `ADMIN` - Administrador

### KYCStatus
- `NONE` - Sin enviar
- `PENDING` - En revisión
- `APPROVED` - Aprobado
- `REJECTED` - Rechazado

### PropertyType
- `RESIDENTIAL` - Residencial
- `COMMERCIAL` - Comercial
- `INDUSTRIAL` - Industrial
- `MIXED` - Mixto

### PropertyStatus
- `PENDING_REVIEW` - Esperando revisión
- `APPROVED` - Aprobado para deploy
- `REJECTED` - Rechazado
- `DRAFT` - Borrador
- `ACTIVE` - Activo en marketplace
- `SOLD_OUT` - Vendido completamente
- `PAUSED` - Pausado

### ListingStatus
- `ACTIVE` - Listado activo
- `SOLD` - Vendido
- `CANCELLED` - Cancelado

### TransactionType
- `BUY` - Compra de tokens
- `SELL` - Venta de tokens
- `DIVIDEND_CLAIM` - Reclamo de dividendo
- `DIVIDEND_DISTRIBUTION` - Distribución de dividendo

### DividendStatus
- `PENDING` - Pendiente de distribución
- `DISTRIBUTED` - Distribuido
- `CANCELLED` - Cancelado

\newpage

# 7. Documentación de Seguridad

## 7.1 Modelo de Seguridad

### Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                          │
│  • HTTPS obligatorio                                             │
│  • CSP Headers                                                   │
│  • XSS Protection                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE AUTENTICACIÓN                         │
│  • Web3Auth (OAuth 2.0)                                         │
│  • JWT con HTTP-only cookies                                     │
│  • Verificación de firma on-chain                               │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE AUTORIZACIÓN                          │
│  • Roles on-chain (ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE)       │
│  • KYC verificado para operaciones                               │
│  • Validación de propiedad de recursos                          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE SMART CONTRACTS                       │
│  • OpenZeppelin (auditado)                                       │
│  • ReentrancyGuard                                              │
│  • Pausable (circuit breaker)                                   │
│  • AccessControl                                                │
└─────────────────────────────────────────────────────────────────┘
```

## 7.2 Sistema de Roles

### Roles On-Chain

| Rol | Hash | Permisos |
|-----|------|----------|
| `DEFAULT_ADMIN_ROLE` | `0x00` | Control total, puede otorgar/revocar otros roles |
| `ADMIN_ROLE` | `keccak256("ADMIN_ROLE")` | Acceso al panel admin, configuración |
| `MINTER_ROLE` | `keccak256("MINTER_ROLE")` | Crear nuevas propiedades/tokens |
| `PAUSER_ROLE` | `keccak256("PAUSER_ROLE")` | Pausar contratos en emergencias |

### Roles en Aplicación

| Rol | Permisos |
|-----|----------|
| `USER` | Comprar, vender, reclamar dividendos (requiere KYC) |
| `ADMIN` | Todo lo anterior + panel admin + gestión de usuarios |

## 7.3 Autenticación

### JWT Token

| Campo | Valor |
|-------|-------|
| Algoritmo | HS256 |
| Expiración | 7 días |
| Almacenamiento | HTTP-only cookie |
| Payload | userId, walletAddress, role, kycStatus |

### Secretos Requeridos

```bash
# Mínimo 32 caracteres, generados aleatoriamente
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key-min-32-chars
```

## 7.4 KYC (Know Your Customer)

### Flujo de Verificación

1. Usuario sube documentos (ID front, ID back, Selfie)
2. Documentos se almacenan en Cloudinary (privados, URLs firmadas)
3. Admin revisa y aprueba/rechaza
4. Aprobación se registra on-chain
5. Usuario puede operar

### Requerimientos de KYC

| Operación | KYC Requerido |
|-----------|---------------|
| Ver propiedades | No |
| Comprar tokens | Sí |
| Vender tokens | Sí |
| Crear listings | Sí |
| Reclamar dividendos | Sí |

## 7.5 Seguridad de Smart Contracts

### Librerías Utilizadas

| Librería | Propósito |
|----------|-----------|
| OpenZeppelin ERC1155 | Tokens de propiedades |
| OpenZeppelin AccessControl | Gestión de roles |
| OpenZeppelin ReentrancyGuard | Prevención de reentrancy |
| OpenZeppelin Pausable | Circuit breaker |
| OpenZeppelin ERC2981 | Royalties estándar |

### Límites y Validaciones

| Parámetro | Límite | Razón |
|-----------|--------|-------|
| Royalty fee | Máx 10% (1000 bp) | Evitar fees abusivos |
| Marketplace fee | Máx 10% | Evitar fees abusivos |
| Tokens por TX | Máx 1000 | Límite de gas |
| Precio mínimo | > 0 | Prevenir spam |

## 7.6 Seguridad de API

### Headers de Seguridad

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### Rate Limiting

| Endpoint | Límite |
|----------|--------|
| `/api/auth/*` | 10 req/min |
| `/api/kyc/upload` | 5 req/min |
| `/api/upload` | 10 req/min |
| Otros | 100 req/min |

## 7.7 Gestión de Incidentes

### Niveles de Severidad

| Nivel | Descripción | Tiempo de Respuesta |
|-------|-------------|---------------------|
| **P0 - Crítico** | Pérdida de fondos, acceso no autorizado | Inmediato |
| **P1 - Alto** | Vulnerabilidad explotable | < 4 horas |
| **P2 - Medio** | Bug de seguridad no explotado | < 24 horas |
| **P3 - Bajo** | Mejora de seguridad | < 1 semana |

### Procedimiento de Emergencia

1. PAUSAR contratos (si aplica)
2. EVALUAR el impacto
3. CONTENER el problema
4. COMUNICAR
5. REMEDIAR
6. POST-MORTEM

## 7.8 Controles de Acceso

### Matriz de Permisos

| Recurso | USER | ADMIN | DEFAULT_ADMIN |
|---------|------|-------|---------------|
| Ver propiedades | ✓ | ✓ | ✓ |
| Comprar tokens | ✓* | ✓ | ✓ |
| Vender tokens | ✓* | ✓ | ✓ |
| Crear propiedades | ✗ | ✓ | ✓ |
| Aprobar KYC | ✗ | ✓ | ✓ |
| Pausar contratos | ✗ | ✓** | ✓ |
| Otorgar roles | ✗ | ✗ | ✓ |

*Requiere KYC aprobado
**Requiere PAUSER_ROLE

## 7.9 Resumen de Buenas Prácticas

1. **Secrets en variables de entorno, nunca en código**
2. **HTTPS obligatorio en producción**
3. **JWT con HTTP-only cookies**
4. **Validación server-side de todos los inputs**
5. **Roles on-chain para autorizaciones críticas**
6. **KYC obligatorio para operaciones financieras**
7. **Contratos pausables para emergencias**
8. **Auditoría de acciones admin**
9. **Rate limiting en todos los endpoints**
10. **Dependencias actualizadas y auditadas**

\newpage

# 8. Guía de Setup y Deploy

## 8.1 Requisitos Previos

### Software Requerido

| Software | Versión Mínima | Propósito |
|----------|---------------|-----------|
| Node.js | 18.x | Runtime |
| npm / yarn | 9.x / 1.x | Package manager |
| PostgreSQL | 15+ | Base de datos |
| Docker | 24.x | Contenedores (opcional) |
| Git | 2.x | Control de versiones |

### Cuentas de Servicios

| Servicio | URL | Propósito |
|----------|-----|-----------|
| Alchemy | https://alchemy.com | RPC + Webhooks |
| Web3Auth | https://web3auth.io | Autenticación social |
| Cloudinary | https://cloudinary.com | Storage de imágenes |
| Pinata | https://pinata.cloud | IPFS storage |

## 8.2 Setup Local

### Clonar e Instalar

```bash
git clone https://github.com/your-org/tokenbyu.git
cd tokenbyu
npm install
```

### Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con valores:

```bash
# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000

# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/tokenbyu

# BLOCKCHAIN
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY

# AUTH
JWT_SECRET=genera-clave-de-min-32-caracteres-aqui
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=tu-client-id-de-web3auth
```

### Configurar Base de Datos

```bash
# Crear base de datos
createdb tokenbyu

# Ejecutar migraciones
npx prisma migrate dev

# Sembrar datos iniciales (opcional)
npx prisma db seed
```

### Iniciar Servidor

```bash
npm run dev
```

Aplicación disponible en: `http://localhost:3000`

## 8.3 Variables de Entorno

### Variables Requeridas

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CHAIN_ID` | ID de la red blockchain |
| `NEXT_PUBLIC_RPC_URL` | URL del RPC |
| `JWT_SECRET` | Clave para JWT (min 32 chars) |
| `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` | Client ID de Web3Auth |

### Variables de Contratos

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS` | Dirección PropertyToken |
| `NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS` | Dirección Marketplace |
| `NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS` | Dirección RoyaltyDistributor |
| `NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS` | Dirección PaymentProcessor |

### Variables de Servicios Externos

| Variable | Descripción |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Nombre de cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `PINATA_API_KEY` | API Key de Pinata |

## 8.4 Deploy de Smart Contracts

### Deploy a Testnet (Amoy)

```bash
npm run deploy:amoy
```

### Deploy a Mainnet (Polygon)

```bash
npm run deploy:polygon
```

### Verificar Contratos

```bash
npm run verify:polygon
```

## 8.5 Deploy a Producción

### Vercel (Recomendado)

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Configurar build: `npm run build`
4. Deploy: `vercel --prod`

### Railway

1. Crear proyecto en Railway
2. Agregar PostgreSQL
3. Configurar variables
4. Deploy automático al push

## 8.6 Comandos Útiles

### Desarrollo

```bash
npm run dev          # Servidor de desarrollo
npm test             # Tests
npm run lint         # Linting
```

### Base de Datos

```bash
npx prisma generate       # Generar cliente
npx prisma migrate dev    # Crear migración
npx prisma migrate deploy # Aplicar migraciones
npx prisma studio         # Abrir Prisma Studio
```

### Smart Contracts

```bash
npx hardhat compile        # Compilar contratos
npx hardhat test           # Tests de contratos
npm run deploy:amoy        # Deploy testnet
npm run deploy:polygon     # Deploy mainnet
```

## 8.7 Checklist de Deploy

### Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Contratos desplegados y verificados
- [ ] Base de datos migrada
- [ ] Tests pasando
- [ ] Build exitoso

### Post-Deploy

- [ ] `/api/health` responde OK
- [ ] Login con Web3Auth funciona
- [ ] Admin puede acceder
- [ ] Webhooks configurados
- [ ] SSL/HTTPS configurado

\newpage

# 9. Runbook Operativo

## 9.1 Información General

### Componentes del Sistema

| Componente | Tecnología | Puerto |
|------------|------------|--------|
| Frontend/API | Next.js | 3000 |
| Database | PostgreSQL | 5432 |
| Blockchain | Polygon | - |
| Storage | Cloudinary | - |
| IPFS | Pinata | - |

## 9.2 Health Checks

### Verificación de Servicios

```bash
# Health check de la aplicación
curl -s https://your-domain.com/api/health | jq

# Respuesta esperada:
# {"status":"healthy","timestamp":"..."}
```

### Verificación de Base de Datos

```bash
npx prisma db execute --stdin <<< "SELECT 1"
```

## 9.3 Backup y Restore

### Backup Manual

```bash
# Crear backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore

```bash
# Restore desde archivo
psql $DATABASE_URL < backup.sql

# Restore desde gzip
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

## 9.4 Procedimientos de Mantenimiento

### Actualización de Aplicación

```bash
# 1. Backup
pg_dump $DATABASE_URL > pre_update_backup.sql

# 2. Pull cambios
git pull origin main

# 3. Instalar dependencias
npm ci

# 4. Ejecutar migraciones
npx prisma migrate deploy

# 5. Build
npm run build

# 6. Restart
pm2 restart tokenbyu

# 7. Verificar
curl https://your-domain.com/api/health
```

## 9.5 Monitoreo

### Métricas Clave

| Métrica | Warning | Critical |
|---------|---------|----------|
| Response time API | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Database connections | > 80% | > 95% |
| Memory usage | > 80% | > 95% |

## 9.6 Troubleshooting

### Aplicación No Responde

```bash
# Verificar estado
pm2 status

# Ver logs
pm2 logs tokenbyu --lines 100

# Restart
pm2 restart tokenbyu
```

### Base de Datos No Conecta

```bash
# Verificar conexión
psql $DATABASE_URL -c "SELECT 1"

# Ver logs
docker-compose logs db
```

## 9.7 Procedimientos de Emergencia

### Pausar Contratos

**Cuándo pausar:**
- Vulnerabilidad detectada
- Comportamiento anómalo
- Ataque en progreso

```bash
npx hardhat run scripts/pause-all.ts --network polygon
```

### Despausar Contratos

```bash
npx hardhat run scripts/unpause-all.ts --network polygon
```

## 9.8 Tareas Programadas

### Diarias

| Hora | Tarea |
|------|-------|
| 02:00 | Backup DB |
| 06:00 | Limpieza logs |
| 08:00 | Health check |

### Mensuales

| Tarea |
|-------|
| Rotación de secrets |
| Auditoría de accesos |
| Actualización de dependencias |
| Test de restore |

## 9.9 Rollback

### Rollback de Aplicación

```bash
git checkout COMMIT_HASH
npm ci
npm run build
pm2 restart tokenbyu
```

### Rollback de Migración

```bash
psql $DATABASE_URL < pre_migration_backup.sql
```

\newpage

# 10. Release Notes

## Version 0.1.0 (Beta) - December 2024

### Overview

Primera versión beta de TokenByU, una plataforma de tokenización de bienes raíces que permite la inversión fraccionada en propiedades inmobiliarias a través de tokens ERC1155 en la red Polygon.

## 10.1 Alcance Entregado

### Smart Contracts (Blockchain)

| Contrato | Descripción | Estado |
|----------|-------------|--------|
| **PropertyToken.sol** | Tokens ERC1155 con royalties ERC2981 | Desplegado |
| **PropertyMarketplace.sol** | Marketplace P2P con KYC | Desplegado |
| **RoyaltyDistributor.sol** | Distribución de dividendos | Desplegado |
| **PaymentProcessor.sol** | Pagos USDT/USDC/MATIC | Desplegado |
| **TestFaucet.sol** | Faucet para testnet | Desplegado |

### Backend (API)

**51 endpoints REST implementados:**

| Módulo | Endpoints |
|--------|-----------|
| Auth | 4 |
| Users | 7 |
| Properties | 7 |
| KYC | 6 |
| Marketplace | 10 |
| Dividends | 7 |
| Admin | 12 |
| Others | 4 |

### Frontend (UI/UX)

**Secciones principales:**
- Home: Landing page con estadísticas
- Explore: Catálogo de propiedades
- Marketplace: Compra/venta de tokens
- Profile: Portfolio, KYC, transacciones
- Admin Panel: Gestión completa

### Testing

| Tipo | Cantidad | Cobertura |
|------|----------|-----------|
| Unit Tests | 852 | Hooks: 95.8%, Services: 100% |
| Integration Tests | 22 | API Routes |
| E2E Tests | Configurado | Playwright ready |

## 10.2 Funcionalidades Principales

### Para Usuarios

1. **Autenticación Web3** - Login con wallet o social
2. **KYC** - Verificación de identidad
3. **Inversión en Propiedades** - Compra de fracciones
4. **Marketplace P2P** - Comercio de tokens
5. **Dividendos** - Reclamo de ganancias

### Para Administradores

1. **Dashboard** - Métricas en tiempo real
2. **Gestión de Propiedades** - CRUD completo
3. **KYC Management** - Aprobación/rechazo
4. **Gestión de Contratos** - Pausar, fees, roles
5. **Distribución de Dividendos** - Crear y ejecutar

## 10.3 Known Issues

### Alta Prioridad

| ID | Issue | Workaround |
|----|-------|------------|
| KI-001 | Cache de admin expira cada 60s | Aumentar TTL |
| KI-002 | Webhooks duplicados en alta carga | Implementar idempotency keys |
| KI-003 | Upload >5MB puede fallar | Comprimir imágenes |

### Media Prioridad

| ID | Issue | Workaround |
|----|-------|------------|
| KI-004 | Estimación de gas imprecisa | Ajuste manual |
| KI-005 | Búsqueda sin full-text | Usar filtros |
| KI-006 | Sin notificaciones email | Check manual |

## 10.4 Limitaciones Conocidas

1. **Límite de tokens por transacción:** Máximo 1000 tokens
2. **KYC requerido:** Todas las operaciones financieras
3. **Royalty máximo:** 10%
4. **Fee marketplace:** Hasta 10%
5. **Tokens de pago:** Solo USDT, USDC y MATIC

## 10.5 Próximos Pasos (Roadmap v0.2.0)

- [ ] Notificaciones push y email
- [ ] Multi-idioma completo (EN/ES)
- [ ] Integración con exchanges
- [ ] Governance tokens
- [ ] Mobile app (React Native)
- [ ] Auditoría de seguridad externa

---

**© 2024 TokenByU. Todos los derechos reservados.**
