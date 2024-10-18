

import i18n, {InitOptions} from 'i18next';
import {initReactI18next} from 'react-i18next';

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const options: InitOptions = {
  fallbackLng: "en",
  debug: false,
  returnNull: false,
  interpolation: {
    escapeValue: false
  },
  backend: {
    loadPath: "/locales/{{lng}}.json",
  }
};

i18n.use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(options);

export default i18n;