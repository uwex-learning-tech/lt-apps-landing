// IMPORTS
const express = require( 'express' );
const path = require( 'path' );
const compression = require( 'compression' );
const helmet = require( 'helmet' );
const coursePlannerApiV1 = require( './api/course-planner/v1' );
const courseMatrixDb = require( './api/course-planner/v1/database' );
const firebaseAdmin = require( 'firebase-admin' );
const coursePlannerCredentials = require( './course-planner-credential.json' );

// constant
const allowedScripts = [
    "'self'",
    "https://apis.google.com",
    "https://www.googleapis.com",
    "https://course-planner-22915.firebaseapp.com",
    "https://lh3.googleusercontent.com",
    "https://lh6.googleusercontent.com",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://fonts.googleapis.com"
];

// EXPRESS APP constants
const app = express();
const port = process.env.PORT || 3000;

// initialize Google Firebase
firebaseAdmin.initializeApp( {
    credential: firebaseAdmin.credential.cert( coursePlannerCredentials )
} );

// connect to DB
courseMatrixDb.connect();

// use ejs template engine
app.set( 'view engine', 'ejs' );
app.enable( 'trust proxy' );
const server = app.listen( port );

// use JSON data
app.use( express.urlencoded( { extended: true } ) );
app.use( express.json() );

// use a middleware to compress response bodies for all requests
app.use( compression() );

// use a middleware to secure and set HTTP headers
// app.use( helmet() );
app.use( helmet.contentSecurityPolicy( {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "default-src": allowedScripts,
            "script-src": allowedScripts,
            "img-src": ["'self'", "data: https:"]
        }
    } )
);

// use the "public" directory to serve pulbic static files
// unrelated to the landing page for "apps"
app.use( express.static( path.join(__dirname, 'public' ) ) );

// use the "assets" directory to hold static files related
// to the landing page (i.e., CSS, JS, images, etc.)
// with virtual path prefix
app.use( '/assets', express.static( 'assets' ) );

// use course-planner api routes
app.use( '/api/course-planner/v1', coursePlannerApiV1 );

// ROUTE: ROOT
app.get( '/', ( req, res ) => {
    const host = req.protocol + '://' + req.headers.host;
    const currentYear = new Date().getFullYear();
    res.render( 'index.ejs', { title: 'Learning Technology Apps | UWEX', root: host, year: currentYear } );
});

// ROUTE REWRITE FOR COURSE PLANNER ANGULAR APP
app.get( '/course-planner/*', ( req, res ) => {
    res.sendFile( path.join( __dirname, 'public/course-planner/index.html' ) );
});

// 404 - NO MORE ROUTING AFTER THIS STATEMENT
app.use( ( req, res ) => {
    const host = req.protocol + '://' + req.headers.host;
    res.status( 404 ).render( '404.ejs', { title: '404 | Learning Technology Apps | UWEX', root: host } );
} );

// server process handlers
process.on( 'unhandledRejection', error => {
    console.log( error );
    process.exit( 1 );
} );

process.on( 'SIGINT', () => {
    courseMatrixDb.end();
    server.close();
    process.exit( 0 );
} );