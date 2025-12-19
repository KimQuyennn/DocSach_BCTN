// src/pages/DangTaiSachUser.js
import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
    MenuItem,
    CircularProgress,
    Alert,
} from "@mui/material";
import { ref, push, set, onValue } from "firebase/database";
import { db } from "../../services/firebase";

const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

const DangTaiSachUser = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [genreId, setGenreId] = useState("");
    const [genres, setGenres] = useState([]);
    const [coverFile, setCoverFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isVIP, setIsVIP] = useState(false);
    const [price, setPrice] = useState(0);

    // Load genres từ Firebase
    useEffect(() => {
        const genresRef = ref(db, "Genres");
        const unsubscribe = onValue(genresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedGenres = Object.keys(data).map((key) => ({
                    id: key,
                    Name: data[key].Name,
                }));
                setGenres(loadedGenres);
                if (loadedGenres.length > 0) setGenreId(loadedGenres[0].id);
            }
        });
        return () => unsubscribe();
    }, []);

    // Upload ảnh lên Cloudinary
    const uploadImageToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        const data = await response.json();
        if (data.secure_url) return data.secure_url;
        throw new Error("Lỗi upload ảnh");
    };

    // Upload sách
    const handleUpload = async () => {
        if (!title || !description || !genreId || !coverFile) {
            setError("⚠️ Vui lòng điền đầy đủ thông tin và chọn ảnh bìa");
            return;
        }

        if (isVIP && price <= 0) {
            setError("⚠️ Sách VIP phải có giá lớn hơn 0");
            return;
        }
        if (!isVIP) setPrice(0);

        setLoading(true);
        setError("");

        try {
            const coverUrl = await uploadImageToCloudinary(coverFile);
            const newBookRef = push(ref(db, "Books"));
            const now = new Date().toISOString();

            const newBookData = {
                Id: newBookRef.key,
                Title: title,
                Description: description,
                CoverImage: coverUrl,
                GenreId: genreId,

                // thông tin người đăng
                UploaderId: localStorage.getItem("userId"),
                UploaderRole: localStorage.getItem("userRole") || "User",
                UploaderName: localStorage.getItem("username") || "Ẩn danh",

                IsApproved: false,       // admin sẽ duyệt
                Status: "Chưa duyệt",
                IsVIP: isVIP,
                Price: isVIP ? price : 0,
                CreatedAt: now,
                UpdatedAt: now,
                PublishedDate: now,
                Chapters: [],            // có thể thêm sau
            };

            await set(newBookRef, newBookData);

            // Reset form
            setTitle("");
            setDescription("");
            setCoverFile(null);
            setGenreId(genres.length > 0 ? genres[0].id : "");
            setIsVIP(false);
            setPrice(0);

            alert("✅ Đăng tải sách thành công, chờ admin duyệt!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 4, backgroundColor: "#fff", minHeight: "100vh" }}>
            <Typography variant="h4" sx={{ color: "#8B0000", mb: 3 }}>
                Đăng tải sách mới
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Card sx={{ maxWidth: 600 }}>
                <CardContent>
                    <TextField
                        label="Tiêu đề sách"
                        fullWidth sx={{ mb: 2 }}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <TextField
                        label="Mô tả"
                        multiline rows={4} fullWidth sx={{ mb: 2 }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <TextField
                        select label="Thể loại" fullWidth sx={{ mb: 2 }}
                        value={genreId}
                        onChange={(e) => setGenreId(e.target.value)}
                    >
                        {genres.map((genre) => (
                            <MenuItem key={genre.id} value={genre.id}>
                                {genre.Name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select label="Loại sách" fullWidth sx={{ mb: 2 }}
                        value={isVIP ? "vip" : "thuong"}
                        onChange={(e) => setIsVIP(e.target.value === "vip")}
                    >
                        <MenuItem value="thuong">Thường</MenuItem>
                        <MenuItem value="vip">VIP</MenuItem>
                    </TextField>

                    {isVIP && (
                        <TextField
                            type="number"
                            label="Giá (xu)"
                            fullWidth sx={{ mb: 2 }}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            inputProps={{ min: 1 }}
                        />
                    )}

                    <Button
                        variant="outlined" component="label"
                        sx={{ mb: 2, color: "#5D4037", borderColor: "#5D4037" }}
                    >
                        Chọn ảnh bìa
                        <input
                            type="file"
                            hidden
                            onChange={(e) => setCoverFile(e.target.files[0])}
                        />
                    </Button>
                    {coverFile && <Typography variant="body2">{coverFile.name}</Typography>}

                    <Button
                        variant="contained" fullWidth onClick={handleUpload} disabled={loading}
                        sx={{
                            backgroundColor: "#8B0000",
                            "&:hover": { backgroundColor: "#A52A2A" },
                            py: 1.5, borderRadius: 2,
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Đăng tải"}
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default DangTaiSachUser;
