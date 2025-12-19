// import React, { useEffect, useState } from "react";
// import { ref, onValue, remove } from "firebase/database";
// import { db } from "../../services/firebase";
// import {
//     Button,
//     Card,
//     CardContent,
//     CardMedia,
//     Typography,
//     Grid,
//     IconButton,
//     Box,
//     Pagination,
//     TextField,
//     InputAdornment,
//     Chip,
//     Select,
//     MenuItem,
//     FormControl,
//     InputLabel
// } from "@mui/material";
// import { Delete, Edit, Search } from "@mui/icons-material";
// import FormSach from "./FormSach";
// import { useNavigate } from "react-router-dom";

// export default function TheSachAdmin({ selectedGenre }) {
//     const [books, setBooks] = useState([]);
//     const [openForm, setOpenForm] = useState(false);
//     const [selectedBook, setSelectedBook] = useState(null);

//     const navigate = useNavigate();
//     // phân trang
//     const [page, setPage] = useState(1);
//     const booksPerPage = 8;

//     // tìm kiếm + lọc trạng thái
//     const [searchTerm, setSearchTerm] = useState("");
//     const [statusFilter, setStatusFilter] = useState("all");

//     // Load danh sách sách
//     useEffect(() => {
//         const booksRef = ref(db, "Books");
//         onValue(booksRef, (snapshot) => {
//             const data = snapshot.val() || {};
//             const list = Object.keys(data).map((key) => ({
//                 Id: key,
//                 ...data[key],
//             }));
//             setBooks(list);
//         });
//     }, []);

//     // Xóa sách
//     const handleDelete = async (id) => {
//         if (window.confirm("Bạn có chắc chắn muốn xóa sách này?")) {
//             await remove(ref(db, "Books/" + id));
//         }
//     };

//     // Sửa
//     const handleEdit = (book) => {
//         setSelectedBook(book);
//         setOpenForm(true);
//     };

//     // Thêm
//     // const handleAdd = () => {
//     //     setSelectedBook(null);
//     //     setOpenForm(true);
//     // };

//     // Lọc sách theo thể loại + tìm kiếm + trạng thái
//     const filteredBooks = books.filter((b) => {
//         const matchGenre =
//             selectedGenre === "all" ? true : b.GenreId === selectedGenre;

//         const matchSearch =
//             b.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             b.Author?.toLowerCase().includes(searchTerm.toLowerCase());

//         const matchStatus =
//             statusFilter === "all"
//                 ? true
//                 : b.Status === statusFilter;

//         return matchGenre && matchSearch && matchStatus;
//     });

//     // cắt theo trang
//     const startIndex = (page - 1) * booksPerPage;
//     const paginatedBooks = filteredBooks.slice(startIndex, startIndex + booksPerPage);
//     const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

//     // hàm rút gọn tiêu đề (3 từ)
//     const truncateTitle = (title) => {
//         if (!title) return "";
//         const words = title.split(" ");
//         if (words.length <= 3) return title;
//         return words.slice(0, 3).join(" ") + "...";
//     };

//     return (
//         <div>
//             {/* Thanh tìm kiếm + bộ lọc trạng thái */}
//             <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
//                 <TextField
//                     placeholder="🔍 Tìm kiếm sách..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     variant="outlined"
//                     sx={{
//                         flex: 1,
//                         "& .MuiOutlinedInput-root": {
//                             borderRadius: "30px",
//                             height: "50px",
//                             fontSize: "1rem",
//                             paddingLeft: "15px",
//                         },
//                     }}
//                     InputProps={{
//                         startAdornment: (
//                             <InputAdornment position="start">
//                                 <Search />
//                             </InputAdornment>
//                         ),
//                     }}
//                 />

//                 {/* Bộ lọc trạng thái */}
//                 <FormControl sx={{ minWidth: 160 }}>
//                     <InputLabel>Trạng thái</InputLabel>
//                     <Select
//                         value={statusFilter}
//                         onChange={(e) => setStatusFilter(e.target.value)}
//                         label="Trạng thái"
//                         sx={{ borderRadius: "30px", height: "50px" }}
//                     >
//                         <MenuItem value="all">Tất cả</MenuItem>
//                         <MenuItem value="Hoàn thành">Hoàn thành</MenuItem> {/* ✅ đúng giá trị DB */}
//                         <MenuItem value="Đang cập nhật">Đang cập nhật</MenuItem> {/* ✅ đúng giá trị DB */}
//                     </Select>
//                 </FormControl>


//                 <Button
//                     variant="contained"
//                     onClick={() => navigate("/dang-tai-sach")}
//                     sx={{
//                         bgcolor: "#8B0000",
//                         px: 3,
//                         fontSize: "1rem",
//                         borderRadius: "30px",
//                         "&:hover": { bgcolor: "#A52A2A" },
//                     }}
//                 >
//                     📚 Đăng tải sách
//                 </Button>

//             </Box>

//             <Grid container spacing={2}>
//                 {paginatedBooks.map((book) => (
//                     <Grid item xs={12} sm={6} md={4} lg={3} key={book.Id}>
//                         <Card
//                             sx={{
//                                 width: "7cm",
//                                 height: "10cm",
//                                 display: "flex",
//                                 flexDirection: "column",
//                                 position: "relative",
//                             }}
//                         >
//                             {/* Nhãn trạng thái */}
//                             {book.Status && (
//                                 <Chip
//                                     label={book.Status}  // ✅ lấy trực tiếp từ DB
//                                     color={book.Status === "Hoàn thành" ? "success" : "warning"}
//                                     size="small"
//                                     sx={{
//                                         position: "absolute",
//                                         top: 8,
//                                         left: 8,
//                                         fontSize: "0.7rem",
//                                         fontWeight: "bold",
//                                     }}
//                                 />
//                             )}

//                             {book.CoverImage && (
//                                 <CardMedia
//                                     component="img"
//                                     sx={{
//                                         width: "100%",
//                                         height: "60%", // ảnh chiếm khoảng 60% khung
//                                         objectFit: "cover",
//                                     }}
//                                     image={book.CoverImage}
//                                     alt={book.Title}
//                                 />
//                             )}

//                             <CardContent
//                                 sx={{
//                                     flex: 1,
//                                     display: "flex",
//                                     flexDirection: "column",
//                                     justifyContent: "space-between",
//                                     padding: "8px",
//                                 }}
//                             >
//                                 <Box>
//                                     <Typography
//                                         variant="h6"
//                                         sx={{
//                                             fontSize: "0.85rem",
//                                             fontWeight: "bold",
//                                             overflow: "hidden",
//                                             textOverflow: "ellipsis",
//                                             whiteSpace: "nowrap",
//                                         }}
//                                     >
//                                         {truncateTitle(book.Title)}
//                                     </Typography>
//                                     <Typography
//                                         variant="body2"
//                                         color="text.secondary"
//                                         noWrap
//                                         sx={{ fontSize: "0.75rem" }}
//                                     >
//                                         {book.Author}
//                                     </Typography>
//                                 </Box>
//                                 <Box sx={{ display: "flex", gap: 1 }}>
//                                     <IconButton size="small" onClick={() => handleEdit(book)}>
//                                         <Edit fontSize="small" />
//                                     </IconButton>
//                                     <IconButton size="small" onClick={() => handleDelete(book.Id)}>
//                                         <Delete fontSize="small" />
//                                     </IconButton>
//                                 </Box>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                 ))}
//             </Grid>

//             {/* ✅ Phân trang */}
//             {totalPages > 1 && (
//                 <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
//                     <Pagination
//                         count={totalPages}
//                         page={page}
//                         onChange={(e, value) => setPage(value)}
//                         color="primary"
//                         size="large"
//                     />
//                 </Box>
//             )}

//             {/* Form thêm/sửa */}
//             <FormSach
//                 open={openForm}
//                 onClose={() => setOpenForm(false)}
//                 book={selectedBook}
//             />
//         </div>
//     );
// }



import React, { useEffect, useState } from "react";
import { ref, onValue, remove, update } from "firebase/database"; // Thêm update
import { db } from "../../services/firebase";
import {
    Button,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Grid,
    IconButton,
    Box,
    Pagination,
    TextField,
    InputAdornment,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip // Thêm Tooltip
} from "@mui/material";
import { Delete, Edit, Search, Gavel } from "@mui/icons-material"; // Thêm Gavel
import FormSach from "./FormSach";
import { useNavigate } from "react-router-dom";

// Định nghĩa props mới
export default function TheSachAdmin({ selectedGenre, copyrightFilter }) {
    const [books, setBooks] = useState([]);
    const [openForm, setOpenForm] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const navigate = useNavigate();
    // phân trang
    const [page, setPage] = useState(1);
    const booksPerPage = 8;

    // tìm kiếm + lọc trạng thái
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Load danh sách sách
    useEffect(() => {
        const booksRef = ref(db, "Books");
        onValue(booksRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.keys(data).map((key) => ({
                Id: key,
                ...data[key],
            }));
            setBooks(list);
        });
    }, []);
    useEffect(() => {
        // Chỉ chạy logic này khi books đã được tải
        if (books.length === 0) return;

        books.forEach(async (book) => {
            // Chỉ xử lý sách CÓ bản quyền và CHƯA được đánh dấu đã thông báo Sắp Hết Hạn
            if (book.HasCopyright === true && book.IsExpiredSoonNotified !== true) {

                const remainingDays = getRemainingDays(book.CopyrightExpiration);
                const isExpiredSoon = checkCopyrightStatus(book.CopyrightExpiration) === "expired_soon";

                // Gửi thông báo khi Sắp Hết Hạn (ví dụ: còn 30 ngày)
                if (isExpiredSoon && remainingDays <= 30) {
                    try {
                        // Gửi thông báo cho người đăng
                        await createNotification(
                            book.UploaderId,
                            "🔔 Bản quyền Sắp hết hạn",
                            `Sách "${book.Title}" của bạn sẽ hết bản quyền sau ${remainingDays} ngày. Vui lòng cập nhật tài liệu bản quyền mới.`,
                            "expired_soon_warning"
                        );

                        // Đánh dấu sách đã được thông báo Sắp Hết Hạn để không gửi lại
                        await update(ref(db, `Books/${book.Id}`), {
                            IsExpiredSoonNotified: true,
                        });

                        console.log(`Đã gửi cảnh báo Sắp Hết Hạn cho sách: ${book.Title}`);
                    } catch (error) {
                        console.error("Lỗi gửi thông báo Sắp Hết Hạn:", error);
                    }
                }
            }
        });
    }, [books]);

    // Hàm kiểm tra bản quyền
    const getRemainingDays = (expirationDate) => {
        if (!expirationDate) return Infinity;

        // Chuẩn hóa định dạng từ DD/MM/YYYY sang MM/DD/YYYY
        const parts = expirationDate.split('/');
        if (parts.length !== 3) return Infinity;

        const standardizedDate = `${parts[1]}/${parts[0]}/${parts[2]}`;
        const expiry = new Date(standardizedDate);

        if (isNaN(expiry.getTime())) return Infinity;

        const now = new Date();
        // Đặt giờ/phút/giây của ngày hiện tại về 0
        now.setHours(0, 0, 0, 0);
        expiry.setHours(23, 59, 59, 999); // Tính đến cuối ngày hết hạn

        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Cập nhật hàm kiểm tra trạng thái để sử dụng hàm trên
    const checkCopyrightStatus = (expirationDate) => {
        if (!expirationDate) return "unknown";

        const diffDays = getRemainingDays(expirationDate); // Sử dụng hàm mới

        if (diffDays <= 0) {
            return "expired"; // Đã hết hạn (hoặc hết hạn trong ngày hôm nay)
        } else if (diffDays <= 90) {
            return "expired_soon"; // Sắp hết hạn (trong 90 ngày)
        } else if (diffDays !== Infinity) {
            return "valid"; // Còn hạn
        }
        return "unknown"; // Ngày không hợp lệ hoặc không có
    };

    // Hàm tạo thông báo
    const createNotification = async (userId, title, message, type) => {
        const newNotification = {
            title: title,
            message: message,
            type: type,
            createdAt: Date.now(),
            read: false
        };
        const newNotiKey = Date.now().toString();
        await update(ref(db, `Notifications/${userId}/${newNotiKey}`), newNotification);
    };

    // Chức năng Từ chối Bản quyền (Set IsApproved: false, Status: "Từ chối")
    const handleRejectCopyright = async (book) => {
        if (!window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI Bản quyền sách "${book.Title}" (ID: ${book.Id})? Sách sẽ bị gỡ.`)) {
            return;
        }

        try {
            await update(ref(db, `Books/${book.Id}`), {
                IsApproved: false,
                Status: "Từ chối"
            });

            // Gửi thông báo cho người đăng
            await createNotification(
                book.UploaderId,
                "🚨 Sách bị Gỡ (Hết hạn Bản quyền)",
                `Sách "${book.Title}" của bạn đã bị gỡ khỏi thư viện vì bản quyền đã hết hạn.`,
                "reject_copyright"
            );
            alert(`Sách "${book.Title}" đã bị TỪ CHỐI Bản quyền và gỡ bỏ.`);
        } catch (error) {
            console.error("Lỗi từ chối bản quyền:", error);
            alert("Lỗi khi từ chối bản quyền.");
        }
    };


    // Xóa sách
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sách này?")) {
            await remove(ref(db, "Books/" + id));
        }
    };

    // Sửa
    const handleEdit = (book) => {
        setSelectedBook(book);
        setOpenForm(true);
    };

    // Lọc sách theo thể loại + tìm kiếm + trạng thái + BẢN QUYỀN
    const filteredBooks = books.filter((b) => {
        const matchGenre =
            selectedGenre === "all" ? true : b.GenreId === selectedGenre;

        const matchSearch =
            b.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.Author?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchStatus =
            statusFilter === "all"
                ? true
                : b.Status === statusFilter;

        // Logic lọc theo Bản quyền
        let matchCopyright = true;
        const isCopyrightBook = b.HasCopyright === true;
        const copyrightStatus = isCopyrightBook ? checkCopyrightStatus(b.CopyrightExpiration) : "non_copyrighted";

        if (copyrightFilter === "copyrighted") { // Chỉ hiển thị sách CÓ bản quyền
            matchCopyright = isCopyrightBook;
        } else if (copyrightFilter === "non_copyrighted") { // Chỉ hiển thị sách KHÔNG bản quyền
            matchCopyright = !isCopyrightBook;
        } else if (copyrightFilter === "expired_soon") { // Sắp hết hạn
            matchCopyright = copyrightStatus === "expired_soon";
        } else if (copyrightFilter === "expired") { // Đã hết hạn
            matchCopyright = copyrightStatus === "expired";
        }
        // "all" thì luôn là true

        return matchGenre && matchSearch && matchStatus && matchCopyright;
    }).sort((a, b) => { // Sắp xếp sách hết hạn lên đầu khi lọc "all"
        const statusA = checkCopyrightStatus(a.CopyrightExpiration);
        const statusB = checkCopyrightStatus(b.CopyrightExpiration);

        if (statusA === "expired" && statusB !== "expired") return -1;
        if (statusA !== "expired" && statusB === "expired") return 1;
        if (statusA === "expired_soon" && statusB !== "expired" && statusB !== "expired_soon") return -1;
        if (statusA !== "expired" && statusA !== "expired_soon" && statusB === "expired_soon") return 1;
        return 0;
    });

    // cắt theo trang
    const startIndex = (page - 1) * booksPerPage;
    const paginatedBooks = filteredBooks.slice(startIndex, startIndex + booksPerPage);
    const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

    // hàm rút gọn tiêu đề (3 từ)
    const truncateTitle = (title) => {
        if (!title) return "";
        const words = title.split(" ");
        if (words.length <= 3) return title;
        return words.slice(0, 3).join(" ") + "...";
    };

    return (
        <div>
            {/* Thanh tìm kiếm + bộ lọc trạng thái */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
                {/* ... (Giữ nguyên phần tìm kiếm và lọc trạng thái) */}
                <TextField
                    placeholder="🔍 Tìm kiếm sách..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    sx={{
                        flex: 1,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "30px",
                            height: "50px",
                            fontSize: "1rem",
                            paddingLeft: "15px",
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Bộ lọc trạng thái */}
                <FormControl sx={{ minWidth: 160 }}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Trạng thái"
                        sx={{ borderRadius: "30px", height: "50px" }}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
                        <MenuItem value="Đang cập nhật">Đang cập nhật</MenuItem>
                    </Select>
                </FormControl>


                <Button
                    variant="contained"
                    onClick={() => navigate("/dang-tai-sach")}
                    sx={{
                        bgcolor: "#8B0000",
                        px: 3,
                        fontSize: "1rem",
                        borderRadius: "30px",
                        "&:hover": { bgcolor: "#A52A2A" },
                    }}
                >
                    📚 Đăng tải sách
                </Button>

            </Box>

            <Grid container spacing={2}>
                {paginatedBooks.map((book) => {
                    const isCopyrightBook = book.HasCopyright === true;
                    const cpyStatus = checkCopyrightStatus(book.CopyrightExpiration);
                    const isExpired = cpyStatus === "expired";
                    const isExpiredSoon = cpyStatus === "expired_soon";
                    const remainingDays = getRemainingDays(book.CopyrightExpiration);

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={book.Id}>
                            <Card
                                sx={{
                                    width: "7cm",
                                    height: "10cm",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                }}
                            >
                                {/* Nhãn trạng thái */}
                                {book.Status && (
                                    <Chip
                                        label={book.Status}
                                        color={book.Status === "Hoàn thành" ? "success" : "warning"}
                                        size="small"
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            left: 8,
                                            fontSize: "0.7rem",
                                            fontWeight: "bold",
                                            zIndex: 1
                                        }}
                                    />
                                )}

                                {/* Nhãn Bản quyền */}
                                {isCopyrightBook && (
                                    <Chip
                                        label={
                                            isExpired
                                                ? "HẾT BẢN QUYỀN"
                                                : isExpiredSoon
                                                    ? `SẮP HẾT (${remainingDays} ngày)`
                                                    : "CÓ BẢN QUYỀN"
                                        }
                                        color={isExpired ? "error" : isExpiredSoon ? "secondary" : "info"}
                                        size="small"
                                        sx={{
                                            position: "absolute",
                                            top: isExpired || isExpiredSoon ? 35 : 8, // Dịch chuyển nếu có trạng thái
                                            right: 8,
                                            left: isExpired || isExpiredSoon ? 8 : undefined,
                                            backgroundColor: isExpired ? "#d32f2f" : isExpiredSoon ? "#ff9800" : "#0288d1",
                                            color: 'white',
                                            fontSize: "0.7rem",
                                            fontWeight: "bold",
                                            zIndex: 1
                                        }}
                                    />
                                )}

                                {book.CoverImage && (
                                    <CardMedia
                                        component="img"
                                        sx={{
                                            width: "100%",
                                            height: "60%",
                                            objectFit: "cover",
                                        }}
                                        image={book.CoverImage}
                                        alt={book.Title}
                                    />
                                )}

                                <CardContent
                                    sx={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        padding: "8px",
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontSize: "0.85rem",
                                                fontWeight: "bold",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {truncateTitle(book.Title)}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            noWrap
                                            sx={{ fontSize: "0.75rem" }}
                                        >
                                            {book.Author}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", gap: 1, justifyContent: 'space-between' }}>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Tooltip title="Sửa sách">
                                                <IconButton size="small" onClick={() => handleEdit(book)}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa sách">
                                                <IconButton size="small" onClick={() => handleDelete(book.Id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        {/* Nút Từ chối Bản quyền cho sách HẾT HẠN */}
                                        {isExpired && (
                                            <Tooltip title="Từ chối Bản quyền (Sách sẽ bị gỡ)">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRejectCopyright(book)}
                                                >
                                                    <Gavel fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ✅ Phân trang */}
            {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, value) => setPage(value)}
                        color="primary"
                        size="large"
                        sx={{
                            "& .MuiPaginationItem-root": { color: "#8B0000" },
                            "& .Mui-selected": { bgcolor: "#8B0000", color: "#fff" }
                        }}
                    />
                </Box>
            )}

            {/* Form thêm/sửa */}
            <FormSach
                open={openForm}
                onClose={() => setOpenForm(false)}
                book={selectedBook}
            />
        </div>
    );
}