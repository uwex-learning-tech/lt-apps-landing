const routes = require( 'express' ).Router();

routes.get( '/', ( req, res ) => {
    res.json( {message: 'hooray' } );
} );

routes.get( '/users', ( req, res ) => {
    res.json( {users: ['user1','user2'] } );
} );

routes.get( '/users/:id', ( req, res ) => {
    res.json( {user: req.params.id } );
} );

module.exports = routes