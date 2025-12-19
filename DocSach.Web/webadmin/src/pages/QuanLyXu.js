// import React, { useEffect, useState } from "react";
// import {
//     Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
//     Paper, TextField, Dialog, DialogTitle, DialogContent,
//     Button, Avatar, Typography, FormControl, Select, InputLabel, MenuItem,
//     List, ListItem, ListItemText
// } from "@mui/material";
// import { ref, onValue, off } from "firebase/database";
// import { db } from "../services/firebase";

// export default function QuanLyXu() {
//     const [users, setUsers] = useState({});
//     const [transactions, setTransactions] = useState({});
//     const [searchValue, setSearchValue] = useState("");
//     const [filterType, setFilterType] = useState("all");
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [visible, setVisible] = useState(false);
//     const [totalXuNạp, setTotalXuNap] = useState(0);
//     const [totalUSD, setTotalUSD] = useState(0);
//     const userMap = users;
//     // Load Users & Transactions
//     useEffect(() => {
//         const usersRef = ref(db, "Users");
//         const transRef = ref(db, "Transactions");

//         onValue(usersRef, snap => snap.exists() && setUsers(snap.val()));
//         onValue(transRef, snap => snap.exists() && setTransactions(snap.val()));

//         return () => {
//             off(usersRef);
//             off(transRef);
//         };
//     }, []);

//     // Convert users object → array
//     const userList = Object.keys(users).map(uid => ({
//         uid,
//         ...users[uid]
//     }));

//     // Search by username
//     const filteredUsers = userList.filter(u =>
//         u.Username?.toLowerCase().includes(searchValue.toLowerCase())
//     );

//     // Format transaction title
//     const formatTransactionTitle = (t) => {
//         if (t.type === "topup") return "Nạp xu";
//         if (t.type === "buy_frame") return `Mua khung: ${t.frameName || t.item || "khung"}`;
//         if (t.type === "buyBook") return "Mua sách";
//         if (t.type === "donate") {
//             const toUserName = userMap[t.toUserId]?.Username || "Người dùng";
//             return `Tặng xu cho ${toUserName}`;
//         }
//         if (t.type === "receive") {
//             const fromUserName = userMap[t.fromUserId]?.Username || "Người dùng";
//             return `Nhận xu từ ${fromUserName}`;
//         }
//         return "Giao dịch";
//     };
//     // Lấy lịch sử giao dịch user
//     const getHistory = (uid) => {
//         let result = [];
//         if (transactions[uid]) {
//             Object.keys(transactions[uid]).forEach(tid => {
//                 const t = transactions[uid][tid];
//                 result.push({
//                     type: t.type,
//                     title: formatTransactionTitle(t),
//                     amount: t.Price || t.amount,
//                     before: t.before,
//                     after: t.after,
//                     time: t.time || new Date(t.date).getTime()
//                 });
//             });
//         }
//         return result.sort((a, b) => b.time - a.time);
//     };
//     const handleTinhTongXu = () => {
//         let totalXu = 0;
//         Object.values(users).forEach(u => {
//             totalXu += Number(u.xu || 0); // lấy xu hiện có của từng user
//         });
//         setTotalXuNap(totalXu);
//         setTotalUSD((totalXu / 100).toFixed(2)); // quy ra USD
//     };


//     return (
//         <div style={{ padding: 20 }}>
//             <Typography variant="h5" gutterBottom>
//                 Quản lý xu người dùng
//             </Typography>
//             <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={handleTinhTongXu}
//                 style={{ marginBottom: 20 }}
//             >
//                 Tính tổng xu đã nạp
//             </Button>

//             {totalXuNạp > 0 && (
//                 <Typography variant="subtitle1" gutterBottom>
//                     Tổng xu đã nạp: {totalXuNạp} xu ({totalUSD} USD)
//                 </Typography>
//             )}

//             {/* Search + Filter */}
//             <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
//                 <TextField
//                     label="Tìm theo username"
//                     variant="outlined"
//                     onChange={(e) => setSearchValue(e.target.value)}
//                     style={{ width: 300 }}
//                 />

//                 <FormControl style={{ width: 200 }}>
//                     <InputLabel>Lọc giao dịch</InputLabel>
//                     <Select
//                         value={filterType}
//                         label="Lọc giao dịch"
//                         onChange={(e) => setFilterType(e.target.value)}
//                     >
//                         <MenuItem value="all">Tất cả</MenuItem>
//                         <MenuItem value="topup">Chỉ nạp xu</MenuItem>
//                         <MenuItem value="spend">Chỉ chi tiêu</MenuItem>
//                     </Select>
//                 </FormControl>
//             </div>

//             {/* Table Users */}
//             <TableContainer component={Paper}>
//                 <Table>
//                     <TableHead>
//                         <TableRow>
//                             <TableCell>Avatar</TableCell>
//                             <TableCell>Username</TableCell>
//                             <TableCell>Email</TableCell>
//                             <TableCell>Xu hiện có</TableCell>
//                             <TableCell>Hành động</TableCell>
//                         </TableRow>
//                     </TableHead>

//                     <TableBody>
//                         {filteredUsers.map(u => (
//                             <TableRow key={u.uid}>
//                                 <TableCell>
//                                     <Avatar src={u.Avatar} />
//                                 </TableCell>
//                                 <TableCell>{u.Username}</TableCell>
//                                 <TableCell>{u.Email}</TableCell>
//                                 <TableCell>{u.xu || 0}</TableCell>
//                                 <TableCell>
//                                     <Button
//                                         variant="contained"
//                                         onClick={() => { setSelectedUser(u); setVisible(true); }}
//                                     >
//                                         Xem lịch sử
//                                     </Button>
//                                 </TableCell>
//                             </TableRow>
//                         ))}
//                     </TableBody>
//                 </Table>
//             </TableContainer>

//             {/* Dialog lịch sử */}
//             <Dialog open={visible} onClose={() => setVisible(false)} fullWidth maxWidth="md">
//                 <DialogTitle>Lịch sử giao dịch – {selectedUser?.Username}</DialogTitle>
//                 <DialogContent dividers>
//                     {selectedUser && (
//                         <List>
//                             {getHistory(selectedUser.uid)
//                                 .filter(h => {
//                                     if (filterType === "topup") return h.type === "topup";
//                                     if (filterType === "spend") return h.type !== "topup";
//                                     return true;
//                                 })
//                                 .map((h, i) => (
//                                     <ListItem key={i} divider>
//                                         <ListItemText
//                                             primary={`${h.title} – ${h.amount} xu`}
//                                             secondary={
//                                                 <>
//                                                     <div>Thời gian: {new Date(h.time).toLocaleString()}</div>
//                                                     {h.before !== undefined &&
//                                                         <div>Trước: {h.before} → Sau: {h.after}</div>
//                                                     }
//                                                 </>
//                                             }
//                                         />
//                                     </ListItem>
//                                 ))}
//                         </List>
//                     )}
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }

import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TextField, Dialog, DialogTitle, DialogContent,
    Button, Avatar, Typography, FormControl, Select, InputLabel, MenuItem,
    List, ListItem, ListItemText
} from "@mui/material";
import { ref, onValue, off } from "firebase/database";
import { db } from "../services/firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function QuanLyXu() {
    const [users, setUsers] = useState({});
    const [transactions, setTransactions] = useState({});
    const [searchValue, setSearchValue] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [visible, setVisible] = useState(false);
    const [totalXuNạp, setTotalXuNap] = useState(0);
    const [totalUSD, setTotalUSD] = useState(0);
    const userMap = users;

    // Load Users & Transactions
    useEffect(() => {
        const usersRef = ref(db, "Users");
        const transRef = ref(db, "Transactions");

        onValue(usersRef, snap => snap.exists() && setUsers(snap.val()));
        onValue(transRef, snap => snap.exists() && setTransactions(snap.val()));

        return () => {
            off(usersRef);
            off(transRef);
        };
    }, []);

    const userList = Object.keys(users).map(uid => ({
        uid,
        ...users[uid]
    }));

    const filteredUsers = userList.filter(u =>
        u.Username?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const formatTransactionTitle = (t) => {
        if (t.type === "topup") return "Nạp xu";
        if (t.type === "buy_frame") return `Mua khung: ${t.frameName || t.item || "khung"}`;
        if (t.type === "buyBook") return "Mua sách";
        if (t.type === "donate") {
            const toUserName = userMap[t.toUserId]?.Username || "Người dùng";
            return `Tặng xu cho ${toUserName}`;
        }
        if (t.type === "receive") {
            const fromUserName = userMap[t.fromUserId]?.Username || "Người dùng";
            return `Nhận xu từ ${fromUserName}`;
        }
        return "Giao dịch";
    };

    const getHistory = (uid) => {
        let result = [];
        if (transactions[uid]) {
            Object.keys(transactions[uid]).forEach(tid => {
                const t = transactions[uid][tid];
                result.push({
                    type: t.type,
                    title: formatTransactionTitle(t),
                    amount: t.Price || t.amount,
                    before: t.before,
                    after: t.after,
                    time: t.time || new Date(t.date).getTime()
                });
            });
        }
        return result.sort((a, b) => b.time - a.time);
    };

    const handleTinhTongXu = () => {
        let totalXu = 0;
        Object.values(users).forEach(u => {
            totalXu += Number(u.xu || 0);
        });
        setTotalXuNap(totalXu);
        setTotalUSD((totalXu / 100).toFixed(2));
    };

    // --- EXPORT PDF LỊCH SỬ USER ---
    const exportUserPDF = () => {
        const input = document.getElementById("userHistoryPDF");
        html2canvas(input, { scale: 2 }).then(canvas => {
            const img = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(img, "PNG", 0, 0, width, height);
            pdf.save(`LichSuGiaoDich_${selectedUser.Username}.pdf`);
        });
    };

    // --- EXPORT PDF TỔNG NẠP XU ---
    const exportTotalTopupPDF = () => {
        const input = document.getElementById("totalTopupPDF");
        html2canvas(input, { scale: 2 }).then(canvas => {
            const img = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(img, "PNG", 0, 0, width, height);
            pdf.save("TongGiaoDichNapXu.pdf");
        });
    };

    return (
        <div style={{ padding: 20 }}>
            <Typography variant="h5" gutterBottom>Quản lý xu người dùng</Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={() => {
                    handleTinhTongXu();
                    setTimeout(exportTotalTopupPDF, 500);
                }}
                style={{ marginBottom: 20 }}
            >
                Xuất PDF tổng nạp xu
            </Button>

            {/* Hidden for PDF */}
            <div id="totalTopupPDF" style={{ padding: 20, background: "white", width: "100%", maxWidth: 800 }}>
                <h2>📄 Báo cáo tổng giao dịch nạp xu</h2>
                <p><b>Tổng xu hệ thống:</b> {totalXuNạp} xu</p>
                <p><b>Tổng USD tương ứng:</b> {totalUSD} USD</p>
            </div>

            {/* Search + Filter */}
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                <TextField
                    label="Tìm theo username"
                    variant="outlined"
                    onChange={(e) => setSearchValue(e.target.value)}
                    style={{ width: 300 }}
                />

                <FormControl style={{ width: 200 }}>
                    <InputLabel>Lọc giao dịch</InputLabel>
                    <Select
                        value={filterType}
                        label="Lọc giao dịch"
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="topup">Chỉ nạp xu</MenuItem>
                        <MenuItem value="spend">Chỉ chi tiêu</MenuItem>
                    </Select>
                </FormControl>
            </div>

            {/* Table Users */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Avatar</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Xu hiện có</TableCell>
                            <TableCell>Hành động</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map(u => (
                            <TableRow key={u.uid}>
                                <TableCell><Avatar src={u.Avatar} /></TableCell>
                                <TableCell>{u.Username}</TableCell>
                                <TableCell>{u.Email}</TableCell>
                                <TableCell>{u.xu || 0}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        onClick={() => { setSelectedUser(u); setVisible(true); }}
                                    >
                                        Xem lịch sử
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog lịch sử */}
            <Dialog open={visible} onClose={() => setVisible(false)} fullWidth maxWidth="md">
                <DialogTitle>
                    Lịch sử giao dịch – {selectedUser?.Username}
                    <Button onClick={exportUserPDF} style={{ float: "right" }} variant="contained">
                        Xuất PDF
                    </Button>
                </DialogTitle>

                <DialogContent dividers id="userHistoryPDF" style={{ background: "white" }}>
                    {selectedUser && (
                        <List>
                            {getHistory(selectedUser.uid)
                                .filter(h => {
                                    if (filterType === "topup") return h.type === "topup";
                                    if (filterType === "spend") return h.type !== "topup";
                                    return true;
                                })
                                .map((h, i) => (
                                    <ListItem key={i} divider>
                                        <ListItemText
                                            primary={`${h.title} – ${h.amount} xu`}
                                            secondary={
                                                <>
                                                    <div>Thời gian: {new Date(h.time).toLocaleString()}</div>
                                                    {h.before !== undefined &&
                                                        <div>Trước: {h.before} → Sau: {h.after}</div>
                                                    }
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
