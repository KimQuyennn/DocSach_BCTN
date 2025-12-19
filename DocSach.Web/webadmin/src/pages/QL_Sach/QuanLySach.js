// import React, { useEffect, useState } from "react";
// import { ref, onValue } from "firebase/database";
// import { db } from "../../services/firebase";
// import {
//     Box,
//     Typography,
//     FormControl,
//     InputLabel,
//     Select,
//     MenuItem,
// } from "@mui/material";
// import TheSach from "./TheSachAdmin";

// export default function QuanLySach() {
//     const [genres, setGenres] = useState([]);
//     const [selectedGenre, setSelectedGenre] = useState("all");

//     // Load thể loại từ Firebase
//     useEffect(() => {
//         const genresRef = ref(db, "Genres");
//         const unsubscribe = onValue(genresRef, (snapshot) => {
//             const data = snapshot.val();
//             if (data) {
//                 const list = Object.keys(data).map((key) => ({
//                     Id: key,
//                     ...data[key],
//                 }));
//                 setGenres(list);
//             }
//         });
//         return () => unsubscribe();
//     }, []);

//     return (
//         <Box sx={{ p: 3 }}>
//             <Typography variant="h5" sx={{ fontWeight: "bold", color: "#8B0000", mb: 3 }}>
//                 📚 Quản Lý Sách
//             </Typography>

//             {/* Bộ lọc thể loại */}
//             <FormControl sx={{ mb: 3, minWidth: 200 }}>
//                 <InputLabel>Thể loại</InputLabel>
//                 <Select
//                     value={selectedGenre}
//                     onChange={(e) => setSelectedGenre(e.target.value)}
//                 >
//                     <MenuItem value="all">Tất cả</MenuItem>
//                     {genres.map((tl) => (
//                         <MenuItem key={tl.Id} value={tl.Id}>
//                             {tl.Name}
//                         </MenuItem>
//                     ))}
//                 </Select>
//             </FormControl>

//             {/* Danh sách sách */}
//             <TheSach selectedGenre={selectedGenre} />
//         </Box>
//     );
// }


import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../services/firebase";
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid, // Thêm Grid để bố cục
} from "@mui/material";
import TheSach from "./TheSachAdmin";

export default function QuanLySach() {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState("all");
    const [copyrightFilter, setCopyrightFilter] = useState("all"); // 1. Thêm state lọc bản quyền

    // Load thể loại từ Firebase
    useEffect(() => {
        const genresRef = ref(db, "Genres");
        const unsubscribe = onValue(genresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map((key) => ({
                    Id: key,
                    ...data[key],
                }));
                setGenres(list);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#8B0000", mb: 3 }}>
                📚 Quản Lý Sách
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Bộ lọc Thể loại */}
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Thể loại</InputLabel>
                        <Select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            label="Thể loại"
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            {genres.map((tl) => (
                                <MenuItem key={tl.Id} value={tl.Id}>
                                    {tl.Name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* 2. Bộ lọc Bản quyền mới */}
                <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth>
                        <InputLabel>Bản quyền</InputLabel>
                        <Select
                            value={copyrightFilter}
                            onChange={(e) => setCopyrightFilter(e.target.value)}
                            label="Bản quyền"
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="copyrighted">Có Bản quyền</MenuItem>
                            <MenuItem value="expired_soon">Sắp hết hạn (90 ngày)</MenuItem>
                            <MenuItem value="expired">Đã hết hạn</MenuItem>
                            <MenuItem value="non_copyrighted">Không Bản quyền</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Danh sách sách */}
            <TheSach
                selectedGenre={selectedGenre}
                copyrightFilter={copyrightFilter} // Truyền xuống component con
            />
        </Box>
    );
}