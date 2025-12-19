import React, { useEffect, useState } from "react";
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Toolbar,
    Typography,
    AppBar,
    Box,
    Button,
} from "@mui/material";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const menuItems = [
    { text: "Trang chủ", path: "/" },
    { text: "Đăng tải sách", path: "/dang-tai-sach" },
    { text: "Quản lý sách", path: "/quan-ly-sach" },
    { text: "Duyệt sách", path: "/duyet-sach" },
    { text: "Quản lý chương", path: "/quan-ly-chuong" },
    { text: "Duyệt chương", path: "/duyet-chuong" },
    { text: "Quản lý đánh giá, bình luận", path: "/quan-ly-danh-gia" },
    { text: "Quản lý thể loại", path: "/quan-ly-the-loai" },
    { text: "Quản lý người dùng", path: "/admin/users" },
    { text: "Quản lý tin nhắn", path: "/quan-ly-tin-nhan" },
    { text: "Quản lý khung ảnh", path: "/quan-ly-khung" },
    { text: "Quản lý từ cấm", path: "/quan-ly-tu-cam" },
    { text: "Thông báo", path: "/thong-bao" },
    { text: "Quản lý xu", path: "/quan-ly-xu" },
    { text: "Quyền tác giả", path: "/quyen-tac-gia" },
    { text: "Thống kê", path: "/thong-ke" },
    { text: "Tra cứu", path: "/tra-cuu" },
    { text: "Cuộc đua", path: "/cuoc-dua" },
];

const AdminLayout = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/dang-nhap");
    };

    return (
        <Box sx={{ display: "flex" }}>
            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: 240,
                    [`& .MuiDrawer-paper`]: {
                        width: 240,
                        boxSizing: "border-box",
                        bgcolor: "#FFF5EE",
                        borderRight: "1px solid #ddd",
                    },
                }}
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ color: "#8B0000", fontWeight: "bold" }}>
                        📚 Admin
                    </Typography>
                </Toolbar>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <NavLink
                                to={item.path}
                                style={({ isActive }) => ({
                                    textDecoration: "none",
                                    color: isActive ? "#8B0000" : "#333",
                                    fontWeight: isActive ? "600" : "400",
                                    width: "100%",
                                })}
                            >
                                <ListItemButton>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </NavLink>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* Nội dung + Navbar */}
            <Box sx={{ flexGrow: 1 }}>
                {/* Navbar */}
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{
                        bgcolor: "white",
                        borderBottom: "1px solid #ddd",
                        color: "#5D4037",
                    }}
                >
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#8B0000" }}>
                            Quản trị
                        </Typography>
                        <Box>
                            {user && (
                                <Typography component="span" sx={{ mr: 2, fontWeight: "medium" }}>
                                    Xin chào, {user.email}
                                </Typography>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleLogout}
                                sx={{
                                    bgcolor: "#8B0000",
                                    "&:hover": { bgcolor: "#A52A2A" },
                                    borderRadius: 2,
                                }}
                            >
                                Đăng xuất
                            </Button>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Outlet cho nội dung riêng của từng page */}
                <Box sx={{ p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
