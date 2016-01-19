var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    envfile = require('envfile'),
    less = require('gulp-less'),
    autoprefixer = require('gulp-autoprefixer'),
    plumber = require('gulp-plumber'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    concat = require('gulp-concat'),
    gulpif = require('gulp-if'),
    ngAnnotate = require('gulp-ng-annotate'),
    watch = require('gulp-watch');

//gulp tasks
gulp.task('js-deps', function () {
  gulp.src([
      './public/bower_components/jquery/dist/jquery.min.js',
      './public/bower_components/lodash/lodash.min.js',
      './public/bower_components/moment/min/moment.min.js',
      './public/bower_components/angular/angular.min.js',
      './public/bower_components/angular-ui-router/release/angular-ui-router.min.js',
      './public/bower_components/bootstrap/dist/js/bootstrap.min.js',
      './public/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
      './public/bower_components/ng-file-upload/ng-file-upload-all.js'
    ])
    .pipe(concat('deps.js'))
    .pipe(gulp.dest('./build/js'));

  gulp.src([
      './public/bower_components/angular/angular.min.js.map'
    ])
    .pipe(gulp.dest('./build/js'))
});

gulp.task('partials', function () {
  gulp.src('./public/javascripts/**/*.html')
    .pipe(gulp.dest('./build/partials'));
});

gulp.task('css-deps', function () {
  gulp.src([
      './public/bower_components/bootstrap/dist/css/bootstrap.min.css',
      './public/bower_components/font-awesome/css/font-awesome.min.css'
    ])
    .pipe(concat('css-deps.css'))
    .pipe(gulp.dest('./build/css'));

  gulp.src('./public/bower_components/font-awesome/fonts/*')
    .pipe(gulp.dest('./build/fonts'));

  gulp.src('./public/bower_components/bootstrap/dist/fonts/*')
    .pipe(gulp.dest('./build/fonts'));  
});

gulp.task('js', function () {
  var baseDir = __dirname + '/public/javascripts',
    outputDir = __dirname + '/build/js',
    outputFilename = 'app.js',
    env = envfile.parseFileSync('.env');
  gulp.src([
      baseDir + '/*module.js',
      baseDir + '/**/*module.js',
      baseDir + '/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(sourcemaps.init())
    .pipe(concat(outputFilename))
    .pipe(ngAnnotate())
    .pipe(gulpif(env.PRODUCTION === 'true', uglify()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(outputDir));
});

gulp.task('less', function () {
  gulp.src([
      './public/less/app.less'
    ])
    .pipe(plumber())
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulp.dest('./build/css'));
});

gulp.task('serve', function () {
  var env = envfile.parseFileSync('.env');
  nodemon({
    script: './bin/www',
    ext: 'html ejs js',
    ignore: ['build/**/*.*', 'public/**/*.*'],
    tasks: [],
    env: env
  }).on('restart', function () {
    console.log('server restarted.....');
  });
});

gulp.task('watch', function () {
  gulp.watch([
    'public/javascripts/*.js',
    'public/javascripts/**/*.js'
  ], ['js']);

  gulp.watch('public/less/*.less', ['less']);
  gulp.watch('public/javascripts/**/*.html', ['partials']);
});

gulp.task('default', ['js-deps', 'partials', 'css-deps', 'js', 'less', 'watch', 'serve']);




