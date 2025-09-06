// Import the functions you need from the SDKs you need

//import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyf-WOaoUfXf1HYWE8lUxniwpgiAvr7f0",
  authDomain: "pyramid-poker-online.firebaseapp.com",
  databaseURL: "https://pyramid-poker-online-default-rtdb.firebaseio.com/",  // ADD THIS
  projectId: "pyramid-poker-online",
  storageBucket: "pyramid-poker-online.firebasestorage.app",
  messagingSenderId: "1062213831120",
  appId: "1:1062213831120:web:f39c0984d84f54943f51d5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export for use in other files
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

console.log('🔥 Firebase initialized successfully');