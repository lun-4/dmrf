import spacepack from "@moonlight-mod/wp/spacepack_spacepack";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { DMRFNatives } from "../types";

const COOL = "Queueing message to be sent";
const module = spacepack.findByCode(COOL)[0].exports;

const natives: DMRFNatives = moonlight.getNatives("dmrf");
const logger = moonlight.getLogger("dmrf");

natives.init();

const originalSend = module.Z.sendMessage;
module.Z.sendMessage = async (...args: any[]) => {
  logger.trace("got sendMessage");
  const message = args[1];
  logger.trace("handling sendMessage", message);
  const result = await natives.sendHook(message);
  logger.trace("handled", result);
  if (result == null) {
    logger.error("dropping on sendHook not supported yet");
    return;
  }
  args[1] = result;
  return originalSend.call(module.Z, ...args);
};

async function reDispatcher(event: any) {
  logger.trace("redispatch", event.type);
  // set all message content in messages array
  // NOTE thank u husky
  if (event.type === "LOAD_MESSAGES_SUCCESS") {
    if (event.hasOwnProperty("messages") && Array.isArray(event.messages)) {
      event.messages.filter((message: any) => {
        if (
          message.hasOwnProperty("content") &&
          typeof message.content === "string"
        ) {
          return !natives.receiveHook(message);
        }
      });
      event.dmrf = true;
      if (event.messages) Dispatcher.dispatch(event);
    }
  } else if (event.type == "MESSAGE_CREATE") {
    const drop = !(await natives.receiveHook(event.message));
    event.dmrf = true;
    logger.debug("drop?", event.message.id, "?", drop);
    if (!drop) Dispatcher.dispatch(event);
  } else {
    logger.error("dmrf redispatcher got incorrect event type " + event.type);
  }
}

// make the Dispatcher interceptor async by fisrt always dropping events
// then re-dispatching them with a flag (event.dmrf) to prevent infinite recursion
// (if the event is supposed to be dropped, simply don't redispatch)
Dispatcher.addInterceptor((event) => {
  if (event.dmrf) return false;

  if (event.type === "LOAD_MESSAGES_SUCCESS") {
    reDispatcher(event);
    return true;
  } else if (event.type == "MESSAGE_CREATE") {
    reDispatcher(event);
    return true;
  } else {
    return false;
  }
});
