export { createAuth } from "./auth"
export { normalizePhone, formatPhoneForDisplay } from "./phone"
export { generateOTP, verifyOTP, sendOTP } from "./otp"
export {
    generateCodeVerifier,
    generateCodeChallenge,
    generateState,
    buildAuthorizationUrl,
    exchangeCodeForTokens,
} from "./oauth"
export type {
    AuthConfig,
    OTPConfig,
    SessionConfig,
    SMSProvider,
    SMSSendParams,
    SMSSendResult,
    User,
    Session,
    Account,
    Verification,
    VerificationType,
    Plugin,
    PluginHooks,
    DatabaseAdapter,
    OAuthProvider,
    OAuthTokens,
    OAuthProfile,
    RouteHandler,
} from "./types"
