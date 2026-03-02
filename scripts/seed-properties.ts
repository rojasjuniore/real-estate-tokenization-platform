import { ethers } from "hardhat";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROPERTY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS!;
const TREASURY_WALLET = process.env.TREASURY_WALLET_ADDRESS!;

const PROPERTIES = [
  {
    tokenId: 1,
    name: "Torre Ejecutiva Bogotá",
    description: "Edificio de oficinas premium de 20 pisos en el corazón financiero de Bogotá. Ubicación estratégica en la Zona T con acceso a transporte público y zonas comerciales. Certificación LEED Gold.",
    location: "Carrera 11 #82-71, Bogotá, Colombia",
    propertyType: "COMMERCIAL" as const,
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"
    ],
    totalFractions: 10000,
    pricePerFraction: 50.00, // USD
    estimatedROI: 8.5,
    royaltyFee: 250, // 2.5%
  },
  {
    tokenId: 2,
    name: "Residencial Marina del Sol",
    description: "Complejo residencial de lujo frente al mar en Cartagena. 45 apartamentos con vista al océano, piscina infinity, gimnasio y acceso privado a la playa. Ideal para renta vacacional.",
    location: "Bocagrande, Cartagena de Indias, Colombia",
    propertyType: "RESIDENTIAL" as const,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
    ],
    totalFractions: 5000,
    pricePerFraction: 120.00, // USD
    estimatedROI: 12.3,
    royaltyFee: 300, // 3%
  },
  {
    tokenId: 3,
    name: "Centro Logístico Zona Franca",
    description: "Bodega industrial de 15,000 m² en zona franca con beneficios tributarios. Incluye muelles de carga, oficinas administrativas y sistema de seguridad 24/7. Contrato de arrendamiento con empresa multinacional.",
    location: "Zona Franca de Bogotá, Fontibón, Colombia",
    propertyType: "INDUSTRIAL" as const,
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800",
      "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=800"
    ],
    totalFractions: 8000,
    pricePerFraction: 75.00, // USD
    estimatedROI: 10.8,
    royaltyFee: 200, // 2%
  }
];

async function main() {
  console.log("=== Creando propiedades reales en blockchain y base de datos ===\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MATIC\n");

  // Get contract
  const PropertyToken = await ethers.getContractAt("PropertyToken", PROPERTY_TOKEN_ADDRESS);
  console.log("PropertyToken:", PROPERTY_TOKEN_ADDRESS);

  // Create SystemConfig if not exists
  await prisma.systemConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      marketplaceCommission: 2.5,
      defaultFractions: 10000,
      minInvestment: 1,
      treasuryWallet: TREASURY_WALLET,
      acceptedTokens: ["MATIC", "USDT", "USDC"],
    },
  });
  console.log("SystemConfig created\n");

  for (const prop of PROPERTIES) {
    console.log(`\n--- Creando: ${prop.name} (Token ID: ${prop.tokenId}) ---`);

    // Check if property already exists on blockchain
    try {
      const existingProp = await PropertyToken.getProperty(prop.tokenId);
      if (existingProp.exists) {
        console.log(`  Token ID ${prop.tokenId} ya existe en blockchain, saltando...`);

        // Still create in database if not exists
        const dbProp = await prisma.property.findUnique({
          where: { tokenId: prop.tokenId },
        });

        if (!dbProp) {
          await prisma.property.create({
            data: {
              tokenId: prop.tokenId,
              name: prop.name,
              description: prop.description,
              location: prop.location,
              propertyType: prop.propertyType,
              images: prop.images,
              metadataUri: `ipfs://property-${prop.tokenId}`,
              totalFractions: prop.totalFractions,
              availableFractions: prop.totalFractions,
              pricePerFraction: prop.pricePerFraction,
              estimatedROI: prop.estimatedROI,
              status: "ACTIVE",
            },
          });
          console.log(`  Creado en base de datos`);
        }
        continue;
      }
    } catch {
      // Property doesn't exist, continue creating
    }

    // Create on blockchain
    console.log(`  Creando en blockchain...`);
    const metadataUri = `ipfs://property-${prop.tokenId}`;

    const tx = await PropertyToken.createProperty(
      prop.tokenId,
      prop.totalFractions,
      metadataUri,
      prop.royaltyFee
    );
    console.log(`  TX: ${tx.hash}`);
    await tx.wait();
    console.log(`  Confirmado en blockchain`);

    // Create in database
    await prisma.property.upsert({
      where: { tokenId: prop.tokenId },
      update: {
        name: prop.name,
        description: prop.description,
        location: prop.location,
        propertyType: prop.propertyType,
        images: prop.images,
        metadataUri: metadataUri,
        totalFractions: prop.totalFractions,
        availableFractions: prop.totalFractions,
        pricePerFraction: prop.pricePerFraction,
        estimatedROI: prop.estimatedROI,
        status: "ACTIVE",
      },
      create: {
        tokenId: prop.tokenId,
        name: prop.name,
        description: prop.description,
        location: prop.location,
        propertyType: prop.propertyType,
        images: prop.images,
        metadataUri: metadataUri,
        totalFractions: prop.totalFractions,
        availableFractions: prop.totalFractions,
        pricePerFraction: prop.pricePerFraction,
        estimatedROI: prop.estimatedROI,
        status: "ACTIVE",
      },
    });
    console.log(`  Creado en base de datos`);
  }

  // Verify
  console.log("\n=== Verificación ===\n");

  const properties = await prisma.property.findMany();
  console.log(`Propiedades en DB: ${properties.length}`);

  for (const p of properties) {
    const onChain = await PropertyToken.getProperty(p.tokenId);
    const supply = await PropertyToken.totalSupply(p.tokenId);
    console.log(`  - ${p.name}: ${supply.toString()} fracciones en blockchain`);
  }

  await prisma.$disconnect();
  console.log("\n=== Completado ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });
