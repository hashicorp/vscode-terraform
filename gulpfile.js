var gulp = require('gulp');
var tslint = require('gulp-tslint');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var using = require('gulp-using');
var mkdirp = require('mkdirp');
var path = require('path');
var log = require('fancy-log');

var spawn = require('child_process').spawn;
var fs = require('fs');

//
// generate hcl wrapper
//
gulp.task('generate-hcl-container', (done) => {
    var docker = spawn('docker', [
        'build',
        '-t', 'gopher-hcl-gopherjs',
        '-f', 'hcl-hil/gopherjs.Dockerfile',
        'hcl-hil'], { stdio: 'inherit' });

    docker.on('close', (code) => {
        if (code !== 0) {
            done(new Error(`docker failed with code ${code}`));
        } else {
            done();
        }
    });
});

gulp.task('generate-transpiled.js', ['generate-hcl-container'], (done) => {
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
});

gulp.task('create-output-directory', (done) => {
    mkdirp('out/src', done);
});

gulp.task('generate-closure-container', ['generate-transpiled.js'], (done) => {
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
});

gulp.task('generate-hcl-hil.js', ['create-output-directory', 'generate-closure-container'], (done) => {
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
});

//
// copy autocompletion data
//
gulp.task('copy-autocompletion-data', () =>
    gulp.src('src/data/*.json')
        .pipe(using({ prefix: 'Bundling auto-completion data', filesize: true }))
        .pipe(gulp.dest('out/src/data'))
);

//
// copy templates
//
gulp.task('copy-html-templates', () => {
    gulp.src('src/ui/*.html')
        .pipe(using({ prefix: 'Bundling html templates', filesize: true }))
        .pipe(gulp.dest('out/src/ui'));
});

//
// tslint
//
gulp.task('lint', () =>
    gulp.src('src/**/*.ts')
        .pipe(tslint())
        .pipe(tslint.report())
);

//
// compile
//
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

//
// generate telemetry file (depend on copy-html-templates so that directory is created)
//
gulp.task('generate-constants-keyfile', ['create-output-directory'], (done) => {
    let contents = {
        APPINSIGHTS_KEY: process.env.APPINSIGHTS_KEY
    };

    fs.writeFile('out/src/constants.json', JSON.stringify(contents), done);
});


//
// watch
//
gulp.task('watch', ['generate-hcl-hil.js', 'copy-autocompletion-data', 'copy-html-templates', 'generate-constants-keyfile'], () => {
    return gulp.watch(['src/**/*.ts', 'src/ui/*.html', 'test/**/*.ts'], ['copy-html-templates', 'lint', 'compile']);
});

//
// default
//
gulp.task('default', ['generate-hcl-hil.js', 'copy-autocompletion-data', 'copy-html-templates', 'generate-constants-keyfile', 'lint', 'compile']);
