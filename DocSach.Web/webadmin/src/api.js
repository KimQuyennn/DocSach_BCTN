import axios from "axios";

const API = axios.create({
    baseURL: "https://localhost:7257/api",
    headers: { "Content-Type": "application/json" },
});

export async function getUsers() {
    try {
        const res = await API.get("/Users");
        return res.data;
    } catch (err) {
        console.error("Lỗi lấy danh sách người dùng:", err);
        // fallback fake data nếu API chưa sẵn sàng
        // return [
        //     { id: "1", username: "quyen", email: "quyen@gmail.com", role: "User", avatar: "" },
        //     { id: "2", username: "admin", email: "admin@gmail.com", role: "Admin", avatar: "" },
        // ];
    }
}

export async function getUserById(id) {
    try {
        const res = await API.get(`/Users/${id}`);
        return res.data;
    } catch (err) {
        console.error("Lỗi lấy chi tiết người dùng:", err);
        return null;
    }
}

export async function updateUser(user) {
    const res = await API.put(`/Users/${user.id}`, user);
    return res.data;
}

export async function deleteUser(id) {
    const res = await API.delete(`/Users/${id}`);
    return res.data;
}
