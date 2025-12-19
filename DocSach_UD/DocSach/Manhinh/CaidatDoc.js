import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fonts = ['Roboto', 'Times New Roman', 'Arial', 'Noto Serif'];
const textColors = ['#000000', '#FF0000', '#0000FF', '#008000'];
const backgroundColors = ['#FFFFFF', '#000000', '#F5DEB3', '#D3D3D3'];

const CaidatDoc = ({ content }) => {
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState('Roboto');
    const [textColor, setTextColor] = useState('#000000');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

    const [fontOpen, setFontOpen] = useState(false);
    const [textColorOpen, setTextColorOpen] = useState(false);
    const [bgColorOpen, setBgColorOpen] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedFontSize = await AsyncStorage.getItem('fontSize');
                const savedFontFamily = await AsyncStorage.getItem('fontFamily');
                const savedTextColor = await AsyncStorage.getItem('textColor');
                const savedBackgroundColor = await AsyncStorage.getItem('backgroundColor');

                if (savedFontSize) setFontSize(Number(savedFontSize));
                if (savedFontFamily) setFontFamily(savedFontFamily);
                if (savedTextColor) setTextColor(savedTextColor);
                if (savedBackgroundColor) setBackgroundColor(savedBackgroundColor);
            } catch (error) {
                console.log('Load settings error:', error);
            }
        };
        loadSettings();
    }, []);

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem('fontSize', fontSize.toString());
            await AsyncStorage.setItem('fontFamily', fontFamily);
            await AsyncStorage.setItem('textColor', textColor);
            await AsyncStorage.setItem('backgroundColor', backgroundColor);
            Alert.alert('Lưu cài đặt', 'Đã lưu cài đặt thành công!');
        } catch (error) {
            console.log('Save settings error:', error);
        }
    };

    const Dropdown = ({ label, data, selectedValue, open, setOpen, onSelect }) => (
        <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                onPress={() => setOpen(!open)}
                style={{ padding: 10, backgroundColor: '#ddd', borderRadius: 5 }}
            >
                <Text>{selectedValue}</Text>
            </TouchableOpacity>
            {open && (
                <View style={{ borderWidth: 1, borderColor: '#ccc', marginTop: 5, borderRadius: 5 }}>
                    {data.map(item => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => { onSelect(item); setOpen(false); }}
                            style={{ padding: 10 }}
                        >
                            <Text>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor }]}>
            <Text style={[styles.preview, { fontSize, fontFamily, color: textColor }]}>
                {content}
            </Text>

            <Dropdown
                label="Font chữ"
                data={fonts}
                selectedValue={fontFamily}
                open={fontOpen}
                setOpen={setFontOpen}
                onSelect={setFontFamily}
            />

            <View style={{ marginVertical: 10 }}>
                <Text style={styles.label}>Kích thước chữ: {fontSize}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setFontSize(prev => Math.max(12, prev - 1))}
                        style={styles.sizeButton}
                    >
                        <Text style={{ fontSize: 20 }}>-</Text>
                    </TouchableOpacity>
                    <Text style={{ marginHorizontal: 10, fontSize }}>{fontSize}</Text>
                    <TouchableOpacity
                        onPress={() => setFontSize(prev => Math.min(30, prev + 1))}
                        style={styles.sizeButton}
                    >
                        <Text style={{ fontSize: 20 }}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Dropdown
                label="Màu chữ"
                data={textColors}
                selectedValue={textColor}
                open={textColorOpen}
                setOpen={setTextColorOpen}
                onSelect={setTextColor}
            />

            <Dropdown
                label="Màu nền"
                data={backgroundColors}
                selectedValue={backgroundColor}
                open={bgColorOpen}
                setOpen={setBgColorOpen}
                onSelect={setBackgroundColor}
            />

            <View style={{ marginTop: 20 }}>
                <Button title="Lưu cài đặt" onPress={saveSettings} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    preview: { marginBottom: 20 },
    label: { fontWeight: 'bold', marginBottom: 5 },
    sizeButton: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: '#ddd',
        borderRadius: 5,
    },
});

export default CaidatDoc;
