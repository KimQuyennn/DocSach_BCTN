import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Platform, ActivityIndicator, TextInput, KeyboardAvoidingView } from 'react-native';
import { getDatabase, ref, onValue, get, push, remove, set, update } from 'firebase/database';
import { app } from '../firebase';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { Rating } from 'react-native-ratings';
import AsyncStorage from "@react-native-async-storage/async-storage";
import AvatarWithFrame from './AvatarWithFrame';

const Chitiet = ({ route }) => {
    const { bookId } = route.params;
    console.log("Chitiet loaded. Initial bookId:", bookId);


    const [bookData, setBookData] = useState(null);
    const [genreName, setGenreName] = useState('');
    const [chapterCount, setChapterCount] = useState(0);
    const [totalViews, setTotalViews] = useState(0);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteKey, setFavoriteKey] = useState(null);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [readingHistory, setReadingHistory] = useState(null);
    // New states for Ratings
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [userExistingRatingKey, setUserExistingRatingKey] = useState(null);
    const [allRatings, setAllRatings] = useState([]);

    const [userDisplayInfoMap, setUserDisplayInfoMap] = useState({});

    const navigation = useNavigation();
    const db = getDatabase(app);
    const auth = getAuth(app);
    const isHandlingFavorite = React.useRef(false);
    const user = auth.currentUser;
    const [userRole, setUserRole] = useState("User");
    useEffect(() => {
        if (!userId) return;
        const userRef = ref(db, `Users/${userId}`);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setUserRole(snapshot.val().Role || "User");
            }
        }, { onlyOnce: true });
    }, [userId]);

    // mua sách
    const [hasPurchased, setHasPurchased] = useState(false);
    // Thay thế đoạn useEffect hiện tại bằng đoạn này:

    // ... (các state khác)
    // Giữ lại phần này (sau khi đã xóa dòng const db = getDatabase(app); bị trùng lặp)

    const [allAvatarFrames, setAllAvatarFrames] = useState([]);
    const [uploader, setUploader] = useState(null);
    const [frameUrl, setFrameUrl] = useState(null);
    // Thêm hàm này vào đâu đó trong component Chitiet (ví dụ: sau handleSubmitRating)
    const handleDeleteRating = async (ratingKey, userIdOfRating) => {
        if (!userId) {
            Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này.');
            return;
        }

        if (userId !== userIdOfRating) {
            Alert.alert('Không có quyền', 'Bạn chỉ có thể xóa đánh giá của chính mình.');
            return;
        }

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc muốn xóa đánh giá này không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    onPress: async () => {
                        try {
                            // Sử dụng ratingKey để tham chiếu đến đánh giá cần xóa
                            await remove(ref(db, `Ratings/${ratingKey}`));

                            // Nếu người dùng vừa xóa đánh giá của chính mình, cập nhật lại trạng thái
                            if (ratingKey === userExistingRatingKey) {
                                setUserRating(0);
                                setUserComment('');
                                setUserExistingRatingKey(null);
                            }

                            Alert.alert('Thành công', 'Đánh giá đã được xóa.');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa đánh giá: ' + error.message);
                            console.error("Error deleting rating:", error);
                        }
                    }
                }
            ]
        );
    };
    const addToReadingList = async (userId, bookId) => {
        if (!userId || !bookId) return;

        const listRef = ref(db, "ReadingLists");

        try {
            // Lấy danh sách hiện tại để kiểm tra trùng
            const snapshot = await get(listRef);
            const data = snapshot.val() || {};
            const exists = Object.values(data).some(
                item => item.UserId === userId && item.BookId === bookId
            );

            if (exists) {
                Alert.alert("Thông báo", "Sách đã có trong danh sách đọc.");
                return;
            }

            const newEntry = {
                UserId: userId,
                BookId: bookId,
                AddedAt: new Date().toISOString(),
            };

            await push(listRef, newEntry);
            console.log("Đã thêm sách vào danh sách đọc:", newEntry);
            Alert.alert("Thành công", "Đã thêm sách vào danh sách đọc.");
        } catch (error) {
            console.error("Lỗi khi thêm sách vào danh sách đọc:", error);
            Alert.alert("Lỗi", "Không thể thêm sách. Thử lại sau.");
        }
    };
    useEffect(() => {
        if (!uploader || !uploader.AvatarFrame) return;

        const frameRef = ref(db, `AvatarFrames/${uploader.AvatarFrame}`);
        onValue(frameRef, (snapshot) => {
            if (snapshot.exists()) {
                setFrameUrl(snapshot.val().ImageUrl);
            }
        });
    }, [uploader]);

    useEffect(() => {
        if (bookData?.UploaderId) {
            const userRef = ref(db, `Users/${bookData.UploaderId}`);
            onValue(userRef, (snapshot) => {
                setUploader(snapshot.val());
            });
        }
    }, [bookData]);
    useEffect(() => {
        const fetchFrames = async () => {
            try {
                // SỬ DỤNG biến db đã được khai báo ở trên
                const snapshot = await get(ref(db, 'AvatarFrames'));
                const framesObject = snapshot.val();
                const frames = [];

                if (framesObject) {
                    for (const key in framesObject) {
                        frames.push({
                            Id: key,
                            ...framesObject[key]
                        });
                    }
                }
                console.log("Fetched AvatarFrames successfully with IDs:", frames.length);
                setAllAvatarFrames(frames);
            } catch (error) {
                console.error("Lỗi khi fetch AvatarFrames:", error);
            }
        };
        fetchFrames();
    }, [db]); // Giữ lại [db] nếu bạn muốn tuân thủ quy tắc ESLint

    useEffect(() => {
        const fetchBook = async () => {
            if (!bookId) return;

            // Kiểm tra offline trước
            try {
                const storedBooks = await AsyncStorage.getItem('OfflineBooks');
                const offlineBooks = storedBooks ? JSON.parse(storedBooks) : [];
                const offlineBook = offlineBooks.find(b => b.id === bookId);

                if (offlineBook) {
                    setBookData(offlineBook);
                    setChapters(offlineBook.Chapters || []);
                    console.log("Mở sách offline:", offlineBook);
                } else {
                    // Nếu không có offline thì fetch online như cũ
                    fetchBookOnline(bookId);
                }
            } catch (error) {
                //console.error("Lỗi khi đọc sách offline:", error);
            }
        };
        fetchBook();
    }, [bookId]);


    useEffect(() => {
        if (!userId || !bookData) return;

        if (bookData.IsVIP) {
            const purchasedRef = ref(db, `PurchasedBooks/${userId}/${bookId}`);
            onValue(purchasedRef, (snapshot) => {
                if (snapshot.exists()) {
                    setHasPurchased(true);
                } else {
                    setHasPurchased(false);
                }
            }, { onlyOnce: true });
        } else {
            setHasPurchased(true); // sách thường luôn đọc được
        }
    }, [userId, bookId, bookData]);

    const handleBuyBook = async () => {
        // 1. Kiểm tra đăng nhập
        if (!userId) {
            Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để mua sách.', [{ text: 'OK', onPress: () => navigation.navigate('Dangnhap') }]);
            return;
        }

        // Giá sách
        const price = Number(bookData.Price) || 0;
        if (price <= 0) {
            Alert.alert('Lỗi dữ liệu', 'Giá sách không hợp lệ.');
            return;
        }

        try {
            // 2. Lấy số dư Xu của người dùng
            const userRef = ref(db, `Users/${userId}/xu`);
            const snapshot = await get(userRef);
            const userXu = Number(snapshot.exists() ? snapshot.val() : 0);

            // 3. Kiểm tra số dư (SỬ DỤNG bookData.Price)
            if (userXu < price) {
                Alert.alert(
                    'Không đủ xu',
                    `Bạn cần ${price} xu để mua sách này. Bạn hiện có ${userXu} xu.`,
                    // Thêm nút hành động nếu cần nạp xu
                    [{ text: 'OK' }]
                );
                return; // Dừng tại đây nếu không đủ xu
            }

            // 4. Xác nhận mua
            Alert.alert(
                'Xác nhận mua sách VIP',
                `Bạn có chắc muốn mua sách "${bookData.Title}" với giá ${price} xu?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Mua', onPress: async () => {
                            // Bắt đầu giao dịch mua
                            try {
                                // Trừ xu
                                await set(userRef, userXu - price);

                                // Thêm sách vào PurchasedBooks
                                await set(ref(db, `PurchasedBooks/${userId}/${bookId}`), true);
                                setHasPurchased(true); // Cập nhật state để kích hoạt hiển thị nút "Đọc"

                                // Cập nhật tổng tiền sách nhận được
                                const bookRef = ref(db, `Books/${bookId}`);
                                const bookSnap = await get(bookRef);

                                let totalPaid = 0;
                                if (bookSnap.exists()) {
                                    totalPaid = Number(bookSnap.val().MoneyReceived) || 0;
                                }

                                totalPaid += price; // cộng dồn giá sách

                                await update(bookRef, {
                                    MoneyReceived: totalPaid,
                                    IsPaid: false // Giữ lại logic này nếu có liên quan đến việc thanh toán cho người upload
                                });

                                Alert.alert('Thành công', 'Bạn đã mua sách VIP này. Bây giờ có thể đọc!');
                            } catch (e) {
                                Alert.alert('Lỗi Giao Dịch', 'Mua sách thất bại trong quá trình trừ xu hoặc cập nhật.');
                                console.error(e);
                            }
                        }
                    }
                ]
            );

        } catch (error) {
            Alert.alert('Lỗi', 'Mua sách thất bại: ' + error.message);
        }
    };

    // --- Hàm định dạng mô tả HTML thành văn bảnbản ---
    const formatDescription = (html) => {
        if (!html) {
            return '';
        }
        let formatted = html.replace(/<p>/g, '');
        formatted = formatted.replace(/<\/p>/g, '\n\n');
        formatted = formatted.replace(/<[^>]*>/g, '');
        formatted = formatted.replace(/:/g, ':\n');
        formatted = formatted.replace(/,/g, ', ');
        return formatted.trim();
    };

    // --- Hàm để tạo hoặc tăng lượt xem trong Statistics ---
    const incrementStatisticsView = (bookId) => {
        const statisticsRef = ref(db, `Statistics/${bookId}`);

        onValue(statisticsRef, (snapshot) => {
            const currentStats = snapshot.val();
            let newViews = 1;
            let currentComments = 0;
            let currentSales = 0;

            if (currentStats) {
                newViews = (currentStats.TotalViews || 0) + 1;
                currentComments = currentStats.TotalComments || 0;
                currentSales = currentStats.TotalSales || 0;
            }

            set(statisticsRef, {
                BookId: bookId,
                TotalComments: currentComments,
                TotalSales: currentSales,
                TotalViews: newViews
            })
                .then(() => {
                    console.log(`Lượt xem cho sách ${bookId} đã được cập nhật thành công. Lượt xem mới: ${newViews}`);
                    setTotalViews(newViews);
                })
                .catch((error) => {
                    console.error("Lỗi khi cập nhật lượt xem trong Statistics:", error);
                });
        }, { onlyOnce: true });


    };
    // ls đọc
    useEffect(() => {
        if (!user || !bookId) return;

        const key = `${user.uid}_${bookId}`;
        const historyRef = ref(db, `ReadingHistory/${key}`);

        onValue(historyRef, (snapshot) => {
            if (snapshot.exists()) {
                setReadingHistory(snapshot.val());
            } else {
                setReadingHistory(null);
            }
        }, { onlyOnce: true });
    }, [user, bookId]);

    const handleStartReading = () => {
        if (chapters.length === 0) return;

        let targetChapter;

        if (readingHistory?.LastReadChapterId) {
            // 👉 Nếu có lịch sử thì mở chương đang lưu
            targetChapter = chapters.find(c => c.id === readingHistory.LastReadChapterId);
        }

        if (!targetChapter) {
            // 👉 Nếu chưa có lịch sử thì mở chương đầu tiên
            targetChapter = chapters[0];
        }

        navigation.navigate("DocSach", {    // 👉 thay router.push
            bookId,
            chapterId: targetChapter.id,
        });
    };

    //Lưu off
    const saveOffline = async () => {
        if (!bookData || !chapters || chapters.length === 0) {
            Alert.alert("Lỗi", "Không có dữ liệu sách hoặc chương để lưu offline.");
            return;
        }

        // --- BỔ SUNG: LỌC CHƯƠNG CHƯA DUYỆT ---
        const approvedChapters = chapters.filter(chap => chap.IsApproved);

        if (approvedChapters.length === 0) {
            Alert.alert("Thông báo", "Không có chương nào đã được phê duyệt để tải về offline.");
            return;
        }
        // ----------------------------------------

        try {
            // Lấy danh sách sách offline hiện tại
            const storedBooks = await AsyncStorage.getItem('OfflineBooks');
            const offlineBooks = storedBooks ? JSON.parse(storedBooks) : [];

            // Dữ liệu chỉ chứa các chương đã được duyệt
            const dataToSave = {
                id: bookId,
                Title: bookData.Title,
                Author: bookData.Author,
                CoverImage: bookData.CoverImage,
                GenreId: bookData.GenreId,
                GenreName: genreName,
                Status: bookData.Status,
                IsVIP: bookData.IsVIP,
                UploadName: bookData.UploadName,
                Chapters: approvedChapters.map(chap => ({ // <-- CHỈ SỬ DỤNG approvedChapters
                    id: chap.id,
                    ChapterNumber: chap.ChapterNumber,
                    Title: chap.Title,
                    Content: chap.Content,
                    IsApproved: chap.IsApproved
                }))
            };

            // Nếu sách chưa tồn tại trong danh sách thì thêm
            if (!offlineBooks.find(b => b.id === bookId)) {
                offlineBooks.push(dataToSave);
                await AsyncStorage.setItem('OfflineBooks', JSON.stringify(offlineBooks));
                Alert.alert("Thành công", `Đã tải ${approvedChapters.length} chương đã duyệt để đọc offline.`);
                console.log("Đã lưu sách offline thành công:", dataToSave);
            } else {
                Alert.alert("Thông báo", "Sách này đã có trong offline");
            }
        } catch (error) {
            console.error("Lỗi khi lưu sách offline:", error);
            Alert.alert("Lỗi", "Không thể lưu sách. Vui lòng thử lại.");
        }
    };




    // --- useEffect để lấy userId và userName (từ user profile trong DB) từ Firebase Auth ---
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => { // Added async here
            if (user) {
                setUserId(user.uid);
                console.log("UserID đã đăng nhập:", user.uid);

                // NEW: Fetch user's profile from your database
                const userProfileRef = ref(db, `Users/${user.uid}`);
                onValue(userProfileRef, (snapshot) => {
                    const profileData = snapshot.val();
                    if (profileData && profileData.Username) {
                        setUserName(profileData.Username);
                    } else {
                        setUserName(user.displayName || 'Người dùng ẩn danh');
                    }
                }, { onlyOnce: true });

            } else {
                setUserId(null);
                setUserName(null);
                console.log("Người dùng chưa đăng nhập.");
            }
        });
        return () => unsubscribeAuth();
    }, [auth, db]);

    useEffect(() => {
        if (allRatings.length > 0) {
            const uidsToFetch = new Set();
            allRatings.forEach(rating => {
                if (rating.UserId) {
                    uidsToFetch.add(rating.UserId);
                }
            });

            if (uidsToFetch.size > 0) {
                const newUserDisplayInfoMap = { ...userDisplayInfoMap };

                uidsToFetch.forEach(uid => {
                    if (!newUserDisplayInfoMap[uid]) {
                        const userProfileRef = ref(db, `Users/${uid}`);
                        onValue(userProfileRef, (snapshot) => {
                            const profileData = snapshot.val();
                            if (profileData) {
                                newUserDisplayInfoMap[uid] = {
                                    Username: profileData.Username || 'Người dùng',
                                    showDisplayName: profileData.showDisplayName === true,
                                    Avatar: profileData.Avatar || null,
                                    AvatarFrame: profileData.AvatarFrame || null,
                                };
                            } else {
                                newUserDisplayInfoMap[uid] = {
                                    Username: 'Người dùng',
                                    showDisplayName: false
                                };
                            }
                            setUserDisplayInfoMap({ ...newUserDisplayInfoMap });
                        }, { onlyOnce: true });
                    }
                });
            }
        }
    }, [allRatings, db]);

    const getDisplayUserName = (uid) => {
        const userInfo = userDisplayInfoMap[uid];
        if (userInfo) {
            if (userInfo.showDisplayName === true) {
                return userInfo.Username || 'Người dùng';
            }
            return 'Ẩn danh';
        }
        return 'Ẩn danh';
    };


    useEffect(() => {
        console.log("useEffect triggered for bookId:", bookId);

        if (!bookId) {
            console.error('bookId is undefined or null, stopping data fetch.');
            setIsLoading(false);
            return;
        }

        const bookRef = ref(db, `Books/${bookId}`);
        const chaptersDbRef = ref(db, `Chapters`);
        const statisticsRef = ref(db, `Statistics/${bookId}`);
        const favoritesRef = ref(db, 'Favorites');
        const ratingsRef = ref(db, 'Ratings');

        // 1. Lắng nghe thông tin sách
        const unsubscribeBook = onValue(bookRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log("Book data received:", data.Title);
                setBookData({ ...data, rawDescription: data.Description || '' });

                if (data.GenreId) {
                    onValue(ref(db, `Genres/${data.GenreId}`), (genreSnapshot) => {
                        const genreData = genreSnapshot.val();
                        if (genreData) {
                            setGenreName(genreData.Name);
                        } else {
                            setGenreName('');
                        }
                    }, { onlyOnce: true });
                } else {
                    setGenreName('');
                }
            } else {
                console.log("No book data found for bookId:", bookId);
                setBookData(null);
            }
            setIsLoading(false);
        });

        // 2. Lắng nghe tất cả các chương của sách
        // const unsubscribeChapters = onValue(chaptersDbRef, (chapterSnapshot) => {
        //     const chaptersData = chapterSnapshot.val();
        //     let count = 0;
        //     const bookChapters = [];
        //     if (chaptersData) {
        //         for (const chapterId in chaptersData) {
        //             if (chaptersData[chapterId].BookId === bookId) {
        //                 count++;
        //                 bookChapters.push({ id: chapterId, ...chaptersData[chapterId] });
        //             }
        //         }
        //     }
        //     bookChapters.sort((a, b) => a.ChapterNumber - b.ChapterNumber);
        //     setChapterCount(count);
        //     setChapters(bookChapters);
        // });

        const unsubscribeChapters = onValue(chaptersDbRef, (chapterSnapshot) => {
            const chaptersData = chapterSnapshot.val();

            let approvedCount = 0; // số chương đã duyệt
            const bookChapters = [];

            if (chaptersData) {
                for (const chapterId in chaptersData) {
                    const chapter = chaptersData[chapterId];

                    if (chapter.BookId === bookId) {
                        // thêm vào danh sách
                        bookChapters.push({ id: chapterId, ...chapter });

                        // đếm chương duyệt rồi
                        if (chapter.IsApproved === true) {
                            approvedCount++;
                        }
                    }
                }
            }

            // sắp xếp theo số chương
            bookChapters.sort((a, b) => a.ChapterNumber - b.ChapterNumber);

            // cập nhật UI
            setChapterCount(approvedCount);
            setChapters(bookChapters);
        });

        // 3. Lắng nghe lượt xem từ Statistics và kích hoạt tăng lượt xem
        const unsubscribeStatistics = onValue(statisticsRef, (statisticsSnapshot) => {
            const data = statisticsSnapshot.val();
            if (data && data.TotalViews !== undefined) {
                setTotalViews(data.TotalViews);
            } else {
                setTotalViews(0);
            }
            incrementStatisticsView(bookId);
        }, { onlyOnce: true });

        // 4. Lắng nghe trạng thái yêu thích chỉ khi userId đã có
        let unsubscribeFavorites;
        if (userId) {
            unsubscribeFavorites = onValue(favoritesRef, (snapshot) => {
                let favCount = 0;
                let userIsFavorite = false;
                let favKey = null;
                const data = snapshot.val();
                if (data) {
                    for (let key in data) {
                        if (data[key].BookId === bookId) {
                            favCount++;
                            if (data[key].UserId === userId) {
                                userIsFavorite = true;
                                favKey = key;
                            }
                        }
                    }
                }
                setFavoriteCount(favCount);
                setIsFavorite(userIsFavorite);
                setFavoriteKey(favKey);
            });
        }

        // 5. Lắng nghe đánh giá từ Ratings
        const unsubscribeRatings = onValue(ratingsRef, (snapshot) => {
            const ratingsData = snapshot.val();
            let totalRatingSum = 0;
            let currentTotalRatings = 0;
            let currentUserRating = 0;
            let currentUserComment = '';
            let existingRatingKey = null;
            const bookSpecificRatings = [];

            if (ratingsData) {
                for (const key in ratingsData) {
                    const rating = ratingsData[key];
                    if (rating.BookId === bookId) {
                        bookSpecificRatings.push({ id: key, ...rating });
                        totalRatingSum += rating.Rating;
                        currentTotalRatings++;
                        if (userId && rating.UserId === userId) {
                            currentUserRating = rating.Rating;
                            currentUserComment = rating.Comment || '';
                            existingRatingKey = key;
                        }
                    }
                }
            }
            setAllRatings(bookSpecificRatings);
            setAverageRating(currentTotalRatings > 0 ? totalRatingSum / currentTotalRatings : 0);
            setTotalRatings(currentTotalRatings);
            setUserRating(currentUserRating);
            setUserComment(currentUserComment);
            setUserExistingRatingKey(existingRatingKey);
        });


        // Cleanup function
        return () => {
            console.log("Cleaning up Chitiet useEffect.");
            unsubscribeBook();
            unsubscribeChapters();
            unsubscribeStatistics();
            if (unsubscribeFavorites) {
                unsubscribeFavorites();
            }
            unsubscribeRatings();
        };
    }, [bookId, db, userId]);

    // --- Hàm xử lý khi nhấn nút "Bắt đầu đọc" ---
    <TouchableOpacity
        onPress={handleStartReading}
        className="bg-blue-500 p-3 rounded-2xl mb-4"
    >
        <Text className="text-white text-center font-semibold">
            {readingHistory?.LastReadChapterId
                ? `Đọc tiếp chương ${chapters.find(c => c.id === readingHistory.LastReadChapterId)?.ChapterNumber || "1"}`
                : "Bắt đầu đọc"}
        </Text>
    </TouchableOpacity>




    // --- Hàm xử lý khi nhấn nút "Thêm vào yêu thích" ---
    const handleAddToFavorite = () => {
        if (!userId) {
            Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để thêm sách vào yêu thích.', [{ text: 'OK', onPress: () => navigation.navigate('Dangnhap') }]);
            return;
        }

        if (isHandlingFavorite.current || !bookId) {
            return;
        }
        isHandlingFavorite.current = true;

        const favoritesRef = ref(db, 'Favorites');
        if (isFavorite) {
            if (favoriteKey) {
                remove(ref(db, `Favorites/${favoriteKey}`))
                    .then(() => {
                        Alert.alert('Thành công', 'Đã xóa khỏi danh sách yêu thích!');
                    })
                    .catch(error => {
                        Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa khỏi yêu thích: ' + error.message);
                    })
                    .finally(() => {
                        isHandlingFavorite.current = false;
                    });
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy key để xóa khỏi yêu thích.');
                isHandlingFavorite.current = false;
            }
        } else {
            push(favoritesRef, {
                BookId: bookId,
                UserId: userId,
                AddedAt: new Date().toISOString(),
            }).then(() => {
                Alert.alert('Thành công', 'Đã thêm vào danh sách yêu thích!');
            })
                .catch(error => {
                    Alert.alert('Lỗi', 'Có lỗi xảy ra khi thêm vào yêu thích: ' + error.message);
                })
                .finally(() => {
                    isHandlingFavorite.current = false;
                });
        }
    };

    // --- Hàm xử lý khi nhấn nút "Chia sẻ sách" ---
    const handleShareBook = async () => {
        if (bookData) {
            try {
                const result = await Share.share({
                    message: `Hãy đọc cuốn sách "${bookData.Title}" của tác giả ${bookData.Author} trên ứng dụng của chúng tôi!`,
                    url: bookData.CoverImage,
                    title: `Chia sẻ sách: ${bookData.Title}`,
                });

                if (result.action === Share.sharedAction) {
                    if (result.activityType) {
                        console.log('Đã chia sẻ qua:', result.activityType);
                    } else {
                        console.log('Đã chia sẻ thành công');
                    }
                } else if (result.action === Share.dismissedAction) {
                    console.log('Đã hủy chia sẻ');
                }
            } catch (error) {
                Alert.alert('Lỗi khi chia sẻ', error.message);
            }
        } else {
            Alert.alert('Lỗi', 'Không có thông tin sách để chia sẻ.');
        }
    };

    // --- Hàm xử lý gửi đánh giá ---
    const handleSubmitRating = async () => {
        if (!userId) {
            Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để đánh giá sách.', [{ text: 'OK', onPress: () => navigation.navigate('Dangnhap') }]);
            return;
        }
        if (userRating === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn số sao để đánh giá.');
            return;
        }

        const ratingData = {
            BookId: bookId,
            UserId: userId,
            UserName: userName || 'Ẩn danh',
            Rating: userRating,
            Comment: userComment.trim(),
            RatedAt: new Date().toISOString(),
        };

        try {
            if (userExistingRatingKey) {
                // Update existing rating
                await update(ref(db, `Ratings/${userExistingRatingKey}`), ratingData);
                Alert.alert('Thành công', 'Đã cập nhật đánh giá của bạn!');
            } else {
                // Push new rating
                await push(ref(db, 'Ratings'), ratingData);
                Alert.alert('Thành công', 'Đã gửi đánh giá của bạn!');
            }
            // Clear comment after submission, keep rating for visual feedback
            setUserComment('');
        } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi đánh giá: ' + error.message);
            console.error("Error submitting rating:", error);
        }
    };

    // --- Hiển thị trạng thái tải khi chưa có dữ liệu sách hoặc đang tải ---
    if (isLoading || !bookData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={{ marginTop: 10 }}>Đang tải thông tin sách...</Text>
            </View>
        );
    }

    // --- Xử lý mô tả để hiển thị "Xem thêm/Thu gọn" ---
    const rawDescription = bookData.rawDescription || '';
    const formattedDescription = formatDescription(rawDescription);
    const descriptionToShow = showFullDescription ? formattedDescription : formattedDescription.substring(0, 150) + (formattedDescription.length > 150 ? '...' : '');
    const readMoreText = showFullDescription ? 'Thu gọn' : 'Xem thêm';

    const toggleDescription = () => {
        setShowFullDescription(!showFullDescription);
    };


    return (
        <ScrollView style={styles.container}>
            {/* Ảnh bìa */}
            <Image source={{ uri: bookData.CoverImage }} style={styles.coverImage} />

            {/* Tiêu đề và tác giả */}
            <View style={styles.titleAuthorContainer}>
                <Text style={styles.bookTitle}>{bookData.Title}</Text>
                <Text style={styles.bookAuthor}>{bookData.Author}</Text>

                {/* --- Người đăng (ẩn nếu Ẩn danh) --- */}
                {bookData.UploadName !== "Ẩn danh" && uploader && (
                    <TouchableOpacity
                        style={styles.uploaderContainer}
                        onPress={() => navigation.navigate("TrangCaNhan", { userId: uploader.Id })}
                    >
                        {/* Avatar + Khung */}
                        <View style={styles.avatarFrameWrapper}>
                            <Image
                                source={{ uri: uploader.Avatar }}
                                style={styles.uploaderAvatar}
                            />
                            {frameUrl && (
                                <Image
                                    source={{ uri: frameUrl }}
                                    style={styles.uploaderAvatarFrame}
                                />
                            )}
                        </View>

                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Ionicons name="person-circle-outline" size={16} color="#555" />
                                <Text style={styles.uploaderName}>  {uploader.Username}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            </View>


            {/* Thống kê ngắn gọn: Lượt xem, Lượt yêu thích, Số chương */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={16} color="#777" />
                    <Text style={styles.statText}>
                        {totalViews ? (totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews) : '0'}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <AntDesign name={isFavorite ? 'heart' : 'hearto'} size={16} color={isFavorite ? 'red' : '#777'} />
                    <Text style={styles.statText}>{favoriteCount > 0 ? (favoriteCount > 999 ? `${(favoriteCount / 1000).toFixed(1)}k` : favoriteCount) : '0'}</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="list-outline" size={16} color="#777" />
                    <Text style={styles.statText}>{chapterCount}</Text>
                </View>
            </View>

            {/* Nút đọc, thêm vào thư viện và chia sẻ */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    onPress={
                        // Nếu là sách VIP
                        bookData.IsVIP
                            ? (userId === bookData.UploaderId || userRole === "Admin" || hasPurchased
                                ? handleStartReading
                                : handleBuyBook)
                            : handleStartReading // sách thường đọc luôn
                    }
                    style={styles.readButton}
                >
                    <Ionicons name="book-outline" size={20} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.readButtonText}>
                        {bookData.IsVIP
                            ? (userId === bookData.UploaderId || userRole === "Admin" || hasPurchased
                                ? "Bắt đầu đọc"
                                : `Mua sách VIP (${bookData.Price} xu)`)
                            : (readingHistory?.LastReadChapterId
                                ? `Đọc tiếp chương ${chapters.find(c => c.id === readingHistory.LastReadChapterId)?.ChapterNumber || "1"}`
                                : "Bắt đầu đọc")}
                    </Text>
                </TouchableOpacity>


                <TouchableOpacity style={styles.shareButton} onPress={handleShareBook}>
                    <Ionicons name="share-social-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.downloadButton, { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }]} onPress={saveOffline}>
                    <Ionicons name="download-outline" size={24} color="#c82c2cff" />
                </TouchableOpacity>

            </View>

            {/* Thẻ tag: Thể loại, VIP, Trạng thái */}
            <View style={styles.tagsContainer}>
                {genreName && (
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{genreName}</Text>
                    </View>
                )}
                {bookData.IsVIP && (
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>VIP</Text>
                    </View>
                )}
                {bookData.Status && (
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{bookData.Status}</Text>
                    </View>
                )}
            </View>

            {/* Nút thêm vào yêu thích */}
            <TouchableOpacity style={styles.favoriteButton} onPress={handleAddToFavorite}>
                <AntDesign
                    name={isFavorite ? 'heart' : 'hearto'}
                    size={24}
                    color={isFavorite ? 'red' : '#333'}
                />
                <Text style={styles.favoriteButtonText}>
                    {isFavorite ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => addToReadingList(userId, bookId)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#3498db',
                    width: 320,
                    marginLeft: 18,
                    marginBottom: 20,
                }}
            >
                <Ionicons name="book-outline" size={24} color="#3498db" />
                <Text style={{ marginLeft: 6, fontSize: 14, color: '#3498db' }}>
                    Thêm vào danh sách đọc
                </Text>
            </TouchableOpacity>





            {/* Mô tả sách */}
            {rawDescription.length > 0 && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>Mô tả</Text>
                    <Text style={styles.descriptionText}>
                        {descriptionToShow}
                    </Text>
                    {formattedDescription.length > 150 && (
                        <TouchableOpacity onPress={toggleDescription}>
                            <Text style={styles.readMoreText}>{readMoreText}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Phần đánh giá */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.ratingsSection}
            >
                <Text style={styles.sectionTitle}>Đánh giá sách</Text>
                <View style={styles.averageRatingContainer}>
                    <Text style={styles.averageRatingText}>Đánh giá trung bình: {averageRating.toFixed(1)}</Text>
                    <Rating
                        startingValue={averageRating}
                        readonly
                        imageSize={20}
                        style={{ paddingVertical: 5 }}
                    />
                    <Text style={styles.totalRatingsText}>({totalRatings} lượt đánh giá)</Text>
                </View>

                {userId ? (
                    <View style={styles.yourRatingContainer}>
                        <Text style={styles.yourRatingTitle}>Đánh giá của bạn:</Text>
                        <Rating
                            type="star"
                            ratingCount={5}
                            imageSize={30}
                            showRating
                            fractions={1}
                            onFinishRating={(rating) => setUserRating(rating)}
                            style={{ paddingVertical: 10 }}
                            startingValue={userRating}
                        />
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Viết bình luận của bạn (tùy chọn)..."
                            multiline
                            value={userComment}
                            onChangeText={setUserComment}
                            maxLength={500}
                        />
                        <TouchableOpacity style={styles.submitRatingButton} onPress={handleSubmitRating}>
                            <Text style={styles.submitRatingButtonText}>
                                {userExistingRatingKey ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.loginToRateText}>Đăng nhập để gửi đánh giá của bạn!</Text>
                )}

                <View style={styles.allRatingsContainer}>
                    <Text style={styles.allRatingsTitle}>Tất cả đánh giá:</Text>
                    {allRatings.length > 0 ? (
                        allRatings.map((rating, index) => {
                            // 💡 BƯỚC 1: KHAI BÁO BIẾN KIỂM TRA QUYỀN
                            const isCurrentUser = userId === rating.UserId;
                            const userInfo = userDisplayInfoMap[rating.UserId]; // Lấy thông tin người dùng

                            return (
                                <View key={index} style={styles.singleRatingItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1 }}>

                                        {/* Avatar có thể nhấn */}
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('TrangCaNhan', { userId: rating.UserId })}
                                            style={styles.avatarButton} // Thêm style cho TouchableOpacity nếu cần chỉnh lề
                                        >
                                            <View style={styles.avatarWrapper}>
                                                <AvatarWithFrame
                                                    user={userInfo}
                                                    avatarFramesList={allAvatarFrames}
                                                    size={40} // Giảm kích thước xuống 40-45 để bố cục đẹp hơn
                                                />
                                            </View>
                                        </TouchableOpacity>

                                        {/* Thông tin Rating và Tên người dùng */}
                                        <View style={styles.ratingInfoContent}>

                                            {/* Tên user và Nút Xóa (Nằm trên cùng một hàng) */}
                                            <View style={styles.userNameAndDeleteContainer}>
                                                <TouchableOpacity
                                                    onPress={() => navigation.navigate('TrangCaNhan', { userId: rating.UserId })}
                                                    style={{ flex: 1 }} // Đảm bảo Tên chiếm hết không gian còn lại
                                                >
                                                    <Text style={styles.ratingUserName}>
                                                        {getDisplayUserName(rating.UserId)}
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* 💡 BƯỚC 2: NÚT XÓA CHỈ HIỂN THỊ KHI LÀ CHỦ SỞ HỮU */}
                                                {isCurrentUser && (
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteRating(rating.id, rating.UserId)}
                                                        style={styles.deleteButton}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color="red" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Số Sao */}
                                            <Rating
                                                startingValue={rating.Rating}
                                                readonly
                                                imageSize={15}
                                                style={{ alignSelf: 'flex-start', paddingVertical: 5 }}
                                            />

                                            {/* Bình luận */}
                                            {rating.Comment ? (
                                                <Text style={styles.ratingComment}>{rating.Comment}</Text>
                                            ) : (
                                                <Text style={styles.noCommentText}>Không có bình luận.</Text>
                                            )}

                                            {/* Ngày đánh giá */}
                                            <Text style={styles.ratingDate}>
                                                Đánh giá vào: {new Date(rating.RatedAt).toLocaleDateString()}
                                            </Text>

                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text>Chưa có đánh giá nào</Text>
                    )}
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
        flex: 1,
        textAlign: 'center',
        marginRight: 44,
    },
    coverImage: {
        width: '60%',
        height: 300,
        resizeMode: 'cover',
        alignSelf: 'center',
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    titleAuthorContainer: {
        alignItems: 'center',
        padding: 15,
    },
    bookTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    bookAuthor: {
        fontSize: 18,
        color: '#777',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 10,
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 8,
        marginHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 5,
        color: '#777',
        fontSize: 14,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    readButton: {
        backgroundColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    readButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#000',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    shareButton: {
        backgroundColor: '#000',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        marginBottom: 15,
        justifyContent: 'center',
    },
    tag: {
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '500',
    },
    descriptionContainer: {
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#fff',
        marginHorizontal: 15,
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    readMoreText: {
        color: '#3498db',
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'right',
    },
    favoriteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        marginHorizontal: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    favoriteButtonText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },

    ratingsSection: {
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#fff',
        marginHorizontal: 15,
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    averageRatingContainer: {
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    averageRatingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    totalRatingsText: {
        fontSize: 14,
        color: '#777',
        marginTop: 5,
    },
    yourRatingContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    yourRatingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginTop: 15,
        width: '100%',
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: 15,
        color: '#333',
    },
    submitRatingButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 15,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    submitRatingButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginToRateText: {
        fontSize: 15,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 20,
    },
    allRatingsContainer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    allRatingsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    singleRatingItem: {
        backgroundColor: '#fefefe',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    ratingUserName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    ratingComment: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
        marginBottom: 5,
    },
    noCommentText: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 5,
        marginBottom: 5,
    },
    ratingDate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    noRatingsYet: {
        fontSize: 15,
        color: '#777',
        textAlign: 'center',
        paddingVertical: 10,
    },
    ratingUserContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    ratingUserAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#ccc',
    },
    avatarWrapper: {
        width: 50,
        height: 50,
        position: 'relative', // quan trọng để overlay
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 25, // bo tròn avatar
    },
    avatarFrameImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: 25, // khớp với avatar
    },
    uploaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        backgroundColor: "#f5f5f5",
        padding: 8,
        borderRadius: 10,
    },

    avatarFrameWrapper: {
        width: 45,
        height: 45,
        marginRight: 10,
    },

    uploaderAvatar: {
        width: 45,
        height: 45,
        borderRadius: 25,
        position: "absolute",
    },

    uploaderAvatarFrame: {
        width: 45,
        height: 45,
        position: "absolute",
        borderRadius: 22.5, // bo tròn khung
    },


    uploaderName: {
        fontSize: 14,
        fontWeight: "bold",
    },


});

export default Chitiet;