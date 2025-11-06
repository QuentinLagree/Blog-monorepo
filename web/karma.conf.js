module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    files: [{ pattern: './src/app/styles.scss' }, { pattern: './src/test.ts', watched: false }],
    client: {
      clearContext: false // laisse Jasmine affiché dans le navigateur
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome', 'Firefox'],
    restartOnFileChange: true
  });
};
