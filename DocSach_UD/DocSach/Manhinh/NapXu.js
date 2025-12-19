// NapXu.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";

export default function NapXu() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const auth = getAuth(app);
    const user = auth.currentUser;
    //Nếu dùng Ngrok
    //const SERVER_URL = "https://bernadette-nonoccult-brecken.ngrok-free.dev/create-payment";
    // Nếu dùng render
    const SERVER_URL = "https://booknet-payments.onrender.com/create-payment";

    const presetAmounts = [1, 5, 10, 20, 50]; // USD

    const handleNapXu = async () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ (USD).");
            return;
        }

        if (!user) {
            Alert.alert("Lỗi", "Vui lòng đăng nhập trước khi nạp xu.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(SERVER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, userId: user?.uid }),
            });

            if (!response.ok) throw new Error(`Server trả về lỗi: ${response.status}`);

            const data = await response.json();

            if (data && data.paymentUrl) {
                Linking.openURL(data.paymentUrl).catch((err) => {
                    console.error("Không mở được URL:", err);
                    Alert.alert("Lỗi", "Không mở được trang thanh toán.");
                });
            } else {
                Alert.alert("Lỗi", "Không thể tạo liên kết thanh toán. Hãy thử lại sau.");
            }
        } catch (error) {
            console.error("Lỗi khi nạp xu:", error);
            Alert.alert("Lỗi", "Không thể kết nối máy chủ thanh toán.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Ionicons name="wallet-outline" size={80} color="#4CAF50" style={{ marginBottom: 20 }} />
            <Text style={styles.title}>Nạp xu Booknet</Text>
            <Text style={styles.subtitle}>1 USD = 100 xu</Text>
            <Text style={styles.subtitle}>Chọn số tiền hoặc nhập thủ công:</Text>

            {/* Nút chọn nhanh */}
            <View style={styles.presetContainer}>
                {presetAmounts.map((amt) => (
                    <TouchableOpacity
                        key={amt}
                        style={[styles.presetButton, amount == amt.toString() && styles.presetButtonActive]}
                        onPress={() => setAmount(amt.toString())}
                    >
                        <Text style={[styles.presetButtonText, amount == amt.toString() && styles.presetButtonTextActive]}>
                            {amt} USD
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input thủ công */}
            <TextInput
                style={styles.input}
                placeholder="Nhập số tiền USD"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />

            <TouchableOpacity style={styles.button} onPress={handleNapXu} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Thanh toán bằng PayPal</Text>}
            </TouchableOpacity>
        </ScrollView>

    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 10,
        textAlign: "center",
    },
    presetContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginVertical: 15,
    },
    presetButton: {
        backgroundColor: "#f0f0f0",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        margin: 5,
    },
    presetButtonActive: {
        backgroundColor: "#4CAF50",
    },
    presetButtonText: {
        color: "#333",
        fontSize: 16,
        fontWeight: "bold",
    },
    presetButtonTextActive: {
        color: "#fff",
    },
    input: {
        width: "80%",
        height: 50,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 25,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#0070ba",
        paddingVertical: 14,
        paddingHorizontal: 50,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
