/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database 
 * @param {Object} data an object data you want to insert into the database
 * @returns {Object} a result of the event -- returning insertion status
 */
module.exports.putData = async function putData(client, dbname, colname, data){
    const result = await client.db(dbname).collection(colname).insertOne(data);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}

/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database 
 * @param {ArrayOfObjects} listData a list of objects you want to insert into the database
 * @returns {Object} a result of the event -- returning insertion status
 */
module.exports.putManyData = async function putManyData(client, dbname, colname, listData){
    const result = await client.db(dbname).collection(colname).insertMany(listData);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}


/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database
 * @param {QueryObject} query query what data you want to find
 * @return {Object} a cursor to one document
 */
module.exports.retrieveData = async function retrieveData(client, dbname, colname, query){
    const cursor = await client.db(dbname).collection(colname).findOne(query);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cursor)
    };
}


/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database
 * @param {QueryObject} query query what types of data you want to find
 * @returns {Object} a cursor to the list of documents -> to make it readable convert cursor.toArray()
 */
module.exports.retrieveMultiData = async function retrieveMultiData(client, dbname, colname, query){
    const cursor = await client.db(dbname).collection(colname).find(query).toArray();
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cursor)
    };
}


/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database
 * @param {QueryObject} queryFind query what types of data you want to update
 * @param {Object} data data that you want to update
 * @param {Object} upsert an options if you want to upsert a data
 * @returns {Object} a result of the event -- returning update status
 */
module.exports.updateData = async function updateData(client, dbname, colname, queryFind, data, upsert){
    const result = await client.db(dbname).collection(colname).updateOne(queryFind, data, upsert);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}


/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database
 * @param {QueryObject} queryFind query what types of data you want to update
 * @param {Object} data data that you want to update
 * @param {Object} upsert an options if you want to upsert a data
 * @returns {Object} a result of the event -- returning update status
 */
 module.exports.updateManyData = async function updateManyData(client, dbname, colname, queryFind, data, upsert){
    const result = await client.db(dbname).collection(colname).updateMany(queryFind, data, upsert);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}


/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database
 * @param {QueryObject} query query what types of data you want to delete.
 * @returns {Object} a result of the event -- returning delete status
 */
module.exports.deleteData = async function deleteData(client, dbname, colname, query){
    const result = await client.db(dbname).collection(colname).deleteOne(query);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}


/**
 * 
 * @param {ClientObject} client object returned when opening the database 
 * @param {String} dbname  database name in which you want to use
 * @param {String} colname collection name in which you want to use in the database
 * @param {QueryObject} query query what types of data you want to delete.
 * @returns {Object} a result of the event -- returning delete status
 */
module.exports.deleteManyData = async function deleteManyData(client, dbname, colname, query){
    const result = await client.db(dbname).collection(colname).deleteMany(query);
    return {
        statusCode: 200,
        headers:{
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}
