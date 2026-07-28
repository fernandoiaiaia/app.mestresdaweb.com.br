import EventEmitter from "events";

class WhatsappEventEmitter extends EventEmitter {}

export const whatsappEvents = new WhatsappEventEmitter();
