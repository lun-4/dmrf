import spacepack from "@moonlight-mod/wp/spacepack_spacepack";
import Dispatcher from "@moonlight-mod/wp/discord/Dispatcher";
import { DMRFNatives } from "../types";

const MessageActionCreators = spacepack.require(
  "discord/actions/MessageActionCreators"
).default;

const natives: DMRFNatives = moonlight.getNatives("dmrf");
const logger = moonlight.getLogger("dmrf");

natives.init();

const originalSend = MessageActionCreators.sendMessage;
const originalEdit = MessageActionCreators.editMessage;

async function hook(message: any, name: string): Promise<boolean | any> {
  logger.debug(`Hooking ${name}`);
  const result = await natives.sendHook(message);
  logger.debug(`${name} - Result:`, result);
  if (result == null) {
    // NOTE(cyn): this error seems redundant now?
    logger.error(`${name} - Dropping on sendHook not supported yet`);
    return false;
  }

  return result;
}

MessageActionCreators.sendMessage = async function (
  ...args: any[]
): Promise<any> {
  const result = await hook(args[1], "sendMessage");
  if (result === false) return;
  args[1] = result;

  return originalSend.call(MessageActionCreators, ...args);
};

MessageActionCreators.editMessage = async function (
  ...args: any[]
): Promise<any> {
  const result = await hook(args[2], "editMessage");
  if (result === false) return;
  args[2] = result;

  return originalEdit.call(MessageActionCreators, ...args);
};

const EVENTS_BULK = [
  "LOAD_MESSAGES_SUCCESS",
  "LOAD_MESSAGES_AROUND_SUCCESS",
  "LOCAL_MESSAGES_LOADED"
];
const EVENTS_SINGLE = ["MESSAGE_CREATE", "MESSAGE_UPDATE"];
const ALL_EVENTS = [...EVENTS_BULK, ...EVENTS_SINGLE];

async function reDispatcher(event: any) {
  logger.debug("redispatch", event.type);
  // set all message content in messages array
  // NOTE: thank u husky
  if (EVENTS_BULK.includes(event.type)) {
    logger.debug("redispatching bulk event", event.messages);
    if (event.messages != null && Array.isArray(event.messages)) {
      const newMessages = [];
      // NOTE(cyn): i dont remember if filter allows async, so using a normal for loop
      for (let message of event.messages) {
        if (message.content != null && typeof message.content === "string") {
          const { allow, msg } = await natives.receiveHook(message);
          if (!allow) continue;
          message = msg;
          newMessages.push(message);
        } else {
          // NOTE(cyn): just to be safe
          newMessages.push(message);
        }
      }
      event.messages = newMessages;
      event.dmrf = true;
      if (event.messages) Dispatcher.dispatch(event);
    }
  } else if (EVENTS_SINGLE.includes(event.type)) {
    logger.debug("redispatching single event", event.message);
    const { allow, msg } = await natives.receiveHook(event.message);
    event.message = msg;
    event.dmrf = true;
    logger.debug("drop?", event.message.id, "?", !allow);
    if (allow) Dispatcher.dispatch(event);
  } else {
    logger.error("dmrf redispatcher got incorrect event type " + event.type);
  }
}

// make the Dispatcher interceptor async by fisrt always dropping events
// then re-dispatching them with a flag (event.dmrf) to prevent infinite recursion
// (if the event is supposed to be dropped, simply don't redispatch)
Dispatcher.addInterceptor((event) => {
  if (event.dmrf) return false;

  if (ALL_EVENTS.includes(event.type)) {
    reDispatcher(event);
    return true;
  } else {
    return false;
  }
});
