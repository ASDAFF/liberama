const got = require('got');

class FileDownloader {
    constructor(limitDownloadSize = 0) {
        this.limitDownloadSize = limitDownloadSize;
    }

    async load(url, callback, abort) {
        let errMes = '';
        const options = {
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; HasCodingOs 1.0; Linux x64) AppleWebKit/637.36 (KHTML, like Gecko) Chrome/70.0.3112.101 Safari/637.36 HasBrowser/5.0'
            },
            responseType: 'buffer',
        };

        const response = await got(url, Object.assign({}, options, {method: 'HEAD'}));

        let estSize = 0;
        if (response.headers['content-length']) {
            estSize = response.headers['content-length'];
        }

        let prevProg = 0;
        const request = got(url, options);

        request.on('downloadProgress', progress => {
            if (this.limitDownloadSize) {
                if (progress.transferred > this.limitDownloadSize) {
                    errMes = 'Файл слишком большой';
                    request.cancel();
                }
            }

            let prog = 0;
            if (estSize)
                prog = Math.round(progress.transferred/estSize*100);
            else if (progress.transferred)
                prog = Math.round(progress.transferred/(progress.transferred + 200000)*100);

            if (prog != prevProg && callback)
                callback(prog);
            prevProg = prog;

            if (abort && abort()) {
                errMes = 'abort';
                request.cancel();
            }
        });

        try {
            return (await request).body;
        } catch (error) {
            errMes = (errMes ? errMes : error.message);
            throw new Error(errMes);
        }
    }
}

module.exports = FileDownloader;