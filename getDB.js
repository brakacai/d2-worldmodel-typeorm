const path = require('path');
const fs = require('fs');
const request = require('request-promise-native');
const JSZip = new require('jszip');
const url = 'https://www.bungie.net/Platform/Destiny2/Manifest/'

async function getDatabaseName(apiKey) {
    const manifestResponse = (await request.get({ uri: url.toString(), headers: { "X-API-Key": apiKey }, json: true }))

    if (manifestResponse.ErrorCode !== 1) {
        const error = new Error("Error while getting the manifest");
        error.stack = JSON.stringify(manifestResponse);
        throw error;
    }
    return manifestResponse.Response.mobileWorldContentPaths["en"];
}

async function writeDatabaseFile(databaseFile, databaseFileName) {
    fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true })
    return new Promise(resolve => {
        databaseFile.nodeStream().pipe(
            fs
                .createWriteStream(path.join(__dirname, 'tmp', databaseFileName))
                .on("close", () => {
                    resolve(path.join(__dirname, 'tmp', databaseFileName));
                })
        );
    });
}

async function getFromAPI() {
    const databaseName = await getDatabaseName(process.argv[2]);

    const databaseFileName = path.parse(databaseName).base;

    const rawZip = await request.get(`https://Bungie.net${databaseName}`, { encoding: null });
    const zipFile = await JSZip.loadAsync(rawZip);
    const databaseFile = zipFile.files[databaseFileName];
    console.log(await writeDatabaseFile(databaseFile, databaseFileName));
}

getFromAPI();