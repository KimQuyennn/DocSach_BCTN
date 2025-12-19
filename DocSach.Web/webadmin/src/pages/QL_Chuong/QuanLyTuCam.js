import React, { useEffect, useState } from "react";
import { ref, onValue, push, remove } from "firebase/database";
import { db } from "../../services/firebase";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    List,
    ListItem,
    IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const QuanLyTuCam = () => {
    const [words, setWords] = useState([]);
    const [newWord, setNewWord] = useState("");

    // 🔹 Load danh sách từ nhạy cảm
    useEffect(() => {
        const wordsRef = ref(db, "SensitiveWords");
        onValue(wordsRef, (snap) => {
            const data = snap.val() || {};
            const list = Object.entries(data).map(([id, word]) => ({
                id,
                word,
            }));
            setWords(list);
        });
    }, []);

    // 🔹 Thêm từ mới
    const handleAddWord = async () => {
        if (!newWord.trim()) return;
        const wordsRef = ref(db, "SensitiveWords");
        await push(wordsRef, newWord.trim().toLowerCase());
        setNewWord("");
    };

    // 🔹 Xoá từ
    const handleDeleteWord = async (id) => {
        const wordRef = ref(db, `SensitiveWords/${id}`);
        await remove(wordRef);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#8B0000" }}>
                🚫 Quản lý từ nhạy cảm
            </Typography>

            {/* Ô nhập thêm từ */}
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                    label="Nhập từ nhạy cảm"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    size="small"
                />
                <Button variant="contained" color="error" onClick={handleAddWord}>
                    ➕ Thêm
                </Button>
            </Box>

            {/* Danh sách từ */}
            <Card>
                <CardContent>
                    <List>
                        {words.map((w) => (
                            <ListItem
                                key={w.id}
                                secondaryAction={
                                    <IconButton edge="end" onClick={() => handleDeleteWord(w.id)}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                }
                            >
                                <Typography>{w.word}</Typography>
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default QuanLyTuCam;
