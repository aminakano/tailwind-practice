const gulp = require("gulp");
const noop = require("gulp-noop");
const newer = require("gulp-newer");
const imagemin = require("gulp-imagemin");
const htmlclean = require("gulp-htmlclean");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const assets = require("postcss-assets");
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker");
const cssnano = require("cssnano");
const yargs = require("yargs");
const browserSync = require("browser-sync").create();

const devBuild = !yargs.argv.production;

const stripdebug = devBuild ? null : require("gulp-strip-debug");
const sourcemaps = devBuild ? require("gulp-sourcemaps") : null;

const src = "src/";
const build = "build/";

function images() {
    const out = build + "images/";

    return gulp.src(src + "images/**/*")
    .pipe(newer(out))
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest(out));
}

function html() {
    const out = build;

    return gulp
      .src(src + "html/**/*")
      .pipe(newer(out))
      .pipe(devBuild ? noop() : htmlclean())
      .pipe(gulp.dest(out))
      .pipe(browserSync.stream());
}

function js() {
    
    return gulp.src(src + "js/**/*")
    .pipe(sourcemaps ? sourcemaps.init() : noop())
    .pipe(concat("main.js"))
    .pipe(stripdebug ? stripdebug() : noop())
    .pipe(terser())
    .pipe(sourcemaps ? sourcemaps.write() : noop())
    .pipe(gulp.dest(build + "js/"));
}

function css() {
    return gulp.src(src + "scss/main.scss")
    .pipe(sourcemaps ? sourcemaps.init() : noop())
    .pipe(sass({
        outputStyle: "nested",
        imagePaths: "/images/",
        precision: 3,
        errLogToConsole: true
    }).on("error", sass.logError))
    .pipe(postcss([
        assets({ loadPaths: ["images/"]}),
        autoprefixer(),
        mqpacker,
        cssnano
    ]))
    .pipe(sourcemaps ? sourcemaps.write() : noop())
    .pipe(gulp.dest(build + "css/"))
    .pipe(browserSync.stream());
}

function watch(done) {
    gulp.watch(src + "images/**/*", images);
    gulp.watch(src + "**/*", html).on("change", browserSync.reload);
    gulp.watch(src + "scss/**/*", css);
    gulp.watch(src + "js/**/*", js).on("change", browserSync.reload);
    done();
}

function server(done) {
    browserSync.init({
      server: {
        baseDir: "./" + build,
      },
      timestamps: false,
      notify: false
    });
    done()
}



exports.images = images;
exports.html = gulp.series(images, html);
exports.js = js;
exports.css = gulp.series(images, css);

exports.build = gulp.parallel(exports.html, exports.css, exports.js);

exports.watch = watch;
exports.server = server;

exports.default = gulp.series(exports.build, exports.watch, exports.server);