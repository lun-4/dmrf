import { ExtensionWebpackModule, Patch } from "@moonlight-mod/types";

/*
  Patching allows you to find and replace snippets of code in Discord's
  Webpack modules. This example changes the "User Settings" text in the
  English locale (shown when hovering over the settings button next to the
  username/mute controls).

  A patch is composed of three parts: finding the Webpack module, finding
  the code we want to replace, and replacing it.

  `find` dictates what Webpack module we want to patch. It is matched against
  the code of all Webpack modules, and once the match is found, it patches
  that module. Because of this, the match must be specific to a single module.

  `match` is used to find the piece of code we want to patch inside of the
  target Webpack module. The area of code that is matched is replaced with
  the `replacement`.

  `find` and `match` can both be regular expressions, and `replacement` can
  be a string or a function that returns a string.

  You can also set the `type` field in `replace` to PatchReplaceType.Module, in
  which case the `replacement` will be used as the entire module's code. This
  completely overrides it, breaking other extensions that patch the same module,
  so use it wisely.
*/
export const patches: Patch[] = [];

export const webpackModules: Record<string, ExtensionWebpackModule> = {
  dmrf: {
    entrypoint: true,
    dependencies: [
      { ext: "spacepack", id: "spacepack" },
      { id: "discord/Dispatcher" },
      { id: "discord/actions/MessageActionCreators" }
    ]
  }
};
