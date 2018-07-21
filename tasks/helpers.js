
module.exports = {
  offlineBuild: process.argv.indexOf("--offline-build") !== -1,
  forceWrapperGeneration: process.argv.indexOf("--force-wrapper-generation") !== -1
};
