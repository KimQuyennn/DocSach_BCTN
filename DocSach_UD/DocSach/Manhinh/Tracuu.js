import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { auth } from '../firebase';
import Icon from 'react-native-vector-icons/Feather'; // Cần cài đặt react-native-vector-icons

// Định nghĩa tin nhắn khởi động
const INITIAL_MESSAGE = {
    id: 'intro',
    type: 'ai',
    text: 'Chào bạn! Tôi là AI Booknet, tôi có thể tóm tắt sách, giải thích các khái niệm phức tạp, hoặc giới thiệu các tác phẩm dựa trên sở thích của bạn. Hãy bắt đầu hỏi nhé!',
};

export default function Tracuu({ route, navigation }) {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([INITIAL_MESSAGE]); // State lưu lịch sử hội thoại
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef();

    const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';

    // Cuộn xuống cuối mỗi khi tin nhắn thay đổi
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const handleAsk = async () => {
        const userQuestion = question.trim();
        if (!userQuestion) {
            Alert.alert("Lỗi", "Vui lòng nhập câu hỏi trước khi gửi.");
            return;
        }

        // 1. Lưu câu hỏi của người dùng vào lịch sử
        const userMessage = { id: Date.now().toString() + 'u', type: 'user', text: userQuestion };
        setMessages(prev => [...prev, userMessage]);

        // 2. Xóa nội dung Input ngay lập tức
        setQuestion('');

        setLoading(true);

        try {
            const response = await fetch('https://booknet-payments.onrender.com/ai-ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userQuestion, userId }),
            });

            const data = await response.json();
            let aiAnswerText;

            if (data.error) {
                aiAnswerText = `❌ Lỗi: ${data.error}. Vui lòng thử lại.`;
            } else {
                aiAnswerText = data.answer;
            }

            // 3. Lưu câu trả lời của AI vào lịch sử
            const aiMessage = { id: Date.now().toString() + 'a', type: 'ai', text: aiAnswerText };
            setMessages(prev => [...prev, aiMessage]);

        } catch (err) {
            console.error(err);
            const errorMessage = {
                id: Date.now().toString() + 'e',
                type: 'ai',
                text: '❌ Lỗi kết nối. Không thể liên hệ với AI server. Vui lòng kiểm tra mạng.'
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setLoading(false);
    };

    const isQuestionEmpty = question.trim().length === 0;

    // --- RENDER MESSAGE ITEM ---
    const renderMessage = (message) => {
        const isUser = message.type === 'user';
        return (
            <View
                key={message.id}
                style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.aiBubble
                ]}
            >
                {!isUser && (
                    <Text style={styles.aiLabel}>AI</Text>
                )}
                <Text style={isUser ? styles.userText : styles.aiText}>
                    {message.text}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <View style={styles.container}>

                {/* HEADER */}
                {/* <View style={styles.header}>
                    <Icon name="zap" size={24} color="#10B981" />
                    <Text style={styles.title}>AI Booknet Assistant</Text>
                </View> */}

                {/* ANSWER AREA - SCROLLVIEW */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatContainer}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                >
                    {messages.map(renderMessage)}

                    {/* Hiển thị Loading khi AI đang trả lời */}
                    {loading && (
                        <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
                            <ActivityIndicator size="small" color="#6B7280" />
                            <Text style={styles.loadingText}>AI đang soạn câu trả lời...</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Hỏi về sách, tác giả, tóm tắt, triết lý..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={question}
                        onChangeText={setQuestion}
                        editable={!loading}
                    />

                    <TouchableOpacity
                        style={[styles.btn, isQuestionEmpty || loading ? styles.btnDisabled : styles.btnActive]}
                        onPress={handleAsk}
                        disabled={isQuestionEmpty || loading}
                    >
                        <Icon name="arrow-up" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E5E7EB' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
        elevation: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 8,
    },

    // CHAT HISTORY
    chatContainer: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    chatContent: {
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#10B981', // Màu người dùng
        borderBottomRightRadius: 3,
    },
    userText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff', // Màu AI (màu trắng)
        borderBottomLeftRadius: 3,
    },
    aiLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3B82F6', // Màu xanh dương cho nhãn AI
        marginBottom: 4,
    },
    aiText: {
        color: '#1F2937',
        fontSize: 16,
        lineHeight: 22,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Nền loading
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#6B7280',
    },

    // INPUT & BUTTON AREA (Giữ nguyên)
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#D1D5DB',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        fontSize: 16,
        maxHeight: 150,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        color: '#1F2937',
    },
    btn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    btnActive: {
        backgroundColor: '#10B981',
    },
    btnDisabled: {
        backgroundColor: '#A7F3D0',
    },
});