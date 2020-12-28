const routes = require( 'express' ).Router();
const db = require( './database' );
const admin = require( 'firebase-admin' );

/** CAMPUSES API ENDPOINTS */

// list all campuses
routes.get( '/campuses', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM campus ORDER BY name ASC'
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
        return res.json( results[0] );
    }

    return res.status(404).json( {message: `Campus id ${id} does not exist.`} );

} );

// create new campus
routes.post( '/campuses', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin", "Support Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    if ( req.body.name == null || req.body.name.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new campus."} );
    }

    const name = req.body.name;

    if ( await exists( 'campus', 'name', name ) ) {
        return res.status(400).json( {message: "Cannot add campus. Campus already exists."} );
    }

    await db.query(
        'INSERT INTO campus (name) VALUES (?)',
        [name]
    );

    return res.json( {name} );

} );

// update campus
routes.post( '/campuses/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin", "Support Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    if ( req.params == null && req.body.name.length == 0 ) {
        return res.status(400).json( {message: "Failed to update campus."} ); 
    }

    const id = req.params.id;
    const name = req.body.name;

    if ( await exists( 'campus', 'name', name ) ) {
        return res.status(400).json( {message: "Cannot update campus. Campus already exists."} );
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

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin", "Support Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM campus WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END CAMPUSES API ENDPOINTS */

/** USERS API ENDPOINTS */

// list all users
routes.get( '/users', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const { results } = await db.query(
        'SELECT * FROM user ORDER BY firstName, lastName, displayName ASC'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.status(404).json( {message: 'No users exist.'} );

} );

// list one specific user
routes.get( '/users/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin","Support Admin","Program Manager", "Subscriber"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    const { results } = await db.query(
        'SELECT * FROM user WHERE uid=?',
        [id]
    );

    if ( results.length ) {
        return res.json( results[0] );
    }

    return res.status(404).json( {message: `User with id ${id} does not exist.`} );

} );

// create new user
routes.post( '/users', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const user = req.body;

    if ( user.length < 0 ) {
        return res.status(400).json( {message: "Failed to create new user."} );
    }

    if ( await exists( 'user', 'email', user.email ) ) {
        return res.json( user );
    }

    await db.query(
        'INSERT INTO user (displayName, email, uid) VALUES (?,?,?)',
        [user.displayName, user.email, user.uid]
    );

    return res.json( user );

} );

// update user
routes.post( '/users/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const user = req.body;

    await db.query(
        'UPDATE user SET firstName=?, lastName=?, roleId=? WHERE uid=?',
        [user.firstName, user.lastName, user.roleId, id]
    );

    const { results } = await db.query(
        'SELECT * FROM user WHERE uid=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete user
routes.delete( '/users/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM user WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END USERS API ENDPOINTS */

/** ROLES API ENDPOINTS */

// list all roles
routes.get( '/roles', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ["Admin","Support Admin","Program Manager", "Subscriber"] ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const { results } = await db.query(
        'SELECT * FROM role'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.status(404).json( {message: 'No roles exist.'} );

} );

/** END ROLES API ENDPOINTS */

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

async function roleAllowed( token, allowedRoles ) {

    if ( !token ) return false;

    const user = await admin.auth().verifyIdToken( token );

    if ( user ) {

        const { results } = await db.query(
            `SELECT user.roleId, role.name
            FROM user
            INNER JOIN role ON user.roleId = role.id WHERE user.uid = ? ;`,
            [user.uid]
        );
        
        if ( allowedRoles.find( role => role.toLowerCase() === results[0].name.toLowerCase() ) ) {
            return true;
        }

    }

    return false;

}

/** END HELPER FUNCTIONS */

module.exports = routes