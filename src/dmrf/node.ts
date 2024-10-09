import type { DMRFNatives, MRF } from "./types";

let loaded_mrfs: MRF[] = [];

const logger = moonlightNode.getLogger("dmrf");

function init() {
  let scripts =
    moonlightNode.getConfigOption<string[]>("dmrf", "mrfScripts") ?? [];
  loaded_mrfs = scripts.map((scriptPath) => {
    logger.info("[dmrf] Loading MRF: ", scriptPath);
    const mrf = require(scriptPath);
    if (mrf.init) {
      mrf.init();
    }
    return mrf;
  });
}

async function receiveHook(msg: any): Promise<boolean> {
  for (const mrf of loaded_mrfs) {
    let rejectFunction = (_: any) => {
      return false;
    };

    let forwardFunction = (_: any) => {
      return true;
    };

    if (mrf.receiveHook) {
      const forwardMessage = mrf.receiveHook(
        msg,
        rejectFunction,
        forwardFunction
      );
      if (!forwardMessage) {
        return false;
      }
    }
  }
  return true;
}

async function sendHook(msg: any): Promise<any> {
  for (const mrf of loaded_mrfs) {
    let forwardFunction = (newMsg: any) => {
      msg = newMsg;
      return msg;
    };

    if (mrf.sendHook) {
      const forwardMessage = mrf.sendHook(msg, forwardFunction);
      if (!forwardMessage) {
        return null;
      }
    }
  }
  return msg;
}

const dmrf_exports: DMRFNatives = {
  init,
  receiveHook,
  sendHook
};

module.exports = dmrf_exports;
