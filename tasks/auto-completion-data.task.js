//
// this file preprocesses the auto-completion data from vim-terraform-completion and bundles it
//

const gulp = require('gulp');
const mkdirp = require('mkdirp');
const path = require('path');
const log = require('fancy-log');
const download = require("gulp-download");
const decompress = require('gulp-decompress');
const merge = require('gulp-merge-json');
const transform = require('gulp-json-transform');

gulp.task('get-vim-terraform-completion-data', () => {
  const url = 'https://github.com/juliosueiras/vim-terraform-completion/archive/master.zip';

  return download(url)
    .pipe(decompress())
    .pipe(gulp.dest("out/tmp/vim-terraform-completion"));
});

gulp.task('copy-provider-data', gulp.series('get-vim-terraform-completion-data', () => {
  return gulp.src([
    'out/tmp/vim-terraform-completion/vim-terraform-completion-master/community_provider_json/**/*.json',
    'out/tmp/vim-terraform-completion/vim-terraform-completion-master/provider_json/**/*.json'
  ])
    .pipe(gulp.dest('out/src/data/providers'));
}));

gulp.task('create-provider-index', gulp.series('copy-provider-data', () => {
  return gulp.src('out/src/data/providers/**/*.json')
    .pipe(merge({
      fileName: 'provider-index.json',
      edit: (json, file) => {
        const dirSegments = path.dirname(file.path).split(path.sep);

        const providerName = path.basename(file.path, '.json');
        const providerVersion = dirSegments[dirSegments.length - 1];

        var result = {
          [providerName]: {
            versions: {
              [providerVersion]: {
                path: path.relative(file.base, file.path)
              }
            }
          }
        };

        for (const group of ['resources', 'datas', 'unknowns']) {
          result[providerName].versions[providerVersion][group] = Object.keys(json[group] || {});
        }

        return result;
      }
    }))
    .pipe(transform((data) => {
      // jshint loopfunc: true

      var all = { resources: {}, datas: {}, unknowns: {} };
      const providers = Object.keys(data);
      for (const provider of providers) {
        // 1. mark the latest version for quicker lookup

        const versions = Object.keys(data[provider].versions);
        if (versions.length === 1) {
          data[provider].latest = versions[0];
        } else if (versions.indexOf('master') !== -1) {
          data[provider].latest = 'master';
        } else {
          const parsedVersions = versions.map((v) => {
            const match = v.match(/v?([0-9]+)\.([0-9]+)(\.([0-9]+))?/);
            if (!match) {
              log(`Unparseable version ${v} for ${provider}`);
              return null;
            }

            return {
              sort: parseInt(match[1]) * 1000000 +
                parseInt(match[2]) * 1000 +
                parseInt(match[4] || 0),
              version: v
            };
          })
            .filter((v) => !!v)
            .sort((left, right) => {
              if (left.sort < right.sort)
                return -1;
              if (left.sort === right.sort)
                return 0;
              return 1;
            })
            .reverse();

          data[provider].latest = parsedVersions[0].version;
        }

        // 2. create a view of all resources
        for (const version of versions) {
          for (const group of Object.keys(all)) {
            for (const type of data[provider].versions[version][group]) {
              all[group][`${provider}_${type}`] = true;
            }
          }
        }
      }

      // create a view of all resources
      data.__views = { all: {} };
      for (const group of Object.keys(all)) {
        data.__views.all[group] = Object.keys(all[group]);
      }

      log(`Created provider autocompletion index for ${providers.length} providers`);
      return data;
    }))
    .pipe(gulp.dest('out/src/data'));
}));