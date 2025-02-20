// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, getDocs} from "firebase/firestore";

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyDC1BmxyV479VOEBQFsQGyGmMzLCaTux1U",
    authDomain: "pay-your-friend.firebaseapp.com",
    projectId: "pay-your-friend",
    storageBucket: "pay-your-friend.firebasestorage.app",
    messagingSenderId: "546969495183",
    appId: "1:546969495183:web:282d63fefda4c9e196b2fa",
    measurementId: "G-P54LTLDQTK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);


export { auth, provider, signInWithPopup, signOut, db, doc, getDoc, collection, addDoc, updateDoc, getDocs };

