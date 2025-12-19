// TaoThongBao.js
import { getDatabase, ref, push } from "firebase/database";

/**
 * Tạo thông báo cho 1 user
 * @param {string} userId  - id của người nhận thông báo
 * @param {string} title   - tiêu đề thông báo
 * @param {string} message - nội dung thông báo
 * @param {string} type    - loại thông báo (gift_coin, recharge, buy_book…)
 */
export const TaoThongBao = async (userId, title, message, type) => {
    try {
        const db = getDatabase();
        const notiRef = ref(db, `Notifications/${userId}`);

        await push(notiRef, {
            title,
            message,
            type,              // gift_coin, recharge, buy_book…
            createdAt: Date.now(),
            read: false       // CHƯA ĐỌC => hiển thị dấu đỏ
        });

        return true;
    } catch (error) {
        console.log("Lỗi tạo thông báo:", error);
        return false;
    }
};
