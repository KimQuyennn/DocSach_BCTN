import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { ref, onValue, get, update, push } from "firebase/database";
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Paper,
    Modal,
} from "@mui/material";

export default function QuyenTacGia() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUserBooks, setSelectedUserBooks] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsersAndBooks = () => {
        setLoading(true);
        const usersRef = ref(db, "Users");
        const booksRef = ref(db, "Books");

        onValue(usersRef, (usersSnapshot) => {
            const usersData = usersSnapshot.val() || {};

            onValue(booksRef, (booksSnapshot) => {
                const books = booksSnapshot.val() || {};
                const userMap = {};

                Object.entries(books).forEach(([bookId, book]) => {
                    const uploaderId = book.UploaderId;
                    if (!uploaderId || !book.IsVIP || book.IsPaid) return;

                    // Lấy tổng tiền thực tế từ MoneyReceived
                    const totalPaid = book.MoneyReceived || 0;
                    if (totalPaid === 0) return; // chưa có ai mua

                    if (!userMap[uploaderId]) {
                        userMap[uploaderId] = {
                            username: usersData[uploaderId]?.Username || "Unknown",
                            books: [],
                            totalXuVIP: 0,
                        };
                    }

                    // Push sách vào danh sách, bao gồm totalPaid để hiển thị trong modal
                    userMap[uploaderId].books.push({ ...book, id: bookId, totalPaid });
                    userMap[uploaderId].totalXuVIP += totalPaid;
                });

                const userArray = Object.entries(userMap).map(([userId, data]) => ({
                    userId,
                    username: data.username,
                    books: data.books,
                    totalBooksVIP: data.books.length,
                    totalXuVIP: data.totalXuVIP,
                    totalUSD: ((data.totalXuVIP * 0.65) / 100).toFixed(2), // 65% nhận về USD
                    paypalEmail: usersData[userId]?.paypalEmail || "Chưa có",
                }));

                setUsers(userArray);
                setLoading(false);
            }, { onlyOnce: true });
        }, { onlyOnce: true });
    };

    useEffect(() => {
        fetchUsersAndBooks();
    }, []);

    const handleOpenModal = (user) => {
        setSelectedUserBooks(user.books);
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedUserBooks([]);
        setSelectedUser(null);
    };

    const handleXacNhanThanhToan = async (user) => {
        try {
            const booksSnapshot = await get(ref(db, "Books"));
            const books = booksSnapshot.val() || {};

            const updates = {};
            Object.entries(books).forEach(([bookId, book]) => {
                if (book.UploaderId === user.userId && book.IsVIP && !book.IsPaid) {
                    updates[`Books/${bookId}/IsPaid`] = true;
                    updates[`Books/${bookId}/MoneyReceived`] = 0; // reset tổng tiền sau khi thanh toán
                }
            });

            if (Object.keys(updates).length === 0) {
                alert("Không có sách VIP chưa thanh toán.");
                return;
            }

            await update(ref(db), updates);

            // Gửi thông báo cho tác giả
            const notifRef = ref(db, `Notifications/${user.userId}`);
            const newNotif = {
                createdAt: Date.now(),
                message: `Admin đã xác nhận thanh toán quyền lợi của bạn (${user.totalUSD} USD)`,
                read: false,
                title: "Bạn vừa nhận tiền từ sách VIP",
                type: "author_payment",
            };
            await push(notifRef, newNotif);

            alert(`✅ Xác nhận thanh toán thành công cho ${user.username}`);
            fetchUsersAndBooks(); // reload dữ liệu
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("❌ Lỗi khi xác nhận thanh toán");
        }
    };

    if (loading) return <Typography>Đang tải dữ liệu...</Typography>;

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" sx={{ mb: 3, color: "#8B0000", fontWeight: "bold" }}>
                Quản lý thanh toán sách VIP
            </Typography>

            {users.length === 0 && <Typography>Hiện chưa có tác giả nào cần thanh toán.</Typography>}

            <Paper sx={{ overflowX: "auto" }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell><b>Username</b></TableCell>
                            <TableCell><b>Email PayPal</b></TableCell>
                            <TableCell><b>Tổng sách VIP</b></TableCell>
                            <TableCell><b>Tổng xu VIP</b></TableCell>
                            <TableCell><b>USD tác giả nhận</b></TableCell>
                            <TableCell><b>Chi tiết / Thanh toán</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.userId}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.paypalEmail}</TableCell>
                                <TableCell>{user.totalBooksVIP}</TableCell>
                                <TableCell>{user.totalXuVIP}</TableCell>
                                <TableCell>${user.totalUSD}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        sx={{ mr: 1 }}
                                        onClick={() => handleOpenModal(user)}
                                    >
                                        Xem sách
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => handleXacNhanThanhToan(user)}
                                    >
                                        Xác nhận đã thanh toán
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Modal chi tiết sách */}
            <Modal open={modalOpen} onClose={handleCloseModal}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 600,
                        maxHeight: "80vh",
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 3,
                        overflowY: "auto",
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                        Chi tiết sách VIP chưa thanh toán
                    </Typography>

                    {selectedUserBooks.length === 0 ? (
                        <Typography>Đã thanh toán hết sách VIP.</Typography>
                    ) : (
                        <Table>
                            <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
                                <TableRow>
                                    <TableCell><b>Tên sách</b></TableCell>
                                    <TableCell><b>Xu thực tế</b></TableCell>
                                    <TableCell><b>USD nhận tác giả</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {selectedUserBooks.map((book) => (
                                    <TableRow key={book.id}>
                                        <TableCell>{book.Title}</TableCell>
                                        <TableCell>{book.totalPaid}</TableCell>
                                        <TableCell>${((book.totalPaid * 0.65) / 100).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <Button variant="outlined" sx={{ mt: 2 }} onClick={handleCloseModal}>
                        Đóng
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
}
