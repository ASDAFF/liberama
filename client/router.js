import { createRouter, createWebHashHistory } from 'vue-router';
import _ from 'lodash';

const CardIndex = () => import('./components/CardIndex/CardIndex.vue');
const Search = () => import('./components/CardIndex/Search/Search.vue');
const Card = () => import('./components/CardIndex/Card/Card.vue');
const Book = () => import('./components/CardIndex/Book/Book.vue');
const History = () => import('./components/CardIndex/History/History.vue');

//немедленная загрузка
//import Reader from './components/Reader/Reader.vue';
const Reader = () => import('./components/Reader/Reader.vue');
const ExternalLibs = () => import('./components/ExternalLibs/ExternalLibs.vue');

const Income = () => import('./components/Income/Income.vue');
const Sources = () => import('./components/Sources/Sources.vue');
const Settings = () => import('./components/Settings/Settings.vue');
const Help = () => import('./components/Help/Help.vue');
const NotFound404 = () => import('./components/NotFound404/NotFound404.vue');

const myRoutes = [
    ['/', null, null, '/cardindex'],
    ['/cardindex', CardIndex],
    ['/cardindex~search', Search],
    ['/cardindex~card', Card],
    ['/cardindex~card/:authorId', Card],
    ['/cardindex~book', Book],
    ['/cardindex~book/:bookId', Book],
    ['/cardindex~history', History],

    ['/reader', Reader],
    ['/external-libs', ExternalLibs],
    ['/income', Income],
    ['/sources', Sources],
    ['/settings', Settings],
    ['/help', Help],
    ['/404', NotFound404],
    ['/:pathMatch(.*)*', null, null, '/cardindex'],
];

let routes = {};

for (let route of myRoutes) {
    const [path, component, name, redirect] = route;
    let cleanRoute = _.pickBy({path, component, name, redirect}, _.identity);
    
    let parts = cleanRoute.path.split('~');
    let f = routes;
    for (let part of parts) {
        const curRoute = _.assign({}, cleanRoute, { path: part });

        if (!f.children)
            f.children = [];
        let r = f.children;

        f = _.find(r, {path: part});
        if (!f) {
            r.push(curRoute);
            f = curRoute;
        }
    }
}
routes = routes.children;

export default createRouter({
    history: createWebHashHistory(),
    routes
});
