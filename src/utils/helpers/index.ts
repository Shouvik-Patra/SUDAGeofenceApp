import { Platform } from 'react-native';


// Define the callback type for image responses
type ImageCallback = {
  uri: string;
  path: {
    name: string;
    type: string;
    uri: string;
  } | null;
};

// Define the input props type for the camera function
type ImagePickerProps = {
  isCrop?: boolean;
  callback: (res: ImageCallback) => void;
  size?: {
    width?: number;
    height?: number;
  };
  cropperCircleOverlay?: boolean;
};

type PickerImage = {
  path: string;
  mime: string;
};

// Utility function to format the image object
const formatImage = (image: PickerImage): ImageCallback['path'] => {
  const { path, mime } = image;
  const fileName = path.split('/').pop() || 'unknown';
  return {
    name: fileName,
    type: mime,
    uri: Platform.OS === 'android' ? path : path.replace('file://', ''),
  };
};


export function hexToRGB(
  hex: string,
  opacity: number = 1,
  defaultColor: string = 'red',
): string {
  let c: string[] | number;

  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = parseInt(c.join(''), 16);

    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(
      ',',
    )},${opacity})`;
  }

  return defaultColor;
}



