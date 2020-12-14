// IMPORTS
const express = require( 'express' );
const path = require( 'path' );
const coursePlannerApiV1 = require( './api/course-planner/v1' );
const compression = require( 'compression' );
const helmet = require( 'helmet' );
const bodyParser = require( 'body-parser' );

// EXPRESS APP
const app = express();
const port = process.env.PORT || 3000;

// use bodyParser for JSON data
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

// use ejs template engine
app.set( 'view engine', 'ejs' );
app.enable( 'trust proxy' );
app.listen( port );

// use course-planner api routes
app.use( '/api/course-planner/v1', coursePlannerApiV1 );

// use a middleware to compress response bodies for all requests
app.use( compression() );

// use a middleware to secure and set HTTP headers
app.use( helmet() );

// use the "public" directory to serve pulbic static files
// unrelated to the landing page for "apps"
app.use( express.static( path.join(__dirname, 'public' ) ) );

// use the "assets" directory to hold static files related
// to the landing page (i.e., CSS, JS, images, etc.)
// with virtual path prefix
app.use( '/assets', express.static( 'assets' ) );

// ROUTE: ROOT
app.get( '/', ( req, res ) => {
    const host = req.protocol + '://' + req.headers.host;
    res.render( 'index.ejs', { title: 'Learning Technology Apps | UWEX', root: host } );
});

// ROUTE REWRITE FOR COURSE PLANNER ANGULAR APP
app.get( '/course-planner/*', ( req, res ) => {
    console.log(req);
    res.sendFile( path.join( __dirname, 'public/course-planner/index.html' ) );
});

// 404 - NO MORE CODE AFTER THIS STATEMENT
app.use( ( req, res ) => {
    const host = req.protocol + '://' + req.headers.host;
    res.status( 404 ).render( '404.ejs', { title: '404 | Learning Technology Apps | UWEX', root: host } );
} );