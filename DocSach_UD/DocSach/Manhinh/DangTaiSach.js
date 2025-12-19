import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue, push, set } from 'firebase/database';
import { app } from '../firebase';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

const removeHTMLTags = (text) => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, '');
};

const DangTaiSach = () => {
    const navigation = useNavigation();
    const db = getDatabase(app);
    const auth = getAuth(app);
    const user = auth.currentUser;

    const CLOUDINARY_CLOUD_NAME = 'dpde9onm3';
    const CLOUDINARY_UPLOAD_PRESET = 'anhdaidienbooknet';

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [genreId, setGenreId] = useState('');
    const [genres, setGenres] = useState([]);
    const [coverImageUri, setCoverImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

    const [hasCopyright, setHasCopyright] = useState(false); // Switch: Có bản quyền hay tự viết
    const [publisherName, setPublisherName] = useState(''); // Tên nhà xuất bản
    const [copyrightExpiration, setCopyrightExpiration] = useState(''); // Hạn bản quyền
    const [copyrightImageUri, setCopyrightImageUri] = useState(null); // Ảnh chứng minh bản quyền

    // thêm state cho VIP
    const [isVIP, setIsVIP] = useState(false);
    const [price, setPrice] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    useEffect(() => {
        if (user) {
            const userRef = ref(db, `Users/${user.uid}`);
            onValue(userRef, snapshot => {
                setUserInfo(snapshot.val());
            });
        }
    }, [user]);

    useEffect(() => {
        const genresRef = ref(db, 'Genres');
        const unsubscribe = onValue(genresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedGenres = Object.keys(data).map(key => ({
                    id: key,
                    Name: data[key].Name
                }));
                setGenres(loadedGenres);
                if (loadedGenres.length > 0) {
                    setGenreId(loadedGenres[0].id);
                }
            } else {
                setGenres([]);
            }
        });
        return () => unsubscribe();
    }, [db]);

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
                return;
            }
        }

        try {
            let mediaTypesConfig;
            if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
                mediaTypesConfig = ImagePicker.MediaType.Images;
            } else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
                mediaTypesConfig = ImagePicker.MediaTypeOptions.Images;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypesConfig,
                allowsEditing: true,
                aspect: [2, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setCoverImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn ảnh: ' + error.message);
        }
    };
    const pickCopyrightImage = async () => {
        // Xin quyền truy cập thư viện ảnh (tương tự như pickImage)
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
                return;
            }
        }

        try {
            let mediaTypesConfig;
            if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
                mediaTypesConfig = ImagePicker.MediaType.Images;
            } else if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
                mediaTypesConfig = ImagePicker.MediaTypeOptions.Images;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypesConfig,
                allowsEditing: true, // Có thể chỉnh sửa
                aspect: [16, 9], // Tỷ lệ ảnh chứng minh bản quyền có thể khác
                quality: 1,
            });

            if (!result.canceled) {
                setCopyrightImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn ảnh bản quyền: ' + error.message);
        }
    };

    const uploadImageToCloudinary = async (uri) => {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: `book_cover_${user.uid}_${Date.now()}.jpg`,
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const data = await response.json();

            if (data.secure_url) {
                return data.secure_url;
            } else {
                throw new Error(data.error?.message || 'Lỗi không xác định từ Cloudinary.');
            }
        } catch (error) {
            throw error;
        }
    };

    const handleUploadBook = async () => {
        if (!user) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để đăng tải sách.');
            return;
        }
        if (!title || !author || !description || !genreId || !coverImageUri) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin và chọn ảnh bìa.');
            return;
        }
        if (isVIP && (!price || isNaN(price) || parseInt(price) <= 0)) {
            Alert.alert('Lỗi', 'Vui lòng nhập giá xu hợp lệ cho sách VIP.');
            return;
        }

        // ✨ VALIDATION BẢN QUYỀN MỚI
        if (hasCopyright && (!publisherName || !copyrightExpiration || !copyrightImageUri)) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin (NXB, Hạn, Ảnh) cho sách Bản quyền.');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload ảnh bìa
            const coverImageUrl = await uploadImageToCloudinary(coverImageUri);

            // 2. Upload ảnh bản quyền (nếu có)
            let copyrightImageUrl = null;
            if (hasCopyright && copyrightImageUri) {
                copyrightImageUrl = await uploadImageToCloudinary(copyrightImageUri);
            }

            const newBookRef = push(ref(db, 'Books'));
            const newBookId = newBookRef.key;

            const newBookData = {
                Id: newBookId,
                Title: title,
                Author: author,
                UploaderId: user.uid,
                UploaderName: userInfo?.Username || "Ẩn danh",
                Description: removeHTMLTags(description),
                GenreId: genreId,
                CoverImage: coverImageUrl,
                IsApproved: false,
                IsVIP: isVIP,
                Price: isVIP ? parseInt(price) || 0 : 0,
                Views: 0,
                Status: "Chưa duyệt",
                PublishedDate: new Date().toISOString(),
                UpdatedAt: new Date().toISOString(),

                // ✨ THÊM DỮ LIỆU BẢN QUYỀN MỚI
                HasCopyright: hasCopyright, // true/false
                PublisherName: hasCopyright ? publisherName : null,
                CopyrightExpiration: hasCopyright ? copyrightExpiration : null,
                CopyrightImage: copyrightImageUrl, // URL Cloudinary hoặc null
            };

            await set(newBookRef, newBookData);

            Alert.alert('Thành công', 'Sách đã được đăng tải và đang chờ duyệt!');
            // Reset form
            setTitle('');
            setAuthor('');
            setDescription('');
            setCoverImageUri(null);
            setIsVIP(false);
            setPrice('');
            setHasCopyright(false); // Reset Bản quyền
            setPublisherName('');
            setCopyrightExpiration('');
            setCopyrightImageUri(null);

            if (genres.length > 0) setGenreId(genres[0].id);

        } catch (error) {
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đăng tải Sách</Text>
            </View>

            {loading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.overlayText}>Đang xử lý...</Text>
                </View>
            )}

            <View style={styles.formSection}>
                <Text style={styles.label}>Tiêu đề sách:</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nhập tiêu đề sách" />

                <Text style={styles.label}>Tên tác giả:</Text>
                <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="Nhập tên tác giả" />

                <Text style={styles.label}>Mô tả:</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Mô tả tóm tắt về sách"
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>Thể loại:</Text>
                {genres.length > 0 ? (
                    <View style={styles.pickerContainer}>
                        <Picker selectedValue={genreId} onValueChange={(itemValue) => setGenreId(itemValue)} style={styles.picker}>
                            {genres.map((genre) => (
                                <Picker.Item key={genre.id} label={genre.Name} value={genre.id} />
                            ))}
                        </Picker>
                    </View>
                ) : (
                    <Text style={styles.infoText}>Đang tải thể loại...</Text>
                )}

                <Text style={styles.label}>Ảnh bìa:</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    {coverImageUri ? (
                        <Image source={{ uri: coverImageUri }} style={styles.coverImagePreview} />
                    ) : (
                        <Ionicons name="image-outline" size={50} color="#ccc" />
                    )}
                    <Text style={styles.imagePickerText}>Chọn ảnh bìa</Text>
                </TouchableOpacity>

                {/* VIP toggle + giá */}
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Sách VIP:</Text>
                    <Switch value={isVIP} onValueChange={setIsVIP} thumbColor={isVIP ? "#3498db" : "#ccc"} />
                </View>

                {isVIP && (
                    <View>
                        <Text style={styles.label}>Giá (xu):</Text>
                        <TextInput
                            style={styles.input}
                            value={price}
                            onChangeText={setPrice}
                            placeholder="Nhập giá xu"
                            keyboardType="numeric"
                        />
                    </View>
                )}
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Loại sách:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: hasCopyright ? '#777' : '#3498db', fontWeight: 'bold' }}>Tự viết</Text>
                        <Switch
                            value={hasCopyright}
                            onValueChange={setHasCopyright}
                            thumbColor={hasCopyright ? "#3498db" : "#ccc"}
                            trackColor={{ false: "#ccc", true: "#3498db" }}
                            style={{ marginHorizontal: 10 }}
                        />
                        <Text style={{ color: hasCopyright ? '#3498db' : '#777', fontWeight: 'bold' }}>Có bản quyền</Text>
                    </View>
                </View>

                {hasCopyright && (
                    <View style={styles.copyrightSection}>
                        <Text style={styles.label}>Tên Nhà xuất bản:</Text>
                        <TextInput
                            style={styles.input}
                            value={publisherName}
                            onChangeText={setPublisherName}
                            placeholder="Ví dụ: NXB Văn học"
                        />

                        <Text style={styles.label}>Hạn bản quyền (Nếu có):</Text>
                        <TextInput
                            style={styles.input}
                            value={copyrightExpiration}
                            onChangeText={setCopyrightExpiration}
                            placeholder="Ví dụ: 31/12/2030 hoặc 'Vĩnh viễn'"
                        />

                        <Text style={styles.label}>Ảnh chứng minh bản quyền:</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={pickCopyrightImage}>
                            {copyrightImageUri ? (
                                <Image source={{ uri: copyrightImageUri }} style={styles.coverImagePreview} />
                            ) : (
                                <Ionicons name="document-attach-outline" size={50} color="#ccc" />
                            )}
                            <Text style={styles.imagePickerText}>Chọn ảnh Giấy chứng nhận/Hợp đồng</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadBook}>
                    <Text style={styles.uploadButtonText}>Đăng tải Sách</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default DangTaiSach;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 15, paddingHorizontal: 15,
        borderBottomWidth: 1, borderBottomColor: '#eee',
        paddingTop: Platform.OS === 'ios' ? 40 : 15,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10,
    },
    overlayText: { color: '#fff', marginTop: 10, fontSize: 16 },
    formSection: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
    picker: { height: 50, width: '100%' },
    imagePickerButton: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
        padding: 20, alignItems: 'center', justifyContent: 'center',
        marginBottom: 15, height: 150,
    },
    coverImagePreview: { width: '100%', height: '100%', borderRadius: 8, resizeMode: 'contain' },
    imagePickerText: { marginTop: 10, color: '#555', fontSize: 14 },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    uploadButton: { backgroundColor: '#3498db', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    infoText: { fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 15 },
});
