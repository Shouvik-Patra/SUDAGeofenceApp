import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import enUS from '../translations/en-US.json';
import ar from '../translations/ar.json';

const resources = {
  enUS: {translation: enUS},
  ar: {translation: ar},
};

i18n.use(initReactI18next).init({
  resources,
  fallbackLng: 'enUS',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
// import i18n from 'i18next';
// import {initReactI18next} from 'react-i18next';
// import {getLocales} from 'react-native-localize';

// import enUS from '../translations/en-US.json';
// import ar from '../translations/ar.json';

// const locales = getLocales();
// const defaultLanguageCode = 'enUS';

// const resources = {
//   enUS: {translation: enUS},
//   ar: {translation: ar},
// };

// const languageCode =
//   locales?.length > 0 ? locales[0]?.languageCode : defaultLanguageCode;

// i18n.use(initReactI18next).init({
//   lng: languageCode,
//   resources,
//   fallbackLng: defaultLanguageCode,
//   interpolation: {
//     escapeValue: false,
//   },
// });

// export default i18n;
