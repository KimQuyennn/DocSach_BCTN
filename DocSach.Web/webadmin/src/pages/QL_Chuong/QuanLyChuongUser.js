import React, { useState, useEffect } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../services/firebase";
import FormChuong from "../../pages/QL_Chuong/FormChuong";
import { useParams } from "react-router-dom";

export default function QuanLyChuongUser() {
    const { bookId } = useParams();
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [genres, setGenres] = useState({});
    const currentUserId = localStorage.getItem("userId");

    // Load tất cả sách của user
    useEffect(() => {
        const booksRef = ref(db, "Books");
        onValue(booksRef, (snapshot) => {
            const data = snapshot.val() || {};
            const userBooks = Object.values(data).filter(b => b.UploaderId === currentUserId);
            setBooks(userBooks);

            // Nếu có bookId từ params, tự động chọn sách
            if (bookId) {
                const found = userBooks.find(b => b.Id === bookId);
                if (found) setSelectedBook(found);
            }
        });
    }, [currentUserId, bookId]);

    // Load chương cho sách được chọn
    useEffect(() => {
        if (!selectedBook) return;
        const chapRef = ref(db, "Chapters");
        onValue(chapRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.values(data).filter(c => c.BookId === selectedBook.Id);
            setChapters(list);
        });
    }, [selectedBook]);

    // Load genres
    useEffect(() => {
        const genreRef = ref(db, "Genres");
        onValue(genreRef, (snapshot) => {
            const data = snapshot.val() || {};
            const map = {};
            Object.values(data).forEach(g => {
                map[g.Id] = g.Name;
            });
            setGenres(map);
        });
    }, []);

    const deleteChapter = (chapterId) => {
        if (window.confirm("Bạn có chắc muốn xóa chương này?")) {
            const chapterRef = ref(db, `Chapters/${chapterId}`);
            remove(chapterRef);
        }
    };

    const toggleApprove = (chapterId, currentStatus) => {
        const chapterRef = ref(db, `Chapters/${chapterId}`);
        update(chapterRef, { IsApproved: !currentStatus });
    };

    const approvedChapters = chapters.filter(c => c.IsApproved && !c.Rejected);
    const pendingChapters = chapters.filter(c => !c.IsApproved && !c.Rejected);
    const rejectedChapters = chapters.filter(c => c.Rejected);

    const filteredBooks = books;

    const buttonStyle = {
        padding: "6px 12px",
        marginLeft: 4,
        borderRadius: 4,
        border: "none",
        cursor: "pointer",
        fontSize: 12,
    };
    const approveBtnStyle = { ...buttonStyle, backgroundColor: "#28a745", color: "#fff" };
    const unapproveBtnStyle = { ...buttonStyle, backgroundColor: "#ffc107", color: "#fff" };
    const deleteBtnStyle = { ...buttonStyle, backgroundColor: "#dc3545", color: "#fff" };
    const addBtnStyle = { ...buttonStyle, backgroundColor: "#007bff", color: "#fff", marginBottom: 16 };

    return (
        <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
            {/* Danh sách sách */}
            <div style={{ flex: 2, padding: 20, borderRight: "1px solid #ccc", overflowY: "auto" }}>
                {filteredBooks.map(book => (
                    <div
                        key={book.Id}
                        onClick={() => setSelectedBook(book)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: 8,
                            marginBottom: 12,
                            border: selectedBook?.Id === book.Id ? "2px solid #007bff" : "1px solid #ccc",
                            borderRadius: 6,
                            cursor: "pointer",
                        }}
                    >
                        <img
                            src={book.CoverImage || "https://via.placeholder.com/50x70?text=No+Image"}
                            alt={book.Title}
                            style={{ width: 50, height: 70, objectFit: "cover", marginRight: 12 }}
                        />
                        <div>
                            <div style={{ fontWeight: "bold" }}>{book.Title}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>{book.Author || "Chưa có tác giả"}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>{book.Status || "Chưa rõ trạng thái"}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Thông tin sách + form chương */}
            <div style={{ flex: 3, padding: 20, borderRight: "1px solid #ccc", overflowY: "auto" }}>
                {selectedBook ? (
                    <>
                        <div style={{
                            display: "flex",
                            padding: 16,
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            marginBottom: 20,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            background: "#fff",
                        }}>
                            <img
                                src={selectedBook.CoverImage || "https://via.placeholder.com/120x160?text=No+Image"}
                                alt={selectedBook.Title}
                                style={{ width: 120, height: 160, objectFit: "cover", borderRadius: 6, marginRight: 16 }}
                            />
                            <div style={{ flex: 1 }}>
                                <h2 style={{ margin: "0 0 8px 0" }}>{selectedBook.Title}</h2>
                                <p style={{ margin: "4px 0", color: "#555" }}>✍️ <b>Tác giả:</b> {selectedBook.Author || "Chưa rõ"}</p>
                                <p style={{ margin: "4px 0", color: "#555" }}>📖 <b>Thể loại:</b> {genres[selectedBook.GenreId] || "Chưa rõ"}</p>
                                <p style={{ margin: "4px 0", color: "#555" }}>📌 <b>Trạng thái:</b> {selectedBook.Status || "Chưa rõ"}</p>
                                <p style={{ margin: "4px 0", color: "#555" }}>🕒 <b>Ngày tạo:</b>{" "}
                                    {selectedBook.CreatedAt ? new Date(selectedBook.CreatedAt).toLocaleDateString("vi-VN") : "Không rõ"}
                                </p>
                            </div>
                        </div>

                        <button
                            style={addBtnStyle}
                            onClick={() => { setEditingChapter(null); setShowForm(!showForm); }}
                        >
                            {showForm ? "Đóng form" : "Thêm Chương"}
                        </button>

                        {showForm && (
                            <FormChuong
                                bookId={selectedBook.Id}
                                userRole="User"
                                currentUserId={currentUserId}
                                onClose={() => setShowForm(false)}
                                chapter={editingChapter}
                                chapters={chapters}
                            />
                        )}
                    </>
                ) : (
                    <div>Chọn một cuốn sách để quản lý chương</div>
                )}
            </div>

            {/* Sidebar chương */}
            <div style={{ flex: 1.5, padding: 20, overflowY: "auto" }}>
                <h3>Chương đã duyệt</h3>
                <ul style={{ paddingLeft: 16 }}>
                    {approvedChapters.sort((a, b) => a.ChapterNumber - b.ChapterNumber)
                        .map(ch => (
                            <li key={ch.Id} style={{ marginBottom: 8 }}>
                                {ch.ChapterNumber}. {ch.Title}
                                {/* <button style={unapproveBtnStyle} onClick={() => toggleApprove(ch.Id, ch.IsApproved)}>Huỷ duyệt</button> */}
                                <button style={addBtnStyle} onClick={() => { setEditingChapter(ch); setShowForm(true); }}>✏️ Chỉnh sửa</button>
                                <button style={deleteBtnStyle} onClick={() => deleteChapter(ch.Id)}>Xóa</button>
                            </li>
                        ))}
                </ul>

                <h3>Chưa duyệt</h3>
                <ul style={{ paddingLeft: 16 }}>
                    {pendingChapters.sort((a, b) => a.ChapterNumber - b.ChapterNumber)
                        .map(ch => (
                            <li key={ch.Id} style={{ marginBottom: 8 }}>
                                {ch.ChapterNumber}. {ch.Title}
                                {/* <button style={approveBtnStyle} onClick={() => toggleApprove(ch.Id, ch.IsApproved)}>Duyệt</button> */}
                                <button style={addBtnStyle} onClick={() => { setEditingChapter(ch); setShowForm(true); }}>✏️ Chỉnh sửa</button>
                                <button style={deleteBtnStyle} onClick={() => deleteChapter(ch.Id)}>Xóa</button>
                            </li>
                        ))}
                </ul>

                <h3>Chương bị từ chối</h3>
                <ul style={{ paddingLeft: 16 }}>
                    {rejectedChapters.sort((a, b) => a.ChapterNumber - b.ChapterNumber)
                        .map(ch => (
                            <li key={ch.Id} style={{ marginBottom: 8 }}>
                                {ch.ChapterNumber}. {ch.Title}
                                <div style={{ fontSize: 12, color: "red" }}>❌ Lý do: {ch.RejectedReason || "Không có lý do"}</div>
                                {/* <button style={approveBtnStyle} onClick={() => toggleApprove(ch.Id, ch.IsApproved)}>Duyệt lại</button> */}
                                <button style={addBtnStyle} onClick={() => { setEditingChapter(ch); setShowForm(true); }}>✏️ Chỉnh sửa</button>
                                <button style={deleteBtnStyle} onClick={() => deleteChapter(ch.Id)}>Xóa</button>
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
}
