import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export default function ThongKeDocSach({ route }) {
    const { userId } = route.params;
    const [logs, setLogs] = useState([]);

    /* =====================
       LOAD LOG ĐỌC SÁCH
    ====================== */
    useEffect(() => {
        if (!userId) return;

        const logsRef = ref(db, 'ReadingLogs');
        const unsub = onValue(logsRef, snap => {
            const data = snap.val() || {};
            const userLogs = Object.values(data)
                .filter(l => l.UserId === userId && l.Duration >= 15);

            setLogs(userLogs);
        });

        return () => unsub();
    }, [userId]);

    /* =====================
       TỔNG THỜI GIAN
    ====================== */
    const totalSeconds = useMemo(() => {
        return logs.reduce((sum, l) => sum + l.Duration, 0);
    }, [logs]);

    const totalMinutes = Math.floor(totalSeconds / 60);

    /* =====================
       THEO NGÀY
    ====================== */
    const timeByDate = useMemo(() => {
        const map = {};
        logs.forEach(l => {
            if (!l.Date) return;
            map[l.Date] = (map[l.Date] || 0) + l.Duration;
        });
        return map;
    }, [logs]);

    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = Math.floor((timeByDate[today] || 0) / 60);

    /* =====================
       THEO SÁCH
    ====================== */
    const timeByBook = useMemo(() => {
        const map = {};
        logs.forEach(l => {
            map[l.BookId] = (map[l.BookId] || 0) + l.Duration;
        });
        return map;
    }, [logs]);

    /* =====================
       THÀNH TÍCH
    ====================== */
    const achievements = useMemo(() => {
        const list = [];
        if (totalSeconds >= 3600) list.push('📘 Đọc trên 1 giờ');
        if (totalSeconds >= 5 * 3600) list.push('📚 Đọc trên 5 giờ');
        if (Object.keys(timeByDate).length >= 7) list.push('🔥 Đọc 7 ngày liên tiếp');
        return list;
    }, [totalSeconds, timeByDate]);

    /* =====================
       UI
    ====================== */
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📊 Thống kê đọc sách</Text>

            <View style={styles.card}>
                <Text style={styles.label}>⏱ Tổng thời gian đọc</Text>
                <Text style={styles.value}>{totalMinutes} phút</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>📅 Hôm nay</Text>
                <Text style={styles.value}>{todayMinutes} phút</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>🗓 Theo ngày</Text>
                {Object.entries(timeByDate).map(([d, t]) => (
                    <Text key={d} style={styles.row}>
                        {d}: {Math.floor(t / 60)} phút
                    </Text>
                ))}
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>📚 Theo sách</Text>
                {Object.entries(timeByBook).map(([b, t]) => (
                    <Text key={b} style={styles.row}>
                        {b.slice(0, 8)}... : {Math.floor(t / 60)} phút
                    </Text>
                ))}
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>🏆 Thành tích</Text>
                {achievements.length === 0
                    ? <Text>Chưa có</Text>
                    : achievements.map((a, i) => (
                        <Text key={i} style={styles.achievement}>{a}</Text>
                    ))
                }
            </View>
        </ScrollView>
    );
}

/* =====================
   STYLE
====================== */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2', padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    label: { color: '#666' },
    value: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
    row: { marginTop: 4 },
    achievement: { marginTop: 6 }
});
