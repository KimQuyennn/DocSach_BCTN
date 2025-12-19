import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    ScrollView,
} from "react-native";
// THÊM update đã được giữ lại
import { ref, onValue, get, update } from "firebase/database";
import { db } from "../firebase";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../firebase";

// Lấy User ID hiện tại
const CURRENT_USER_ID = auth.currentUser ? auth.currentUser.uid : "current_user_id_example";

const FALLBACK_TARGET_MINUTES = 10000;

// Hàm tiện ích: Lấy ngày bắt đầu của Tuần (Thứ 2) hoặc Tháng
const getFilterDate = (filter) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (filter === "week") {
        const dayOfWeek = now.getDay();
        const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        return new Date(now.setDate(now.getDate() - diff));
    } else if (filter === "month") {
        return new Date(now.setDate(1));
    }
    return null; // All time
};

export default function Xephang() {
    const navigation = useNavigation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [activeChallenge, setActiveChallenge] = useState(null); // Đặt null vì không dùng undefined để kiểm soát Hook
    const [currentUserReadTime, setCurrentUserReadTime] = useState(0);

    // Lấy mục tiêu phút đọc
    const challengeTargetMinutes = activeChallenge
        ? activeChallenge.QualificationMinutes
        : FALLBACK_TARGET_MINUTES;

    /* =====================
        HÀM TÍNH TOÁN (Lấy dữ liệu 1 lần)
    ====================== */
    const loadRanking = useCallback(async (challenge, currentFilter) => {
        let users = {};
        let readingLogs = {};

        // Vẫn sử dụng get() để lấy dữ liệu 1 lần cho Users và ReadingLogs
        try {
            await Promise.all([
                get(ref(db, "Users")).then(s => { users = s.val() || {}; }),
                get(ref(db, "ReadingLogs")).then(s => { readingLogs = s.val() || {}; }),
            ]);
        } catch (error) {
            console.error("Failed to fetch Users or Logs:", error);
            setLoading(false);
            return;
        }

        let fromDate = getFilterDate(currentFilter);
        let toDate = null;

        if (challenge) {
            fromDate = new Date(challenge.StartDate);
            toDate = new Date(challenge.EndDate);
        }

        const map = {};
        let currentUserIdReadTime = 0;
        const target = challenge ? challenge.QualificationMinutes : FALLBACK_TARGET_MINUTES;
        const completionUpdates = []; // Để lưu các update không đồng bộ

        // 1. Khởi tạo người dùng
        Object.entries(users).forEach(([uid, u]) => {
            map[uid] = {
                userId: uid,
                username: u.Username || "Độc giả ẩn danh",
                avatar: u.Avatar || null,
                readTime: 0,
                score: 0,
                completionTime: challenge ? u.Challenges?.[challenge.id]?.CompletionTime || null : null,
                isCompleted: challenge ? (u.Challenges?.[challenge.id]?.CompletionTime ? true : false) : false
            };
        });

        // 2. Tính toán Thời gian đọc & Kiểm tra hoàn thành mục tiêu
        const logsArray = Object.values(readingLogs).sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));

        for (const log of logsArray) {
            if (!map[log.UserId]) continue;

            const logDate = new Date(log.CreatedAt);

            // Lọc theo thời gian
            if (fromDate && logDate < fromDate) continue;
            if (toDate && logDate > toDate) continue;

            const duration = log.Duration || 0; // Giây
            const user = map[log.UserId];

            // Nếu người dùng đã hoàn thành trong quá khứ, chỉ cộng thời gian đọc và bỏ qua logic update
            if (user.isCompleted) {
                user.readTime += duration;
                if (log.UserId === CURRENT_USER_ID) {
                    currentUserIdReadTime += duration;
                }
                continue;
            }

            const scoreBefore = Math.floor(user.readTime / 60);

            user.readTime += duration;

            if (log.UserId === CURRENT_USER_ID) {
                currentUserIdReadTime += duration;
            }

            // --- LOGIC Ghi nhận thời điểm hoàn thành mục tiêu (Quan trọng) ---
            if (challenge && !user.isCompleted) {
                const scoreAfter = Math.floor(user.readTime / 60);

                if (scoreAfter >= target && scoreBefore < target) {
                    user.completionTime = log.CreatedAt;
                    user.isCompleted = true;

                    // Thêm vào mảng update (Non-Blocking)
                    completionUpdates.push({
                        userId: log.UserId,
                        challengeId: challenge.id,
                        completionTime: log.CreatedAt
                    });
                }
            }
        }

        // Thực hiện các thao tác update completion time (Non-Blocking)
        completionUpdates.forEach(updateData => {
            update(ref(db, `Users/${updateData.userId}/Challenges/${updateData.challengeId}`), {
                CompletionTime: updateData.completionTime,
            }).catch(e => console.error("Failed to save completion time (async):", e));
        });


        setCurrentUserReadTime(Math.floor(currentUserIdReadTime / 60)); // Phút

        // 3. Tính toán Điểm và Sắp xếp
        const ranking = Object.values(map)
            .map(u => ({
                ...u,
                score: Math.floor(u.readTime / 60), // Phút
                readHours: (u.readTime / (60 * 60)).toFixed(1), // Giờ
            }))
            .filter(u => u.readTime > 0)
            .sort((a, b) => {
                const aCompleted = !!a.completionTime;
                const bCompleted = !!b.completionTime;

                // 1. Ưu tiên: Người hoàn thành đứng trước
                if (aCompleted && !bCompleted) return -1;
                if (!aCompleted && bCompleted) return 1;

                // 2. Nếu cả hai đều hoàn thành: Ai hoàn thành sớm hơn (timestamp nhỏ hơn) đứng trước
                if (aCompleted && bCompleted) {
                    const aTime = new Date(a.completionTime).getTime();
                    const bTime = new Date(b.completionTime).getTime();
                    return aTime - bTime;
                }

                // 3. Nếu cả hai chưa hoàn thành, hoặc không có challenge: Sắp xếp theo tổng điểm
                return b.score - a.score;
            });

        setData(ranking);
        setLoading(false); // <--- Tắt loading sau khi mọi thứ xong


        // 4. LOGIC TỰ ĐỘNG GHI NHẬN TOP 3 (Non-Blocking)
        if (challenge) {
            const top3Winners = ranking
                .filter(u => !!u.completionTime)
                .slice(0, 3);

            const winnersData = top3Winners.length > 0 ? {} : null;
            if (winnersData) {
                top3Winners.forEach((winner, index) => {
                    const rank = index + 1;
                    winnersData[`Rank${rank}`] = {
                        userId: winner.userId,
                        username: winner.username,
                        rank: rank,
                        completionTime: winner.completionTime,
                        score: winner.score,
                        isAuto: true,
                        setAt: new Date().toISOString(),
                    };
                });
            }

            // Cập nhật người thắng tự động vào trường AutoWinners của Challenge
            update(ref(db, `Challenges/${challenge.id}`), {
                AutoWinners: winnersData
            }).catch(e => console.error("Failed to save AutoWinners (async):", e));
        }

    }, []); // <-- loadRanking không phụ thuộc vào state nào khác ngoài challenge và filter (được truyền vào)

    /* =====================
        HOOKS
    ====================== */

    // HOOK 1: Tải Active Challenge MỘT LẦN (get())
    const getActiveChallengeOnce = useCallback(async () => {
        try {
            const snapshot = await get(ref(db, `Challenges`));
            const challengesData = snapshot.val() || {};
            let foundActiveChallenge = null;
            const now = new Date();

            Object.entries(challengesData).forEach(([id, challenge]) => {
                if (challenge.StartDate && challenge.EndDate) {
                    const startDate = new Date(challenge.StartDate);
                    const endDate = new Date(challenge.EndDate);

                    if (challenge.Status === 'Active' && now >= startDate && now <= endDate) {
                        foundActiveChallenge = { id, ...challenge };
                    }
                }
            });

            // Cập nhật state activeChallenge
            setActiveChallenge(foundActiveChallenge);

            // Chạy tính toán xếp hạng lần đầu tiên
            loadRanking(foundActiveChallenge, filter);

        } catch (error) {
            console.error("Lỗi khi tải Challenges:", error);
            setActiveChallenge(null);
            loadRanking(null, filter);
        }
    }, [filter, loadRanking]);


    // HOOK CHÍNH: CHỈ TẢI LẦN ĐẦU KHI COMPONENT MOUNT
    useEffect(() => {
        setLoading(true);
        getActiveChallengeOnce();

        // Không return cleanup vì không có listener
    }, [getActiveChallengeOnce]);

    // HOOK: Kích hoạt loadRanking khi filter thay đổi (CHỈ KHI KHÔNG CÓ activeChallenge)
    useEffect(() => {
        // Nếu có activeChallenge, chúng ta không cho phép thay đổi filter (luôn là challenge filter)
        if (!activeChallenge) {
            setLoading(true);
            loadRanking(activeChallenge, filter);
        }
    }, [filter, loadRanking, activeChallenge]);


    /* =====================
        THỐNG KÊ TỔNG QUAN VÀ RENDER
    ====================== */
    const summaryStats = useMemo(() => {
        const totalReadMinutes = data.reduce((sum, u) => sum + u.readTime, 0) / 60;
        return {
            totalUsers: data.length,
            totalReadHours: Math.floor(totalReadMinutes / 60),
            averageMinutesPerUser: data.length > 0 ? Math.floor(totalReadMinutes / data.length) : 0,
        };
    }, [data]);

    const medalColor = (i, score, target) => {
        const isCompleted = score >= target;
        if (!isCompleted) return "#fff";
        return i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#fff";
    }

    const renderItem = ({ item, index }) => {
        const isFinishedFirst = !!item.completionTime;
        const isTopCompleted = isFinishedFirst && index < 3;
        const itemColor = isTopCompleted ? medalColor(index, item.score, challengeTargetMinutes) : "#fff";

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate("TrangCaNhan", { userId: item.userId })}
                style={[
                    styles.item,
                    { backgroundColor: itemColor },
                    isTopCompleted ? styles.topItemShadow : styles.regularItemShadow,
                    item.userId === CURRENT_USER_ID && { borderColor: '#8B0000', borderWidth: 2 }
                ]}
            >
                {/* Vị trí */}
                <Text style={[styles.rank, isTopCompleted && { fontSize: 20, color: '#333' }]}>
                    {isFinishedFirst && index === 0 ? '🥇' : isFinishedFirst && index === 1 ? '🥈' : isFinishedFirst && index === 2 ? '🥉' : index + 1}
                </Text>

                {/* Avatar */}
                <Image
                    source={item.avatar ? { uri: item.avatar } : { uri: 'https://via.placeholder.com/45?text=AV' }}
                    style={styles.avatar}
                />

                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.username}>{item.username}</Text>

                    {/* Thanh Tiến Độ Cuộc Đua (CHỈ HIỂN THỊ KHI CÓ CUỘC ĐUA ACTIVE) */}
                    {activeChallenge && (
                        <>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: `${Math.min(100, (item.score / challengeTargetMinutes) * 100)}%` }]} />
                                <Text style={styles.progressText}>
                                    {isFinishedFirst
                                        ? `Hoàn thành lúc: ${new Date(item.completionTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`
                                        : `${Math.floor((item.score / challengeTargetMinutes) * 100)}%`}
                                </Text>
                            </View>
                            {isTopCompleted && <Text style={styles.completionRank}>Rank: {index + 1} (Hoàn thành sớm nhất)</Text>}
                        </>
                    )}
                </View>

                {/* Điểm số */}
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>Thời gian</Text>
                    <Text style={styles.score}>{item.readHours}h</Text>
                </View>
            </TouchableOpacity>
        );
    };


    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#8B0000" />;

    const currentUserRank = data.findIndex(u => u.userId === CURRENT_USER_ID) + 1;
    const isCurrentUserCompleted = data.find(u => u.userId === CURRENT_USER_ID)?.isCompleted;


    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
            <View style={styles.container}>
                {/* THANH TRÊN: HIỂN THỊ CUỘC ĐUA ĐANG DIỄN RA */}
                {activeChallenge ? (
                    <View style={styles.challengeHeader}>
                        <Text style={styles.challengeTitle}>🏆 {activeChallenge.Title}</Text>
                        <Text style={styles.challengeSubtitle}>
                            Tiêu chí: **Tổng Phút Đọc** | Mục tiêu: **{activeChallenge.QualificationMinutes} phút**
                        </Text>
                        {activeChallenge.Prize && (
                            <Text style={styles.challengePrize}>
                                🎁 Giải thưởng: **{activeChallenge.Prize}**
                            </Text>
                        )}
                        <Text style={styles.raceStatus}>
                            {isCurrentUserCompleted
                                ? `🎉 BẠN ĐÃ HOÀN THÀNH CUỘC ĐUA! Rank: ${currentUserRank}`
                                : `🔥 Đang diễn ra! Kết thúc: ${activeChallenge.EndDate ? activeChallenge.EndDate.split('T')[0] : 'N/A'}`
                            }
                        </Text>
                    </View>
                ) : (
                    // Hiển thị mặc định nếu không có Cuộc Đua Active
                    <>
                        <Text style={styles.title}>🏆 Bảng Xếp Hạng Độc Giả</Text>
                        <Text style={styles.subtitle}>Xếp hạng dựa trên Tổng Thời Gian Đọc</Text>
                    </>
                )}

                {/* Phần lọc (CHỈ HIỂN THỊ KHI KHÔNG CÓ Cuộc Đua Active) */}
                {!activeChallenge && (
                    <View style={styles.filterRow}>
                        {[
                            { key: "all", label: "Tất cả" },
                            { key: "week", label: "Tuần này" },
                            { key: "month", label: "Tháng này" },
                        ].map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterBtn, filter === f.key && styles.active,]}
                                onPress={() => {
                                    // setFilter sẽ kích hoạt Hook useEffect thứ 2
                                    setFilter(f.key);
                                }}
                            >
                                <Text style={[styles.filterText, filter === f.key && styles.activeText]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}


                {/* Thống kê tổng quan */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{summaryStats.totalUsers}</Text>
                        <Text style={styles.statLabel}>Độc giả</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{summaryStats.totalReadHours}</Text>
                        <Text style={styles.statLabel}>Tổng giờ đọc</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{summaryStats.averageMinutesPerUser}</Text>
                        <Text style={styles.statLabel}>Phút TB/người</Text>
                    </View>
                </View>

                {/* Danh sách xếp hạng */}
                <FlatList
                    data={data}
                    keyExtractor={item => item.userId}
                    renderItem={renderItem}
                    scrollEnabled={false}
                />

                {data.length === 0 && (
                    <Text style={styles.noData}>
                        {activeChallenge
                            ? "Chưa có thời gian đọc nào trong cuộc đua này."
                            : "Chưa có thời gian đọc nào trong phạm vi đã chọn."
                        }
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#f9f9f9" },
    title: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 4, color: "#8B0000" },
    subtitle: { fontSize: 14, textAlign: "center", marginBottom: 20, color: "#555" },

    filterRow: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
    filterBtn: {
        paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5,
        backgroundColor: "#fff", borderWidth: 1, borderColor: '#ddd',
    },
    active: { backgroundColor: "#8B0000", borderColor: "#8B0000" },
    filterText: { fontWeight: "600", color: "#8B0000" },
    activeText: { color: "#fff" },

    statsCard: {
        flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff',
        padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#8B0000' },
    statLabel: { fontSize: 12, color: '#777' },

    item: {
        flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12,
        marginBottom: 10,
    },
    topItemShadow: {
        shadowColor: "#FFD700", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 8,
        borderWidth: 1, borderColor: '#FFD700',
    },
    regularItemShadow: {
        backgroundColor: "#fff",
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.5, elevation: 2,
        borderWidth: 0,
    },
    rank: { width: 30, fontWeight: "800", fontSize: 16, textAlign: 'center', color: '#555' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 10, borderWidth: 2, borderColor: '#fff', backgroundColor: '#ccc' },
    username: { fontWeight: "bold", fontSize: 15, color: "#333" },

    scoreContainer: { alignItems: 'flex-end', minWidth: 60, marginLeft: 10 },
    scoreLabel: { fontSize: 11, color: '#777', fontWeight: 'bold' },
    score: { fontWeight: "800", fontSize: 20, color: '#8B0000' },

    noData: { textAlign: 'center', marginTop: 30, color: '#999' },

    challengeHeader: {
        backgroundColor: '#E3F2FD',
        padding: 18,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#90CAF9',
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5,
    },
    challengeTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1565C0',
        textAlign: 'center',
        marginBottom: 5,
    },
    challengeSubtitle: {
        fontSize: 13,
        color: '#424242',
        textAlign: 'center',
        marginBottom: 10,
    },
    raceStatus: {
        fontSize: 12,
        fontWeight: '600',
        color: '#D32F2F',
        marginTop: 10,
        textAlign: 'center',
    },

    progressBarContainer: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        marginTop: 3,
        overflow: 'hidden',
        position: 'relative',
    },
    progressBarContainerFull: {
        height: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        marginTop: 5,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#28A745',
        borderRadius: 6,
    },
    progressText: {
        position: 'absolute',
        right: 5,
        top: -4,
        fontSize: 8,
        fontWeight: 'bold',
        color: '#333',
    },
    challengeProgressText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        top: 1,
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        zIndex: 1,
    },
    completionRank: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#28A745',
        marginTop: 2,
    },
});