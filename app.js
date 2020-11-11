// IMPORTS
const express = require( 'express' );
const compression = require( 'compression' );
const helmet = require( 'helmet' );

// EXPRESS APP
const app = express();
const port = process.env.PORT || 3000;

// use ejs template engine
app.set( 'view engine', 'ejs' );

app.listen( port );

// use a middleware to compress response bodies for all requests
app.use( compression() );

// use a middleware to secure and set HTTP headers
app.use( helmet() );

// use the "public" directory to serve pulbic static files
// unrelated to the landing page for "apps"
app.use( express.static( 'public' ) );

// use the "assets" directory to hold static files related
// to the landing page (i.e., CSS, JS, images, etc.)
// with virtual path prefix
app.use( '/assets', express.static( 'assets' ) );

// ROUTE: ROOT
app.get( '/', ( req, res ) => {
    res.render( 'index.ejs', { title: 'Learning Technology Apps | UWEX' } );
});

// 404 - NO MORE CODE AFTER THIS STATEMENT
app.use( ( req, res ) => {
    res.status( 404 ).render( '404.ejs', { title: '404 | Learning Technology Apps | UWEX' } );
} );