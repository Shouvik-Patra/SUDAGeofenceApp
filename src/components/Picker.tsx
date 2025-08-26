import React, {ReactNode, useEffect, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import {normalize} from '@utils/orientation';
import {Colors} from '@themes/index';
import { isIos } from '@app/utils/helpers/Validation';
import { BlurView } from '@react-native-community/blur';

interface PickerProps {
  isVisible?: boolean;
  onBackdropPress?: () => void;
  children?: ReactNode;
  isVisibleBar?: boolean;
  radius?: number;
  height?: number;
  backgroundColor?: any;
  width?: any;
}

const Picker: React.FC<PickerProps> = ({
  isVisible = false,
  onBackdropPress,
  children,
  isVisibleBar = false,
  radius = normalize(18),
  height = normalize(150),
  backgroundColor = Colors.white,
  width = '100%',
}) => {
  const [isVisibleInternal, setIsVisibleInternal] = useState(isVisible);
  const blurOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      setIsVisibleInternal(true);
      Animated.timing(blurOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(blurOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsVisibleInternal(false));
    }
  }, [isVisible, blurOpacity]);

  if (!isVisibleInternal) return null;

  return (
    <Modal
      transparent
      visible={isVisibleInternal}
      animationType={'slide'}
      onRequestClose={() => {
        if (onBackdropPress) {
          onBackdropPress();
        }
      }}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (onBackdropPress) {
            onBackdropPress();
          }
        }}>
        <KeyboardAvoidingView 
        behavior='height'
        style={{
          flex: 1
        }}>
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.blur,
                {
                  opacity: blurOpacity,
                },
              ]}>
              <BlurView
                style={StyleSheet.absoluteFillObject}
                blurType="dark"
                blurAmount={2}
                reducedTransparencyFallbackColor="transparent"
              />
            </Animated.View>
            <View style={styles.main}>
              <View
                style={[
                  styles.content,
                  {
                    height,
                    borderTopLeftRadius: radius,
                    borderTopRightRadius: radius,
                    backgroundColor: backgroundColor,
                    width: width,
                  },
                ]}>
                {isVisibleBar && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: normalize(5),
                        width: normalize(65),
                        marginTop: normalize(10),
                        borderRadius: normalize(10),
                      },
                    ]}
                  />
                )}
                {children}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default Picker;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    paddingBottom: isIos() ? normalize(45) : 0,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  main: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 'auto',
  },
  content: {
    alignSelf: 'center',
  },
  bar: {
    backgroundColor: Colors.dark,
    alignSelf: 'center',
  },
});
