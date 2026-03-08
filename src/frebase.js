// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCz4997ZuPpvyaFee37fFeUn9SUE8QG7hQ",
  authDomain: "sistema-prestamos-43b76.firebaseapp.com",
  projectId: "sistema-prestamos-43b76",
  storageBucket: "sistema-prestamos-43b76.firebasestorage.app",
  messagingSenderId: "530325274830",
  appId: "1:530325274830:web:b94b09a171916b2722509f",
  measurementId: "G-QYDXDNKL3B",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
