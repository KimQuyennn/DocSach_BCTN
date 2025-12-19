// 👇 Cấu hình Cloudinary
const CLOUDINARY_CLOUD_NAME = "dpde9onm3";
const CLOUDINARY_UPLOAD_PRESET = "anhdaidienbooknet";

// 👇 Hàm upload ảnh lên Cloudinary
export const uploadImageToCloudinary = async (uri, userId) => {
    try {
        const formData = new FormData();
        formData.append("file", {
            uri: uri,
            type: "image/jpeg",
            name: `book_cover_${userId}_${Date.now()}.jpg`,
        });
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        const data = await response.json();

        if (data.secure_url) {
            return data.secure_url;
        } else {
            console.error("❌ Lỗi phản hồi từ Cloudinary:", data);
            throw new Error(
                data.error?.message || "Không thể tải ảnh lên Cloudinary."
            );
        }
    } catch (error) {
        console.error("❌ Lỗi khi tải ảnh lên Cloudinary:", error);
        throw error;
    }
};
