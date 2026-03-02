# Manual de Administrador - TokenByU

## Introducción

Este manual cubre las funcionalidades del panel de administración de TokenByU. Solo usuarios con rol ADMIN pueden acceder a estas funciones.

---

## 1. Acceso al Panel Admin

### 1.1 Requisitos

- Wallet con rol ADMIN en el contrato PropertyToken
- KYC aprobado
- Conexión a la red correcta (Polygon Mainnet/Amoy)

### 1.2 Verificación de Rol

El sistema verifica tu rol admin:
1. Consulta on-chain al contrato PropertyToken
2. Verifica `hasRole(ADMIN_ROLE, address)` o `hasRole(DEFAULT_ADMIN_ROLE, address)`
3. Cache de 60 segundos para optimizar

### 1.3 Acceder

1. Conecta tu wallet admin
2. Ve a `/admin` o click en "Admin" en el menú
3. Si no tienes rol, verás mensaje de error

---

## 2. Dashboard

### 2.1 Métricas Principales

| Métrica | Descripción |
|---------|-------------|
| **Usuarios Totales** | Número de wallets registradas |
| **KYC Pendientes** | Submissions esperando revisión |
| **Propiedades Activas** | Propiedades publicadas |
| **Volumen Total** | Suma de todas las transacciones |
| **Dividendos Distribuidos** | Total de dividendos pagados |

### 2.2 Gráficos

- Usuarios nuevos por día/semana/mes
- Transacciones por período
- Distribución de propiedades por tipo
- Estado de KYC breakdown

### 2.3 Alertas

El dashboard muestra alertas para:
- KYC pendientes > 5
- Propiedades pendientes de revisión
- Errores en webhooks
- Contratos pausados

---

## 3. Gestión de Usuarios

### 3.1 Lista de Usuarios

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

### 3.2 Detalle de Usuario

Click en un usuario para ver:
- Información completa
- Portfolio de propiedades
- Historial de transacciones
- Submissions de KYC
- Dividendos reclamados

### 3.3 Acciones

| Acción | Descripción |
|--------|-------------|
| Ver detalle | Información completa del usuario |
| Editar | Modificar nombre/email |
| Cambiar rol | Otorgar/revocar rol admin |

---

## 4. Gestión de KYC

### 4.1 Cola de Revisión

**Admin > KYC** muestra submissions pendientes ordenadas por fecha (más antiguas primero).

### 4.2 Revisar Submission

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

### 4.3 Aprobar KYC

```
1. Click "Aprobar"
2. Confirma en modal
3. Transacción on-chain (opcional)
4. Usuario recibe notificación
```

### 4.4 Rechazar KYC

```
1. Click "Rechazar"
2. Escribe notas detalladas:
   - "Documento expirado"
   - "Foto borrosa"
   - "Datos no coinciden"
3. Usuario puede reenviar
```

### 4.5 Estadísticas KYC

- Total submissions
- Pendientes
- Aprobados
- Rechazados
- Tasa de aprobación
- Tiempo promedio de revisión

---

## 5. Gestión de Propiedades

### 5.1 Lista de Propiedades

**Admin > Propiedades** muestra todas las propiedades con filtros:
- Estado (Draft, Pending, Active, etc.)
- Tipo de propiedad
- Fecha de creación

### 5.2 Crear Nueva Propiedad

1. Click **"Nueva Propiedad"**
2. Completa el formulario:

**Información Básica:**
```
- Nombre: "Torre Reforma 500"
- Descripción: Detalle completo
- Ubicación: "Ciudad de México, CDMX"
- Tipo: Comercial
```

**Imágenes:**
```
- Sube 5-10 fotos de alta calidad
- Formatos: JPG, PNG
- Tamaño máximo: 5MB por imagen
```

**Documentos:**
```
- Escrituras (PDF)
- Avalúo (PDF)
- Planos (PDF)
```

**Financieros:**
```
- Total de fracciones: 10000
- Precio por fracción: $100 USDC
- ROI estimado: 8.5%
- Timeline: Largo plazo
```

3. Click **"Guardar como Borrador"** o **"Enviar a Revisión"**

### 5.3 Flujo de Aprobación

```
DRAFT → PENDING_REVIEW → APPROVED/REJECTED → ACTIVE
```

1. **DRAFT:** Propiedad en edición
2. **PENDING_REVIEW:** Esperando aprobación
3. **APPROVED:** Lista para mintear
4. **ACTIVE:** Tokens minteados, disponible para compra

### 5.4 Revisar Propiedad

Para propiedades en PENDING_REVIEW:

**Checklist:**
- [ ] Información completa y correcta
- [ ] Imágenes de calidad
- [ ] Documentos válidos
- [ ] Precios razonables
- [ ] ROI realista

**Acciones:**
- **Aprobar:** Mover a APPROVED
- **Rechazar:** Incluir razón

### 5.5 Mintear Tokens

Una vez APPROVED:

1. Ve a **Propiedad > Acciones > Mintear**
2. Verifica:
   - Token ID (auto-generado)
   - Supply (total fractions)
   - Metadata URI (IPFS)
   - Royalty fee (default 2.5%)
3. Click **"Mintear Tokens"**
4. Confirma transacción en wallet
5. Espera confirmación (30-60 segundos)
6. Propiedad cambia a ACTIVE

### 5.6 Estadísticas de Propiedad

Para cada propiedad activa:
- Tokens vendidos vs disponibles
- Número de holders
- Listados activos en marketplace
- Dividendos distribuidos
- Volumen total

---

## 6. Gestión de Contratos

### 6.1 Vista de Contratos

**Admin > Contratos** muestra:

| Contrato | Funciones |
|----------|-----------|
| PropertyToken | Mintear, pausar, roles |
| Marketplace | Pausar, fees, treasury |
| RoyaltyDistributor | Pausar, distribuir |

### 6.2 PropertyToken

**Acciones disponibles:**
- **Pausar/Despausar:** Detiene todas las transferencias
- **Grant Minter Role:** Otorga permiso de minteo
- **Revoke Minter Role:** Revoca permiso
- **Ver balance:** Consulta tokens por wallet

### 6.3 Marketplace

**Configuración:**
```
- Marketplace Fee: 0-10% (en basis points)
- Treasury Address: Wallet que recibe fees
- Payment Tokens: USDC, USDT, MATIC
```

**Acciones:**
- **Pausar/Despausar:** Detiene todas las operaciones
- **Set Fee:** Cambiar comisión
- **Set Treasury:** Cambiar wallet de fees
- **Add Token:** Agregar nuevo token de pago
- **Remove Token:** Quitar token de pago

### 6.4 RoyaltyDistributor

**Acciones:**
- **Pausar/Despausar:** Detiene claims
- **Ver distribuciones:** Lista de todas las distribuciones

### 6.5 Historial de Roles

**Admin > Contratos > Historial** muestra:
- Fecha/hora
- Wallet afectada
- Acción (Grant/Revoke)
- Contrato
- Rol
- Ejecutado por
- TX Hash

---

## 7. Distribución de Dividendos

### 7.1 Crear Distribución

1. Ve a **Admin > Dividendos > Nueva Distribución**
2. Selecciona:
   - Propiedad
   - Monto total a distribuir
   - Token de pago (USDC/USDT)
   - Período (Q4 2024, etc.)
3. Sistema calcula automáticamente:
   - Monto por token
   - Lista de beneficiarios
   - Montos individuales
4. Click **"Crear Distribución"**

### 7.2 Aprobar y Ejecutar

1. Distribución creada en estado PENDING
2. Revisa beneficiarios y montos
3. Click **"Aprobar Tokens"** (allowance al contrato)
4. Click **"Distribuir"** para ejecutar on-chain
5. Estado cambia a DISTRIBUTED

### 7.3 Monitorear Claims

Ver quiénes han reclamado:
- Lista de claims pendientes
- Claims completados
- Montos totales

### 7.4 Estadísticas

- Total distribuido históricamente
- Por propiedad
- Tasa de claim
- Tiempo promedio de claim

---

## 8. Configuración del Sistema

### 8.1 Configuración General

**Admin > Configuración**

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| Platform Name | Nombre mostrado | TokenByU |
| Contact Email | Email de soporte | - |
| Marketplace Commission | Fee de plataforma | 2.5% |
| Default Fractions | Fracciones por defecto | 10000 |
| Min Investment | Inversión mínima | $100 |
| Max Investment | Inversión máxima | $1M |
| Treasury Wallet | Wallet de fees | - |
| KYC Required | Requerir KYC | true |
| Maintenance Mode | Modo mantenimiento | false |

### 8.2 Tokens Aceptados

Configurar tokens de pago:
```
- USDC (recomendado)
- USDT
- MATIC
```

### 8.3 Modo Mantenimiento

Activa para:
- Detener nuevas operaciones
- Mostrar mensaje de mantenimiento
- Permitir solo admin access

---

## 9. Roles y Permisos

### 9.1 Roles On-Chain

| Rol | Permisos |
|-----|----------|
| DEFAULT_ADMIN_ROLE | Control total, puede otorgar otros roles |
| ADMIN_ROLE | Acceso a panel admin |
| MINTER_ROLE | Puede mintear tokens |
| PAUSER_ROLE | Puede pausar contratos |

### 9.2 Otorgar Rol Admin

1. Ve a **Admin > Usuarios**
2. Busca al usuario
3. Click **"Cambiar Rol"**
4. Selecciona "Admin"
5. Confirma transacción on-chain

### 9.3 Revocar Rol Admin

1. Mismo proceso
2. Selecciona "User"
3. Confirma transacción

### 9.4 Auditoría de Roles

Todos los cambios de roles se registran:
- Wallet afectada
- Acción realizada
- Quién ejecutó
- Timestamp
- TX Hash

---

## 10. Troubleshooting

### 10.1 Problemas Comunes

**"No tengo acceso admin"**
> Verifica que tu wallet tiene ADMIN_ROLE en el contrato

**"Transacción fallida"**
> Revisa: balance de gas, contrato no pausado, permisos correctos

**"KYC no se actualiza on-chain"**
> Ejecuta manualmente desde Admin > Contratos > KYC

**"Dividendos no aparecen"**
> Verifica que la distribución está en estado DISTRIBUTED

### 10.2 Logs y Debugging

- Revisa console del navegador para errores
- Consulta webhooks en Admin > Webhooks
- Verifica transacciones en Polygonscan

### 10.3 Contacto Técnico

Para problemas técnicos:
- Slack: #tokenbyU-dev
- Email: dev@tokenbyU.com
- GitHub Issues: [repo]

---

## Checklist Diario Admin

```
[ ] Revisar KYC pendientes
[ ] Verificar propiedades en revisión
[ ] Revisar alertas del dashboard
[ ] Verificar estado de contratos
[ ] Revisar webhooks por errores
```

## Checklist Semanal

```
[ ] Revisar métricas del dashboard
[ ] Verificar volumen de transacciones
[ ] Revisar claims de dividendos pendientes
[ ] Backup de configuración
[ ] Revisar roles de usuarios
```
