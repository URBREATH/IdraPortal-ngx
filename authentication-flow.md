# Idra Portal Authentication Flow Documentation

This document explains the authentication flow in the Idra Portal application, focusing on how the system handles both embedded (SSO) mode and standalone mode.

## Core Components

The authentication mechanism relies on three main components:

1. **AppComponent** (`app.component.ts`)
   - Central coordinator for authentication and routing
   - Listens for SSO tokens via postMessage
   - Handles route changes and authentication redirects
   - Preserves and restores target URLs after authentication

2. **SharedService** (`shared.service.ts`)
   - Manages application state (tokens, embedded state, first-load status)
   - Decodes and stores JWT tokens
   - Preserves admin URLs for redirection
   - Tracks user session information

3. **Token Interceptors** (`simple-interceptor.ts`, `token.interceptor.ts`)
   - Attach authorization headers to outgoing HTTP requests
   - Handle authentication errors (401 responses)
   - Choose between SSO tokens and regular authentication tokens

## Authentication Flow

### First-Time Loading an Admin Page

#### In Embedded Mode:

1. **Initial Request**:
   - User tries to access an admin page (e.g., `/administration/adminCatalogues`)
   - `AppComponent.handleRouteChange()` intercepts the navigation

2. **Token Check**:
   - App checks for tokens in SharedService and localStorage
   - For a first-time user, no token exists

3. **URL Preservation**:
   - The admin URL is saved for later:
     ```typescript
     this.sharedService.setPendingAdminUrl(url);
     sessionStorage.setItem('idra_admin_redirect', url);
     ```

4. **Default Auth Behavior**:
   - Without a token, the auth system naturally redirects to the login page
   - No explicit redirection needed - the auth interceptors handle this

5. **Token Reception**:
   - On the login page, the parent application sends a token via postMessage
   - `setupPostMessageListener()` captures this token
   - Token is stored in SharedService and localStorage

6. **Smart Redirection**:
   - After receiving the token, `checkAndHandleRedirects()` is called
   - The saved admin URL is retrieved
   - Before redirecting, we check if we're already on the target page
   - If needed, the user is redirected to the original admin page with a valid token

#### In Standalone Mode:

1. **Initial Request**:
   - User tries to access an admin page
   - `AppComponent.handleRouteChange()` intercepts the navigation

2. **Embedded Check**:
   - App determines this is standalone mode (`!this.sharedService.isEmbedded()`)
   - Skips the embedded-mode specific handling

3. **Authentication Check**:
   - Without a token, user is redirected to login page
   - After login, the app preserves and restores the original URL

4. **Duplicate Page Prevention**:
   - If we detect we're already on the target page, no redirection occurs

## Key Implementation Details

### Token Source Determination

The application intelligently determines the source of tokens:

1. **Embedded Mode**:
   - Receives tokens from parent application via postMessage
   - Message handler captures and processes tokens
   - After token reception, redirects to original admin page

2. **Standalone Mode**:
   - Obtains tokens through direct login
   - Uses standard Nebular authentication
   - Preserves original URL during login process

### URL Preservation Mechanism

To ensure users end up at their intended destination after authentication:

```typescript
// Save URL before authentication redirect
this.sharedService.setPendingAdminUrl(url);
sessionStorage.setItem('idra_admin_redirect', url);

// Retrieve URL after authentication
const pendingUrl = this.sharedService.getPendingAdminUrl();
if (pendingUrl) {
  this.performRedirect(pendingUrl);
}
```

### Smart Redirection Logic

To prevent unnecessary redirects:

```typescript
private performRedirect(url: string) {
  // Clear all storage to avoid redirect loops
  sessionStorage.removeItem('idra_admin_redirect');
  
  // Check if we're already at the target URL
  if (window.location.href.includes(url) || 
      (url.startsWith('/') && window.location.pathname.includes(url))) {
    console.log('Already at target URL, no redirection needed');
    return;
  }
  
  // Use window.location for most reliable navigation
  window.location.href = url;
}
```

### First Load Detection

The system tracks whether this is the first load to provide the appropriate behavior:

```typescript
// In SharedService
isFirstLoad(): boolean {
  return this.firstLoadSubject.value;
}

setFirstLoadComplete(): void {
  localStorage.setItem(this.FIRST_LOAD_KEY, 'false');
  this.firstLoadSubject.next(false);
}
```

### Embedded Mode Detection

The application detects whether it's running in embedded mode:

```typescript
// Initial detection in AppComponent.ngOnInit
const embeddedParam = this.getUrlParameter('embedded');
const isEmbedded = embeddedParam === 'true';
this.sharedService.updateEmbeddedState(isEmbedded);
```

## Token Interceptors

Two interceptors handle token attachment to HTTP requests:

1. **SimpleInterceptor**:
   - Adds tokens to outgoing requests
   - Handles 401 errors
   - Preserves SSO tokens during errors

2. **TokenInterceptor**:
   - Prioritizes SSO tokens over regular auth tokens
   - Skips token attachment for certain endpoints

## Benefits of the Current Implementation

1. **Reduced Redirections**:
   - Direct path through the authentication process
   - Fewer page reloads and transitions

2. **Prevention of Redundant Navigation**:
   - Checks if already at target URL before redirecting
   - Avoids unnecessary page reloads

3. **More Natural Authentication Path**:
   - Uses the built-in authentication flow of the application
   - Login page is the natural place to acquire credentials

4. **Unified Flow Across Modes**:
   - Both embedded and standalone modes follow similar paths
   - Main difference is where tokens come from

## Troubleshooting

If you encounter authentication issues:

1. **Check the embedded parameter**: Ensure the `embedded=true` parameter is correctly set in the URL for embedded mode.

2. **Verify token reception**: Check browser console for token-related logs in `setupPostMessageListener()`.

3. **Check storage**: Examine localStorage and sessionStorage for tokens and redirect URLs.

4. **Inspect HTTP requests**: Look for proper Authorization headers in network requests.

5. **Clear cached data**: Try clearing localStorage and sessionStorage if experiencing persistent issues.
