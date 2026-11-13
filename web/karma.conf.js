module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter')
    ],
    client: {
      clearContext: false // laisse Jasmine affiché dans le navigateur
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome', 'Firefox'],
    restartOnFileChange: true
  });
};
