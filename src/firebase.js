// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTGZ3boOBKagm2EFl9ExWJJV0hcsdetAI",
  authDomain: "sidequest-travel.firebaseapp.com",
  projectId: "sidequest-travel",
  storageBucket: "sidequest-travel.firebasestorage.app",
  messagingSenderId: "776658055339",
  appId: "1:776658055339:web:8451a268707116a221c7ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
