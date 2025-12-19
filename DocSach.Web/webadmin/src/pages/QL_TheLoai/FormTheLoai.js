import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    CircularProgress,
} from "@mui/material";
import { ref, set, push, update } from "firebase/database";
import { db } from "../../services/firebase";

const FormTheLoai = ({ open, onClose, genre, genres }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    // Khi mở form → set dữ liệu cũ
    useEffect(() => {
        if (genre) {
            setName(genre.Name || "");
        } else {
            setName("");
        }
    }, [genre]);

    // Lưu thể loại
    const handleSave = async () => {
        if (!name.trim()) {
            alert("Tên thể loại không được để trống!");
            return;
        }

        // Kiểm tra trùng
        const isDuplicate = genres.some(
            (g) =>
                g.Name.toLowerCase().trim() === name.toLowerCase().trim() &&
                g.id !== genre?.id
        );
        if (isDuplicate) {
            alert("Tên thể loại đã tồn tại!");
            return;
        }

        setLoading(true);
        try {
            if (genre) {
                // === Cập nhật thể loại ===
                const genreRef = ref(db, `Genres/${genre.id}`);
                await update(genreRef, {
                    Name: name,
                    UpdatedAt: new Date().toISOString(),
                });
                alert("Cập nhật thể loại thành công!");
            } else {
                // === Thêm mới ===
                const newGenreRef = push(ref(db, "Genres"));
                const newGenreId = newGenreRef.key;
                const newGenre = {
                    Id: newGenreId,
                    Name: name,
                    CreatedAt: new Date().toISOString(),
                    UpdatedAt: new Date().toISOString(),
                };
                await set(newGenreRef, newGenre);
                alert("Thêm thể loại thành công!");
            }
            onClose();
        } catch (err) {
            alert("Lỗi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{genre ? "Sửa thể loại" : "Thêm thể loại"}</DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <TextField
                    label="Tên thể loại"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Button
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    onClick={handleSave}
                    sx={{
                        backgroundColor: "#8B0000",
                        "&:hover": { backgroundColor: "#A52A2A" },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                        "Lưu"
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default FormTheLoai;
