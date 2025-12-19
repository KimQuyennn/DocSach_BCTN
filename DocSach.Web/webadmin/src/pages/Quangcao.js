import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// Thông tin Cloudinary
const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

// Upload ảnh lên Cloudinary
const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    const data = await res.json();
    return data.secure_url;
};


const Quangcao = () => {
    const [ads, setAds] = useState([]);
    const [form, setForm] = useState({
        title: "",
        content: "",
        link: "",
        imageUrl: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    // 🔹 Load danh sách quảng cáo
    useEffect(() => {
        const adsRef = ref(db, "ads");
        onValue(adsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
                setAds(list.sort((a, b) => b.createdAt - a.createdAt));
            } else {
                setAds([]);
            }
        });
    }, []);

    // 🔹 Thêm hoặc cập nhật quảng cáo
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.content || !form.imageUrl) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        setLoading(true);
        const adsRef = ref(db, "ads");

        if (editingId) {
            await update(ref(db, `ads/${editingId}`), { ...form });
            setEditingId(null);
        } else {
            await set(push(adsRef), {
                ...form,
                createdAt: Date.now(),
            });
        }

        setForm({ title: "", content: "", link: "", imageUrl: "" });
        setLoading(false);
    };

    // 🔹 Xoá quảng cáo
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) {
            await remove(ref(db, `ads/${id}`));
        }
    };

    // 🔹 Sửa quảng cáo
    const handleEdit = (ad) => {
        setForm({
            title: ad.title,
            content: ad.content,
            link: ad.link || "",
            imageUrl: ad.imageUrl,
        });
        setEditingId(ad.id);
    };

    // 🔹 Upload ảnh
    const handleUploadImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        try {
            const url = await uploadToCloudinary(file);
            setForm((prev) => ({ ...prev, imageUrl: url }));
        } catch (error) {
            console.error("Upload thất bại:", error);
            alert("Upload ảnh thất bại!");
        }
        setLoading(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h5"
                sx={{ mb: 2, fontWeight: "bold", color: "#1976d2" }}
            >
                📢 Quản lý Quảng cáo
            </Typography>

            {/* Form thêm/sửa */}
            <Card sx={{ mb: 3 }}>
                <CardContent component="form" onSubmit={handleSubmit}>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                        <TextField
                            label="Tiêu đề"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Nội dung"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Link (tùy chọn)"
                            value={form.link}
                            onChange={(e) => setForm({ ...form, link: e.target.value })}
                            size="small"
                            fullWidth
                        />
                        <Button variant="contained" component="label">
                            Upload Ảnh
                            <input
                                type="file"
                                hidden
                                onChange={handleUploadImage}
                            />
                        </Button>
                        {form.imageUrl && (
                            <img
                                src={form.imageUrl}
                                alt="preview"
                                style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    border: "1px solid #ccc",
                                }}
                            />
                        )}
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={18} />}
                    >
                        {editingId ? "Cập nhật" : "➕ Thêm mới"}
                    </Button>
                </CardContent>
            </Card>

            {/* Danh sách quảng cáo */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                    <TableCell>Hình</TableCell>
                                    <TableCell>Tiêu đề</TableCell>
                                    <TableCell>Nội dung</TableCell>
                                    <TableCell>Ngày tạo</TableCell>
                                    <TableCell>Thao tác</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ads.map((ad) => (
                                    <TableRow key={ad.id} hover>
                                        <TableCell>
                                            <img
                                                src={ad.imageUrl}
                                                alt=""
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    objectFit: "cover",
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight="bold">
                                                {ad.title}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{ad.content}</TableCell>
                                        <TableCell>
                                            {new Date(ad.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleEdit(ad)}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(ad.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {ads.length === 0 && (
                        <Typography
                            align="center"
                            sx={{ mt: 2, color: "gray" }}
                        >
                            🚫 Chưa có quảng cáo nào
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default Quangcao;
