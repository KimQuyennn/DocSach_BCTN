import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, Text, View, Image, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { app } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { getAuth } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

const ThuVien = () => {
    const [publishedBooks, setPublishedBooks] = useState([]);
    const [readingHistoryBooks, setReadingHistoryBooks] = useState([]);
    const [favoriteBooks, setFavoriteBooks] = useState([]);
    const [offlineBooks, setOfflineBooks] = useState([]); // Tab ngoại tuyến
    const [loading, setLoading] = useState(true);
    const [currentUserUid, setCurrentUserUid] = useState(null);

    const navigation = useNavigation();
    const db = getDatabase(app);
    const auth = getAuth(app);
    const [readingListBooks, setReadingListBooks] = useState([]);

    useEffect(() => {
        if (!currentUserUid) return;

        const readingListRef = ref(db, 'ReadingLists');
        const booksRef = ref(db, 'Books');

        const unsubscribe = onValue(readingListRef, (snapshot) => {
            const data = snapshot.val();
            const userReadingList = [];

            if (data) {
                Object.values(data).forEach(entry => {
                    if (entry.UserId === currentUserUid) {
                        // Lấy thông tin sách trực tiếp từ Books
                        onValue(ref(db, `Books/${entry.BookId}`), (bookSnap) => {
                            const book = bookSnap.val();
                            if (book) {
                                userReadingList.push({
                                    id: entry.BookId,
                                    ...book,
                                    AddedAt: entry.AddedAt
                                });

                                // Sắp xếp theo ngày thêm
                                userReadingList.sort((a, b) => new Date(b.AddedAt) - new Date(a.AddedAt));
                                setReadingListBooks([...userReadingList]);
                            }
                        });
                    }
                });
            } else {
                setReadingListBooks([]);
            }
        });

        return () => unsubscribe();
    }, [currentUserUid, db]);
    // Hàm xóa khỏi Lịch sử đọc (Firebase)
    const handleRemoveFromHistory = async (historyId) => {
        try {
            const historyRef = ref(db, `ReadingHistory/${historyId}`);
            await remove(historyRef); // Sử dụng remove từ firebase/database
            // Cập nhật lại UI sau khi xóa thành công (sẽ tự động xảy ra nhờ onValue listener)
            Alert.alert("Thành công", "Đã xóa sách khỏi Lịch sử đọc.");
        } catch (error) {
            console.error("Lỗi khi xóa khỏi Lịch sử đọc:", error);
            Alert.alert("Lỗi", "Không thể xóa. Vui lòng thử lại.");
        }
    };

    // Hàm xóa sách Ngoại tuyến (AsyncStorage)
    const handleRemoveOfflineBook = async (bookId) => {
        try {
            const storedBooks = await AsyncStorage.getItem('OfflineBooks');
            const offlineBooks = storedBooks ? JSON.parse(storedBooks) : [];

            const updatedBooks = offlineBooks.filter(book => book.id !== bookId);

            await AsyncStorage.setItem('OfflineBooks', JSON.stringify(updatedBooks));
            setOfflineBooks(updatedBooks); // Cập nhật state để refresh UI
            Alert.alert("Thành công", "Đã xóa sách khỏi mục Ngoại tuyến.");
        } catch (error) {
            console.error("Lỗi khi xóa sách ngoại tuyến:", error);
            Alert.alert("Lỗi", "Không thể xóa sách ngoại tuyến. Vui lòng thử lại.");
        }
    };
    const OfflineBookItem = ({ item, onRemove }) => { // Thêm onRemove
        const navigation = useNavigation();
        return (
            <TouchableOpacity
                style={styles.bookItem}
                onPress={() => navigation.navigate('ChitietOff', { bookId: item.id })}
            >
                <Image
                    source={{ uri: item.CoverImage || 'https://via.placeholder.com/100' }}
                    style={styles.coverImage}
                />
                <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{item.Title}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.Author}</Text>
                </View>
                {/* Nút Xóa */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                        e.stopPropagation(); // Ngăn sự kiện chạm lan ra TouchableOpacity cha
                        onRemove(item.id);
                    }}
                >
                    <Ionicons name="close-circle" size={24} color="#FF69B4" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        const fetchOfflineBooks = async () => {
            try {
                const storedBooks = await AsyncStorage.getItem('OfflineBooks');
                //console.log("Stored books:", storedBooks); // kiểm tra dữ liệu
                if (storedBooks) setOfflineBooks(JSON.parse(storedBooks));
                else setOfflineBooks([]);
            } catch (error) {
                console.error("Lỗi khi tải sách ngoại tuyến:", error);
            }
        };
        fetchOfflineBooks();
    }, []);
    // Lắng nghe user login/logout
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUserUid(user.uid);
            } else {
                setCurrentUserUid(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [auth]);

    // Lấy dữ liệu sách
    useEffect(() => {
        if (!currentUserUid) {
            setPublishedBooks([]);
            setReadingHistoryBooks([]);
            setFavoriteBooks([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const booksRef = ref(db, 'Books');
        const readingHistoryRef = ref(db, 'ReadingHistory');
        const favoritesRef = ref(db, 'Favorites');

        let allBooksData = [];

        const unsubscribeBooks = onValue(booksRef, (snapshot) => {
            const data = snapshot.val();
            allBooksData = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];

            // Lịch sử đọc
            const unsubscribeHistory = onValue(readingHistoryRef, (historySnapshot) => {
                const historyData = historySnapshot.val();
                const userReadingHistory = [];

                if (historyData) {
                    for (const key in historyData) {
                        const historyEntry = historyData[key];
                        if (historyEntry.UserId === currentUserUid) {
                            const book = allBooksData.find(b => b.id === historyEntry.BookId);
                            if (book) {
                                userReadingHistory.push({
                                    ...book,
                                    historyId: key,
                                    LastReadAt: historyEntry.LastReadAt,
                                    LastReadChapterId: historyEntry.LastReadChapterId,
                                    IsCompleted: historyEntry.IsCompleted
                                });
                            }
                        }
                    }
                }
                userReadingHistory.sort((a, b) => new Date(b.LastReadAt) - new Date(a.LastReadAt));
                setReadingHistoryBooks(userReadingHistory);

                // Sách đã đăng tải
                const userPublished = allBooksData.filter(book => book.UploaderId === currentUserUid && book.IsApproved);
                setPublishedBooks(userPublished);

                // Sách yêu thích
                const unsubscribeFavorites = onValue(favoritesRef, (favoriteSnapshot) => {
                    const favoriteData = favoriteSnapshot.val();
                    const userFavoriteBooks = [];

                    if (favoriteData) {
                        for (const key in favoriteData) {
                            const favoriteEntry = favoriteData[key];
                            if (favoriteEntry.UserId === currentUserUid) {
                                const book = allBooksData.find(b => b.id === favoriteEntry.BookId);
                                if (book) {
                                    userFavoriteBooks.push({
                                        ...book,
                                        favoriteId: key,
                                        AddedAt: favoriteEntry.AddedAt,
                                    });
                                }
                            }
                        }
                    }

                    userFavoriteBooks.sort((a, b) => new Date(b.AddedAt) - new Date(a.AddedAt));
                    setFavoriteBooks(userFavoriteBooks);
                    setLoading(false);
                });

                return () => unsubscribeFavorites();
            });

            return () => unsubscribeHistory();
        });

        return () => unsubscribeBooks();
    }, [currentUserUid, db]);

    // Lấy sách ngoại tuyến từ AsyncStorage
    useEffect(() => {
        const fetchOfflineBooks = async () => {
            try {
                const storedBooks = await AsyncStorage.getItem('OfflineBooks');
                if (storedBooks) setOfflineBooks(JSON.parse(storedBooks));
                else setOfflineBooks([]);
            } catch (error) {
                console.error("Lỗi khi tải sách ngoại tuyến:", error);
            }
        };
        fetchOfflineBooks();
    }, []);

    const renderBookItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.bookItem}
            onPress={() => navigation.navigate('Chitiet', { bookId: item.id })}
        >
            <Image
                source={{ uri: item.CoverImage || 'https://via.placeholder.com/100' }}
                style={styles.coverImage}
            />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.Title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{item.Author}</Text>
            </View>
        </TouchableOpacity>
    ), [navigation]);

    // Các màn hình tab
    const PublishedScreen = () => (
        loading ? <Loading message="Đang tải sách đã đăng tải..." /> :
            publishedBooks.length === 0 ? <Empty message="Bạn chưa đăng tải sách nào." icon="book-outline" buttonText="Đăng Sách Mới" onPress={() => navigation.navigate('Write')} /> :
                <BookGrid data={publishedBooks} />
    );

    const ReadingHistoryScreen = () => (
        loading ? <Loading message="Đang tải lịch sử đọc..." /> :
            readingHistoryBooks.length === 0 ? <Empty message="Bạn chưa có sách nào trong lịch sử đọc." icon="time-outline" buttonText="Khám phá Sách" onPress={() => navigation.navigate('Home')} /> :
                <BookGrid
                    data={readingHistoryBooks}
                    onRemove={handleRemoveFromHistory} // Truyền hàm xóa
                    type="history" // Thêm type để BookGrid biết khi nào cần truyền onRemove vào BookItem
                />
    );

    const FavoritesScreen = () => (
        loading ? <Loading message="Đang tải danh sách yêu thích..." /> :
            favoriteBooks.length === 0 ? <Empty message="Bạn chưa có sách nào trong danh sách yêu thích." icon="heart-outline" buttonText="Khám phá Sách" onPress={() => navigation.navigate('Home')} /> :
                <BookGrid data={favoriteBooks} />
    );

    const OfflineScreen = () => (
        offlineBooks.length === 0
            ? <Empty message="Bạn chưa có sách ngoại tuyến nào." icon="cloud-offline-outline" />
            : <FlatList
                data={offlineBooks}
                renderItem={({ item }) => <OfflineBookItem item={item} onRemove={handleRemoveOfflineBook} />} // Truyền hàm xóa
                keyExtractor={(item) => item.id}
                numColumns={2}
                style={styles.bookList}
                contentContainerStyle={styles.bookListContent}
            />
    );


    return (
        <SafeAreaView style={styles.container}>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#FF69B4',
                    tabBarInactiveTintColor: '#888',
                    tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
                    tabBarStyle: { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
                    tabBarIndicatorStyle: { backgroundColor: '#FF69B4', height: 3, borderRadius: 1.5 },
                }}
            >
                <Tab.Screen name="Đã đăng tải" component={PublishedScreen} />
                <Tab.Screen name="Lịch sử đọc" component={ReadingHistoryScreen} />
                <Tab.Screen name="Yêu thích" component={FavoritesScreen} />
                <Tab.Screen name="Ngoại tuyến" component={OfflineScreen} />
                <Tab.Screen name="Danh sách đọc">
                    {() => (
                        readingListBooks.length === 0
                            ? <Empty message="Bạn chưa thêm sách nào vào danh sách đọc." icon="book-outline" />
                            : <BookGrid data={readingListBooks} />
                    )}
                </Tab.Screen>


            </Tab.Navigator>
        </SafeAreaView>
    );
};

// Component tái sử dụng
const Loading = ({ message }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>{message}</Text>
    </View>
);

const Empty = ({ message, icon, buttonText, onPress }) => (
    <View style={styles.emptyContainer}>
        <Ionicons name={icon} size={60} color="#ccc" style={styles.emptyIcon} />
        <Text style={styles.emptyText}>{message}</Text>
        {buttonText && onPress && (
            <TouchableOpacity style={styles.publishButton} onPress={onPress}>
                <Text style={styles.publishButtonText}>{buttonText}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const BookGrid = ({ data, onRemove, type }) => ( // Thêm onRemove và type
    <FlatList
        data={data}
        renderItem={({ item }) => (
            <BookItem
                item={item}
                // Chỉ truyền onRemove nếu type là 'history'
                onRemove={type === 'history' ? onRemove : undefined}
            />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.bookList}
        contentContainerStyle={styles.bookListContent}
    />
);

const BookItem = ({ item, onRemove }) => {
    const navigation = useNavigation();
    const isHistoryItem = item.historyId !== undefined; // Kiểm tra nếu đây là item từ lịch sử đọc

    const handlePress = () => {
        // Nếu là sách ngoại tuyến (đã được xử lý ở OfflineBookItem), sẽ có màn ChitietOff.
        // Đối với sách online, chuyển đến màn Chitiet.
        navigation.navigate('Chitiet', { bookId: item.id });
    };

    return (
        <TouchableOpacity
            style={styles.bookItem}
            onPress={handlePress}
        >
            <Image source={{ uri: item.CoverImage || 'https://via.placeholder.com/100' }} style={styles.coverImage} />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{item.Title}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{item.Author}</Text>
            </View>
            {isHistoryItem && onRemove && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        onRemove(item.historyId); // Truyền historyId để xóa khỏi Firebase
                    }}
                >
                    <Ionicons name="close-circle" size={24} color="#FF69B4" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    bookList: { flex: 1 },
    bookListContent: { paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'flex-start' },
    bookItem: {
        width: (width / 2) - 30,
        marginHorizontal: 7.5,
        marginVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 5,
        alignItems: 'flex-start',
        paddingBottom: 10,
    },
    coverImage: { width: '100%', height: 180, borderTopLeftRadius: 12, borderTopRightRadius: 12, marginBottom: 8, resizeMode: 'cover' },
    bookInfo: { paddingHorizontal: 10, width: '100%' },
    bookTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left', marginBottom: 3 },
    bookAuthor: { fontSize: 13, color: '#777', textAlign: 'left' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#555' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f8f8' },
    emptyIcon: { marginBottom: 20 },
    emptyText: { fontSize: 16, color: '#777', marginBottom: 25, textAlign: 'center', lineHeight: 24 },
    publishButton: {
        backgroundColor: '#FF69B4',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 10,
        shadowColor: '#FF69B4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    publishButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    deleteButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 3,
        zIndex: 10,
    },
});

export default ThuVien;
