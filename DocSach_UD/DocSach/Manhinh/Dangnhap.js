// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth, db } from '../firebase';
// import { ref, get, update, push } from 'firebase/database'; // push để tạo notification

// const { width, height } = Dimensions.get('window');

// const Dangnhap = () => {
//     const [usernameOrEmail, setUsernameOrEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigation = useNavigation();

//     const handleDangNhap = async () => {
//         if (!usernameOrEmail || !password) {
//             Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập hoặc email và mật khẩu.');
//             return;
//         }

//         setLoading(true);
//         try {
//             let email = usernameOrEmail;
//             const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
//             let userInfo = null;

//             // Nếu nhập username, tìm email trong DB
//             if (!emailRegex.test(usernameOrEmail)) {
//                 const usersRef = ref(db, 'Users');
//                 const snapshot = await get(usersRef);
//                 email = null;
//                 snapshot.forEach((child) => {
//                     const userData = child.val();
//                     if (userData.Username === usernameOrEmail) {
//                         email = userData.Email;
//                         userInfo = { id: child.key, ...userData }; // lưu cả key
//                     }
//                 });
//                 if (!email) {
//                     Alert.alert('Lỗi', 'Không tìm thấy tài khoản với tên đăng nhập này.');
//                     setLoading(false);
//                     return;
//                 }
//             }

//             // Đăng nhập bằng email
//             const userCredential = await signInWithEmailAndPassword(auth, email, password);
//             const user = userCredential.user;
//             const userId = user.uid;

//             // Lấy thông tin user nếu chưa có
//             if (!userInfo) {
//                 const userRef = ref(db, `Users/${userId}`);
//                 const snapshot = await get(userRef);
//                 userInfo = { id: userId, ...snapshot.val() };
//             }

//             // Kiểm tra block 30 ngày
//             if (userInfo.isBlock) {
//                 const blockedAt = userInfo.blockedAt || 0;
//                 const now = Date.now();
//                 const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

//                 if (now - blockedAt < THIRTY_DAYS) {
//                     // còn hạn block → hiển thị alert
//                     Alert.alert(
//                         'Tài khoản bị chặn',
//                         'Tài khoản của bạn đang bị chặn. Vui lòng thử lại sau khi hết hạn 30 ngày.'
//                     );

//                     // Tạo thông báo trong app
//                     const notiRef = ref(db, `Notifications/${userId}`);
//                     await push(notiRef, {
//                         title: "Bạn đã bị chặn!",
//                         message: "Tài khoản của bạn đang bị admin chặn trong 30 ngày.",
//                         type: "block_user",
//                         createdAt: Date.now(),
//                         read: false
//                     });

//                     setLoading(false);
//                     return;
//                 } else {
//                     // hết hạn block → mở lại tự động
//                     const userRef = ref(db, `Users/${userId}`);
//                     await update(userRef, { isBlock: false, blockedAt: null });
//                     userInfo.isBlock = false;
//                 }
//             }

//             // Cập nhật LastLogin
//             await update(ref(db, `Users/${userId}`), {
//                 LastLogin: new Date().toISOString()
//             });

//             setLoading(false);
//             navigation.replace('Home', { userId: userId, userInfo: userInfo });

//         } catch (error) {
//             console.error("Lỗi đăng nhập:", error);
//             let errorMessage = 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin đăng nhập.';
//             if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
//                 errorMessage = 'Không tìm thấy người dùng với email hoặc tên đăng nhập này.';
//             } else if (error.code === 'auth/wrong-password') {
//                 errorMessage = 'Mật khẩu không đúng.';
//             } else if (error.code === 'auth/network-request-failed') {
//                 errorMessage = "Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn.";
//             } else if (error.code === 'auth/too-many-requests') {
//                 errorMessage = "Tài khoản của bạn đã bị khóa tạm thời do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau.";
//             }
//             Alert.alert('Lỗi', errorMessage);
//             setLoading(false);
//         }
//     };

//     return (
//         <View style={styles.container}>
//             <View style={styles.header}>
//                 <Text style={styles.title}>Đăng nhập</Text>
//             </View>
//             <View style={styles.formContainer}>
//                 <TextInput
//                     style={styles.input}
//                     placeholder="Tên đăng nhập hoặc Email"
//                     onChangeText={setUsernameOrEmail}
//                     value={usernameOrEmail}
//                     placeholderTextColor="#b0b0b0"
//                     autoCapitalize="none"
//                 />
//                 <TextInput
//                     style={styles.input}
//                     placeholder="Mật khẩu"
//                     secureTextEntry
//                     onChangeText={setPassword}
//                     value={password}
//                     placeholderTextColor="#b0b0b0"
//                 />
//                 <TouchableOpacity style={styles.loginButton} onPress={handleDangNhap} disabled={loading}>
//                     <Text style={styles.loginButtonText}>
//                         {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
//                     </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     style={styles.registerButton}
//                     onPress={() => navigation.navigate('Dangky')}
//                 >
//                     <Text style={styles.registerButtonText}>
//                         Chưa có tài khoản? <Text style={{ fontWeight: 'bold' }}>Đăng ký</Text>
//                     </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                     style={styles.forgotPasswordButton}
//                     onPress={() => navigation.navigate('Quenmatkhau')}
//                 >
//                     <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
//                 </TouchableOpacity>
//             </View>
//             <View style={styles.footer}>
//                 <Text style={styles.footerText}>
//                     Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của chúng tôi.
//                 </Text>
//             </View>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' },
//     header: { marginBottom: height * 0.05 },
//     title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50' },
//     formContainer: { width: '90%', alignItems: 'center' },
//     input: { width: '100%', padding: 15, marginBottom: 15, backgroundColor: 'white', borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
//     loginButton: { width: '100%', padding: 15, backgroundColor: '#00c853', borderRadius: 8, alignItems: 'center', marginTop: 10 },
//     loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
//     registerButton: { marginTop: 20 },
//     registerButtonText: { color: '#7f8c8d', fontSize: 16 },
//     forgotPasswordButton: { marginTop: 10 },
//     forgotPasswordText: { color: '#3498db', fontSize: 16 },
//     footer: { marginTop: height * 0.1, paddingHorizontal: 20, alignItems: 'center' },
//     footerText: { fontSize: 12, color: '#95a5a6', textAlign: 'center' },
// });

// export default Dangnhap;


import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
    Image
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, get, update, push } from 'firebase/database';

const { width, height } = Dimensions.get('window');

const Dangnhap = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const handleDangNhap = async () => {
        if (!usernameOrEmail || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên đăng nhập hoặc email và mật khẩu.');
            return;
        }

        try {
            setLoading(true);
            let email = usernameOrEmail;
            const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
            let userInfo = null;

            // Nếu nhập username
            if (!emailRegex.test(usernameOrEmail)) {
                const usersRef = ref(db, 'Users');
                const snapshot = await get(usersRef);
                email = null;
                snapshot.forEach((child) => {
                    const userData = child.val();
                    if (userData.Username === usernameOrEmail) {
                        email = userData.Email;
                        userInfo = { id: child.key, ...userData };
                    }
                });

                if (!email) {
                    Alert.alert('Lỗi', 'Không tìm thấy tài khoản với tên đăng nhập này.');
                    setLoading(false);
                    return;
                }
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid;

            // Lấy user info nếu chưa có
            if (!userInfo) {
                const userRef = ref(db, `Users/${userId}`);
                const snapshot = await get(userRef);
                userInfo = { id: userId, ...snapshot.val() };
            }

            // Kiểm tra block 30 ngày
            if (userInfo.isBlock) {
                const blockedAt = userInfo.blockedAt || 0;
                if (Date.now() - blockedAt < 30 * 24 * 60 * 60 * 1000) {
                    Alert.alert('Tài khoản bị chặn', 'Vui lòng thử lại khi hết hạn 30 ngày.');
                    await push(ref(db, `Notifications/${userId}`), {
                        title: "Bạn đã bị chặn",
                        message: "Tài khoản của bạn đang bị chặn trong 30 ngày.",
                        createdAt: Date.now(),
                        read: false
                    });
                    setLoading(false);
                    return;
                } else {
                    await update(ref(db, `Users/${userId}`), {
                        isBlock: false,
                        blockedAt: null
                    });
                }
            }

            // Update last login
            await update(ref(db, `Users/${userId}`), {
                LastLogin: new Date().toISOString()
            });

            setLoading(false);

            navigation.replace("Home", { userId: userId, userInfo: userInfo });

        } catch (error) {
            console.log(error);
            Alert.alert("Lỗi", "Sai tài khoản hoặc mật khẩu.");
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Ảnh minh họa */}
            <Image
                source={{ uri: "https://play-lh.googleusercontent.com/iaMmX7wQJ4Bl7NkscBJ4U7gD3Gi7EGh8WFML9BR7xCoBiVa8nVw4C3eoS0Ck0yIIJw" }}
                style={styles.topImage}
                resizeMode="contain"
            />

            {/* Card Login */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Chào mừng trở lại!</Text>
                <Text style={styles.subtitle}>Đăng nhập để tiếp tục đọc sách</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Tên đăng nhập hoặc Email"
                    placeholderTextColor="#aaa"
                    onChangeText={setUsernameOrEmail}
                    value={usernameOrEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu"
                    secureTextEntry
                    placeholderTextColor="#aaa"
                    onChangeText={setPassword}
                    value={password}
                />

                <TouchableOpacity style={styles.loginButton} onPress={handleDangNhap}>
                    <Text style={styles.loginButtonText}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Quenmatkhau')}>
                    <Text style={styles.forgot}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Dangky')}>
                    <Text style={styles.register}>
                        Chưa có tài khoản? <Text style={styles.registerBold}>Đăng ký ngay</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffffff",
        alignItems: "center",
    },

    topImage: {
        width: width * 0.8,
        height: height * 0.25,
        marginTop: 40,
    },

    card: {
        width: "90%",
        backgroundColor: "white",
        padding: 20,
        marginTop: 10,
        borderRadius: 15,
        elevation: 5,
    },

    cardTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#2c3e50",
        textAlign: "center",
        marginBottom: 5,
    },

    subtitle: {
        textAlign: "center",
        color: "#7f8c8d",
        marginBottom: 20,
    },

    input: {
        width: "100%",
        backgroundColor: "#f0f0f0ff",
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 16,
    },

    loginButton: {
        backgroundColor: "#00c853",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10
    },

    loginButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },

    forgot: {
        marginTop: 12,
        color: "#3498db",
        textAlign: "center",
        fontSize: 16,
    },

    register: {
        marginTop: 15,
        textAlign: "center",
        color: "#555",
        fontSize: 16,
    },

    registerBold: {
        fontWeight: "bold",
        color: "#2c3e50",
    }
});

export default Dangnhap;
