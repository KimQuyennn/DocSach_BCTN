// import React from "react";
// import { Link, useLocation } from "react-router-dom";

// export default function Sidebar() {
//     const { pathname } = useLocation();
//     const Item = ({ to, children }) => (
//         <Link
//             to={to}
//             style={{
//                 display: "block",
//                 padding: "10px 12px",
//                 borderRadius: 8,
//                 background: pathname === to ? "#eef5ff" : "transparent",
//                 textDecoration: "none",
//                 color: "#333",
//             }}
//         >
//             {children}
//         </Link>
//     );

//     return (
//         <aside style={{ width: 220, padding: 16, borderRight: "1px solid #eee" }}>
//             <h3>Admin</h3>
//             <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
//                 <Item to="/TrangChu">Trang chủ</Item>
//                 {/* Thêm các mục khác: /NguoiDung, /Sach, /BinhLuan, ... */}
//             </div>
//         </aside>
//     );
// }