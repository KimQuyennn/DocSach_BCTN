import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Share, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue, get, push, remove, set, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { Rating } from 'react-native-ratings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarWithFrame from './AvatarWithFrame';  // import component avatar

const ChitietOff = ({ route, navigation }) => {
    const { bookId } = route.params;
    const db = getDatabase();
    const auth = getAuth();
    const user = auth.currentUser;

    const [bookData, setBookData] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState(user?.uid || null);
    const [readingHistory, setReadingHistory] = useState(null);
    const [hasPurchased, setHasPurchased] = useState(false);

    const isHandlingFavorite = useRef(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteKey, setFavoriteKey] = useState(null);

    const [allRatings, setAllRatings] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [userExistingRatingKey, setUserExistingRatingKey] = useState(null);

    // --- Load sách offline trước
    useEffect(() => {
        const fetchOfflineBook = async () => {
            try {
                const storedBooks = await AsyncStorage.getItem('OfflineBooks');
                const offlineBooks = storedBooks ? JSON.parse(storedBooks) : [];
                const offlineBook = offlineBooks.find(b => b.id === bookId);
                if (offlineBook) {
                    setBookData(offlineBook);
                    setChapters(offlineBook.Chapters || []);
                    console.log("Mở sách offline:", offlineBook.Title);
                } else {
                    console.log("Không tìm thấy sách offline");
                    setBookData(null);
                }
            } catch (error) {
                console.error("Lỗi đọc offline:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOfflineBook();
    }, [bookId]);

    // --- Hàm mở đọc sách
    // --- Hàm mở đọc sách offline
    const handleStartReading = () => {
        if (!chapters || chapters.length === 0) return;

        // Chọn chapter để mở: nếu có lịch sử đọc thì mở chapter đó, ngược lại mở chapter đầu
        let targetChapter = readingHistory?.LastReadChapterId
            ? chapters.find(c => c.id === readingHistory.LastReadChapterId)
            : chapters[0];

        // Chuyển sang DocSachOff thay vì DocSach
        navigation.navigate("DocSachOff", {
            bookId,
            chapterId: targetChapter?.id
        });
    };


    // --- Hàm lưu offline
    const saveOffline = async () => {
        if (!bookData) return;
        try {
            const storedBooks = await AsyncStorage.getItem('OfflineBooks');
            const offlineBooks = storedBooks ? JSON.parse(storedBooks) : [];
            if (!offlineBooks.find(b => b.id === bookId)) {
                offlineBooks.push(bookData);
                await AsyncStorage.setItem('OfflineBooks', JSON.stringify(offlineBooks));
                Alert.alert("Thành công", "Đã lưu sách offline");
            } else {
                Alert.alert("Thông báo", "Sách đã có trong offline");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không lưu được sách offline");
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (!bookData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Không tìm thấy sách.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 15 }}>
            <Image source={{ uri: bookData.CoverImage }} style={{ width: '60%', height: 300, alignSelf: 'center', borderRadius: 8, marginBottom: 10 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>{bookData.Title}</Text>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>{bookData.Author}</Text>

            <TouchableOpacity onPress={handleStartReading} style={{ backgroundColor: '#000', padding: 15, borderRadius: 8, marginVertical: 10 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Bắt đầu đọc</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate("DocSach", { bookId })}
                style={{ backgroundColor: '#eee', padding: 12, borderRadius: 8, marginVertical: 10 }}
            >
                <Text style={{ textAlign: 'center' }}>Đọc online</Text>
            </TouchableOpacity>

        </ScrollView>
    );
};

export default ChitietOff;
