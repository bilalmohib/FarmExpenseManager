/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#ed2024';
const tintColorDark = '#ed2024';

export const Colors = {
  light: {
    text: '#000',
    background: '#f1f1f1',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: '#ed2024',
    secondary: '#006937',
    success: '#006937',
    error: '#ed2024',
    warning: '#FFA500',
    info: '#006937',
    card: '#fff',
    border: '#e5e5e5',
    notification: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#ed2024',
    secondary: '#006937',
    success: '#006937',
    error: '#ed2024',
    warning: '#FFA500',
    info: '#006937',
    card: '#1c1c1e',
    border: '#2c2c2e',
    notification: tintColorDark,
  },
};
