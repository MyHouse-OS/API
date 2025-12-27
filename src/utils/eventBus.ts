import { EventEmitter } from "node:events";

export const eventBus = new EventEmitter();

export const EVENTS = {
	STATE_CHANGE: "STATE_CHANGE",
	NEW_CONNECTION: "NEW_CONNECTION",
};
