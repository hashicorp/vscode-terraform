var gulp = require('gulp');
var tslint = require('gulp-tslint');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var using = require('gulp-using');
var mkdirp = require('mkdirp');
var path = require('path');
var log = require('fancy-log');
var chalk = require('chalk');
var mocha = require('gulp-mocha');

var spawn = require('child_process').spawn;
var fs = require('fs');

var helpers = require('./tasks/helpers');

// load tasks
require("./tasks/auto-completion-data.task.js");

// generate hcl wrapper
gulp.task('generate-hcl-container', (done) => {
    var docker = spawn('docker', [
        'build',
        '-t', 'gopher-hcl-gopherjs',
        '-f', 'hcl-hil/gopherjs.Dockerfile',
        'hcl-hil'], { stdio: 'inherit' });

    docker
        .on('error', (err) => {
            // this is such a common question by first-time
            // committers so that we should handle it and
            // show a proper error message

            log.error(`${chalk.red('ERROR')}: Cannot launch "docker": ${chalk.bold(err)}.`);
            log.error(` ${chalk.yellow('INFO')}: Docker is required for building, you can install it from https://www.docker.com`);

            throw err;
        })
        .on('close', (code) => {
            if (code !== 0) {
                done(new Error(`docker failed with code ${code}`));
            } else {
                done();
            }
        });
});

gulp.task('generate-transpiled.js', gulp.series('generate-hcl-container', (done) => {
    var docker = spawn('docker', [
        'run',
        '--rm', 'gopher-hcl-gopherjs'
    ], { stdio: ['ignore', 'pipe', 'inherit'] });

    var stream = fs.createWriteStream('hcl-hil/transpiled.js', { flags: 'w+' });

    docker.stdout.pipe(stream);
    docker.on('close', (code) => {
        if (code !== 0) {
            done(new Error(`docker run gopher-hcl-gopherjs failed with code ${code}`));
        } else {
            done();
        }
    });
}));

gulp.task('create-output-directory', (done) => {
    mkdirp('out/src', done);
});

gulp.task('generate-closure-container', gulp.series('generate-transpiled.js', (done) => {
    var docker = spawn('docker', [
        'build',
        '-t', 'gopher-hcl-closure-compiler',
        '-f', 'hcl-hil/closure.Dockerfile',
        'hcl-hil'], { stdio: 'inherit' });

    docker.on('close', (code) => {
        if (code !== 0) {
            done(new Error(`docker failed with code ${code}`));
        } else {
            done();
        }
    });
}));

gulp.task('generate-hcl-hil.js', gulp.series('create-output-directory', 'generate-closure-container', (done) => {
    var docker = spawn('docker', [
        'run',
        '--rm', 'gopher-hcl-closure-compiler'
    ], { stdio: ['ignore', 'pipe', 'inherit'] });

    var stream = fs.createWriteStream('out/src/hcl-hil.js', { flags: 'w+' });

    docker.stdout.pipe(stream);
    docker.on('close', (code) => {
        if (code !== 0) {
            done(new Error(`docker run gopher-hcl-gopherjs failed with code ${code}`));
        } else {
            done();
        }
    });
}));

// copy autocompletion data
gulp.task('copy-autocompletion-data', () =>
    gulp.src('src/data/*.json')
        .pipe(using({ prefix: 'Bundling auto-completion data', filesize: true }))
        .pipe(gulp.dest('out/src/data'))
);

// copy templates
gulp.task('copy-html-templates', () =>
    gulp.src('src/ui/*.html')
        .pipe(using({ prefix: 'Bundling html templates', filesize: true }))
        .pipe(gulp.dest('out/src/ui'))
);

// tslint
gulp.task('lint', () =>
    gulp.src(['src/**/*.ts', 'test/**/*.ts'])
        .pipe(tslint())
        .pipe(tslint.report())
);

// compile
var project = ts.createProject('tsconfig.json');
gulp.task('compile', () =>
    project.src()
        .pipe(sourcemaps.init())
        .pipe(project())
        .pipe(sourcemaps.mapSources((sourcePath, file) => {
            let relativeLocation = path.join(path.relative(path.join('out', path.dirname(file.relative)), '.'), 'src/');
            let relativeLocationToFile = path.join(relativeLocation, sourcePath);
            return relativeLocationToFile;
        }))
        .pipe(sourcemaps.write('.', {
            includeContent: false
        }))
        .pipe(gulp.dest('out'))
);

// generate telemetry file (depend on copy-html-templates so that directory is created)
gulp.task('generate-constants-keyfile', gulp.series('create-output-directory', (done) => {
    let contents = {
        APPINSIGHTS_KEY: process.env.APPINSIGHTS_KEY
    };

    if (!contents.APPINSIGHTS_KEY) {
        if (process.env.CI || process.argv.indexOf("--require-appinsights-key") !== -1) {
            log.error(`${chalk.red('ERROR')}: AppInsights Key missing in CI build`);
            done(new Error("AppInsights Key missing in CI build, set APPINSIGHTS_KEY environment variable"));
        } else {
            log.warn(` ${chalk.yellow('WARN')}: AppInsights Key not bundled, this build will NOT emit metrics.`);
        }
    } else {
        log.info(` ${chalk.green('INFO')}: AppInsights Key bundled, this build will emit metrics`);
    }

    fs.writeFile('out/src/constants.json', JSON.stringify(contents), done);
}));

// unit tests
// WARNING: unit tests do not have good coverage yet, also run integration tests
function test() {
    return gulp.src(['test/**/*.unit.test.ts'], { read: false })
        .pipe(mocha({
            reporter: 'spec',
            ui: 'tdd',
            require: 'ts-node/register'
        }));
}

gulp.task(test);

gulp.task('test-no-fail', () => {
    return test()
        .on('error', (err) => {
            log.error(`${chalk.red('ERROR')}: ${err.message}`);
        });
});

// release notes
gulp.task('generate-release-notes', function generateReleaseNotes(done) {
    fs.readFile('./CHANGELOG.md', (err, data) => {
        if (err) {
            log.error(`${chalk.red('ERROR')}: could not read CHANGELOG.md: ${err}`);
            done(err);
        }

        const regex = new RegExp(/^# ([0-9]).([0-9]).([0-9]).*/);
        const lines = data.toString().split('\n');

        const firstHeaderLine = lines.findIndex((l) => l.match(regex));
        if (firstHeaderLine === -1) {
            log.error(`${chalk.red('ERROR')}: could not find first header`);
            done(new Error("could not find first header"));
        }

        const secondHeaderLine = lines.findIndex((l, index) => {
            return firstHeaderLine < index && l.match(regex);
        });

        fs.writeFile("out/LAST_RELEASE.md", lines.slice(firstHeaderLine, secondHeaderLine).join("\n"), (err) => {
            if (err) {
                log.error(`${chalk.red('ERROR')}: could not write out/LAST_RELEASE.md: ${err}`);
                done(err);
            } else {
                done();
            }
        });
    });
});

// figure if we want to skip hcl-hil.js generation
const hclJsAlreadyBuilt = fs.existsSync("out/src/hcl-hil.js");
const skipHclHilJs = helpers.offlineBuild || (hclJsAlreadyBuilt && !helpers.forceWrapperGeneration);
if (skipHclHilJs) {
    log(`${chalk.yellow('INFO')}: skipping generation of hcl-hil.js, you can force generation using --force-wrapper-generation`);
}

// compile
gulp.task('build',
    gulp.series(
        skipHclHilJs ? [] : ['generate-hcl-hil.js'],
        'copy-autocompletion-data',
        'copy-html-templates',
        'generate-constants-keyfile',
        'generate-release-notes',
        'compile'));

// watch
gulp.task('watch', gulp.series('build', () => {
    return gulp.watch(['src/**/*.ts', 'src/ui/*.html', 'test/**/*.ts'], gulp.series('copy-html-templates', 'lint', 'test-no-fail', 'compile'));
}));

// default
gulp.task('default', gulp.series('build', 'lint', 'test'));
