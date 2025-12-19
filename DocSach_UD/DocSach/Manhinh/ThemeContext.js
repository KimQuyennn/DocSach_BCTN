import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const colorScheme = Appearance.getColorScheme(); // 'light' | 'dark'
    const [theme, setTheme] = useState(colorScheme); // default theo hệ thống

    const colorsMap = {
        light: {
            background: '#f2f5f8',
            sectionBackground: '#fff',
            text: '#333',
            border: '#e0e0e0',
            icon: 'gray',
        },
        dark: {
            background: '#121212',
            sectionBackground: '#1e1e1e',
            text: '#fff',
            border: '#333',
            icon: '#ccc',
        },
        cream: {
            background: '#fff8e7',
            sectionBackground: '#fff2d7',
            text: '#333',
            border: '#f0d9b5',
            icon: 'gray',
        },
    };

    // Lắng nghe khi người dùng thay đổi theme hệ thống
    useEffect(() => {
        const listener = ({ colorScheme }) => {
            if (theme !== 'cream') { // chỉ update nếu không đang dùng kem
                setTheme(colorScheme);
            }
        };
        const subscription = Appearance.addChangeListener(listener);

        return () => subscription.remove();
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors: colorsMap[theme] }}>
            {children}
        </ThemeContext.Provider>
    );
};
