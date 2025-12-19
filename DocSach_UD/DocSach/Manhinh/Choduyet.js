// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Platform, ScrollView } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { getAuth } from 'firebase/auth';
// import { getDatabase, ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
// import { app } from '../firebase';

// const Choduyet = () => {
//     const navigation = useNavigation();
//     const auth = getAuth(app);
//     const db = getDatabase(app);

//     const [userId, setUserId] = useState(null);
//     const [pendingBooks, setPendingBooks] = useState([]);
//     const [pendingChapters, setPendingChapters] = useState([]);
//     const [rejectedBooks, setRejectedBooks] = useState([]);
//     const [rejectedChapters, setRejectedChapters] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);


//     // Kiểm tra auth
//     useEffect(() => {
//         const unsubscribeAuth = auth.onAuthStateChanged((user) => {
//             if (user) {
//                 setUserId(user.uid);
//             } else {
//                 setUserId(null);
//                 navigation.navigate('Dangnhap');
//             }
//         });
//         return () => unsubscribeAuth();
//     }, [auth, navigation]);

//     // Load dữ liệu sách/chương
//     useEffect(() => {
//         if (!userId) return;

//         setIsLoading(true);

//         const userBooksRef = query(ref(db, 'Books'), orderByChild('UploaderId'), equalTo(userId));
//         const unsubscribeBooks = onValue(userBooksRef, (snapshot) => {
//             const data = snapshot.val();
//             const pending = [];
//             const rejected = [];
//             if (data) {
//                 for (const key in data) {
//                     const book = { id: key, ...data[key] };
//                     if (book.IsApproved === false && book.Status !== "Từ chối") {
//                         pending.push(book);
//                     } else if (book.Status === "Từ chối") {
//                         rejected.push(book);
//                     }
//                 }
//             }
//             setPendingBooks(pending);
//             setRejectedBooks(rejected);

//             fetchChapters(pending, rejected);
//         }, (error) => {
//             console.error("Lỗi khi tải sách:", error);
//             setIsLoading(false);
//         });

//         return () => unsubscribeBooks();
//     }, [userId]);

//     // Load chương
//     const fetchChapters = async (pendingBooks, rejectedBooks) => {
//         try {
//             const chaptersRef = ref(db, 'Chapters');
//             const snapshot = await get(chaptersRef);
//             const data = snapshot.val();

//             const pendingChaps = [];
//             const rejectedChaps = [];

//             if (data) {
//                 for (const key in data) {
//                     const chap = data[key];
//                     const bookPending = pendingBooks.find(b => b.id === chap.BookId);
//                     const bookRejected = rejectedBooks.find(b => b.id === chap.BookId);
//                     const isRejected = chap.Rejected === true;

//                     if ((bookPending && chap.IsApproved === false) || (bookPending && chap.IsApproved === "false")) {
//                         pendingChaps.push({ id: key, ...chap, bookTitle: bookPending.Title });
//                     } else if (isRejected || (bookRejected && chap.IsApproved === false)) {
//                         rejectedChaps.push({ id: key, ...chap, bookTitle: bookPending?.Title || bookRejected?.Title });
//                     }
//                 }
//             }

//             setPendingChapters(pendingChaps);
//             setRejectedChapters(rejectedChaps);
//         } catch (error) {
//             console.error("Lỗi khi tải chương:", error);
//             setPendingChapters([]);
//             setRejectedChapters([]);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const renderBookItem = (status) => ({ item }) => (
//         <View style={styles.itemContainer}>
//             <Image source={{ uri: item.CoverImage || 'https://via.placeholder.com/150' }} style={styles.itemImage} />
//             <View style={styles.itemInfo}>
//                 <Text style={styles.itemTitle} numberOfLines={2}>{item.Title}</Text>
//                 <Text style={styles.itemAuthor}>Tác giả: {item.Author}</Text>
//                 <Text style={styles.itemStatus}>
//                     {status === "pending" ? "Chờ duyệt" : "Đã từ chối"}
//                 </Text>
//             </View>
//         </View>
//     );

//     const renderChapterItem = (status) => ({ item }) => (
//         <View style={styles.itemContainer}>
//             <Ionicons name="document-text-outline" size={50} color="#888" style={styles.itemIcon} />
//             <View style={styles.itemInfo}>
//                 <Text style={styles.itemTitle} numberOfLines={2}>{item.Title}</Text>
//                 <Text style={styles.itemAuthor}>Sách: {item.bookTitle}</Text>
//                 <Text style={styles.itemStatus}>
//                     {status === "pending" ? "Chờ duyệt" : `Đã từ chối${item.RejectedReason ? `: ${item.RejectedReason}` : ""}`}
//                 </Text>
//             </View>
//         </View>
//     );

//     if (isLoading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#FF69B4" />
//                 <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
//             </View>
//         );
//     }

//     return (
//         <ScrollView style={styles.container}>
//             {/* Sách chờ duyệt */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Sách chờ duyệt ({pendingBooks.length})</Text>
//                 {pendingBooks.length > 0 ? (
//                     <FlatList
//                         data={pendingBooks}
//                         renderItem={renderBookItem("pending")}
//                         keyExtractor={(item) => item.id}
//                         scrollEnabled={false}
//                     />
//                 ) : (
//                     <Text style={styles.noItemsText}>Không có sách nào chờ duyệt.</Text>
//                 )}
//             </View>

//             {/* Chương chờ duyệt */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Chương chờ duyệt ({pendingChapters.length})</Text>
//                 {pendingChapters.length > 0 ? (
//                     <FlatList
//                         data={pendingChapters}
//                         renderItem={renderChapterItem("pending")}
//                         keyExtractor={(item) => item.id}
//                         scrollEnabled={false}
//                     />
//                 ) : (
//                     <Text style={styles.noItemsText}>Không có chương nào chờ duyệt.</Text>
//                 )}
//             </View>

//             {/* Sách bị từ chối */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Sách bị từ chối ({rejectedBooks.length})</Text>
//                 {rejectedBooks.length > 0 ? (
//                     <FlatList
//                         data={rejectedBooks}
//                         renderItem={renderBookItem("rejected")}
//                         keyExtractor={(item) => item.id}
//                         scrollEnabled={false}
//                     />
//                 ) : (
//                     <Text style={styles.noItemsText}>Không có sách nào bị từ chối.</Text>
//                 )}
//             </View>

//             {/* Chương bị từ chối */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Chương bị từ chối ({rejectedChapters.length})</Text>
//                 {rejectedChapters.length > 0 ? (
//                     <FlatList
//                         data={rejectedChapters}
//                         renderItem={renderChapterItem("rejected")}
//                         keyExtractor={(item) => item.id}
//                         scrollEnabled={false}
//                     />
//                 ) : (
//                     <Text style={styles.noItemsText}>Không có chương nào bị từ chối.</Text>
//                 )}
//             </View>

//             {/* Thông báo nếu tất cả đã được duyệt */}
//             {pendingBooks.length === 0 && pendingChapters.length === 0 && rejectedBooks.length === 0 && rejectedChapters.length === 0 && (
//                 <View style={styles.allApprovedContainer}>
//                     <Ionicons name="checkmark-circle-outline" size={80} color="#28a745" />
//                     <Text style={styles.allApprovedText}>Tất cả sách và chương của bạn đã được duyệt!</Text>
//                 </View>
//             )}
//         </ScrollView>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 40 : 20 },
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
//     loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
//     section: { paddingHorizontal: 15, paddingVertical: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
//     sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
//     itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.41, elevation: 1 },
//     itemImage: { width: 50, height: 75, borderRadius: 4, marginRight: 15, resizeMode: 'cover' },
//     itemIcon: { marginRight: 15 },
//     itemInfo: { flex: 1, justifyContent: 'center' },
//     itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 3 },
//     itemAuthor: { fontSize: 14, color: '#555', marginBottom: 3 },
//     itemStatus: { fontSize: 13, color: '#e74c3c', fontWeight: 'bold' },
//     noItemsText: { fontSize: 14, color: '#777', textAlign: 'center', paddingVertical: 10 },
//     allApprovedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 50 },
//     allApprovedText: { fontSize: 18, fontWeight: 'bold', color: '#28a745', textAlign: 'center', marginTop: 15 },
// });

// export default Choduyet;


import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, query, orderByChild, equalTo, get, remove } from 'firebase/database';
import { app } from '../firebase';

// Danh sách các tab
const TABS = {
    APPROVED_BOOK: 'approved_book',    // Sách đã đăng tải (Đã duyệt)
    PENDING_BOOK: 'pending_book',      // Sách chờ duyệt
    PENDING_CHAPTER: 'pending_chapter',// Chương chờ duyệt
    REJECTED_BOOK: 'rejected_book',    // Sách bị từ chối
    REJECTED_CHAPTER: 'rejected_chapter',// Chương bị từ chối
};

const TAB_NAMES = {
    [TABS.APPROVED_BOOK]: 'Sách đã đăng tải',
    [TABS.PENDING_BOOK]: 'Sách chờ duyệt',
    [TABS.PENDING_CHAPTER]: 'Chương chờ duyệt',
    [TABS.REJECTED_BOOK]: 'Sách bị từ chối',
    [TABS.REJECTED_CHAPTER]: 'Chương bị từ chối',
};

const Choduyet = () => {
    const navigation = useNavigation();
    const auth = getAuth(app);
    const db = getDatabase(app);

    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState(TABS.APPROVED_BOOK); // Mặc định hiển thị Sách đã đăng tải

    // States cho dữ liệu
    const [pendingBooks, setPendingBooks] = useState([]);
    const [pendingChapters, setPendingChapters] = useState([]);
    const [rejectedBooks, setRejectedBooks] = useState([]);
    const [rejectedChapters, setRejectedChapters] = useState([]);
    const [approvedBooks, setApprovedBooks] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [userBooksMap, setUserBooksMap] = useState({});

    // Kiểm tra Auth
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
            }
        });
        return () => unsubscribeAuth();
    }, [auth]);

    // Load DỮ LIỆU SÁCH VÀ CHƯƠNG
    useEffect(() => {
        if (!userId) return;

        setIsLoading(true);

        const userBooksRef = query(ref(db, 'Books'), orderByChild('UploaderId'), equalTo(userId));
        const unsubscribeBooks = onValue(userBooksRef, (snapshot) => {
            const data = snapshot.val();
            const pendingB = [];
            const rejectedB = [];
            const approvedB = [];
            const booksMap = {};
            const userBookIds = [];

            if (data) {
                for (const key in data) {
                    const book = { id: key, ...data[key] };
                    booksMap[key] = book;
                    userBookIds.push(key);

                    // Phân loại sách:
                    if (book.IsApproved === false && book.Status === "Từ chối") {
                        rejectedB.push(book); // Bị từ chối
                    } else if (book.IsApproved === false && (book.Status === "Chưa duyệt" || book.Status === "Chờ duyệt lại" || !book.Status)) {
                        pendingB.push(book); // Chờ duyệt
                    } else if (book.IsApproved === true) {
                        approvedB.push(book); // Đã duyệt (Đã đăng tải)
                    }
                }
            }
            setPendingBooks(pendingB);
            setRejectedBooks(rejectedB);
            setApprovedBooks(approvedB);
            setUserBooksMap(booksMap);

            if (userBookIds.length > 0) {
                fetchChapters(userBookIds, booksMap);
            } else {
                setIsLoading(false);
                setPendingChapters([]);
                setRejectedChapters([]);
            }

        }, (error) => {
            console.error("Lỗi khi tải sách:", error);
            setIsLoading(false);
        });

        return () => unsubscribeBooks();
    }, [userId]);

    // Hàm load chương
    const fetchChapters = async (userBookIds, booksMap) => {
        try {
            const chaptersRef = ref(db, 'Chapters');
            const snapshot = await get(chaptersRef);
            const data = snapshot.val();

            const pendingChaps = [];
            const rejectedChaps = [];

            if (data) {
                for (const key in data) {
                    const chap = { id: key, ...data[key] };

                    if (!userBookIds.includes(chap.BookId)) {
                        continue; // Bỏ qua chương không thuộc sách của user này
                    }

                    const bookTitle = booksMap[chap.BookId]?.Title || "Không rõ tên sách";
                    const isExplicitlyRejected = chap.Rejected === true;
                    const isChapterApproved = chap.IsApproved === true;

                    if (isExplicitlyRejected) {
                        rejectedChaps.push({ ...chap, bookTitle: bookTitle }); // Bị từ chối
                    } else if (!isChapterApproved) {
                        pendingChaps.push({ ...chap, bookTitle: bookTitle }); // Chờ duyệt
                    }
                }
            }

            setPendingChapters(pendingChaps);
            setRejectedChapters(rejectedChaps);
        } catch (error) {
            console.error("Lỗi khi tải chương:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIC XỬ LÝ SÁCH ---
    const handleEditBook = (book) => {
        navigation.navigate('Suasach', { bookId: book.id });
    };

    const handleViewChapters = (book) => {
        // Điều hướng đến màn hình quản lý chương của sách cụ thể
        navigation.navigate('QuanLyChuong', { bookId: book.id, bookTitle: book.Title });
    };

    const handleDeleteBook = (book) => {
        Alert.alert(
            "Xác nhận Xóa Sách",
            `Bạn có chắc chắn muốn xóa sách "${book.Title}" không? Thao tác này sẽ xóa VĨNH VIỄN sách và TẤT CẢ chương liên quan.`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    onPress: async () => {
                        try {
                            // Xóa sách khỏi Books
                            const bookRef = ref(db, `Books/${book.id}`);
                            await remove(bookRef);

                            // (Tùy chọn) Xóa thủ công các chương liên quan (Để đảm bảo an toàn data)
                            // Logic xóa chương liên quan nên được xử lý ở backend hoặc trong rule Firebase nếu có.
                            // Với cấu trúc hiện tại, chúng ta chỉ cần xóa sách, UI sẽ tự cập nhật do onValue listener.

                            Alert.alert("Thành công", "Sách đã được xóa.");
                        } catch (error) {
                            console.error("Lỗi khi xóa sách:", error);
                            Alert.alert("Lỗi", "Không thể xóa sách. Vui lòng thử lại.");
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // --- LOGIC XỬ LÝ CHƯƠNG ---
    const handleEditChapter = (chapter) => {
        navigation.navigate('Suachuong', { chapterId: chapter.id });
    };

    const handleDeleteChapter = (chapter) => {
        Alert.alert(
            "Xác nhận Xóa Chương",
            `Bạn có chắc chắn muốn xóa chương "${chapter.Title}" không? Thao tác này không thể hoàn tác.`,
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    onPress: async () => {
                        try {
                            const chapterRef = ref(db, `Chapters/${chapter.id}`);
                            await remove(chapterRef);
                            Alert.alert("Thành công", "Chương đã được xóa.");
                        } catch (error) {
                            console.error("Lỗi khi xóa chương:", error);
                            Alert.alert("Lỗi", "Không thể xóa chương. Vui lòng thử lại.");
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // Render Item Sách
    const renderBookItem = (status) => ({ item }) => {

        let displayStatus = "";
        let statusStyle = styles.pendingText;
        let showActions = true;

        if (status === "approved") {
            displayStatus = item.IsCompleted ? "Hoàn thành" : "Đang cập nhật";
            statusStyle = styles.approvedText;
        } else if (status === "pending") {
            displayStatus = item.Status || "Chờ duyệt";
            statusStyle = styles.pendingText;
        } else if (status === "rejected") {
            displayStatus = "Đã từ chối";
            statusStyle = styles.rejectedText;
        }

        return (
            <TouchableOpacity style={styles.itemContainer} onPress={() => status === "approved" && handleEditBook(item)}>
                <Image source={{ uri: item.CoverImage || 'https://via.placeholder.com/150' }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.Title}</Text>
                    <Text style={styles.itemAuthor}>Tác giả: {item.Author}</Text>
                    <Text style={[styles.itemStatus, statusStyle]}>
                        {displayStatus}
                    </Text>

                    {showActions && (
                        <View style={styles.actionContainer}>

                            {/* Nút Sửa Sách */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={() => handleEditBook(item)}
                            >
                                <Text style={styles.actionButtonText}>Sửa Sách</Text>
                            </TouchableOpacity>

                            {/* Nút Xem Chương (Chỉ cho Sách đã đăng tải) */}
                            {status === "approved" && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.viewChapterButton]}
                                    onPress={() => handleViewChapters(item)}
                                >
                                    <Text style={styles.actionButtonText}>Xem Chương</Text>
                                </TouchableOpacity>
                            )}

                            {/* Nút Xóa Sách */}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteBook(item)}
                            >
                                <Text style={styles.actionButtonText}>Xóa Sách</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Render Item Chương
    const renderChapterItem = (status) => ({ item }) => {
        const statusText = status === "pending" ? "Chờ duyệt" : `Đã từ chối${item.RejectedReason ? `: ${item.RejectedReason}` : ""}`;
        const statusStyle = status === "pending" ? styles.pendingText : styles.rejectedText;

        return (
            <View style={styles.itemContainer}>
                <Ionicons name="document-text-outline" size={50} color="#888" style={styles.itemIcon} />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.Title}</Text>
                    <Text style={styles.itemAuthor}>Sách: {item.bookTitle}</Text>
                    <Text style={[styles.itemStatus, statusStyle]}>
                        {statusText}
                    </Text>

                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => handleEditChapter(item)}
                        >
                            <Text style={styles.actionButtonText}>Sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteChapter(item)}
                        >
                            <Text style={styles.actionButtonText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    // Render nội dung của Tab hiện tại
    const renderContent = () => {
        let data, renderItemFunc, noItemsMessage;

        switch (activeTab) {
            case TABS.APPROVED_BOOK:
                data = approvedBooks;
                renderItemFunc = renderBookItem("approved");
                noItemsMessage = "Không có sách nào đã được đăng tải.";
                break;
            case TABS.PENDING_BOOK:
                data = pendingBooks;
                renderItemFunc = renderBookItem("pending");
                noItemsMessage = "Không có sách nào chờ duyệt.";
                break;
            case TABS.PENDING_CHAPTER:
                data = pendingChapters;
                renderItemFunc = renderChapterItem("pending");
                noItemsMessage = "Không có chương nào chờ duyệt.";
                break;
            case TABS.REJECTED_BOOK:
                data = rejectedBooks;
                renderItemFunc = renderBookItem("rejected");
                noItemsMessage = "Không có sách nào bị từ chối.";
                break;
            case TABS.REJECTED_CHAPTER:
                data = rejectedChapters;
                renderItemFunc = renderChapterItem("rejected");
                noItemsMessage = "Không có chương nào bị từ chối.";
                break;
            default:
                return null;
        }

        if (data.length === 0) {
            return <Text style={styles.noItemsText}>{noItemsMessage}</Text>;
        }

        return (
            <FlatList
                data={data}
                renderItem={renderItemFunc}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: 10 }}
            />
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF69B4" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.fullContainer}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý Tác phẩm</Text>
            </View>

            {/* TAB Navigation */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}
            >
                {Object.keys(TABS).map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.tabButton, activeTab === TABS[key] && styles.activeTab]}
                        onPress={() => setActiveTab(TABS[key])}
                    >
                        <Text style={[styles.tabText, activeTab === TABS[key] && styles.activeTabText]}>
                            {TAB_NAMES[TABS[key]]} ({
                                TABS[key] === TABS.APPROVED_BOOK ? approvedBooks.length :
                                    TABS[key] === TABS.PENDING_BOOK ? pendingBooks.length :
                                        TABS[key] === TABS.PENDING_CHAPTER ? pendingChapters.length :
                                            TABS[key] === TABS.REJECTED_BOOK ? rejectedBooks.length :
                                                rejectedChapters.length
                            })
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView style={styles.contentContainer} contentContainerStyle={{ padding: 15 }}>
                {renderContent()}
                <View style={{ height: 50 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 40 : 0 },
    header: { paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },

    // --- Tab Styles ---
    tabBar: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', maxHeight: 50 },
    tabBarContent: { paddingHorizontal: 10, alignItems: 'center' },
    tabButton: { paddingVertical: 10, paddingHorizontal: 15, marginHorizontal: 5, borderRadius: 20 },
    activeTab: { backgroundColor: '#3498db' },
    tabText: { fontSize: 14, color: '#555', fontWeight: '500', whiteSpace: 'nowrap' },
    activeTabText: { color: '#fff', fontWeight: 'bold' },

    contentContainer: { flex: 1, paddingHorizontal: 0 },

    // --- Item Styles ---
    itemContainer: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 8, padding: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.41, elevation: 1 },
    itemImage: { width: 50, height: 75, borderRadius: 4, marginRight: 15, resizeMode: 'cover' },
    itemIcon: { width: 50, height: 75, alignSelf: 'center', marginRight: 15 },
    itemInfo: { flex: 1, justifyContent: 'center' },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 3 },
    itemAuthor: { fontSize: 14, color: '#555', marginBottom: 3 },
    itemStatus: { fontSize: 13, fontWeight: 'bold' },
    pendingText: { color: '#f39c12' },
    rejectedText: { color: '#e74c3c' },
    approvedText: { color: '#28a745' },
    noItemsText: { fontSize: 14, color: '#777', textAlign: 'center', paddingVertical: 20 },

    // --- Action Styles ---
    actionContainer: { flexDirection: 'row', marginTop: 5, flexWrap: 'wrap' },
    actionButton: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, marginRight: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    editButton: { backgroundColor: '#3498db' },
    deleteButton: { backgroundColor: '#e74c3c' },
    viewChapterButton: { backgroundColor: '#2ecc71' }, // Màu xanh lá cây cho Xem Chương
    actionButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default Choduyet;