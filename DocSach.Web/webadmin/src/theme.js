// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: { main: "#8B0000" }, // đỏ đất
        secondary: { main: "#5D4037" }, // nâu
        background: { default: "#ffffff" }, // trắng
    },
    typography: { fontFamily: "Roboto, sans-serif" },
});

export default theme;
