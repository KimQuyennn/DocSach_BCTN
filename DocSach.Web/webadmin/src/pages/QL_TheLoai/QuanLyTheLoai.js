import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../../services/firebase";
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import FormTheLoai from "./FormTheLoai";

export default function QuanLyTheLoai() {
    const [genres, setGenres] = useState([]);
    const [openForm, setOpenForm] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState(null);

    // Lấy dữ liệu từ Firebase
    useEffect(() => {
        const genresRef = ref(db, "Genres");
        const unsub = onValue(genresRef, (snap) => {
            const data = snap.val();
            if (!data) {
                setGenres([]);
                return;
            }
            const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
            setGenres(list);
        });
        return () => unsub();
    }, []);

    // Xóa thể loại
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa thể loại này?")) {
            await remove(ref(db, `Genres/${id}`));
            alert("Đã xóa thể loại!");
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, color: "#8B0000" }}>
                📚 Quản lý thể loại
            </Typography>

            <Button
                variant="contained"
                sx={{ backgroundColor: "#8B0000", "&:hover": { backgroundColor: "#A52A2A" }, mb: 2 }}
                onClick={() => {
                    setSelectedGenre(null);
                    setOpenForm(true);
                }}
            >
                ➕ Thêm thể loại
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell><b>ID</b></TableCell>
                            <TableCell><b>Tên thể loại</b></TableCell>
                            <TableCell align="center"><b>Hành động</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {genres.map((g) => (
                            <TableRow key={g.id}>
                                <TableCell>{g.Id}</TableCell>
                                <TableCell>{g.Name}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        color="primary"
                                        onClick={() => {
                                            setSelectedGenre(g);
                                            setOpenForm(true);
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(g.id)}>
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {genres.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    Chưa có thể loại nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Form thêm / sửa */}
            <FormTheLoai
                open={openForm}
                onClose={() => setOpenForm(false)}
                genre={selectedGenre}
                genres={genres} // gửi toàn bộ list để check trùng
            />
        </Box>
    );
}
