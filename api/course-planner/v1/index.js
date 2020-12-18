const routes = require( 'express' ).Router();
const db = require( './database' );
const admin = require( 'firebase-admin' );

/** CAMPUS API ENDPOINTS */

// list all campuses
routes.get( '/campuses', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM campus'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.status(404).json( {message: 'No campuses exist.'} );

} );

// list one specific campus
routes.get( '/campuses/:id', async ( req, res ) => {

    const id = req.params.id;
    const { results } = await db.query(
        'SELECT * FROM campus WHERE id=?',
        [id]
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.status(404).json( {message: `Campus id ${id} does not exist.`} );

} );

// create new campus
routes.post( '/campuses', async ( req, res ) => {

    if (  ! await authenticated( req.headers.authtoken ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} ); 
    }

    if ( req.body.name == null || req.body.name.length == 0 ) {
        return res.status(400).json( {message: "Error: Failed to create new campus."} );
    }

    const name = req.body.name;

    if ( await exists( 'campus', 'name', name ) ) {
        return res.status(400).json( {message: "Error: Cannot update campus. Campus already exists."} );
    }

    await db.query(
        'INSERT INTO campus (name) VALUES (?)',
        [name]
    );

    return res.json( {name} );

    

} );

// update campus
routes.post( '/campuses/:id', async ( req, res ) => {

    if (  ! await authenticated( req.headers.authtoken ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} ); 
    }

    if ( req.params == null && req.body.name.length == 0 ) {
        return res.status(400).json( {message: "Error: Failed to update campus."} ); 
    }

    const id = req.params.id;
    const name = req.body.name;

    if ( await exists( 'campus', 'name', name ) ) {
        return res.status(400).json( {message: "Error: Cannot update campus. Campus already exists."} );
    }

    await db.query(
        'UPDATE campus SET name=? WHERE id=?',
        [name, id]
    );

    const { results } = await db.query(
        'SELECT * FROM campus WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete campus
routes.delete( '/campuses/:id', async ( req, res ) => {

    if (  ! await authenticated( req.headers.authtoken ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} ); 
    }
    
    const id = req.params.id;

    await db.query(
        'DELETE FROM campus WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END AMPUS API ENDPOINTS */

// list all users
routes.get( '/users', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM user'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.status(404).json( {message: 'No users exist.'} );

} );

// list one specific user
routes.get( '/users/:id', async ( req, res ) => {

    const id = req.params.id;

    const { results } = await db.query(
        'SELECT * FROM user WHERE id=?',
        [id]
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.status(404).json( {message: `User with id ${id} does not exist.`} );

} );

/** HELPER FUNCTIONS */

async function exists( table, indentifier, value ) {

    const exists = await db.query(
        `SELECT * FROM ${table} WHERE ${indentifier}=?`,
        [value]
    );

    if ( exists.results.length > 0 ) {
        return true;
    }

    return false;

}

async function authenticated( token ) {

    const user = await admin.auth().verifyIdToken( token );

    if ( user ) {
        return true;
    }

    return false;

}

/** END HELPER FUNCTIONS */

module.exports = routes