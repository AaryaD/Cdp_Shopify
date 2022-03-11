import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion, AuthQuery, GraphqlWithSession, WithSessionParams } from '@shopify/shopify-api';
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions)) // Use this after the variable declaration

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October21,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});
// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.get('/login', async (ctx) => {
      const shop = ctx.query.shop;
      //Shop has not been seen yet.Go through OAuth to create a session.

      if(ACTIVE_SHOPIFY_SHOPS[shop]===undefined) {
        ctx.redirect(`/auth/callback?shop=${shop}`);
      }
      else
      {
        await handleRequest(ctx);
      }
     
      try {
        const authRoute = await Shopify.Auth.beginAuth(
          req,
          res,
          shop,
          '/auth/callback',
          true
        )

        return res.redirect(authRoute)
      } catch (error) {
        log.error(error)
        res.status(500).send('Unexpected error occured')
      }
    });
  
  router.post("/webhooks", async (ctx) => {
    try {
      // We'll compare the hmac to our own hash
    //const hmac = ctx.get('X-Shopify-Hmac-Sha256')

    // Create a hash using the body and our key
    //const hash = crypto
      //.createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      //.update(ctx.request.rawBody, 'utf8', 'hex')
      //.digest('base64')

    // Compare our hash to Shopify's hash
    //if (hash === hmac) {
      // It's a match! All good
      //console.log('Phew, it came from Shopify!')
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
      res.sendStatus(200);
    //}
  }
    catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", verifyRequest(), handleRequest); //everything else must have sessions

  router.get("/api/themes", async (ctx) => {
    console.log("before load session");
    const session = await Shopify.Utils.loadCurrentSession(
      ctx.req,
      ctx.res,
      false
    );
    console.log("session", session); // <= RETURNS UNDEFINED
  });
  // Load the current session to get the `accessToken`
const session = await Shopify.Utils.loadCurrentSession(req, res);
// GraphQLClient takes in the shop url and the accessToken for that shop.
const client = new Shopify.Clients.Graphql(session.shop, session.accessToken);
// Use client.query and pass your query as `data`
const products = await client.query({
  data: `{
      products (first: 10) {
        edges {
          node {
            id
            title
            descriptionHtml
          }
        }
      }
    }`,
});

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.use(
    createShopifyAuth({
      accessMode: "offline",
      prefix: "/install",
      async afterAuth(ctx) {
        const { shop, accessToken, scope } = ctx.state.shopify;
        // Note: accessToken here is offline token.
        ctx.redirect(`/auth/callback?shop=${shop}`);
      },
    })
  );
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        const { shop, accessToken, scope } = ctx.state.shopify;
        // Note: accessToken here is online token.
      },
    })
  );
  //Content Security Policy
server.use(function (req, res, next) {
  var shopurl;
  var fa;
  console.log(req.query.shop)
  if (req.query.shop !== "") {
    shopurl = req.query.shop;
    fa = `frame-ancestors ${shopurl} admin.shopify.com`;
    res.setHeader(
      "Content-Security-Policy",
     fa
    );
    //res.setHeader("Access-Control-Allow-Origin", "https://www.youtube.com/*");
    //res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://dressify-test-store.myshopify.com/");
  }
  next();
});
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
