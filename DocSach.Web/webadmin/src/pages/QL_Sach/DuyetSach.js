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
    MenuItem,
    TextField,
    Chip,
    Pagination,
    Collapse,
    Divider,
    IconButton,
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';

const DuyetSach = () => {
    const [books, setBooks] = useState([]);
    const [genres, setGenres] = useState({}); // State mới để lưu tên thể loại
    const [filterRole, setFilterRole] = useState("all");
    const [expandedBookId, setExpandedBookId] = useState(null);

    // Phân trang
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [users, setUsers] = useState({});

    // 1. Load Users (Username, Role)
    useEffect(() => {
        const usersRef = ref(db, "Users");
        return onValue(usersRef, (snapshot) => {
            const userData = snapshot.val() || {};
            setUsers(userData);
        });
    }, []);

    const getUsername = (id) => users[id]?.Username || "Ẩn danh";
    const getUserRole = (id) => users[id]?.Role || "User";

    // 2. Load Genres (Id -> Name)
    useEffect(() => {
        const genreRef = ref(db, "Genres");
        return onValue(genreRef, (snapshot) => {
            const genreData = snapshot.val() || {};
            const genreMap = Object.keys(genreData).reduce((acc, key) => {
                acc[key] = genreData[key].Name;
                return acc;
            }, {});
            setGenres(genreMap);
        });
    }, []);

    // 3. Load Books cần duyệt
    useEffect(() => {
        const booksRef = ref(db, "Books");
        return onValue(booksRef, (snapshot) => {
            const data = snapshot.val() || {};
            const loaded = Object.keys(data).map((key) => ({
                Id: key, // Đảm bảo có Id
                ...data[key]
            }));
            // Lọc sách CHƯA được duyệt (IsApproved: false hoặc không tồn tại) và có Status không phải là "Từ chối"
            // Ta chỉ duyệt sách mới/cần duyệt. Nếu Status là "Từ chối" thì bỏ qua
            setBooks(loaded.filter((b) => !b.IsApproved && b.Status !== "Từ chối"));
        });
    }, []);

    // Cập nhật sách -> Duyệt
    const handleApprove = async (id) => {
        try {
            await update(ref(db, `Books/${id}`), {
                IsApproved: true,
                Status: "Đang cập nhật" // Sách đã được duyệt, bắt đầu chu trình cập nhật
            });

            // Lấy thông tin sách để tạo thông báo
            const book = books.find(b => b.Id === id);
            if (!book) return;

            const userId = book.UploaderId;
            const newNotification = {
                title: "🎉 Sách đã được duyệt!",
                message: `Sách "${book.Title}" của bạn đã được admin duyệt và phát hành.`,
                type: "approve_book",
                createdAt: Date.now(),
                read: false
            };

            const newNotiKey = Date.now().toString();
            await update(ref(db, `Notifications/${userId}/${newNotiKey}`), newNotification);
        } catch (error) {
            console.error("Lỗi duyệt sách:", error);
            alert("Duyệt sách thất bại!");
        }
    };

    // Cập nhật sách -> Từ chối
    const handleReject = async (id) => {
        try {
            await update(ref(db, `Books/${id}`), {
                IsApproved: false,
                Status: "Từ chối"
            });

            const book = books.find(b => b.Id === id);
            if (!book) return;

            const userId = book.UploaderId;
            const newNotification = {
                title: "❌ Sách bị từ chối",
                message: `Sách "${book.Title}" của bạn đã bị admin từ chối. Vui lòng kiểm tra lại nội dung.`,
                type: "reject_book",
                createdAt: Date.now(),
                read: false
            };

            const newNotiKey = Date.now().toString();
            await update(ref(db, `Notifications/${userId}/${newNotiKey}`), newNotification);
        } catch (error) {
            console.error("Lỗi từ chối sách:", error);
            alert("Từ chối sách thất bại!");
        }
    };

    // Mở/đóng phần chi tiết
    const handleExpand = (id) => {
        setExpandedBookId(expandedBookId === id ? null : id);
    };

    // Lọc sách theo Role người đăng
    const filteredBooks = books.filter((b) => {
        const role = getUserRole(b.UploaderId);

        if (filterRole === "all") return true;
        return role === filterRole;
    });

    const pageCount = Math.ceil(filteredBooks.length / itemsPerPage);
    const paginatedBooks = filteredBooks.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h4" sx={{ mb: 3, color: "#8B0000", fontWeight: 700 }}>
                Duyệt sách mới
            </Typography>

            <TextField
                select
                label="Lọc theo người đăng"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                sx={{ mb: 3, minWidth: 200 }}
            >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Quản lý">Quản lý</MenuItem>
                <MenuItem value="User">User</MenuItem>
            </TextField>

            <Grid container spacing={3}>
                {paginatedBooks.length === 0 ? (
                    <Grid item xs={12}>
                        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                            Không có sách nào cần duyệt.
                        </Typography>
                    </Grid>
                ) : (
                    paginatedBooks.map((book) => {
                        const uploaderRole = getUserRole(book.UploaderId);
                        const isCopyrightBook = book.HasCopyright === true;

                        return (
                            <Grid item xs={12} key={book.Id}>
                                <Card
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        p: 2,
                                        boxShadow: 3,
                                        borderRadius: 2,
                                        // Thêm hover effect cho toàn bộ card
                                    }}
                                >
                                    <Box sx={{ display: "flex", gap: 2 }} onClick={() => handleExpand(book.Id)} style={{ cursor: "pointer" }}>
                                        {/* Ảnh bìa sách */}
                                        {book.CoverImage ? (
                                            <Box
                                                component="img"
                                                src={book.CoverImage}
                                                alt={book.Title}
                                                sx={{
                                                    width: { xs: 80, md: 120 },
                                                    height: { xs: 120, md: 160 },
                                                    borderRadius: 2,
                                                    objectFit: "cover",
                                                    flexShrink: 0
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: { xs: 80, md: 120 },
                                                    height: { xs: 120, md: 160 },
                                                    borderRadius: 2,
                                                    backgroundColor: "#f2e5e0",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#777",
                                                    fontSize: 12,
                                                    textAlign: "center",
                                                    flexShrink: 0
                                                }}
                                            >
                                                Chưa có ảnh
                                            </Box>
                                        )}

                                        {/* Thông tin cơ bản */}
                                        <CardContent sx={{ flex: 1, p: 0 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {book.Title}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                                {book.Author || "Không có tác giả"}
                                            </Typography>

                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                                <Chip
                                                    label={book.Status || "Chờ duyệt"}
                                                    color="warning"
                                                    size="small"
                                                />
                                                {book.IsVIP && (
                                                    <Chip
                                                        label={`VIP - ${book.Price || 0} xu`}
                                                        color="secondary"
                                                        size="small"
                                                    />
                                                )}
                                                {isCopyrightBook && (
                                                    <Chip
                                                        label="Bản quyền"
                                                        color="info"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>


                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                Người đăng: <b>{getUsername(book.UploaderId)}</b> ({uploaderRole})
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {book.Id}
                                            </Typography>

                                            {/* Nút duyệt/từ chối */}
                                            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                <Button
                                                    variant="contained"
                                                    sx={{ bgcolor: "#8B0000", "&:hover": { bgcolor: "#a00000" } }}
                                                    onClick={(e) => { e.stopPropagation(); handleApprove(book.Id); }}
                                                    size="small"
                                                >
                                                    Duyệt
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={(e) => { e.stopPropagation(); handleReject(book.Id); }}
                                                    size="small"
                                                >
                                                    Từ chối
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Box>

                                    {/* Thông tin mở rộng */}
                                    <Collapse in={expandedBookId === book.Id} timeout="auto" unmountOnExit>
                                        <Divider sx={{ my: 2 }} />
                                        <Box sx={{ pl: { xs: 0, md: 2 } }}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <b>Mô tả:</b> {book.Description || "Không có mô tả"}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <b>Thể loại:</b> {genres[book.GenreId] || "Không rõ"}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <b>Hoàn thành:</b> {book.IsCompleted ? "Có" : "Không"}
                                            </Typography>
                                            {/* <Typography variant="body2" sx={{ mb: 1 }}>
                                                <b>Ngày tạo:</b> {new Date(book.CreatedAt).toLocaleDateString() || "Không rõ"}
                                            </Typography> */}

                                            {/* ✨ THÔNG TIN BẢN QUYỀN MỚI */}
                                            <Typography variant="body1" sx={{ mt: 2, fontWeight: 600, color: isCopyrightBook ? 'primary.main' : 'error.main' }}>
                                                Chi tiết Bản quyền: {isCopyrightBook ? "Sách có bản quyền" : "Sách tự viết"}
                                            </Typography>
                                            {isCopyrightBook && (
                                                <Box sx={{ ml: 2, mt: 1 }}>
                                                    <Typography variant="body2">
                                                        - **Nhà xuất bản:** {book.PublisherName || "Chưa cung cấp"}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        - **Hạn bản quyền:** {book.CopyrightExpiration || "Chưa cung cấp"}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                        <Typography variant="body2" sx={{ mr: 1 }}>
                                                            - **Tài liệu chứng minh:**
                                                        </Typography>
                                                        {book.CopyrightImage ? (
                                                            <IconButton
                                                                color="primary"
                                                                size="small"
                                                                onClick={(e) => { e.stopPropagation(); window.open(book.CopyrightImage, '_blank'); }}
                                                            >
                                                                <VisibilityIcon /> Xem ảnh
                                                            </IconButton>
                                                        ) : (
                                                            <Typography variant="body2" color="error">
                                                                Chưa cung cấp
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                            {/* END BẢN QUYỀN MỚI */}
                                        </Box>
                                    </Collapse>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>

            {/* Pagination */}
            {pageCount > 1 && (
                <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                    <Pagination
                        count={pageCount}
                        page={page}
                        onChange={(e, value) => setPage(value)}
                        color="primary"
                        sx={{
                            "& .MuiPaginationItem-root": { color: "#8B0000" },
                            "& .Mui-selected": { bgcolor: "#8B0000", color: "#fff" }
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default DuyetSach;