import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../services/firebase";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    Alert,
} from "@mui/material";

const DangNhap = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    // Hàm phân quyền và redirect
    const redirectByRole = async (userId) => {
        try {
            const userRef = ref(db, `Users/${userId}`);
            const snapshot = await get(userRef);

            let role = "User"; // mặc định User
            if (snapshot.exists()) {
                const userData = snapshot.val();
                role = userData.Role || "User";
            }

            // lưu role vào localStorage
            localStorage.setItem("userRole", role);
            localStorage.setItem("userId", userId);

            // redirect dựa trên role
            if (role === "Admin" || role === "Editor") {
                navigate("/"); // Admin hoặc Editor
            } else {
                navigate("/user"); // User thường
            }
        } catch (err) {
            console.error("Lỗi khi phân quyền:", err);
            navigate("/user"); // fallback
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // đăng nhập
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // lấy role từ Realtime Database
            const userRef = ref(db, `Users/${user.uid}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const role = userData.Role || "User";

                // lưu vào localStorage để dùng lại
                localStorage.setItem("userRole", role);
                localStorage.setItem("userId", user.uid);
            } else {
                // nếu chưa có trong DB → mặc định User
                localStorage.setItem("userRole", "User");
                localStorage.setItem("userId", user.uid);
            }
            redirectByRole(user.uid);
            //navigate("/"); // đăng nhập thành công → trang chủ
        } catch (err) {
            console.error(err);
            setError("Email hoặc mật khẩu không đúng!");
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #ffffff 0%, #f5f0eb 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
            }}
        >
            <Card sx={{ width: 400, borderRadius: 3, boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom sx={{ color: "#8B0000" }}>
                        Đăng Nhập
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            label="Email"
                            variant="outlined"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            label="Mật khẩu"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        <Button type="submit" variant="contained" fullWidth
                            sx={{ backgroundColor: "#8B0000", "&:hover": { backgroundColor: "#A52A2A" }, py: 1.5, borderRadius: 2 }}>
                            Đăng Nhập
                        </Button>
                    </form>

                    <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: "#5D4037" }}>
                        Bạn chưa có tài khoản?{" "}
                        <span style={{ color: "#8B0000", cursor: "pointer", fontWeight: "bold" }} onClick={() => navigate("/dang-ky")}>
                            Đăng ký
                        </span>
                    </Typography>
                    <Typography variant="body2" textAlign="center" sx={{ mt: 1, color: "#5D4037", cursor: "pointer" }} onClick={() => navigate("/quen-mat-khau")}>
                        Quên mật khẩu?
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default DangNhap;
