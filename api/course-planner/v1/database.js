const config = require( './config' );
const mysql = require( 'mysql' );

const connection = mysql.createConnection( {
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT,
    user: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    database: config.DATABASE_SCHEMA
} );

const db = {
    connect: () => connection.connect(),
    query: ( queryString, escapedValues ) => new Promise( (resolve, reject) => {
        connection.query( queryString, escapedValues, (error, results, fields) => {
            if (error) reject( error );
            resolve( {results, fields} );
        } )
    } ),
    end: () => connection.end()
};

module.exports = db;