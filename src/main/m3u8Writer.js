const fs = require('fs');
const path = require('path');

/**
 * Create m3u8 Writer
 */
function createM3u8Writer(folder) {
    const m3u8Writer = {
        folder: folder,
        includedFiles: [],
        logger: null,
        newFile: true,
        watcher: null,
        m3u8Name: null,

        start() {
            this.logger = fs.createWriteStream(
                path.join(folder, 'index.m3u8'),
                {
                    flags: 'a',
                }
            );

            this.watcher = fs.watch(folder, (eventType, filename) => {
                if (!filename) return;
                if (filename === 'index.m3u8') return;

                if (
                    !filename.includes('.m3u8') &&
                    !this.includedFiles.includes(filename)
                ) {
                    this._handleNewChunk(filename);
                }

                if (
                    filename.includes('.m3u8') &&
                    !filename.includes('.m3u8.tmp') &&
                    this.newFile
                ) {
                    this._handleM3u8Update(filename);
                }
            });
        },

        async stop() {
            this.includedFiles = [];
            this.watcher.close();

            await this._finalizeM3u8();
            await this._waitForStreamClose(this.logger);

            const index = fs.readFileSync(path.join(folder, 'index.m3u8'), {
                encoding: 'utf8',
                flag: 'r',
            });
        },

        _handleNewChunk(filename) {
            this.includedFiles.push(filename);
            this.newFile = true;
        },

        _handleM3u8Update(filename) {
            this.newFile = false;
            if (!this.m3u8Name) this.m3u8Name = filename;

            fs.readFile(path.join(folder, filename), 'utf8', (err, data) => {
                if (err) return;
                const lines = data.split(/\r?\n/);

                if (lines.length === 7) {
                    this._writeLine(lines[0]);
                    this._writeLine(lines[1]);
                    this._writeLine(lines[2]);
                    this._writeLine(lines[3]);
                    this._writeLine(lines[4]);
                    this._writeLine(lines[5]);
                    return;
                }

                if (lines.length === 8) {
                    this._writeLine(lines[0]);
                    this._writeLine(lines[1]);
                    this._writeLine(lines[2]);
                    this._writeLine(lines[3]);
                    this._writeLine(lines[4]);
                    this._writeLine(lines[5]);
                    this._writeLine(lines[6]);
                    return;
                }

                if (lines[lines.length - 2] === '#EXT-X-ENDLIST') {
                    return;
                }

                this._writeLine(lines[lines.length - 3]);
                this._writeLine(lines[lines.length - 2]);
            });
        },

        async _finalizeM3u8() {
            return new Promise((resolve) => {
                fs.readFile(
                    path.join(folder, this.m3u8Name),
                    'utf8',
                    (err, data) => {
                        if (err) return;
                        const lines = data.split(/\r?\n/);

                        if (lines[lines.length - 2] === '#EXT-X-ENDLIST') {
                            this._writeLine(lines[lines.length - 4]);
                            this._writeLine(lines[lines.length - 3]);
                            this._writeLine(lines[lines.length - 2]);
                            return resolve();
                        }

                        this._writeLine('#EXT-X-ENDLIST');
                        return resolve();
                    }
                );
            });
        },

        async _waitForStreamClose(stream) {
            stream.end();
            return new Promise((resolve) => {
                stream.once('finish', () => {
                    resolve();
                });
            });
        },

        _writeLine(line) {
            this.logger.write(`${line}\n`);
        },
    };

    return m3u8Writer;
}

module.exports.createM3u8Writer = createM3u8Writer;
