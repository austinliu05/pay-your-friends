// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, getDocs, deleteDoc} from "firebase/firestore";

// Your Firebase config (replace with your actual config)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Auth persistence set to localStorage"))
    .catch((error) => console.error("Error setting persistence:", error));
const provider = new GoogleAuthProvider();
const db = getFirestore(app);


export { auth, provider, signInWithPopup, signOut, db, doc, getDoc, collection, addDoc, updateDoc, getDocs, deleteDoc, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword};

