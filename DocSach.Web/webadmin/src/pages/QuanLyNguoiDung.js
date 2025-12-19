import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, remove, push } from "firebase/database";
import {
    Box,
    Avatar,
    Button,
    Typography,
    Paper,
    Select,
    MenuItem,
    TextField
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

function QuanLyNguoiDung() {
    const [users, setUsers] = useState([]);
    const [searchText, setSearchText] = useState("");

    const db = getDatabase();

    // Lấy danh sách người dùng
    useEffect(() => {
        const usersRef = ref(db, "Users");
        const unsub = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
                setUsers(list);
            } else setUsers([]);
        });
        return () => unsub();
    }, [db]);

    // Xóa user
    const handleDelete = (id) => {
        remove(ref(db, `Users/${id}`));
    };

    // Thay đổi Role
    const handleChangeRole = (id, newRole) => {
        update(ref(db, `Users/${id}`), { Role: newRole });
    };

    // Block/Unblock user & tạo notification nếu bị block hoặc gỡ
    const handleBlockUser = async (user) => {
        const newBlockStatus = !user.isBlock;
        const updates = { isBlock: newBlockStatus };
        if (newBlockStatus) {
            updates.blockedAt = Date.now();
        } else {
            updates.blockedAt = null;
        }
        await update(ref(db, `Users/${user.id}`), updates);

        // Tạo thông báo
        const notiRef = ref(db, `Notifications/${user.id}`);
        await push(notiRef, {
            title: newBlockStatus ? "Bạn đã bị chặn!" : "Tài khoản được mở lại!",
            message: newBlockStatus
                ? "Tài khoản của bạn đã bị admin chặn, bạn sẽ không thể truy cập một số tính năng."
                : "Tài khoản của bạn đã được mở lại, bạn có thể tiếp tục sử dụng.",
            type: "block_user",
            createdAt: Date.now(),
            read: false,
        });
    };

    // Kiểm tra tự động hết thời gian chặn
    useEffect(() => {
        const timer = setInterval(() => {
            for (const user of users) {
                if (user.isBlock && user.blockedAt) {
                    if (Date.now() - user.blockedAt >= THIRTY_DAYS) {
                        handleBlockUser({ ...user, isBlock: true }); // gỡ block
                    }
                }
            }
        }, 60000); // kiểm tra mỗi phút
        return () => clearInterval(timer);
    }, [users, THIRTY_DAYS, db]);

    // Filter theo search
    const filteredUsers = users.filter(
        (u) =>
            u.Username?.toLowerCase().includes(searchText.toLowerCase()) ||
            u.Email?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            field: "Avatar",
            headerName: "Avatar",
            width: 100,
            renderCell: (params) => (
                <Avatar src={params.value} alt="avatar" sx={{ width: 40, height: 40, mx: "auto" }} />
            ),
        },
        { field: "Username", headerName: "Tên đăng nhập", flex: 1 },
        { field: "Email", headerName: "Email", flex: 1.5 },
        {
            field: "isBlock",
            headerName: "Trạng thái",
            width: 150,
            renderCell: (params) => (
                <Button
                    size="small"
                    variant="contained"
                    color={params.value ? "error" : "success"}
                    onClick={() => handleBlockUser(params.row)}
                >
                    {params.value ? "Bị chặn" : "Hoạt động"}
                </Button>
            ),
        },
        {
            field: "Role",
            headerName: "Vai trò",
            width: 180,
            renderCell: (params) => (
                <Select
                    size="small"
                    value={params.value || "User"}
                    onChange={(e) => handleChangeRole(params.row.id, e.target.value)}
                    sx={{
                        minWidth: 120,
                        borderRadius: 2,
                        bgcolor:
                            params.value === "Admin"
                                ? "#fdecea"
                                : params.value === "Editor"
                                    ? "#fff4e5"
                                    : "#e8f5e9",
                        "& .MuiSelect-select": { fontWeight: "bold" },
                    }}
                >
                    <MenuItem value="Admin">Admin</MenuItem>
                    <MenuItem value="Editor">Quản lý</MenuItem>
                    <MenuItem value="User">Người dùng</MenuItem>
                </Select>
            ),
        },
        { field: "CreatedAt", headerName: "Ngày tạo", flex: 1 },
        {
            field: "actions",
            headerName: "Thao tác",
            width: 150,
            renderCell: (params) => (
                <Button size="small" variant="contained" color="error" onClick={() => handleDelete(params.row.id)}>
                    Xoá
                </Button>
            ),
        },
    ];

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" mb={2} sx={{ color: "#8B0000" }}>
                👥 Quản lý Người dùng
            </Typography>

            <TextField
                placeholder="Tìm kiếm username hoặc email..."
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mb: 2 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />

            <Paper
                elevation={3}
                sx={{
                    height: 520,
                    borderRadius: 3,
                    overflow: "hidden",
                    "& .MuiDataGrid-root": { border: "none" },
                    "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f0eb", fontWeight: "bold", fontSize: "15px" },
                    "& .MuiDataGrid-row:hover": { backgroundColor: "#fafafa" },
                }}
            >
                <DataGrid
                    rows={filteredUsers}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10]}
                    disableSelectionOnClick
                />
            </Paper>
        </Box>
    );
}

export default QuanLyNguoiDung;
