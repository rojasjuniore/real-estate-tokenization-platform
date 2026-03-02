# Documentación de Seguridad - TokenByU

## 1. Modelo de Seguridad

### 1.1 Capas de Seguridad

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

---

## 2. Sistema de Roles

### 2.1 Roles On-Chain

| Rol | Hash | Permisos |
|-----|------|----------|
| `DEFAULT_ADMIN_ROLE` | `0x00` | Control total, puede otorgar/revocar otros roles |
| `ADMIN_ROLE` | `keccak256("ADMIN_ROLE")` | Acceso al panel admin, configuración |
| `MINTER_ROLE` | `keccak256("MINTER_ROLE")` | Crear nuevas propiedades/tokens |
| `PAUSER_ROLE` | `keccak256("PAUSER_ROLE")` | Pausar contratos en emergencias |

### 2.2 Roles en Aplicación

| Rol | Permisos |
|-----|----------|
| `USER` | Comprar, vender, reclamar dividendos (requiere KYC) |
| `ADMIN` | Todo lo anterior + panel admin + gestión de usuarios |

### 2.3 Verificación de Admin

```typescript
// Verificación on-chain con cache de 60s
const isAdmin = await checkAdminRole(walletAddress);
// Consulta: hasRole(ADMIN_ROLE, address) || hasRole(DEFAULT_ADMIN_ROLE, address)
```

---

## 3. Autenticación

### 3.1 Flujo de Autenticación

```
Usuario → Web3Auth → Firma de mensaje → Backend → JWT → Cookie HTTP-only
```

### 3.2 JWT Token

| Campo | Valor |
|-------|-------|
| Algoritmo | HS256 |
| Expiración | 7 días |
| Almacenamiento | HTTP-only cookie |
| Payload | userId, walletAddress, role, kycStatus |

### 3.3 Secretos Requeridos

```bash
# Mínimo 32 caracteres, generados aleatoriamente
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key-min-32-chars
```

**Generación recomendada:**
```bash
openssl rand -hex 32
```

---

## 4. KYC (Know Your Customer)

### 4.1 Flujo de Verificación

```
1. Usuario sube documentos (ID front, ID back, Selfie)
2. Documentos se almacenan en Cloudinary (privados, URLs firmadas)
3. Admin revisa y aprueba/rechaza
4. Aprobación se registra on-chain en:
   - PropertyMarketplace.setKYCApproved()
   - PaymentProcessor.setKYCApproved()
5. Usuario puede operar
```

### 4.2 Requerimientos de KYC

| Operación | KYC Requerido |
|-----------|---------------|
| Ver propiedades | No |
| Comprar tokens | Sí |
| Vender tokens | Sí |
| Crear listings | Sí |
| Reclamar dividendos | Sí |

### 4.3 Almacenamiento de Documentos

- **Servicio:** Cloudinary
- **Tipo:** Private/Signed URLs
- **Retención:** Indefinida (auditoría)
- **Acceso:** Solo admins autorizados

---

## 5. Seguridad de Smart Contracts

### 5.1 Librerías Utilizadas

| Librería | Propósito |
|----------|-----------|
| OpenZeppelin ERC1155 | Tokens de propiedades |
| OpenZeppelin AccessControl | Gestión de roles |
| OpenZeppelin ReentrancyGuard | Prevención de reentrancy |
| OpenZeppelin Pausable | Circuit breaker |
| OpenZeppelin ERC2981 | Royalties estándar |

### 5.2 Protecciones Implementadas

```solidity
// ReentrancyGuard en todas las funciones de transferencia
function buy(uint256 listingId, uint256 amount) external nonReentrant {
    // ...
}

// Pausable para emergencias
function pause() external onlyRole(PAUSER_ROLE) {
    _pause();
}

// AccessControl para permisos
function createProperty(...) external onlyRole(MINTER_ROLE) {
    // ...
}
```

### 5.3 Límites y Validaciones

| Parámetro | Límite | Razón |
|-----------|--------|-------|
| Royalty fee | Máx 10% (1000 bp) | Evitar fees abusivos |
| Marketplace fee | Máx 10% | Evitar fees abusivos |
| Tokens por TX | Máx 1000 | Límite de gas |
| Precio mínimo | > 0 | Prevenir spam |

---

## 6. Seguridad de API

### 6.1 Headers de Seguridad

```typescript
// next.config.js
headers: [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
]
```

### 6.2 Rate Limiting

| Endpoint | Límite |
|----------|--------|
| `/api/auth/*` | 10 req/min |
| `/api/kyc/upload` | 5 req/min |
| `/api/upload` | 10 req/min |
| Otros | 100 req/min |

### 6.3 Validación de Entrada

- Todos los inputs validados server-side
- Sanitización de strings
- Validación de direcciones Ethereum
- Límites de tamaño en uploads (5MB)

---

## 7. Protección de Datos

### 7.1 Datos Sensibles

| Dato | Protección |
|------|------------|
| Private keys | Nunca en código, solo en `.env` |
| JWT secrets | Variables de entorno |
| Documentos KYC | Cloudinary private + signed URLs |
| Passwords DB | Variables de entorno |

### 7.2 Variables de Entorno

```bash
# .gitignore DEBE incluir:
.env
.env.local
.env.*.local
```

### 7.3 Logs

- No loguear datos sensibles (passwords, keys, tokens)
- Logs de auditoría para acciones admin
- Retención de logs: 90 días mínimo

---

## 8. Checklist de Seguridad

### 8.1 Pre-Producción

#### Smart Contracts
- [ ] Auditoría externa completada
- [ ] Tests de seguridad pasados
- [ ] Fuzzing realizado
- [ ] Gas límits verificados
- [ ] Emergency pause probado

#### Backend
- [ ] Variables de entorno revisadas
- [ ] HTTPS configurado
- [ ] Rate limiting activo
- [ ] Headers de seguridad configurados
- [ ] Validación de inputs completa

#### Frontend
- [ ] CSP configurado
- [ ] XSS protection activo
- [ ] No secrets en código
- [ ] CORS configurado correctamente

### 8.2 Operaciones Diarias

- [ ] Revisar logs de errores
- [ ] Monitorear transacciones anómalas
- [ ] Verificar estado de contratos
- [ ] Revisar accesos admin

### 8.3 Mensuales

- [ ] Rotar JWT/Session secrets
- [ ] Auditar accesos de admin
- [ ] Revisar dependencias (npm audit)
- [ ] Backup de configuración

---

## 9. Gestión de Incidentes

### 9.1 Niveles de Severidad

| Nivel | Descripción | Tiempo de Respuesta |
|-------|-------------|---------------------|
| **P0 - Crítico** | Pérdida de fondos, acceso no autorizado | Inmediato |
| **P1 - Alto** | Vulnerabilidad explotable | < 4 horas |
| **P2 - Medio** | Bug de seguridad no explotado | < 24 horas |
| **P3 - Bajo** | Mejora de seguridad | < 1 semana |

### 9.2 Procedimiento de Emergencia

```
1. PAUSAR contratos (si aplica)
   - PropertyToken.pause()
   - PropertyMarketplace.pause()
   - RoyaltyDistributor.pause()

2. EVALUAR el impacto
   - ¿Fondos comprometidos?
   - ¿Datos expuestos?
   - ¿Alcance del problema?

3. CONTENER el problema
   - Revocar accesos comprometidos
   - Bloquear endpoints afectados
   - Aislar sistemas

4. COMUNICAR
   - Equipo interno
   - Usuarios afectados (si aplica)
   - Autoridades (si requerido)

5. REMEDIAR
   - Deploy de fix
   - Despausar contratos
   - Verificar normalidad

6. POST-MORTEM
   - Documentar incidente
   - Actualizar procedimientos
   - Implementar mejoras
```

### 9.3 Contactos de Emergencia

| Rol | Responsabilidad |
|-----|-----------------|
| Security Lead | Decisiones de pausado |
| DevOps | Acceso a infraestructura |
| Legal | Comunicación a autoridades |
| Comms | Comunicación a usuarios |

---

## 10. Controles de Acceso

### 10.1 Matriz de Permisos

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

### 10.2 Principio de Mínimo Privilegio

- Usuarios solo reciben permisos necesarios
- Roles admin otorgados solo a personal verificado
- Acceso a producción limitado
- Keys de deploy separadas de keys operativas

---

## 11. Auditoría

### 11.1 Logs de Auditoría

Todos los cambios de roles se registran en `RoleTransaction`:
- Wallet afectada
- Acción (GRANT/REVOKE)
- Contrato
- Admin que ejecutó
- TX hash
- Timestamp

### 11.2 Retención de Datos

| Tipo | Retención |
|------|-----------|
| Transacciones | Indefinido (blockchain) |
| Logs de auditoría | 2 años |
| KYC documents | Según regulación local |
| Access logs | 90 días |

---

## 12. Compliance

### 12.1 Regulaciones Consideradas

- **KYC/AML:** Verificación de identidad obligatoria
- **GDPR:** Derecho al olvido (donde aplique)
- **Securities:** Tokens pueden considerarse valores en algunas jurisdicciones

### 12.2 Descargos

- Los usuarios deben aceptar términos de servicio
- Advertencias de riesgo visibles
- No consejo financiero

---

## Resumen de Buenas Prácticas

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
