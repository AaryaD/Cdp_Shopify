import ApolloClient from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import App from "next/app";
import { AppProvider } from "@shopify/polaris";
import { Provider, useAppBridge } from "@shopify/app-bridge-react";
import { authenticatedFetch,getSessionToken } from "@shopify/app-bridge-utils";
import { Redirect } from "@shopify/app-bridge/actions";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import React from "react";
import ClientRouter from "../components/ClientRouter";

const host = 'ZHJlc3NpZnktdGVzdC1zdG9yZS5teXNob3BpZnkuY29tL2FkbWlu';
const apiKey = '9409c693fe056fb65fa52a142e3ebaa0';
const redirectUri = 'https://f843-2402-e280-3e04-88-f907-4870-fee2-5ab2.ngrok.io/';
const permissionUrl = `https://${host}/admin/oauth/authorize?client_id=9409c693fe056fb65fa52a142e3ebaa0}&scope=read_products,read_content&redirect_uri=https://f843-2402-e280-3e04-88-f907-4870-fee2-5ab2.ngrok.io/`;
const client_id=`${apiKey}&scope=read_products,read_content&redirect_uri=${redirectUri}`;

//var window = getWindow();
var window = global;
if (typeof window!== "undefined") {
  console.log("On the browser");
  console.log(window);
}
else
{
  console.log("On the server");
}

// If the current window is the 'parent', change the URL by setting location.href
if (window.top == window.self) {
  window.location.assign(permissionUrl);
  //window.location.assign(permissionUrl);
  //window.location.href=permissionUrl;
  // If the current window is the 'child', change the parent's URL with Shopify App Bridge's Redirect action
} else {
  const app = createApp({
    apiKey: apiKey,
    host: host
  }
  );
 Redirect.create(app).dispatch(Redirect.Action.REMOTE, permissionUrl);
}
const app = createApp({
  apiKey: apiKey,
  host: host
});

function getData() {
  fetch('https://dressify-test-store.myshopify.com/')
  .then(response => response.json())
  .then(data => console.log(data));
}
getData();

function userLoggedInFetch(app) {
  const fetchFunction = authenticatedFetch(app);

  return async (uri, options) => {
    const response = await fetchFunction(uri, options);

    if (
      response.headers.get("X-Shopify-API-Request-Failure-Reauthorize") === "1"
    ) {
      const authUrlHeader = response.headers.get(
        "X-Shopify-API-Request-Failure-Reauthorize-Url"
      );

      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.APP, authUrlHeader || `/auth`);
      return null;
    }

    return response;
  };
}

function MyProvider(props) {
  const app = useAppBridge();
  getSessionToken(app).then(token => {
    console.log("~ getSessionToken ~ token",token);
  } )
  const client = new ApolloClient({
    fetch: userLoggedInFetch(app),
    fetchOptions: {
      credentials: "include",
    },
  });

  const Component = props.Component;

  return (
    <ApolloProvider client={client}>
      <Component {...props} />
    </ApolloProvider>
  );
}

class MyApp extends App {
  render() {
    //const { Component, pageProps, host} = this.props;
      const { Component, pageProps, shopOrigin} = this.props;
      const config = {apiKey: API_KEY, shopOrigin, forceRedirect: true};
    return (
      <React.Fragment>
        <Head>
            <title>sampleapp</title>
            <meta charSet="utf-8" />
        </Head>
        <Provider config={config}>
          <ClientRouter/>
          <AppProvider i18n={translations}> 
            <Component {...pageProps} />
          </AppProvider>
        </Provider> 
      </React.Fragment>
    );
  }
}

MyApp.getInitialProps = async ({ ctx }) => {
  return {
    shopOrigin: ctx.query.shop,
    API_KEY : process.env.API_KEY
    //host: ctx.query.host,
  };
};

export default MyApp;
