// load the libs
const express = require('express')
const MongoClient = require('mongodb').MongoClient;
const morgan = require ('morgan')
const url = 'mongodb://localhost:27017' /* connection string */
const mysql = require('mysql2/promise')
const secureEnv = require('secure-env')
global.env = secureEnv({secret:'mySecretPassword'})
const bodyParser = require('body-parser');
const DATABASE = 'boardgames'
const COLLECTION = 'games'

// for cloud storage using env variables
// const mongourl = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.ow18z.mongodb.net/<dbname>?retryWrites=true&w=majority`

// create a client pool
const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true });    

// configure port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// to allow searching based on ObjectID
var ObjectId = require('mongodb').ObjectID;

// create an instance of the application
const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

//start server
const startApp = async (app, pool) => {
	const conn = await pool.getConnection()
	try {
		console.info('Pinging database...')
		await conn.ping()

        client.connect()
        .then(() => {
            app.listen(PORT, () => {
                console.info(`Application started on port ${PORT} at ${new Date()}`)        
            })
        })
        .catch(e => {
                console.error('cannot connect to mongodb: ', e)
        })

    } catch(e) {
		console.error('Cannot ping database', e)
	} finally {
		conn.release()
	}
}
// create connection pool
const pool = mysql.createPool({
	host: process.env.DB_HOST || 'localhost',
	port: parseInt(process.env.DB_PORT) || 3306,
	database: 'bgg',
	user: process.env.DB_USER || global.env.DB_USER,
	password: process.env.DB_PASSWORD || global.env.DB_PASSWORD,
	connectionLimit: 4
})
// start the app
startApp(app, pool)

app.get('/games', async (req, resp) => {

    try{
        const games = await client.db(DATABASE)
        .collection(COLLECTION)
        .find(
            {
            }        
        )
        .skip(0)
        .limit(10)
        .project({ Name:1})
        .toArray()

        const count = await client.db(DATABASE)
        .collection(COLLECTION)
        .find(
            {
            }        
        )
        .count()

        resp.status(200)
        resp.type('application/json')
        resp.json({
            games: games,
            count: count,
            timeStamp: new Date()
        })

    }
    catch(e){
        console.info(e)
    }

})

app.get('/games/rank', async (req, resp) => {

    try{
        const games = await client.db(DATABASE)
        .collection(COLLECTION)
        .find(
            {
            }        
        )
        .skip(0)
        .limit(10)
        .sort({Rank: 1})
        .project({ Name:1, Rank:1})
        .toArray()

        resp.status(200)
        resp.type('application/json')
        resp.json({
            games: games,
        })

    }
    catch(e){
        console.info(e)
    }

})

app.get('/games/:gameID', async (req, resp) => {

    gameID = req.params.gameID
    try{
        const games = await client.db(DATABASE)
        .collection(COLLECTION)
        .find(
            {
                ID: parseInt(gameID)
            }        
        )
        .skip(0)
        .limit(10)
        .sort({Rank: 1})
        .project({ Name:1, Year:1, Rank:1, Average:1, })
        .toArray()

        if (games.length <= 0){
            resp.status(404)
            resp.json({ message: `Cannot find game ${gameID}`})
            return
        }
        resp.status(200)
        resp.type('application/json')
        resp.json({
            games: games,
        })

    }
    catch(e){
        console.info(e)
        resp.json(e)
    }

})
