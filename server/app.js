import querystring  from 'querystring';
import { StyleRoot } from 'radium';
import express      from 'express';
import cookieParser from 'cookie-parser';
import serializeJs  from 'serialize-javascript';

import React                     from 'react';
import ReactDOM                  from 'react-dom/server';
import { Provider }              from 'react-redux';
import { RouterContext, match } from 'react-router';
// import { escapeHTML }            from 'lodash';
import escapeHTML                from 'lodash';

import routes         from '../shared/routes.js';
// import configureStore from '../shared/store/configureStore';
import i18n           from '../shared/i18n';
import api            from '../shared/apiSingleton';
import { makeSlug }   from '../shared/utils/urlUtil';
import { collections } from 'lodash';

import clientConfig from '../shared/config';

import ruLocaleData from '../public/static/lang/ru.json';
import ukLocaleData from '../public/static/lang/uk.json';
import enLocaleData from '../public/static/lang/en.json';
import trLocaleData from '../public/static/lang/tr.json';

import { fetchComponentsData,
         getMetaDataFromState,
         makeRedirectUrl,
         detectLocale,
         getIp,
         getAssetsPaths } from './utils';

import send404 from './render404Html';

// Initializa localization
const i18nToolsRegistry = {
    ru   : new i18n.Tools({ localeData: ruLocaleData, locale: 'ru' }),
    en   : new i18n.Tools({ localeData: enLocaleData, locale: 'en' }),
    uk   : new i18n.Tools({ localeData: ukLocaleData, locale: 'uk' }),
    tr   : new i18n.Tools({ localeData: trLocaleData, locale: 'tr' })
};

global.localStorage = {
  getItem: function(key, value){
    return this[key] ? this[key].value : void 0;
  },
  setItem: function(key, value){
    this[key] = value;
    return;
  }
};

const app = express();

app.use('/static', express.static('public/static'));
app.use(cookieParser());

app.use((req, res) => {
    // Process old links like /en/activations
    if (req.url.match(/\/[a-z]{2}\//i)) {
        const noLangUrl = req.url.replace(/^\/[a-z]{2}/i, '');

        return res.redirect(302, noLangUrl);
    }

    // If account is authenticated redirect him to the wall embedded into the main app
    if (req.cookies.authenticated && !req.url.match('embed')) {
        const redirectUrl = makeRedirectUrl({ originalUrl: req.url });

        return res.redirect(302, redirectUrl);
    }

    const locale = detectLocale(req);
    const ip     = getIp(req);

    api.apiClient.setXRealIP(ip);
    const store = {
        subscribe: (function(){}),
        dispatch: (function(){}),
        getState: (function(){})
    };// configureStore();

    const i18nTools = i18nToolsRegistry[locale];

    match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
        // if (req.url === '/') {
            // return res.redirect(302, '/activations');
        // }
        if (redirectLocation) {
            return res.redirect(301, redirectLocation.pathname + redirectLocation.search);
        } else if (error) {
            res.send(500, error.message);
        } else if (!renderProps) {
            send404(res, i18nTools);

            return;
        } else {
            fetchComponentsData({
                locale,
                // dispatch   : store.dispatch,
                components : renderProps.components,
                params     : renderProps.params,
                query      : renderProps.location.query
            })
            .then(() => {
                const initialState = {};//store.getState();

                const metaData = getMetaDataFromState({
                    params : renderProps.params,
                    query  : renderProps.location.query,
                    lang   : locale,
                    route  : renderProps.routes[renderProps.routes.length - 1].path,
                    state  : {}
                });

                if (metaData.type === 'ACTIVATION') {
                    if (!metaData.title) {
                        send404(res, i18nTools);

                        Promise.reject({});
                    }
                    const activationId = renderProps.params.id;
                    const expectedPath =  `/activations/${activationId}/${makeSlug(metaData.title)}`;

                    if (!req.path.endsWith(expectedPath)) {
                        // TODO optimize. There is no need to fetch similar tests and tests from the same author
                        const expectedUrl = Object.keys(req.query).length
                            ? `${expectedPath}?${querystring.stringify(req.query)}`
                            : expectedPath;

                        return {
                            isRedirect : true,
                            redirectUrl: expectedUrl
                        };
                    }
                }
                const componentHTML = ReactDOM.renderToString(
                    <Provider store={store} >
                      <StyleRoot radiumConfig={{userAgent: req.headers['user-agent']}}>
                        <i18n.Provider i18n={i18nTools}>
                          <RouterContext {...renderProps} />
                        </i18n.Provider>
                      </StyleRoot>
                    </Provider>
                );

                const html = renderHTML({
                    componentHTML,
                    initialState,
                    metaData,
                    config : clientConfig
                });

                return { html };
            })
            .then(({ isRedirect, redirectUrl, html }) => {
                res.cookie('locale', locale, { maxAge: 900000 });

                if (isRedirect) {
                    res.redirect(301, redirectUrl);
                } else {
                    res.end(html);
                }
            })
            .catch(err => {
                console.log(err.stack);
                res.end(err.message);
            });
        }
    });
});

function renderHTML({ componentHTML, initialState, metaData, config }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="shortcut icon" href="/static/favicon.ico"/>
            <title>${escapeHTML(metaData.title)} - Tally US</title>

            <meta name="description" content="${escapeHTML(metaData.description)}">
            <meta property="og:title" content="${escapeHTML(metaData.title)}" />
            <meta property="og:site_name" content="${escapeHTML(metaData.siteName)}"/>
            <meta property="og:image" content="${escapeHTML(metaData.image)}" />
            <meta property="og:image:width" content="158" />
            <meta property="og:image:height" content="158" />
            <meta property="og:description" content="${escapeHTML(metaData.description)}" />
            <meta property="og:locale" content="en_US" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:site" content="@tallyus" />
            <meta name="twitter:title" content="${escapeHTML(metaData.title)}" />
            <meta name="twitter:description" content="${escapeHTML(metaData.description)}" />
            <meta name="twitter:image" content="${escapeHTML(metaData.image)}" />
            <meta property="fb:app_id" content="${escapeHTML(config.facebookAppId)}" />

            <link href='https://fonts.googleapis.com/css?family=Roboto:400,100,300,500,700,900&subset=latin,cyrillic' rel='stylesheet' type='text/css'>
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            <link rel="stylesheet" href="https://storage.googleapis.com/code.getmdl.io/1.0.6/material.cyan-pink.min.css" />
            <link rel="stylesheet" href="//cdn.materialdesignicons.com/1.2.65/css/materialdesignicons.min.css">

            <script type="text/javascript" src="https://js.stripe.com/v2/"></script>
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">

            <!--<link rel="stylesheet" href="${config.staticUrl}/${getAssetsPaths().css}">-->
            <script>
                // NOTE: Insert Google Analytics code here
            </script>

        </head>
        <body>
        <div id="react-view">${componentHTML}</div>
          <script type="application/javascript">
            window.__CONFIG__ = ${serializeJs(config, { isJSON: true })};
            window.__INITIAL_STATE__ = ${serializeJs(initialState, { isJSON: true })};
          </script>

          <script src="https://storage.googleapis.com/code.getmdl.io/1.0.6/material.min.js"></script>

          <script type="application/javascript" src="${config.staticUrl}/${getAssetsPaths().js}"></script>


        </body>
        </html>
    `;
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server listening on: ${PORT}`);
});
