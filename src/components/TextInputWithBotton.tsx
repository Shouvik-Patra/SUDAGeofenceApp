import React, {FC, useState, useRef, useEffect} from 'react';
import {
  View,
  TextInput as Input,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleSheet,
} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  normalize,
  verticalScale,
} from '@utils/orientation';
import {Colors, Fonts} from '@app/themes';

interface TextInputWithButtonProps {
  show?: boolean; // Added this prop
  marginLeft?: number;
  marginTop?: number;
  maxLength?: number;
  isSecure?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
  placeholderTextColor?: string;
  keyboardType?: KeyboardTypeOptions;
  value?: string;
  onChangeText?: (text: string) => void;
  color?: string;
  letterSpacing?: number;
  numberOfLines?: number;
  fontSize?: number;
  editable?: boolean;
  borderColor?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  onPress?: () => void;
  search?: boolean;
  borderRadius?: number;
  borderRadiusLeftRadius?: number;
  borderBottomRadiusRightRadius?: number;
  icon?: any;
  iconleft?: any;
  iconright?: any;
  fontFamily?: string;
  backgroundColor?: string;
  width?: string | number;
  height?: number;
  marginBottom?: number;
  borderWidth?: number;
  leftIcon?: string;
  rightIcon?: string;
  isleftIconVisible?: boolean;
  isRightIconVisible?: boolean;
  textInputLeft?: number;
  textColor?: string;
  doller?: boolean;
  elevation?: number;
  shadowRadius?: number;
  shadowOpacity?: number;
  shadowOffset?: {width: number; height: number};
  shadowColor?: string;
  viewbordercolor?: string;
  rightimage?: ImageSourcePropType;
  leftimage?: ImageSourcePropType;
  rightimageheight?: number;
  rightimagewidth?: number;
  leftimageheight?: number;
  leftimagewidth?: number;
  isheadertext?: boolean;
  headertext?: string;
  headertxtcolor?: string;
  headertxtsize?: number;
  tintColor?: string;
  borderBottomColor?: string;
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  activeOpacity?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  caretHidden?: boolean;
  borderRadiusRightRadius?: number;
  focus?: boolean;
  onRightPress?: () => void;
  InputHeaderText?: string;
  inputWidth?: string | number;
  inputheight?: number;
  textMargin?: number;
  returnKeyType?: ReturnKeyTypeOptions;
  secureTextEntry?: boolean;
  paddingLeft?: number; // Added this prop as well since it's used in your usage
}

const TextInputWithButton: FC<TextInputWithButtonProps> = ({
  show = true, // Added default value
  alignItems = 'center',
  activeOpacity = 1,
  shadowColor = '',
  shadowOffset = undefined,
  shadowRadius = 0,
  shadowOpacity = 0,
  elevation = 0,
  marginTop = 0,
  maxLength = 100000,
  isSecure = false,
  multiline = false,
  numberOfLines = 100,
  autoCapitalize = 'none',
  placeholder = '',
  placeholderTextColor = Colors.lightGrey,
  keyboardType = 'default',
  value = '',
  onChangeText,
  color = Colors.black,
  editable = true,
  borderColor = '#DDDDDD',
  onFocus,
  onBlur,
  letterSpacing = 0,
  fontSize = normalize(12),
  textAlign = 'left',
  caretHidden = false,
  borderRadius = moderateScale(5),
  icon,
  iconleft,
  borderBottomColor,
  fontFamily = Fonts.MulishRegular,
  fontWeight = '400',
  backgroundColor = Colors.white,
  search = false,
  width = '100%',
  height = normalize(42),
  borderRadiusRightRadius = moderateScale(10),
  borderBottomRadiusRightRadius = moderateScale(10),
  marginBottom = moderateScale(15),
  borderWidth = 0,
  leftIcon = '',
  rightIcon = '',
  isleftIconVisible = false,
  isRightIconVisible = false,
  textInputLeft = 0,
  textColor = Colors.black,
  doller = false,
  rightimageheight = normalize(20),
  rightimagewidth = normalize(20),
  leftimageheight = normalize(20),
  leftimagewidth = normalize(20),
  isheadertext = false,
  headertxtcolor = '#848484',
  headertxtsize = normalize(8),
  onPress,
  onRightPress,
  focus,
  InputHeaderText,
  inputWidth,
  inputheight,
  textMargin,
  returnKeyType,
  secureTextEntry,
  rightimage,
  tintColor,
  paddingLeft = 0, // Added default value
  ...props
}) => {
  const inputRef = useRef<Input>(null);
  const [blurview, setBlurview] = useState<boolean>(false);
  const [headerTaxt, setHeaderTaxt] = useState<boolean>(false);

  const handleChangeText = (text: string): void => {
    text.length > 0 ? setHeaderTaxt(true) : setHeaderTaxt(false);

    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handlePress = (): void => {
    if (onPress) {
      onPress();
    }
  };

  const handleRightPress = (): void => {
    if (onRightPress) {
      onRightPress();
    }
  };

  useEffect(() => {
    if (focus === true) {
      Platform.OS === 'ios'
        ? inputRef.current?.focus()
        : setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [focus]);

  // Don't render if show is false
  if (!show) {
    return null;
  }

  const containerStyle = {
    backgroundColor,
    borderRadius,
    alignItems: 'flex-start' as const,
    justifyContent: 'center' as const,
    borderColor: Colors.skyblue,
    borderWidth: moderateScale(1),
    marginTop,
    width: inputWidth,
    zIndex: 99,
    paddingVertical: verticalScale(2),
  };

  const innerViewStyle = {
    flexDirection: 'row' as const,
    width,
    height,
    borderWidth,
    borderColor,
    borderRadius,
    ...(borderBottomColor && { borderBottomColor }),
    paddingHorizontal: horizontalScale(5),
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  };

  const headerTextStyle: StyleProp<TextStyle> = {
    color: Colors.skyblue,
    fontSize: normalize(10),
    fontFamily: Fonts.MulishRegular,
    marginTop: verticalScale(10),
    marginLeft: horizontalScale(5),
    marginBottom: Platform.OS === 'ios' ? verticalScale(5) : verticalScale(-5),
  };

  const inputStyle: StyleProp<TextStyle> = {
    height: inputheight,
    marginTop: textMargin,
    paddingLeft: paddingLeft || textInputLeft, // Use paddingLeft if provided
    textAlign,
    letterSpacing,
    color: textColor,
    marginLeft: horizontalScale(5),
    fontFamily: Fonts.MulishRegular,
    fontSize,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
    marginBottom: verticalScale(8),
    top: headerTaxt ? 0 : 5,
    width: '100%',
  };

  const rightImageStyle: StyleProp<ImageStyle> = {
    marginRight: horizontalScale(1),
    width: rightimageheight,
    height: rightimagewidth,
    tintColor,
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={activeOpacity}
        style={containerStyle as StyleProp<ViewStyle>}>
        <View style={innerViewStyle as StyleProp<ViewStyle>}>
          <View style={styles.inputContainer}>
            {headerTaxt && (
              <Text style={headerTextStyle}>
                {InputHeaderText}
              </Text>
            )}
            <Input
              ref={inputRef}
              style={inputStyle}
              maxLength={maxLength}
              multiline={multiline}
              returnKeyType={returnKeyType}
              numberOfLines={numberOfLines}
              autoCapitalize={autoCapitalize}
              placeholder={placeholder}
              editable={editable}
              spellCheck={false}
              placeholderTextColor={Colors.tintGrey}
              textAlignVertical="top"
              keyboardType={keyboardType}
              value={value}
              onChangeText={handleChangeText}
              onBlur={() => {
                setBlurview(false);
                if (onBlur) onBlur();
              }}
              onFocus={() => {
                setBlurview(true);
                if (onFocus) onFocus();
              }}
              secureTextEntry={secureTextEntry}
            />
          </View>
          {isRightIconVisible && (
            <TouchableOpacity onPress={handleRightPress} style={styles.rightIconWrapper}>
              <Image
                source={rightimage}
                resizeMode="contain"
                style={rightImageStyle}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </>
  );
};

export default TextInputWithButton;

const styles = StyleSheet.create({
  inputContainer: {
    width: '85%',
  },
  rightIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});