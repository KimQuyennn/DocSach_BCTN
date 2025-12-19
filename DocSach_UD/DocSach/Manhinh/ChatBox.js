import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { app, auth } from '../firebase';

const ChatBox = ({ route }) => {
    const { userId } = route.params; // userId của người bạn chat
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [userAvatar, setUserAvatar] = useState('https://via.placeholder.com/40');
    const [userFrame, setUserFrame] = useState(null); // frame của user
    const [adminAvatar, setAdminAvatar] = useState('https://via.placeholder.com/40');
    const [adminFrame, setAdminFrame] = useState(null); // frame của admin

    const db = getDatabase(app);
    const chatRef = ref(db, `Chats/${userId}_admin/messages`);
    const flatListRef = useRef();

    // Lấy profile user hiện tại (avatar + frame)
    useEffect(() => {
        const userRef = ref(db, `Users/${userId}`);
        onValue(userRef, snapshot => {
            const data = snapshot.val();
            if (data) {
                if (data.avatar) setUserAvatar(data.avatar);
                if (data.frame) setUserFrame(data.frame);
            }
        });

        // Lấy profile admin nếu muốn hiển thị avatar admin
        const adminId = 'admin'; // ID admin mặc định
        const adminRef = ref(db, `Users/${adminId}`);
        onValue(adminRef, snapshot => {
            const data = snapshot.val();
            if (data) {
                if (data.avatar) setAdminAvatar(data.avatar);
                if (data.frame) setAdminFrame(data.frame);
            }
        });
    }, [userId]);

    // Lấy tin nhắn realtime
    useEffect(() => {
        const unsubscribe = onValue(chatRef, snapshot => {
            const data = snapshot.val();
            if (data) {
                const msgs = Object.entries(data).map(([id, msg]) => ({ id, ...msg }));
                msgs.sort((a, b) => a.timestamp - b.timestamp);
                setMessages(msgs);
            } else {
                setMessages([]);
            }
        });
        return () => unsubscribe();
    }, [chatRef]);

    const sendMessage = () => {
        if (inputText.trim() === '') return;

        const newMsg = {
            senderId: auth.currentUser?.uid || userId,
            text: inputText,
            timestamp: Date.now(),
            avatar: userAvatar,
            frameUrl: userFrame || null,
        };

        push(chatRef, newMsg)
            .then(() => setInputText(''))
            .catch(err => console.error('Lỗi gửi tin nhắn:', err));
    };

    const renderItem = ({ item }) => {
        const isUser = item.senderId === userId; // nếu message là của user
        const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.adminRow]}>

                {/* Nếu là admin (tin nhắn bên trái) */}
                {!isUser && (
                    <View style={styles.chatAvatarContainer}>
                        <Image
                            source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
                            style={styles.chatAvatar}
                        />
                        {item.frameUrl && (
                            <Image
                                source={{ uri: item.frameUrl }}
                                style={styles.chatFrameOverlay}
                                resizeMode="cover"
                            />
                        )}
                    </View>
                )}

                {/* Bong bóng tin nhắn */}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.adminBubble]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                    <Text style={styles.timeText}>{time}</Text>
                </View>

                {/* Nếu là user (tin nhắn bên phải) */}
                {isUser && (
                    <View style={styles.chatAvatarContainer}>
                        <Image
                            source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
                            style={styles.chatAvatar}
                        />
                        {item.frameUrl && (
                            <Image
                                source={{ uri: item.frameUrl }}
                                style={styles.chatFrameOverlay}
                                resizeMode="cover"
                            />
                        )}
                    </View>
                )}
            </View>
        );
    };


    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 10 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    style={styles.input}
                    placeholder="Nhập tin nhắn..."
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                    <Text style={styles.sendText}>Gửi</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 5 },
    userRow: { justifyContent: 'flex-end' },
    adminRow: { justifyContent: 'flex-start' },
    messageBubble: { maxWidth: '70%', padding: 10, borderRadius: 10 },
    userBubble: { backgroundColor: '#00c853', borderTopRightRadius: 0 },
    adminBubble: { backgroundColor: '#eee', borderTopLeftRadius: 0 },
    messageText: { color: '#000' },
    timeText: { fontSize: 10, color: '#555', textAlign: 'right', marginTop: 2 },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ddd' },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15 },
    sendButton: { marginLeft: 10, backgroundColor: '#00c853', padding: 10, borderRadius: 20, justifyContent: 'center' },
    sendText: { color: 'white', fontWeight: 'bold' },
    chatAvatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    chatAvatar: { width: '100%', height: '100%', borderRadius: 20 },
    chatFrameOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 20 },
});

export default ChatBox;
