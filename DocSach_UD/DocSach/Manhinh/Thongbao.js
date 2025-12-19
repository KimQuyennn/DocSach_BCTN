// Thongbao.js
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Linking,
    StyleSheet,
    ScrollView
} from "react-native";
import { ref, onValue, update, getDatabase, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";


export default function Thongbao() {
    const auth = getAuth(app);
    const database = getDatabase(app);
    const [userId, setUserId] = useState(null);
    const [ads, setAds] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unseenCount, setUnseenCount] = useState(0);

    // Lấy userId
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) setUserId(user.uid);
            else setUserId(null);
        });
        return () => unsubscribeAuth();
    }, []);

    /** Load Ads */
    useEffect(() => {
        const adsRef = ref(database, "ads");
        const unsubAds = onValue(adsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, ad]) => ({
                id,
                viewedBy: ad.viewedBy || [],
                type: "ad",
                ...ad,
            }));
            list.sort((a, b) => b.createdAt - a.createdAt);
            setAds(list);
        });
        return () => unsubAds();
    }, []);

    /** Load Notifications */
    useEffect(() => {
        if (!userId) return;
        const notiRef = ref(database, `Notifications/${userId}`);
        const unsubNoti = onValue(notiRef, (snapshot) => {
            const data = snapshot.val() || {};
            const list = Object.entries(data).map(([id, n]) => ({
                id,
                type: n.type || "notification",
                ...n,
            }));
            list.sort((a, b) => b.createdAt - a.createdAt);
            setNotifications(list);
        });
        return () => unsubNoti();
    }, [userId]);

    /** Tính số lượng chưa đọc */
    useEffect(() => {
        const unseenAds = ads.filter(ad => !(ad.viewedBy || []).includes(userId)).length;
        const unseenNoti = notifications.filter(n => !n.read).length;
        setUnseenCount(unseenAds + unseenNoti);
    }, [ads, notifications, userId]);

    /** Khi bấm xem ad */
    const handleViewAd = async (ad) => {
        if (!ad.viewedBy.includes(userId)) {
            const updatedList = [...ad.viewedBy, userId];
            await update(ref(database, `ads/${ad.id}`), { viewedBy: updatedList });
        }
        if (ad.link) Linking.openURL(ad.link);
    };

    /** Khi bấm xem notification */
    const handleViewNotification = async (noti) => {
        if (!noti.read) {
            await update(ref(database, `Notifications/${userId}/${noti.id}`), { read: true });
        }
    };

    /** Merge Ads + Notifications */
    const allItems = [...notifications, ...ads];
    allItems.sort((a, b) => b.createdAt - a.createdAt);
    const handleClearAll = async () => {
        if (!userId) return;

        try {
            // Xóa toàn bộ Notifications của user
            await remove(ref(database, `Notifications/${userId}`));

            // Đánh dấu tất cả Ads là đã xem
            for (const ad of ads) {
                if (!ad.viewedBy.includes(userId)) {
                    const updatedList = [...ad.viewedBy, userId];
                    await update(ref(database, `ads/${ad.id}`), { viewedBy: updatedList });
                }
            }

            alert("Đã xóa toàn bộ thông báo!");
        } catch (error) {
            console.error("Lỗi khi xóa thông báo:", error);
            alert("Không thể xóa thông báo.");
        }
    };


    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>📢 Thông báo</Text>
                    {unseenCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unseenCount}</Text>
                        </View>
                    )}
                </View>


                {/* Danh sách thông báo */}
                {allItems.map((item) => {
                    if (item.type === "ad") {
                        const isSeen = item.viewedBy?.includes(userId);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, !isSeen && styles.highlightCard]}
                                onPress={() => handleViewAd(item)}
                            >
                                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardContent}>{item.content}</Text>
                                {!isSeen && <Text style={styles.newTag}>MỚI</Text>}
                            </TouchableOpacity>
                        );
                    } else {
                        const isRead = item.read;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, !isRead && styles.highlightCard]}
                                onPress={() => handleViewNotification(item)}
                            >
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardContent}>{item.message}</Text>
                                {!isRead && <Text style={styles.newTag}>MỚI</Text>}
                            </TouchableOpacity>
                        );
                    }
                })}
            </ScrollView>
            <TouchableOpacity style={styles.floatingX} onPress={handleClearAll}>
                <Text style={styles.xText}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 15, backgroundColor: "#fff", flex: 1 },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
    title: { fontSize: 22, fontWeight: "bold", color: "#8B0000" },
    badge: {
        backgroundColor: "#B22222",
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 20,
    },
    badgeText: { color: "white", fontWeight: "bold" },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        padding: 10,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        borderWidth: 1,
        borderColor: "#eee",
    },
    highlightCard: { borderColor: "#B22222", borderWidth: 1.5 },
    image: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: "bold", color: "#8B0000", marginBottom: 5 },
    cardContent: { fontSize: 15, color: "#444", marginBottom: 5 },
    newTag: {
        marginTop: 8,
        color: "#B22222",
        fontWeight: "bold",
        borderWidth: 1,
        borderColor: "#B22222",
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        fontSize: 12,
    },
    clearBtn: {
        alignSelf: "flex-end",
        backgroundColor: "#B22222",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 10
    },
    clearText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14
    },
    clearCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,      // Bo tròn thành hình tròn
        backgroundColor: "#B22222",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "flex-end",
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3
    },
    clearX: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        marginTop: -2
    },
    floatingX: {
        position: "absolute",
        bottom: 20,
        left: "50%",                   // nằm giữa theo chiều ngang
        transform: [{ translateX: -25 }], // dịch ngược nửa chiều rộng (50/2 = 25)

        width: 50,
        height: 50,
        borderRadius: 25,       // dùng giá trị lớn để đảm bảo tròn
        backgroundColor: "#B22222",

        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",

        // Xóa các lỗi làm vuông / méo:
        padding: 0,
        borderWidth: 0,
        overflow: "hidden",     // CHỐT hạ: buộc khung thành hình tròn

        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
    },

    xText: {
        color: "white",
        fontSize: 26,
        fontWeight: "bold",
    }


});
