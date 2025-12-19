import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tách HTML thành các đoạn, hỗ trợ <br>
const parseHTMLToParagraphs = (html) => {
    if (!html) return [];

    // Convert HTML entities to normal characters
    html = html
        .replace(/&nbsp;/g, ' ')
        .replace(/&ensp;/g, ' ')
        .replace(/&emsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

    // Thay <br> thành xuống dòng
    html = html.replace(/<br\s*\/?>/gi, '\n');

    const regex = /<h1>(.*?)<\/h1>|<h2>(.*?)<\/h2>|<p>(.*?)<\/p>/gi;
    const result = [];
    let match;

    while ((match = regex.exec(html)) !== null) {
        if (match[1]) result.push({ type: 'h1', text: match[1] });
        else if (match[2]) result.push({ type: 'h2', text: match[2] });
        else if (match[3]) result.push({ type: 'p', text: match[3] });
    }

    return result;
};


// Component hiển thị 1 bình luận
const CommentItem = ({ item }) => (
    <View style={styles.commentItem}>
        <Text style={styles.commentUser}>{item.UserName || 'Người dùng'}</Text>
        <Text style={styles.commentText}>{item.Text}</Text>
    </View>
);

const DocSachOff = ({ route }) => {
    const { bookId, chapterId } = route.params;
    const [book, setBook] = useState(null);
    const [chapterIndex, setChapterIndex] = useState(0);
    const [paragraphs, setParagraphs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showChapterList, setShowChapterList] = useState(false);

    useEffect(() => {
        const fetchOfflineBook = async () => {
            try {
                const storedBooks = await AsyncStorage.getItem('OfflineBooks');
                const offlineBooks = storedBooks ? JSON.parse(storedBooks) : [];
                const bookData = offlineBooks.find(b => b.id === bookId);
                if (!bookData) return;

                setBook(bookData);

                // Tìm index chapter
                let index = 0;
                if (chapterId) {
                    const cIndex = bookData.Chapters.findIndex(c => c.id === chapterId);
                    if (cIndex >= 0) index = cIndex;
                }
                setChapterIndex(index);
                const chapterData = bookData.Chapters[index];
                setParagraphs(parseHTMLToParagraphs(chapterData.Content || ''));
            } catch (error) {
                console.error("Lỗi đọc sách offline:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOfflineBook();
    }, [bookId, chapterId]);

    const changeChapter = (index) => {
        if (!book || !book.Chapters || index < 0 || index >= book.Chapters.length) return;
        setChapterIndex(index);
        const chapterData = book.Chapters[index];
        setParagraphs(parseHTMLToParagraphs(chapterData.Content || ''));
        setShowChapterList(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF69B4" />
                <Text style={{ marginTop: 10 }}>Đang tải sách offline...</Text>
            </View>
        );
    }

    if (!book || !book.Chapters || book.Chapters.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Không tìm thấy sách offline hoặc chương.</Text>
            </View>
        );
    }

    const chapter = book.Chapters[chapterIndex];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 15 }}>
                <Text style={styles.bookTitle}>{book.Title}</Text>
                <Text style={styles.bookAuthor}>{book.Author}</Text>

                {/* Nút mở danh sách chương */}
                <TouchableOpacity style={styles.chapterListButton} onPress={() => setShowChapterList(true)}>
                    <Text style={{ color: '#fff' }}>{chapter.Title || `Chương ${chapterIndex + 1}`}</Text>
                </TouchableOpacity>

                {/* Nội dung chia đoạn */}
                {paragraphs.map((para, index) => {
                    let style = styles.p;
                    if (para.type === 'h1') style = styles.h1;
                    else if (para.type === 'h2') style = styles.h2;

                    // Thay \n thành xuống dòng
                    return (
                        <Text key={index} style={style}>
                            {para.text.split('\n').map((line, i) => (
                                <Text key={i}>{line}{'\n'}</Text>
                            ))}
                        </Text>
                    );
                })}

                {/* Nút chuyển chương */}
                <View style={styles.navigationButtons}>
                    <TouchableOpacity
                        style={[styles.navButton, chapterIndex === 0 && styles.navButtonDisabled]}
                        disabled={chapterIndex === 0}
                        onPress={() => changeChapter(chapterIndex - 1)}
                    >
                        <Text style={styles.navButtonText}>Chương trước</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navButton, chapterIndex === book.Chapters.length - 1 && styles.navButtonDisabled]}
                        disabled={chapterIndex === book.Chapters.length - 1}
                        onPress={() => changeChapter(chapterIndex + 1)}
                    >
                        <Text style={styles.navButtonText}>Chương kế</Text>
                    </TouchableOpacity>
                </View>

                {/* Bình luận */}
                <Text style={styles.commentTitle}>Bình luận</Text>
                {chapter.Comments && chapter.Comments.length > 0 ? (
                    <FlatList
                        data={chapter.Comments}
                        renderItem={({ item }) => <CommentItem item={item} />}
                        keyExtractor={(item, index) => index.toString()}
                        scrollEnabled={false}
                    />
                ) : (
                    <Text style={{ color: '#777', fontStyle: 'italic' }}>Chưa có bình luận.</Text>
                )}
            </ScrollView>

            {/* Modal danh sách chương */}
            <Modal visible={showChapterList} animationType="slide">
                <SafeAreaView style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 }}>Danh sách chương</Text>
                    <FlatList
                        data={book.Chapters}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity style={styles.chapterItem} onPress={() => changeChapter(index)}>
                                <Text style={index === chapterIndex ? styles.chapterItemTextActive : styles.chapterItemText}>
                                    {item.Title || `Chương ${index + 1}`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={[styles.chapterListButton, { alignSelf: 'center', margin: 10 }]} onPress={() => setShowChapterList(false)}>
                        <Text style={{ color: '#fff' }}>Đóng</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bookTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#333', textAlign: 'center' },
    bookAuthor: { fontSize: 16, color: '#555', marginBottom: 15, textAlign: 'center' },
    h1: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    p: { fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#333' },
    commentTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 10 },
    commentItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    commentUser: { fontWeight: 'bold', marginBottom: 3, color: '#333' },
    commentText: { fontSize: 14, color: '#555' },
    chapterListButton: { backgroundColor: '#FF69B4', padding: 12, borderRadius: 8, marginVertical: 10, alignItems: 'center' },
    navigationButtons: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
    navButton: { backgroundColor: '#000', padding: 10, borderRadius: 8, width: '48%' },
    navButtonDisabled: { backgroundColor: '#aaa' },
    navButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    chapterItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    chapterItemText: { fontSize: 16 },
    chapterItemTextActive: { fontSize: 16, fontWeight: 'bold', color: '#FF69B4' },
});

export default DocSachOff;
