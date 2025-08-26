import React, {useRef} from 'react';
import {
  Text,
  ActivityIndicator,
  Image,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
  ImageStyle,
  Animated,
  Easing,
  DimensionValue,
} from 'react-native';
import {normalize} from '@app/utils/orientation';
import {isIos} from '@utils/helpers/Validation';
import { Colors, Fonts } from '@app/themes';
import { hexToRGB } from '@app/utils/helpers';

interface ButtonProps {
  height?: number;
  width?: string | number;
  activeBackgroundColor?: string;
  inactiveBackgroundColor?: string;
  borderRadius?: number;
  marginHorizontal?: number;
  textColor?: string;
  fontSize?: number;
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  fontFamily?: string;
  marginTop?: number;
  leftIcon?: number;
  rightIcon?: number;
  iconStyle?: StyleProp<ImageStyle>;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = props => {
  const {
    height = normalize(42),
    width = '95%',
    activeBackgroundColor = Colors.darkblue,
    inactiveBackgroundColor = hexToRGB(Colors.black, 0.8),
    borderRadius = normalize(9),
    textColor = Colors.white,
    fontSize = normalize(isIos() ? 15 : 13),
    marginHorizontal = normalize(10),
    title,
    onPress = () => {},
    isLoading = false,
    style,
    fontFamily = Fonts.MulishMedium,
    marginTop = normalize(14),
    leftIcon,
    rightIcon,
    iconStyle,
    disabled = false,
  } = props;

  const scale = useRef(new Animated.Value(1)).current;
  const backgroundColor = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 150,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(backgroundColor, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 150,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(backgroundColor, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished) {
        onPress();
      }
    });
  };

  const animatedScaleStyle = {
    flex: 1,
    transform: [{scale}],
    borderRadius,
  };

  const interpolatedBackgroundColor = backgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: [activeBackgroundColor, inactiveBackgroundColor],
  });

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      // onPress={onPress}
      style={[
        {
          width: (typeof width === 'number'
            ? width
            : `${width}`) as DimensionValue,
          height,
          marginTop,
          borderRadius,
        },
        style,
      ]}>
      {/* Wrapper for backgroundColor animation */}
      <Animated.View style={animatedScaleStyle}>
        {/* Wrapper for scale animation */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              backgroundColor: interpolatedBackgroundColor,
              borderRadius,
            },
          ]}>
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              {leftIcon && (
                <Image
                  source={leftIcon}
                  style={[styles.iconStyle, iconStyle]}
                />
              )}
              <Text
                style={[
                  {
                    fontFamily,
                    color: textColor,
                    fontSize,
                    marginHorizontal: marginHorizontal,
                  },
                ]}>
                {title}
              </Text>
              {rightIcon && (
                <Image
                  source={rightIcon}
                  style={[styles.iconStyle, iconStyle]}
                />
              )}
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  iconStyle: {
    height: normalize(18),
    width: normalize(18),
    resizeMode: 'contain',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export default Button;
