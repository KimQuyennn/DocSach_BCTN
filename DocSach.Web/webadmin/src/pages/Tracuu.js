import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

export default function Tracuu() {
    const [question, setQuestion] = useState("");
    const [chatLog, setChatLog] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const userId = "OTgg6kguFHbUKBOR1MwKIiycElF2"; // userId admin hoặc lấy từ login

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatLog]);

    const handleSend = async () => {
        if (!question.trim()) return;

        const userMessage = { role: "admin", content: question, time: new Date().toLocaleTimeString() };
        setChatLog((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            const res = await axios.post("https://booknet-payments.onrender.com/ai-ask", {
                userId,
                question
            });

            const aiMessage = { role: "ai", content: res.data.answer, time: new Date().toLocaleTimeString() };
            setChatLog((prev) => [...prev, aiMessage]);
            setQuestion("");
        } catch (err) {
            console.error(err);
            alert("Lỗi khi gọi AI server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, margin: "0 auto", p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Chat AI Admin
            </Typography>

            <Paper sx={{ maxHeight: 400, overflowY: "auto", p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
                {chatLog.map((msg, idx) => (
                    <Box
                        key={idx}
                        sx={{
                            display: "flex",
                            justifyContent: msg.role === "admin" ? "flex-end" : "flex-start",
                            mb: 1,
                        }}
                    >
                        <Box sx={{ maxWidth: "70%" }}>
                            <Typography
                                component="span"
                                sx={{
                                    display: "inline-block",
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: msg.role === "admin" ? "#3B82F6" : "#E5E7EB",
                                    color: msg.role === "admin" ? "#fff" : "#000",
                                    boxShadow: 1,
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {msg.content}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, textAlign: msg.role === "admin" ? "right" : "left" }}>
                                {msg.role === "admin" ? "Bạn" : "AI"} • {msg.time}
                            </Typography>
                        </Box>
                    </Box>
                ))}
                <div ref={chatEndRef} />
            </Paper>

            <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi..."
                    disabled={loading}
                />
                <Button variant="contained" onClick={handleSend} disabled={loading}>
                    {loading ? "Đang gửi..." : "Gửi"}
                </Button>
            </Box>
        </Box>
    );
}
