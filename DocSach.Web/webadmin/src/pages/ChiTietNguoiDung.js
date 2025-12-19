// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import { getUserById } from "../api";
// import "../CSS/ChiTietNguoiDung.css";

// const ChiTietNguoiDung = () => {
//     const { id } = useParams();
//     const [nguoiDung, setNguoiDung] = useState(null);

//     useEffect(() => {
//         getUserById(id).then(data => setNguoiDung(data));
//     }, [id]);

//     if (!nguoiDung) return <p>Đang tải dữ liệu...</p>;

//     return (
//         <div className="chitiet-nguoidung">
//             <h2>Chi tiết Người dùng</h2>
//             <div className="info">
//                 <div className="avatar">
//                     <img
//                         src={nguoiDung.avatar || "https://via.placeholder.com/150"}
//                         alt="Avatar"
//                     />
//                 </div>
//                 <div className="details">
//                     <p><strong>Username:</strong> {nguoiDung.username}</p>
//                     <p><strong>Email:</strong> {nguoiDung.email}</p>
//                     <p><strong>Vai trò:</strong> {nguoiDung.role}</p>
//                     <p><strong>Bio:</strong> {nguoiDung.bio || "Chưa có thông tin"}</p>
//                     <p><strong>Lần đăng nhập cuối:</strong> {nguoiDung.lastLogin ? new Date(nguoiDung.lastLogin).toLocaleString() : "Chưa có"}</p>
//                     <p><strong>Hiển thị tên:</strong> {nguoiDung.showDisplayName ? "Có" : "Không"}</p>
//                 </div>
//             </div>
//             <Link to="/nguoidung" className="back-button">← Quay lại danh sách</Link>
//         </div>
//     );
// };

// export default ChiTietNguoiDung;
