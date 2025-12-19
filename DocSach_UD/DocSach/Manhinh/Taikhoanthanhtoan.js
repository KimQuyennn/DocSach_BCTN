import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { getDatabase, ref, update, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";

export default function Taikhoanthanhtoan() {
    const [paypalEmail, setPaypalEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const auth = getAuth(app);
    const user = auth.currentUser;
    const db = getDatabase(app);

    useEffect(() => {
        if (user) {
            const userRef = ref(db, `Users/${user.uid}/paypalEmail`);
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    setPaypalEmail(snapshot.val());
                }
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!paypalEmail) {
            Alert.alert("Lỗi", "Vui lòng nhập email tài khoản PayPal.");
            return;
        }
        try {
            setLoading(true);
            const userRef = ref(db, `Users/${user.uid}`);
            await update(userRef, { paypalEmail });
            Alert.alert("Thành công", "Đã lưu tài khoản PayPal!");
        } catch (error) {
            console.error(error);
            Alert.alert("Lỗi", "Không thể lưu tài khoản PayPal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Email tài khoản PayPal:</Text>
            <TextInput
                style={styles.input}
                placeholder="Nhập email PayPal"
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Đang lưu..." : "Cập nhật tài khoản"}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff", justifyContent: "center" },
    label: { fontSize: 16, marginBottom: 10 },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 20 },
    button: { backgroundColor: "#0070ba", padding: 14, borderRadius: 10, alignItems: "center" },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
