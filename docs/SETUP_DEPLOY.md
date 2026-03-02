# Guía de Setup y Deploy - TokenByU

## Requisitos Previos

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
| Polygonscan | https://polygonscan.com | Verificación de contratos |

---

## 1. Setup Local

### 1.1 Clonar Repositorio

```bash
git clone https://github.com/your-org/tokenbyu.git
cd tokenbyu
```

### 1.2 Instalar Dependencias

```bash
npm install
# o
yarn install
```

### 1.3 Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```bash
# ============== APP ==============
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=TokenByU

# ============== DATABASE ==============
DATABASE_URL=postgresql://user:password@localhost:5432/tokenbyu?schema=public

# ============== BLOCKCHAIN ==============
NEXT_PUBLIC_CHAIN_ID=80002  # Amoy testnet para desarrollo
NEXT_PUBLIC_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY

# ============== AUTH ==============
JWT_SECRET=genera-clave-de-min-32-caracteres-aqui
SESSION_SECRET=genera-otra-clave-de-min-32-caracteres

# ============== WEB3AUTH ==============
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=tu-client-id-de-web3auth

# Ver .env.example para todas las variables
```

### 1.4 Configurar Base de Datos

**Opción A: PostgreSQL Local**

```bash
# Crear base de datos
createdb tokenbyu

# Ejecutar migraciones
npx prisma migrate dev

# Sembrar datos iniciales (opcional)
npx prisma db seed
```

**Opción B: Docker**

```bash
# Levantar solo PostgreSQL
docker-compose up -d db

# Esperar a que esté listo
docker-compose logs -f db

# Ejecutar migraciones
npx prisma migrate dev
```

### 1.5 Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Aplicación disponible en: `http://localhost:3000`

---

## 2. Setup con Docker

### 2.1 Configurar Variables

```bash
cp .env.example .env
# Editar .env con valores de producción
```

### 2.2 Build y Run

```bash
# Build de la imagen
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### 2.3 Ejecutar Migraciones

```bash
docker-compose exec app npx prisma migrate deploy
```

### 2.4 Detener Servicios

```bash
docker-compose down

# Con eliminación de volúmenes (CUIDADO: borra datos)
docker-compose down -v
```

---

## 3. Variables de Entorno

### 3.1 Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXT_PUBLIC_CHAIN_ID` | ID de la red blockchain | `137` (Polygon) o `80002` (Amoy) |
| `NEXT_PUBLIC_RPC_URL` | URL del RPC | `https://polygon-mainnet.g.alchemy.com/v2/...` |
| `JWT_SECRET` | Clave para JWT (min 32 chars) | `tu-clave-super-secreta...` |
| `SESSION_SECRET` | Clave para sesiones | `otra-clave-super-secreta...` |
| `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` | Client ID de Web3Auth | `BK9...` |

### 3.2 Variables de Contratos

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS` | Dirección PropertyToken |
| `NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS` | Dirección Marketplace |
| `NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS` | Dirección RoyaltyDistributor |
| `NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS` | Dirección PaymentProcessor |

### 3.3 Variables de Servicios Externos

| Variable | Descripción |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Nombre de cloud Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `PINATA_API_KEY` | API Key de Pinata |
| `PINATA_SECRET_KEY` | Secret Key de Pinata |
| `ALCHEMY_API_KEY` | API Key de Alchemy |

### 3.4 Variables de Admin

| Variable | Descripción |
|----------|-------------|
| `ADMIN_WALLET_ADDRESSES` | Wallets admin (separadas por coma) |
| `NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES` | Wallets admin (para frontend) |
| `TREASURY_WALLET_ADDRESS` | Wallet de tesorería |

---

## 4. Deploy de Smart Contracts

### 4.1 Configurar Hardhat

Verificar `hardhat.config.ts`:

```typescript
networks: {
  polygonAmoy: {
    url: process.env.POLYGON_AMOY_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 80002,
  },
  polygon: {
    url: process.env.POLYGON_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 137,
  },
}
```

### 4.2 Deploy a Testnet (Amoy)

```bash
# Deploy todos los contratos
npm run deploy:amoy

# O deploy individual
npx hardhat run scripts/deploy.ts --network polygonAmoy
```

**Output esperado:**
```
PropertyToken deployed to: 0x...
PropertyMarketplace deployed to: 0x...
RoyaltyDistributor deployed to: 0x...
PaymentProcessor deployed to: 0x...
```

### 4.3 Deploy a Mainnet (Polygon)

```bash
# IMPORTANTE: Verificar que tienes MATIC para gas
npm run deploy:polygon
```

### 4.4 Verificar Contratos

```bash
# Testnet
npm run verify:amoy

# Mainnet
npm run verify:polygon
```

### 4.5 Actualizar Variables

Después del deploy, actualizar `.env`:

```bash
NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=0x...direccion-del-deploy...
NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_ROYALTY_DISTRIBUTOR_ADDRESS=0x...
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=0x...
```

---

## 5. Deploy a Producción

### 5.1 Vercel (Recomendado)

**Paso 1: Conectar Repositorio**
1. Ve a https://vercel.com
2. Import project desde GitHub
3. Selecciona el repositorio

**Paso 2: Configurar Variables de Entorno**
1. En Settings > Environment Variables
2. Agregar todas las variables de `.env`
3. Marcar como "Production" las sensibles

**Paso 3: Configurar Build**
```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Paso 4: Deploy**
```bash
vercel --prod
```

### 5.2 Railway

**Paso 1: Crear Proyecto**
1. Ve a https://railway.app
2. New Project > Deploy from GitHub

**Paso 2: Agregar PostgreSQL**
1. Add Service > Database > PostgreSQL
2. Copiar `DATABASE_URL` a variables

**Paso 3: Configurar Variables**
1. Service > Variables
2. Agregar todas las variables de entorno

**Paso 4: Deploy**
Railway deploya automáticamente al hacer push.

### 5.3 Docker en VPS

```bash
# En el servidor
git clone https://github.com/your-org/tokenbyu.git
cd tokenbyu

# Configurar variables
cp .env.example .env
nano .env  # Editar con valores de producción

# Build y deploy
docker-compose -f docker-compose.yml up -d --build

# Configurar Nginx como reverse proxy
sudo nano /etc/nginx/sites-available/tokenbyu
```

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Configuración Post-Deploy

### 6.1 Verificar Salud

```bash
curl https://your-domain.com/api/health
# Esperado: {"status":"healthy","timestamp":"..."}
```

### 6.2 Configurar Admin Inicial

1. Conectar wallet admin
2. Verificar acceso a `/admin`
3. Configurar SystemConfig en Admin > Settings

### 6.3 Configurar Webhooks de Alchemy

1. Ve a Alchemy Dashboard > Webhooks
2. Crear webhook para eventos de contratos:
   - URL: `https://your-domain.com/api/webhooks/alchemy`
   - Events: Address Activity
   - Direcciones: Los 4 contratos

### 6.4 Configurar Web3Auth

1. Ve a Web3Auth Dashboard
2. Agregar dominio de producción en Allowed Origins
3. Configurar OAuth providers (Google, GitHub, etc.)

---

## 7. Comandos Útiles

### Desarrollo

```bash
# Servidor de desarrollo
npm run dev

# Tests
npm test
npm run test:watch
npm run test:coverage

# E2E Tests
npm run test:e2e
npm run test:e2e:ui

# Linting
npm run lint
```

### Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones (producción)
npx prisma migrate deploy

# Reset base de datos (CUIDADO)
npx prisma migrate reset

# Abrir Prisma Studio
npx prisma studio
```

### Smart Contracts

```bash
# Compilar contratos
npx hardhat compile

# Tests de contratos
npx hardhat test

# Deploy
npm run deploy:amoy
npm run deploy:polygon

# Verificar
npm run verify:amoy
npm run verify:polygon

# Deploy faucet (solo testnet)
npm run deploy:faucet:amoy
```

### Docker

```bash
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Logs
docker-compose logs -f app

# Shell en contenedor
docker-compose exec app sh

# Detener
docker-compose down
```

---

## 8. Troubleshooting

### Error: "Database connection failed"

```bash
# Verificar PostgreSQL corriendo
docker-compose ps db

# Verificar DATABASE_URL
echo $DATABASE_URL

# Test de conexión
npx prisma db push
```

### Error: "Contract deployment failed"

```bash
# Verificar balance de MATIC
npx hardhat run scripts/check-balance.ts --network polygonAmoy

# Verificar RPC
curl -X POST $POLYGON_AMOY_RPC_URL -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Error: "Web3Auth initialization failed"

1. Verificar `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`
2. Verificar dominio en Web3Auth Dashboard
3. Limpiar cache del navegador

### Error: "Admin access denied"

1. Verificar wallet tiene ADMIN_ROLE en contrato
2. Verificar `ADMIN_WALLET_ADDRESSES` incluye tu wallet
3. Esperar 60s (cache de admin)

---

## 9. Checklist de Deploy

### Pre-Deploy

- [ ] Todas las variables de entorno configuradas
- [ ] Contratos desplegados y verificados
- [ ] Base de datos migrada
- [ ] Tests pasando
- [ ] Build exitoso localmente

### Post-Deploy

- [ ] `/api/health` responde OK
- [ ] Login con Web3Auth funciona
- [ ] Admin puede acceder a `/admin`
- [ ] Webhooks de Alchemy configurados
- [ ] SSL/HTTPS configurado
- [ ] Monitoring configurado

### Mainnet Checklist Adicional

- [ ] Auditoría de contratos completada
- [ ] Backup de base de datos configurado
- [ ] Rate limiting habilitado
- [ ] Logging y alertas configuradas
- [ ] Documentación actualizada
