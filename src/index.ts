import { Application, json, NextFunction, Request, Response } from 'express';
import {
  IBasicAuth,
  IPluginMiddleware,
  IStorageManager,
  Logger,
  PluginOptions,
} from '@verdaccio/types';
import { createRemoteUser } from '@verdaccio/config';

import { CustomConfig, AccessToken, $RequestExtend } from '../types/index';

const PLUGIN_NAME = 'better-static-token';

export default class VerdaccioMiddlewarePlugin implements IPluginMiddleware<CustomConfig> {
  public logger: Logger;
  public foo: string;
  private accessTokens: Map<string, AccessToken>;
  private config: CustomConfig;

  public constructor(config: CustomConfig, options: PluginOptions<CustomConfig>) {
    this.foo = config.foo !== undefined ? config.strict_ssl : true;
    this.logger = options.logger;
    this.config = config;

    // Saves tokens to map.
    this.accessTokens = new Map(config.staticAccessTokens?.map((token) => [token.key, token]) ?? []);
  }

  private debug(message: string) {
    this.logger.info(message);
  }

  public register_middlewares(
    app: Application,
    auth: IBasicAuth<CustomConfig>,
    /* eslint @typescript-eslint/no-unused-vars: off */
    _storage: IStorageManager<CustomConfig>
  ): void {
    // Check if plugin is actually enabled.
    if (!this.isPluginEnabled()) {
      this.debug('Plugin is not enabled!');
      return;
    }

    // Make sure all tokens are secure.
    this.validateTokenSecurity();

    this.debug(`Registering plugin with following tokens: ${this.accessTokens}`);

    // Register express middleware.
    app.use((req: Request, res: Response, next: NextFunction) => {
      const extendedReq = req as $RequestExtend;
      const { authorization } = req.headers;
      if (!authorization) {
        this.debug('Skipping, no authorization header set');
        return next();
      }

      if (!this.isAuthHeaderValid(authorization)) {
        this.debug('Skipping, bad authorization header');
        return next();
      }

      const tokenValue = this.extractAccessToken(authorization);
      if (!tokenValue) {
        this.debug('Skipping, bad access token');
        return next();
      }

      // Get access token for passed token value.
      const accessToken = this.accessTokens.get(tokenValue);
      if (!accessToken) {
        this.debug('Skipping, unknown access token or jwt');
        return next();
      }

      // Add user to request.
      this.debug(`User ${accessToken.user} authenticated via static access token`);
      extendedReq.remote_user = createRemoteUser(accessToken.user, [accessToken.user]);

      // If token is readonly, we only add user for GET requests.
      if (accessToken.readonly && !this.isReadRequest(extendedReq)) {
        this.debug('Readonly token does not allow manipulative actions!');

        // Attach error.
        extendedReq.remote_user.error = 'forbidden';

        this.logger.warn(`Write access denied for readonly access token for user ${accessToken.user}`);

        res.sendStatus(403);
        return;
      }

      // Hand over to next middleware.
      next();
    });
  }

  /**
   * Checks if the plugin is enabled in config.
   */
  protected isPluginEnabled(): boolean {
    if (PLUGIN_NAME in this.config.middlewares) {
      return Boolean(this.config.middlewares[PLUGIN_NAME].enabled);
    }

    this.debug(`Plugin ${PLUGIN_NAME} is not enabled in config: ${JSON.stringify(this.config)}`);

    this.debug('Middleware not defined! This should never happen!');

    return false;
  }

  /**
   * Validate all tokens.
   *
   * This is to prevent very insecure tokens, such as 123 or abc.
   */
  protected validateTokenSecurity(): void {
    for (const token of this.accessTokens.values()) {
      if (token.key.length < 16) {
        throw new Error(`Insecure static access token: ${token.key} must have a length of at least 16!`);
      }
    }
  }

  /**
   * Validates format of authorization header.
   *
   * The value of the authorization header must be "Bearer my-super-secret-token".
   *
   * @param authorization - The value of the authorization header.
   */
  protected isAuthHeaderValid(authorization: string): boolean {
    return authorization.split(' ').length === 2;
  }

  /**
   * Checks if current request is a read operation.
   *
   * This is just a very simple check and it relies on the consistent
   * use of http methods to never use HEAD or GET requests for write operation.
   *
   * @param req - The request object.
   */
  protected isReadRequest(req: $RequestExtend): boolean {
    return ['HEAD', 'GET'].includes(req.method);
  }

  /**
   * Extract access token from authorization header.
   *
   * @param authorization - The value of the authorization header.
   */
  protected extractAccessToken(authorization: string): string | null {
    return authorization.split(' ')[1];
  }
}
