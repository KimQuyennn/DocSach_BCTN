import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dangky from './Manhinh/Dangky';
import Dangnhap from './Manhinh/Dangnhap';
import Home from './Manhinh/Home';
import QuenMatKhau from './Manhinh/Quenmatkhau';
import Chitiet from './Manhinh/Chitiet';
import Thongtin from './Manhinh/Thongtin';
import HoSo from './Manhinh/HoSo';
import TimKiem from './Manhinh/TimKiem';
import ThuVien from './Manhinh/ThuVien';
import DocSach from './Manhinh/DocSach';
import TaiKhoan from './Manhinh/TaiKhoan';
import DangTaiSach from './Manhinh/DangTaiSach';
import Write from './Manhinh/Write';
import Quanly from './Manhinh/Quanly';
import Themchuong from './Manhinh/Themchuong';
import Choduyet from './Manhinh/Choduyet';
import Thongbao from './Manhinh/Thongbao';
import NapXu from './Manhinh/NapXu';
import MuaKhungAvatar from './Manhinh/MuaKhungAvatar';
import AvatarWithFrame from './Manhinh/AvatarWithFrame';
import TrangCaNhan from './Manhinh/TrangCaNhan';
import { TaoThongBao } from './Manhinh/TaoThongBao';
import { ThemeProvider } from './Manhinh/ThemeContext';
import ChitietOff from './Manhinh/ChitietOff';
import DocSachOff from './Manhinh/DocSachOff';
import ChatBox from './Manhinh/ChatBox';
import CaidatDoc from './Manhinh/CaidatDoc';
import Taikhoanthanhtoan from './Manhinh/Taikhoanthanhtoan';
import Xephang from './Manhinh/Xephang';
import Suachuong from './Manhinh/Suachuong';
import Suasach from './Manhinh/Suasach';
import QuanLyChuong from './Manhinh/QuanLyChuong';
import Tracuu from './Manhinh/Tracuu';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          // headerStyle: {
          //   backgroundColor: '#000',
          // },
          headerTintColor: 'Black',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center'
        }}>
          {/* <Stack.Screen name="Dangnhap" component={Dangnhap} options={{ title: 'Đăng nhập' }} /> */}
          <Stack.Screen name="Dangnhap" component={Dangnhap} options={{ headerShown: false }} />
          <Stack.Screen name="Dangky" component={Dangky} options={{ headerShown: false }} />
          <Stack.Screen name="Quenmatkhau" component={QuenMatKhau} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="Chitiet" component={Chitiet} options={{ title: 'Chi tiết sách' }} />
          <Stack.Screen name="Thongtin" component={Thongtin} options={{ title: 'Thông tin cá nhân' }} />
          <Stack.Screen name="HoSo" component={HoSo} options={{ title: 'Hồ sơ' }} />
          <Stack.Screen name="TimKiem" component={TimKiem} options={{ title: 'Tìm kiếm' }} />
          <Stack.Screen name="ThuVien" component={ThuVien} options={{ title: 'Thư viện' }} />
          <Stack.Screen name="DocSach" component={DocSach} options={{ headerShown: false }} />
          <Stack.Screen name="TaiKhoan" component={TaiKhoan} options={{ headerShown: false }} />
          <Stack.Screen name="DangTaiSach" component={DangTaiSach} options={{ headerShown: false }} />
          <Stack.Screen name="Write" component={Write} options={{ title: 'Quản lý' }} />
          <Stack.Screen name="Quanly" component={Quanly} options={{ title: 'Quản lý' }} />
          <Stack.Screen name="Themchuong" component={Themchuong} options={{ title: 'Thêm chương' }} />
          <Stack.Screen name="Choduyet" component={Choduyet} options={{ title: 'Chờ duyệt' }} />
          <Stack.Screen name="Thongbao" component={Thongbao} options={{ title: 'Thông báo' }} />
          <Stack.Screen name="NapXu" component={NapXu} options={{ title: 'Nạp xu' }} />
          <Stack.Screen name="MuaKhungAvatar" component={MuaKhungAvatar} options={{ title: 'Mua khung ảnh đại diện' }} />
          <Stack.Screen name="AvatarWithFrame" component={AvatarWithFrame} options={{ title: 'Khung ảnh' }} />
          <Stack.Screen name="TrangCaNhan" component={TrangCaNhan} options={{ title: 'Trang cá nhân' }} />
          <Stack.Screen name="TaoThongBao" component={TaoThongBao} options={{ title: 'Tạo thông báo' }} />
          <Stack.Screen name="ChitietOff" component={ChitietOff} options={{ title: 'Chi tiết sách' }} />
          <Stack.Screen name="DocSachOff" component={DocSachOff} options={{ title: 'Đọc sách ngoại tuyến' }} />
          <Stack.Screen name="ChatBox" component={ChatBox} options={{ title: 'Nhắn với nhà quản trị' }} />
          <Stack.Screen name="CaidatDoc" component={CaidatDoc} options={{ title: 'Cài đặt màn hình đọc sách' }} />
          <Stack.Screen name="Taikhoanthanhtoan" component={Taikhoanthanhtoan} options={{ title: 'Tài khoản thanh toán' }} />
          <Stack.Screen name="Xephang" component={Xephang} options={{ title: 'Bảng xếp hạng' }} />
          <Stack.Screen name="Suasach" component={Suasach} options={{ title: 'Sửa sách' }} />
          <Stack.Screen name="Suachuong" component={Suachuong} options={{ title: 'Sửa chương' }} />
          <Stack.Screen name="QuanLyChuong" component={QuanLyChuong} options={{ title: 'Quản lý chương' }} />
          <Stack.Screen name="Tracuu" component={Tracuu} options={{ title: 'Tra cứu' }} />
        </Stack.Navigator>
      </NavigationContainer></ThemeProvider>
  );
}
