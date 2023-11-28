import { DeliveryMethod } from "@shopify/shopify-api";
import sqlite3 from 'sqlite3';

import shopify from "./shopify.js";
/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {
  /**
   * Customers can request their data from a store owner. When this happens,
   * Shopify invokes this webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-data_request
   */
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "orders_requested": [
      //     299938,
      //     280263,
      //     220458
      //   ],
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "data_request": {
      //     "id": 9999
      //   }
      // }
    },
  },

  PRODUCTS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      console.log('--- Product update ---');
      const payload = JSON.parse(body);
      console.log(payload);
      console.log('--- /Product update ---');
    },
  },

  /**
   * Store owners can request that data is deleted on behalf of a customer. When
   * this happens, Shopify invokes this webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-redact
   */
  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "orders_to_redact": [
      //     299938,
      //     280263,
      //     220458
      //   ]
      // }
    },
  },

  /**
   * 48 hours after a store owner uninstalls your app, Shopify invokes this
   * webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#shop-redact
   */
  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com"
       // }
    },
  },
  ORDERS_UPDATED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      // get user by shop
      const payload = JSON.parse(body);
      // validate if order is process



      try {
        // get session in database SQlite by shop name
        const session = await getSession(shop);

        // get fullfilmentOrder by order_id
        const fullfilmentOrder = await shopify.api.rest.FulfillmentOrder.all({
          session: session,
          order_id: payload.id,
        });

        // create fullfilment request
        const fulfillment_request = new shopify.api.rest.FulfillmentRequest({ session: session });
        fulfillment_request.fulfillment_order_id = fullfilmentOrder.data[0].id;
        fulfillment_request.message = "Fulfill this ASAP please.";
        // save fullfulment request
        await fulfillment_request.save({
          update: true,
        });


        return;


      } catch (error) {
        console.log("object err", error);
      }

    },
  },
};

async function getSession(shop) {
  return new Promise((resolve, reject) => {

    const DB_PATH = `${process.cwd()}/database.sqlite`;
    const db = new sqlite3.Database(DB_PATH);
    db.all(`SELECT * FROM shopify_sessions WHERE shop = "${shop}"`, [], (err, rows) => {

      if (err) {
        reject(err);
      } else {
        resolve(rows[0]);
      }
    });
  });
}
