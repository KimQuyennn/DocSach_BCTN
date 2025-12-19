// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Platform, ScrollView } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { getDatabase, ref, onValue } from 'firebase/database';
// import { app } from '../firebase';
// import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// const TimKiem = () => {
//     const [searchText, setSearchText] = useState('');
//     const [genres, setGenres] = useState([]);
//     const [showAllGenres, setShowAllGenres] = useState(true); // Biến này không được sử dụng, có thể loại bỏ nếu không cần
//     const [searchResults, setSearchResults] = useState([]);
//     const [selectedGenre, setSelectedGenre] = useState(null);

//     const db = getDatabase(app);
//     const genresRef = ref(db, 'Genres');
//     const booksRef = ref(db, 'Books');
//     const navigation = useNavigation(); // Khởi tạo hook navigation
//     const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

//     const toggleGenreDropdown = () => {
//         setIsGenreDropdownOpen(!isGenreDropdownOpen);
//     };

//     useEffect(() => {
//         const unsubscribeGenres = onValue(genresRef, (snapshot) => {
//             const data = snapshot.val();
//             if (data) {
//                 const genresArray = Object.entries(data).map(([id, genre]) => ({
//                     ...genre,
//                     Id: id,
//                 }));
//                 setGenres(genresArray);
//             } else {
//                 setGenres([]);
//             }
//         });

//         return () => unsubscribeGenres();
//     }, [db]);

//     const handleGenreSelect = useCallback((genreId) => {
//         // Nếu chọn lại thể loại đang được chọn, bỏ chọn
//         if (selectedGenre === genreId) {
//             setSelectedGenre(null);
//         } else {
//             setSelectedGenre(genreId);
//         }
//     }, [selectedGenre]);

//     // `toggleShowAllGenres` không được sử dụng, có thể loại bỏ nếu không cần
//     // const toggleShowAllGenres = () => {
//     //     setShowAllGenres(!showAllGenres);
//     // };

//     const displayedGenres = useMemo(() => {
//         return genres;
//     }, [genres]);

//     const renderGenreTab = useCallback(({ item }) => {
//         const isSelected = selectedGenre === item.Id;
//         return (
//             <TouchableOpacity
//                 style={[
//                     styles.genreTab,
//                     isSelected && styles.selectedGenreTab,
//                 ]}
//                 key={item.Id.toString()}
//                 onPress={() => handleGenreSelect(item.Id)}
//             >
//                 <Text style={[styles.genreText, isSelected && styles.selectedGenreText]}>{item.Name}</Text>
//             </TouchableOpacity>
//         );
//     }, [selectedGenre, handleGenreSelect]);

//     useEffect(() => {
//         const unsubscribeBooks = onValue(booksRef, (snapshot) => {
//             const data = snapshot.val();
//             if (data) {
//                 const booksArray = Object.entries(data).map(([id, book]) => ({
//                     ...book,
//                     Id: id,
//                 }));

//                 // Lọc sách chỉ hiển thị những sách đã được duyệt (IsApproved: true)
//                 let filteredBooks = booksArray.filter(book => book.IsApproved === true);

//                 if (selectedGenre) {
//                     filteredBooks = filteredBooks.filter(book => book.GenreId === selectedGenre);
//                 }

//                 if (searchText) {
//                     const searchTextLower = searchText.toLowerCase();
//                     filteredBooks = filteredBooks.filter(book =>
//                         book.Title.toLowerCase().includes(searchTextLower) ||
//                         (book.Author && book.Author.toLowerCase().includes(searchTextLower))
//                     );
//                 }
//                 setSearchResults(filteredBooks);
//             } else {
//                 setSearchResults([]);
//             }
//         });
//         return () => unsubscribeBooks();
//     }, [searchText, selectedGenre]); // Thêm `booksRef` vào dependency array nếu bạn muốn nó lắng nghe thay đổi của `booksRef`

//     const renderSearchResultItem = useCallback(({ item }) => {
//         return (
//             <TouchableOpacity
//                 style={styles.searchResultItem}
//                 onPress={() => navigation.navigate('Chitiet', { bookId: item.Id })}
//             >
//                 <Image
//                     source={{ uri: item.CoverImage || 'https://via.placeholder.com/150' }}
//                     style={styles.bookCoverImage}
//                 />
//                 <View style={styles.bookInfo}>
//                     <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
//                         <Text style={styles.bookTitle} numberOfLines={2}>{item.Title}</Text>
//                         {item.IsVIP && (
//                             <Ionicons
//                                 name="star-outline"
//                                 size={18}
//                                 color="gold"
//                                 style={{ marginLeft: 5 }}
//                             />
//                         )}
//                     </View>
//                     <Text style={styles.bookAuthor} numberOfLines={1}>
//                         Tác giả: {item.Author || 'Đang cập nhật'}
//                     </Text>
//                     <Text style={styles.bookDescription} numberOfLines={3}>
//                         {item.Description ? item.Description.replace(/<[^>]*>/g, '') : 'Không có mô tả.'}
//                     </Text>
//                 </View>
//             </TouchableOpacity>
//         );
//     }, [navigation]);


//     return (
//         <View style={styles.container}>
//             <View style={styles.searchBar}>
//                 <Ionicons name="search" size={24} color="gray" style={styles.searchIcon} />
//                 <TextInput
//                     style={styles.searchInput}
//                     placeholder="Tìm sách theo tên hoặc tác giả"
//                     value={searchText}
//                     onChangeText={setSearchText}
//                 />
//             </View>

//             <View style={styles.dropdownContainer}>
//                 <TouchableOpacity
//                     style={styles.dropdownHeader}
//                     onPress={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
//                 >
//                     <Text style={styles.dropdownHeaderText}>
//                         {selectedGenre
//                             ? genres.find(g => g.Id === selectedGenre)?.Name
//                             : 'Chọn thể loại'}
//                     </Text>
//                     <Ionicons
//                         name={isGenreDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
//                         size={20}
//                         color="#333"
//                     />
//                 </TouchableOpacity>

//                 {isGenreDropdownOpen && (
//                     <View style={styles.dropdownList}>
//                         <ScrollView style={{ maxHeight: 200 }}>
//                             {displayedGenres.map((item) => {
//                                 const isSelected = selectedGenre === item.Id;
//                                 return (
//                                     <TouchableOpacity
//                                         key={item.Id.toString()}
//                                         style={[styles.dropdownItem, isSelected && styles.selectedDropdownItem]}
//                                         onPress={() => {
//                                             handleGenreSelect(item.Id);
//                                             setIsGenreDropdownOpen(false);
//                                         }}
//                                     >
//                                         <Text style={[styles.dropdownItemText, isSelected && styles.selectedDropdownItemText]}>
//                                             {item.Name}
//                                         </Text>
//                                     </TouchableOpacity>
//                                 );
//                             })}
//                         </ScrollView>
//                     </View>
//                 )}
//             </View>


//             <FlatList
//                 data={searchResults}
//                 renderItem={renderSearchResultItem}
//                 keyExtractor={(item) => item.Id.toString()}
//                 style={styles.searchResultsContainer}
//                 ListEmptyComponent={() => (
//                     <Text style={styles.placeholderText}>
//                         {searchText || selectedGenre ? 'Không tìm thấy kết quả.' : 'Nhập từ khóa hoặc chọn thể loại để tìm kiếm.'}
//                     </Text>
//                 )}
//             />
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff',
//         paddingTop: Platform.OS === 'ios' ? 40 : 20, // Thêm padding top an toàn cho iOS
//     },
//     searchBar: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginHorizontal: 15,
//         marginBottom: 10,
//         backgroundColor: '#f0f0f0',
//         borderRadius: 25,
//         paddingHorizontal: 15,
//         height: 50,
//     },
//     searchIcon: {
//         marginRight: 10,
//     },
//     searchInput: {
//         flex: 1,
//         fontSize: 16,
//     },
//     genreTabsContainer: {
//         marginBottom: 15,
//     },
//     flatListContent: {
//         paddingHorizontal: 15,
//     },
//     genreTab: {
//         backgroundColor: '#f0f0f0',
//         borderRadius: 20,
//         paddingVertical: 8,
//         paddingHorizontal: 15,
//         marginRight: 10,
//         borderWidth: 1,
//         borderColor: '#e0e0e0',
//     },
//     genreText: {
//         fontSize: 14,
//         color: '#333',
//         fontWeight: '500',
//     },
//     selectedGenreTab: {
//         backgroundColor: '#FF69B4', // Màu hồng tím tương tự Home.js
//         borderColor: '#FF69B4',
//     },
//     selectedGenreText: {
//         color: '#fff',
//         fontWeight: 'bold',
//     },
//     searchResultsContainer: {
//         flex: 1,
//         paddingHorizontal: 15,
//     },
//     placeholderText: {
//         fontSize: 16,
//         color: 'gray',
//         textAlign: 'center',
//         marginTop: 50,
//     },
//     searchResultItem: {
//         flexDirection: 'row',
//         paddingVertical: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee',
//         alignItems: 'center',
//     },
//     bookCoverImage: {
//         width: 80,
//         height: 120,
//         borderRadius: 8,
//         marginRight: 15,
//         resizeMode: 'cover',
//     },
//     bookInfo: {
//         flex: 1,
//     },
//     bookTitle: {
//         fontSize: 17,
//         fontWeight: 'bold',
//         color: '#222',
//         marginBottom: 5,
//     },
//     bookAuthor: {
//         fontSize: 13,
//         color: '#666',
//         marginBottom: 5,
//     },
//     bookDescription: {
//         fontSize: 12,
//         color: '#888',
//         lineHeight: 18,
//     },
//     searchIcon: { marginRight: 10 },
//     searchInput: { flex: 1, fontSize: 16 },
//     dropdownContainer: {
//         marginHorizontal: 15,
//         marginBottom: 10,
//     },
//     dropdownHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingVertical: 12,
//         paddingHorizontal: 15,
//         backgroundColor: '#f0f0f0',
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: '#ccc',
//     },
//     dropdownHeaderText: {
//         fontSize: 16,
//         color: '#333',
//     },
//     dropdownList: {
//         marginTop: 5,
//         borderWidth: 1,
//         borderColor: '#ccc',
//         borderRadius: 8,
//         backgroundColor: '#fff',
//         maxHeight: 200,
//     },
//     dropdownItem: {
//         paddingVertical: 10,
//         paddingHorizontal: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: '#eee',
//     },
//     dropdownItemText: {
//         fontSize: 14,
//         color: '#333',
//     },
//     selectedDropdownItem: {
//         backgroundColor: '#FF69B4',
//     },
//     selectedDropdownItemText: {
//         color: '#fff',
//         fontWeight: 'bold',
//     },
//     searchResultsContainer: {
//         flex: 1,
//         paddingHorizontal: 15,
//     },

// });

// export default TimKiem;


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const TimKiem = () => {
    const [searchText, setSearchText] = useState('');
    const [genres, setGenres] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [userResults, setUserResults] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [searchMode, setSearchMode] = useState('books'); // books | users
    const db = getDatabase(app);
    const genresRef = ref(db, 'Genres');
    const booksRef = ref(db, 'Books');
    const usersRef = ref(db, 'Users');
    const navigation = useNavigation();
    const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);

    useEffect(() => {
        const unsub = onValue(genresRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const genresArray = Object.entries(data).map(([id, genre]) => ({
                    ...genre,
                    Id: id,
                }));
                setGenres(genresArray);
            } else setGenres([]);
        });
        return () => unsub();
    }, []);

    const handleGenreSelect = useCallback((genreId) => {
        if (selectedGenre === genreId) setSelectedGenre(null);
        else setSelectedGenre(genreId);
    }, [selectedGenre]);

    const displayedGenres = useMemo(() => genres, [genres]);

    useEffect(() => {
        if (searchMode !== 'books') return;
        const unsub = onValue(booksRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return setSearchResults([]);
            const booksArray = Object.entries(data).map(([id, book]) => ({ ...book, Id: id }));
            let filtered = booksArray.filter(b => b.IsApproved === true);
            if (selectedGenre) filtered = filtered.filter(b => b.GenreId === selectedGenre);
            if (searchText) {
                const txt = searchText.toLowerCase();
                filtered = filtered.filter(b =>
                    b.Title.toLowerCase().includes(txt) ||
                    (b.Author && b.Author.toLowerCase().includes(txt))
                );
            }
            setSearchResults(filtered);
        });
        return () => unsub();
    }, [searchText, selectedGenre, searchMode]);

    useEffect(() => {
        if (searchMode !== 'users') return;
        const unsub = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return setUserResults([]);
            let usersArray = Object.entries(data).map(([id, user]) => ({ ...user, Id: id }));
            if (searchText) {
                const txt = searchText.toLowerCase();
                usersArray = usersArray.filter(u =>
                    u.Username?.toLowerCase().includes(txt) ||
                    u.Email?.toLowerCase().includes(txt)
                );
            }
            setUserResults(usersArray);
        });
        return () => unsub();
    }, [searchText, searchMode]);

    const renderSearchResultItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => navigation.navigate('Chitiet', { bookId: item.Id })}
        >
            <Image source={{ uri: item.CoverImage || 'https://via.placeholder.com/150' }} style={styles.bookCoverImage} />
            <View style={styles.bookInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{item.Title}</Text>
                    {item.IsVIP && <Ionicons name="star-outline" size={18} color="gold" style={{ marginLeft: 5 }} />}
                </View>
                <Text style={styles.bookAuthor} numberOfLines={1}>Tác giả: {item.Author || 'Đang cập nhật'}</Text>
                <Text style={styles.bookDescription} numberOfLines={3}>{item.Description ? item.Description.replace(/<[^>]*>/g, '') : 'Không có mô tả.'}</Text>
            </View>
        </TouchableOpacity>
    ), []);

    const renderUserItem = ({ item }) => (
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('TrangCaNhan', { userId: item.Id })}>
            <Image source={{ uri: item.Avatar || 'https://i.stack.imgur.com/l60Hf.png' }} style={styles.userAvatar} />
            <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.Username}</Text>
                <Text style={styles.email}>{item.Email}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={22} color="#888" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>

            {/* CHẾ ĐỘ TÌM KIẾM */}
            <View style={styles.modeSwitch}>
                <TouchableOpacity
                    style={[styles.modeButton, searchMode === 'books' && styles.modeButtonActive]}
                    onPress={() => setSearchMode('books')}
                >
                    <Text style={[styles.modeText, searchMode === 'books' && styles.modeTextActive]}>Tìm Sách</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.modeButton, searchMode === 'users' && styles.modeButtonActive]}
                    onPress={() => setSearchMode('users')}
                >
                    <Text style={[styles.modeText, searchMode === 'users' && styles.modeTextActive]}>Tìm Người Dùng</Text>
                </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={24} color="gray" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={searchMode === 'books' ? "Tìm sách theo tên hoặc tác giả" : "Nhập tên hoặc email người dùng"}
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            {/* DROPDOWN CHỈ HIỆN TRONG SÁCH */}
            {searchMode === 'books' && (
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}>
                        <Text style={styles.dropdownHeaderText}>{selectedGenre ? genres.find(g => g.Id === selectedGenre)?.Name : 'Chọn thể loại'}</Text>
                        <Ionicons name={isGenreDropdownOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color="#333" />
                    </TouchableOpacity>

                    {isGenreDropdownOpen && (
                        <View style={styles.dropdownList}>
                            <ScrollView style={{ maxHeight: 200 }}>
                                {displayedGenres.map((item) => {
                                    const isSelected = selectedGenre === item.Id;
                                    return (
                                        <TouchableOpacity key={item.Id.toString()} style={[styles.dropdownItem, isSelected && styles.selectedDropdownItem]} onPress={() => { handleGenreSelect(item.Id); setIsGenreDropdownOpen(false); }}>
                                            <Text style={[styles.dropdownItemText, isSelected && styles.selectedDropdownItemText]}>{item.Name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}

            {/* DANH SÁCH KẾT QUẢ */}
            <FlatList
                data={searchMode === 'books' ? searchResults : userResults}
                renderItem={searchMode === 'books' ? renderSearchResultItem : renderUserItem}
                keyExtractor={(item) => item.Id.toString()}
                contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 30 }}
                ListEmptyComponent={() => (
                    <Text style={styles.placeholderText}>Không có kết quả.</Text>
                )}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: Platform.OS === 'ios' ? 40 : 20 },

    // CHẾ ĐỘ TÌM KIẾM
    modeSwitch: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 },
    modeButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#eee', borderRadius: 25 },
    modeButtonActive: { backgroundColor: '#FF69B4' },
    modeText: { fontSize: 15, fontWeight: '500', color: '#333' },
    modeTextActive: { color: '#fff', fontWeight: 'bold' },

    // SEARCH
    searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginBottom: 10, backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, height: 50, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16 },

    // DROPDOWN
    dropdownContainer: { marginHorizontal: 15, marginBottom: 10 },
    dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    dropdownHeaderText: { fontSize: 16, color: '#333' },
    dropdownList: { marginTop: 5, borderRadius: 8, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    dropdownItemText: { fontSize: 14 },
    selectedDropdownItem: { backgroundColor: '#FF69B4' },
    selectedDropdownItemText: { color: '#fff', fontWeight: 'bold' },

    // BOOK ITEM
    searchResultItem: { flexDirection: 'row', padding: 15, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    bookCoverImage: { width: 80, height: 120, borderRadius: 8, marginRight: 15 },
    bookInfo: { flex: 1 },
    bookTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },
    bookAuthor: { fontSize: 13, color: '#666', marginBottom: 3 },
    bookDescription: { fontSize: 12, color: '#888', lineHeight: 18 },

    // USER ITEM
    userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    userAvatar: { width: 55, height: 55, borderRadius: 28, marginRight: 15 },
    username: { fontSize: 16, fontWeight: 'bold', color: '#222' },
    email: { fontSize: 14, color: '#666' },

    placeholderText: { textAlign: 'center', marginTop: 40, fontSize: 15, color: '#888' }
});

export default TimKiem;
