import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDatabase, ref, onValue, update, get } from 'firebase/database';
import { app } from '../firebase';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

// Hàm loại bỏ HTML tags (tương tự như trong DangTaiSach)
const removeHTMLTags = (text) => {
    if (!text) return "";
    return text.replace(/<[^>]*>/g, '');
};

const Suasach = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { bookId } = route.params;

    const db = getDatabase(app);
    const auth = getAuth(app);
    const user = auth.currentUser;

    const CLOUDINARY_CLOUD_NAME = 'dpde9onm3'; // Thay bằng cloud name của bạn
    const CLOUDINARY_UPLOAD_PRESET = 'anhdaidienbooknet'; // Thay bằng preset của bạn

    // State cho dữ liệu sách gốc
    const [originalBookData, setOriginalBookData] = useState(null);

    // State cho các trường chỉnh sửa
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [genreId, setGenreId] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState(null); // URL ảnh hiện tại (từ Firebase)
    const [newImageUri, setNewImageUri] = useState(null); // URI ảnh mới được chọn
    const [isVIP, setIsVIP] = useState(false);
    const [price, setPrice] = useState('0');
    const [isCompleted, setIsCompleted] = useState(false);

    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasCopyright, setHasCopyright] = useState(false); // Có bản quyền hay tự viết
    const [publisherName, setPublisherName] = useState(''); // Tên nhà xuất bản
    const [copyrightExpiration, setCopyrightExpiration] = useState(''); // Hạn bản quyền
    const [copyrightImageUrl, setCopyrightImageUrl] = useState(null); // URL ảnh bản quyền hiện tại (từ Firebase)
    const [newCopyrightImageUri, setNewCopyrightImageUri] = useState(null); // URI ảnh bản quyền mới được chọn

    // --- LOGIC LOAD DỮ LIỆU SÁCH HIỆN TẠI VÀ THỂ LOẠI ---
    useEffect(() => {
        if (!user) {
            Alert.alert('Lỗi', 'Bạn cần đăng nhập để sửa sách.');
            navigation.goBack();
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // 1. Tải chi tiết sách
                const bookRef = ref(db, `Books/${bookId}`);
                const snapshot = await get(bookRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setOriginalBookData(data);

                    // Điền dữ liệu vào các state
                    setTitle(data.Title || '');
                    setAuthor(data.Author || '');
                    setDescription(data.Description || '');
                    setGenreId(data.GenreId || (genres[0]?.id || ''));
                    setCoverImageUrl(data.CoverImage || null);
                    setPrice(String(data.Price || 0));
                    setIsVIP(data.IsVIP || false);
                    setIsCompleted(data.IsCompleted || false);
                    setHasCopyright(data.HasCopyright || false);
                    setPublisherName(data.PublisherName || '');
                    setCopyrightExpiration(data.CopyrightExpiration || '');
                    setCopyrightImageUrl(data.CopyrightImage || null);

                } else {
                    Alert.alert("Lỗi", "Không tìm thấy sách.");
                    navigation.goBack();
                }

                // 2. Tải danh sách thể loại (tương tự DangTaiSach)
                const genresRef = ref(db, 'Genres');
                onValue(genresRef, (snap) => {
                    const genreData = snap.val();
                    if (genreData) {
                        const loadedGenres = Object.keys(genreData).map(key => ({
                            id: key,
                            Name: genreData[key].Name
                        }));
                        setGenres(loadedGenres);
                        // Đảm bảo genreId vẫn là giá trị đã load hoặc đặt mặc định nếu chưa có
                        if (!genreId && loadedGenres.length > 0) {
                            setGenreId(loadedGenres[0].id);
                        }
                    } else {
                        setGenres([]);
                    }
                }, { onlyOnce: true }); // Tải thể loại chỉ một lần

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
                Alert.alert("Lỗi", "Không thể tải dữ liệu sách.");
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [bookId, db, user, navigation]);

    // --- LOGIC XỬ LÝ ẢNH (GIỐNG DANGTAISACH) ---

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
                return;
            }
        }

        try {
            let mediaTypesConfig = ImagePicker.MediaTypeOptions.Images; // Sử dụng tùy chọn hiện đại hơn

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypesConfig,
                allowsEditing: true,
                aspect: [2, 3],
                quality: 1,
            });

            if (!result.canceled) {
                // Lưu URI ảnh mới để hiển thị preview và chờ upload
                setNewImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn ảnh: ' + error.message);
        }
    };
    const pickCopyrightImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Quyền truy cập bị từ chối', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
                return;
            }
        }
        try {
            let mediaTypesConfig = ImagePicker.MediaTypeOptions.Images;
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaTypesConfig,
                allowsEditing: true,
                aspect: [16, 9], // Có thể dùng [16, 9] cho tài liệu
                quality: 1,
            });

            if (!result.canceled) {
                setNewCopyrightImageUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn ảnh bản quyền: ' + error.message);
        }
    };

    const uploadImageToCloudinary = async (uri, isCopyright = false) => {
        const formData = new FormData();
        formData.append('file', {
            uri: uri,
            type: 'image/jpeg',
            // Tên file sẽ khác nếu là ảnh bản quyền
            name: isCopyright
                ? `copyright_doc_${user.uid}_${Date.now()}.jpg`
                : `book_cover_${user.uid}_${Date.now()}.jpg`,
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
    };


    // --- HÀM XỬ LÝ CẬP NHẬT SÁCH ---
    const handleUpdateBook = async () => {
        if (!user) return;

        if (!title || !author || !description || !genreId) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin (trừ ảnh bìa).');
            return;
        }

        const numericPrice = isVIP ? (parseInt(price) || 0) : 0;
        if (isVIP && numericPrice <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập giá xu hợp lệ cho sách VIP.');
            return;
        }

        // ✨ VALIDATION BẢN QUYỀN MỚI
        if (hasCopyright && (!publisherName || !copyrightExpiration) && !newCopyrightImageUri && !copyrightImageUrl) {
            Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin (NXB, Hạn) và cung cấp ảnh chứng minh cho sách Bản quyền.');
            return;
        }


        setLoading(true);
        let finalCoverImageUrl = coverImageUrl;
        let finalCopyrightImageUrl = copyrightImageUrl; // Bắt đầu với URL bản quyền cũ

        try {
            // 1. UPLOAD ẢNH BÌA MỚI (nếu có)
            if (newImageUri) {
                Alert.alert("Đang xử lý", "Đang tải ảnh bìa mới lên Cloudinary...");
                finalCoverImageUrl = await uploadImageToCloudinary(newImageUri, false);
            }

            // 2. UPLOAD ẢNH BẢN QUYỀN MỚI (nếu có)
            if (newCopyrightImageUri) {
                Alert.alert("Đang xử lý", "Đang tải ảnh chứng minh bản quyền mới lên Cloudinary...");
                finalCopyrightImageUrl = await uploadImageToCloudinary(newCopyrightImageUri, true);
            }


            // 3. CẬP NHẬT DỮ LIỆU FIREBASE
            const bookRef = ref(db, `Books/${bookId}`);

            const updatedBookData = {
                Title: title,
                Author: author,
                Description: removeHTMLTags(description),
                GenreId: genreId,
                CoverImage: finalCoverImageUrl,
                IsApproved: false, // Quan trọng: Đặt lại trạng thái chờ duyệt
                Status: "Chờ duyệt lại",
                IsVIP: isVIP,
                Price: numericPrice,
                IsCompleted: isCompleted,
                UpdatedAt: new Date().toISOString(),

                // ✨ DỮ LIỆU BẢN QUYỀN MỚI
                HasCopyright: hasCopyright,
                PublisherName: hasCopyright ? publisherName : null,
                CopyrightExpiration: hasCopyright ? copyrightExpiration : null,
                CopyrightImage: finalCopyrightImageUrl,
            };

            await update(bookRef, updatedBookData);

            Alert.alert('Thành công', 'Sách đã được cập nhật và chuyển sang trạng thái chờ duyệt lại!');
            navigation.goBack();

        } catch (error) {
            console.error("Lỗi cập nhật sách:", error);
            Alert.alert('Lỗi', 'Đã có lỗi xảy ra trong quá trình cập nhật: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const imagePreviewSource = newImageUri ? { uri: newImageUri } : (coverImageUrl ? { uri: coverImageUrl } : null);

    if (loading && !originalBookData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF69B4" />
                <Text>Đang tải dữ liệu sách...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sửa Sách: {originalBookData?.Title}</Text>
            </View>

            {loading && originalBookData && ( // Loading overlay khi đang xử lý (tải ảnh/lưu data)
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.overlayText}>Đang cập nhật...</Text>
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

                <Text style={styles.label}>Ảnh bìa (Ảnh hiện tại/Ảnh mới):</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    {imagePreviewSource ? (
                        <Image source={imagePreviewSource} style={styles.coverImagePreview} />
                    ) : (
                        <Ionicons name="image-outline" size={50} color="#ccc" />
                    )}
                    <Text style={styles.imagePickerText}>{newImageUri ? "Đã chọn ảnh mới (Chạm để đổi)" : "Chạm để chọn ảnh bìa mới"}</Text>
                </TouchableOpacity>

                {/* Các trạng thái Boolean */}
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Đã hoàn thành (IsCompleted):</Text>
                    <Switch value={isCompleted} onValueChange={setIsCompleted} />
                </View>

                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Sách VIP (IsVIP):</Text>
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
                <View style={[styles.switchContainer, { marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 }]}>
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
                            {(newCopyrightImageUri || copyrightImageUrl) ? (
                                <Image source={{ uri: newCopyrightImageUri || copyrightImageUrl }} style={styles.coverImagePreview} />
                            ) : (
                                <Ionicons name="document-attach-outline" size={50} color="#ccc" />
                            )}
                            <Text style={styles.imagePickerText}>
                                {newCopyrightImageUri ? "Đã chọn ảnh mới (Chạm để đổi)" : (copyrightImageUrl ? "Ảnh hiện tại (Chạm để đổi)" : "Chạm để chọn ảnh chứng minh bản quyền")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={handleUpdateBook} disabled={loading}>
                    <Text style={styles.uploadButtonText}>Cập nhật Sách</Text>
                </TouchableOpacity>
            </View>
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

export default Suasach;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 15, paddingHorizontal: 15,
        borderBottomWidth: 1, borderBottomColor: '#eee',
        paddingTop: Platform.OS === 'ios' ? 40 : 15,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, flex: 1 },
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
        marginBottom: 15, height: 180, // Tăng chiều cao để xem ảnh tốt hơn
    },
    coverImagePreview: { width: '100%', height: '100%', borderRadius: 8, resizeMode: 'cover' },
    imagePickerText: { marginTop: 10, color: '#555', fontSize: 14, position: 'absolute', bottom: 5, backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 5, borderRadius: 3 },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    uploadButton: { backgroundColor: '#3498db', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    uploadButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    infoText: { fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 15 },
    copyrightSection: {
        paddingVertical: 10,
        marginTop: 5,
    },
});