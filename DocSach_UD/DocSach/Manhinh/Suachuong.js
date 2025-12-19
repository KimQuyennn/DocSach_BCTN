import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getDatabase, ref, get, update, query, orderByChild, equalTo, remove } from 'firebase/database';
import { app } from '../firebase';
import { useRoute, useNavigation } from '@react-navigation/native';

// Hàm cải tiến để loại bỏ HTML tags và định dạng ngắt dòng cho TextInput
const stripHtmlAndFormatBreaks = (html) => {
    if (!html) return '';

    let text = html;

    // 1. Thay thế các thực thể HTML (như &nbsp;) thành ký tự tương ứng
    text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

    // 2. Thay thế thẻ <br> thành ký tự xuống dòng '\n'
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // 3. Thêm ký tự xuống dòng kép '\n\n' trước/sau các thẻ khối (Block tags)
    // Việc này giúp các đoạn văn bản (từng thẻ <p> hoặc <div>) được tách biệt rõ ràng
    text = text.replace(/<\/(p|div|h[1-6]|li|blockquote)>\s*/gi, '\n\n');

    // 4. Loại bỏ tất cả các thẻ HTML còn lại
    text = text.replace(/<[^>]*>/g, '').trim();

    // 5. Chuẩn hóa các dòng trắng thừa (giữ tối đa 2 lần xuống dòng liên tiếp)
    return text.replace(/\n\s*\n/g, '\n\n').trim();
};

// Hàm chuyển đổi nội dung sửa sang định dạng HTML trước khi lưu
const convertToHtmlFormat = (text) => {
    if (!text) return '';

    // 1. Tách văn bản thành các đoạn dựa trên 2 lần xuống dòng (dấu hiệu của đoạn mới)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim() !== '');

    // 2. Bọc mỗi đoạn trong thẻ <p> và thay thế ngắt dòng còn lại (ngắt dòng đơn) bằng <br>
    const htmlContent = paragraphs.map(p => {
        let content = p.trim();

        // Thay thế xuống dòng đơn bằng <br>
        content = content.replace(/\n/g, '<br>');

        // Thay thế nhiều khoảng trắng liên tiếp bằng &nbsp; để duy trì định dạng
        content = content.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length));

        return `<p>${content}</p>`;
    }).join('');

    return htmlContent;
};

// --- HÀM MỚI: Xóa tất cả bình luận liên quan đến ChapterId ---
const deleteChapterComments = async (db, chapterId) => {
    if (!chapterId) {
        console.warn("ChapterId không được cung cấp. Bỏ qua xóa bình luận.");
        return 0;
    }

    try {
        const commentsRef = ref(db, 'Comments');
        const commentsQuery = query(
            commentsRef,
            orderByChild('ChapterId'),
            equalTo(chapterId)
        );

        const snapshot = await get(commentsQuery);
        let count = 0;

        if (snapshot.exists()) {
            const deletePromises = [];
            snapshot.forEach((childSnapshot) => {
                // Xóa từng node bình luận trong database
                deletePromises.push(remove(childSnapshot.ref));
                count++;
            });

            await Promise.all(deletePromises);
            console.log(`Đã xóa thành công ${count} bình luận liên quan đến Chapter ID: ${chapterId}`);
            return count;
        } else {
            return 0;
        }
    } catch (error) {
        console.error("Lỗi khi xóa bình luận chương:", error);
        // Ném lỗi để rollback nếu bạn có hệ thống giao dịch, hoặc chỉ cảnh báo
        Alert.alert("Lỗi xóa bình luận", "Đã cập nhật chương nhưng không thể xóa bình luận cũ. Vui lòng kiểm tra database.");
        return 0;
    }
};

const Suachuong = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { chapterId } = route.params;
    const db = getDatabase(app);

    const [chapterData, setChapterData] = useState(null);
    const [title, setTitle] = useState('');
    const [displayContent, setDisplayContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChapterDetails = async () => {
            try {
                const chapterRef = ref(db, `Chapters/${chapterId}`);
                const snapshot = await get(chapterRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setChapterData(data);
                    setTitle(data.Title || '');

                    const originalHtmlContent = data.Content || '';
                    setDisplayContent(stripHtmlAndFormatBreaks(originalHtmlContent));

                } else {
                    Alert.alert("Lỗi", "Không tìm thấy chương.");
                    navigation.goBack();
                }
            } catch (error) {
                console.error("Lỗi khi tải chi tiết chương:", error);
                Alert.alert("Lỗi", "Không thể tải dữ liệu chương.");
                navigation.goBack();
            } finally {
                setIsLoading(false);
            }
        };

        fetchChapterDetails();
    }, [chapterId, db, navigation]);

    const handleUpdateChapter = async () => {
        if (!title.trim() || !displayContent.trim()) {
            Alert.alert("Lỗi", "Tiêu đề và nội dung không được để trống.");
            return;
        }

        setIsLoading(true);

        const htmlContentToSave = convertToHtmlFormat(displayContent);

        try {
            // 1. Cập nhật Chương
            const chapterRef = ref(db, `Chapters/${chapterId}`);
            await update(chapterRef, {
                Title: title,
                Content: htmlContentToSave,
                IsApproved: false,
                Rejected: false,
                RejectedReason: null
            });

            // 2. Xóa Comments liên quan (Bước mới theo yêu cầu)
            await deleteChapterComments(db, chapterId);

            Alert.alert("Thành công", "Chương đã được cập nhật và chuyển sang trạng thái chờ duyệt. Bình luận cũ đã được xóa.");
            navigation.goBack();
        } catch (error) {
            console.error("Lỗi khi cập nhật chương:", error);
            Alert.alert("Lỗi", "Không thể cập nhật chương. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text>Đang tải chi tiết chương...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Sửa Chương: {chapterData?.Title}</Text>

            <Text style={styles.label}>Tiêu đề chương:</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Nhập tiêu đề chương"
            />

            <Text style={styles.label}>Nội dung chương (Ngắt đoạn bằng hai lần xuống dòng):</Text>
            <TextInput
                style={[styles.input, styles.contentInput]}
                value={displayContent}
                onChangeText={setDisplayContent}
                placeholder="Nhập nội dung chương"
                multiline
                textAlignVertical='top'
            />

            <Button title="Cập nhật Chương" onPress={handleUpdateChapter} color="#3498db" />

            <View style={{ marginTop: 20 }}>
                <Button title="Hủy" onPress={() => navigation.goBack()} color="#e74c3c" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    label: { fontSize: 16, marginTop: 10, marginBottom: 5, color: '#555' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 16, marginBottom: 15 },
    contentInput: { height: 300, textAlignVertical: 'top' },
});

export default Suachuong;