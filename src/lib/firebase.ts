import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRqj5PUvyhb-vpz1rnti9XzBvGErFbo-g",
  authDomain: "gen-lang-client-0900880922.firebaseapp.com",
  projectId: "gen-lang-client-0900880922",
  storageBucket: "gen-lang-client-0900880922.firebasestorage.app",
  messagingSenderId: "1008921248437",
  appId: "1:1008921248437:web:f50d8fe9053c9a038d34fc"
};

const app = initializeApp(firebaseConfig);

// Connect to the specific database instance provided in firebase-applet-config.json
export const db = getFirestore(app, "ai-studio-fb706a6b-14c1-4a6d-a7fd-b9bca85c2a3a");
