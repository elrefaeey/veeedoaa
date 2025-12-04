
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbQEG_4SQJi_b_TSXt6tyid4b31hft0yg",
  authDomain: "clothes-59c64.firebaseapp.com",
  projectId: "clothes-59c64",
  storageBucket: "clothes-59c64.firebasestorage.app",
  messagingSenderId: "785303780118",
  appId: "1:785303780118:web:6e081f733ab2c7866a6e37",
  measurementId: "G-86CNC4GERN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
