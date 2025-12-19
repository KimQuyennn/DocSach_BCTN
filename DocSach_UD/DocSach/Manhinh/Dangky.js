import { View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { app } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function Dangky() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const navigation = useNavigation();

    const dangKy = async () => {
        if (!email || !password || !username) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            const auth = getAuth(app);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const db = getDatabase(app);
            await set(ref(db, 'Users/' + user.uid), {
                Username: username,
                Email: email,
                Avatar: 'https://th.bing.com/th/id/OIP.vg41yG82qw84ziz5nS-CWQHaHa?rs=1&pid=ImgDetMain',
                Role: 'User',
                CreatedAt: new Date().toISOString(),
                LastLogin: new Date().toISOString(),
                PasswordHash: password
            });

            Alert.alert('Thành công', 'Đăng ký thành công!');
            navigation.replace('Dangnhap');
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Lỗi', 'Email đã được sử dụng. Vui lòng dùng email khác.');
            } else {
                Alert.alert('Lỗi', error.message);
            }
            console.error(error);
        }
    };

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#f5f5f5',
            justifyContent: 'center',
            padding: 20
        }}>

            {/* Nút quay lại */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                    position: 'absolute',
                    top: 40,
                    left: 20,
                    backgroundColor: 'white',
                    padding: 8,
                    borderRadius: 50,
                    elevation: 5,
                }}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={{
                backgroundColor: 'white',
                padding: 25,
                borderRadius: 15,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5
            }}>
                <Text style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 25
                }}>
                    Đăng ký
                </Text>

                <TextInput
                    placeholder="Tên đăng nhập"
                    onChangeText={setUsername}
                    value={username}
                    style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 15,
                        backgroundColor: '#fafafa'
                    }}
                />

                <TextInput
                    placeholder="Email"
                    onChangeText={setEmail}
                    value={email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 15,
                        backgroundColor: '#fafafa'
                    }}
                />

                <TextInput
                    placeholder="Mật khẩu"
                    secureTextEntry
                    onChangeText={setPassword}
                    value={password}
                    style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 20,
                        backgroundColor: '#fafafa'
                    }}
                />

                <TouchableOpacity
                    style={{
                        backgroundColor: '#007AFF',
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: 'center'
                    }}
                    onPress={dangKy}
                >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        Đăng ký
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
