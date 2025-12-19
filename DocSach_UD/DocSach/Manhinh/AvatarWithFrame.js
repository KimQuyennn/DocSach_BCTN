import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// avatarFramesList: danh sách tất cả khung, ví dụ [{ Id, ImageUrl, Name, Type, Price }]
// user: object user với Avatar, AvatarFrame (là ID của khung)
const AvatarWithFrame = ({ user, avatarFramesList, size = 50 }) => {
    if (!user) return null;

    // Lấy URL khung từ ID
    const frameUrl = avatarFramesList.find(
        frame => frame.Id === user.AvatarFrame
    )?.ImageUrl;

    return (
        <View style={[styles.avatarWrapper, { width: size, height: size }]}>
            {/* Ảnh avatar */}
            <Image
                source={{ uri: user.Avatar }}
                style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
            />

            {/* Overlay khung */}
            {frameUrl && (
                <Image
                    source={{ uri: frameUrl }}
                    style={[styles.avatarFrameImage, { width: size, height: size, borderRadius: size / 2 }]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    avatarWrapper: {
        position: 'relative', // cần để overlay hoạt động
    },
    avatarImage: {
        resizeMode: 'cover',
    },
    avatarFrameImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        resizeMode: 'contain', // hoặc 'cover' tùy khung
    },
});

export default AvatarWithFrame;
