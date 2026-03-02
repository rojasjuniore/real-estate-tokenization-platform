# Admin Panel - Quick Start Guide

## Setup (5 minutes)

### 1. Configure Admin Access

Edit your `.env` file:

```bash
# Add your admin wallet addresses (comma-separated)
ADMIN_WALLET_ADDRESSES=0x742d35Cc6634C0532925a3b844Bc9e7595f12345
NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES=0x742d35Cc6634C0532925a3b844Bc9e7595f12345
```

### 2. Ensure Database is Ready

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (if not already done)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Access Admin Panel

1. Open http://localhost:3000
2. Click "Conectar Wallet"
3. Connect with your admin wallet
4. Click "Admin" in the header
5. You're in!

## Common Tasks

### Create Your First Property

```
1. Navigate to /admin/properties
2. Click "Nueva Propiedad"
3. Step 1: Enter property details
   - Name: "Torre Luxury Manhattan"
   - Description: "Premium 40-story building"
   - Location: "New York, NY"
   - Type: Residencial
4. Step 2: Configure tokens
   - Total fractions: 10000
   - Price per token: $150
   - ROI: 12%
5. Step 3: Review and click "Crear Propiedad"
6. Property created in DRAFT status
7. Edit the property and change status to ACTIVE
```

### Approve a KYC Submission

```
1. Navigate to /admin/kyc
2. Click "Revisar" on a pending submission
3. Review user info and documents
4. Add notes: "Documents verified. Identity confirmed."
5. Click "Aprobar"
6. User can now invest
```

### Distribute Dividends

```
1. Navigate to /admin/dividends
2. Click "Nueva Distribución"
3. Select property from dropdown
4. Enter amount: 5000 (USD)
5. Select payment token: USDT
6. Enter period: "December 2024"
7. Review auto-calculated per-token amount
8. Click "Crear Distribución"
9. Claims created for all token holders
```

### Update System Settings

```
1. Navigate to /admin/settings
2. Change marketplace commission: 2.5%
3. Enable/disable payment tokens
4. Update treasury wallet address
5. Click "Guardar Cambios"
```

## Routes Reference

| URL | Description |
|-----|-------------|
| `/admin` | Dashboard with metrics |
| `/admin/properties` | List all properties |
| `/admin/properties/new` | Create new property |
| `/admin/properties/[id]` | Edit property |
| `/admin/users` | List all users |
| `/admin/kyc` | Review KYC submissions |
| `/admin/kyc/[id]` | Review specific KYC |
| `/admin/dividends` | Manage dividends |
| `/admin/settings` | System configuration |

## API Endpoints

| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/admin/dashboard` | Admin |
| GET | `/api/admin/kyc` | Admin |
| GET/PUT | `/api/admin/kyc/[id]` | Admin |
| GET/PUT | `/api/admin/settings` | Admin |
| GET/POST | `/api/admin/dividends` | Admin |
| GET | `/api/users` | Admin |

## Troubleshooting

### "Cannot access /admin" - Redirected to dashboard

**Solution:** Your wallet is not in `NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES`

```bash
# Check your .env file
cat .env | grep ADMIN

# Make sure your wallet address is there (lowercase comparison)
NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES=0xYourWalletAddress
```

### API returns 403 Forbidden

**Solution:** Check server-side env var

```bash
# Verify ADMIN_WALLET_ADDRESSES (without NEXT_PUBLIC prefix)
ADMIN_WALLET_ADDRESSES=0xYourWalletAddress
```

### Dashboard shows no data

**Solution:** Database needs to be seeded

```bash
# Check if properties exist
npx prisma studio

# Or use Prisma client
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.property.count().then(console.log);"
```

### Cannot create property - validation error

**Solution:** All required fields must be filled

Required fields:
- name
- description
- location
- propertyType
- totalFractions
- pricePerFraction
- estimatedROI
- metadataUri (auto-generated in form)

## Testing Checklist

- [ ] Admin can access dashboard
- [ ] Non-admin redirected to /dashboard
- [ ] Create property wizard works
- [ ] Edit property updates database
- [ ] KYC list shows pending submissions
- [ ] KYC approval updates user status
- [ ] Dividend distribution creates claims
- [ ] Settings update persists
- [ ] Users list displays correctly
- [ ] All loading states work
- [ ] Error messages display properly

## Security Notes

1. **Never commit .env with real admin addresses**
2. **Use environment-specific admin wallets**
3. **Test admin access control before deploying**
4. **Monitor admin actions in production**
5. **Rotate admin wallets periodically**

## Performance Tips

1. **Database Indexes:** Ensure proper indexes on frequently queried fields
2. **Pagination:** For large datasets, implement pagination (TODO)
3. **Caching:** Consider Redis for dashboard metrics
4. **Query Optimization:** Use Prisma's `select` to fetch only needed fields

## Next Steps After Setup

1. Create 2-3 test properties
2. Test KYC approval flow
3. Create a test dividend distribution
4. Verify all metrics update correctly
5. Test mobile responsiveness
6. Review error handling
7. Add monitoring/logging
8. Document your admin procedures

## Support

For issues or questions:
1. Check `/docs/ADMIN_PANEL.md` for detailed documentation
2. Review `ADMIN_PANEL_SUMMARY.md` for implementation details
3. Check Prisma schema in `/prisma/schema.prisma`
4. Review API routes in `/src/app/api/admin/`

---

**Quick Start Guide** | BuidingTok Admin Panel v1.0
