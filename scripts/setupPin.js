// Script para generar el hash del PIN y guardarlo en Firestore
// Uso: node scripts/setupPin.js <PIN>
// Ejemplo: node scripts/setupPin.js 123456

import bcrypt from 'bcryptjs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD9yCqA_rH0A1E-QZ4-XvGg5j8xR8k2V4M",
  authDomain: "nutricount-194d6.firebaseapp.com",
  projectId: "nutricount-194d6",
  storageBucket: "nutricount-194d6.appspot.com",
  messagingSenderId: "647370076783",
  appId: "1:647370076783:web:5e8e5a1f8e2f4c5a6b7c8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener PIN del argumento
const PIN = process.argv[2];

if (!PIN || PIN.length < 6 || PIN.length > 8 || !/^\d+$/.test(PIN)) {
  console.error('❌ Error: Proporciona un PIN válido de 6-8 dígitos');
  console.error('Uso: node scripts/setupPin.js <PIN>');
  console.error('Ejemplo: node scripts/setupPin.js 123456');
  process.exit(1);
}

const setupPin = async () => {
  try {
    const hashedPin = await bcrypt.hash(PIN, 10);
    
    await setDoc(doc(db, 'config', 'pin'), {
      hash: hashedPin,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ PIN hashado y guardado en Firestore correctamente');
    console.log(`📌 PIN usado: ${PIN}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

setupPin();
