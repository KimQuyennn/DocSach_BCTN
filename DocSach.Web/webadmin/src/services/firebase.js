// /src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// 🔹 cấu hình Firebase của bạn
const firebaseConfig = {
    apiKey: "AIzaSyD-ondrnAGBWyEvwpX0t8HXOn4VBew1MyI",
    authDomain: "docsach-2e95b.firebaseapp.com",
    databaseURL: "https://docsach-2e95b-default-rtdb.firebaseio.com",
    projectId: "docsach-2e95b",
    storageBucket: "docsach-2e95b.firebasestorage.app",
    messagingSenderId: "422980361238",
    appId: "1:422980361238:web:d80db6baee57bb0068a937",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Các service cần dùng
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
