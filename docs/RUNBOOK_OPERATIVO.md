# Runbook Operativo - TokenByU

## 1. Información General

### 1.1 Componentes del Sistema

| Componente | Tecnología | Puerto | URL |
|------------|------------|--------|-----|
| Frontend/API | Next.js | 3000 | https://your-domain.com |
| Database | PostgreSQL | 5432 | Internal |
| Blockchain | Polygon | - | RPC endpoint |
| Storage | Cloudinary | - | cloudinary.com |
| IPFS | Pinata | - | pinata.cloud |

### 1.2 Contactos

| Rol | Responsabilidad |
|-----|-----------------|
| Ops Lead | Decisiones operativas |
| Dev Lead | Escalaciones técnicas |
| DBA | Base de datos |
| Security | Incidentes de seguridad |

---

## 2. Health Checks

### 2.1 Verificación de Servicios

```bash
# Health check de la aplicación
curl -s https://your-domain.com/api/health | jq

# Respuesta esperada:
# {"status":"healthy","timestamp":"2024-12-01T00:00:00Z"}
```

### 2.2 Verificación de Base de Datos

```bash
# Con Prisma
npx prisma db execute --stdin <<< "SELECT 1"

# Con psql
psql $DATABASE_URL -c "SELECT 1"
```

### 2.3 Verificación de Contratos

```bash
# Verificar que contratos no están pausados
npx hardhat run scripts/check-status.ts --network polygon

# O via API
curl -s https://your-domain.com/api/admin/contracts/status \
  -H "x-wallet-address: 0xADMIN_WALLET"
```

---

## 3. Backup y Restore

### 3.1 Backup de Base de Datos

#### Backup Manual

```bash
# Crear backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup a S3 (si configurado)
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://your-bucket/backups/tokenbyu_$(date +%Y%m%d).sql.gz
```

#### Backup Automatizado (Cron)

```bash
# Agregar a crontab
0 2 * * * /path/to/backup-script.sh >> /var/log/backup.log 2>&1
```

**backup-script.sh:**
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
RETENTION_DAYS=30

# Crear backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/tokenbyu_$TIMESTAMP.sql.gz

# Limpiar backups antiguos
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Subir a S3 (opcional)
aws s3 cp $BACKUP_DIR/tokenbyu_$TIMESTAMP.sql.gz s3://your-bucket/backups/
```

### 3.2 Restore de Base de Datos

```bash
# Restore desde archivo
psql $DATABASE_URL < backup_20241201_020000.sql

# Restore desde gzip
gunzip -c backup_20241201_020000.sql.gz | psql $DATABASE_URL

# Restore desde S3
aws s3 cp s3://your-bucket/backups/tokenbyu_20241201.sql.gz - | gunzip | psql $DATABASE_URL
```

### 3.3 Backup de Configuración

```bash
# Exportar variables de entorno (sin secrets)
env | grep -E "^NEXT_PUBLIC" > config_backup.env

# Backup de .env (SEGURO, no commitear)
cp .env .env.backup.$(date +%Y%m%d)
```

### 3.4 Datos en Blockchain

Los datos on-chain (tokens, listings, distribuciones) no requieren backup tradicional:
- Son inmutables en blockchain
- Se pueden reconstruir desde eventos
- Usar servicios como The Graph para indexación

---

## 4. Procedimientos de Mantenimiento

### 4.1 Actualización de Aplicación

```bash
# 1. Notificar usuarios (si downtime esperado)

# 2. Backup de base de datos
pg_dump $DATABASE_URL > pre_update_backup.sql

# 3. Pull cambios
git pull origin main

# 4. Instalar dependencias
npm ci

# 5. Ejecutar migraciones
npx prisma migrate deploy

# 6. Build
npm run build

# 7. Restart
pm2 restart tokenbyu
# o
docker-compose up -d --build

# 8. Verificar
curl https://your-domain.com/api/health
```

### 4.2 Actualización de Base de Datos

```bash
# 1. Backup
pg_dump $DATABASE_URL > pre_migration_backup.sql

# 2. Ejecutar migración
npx prisma migrate deploy

# 3. Verificar
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\""

# 4. Rollback si necesario
psql $DATABASE_URL < pre_migration_backup.sql
```

### 4.3 Rotación de Secrets

```bash
# 1. Generar nuevos secrets
NEW_JWT_SECRET=$(openssl rand -hex 32)
NEW_SESSION_SECRET=$(openssl rand -hex 32)

# 2. Actualizar en producción
# (Vercel, Railway, o archivo .env)

# 3. Restart aplicación
pm2 restart tokenbyu

# 4. NOTA: Los usuarios con JWT activo serán deslogueados
```

---

## 5. Monitoreo

### 5.1 Métricas Clave

| Métrica | Umbral Warning | Umbral Critical |
|---------|----------------|-----------------|
| Response time API | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Database connections | > 80% | > 95% |
| Memory usage | > 80% | > 95% |
| Disk usage | > 80% | > 95% |

### 5.2 Logs

```bash
# Ver logs de aplicación
pm2 logs tokenbyu

# Docker
docker-compose logs -f app

# Filtrar errores
docker-compose logs app 2>&1 | grep -i error
```

### 5.3 Alertas Recomendadas

- API health check failing
- Error rate spike
- Database connection failures
- Contract paused
- High gas prices (>100 gwei)

---

## 6. Troubleshooting

### 6.1 Aplicación No Responde

```bash
# 1. Verificar estado
pm2 status
# o
docker-compose ps

# 2. Ver logs
pm2 logs tokenbyu --lines 100
# o
docker-compose logs --tail 100 app

# 3. Restart
pm2 restart tokenbyu
# o
docker-compose restart app

# 4. Si persiste, verificar recursos
free -m
df -h
```

### 6.2 Base de Datos No Conecta

```bash
# 1. Verificar servicio
docker-compose ps db
# o
systemctl status postgresql

# 2. Verificar conexión
psql $DATABASE_URL -c "SELECT 1"

# 3. Ver logs
docker-compose logs db
# o
tail -f /var/log/postgresql/postgresql-15-main.log

# 4. Verificar conexiones
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# 5. Restart si necesario
docker-compose restart db
```

### 6.3 Transacciones Blockchain Fallando

```bash
# 1. Verificar RPC
curl -X POST $NEXT_PUBLIC_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# 2. Verificar gas prices
curl -X POST $NEXT_PUBLIC_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'

# 3. Verificar balance de treasury
# (para operaciones que requieren gas del servidor)

# 4. Verificar contratos no pausados
# Via panel admin o script
```

### 6.4 KYC No Se Aprueba On-Chain

```bash
# 1. Verificar que la transacción fue minada
# En Polygonscan buscar el txHash

# 2. Verificar que admin tiene ADMIN_ROLE
npx hardhat run scripts/check-roles.ts --network polygon

# 3. Verificar estado on-chain
# PropertyMarketplace.isKYCApproved(userAddress)
# PaymentProcessor.isKYCApproved(userAddress)

# 4. Si TX falló, reintentar desde admin panel
```

### 6.5 Web3Auth No Funciona

1. Verificar `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` correcto
2. Verificar dominio en Web3Auth Dashboard (Allowed Origins)
3. Limpiar cache del navegador
4. Probar en incognito
5. Verificar que no hay bloqueadores de popup

---

## 7. Procedimientos de Emergencia

### 7.1 Pausar Contratos

**Cuándo pausar:**
- Vulnerabilidad detectada
- Comportamiento anómalo
- Ataque en progreso

```bash
# Via Hardhat (requiere PAUSER_ROLE)
npx hardhat run scripts/pause-all.ts --network polygon

# O via Admin Panel
# Admin > Contratos > Pausar
```

### 7.2 Despausar Contratos

```bash
# Via Hardhat
npx hardhat run scripts/unpause-all.ts --network polygon

# O via Admin Panel
# Admin > Contratos > Despausar
```

### 7.3 Revocar Acceso Admin

```bash
# Via Hardhat
npx hardhat run scripts/revoke-admin.ts --network polygon --address 0xCOMPROMETIDA

# O via Admin Panel (requiere DEFAULT_ADMIN_ROLE)
# Admin > Roles > Revocar
```

### 7.4 Modo Mantenimiento

```bash
# 1. Activar en base de datos
# Admin > Configuración > Modo Mantenimiento: ON

# 2. O via API
curl -X PATCH https://your-domain.com/api/admin/settings \
  -H "x-wallet-address: 0xADMIN" \
  -H "Content-Type: application/json" \
  -d '{"maintenanceMode": true}'
```

---

## 8. Tareas Programadas

### 8.1 Diarias

| Hora | Tarea | Comando/Acción |
|------|-------|----------------|
| 02:00 | Backup DB | `backup-script.sh` |
| 06:00 | Limpieza logs | `find /logs -mtime +7 -delete` |
| 08:00 | Health check | Verificar dashboards |

### 8.2 Semanales

| Día | Tarea |
|-----|-------|
| Lunes | Revisar métricas de la semana anterior |
| Miércoles | Verificar backups funcionando |
| Viernes | Revisar logs de errores |

### 8.3 Mensuales

| Tarea | Descripción |
|-------|-------------|
| Rotación de secrets | JWT_SECRET, SESSION_SECRET |
| Auditoría de accesos | Revisar roles admin |
| Actualización de dependencias | npm audit, npm update |
| Test de restore | Verificar backups restaurables |
| Revisión de capacidad | Disco, memoria, conexiones |

---

## 9. Escalamiento

### 9.1 Señales de Escalamiento Necesario

- Response times > 1s consistentemente
- Error rate > 2%
- CPU > 80% sostenido
- Memory > 90%
- Database connections maxed

### 9.2 Opciones de Escalamiento

| Componente | Vertical | Horizontal |
|------------|----------|------------|
| App | Más RAM/CPU | Más instancias + load balancer |
| Database | Más RAM/CPU | Read replicas |
| Storage | N/A | CDN ya distribuido |

---

## 10. Rollback

### 10.1 Rollback de Aplicación

```bash
# 1. Identificar versión anterior
git log --oneline -10

# 2. Revertir
git checkout COMMIT_HASH

# 3. Rebuild y restart
npm ci
npm run build
pm2 restart tokenbyu
```

### 10.2 Rollback de Migración

```bash
# 1. Identificar migración
npx prisma migrate status

# 2. Restaurar backup
psql $DATABASE_URL < pre_migration_backup.sql

# 3. Marcar migración como no aplicada (si necesario)
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### 10.3 Rollback de Contratos

**IMPORTANTE:** Los smart contracts NO se pueden rollback. Opciones:

1. **Pausar** el contrato dañado
2. **Deploy** nueva versión
3. **Migrar** usuarios al nuevo contrato
4. **Actualizar** direcciones en app

---

## 11. Documentación de Cambios

### Template de Cambio

```markdown
## Cambio: [Título]

**Fecha:** YYYY-MM-DD
**Autor:** @username
**Tipo:** Deploy / Config / Emergencia

### Descripción
[Qué se cambió y por qué]

### Pasos Realizados
1. ...
2. ...

### Verificación
- [ ] Health check OK
- [ ] Tests pasando
- [ ] Sin errores en logs

### Rollback Plan
[Cómo revertir si falla]
```

---

## Checklist de Operaciones

### Deploy

- [ ] Backup de base de datos
- [ ] Tests pasando
- [ ] Build exitoso
- [ ] Migraciones ejecutadas
- [ ] Health check OK
- [ ] Funcionalidad crítica verificada

### Emergencia

- [ ] Evaluar impacto
- [ ] Notificar equipo
- [ ] Pausar contratos si necesario
- [ ] Activar modo mantenimiento si necesario
- [ ] Documentar timeline
- [ ] Comunicar a usuarios (si aplica)
- [ ] Resolver problema
- [ ] Verificar solución
- [ ] Post-mortem
