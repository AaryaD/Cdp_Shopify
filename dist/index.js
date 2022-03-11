"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const shopify_api_1 = __importStar(require("@shopify/shopify-api"));
//import { app } from '@shopify/app-bridge/actions/Print';
require('dotenv').config();
const app = (0, express_1.default)();
const { API_KEY, API_SECRET_KEY, SCOPES, SHOP, HOST, } = process.env;
shopify_api_1.default.Context.initialize({
    API_KEY,
    API_SECRET_KEY,
    SCOPES: [SCOPES],
    HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
    IS_EMBEDDED_APP: true,
    API_VERSION: shopify_api_1.ApiVersion.October21,
    SESSION_STORAGE: new shopify_api_1.default.Session.MemorySessionStorage()
});
const handleWebhookRequest = async (topic, shop, webhookRequestBody) => {
    // handler triggered when a webhook is sent by the Shopify platform to your application
};
shopify_api_1.default.Webhooks.Registry.addHandler("PRODUCTS_UPDATE", {
    path: "/webhooks",
    webhookHandler: handleWebhookRequest,
});
// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};
// the rest of the example code goes here
app.get("/", async (req, res) => {
    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[SHOP] === undefined) {
        // not logged in, redirect to login
        res.redirect(`/login`);
    }
    else {
        res.send("Hello world!");
        // Load your app skeleton page with App Bridge, and do something amazing!
        res.end();
    }
});
app.get('/login', async (req, res) => {
    let authRoute = await shopify_api_1.default.Auth.beginAuth(req, res, SHOP, '/auth/callback', true);
    return res.redirect(authRoute);
});
app.get('/auth/callback', async (req, res) => {
    try {
        const session = await shopify_api_1.default.Auth.validateAuthCallback(req, res, req.query); // req.query must be cast to unkown and then AuthQuery in order to be accepted
        console.log(session);
        console.log("***********");
        const response = await shopify_api_1.default.Webhooks.Registry.register({
            path: '/webhooks',
            topic: 'PRODUCTS_UPDATE',
            accessToken: session.accessToken,
            shop: session.shop,
        });
        console.log(response);
        if (!response['PRODUCTS_UPDATE'].success) {
            console.log(`Failed to register PRODUCTS_UPDATE webhook: ${response.result}`);
        }
        ACTIVE_SHOPIFY_SHOPS[SHOP] = session.scope;
        //const fetchsession = await Shopify.Utils.loadCurrentSession(req, res, false);
        //console.log(fetchsession);
        //if (!Shopify.Context.SCOPES.equals(fetchsession.scope)) {
        //return res.redirect(`/?host=${req.query.host}&shop=${req.query.shop}`);
        // Scopes have changed, the app should redirect the merchant to OAuth
        //}
    }
    catch (error) {
        console.error(error); // in practice these should be handled more gracefully
    }
    return res.redirect(`/?host=${req.query.host}&shop=${req.query.shop}`); // wherever you want your user to end up after OAuth completes
});
app.post('/webhooks', async (req, res) => {
    try {
        console.log('webhookRegistry ' + JSON.stringify(shopify_api_1.default.Webhooks.Registry.webhookRegistry));
        await shopify_api_1.default.Webhooks.Registry.process(req, res);
        console.log("Inside webhook");
        //console.log(res);
        res.send("Webhook request received");
    }
    catch (error) {
        console.log(error);
    }
});
app.post('/webhooks/product_update', async (req, res) => {
    try {
        //await Shopify.Webhooks.Registry.process(req, res);
        console.log("Inside webhook");
        console.log(res);
        res.send("Webhook request received");
    }
    catch (error) {
        console.log(error);
    }
});
app.listen(3000, () => {
    console.log('your app is now listening on port 3000');
});
//# sourceMappingURL=index.js.map