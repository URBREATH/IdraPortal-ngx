import {
    NbAuthOAuth2JWTToken
} from '@nebular/auth';

export interface UserClaims {
    email: string;
    email_verified: boolean;
    family_name?: string;
    given_name?: string;
    locale?: string;
    name: string;
    preferred_username: string;
    picture: string;
    sub: string;
    updated_at: string;
    roles: string[];
    realm_access: RealmAccess;
}

export interface RealmAccess {
    roles: string[];
}

export interface OidcToken {
    user: UserClaims;
    id_token: string;
    access_token: string;
}

export class OidcJWTToken extends NbAuthOAuth2JWTToken {
    // let's rename it to exclude name clashes
    static NAME = 'nb:auth:oidc:token';

    declare protected readonly token: OidcToken;

    getValue(): string {
        return this.token.access_token;
    }
}
