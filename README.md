# verdaccio-better-static-token

This plugin for Verdaccio npm registry let you to use custom authentication tokens with verdaccio.

DISCALIMER: this is a quick and dirty plugin to archive my needs. You MUST understand how it works because it could be a potential security issue for your registry. The settings of this plugin are not encripted in the verdaccio/config.yaml, so the server must have an access policy.

## Installation
```bash
npm install verdaccio
npm install verdaccio-better-static-token
```
*(or install globally with `-g` if you need, then notice to the below **Transfer plugin** section)*

## How it works
It modify the authorization header injecting a valid auth token alongs to provided user & pass in config.

## Config (Middleware)
```yaml
middlewares:
  better-static-token:
    enabled: true
    staticAccessTokens:
      - key: thisShouldBeALongKeyForSafety
        user: noob
        pass: 123456
        groups: aUserGroup secondUserGroup
```
If a request have the header **Authorization**: `Bearer thisShouldBeALongKeyForSafety`, it will be replace at runtime with a token that act as `noob`. All the auth plugins configured in Verdacco will receive the user and password you have setted.

Whenever you configure the token field value use long and random strings. The middleware will validate all keys must have length greater than 16.

NB: if the user you have set require the 2FA, the authentication will fail. So it is up to you to configure a static application-user.

## Where I have to set the token in my npm client?
To set the token in your npm client you have to add it to your user config.

This command will append a valid setting:
```bash
# view where the file is located
npm config get userconfig

# append a login access
echo '//localhost:4873/:_authToken="mySecureToken"' >> `npm config get userconfig`
```
The pattern of the string appended is: `//<url of the registry>/:_authToken="<static-token>"`

## Verdaccio plugin not-found error fixing
When you install verdaccio globally, sometimes, you face with issue that a community verdaccio plugin is not found after installing.

The reason is that: The verdaccio only loads plugin installed in `<global node_modules directory>/verdaccio/node_modules/`

Therefore, you need to install this plugin (or any community plugin) in somewhere calling `$W`, then copy the plugin package in `$W/node_modules` to `<global node_modules directory>/verdaccio/node_modules/`

For example: at some directory where you have installed verdaccio-better-static-token in it, execute the command `cp ./node_modules/verdaccio-better-static-token <global node_modules directory>/verdaccio/node_modules/verdaccio-better-static-token`

## References
1. https://github.com/Eomm/verdaccio-static-token
2. https://github.com/wunderwerkio/verdaccio-static-access-token-middleware-plugin