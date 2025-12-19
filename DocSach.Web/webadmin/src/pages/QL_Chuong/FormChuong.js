// // /src/components/admin/FormChuong.js
// import React, { useState, useEffect } from "react";
// import { ref, set, update } from "firebase/database";
// import { db } from "../../services/firebase";
// import { v4 as uuidv4 } from "uuid";
// import {
//     Box,
//     Button,
//     Card,
//     CardContent,
//     TextField,
//     Typography,
// } from "@mui/material";

// const FormChuong = ({ bookId, currentUserId, userRole, onClose, chapter }) => {
//     const [chapterNumber, setChapterNumber] = useState("");
//     const [title, setTitle] = useState("");
//     const [content, setContent] = useState("");

//     // Nếu có chapter thì fill sẵn dữ liệu để chỉnh sửa
//     useEffect(() => {
//         if (chapter) {
//             setChapterNumber(chapter.ChapterNumber || "");
//             setTitle(chapter.Title || "");
//             // 🔹 Bỏ thẻ HTML khi load vào form
//             const plainText = chapter.Content
//                 ? chapter.Content.replace(/<[^>]+>/g, "")
//                 : "";
//             setContent(plainText);
//         }
//     }, [chapter]);

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (!chapterNumber || !title || !content) {
//             alert("⚠️ Vui lòng nhập đủ số chương, tiêu đề và nội dung!");
//             return;
//         }

//         try {
//             // 🔹 Khi lưu: wrap nội dung thành <p>...</p>
//             const htmlContent = content
//                 .split("\n")
//                 .map(line => `<p>${line}</p>`)
//                 .join("");

//             if (chapter) {
//                 // Chỉnh sửa chương cũ
//                 const chapterRef = ref(db, `Chapters/${chapter.Id}`);
//                 await update(chapterRef, {
//                     ChapterNumber: parseInt(chapterNumber),
//                     Title: title,
//                     Content: htmlContent,
//                     UpdatedAt: new Date().toISOString(),
//                     IsApproved: false, // chỉnh sửa thì về trạng thái chờ duyệt
//                     Rejected: false,
//                 });
//                 alert("✏️ Cập nhật chương thành công, chờ duyệt lại!");
//             } else {
//                 // Thêm chương mới
//                 const newId = uuidv4();
//                 const chapterRef = ref(db, `Chapters/${newId}`);
//                 await set(chapterRef, {
//                     Id: newId,
//                     BookId: bookId,
//                     ChapterNumber: parseInt(chapterNumber),
//                     Title: title,
//                     Content: htmlContent,
//                     CreatedAt: new Date().toISOString(),
//                     UpdatedAt: new Date().toISOString(),
//                     IsApproved: false, // Mặc định phải chờ duyệt
//                     Rejected: false,
//                     AuthorId: currentUserId,
//                     AuthorRole: userRole,
//                 });
//                 alert("✅ Thêm chương thành công, đang chờ duyệt!");
//             }

//             if (onClose) onClose();
//         } catch (err) {
//             console.error("❌ Lỗi khi lưu chương:", err);
//             alert("Không lưu được chương, vui lòng thử lại!");
//         }
//     };

//     return (
//         <Box
//             sx={{
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 minHeight: "100vh",
//                 background: "rgba(0,0,0,0.4)",
//                 position: "fixed",
//                 inset: 0,
//                 zIndex: 1000,
//             }}
//         >
//             <Card sx={{ width: 600, borderRadius: 3 }}>
//                 <CardContent sx={{ p: 3 }}>
//                     <Typography
//                         variant="h6"
//                         fontWeight="bold"
//                         textAlign="center"
//                         sx={{ mb: 2, color: "#8B0000" }}
//                     >
//                         {chapter ? "✏️ Chỉnh Sửa Chương" : "➕ Thêm Chương Mới"}
//                     </Typography>

//                     <form onSubmit={handleSubmit}>
//                         <TextField
//                             label="Số chương"
//                             type="number"
//                             fullWidth
//                             value={chapterNumber}
//                             onChange={(e) => setChapterNumber(e.target.value)}
//                             sx={{ mb: 2 }}
//                         />

//                         <TextField
//                             label="Tiêu đề chương"
//                             fullWidth
//                             value={title}
//                             onChange={(e) => setTitle(e.target.value)}
//                             sx={{ mb: 2 }}
//                         />

//                         <TextField
//                             label="Nội dung"
//                             fullWidth
//                             multiline
//                             rows={6}
//                             value={content}
//                             onChange={(e) => setContent(e.target.value)}
//                             sx={{ mb: 3 }}
//                         />

//                         <Box sx={{ display: "flex", justifyContent: "space-between" }}>
//                             <Button
//                                 type="button"
//                                 variant="outlined"
//                                 color="secondary"
//                                 onClick={onClose}
//                                 sx={{ borderRadius: 2 }}
//                             >
//                                 Hủy
//                             </Button>
//                             <Button
//                                 type="submit"
//                                 variant="contained"
//                                 sx={{
//                                     backgroundColor: "#8B0000",
//                                     "&:hover": { backgroundColor: "#A52A2A" },
//                                     borderRadius: 2,
//                                 }}
//                             >
//                                 {chapter ? "Lưu chỉnh sửa" : "Lưu chương"}
//                             </Button>
//                         </Box>
//                     </form>
//                 </CardContent>
//             </Card>
//         </Box>
//     );
// };

// export default FormChuong;


import React, { useState, useEffect } from "react";
import { ref, set, update, remove, query, orderByChild, equalTo, get } from "firebase/database";
import { db } from "../../services/firebase";
import { v4 as uuidv4 } from "uuid";
import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
    Typography,
} from "@mui/material";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// 🔥 Toolbar giống Word
const modules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
    ],
};

const FormChuong = ({ bookId, currentUserId, userRole, onClose, chapter, chapters }) => {
    const [chapterNumber, setChapterNumber] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState(""); // HTML
    const deleteCommentsOfChapter = async (bookId, chapterId) => {
        try {
            if (!bookId || !chapterId) return;

            const commentsRef = ref(db, "Comments");
            const snapshot = await get(commentsRef);

            if (snapshot.exists()) {
                const deletes = [];
                snapshot.forEach((childSnap) => {
                    const data = childSnap.val();
                    if (data.BookId === bookId && data.ChapterId === chapterId) {
                        deletes.push(remove(ref(db, `Comments/${childSnap.key}`)));
                    }
                });
                await Promise.all(deletes);
                console.log("✅ Đã xóa tất cả comment của chương!");
            } else {
                console.log("⚠️ Chương này chưa có comment!");
            }
        } catch (err) {
            console.error("❌ Lỗi khi xóa comment:", err);
        }
    };


    useEffect(() => {
        if (chapter) {
            // Nếu đang sửa chương → load dữ liệu cũ
            setChapterNumber(chapter.ChapterNumber || "");
            setTitle(chapter.Title || "");
            setContent(chapter.Content || "");
        } else if (chapters && chapters.length > 0) {
            // Nếu thêm mới → tự động lấy chương lớn nhất + 1
            const maxChap = Math.max(...chapters.map(c => c.ChapterNumber));
            setChapterNumber(maxChap + 1);
        } else {
            // Nếu chưa có chương nào
            setChapterNumber(1);
        }
    }, [chapter, chapters]);

    // Load chương khi chỉnh sửa
    useEffect(() => {
        if (chapter) {
            setChapterNumber(chapter.ChapterNumber || "");
            setTitle(chapter.Title || "");
            setContent(chapter.Content || ""); // HTML
        }
    }, [chapter]);

    // Lưu chương
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!chapterNumber || !title || !content.trim()) {
            alert("⚠️ Vui lòng nhập đầy đủ nội dung!");
            return;
        }

        try {
            const htmlContent = content;

            if (chapter) {
                await deleteCommentsOfChapter(bookId, chapter.Id);
                // Cập nhật chương
                const chapterRef = ref(db, `Chapters/${chapter.Id}`);
                await update(chapterRef, {
                    ChapterNumber: parseInt(chapterNumber),
                    Title: title,
                    Content: htmlContent,
                    UpdatedAt: new Date().toISOString(),
                    IsApproved: false,
                    Rejected: false,
                });

                alert("✏️ Cập nhật chương thành công, comment cũ đã bị xóa!");
            } else {
                // Thêm chương mới
                const newId = uuidv4();
                const chapterRef = ref(db, `Chapters/${newId}`);

                await set(chapterRef, {
                    Id: newId,
                    BookId: bookId,
                    ChapterNumber: parseInt(chapterNumber),
                    Title: title,
                    Content: htmlContent,
                    CreatedAt: new Date().toISOString(),
                    UpdatedAt: new Date().toISOString(),
                    IsApproved: false,
                    Rejected: false,
                    AuthorId: currentUserId,
                    AuthorRole: userRole,
                });

                alert("✅ Thêm chương thành công (đang chờ duyệt)!");
            }

            onClose && onClose();
        } catch (e) {
            console.error("❌ Lỗi khi lưu chương:", e);
            alert("Lỗi khi lưu chương!");
        }
    };

    return (
        <Box
            sx={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 2000,
            }}
        >
            <Card sx={{ width: 750, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        variant="h6"
                        textAlign="center"
                        fontWeight="bold"
                        sx={{ mb: 2, color: "#8B0000" }}
                    >
                        {chapter ? "✏️ Chỉnh sửa chương" : "➕ Thêm chương mới"}
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Số chương"
                            type="number"
                            fullWidth
                            value={chapterNumber}
                            onChange={(e) => setChapterNumber(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                readOnly: !chapter, // 🔹 khóa khi thêm mới, mở khi chỉnh sửa
                            }}
                        />

                        <TextField
                            label="Tiêu đề chương"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <ReactQuill
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            theme="snow"
                            style={{
                                height: "250px",
                                background: "#fff",
                                marginBottom: "60px",
                            }}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 2,
                            }}
                        >
                            <Button
                                type="button"
                                variant="outlined"
                                color="secondary"
                                onClick={onClose}
                                sx={{ borderRadius: 2 }}
                            >
                                Hủy
                            </Button>

                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    backgroundColor: "#8B0000",
                                    "&:hover": { backgroundColor: "#A52A2A" },
                                    borderRadius: 2,
                                }}
                            >
                                {chapter ? "Lưu chỉnh sửa" : "Lưu chương"}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default FormChuong;
