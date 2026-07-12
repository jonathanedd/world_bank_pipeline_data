const crypto = require('crypto');
const fs = require('fs');

console.log('⏳ Generando par de llaves criptográficas para Snowflake...');

// Generar el par de llaves en memoria
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Guardar los archivos exactamente con los nombres que Snowflake y Render necesitan
fs.writeFileSync('snowflake_key.p8', privateKey);
fs.writeFileSync('snowflake_key.pub', publicKey);

console.log('✅ ¡Archivos creados con éxito!');
console.log('- Llave privada guardada en: snowflake_key.p8');
console.log('- Llave pública guardada en: snowflake_key.pub');
