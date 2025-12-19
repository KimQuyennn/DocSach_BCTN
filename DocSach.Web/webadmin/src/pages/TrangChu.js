import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../services/firebase";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    //CardMedia,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";

export default function TrangChu() {
    const [sach, setSach] = useState([]);
    const [genres, setGenres] = useState([]);
    const [search, setSearch] = useState("");
    const [filterGenre, setFilterGenre] = useState("");

    // Lấy sách từ Firebase
    useEffect(() => {
        const booksRef = ref(db, "Books");
        const unsub = onValue(booksRef, (snap) => {
            const data = snap.val();
            if (!data) {
                setSach([]);
                return;
            }
            const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
            setSach(list);
        });
        return () => unsub();
    }, []);

    // Lấy thể loại từ Firebase
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

    // Lọc sách theo tìm kiếm + thể loại
    const filteredBooks = sach.filter((book) => {
        const matchSearch =
            book.Title?.toLowerCase().includes(search.toLowerCase());
        const matchGenre = filterGenre ? book.GenreId === filterGenre : true;
        return matchSearch && matchGenre;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#5D4037" }}
            >
                📚 Danh sách sách
            </Typography>

            {/* Tìm kiếm + lọc */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                    label="Tìm kiếm sách"
                    variant="outlined"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1 }}
                />
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Thể loại</InputLabel>
                    <Select
                        value={filterGenre}
                        label="Thể loại"
                        onChange={(e) => setFilterGenre(e.target.value)}
                    >
                        <MenuItem value="">Tất cả</MenuItem>
                        {genres.map((g) => (
                            <MenuItem key={g.id} value={g.Id}>
                                {g.Name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Danh sách sách */}
            {filteredBooks.length === 0 && <Typography>Không có sách phù hợp.</Typography>}

            <Grid container spacing={3}>
                {filteredBooks.map((b) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={b.id}>
                        <Card
                            sx={{
                                height: 380,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                borderRadius: 3,
                                boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                                transition: "0.3s",
                                "&:hover": { transform: "scale(1.03)" },
                                p: 2,
                            }}
                        >
                            {b.CoverImage && (
                                <Box
                                    sx={{
                                        width: 160,        // ✅ ép ảnh về cùng khung
                                        height: 220,       // ✅ ép ảnh về cùng khung
                                        overflow: "hidden",
                                        borderRadius: 2,
                                        mb: 2,
                                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                                    }}
                                >
                                    <img
                                        src={b.CoverImage}
                                        alt={b.Title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover", // ✅ luôn lấp đầy khung
                                        }}
                                    />
                                </Box>
                            )}
                            <CardContent sx={{ textAlign: "center" }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: "bold",
                                        mb: 1,
                                        color: "#8B0000",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        maxWidth: 160,
                                    }}
                                >
                                    {b.Title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {b.Author}
                                </Typography>
                            </CardContent>
                        </Card>

                    </Grid>
                ))}
            </Grid>

        </Box>
    );
}
