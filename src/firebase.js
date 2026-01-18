import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZJMoyVWb1doC5QZUBDbzTJ2gpT3BnqE4",
  authDomain: "nutricount-194d6.firebaseapp.com",
  projectId: "nutricount-194d6",
  storageBucket: "nutricount-194d6.firebasestorage.app",
  messagingSenderId: "818945672353",
  appId: "1:818945672353:web:4e63a8eba5fb08a5d89ce0",
  measurementId: "G-G4Q80084H2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
