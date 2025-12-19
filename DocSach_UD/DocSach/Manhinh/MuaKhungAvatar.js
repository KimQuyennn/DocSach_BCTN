import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Image, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { getDatabase, ref, onValue, update, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase';

export default function MuaKhungAvatar() {
    const [frames, setFrames] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const db = getDatabase(app);
    const auth = getAuth(app);
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) return;

        const userRef = ref(db, `Users/${userId}`);
        const unsubscribeUser = onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            setUserData(data);
        });

        const framesRef = ref(db, 'AvatarFrames');
        const unsubscribeFrames = onValue(framesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const frameList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                }));
                setFrames(frameList);
            }
            setLoading(false);
        });

        return () => {
            unsubscribeUser();
            unsubscribeFrames();
        };
    }, [userId]);

    const handleBuyFrame = (frame) => {
        if (!userData) return;

        const isBought = userData?.BoughtFrames?.[frame.id] === true;

        // 🔹 Nếu đã mua → chỉ đổi sang khung đó, không trừ xu
        if (isBought) {
            update(ref(db, `Users/${userId}`), {
                AvatarFrame: frame.id
            });
            Alert.alert("Đổi khung thành công", `Bạn đã đổi sang khung ${frame.Name}`);
            return;
        }

        // 🔹 Nếu chưa mua → kiểm tra xu
        if (userData.xu >= frame.Price) {
            const before = userData.xu;
            const after = before - frame.Price;

            const userRef = ref(db, `Users/${userId}`);
            const transRef = ref(db, `Transactions/${userId}`);
            const newTrans = push(transRef);

            update(userRef, {
                xu: after,
                AvatarFrame: frame.id,
                [`BoughtFrames/${frame.id}`]: true // <--- Lưu khung đã mua
            })
                .then(() => {
                    update(newTrans, {
                        amount: frame.Price,
                        before: before,
                        after: after,
                        type: "buy_frame",
                        frameId: frame.id,
                        frameName: frame.Name,
                        date: new Date().toISOString()
                    });

                    Alert.alert("Thành công", `Bạn đã mua khung ${frame.Name}!`);
                })
                .catch(err => {
                    Alert.alert("Lỗi", "Không thể mua khung. Thử lại sau.");
                    console.log(err);
                });
        } else {
            Alert.alert("Không đủ xu", "Bạn không đủ xu để mua khung này.");
        }
    };


    if (loading || !userData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF69B4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.balance}>Số dư xu: {userData.xu}</Text>

            <FlatList
                data={frames}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ padding: 10 }}
                renderItem={({ item }) => {
                    const isBought = userData?.BoughtFrames?.[item.id] === true;
                    const isUsing = userData?.AvatarFrame === item.id;

                    return (
                        <View style={styles.frameCard}>
                            <Image
                                source={{ uri: item.ImageUrl }}
                                style={[
                                    styles.frameImage,
                                    isUsing && { borderColor: '#FFD700', borderWidth: 3 }
                                ]}
                            />

                            <Text style={styles.frameName}>{item.Name}</Text>
                            <Text style={styles.framePrice}>{item.Price} xu</Text>

                            {/* 🔥 Nút xử lý tự động 3 trạng thái */}
                            <TouchableOpacity
                                style={[
                                    styles.buyButton,
                                    isUsing && { backgroundColor: '#aaa' },
                                    isBought && !isUsing && { backgroundColor: '#4CAF50' }
                                ]}
                                onPress={() => handleBuyFrame(item)}
                            >
                                <Text style={styles.buyButtonText}>
                                    {isUsing
                                        ? "Đang dùng"
                                        : isBought
                                            ? "Đã mua"
                                            : "Mua"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    balance: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
    frameCard: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        margin: 5,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    frameImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#FF69B4',
    },
    frameName: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    framePrice: { fontSize: 12, color: '#555', marginBottom: 10 },
    buyButton: {
        backgroundColor: '#FF69B4',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center'
    },
    buyButtonText: { color: '#fff', fontWeight: 'bold' },
});
