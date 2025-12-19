import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Avatar, Select, MenuItem, FormControl, InputLabel, Typography, CircularProgress
} from "@mui/material";
import { ref, onValue, set, update, remove, push, off } from "firebase/database";
import { db } from "../services/firebase";

const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

export default function QuanLyKhungAvatar() {
    const [frames, setFrames] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [frameName, setFrameName] = useState("");
    const [frameImage, setFrameImage] = useState("");
    const [frameFile, setFrameFile] = useState(null);
    const [framePrice, setFramePrice] = useState("");
    const [frameType, setFrameType] = useState("thuong"); // thuong, vip, event
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Load frames
    useEffect(() => {
        const framesRef = ref(db, "AvatarFrames");
        const unsubscribe = onValue(framesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map((id) => ({ id, ...data[id] }));
                setFrames(list);
            } else {
                setFrames([]);
            }
            setLoading(false);
        });

        return () => off(framesRef);
    }, []);

    const handleOpenDialog = (frame = null) => {
        if (frame) {
            setFrameName(frame.Name);
            setFrameImage(frame.ImageUrl);
            setFramePrice(frame.Price);
            setFrameType(frame.Type || "thuong");
            setEditingId(frame.id);
            setFrameFile(null);
        } else {
            setFrameName("");
            setFrameImage("");
            setFramePrice("");
            setFrameType("thuong");
            setEditingId(null);
            setFrameFile(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => setOpenDialog(false);

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Upload hình thất bại");
        return data.secure_url;
    };

    const handleSave = async () => {
        if (!frameName || !framePrice || (!frameImage && !frameFile)) {
            alert("Vui lòng điền đầy đủ thông tin và chọn ảnh");
            return;
        }

        setUploading(true);
        try {
            let imageUrl = frameImage;
            if (frameFile) {
                imageUrl = await uploadToCloudinary(frameFile);
            }

            const frameData = {
                Name: frameName,
                ImageUrl: imageUrl,
                Price: Number(framePrice),
                Type: frameType
            };

            if (editingId) {
                await update(ref(db, `AvatarFrames/${editingId}`), frameData);
            } else {
                const newRef = push(ref(db, "AvatarFrames"));
                await set(newRef, frameData);
            }

            setOpenDialog(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa khung này?")) {
            remove(ref(db, `AvatarFrames/${id}`));
        }
    };

    if (loading) return <div>Đang tải dữ liệu...</div>;

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h4" gutterBottom>Quản lý khung avatar</Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenDialog()}
                style={{ marginBottom: 20 }}
            >
                Thêm khung mới
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Preview</TableCell>
                            <TableCell>Tên khung</TableCell>
                            <TableCell>Loại</TableCell>
                            <TableCell>Giá (xu)</TableCell>
                            <TableCell>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {frames.map((f) => (
                            <TableRow key={f.id}>
                                <TableCell>
                                    <div style={{ position: "relative", width: 50, height: 50 }}>
                                        <Avatar
                                            src="https://via.placeholder.com/50"
                                            sx={{ width: 50, height: 50 }}
                                        />
                                        <Avatar
                                            src={f.ImageUrl}
                                            variant="rounded"
                                            sx={{
                                                position: "absolute",
                                                top: 0, left: 0,
                                                width: 50, height: 50,
                                            }}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>{f.Name}</TableCell>
                                <TableCell>{f.Type}</TableCell>
                                <TableCell>{f.Price}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" onClick={() => handleOpenDialog(f)} style={{ marginRight: 10 }}>
                                        Sửa
                                    </Button>
                                    <Button variant="outlined" color="error" onClick={() => handleDelete(f.id)}>
                                        Xóa
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Thêm / Sửa */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{editingId ? "Sửa khung" : "Thêm khung"}</DialogTitle>
                <DialogContent style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 400 }}>
                    <TextField
                        label="Tên khung"
                        value={frameName}
                        onChange={(e) => setFrameName(e.target.value)}
                    />

                    <Button
                        variant="outlined"
                        component="label"
                    >
                        Chọn ảnh khung (PNG)
                        <input
                            type="file"
                            hidden
                            accept="image/png"
                            onChange={(e) => setFrameFile(e.target.files[0])}
                        />
                    </Button>
                    {frameFile && <Typography variant="body2">{frameFile.name}</Typography>}

                    <TextField
                        label="Giá (xu)"
                        type="number"
                        value={framePrice}
                        onChange={(e) => setFramePrice(e.target.value)}
                    />

                    <FormControl>
                        <InputLabel>Loại khung</InputLabel>
                        <Select
                            value={frameType}
                            onChange={(e) => setFrameType(e.target.value)}
                        >
                            <MenuItem value="thuong">Thường</MenuItem>
                            <MenuItem value="vip">VIP</MenuItem>
                            <MenuItem value="event">Event / Lễ hội</MenuItem>
                        </Select>
                    </FormControl>

                    {uploading && <CircularProgress />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Hủy</Button>
                    <Button variant="contained" onClick={handleSave}>Lưu</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
