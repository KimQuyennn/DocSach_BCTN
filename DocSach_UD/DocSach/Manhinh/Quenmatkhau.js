import { View, Text, TextInput, Button, Alert, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function Quenmatkhau({ navigation }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const guiEmailDatLaiMatKhau = async () => {
        try {
            if (!username || !email) {
                Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Username và Email');
                return;
            }

            const usersRef = ref(db, 'Users');
            const snapshot = await get(usersRef);
            let isValid = false;

            snapshot.forEach((child) => {
                const data = child.val();
                if (data.Username === username && data.Email === email) {
                    isValid = true;
                }
            });

            if (!isValid) {
                Alert.alert('Lỗi', 'Username và Email không khớp');
                return;
            }

            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);

            Alert.alert('Thành công', 'Đã gửi email đặt lại mật khẩu', [
                {
                    text: 'OK',
                    onPress: () => navigation.replace('Dangnhap'),
                },
            ]);
        } catch (err) {
            console.log(err);
            Alert.alert('Lỗi', 'Không thể gửi email đặt lại mật khẩu');
        }
    };

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#f5f5f5',
            justifyContent: 'center',
            padding: 20
        }}>

            {/* nút quay lại */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                    position: 'absolute',
                    top: 40,
                    left: 20,
                    backgroundColor: 'white',
                    padding: 8,
                    borderRadius: 50,
                    elevation: 5
                }}
            >
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={{
                backgroundColor: 'white',
                padding: 25,
                borderRadius: 15,
                elevation: 5
            }}>
                <Text style={{
                    fontSize: 26,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: 25
                }}>
                    Quên mật khẩu
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
                    onPress={guiEmailDatLaiMatKhau}
                    style={{
                        backgroundColor: '#FF5C5C',
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: 'center'
                    }}
                >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                        Gửi email đặt lại mật khẩu
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
