// // import React, { useEffect, useState, useRef } from "react";
// // import {
// //     List,
// //     ListItem,
// //     ListItemAvatar,
// //     Avatar,
// //     ListItemText,
// //     Typography,
// //     Paper,
// //     Box,
// //     TextField,
// //     Button
// // } from "@mui/material";
// // import { ref, onValue, push } from "firebase/database";
// // import { db, auth } from "../services/firebase";

// // export default function QuanLyTinNhan() {
// //     const [usersChats, setUsersChats] = useState([]);
// //     const [selectedUser, setSelectedUser] = useState(null);
// //     const [messages, setMessages] = useState([]);
// //     const [inputText, setInputText] = useState("");
// //     const messagesEndRef = useRef(null);

// //     // Lấy danh sách user đã chat
// //     useEffect(() => {
// //         const chatsRef = ref(db, "Chats");
// //         const usersRef = ref(db, "Users");

// //         onValue(usersRef, usersSnap => {
// //             const usersData = usersSnap.val() || {};

// //             onValue(chatsRef, chatsSnap => {
// //                 const chatsData = chatsSnap.val() || {};
// //                 const list = Object.entries(chatsData).map(([chatKey, chatValue]) => {
// //                     const userId = chatKey.replace("_admin", "");
// //                     const user = usersData[userId];
// //                     return {
// //                         chatKey,
// //                         userId,
// //                         username: user?.Username || "Unknown",
// //                         avatar: user?.Avatar || "",
// //                     };
// //                 });
// //                 setUsersChats(list);
// //             });
// //         });
// //     }, []);

// //     // Lấy tin nhắn khi chọn user
// //     useEffect(() => {
// //         if (!selectedUser) return;

// //         const chatRef = ref(db, `Chats/${selectedUser}_admin/messages`);
// //         onValue(chatRef, snap => {
// //             const data = snap.val() || {};
// //             const msgs = Object.entries(data).map(([id, msg]) => ({
// //                 id,
// //                 ...msg
// //             }));
// //             msgs.sort((a, b) => a.timestamp - b.timestamp);
// //             setMessages(msgs);

// //             // cuộn xuống cuối chat
// //             setTimeout(() => {
// //                 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //             }, 100);
// //         });
// //     }, [selectedUser]);

// //     // Gửi tin nhắn từ admin
// //     const sendMessage = () => {
// //         if (!inputText.trim() || !selectedUser) return;

// //         const chatRef = ref(db, `Chats/${selectedUser}_admin/messages`);
// //         const newMsg = {
// //             senderId: "admin", // admin gửi
// //             text: inputText,
// //             timestamp: Date.now(),
// //             avatar: "", // nếu admin có avatar có thể thêm link
// //         };

// //         push(chatRef, newMsg)
// //             .then(() => setInputText(""))
// //             .catch(err => console.error("Lỗi gửi tin nhắn:", err));
// //     };

// //     return (
// //         <Box display="flex" height="100vh">
// //             {/* Danh sách user */}
// //             <Paper style={{ width: "250px", overflowY: "auto" }}>
// //                 <List>
// //                     {usersChats.map(user => (
// //                         <ListItem
// //                             button
// //                             key={user.userId}
// //                             selected={selectedUser === user.userId}
// //                             onClick={() => setSelectedUser(user.userId)}
// //                         >
// //                             <ListItemAvatar>
// //                                 <Avatar src={user.avatar}>{user.username[0]}</Avatar>
// //                             </ListItemAvatar>
// //                             <ListItemText primary={user.username} />
// //                         </ListItem>
// //                     ))}
// //                 </List>
// //             </Paper>

// //             {/* Chat */}
// //             <Paper style={{ flex: 1, display: "flex", flexDirection: "column" }}>
// //                 <Box style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
// //                     {selectedUser ? (
// //                         messages.map(msg => (
// //                             <Box
// //                                 key={msg.id}
// //                                 display="flex"
// //                                 justifyContent={msg.senderId === selectedUser ? "flex-start" : "flex-end"}
// //                                 mb={1}
// //                             >
// //                                 <Box
// //                                     p={1}
// //                                     borderRadius={2}
// //                                     bgcolor={msg.senderId === selectedUser ? "#eee" : "#00c853"}
// //                                     color={msg.senderId === selectedUser ? "#000" : "#fff"}
// //                                     maxWidth="70%"
// //                                 >
// //                                     <Typography>{msg.text}</Typography>
// //                                     <Typography variant="caption" display="block" textAlign="right">
// //                                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
// //                                     </Typography>
// //                                 </Box>
// //                             </Box>
// //                         ))
// //                     ) : (
// //                         <Typography variant="h6">Chọn một người dùng để xem chat</Typography>
// //                     )}
// //                     <div ref={messagesEndRef} />
// //                 </Box>

// //                 {/* Input gửi tin nhắn */}
// //                 {selectedUser && (
// //                     <Box display="flex" p={1} borderTop="1px solid #ddd">
// //                         <TextField
// //                             value={inputText}
// //                             onChange={e => setInputText(e.target.value)}
// //                             placeholder="Nhập tin nhắn..."
// //                             fullWidth
// //                             variant="outlined"
// //                             size="small"
// //                         />
// //                         <Button
// //                             onClick={sendMessage}
// //                             variant="contained"
// //                             color="success"
// //                             style={{ marginLeft: 8 }}
// //                         >
// //                             Gửi
// //                         </Button>
// //                     </Box>
// //                 )}
// //             </Paper>
// //         </Box>
// //     );
// // }


// import React, { useEffect, useState, useRef } from "react";
// import {
//     List,
//     ListItem,
//     ListItemAvatar,
//     Avatar,
//     ListItemText,
//     Typography,
//     Paper,
//     Box,
//     TextField,
//     Button
// } from "@mui/material";
// import { ref, onValue, push } from "firebase/database";
// import { db } from "../services/firebase";

// export default function QuanLyTinNhan() {
//     const [usersChats, setUsersChats] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [messages, setMessages] = useState([]);
//     const [inputText, setInputText] = useState("");
//     const [search, setSearch] = useState("");
//     const messagesEndRef = useRef(null);

//     // ============================
//     // 🔥 Lấy danh sách user đã chat + thông tin user
//     // ============================
//     useEffect(() => {
//         const chatsRef = ref(db, "Chats");
//         const usersRef = ref(db, "Users");

//         onValue(usersRef, usersSnap => {
//             const usersData = usersSnap.val() || {};

//             onValue(chatsRef, chatsSnap => {
//                 const chatsData = chatsSnap.val() || {};

//                 const list = Object.entries(chatsData).map(([chatKey]) => {
//                     const userId = chatKey.replace("_admin", "");
//                     const user = usersData[userId] || {};

//                     return {
//                         chatKey,
//                         userId,
//                         username: user.Username || "Unknown",
//                         avatar: user.Avatar || "",
//                     };
//                 });

//                 setUsersChats(list);
//             });
//         });
//     }, []);

//     // ============================
//     // 🔥 Lấy tin nhắn của user đang chọn
//     // ============================
//     useEffect(() => {
//         if (!selectedUser) return;

//         const chatRef = ref(db, `Chats/${selectedUser}_admin/messages`);

//         onValue(chatRef, snap => {
//             const data = snap.val() || {};

//             const msgs = Object.entries(data).map(([id, msg]) => ({
//                 id,
//                 ...msg
//             }));

//             msgs.sort((a, b) => a.timestamp - b.timestamp);

//             setMessages(msgs);

//             setTimeout(() => {
//                 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//             }, 100);
//         });

//     }, [selectedUser]);

//     // ============================
//     // 🔥 Gửi tin nhắn từ admin
//     // ============================
//     const sendMessage = () => {
//         if (!inputText.trim() || !selectedUser) return;

//         const chatRef = ref(db, `Chats/${selectedUser}_admin/messages`);
//         const newMsg = {
//             senderId: "admin",
//             text: inputText,
//             timestamp: Date.now(),
//             avatar: "",
//         };

//         push(chatRef, newMsg)
//             .then(() => setInputText(""))
//             .catch(err => console.error("Lỗi gửi tin nhắn:", err));
//     };

//     // ============================
//     // 🔍 Lọc danh sách theo tên user
//     // ============================
//     const filteredUsers = usersChats.filter(user =>
//         user.username.toLowerCase().includes(search.toLowerCase())
//     );

//     return (
//         <Box display="flex" height="100vh">
//             {/* DANH SÁCH USER */}
//             <Paper style={{ width: "260px", overflowY: "auto" }}>
//                 <TextField
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     placeholder="Tìm người dùng..."
//                     fullWidth
//                     size="small"
//                     style={{ margin: "10px" }}
//                 />

//                 <List>
//                     {filteredUsers.map(user => (
//                         <ListItem
//                             button
//                             key={user.userId}
//                             selected={selectedUser === user.userId}
//                             onClick={() => setSelectedUser(user.userId)}
//                         >
//                             <ListItemAvatar>
//                                 <Avatar src={user.avatar}>{user.username[0]}</Avatar>
//                             </ListItemAvatar>
//                             <ListItemText primary={user.username} />
//                         </ListItem>
//                     ))}
//                 </List>
//             </Paper>

//             {/* KHUNG CHAT */}
//             <Paper style={{ flex: 1, display: "flex", flexDirection: "column" }}>
//                 <Box style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
//                     {selectedUser ? (
//                         messages.map(msg => (
//                             <Box
//                                 key={msg.id}
//                                 display="flex"
//                                 justifyContent={msg.senderId === selectedUser ? "flex-start" : "flex-end"}
//                                 mb={1}
//                             >
//                                 <Box
//                                     p={1}
//                                     borderRadius={2}
//                                     bgcolor={msg.senderId === selectedUser ? "#eee" : "#00c853"}
//                                     color={msg.senderId === selectedUser ? "#000" : "#fff"}
//                                     maxWidth="70%"
//                                 >
//                                     <Typography>{msg.text}</Typography>
//                                     <Typography
//                                         variant="caption"
//                                         display="block"
//                                         textAlign="right"
//                                     >
//                                         {new Date(msg.timestamp).toLocaleTimeString([], {
//                                             hour: "2-digit",
//                                             minute: "2-digit"
//                                         })}
//                                     </Typography>
//                                 </Box>
//                             </Box>
//                         ))
//                     ) : (
//                         <Typography variant="h6">Chọn một người dùng để xem tin nhắn</Typography>
//                     )}
//                     <div ref={messagesEndRef} />
//                 </Box>

//                 {/* GỬI TIN NHẮN */}
//                 {selectedUser && (
//                     <Box display="flex" p={1} borderTop="1px solid #ddd">
//                         <TextField
//                             value={inputText}
//                             onChange={e => setInputText(e.target.value)}
//                             placeholder="Nhập tin nhắn..."
//                             fullWidth
//                             variant="outlined"
//                             size="small"
//                         />
//                         <Button
//                             onClick={sendMessage}
//                             variant="contained"
//                             color="success"
//                             style={{ marginLeft: 8 }}
//                         >
//                             Gửi
//                         </Button>
//                     </Box>
//                 )}
//             </Paper>
//         </Box>
//     );
// }


import React, { useEffect, useState, useRef } from "react";
import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    Paper,
    Box,
    TextField,
    Button
} from "@mui/material";
// Thêm 'update' để đánh dấu tin nhắn đã đọc
import { ref, onValue, push, update } from "firebase/database";
import { db } from "../services/firebase";

export default function QuanLyTinNhan() {
    const [usersChats, setUsersChats] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [search, setSearch] = useState("");
    const messagesEndRef = useRef(null);

    // ============================
    // 🔥 Lấy danh sách user đã chat, tính số tin chưa đọc và SẮP XẾP
    // ============================
    useEffect(() => {
        const chatsRef = ref(db, "Chats");
        const usersRef = ref(db, "Users");

        onValue(usersRef, usersSnap => {
            const usersData = usersSnap.val() || {};

            onValue(chatsRef, chatsSnap => {
                const chatsData = chatsSnap.val() || {};

                const list = Object.entries(chatsData).map(([chatKey, chatValue]) => {
                    const userId = chatKey.replace("_admin", "");
                    const user = usersData[userId] || {};

                    // --- Kiểm tra trạng thái đọc và tính số lượng ---
                    const messages = chatValue.messages ? Object.values(chatValue.messages) : [];

                    // Đếm số tin nhắn do user gửi và chưa được Admin đọc
                    const unreadCount = messages.filter(msg =>
                        msg.senderId === userId && msg.readByAdmin !== true
                    ).length;

                    // Lấy tin nhắn cuối cùng để sắp xếp
                    const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
                    const lastMessage = sortedMessages[sortedMessages.length - 1];

                    // Lấy timestamp tin nhắn cuối cùng để sắp xếp phụ (nếu cả hai đều chưa đọc)
                    const lastTimestamp = lastMessage ? lastMessage.timestamp : 0;

                    return {
                        chatKey,
                        userId,
                        username: user.Username || "Unknown",
                        avatar: user.Avatar || "",
                        unreadCount: unreadCount, // Số tin chưa đọc
                        lastTimestamp: lastTimestamp, // Timestamp tin nhắn cuối cùng
                    };
                });

                // --- Sắp xếp list: Ưu tiên (1) Chưa đọc > 0, (2) Tin nhắn mới nhất lên đầu ---
                list.sort((a, b) => {
                    // 1. Ưu tiên chat có tin nhắn chưa đọc lên trước (unreadCount > 0)
                    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
                    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

                    // 2. Nếu trạng thái đọc giống nhau (cùng chưa đọc hoặc cùng đã đọc), 
                    //    sắp xếp theo timestamp tin nhắn cuối cùng (giảm dần: mới nhất lên đầu)
                    return b.lastTimestamp - a.lastTimestamp;
                });

                setUsersChats(list);
            });
        });
    }, []);

    // ============================
    // 🔥 Lấy tin nhắn của user đang chọn + ĐÁNH DẤU ĐÃ ĐỌC
    // ============================
    useEffect(() => {
        if (!selectedUser) return;

        const chatRef = ref(db, `Chats/${selectedUser}_admin/messages`);

        // onValue trả về hàm unsubscribe (off) trong Firebase SDK v9, 
        // nhưng React Hook Firebase thường tự quản lý việc này. 
        onValue(chatRef, snap => {
            const data = snap.val() || {};
            const msgs = Object.entries(data).map(([id, msg]) => ({
                id,
                ...msg
            }));

            msgs.sort((a, b) => a.timestamp - b.timestamp);

            setMessages(msgs);

            // Cuộn xuống cuối
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);

            // --- Đánh dấu tin nhắn user gửi là đã đọc ---
            const unreadMessages = msgs.filter(msg => msg.senderId === selectedUser && msg.readByAdmin !== true);

            if (unreadMessages.length > 0) {
                const updates = {};

                // Chuẩn bị cập nhật cho tất cả tin nhắn chưa đọc
                unreadMessages.forEach(msg => {
                    updates[msg.id + '/readByAdmin'] = true;
                });

                update(ref(db, `Chats/${selectedUser}_admin/messages`), updates)
                    .catch(err => console.error("Lỗi cập nhật trạng thái đọc:", err));
            }
            // --- Kết thúc đánh dấu ---

        });

    }, [selectedUser]);

    // ============================
    // 🔥 Gửi tin nhắn từ admin
    // ============================
    const sendMessage = () => {
        if (!inputText.trim() || !selectedUser) return;

        const chatRef = ref(db, `Chats/${selectedUser}_admin/messages`);
        const newMsg = {
            senderId: "admin",
            text: inputText,
            timestamp: Date.now(),
            avatar: "",
        };

        push(chatRef, newMsg)
            .then(() => setInputText(""))
            .catch(err => console.error("Lỗi gửi tin nhắn:", err));
    };

    // ============================
    // 🔍 Lọc danh sách theo tên user
    // ============================
    const filteredUsers = usersChats.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box display="flex" height="100vh">
            {/* DANH SÁCH USER */}
            <Paper style={{ width: "260px", overflowY: "auto", borderRight: "1px solid #ddd" }}>
                <Box p={1}>
                    <TextField
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm người dùng..."
                        fullWidth
                        size="small"
                        variant="outlined"
                    />
                </Box>

                <List disablePadding>
                    {filteredUsers.map(user => (
                        <ListItem
                            button
                            key={user.userId}
                            selected={selectedUser === user.userId}
                            onClick={() => setSelectedUser(user.userId)}
                            // Highlight nếu có tin nhắn chưa đọc
                            style={user.unreadCount > 0 ? { backgroundColor: '#fffde7', borderLeft: '3px solid #ffc107' } : {}}
                        >
                            <ListItemAvatar>
                                <Avatar src={user.avatar}>{user.username[0]}</Avatar>
                            </ListItemAvatar>

                            <ListItemText
                                primary={user.username}
                                primaryTypographyProps={{ fontWeight: user.unreadCount > 0 ? 'bold' : 'normal' }}
                            />

                            {/* HIỂN THỊ SỐ TIN NHẮN CHƯA ĐỌC (Badge) */}
                            {user.unreadCount > 0 && (
                                <Box
                                    sx={{
                                        minWidth: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        bgcolor: 'error.main', // Màu đỏ
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        ml: 1 // margin left
                                    }}
                                >
                                    {user.unreadCount}
                                </Box>
                            )}
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* KHUNG CHAT */}
            <Paper style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <Box style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
                    {selectedUser ? (
                        messages.map(msg => (
                            <Box
                                key={msg.id}
                                display="flex"
                                justifyContent={msg.senderId === selectedUser ? "flex-start" : "flex-end"}
                                mb={1}
                            >
                                <Box
                                    p={1}
                                    borderRadius={2}
                                    bgcolor={msg.senderId === selectedUser ? "#e0f7fa" : "#00c853"}
                                    color={msg.senderId === selectedUser ? "#000" : "#fff"}
                                    maxWidth="70%"
                                >
                                    <Typography>{msg.text}</Typography>
                                    <Typography
                                        variant="caption"
                                        display="block"
                                        textAlign="right"
                                    >
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="h6" sx={{ p: 2, color: 'text.secondary' }}>
                            Chọn một người dùng để xem tin nhắn
                        </Typography>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* GỬI TIN NHẮN */}
                {selectedUser && (
                    <Box display="flex" p={1} borderTop="1px solid #ddd">
                        <TextField
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    sendMessage();
                                    e.preventDefault();
                                }
                            }}
                            placeholder="Nhập tin nhắn..."
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <Button
                            onClick={sendMessage}
                            variant="contained"
                            color="success"
                            style={{ marginLeft: 8 }}
                        >
                            Gửi
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}