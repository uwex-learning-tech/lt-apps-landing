const routes = require( 'express' ).Router();
const db = require( './database' );
const admin = require( 'firebase-admin' );

const ROLE = {
    ADMIN: ["Admin"],
    SUPPORT_ADMIN: ["Admin", "Support Admin"],
    PROGRAM_MANAGER: ["Admin", "Support Admin", "Program Manager"],
    ALL: ["Admin", "Support Admin", "Program Manager", "Subscriber"]
};

/** CAMPUSES API ENDPOINTS */

// list all campuses
routes.get( '/campuses', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM campus ORDER BY code ASC'
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

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.SUPPORT_ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    if ( req.body.name == null || req.body.name.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new campus."} );
    }

    const name = req.body.name;
    const code = req.body.code;

    if ( await exists( 'campus', 'name', name ) ) {
        return res.status(400).json( {message: "Cannot add campus. Campus already exists."} );
    }

    await db.query(
        'INSERT INTO campus (code, name) VALUES (?,?)',
        [code, name]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.json( {name} );

} );

// update campus
routes.post( '/campuses/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.SUPPORT_ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    if ( req.params == null && req.body.name.length == 0 ) {
        return res.status(400).json( {message: "Failed to update campus."} ); 
    }

    const id = req.params.id;
    const name = req.body.name;
    const code = req.body.code;

    if ( await exists( 'campus', 'name', name ) ) {
        return res.status(400).json( {message: "Cannot update campus. Campus already exists."} );
    }

    await db.query(
        'UPDATE campus SET code=?, name=? WHERE id=?',
        [code, name, id]
    );

    const { results } = await db.query(
        'SELECT * FROM campus WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete campus
routes.delete( '/campuses/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.SUPPORT_ADMIN ) ) {
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

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ADMIN ) ) {
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

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ALL ) ) {
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
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.json( user );

} );

// update user
routes.post( '/users/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const user = req.body;

    if ( user.length < 0 ) {
        return res.status(400).json( {message: "Failed to update user."} );
    }

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

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ADMIN ) ) {
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

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ALL ) ) {
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

/** FACULTY API ENDPOINTS */

// list all faculty
routes.get( '/faculty', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM faculty ORDER BY firstName, lastName ASC'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list one specific faculty
routes.get( '/faculty/:id', async ( req, res ) => {

    const id = req.params.id;
    const { results } = await db.query(
        'SELECT * FROM faculty WHERE id=?',
        [id]
    );

    if ( results.length ) {
        return res.json( results[0] );
    }

    return res.status(404).json( {message: `Faculty id ${id} does not exist.`} );

} );

// create new faculty
routes.post( '/faculty', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const faculty = req.body;

    if ( faculty.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new faculty."} );
    }

    if ( await exists( 'faculty', 'email', faculty.email ) ) {
        return res.status(400).json( {message: "Cannot add faculty. Faculty already exists."} );
    }

    await db.query(
        'INSERT INTO faculty (email, firstName, lastName, campusId) VALUES (?,?,?,?)',
        [faculty.email, faculty.firstName, faculty.lastName, faculty.campusId]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.json( faculty );

} );

// update faculty
routes.post( '/faculty/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const faculty = req.body;

    if ( faculty.length == 0 ) {
        return res.status(400).json( {message: "Failed to update faculty."} ); 
    }

    await db.query(
        'UPDATE faculty SET email=?, firstName=?, lastName=?, campusId=? WHERE id=?',
        [faculty.email, faculty.firstName, faculty.lastName, faculty.campusId, id]
    );

    const { results } = await db.query(
        'SELECT * FROM faculty WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete faculty
routes.delete( '/faculty/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM faculty WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END FACULTY API ENDPOINTS */

/** INSTRUCTIONAL DESIGNER API ENDPOINTS */

// list all instructional designers
routes.get( '/instructional-designers', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM instructionalDesigner ORDER BY firstName, lastName ASC'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list one specific instrucitonal designer
routes.get( '/instructional-designers/:id', async ( req, res ) => {

    const id = req.params.id;
    const { results } = await db.query(
        'SELECT * FROM instructionalDesigner WHERE id=?',
        [id]
    );

    if ( results.length ) {
        return res.json( results[0] );
    }

    return res.status(404).json( {message: `Instructional designer id ${id} does not exist.`} );

} );

// create new instructional desiger
routes.post( '/instructional-designers', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const instructionalDesigner = req.body;

    if ( instructionalDesigner.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new instructional designer."} );
    }

    if ( await exists( 'instructionalDesigner', 'email', instructionalDesigner.email ) ) {
        return res.status(400).json( {message: "Cannot add instructional designer. Instructional designer already exists."} );
    }

    await db.query(
        'INSERT INTO instructionalDesigner (email, firstName, lastName) VALUES (?,?,?)',
        [instructionalDesigner.email, instructionalDesigner.firstName, instructionalDesigner.lastName]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );

    return res.json( instructionalDesigner );

} );

// update instructional desinger
routes.post( '/instructional-designers/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const instructionalDesigner = req.body;

    if ( instructionalDesigner.length == 0 ) {
        return res.status(400).json( {message: "Failed to update instructional designer."} ); 
    }

    await db.query(
        'UPDATE instructionalDesigner SET email=?, firstName=?, lastName=? WHERE id=?',
        [instructionalDesigner.email, instructionalDesigner.firstName, instructionalDesigner.lastName, id]
    );

    const { results } = await db.query(
        'SELECT * FROM instructionalDesigner WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete instructional designer
routes.delete( '/instructional-designers/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM instructionalDesigner WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END INSTRUCTIONAL DESIGNER API ENDPOINTS */

/** MEDIA LEAD API ENDPOINTS */

// list all media leads
routes.get( '/media-leads', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM mediaLead ORDER BY firstName, lastName ASC'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list one specific media lead
routes.get( '/media-leads/:id', async ( req, res ) => {

    const id = req.params.id;
    const { results } = await db.query(
        'SELECT * FROM mediaLead WHERE id=?',
        [id]
    );

    if ( results.length ) {
        return res.json( results[0] );
    }

    return res.status(404).json( {message: `Media Lead id ${id} does not exist.`} );

} );

// create new media lead
routes.post( '/media-leads', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const mediaLead = req.body;

    if ( mediaLead.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new media lead."} );
    }

    if ( await exists( 'mediaLead', 'email', mediaLead.email ) ) {
        return res.status(400).json( {message: "Cannot add media Lead. Media Lead already exists."} );
    }

    await db.query(
        'INSERT INTO mediaLead (email, firstName, lastName) VALUES (?,?,?)',
        [mediaLead.email, mediaLead.firstName, mediaLead.lastName]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );

    return res.json( mediaLead );

} );

// update media lead
routes.post( '/media-leads/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const mediaLead = req.body;

    if ( mediaLead.length == 0 ) {
        return res.status(400).json( {message: "Failed to update Media Lead."} ); 
    }

    await db.query(
        'UPDATE mediaLead SET email=?, firstName=?, lastName=? WHERE id=?',
        [mediaLead.email, mediaLead.firstName, mediaLead.lastName, id]
    );

    const { results } = await db.query(
        'SELECT * FROM mediaLead WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete media lead
routes.delete( '/media-leads/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM mediaLead WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END MEDIA LEAD API ENDPOINTS */

/** PROGRAMS API ENDPOINTS */

// list all programs
routes.get( '/programs', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM program ORDER BY code ASC'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list one specific program by code
routes.get( '/programs/:code', async ( req, res ) => {

    const code = req.params.code;
    const { results } = await db.query(
        'SELECT * FROM program WHERE code=?',
        [code]
    );

    if ( results.length ) {
        return res.json( results[0] );
    }

    return res.status(404).json( {message: `Program code ${code} does not exist.`} );

} );

// create new program
routes.post( '/programs', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const program = req.body;

    if ( program.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new program."} );
    }

    if ( await exists( 'program', 'code', program.code ) ) {
        return res.status(400).json( {message: "Cannot add program. Program already exists."} );
    }

    await db.query(
        'INSERT INTO program (code, name) VALUES (?,?)',
        [program.code, program.name]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.json( faculty );

} );

// update program
routes.post( '/programs/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const program = req.body;

    if ( program.length == 0 ) {
        return res.status(400).json( {message: "Failed to update program."} ); 
    }

    await db.query(
        'UPDATE program SET code=?, name=? WHERE id=?',
        [program.code, program.name, id]
    );

    const { results } = await db.query(
        'SELECT * FROM program WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete program
routes.delete( '/programs/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM program WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END PROGRAMS API ENDPOINTS */

/** COURSES API ENDPOINTS */

// list all courses
routes.get( '/courses', async ( req, res ) => {

    const { results } = await db.query(
        'SELECT * FROM course ORDER BY code ASC'
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list all courses by program code
routes.get( '/courses/:code', async ( req, res ) => {

    const code = req.params.code;
    const { results } = await db.query(
        'SELECT * FROM course WHERE programId = (SELECT program.id FROM program WHERE program.code = ?) ORDER BY code ASC',
        [code]
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// create new course
routes.post( '/courses', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const course = req.body;

    if ( course.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new course."} );
    }

    if ( await exists( 'course', 'code', course.code ) ) {
        return res.status(400).json( {message: "Cannot add course. Course already exists."} );
    }

    await db.query(
        'INSERT INTO course (code, name, programId) VALUES (?,?,?)',
        [course.code, course.name, course.programId]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.json( [] );

} );

// update course
routes.post( '/courses/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const course = req.body;

    if ( course.length == 0 ) {
        return res.status(400).json( {message: "Failed to update course."} ); 
    }

    await db.query(
        'UPDATE course SET code=?, name=? WHERE id=?',
        [course.code, course.name, id]
    );

    const { results } = await db.query(
        'SELECT * FROM course WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete course
routes.delete( '/courses/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM course WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END COURSES API ENDPOINTS */

/** PROGRAM MANAGER API ENDPOINTS */

// list all program managers
routes.get( '/program-managers', async ( req, res ) => {

    const { results } = await db.query(
        `SELECT programManager.id, user.displayName, user.email, programManager.programId, program.code AS programCode
        FROM programManager
        INNER JOIN user ON user.email = programManager.email
        LEFT JOIN program ON program.id LIKE programManager.programId
        WHERE user.roleId = 3
        ORDER BY user.displayName ASC`
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// create new program manager
routes.post( '/program-managers', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.SUPPORT_ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const pmEmail = req.body.email;

    if ( pmEmail.length == 0 ) {
        return res.status(400).json( {message: "Failed to create add program manager."} );
    }

    if ( await exists( 'programManager', 'email', pmEmail ) ) {
        return res.status(400).json( {message: "Cannot add program manager. Program manager already exists."} );
    }

    await db.query(
        'INSERT INTO programManager (email) VALUES (?)',
        [pmEmail]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.json( [] );

} );

// update program manager
routes.post( '/program-managers/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.SUPPORT_ADMIN ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const pm = req.body;

    if ( pm.length == 0 ) {
        return res.status(400).json( {message: "Failed to update Program Manager."} ); 
    }

    await db.query(
        'UPDATE programManager SET programId=? WHERE id=?',
        [pm.programId, id]
    );

    const { results } = await db.query(
        `SELECT programManager.id, user.displayName, user.email, programManager.programId, program.code AS programCode
        FROM programManager
        INNER JOIN user ON user.email = programManager.email
        LEFT JOIN program ON program.id LIKE programManager.programId
        WHERE user.roleId = 3 AND programManager.id = ?
        ORDER BY user.displayName ASC`,
        [id]
    );

    return res.json( results[0] );

} );

/** END PROGRAM MANAGER API ENDPOINTS */

/** COURSE MATRIX API ENDPOINTS */

// list all course matrix items based on program code
routes.get( '/course-matrix/:programCode', async ( req, res ) => {

    const programCode = req.params.programCode;
    let queryStr = '';
    let values = [programCode];

    if ( req.query.fy ) {

        const fys = req.query.fy;
        let fyPlaceholder = '';

        values = values.concat(fys);

        for (let i = 0; i < req.query.fy.length; i++ ) {
            fyPlaceholder += '?';
            if ( i < req.query.fy.length - 1 ) {
                fyPlaceholder += ', ';
            }
        }

        queryStr = `SELECT * FROM courseMatrix
        WHERE programId = (SELECT program.id FROM program WHERE program.code = ?)
        AND fiscalYear IN (${fyPlaceholder.toString()});`;

    } else {

        queryStr = `SELECT * FROM courseMatrix
        WHERE programId = SELECT program.id FROM program WHERE program.code = ?`;

    }

    const { results } = await db.query( queryStr, values );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

routes.get( '/course-matrix/range/all', async ( req, res ) => {

    const start = await db.query(
        `SELECT start FROM courseMatrix ORDER BY start ASC LIMIT 1;`
    );

    const end = await db.query(
        `SELECT start FROM courseMatrix ORDER BY start DESC LIMIT 1;`
    );

    const range = {
        from: start.results[0].start,
        to: end.results[0].start
    }

    return res.json( range );

} );

// list specific course matrix item based on program and fiscal year
routes.get( '/course-matrix/:programCode/:courseCode/:year', async ( req, res ) => {

    const programCode = req.params.programCode;
    const courseCode = req.params.courseCode;
    const year = req.params.year;

    const { results } = await db.query(
        `SELECT * FROM courseMatrix
         WHERE programId = (SELECT program.id FROM program WHERE program.code = ?)
          AND courseId = (SELECT course.id FROM course WHERE course.code = ?)
          AND fiscalYear = ?`,
        [programCode, courseCode, year]
    );

    if ( results.length ) {
        return res.json( results[0] );
    }

    return res.json( [] );

} );

// list specific course matrix item based on range
routes.get( '/course-matrix/range/from/:fromStr/to/:toStr', async ( req, res ) => {

    const fromStr = req.params.fromStr;
    const toStr = req.params.toStr;

    const { results } = await db.query(
        'SELECT * FROM courseMatrix WHERE start >= ? AND start <= ? ORDER BY start ASC;',
        [fromStr, toStr]
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list specific course matrix item based on campus and ficsal year
routes.get( '/course-matrix/campus/:campusId/fiscalYear/:fiscalYear', async ( req, res ) => {

    const campusId = req.params.campusId;
    const fiscalYear = req.params.fiscalYear;

    const { results } = await db.query(
        'SELECT * FROM courseMatrix WHERE campusId = ? AND fiscalYear = ? ORDER BY start ASC;',
        [campusId, fiscalYear]
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// list specific course matrix item based on program and ficsal year
routes.get( '/course-matrix/program/:programId/from/:from/to/:to', async ( req, res ) => {

    const programId = req.params.programId;
    let from = req.params.from;
    let to = req.params.to;

    from = from + '-' + (Number(from) + 1) + ':0';
    to = to + '-' + (Number(to) + 1) + ':2';

    const { results } = await db.query(
        'SELECT * FROM courseMatrix WHERE programId = ? AND start >= ? AND start <= ? ORDER BY start ASC;',
        [programId, from, to]
    );

    if ( results.length ) {
        return res.json( results );
    }

    return res.json( [] );

} );

// create a new course matrix entry
routes.post( '/course-matrix', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const entry = req.body;

    if ( entry.length == 0 ) {
        return res.status(400).json( {message: "Failed to create new course matrix entry."} );
    }

    await db.query(
        'INSERT INTO courseMatrix (programId, courseId, status, start, live, fiscalYear, increment) VALUES (?,?,?,?,?,?,?)',
        [entry.programId, entry.courseId, entry.status, entry.start, entry.live, entry.fiscalYear, entry.increment]
    ).then( (r) => {
        return res.json(r.results.insertId);
    } );;

    return res.status(401).json( {message: 'Something went wrong...'} );

} );

// update course matrix entry's live value
routes.post( '/course-matrix/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const entry = req.body;
    const datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if ( entry.length == 0 ) {
        return res.status(400).json( {message: "Failed to update course matrix entry."} );
    }

    await db.query(
        'UPDATE courseMatrix SET facultyId=?, campusId=?, designerId=?, mediaLeadId=?, updatedOn=? WHERE id=?',
        [entry.facultyId, entry.campusId, entry.designerId, entry.mediaLeadId, datetime, id]
    );

    const { results } = await db.query(
        'SELECT * FROM courseMatrix WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// update course matrix entry's status value
routes.post( '/course-matrix/status/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const entry = req.body;
    const datatime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if ( entry.length == 0 ) {
        return res.status(400).json( {message: "Failed to update course matrix entry."} );
    }

    await db.query(
        'UPDATE courseMatrix SET status=?, updatedOn=? WHERE id=? ',
        [entry.status, datatime, id]
    );

    const { results } = await db.query(
        'SELECT * FROM courseMatrix WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// update course matrix entry's live value
routes.post( '/course-matrix/live/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;
    const entry = req.body;
    const datetime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if ( entry.length == 0 ) {
        return res.status(400).json( {message: "Failed to update course matrix entry."} );
    }

    await db.query(
        'UPDATE courseMatrix SET live=?, increment=?, updatedOn=? WHERE id=?',
        [entry.live, entry.increment, datetime, id]
    );

    const { results } = await db.query(
        'SELECT * FROM courseMatrix WHERE id=?',
        [id]
    );

    return res.json( results[0] );

} );

// delete course matrix item
routes.delete( '/course-matrix/:id', async ( req, res ) => {

    if ( !req.headers.authtoken || ! await roleAllowed( req.headers.authtoken, ROLE.PROGRAM_MANAGER ) ) {
        return res.status(401).json( {message: `401 Unauthorized`} );
    }

    const id = req.params.id;

    await db.query(
        'DELETE FROM courseMatrix WHERE id=?',
        [id]
    );

    return res.json({ message: 'Delete success' });

} );

/** END COURSE MATRIX API ENDPOINTS */

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