import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Modal,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator, Image
} from 'react-native';
import { Ionicons, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, push, update, set, get, remove } from 'firebase/database'; // Import update
import { app } from '../firebase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import * as Speech from 'expo-speech';
import AvatarWithFrame from './AvatarWithFrame';
import { TaoThongBao } from './TaoThongBao';
const { width, height } = Dimensions.get('window');
// 1. Hàm xử lý HTML
const parseHtmlToParagraphs = (html) => {
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n').replace(/<p[^>]*>/gi, '');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    const paragraphs = text
        .split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    return paragraphs;
};
let isReading = false;
let doanhientai = 0;    // đoạn hiện tại đang đọc
let paragraphsGlobal = [];        // lưu mảng đoạn

// State trong component

// Hàm đọc chapter với highlight
const readChapterWithHighlight = async (htmlContent) => {
    if (!htmlContent) return;

    // Nếu bắt đầu từ đầu thì parse
    if (doanhientai === 0) {
        paragraphsGlobal = parseHtmlToParagraphs(htmlContent);
    }

    isReading = true;

    for (let i = doanhientai; i < paragraphsGlobal.length; i++) {
        if (!isReading) break; // kiểm tra pause
        doanhientai = i;

        // cập nhật state để highlight đoạn
        setTtsParagraphIndex(doanhientai);

        // Scroll đến đoạn hiện tại (nếu dùng ScrollView)
        scrollViewRef.current?.scrollTo({
            y: doanhientai * 30, // ước lượng chiều cao mỗi đoạn, điều chỉnh nếu cần
            animated: true,
        });

        await new Promise((resolve) => {
            Speech.speak(paragraphsGlobal[i], {
                language: 'vi',
                pitch: 1.0,
                rate: 1.0,
                onDone: resolve,
                onStopped: resolve,
                onError: resolve,
            });
        });
    }

    isReading = false;

    // Reset index nếu đọc xong
    if (doanhientai >= paragraphsGlobal.length - 1) {
        doanhientai = 0;
        setTtsParagraphIndex(0);
    }
};
// 2. Hàm đọc tuần tự
const speakParagraphs = async (paragraphs) => {
    for (const p of paragraphs) {
        await new Promise((resolve) => {
            Speech.speak(p, {
                language: 'vi',
                pitch: 1.0,
                rate: 1.0,
                onDone: resolve,
                onStopped: resolve,
                onError: resolve,
            });
        });
    }
};

// 3. Hàm đọc chapter — **export ở top-level**
export const readChapter = async (htmlContent, onParagraphChange) => {
    if (!htmlContent) return;

    if (doanhientai === 0) {
        paragraphsGlobal = parseHtmlToParagraphs(htmlContent);
    }

    isReading = true;

    for (let i = doanhientai; i < paragraphsGlobal.length; i++) {
        if (!isReading) break;
        doanhientai = i;

        // Cập nhật đoạn đang đọc cho component
        if (onParagraphChange) onParagraphChange(i);

        await new Promise((resolve) => {
            Speech.speak(paragraphsGlobal[i], {
                language: 'vi',
                pitch: 1.0,
                rate: 1.0,
                onDone: resolve,
                onStopped: resolve,
                onError: resolve,
            });
        });
    }

    isReading = false;

    if (doanhientai >= paragraphsGlobal.length - 1) {
        doanhientai = 0;
        if (onParagraphChange) onParagraphChange(null); // reset highlight
    }
};




export const stopReading = () => {
    isReading = false;
    Speech.stop();
};



const DocSach = ({ route }) => {
    const { bookId, chapterId: initialChapterId, bookTitle } = route.params || {};

    const navigation = useNavigation();
    const db = getDatabase(app);
    const auth = getAuth(app);

    const [chapterData, setChapterData] = useState(null);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [allChapters, setAllChapters] = useState([]);
    const [userId, setUserId] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isLoadingChapters, setIsLoadingChapters] = useState(true);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [currentParagraphIndex, setCurrentParagraphIndex] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [commentsForParagraph, setCommentsForParagraph] = useState([]);
    const [allCommentsMap, setAllCommentsMap] = useState({});
    const [paragraphs, setParagraphs] = useState([]);
    const [userNamesMap, setUserNamesMap] = useState({});
    const [userReadingHistory, setUserReadingHistory] = useState(null);
    const [isBookCompleted, setIsBookCompleted] = useState(false);
    const [hasViewBeenCounted, setHasViewBeenCounted] = useState(false);

    const [chapterListModalVisible, setChapterListModalVisible] = useState(false);

    const scrollViewRef = useRef(null);
    const chapterListFlatListRef = useRef(null);

    const lastSavedChapterIdRef = useRef(null);
    const [isReadingChapter, setIsReadingChapter] = useState(false);
    const [allAvatarFrames, setAllAvatarFrames] = useState([]);
    const [userAvatarsMap, setUserAvatarsMap] = useState({});

    const [ttsParagraphIndex, setTtsParagraphIndex] = useState(0); // để highlight
    const [bookInfo, setBookInfo] = useState(null);
    const [parentCommentId, setParentCommentId] = useState(null); // ID của bình luận gốc đang được trả lời
    const [replyingToUserName, setReplyingToUserName] = useState(null); // Tên người dùng đang được trả lời
    const [userUsername, setUserUsername] = useState(null);
    const [readStartTime, setReadStartTime] = useState(null);
    // const saveReadingTime = async () => {
    //     // Chỉ lưu nếu có chương đang được hiển thị VÀ đã có readStartTime
    //     if (!readStartTime || !userId || !bookId || !chapterData?.id) return;

    //     const endTime = Date.now();
    //     const duration = Math.floor((endTime - readStartTime) / 1000); // giây

    //     // Dùng 60s để đảm bảo người dùng có đọc thực sự (Thay vì 15s)
    //     if (duration < 60) {
    //         console.log(`Bỏ qua lưu log: Thời gian đọc quá ngắn (${duration}s)`);
    //         return;
    //     }

    //     const log = {
    //         UserId: userId,
    //         BookId: bookId,
    //         ChapterId: chapterData.id,
    //         Duration: duration,
    //         Date: new Date().toISOString().split('T')[0],
    //         CreatedAt: new Date().toISOString()
    //     };

    //     try {
    //         await push(ref(db, 'ReadingLogs'), log);
    //         console.log(`Đã lưu log đọc: ${duration} giây cho chương ${chapterData.id}.`);

    //         // RẤT QUAN TRỌNG: Cập nhật readStartTime để bắt đầu đếm giờ cho chu kỳ mới
    //         // Chỉ cập nhật khi push log thành công
    //         setReadStartTime(Date.now());
    //     } catch (error) {
    //         console.error("Lỗi khi lưu ReadingLog:", error);
    //     }
    // };

    useEffect(() => {
        if (userId) {
            const userRef = ref(db, `Users/${userId}`);
            const unsubscribeUser = onValue(userRef, (snapshot) => {
                const userData = snapshot.val();
                if (userData && userData.Username) {
                    setUserUsername(userData.Username); // ✨ Lưu Username vào state mới
                } else {
                    setUserUsername('Người dùng ẩn danh');
                }
            }, (error) => {
                console.error("Lỗi khi tải Username:", error);
                setUserUsername('Người dùng ẩn danh');
            });
            return () => unsubscribeUser();
        } else {
            setUserUsername(null);
        }
    }, [userId, db]);
    const handleDeleteComment = async (commentId, userIdOfComment) => {
        if (!userId) {
            Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để thực hiện hành động này.');
            return;
        }

        // Kiểm tra quyền: Chỉ cho phép xóa bình luận của chính mình
        if (userId !== userIdOfComment) {
            Alert.alert('Không có quyền', 'Bạn chỉ có thể xóa bình luận của chính mình.');
            return;
        }

        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc muốn xóa bình luận này không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    onPress: async () => {
                        try {
                            // Xóa bình luận trên Firebase
                            await remove(ref(db, `Comments/${commentId}`));

                            // Cập nhật giao diện (Firebase listener sẽ tự động cập nhật commentsForParagraph)
                            // Tuy nhiên, bạn cần cập nhật cả allCommentsMap để số lượng comment (dấu chấm) trên đoạn văn cũng được cập nhật
                            // Điều này đã được xử lý tự động trong useEffect 4 và 5

                            Alert.alert('Thành công', 'Bình luận đã được xóa.');
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể xóa bình luận: ' + error.message);
                            console.error("Error deleting comment:", error);
                        }
                    }
                }
            ]
        );
    };
    useEffect(() => {
        if (!bookId) return;

        const bookRef = ref(db, `Books/${bookId}`);
        const unsubscribe = onValue(bookRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setBookInfo(data);
            }
        }, (error) => {
            console.error("Không thể tải thông tin sách:", error);
        });

        return () => unsubscribe();
    }, [bookId]);


    const decodeHtmlAndFormat = (html) => {
        if (!html) return ' ';
        let text = html
            .replace(/<br\s*\/?>/gi, '\n')   // <br> => xuống dòng
            .replace(/<p>/gi, '')            // loại <p>
            .replace(/<\/p>/gi, '\n\n')      // </p> => 2 xuống dòng
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/<[^>]*>/g, '')         // loại các thẻ HTML khác
            .trim();

        // Nếu rỗng, thêm 1 ký tự trắng để Speech.speak đọc
        if (text === '') text = ' ';
        return text;
    };

    useEffect(() => {
        const fetchFrames = async () => {
            try {
                const framesRef = ref(db, 'AvatarFrames');
                const snapshot = await get(framesRef);
                const framesObject = snapshot.val();
                const frames = [];

                if (framesObject) {
                    for (const key in framesObject) {
                        frames.push({
                            Id: key, // Dùng key làm ID để khớp
                            ...framesObject[key]
                        });
                    }
                }
                setAllAvatarFrames(frames);
            } catch (error) {
                console.error("Lỗi khi fetch AvatarFrames:", error);
            }
        };
        fetchFrames();
    }, [db]);
    // --- EFFECT 1: Lấy userId khi component mount ---
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                Alert.alert(
                    'Yêu cầu đăng nhập',
                    'Bạn cần đăng nhập để xem nội dung sách và bình luận. Vui lòng đăng nhập để tiếp tục.',
                    [{ text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Dangnhap') }]
                );
                setUserId(null);
            }
            setIsLoadingUser(false);
        });
        return () => unsubscribeAuth();
    }, [auth, navigation]);

    // --- NEW EFFECT: Lấy lịch sử đọc của người dùng và kiểm tra trạng thái hoàn thành sách ---
    // Cái này không cần thay đổi vì nó chỉ fetch và set state
    useEffect(() => {
        if (userId && bookId) {
            const readingHistoryRef = ref(db, `ReadingHistory`);
            const unsubscribeReadingHistory = onValue(readingHistoryRef, (snapshot) => {
                const historyData = snapshot.val();
                let foundHistory = null;
                for (const key in historyData) {
                    if (historyData[key].UserId === userId && historyData[key].BookId === bookId) {
                        foundHistory = { id: key, ...historyData[key] };
                        break;
                    }
                }
                setUserReadingHistory(foundHistory);
                setIsBookCompleted(foundHistory?.IsCompleted || false);

                if (foundHistory && foundHistory.LastReadChapterId) {
                    lastSavedChapterIdRef.current = foundHistory.LastReadChapterId;
                } else {
                    lastSavedChapterIdRef.current = null;
                }

            }, (error) => {
                console.error("Error fetching reading history:", error);
            });
            return () => unsubscribeReadingHistory();
        }
    }, [userId, bookId, db]);


    // --- EFFECT 2: Lấy tất cả các chương của sách và sắp xếp ---
    useEffect(() => {
        if (!bookId) {
            setIsLoadingChapters(false);
            return;
        }

        setIsLoadingChapters(true);
        const chaptersRef = ref(db, `Chapters`);
        const unsubscribeChapters = onValue(chaptersRef, (snapshot) => {
            const data = snapshot.val();
            const bookChapters = [];
            if (data) {
                for (const key in data) {
                    if (data[key].BookId === bookId && data[key].IsApproved === true) {
                        bookChapters.push({ id: key, ...data[key] });
                    }
                }
            }

            bookChapters.sort((a, b) => a.ChapterNumber - b.ChapterNumber);
            setAllChapters(bookChapters);

            const foundIndex = bookChapters.findIndex(ch => ch.id === initialChapterId);
            if (foundIndex !== -1) {
                setCurrentChapterIndex(foundIndex);
            } else if (bookChapters.length > 0) {
                setCurrentChapterIndex(0);
            } else {
                setChapterData(null);
                setParagraphs([]);
            }
            setIsLoadingChapters(false);
        }, (error) => {
            Alert.alert("Lỗi", "Không thể tải danh sách chương.");
        });

        return () => unsubscribeChapters();
    }, [bookId, db, initialChapterId]);

    // --- EFFECT 3: Lắng nghe dữ liệu của chương hiện tại và phân tích thành đoạn ---
    useEffect(() => {
        if (allChapters.length > 0 && currentChapterIndex >= 0 && currentChapterIndex < allChapters.length) {
            const currentChapter = allChapters[currentChapterIndex];
            const chapterContentRef = ref(db, `Chapters/${currentChapter.id}`);

            const unsubscribeChapterContent = onValue(chapterContentRef, (snapshot) => {
                const data = snapshot.val();
                setChapterData({ id: currentChapter.id, ...data });
                //setReadStartTime(Date.now());
                if (data && data.Content) {
                    let cleanedContent = data.Content.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n');
                    cleanedContent = cleanedContent.replace(/<[^>]*>/g, '');
                    cleanedContent = cleanedContent.replace(/&nbsp;/g, ' ');
                    const paragraphArray = cleanedContent.split(/\n\n+/).filter(p => p.trim() !== '');
                    setParagraphs(paragraphArray);
                } else {
                    setParagraphs([]);
                }
                if (scrollViewRef.current) {
                    scrollViewRef.current.scrollTo({ y: 0, animated: true });
                }
            }, (error) => {
                Alert.alert("Lỗi", "Không thể tải nội dung chương này.");
            });
            return () => {
                //saveReadingTime();
                unsubscribeChapterContent();
            };
        } else {
            setChapterData(null);
            setParagraphs([]);
        }
    }, [allChapters, currentChapterIndex, db]);
    // Hàm đọc 
    // useEffect(() => {
    //     // Cài đặt Interval để lưu thời gian đọc sau mỗi 60 giây (60000ms)
    //     const intervalId = setInterval(() => {
    //         if (chapterData && userId) { // Chỉ lưu nếu đang xem nội dung chương và đã đăng nhập
    //             saveReadingTime();
    //         }
    //     }, 60000); // Lưu sau mỗi 60 giây (1 phút)

    //     // Cleanup: Xóa Interval khi component unmount
    //     return () => {
    //         clearInterval(intervalId);
    //     };
    // }, [chapterData, userId]);

    const toggleReadChapter = () => {
        if (isReadingChapter) {
            stopReading();
            setIsReadingChapter(false);
        } else if (chapterData?.Content) {
            readChapter(chapterData.Content, setTtsParagraphIndex);
            setIsReadingChapter(true);
        }
    };

    useEffect(() => {
        if (ttsParagraphIndex !== null && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                y: ttsParagraphIndex * 40, // 40 là chiều cao trung bình 1 đoạn, có thể tùy chỉnh
                animated: true,
            });
        }
    }, [ttsParagraphIndex]);



    useFocusEffect(
        useCallback(() => {
            return () => {
                stopReading();               // <-- Dừng TTS khi rời màn hình
                setIsReadingChapter(false);
                doanhientai = 0;
            };
        }, [])
    );



    // NEW: Hàm để cập nhật lịch sử đọc, được gọi khi chuyển chương hoặc thoát màn hình
    const updateReadingHistory = useCallback(async () => {
        if (!userId || !bookId || !chapterData?.id || !allChapters.length) return;

        const key = `${userId}_${bookId}`; // 🔑 khóa duy nhất cho user+book
        const historyRef = ref(db, `ReadingHistory/${key}`);

        const currentChapterId = chapterData.id;
        const lastReadAt = new Date().toISOString();
        const isCurrentlyLastChapter = (currentChapterIndex === allChapters.length - 1);

        try {
            await set(historyRef, {
                UserId: userId,
                BookId: bookId,
                LastReadChapterId: currentChapterId,
                LastReadAt: lastReadAt,
                IsCompleted: isCurrentlyLastChapter,
            });
            console.log(`✅ Synced ReadingHistory for user ${userId}, book ${bookId} at chapter ${currentChapterId}`);
        } catch (error) {
            console.error("❌ Error updating reading history:", error);
        }
    }, [userId, bookId, chapterData?.id, currentChapterIndex, allChapters.length]);

    // NEW: Hàm để tăng lượt xem, chỉ gọi một lần khi vào màn hình và sách chưa được đánh dấu là hoàn thành
    const incrementTotalViews = useCallback(async () => {
        if (!bookId || !userId || !chapterData?.id || isLoadingChapters || isLoadingUser || hasViewBeenCounted) {
            return;
        }

        const statisticsRef = ref(db, `Statistics`);
        let statisticsSnapshot = await new Promise(resolve => onValue(statisticsRef, resolve, { onlyOnce: true }));
        const allStatistics = statisticsSnapshot.val();
        let bookStatisticsKey = null;
        let currentViews = 0;

        for (const key in allStatistics) {
            if (allStatistics[key].BookId === bookId) {
                bookStatisticsKey = key;
                currentViews = allStatistics[key].TotalViews || 0;
                break;
            }
        }

        // Chỉ tăng lượt xem nếu sách chưa được đánh dấu là hoàn thành bởi người dùng
        if (!isBookCompleted) {
            try {
                if (bookStatisticsKey) {
                    await update(ref(db, `Statistics/${bookStatisticsKey}`), {
                        TotalViews: currentViews + 1
                    });
                    console.log(`Increased TotalViews for book ${bookId} to ${currentViews + 1}`);
                } else {
                    await push(statisticsRef, {
                        BookId: bookId,
                        TotalViews: 1,
                        TotalSales: 0,
                        TotalComments: 0
                    });
                    console.log(`Created new Statistics entry for book ${bookId} with 1 view`);
                }
                setHasViewBeenCounted(true); // Đánh dấu rằng lượt xem đã được tính
            } catch (error) {
                console.error("Error incrementing total views:", error);
            }
        } else {
            console.log(`Not increasing TotalViews for book ${bookId}. Book is completed.`);
        }
    }, [bookId, userId, chapterData?.id, isLoadingChapters, isLoadingUser, hasViewBeenCounted, isBookCompleted, db]);


    // --- NEW EFFECT: Gọi incrementTotalViews khi component được focus lần đầu và updateReadingHistory khi chapterData thay đổi ---
    // Sử dụng useFocusEffect để đảm bảo logic chạy khi màn hình được focus, không phải chỉ khi component mount
    useFocusEffect(
        useCallback(() => {
            // Tăng lượt xem khi màn hình được focus lần đầu (hoặc sau khi thoát/vào lại)
            if (bookId && userId && chapterData?.id && !isLoadingChapters && !isLoadingUser && !hasViewBeenCounted) {
                incrementTotalViews();
            }

            // Cleanup function: Cập nhật lịch sử đọc khi người dùng thoát khỏi màn hình
            return () => {
                if (bookId && userId && chapterData?.id && !isLoadingChapters && !isLoadingUser) {
                    updateReadingHistory();
                }
            };
        }, [bookId, userId, chapterData?.id, isLoadingChapters, isLoadingUser, hasViewBeenCounted, incrementTotalViews, updateReadingHistory])
    );

    // NEW EFFECT: Cập nhật lịch sử đọc mỗi khi chương thay đổi
    useEffect(() => {
        // Chỉ gọi updateReadingHistory nếu chapterData đã sẵn sàng và đã có dữ liệu chương
        if (chapterData?.id && allChapters.length > 0) {
            updateReadingHistory();
        }
    }, [chapterData?.id, updateReadingHistory, allChapters.length]);


    // --- NEW EFFECT: Lấy tất cả thông tin người dùng từ Firebase ---
    useEffect(() => {
        const usersRef = ref(db, `Users`);
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            const namesMap = {};
            const avatarsMap = {};
            if (usersData) {
                for (const uid in usersData) {
                    namesMap[uid] = {
                        Username: usersData[uid].Username || 'Người dùng',
                        showDisplayName: usersData[uid].showDisplayName !== undefined ? usersData[uid].showDisplayName : true,

                    };
                    avatarsMap[uid] = {
                        AvatarUrl: usersData[uid].Avatar || null,
                        AvatarFrame: usersData[uid].AvatarFrame || null
                    };
                }
            }
            setUserNamesMap(namesMap);
            setUserAvatarsMap(avatarsMap);
        }, (error) => {
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
        });

        return () => unsubscribeUsers();
    }, [db]);

    // --- EFFECT 4: Lắng nghe tất cả comment và tạo map (cải tiến) ---
    useEffect(() => {
        if (!bookId) return;

        const commentsRef = ref(db, `Comments`);
        const unsubscribeAllComments = onValue(commentsRef, (snapshot) => {
            const allCommentsData = snapshot.val();
            const newCommentsMap = {};

            if (allCommentsData) {
                for (const key in allCommentsData) {
                    const comment = allCommentsData[key];
                    if (comment.BookId === bookId) {
                        const chapterId = comment.ChapterId;
                        const paragraphMatch = comment.Paragraph.match(/Paragraph (\d+)/);
                        const paragraphIndex = paragraphMatch ? parseInt(paragraphMatch[1], 10) - 1 : null;

                        if (chapterId && paragraphIndex !== null) {
                            if (!newCommentsMap[chapterId]) {
                                newCommentsMap[chapterId] = {};
                            }
                            newCommentsMap[chapterId][paragraphIndex] = (newCommentsMap[chapterId][paragraphIndex] || 0) + 1;
                        }
                    }
                }
            }
            setAllCommentsMap(newCommentsMap);
        }, (error) => {
            Alert.alert("Lỗi", "Không thể tải dữ liệu bình luận tổng quan.");
        });

        return () => unsubscribeAllComments();
    }, [bookId, db]);

    // --- EFFECT 5: Lắng nghe comment cho đoạn hiện tại (chỉ khi modal mở) ---
    useEffect(() => {
        if (commentModalVisible && bookId && currentParagraphIndex !== null && chapterData?.id) {
            const commentsRef = ref(db, `Comments`);
            const unsubscribeCommentsForParagraph = onValue(commentsRef, (snapshot) => {
                const allComments = snapshot.val();
                const filteredComments = [];
                if (allComments) {
                    for (const key in allComments) {
                        const comment = allComments[key];
                        if (comment.BookId === bookId &&
                            comment.ChapterId === chapterData.id &&
                            comment.Paragraph === `Paragraph ${currentParagraphIndex + 1}`) {
                            filteredComments.push({ id: key, ...comment });
                        }
                    }
                }
                filteredComments.sort((a, b) => new Date(b.CommentedAt) - new Date(a.CommentedAt));
                setCommentsForParagraph(filteredComments);
            }, (error) => {
                Alert.alert("Lỗi", "Không thể tải bình luận cho đoạn này.");
            });
            return () => unsubscribeCommentsForParagraph();
        } else {
            setCommentsForParagraph([]);
        }
    }, [commentModalVisible, bookId, currentParagraphIndex, chapterData?.id, db]);
    // dừng đọc
    useEffect(() => {
        // Khi chuyển chương, dừng đọc tự động
        stopReading();
        setIsReadingChapter(false);
    }, [currentChapterIndex]);


    const handleNextChapter = () => {
        if (currentChapterIndex < allChapters.length - 1) {
            setCurrentChapterIndex(prevIndex => prevIndex + 1);
        } else {
            // Khi đến chương cuối cùng, đánh dấu sách là đã hoàn thành
            if (userId && bookId && userReadingHistory) {
                // Sử dụng ID của userReadingHistory để cập nhật
                update(ref(db, `ReadingHistory/${userReadingHistory.id}`), {
                    IsCompleted: true
                }).then(() => {
                    setIsBookCompleted(true);
                    Alert.alert('Chúc mừng!', 'Bạn đã đọc hết chương cuối cùng của sách!');
                }).catch(error => {
                    console.error("Error marking book as completed:", error);
                    Alert.alert('Lỗi', 'Không thể đánh dấu sách đã hoàn thành.');
                });
            } else {
                Alert.alert('Thông báo', 'Đây là chương cuối cùng của sách.');
            }
        }
    };

    const handlePreviousChapter = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(prevIndex => prevIndex - 1);
        } else {
            Alert.alert('Thông báo', 'Đây là chương đầu tiên của sách.');
        }
    };

    const openCommentModal = (index) => {
        if (isLoadingUser) {
            Alert.alert('Đang tải', 'Đang kiểm tra trạng thái đăng nhập, vui lòng đợi...');
            return;
        }
        if (!userId) {
            Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để bình luận.', [
                { text: 'Đăng nhập', onPress: () => navigation.navigate('Dangnhap') }
            ]);
            return;
        }
        if (!bookId || !chapterData || !chapterData.id || index === null || index === undefined) {
            Alert.alert('Lỗi', 'Không thể mở khung bình luận. Thiếu thông tin về sách hoặc chương.');
            return;
        }

        setCurrentParagraphIndex(index);
        setCommentModalVisible(true);
        setCommentText('');
    };

    const closeCommentModal = () => {
        setCommentModalVisible(false);
        setCurrentParagraphIndex(null);
        setCommentText('');
        setCommentsForParagraph([]);

        setParentCommentId(null);
        setReplyingToUserName(null);
    };

    const submitComment = async () => {
        if (!commentText.trim()) {
            Alert.alert('Lỗi', 'Bình luận không được để trống.');
            return;
        }
        if (!userId || !bookId || currentParagraphIndex === null || !chapterData || !chapterData.id) {
            Alert.alert('Lỗi', 'Không đủ thông tin để gửi bình luận. Vui lòng thử lại.');
            return;
        }

        try {
            const commentToSave = {
                BookId: bookId,
                ChapterId: chapterData.id,
                CommentedAt: new Date().toISOString(),
                Content: commentText.trim(),
                Paragraph: `Paragraph ${currentParagraphIndex + 1}`,
                UserId: userId,
                // ✨ NEW: Khởi tạo Likes rỗng
                Likes: [],
                // ✨ NEW: Thêm ParentCommentId nếu đang trả lời
                ...(parentCommentId && { ParentCommentId: parentCommentId }),
            };

            await push(ref(db, 'Comments'), commentToSave);
            if (parentCommentId) {

                // 2. Tìm bình luận gốc để lấy ID chủ sở hữu
                // *LƯU Ý:* Bạn cần đảm bảo commentsForParagraph đã được load trong component.
                const originalComment = commentsForParagraph.find(c => c.id === parentCommentId);
                const originalCommentOwnerId = originalComment?.UserId;

                const replierUsername = userUsername;
                // 3. Kiểm tra điều kiện: tồn tại Owner ID VÀ không phải tự trả lời mình
                if (originalCommentOwnerId && originalCommentOwnerId !== userId) {

                    const title = "Bình luận mới!";
                    const message = `${replierUsername} đã trả lời bình luận của bạn.`;
                    const type = "comment_reply";

                    // 4. GỌI HÀM TẠO THÔNG BÁO
                    // (Giả sử bạn đã cập nhật TaoThongBao để nhận contextData)
                    await TaoThongBao(
                        originalCommentOwnerId, // Người nhận
                        title,
                        message,
                        type,
                        {
                            bookId: bookId,
                            chapterId: chapterData.id,
                            parentCommentId: parentCommentId,
                        }
                    );
                }
            }
            // Reset trạng thái sau khi gửi
            setCommentText('');
            setParentCommentId(null);
            setReplyingToUserName(null); // Reset trạng thái reply

            Alert.alert('Thành công', parentCommentId ? 'Phản hồi của bạn đã được gửi.' : 'Bình luận của bạn đã được gửi.');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể gửi bình luận: ' + error.message);
            console.error("Error submitting comment:", error);
        }
    };

    const getDisplayUserName = (uid) => {
        const userInfo = userNamesMap[uid];
        if (userInfo && userInfo.showDisplayName === true) {
            return userInfo.Username || 'Người dùng';
        }
        return 'Ẩn danh';
    };
    const getAvatarInfo = (uid) => {
        const userInfo = userAvatarsMap[uid];
        const avatarUrl = userInfo?.AvatarUrl || null;
        const frameId = userInfo?.AvatarFrame || null;

        // Tìm URL khung tương ứng
        const frame = allAvatarFrames.find(f => f.Id === frameId);
        const frameUrl = frame?.FrameUrl || null;

        return {
            avatarUrl,
            frameUrl,
            showFrame: !!frameUrl // Boolean: true nếu có frameUrl
        };
    };
    const getCommentCount = (chapterId, paragraphIndex) => {
        return allCommentsMap[chapterId]?.[paragraphIndex] || 0;
    };
    const handleLikeComment = async (commentId) => {
        if (!userId) {
            Alert.alert('Chưa đăng nhập', 'Bạn cần đăng nhập để thích bình luận.');
            return;
        }

        try {
            const commentRef = ref(db, `Comments/${commentId}`);
            const snapshot = await get(commentRef);
            const commentData = snapshot.val();

            if (!commentData) return;

            // Đảm bảo Likes là một mảng. Nếu Firebase trả về object (như cách push), 
            // bạn cần chuyển nó thành mảng tạm thời hoặc xử lý như mảng.
            // Ở đây ta giả định đã lưu là mảng (Array).
            let likes = Array.isArray(commentData.Likes) ? commentData.Likes : [];

            // Kiểm tra xem người dùng đã thích chưa
            if (likes.includes(userId)) {
                // Bỏ thích: Lọc userId ra khỏi mảng
                likes = likes.filter(uid => uid !== userId);
            } else {
                // Thích: Thêm userId vào mảng
                likes.push(userId);
            }

            // Cập nhật lại mảng Likes trên Firebase
            // Lưu ý: Listener (EFFECT 5) sẽ tự động cập nhật FlatList
            await update(commentRef, { Likes: likes });

        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thao tác Thích: ' + error.message);
            console.error("Error liking comment:", error);
        }
    };

    // ✨ NEW FUNCTION: Xử lý Trả lời
    const handleReplyComment = (id, userName) => {
        // 1. Thiết lập state để Input biết nó đang trả lời ai
        setParentCommentId(id);
        setReplyingToUserName(userName);
        setCommentText(`@${userName} `); // Tùy chọn: Thêm tên người dùng vào TextInput
        // Nếu có thể, hãy focus vào TextInput ở đây
    };

    // ... (Tiếp tục với closeCommentModal)


    const openChapterListModal = () => {
        setChapterListModalVisible(true);
        setTimeout(() => {
            if (chapterListFlatListRef.current && allChapters.length > 0 && currentChapterIndex >= 0) {
                chapterListFlatListRef.current.scrollToIndex({
                    animated: true,
                    index: currentChapterIndex,
                    viewPosition: 0.5
                });
            }
        }, 100);
    };

    const closeChapterListModal = () => {
        setChapterListModalVisible(false);
    };

    const handleChapterSelect = (index) => {
        setCurrentChapterIndex(index);
        closeChapterListModal();
    };

    if (isLoadingUser || isLoadingChapters || !chapterData) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{bookTitle || 'Đang tải...'}</Text>
                    <TouchableOpacity style={styles.settingsButton}>
                        <Ionicons name="settings-outline" size={24} color="black" />
                    </TouchableOpacity>


                </View>
                <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
                <Text style={{ marginTop: 10 }}>Đang tải {isLoadingUser ? 'thông tin người dùng...' : (isLoadingChapters ? 'danh sách chương...' : 'nội dung chương...')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerTitleContainer}
                    onPress={openChapterListModal}
                >
                    <Text style={styles.headerBookTitle} numberOfLines={1}>
                        {bookInfo?.Title || 'Sách không tên'}
                    </Text>
                    <Text style={styles.headerChapterTitle} numberOfLines={1}>
                        {chapterData?.Title || 'Chương không tên'}
                    </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <TouchableOpacity onPress={toggleReadChapter} style={{ padding: 5 }}>
                        <Ionicons
                            name={isReadingChapter ? "pause-circle" : "volume-high"}
                            size={28}
                            color="#FF69B4"
                        />
                    </TouchableOpacity>
                    <Text style={{ marginLeft: 8, color: '#555' }}>
                        {isReadingChapter ? 'Đang đọc...' : 'Đọc chương'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('CaidatDoc')}>
                    <Ionicons name="settings-outline" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Nội dung chương */}
            <ScrollView style={styles.contentContainer} ref={scrollViewRef}>
                {paragraphs.length > 0 ? (
                    paragraphs.map((paragraph, index) => {
                        const commentCount = getCommentCount(chapterData.id, index);
                        return (
                            <View key={index} style={styles.paragraphWrapper}>
                                <Text
                                    style={{
                                        ...styles.chapterText,
                                        backgroundColor: index === ttsParagraphIndex ? '#dab7b7' : 'transparent',
                                    }}
                                >
                                    {paragraph.trim() || ' '}
                                </Text>

                                <TouchableOpacity
                                    style={styles.commentActionButton}
                                    onPress={() => openCommentModal(index)}
                                >
                                    {commentCount > 0 ? (
                                        <View style={styles.commentCountContainer}>
                                            <MaterialCommunityIcons
                                                name="comment-text-multiple-outline"
                                                size={18}
                                                color="#000"
                                            />
                                            <Text style={styles.commentCountText}>{commentCount}</Text>
                                        </View>
                                    ) : (
                                        <AntDesign name="pluscircleo" size={18} color="#000" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.noContentText}>
                        Chương này chưa có nội dung hoặc đang tải.
                    </Text>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handlePreviousChapter} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                    Chương {currentChapterIndex + 1} / {allChapters.length}
                </Text>
                <TouchableOpacity onPress={handleNextChapter} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={24} color="black" />
                </TouchableOpacity>
            </View>

            {/* Comment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={commentModalVisible}
                onRequestClose={closeCommentModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.commentModalContainer}>
                        <View style={styles.commentModalHeader}>
                            <Text style={styles.commentModalTitle}>
                                Bình luận cho đoạn {currentParagraphIndex !== null ? currentParagraphIndex + 1 : ''}
                            </Text>
                            <TouchableOpacity onPress={closeCommentModal} style={styles.modalCloseButton}>
                                <Ionicons name="close-circle-outline" size={26} color="#555" />
                            </TouchableOpacity>
                        </View>

                        {/* Danh sách bình luận */}
                        <FlatList
                            data={commentsForParagraph}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => {
                                const { avatarUrl, frameUrl } = getAvatarInfo(item.UserId);
                                const isCurrentUserComment = userId === item.UserId; // 💡 Kiểm tra quyền sở hữu

                                const userName = getDisplayUserName(item.UserId);

                                // ✨ NEW: Lấy thông tin Like
                                // Đảm bảo item.Likes là mảng, xử lý trường hợp null hoặc undefined
                                const likesArray = Array.isArray(item.Likes) ? item.Likes : (item.Likes ? Object.values(item.Likes) : []);
                                const likesCount = likesArray.length;
                                const isCurrentUserLiked = likesArray.includes(userId);

                                return (
                                    <View key={item.id} style={styles.commentItem}>

                                        {/* 1. AVATAR */}
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('TrangCaNhan', { userId: item.UserId })}
                                            style={{ marginRight: 10, width: 40, height: 40 }}
                                        >
                                            {avatarUrl ? (
                                                <Image
                                                    source={{ uri: avatarUrl }}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 20
                                                    }}
                                                />
                                            ) : (
                                                // Hiển thị một Placeholder nếu không có ảnh
                                                <View style={{ width: 40, height: 40, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 10 }}>No A</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {/* 2. NỘI DUNG BÌNH LUẬN */}
                                        <View style={styles.commentContentWrapper}>
                                            {/* Dòng tên và nút xóa */}
                                            <View style={styles.commentHeaderRow}>
                                                <Text style={styles.commentUserName}>
                                                    {userName}
                                                </Text>

                                                {/* NÚT XÓA (Chỉ hiện thị khi là chủ sở hữu) */}
                                                {isCurrentUserComment && (
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteComment(item.id, item.UserId)}
                                                        style={styles.deleteCommentButton}
                                                    >
                                                        <Ionicons name="trash-outline" size={16} color="#d9534f" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Nội dung */}
                                            <Text style={styles.commentContent}>{item.Content}</Text>

                                            {/* Hành động: Thời gian, Like, Reply */}
                                            <View style={styles.commentActions}>
                                                <Text style={styles.commentTime}>
                                                    {new Date(item.CommentedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                </Text>

                                                {/* ✨ NEW: NÚT THÍCH (LIKE) */}
                                                <TouchableOpacity onPress={() => handleLikeComment(item.id)} style={styles.actionButton}>
                                                    <AntDesign
                                                        // Thay đổi icon và màu sắc nếu đã thích
                                                        name={isCurrentUserLiked ? "heart" : "hearto"}
                                                        size={14}
                                                        color={isCurrentUserLiked ? "red" : "#777"}
                                                    />
                                                    <Text style={styles.actionText}>
                                                        {likesCount > 0 ? ` Thích (${likesCount})` : ' Thích'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* ✨ NEW: NÚT TRẢ LỜI (REPLY) */}
                                                {/* Chỉ hiện thị nút "Trả lời" cho bình luận gốc (chưa có ParentCommentId) */}
                                                {!item.ParentCommentId && (
                                                    <TouchableOpacity
                                                        // Truyền ID và Tên người dùng vào hàm
                                                        onPress={() => handleReplyComment(item.id, userName)}
                                                        style={styles.actionButton}
                                                    >
                                                        <Text style={styles.actionText}>Trả lời</Text>
                                                    </TouchableOpacity>
                                                )}

                                                {/* NOTE: Để hiển thị bình luận con lồng nhau, bạn cần một logic phức tạp hơn (nhóm comments) */}
                                            </View>
                                        </View>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={
                                <Text style={styles.noCommentsText}>
                                    Chưa có bình luận nào cho đoạn này.
                                </Text>
                            }
                            style={styles.commentsList}
                        />

                        {/* Input để thêm bình luận mới */}
                        <View style={styles.commentInputContainer}>
                            <TextInput
                                style={styles.commentTextInput}
                                placeholder="Viết bình luận của bạn..."
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                                autoCorrect={false}
                            />
                            <TouchableOpacity style={styles.commentSubmitButton} onPress={submitComment}>
                                <Ionicons name="send" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Chapter List Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={chapterListModalVisible}
                onRequestClose={closeChapterListModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={closeChapterListModal}
                >
                    <View style={styles.chapterListModalContainer}>
                        <View style={styles.chapterListModalHeader}>
                            <Text style={styles.chapterListModalTitle}>Danh sách chương</Text>
                            <TouchableOpacity onPress={closeChapterListModal} style={styles.modalCloseButton}>
                                <Ionicons name="close-circle-outline" size={26} color="#555" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            ref={chapterListFlatListRef}
                            data={allChapters}
                            keyExtractor={(item) => item.id}
                            getItemLayout={(data, index) => ({ length: 44, offset: 44 * index, index })}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.chapterListItem,
                                        index === currentChapterIndex && styles.currentChapterListItem
                                    ]}
                                    onPress={() => handleChapterSelect(index)}
                                >
                                    <Text
                                        style={[
                                            styles.chapterListItemText,
                                            index === currentChapterIndex && styles.currentChapterListItemText
                                        ]}
                                    >
                                        Chương {item.ChapterNumber}: {item.Title}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.noChaptersText}>
                                    Sách này chưa có chương nào.
                                </Text>
                            }
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    backButton: {
        padding: 5,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 10,
    },
    headerBookTitle: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
    },
    headerChapterTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    settingsButton: {
        padding: 5,
    },
    contentContainer: {
        flex: 1,
        padding: 15,
    },
    paragraphWrapper: {
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    chapterText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        marginRight: 10,
    },
    commentActionButton: {
        padding: 5,
        alignSelf: 'flex-end',
        marginBottom: -5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 4,
    },
    commentCountText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 3,
        color: '#333',
    },
    noContentText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#777',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    navButton: {
        padding: 10,
    },
    pageInfo: {
        fontSize: 14,
        color: '#777',
    },

    // Comment Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    commentModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 15,
        maxHeight: height * 0.9,
        minHeight: height * 0.6,
    },
    commentModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    commentModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalCloseButton: {
        padding: 5,
    },
    commentsList: {
        flexGrow: 1,
        marginBottom: 10,
    },
    commentItem: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    commentUserName: {
        fontWeight: 'bold',
        marginBottom: 3,
        color: '#444',
    },
    commentContent: {
        fontSize: 14,
        color: '#333',
        marginBottom: 3,
    },
    commentTime: {
        fontSize: 11,
        color: '#888',
        textAlign: 'right',
    },
    noCommentsText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 20,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    commentTextInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    commentSubmitButton: {
        backgroundColor: '#000',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Chapter List Modal Styles
    chapterListModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 15,
        maxHeight: height * 0.8,
        minHeight: height * 0.5,
        width: '100%',
        alignSelf: 'center',
    },
    chapterListModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    chapterListModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    chapterListItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    currentChapterListItem: {
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
    },
    chapterListItemText: {
        fontSize: 16,
        color: '#333',
    },
    currentChapterListItemText: {
        fontWeight: 'bold',
        color: '#000',
    },
    noChaptersText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 20,
        fontSize: 16,
    },
    commentItem: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'flex-start',
    },
    avatarWrapper: {
        width: 50, // Kích thước tổng thể
        height: 50,
        marginRight: 10,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    frameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Đảm bảo khung luôn nằm ngoài cùng
        zIndex: 10,
    },
    frameImage: {
        width: 50, // Kích thước khung khớp với avatarWrapper
        height: 50,
        resizeMode: 'contain',
    },
    commentItem: {
        flexDirection: 'row', // Đã đúng: Avatar và nội dung nằm ngang hàng
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'flex-start', // Căn chỉnh các phần tử lên đầu
    },

    commentContentWrapper: {
        flex: 1, // Đảm bảo nội dung chiếm hết không gian còn lại

        // ✨ ĐÃ THÊM: Tạo khoảng cách giữa Avatar và nội dung
        marginLeft: 10,

        paddingRight: 10,
    },

    commentUserName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
    },

    commentContent: {
        fontSize: 16,
        color: '#000',
        marginTop: 2,
    },

    commentTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },

    commentsList: {
        flex: 1,
        paddingHorizontal: 10,
    },

    noCommentsText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    commentContentWrapper: {
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 8,
    },
    commentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    commentUserName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
        flexShrink: 1, // Cho phép tên bị cắt nếu quá dài
    },
    deleteCommentButton: {
        padding: 5,
        marginLeft: 10,
        // Tùy chỉnh vị trí nếu cần
    },
    commentContent: {
        fontSize: 14,
        color: '#555',
    },
    // --- Styles cho hành động (Actions) ---
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 15,
        paddingVertical: 2,
        paddingHorizontal: 5,
    },
    actionText: {
        fontSize: 12,
        color: '#777',
        marginLeft: 3,
    },
    // Styles cho hộp thông báo đang trả lời
    replyingToBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff0f5', // Màu hồng nhạt
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FF69B4',
    },
    replyingToText: {
        fontSize: 13,
        color: '#333',
        fontStyle: 'italic',
        fontWeight: '600',
    },
});

export default DocSach;