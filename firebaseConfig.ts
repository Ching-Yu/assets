
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * 🔥 Firebase 設定已更新
 * 專案 ID: wealthfolio-a91ad
 */

const firebaseConfig = {
  apiKey: "AIzaSyC1FddMiuzMiZ3FcfAIDkOXdJEOG1C_QgE",
  authDomain: "wealthfolio-a91ad.firebaseapp.com",
  projectId: "wealthfolio-a91ad",
  storageBucket: "wealthfolio-a91ad.firebasestorage.app",
  messagingSenderId: "503909843044",
  appId: "1:503909843044:web:998109191562780dbe9f71",
  measurementId: "G-R6L0PLRK6R"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
