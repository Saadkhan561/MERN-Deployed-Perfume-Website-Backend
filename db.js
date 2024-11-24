const {MongoClient} = require('mongodb')

let dbConnection

module.exports = {
    connectionToDb: (cb) => {
        MongoClient.connect('mongodb://localhost:27017/store')
            .then((client) => {
                dbConnection = client.db()
                console.log("connected to DB")
                return cb()
            })
            .catch((err) => {
                console.log(err)
                return cb()
            })
    },
    getDb: () => dbConnection
}
