let instance = null;

const defaultTimeout = 15*1000;//15 sec
const exitSignals = ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP', 'uncaughtException', 'SIGUSR2'];

//singleton
class AsyncExit {
    constructor() {
        if (!instance) {
            this.onSignalCallbacks = new Map();
            this.callbacks = new Map();
            this.afterCallbacks = new Map();
            this.exitTimeout = defaultTimeout;
            this.inited = false;
            instance = this;
        }

        return instance;
    }

    init(signals = exitSignals, codeOnSignal = 2) {
        if (this.inited)
            throw new Error('AsyncExit: initialized already');

        const runSingalCallbacks = async(signal) => {
            for (const signalCallback of this.onSignalCallbacks.keys()) {
                try {
                    await signalCallback(signal);
                } catch(e) {
                    console.error(e);
                }
            }
        };

        for (const signal of signals) {
            process.once(signal, async() => {
                await runSingalCallbacks(signal);
                this.exit(codeOnSignal);
            });
        }

        this.inited = true;
    }

    onSignal(signalCallback) {
        if (!this.onSignalCallbacks.has(signalCallback)) {
            this.onSignalCallbacks.set(signalCallback, true);
        }
    }

    add(exitCallback) {
        if (!this.callbacks.has(exitCallback)) {
            this.callbacks.set(exitCallback, true);
        }
    }

    addAfter(exitCallback) {
        if (!this.afterCallbacks.has(exitCallback)) {
            this.afterCallbacks.set(exitCallback, true);
        }
    }

    remove(exitCallback) {
        if (this.callbacks.has(exitCallback)) {
            this.callbacks.delete(exitCallback);
        }
        if (this.afterCallbacks.has(exitCallback)) {
            this.afterCallbacks.delete(exitCallback);
        }
    }

    setExitTimeout(timeout) {
        this.exitTimeout = timeout;
    }

    exit(code = 0) {
        if (this.exiting)
            return;

        this.exiting = true;

        const timer = setTimeout(() => { process.exit(code); }, this.exitTimeout);

        (async() => {
            for (const exitCallback of this.callbacks.keys()) {
                try {
                    await exitCallback();
                } catch(e) {
                    console.error(e);
                }
            }

            for (const exitCallback of this.afterCallbacks.keys()) {
                try {
                    await exitCallback();
                } catch(e) {
                    console.error(e);
                }
            }

            clearTimeout(timer);
            //console.log('Exited gracefully');
            process.exit(code);
        })();
    }
}

module.exports = AsyncExit;
