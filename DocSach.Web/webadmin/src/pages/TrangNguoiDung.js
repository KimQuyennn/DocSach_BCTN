// // pages/TrangNguoiDung.js
// import React, { useEffect, useState } from "react";

// const TrangNguoiDung = () => {
//     const [nguoiDung, setNguoiDung] = useState([]);

//     useEffect(() => {
//         fetch("/api/users")
//             .then(res => res.json())
//             .then(data => setNguoiDung(data))
//             .catch(err => console.error(err));
//     }, []);

//     return (
//         <div style={{ padding: "20px" }}>
//             <h2>Danh sách người dùng</h2>
//             {nguoiDung.length === 0 ? (
//                 <p>Đang tải dữ liệu...</p>
//             ) : (
//                 <table border="1" cellPadding="10">
//                     <thead>
//                         <tr>
//                             <th>ID</th>
//                             <th>Username</th>
//                             <th>Email</th>
//                             <th>Role</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {nguoiDung.map((user) => (
//                             <tr key={user.id}>
//                                 <td>{user.id}</td>
//                                 <td>{user.username}</td>
//                                 <td>{user.email}</td>
//                                 <td>{user.role}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             )}
//         </div>
//     );
// };

// export default TrangNguoiDung;
