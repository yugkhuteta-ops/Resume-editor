interface IdConfiguration {
  client_id: string;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: string;
  state_cookie_domain?: string;
  ux_mode?: string;
  nonce?: string;
  native_callback?: () => void;
  callback?: (response: CredentialResponse) => void;
}

interface CredentialResponse {
  credential: string;
  select_by: string;
}

interface GsiButtonConfiguration {
  type: 'standard' | 'icon';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  logo_alignment?: 'left' | 'center';
  width?: number;
  local?: string;
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: TokenClientConfig) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: TokenClientConfig) => TokenClient;
  revoke: (token: string, callback?: () => void) => void;
  hasGrantedAllScopes: (token: string, scopes: string) => boolean;
}

interface GoogleAccounts {
  id: {
    initialize: (config: IdConfiguration) => void;
    renderButton: (element: HTMLElement, options: GsiButtonConfiguration) => void;
    prompt: (momentListener?: () => void) => void;
  };
  oauth2: GoogleAccountsOAuth2;
}

interface Window {
  google?: GoogleAccounts;
}
