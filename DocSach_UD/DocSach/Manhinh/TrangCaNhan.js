// // TrangCaNhan.js
// import React, { useEffect, useState } from 'react';
// import {
//     View, Text, FlatList, Image, StyleSheet,
//     TouchableOpacity, ScrollView, Modal, Alert
// } from 'react-native';
// import { ref, onValue, off, set } from 'firebase/database';
// import { getAuth } from 'firebase/auth';
// import { db } from '../firebase';
// import AvatarWithFrame from './AvatarWithFrame';
// import { TaoThongBao } from './TaoThongBao';

// export default function TrangCaNhan({ route, navigation }) {
//     const { userId } = route.params;
//     const [user, setUser] = useState(null);
//     const [userBooks, setUserBooks] = useState([]);
//     const [readingHistory, setReadingHistory] = useState([]);
//     const [allBooks, setAllBooks] = useState({});
//     const [currentUser, setCurrentUser] = useState(null);
//     const [giftModalVisible, setGiftModalVisible] = useState(false);
//     const [giftAmount, setGiftAmount] = useState(10); // mặc định 10 xu

//     const auth = getAuth();
//     const currentUserId = auth.currentUser?.uid;
//     const [avatarFramesList, setAvatarFramesList] = useState([]);

//     // Trong useEffect, lấy danh sách khung
//     useEffect(() => {
//         const framesRef = ref(db, 'AvatarFrames');
//         onValue(framesRef, snap => {
//             if (snap.exists()) setAvatarFramesList(Object.values(snap.val()));
//         });

//         return () => off(framesRef);
//     }, []);

//     useEffect(() => {
//         if (!userId) return;

//         const userRef = ref(db, `Users/${userId}`);
//         const booksRef = ref(db, 'Books');
//         const historyRef = ref(db, 'ReadingHistory');
//         const currentUserRef = ref(db, `Users/${currentUserId}`);

//         onValue(userRef, snap => snap.exists() && setUser(snap.val()));
//         onValue(currentUserRef, snap => snap.exists() && setCurrentUser(snap.val()));

//         onValue(booksRef, snap => {
//             if (snap.exists()) {
//                 const all = snap.val();
//                 setAllBooks(all);
//                 const uploaded = Object.values(all).filter(b => b.UploaderId === userId);
//                 setUserBooks(uploaded);
//             }
//         });

//         onValue(historyRef, snap => {
//             if (snap.exists()) {
//                 const allHistory = snap.val();
//                 const userHist = allHistory[userId] ? Object.values(allHistory[userId]) : [];
//                 setReadingHistory(userHist);
//             }
//         });

//         return () => {
//             off(userRef);
//             off(booksRef);
//             off(historyRef);
//             off(currentUserRef);
//         };
//     }, [userId, currentUserId]);

//     if (!user || !currentUser) return <Text style={{ padding: 20 }}>Đang tải...</Text>;

//     const confirmGiftXu = () => {
//         const senderXu = currentUser.xu || 0; // mặc định 0 nếu undefined
//         const receiverXu = user.xu || 0;     // mặc định 0 nếu undefined

//         if (giftAmount <= 0) {
//             Alert.alert("Lỗi", "Số xu phải lớn hơn 0");
//             return;
//         }
//         if (giftAmount > senderXu) {
//             Alert.alert("Lỗi", "Bạn không đủ xu để tặng");
//             return;
//         }

//         const timestamp = Date.now();

//         // Lưu giao dịch tặng xu cho người tặng
//         set(ref(db, `Transactions/${currentUserId}/${timestamp}`), {
//             type: "donate",
//             toUserId: userId,
//             amount: giftAmount,
//             before: senderXu,
//             after: senderXu - giftAmount,
//             time: timestamp
//         });

//         // Lưu giao dịch nhận xu cho người nhận
//         set(ref(db, `Transactions/${userId}/${timestamp}`), {
//             type: "receive",
//             fromUserId: currentUserId,
//             amount: giftAmount,
//             before: receiverXu,
//             after: receiverXu + giftAmount,
//             time: timestamp
//         });

//         // Cập nhật số xu mới
//         set(ref(db, `Users/${currentUserId}/xu`), senderXu - giftAmount);
//         set(ref(db, `Users/${userId}/xu`), receiverXu + giftAmount);

//         // Cập nhật state luôn để UI cập nhật ngay
//         setCurrentUser(prev => ({ ...prev, xu: senderXu - giftAmount }));
//         setUser(prev => ({ ...prev, xu: receiverXu + giftAmount }));
//         TaoThongBao(
//             userId,
//             "Bạn vừa nhận xu!",
//             `${currentUser.Username} đã tặng bạn ${giftAmount} xu`,
//             "gift_coin"
//         );

//         // Thông báo người gửi
//         TaoThongBao(
//             currentUserId,
//             "Tặng xu thành công",
//             `Bạn đã tặng ${giftAmount} xu cho ${user.Username}`,
//             "gift_coin"
//         );
//         setGiftModalVisible(false);
//         Alert.alert("Thành công", `Bạn đã tặng ${giftAmount} xu cho ${user.Username}`);

//     };


//     const renderBookItem = ({ item }) => (
//         <TouchableOpacity
//             style={styles.card}
//             onPress={() => navigation.navigate('ChiTietSach', { bookId: item.Id })}
//         >
//             <Image
//                 source={{ uri: item.CoverImage || 'https://via.placeholder.com/100x150' }}
//                 style={styles.bookImage}
//             />
//             <View style={styles.bookInfo}>
//                 <Text style={styles.cardTitle}>{item.Title}</Text>
//                 <Text style={styles.cardSubtitle}>Trạng thái: {item.Status}</Text>
//                 {item.IsVIP ? (
//                     <Text style={styles.vipLabel}>VIP</Text>
//                 ) : (
//                     <Text style={styles.priceLabel}>Giá: {item.Price || 0} xu</Text>
//                 )}
//                 <Text style={styles.publishedDate}>
//                     Đăng: {new Date(item.PublishedDate).toLocaleDateString()}
//                 </Text>
//             </View>
//         </TouchableOpacity>
//     );

//     const renderHistoryItem = ({ item }) => {
//         const book = allBooks[item.BookId];
//         if (!book) return null;
//         return (
//             <TouchableOpacity
//                 style={styles.card}
//                 onPress={() => navigation.navigate('ChiTietSach', { bookId: book.Id })}
//             >
//                 <Image
//                     source={{ uri: book.CoverImage || 'https://via.placeholder.com/100x150' }}
//                     style={styles.bookImage}
//                 />
//                 <View style={styles.bookInfo}>
//                     <Text style={styles.cardTitle}>{book.Title}</Text>
//                     <Text style={styles.publishedDate}>
//                         Đọc vào: {new Date(item.AddedAt).toLocaleDateString()}
//                     </Text>
//                 </View>
//             </TouchableOpacity>
//         );
//     };

//     return (
//         <ScrollView style={styles.container}>
//             {/* Header User */}
//             <View style={styles.header}>
//                 <AvatarWithFrame user={user} avatarFramesList={avatarFramesList} size={100} />
//                 <View style={{ marginLeft: 15, flex: 1 }}>
//                     <Text style={styles.username}>{user.Username}</Text>
//                     <Text style={styles.bio}>{user.Bio}</Text>
//                     <Text style={styles.xuText}>Xu hiện có: {user.xu || 0}</Text>
//                     <TouchableOpacity style={styles.giftButton} onPress={() => setGiftModalVisible(true)}>
//                         <Text style={styles.giftButtonText}>🎁 Tặng xu</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>

//             {/* Sách đã đăng */}
//             <Text style={styles.sectionTitle}>Sách đã đăng:</Text>
//             {userBooks.length > 0 ? (
//                 <FlatList
//                     data={userBooks}
//                     keyExtractor={item => item.Id}
//                     renderItem={renderBookItem}
//                     horizontal
//                     showsHorizontalScrollIndicator={false}
//                 />
//             ) : (
//                 <Text style={{ marginLeft: 10 }}>Chưa đăng sách nào</Text>
//             )}

//             {/* Lịch sử đọc */}
//             <Text style={styles.sectionTitle}>Danh sách đọc:</Text>
//             {readingHistory.length > 0 ? (
//                 <FlatList
//                     data={readingHistory}
//                     keyExtractor={(item, index) => index.toString()}
//                     renderItem={renderHistoryItem}
//                     horizontal
//                     showsHorizontalScrollIndicator={false}
//                 />
//             ) : (
//                 <Text style={{ marginLeft: 10 }}>Chưa có danh sách nào</Text>
//             )}

//             {/* Modal tặng xu */}
//             <Modal
//                 visible={giftModalVisible}
//                 transparent
//                 animationType="fade"
//                 onRequestClose={() => setGiftModalVisible(false)}
//             >
//                 <View style={styles.modalOverlay}>
//                     <View style={styles.modalContent}>
//                         <Text style={styles.modalTitle}>Tặng xu cho {user.Username}</Text>
//                         <View style={styles.amountContainer}>
//                             <TouchableOpacity
//                                 style={styles.amountButton}
//                                 onPress={() => setGiftAmount(prev => Math.max(1, prev - 1))}
//                             >
//                                 <Text style={styles.amountButtonText}>-</Text>
//                             </TouchableOpacity>
//                             <Text style={styles.amountText}>{giftAmount} xu</Text>
//                             <TouchableOpacity
//                                 style={styles.amountButton}
//                                 onPress={() => setGiftAmount(prev => prev + 1)}
//                             >
//                                 <Text style={styles.amountButtonText}>+</Text>
//                             </TouchableOpacity>
//                         </View>
//                         <View style={styles.modalButtons}>
//                             <TouchableOpacity style={styles.confirmButton} onPress={confirmGiftXu}>
//                                 <Text style={styles.confirmButtonText}>Xác nhận</Text>
//                             </TouchableOpacity>
//                             <TouchableOpacity style={styles.cancelButton} onPress={() => setGiftModalVisible(false)}>
//                                 <Text style={styles.cancelButtonText}>Hủy</Text>
//                             </TouchableOpacity>
//                         </View>
//                     </View>
//                 </View>
//             </Modal>
//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, padding: 15, backgroundColor: '#f4e6e0' },
//     header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
//     username: { fontSize: 22, fontWeight: 'bold', color: '#7c2d12' },
//     bio: { fontSize: 14, color: '#5c3a21', marginTop: 4 },
//     xuText: { marginTop: 6, fontWeight: 'bold', color: '#7c2d12' },
//     giftButton: {
//         marginTop: 8,
//         backgroundColor: '#a53e2c',
//         paddingVertical: 8,
//         paddingHorizontal: 14,
//         borderRadius: 8,
//         alignSelf: 'flex-start'
//     },
//     giftButtonText: { color: '#fff', fontWeight: 'bold' },
//     sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#7c2d12' },
//     card: {
//         flexDirection: 'row',
//         backgroundColor: '#fff2f0',
//         borderRadius: 10,
//         elevation: 3,
//         marginRight: 12,
//         padding: 10,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         shadowOffset: { width: 0, height: 2 },
//     },
//     bookImage: { width: 100, height: 150, borderRadius: 8 },
//     bookInfo: { flex: 1, justifyContent: 'space-between', marginLeft: 10 },
//     cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#7c2d12' },
//     cardSubtitle: { fontSize: 14, color: '#a85b45', marginTop: 5 },
//     vipLabel: {
//         color: '#fff',
//         backgroundColor: '#c03e1a',
//         paddingHorizontal: 6,
//         paddingVertical: 2,
//         borderRadius: 4,
//         alignSelf: 'flex-start',
//         marginTop: 5
//     },
//     priceLabel: { fontSize: 14, color: '#a85b45', marginTop: 5 },
//     publishedDate: { fontSize: 12, color: '#995c44', marginTop: 5 },
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     modalContent: {
//         width: '80%',
//         backgroundColor: '#fff2f0',
//         borderRadius: 10,
//         padding: 20,
//         alignItems: 'center'
//     },
//     modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#7c2d12', marginBottom: 15 },
//     amountContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
//     amountButton: {
//         backgroundColor: '#a53e2c',
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         justifyContent: 'center',
//         alignItems: 'center'
//     },
//     amountButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
//     amountText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, color: '#7c2d12' },
//     modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
//     confirmButton: { flex: 1, backgroundColor: '#c03e1a', padding: 10, borderRadius: 8, marginRight: 5, alignItems: 'center' },
//     confirmButtonText: { color: '#fff', fontWeight: 'bold' },
//     cancelButton: { flex: 1, backgroundColor: '#a53e2c', padding: 10, borderRadius: 8, marginLeft: 5, alignItems: 'center' },
//     cancelButtonText: { color: '#fff', fontWeight: 'bold' }
// });


// TrangCaNhan.js
import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, Image, StyleSheet,
    TouchableOpacity, ScrollView, Modal, Alert
} from 'react-native';
import { ref, onValue, off, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import AvatarWithFrame from './AvatarWithFrame';
import { TaoThongBao } from './TaoThongBao';

export default function TrangCaNhan({ route, navigation }) {
    const { userId } = route.params;
    const [user, setUser] = useState(null);
    const [userBooks, setUserBooks] = useState([]);
    const [readingLists, setReadingLists] = useState([]); // danh sách đọc
    const [allBooks, setAllBooks] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [giftModalVisible, setGiftModalVisible] = useState(false);
    const [giftAmount, setGiftAmount] = useState(10); // mặc định 10 xu

    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    const [avatarFramesList, setAvatarFramesList] = useState([]);

    // Xóa sách khỏi danh sách đọc
    const removeFromReadingList = (listItemKey) => {
        Alert.alert(
            "Xác nhận",
            "Bạn có chắc muốn xóa sách này khỏi danh sách đọc?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => {
                        set(ref(db, `ReadingLists/${listItemKey}`), null)
                            .then(() => {
                                setReadingLists(prev => prev.filter(item => item.key !== listItemKey));
                            })
                            .catch(err => Alert.alert("Lỗi", err.message));
                    }
                }
            ]
        );
    };

    // Lấy danh sách khung avatar
    useEffect(() => {
        const framesRef = ref(db, 'AvatarFrames');
        onValue(framesRef, snap => {
            if (snap.exists()) setAvatarFramesList(Object.values(snap.val()));
        });
        return () => off(framesRef);
    }, []);

    useEffect(() => {
        if (!userId) return;

        const userRef = ref(db, `Users/${userId}`);
        const booksRef = ref(db, 'Books');
        const readingListsRef = ref(db, 'ReadingLists');
        const currentUserRef = ref(db, `Users/${currentUserId}`);

        onValue(userRef, snap => snap.exists() && setUser(snap.val()));
        onValue(currentUserRef, snap => snap.exists() && setCurrentUser(snap.val()));

        onValue(booksRef, snap => {
            if (snap.exists()) {
                const all = snap.val();
                setAllBooks(all);
                const uploaded = Object.values(all).filter(b => b.UploaderId === userId);
                setUserBooks(uploaded);
            }
        });

        onValue(readingListsRef, snap => {
            if (snap.exists()) {
                const allLists = snap.val();
                const userList = Object.entries(allLists)
                    .filter(([key, item]) => item.UserId === userId)
                    .map(([key, item]) => ({ key, ...item })); // thêm key
                userList.sort((a, b) => new Date(b.AddedAt) - new Date(a.AddedAt));
                setReadingLists(userList);
            }
        });

        return () => {
            off(userRef);
            off(booksRef);
            off(readingListsRef);
            off(currentUserRef);
        };
    }, [userId, currentUserId]);

    if (!user || !currentUser) return <Text style={{ padding: 20 }}>Đang tải...</Text>;

    const confirmGiftXu = () => {
        const senderXu = currentUser.xu || 0;
        const receiverXu = user.xu || 0;

        if (giftAmount <= 0) {
            Alert.alert("Lỗi", "Số xu phải lớn hơn 0");
            return;
        }
        if (giftAmount > senderXu) {
            Alert.alert("Lỗi", "Bạn không đủ xu để tặng");
            return;
        }

        const timestamp = Date.now();

        set(ref(db, `Transactions/${currentUserId}/${timestamp}`), {
            type: "donate",
            toUserId: userId,
            amount: giftAmount,
            before: senderXu,
            after: senderXu - giftAmount,
            time: timestamp
        });

        set(ref(db, `Transactions/${userId}/${timestamp}`), {
            type: "receive",
            fromUserId: currentUserId,
            amount: giftAmount,
            before: receiverXu,
            after: receiverXu + giftAmount,
            time: timestamp
        });

        set(ref(db, `Users/${currentUserId}/xu`), senderXu - giftAmount);
        set(ref(db, `Users/${userId}/xu`), receiverXu + giftAmount);

        setCurrentUser(prev => ({ ...prev, xu: senderXu - giftAmount }));
        setUser(prev => ({ ...prev, xu: receiverXu + giftAmount }));

        TaoThongBao(
            userId,
            "Bạn vừa nhận xu!",
            `${currentUser.Username} đã tặng bạn ${giftAmount} xu`,
            "gift_coin"
        );
        TaoThongBao(
            currentUserId,
            "Tặng xu thành công",
            `Bạn đã tặng ${giftAmount} xu cho ${user.Username}`,
            "gift_coin"
        );

        setGiftModalVisible(false);
        Alert.alert("Thành công", `Bạn đã tặng ${giftAmount} xu cho ${user.Username}`);
    };

    const renderBookItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chitiet', { bookId: item.Id })}
        >
            <Image
                source={{ uri: item.CoverImage || 'https://via.placeholder.com/100x150' }}
                style={styles.bookImage}
            />
            <View style={styles.bookInfo}>
                <Text style={styles.cardTitle}>{item.Title}</Text>
                <Text style={styles.cardSubtitle}>Trạng thái: {item.Status}</Text>
                {item.IsVIP ? (
                    <Text style={styles.vipLabel}>VIP</Text>
                ) : (
                    <Text style={styles.priceLabel}>Giá: {item.Price || 0} xu</Text>
                )}
                <Text style={styles.publishedDate}>
                    Đăng: {new Date(item.PublishedDate).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderReadingListItem = (item) => {
        const book = allBooks[item.BookId];
        if (!book) return null;

        // Giả định currentUserId và userId được truy cập từ scope cha
        const isOwner = currentUserId === userId;

        return (
            <View style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <TouchableOpacity
                    style={{ flexDirection: 'row', flex: 1 }}
                    onPress={() => navigation.navigate('Chitiet', { bookId: book.Id })}
                >
                    <Image
                        source={{ uri: book.CoverImage || 'https://via.placeholder.com/100x150' }}
                        style={styles.bookImage}
                    />
                    <View style={styles.bookInfo}>
                        <Text style={styles.cardTitle}>{book.Title}</Text>
                        <Text style={styles.publishedDate}>
                            Thêm vào: {new Date(item.AddedAt).toLocaleDateString()}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* 🛑 CHỈ HIỂN THỊ NÚT XÓA NẾU NGƯỜI DÙNG LÀ CHỦ SỞ HỮU TRANG */}
                {isOwner && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeFromReadingList(item.key)}
                    >
                        <Text style={styles.deleteButtonText}>❌</Text>
                    </TouchableOpacity>
                )}

            </View>
        );
    };
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
            {/* Header User */}
            <View style={styles.header}>
                <AvatarWithFrame user={user} avatarFramesList={avatarFramesList} size={100} />
                <View style={{ marginLeft: 15, flex: 1 }}>
                    <Text style={styles.username}>{user.Username}</Text>
                    <Text style={styles.bio}>{user.Bio}</Text>
                    <Text style={styles.xuText}>Xu hiện có: {user.xu || 0}</Text>
                    {currentUserId !== userId && (
                        <TouchableOpacity style={styles.giftButton} onPress={() => setGiftModalVisible(true)}>
                            <Text style={styles.giftButtonText}>🎁 Tặng xu</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Sách đã đăng */}
            <Text style={styles.sectionTitle}>Sách đã đăng:</Text>
            {
                userBooks.length > 0 ? (
                    <FlatList
                        data={userBooks}
                        keyExtractor={item => item.Id}
                        renderItem={renderBookItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    />
                ) : (
                    <Text style={{ marginLeft: 10 }}>Chưa đăng sách nào</Text>
                )
            }

            {/* Danh sách đọc */}
            <Text style={styles.sectionTitle}>Danh sách đọc:</Text>
            {
                readingLists.length > 0 ? (
                    <FlatList
                        data={readingLists}
                        keyExtractor={item => item.key}
                        renderItem={({ item }) => renderReadingListItem(item)}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    />
                ) : (
                    <Text style={{ marginLeft: 10 }}>Chưa thêm sách nào</Text>
                )
            }

            {/* Modal tặng xu */}
            <Modal
                visible={giftModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setGiftModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tặng xu cho {user.Username}</Text>
                        <View style={styles.amountContainer}>
                            <TouchableOpacity
                                style={styles.amountButton}
                                onPress={() => setGiftAmount(prev => Math.max(1, prev - 1))}
                            >
                                <Text style={styles.amountButtonText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.amountText}>{giftAmount} xu</Text>
                            <TouchableOpacity
                                style={styles.amountButton}
                                onPress={() => setGiftAmount(prev => prev + 1)}
                            >
                                <Text style={styles.amountButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.confirmButton} onPress={confirmGiftXu}>
                                <Text style={styles.confirmButtonText}>Xác nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setGiftModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#f4e6e0' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    username: { fontSize: 22, fontWeight: 'bold', color: '#7c2d12' },
    bio: { fontSize: 14, color: '#5c3a21', marginTop: 4 },
    xuText: { marginTop: 6, fontWeight: 'bold', color: '#7c2d12' },
    giftButton: {
        marginTop: 8,
        backgroundColor: '#a53e2c',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    giftButtonText: { color: '#fff', fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 10, color: '#7c2d12' },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff2f0',
        borderRadius: 10,
        elevation: 3,
        marginRight: 12,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    bookImage: { width: 100, height: 150, borderRadius: 8 },
    bookInfo: { flex: 1, justifyContent: 'space-between', marginLeft: 10 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#7c2d12' },
    cardSubtitle: { fontSize: 14, color: '#a85b45', marginTop: 5 },
    vipLabel: {
        color: '#fff',
        backgroundColor: '#c03e1a',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 5
    },
    priceLabel: { fontSize: 14, color: '#a85b45', marginTop: 5 },
    publishedDate: { fontSize: 12, color: '#995c44', marginTop: 5 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff2f0',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center'
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#7c2d12', marginBottom: 15 },
    amountContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
    amountButton: {
        backgroundColor: '#a53e2c',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    amountButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    amountText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, color: '#7c2d12' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
    confirmButton: { flex: 1, backgroundColor: '#c03e1a', padding: 10, borderRadius: 8, marginRight: 5, alignItems: 'center' },
    confirmButtonText: { color: '#fff', fontWeight: 'bold' },
    cancelButton: { flex: 1, backgroundColor: '#a53e2c', padding: 10, borderRadius: 8, marginLeft: 5, alignItems: 'center' },
    cancelButtonText: { color: '#fff', fontWeight: 'bold' },
    deleteButton: {
        marginLeft: 8,
        backgroundColor: '#ff4d4d',
        padding: 6,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center'
    },
    deleteButtonText: { color: '#fff', fontWeight: 'bold' }
});
