import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../services/firebase";

const KTDangNhap = ({ children }) => {
  const user = auth.currentUser;

  // Nếu chưa đăng nhập → chuyển về trang đăng nhập
  if (!user) return <Navigate to="/dang-nhap" />;

  return children;
};

export default KTDangNhap;
