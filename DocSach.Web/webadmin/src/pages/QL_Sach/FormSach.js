import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    Button,
    MenuItem,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Box, // Thêm Box để styling
    Typography, // Thêm Typography để tiêu đề
} from "@mui/material";
import { ref, set, push, update, onValue } from "firebase/database";
import { db } from "../../services/firebase";

const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

function FormSach({ open, onClose, book }) {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [genreId, setGenreId] = useState("");
    const [price, setPrice] = useState("");
    const [coverUrl, setCoverUrl] = useState("");
    const [coverFile, setCoverFile] = useState(null); // State cho file ảnh bìa
    const [isVIP, setIsVip] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookStatus, setBookStatus] = useState(book?.Status || "Đang cập nhật");

    // ✨ THÊM STATE BẢN QUYỀN
    const [hasCopyright, setHasCopyright] = useState("no"); // Mặc định là 'no'
    const [publisherName, setPublisherName] = useState("");
    const [copyrightExpiration, setCopyrightExpiration] = useState("");
    const [copyrightUrl, setCopyrightUrl] = useState(""); // URL ảnh bản quyền hiện tại/mới
    const [copyrightFile, setCopyrightFile] = useState(null); // File ảnh bản quyền mới

    // Load genres
    useEffect(() => {
        const genreRef = ref(db, "Genres");
        onValue(genreRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.keys(data).map((key) => ({
                Id: key,
                ...data[key],
            }));
            setGenres(list);
        });
    }, []);

    // Nếu có book => fill form để sửa
    useEffect(() => {
        if (book) {
            setTitle(book.Title || "");
            setAuthor(book.Author || "");
            setDescription(book.Description || "");
            setGenreId(book.GenreId || "");
            setPrice(book.Price || 0); // Đảm bảo là number
            setCoverUrl(book.CoverImage || "");
            setIsVip(book.IsVIP || false);
            setIsCompleted(book.IsCompleted || false);
            setBookStatus(book.Status || "Đang cập nhật");

            // ✨ FILL DATA BẢN QUYỀN
            const isCopy = book.HasCopyright === true;
            setHasCopyright(isCopy ? "yes" : "no");
            setPublisherName(book.PublisherName || "");
            setCopyrightExpiration(book.CopyrightExpiration || "");
            setCopyrightUrl(book.CopyrightImage || "");

            setCoverFile(null); // Reset file
            setCopyrightFile(null); // Reset file
        } else {
            // Reset form khi thêm mới
            setTitle("");
            setAuthor("");
            setDescription("");
            setGenreId("");
            setPrice(0);
            setCoverUrl("");
            setIsVip(false);
            setIsCompleted(false);
            setBookStatus("Đang cập nhật");

            // ✨ RESET BẢN QUYỀN
            setHasCopyright("no");
            setPublisherName("");
            setCopyrightExpiration("");
            setCopyrightUrl("");
            setCoverFile(null);
            setCopyrightFile(null);
        }
    }, [book, open]); // Thêm open vào dependency để reset form khi mở dialog

    // Upload ảnh lên Cloudinary chung (Áp dụng cho cả cover và copyright)
    const uploadImageToCloudinary = async (file, isCopyright = false) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const fileName = isCopyright
            ? `copyright_doc_${Date.now()}`
            : `book_cover_${Date.now()}`;
        formData.append("public_id", fileName);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );
        const data = await res.json();
        if (data.secure_url) return data.secure_url;
        throw new Error("Lỗi upload ảnh: " + (data.error?.message || "Lỗi không xác định"));
    };

    // Lưu sách vào Firebase
    const handleSave = async () => {
        if (!title || !author || !genreId || (!book && !coverFile)) {
            alert("Vui lòng nhập đầy đủ thông tin và chọn ảnh bìa!");
            return;
        }

        // ✨ VALIDATION BẢN QUYỀN
        const isCopyrightBook = hasCopyright === "yes";
        if (isCopyrightBook && (!publisherName || !copyrightExpiration)) {
            alert("⚠️ Sách bản quyền cần điền đầy đủ Tên NXB và Hạn bản quyền.");
            return;
        }

        setLoading(true);

        try {
            // 1. UPLOAD ẢNH BÌA (nếu có file mới)
            let finalCoverUrl = coverUrl;
            if (coverFile) {
                finalCoverUrl = await uploadImageToCloudinary(coverFile, false);
            } else if (!finalCoverUrl) {
                throw new Error("Vui lòng chọn ảnh bìa.");
            }

            // 2. UPLOAD ẢNH BẢN QUYỀN (nếu có file mới)
            let finalCopyrightUrl = copyrightUrl;
            if (copyrightFile) {
                finalCopyrightUrl = await uploadImageToCloudinary(copyrightFile, true);
            } else if (!isCopyrightBook) {
                finalCopyrightUrl = null; // Reset nếu chuyển sang "Không bản quyền"
            }

            const bookData = {
                Title: title,
                Author: author,
                Description: description,
                GenreId: genreId,
                Price: Number(price) || 0, // Đảm bảo lưu là số
                CoverImage: finalCoverUrl,
                IsVIP: isVIP,
                IsCompleted: isCompleted,
                Status: isCompleted ? "Hoàn thành" : bookStatus, // Giữ nguyên Status nếu không hoàn thành (để admin có thể set)
                UpdatedAt: new Date().toISOString(),

                // ✨ THÔNG TIN BẢN QUYỀN
                HasCopyright: isCopyrightBook,
                PublisherName: isCopyrightBook ? publisherName : null,
                CopyrightExpiration: isCopyrightBook ? copyrightExpiration : null,
                CopyrightImage: finalCopyrightUrl,
            };

            if (book && book.Id) {
                // Sửa sách
                await update(ref(db, "Books/" + book.Id), bookData);
            } else {
                // Thêm sách mới (Lưu ý: Thường admin sẽ điền UploaderId, cần đảm bảo trường này được thêm vào nếu đây là form chung)
                const newBookRef = push(ref(db, "Books"));
                await set(newBookRef, {
                    Id: newBookRef.key,
                    ...bookData,
                    UploaderId: 'AdminId_or_Placeholder', // Cần có UploaderId khi tạo mới
                    CreatedAt: new Date().toISOString(),
                    Views: 0,
                    IsApproved: false,
                });
            }
            onClose();
        } catch (err) {
            console.error("Lỗi lưu sách:", err);
            alert("Lưu sách thất bại: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{book ? "Sửa sách" : "Thêm sách"}</DialogTitle>
            <DialogContent>
                {/* Các trường cơ bản */}
                <TextField margin="dense" label="Tên sách" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
                <TextField margin="dense" label="Tác giả" fullWidth value={author} onChange={(e) => setAuthor(e.target.value)} />
                <TextField margin="dense" label="Mô tả" fullWidth multiline minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                <TextField select margin="dense" label="Thể loại" fullWidth value={genreId} onChange={(e) => setGenreId(e.target.value)}>
                    {genres.map((g) => (<MenuItem key={g.Id} value={g.Id}>{g.Name}</MenuItem>))}
                </TextField>

                {/* VIP và Giá */}
                <FormControlLabel
                    control={
                        <Checkbox checked={isVIP} onChange={(e) => {
                            const checked = e.target.checked;
                            setIsVip(checked);
                            if (!checked) setPrice(0); // reset giá khi bỏ tick VIP
                        }} />
                    }
                    label="Sách VIP"
                />
                {isVIP && (
                    <TextField margin="dense" label="Giá (Xu)" fullWidth type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                )}

                {/* Hoàn thành */}
                <FormControlLabel
                    control={
                        <Checkbox checked={isCompleted} onChange={(e) => {
                            const checked = e.target.checked;
                            setIsCompleted(checked);
                            setBookStatus(checked ? "Hoàn thành" : "Đang cập nhật");
                        }} />
                    }
                    label="Hoàn thành"
                />

                {/* Trạng thái (Chỉ Admin mới có thể thay đổi) */}
                {book && (
                    <TextField select margin="dense" label="Trạng thái" fullWidth value={bookStatus} onChange={(e) => setBookStatus(e.target.value)}>
                        <MenuItem value="Chưa duyệt">Chưa duyệt</MenuItem>
                        <MenuItem value="Đang cập nhật">Đang cập nhật</MenuItem>
                        <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                        <MenuItem value="Từ chối">Từ chối</MenuItem>
                    </TextField>
                )}

                {/* ✨ PHẦN BẢN QUYỀN */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Thông tin Bản quyền</Typography>
                <TextField
                    select
                    margin="dense"
                    label="Loại sách"
                    fullWidth
                    value={hasCopyright}
                    onChange={(e) => {
                        setHasCopyright(e.target.value);
                        // Reset các trường liên quan nếu chọn "Không bản quyền"
                        if (e.target.value === "no") {
                            setPublisherName("");
                            setCopyrightExpiration("");
                            setCopyrightFile(null);
                            setCopyrightUrl("");
                        }
                    }}
                >
                    <MenuItem value="no">Sách tự viết (Không bản quyền)</MenuItem>
                    <MenuItem value="yes">Sách có bản quyền</MenuItem>
                </TextField>

                {hasCopyright === "yes" && (
                    <Box sx={{ border: '1px dashed #ccc', p: 2, mt: 1 }}>
                        <TextField
                            margin="dense"
                            label="Tên Nhà xuất bản/Đơn vị giữ bản quyền"
                            fullWidth
                            value={publisherName}
                            onChange={(e) => setPublisherName(e.target.value)}
                        />
                        <TextField
                            margin="dense"
                            label="Hạn bản quyền"
                            fullWidth
                            value={copyrightExpiration}
                            onChange={(e) => setCopyrightExpiration(e.target.value)}
                            placeholder="Ví dụ: 31/12/2030 hoặc Vĩnh viễn"
                        />
                        <Button variant="outlined" component="label" sx={{ my: 1 }}>
                            {copyrightUrl || copyrightFile ? "Thay đổi Ảnh chứng minh bản quyền" : "Chọn Ảnh chứng minh bản quyền"}
                            <input
                                type="file"
                                hidden
                                onChange={(e) => setCopyrightFile(e.target.files[0])}
                            />
                        </Button>
                        {(copyrightFile || copyrightUrl) && (
                            <Typography variant="body2" sx={{ ml: 1, color: copyrightFile ? 'green' : 'textSecondary' }}>
                                {copyrightFile ? `Đã chọn: ${copyrightFile.name}` : "Ảnh hiện tại đã lưu"}
                            </Typography>
                        )}
                    </Box>
                )}
                {/* END BẢN QUYỀN */}

                {/* UPLOAD ẢNH BÌA */}
                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Ảnh bìa</Typography>
                <input type="file" onChange={(e) => setCoverFile(e.target.files[0])} style={{ marginTop: 10 }} />
                {loading && !coverFile ? <CircularProgress size={20} /> : (coverFile || coverUrl) && (
                    <img
                        src={coverFile ? URL.createObjectURL(coverFile) : coverUrl}
                        alt="cover"
                        style={{ width: "100px", marginTop: "10px", display: "block" }}
                    />
                )}

                <Button variant="contained" onClick={handleSave} sx={{ mt: 3 }} disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : (book ? "Cập nhật" : "Thêm")}
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default FormSach;