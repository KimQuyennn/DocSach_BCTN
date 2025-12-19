import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../services/firebase";
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    Pagination,
} from "@mui/material";

const DuyetChuong = () => {
    const [pendingChapters, setPendingChapters] = useState([]);
    const [books, setBooks] = useState({});
    // eslint-disable-next-line no-unused-vars
    const [users, setUsers] = useState({});
    const [openChapter, setOpenChapter] = useState(null);
    const [page, setPage] = useState(1);
    const perPage = 6;
    const [bannedWords, setBannedWords] = useState([]);
    const [checkResult, setCheckResult] = useState(null);
    const [hasSensitive, setHasSensitive] = useState(false);

    // 🔹 Load Books
    useEffect(() => {
        const bookRef = ref(db, "Books");
        onValue(bookRef, (snap) => {
            const data = snap.val() || {};
            setBooks(data);
        });
    }, []);

    // 🔹 Load Users
    useEffect(() => {
        const userRef = ref(db, "Users");
        onValue(userRef, (snap) => {
            const data = snap.val() || {};
            setUsers(data);
        });
    }, []);

    // 🔹 Load chương chờ duyệt
    useEffect(() => {
        const chapRef = ref(db, "Chapters");
        onValue(chapRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.values(data).filter((c) => !c.IsApproved && !c.Rejected);
            list.sort((a, b) => {
                // Lấy thời gian cập nhật/tạo (ưu tiên UpdatedAt nếu có)
                const dateA = new Date(a.UpdatedAt || a.CreatedAt).getTime();
                const dateB = new Date(b.UpdatedAt || b.CreatedAt).getTime();

                // Sắp xếp tăng dần (dateA - dateB) để chương cũ nhất đứng đầu
                return dateA - dateB;
            });
            setPendingChapters(list);
        });
    }, []);

    // 🔹 Load từ cấm
    useEffect(() => {
        const wordsRef = ref(db, "SensitiveWords");
        onValue(wordsRef, (snap) => {
            const data = snap.val() || {};
            setBannedWords(Object.values(data));
        });
    }, []);

    // 🔹 Duyệt chương
    const handleApprove = async (chapterId) => {
        // const chapRef = ref(db, `Chapters/${chapterId}`);
        // await update(chapRef, { IsApproved: true, Rejected: false });
        // alert("✅ Chương đã được duyệt!");
        // setOpenChapter(null);

        const chapRef = ref(db, `Chapters/${chapterId}`);
        await update(chapRef, { IsApproved: true, Rejected: false });

        // -----------------------
        // 🔥 GỬI THÔNG BÁO
        // -----------------------
        const book = books[openChapter.BookId];
        if (!book) return;

        const uploader = book.UploaderId;

        const notiKey = Date.now().toString();
        const newNotification = {
            title: "Chương đã được duyệt!",
            message: `Chương ${openChapter.ChapterNumber} - "${openChapter.Title}" trong sách "${book.Title}" đã được admin duyệt.`,
            type: "approve_chapter",
            bookId: openChapter.BookId,
            chapterId: openChapter.Id,
            createdAt: Date.now(),
            read: false
        };

        await update(ref(db, `Notifications/${uploader}/${notiKey}`), newNotification);

        // ---------------------------------------------------------
        // 🔥 GỬI THÔNG BÁO CHO NHỮNG NGƯỜI DÙNG ĐÃ ĐỌC QUYỂN SÁCH
        // ---------------------------------------------------------
        const historyRef = ref(db, "ReadingHistory");
        onValue(historyRef, async (snap) => {
            const data = snap.val() || {};

            // Duyệt tất cả record trong ReadingHistory
            for (const key of Object.keys(data)) {
                const item = data[key];

                // Nếu record đó là của quyển đang duyệt
                if (item.BookId === openChapter.BookId) {

                    const userId = item.UserId;

                    const notiKey2 = Date.now().toString() + "_" + userId;

                    const userNotification = {
                        title: "Sách bạn đang đọc có chương mới!",
                        message: `Quyển "${book.Title}" vừa có chương mới: Chương ${openChapter.ChapterNumber} - "${openChapter.Title}".`,
                        type: "new_chapter_in_reading_book",
                        bookId: openChapter.BookId,
                        chapterId: openChapter.Id,
                        createdAt: Date.now(),
                        read: false
                    };

                    await update(
                        ref(db, `Notifications/${userId}/${notiKey2}`),
                        userNotification
                    );
                }
            }
        }, { onlyOnce: true });


        alert("✅ Chương đã được duyệt!");
        setOpenChapter(null);
    };

    // 🔹 Từ chối chương
    const handleReject = async (chapterId) => {
        // const reason = window.prompt("Nhập lý do từ chối chương này:");
        // if (!reason) return; // Nếu không nhập thì hủy
        // const chapRef = ref(db, `Chapters/${chapterId}`);
        // await update(chapRef, { IsApproved: false, Rejected: true, RejectedReason: reason });
        // alert("❌ Chương đã bị từ chối!");
        // setOpenChapter(null);

        const reason = window.prompt("Nhập lý do từ chối chương này:");
        if (!reason) return;

        const chapRef = ref(db, `Chapters/${chapterId}`);
        await update(chapRef, {
            IsApproved: false,
            Rejected: true,
            RejectedReason: reason
        });

        // -----------------------
        // 🔥 GỬI THÔNG BÁO
        // -----------------------
        const book = books[openChapter.BookId];
        if (!book) return;

        const uploader = book.UploaderId;

        const notiKey = Date.now().toString();
        const newNotification = {
            title: "Chương bị từ chối",
            message: `Chương ${openChapter.ChapterNumber} - "${openChapter.Title}" trong sách "${book.Title}" đã bị từ chối.\nLý do: ${reason}`,
            type: "reject_chapter",
            bookId: openChapter.BookId,
            chapterId: openChapter.Id,
            reason,
            createdAt: Date.now(),
            read: false
        };

        await update(ref(db, `Notifications/${uploader}/${notiKey}`), newNotification);

        alert("❌ Chương đã bị từ chối!");
        setOpenChapter(null);
    };

    // 🔹 Rút gọn tên chương
    const truncateWords = (text, maxWords) => {
        if (!text) return "";
        const words = text.split(" ");
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(" ") + "...";
    };

    // 🔹 Kiểm tra từ nhạy cảm
    // 🔹 Kiểm tra từ nhạy cảm
    const handleCheckContent = async () => {
        if (!openChapter) return;
        let content = openChapter.Content || "";
        let lowerContent = content.toLowerCase();
        let found = false;

        // 🔹 1. Check từ nhạy cảm từ Firebase
        bannedWords.forEach((word) => {
            const regex = new RegExp(`\\b(${word})\\b`, "gi");
            if (regex.test(lowerContent)) {
                found = true;
                content = content.replace(
                    regex,
                    `<span style="color:red; font-weight:bold;">$1</span>`
                );
            }
        });

        // 🔹 2. Check từ nhạy cảm từ API
        try {
            const res = await fetch("https://your-api.com/check-sensitive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: content }),
            });
            const apiWords = await res.json(); // API trả về danh sách từ nhạy cảm trong text
            if (Array.isArray(apiWords) && apiWords.length > 0) {
                found = true;
                apiWords.forEach((word) => {
                    const regex = new RegExp(`\\b(${word})\\b`, "gi");
                    content = content.replace(
                        regex,
                        `<span style="color:orange; font-weight:bold;">$1</span>`
                    );
                });
            }
        } catch (err) {
            console.error("Lỗi gọi API kiểm tra từ nhạy cảm:", err);
        }

        setHasSensitive(found);
        setCheckResult(content);
    };


    // 🔹 Tính phân trang
    const totalPages = Math.ceil(pendingChapters.length / perPage);
    const startIndex = (page - 1) * perPage;
    const currentChapters = pendingChapters.slice(startIndex, startIndex + perPage);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: "#8B0000" }}>
                📚 Danh sách chương chờ duyệt
            </Typography>

            <Grid container spacing={2}>
                {currentChapters.map((chap) => {
                    const book = books[chap.BookId];

                    return (
                        <Grid item xs={12} sm={6} md={4} key={chap.Id}>
                            <Card
                                sx={{
                                    borderRadius: 3,
                                    boxShadow: 3,
                                    width: "378px",   // ~10cm
                                    height: "265px",  // ~7cm
                                    display: "flex",
                                    flexDirection: "column",
                                    margin: "0 auto", // căn giữa
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1, overflow: "hidden" }}>
                                    {/* Ảnh bìa + thông tin sách */}
                                    <Box sx={{ display: "flex", mb: 2 }}>
                                        <img
                                            src={
                                                book?.CoverImage ||
                                                "https://via.placeholder.com/80x120?text=No+Image"
                                            }
                                            alt={book?.Title}
                                            style={{
                                                width: 80,
                                                height: 120,
                                                borderRadius: 6,
                                                objectFit: "cover",
                                                marginRight: 12,
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="h6" noWrap>
                                                {book?.Title || "Không rõ sách"}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                            >
                                                ✍️ {book?.Author || "Chưa rõ tác giả"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            color: "#5D4037",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {`Chương ${chap.ChapterNumber}: ${truncateWords(
                                            chap.Title,
                                            5
                                        )}`}
                                    </Typography>
                                </CardContent>

                                {/* Nút thao tác */}
                                <Box sx={{ display: "flex", gap: 1, p: 2, pt: 0 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setCheckResult(null);
                                            setHasSensitive(false);
                                            setOpenChapter(chap);
                                        }}
                                    >
                                        👁️ Đọc
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>


            {/* Phân trang */}
            {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, val) => setPage(val)}
                        color="primary"
                    />
                </Box>
            )}

            {/* 🔹 Popup đọc chương */}
            <Dialog
                open={!!openChapter}
                onClose={() => setOpenChapter(null)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    {openChapter
                        ? `Chương ${openChapter.ChapterNumber}: ${openChapter.Title}`
                        : ""}
                </DialogTitle>
                <DialogContent dividers>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: checkResult || openChapter?.Content,
                        }}
                        style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}
                    />

                    {/* Nút kiểm tra */}
                    <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                        <Button
                            variant="outlined"
                            color="warning"
                            onClick={handleCheckContent}
                        >
                            🔍 Kiểm tra từ nhạy cảm
                        </Button>
                    </Box>

                    {/* Nút duyệt / từ chối */}
                    <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: "#2E7D32",
                                "&:hover": { backgroundColor: "#1B5E20" },
                            }}
                            disabled={hasSensitive}
                            onClick={() => handleApprove(openChapter.Id)}
                        >
                            ✅ Duyệt
                        </Button>

                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleReject(openChapter.Id)}
                        >
                            ❌ Từ chối
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default DuyetChuong;
