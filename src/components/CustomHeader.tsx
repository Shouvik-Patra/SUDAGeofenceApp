import { Colors } from '@app/themes';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';

// Type definitions for the component props
interface CustomHeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  titleColor?: string;
  backButtonColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  elevation?: number;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  onBackPress,
  showBackButton = true,
  rightComponent,
  backgroundColor = '#2563eb',
  titleColor = '#ffffff',
  backButtonColor = '#ffffff',
  statusBarStyle = 'light-content',
  elevation = 4,
}) => {
  return (
    <>
      
      <View style={[
        styles.headerContainer,
        { backgroundColor, elevation }
      ]}>
        {/* Left Section - Back Button */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: backButtonColor }]}>
                ← Back
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section - Title */}
        <View style={styles.centerSection}>
          <Text 
            style={[styles.title, { color: titleColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>

        {/* Right Section - Custom Component */}
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: Platform.OS === 'ios' ? 60 : 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color:Colors.white
  },
});

export default CustomHeader;