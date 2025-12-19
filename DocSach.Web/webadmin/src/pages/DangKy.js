import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";

const DangKy = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/dang-nhap");
        } catch (err) {
            setError("Đăng ký thất bại! " + err.message);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #ffffff 0%, #f5f0eb 100%)", display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
            <Card sx={{ width: 400, borderRadius: 3, boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom sx={{ color: "#8B0000" }}>
                        Đăng Ký
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleRegister}>
                        <TextField label="Email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
                        <TextField label="Mật khẩu" type="password" variant="outlined" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />
                        <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: "#8B0000", "&:hover": { backgroundColor: "#A52A2A" }, py: 1.5, borderRadius: 2 }}>
                            Đăng Ký
                        </Button>
                    </form>

                    <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: "#5D4037" }}>
                        Bạn đã có tài khoản?{" "}
                        <span style={{ color: "#8B0000", cursor: "pointer", fontWeight: "bold" }} onClick={() => navigate("/dang-nhap")}>
                            Đăng nhập
                        </span>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default DangKy;
