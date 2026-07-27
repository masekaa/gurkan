// Config plugin: set the Android on-device app label to the branded Turkish
// name ("İyiKiRandevu") WITHOUT putting the dotted İ in `expo.name`.
//
// Why: Expo prebuild mis-derives the Android Kotlin package from `expo.name`
// when the name contains the Turkish dotted capital İ (U+0130), producing a
// `package com.iyikirandevu` that mismatches the real namespace
// `com.altin100.app` and breaks R/BuildConfig resolution (compileReleaseKotlin
// fails). So `expo.name` stays ASCII ("IyiKiRandevu") and we override the
// user-facing app label here via strings.xml.
const { withStringsXml, AndroidConfig } = require('@expo/config-plugins');

const DISPLAY_NAME = 'İyiKiRandevu';

module.exports = function withAndroidAppName(config) {
  return withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ _: DISPLAY_NAME, $: { name: 'app_name', translatable: 'false' } }],
      cfg.modResults,
    );
    return cfg;
  });
};
