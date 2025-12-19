// import React, { useEffect, useState, useRef } from "react";
// import { ref, onValue, off } from "firebase/database";
// import { db } from "../services/firebase";

// import {
//     Card, CardContent, Typography, Grid, List, ListItem, ListItemText, Button
// } from "@mui/material";

// import {
//     BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line
// } from "recharts";

// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

// export default function ThongKe() {

//     const pdfRef = useRef(null);

//     const [users, setUsers] = useState({});
//     const [books, setBooks] = useState({});
//     const [chapters, setChapters] = useState({});
//     const [comments, setComments] = useState({});
//     const [ratings, setRatings] = useState({});
//     const [favorites, setFavorites] = useState({});

//     useEffect(() => {
//         const refs = {
//             users: ref(db, "Users"),
//             books: ref(db, "Books"),
//             chapters: ref(db, "Chapters"),
//             comments: ref(db, "Comments"),
//             ratings: ref(db, "Ratings"),
//             favorites: ref(db, "Favorites")
//         };

//         Object.entries(refs).forEach(([key, r]) => {
//             onValue(r, (snap) => {
//                 if (!snap.exists()) return;

//                 switch (key) {
//                     case "users": setUsers(snap.val()); break;
//                     case "books": setBooks(snap.val()); break;
//                     case "chapters": setChapters(snap.val()); break;
//                     case "comments": setComments(snap.val()); break;
//                     case "ratings": setRatings(snap.val()); break;
//                     case "favorites": setFavorites(snap.val()); break;
//                 }
//             });
//         });

//         return () => Object.values(refs).forEach((r) => off(r));
//     }, []);
//     // =========================
//     // 📌 TÍNH TOÁN THỐNG KÊ CƠ BẢN
//     // =========================
//     const totalUsers = Object.keys(users).length;
//     const totalBooks = Object.keys(books).length;
//     const totalChapters = Object.keys(chapters).length;
//     const totalComments = Object.keys(comments).length;
//     const totalFavorites = Object.keys(favorites).length;

//     const avgRating =
//         Object.keys(ratings).length > 0
//             ? (
//                 Object.values(ratings).reduce((s, r) => s + (r.Rating || 0), 0) /
//                 Object.keys(ratings).length
//             ).toFixed(2)
//             : 0;


//     // =========================
//     // 📌 TOP USER COMMENT NHIỀU NHẤT
//     // =========================
//     const userCommentCount = {};
//     Object.values(comments).forEach((c) => {
//         if (!userCommentCount[c.UserId]) userCommentCount[c.UserId] = 0;
//         userCommentCount[c.UserId]++;
//     });

//     const topUsers = Object.entries(userCommentCount)
//         .map(([userId, count]) => ({
//             userId,
//             count,
//             name: users[userId]?.Username || "Ẩn danh"
//         }))
//         .sort((a, b) => b.count - a.count)
//         .slice(0, 5);


//     // =========================
//     // 📌 TOP SÁCH NHIỀU LƯỢT YÊU THÍCH
//     // =========================
//     const bookFavoriteCount = {};
//     Object.values(favorites).forEach((f) => {
//         if (!bookFavoriteCount[f.BookId]) bookFavoriteCount[f.BookId] = 0;
//         bookFavoriteCount[f.BookId]++;
//     });

//     const topBooks = Object.entries(bookFavoriteCount)
//         .map(([bookId, count]) => ({
//             bookId,
//             count,
//             title: books[bookId]?.Title || "Không rõ"
//         }))
//         .sort((a, b) => b.count - a.count)
//         .slice(0, 5);


//     // =========================
//     // 📌 THỐNG KÊ THÀNH VIÊN THEO ROLE
//     // =========================
//     const roleStats = [
//         {
//             name: "Admin",
//             value: Object.values(users).filter((u) => u.Role === "Admin").length
//         },
//         {
//             name: "Quản lý",
//             value: Object.values(users).filter((u) => u.Role === "Quản lý").length
//         },
//         {
//             name: "User",
//             value: Object.values(users).filter((u) => u.Role !== "Admin" && u.Role !== "Quản lý").length
//         }
//     ];


//     // =========================
//     // 📌 TOP SÁCH NHIỀU CHƯƠNG NHẤT
//     // =========================
//     const chaptersByBook = {};
//     Object.values(chapters).forEach((c) => {
//         if (!chaptersByBook[c.BookId]) chaptersByBook[c.BookId] = 0;
//         chaptersByBook[c.BookId]++;
//     });

//     const topChapterBooks = Object.entries(chaptersByBook)
//         .map(([bookId, count]) => ({
//             bookId,
//             count,
//             title: books[bookId]?.Title || "Không rõ"
//         }))
//         .sort((a, b) => b.count - a.count)
//         .slice(0, 5);


//     // =========================
//     // 📌 TÍNH USER ĐĂNG KÝ THEO THÁNG (BIỂU ĐỒ ĐƯỜNG)
//     // =========================
//     const monthlyUsers = Array.from({ length: 12 }, (_, i) => ({
//         month: `Tháng ${i + 1}`,
//         count: 0,
//     }));

//     Object.values(users).forEach((u) => {
//         if (!u.CreatedAt) return;
//         const d = new Date(u.CreatedAt);
//         const m = d.getMonth(); // 0–11
//         monthlyUsers[m].count++;
//     });


//     // =========================
//     // 📌 CHUẨN BỊ MÀU CHO PIE CHART
//     // =========================
//     const COLORS = ["#0088FE", "#FF8042", "#00C49F"];
//     // =========================
//     // 📌 PHẦN 3 - UI + BIỂU ĐỒ + XUẤT PDF/CSV
//     // =========================

//     // hàm xuất PDF (bao gồm toàn bộ phần ref)
//     const handleExportPDF = async () => {
//         if (!pdfRef.current) return;
//         const input = pdfRef.current;
//         // tăng tỷ lệ để ảnh nét hơn
//         const canvas = await html2canvas(input, { scale: 2, useCORS: true });
//         const imgData = canvas.toDataURL("image/png");
//         const pdf = new jsPDF("landscape", "pt", "a4");
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
//         pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
//         pdf.save(`ThongKe_${new Date().toISOString().slice(0, 10)}.pdf`);
//     };

//     // hàm xuất CSV đơn giản cho bảng Top Books / Top Users
//     const downloadCSV = (rows, filename = "export.csv") => {
//         if (!rows || rows.length === 0) return;
//         const header = Object.keys(rows[0]);
//         const csv = [
//             header.join(","),
//             ...rows.map(r => header.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
//         ].join("\n");

//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const link = document.createElement("a");
//         const url = URL.createObjectURL(blob);
//         link.setAttribute("href", url);
//         link.setAttribute("download", filename);
//         link.style.visibility = "hidden";
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     // chuẩn dữ liệu cho các biểu đồ nhỏ
//     const bookViewsData = Object.values(books).map((b) => ({
//         title: b.Title?.slice(0, 20) || "Không rõ",
//         views: b.Views || 0,
//     })).sort((a, b) => b.views - a.views).slice(0, 10);

//     const topBooksForBar = topBooks.map((b) => ({ title: b.title.slice(0, 20), count: b.count }));
//     const topChapterBooksForBar = topChapterBooks.map((b) => ({ title: b.title.slice(0, 20), count: b.count }));

//     // giao diện chính (bọc trong ref để chụp PDF)
//     return (
//         <div style={{ padding: 20 }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <Typography variant="h4">📊 Thống kê hệ thống (PRO)</Typography>

//                 <div style={{ display: "flex", gap: 8 }}>
//                     <Button variant="outlined" onClick={() => downloadCSV(topBooks.map(b => ({ Title: b.title, Favorites: b.count })), "TopBooks.csv")}>
//                         Xuất CSV Top Sách
//                     </Button>
//                     <Button variant="outlined" onClick={() => downloadCSV(topUsers.map(u => ({ Username: u.name, Comments: u.count })), "TopUsers.csv")}>
//                         Xuất CSV Top Users
//                     </Button>
//                     <Button variant="contained" color="primary" onClick={handleExportPDF}>
//                         Xuất PDF báo cáo
//                     </Button>
//                 </div>
//             </div>

//             {/* Phần nội dung sẽ được chụp để xuất PDF */}
//             <div ref={pdfRef} style={{ background: "#fff", padding: 16, borderRadius: 8, marginTop: 16 }}>
//                 {/* Cards tóm tắt */}
//                 <Grid container spacing={2}>
//                     <Grid item xs={12} md={2}>
//                         <Card>
//                             <CardContent>
//                                 <Typography variant="subtitle2">Tổng User</Typography>
//                                 <Typography variant="h6">{totalUsers}</Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={12} md={2}>
//                         <Card>
//                             <CardContent>
//                                 <Typography variant="subtitle2">Tổng Sách</Typography>
//                                 <Typography variant="h6">{totalBooks}</Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={12} md={2}>
//                         <Card>
//                             <CardContent>
//                                 <Typography variant="subtitle2">Tổng Chương</Typography>
//                                 <Typography variant="h6">{totalChapters}</Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={12} md={2}>
//                         <Card>
//                             <CardContent>
//                                 <Typography variant="subtitle2">Tổng Comment</Typography>
//                                 <Typography variant="h6">{totalComments}</Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={12} md={2}>
//                         <Card>
//                             <CardContent>
//                                 <Typography variant="subtitle2">Yêu thích</Typography>
//                                 <Typography variant="h6">{totalFavorites}</Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                     <Grid item xs={12} md={2}>
//                         <Card>
//                             <CardContent>
//                                 <Typography variant="subtitle2">⭐ TB Rating</Typography>
//                                 <Typography variant="h6">{avgRating}</Typography>
//                             </CardContent>
//                         </Card>
//                     </Grid>
//                 </Grid>

//                 {/* Các biểu đồ chính */}
//                 <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
//                     {/* Biểu đồ Line - user theo tháng */}
//                     <div style={{ flex: 1, minWidth: 360, background: "#fafafa", padding: 12, borderRadius: 8 }}>
//                         <Typography variant="subtitle1">User đăng theo tháng</Typography>
//                         <LineChart width={520} height={260} data={monthlyUsers}>
//                             <XAxis dataKey="month" />
//                             <YAxis />
//                             <Tooltip />
//                             <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
//                         </LineChart>
//                     </div>

//                     {/* Biểu đồ Pie - Role */}
//                     <div style={{ width: 360, background: "#fafafa", padding: 12, borderRadius: 8 }}>
//                         <Typography variant="subtitle1">Tỉ lệ theo Role</Typography>
//                         <PieChart width={320} height={240}>
//                             <Pie
//                                 data={roleStats}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 cx="50%"
//                                 cy="50%"
//                                 outerRadius={70}
//                                 label
//                             >
//                                 {roleStats.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                             </Pie>
//                             <Legend />
//                             <Tooltip />
//                         </PieChart>
//                     </div>
//                 </div>

//                 {/* Các biểu đồ phụ và bảng */}
//                 <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
//                     {/* Bar: Top Sách favorite */}
//                     <div style={{ flex: 1, minWidth: 360, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
//                         <Typography variant="subtitle1">Top Sách được yêu thích</Typography>
//                         <BarChart width={420} height={260} data={topBooksForBar}>
//                             <XAxis dataKey="title" hide />
//                             <YAxis />
//                             <Tooltip />
//                             <Bar dataKey="count" fill="#82ca9d" />
//                         </BarChart>
//                     </div>

//                     {/* Bar: Sách có nhiều chương */}
//                     <div style={{ flex: 1, minWidth: 360, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
//                         <Typography variant="subtitle1">Sách có nhiều chương</Typography>
//                         <BarChart width={420} height={260} data={topChapterBooksForBar}>
//                             <XAxis dataKey="title" hide />
//                             <YAxis />
//                             <Tooltip />
//                             <Bar dataKey="count" fill="#8884d8" />
//                         </BarChart>
//                     </div>
//                 </div>

//                 {/* Bảng Top Users & Top Books */}
//                 <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
//                     <div style={{ flex: 1, minWidth: 300, background: "#fff", padding: 12, borderRadius: 8 }}>
//                         <Typography variant="subtitle1">👥 Top Users bình luận</Typography>
//                         <List>
//                             {topUsers.map((u) => (
//                                 <ListItem key={u.userId} divider>
//                                     <ListItemText primary={u.name} secondary={`${u.count} bình luận`} />
//                                 </ListItem>
//                             ))}
//                         </List>
//                     </div>

//                     <div style={{ flex: 1, minWidth: 300, background: "#fff", padding: 12, borderRadius: 8 }}>
//                         <Typography variant="subtitle1">📚 Top Sách yêu thích</Typography>
//                         <List>
//                             {topBooks.map((b) => (
//                                 <ListItem key={b.bookId} divider>
//                                     <ListItemText primary={b.title} secondary={`${b.count} lượt yêu thích`} />
//                                 </ListItem>
//                             ))}
//                         </List>
//                     </div>
//                 </div>

//                 {/* Biểu đồ Views top sách */}
//                 <div style={{ marginTop: 24, background: "#fff", padding: 12, borderRadius: 8 }}>
//                     <Typography variant="subtitle1">📈 Top Sách theo lượt xem</Typography>
//                     <BarChart width={900} height={300} data={bookViewsData}>
//                         <XAxis dataKey="title" hide />
//                         <YAxis />
//                         <Tooltip />
//                         <Bar dataKey="views" fill="#413ea0" />
//                     </BarChart>
//                 </div>

//                 {/* footer nhỏ */}
//                 <div style={{ marginTop: 12, textAlign: "right", color: "#666" }}>
//                     <small>Generated on {new Date().toLocaleString()}</small>
//                 </div>
//             </div>
//         </div>
//     );
// }


import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../services/firebase";

import {
    Card, CardContent, Typography, Grid, List, ListItem, ListItemText, Button
} from "@mui/material";

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ThongKe() {

    const pdfRef = useRef(null);

    const [users, setUsers] = useState({});
    const [books, setBooks] = useState({});
    const [chapters, setChapters] = useState({});
    const [comments, setComments] = useState({});
    const [ratings, setRatings] = useState({});
    const [favorites, setFavorites] = useState({});

    useEffect(() => {
        const refs = {
            users: ref(db, "Users"),
            books: ref(db, "Books"),
            chapters: ref(db, "Chapters"),
            comments: ref(db, "Comments"),
            ratings: ref(db, "Ratings"),
            favorites: ref(db, "Favorites")
        };

        Object.entries(refs).forEach(([key, r]) => {
            onValue(r, (snap) => {
                if (!snap.exists()) return;
                switch (key) {
                    case "users": setUsers(snap.val()); break;
                    case "books": setBooks(snap.val()); break;
                    case "chapters": setChapters(snap.val()); break;
                    case "comments": setComments(snap.val()); break;
                    case "ratings": setRatings(snap.val()); break;
                    case "favorites": setFavorites(snap.val()); break;
                }
            });
        });

        return () => Object.values(refs).forEach((r) => off(r));
    }, []);

    // =========================
    // 📌 TÍNH TOÁN THỐNG KÊ CƠ BẢN
    // =========================
    const totalUsers = Object.keys(users).length;
    const totalBooks = Object.keys(books).length;
    const totalChapters = Object.keys(chapters).length;
    const totalComments = Object.keys(comments).length;
    const totalFavorites = Object.keys(favorites).length;

    const avgRating =
        Object.keys(ratings).length > 0
            ? (
                Object.values(ratings).reduce((s, r) => s + (r.Rating || 0), 0) /
                Object.keys(ratings).length
            ).toFixed(2)
            : 0;


    // =========================
    // 📌 TOP USER COMMENT NHIỀU NHẤT
    // =========================
    const userCommentCount = {};
    Object.values(comments).forEach((c) => {
        if (!userCommentCount[c.UserId]) userCommentCount[c.UserId] = 0;
        userCommentCount[c.UserId]++;
    });

    const topUsers = Object.entries(userCommentCount)
        .map(([userId, count]) => ({
            userId,
            count,
            name: users[userId]?.Username || "Ẩn danh"
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);


    // =========================
    // 📌 TOP SÁCH NHIỀU LƯỢT YÊU THÍCH
    // =========================
    const bookFavoriteCount = {};
    Object.values(favorites).forEach((f) => {
        if (!bookFavoriteCount[f.BookId]) bookFavoriteCount[f.BookId] = 0;
        bookFavoriteCount[f.BookId]++;
    });

    const topBooks = Object.entries(bookFavoriteCount)
        .map(([bookId, count]) => ({
            bookId,
            count,
            title: books[bookId]?.Title || "Không rõ"
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);


    // =========================
    // 📌 THỐNG KÊ THÀNH VIÊN THEO ROLE
    // =========================
    const roleStats = [
        {
            name: "Admin",
            value: Object.values(users).filter((u) => u.Role === "Admin").length
        },
        {
            name: "Quản lý",
            value: Object.values(users).filter((u) => u.Role === "Quản lý").length
        },
        {
            name: "User",
            value: Object.values(users).filter((u) => u.Role !== "Admin" && u.Role !== "Quản lý").length
        }
    ];

    // =========================
    // 📌 TOP SÁCH NHIỀU CHƯƠNG
    // =========================
    const chaptersByBook = {};
    Object.values(chapters).forEach((c) => {
        if (!chaptersByBook[c.BookId]) chaptersByBook[c.BookId] = 0;
        chaptersByBook[c.BookId]++;
    });

    const topChapterBooks = Object.entries(chaptersByBook)
        .map(([bookId, count]) => ({
            bookId,
            count,
            title: books[bookId]?.Title || "Không rõ"
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);


    // =========================
    // 📌 USER THEO THÁNG
    // =========================
    const monthlyUsers = Array.from({ length: 12 }, (_, i) => ({
        month: `Tháng ${i + 1}`,
        count: 0,
    }));

    Object.values(users).forEach((u) => {
        if (!u.CreatedAt) return;
        const d = new Date(u.CreatedAt);
        monthlyUsers[d.getMonth()].count++;
    });

    // =========================
    // 📌 MÀU PIE CHART
    // =========================
    const COLORS = ["#0088FE", "#FF8042", "#00C49F"];


    // =========================
    // 📌 XUẤT PDF
    // =========================
    const handleExportPDF = async () => {
        if (!pdfRef.current) return;

        const input = pdfRef.current;
        const canvas = await html2canvas(input, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("landscape", "pt", "a4");
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, w, h);
        pdf.save(`ThongKe_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    // =========================
    // 📌 XUẤT CSV
    // =========================
    const downloadCSV = (rows, filename = "export.csv") => {
        if (!rows || rows.length === 0) return;

        const header = Object.keys(rows[0]);
        const csv = [
            header.join(","),
            ...rows.map(r =>
                header.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
            )
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // =========================
    // 📌 DATA BIỂU ĐỒ
    // =========================
    const bookViewsData = Object.values(books)
        .map((b) => ({
            title: b.Title?.slice(0, 20) || "Không rõ",
            views: b.Views || 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

    const topBooksForBar = topBooks.map((b) => ({ title: b.title.slice(0, 20), count: b.count }));
    const topChapterBooksForBar = topChapterBooks.map((b) => ({ title: b.title.slice(0, 20), count: b.count }));


    // =========================
    // 📌 GIAO DIỆN
    // =========================
    return (
        <div style={{ padding: 20 }}>
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h4">📊 Thống kê hệ thống (PRO)</Typography>

                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        variant="outlined"
                        onClick={() => downloadCSV(topBooks.map(b => ({ Title: b.title, Favorites: b.count })), "TopBooks.csv")}
                    >
                        Xuất CSV Top Sách
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => downloadCSV(topUsers.map(u => ({ Username: u.name, Comments: u.count })), "TopUsers.csv")}
                    >
                        Xuất CSV Top Users
                    </Button>

                    <Button variant="contained" onClick={handleExportPDF}>
                        Xuất PDF báo cáo
                    </Button>
                </div>
            </div>

            {/* PDF AREA */}
            <div
                ref={pdfRef}
                style={{
                    background: "#fff",
                    padding: 16,
                    borderRadius: 8,
                    marginTop: 16
                }}
            >

                {/* ==== CARDS ==== */}
                <Grid container spacing={2}>
                    {[
                        ["Tổng User", totalUsers],
                        ["Tổng Sách", totalBooks],
                        ["Tổng Chương", totalChapters],
                        ["Tổng Comment", totalComments],
                        ["Yêu thích", totalFavorites],
                        ["⭐ TB Rating", avgRating],
                    ].map(([label, value], idx) => (
                        <Grid item xs={12} md={2} key={idx}>
                            <Card><CardContent>
                                <Typography variant="subtitle2">{label}</Typography>
                                <Typography variant="h6">{value}</Typography>
                            </CardContent></Card>
                        </Grid>
                    ))}
                </Grid>


                {/* ==== BIỂU ĐỒ CHÍNH ==== */}
                <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
                    {/* Line Chart */}
                    <div style={{ flex: 1, minWidth: 360, background: "#fafafa", padding: 12, borderRadius: 8 }}>
                        <Typography variant="subtitle1">User đăng theo tháng</Typography>
                        <LineChart width={520} height={260} data={monthlyUsers}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </div>

                    {/* Pie Chart */}
                    <div style={{ width: 360, background: "#fafafa", padding: 12, borderRadius: 8 }}>
                        <Typography variant="subtitle1">Tỉ lệ theo Role</Typography>
                        <PieChart width={320} height={240}>
                            <Pie
                                data={roleStats}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                label
                            >
                                {roleStats.map((entry, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                            <Tooltip />
                        </PieChart>
                    </div>
                </div>


                {/* ==== BIỂU ĐỒ PHỤ ==== */}
                <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
                    {/* Favorite Books */}
                    <div style={{ flex: 1, minWidth: 360, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                        <Typography variant="subtitle1">Top Sách được yêu thích</Typography>
                        <BarChart width={420} height={260} data={topBooksForBar}>
                            <XAxis dataKey="title" hide />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#82ca9d" />
                        </BarChart>
                    </div>

                    {/* Chapter Books */}
                    <div style={{ flex: 1, minWidth: 360, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                        <Typography variant="subtitle1">Sách có nhiều chương</Typography>
                        <BarChart width={420} height={260} data={topChapterBooksForBar}>
                            <XAxis dataKey="title" hide />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </div>
                </div>


                {/* ==== BẢNG ==== */}
                <div style={{ display: "flex", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
                    {/* Top Users */}
                    <div style={{ flex: 1, minWidth: 300, background: "#fff", padding: 12, borderRadius: 8 }}>
                        <Typography variant="subtitle1">👥 Top Users bình luận</Typography>
                        <List>
                            {topUsers.map((u) => (
                                <ListItem key={u.userId} divider>
                                    <ListItemText primary={u.name} secondary={`${u.count} bình luận`} />
                                </ListItem>
                            ))}
                        </List>
                    </div>

                    {/* Top Books */}
                    <div style={{ flex: 1, minWidth: 300, background: "#fff", padding: 12, borderRadius: 8 }}>
                        <Typography variant="subtitle1">📚 Top Sách yêu thích</Typography>
                        <List>
                            {topBooks.map((b) => (
                                <ListItem key={b.bookId} divider>
                                    <ListItemText primary={b.title} secondary={`${b.count} lượt yêu thích`} />
                                </ListItem>
                            ))}
                        </List>
                    </div>
                </div>


                {/* ==== Views Chart ==== */}
                <div style={{ marginTop: 24, background: "#fff", padding: 12, borderRadius: 8 }}>
                    <Typography variant="subtitle1">📈 Top Sách theo lượt xem</Typography>
                    <BarChart width={900} height={300} data={bookViewsData}>
                        <XAxis dataKey="title" hide />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="#413ea0" />
                    </BarChart>
                </div>

                {/* FOOTER */}
                <div style={{ marginTop: 12, textAlign: "right", color: "#666" }}>
                    <small>Generated on {new Date().toLocaleString()}</small>
                </div>
            </div>
        </div>
    );
}
