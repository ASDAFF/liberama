const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

const got = require('got');
const FileDecompressor = require('../server/core/FileDecompressor');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = `${distDir}/tmp/public`;
const outDir = `${distDir}/linux`;

const tempDownloadDir = `${distDir}/tmp/download`;

async function main() {
    const decomp = new FileDecompressor();

    await fs.emptyDir(outDir);
    // перемещаем public на место
    if (await fs.pathExists(publicDir))
        await fs.move(publicDir, `${outDir}/public`);

    await fs.ensureDir(tempDownloadDir);

    //sqlite3
    const sqliteRemoteUrl = 'https://mapbox-node-binary.s3.amazonaws.com/sqlite3/v5.0.2/napi-v3-linux-x64.tar.gz';
    const sqliteDecompressedFilename = `${tempDownloadDir}/napi-v3-linux-x64/node_sqlite3.node`;

    if (!await fs.pathExists(sqliteDecompressedFilename)) {
        // Скачиваем node_sqlite3.node для винды, т.к. pkg не включает его в сборку
        await pipeline(got.stream(sqliteRemoteUrl), fs.createWriteStream(`${tempDownloadDir}/sqlite.tar.gz`));
        console.log(`done downloading ${sqliteRemoteUrl}`);

        //распаковываем
        console.log(await decomp.unpackTarZZ(`${tempDownloadDir}/sqlite.tar.gz`, tempDownloadDir));
        console.log('files decompressed');
    }
    // копируем в дистрибутив
    await fs.copy(sqliteDecompressedFilename, `${outDir}/node_sqlite3.node`);
    console.log(`copied ${sqliteDecompressedFilename} to ${outDir}/node_sqlite3.node`);

    //ipfs
    const ipfsDecompressedFilename = `${tempDownloadDir}/go-ipfs/ipfs`;
    if (!await fs.pathExists(ipfsDecompressedFilename)) {
        // Скачиваем ipfs
        const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_linux-amd64.tar.gz';

        await pipeline(got.stream(ipfsRemoteUrl), fs.createWriteStream(`${tempDownloadDir}/ipfs.tar.gz`));
        console.log(`done downloading ${ipfsRemoteUrl}`);

        //распаковываем
        console.log(await decomp.unpackTarZZ(`${tempDownloadDir}/ipfs.tar.gz`, tempDownloadDir));
        console.log('files decompressed');
    }

    // копируем в дистрибутив
    await fs.copy(ipfsDecompressedFilename, `${outDir}/ipfs`);
    console.log(`copied ${tempDownloadDir}/go-ipfs/ipfs to ${outDir}/ipfs`);
    //для development
    const devIpfsFile = path.resolve(__dirname, '../server/ipfs');
    if (!await fs.pathExists(devIpfsFile)) {
        await fs.copy(ipfsDecompressedFilename, devIpfsFile);
    }
}

main();
