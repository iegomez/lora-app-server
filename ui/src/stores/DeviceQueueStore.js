import { EventEmitter } from "events";

import Swagger from "swagger-client";

import sessionStore from "./SessionStore";
import {checkStatus, errorHandler } from "./helpers";
import dispatcher from "../dispatcher";


class DeviceQueueStore extends EventEmitter {
  constructor() {
    super();
    this.swagger = new Swagger("/swagger/deviceQueue.swagger.json", sessionStore.getClientOpts());
  }


  list(devEUI, callbackFunc) {
    this.swagger.then(client => {
      client.apis.DeviceQueueService.List({
        dev_eui: devEUI, 
      })
      .then(checkStatus)
      .then(resp => {
        callbackFunc(resp.obj);
      })
      .catch(errorHandler);
    });
  }
	
	enqueue(devEUI, deviceQueueItem, callbackFunc) {
		this.swagger.then(client => {
      client.apis.DeviceQueueService.Enqueue({
				"device_queue_item.dev_eui": devEUI,
        body: {
          deviceQueueItem: deviceQueueItem,
        },
			})
      .then(checkStatus)
      .then(resp => {
        this.notify("created");
        callbackFunc(resp.obj);
      })
      .catch(errorHandler);
		});
	}

	flush(devEUI, callbackFunc) {
    this.swagger.then(client => {
      client.apis.DeviceQueueService.Flush({
        dev_eui: devEUI,
      })
      .then(checkStatus)
      .then(resp => {
        this.notifyFlush("flushed");
        callbackFunc(resp.obj);
      })
      .catch(errorHandler);
    });
  }

  notify(action) {
    dispatcher.dispatch({
      type: "CREATE_NOTIFICATION",
      notification: {
        type: "success",
        message: "queue item has been " + action,
      },
    });
	}
	
	notifyFlush(action) {
    dispatcher.dispatch({
      type: "CREATE_NOTIFICATION",
      notification: {
        type: "success",
        message: "queue has been " + action,
      },
    });
	}


}

const deviceQueueStore = new DeviceQueueStore();
export default deviceQueueStore;
