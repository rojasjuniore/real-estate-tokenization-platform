# API Reference - TokenByU

## Información General

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

---

## Autenticación (Auth)

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

**Notas:** Establece cookie HTTP-only `auth-token` con expiración de 7 días.

---

### POST /api/auth/logout

Cierra la sesión actual.

**Response:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

### GET /api/auth/session

Obtiene la sesión actual.

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": { /* objeto usuario */ }
  }
}
```

---

### POST /api/auth/verify

Verifica firma de mensaje.

**Request:**
```json
{
  "address": "0x1234...",
  "message": "Mensaje a firmar",
  "signature": "0xabc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": { "verified": true, "address": "0x1234..." }
}
```

---

## KYC

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

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "status": "PENDING",
    "createdAt": "2024-12-01T00:00:00Z"
  }
}
```

---

### GET /api/kyc/status

Consulta estado de KYC.

**Headers:** `x-wallet-address: 0x...`

**Response:**
```json
{
  "success": true,
  "data": {
    "kycStatus": "PENDING",
    "submission": {
      "id": "clxyz123",
      "status": "PENDING",
      "adminNotes": null,
      "createdAt": "2024-12-01T00:00:00Z",
      "reviewedAt": null
    }
  }
}
```

---

### POST /api/kyc/upload

Sube documento KYC a Cloudinary.

**Headers:** `x-wallet-address: 0x...`

**Request:** FormData
- `file`: Archivo (JPEG, PNG, WebP, max 5MB)
- `documentType`: `"idFront"` | `"idBack"` | `"selfie"`

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "tokenbyu/kyc/...",
    "documentType": "idFront",
    "size": 245678,
    "type": "image/jpeg"
  }
}
```

---

## Propiedades

### GET /api/properties

Lista propiedades con filtros.

**Query Parameters:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| status | string | - | Filtrar por estado |
| type | string | - | Filtrar por tipo |
| page | int | 1 | Página |
| limit | int | 10 | Por página |

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "clxyz123",
        "tokenId": "1",
        "name": "Torre Reforma 500",
        "location": "CDMX",
        "images": ["url1", "url2"],
        "status": "ACTIVE",
        "totalFractions": 10000,
        "availableFractions": 5000,
        "pricePerFraction": "100.00",
        "estimatedROI": "8.50"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### POST /api/properties

Crea nueva propiedad (Admin).

**Request:**
```json
{
  "name": "Torre Reforma 500",
  "description": "Edificio comercial premium...",
  "location": "Ciudad de México, CDMX",
  "propertyType": "COMMERCIAL",
  "totalFractions": 10000,
  "pricePerFraction": 100.00,
  "images": ["url1", "url2"],
  "documents": ["escrituras.pdf"],
  "mapUrl": "https://maps.google.com/...",
  "estimatedROI": 8.5,
  "timeline": "LONG_TERM"
}
```

---

### GET /api/properties/{id}

Obtiene detalle de propiedad.

**URL Params:** `id` = CUID o tokenId numérico

**Response:** Propiedad completa con listings y dividendos.

---

### PATCH /api/properties/{id}

Actualiza propiedad (Admin).

---

### GET /api/properties/{id}/listings

Lista listings activos de la propiedad.

**Query Parameters:**
| Param | Tipo | Default |
|-------|------|---------|
| status | string | ACTIVE |
| page | int | 1 |
| limit | int | 20 |

---

### GET /api/properties/{id}/dividends

Lista dividendos de la propiedad.

---

### GET /api/properties/next-token-id

Obtiene siguiente tokenId disponible.

**Response:**
```json
{
  "success": true,
  "data": { "nextTokenId": 15 }
}
```

---

## Marketplace

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

---

### POST /api/marketplace/listings

Crea nuevo listing.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "propertyId": "clxyz123",
  "amount": 100,
  "pricePerToken": "150.00",
  "paymentToken": "USDC",
  "onChainListingId": 5,
  "txHash": "0xabc...",
  "approvalTxHash": "0xdef..."
}
```

---

### GET /api/marketplace/listings/{id}

Obtiene detalle del listing.

---

### PUT /api/marketplace/listings/{id}

Actualiza estado del listing (venta/cancelación).

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "status": "SOLD",
  "buyerAddress": "0x5678...",
  "buyTxHash": "0xabc..."
}
```

**Nota:** Cuando status = SOLD, automáticamente transfiere tokens en portfolio.

---

### DELETE /api/marketplace/listings/{id}

Cancela listing.

**Headers:** `x-wallet-address: 0x...`

---

## Usuarios

### GET /api/users

Lista todos los usuarios (Admin).

**Headers:** `x-wallet-address: 0x...` (debe ser admin)

---

### GET /api/users/{address}

Obtiene perfil de usuario.

**URL Params:** `address` = wallet address

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "walletAddress": "0x1234...",
    "email": "user@example.com",
    "name": "Nombre",
    "kycStatus": "APPROVED",
    "portfolio": [ /* items */ ],
    "transactions": [ /* transacciones */ ],
    "_count": { "portfolio": 5, "transactions": 12 }
  }
}
```

---

### PUT /api/users/{address}

Actualiza perfil de usuario.

**Request:**
```json
{
  "email": "nuevo@email.com",
  "name": "Nuevo Nombre"
}
```

---

### GET /api/users/{address}/portfolio

Obtiene portfolio del usuario.

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolio": [
      {
        "id": "clxyz123",
        "tokenAmount": 500,
        "property": { /* propiedad */ }
      }
    ],
    "totals": {
      "totalTokens": 1500,
      "totalValue": 150000.00,
      "properties": 3
    }
  }
}
```

---

### GET /api/users/{address}/transactions

Obtiene transacciones del usuario.

---

### POST /api/users/{address}/profile-image

Sube imagen de perfil.

**Headers:** `x-wallet-address: 0x...`

**Request:** FormData con `file`

---

### DELETE /api/users/{address}/profile-image

Elimina imagen de perfil.

---

## Transacciones

### GET /api/transactions

Lista transacciones del usuario.

**Headers:** `x-wallet-address: 0x...`

**Query Parameters:**
| Param | Tipo | Default |
|-------|------|---------|
| type | string | - |
| page | int | 1 |
| limit | int | 20 |

---

### GET /api/transactions/{hash}

Obtiene detalle de transacción.

**Headers:** `x-wallet-address: 0x...`

**URL Params:** `hash` = transaction hash

---

## Dividendos

### GET /api/dividends

Lista dividendos reclamables del usuario.

**Headers:** `x-wallet-address: 0x...`

**Response:**
```json
{
  "success": true,
  "data": {
    "dividends": [
      {
        "id": "clxyz123",
        "property": { "name": "Torre Reforma", "tokenId": "1" },
        "period": "Q4-2024",
        "amount": "250.00",
        "claimId": "clxyz456",
        "onChainDistributionId": 3
      }
    ],
    "totalClaimable": "750.00"
  }
}
```

---

### POST /api/dividends/claim

Prepara claim de dividendos.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "distributionId": "clxyz123",
  "claimIds": ["clxyz456", "clxyz789"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "claimIds": ["clxyz456"],
    "distributionIds": [3],
    "totalAmount": "250.00",
    "paymentToken": "USDC",
    "contractCall": {
      "functionName": "claimDividend",
      "args": [3]
    }
  }
}
```

---

### PUT /api/dividends/claim

Confirma claim de dividendos.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "claimIds": ["clxyz456"],
  "txHash": "0xabc..."
}
```

---

### GET /api/dividends/history

Historial de dividendos reclamados.

---

## Admin

### GET /api/admin/check

Verifica si usuario es admin.

**Headers:** `x-wallet-address: 0x...`

**Response:**
```json
{
  "success": true,
  "data": { "isAdmin": true }
}
```

---

### GET /api/admin/dashboard

Dashboard con métricas.

**Headers:** `x-wallet-address: 0x...`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalProperties": 15,
    "pendingKyc": 23,
    "tvl": 2500000.00,
    "totalTransactions": 5420,
    "recentActivities": [ /* actividad */ ]
  }
}
```

---

### GET /api/admin/kyc

Lista submissions KYC.

**Headers:** `x-wallet-address: 0x...`

**Query Parameters:**
| Param | Tipo | Default |
|-------|------|---------|
| status | string | PENDING |

---

### GET /api/admin/kyc/{id}

Obtiene detalle de submission KYC.

---

### PUT /api/admin/kyc/{id}

Aprueba o rechaza KYC.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "status": "APPROVED",
  "adminNotes": "Documentos verificados correctamente"
}
```

**Nota:** Ejecuta transacción on-chain para aprobar KYC en smart contracts.

---

### GET /api/admin/dividends

Lista todos los dividendos (Admin).

---

### POST /api/admin/dividends

Crea nueva distribución de dividendos.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "propertyId": "clxyz123",
  "totalAmount": 50000.00,
  "paymentToken": "USDC",
  "period": "Q4-2024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dividend": { /* objeto dividendo */ },
    "claimsCreated": 125,
    "totalHolders": 125
  }
}
```

---

### GET /api/admin/dividends/{id}

Detalle de dividendo con estadísticas.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "property": { /* info propiedad */ },
    "totalAmount": "50000.00",
    "amountPerToken": "5.00",
    "status": "PENDING",
    "stats": {
      "totalHolders": 125,
      "claimedCount": 45,
      "pendingCount": 80,
      "claimPercentage": 36.0,
      "claimedAmount": "18000.00",
      "pendingAmount": "32000.00"
    },
    "holders": [ /* claims enriquecidos */ ]
  }
}
```

---

### POST /api/admin/dividends/{id}/distribute

Ejecuta distribución on-chain.

**Headers:** `x-wallet-address: 0x...`

**Response:**
```json
{
  "success": true,
  "data": {
    "dividend": { /* actualizado */ },
    "blockchain": {
      "approvalTxHash": "0xabc...",
      "txHash": "0xdef...",
      "onChainDistributionId": 5
    },
    "distribution": {
      "totalHolders": 125,
      "totalAmount": "50000.00",
      "distributedAt": "2024-12-01T00:00:00Z"
    }
  }
}
```

---

### DELETE /api/admin/dividends/{id}

Cancela dividendo pendiente.

---

### GET /api/admin/roles

Consulta roles de una wallet.

**Headers:** `x-wallet-address: 0x...`

**Query:** `?address=0x5678...`

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x5678...",
    "roles": [
      {
        "contract": "PropertyToken",
        "address": "0xabc...",
        "hasAdminRole": true,
        "hasDefaultAdminRole": false
      }
    ]
  }
}
```

---

### POST /api/admin/roles

Otorga o revoca roles.

**Headers:** `x-wallet-address: 0x...`

**Request:**
```json
{
  "targetAddress": "0x5678...",
  "action": "grant",
  "contracts": ["PropertyToken", "PropertyMarketplace"]
}
```

---

### GET /api/admin/roles/history

Historial de cambios de roles.

---

### POST /api/upload

Sube imágenes (Admin).

**Headers:** `x-wallet-address: 0x...`

**Request:** FormData con `files[]` (múltiples archivos)

**Response:**
```json
{
  "success": true,
  "data": {
    "images": ["url1", "url2"],
    "details": [
      {
        "url": "https://...",
        "publicId": "tokenbyu/...",
        "width": 1920,
        "height": 1080
      }
    ]
  }
}
```

---

## Otros Endpoints

### POST /api/purchase

Registra compra de tokens.

**Request:**
```json
{
  "propertyId": "clxyz123",
  "amount": 100,
  "paymentToken": "USDC",
  "txHash": "0xabc...",
  "buyerAddress": "0x5678..."
}
```

---

### GET /api/user/portfolio

Portfolio público de usuario.

**Query:** `?wallet=0x1234...`

---

### GET /api/health

Health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-01T00:00:00Z"
}
```

---

## Códigos de Error

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

---

## Integraciones

### Web3Auth
- **Tipo:** OAuth 2.0
- **Uso:** Login social (Google, GitHub, etc.)
- **Config:** `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`

### Cloudinary
- **Tipo:** REST API
- **Uso:** Storage de imágenes y documentos KYC
- **Config:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Alchemy
- **Tipo:** JSON-RPC + Webhooks
- **Uso:** Interacción blockchain, indexación de eventos
- **Config:** `ALCHEMY_API_KEY`, `ALCHEMY_WEBHOOK_SECRET`

### Pinata (IPFS)
- **Tipo:** REST API
- **Uso:** Storage de metadata de tokens
- **Config:** `PINATA_API_KEY`, `PINATA_SECRET_KEY`

---

## Rate Limits

| Endpoint | Límite |
|----------|--------|
| /api/auth/* | 10 req/min |
| /api/kyc/upload | 5 req/min |
| /api/upload | 10 req/min |
| Otros | 100 req/min |

---

## Resumen

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
