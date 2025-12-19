import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from "@mui/material";

const QuenMatKhau = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleReset = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Hướng dẫn reset đã gửi vào email của bạn!");
            setError("");
        } catch (err) {
            setError("Không tìm thấy email hoặc lỗi: " + err.message);
            setMessage("");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #ffffff 0%, #f5f0eb 100%)", display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
            <Card sx={{ width: 400, borderRadius: 3, boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom sx={{ color: "#8B0000" }}>
                        Quên Mật Khẩu
                    </Typography>

                    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleReset}>
                        <TextField label="Email" variant="outlined" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 3 }} />
                        <Button type="submit" variant="contained" fullWidth sx={{ backgroundColor: "#8B0000", "&:hover": { backgroundColor: "#A52A2A" }, py: 1.5, borderRadius: 2 }}>
                            Gửi Email Reset
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default QuenMatKhau;
