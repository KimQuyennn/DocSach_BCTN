import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, TextField,
    Dialog, DialogTitle, DialogContent,
    Button, List, ListItem, ListItemText,
    Avatar, Typography, Rating, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import { ref, onValue, update, off } from "firebase/database";
import { db } from "../services/firebase";

export default function QuanLyDanhGia() {
    const [books, setBooks] = useState([]);
    const [statistics, setStatistics] = useState({});
    const [ratings, setRatings] = useState([]);
    const [comments, setComments] = useState([]);
    const [users, setUsers] = useState({});
    const [chapters, setChapters] = useState({});
    const [filtered, setFiltered] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [visible, setVisible] = useState(false);
    const [sortBy, setSortBy] = useState("");
    const [searchValue, setSearchValue] = useState("");

    // Load dữ liệu realtime
    useEffect(() => {
        const booksRef = ref(db, "Books");
        const statsRef = ref(db, "Statistics");
        const ratingsRef = ref(db, "Ratings");
        const commentsRef = ref(db, "Comments");
        const usersRef = ref(db, "Users");
        const chaptersRef = ref(db, "Chapters");

        onValue(booksRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setBooks(Object.keys(data).map((id) => ({ id, ...data[id] })));
            }
        });

        onValue(statsRef, (snap) => {
            if (snap.exists()) setStatistics(snap.val());
        });

        onValue(ratingsRef, (snap) => {
            if (snap.exists()) setRatings(Object.values(snap.val()));
        });

        onValue(commentsRef, (snap) => {
            if (snap.exists()) setComments(Object.values(snap.val()));
        });

        onValue(usersRef, (snap) => {
            if (snap.exists()) setUsers(snap.val());
        });

        onValue(chaptersRef, (snap) => {
            if (snap.exists()) setChapters(snap.val());
        });

        return () => {
            off(booksRef);
            off(statsRef);
            off(ratingsRef);
            off(commentsRef);
            off(usersRef);
            off(chaptersRef);
        };
    }, []);

    // Xử lý lọc/sắp xếp
    useEffect(() => {
        const processedBooks = books.map((book) => {
            const stat = Object.values(statistics || {}).find((s) => s.BookId === book.id) || {};
            const bookRatings = ratings.filter((r) => r.BookId === book.id);
            const avgRating = bookRatings.length
                ? (bookRatings.reduce((sum, r) => sum + (r.Rating || 0), 0) / bookRatings.length).toFixed(1)
                : 0;

            const bookComments = comments.filter((c) => c.BookId === book.id);

            return {
                key: book.id,
                ...book,
                views: stat.TotalViews || 0,
                avgRating: Number(avgRating),
                ratingCount: bookRatings.length,
                totalComments: (stat.TotalComments || 0) + bookComments.length,
                ratings: bookRatings,
                comments: bookComments,
            };
        });

        let result = [...processedBooks];

        if (searchValue) {
            result = result.filter((b) =>
                b.Title?.toLowerCase().includes(searchValue.toLowerCase())
            );
        }

        if (sortBy === "views") {
            result.sort((a, b) => b.views - a.views);
        } else if (sortBy === "rating") {
            result.sort((a, b) => b.avgRating - a.avgRating);
        } else if (sortBy === "ratingCount") {
            result.sort((a, b) => b.ratingCount - a.ratingCount);
        } else if (sortBy === "comments") {
            result.sort((a, b) => b.totalComments - a.totalComments);
        }

        setFiltered(result);
    }, [books, statistics, ratings, comments, searchValue, sortBy]);

    const handleSearch = (e) => {
        setSearchValue(e.target.value);
    };

    const handleBlockUser = async (userId, isBlock) => {
        const userRef = ref(db, `Users/${userId}`);
        await update(userRef, { isBlock });
    };

    function normalizeParagraphIndex(paragraphField) {
        if (!paragraphField) return null;
        const match = paragraphField.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
    }

    function extractParagraphs(content) {
        if (!content) return [];
        let cleanedContent = content
            .replace(/<p>/g, "\n\n")
            .replace(/<\/p>/g, "\n\n");
        cleanedContent = cleanedContent.replace(/<[^>]*>/g, "");
        cleanedContent = cleanedContent.replace(/&nbsp;/g, " ");
        const paragraphArray = cleanedContent
            .split(/\n\n+/)
            .map((p) => p.trim())
            .filter((p) => p !== "");
        return paragraphArray;
    }

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h5" gutterBottom>
                Quản lý đánh giá & bình luận
            </Typography>

            {/* Search + Sort */}
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <TextField
                    label="Tìm theo tên sách"
                    variant="outlined"
                    onChange={handleSearch}
                    style={{ width: 300 }}
                />

                <FormControl style={{ width: 200 }}>
                    <InputLabel>Sắp xếp theo</InputLabel>
                    <Select
                        value={sortBy}
                        label="Sắp xếp theo"
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <MenuItem value="views">Lượt xem</MenuItem>
                        <MenuItem value="rating">Sao trung bình</MenuItem>
                        <MenuItem value="ratingCount">Số đánh giá</MenuItem>
                        <MenuItem value="comments">Số bình luận</MenuItem>
                    </Select>
                </FormControl>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Bìa</TableCell>
                            <TableCell>Tên sách</TableCell>
                            <TableCell>Lượt xem</TableCell>
                            <TableCell>Sao TB</TableCell>
                            <TableCell>Số đánh giá</TableCell>
                            <TableCell>Tổng comment</TableCell>
                            <TableCell>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((book) => (
                            <TableRow key={book.key}>
                                <TableCell>
                                    <img src={book.CoverImage} alt="" style={{ width: 50, height: 70 }} />
                                </TableCell>
                                <TableCell>{book.Title}</TableCell>
                                <TableCell>{book.views}</TableCell>
                                <TableCell>
                                    <Rating value={book.avgRating} precision={0.5} readOnly />
                                </TableCell>
                                <TableCell>{book.ratingCount}</TableCell>
                                <TableCell>{book.totalComments}</TableCell>
                                <TableCell>
                                    <Button onClick={() => { setSelectedBook(book); setVisible(true); }}>
                                        Xem chi tiết
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Chi tiết */}
            <Dialog open={visible} onClose={() => setVisible(false)} fullWidth maxWidth="md">
                <DialogTitle>Chi tiết: {selectedBook?.Title}</DialogTitle>
                <DialogContent>
                    {selectedBook && (
                        <>
                            <Typography variant="subtitle1" gutterBottom>Danh sách đánh giá</Typography>
                            <List>
                                {selectedBook.ratings.map((item) => {
                                    const user = users[item.UserId] || {};
                                    return (
                                        <ListItem
                                            key={item.BookId + item.UserId}
                                            secondaryAction={
                                                user.isBlock ? (
                                                    <Button onClick={() => handleBlockUser(item.UserId, false)}>Unblock</Button>
                                                ) : (
                                                    <Button color="error" onClick={() => handleBlockUser(item.UserId, true)}>Block</Button>
                                                )
                                            }
                                        >
                                            <Avatar src={user.Avatar} />
                                            <ListItemText
                                                primary={`${user.Username || "Ẩn danh"} - ${item.Rating}⭐`}
                                                secondary={item.Comment}
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>

                            <Typography variant="subtitle1" gutterBottom>Bình luận nội dung</Typography>
                            <List>
                                {selectedBook.comments.map((item) => {
                                    const user = users[item.UserId] || {};
                                    const chapter = chapters[item.ChapterId];
                                    const paras = chapter ? extractParagraphs(chapter.Content) : [];
                                    const index = normalizeParagraphIndex(item.Paragraph);
                                    const originalPara = (index !== null && paras[index]) ? paras[index] : "";

                                    return (
                                        <ListItem
                                            key={item.BookId + item.UserId + item.Paragraph}
                                            secondaryAction={
                                                user.isBlock ? (
                                                    <Button onClick={() => handleBlockUser(item.UserId, false)}>Unblock</Button>
                                                ) : (
                                                    <Button color="error" onClick={() => handleBlockUser(item.UserId, true)}>Block</Button>
                                                )
                                            }
                                            sx={{ flexDirection: "column", alignItems: "flex-start" }}
                                        >
                                            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                                <Avatar src={user.Avatar} />
                                                <ListItemText
                                                    primary={user.Username || "Ẩn danh"}
                                                    secondary={
                                                        <>
                                                            <div>{item.Content}</div>
                                                            {chapters[item.ChapterId] && (
                                                                <blockquote
                                                                    style={{
                                                                        background: "#f5f5f5",
                                                                        padding: "4px 8px",
                                                                        borderRadius: 6,
                                                                        marginTop: 6,
                                                                        fontStyle: "italic",
                                                                    }}
                                                                >
                                                                    {originalPara || "Không tìm thấy đoạn gốc"}
                                                                </blockquote>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </div>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
