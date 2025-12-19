import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from './ThemeContext';
import { getAuth } from 'firebase/auth';

const Thongtin = () => {
    const navigation = useNavigation();
    const { theme, setTheme, colors } = useContext(ThemeContext);
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    // Corrected: Directly use navigation.navigate
    const navigateToScreen = (screenName) => {
        navigation.navigate(screenName);
    };

    return (

        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
                {['light', 'dark', 'cream'].map((t) => (
                    <TouchableOpacity key={t} onPress={() => setTheme(t)} style={{ marginHorizontal: 10 }}>
                        <Text style={{ color: theme === t ? 'blue' : colors.text, fontWeight: theme === t ? 'bold' : 'normal' }}>
                            {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Kem'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chung</Text>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('HoSo')}>
                        <Text style={styles.listItemText}>Hồ sơ</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('TaiKhoan')}>
                        <Text style={styles.listItemText}>Tài khoản</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('Thongbao')}>
                        <Text style={styles.listItemText}>Thông báo</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.listItem}
                        onPress={() =>
                            navigation.navigate('TrangCaNhan', { userId: currentUserId })
                        }
                    >
                        <Text style={styles.listItemText}>Trang cá nhân</Text>
                    </TouchableOpacity>



                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Riêng tư & Bảo mật</Text>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('ThietLapNoiDung')}>
                        <Text style={styles.listItemText}>Thiết lập nội dung</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('TaiKhoanBiDung')}>
                        <Text style={styles.listItemText}>Tài khoản đã bị dừng tương tác</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('TaiKhoanBiChan')}>
                        <Text style={styles.listItemText}>Tài khoản đã bị chặn</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Đăng ký</Text>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('NapXu')}>
                        <Text style={styles.listItemText}>Nạp xu</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.listItem}
                        onPress={() => navigateToScreen('Taikhoanthanhtoan')}
                    >
                        <Text style={styles.listItemText}>Cập nhật tài khoản PayPal</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>

                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Khác</Text>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('Xephang')}>
                        <Text style={styles.listItemText}>Bảng xếp hạng</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('MoiBanBe')}>
                        <Text style={styles.listItemText}>Mời bạn bè</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.listItem} onPress={() => navigateToScreen('Dangnhap')}>
                        <Text style={styles.listItemText}>Đăng xuất</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color="gray" />
                    </TouchableOpacity>
                </View>
            </ScrollView >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    section: {
        paddingHorizontal: 15,
        paddingTop: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    listItemText: {
        fontSize: 16,
        color: '#333',
    },
});

export default Thongtin;
