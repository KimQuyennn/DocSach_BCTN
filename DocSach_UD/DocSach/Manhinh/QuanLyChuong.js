import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDatabase, ref, onValue, query, orderByChild, equalTo, remove } from 'firebase/database';
import { app } from '../firebase';

const QuanLyChuong = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookId, bookTitle } = route.params; // Nhận BookId và Title từ màn hình Choduyet
    const db = getDatabase(app);

    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!bookId) {
            Alert.alert("Lỗi", "Không tìm thấy ID sách.");
            navigation.goBack();
            return;
        }

        // Truy vấn tất cả chương thuộc về BookId này
        const chaptersRef = query(ref(db, 'Chapters'), orderByChild('BookId'), equalTo(bookId));

        const unsubscribe = onValue(chaptersRef, (snapshot) => {
            const data = snapshot.val();
            const loadedChapters = [];

            if (data) {
                for (const key in data) {
                    loadedChapters.push({ id: key, ...data[key] });
                }
            }

            // Sắp xếp theo thứ tự ChapterNumber nếu có, hoặc Title
            loadedChapters.sort((a, b) => (a.ChapterNumber || a.Title) > (b.ChapterNumber || b.Title) ? 1 : -1);

            setChapters(loadedChapters);
            setIsLoading(false);
        }, (error) => {
            console.error("Lỗi khi tải chương:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [bookId]);

    // --- LOGIC XỬ LÝ CHƯƠNG ---
    const handleEditChapter = (chapter) => {
        // Điều hướng đến màn hình sửa chương
        // Suachuong sẽ cần logic để set IsApproved: false khi lưu
        navigation.navigate('Suachuong', { chapterId: chapter.id });
    };

    const handleDeleteChapter = (chapter) => {
        Alert.alert(
            "Xác nhận Xóa Chương",
            `Bạn có chắc chắn muốn xóa chương "${chapter.Title}" không?`,
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

    // Render Item Chương
    const renderChapterItem = ({ item }) => {
        const isApproved = item.IsApproved === true;
        const isRejected = item.Rejected === true;

        let statusText;
        let statusStyle;

        if (isRejected) {
            statusText = `Bị Từ chối: ${item.RejectedReason || 'Không rõ lý do'}`;
            statusStyle = styles.rejectedText;
        } else if (!isApproved) {
            statusText = item.Status || "Chờ duyệt";
            statusStyle = styles.pendingText;
        } else {
            statusText = "Đã đăng tải";
            statusStyle = styles.approvedText;
        }

        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>{item.Title}</Text>
                    <Text style={[styles.itemStatus, statusStyle]}>{statusText}</Text>
                </View>

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
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Đang tải chương...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Chương của: {bookTitle}</Text>
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('Themchuong', { bookId: bookId, bookTitle: bookTitle })}
            >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Đăng Chương Mới</Text>
            </TouchableOpacity>

            {chapters.length === 0 ? (
                <Text style={styles.noItemsText}>Sách này chưa có chương nào.</Text>
            ) : (
                <FlatList
                    data={chapters}
                    renderItem={renderChapterItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 10 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#555' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 15, paddingHorizontal: 15,
        borderBottomWidth: 1, borderBottomColor: '#eee',
        paddingTop: Platform.OS === 'ios' ? 40 : 15,
    },
    backButton: { marginRight: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },

    addButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#2ecc71', padding: 15, borderRadius: 8,
        margin: 10,
    },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

    itemContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#f9f9f9', borderRadius: 8, padding: 15, marginBottom: 8,
    },
    itemInfo: { flex: 1, marginRight: 10 },
    itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    itemStatus: { fontSize: 13, fontWeight: '500', marginTop: 3 },

    actionContainer: { flexDirection: 'row' },
    actionButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 5, marginLeft: 8 },
    editButton: { backgroundColor: '#3498db' },
    deleteButton: { backgroundColor: '#e74c3c' },
    actionButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    approvedText: { color: '#28a745' },
    pendingText: { color: '#f39c12' },
    rejectedText: { color: '#e74c3c' },
    noItemsText: { fontSize: 16, color: '#777', textAlign: 'center', paddingVertical: 20 },
});

export default QuanLyChuong;