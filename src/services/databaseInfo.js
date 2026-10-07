const{
    sourceDb,
    destinationDb
} = require("../firebase");

async function getDatabaseInfo(db){

    const collections = await db.listCollections();

    const collectionInfo = [];

    let totalDocuments = 0;

    for(const collection of collections){

        const snapshot = await collection.get();

        const documentCount = snapshot.size;

        totalDocuments += documentCount;

        collectionInfo.push({
            name: collection.id,
            path: collection.path,
            documentCount: documentCount
        });
    }
    return {
        connected: true,
        collectionCount: collections.lenght,
        documentCount: totalDocuments,
        collections: collectionInfo
    };
}

async function getSourceInfo(){
    return await getDatabaseInfo(sourceDb);
}

async function getDestinationInfo(){
    return await getDatabaseInfo(destinationDb);
}

module.exports ={
    getSourceInfo,
    getDestinationInfo
};