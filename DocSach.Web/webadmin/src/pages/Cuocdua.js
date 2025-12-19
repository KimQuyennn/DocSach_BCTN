// Cuocdua.js (Admin Web - ReactJS)

import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
// Giữ lại runTransaction vì nó được dùng cho TotalReadingTime
import { ref, push, set, onValue, update, runTransaction } from 'firebase/database';

const CHALLENGES_REF = ref(db, 'Challenges');
const USERS_REF = ref(db, 'Users');
const NOTIFICATIONS_REF = ref(db, 'Notifications');
const READING_LOGS_REF = ref(db, 'ReadingLogs');

// Hàm calculateWinners (Giữ nguyên)
const calculateWinners = (challenge, readingLogs, users) => {
    return { qualifiedUsers: [] };
};

// HÀM TẠO THÔNG BÁO (Giữ nguyên)
const createNotification = async (userId, title, message, type) => {
    try {
        const userNotificationsRef = ref(db, `Notifications/${userId}`);
        const newNotiRef = push(userNotificationsRef);
        await set(newNotiRef, {
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: Date.now(),
        });
    } catch (error) {
        console.error(`Failed to create notification for ${userId}:`, error);
    }
};


export default function Cuocdua() {
    const [challenges, setChallenges] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dbData, setDbData] = useState({ users: {}, readingLogs: {} });
    const [isEditing, setIsEditing] = useState(null); // ID của cuộc đua đang chỉnh sửa
    const [editFormData, setEditFormData] = useState({});

    const initialPrizeCoins = [
        { Rank: 1, Coins: 50 },
        { Rank: 2, Coins: 30 },
        { Rank: 3, Coins: 10 },
    ];

    const [formData, setFormData] = useState({
        Title: '',
        Description: '',
        StartDate: '',
        EndDate: '',
        Criteria: 'readTime',
        Status: 'Upcoming',
        PrizeCoins: initialPrizeCoins,
        QualificationMinutes: 1000,
    });

    useEffect(() => {
        setIsLoading(true);

        const challengesListener = onValue(CHALLENGES_REF, (snapshot) => {
            const data = snapshot.val() || {};
            const loadedChallenges = Object.entries(data).map(([id, challenge]) => ({
                id,
                PrizeCoins: challenge.PrizeCoins || initialPrizeCoins,
                QualificationMinutes: challenge.QualificationMinutes || 0,
                ...challenge,
            }));
            setChallenges(loadedChallenges);
            setIsLoading(false);
        });

        // Lấy Users và ReadingLogs
        // Dùng onValue cho cả hai, và đảm bảo chúng được lấy trước khi cần tính toán (handleAwardPrizes)
        onValue(USERS_REF, s => setDbData(prev => ({ ...prev, users: s.val() || {} })));
        onValue(READING_LOGS_REF, s => setDbData(prev => ({ ...prev, readingLogs: s.val() || {} })));

        return () => {
            // Cleanup: Thực hiện dọn dẹp listener nếu cần
            // Trong trường hợp của bạn, bạn chỉ có 1 listener cho Challenges, nên cần lưu nó để cleanup
            // Bạn có thể thêm: off(CHALLENGES_REF, 'value', challengesListener) nếu bạn muốn ngắt kết nối chính xác
        };
    }, []);

    // Hàm chung cho Form Tạo Mới
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'QualificationMinutes' ? parseInt(value, 10) || 0 : value
        }));
    };

    // Hàm xử lý thay đổi Giải thưởng trong Form Tạo Mới
    const handlePrizeChange = (rank, value) => {
        const numValue = parseInt(value, 10);
        setFormData(prev => {
            const newPrizes = prev.PrizeCoins.map(p =>
                p.Rank === rank ? { ...p, Coins: numValue || 0 } : p
            );
            return { ...prev, PrizeCoins: newPrizes };
        });
    };

    // --- CHỨC NĂNG CHỈNH SỬA CUỘC ĐUA ---

    const handleStartEdit = (challenge) => {
        // Chuyển đổi ngày tháng từ ISO sang định dạng YYYY-MM-DD cho input type="date"
        const cleanDate = (isoString) => isoString ? isoString.split('T')[0] : '';

        // Đảm bảo PrizeCoins là mảng (nếu dữ liệu Firebase có thể không phải mảng)
        const safePrizeCoins = Array.isArray(challenge.PrizeCoins) ? challenge.PrizeCoins : initialPrizeCoins;


        setEditFormData({
            ...challenge,
            StartDate: cleanDate(challenge.StartDate),
            EndDate: cleanDate(challenge.EndDate),
            PrizeCoins: safePrizeCoins, // Đảm bảo luôn là mảng
        });
        setIsEditing(challenge.id);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: name === 'QualificationMinutes' ? parseInt(value, 10) || 0 : value
        }));
    };

    // SỬA LỖI: Đảm bảo cập nhật đúng editFormData
    const handleEditPrizeChange = (rank, value) => {
        const numValue = parseInt(value, 10);
        setEditFormData(prev => {
            // Đảm bảo PrizeCoins trong editFormData là mảng và tồn tại
            const currentPrizes = Array.isArray(prev.PrizeCoins) ? prev.PrizeCoins : initialPrizeCoins;
            const newPrizes = currentPrizes.map(p =>
                p.Rank === rank ? { ...p, Coins: numValue || 0 } : p
            );
            return { ...prev, PrizeCoins: newPrizes };
        });
    };

    const handleSaveEdit = async () => {
        if (!window.confirm("Xác nhận lưu thay đổi cho Cuộc Đua này?")) return;

        setIsLoading(true);
        try {
            const dataToUpdate = {
                Title: editFormData.Title,
                Description: editFormData.Description,
                PrizeCoins: editFormData.PrizeCoins,
                QualificationMinutes: editFormData.QualificationMinutes,
            };

            // THAY ĐỔI: Thêm phần thời gian để định nghĩa Start/End Day chính xác
            // Chỉ cho phép sửa ngày khi cuộc đua SẮP DIỄN RA (Upcoming)
            if (editFormData.Status === 'Upcoming') {
                dataToUpdate.StartDate = editFormData.StartDate + 'T00:00:00Z'; // Bắt đầu từ 00:00:00Z
                dataToUpdate.EndDate = editFormData.EndDate + 'T23:59:59Z'; // Kết thúc lúc 23:59:59Z
            } else {
                // Nếu đang diễn ra hoặc chờ trao giải, chỉ cho phép chỉnh sửa ngày kết thúc
                dataToUpdate.EndDate = editFormData.EndDate + 'T23:59:59Z'; // Kết thúc lúc 23:59:59Z
            }

            // Nếu Status là Upcoming, không cho phép EndDate < StartDate
            if (editFormData.Status === 'Upcoming' && new Date(dataToUpdate.EndDate) <= new Date(dataToUpdate.StartDate)) {
                alert("Lỗi: Ngày kết thúc phải sau ngày bắt đầu.");
                setIsLoading(false);
                return;
            }


            await update(ref(db, `Challenges/${isEditing}`), dataToUpdate);
            alert("Đã cập nhật Cuộc Đua thành công.");
            setIsEditing(null);
        } catch (error) {
            console.error("Lỗi khi cập nhật cuộc đua:", error);
            alert("Lỗi khi cập nhật Cuộc Đua.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- CHỨC NĂNG DỪNG CUỘC ĐUA ---

    const handleStopChallenge = async (challengeId, challengeTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn **DỪNG** Cuộc Đua "${challengeTitle}" và chuyển nó sang trạng thái Đã Hoàn Tất (Completed) KHÔNG TRAO GIẢI không?`)) return;

        setIsLoading(true);
        try {
            await update(ref(db, `Challenges/${challengeId}`), {
                Status: 'Completed',
                // Có thể thêm một trường cờ ở đây nếu cần phân biệt Completed_Stopped vs Completed_Awarded
            });
            alert(`Đã dừng Cuộc Đua: ${challengeTitle}.`);
        } catch (error) {
            console.error("Lỗi khi dừng cuộc đua:", error);
            alert("Lỗi khi dừng Cuộc Đua.");
        } finally {
            setIsLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (new Date(formData.EndDate) <= new Date(formData.StartDate)) {
            alert("Lỗi: Ngày kết thúc phải sau ngày bắt đầu.");
            setIsLoading(false);
            return;
        }

        try {
            const newChallengeRef = push(CHALLENGES_REF);
            const challengeId = newChallengeRef.key;

            await set(newChallengeRef, {
                ...formData,
                // THAY ĐỔI: Thêm phần thời gian để định nghĩa Start/End Day chính xác
                StartDate: formData.StartDate + 'T00:00:00Z',
                EndDate: formData.EndDate + 'T23:59:59Z',
                CreatedAt: new Date().toISOString(),
                QualificationMinutes: formData.QualificationMinutes,
            });
            alert(`Đã tạo Cuộc Đua thành công! ID: ${challengeId}`);
            setFormData({
                Title: '', Description: '', StartDate: '', EndDate: '', Criteria: 'readTime', Status: 'Upcoming',
                PrizeCoins: initialPrizeCoins,
                QualificationMinutes: 1000,
            });
        } catch (error) {
            console.error("Lỗi khi tạo cuộc đua:", error);
            alert("Lỗi khi tạo Cuộc Đua.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActivateChallenge = async (challengeId, challengeTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn **KÍCH HOẠT** Cuộc Đua: ${challengeTitle} ngay lập tức không?`)) return;

        setIsLoading(true);
        try {
            await update(ref(db, `Challenges/${challengeId}`), {
                Status: 'Active',
            });
            alert(`Đã kích hoạt Cuộc Đua: ${challengeTitle}.`);
        } catch (error) {
            console.error("Lỗi khi kích hoạt cuộc đua:", error);
            alert("Lỗi khi kích hoạt Cuộc Đua.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- HÀM TRAO GIẢI (CŨ VÀ TRAO GIẢI LẠI) ---
    const handleAwardPrizes = async (challenge, isReaward = false) => {
        const actionText = isReaward ? "trao giải lại" : "kết thúc và trao giải";

        if (!challenge.AutoWinners || Object.keys(challenge.AutoWinners).length === 0) {
            if (!window.confirm(`Cảnh báo: Cuộc đua không có người thắng tự động (AutoWinners). Bạn vẫn muốn ${actionText} cuộc đua không?`)) return;
        } else {
            if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho Cuộc Đua: ${challenge.Title}? Hành động này có thể ghi đè dữ liệu Xu nếu là trao giải lại.`)) return;
        }

        setIsLoading(true);

        // 1. Lấy người thắng Tự động (AutoWinners) cho Top 3
        const autoWinners = challenge.AutoWinners ? Object.values(challenge.AutoWinners) : [];
        let finalWinners = autoWinners.sort((a, b) => a.rank - b.rank).slice(0, 3);

        const awardedUsers = new Set();
        let totalCoinsAwarded = 0;
        let updatePromises = [];

        // 2. Trao giải Top 3 chính thức
        for (const winner of finalWinners) {
            const prize = challenge.PrizeCoins.find(p => p.Rank === winner.rank);
            const coinsToAdd = prize ? prize.Coins : 0;
            const userId = winner.userId;
            const userRef = ref(db, `Users/${userId}/xu`); // Tham chiếu đến trường 'xu'

            if (coinsToAdd > 0 && !awardedUsers.has(userId)) {

                // THAY ĐỔI: Sử dụng runTransaction để cập nhật Xu một cách an toàn
                updatePromises.push(
                    runTransaction(userRef, (currentXu) => {
                        // currentXu có thể là null hoặc undefined nếu trường chưa tồn tại
                        const safeCurrentXu = currentXu || 0;
                        return safeCurrentXu + coinsToAdd;
                    })
                );

                // Tạo Thông báo (chỉ gửi thông báo nếu KHÔNG phải trao giải lại)
                if (!isReaward) {
                    updatePromises.push(
                        createNotification(
                            userId,
                            "🏆 Chúc mừng Người Thắng Cuộc Đua!",
                            `Bạn đã giành Hạng ${winner.rank} trong Cuộc Đua "${challenge.Title}" và được thưởng ${coinsToAdd} Xu!`,
                            "challenge_prize"
                        )
                    );
                }

                awardedUsers.add(userId);
                totalCoinsAwarded += coinsToAdd;
            }
        }

        // Thực hiện tất cả các cập nhật và thông báo
        try {
            await Promise.all(updatePromises);
        } catch (error) {
            console.error("LỖI CẬP NHẬT XU VÀ THÔNG BÁO:", error);
            alert("Lỗi xảy ra trong khi cập nhật Xu cho người dùng. Kiểm tra console.");
            setIsLoading(false);
            return;
        }

        // 5. Cập nhật trạng thái cuộc đua thành 'Completed' và lưu kết quả
        await update(ref(db, `Challenges/${challenge.id}`), {
            Status: 'Completed',
            AwardedUsersCount: awardedUsers.size,
            TotalCoinsAwarded: totalCoinsAwarded,
            Winners: finalWinners,
            // Qualified: [], // Giữ nguyên Qualified / AutoWinners nếu muốn xem lại
            // AutoWinners: challenge.AutoWinners || null,
        });

        setIsLoading(false);
        alert(`Đã hoàn tất ${actionText}. Tổng cộng ${awardedUsers.size} người được thưởng (${totalCoinsAwarded} Xu).`);
    };

    // --- CHỨC NĂNG CẬP NHẬT TỔNG THỜI GIAN ĐỌC CỦA NGƯỜI DÙNG ---

    const handleUpdateReadingTime = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn tính toán và cập nhật lại trường TotalReadingTime cho TẤT CẢ người dùng không?")) return;

        setIsLoading(true);
        try {
            const readingLogs = dbData.readingLogs;
            const userReadingMap = {}; // { userId: totalDurationInMinutes }

            // 1. Tính toán tổng thời gian đọc từ ReadingLogs
            Object.values(readingLogs).forEach(log => {
                const userId = log.UserId;
                const duration = log.Duration || 0; // Đảm bảo Duration tồn tại

                userReadingMap[userId] = (userReadingMap[userId] || 0) + duration;
            });

            const updatePromises = [];
            let updatedUserCount = 0;

            // 2. Cập nhật vào trường TotalReadingTime của từng User
            for (const userId in userReadingMap) {
                const totalMinutes = userReadingMap[userId];

                const userRef = ref(db, `Users/${userId}/TotalReadingTime`);

                // Sử dụng runTransaction để đảm bảo atomic update cho TotalReadingTime
                updatePromises.push(
                    runTransaction(userRef, (currentValue) => {
                        // Trả về giá trị mới, không cần dựa vào currentValue vì ta tính lại từ đầu
                        return totalMinutes;
                    })
                );
                updatedUserCount++;
            }

            await Promise.all(updatePromises);

            alert(`Đã cập nhật TotalReadingTime cho ${updatedUserCount} người dùng.`);
        } catch (error) {
            console.error("LỖI CẬP NHẬT THỜI GIAN ĐỌC:", error);
            alert("Lỗi xảy ra trong khi cập nhật thời gian đọc. Kiểm tra console.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- STYLES (Giữ nguyên) ---
    const styles = {
        container: { padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6' },
        header: { color: '#007bff', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px', fontSize: '24px' },
        formSection: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', marginBottom: '30px' },
        formTitle: { color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' },
        inputGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' },
        input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' },
        prizeContainer: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
        prizeItem: { flexGrow: 1, minWidth: '150px' },
        button: {
            padding: '12px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
            marginRight: '8px',
            marginBottom: '5px',
        },
        challengeList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
        challengeCard: {
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderLeft: '5px solid #007bff',
            position: 'relative'
        },
        cardTitle: { color: '#007bff', marginBottom: '5px', fontSize: '18px' },
        cardStatus: { fontSize: '14px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '5px' },
        statusCompleted: { backgroundColor: '#e6ffed', color: '#28a745' },
        statusActive: { backgroundColor: '#cce5ff', color: '#004085', border: '1px solid #b8daff' },
        statusUpcoming: { backgroundColor: '#e9ecef', color: '#6c757d' },
        statusPendingAward: { backgroundColor: '#fff3cd', color: '#856404' },
        winnerList: { marginTop: '10px', paddingLeft: '20px', fontSize: '14px' },
        infoBox: { backgroundColor: '#f9f9e6', border: '1px solid #e0e0bb', padding: '10px', borderRadius: '5px', marginTop: '10px' },
        managementSection: { backgroundColor: '#f0f4f7', padding: '15px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }
    };
    // --- KẾT THÚC STYLES ---

    if (isLoading) return <div style={styles.container}>Đang tải dữ liệu và tính toán...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Quản lý Cuộc Đua Đọc Sách</h1>

            {/* --- KHỐI QUẢN LÝ DỮ LIỆU CHUNG --- */}
            <div style={styles.managementSection}>
                <h3 style={styles.formTitle}>Quản lý Dữ liệu Chung</h3>
                <p style={{ marginBottom: '10px', color: '#666' }}>Dữ liệu: **{Object.keys(dbData.users).length}** người dùng, **{Object.keys(dbData.readingLogs).length}** logs.</p>
                <button
                    onClick={handleUpdateReadingTime}
                    style={{ ...styles.button, backgroundColor: '#17a2b8' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang cập nhật...' : 'Cập nhật TotalReadingTime của người dùng'}
                </button>
            </div>

            {/* Form Tạo Cuộc Đua */}
            <form onSubmit={handleSubmit} style={styles.formSection}>
                <h3 style={styles.formTitle}>Tạo Cuộc Đua Mới</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={styles.inputGroup}><label style={styles.label}>Tiêu đề:</label><input type="text" name="Title" value={formData.Title} onChange={handleChange} required style={styles.input} /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Mô tả:</label><textarea name="Description" value={formData.Description} onChange={handleChange} style={styles.input}></textarea></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={styles.inputGroup}><label style={styles.label}>Ngày bắt đầu:</label><input type="date" name="StartDate" value={formData.StartDate} onChange={handleChange} required style={styles.input} /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Ngày kết thúc:</label><input type="date" name="EndDate" value={formData.EndDate} onChange={handleChange} required style={styles.input} /></div>
                    </div>
                </div>

                <h4 style={{ ...styles.formTitle, fontSize: '18px' }}>Giải Thưởng & Mục Tiêu</h4>

                <div style={styles.prizeContainer}>
                    {/* Giải Thưởng Top 3 */}
                    {formData.PrizeCoins.slice(0, 3).map(p => (
                        <div key={p.Rank} style={styles.prizeItem}>
                            <label style={styles.label}>💰 Hạng {p.Rank}:</label>
                            <input
                                type="number"
                                pattern="[1-9]\d*|0"
                                value={p.Coins}
                                onChange={(e) => handlePrizeChange(p.Rank, e.target.value)}
                                style={styles.input}
                                required
                                min="0"
                            />
                        </div>
                    ))}

                    {/* Mục tiêu tối thiểu (Phút) */}
                    <div style={styles.prizeItem}>
                        <label style={styles.label}>⏱ Phút tối thiểu (Mục tiêu):</label>
                        <input
                            type="number"
                            name="QualificationMinutes"
                            value={formData.QualificationMinutes}
                            onChange={(e) => handleChange(e)}
                            required
                            min="0"
                            style={styles.input}
                        />
                    </div>

                </div>

                <button type="submit" style={{ ...styles.button, marginTop: '20px', width: '100%' }} disabled={isLoading}>
                    {isLoading ? 'Đang tạo...' : 'Tạo Cuộc Đua Mới'}
                </button>
            </form>

            {/* Danh sách Cuộc Đua */}
            <h3 style={styles.header}>Danh sách Cuộc Đua</h3>
            <div style={styles.challengeList}>
                {challenges.map(c => {
                    const isPendingAward = c.Status !== 'Completed' && new Date() > new Date(c.EndDate);
                    const statusText = c.Status === 'Completed' ? 'Đã hoàn tất' : isPendingAward ? 'Chờ trao giải' : c.Status === 'Active' ? 'Đang diễn ra' : 'Sắp diễn ra';
                    const statusStyle = c.Status === 'Completed' ? styles.statusCompleted : isPendingAward ? styles.statusPendingAward : c.Status === 'Active' ? styles.statusActive : styles.statusUpcoming;

                    const autoWinners = c.AutoWinners ? Object.values(c.AutoWinners) : [];
                    const top3AutoWinners = autoWinners.sort((a, b) => a.rank - b.rank).slice(0, 3);
                    const isCompletedByTime = top3AutoWinners.length > 0;

                    // Nếu đang ở chế độ chỉnh sửa
                    if (isEditing === c.id) {
                        return (
                            <div key={c.id} style={{ ...styles.challengeCard, borderLeftColor: '#FFC107' }}>
                                <h4 style={styles.cardTitle}>🛠️ Chỉnh sửa: {c.Title}</h4>

                                <div style={styles.inputGroup}><label style={styles.label}>Tiêu đề:</label><input type="text" name="Title" value={editFormData.Title} onChange={handleEditChange} required style={styles.input} /></div>
                                <div style={styles.inputGroup}><label style={styles.label}>Mô tả:</label><textarea name="Description" value={editFormData.Description} onChange={handleEditChange} style={styles.input}></textarea></div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Ngày kết thúc:</label>
                                    <input type="date" name="EndDate" value={editFormData.EndDate} onChange={handleEditChange} required style={styles.input} />
                                </div>
                                {c.Status === 'Upcoming' && (
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Ngày bắt đầu (chỉ sửa khi Upcoming):</label>
                                        <input type="date" name="StartDate" value={editFormData.StartDate} onChange={handleEditChange} required style={styles.input} />
                                    </div>
                                )}
                                {c.Status !== 'Upcoming' && <p style={{ fontSize: '12px', color: '#dc3545' }}>**Lưu ý:** Cuộc đua đang **{c.Status === 'Active' ? 'Diễn ra' : 'Đã kết thúc theo thời gian'}**, không thể sửa Ngày bắt đầu.</p>}


                                <h5 style={{ marginTop: '15px' }}>Giải Thưởng & Mục Tiêu</h5>
                                <div style={styles.prizeContainer}>
                                    {editFormData.PrizeCoins.slice(0, 3).map(p => (
                                        <div key={p.Rank} style={styles.prizeItem}>
                                            <label style={styles.label}>Hạng {p.Rank}:</label>
                                            <input
                                                type="number"
                                                value={p.Coins}
                                                onChange={(e) => handleEditPrizeChange(p.Rank, e.target.value)} // <-- ĐÃ SỬA LỖI Ở ĐÂY
                                                style={styles.input}
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                    <div style={styles.prizeItem}>
                                        <label style={styles.label}>Phút tối thiểu:</label>
                                        <input type="number" name="QualificationMinutes" value={editFormData.QualificationMinutes} onChange={handleEditChange} style={styles.input} min="0" />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <button onClick={handleSaveEdit} style={{ ...styles.button, backgroundColor: '#FFC107', color: '#333' }} disabled={isLoading}>Lưu Chỉnh Sửa</button>
                                    <button onClick={() => setIsEditing(null)} style={{ ...styles.button, backgroundColor: '#6c757d' }} disabled={isLoading}>Hủy</button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={c.id} style={{ ...styles.challengeCard, borderLeftColor: c.Status === 'Active' ? '#007bff' : isPendingAward ? '#FF9800' : '#ccc' }}>
                            <h4 style={styles.cardTitle}>{c.Title} (ID: {c.id.substring(0, 5)}...)</h4>
                            <span style={{ ...styles.cardStatus, ...statusStyle }}>{statusText}</span>
                            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                                Thời gian: **{c.StartDate.split('T')[0]}** đến **{c.EndDate.split('T')[0]}**
                            </p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                Thưởng Top 3: {c.PrizeCoins.map(p => `${p.Rank}: ${p.Coins} Xu`).join(' | ')} | Phút tối thiểu: **{c.QualificationMinutes || 0}**
                            </p>

                            {/* HIỂN THỊ NGƯỜI THẮNG TỰ ĐỘNG (Hoàn thành sớm nhất) */}
                            {isCompletedByTime && (
                                <div style={styles.infoBox}>
                                    <p style={{ fontWeight: 'bold', color: '#28a745' }}>🥇 Người thắng Tự Động:</p>
                                    <ul style={styles.winnerList}>
                                        {top3AutoWinners.map(w => (
                                            <li key={w.userId}>
                                                **Hạng {w.rank}**: {dbData.users[w.userId]?.username || `User ${w.userId.substring(0, 5)}...`} ({new Date(w.completionTime).toLocaleTimeString('vi-VN')} - {new Date(w.completionTime).toLocaleDateString('vi-VN')})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* --- KHỐI THAO TÁC --- */}
                            <div style={{ marginTop: '15px' }}>
                                {c.Status === 'Completed' ? (
                                    <>
                                        <p style={{ color: '#28a745', fontWeight: 'bold', fontSize: '15px' }}>
                                            Đã trao giải cho **{c.AwardedUsersCount || 0}** người. Tổng: **{c.TotalCoinsAwarded || 0}** Xu.
                                        </p>
                                        <button
                                            onClick={() => handleAwardPrizes(c, true)}
                                            style={{ ...styles.button, backgroundColor: '#dc3545', marginTop: '10px' }}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Đang xử lý...' : 'Trao Giải Lại (Re-award)'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Nút CHỈNH SỬA */}
                                        <button
                                            onClick={() => handleStartEdit(c)}
                                            style={{ ...styles.button, backgroundColor: '#FFC107', color: '#333' }}
                                            disabled={isLoading || c.Status === 'Completed'}
                                        >
                                            Chỉnh Sửa
                                        </button>

                                        {isPendingAward ? (
                                            // Nút TRAO GIẢI
                                            <button
                                                onClick={() => handleAwardPrizes(c)}
                                                style={{ ...styles.button, backgroundColor: '#FF9800' }}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Đang Xử Lý...' : 'Kết Thúc & Trao Giải'}
                                            </button>
                                        ) : c.Status === 'Active' ? (
                                            // Nút DỪNG
                                            <button
                                                onClick={() => handleStopChallenge(c.id, c.Title)}
                                                style={{ ...styles.button, backgroundColor: '#6c757d' }}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Đang dừng...' : 'DỪNG Cuộc Đua'}
                                            </button>
                                        ) : (
                                            // Nút KÍCH HOẠT (Upcoming)
                                            <button
                                                onClick={() => handleActivateChallenge(c.id, c.Title)}
                                                style={{ ...styles.button, backgroundColor: '#28a745' }}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Đang kích hoạt...' : 'KÍCH HOẠT Cuộc Đua'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}