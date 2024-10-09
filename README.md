# dmrf

Discord Message Rewrite Facility.

From [Pleroma's MRF docs](https://docs.pleroma.social/backend/configuration/mrf/):

> The Message Rewrite Facility (MRF) is a subsystem that is implemented as a series of hooks that allows
> the administrator to rewrite or discard messages.

`dmrf` is a "port" of the idea into the [moonlight](https://github.com/moonlight-mod/moonlight) Discord client mod.
It does not provide the same functionality as Pleroma's, but it should be flexible enough for most needs.

## WARNING PLEASE READ.

`dmrf`, at its core, is **TRUSTED EVAL**. This is required to let plugins do anything they want, this gives flexibility
at the cost of malicious scripts being able to e.g ship off all your messages to an `evil-server.net`. Users are recommended
to write their own scripts or apply extreme scrutiny to `dmrf` scripts they find on the web.

`dmrf` will NOT provide built-in toggles for built-in MRF scripts, but a guide is provided here.

## installation instructions

you can add dmrf via a custom moonlight repository: http://lun-4.github.io/dmrf/repo.json

once added, you can enable and give a list of scripts that will be loaded at runtime on client start, example:

```json
    "dmrf": {
      "enabled": true,
      "config": {
        "mrfScripts": [
          "/home/luna/dmrf_scripts/deez_nuts.js",
          "/home/luna/dmrf_scripts/fixfx_override.js"
        ]
      }
    },
```

the order of the scripts in your config will be the execution order of the MRFs as messages flow through the client.

## the structure of dmrf

a dmrf script provides at most 3 fields via `module.exports`:
 - `spec` which is just some simple metadata for now
 - `sendHook` if the script wants to hook into messages created by the user before they're sent to Discord
 - `receiveHook` which is the same idea but for incoming messages by others

here's an example script which turns all `x.com` mentions _I_ specifically make into `fxtwitter.com`,
because I became too tired to type out the prefix every single time (main reason `dmrf` came into existence!):

```js
module.exports = {
  spec: {
    mrfVersion: 1,
    name: "turn x.com into fixfx.com",
  },
  sendHook: async (msg, forward) => {
    msg.content = msg.content.replace('https://x.com','https://fxtwitter.com');
    msg.content = msg.content.replace('http://x.com','http://fxtwitter.com');
    return forward(msg);
  }
}
```

another example would be rejecting every incoming mention of `Among Us` your friends on tiktok keep making:

```js
module.exports = {
  spec: {
    mrfVersion: 1,
    name: "sus",
  },
  receiveHook: async (msg, reject, forward) => {
    if (msg.content.includes("Among Us")) {
		return reject("IM TIRED OF SEEING IT");
	} else {
		return forward(msg);
	}
  }
}
```

`reject` and `forward` are functions that you must return the value of to decide on your MRF action.
returning any other value is not API compliant and may break at any moment
 - `reject(reason: string)` to reject and emit the reason to devtools
 - `forward(message: any)` to forward the message to the next MRF script
    (or to Discord, if it's the last script, but the script shouldn't be aware of that)
