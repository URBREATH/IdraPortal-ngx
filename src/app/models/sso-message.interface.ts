export interface SSOMessage {
  embedded: boolean;
  accessToken: string;
  refreshToken: string;
  language: string; // ISO639-1 two letter code
}
