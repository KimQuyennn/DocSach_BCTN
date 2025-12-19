// src/pages/DangTaiSach.js
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
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../../services/firebase";

const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

const DangTaiSach = () => {
    //const user = auth.currentUser;
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [genreId, setGenreId] = useState("");
    const [genres, setGenres] = useState([]);
    const [coverFile, setCoverFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 👉 State cho VIP & Giá
    const [isVIP, setIsVIP] = useState(false);
    const [price, setPrice] = useState(0);

    // ✨ State cho BẢN QUYỀN
    // Dùng string để dễ dàng hiển thị giá trị mặc định trong Select
    const [hasCopyright, setHasCopyright] = useState("auto"); // "auto", "yes", "no" 
    const [publisherName, setPublisherName] = useState("");
    const [copyrightExpiration, setCopyrightExpiration] = useState("");
    const [copyrightFile, setCopyrightFile] = useState(null);

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
    // Cập nhật để nhận thêm tham số isCopyright để tạo tên file khác nhau
    const uploadImageToCloudinary = async (file, isCopyright = false) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        // Tùy chỉnh tên file để phân biệt trên Cloudinary
        const fileName = isCopyright
            ? `copyright_doc_${Date.now()}`
            : `book_cover_${Date.now()}`;
        formData.append("public_id", fileName);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );

        const data = await response.json();
        if (data.secure_url) return data.secure_url;
        throw new Error("Lỗi upload ảnh: " + (data.error?.message || "Lỗi không xác định"));
    };

    // Xử lý đăng tải sách
    const handleUpload = async () => {
        // 1. VALIDATION CƠ BẢN
        if (!title || !author || !description || !genreId || !coverFile) {
            setError("⚠️ Vui lòng điền đầy đủ thông tin và chọn ảnh bìa");
            return;
        }

        // 2. VALIDATION VIP & GIÁ
        let finalPrice = isVIP ? price : 0;
        if (isVIP && finalPrice <= 0) {
            setError("⚠️ Sách VIP phải có giá lớn hơn 0");
            return;
        }

        // 3. VALIDATION BẢN QUYỀN
        const isCopyrightBook = hasCopyright === "yes";
        if (hasCopyright === "auto") {
            setError("⚠️ Vui lòng xác nhận loại sách (Tự viết/Bản quyền).");
            return;
        }
        if (isCopyrightBook && (!publisherName || !copyrightExpiration || !copyrightFile)) {
            setError("⚠️ Sách bản quyền cần điền đầy đủ Tên NXB, Hạn bản quyền và Ảnh chứng minh.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 4. UPLOAD ẢNH BÌA
            const coverUrl = await uploadImageToCloudinary(coverFile, false);

            // 5. UPLOAD ẢNH BẢN QUYỀN (nếu cần)
            let copyrightUrl = null;
            if (isCopyrightBook && copyrightFile) {
                copyrightUrl = await uploadImageToCloudinary(copyrightFile, true);
            }

            const newBookRef = push(ref(db, "Books"));
            const now = new Date().toISOString();

            const newBookData = {
                Id: newBookRef.key,
                Title: title,
                Author: author,
                Description: description,
                GenreId: genreId,
                CoverImage: coverUrl,

                // Người đăng
                UploaderId: localStorage.getItem("userId"),
                UploaderRole: localStorage.getItem("userRole") || "User",
                UploaderName: localStorage.getItem("username") || "Ẩn danh",

                // Các trường chuẩn
                IsApproved: false,
                IsVIP: isVIP,
                Price: finalPrice, // Sử dụng giá đã qua validation
                Views: 0,
                Status: "Chưa duyệt", // Nên đặt là "Chờ duyệt" khi đăng mới
                IsCompleted: false, // Mặc định là chưa hoàn thành

                // ✨ THÔNG TIN BẢN QUYỀN ĐÃ THÊM
                HasCopyright: isCopyrightBook,
                PublisherName: isCopyrightBook ? publisherName : null,
                CopyrightExpiration: isCopyrightBook ? copyrightExpiration : null,
                CopyrightImage: copyrightUrl,

                CreatedAt: now,
                UpdatedAt: now,
                PublishedDate: now,
            };

            await set(newBookRef, newBookData);

            // Reset form
            setTitle("");
            setAuthor("");
            setDescription("");
            setCoverFile(null);
            setGenreId(genres.length > 0 ? genres[0].id : "");
            setIsVIP(false);
            setPrice(0);
            // Reset bản quyền
            setHasCopyright("auto");
            setPublisherName("");
            setCopyrightExpiration("");
            setCopyrightFile(null);

            alert("✅ Đăng tải sách thành công, chờ duyệt!");
        } catch (err) {
            setError(err.message || "Lỗi không xác định khi đăng sách.");
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
                        label="Tên tác giả"
                        fullWidth sx={{ mb: 2 }}
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
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

                    {/* ✅ Chọn VIP / Thường */}
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

                    {/* ✨ PHẦN BẢN QUYỀN ĐÃ THÊM */}
                    <Typography variant="h6" sx={{ mt: 3, mb: 1, color: "#5D4037" }}>
                        Thông tin bản quyền
                    </Typography>

                    <TextField
                        select
                        label="Loại sách"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={hasCopyright}
                        onChange={(e) => setHasCopyright(e.target.value)}
                    >
                        <MenuItem value="auto" disabled>-- Chọn loại sách --</MenuItem>
                        <MenuItem value="no">Sách tự viết (Không bản quyền)</MenuItem>
                        <MenuItem value="yes">Sách có bản quyền</MenuItem>
                    </TextField>

                    {hasCopyright === "yes" && (
                        <Box sx={{ border: '1px dashed #A52A2A', p: 2, mb: 2 }}>
                            <TextField
                                label="Tên Nhà xuất bản"
                                fullWidth sx={{ mb: 2 }}
                                value={publisherName}
                                onChange={(e) => setPublisherName(e.target.value)}
                            />
                            <TextField
                                label="Hạn bản quyền"
                                fullWidth sx={{ mb: 2 }}
                                value={copyrightExpiration}
                                onChange={(e) => setCopyrightExpiration(e.target.value)}
                                placeholder="Ví dụ: 31/12/2030 hoặc Vĩnh viễn"
                            />
                            <Button
                                variant="outlined" component="label"
                                sx={{ mb: 1, color: "#388E3C", borderColor: "#388E3C" }}
                            >
                                Chọn ảnh chứng minh bản quyền
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setCopyrightFile(e.target.files[0])}
                                />
                            </Button>
                            {copyrightFile && (
                                <Typography variant="body2" color="success.main">{copyrightFile.name}</Typography>
                            )}
                        </Box>
                    )}
                    {/* ✨ KẾT THÚC PHẦN BẢN QUYỀN */}

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
                    {coverFile && (
                        <Typography variant="body2">{coverFile.name}</Typography>
                    )}

                    <Button
                        variant="contained" fullWidth onClick={handleUpload} disabled={loading}
                        sx={{
                            backgroundColor: "#8B0000",
                            "&:hover": { backgroundColor: "#A52A2A" },
                            py: 1.5, borderRadius: 2,
                            mt: 3
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} sx={{ color: "#fff" }} />
                        ) : ("Đăng tải")}
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default DangTaiSach;