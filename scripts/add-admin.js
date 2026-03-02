/**
 * Script para agregar una nueva wallet como admin en los smart contracts
 *
 * Uso: node scripts/add-admin.js
 *
 * Requiere que la wallet en ADMIN_PRIVATE_KEY sea admin actual de los contratos
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Configuración
const NEW_ADMIN_ADDRESS = '0x69e4a81385f54bff8a212e06d8a918f3c9c28a8b';
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));

// Contratos en Polygon Mainnet
const CONTRACTS = [
  {
    name: 'PropertyToken',
    address: process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS,
  },
  {
    name: 'PropertyMarketplace',
    address: process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE_ADDRESS,
  },
];

// ABI mínimo para grantRole
const ACCESS_CONTROL_ABI = [
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
];

async function main() {
  console.log('='.repeat(60));
  console.log('Agregar Admin a Smart Contracts');
  console.log('='.repeat(60));
  console.log(`\nNuevo Admin: ${NEW_ADMIN_ADDRESS}`);
  console.log(`ADMIN_ROLE: ${ADMIN_ROLE}\n`);

  // Verificar que tenemos la private key
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    console.error('ERROR: ADMIN_PRIVATE_KEY no está configurada en .env');
    console.log('\nAgrega esta línea a tu .env:');
    console.log('ADMIN_PRIVATE_KEY=tu_private_key_aqui');
    process.exit(1);
  }

  // Conectar a Polygon Mainnet
  const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Wallet ejecutando: ${wallet.address}`);

  // Verificar balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance MATIC: ${ethers.formatEther(balance)}\n`);

  if (balance < ethers.parseEther('0.01')) {
    console.error('ERROR: Balance insuficiente. Necesitas al menos 0.01 MATIC para gas.');
    process.exit(1);
  }

  // Procesar cada contrato
  for (const contractInfo of CONTRACTS) {
    console.log('-'.repeat(60));
    console.log(`Procesando: ${contractInfo.name}`);
    console.log(`Dirección: ${contractInfo.address}`);

    if (!contractInfo.address) {
      console.log('SKIP: Dirección no configurada\n');
      continue;
    }

    try {
      const contract = new ethers.Contract(
        contractInfo.address,
        ACCESS_CONTROL_ABI,
        wallet
      );

      // Verificar si ya tiene el rol
      const hasRole = await contract.hasRole(ADMIN_ROLE, NEW_ADMIN_ADDRESS);
      if (hasRole) {
        console.log('✓ Ya tiene ADMIN_ROLE, saltando...\n');
        continue;
      }

      // Verificar que el ejecutor tiene DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();
      const executorHasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, wallet.address);

      if (!executorHasAdminRole) {
        console.log('ERROR: Tu wallet no tiene DEFAULT_ADMIN_ROLE en este contrato\n');
        continue;
      }

      // Ejecutar grantRole
      console.log('Ejecutando grantRole...');
      const tx = await contract.grantRole(ADMIN_ROLE, NEW_ADMIN_ADDRESS);
      console.log(`TX Hash: ${tx.hash}`);

      console.log('Esperando confirmación...');
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log(`✓ ADMIN_ROLE otorgado exitosamente!`);
        console.log(`  Gas usado: ${receipt.gasUsed.toString()}`);
        console.log(`  Block: ${receipt.blockNumber}\n`);
      } else {
        console.log('✗ Transacción fallida\n');
      }

    } catch (error) {
      console.error(`Error: ${error.message}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('Proceso completado');
  console.log('='.repeat(60));
}

main().catch(console.error);
