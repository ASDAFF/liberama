import Vue from 'vue';

// initial state
const state = {
    toolBarActive: true,
    openedBook: {},
    settings: {
        textColor: '#000000',
        backgroundColor: '#EBE2C9',
        fontStyle: '',// 'italic'
        fontWeight: '',// 'bold'
        fontSize: 20,// px
        fontName: 'ReaderDefault',
        fontCssUrl: '',
        fontVertShift: 0,

        lineInterval: 3,// px, межстрочный интервал
        textAlignJustify: true,// выравнивание по ширине
        p: 25,// px, отступ параграфа
        indent: 15,// px, отступ всего текста слева и справа
        wordWrap: true,//перенос по слогам
        keepLastToFirst: true,// перенос последней строки в первую при листании

        showStatusBar: true,
        statusBarTop: false,// top, bottom
        statusBarHeight: 19,// px
        statusBarColorAlpha: 0.4,

        pageChangeTransition: '',// '' - нет, downShift, rightShift, thaw - протаивание, blink - мерцание
        pageChangeTransitionSpeed: 50, //0-100%

        allowUrlParamBookPos: true,
    },
};

// getters
const getters = {
    lastOpenedBook: (state) => {
        let max = 0;
        let result = null;
        for (let bookKey in state.openedBook) {
            const book = state.openedBook[bookKey];
            if (book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }
        return result;
    },
};

// actions
const actions = {};

function delBook(state, value) {
    Vue.delete(state.openedBook, value.key);
}

function cleanBooks(state) {
    if (Object.keys(state.openedBook).length > 100) {
        let min = Date.now();
        let found = null;
        for (let bookKey in state.openedBook) {
            const book = state.openedBook[bookKey];
            if (book.touchTime < min) {
                min = book.touchTime;
                found = book;
            }
        }

        if (found) {
            delBook(state, found);
            cleanBooks(state);
        }
    }
}

// mutations
const mutations = {
    setToolBarActive(state, value) {
        state.toolBarActive = value;
    },
    setOpenedBook(state, value) {
        Vue.set(state.openedBook, value.key, Object.assign({}, value, {touchTime: Date.now()}));
        cleanBooks(state);
    },
    delOpenedBook(state, value) {
        delBook(state, value);
    },
    setSettings(state, value) {
        state.settings = Object.assign({}, state.settings, value);
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
