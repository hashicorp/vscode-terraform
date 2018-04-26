var gulp = require('gulp');
var run = require('gulp-run');
var pump = require('pump');
var rename = require('gulp-rename');
var tslint = require('gulp-tslint');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var using = require('gulp-using');

var spawn = require('child_process').spawn;

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

gulp.task('generate-transpiled.js', ['generate-hcl-container'], () => {
    return run('docker run --rm gopher-hcl-gopherjs', { verbosity: 1 }).exec()
        .pipe(rename('transpiled.js'))
        .pipe(gulp.dest('hcl-hil'));
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

gulp.task('generate-hcl-hil.js', ['generate-closure-container'], () => {
    return run('docker run --rm gopher-hcl-closure-compiler', { verbosity: 1 }).exec()
        .pipe(rename('hcl-hil.js'))
        .pipe(gulp.dest('out/src'));
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
        .pipe(sourcemaps.write('.', { sourceRoot: './', includeContent: false }))
        .pipe(gulp.dest('out'))
);

//
// default
//
gulp.task('default', ['generate-hcl-hil.js', 'copy-autocompletion-data', 'lint', 'compile']);