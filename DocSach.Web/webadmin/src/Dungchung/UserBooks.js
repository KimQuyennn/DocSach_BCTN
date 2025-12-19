// // src/pages/UserBooks.js
// import React, { useState, useEffect } from "react";
// import {
//     Box,
//     Button,
//     Card,
//     CardContent,
//     Typography,
//     Chip,
//     TextField,
//     MenuItem,
//     CircularProgress,
//     Alert,
//     Grid,
// } from "@mui/material";
// import { ref, onValue, update, push, set } from "firebase/database";
// import { db } from "../services/firebase";
// import { useNavigate } from "react-router-dom"; // <-- Thêm useNavigate

// const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
// const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

// const UserBooks = () => {
//     const currentUserId = localStorage.getItem("userId");
//     const [books, setBooks] = useState([]);
//     const [selectedTab, setSelectedTab] = useState("all");
//     const [showUploadForm, setShowUploadForm] = useState(false);

//     const navigate = useNavigate(); // <-- Khởi tạo navigate

//     // Form đăng sách
//     const [title, setTitle] = useState("");
//     const [description, setDescription] = useState("");
//     const [genres, setGenres] = useState([]);
//     const [genreId, setGenreId] = useState("");
//     const [coverFile, setCoverFile] = useState(null);
//     const [isVIP, setIsVIP] = useState(false);
//     const [price, setPrice] = useState(0);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [author, setAuthor] = useState("");

//     // Load genres
//     useEffect(() => {
//         const genresRef = ref(db, "Genres");
//         return onValue(genresRef, (snapshot) => {
//             const data = snapshot.val() || {};
//             const list = Object.keys(data).map((key) => ({ id: key, Name: data[key].Name }));
//             setGenres(list);
//             if (list.length > 0) setGenreId(list[0].id);
//         });
//     }, []);

//     // Load books của user
//     useEffect(() => {
//         const booksRef = ref(db, "Books");
//         return onValue(booksRef, (snapshot) => {
//             const data = snapshot.val() || {};
//             const userBooks = Object.values(data).filter((b) => b.UploaderId === currentUserId);
//             setBooks(userBooks);
//         });
//     }, [currentUserId]);

//     const handleTabClick = (tab) => setSelectedTab(tab);

//     const filteredBooks = books.filter((b) => {
//         switch (selectedTab) {
//             case "all": return true;
//             case "pending": return b.Status === "Chưa duyệt";
//             case "approved": return b.Status === "Đang cập nhật" && !b.IsCompleted;
//             case "completed": return b.Status === "Hoàn thành" && b.IsCompleted;
//             case "rejected": return b.Status === "Từ chối";
//             default: return true;
//         }
//     });

//     const handleEdit = async (book) => {
//         await update(ref(db, `Books/${book.Id}`), {
//             Status: "Chưa duyệt",
//             IsApproved: false,
//             UpdatedAt: new Date().toISOString(),
//         });
//         alert("Sửa xong, trạng thái đã được đặt lại Chưa duyệt");
//     };

//     const uploadImageToCloudinary = async (file) => {
//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

//         const response = await fetch(
//             `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
//             { method: "POST", body: formData }
//         );
//         const data = await response.json();
//         if (data.secure_url) return data.secure_url;
//         throw new Error("Lỗi upload ảnh");
//     };

//     const handleUploadBook = async () => {
//         if (!title || !description || !genreId || !coverFile || !author) {
//             setError("⚠️ Vui lòng điền đầy đủ thông tin, chọn ảnh bìa và tác giả");
//             return;
//         }

//         if (isVIP && price <= 0) {
//             setError("⚠️ Sách VIP phải có giá lớn hơn 0");
//             return;
//         }

//         setLoading(true);
//         setError("");

//         try {
//             const coverUrl = await uploadImageToCloudinary(coverFile);
//             const newBookRef = push(ref(db, "Books"));
//             const now = new Date().toISOString();

//             const newBookData = {
//                 Id: newBookRef.key,
//                 Title: title,
//                 Description: description,
//                 Author: author,
//                 CoverImage: coverUrl,
//                 GenreId: genreId,
//                 IsApproved: false,
//                 Status: "Chưa duyệt",
//                 IsVIP: isVIP,
//                 Price: isVIP ? price : 0,
//                 PublishedDate: now,
//                 UpdatedAt: now,
//                 UploaderId: localStorage.getItem("userId"),
//                 UploaderName: localStorage.getItem("username") || "Ẩn danh",
//                 Views: 0,
//                 Chapters: [],
//                 CreatedAt: now
//             };

//             await set(newBookRef, newBookData);

//             // Reset form
//             setTitle("");
//             setDescription("");
//             setAuthor("");
//             setCoverFile(null);
//             setGenreId(genres.length > 0 ? genres[0].id : "");
//             setIsVIP(false);
//             setPrice(0);

//             alert("✅ Đăng sách thành công, chờ admin duyệt!");
//         } catch (err) {
//             setError(err.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const tabs = [
//         { key: "all", label: `Tất cả (${books.length})` },
//         { key: "pending", label: `Chưa duyệt (${books.filter(b => b.Status === "Chưa duyệt").length})` },
//         { key: "approved", label: `Chưa hoàn thành (${books.filter(b => b.Status === "Đang cập nhật" && !b.IsCompleted).length})` },
//         { key: "completed", label: `Hoàn thành (${books.filter(b => b.Status === "Hoàn thành" && b.IsCompleted).length})` },
//         { key: "rejected", label: `Từ chối (${books.filter(b => b.Status === "Từ chối").length})` },
//     ];

//     // Hàm chuyển sang trang quản lý chương khi nhấn vào sách
//     const handleBookClick = (book) => {
//         navigate(`/quan-ly-chuong-user/${book.Id}`);
//     };

//     return (
//         <Box sx={{ p: 3, backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
//             <Typography variant="h4" sx={{ mb: 3, color: "#8B0000" }}>
//                 Quản lý sách của tôi
//             </Typography>

//             {/* Tabs */}
//             <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
//                 {tabs.map((t) => (
//                     <Button
//                         key={t.key}
//                         variant={selectedTab === t.key ? "contained" : "outlined"}
//                         color={selectedTab === t.key ? "error" : "inherit"}
//                         onClick={() => handleTabClick(t.key)}
//                     >
//                         {t.label}
//                     </Button>
//                 ))}
//                 <Button
//                     variant="contained"
//                     sx={{ ml: "auto", backgroundColor: "#5D4037", "&:hover": { backgroundColor: "#8B4513" } }}
//                     onClick={() => setShowUploadForm(!showUploadForm)}
//                 >
//                     {showUploadForm ? "Đóng form" : "Thêm sách mới"}
//                 </Button>
//             </Box>

//             {/* Form đăng sách */}
//             {showUploadForm && (
//                 <Card sx={{ mb: 3, p: 2, maxWidth: 600 }}>
//                     <CardContent>
//                         {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
//                         <TextField label="Tiêu đề" fullWidth sx={{ mb: 2 }} value={title} onChange={e => setTitle(e.target.value)} />
//                         <TextField label="Tác giả" fullWidth sx={{ mb: 2 }} value={author} onChange={e => setAuthor(e.target.value)} />
//                         <TextField label="Mô tả" multiline rows={4} fullWidth sx={{ mb: 2 }} value={description} onChange={e => setDescription(e.target.value)} />
//                         <TextField select label="Thể loại" fullWidth sx={{ mb: 2 }} value={genreId} onChange={e => setGenreId(e.target.value)}>
//                             {genres.map(g => <MenuItem key={g.id} value={g.id}>{g.Name}</MenuItem>)}
//                         </TextField>
//                         <TextField select label="Loại sách" fullWidth sx={{ mb: 2 }} value={isVIP ? "vip" : "thuong"} onChange={e => setIsVIP(e.target.value === "vip")}>
//                             <MenuItem value="thuong">Thường</MenuItem>
//                             <MenuItem value="vip">VIP</MenuItem>
//                         </TextField>
//                         {isVIP && <TextField type="number" label="Giá (xu)" fullWidth sx={{ mb: 2 }} value={price} onChange={e => setPrice(Number(e.target.value))} />}
//                         <Button variant="outlined" component="label" sx={{ mb: 2 }}>
//                             Chọn ảnh bìa
//                             <input type="file" hidden onChange={e => setCoverFile(e.target.files[0])} />
//                         </Button>
//                         {coverFile && <Typography variant="body2">{coverFile.name}</Typography>}
//                         <Button variant="contained" fullWidth onClick={handleUploadBook} disabled={loading} sx={{ py: 1.5, borderRadius: 2, backgroundColor: "#8B0000", "&:hover": { backgroundColor: "#A52A2A" } }}>
//                             {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Đăng tải"}
//                         </Button>
//                     </CardContent>
//                 </Card>
//             )}

//             {/* Danh sách sách */}
//             <Grid container spacing={3}>
//                 {filteredBooks.map((book) => (
//                     <Grid item xs={12} md={6} lg={4} key={book.Id}>
//                         <Card
//                             sx={{ p: 2, boxShadow: 3, borderRadius: 2, "&:hover": { cursor: "pointer", transform: "scale(1.02)" }, transition: "transform 0.2s" }}
//                             onClick={() => handleBookClick(book)} // <-- chuyển sang trang quản lý chương
//                         >
//                             <Box sx={{ display: "flex", gap: 2 }}>
//                                 <Box component="img" src={book.CoverImage || ""} alt={book.Title} sx={{ width: 100, height: 150, borderRadius: 2, objectFit: "cover", backgroundColor: "#f2e5e0" }} />
//                                 <CardContent sx={{ flex: 1, p: 0 }}>
//                                     <Typography variant="h6">{book.Title}</Typography>
//                                     <Chip label={book.Status || "Chưa duyệt"} color={book.Status === "Từ chối" ? "error" : book.Status === "Đã duyệt" ? "success" : "warning"} size="small" sx={{ mt: 1 }} />
//                                     <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
//                                         <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); handleEdit(book); }}>Sửa sách</Button>
//                                     </Box>
//                                 </CardContent>
//                             </Box>
//                         </Card>
//                     </Grid>
//                 ))}
//             </Grid>
//         </Box>
//     );
// };

// export default UserBooks;


// src/pages/UserBooks.js
import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Chip,
    TextField,
    MenuItem,
    CircularProgress,
    Alert,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    FormControlLabel,
    Checkbox
} from "@mui/material";
import { ref, onValue, update, push, set } from "firebase/database";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

const UserBooks = () => {
    const currentUserId = localStorage.getItem("userId");
    const [books, setBooks] = useState([]);
    const [selectedTab, setSelectedTab] = useState("all");
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    const navigate = useNavigate();

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [author, setAuthor] = useState("");
    const [genres, setGenres] = useState([]);
    const [genreId, setGenreId] = useState("");
    const [coverFile, setCoverFile] = useState(null);
    const [coverUrl, setCoverUrl] = useState("");
    const [isVIP, setIsVIP] = useState(false);
    const [price, setPrice] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [hasCopyright, setHasCopyright] = useState("auto"); // "auto", "yes", "no"
    const [publisherName, setPublisherName] = useState("");
    const [copyrightExpiration, setCopyrightExpiration] = useState("");
    const [copyrightFile, setCopyrightFile] = useState(null);

    // Load genres
    useEffect(() => {
        const genresRef = ref(db, "Genres");
        return onValue(genresRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.keys(data).map((key) => ({ id: key, Name: data[key].Name }));
            setGenres(list);
            if (list.length > 0 && !genreId) setGenreId(list[0].id);
        });
    }, []);

    // Load user books
    useEffect(() => {
        const booksRef = ref(db, "Books");
        return onValue(booksRef, (snapshot) => {
            const data = snapshot.val() || {};
            const userBooks = Object.values(data).filter((b) => b.UploaderId === currentUserId);
            setBooks(userBooks);
        });
    }, [currentUserId]);

    const handleTabClick = (tab) => setSelectedTab(tab);

    const filteredBooks = books.filter((b) => {
        switch (selectedTab) {
            case "all": return true;
            case "pending": return b.Status === "Chưa duyệt";
            case "approved": return b.Status === "Đang cập nhật" && !b.IsCompleted;
            case "completed": return b.Status === "Hoàn thành" && b.IsCompleted;
            case "rejected": return b.Status === "Từ chối";
            default: return true;
        }
    });

    const tabs = [
        { key: "all", label: `Tất cả (${books.length})` },
        { key: "pending", label: `Chưa duyệt (${books.filter(b => b.Status === "Chưa duyệt").length})` },
        { key: "approved", label: `Chưa hoàn thành (${books.filter(b => b.Status === "Đang cập nhật" && !b.IsCompleted).length})` },
        { key: "completed", label: `Hoàn thành (${books.filter(b => b.Status === "Hoàn thành" && b.IsCompleted).length})` },
        { key: "rejected", label: `Từ chối (${books.filter(b => b.Status === "Từ chối").length})` },
    ];

    const handleBookClick = (book) => {
        navigate(`/quan-ly-chuong-user/${book.Id}`);
    };

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

    // Mở form chỉnh sửa
    const handleEdit = (book) => {
        setEditingBook(book);
        setTitle(book.Title);
        setAuthor(book.Author);
        setDescription(book.Description);
        setGenreId(book.GenreId);
        setPrice(book.Price || 0); // Đảm bảo là number
        setIsVIP(book.IsVIP || false);
        setIsCompleted(book.IsCompleted || false);
        setCoverUrl(book.CoverImage || "");

        // ✨ SET TRẠNG THÁI BẢN QUYỀN
        const isCopy = book.HasCopyright === true;
        setHasCopyright(isCopy ? "yes" : "no");
        setPublisherName(book.PublisherName || "");
        setCopyrightExpiration(book.CopyrightExpiration || "");
        setCopyrightFile(null); // Luôn reset file input
        setCoverFile(null); // Luôn reset file input

        setShowEditForm(true);
    };

    // Lưu sách khi user chỉnh sửa
    const handleSaveEdit = async () => {
        // 1. Validation cơ bản
        if (!title || !author || !genreId) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        // 2. VALIDATION BẢN QUYỀN
        const isCopyrightBook = hasCopyright === "yes";
        if (isCopyrightBook && (!publisherName || !copyrightExpiration)) {
            alert("⚠️ Sách bản quyền cần điền đầy đủ Tên NXB và Hạn bản quyền.");
            return;
        }

        setLoading(true);

        try {
            let finalCoverUrl = coverUrl;
            if (coverFile) {
                finalCoverUrl = await uploadImageToCloudinary(coverFile, false);
            }

            // ✨ XỬ LÝ ẢNH BẢN QUYỀN
            let finalCopyrightUrl = editingBook.CopyrightImage || null;
            if (copyrightFile) {
                // Upload ảnh bản quyền nếu user chọn file mới
                finalCopyrightUrl = await uploadImageToCloudinary(copyrightFile, true);
            } else if (!isCopyrightBook) {
                // Nếu chuyển từ có bản quyền sang tự viết, reset URL
                finalCopyrightUrl = null;
            }

            const bookData = {
                Title: title,
                Author: author,
                Description: description,
                GenreId: genreId,
                Price: price,
                CoverImage: finalCoverUrl,
                IsVIP: isVIP,
                IsCompleted: isCompleted,

                // ✨ THÔNG TIN BẢN QUYỀN
                HasCopyright: isCopyrightBook,
                PublisherName: isCopyrightBook ? publisherName : null,
                CopyrightExpiration: isCopyrightBook ? copyrightExpiration : null,
                CopyrightImage: finalCopyrightUrl, // Cập nhật URL

                Status: "Chưa duyệt", // 🔹 Reset trạng thái để admin duyệt lại
                IsApproved: false,
                UpdatedAt: new Date().toISOString()
            };

            await update(ref(db, `Books/${editingBook.Id}`), bookData);
            alert("✅ Sửa sách xong, trạng thái đã đặt lại Chưa duyệt");
            setShowEditForm(false);
            setEditingBook(null);
            setCoverFile(null);
            setCopyrightFile(null);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lưu sách: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Upload sách mới
    const handleUploadBook = async () => {
        // 1. VALIDATION CƠ BẢN
        if (!title || !description || !genreId || !coverFile || !author) {
            setError("⚠️ Vui lòng điền đầy đủ thông tin, chọn ảnh bìa và tác giả");
            return;
        }

        // 2. VALIDATION VIP & GIÁ
        let finalPrice = isVIP ? price : 0;
        if (isVIP && finalPrice <= 0) {
            setError("⚠️ Sách VIP phải có giá lớn hơn 0");
            return;
        }

        // 3. VALIDATION BẢN QUYỀN MỚI
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
            // 4. UPLOAD ẢNH
            const coverUrl = await uploadImageToCloudinary(coverFile, false);

            let copyrightUrl = null;
            if (isCopyrightBook && copyrightFile) {
                copyrightUrl = await uploadImageToCloudinary(copyrightFile, true);
            }

            const newBookRef = push(ref(db, "Books"));
            const now = new Date().toISOString();

            const newBookData = {
                Id: newBookRef.key,
                Title: title,
                Description: description,
                Author: author,
                CoverImage: coverUrl,
                GenreId: genreId,
                IsApproved: false,
                Status: "Chưa duyệt",
                IsVIP: isVIP,
                Price: finalPrice,

                // ✨ THÔNG TIN BẢN QUYỀN
                HasCopyright: isCopyrightBook,
                PublisherName: isCopyrightBook ? publisherName : null,
                CopyrightExpiration: isCopyrightBook ? copyrightExpiration : null,
                CopyrightImage: copyrightUrl,

                PublishedDate: now,
                UpdatedAt: now,
                UploaderId: currentUserId,
                UploaderName: localStorage.getItem("username") || "Ẩn danh",
                Views: 0,
                Chapters: [],
                CreatedAt: now
            };

            await set(newBookRef, newBookData);

            // Reset form
            setTitle("");
            setDescription("");
            setAuthor("");
            setCoverFile(null);
            setGenreId(genres.length > 0 ? genres[0].id : "");
            setIsVIP(false);
            setPrice(0);
            // Reset bản quyền
            setHasCopyright("auto");
            setPublisherName("");
            setCopyrightExpiration("");
            setCopyrightFile(null);
            setShowUploadForm(false); // Đóng form sau khi thành công

            alert("✅ Đăng sách thành công, chờ admin duyệt!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
            <Typography variant="h4" sx={{ mb: 3, color: "#8B0000" }}>
                Quản lý sách của tôi
            </Typography>

            {/* Tabs */}
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                {tabs.map((t) => (
                    <Button
                        key={t.key}
                        variant={selectedTab === t.key ? "contained" : "outlined"}
                        color={selectedTab === t.key ? "error" : "inherit"}
                        onClick={() => handleTabClick(t.key)}
                    >
                        {t.label}
                    </Button>
                ))}
                <Button
                    variant="contained"
                    sx={{ ml: "auto", backgroundColor: "#5D4037", "&:hover": { backgroundColor: "#8B4513" } }}
                    onClick={() => setShowUploadForm(!showUploadForm)}
                >
                    {showUploadForm ? "Đóng form" : "Thêm sách mới"}
                </Button>
            </Box>

            {/* Form upload sách mới */}
            {showUploadForm && (
                <Card sx={{ mb: 3, p: 2, maxWidth: 600 }}>
                    <CardContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <TextField label="Tiêu đề" fullWidth sx={{ mb: 2 }} value={title} onChange={e => setTitle(e.target.value)} />
                        <TextField label="Tác giả" fullWidth sx={{ mb: 2 }} value={author} onChange={e => setAuthor(e.target.value)} />
                        <TextField label="Mô tả" multiline rows={4} fullWidth sx={{ mb: 2 }} value={description} onChange={e => setDescription(e.target.value)} />
                        <TextField select label="Thể loại" fullWidth sx={{ mb: 2 }} value={genreId} onChange={e => setGenreId(e.target.value)}>
                            {genres.map(g => <MenuItem key={g.id} value={g.id}>{g.Name}</MenuItem>)}
                        </TextField>
                        <TextField select label="Loại sách" fullWidth sx={{ mb: 2 }} value={isVIP ? "vip" : "thuong"} onChange={e => setIsVIP(e.target.value === "vip")}>
                            <MenuItem value="thuong">Thường</MenuItem>
                            <MenuItem value="vip">VIP</MenuItem>
                        </TextField>
                        {isVIP && <TextField type="number" label="Giá (xu)" fullWidth sx={{ mb: 2 }} value={price} onChange={e => setPrice(Number(e.target.value))} />}
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: "#8B0000" }}>Thông tin Bản quyền</Typography>
                        <TextField
                            select
                            label="Loại sách"
                            fullWidth
                            sx={{ mb: 2 }}
                            value={hasCopyright}
                            onChange={(e) => {
                                setHasCopyright(e.target.value);
                                if (e.target.value === "no") {
                                    setPublisherName("");
                                    setCopyrightExpiration("");
                                    setCopyrightFile(null);
                                }
                            }}
                        >
                            <MenuItem value="auto" disabled>-- Chọn loại sách --</MenuItem>
                            <MenuItem value="no">Sách tự viết (Không bản quyền)</MenuItem>
                            <MenuItem value="yes">Sách có bản quyền</MenuItem>
                        </TextField>

                        {hasCopyright === "yes" && (
                            <Box sx={{ border: '1px dashed #ccc', p: 2, mb: 2 }}>
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
                                    placeholder="Ví dụ: 31/12/2030"
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
                        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                            Chọn ảnh bìa
                            <input type="file" hidden onChange={e => setCoverFile(e.target.files[0])} />
                        </Button>
                        {coverFile && <Typography variant="body2">{coverFile.name}</Typography>}
                        <Button variant="contained" fullWidth onClick={handleUploadBook} disabled={loading} sx={{ py: 1.5, borderRadius: 2, backgroundColor: "#8B0000", "&:hover": { backgroundColor: "#A52A2A" } }}>
                            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Đăng tải"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Danh sách sách */}
            <Grid container spacing={3}>
                {filteredBooks.map((book) => (
                    <Grid item xs={12} md={6} lg={4} key={book.Id}>
                        <Card
                            sx={{ p: 2, boxShadow: 3, borderRadius: 2, "&:hover": { cursor: "pointer", transform: "scale(1.02)" }, transition: "transform 0.2s" }}
                            onClick={() => handleBookClick(book)}
                        >
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Box component="img" src={book.CoverImage || ""} alt={book.Title} sx={{ width: 100, height: 150, borderRadius: 2, objectFit: "cover", backgroundColor: "#f2e5e0" }} />
                                <CardContent sx={{ flex: 1, p: 0 }}>
                                    <Typography variant="h6">{book.Title}</Typography>
                                    <Chip label={book.Status || "Chưa duyệt"} color={book.Status === "Từ chối" ? "error" : book.Status === "Đã duyệt" ? "success" : "warning"} size="small" sx={{ mt: 1 }} />
                                    <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                        <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); handleEdit(book); }}>Sửa sách</Button>
                                    </Box>
                                </CardContent>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Dialog chỉnh sửa sách */}
            <Dialog open={showEditForm} onClose={() => setShowEditForm(false)} fullWidth maxWidth="sm">
                <DialogTitle>Sửa sách</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Tên sách" fullWidth value={title} onChange={e => setTitle(e.target.value)} />
                    <TextField margin="dense" label="Tác giả" fullWidth value={author} onChange={e => setAuthor(e.target.value)} />
                    <TextField margin="dense" label="Mô tả" fullWidth multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} />
                    <TextField select margin="dense" label="Thể loại" fullWidth value={genreId} onChange={e => setGenreId(e.target.value)}>
                        {genres.map(g => <MenuItem key={g.id} value={g.id}>{g.Name}</MenuItem>)}
                    </TextField>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isVIP}
                                onChange={e => {
                                    const checked = e.target.checked;
                                    setIsVIP(checked);
                                    if (!checked) setPrice(0); // reset giá nếu bỏ tick VIP
                                }}
                            />
                        }
                        label="Sách VIP"
                    />

                    {/* Chỉ hiện ô Giá nếu là sách VIP */}
                    {isVIP && (
                        <TextField
                            margin="dense"
                            label="Giá (xu)"
                            fullWidth
                            type="number"
                            value={price}
                            onChange={e => setPrice(Number(e.target.value))}
                        />
                    )}
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: "#8B0000" }}>Thông tin Bản quyền</Typography>
                    <TextField
                        select
                        label="Loại sách"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={hasCopyright}
                        onChange={(e) => setHasCopyright(e.target.value)}
                    >
                        <MenuItem value="no">Sách tự viết (Không bản quyền)</MenuItem>
                        <MenuItem value="yes">Sách có bản quyền</MenuItem>
                    </TextField>

                    {hasCopyright === "yes" && (
                        <Box sx={{ border: '1px dashed #ccc', p: 2, mb: 2 }}>
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
                                placeholder="Ví dụ: 31/12/2030"
                            />

                            {/* Hiển thị ảnh bản quyền cũ hoặc nút chọn ảnh mới */}
                            {editingBook?.CopyrightImage && !copyrightFile && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="textSecondary">Tệp bản quyền hiện tại:</Typography>
                                    <a href={editingBook.CopyrightImage} target="_blank" rel="noopener noreferrer">Xem ảnh</a>
                                </Box>
                            )}

                            <Button
                                variant="outlined" component="label"
                                sx={{ mb: 1, color: "#388E3C", borderColor: "#388E3C" }}
                            >
                                {editingBook?.CopyrightImage ? "Thay đổi ảnh chứng minh" : "Chọn ảnh chứng minh bản quyền"}
                                <input
                                    type="file"
                                    hidden
                                    onChange={(e) => setCopyrightFile(e.target.files[0])}
                                />
                            </Button>
                            {copyrightFile && (
                                <Typography variant="body2" color="success.main">{copyrightFile.name} (Sẽ thay thế ảnh cũ)</Typography>
                            )}
                        </Box>
                    )}
                    <Button variant="outlined" component="label" sx={{ my: 1 }}>
                        Chọn ảnh bìa
                        <input type="file" hidden onChange={e => setCoverFile(e.target.files[0])} />
                    </Button>
                    {coverFile && <Typography variant="body2">{coverFile.name}</Typography>}
                    {coverUrl && !coverFile && <img src={coverUrl} alt="cover" style={{ width: 100, display: "block", marginTop: 10 }} />}

                    <FormControlLabel
                        control={<Checkbox checked={isCompleted} onChange={e => setIsCompleted(e.target.checked)} />}
                        label="Hoàn thành"
                    />
                    <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSaveEdit} disabled={loading}>
                        {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Lưu thay đổi"}
                    </Button>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default UserBooks;
