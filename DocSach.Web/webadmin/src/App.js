import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DangNhap from "./pages/DangNhap";
import DangKy from "./pages/DangKy";
import QuenMatKhau from "./pages/QuenMatKhau";
import TrangChu from "./pages/TrangChu";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import KTDangNhap from "./Kiemtra/KTDangNhap";
import DangTaiSach from "./pages/QL_Sach/DangTaiSach";
import QuanLyNguoiDung from "./pages/QuanLyNguoiDung";
import QuanLySach from "./pages/QL_Sach/QuanLySach";
import QuanLyTheLoai from "./pages/QL_TheLoai/QuanLyTheLoai";
import QuanLyChuong from "./pages/QL_Chuong/QuanLyChuong";
import DuyetChuong from "./pages/QL_Chuong/DuyetChuong";
import QuanLyTuCam from "./pages/QL_Chuong/QuanLyTuCam";
import QuanLyDanhGia from "./pages/QuanLyDanhGia";
import DuyetSach from "./pages/QL_Sach/DuyetSach";
import Quangcao from "./pages/Quangcao";
import ThongKe from "./pages/ThongKe";
import QuanLyKhungAvatar from "./pages/QuanLyKhungAvatar";
import QuanLyXu from "./pages/QuanLyXu";
import AdminLayout from "./Dungchung/AdminLayout";
import UserBooks from "./Dungchung/UserBooks";
import DangTaiSachUser from "./pages/QL_Sach/DangTaiSachUser";
import QuanLyChuongUser from "./pages/QL_Chuong/QuanLyChuongUser";
import WordEditor from "./pages/WordEditor";
import QuanLyTinNhan from "./pages/QuanLyTinNhan";
import QuyenTacGia from "./pages/QuyenTacGia";
import Tracuu from "./pages/Tracuu";
import Cuocdua from "./pages/Cuocdua";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/dang-nhap" element={<DangNhap />} />
          <Route path="/dang-ky" element={<DangKy />} />
          <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
          <Route path="/user" element={<UserBooks />} />
          <Route path="dang-tai-sach-user" element={<DangTaiSachUser />} />
          <Route path="quan-ly-chuong-user/:bookId" element={<QuanLyChuongUser />} />

          <Route
            path="/"
            element={
              <KTDangNhap>
                <AdminLayout />
              </KTDangNhap>
            }
          >

            <Route index element={<TrangChu />} />
            <Route path="dang-tai-sach" element={<DangTaiSach />} />
            <Route path="quan-ly-sach" element={<QuanLySach />} />
            <Route path="duyet-sach" element={<DuyetSach />} />
            <Route path="quan-ly-chuong" element={<QuanLyChuong />} />
            <Route path="duyet-chuong" element={<DuyetChuong />} />
            <Route path="quan-ly-tu-cam" element={<QuanLyTuCam />} />
            <Route path="quan-ly-danh-gia" element={<QuanLyDanhGia />} />
            <Route path="quan-ly-the-loai" element={<QuanLyTheLoai />} />
            <Route path="quan-ly-khung" element={<QuanLyKhungAvatar />} />
            <Route path="admin/users" element={<QuanLyNguoiDung />} />
            <Route path="thong-bao" element={<Quangcao />} />
            <Route path="quan-ly-xu" element={<QuanLyXu />} />
            <Route path="quyen-tac-gia" element={<QuyenTacGia />} />
            <Route path="thong-ke" element={<ThongKe />} />
            <Route path="quan-ly-tin-nhan" element={<QuanLyTinNhan />} />
            <Route path="tra-cuu" element={<Tracuu />} />
            <Route path="cuoc-dua" element={<Cuocdua />} />
          </Route>


          <Route path="*" element={<DangNhap />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
