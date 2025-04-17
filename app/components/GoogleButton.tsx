import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface GoogleButtonProps {
  onPress: () => void;
  loading: boolean;
  text: string;
}

const ICON_SIZE = 18;

const GoogleButton = ({ onPress, loading, text }: GoogleButtonProps) => {
  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#4285F4" />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
              {/* Blue segment */}
              <Path
                fill="#4285F4"
                d="M12 4.5c1.9 0 3.6 .65 4.95 1.93l3.7-3.7C17.94 .58 15.22 0 12 0c-4.73 0-8.75 3.17-10.75 7.05l3.83 3.17C6.05 6.67 8.78 4.5 12 4.5Z"
              />
              {/* Green segment */}
              <Path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.68-3.02C15.1 17.8 13.64 18.5 12 18.5c-3.22 0-5.95-2.17-6.92-5.07H1.25v3.17C3.25 20.83 7.27 24 12 24Z"
              />
              {/* Yellow segment */}
              <Path
                fill="#FBBC05"
                d="M5.08 14.43C4.83 13.54 4.83 12.46 5.08 11.57V8.4H1.25C0.45 10.04 0 11.97 0 14c0 2.03 .45 3.96 1.25 5.6l3.83-3.17Z"
              />
              {/* Red segment */}
              <Path
                fill="#EA4335"
                d="M23.5 12c0-0.84-.07-1.66-.21-2.47H12v4.69h6.35c-0.27 1.5-1.07 2.78-2.28 3.63v3.02h3.68c2.15-1.98 3.4-4.89 3.4-8.27Z"
              />
            </Svg>
          </View>
          <Text style={styles.buttonText}>{text}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 50,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#5f6368',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default GoogleButton;
