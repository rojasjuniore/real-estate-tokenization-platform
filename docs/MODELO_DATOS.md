# Modelo de Datos - TokenByU

## Diagrama Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODELO DE DATOS TOKENBYÜ                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

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
└────────┬─────────┘         │ marketplaceTxHash│         │ createdAt        │    │
         │                   │ paymentProcessTxH│         └──────────────────┘    │
         │                   │ createdAt        │                                  │
         │                   │ updatedAt        │                                  │
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
  @@unique(userId,           │ description      │
   propertyId)               │ location         │
                             │ mapUrl           │
                             │ propertyType     │
                             │ images[]         │
                             │ documents[]      │
                             │ metadataUri      │
                             │ totalFractions   │
                             │ availableFractions│
                             │ pricePerFraction │
                             │ estimatedROI     │
                             │ timeline         │
                             │ status           │
                             │ rejectionReason  │
                             │ reviewedBy       │
                             │ reviewedAt       │
                             │ mintTxHash       │
                             │ approveTxHash    │
                             │ listingTxHash    │
                             │ mintBlockNumber  │
                             │ contractAddress  │
                             │ chainId          │
                             │ mintedAt         │
                             │ createdAt        │
                             │ updatedAt        │
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
             │ remainingAmt │ │ onChainDistId│
             │ pricePerToken│ │ approvalTxHash│
             │ paymentToken │ │ txHash       │
             │ paymentTokAddr│ │ status       │
             │ approvalTxHash│ │ distributedAt│
             │ txHash       │ │ createdAt    │
             │ buyTxHash    │ └──────┬───────┘
             │ status       │        │
             │ createdAt    │        │ 1:N
             │ updatedAt    │        ▼
             └──────────────┘ ┌──────────────┐
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

┌──────────────────┐         ┌──────────────────┐
│  SystemConfig    │         │ RoleTransaction  │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ platformName     │         │ targetAddress    │
│ contactEmail     │         │ executedBy       │
│ marketplaceComm. │         │ action           │
│ defaultFractions │         │ contractName     │
│ minInvestment    │         │ contractAddress  │
│ maxInvestment    │         │ roleHash         │
│ treasuryWallet   │         │ txHash (UQ)      │
│ acceptedTokens[] │         │ blockNumber      │
│ kycRequired      │         │ gasUsed          │
│ maintenanceMode  │         │ status           │
│ updatedAt        │         │ errorMessage     │
└──────────────────┘         │ createdAt        │
                             └──────────────────┘
```

---

## Descripción de Entidades

### 1. User

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

**Relaciones:**
- `portfolio[]` → Portfolio (1:N)
- `transactions[]` → Transaction (1:N)
- `kycSubmission?` → KYCSubmission (1:1)

---

### 2. KYCSubmission

Documentos de verificación KYC enviados por el usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `userId` | String | FK a User (único - solo 1 submission por user) |
| `idFrontUrl` | String | URL Cloudinary del ID frontal |
| `idBackUrl` | String | URL Cloudinary del ID reverso |
| `selfieUrl` | String | URL Cloudinary del selfie |
| `status` | KYCStatus | Estado de la verificación |
| `adminNotes` | String? | Notas del admin (razón de rechazo) |
| `reviewedBy` | String? | Wallet del admin que revisó |
| `reviewedAt` | DateTime? | Fecha de revisión |
| `marketplaceTxHash` | String? | TX de aprobación en Marketplace |
| `paymentProcessorTxHash` | String? | TX de aprobación en PaymentProcessor |
| `createdAt` | DateTime | Fecha de envío |
| `updatedAt` | DateTime | Última actualización |

---

### 3. Property

Propiedad inmobiliaria tokenizada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `tokenId` | BigInt? | ID del token en blockchain (único, nullable antes de mint) |
| `name` | String | Nombre de la propiedad |
| `description` | String | Descripción completa |
| `location` | String | Ubicación física |
| `mapUrl` | String? | URL de Google Maps embed |
| `propertyType` | PropertyType | RESIDENTIAL \| COMMERCIAL \| INDUSTRIAL \| MIXED |
| `images` | String[] | URLs de imágenes |
| `documents` | String[] | URLs de documentos legales |
| `metadataUri` | String? | URI de metadata en IPFS |
| `totalFractions` | Int | Total de fracciones/tokens |
| `availableFractions` | Int | Fracciones disponibles |
| `pricePerFraction` | Decimal(18,6) | Precio por fracción en USD |
| `estimatedROI` | Decimal(5,2) | ROI estimado % |
| `timeline` | InvestmentTimeline | SHORT_TERM \| LONG_TERM |
| `status` | PropertyStatus | Estado de la propiedad |
| `rejectionReason` | String? | Razón si fue rechazada |
| `reviewedBy` | String? | Admin que revisó |
| `reviewedAt` | DateTime? | Fecha de revisión |
| `mintTxHash` | String? | Hash de transacción de mint |
| `approveTxHash` | String? | Hash de approval |
| `listingTxHash` | String? | Hash de listing |
| `mintBlockNumber` | Int? | Bloque de confirmación |
| `contractAddress` | String? | Dirección del contrato |
| `chainId` | Int? | ID de la red (137 Polygon) |
| `mintedAt` | DateTime? | Fecha de mint |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Última actualización |

**Relaciones:**
- `listings[]` → Listing (1:N)
- `dividends[]` → Dividend (1:N)
- `portfolios[]` → Portfolio (1:N)

---

### 4. Listing

Listado de venta en el marketplace.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `onChainListingId` | Int? | ID del listing en el contrato (único) |
| `propertyId` | String | FK a Property |
| `seller` | String | Wallet del vendedor |
| `buyer` | String? | Wallet del comprador (si vendido) |
| `amount` | Int | Cantidad inicial listada |
| `remainingAmount` | Int? | Cantidad restante |
| `pricePerToken` | Decimal(18,6) | Precio por token |
| `paymentToken` | String | Token de pago (USDC/USDT/MATIC) |
| `paymentTokenAddress` | String? | Dirección del contrato de pago |
| `approvalTxHash` | String? | TX de aprobación de tokens |
| `txHash` | String? | TX de creación del listing |
| `buyTxHash` | String? | TX de compra |
| `status` | ListingStatus | ACTIVE \| SOLD \| CANCELLED |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Última actualización |

---

### 5. Portfolio

Tokens que posee cada usuario por propiedad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `userId` | String | FK a User |
| `propertyId` | String | FK a Property |
| `tokenAmount` | Int | Cantidad de tokens |
| `updatedAt` | DateTime | Última actualización |

**Constraint:** `@@unique([userId, propertyId])` - Un registro por usuario/propiedad.

---

### 6. Transaction

Registro de todas las transacciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `userId` | String | FK a User |
| `propertyId` | String? | FK a Property (opcional) |
| `type` | TransactionType | BUY \| SELL \| DIVIDEND_CLAIM \| DIVIDEND_DISTRIBUTION |
| `txHash` | String | Hash de blockchain (único) |
| `amount` | Decimal(18,6) | Monto en USD |
| `tokenAmount` | Int? | Cantidad de tokens |
| `paymentToken` | String | Token utilizado |
| `status` | TransactionStatus | PENDING \| CONFIRMED \| FAILED |
| `createdAt` | DateTime | Fecha de transacción |

---

### 7. Dividend

Distribución de dividendos por propiedad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `propertyId` | String | FK a Property |
| `totalAmount` | Decimal(18,6) | Monto total a distribuir |
| `amountPerToken` | Decimal(18,6) | Monto por token |
| `paymentToken` | String | Token de pago (USDC/USDT) |
| `period` | String | Período (ej: "Q1-2024") |
| `onChainDistributionId` | Int? | ID en el contrato |
| `approvalTxHash` | String? | TX de aprobación |
| `txHash` | String? | TX de distribución |
| `status` | DividendStatus | PENDING \| DISTRIBUTED \| CANCELLED |
| `distributedAt` | DateTime? | Fecha de distribución |
| `createdAt` | DateTime | Fecha de creación |

**Relaciones:**
- `claims[]` → DividendClaim (1:N)

---

### 8. DividendClaim

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

---

### 9. SystemConfig

Configuración global del sistema (singleton).

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `id` | String (CUID) | - | Identificador único |
| `platformName` | String | "TokenByU" | Nombre de la plataforma |
| `contactEmail` | String | "" | Email de contacto |
| `marketplaceCommission` | Decimal(5,2) | 2.5 | Comisión % |
| `defaultFractions` | Int | 10000 | Fracciones por defecto |
| `minInvestment` | Int | 1 | Inversión mínima USD |
| `maxInvestment` | Int | 1000000 | Inversión máxima USD |
| `treasuryWallet` | String | "" | Wallet de tesorería |
| `acceptedTokens` | String[] | ["USDC","USDT","MATIC"] | Tokens aceptados |
| `kycRequired` | Boolean | true | Requerir KYC |
| `maintenanceMode` | Boolean | false | Modo mantenimiento |
| `updatedAt` | DateTime | - | Última actualización |

---

### 10. RoleTransaction

Auditoría de cambios de roles en smart contracts.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (CUID) | Identificador único |
| `targetAddress` | String | Wallet afectada |
| `executedBy` | String | Admin que ejecutó |
| `action` | RoleAction | GRANT \| REVOKE |
| `contractName` | String | Nombre del contrato |
| `contractAddress` | String | Dirección del contrato |
| `roleHash` | String | Hash del rol (bytes32) |
| `txHash` | String | TX hash (único) |
| `blockNumber` | Int? | Número de bloque |
| `gasUsed` | String? | Gas utilizado |
| `status` | RoleTransactionStatus | SUCCESS \| FAILED |
| `errorMessage` | String? | Mensaje de error |
| `createdAt` | DateTime | Fecha de ejecución |

**Índices:** `targetAddress`, `executedBy`, `createdAt`

---

## Enumeraciones

### UserRole
```
USER   - Usuario regular
ADMIN  - Administrador
```

### KYCStatus
```
NONE      - Sin enviar
PENDING   - En revisión
APPROVED  - Aprobado
REJECTED  - Rechazado
```

### PropertyType
```
RESIDENTIAL  - Residencial
COMMERCIAL   - Comercial
INDUSTRIAL   - Industrial
MIXED        - Mixto
```

### PropertyStatus
```
PENDING_REVIEW  - Esperando revisión
APPROVED        - Aprobado para deploy
REJECTED        - Rechazado
DRAFT           - Borrador (legacy)
ACTIVE          - Activo en marketplace
SOLD_OUT        - Vendido completamente
PAUSED          - Pausado
```

### InvestmentTimeline
```
SHORT_TERM  - 1-2 años
LONG_TERM   - 3-4 años
```

### ListingStatus
```
ACTIVE     - Listado activo
SOLD       - Vendido
CANCELLED  - Cancelado
```

### TransactionType
```
BUY                    - Compra de tokens
SELL                   - Venta de tokens
DIVIDEND_CLAIM         - Reclamo de dividendo
DIVIDEND_DISTRIBUTION  - Distribución de dividendo
```

### TransactionStatus
```
PENDING    - Pendiente de confirmación
CONFIRMED  - Confirmado en blockchain
FAILED     - Transacción fallida
```

### DividendStatus
```
PENDING      - Pendiente de distribución
DISTRIBUTED  - Distribuido
CANCELLED    - Cancelado
```

### RoleAction
```
GRANT   - Otorgar rol
REVOKE  - Revocar rol
```

### RoleTransactionStatus
```
SUCCESS  - Transacción exitosa
FAILED   - Transacción fallida
```

---

## Consideraciones de Diseño

### Decimals
- **Precios y montos:** `Decimal(18,6)` para precisión de stablecoins
- **ROI y comisiones:** `Decimal(5,2)` para porcentajes

### IDs
- **App IDs:** CUID (collision-resistant unique identifiers)
- **Blockchain IDs:** BigInt para tokenId, Int para listingId/distributionId

### Timestamps
- **createdAt:** Fecha de creación (inmutable)
- **updatedAt:** Actualizado automáticamente por Prisma

### Soft Delete
No implementado actualmente. Transacciones y datos financieros se mantienen por auditoría.

### Índices
- `walletAddress` en User (único)
- `tokenId` en Property (único)
- `txHash` en múltiples tablas (único)
- `targetAddress`, `executedBy`, `createdAt` en RoleTransaction
