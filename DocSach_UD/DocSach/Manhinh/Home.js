import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, Image, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import ChatBox from './ChatBox';

const removeHTMLTags = (text) => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, '');
};

export default function Home() {
    const [recommendedBooks, setRecommendedBooks] = useState([]);
    const [readingBooks, setReadingBooks] = useState([]); // Sách "Đang đọc" theo lịch sử
    const [suggestedBooks, setSuggestedBooks] = useState([]);
    const [completedBooks, setCompletedBooks] = useState([]); // Sách "Hoàn thành" theo trạng thái
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [avatar, setAvatar] = useState(null);

    const navigation = useNavigation();
    const db = getDatabase(app);
    const auth = getAuth(app);
    const [frameUrl, setFrameUrl] = useState(null);
    const [finishedBooks, setFinishedBooks] = useState([]);

    useEffect(() => {
        const fetchFinishedBooks = () => {
            setIsLoading(true);
            const booksRef = ref(db, 'Books');

            onValue(booksRef, (snapshot) => {
                const data = snapshot.val() || {};
                const allBooks = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));

                // Lọc sách đã được duyệt và đã hoàn thành
                const tempFinishedBooks = allBooks.filter(book => book.IsApproved && book.Status === "Hoàn thành");

                setFinishedBooks(tempFinishedBooks);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching books:", error);
                setIsLoading(false);
            });
        };

        fetchFinishedBooks();
    }, [db]);

    useEffect(() => {
        if (userData?.AvatarFrame) {
            const frameRef = ref(db, `AvatarFrames/${userData.AvatarFrame}`);
            onValue(frameRef, (snapshot) => {
                const frameData = snapshot.val();
                if (frameData?.ImageUrl) {
                    setFrameUrl(frameData.ImageUrl);
                } else {
                    setFrameUrl(null);
                }
            });
        } else {
            setFrameUrl(null);
        }
    }, [userData]);

    const [unseenCount, setUnseenCount] = useState(0);

    useEffect(() => {
        if (!userId) return;
        const notiRef = ref(db, `Notifications/${userId}`);
        const adsRef = ref(db, 'ads');

        // Lấy số notification chưa đọc
        const unsubNoti = onValue(notiRef, (snapshot) => {
            const data = snapshot.val() || {};
            const unseenNoti = Object.values(data).filter(n => !n.read).length;

            // Lấy số ads chưa xem
            onValue(adsRef, (adsSnapshot) => {
                const adsData = adsSnapshot.val() || {};
                const unseenAds = Object.values(adsData).filter(ad => !(ad.viewedBy || []).includes(userId)).length;

                setUnseenCount(unseenNoti + unseenAds);
            });
        });

        return () => unsubNoti();
    }, [userId]);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
                setUserData(null);
                setAvatar(null);
            }
        });
        return () => unsubscribeAuth();
    }, [auth]);

    useEffect(() => {
        if (userId) {
            const userRef = ref(db, `Users/${userId}`);
            const unsubscribeDB = onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setUserData(data);
                    setAvatar(data.Avatar || null);
                } else {
                    setUserData(null);
                    setAvatar(null);
                }
            });
            return () => unsubscribeDB();
        }
    }, [db, userId]);

    useEffect(() => {
        const fetchBooksAndHistory = async () => {
            setIsLoading(true);

            const booksRef = ref(db, 'Books');
            const ratingsRef = ref(db, 'Ratings');
            const readingHistoryRef = ref(db, `ReadingHistory`);

            let allBooks = [];

            const unsubscribeBooks = onValue(booksRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    allBooks = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                        averageRating: 0,
                    }));
                } else {
                    allBooks = [];
                }

                const approvedBooks = allBooks.filter(book => book.IsApproved === true);

                onValue(ratingsRef, (ratingsSnapshot) => {
                    const ratingsData = ratingsSnapshot.val();
                    const bookRatings = {};

                    if (ratingsData) {
                        for (const key in ratingsData) {
                            const rating = ratingsData[key];
                            if (bookRatings[rating.BookId]) {
                                bookRatings[rating.BookId].totalRating += rating.Rating;
                                bookRatings[rating.BookId].count++;
                            } else {
                                bookRatings[rating.BookId] = { totalRating: rating.Rating, count: 1 };
                            }
                        }
                    }

                    let booksWithRatings = approvedBooks.map(book => {
                        if (bookRatings[book.id]) {
                            book.averageRating = bookRatings[book.id].totalRating / bookRatings[book.id].count;
                        }
                        return book;
                    });

                    const sortedRecommended = [...booksWithRatings].sort((a, b) => b.averageRating - a.averageRating);
                    setRecommendedBooks(sortedRecommended.slice(0, 6));
                    setSuggestedBooks(booksWithRatings.slice(0, 10));

                    // --- Lấy sách đang đọc từ lịch sử đọc (chỉ lưu 1 lần theo thời gian đọc gần nhất) ---
                    if (userId) {
                        onValue(readingHistoryRef, (historySnapshot) => {
                            const historyData = historySnapshot.val();
                            const tempReadingBooks = {};
                            const userCompletedBooks = [];

                            if (historyData) {
                                for (const key in historyData) {
                                    const historyEntry = historyData[key];
                                    if (historyEntry.UserId === userId) {
                                        const book = booksWithRatings.find(b => b.id === historyEntry.BookId);
                                        if (book) {
                                            if (!historyEntry.IsCompleted) {
                                                const existingBook = tempReadingBooks[book.id];
                                                if (!existingBook || new Date(historyEntry.LastReadAt) > new Date(existingBook.LastReadAt)) {
                                                    tempReadingBooks[book.id] = {
                                                        ...book,
                                                        LastReadChapterId: historyEntry.LastReadChapterId,
                                                        LastReadAt: historyEntry.LastReadAt,
                                                    };
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // Convert the object back to an array and sort
                            const finalReadingBooks = Object.values(tempReadingBooks).sort((a, b) => new Date(b.LastReadAt) - new Date(a.LastReadAt));
                            setReadingBooks(finalReadingBooks.slice(0, 5)); // Hiển thị 5 sách đang đọc gần nhất

                            // --- Lọc sách đã hoàn thành dựa trên trạng thái của sách (Status: "Đang cập nhật") ---
                            const booksMarkedAsCompleted = booksWithRatings.filter(book => book.Status === "Đang cập nhật");
                            setCompletedBooks(booksMarkedAsCompleted.slice(0, 15));

                            setIsLoading(false);
                        }, (error) => {
                            console.error("Error fetching reading history:", error);
                            setIsLoading(false);
                        });
                    } else {
                        setReadingBooks([]);
                        setCompletedBooks(booksWithRatings.filter(book => book.Status === "Đang cập nhật").slice(0, 15));
                        setIsLoading(false);
                    }
                }, { onlyOnce: true });
            }, (error) => {
                console.error("Error fetching books:", error);
                setIsLoading(false);
            });

            return () => {
                unsubscribeBooks();
            };
        };

        if (userId !== undefined) {
            fetchBooksAndHistory();
        }
    }, [userId, db]);

    const filteredBooks = [...recommendedBooks, ...readingBooks, ...suggestedBooks, ...completedBooks].filter(book =>
        book.Title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF69B4" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.topHeader}>
                <View style={styles.topHeaderLeft}>
                    <Text style={styles.logo} onPress={() => navigation.navigate('Tracuu')}>AI</Text>
                    <TouchableOpacity style={styles.premiumButton}>
                        <Ionicons name="flash-outline" size={18} color="#6200EE" />
                        {/* <Text style={styles.premiumText}>Thử dùng gói</Text>
                        <Text style={styles.premiumBold}>Cao cấp</Text> */}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.coinButton}
                        onPress={() => navigation.navigate('NapXu')}
                    >
                        <Ionicons name="wallet-outline" size={20} color="#4CAF50" />
                        <Text style={styles.coinText}>{userData?.xu || 0} xu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.coinButton}
                        onPress={() => navigation.navigate('Xephang')}
                    >
                        <Ionicons name="podium-outline" size={20} color="#FFD700" />
                    </TouchableOpacity>

                </View>
                <View style={styles.topHeaderRight}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('ChatBox', {
                        userId: userId,
                        userAvatar: avatar,
                        userFrameUrl: frameUrl,
                    })}>
                        <Ionicons name="chatbubble-outline" size={24} color="#FFC107" />
                    </TouchableOpacity>



                    <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Thongtin')}>
                        <View style={styles.avatarContainer}>
                            {/* Avatar */}
                            <Image
                                source={{ uri: userData?.Avatar }}
                                style={styles.profileAvatar}
                                resizeMode="cover"
                            />

                            {/* Khung overlay */}
                            {frameUrl && (
                                <Image
                                    source={{ uri: frameUrl }}
                                    style={styles.frameOverlay}
                                    resizeMode="cover"
                                />
                            )}
                        </View>
                    </TouchableOpacity>


                </View>
            </View>

            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sách hay nhất để xuất cho bạn</Text>
                    {recommendedBooks.length > 0 ? (
                        <FlatList
                            data={recommendedBooks}
                            renderItem={({ item }) => (
                                // <TouchableOpacity onPress={() => navigation.navigate('Chitiet', { bookId: item.id })} style={styles.horizontalBookItem}>
                                //     <Image source={{ uri: item.CoverImage }} style={styles.horizontalCoverImage} />
                                //     <Text style={styles.horizontalBookAuthor} numberOfLines={1}>{item.Title}</Text>
                                // </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Chitiet', { bookId: item.id })}
                                    style={styles.horizontalBookItem}
                                >
                                    <View style={styles.bookImageContainer}>
                                        <Image source={{ uri: item.CoverImage }} style={styles.horizontalCoverImage} />
                                        {item.IsVIP && (
                                            <View style={styles.vipBadge}>
                                                <Ionicons name="star-outline" size={16} color="#FFD700" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.horizontalBookAuthor} numberOfLines={1}>{item.Title}</Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noBooksText}>Không có sách đề xuất.</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sách bạn đang đọc</Text>
                    {readingBooks.length > 0 ? (
                        <FlatList
                            data={readingBooks}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        let chapterIdToNavigate = item.LastReadChapterId;
                                        navigation.navigate('DocSach', {
                                            bookId: item.id,
                                            chapterId: chapterIdToNavigate,
                                            bookTitle: item.Title
                                        });
                                    }}
                                    style={styles.readingBookItem}>
                                    <Image source={{ uri: item.CoverImage }} style={styles.readingCoverImage} />
                                    <View style={styles.readingInfo}>
                                        <Text style={styles.readingTitle} numberOfLines={1}>{item.Title}</Text>
                                        <Text style={styles.readingStatus}>Đang đọc</Text>
                                        <Text style={styles.readingChapter}>
                                            {item.LastReadChapterId ? `Đọc tiếp` : 'Chưa đọc chương nào'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noReadingBooksText}>Bạn chưa đọc cuốn sách nào. Hãy tìm kiếm và bắt đầu đọc!</Text>
                    )}
                    <View style={styles.exploreContainer}>
                        <View>
                            <Text style={styles.exploreTitle}>Khám phá thêm sách...</Text>
                            <Text style={styles.exploreSubtitle}>để bổ sung vào thư viện...</Text>
                        </View>
                        <TouchableOpacity style={styles.searchBarContainer} onPress={() => navigation.navigate('TimKiem')}>
                            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
                            <Text style={styles.searchText}>Tìm sách</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sách đã hoàn thành</Text>
                    {finishedBooks.length > 0 ? (
                        <FlatList
                            data={finishedBooks}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Chitiet', { bookId: item.id })}
                                    style={styles.horizontalBookItem}
                                >
                                    <View style={styles.bookImageContainer}>
                                        <Image source={{ uri: item.CoverImage }} style={styles.horizontalCoverImage} />
                                        {item.IsVIP && (
                                            <View style={styles.vipBadge}>
                                                <Ionicons name="star-outline" size={16} color="#FFD700" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.horizontalBookAuthor} numberOfLines={1}>{item.Title}</Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noBooksText}>Chưa có sách hoàn thành.</Text>
                    )}
                </View>



                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sách đang cập nhật</Text>
                    {completedBooks.length > 0 ? (
                        <FlatList
                            data={completedBooks}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Chitiet', { bookId: item.id })}
                                    style={styles.completedBookItem}
                                >
                                    <View style={styles.completedImageContainer}>
                                        <Image source={{ uri: item.CoverImage }} style={styles.completedCoverImage} />
                                        {item.IsVIP && (
                                            <View style={styles.vipBadgeCompleted}>
                                                <Ionicons name="star-outline" size={16} color="#FFD700" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.completedBookTitle} numberOfLines={2}>{item.Title}</Text>
                                    <Text style={styles.completedBookAuthor} numberOfLines={1}>{item.Author}</Text>
                                </TouchableOpacity>

                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noCompletedBooksText}>Chưa cuốn sách nào hoàn thành.</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thử đọc sách Mới</Text>
                    {suggestedBooks.length > 0 ? (
                        <FlatList
                            data={suggestedBooks.slice(0, 8)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Chitiet', { bookId: item.id })}
                                    style={styles.squareBookItem}
                                >
                                    <View style={styles.squareImageContainer}>
                                        <Image source={{ uri: item.CoverImage }} style={styles.squareCoverImage} />
                                        {item.IsVIP && (
                                            <View style={styles.vipBadgeSquare}>
                                                <Ionicons name="star-outline" size={16} color="#FFD700" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.squareBookTitle} numberOfLines={2}>{item.Title}</Text>
                                    <Text style={styles.squareBookAuthor} numberOfLines={1}>{item.Author}</Text>
                                </TouchableOpacity>

                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noBooksText}>Không có sách mới để thử đọc.</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Được chọn cho bạn</Text>
                    {recommendedBooks.length > 0 ? (
                        <FlatList
                            data={recommendedBooks.slice(0, 8)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Chitiet', { bookId: item.id })}
                                    style={styles.squareBookItem}
                                >
                                    <View style={styles.squareImageContainer}>
                                        <Image source={{ uri: item.CoverImage }} style={styles.squareCoverImage} />
                                        {item.IsVIP && (
                                            <View style={styles.vipBadgeSquare}>
                                                <Ionicons name="star-outline" size={16} color="#FFD700" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.squareBookTitle} numberOfLines={2}>{item.Title}</Text>
                                    <Text style={styles.squareBookAuthor} numberOfLines={1}>{item.Author}</Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noBooksText}>Không có sách được chọn cho bạn.</Text>
                    )}
                </View>

                <View style={styles.bottomBanner}>
                    <Text style={styles.bottomBannerText}>Nạp xu để trải nghiệm sách VIP</Text>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNavigation}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home-outline" size={24} color="#FF69B4" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('TimKiem')} style={styles.navItem} >
                    <Ionicons name="search-outline" size={24} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ThuVien')} style={styles.navItem} >
                    <Ionicons name="library-outline" size={24} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Write')} style={styles.navItem}>
                    <Ionicons name="pencil-outline" size={24} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Thongbao')} style={styles.navItem}>
                    <Ionicons name="notifications-outline" size={24} color="#888" />
                    {unseenCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>{unseenCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>




            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 20,
        marginBottom: 15,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },
    topHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF69B4',
        marginRight: 10,
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
        marginRight: 0,
    },
    premiumText: {
        fontSize: 14,
        color: '#6200EE',
        marginLeft: 5,
    },
    premiumBold: {
        fontSize: 14,
        color: '#6200EE',
        fontWeight: 'bold',
    },
    iconButton: {
        marginLeft: 10,
    },
    profileButton: {
        marginLeft: 10,
    },
    profileAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        resizeMode: 'cover',
    },
    section: {
        marginBottom: 20,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    horizontalBookItem: {
        marginRight: 10,
        alignItems: 'center',
        width: 80,
    },
    horizontalCoverImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 5,
        resizeMode: 'cover',
    },
    horizontalBookAuthor: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
    },
    readingBookItem: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginRight: 10,
        padding: 10,
        alignItems: 'center',
        width: 250,
    },
    readingCoverImage: {
        width: 60,
        height: 90,
        borderRadius: 6,
        marginRight: 10,
        resizeMode: 'cover',
    },
    readingInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    readingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
    },
    readingStatus: {
        fontSize: 14,
        color: '#555',
        marginBottom: 3,
    },
    readingChapter: {
        fontSize: 13,
        color: '#777',
    },
    noReadingBooksText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 10,
        marginBottom: 20,
        fontSize: 14,
    },
    noCompletedBooksText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 10,
        marginBottom: 20,
        fontSize: 14,
    },
    noBooksText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 10,
        marginBottom: 20,
        fontSize: 14,
    },
    exploreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    exploreTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
    },
    exploreSubtitle: {
        fontSize: 12,
        color: '#777',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchText: {
        fontSize: 14,
        color: '#888',
    },
    bottomBanner: {
        backgroundColor: '#e0f7fa',
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    bottomBannerText: {
        fontSize: 16,
        color: '#00897b',
    },
    bottomNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
    },
    notificationBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#f44336',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    completedBookItem: {
        marginRight: 15,
        width: 100,
    },
    completedCoverImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 5,
        resizeMode: 'cover',
    },
    completedBookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
        textAlign: 'center',
    },
    completedBookAuthor: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
    },
    squareBookItem: {
        marginRight: 15,
        width: 100,
    },
    squareCoverImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        marginBottom: 5,
        resizeMode: 'cover',
    },
    squareBookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 3,
        textAlign: 'center',
    },
    squareBookAuthor: {
        fontSize: 12,
        color: '#777',
        textAlign: 'center',
    },
    coinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    coinText: {
        marginLeft: 5,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    bookImageContainer: {
        width: '100%',
        position: 'relative', // quan trọng để vipBadge có thể nằm trên
    },
    vipBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255, 215, 0, 0.9)', // vàng nhẹ
        borderRadius: 10,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedImageContainer: {
        width: '100%',
        position: 'relative', // quan trọng để vipBadgeCompleted nằm trên ảnh
    },
    vipBadgeCompleted: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255, 215, 0, 0.9)',
        borderRadius: 10,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    squareImageContainer: {
        width: '100%',
        position: 'relative',
    },
    vipBadgeSquare: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255, 215, 0, 0.9)',
        borderRadius: 10,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,       // bo tròn khung tổng thể
        overflow: 'hidden',     // quan trọng để avatar + frame được bo tròn
        position: 'relative',
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    frameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },

    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: '#f44336',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

});