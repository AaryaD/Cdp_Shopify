// src/index.ts
import express, { request, response } from 'express';
import Shopify, { ApiVersion, AuthQuery, GraphqlWithSession, WithSessionParams } from '@shopify/shopify-api';
import createApp from '@shopify/app-bridge';
import { Redirect } from '@shopify/app-bridge/actions';
import { redirect } from '@shopify/app-bridge/client/redirect';
//import { app } from '@shopify/app-bridge/actions/Print';


require('dotenv').config();

const app = express();
const { API_KEY, API_SECRET_KEY, SCOPES, SHOP, HOST, } = process.env;

Shopify.Context.initialize({
  API_KEY,
  API_SECRET_KEY,
  SCOPES: [SCOPES],
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  IS_EMBEDDED_APP: true,
  API_VERSION: ApiVersion.October21,// all supported versions are available, as well as "unstable" and "unversioned"
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage()
});

const handleWebhookRequest = async (topic: string, shop: string, webhookRequestBody: string) => {
  // handler triggered when a webhook is sent by the Shopify platform to your application
}
Shopify.Webhooks.Registry.addHandler("PRODUCTS_UPDATE", {
  path: "/webhooks",
  webhookHandler: handleWebhookRequest,
});
// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS: { [key: string]: string | undefined } = {};
// the rest of the example code goes here

app.get("/", async (req, res) => {
   // This shop hasn't been seen yet, go through OAuth to create a session
  if (ACTIVE_SHOPIFY_SHOPS[SHOP] === undefined) {
     // not logged in, redirect to login
    res.redirect(`/login`);
  } else {
    res.send("Hello world!");
    // Load your app skeleton page with App Bridge, and do something amazing!
    res.end();
  }
});
app.get('/login', async (req, res) => {
  let authRoute = await Shopify.Auth.beginAuth(
    req,
    res,
    SHOP,
    '/auth/callback',
    true,
  );
  return res.redirect(authRoute);
});
app.get('/auth/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query as unknown as AuthQuery,
    ); // req.query must be cast to unkown and then AuthQuery in order to be accepted
    console.log(session);
    console.log("***********");
    const response = await Shopify.Webhooks.Registry.register({
      path: '/webhooks',
      topic: 'PRODUCTS_UPDATE',
      accessToken: session.accessToken,
      shop: session.shop,
    });
    console.log(response);
    
    if (!response['PRODUCTS_UPDATE'].success) {
      console.log(
        `Failed to register PRODUCTS_UPDATE webhook: ${response.result}`
      );
    }
    ACTIVE_SHOPIFY_SHOPS[SHOP] = session.scope;
    //const fetchsession = await Shopify.Utils.loadCurrentSession(req, res, false);
    //console.log(fetchsession);
     
    //if (!Shopify.Context.SCOPES.equals(fetchsession.scope)) {
      //return res.redirect(`/?host=${req.query.host}&shop=${req.query.shop}`);
    // Scopes have changed, the app should redirect the merchant to OAuth
    //}
  } catch (error) {
    console.error(error); // in practice these should be handled more gracefully
  }
 
  return res.redirect(`/?host=${req.query.host}&shop=${req.query.shop}`); // wherever you want your user to end up after OAuth completes
});
app.post('/webhooks', async (req, res) => {
  try {
    console.log('webhookRegistry ' + JSON.stringify(Shopify.Webhooks.Registry.webhookRegistry));
    await Shopify.Webhooks.Registry.process(req, res);
    console.log("Inside webhook");
    //console.log(res);
    res.send("Webhook request received");
  } catch (error) {
    console.log(error);
  }
});
app.post('/webhooks/product_update', async (req, res) => {
  try {
    //await Shopify.Webhooks.Registry.process(req, res);
    console.log("Inside webhook");
    console.log(res);
    res.send("Webhook request received");
  } catch (error) {
    console.log(error);
  }
});
app.listen(3000, () => {
  console.log('your app is now listening on port 3000');
});