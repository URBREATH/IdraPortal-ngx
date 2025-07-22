# SSO Implementation for IdraPortal-ngx

This document explains how the Single Sign-On (SSO) functionality has been implemented in IdraPortal-ngx using the postMessage API.

## Overview

The SSO implementation allows the application to receive authentication tokens and configuration data from a parent application through the browser's postMessage API. This is particularly useful when the application is embedded as an iframe in another application.

## Implementation Details

### 1. Data Structure

The SSO message follows this interface structure:

```typescript
interface SSOMessage {
  embedded: boolean;
  accessToken: string;
  refreshToken: string;
  language: string; // ISO639-1 two letter code
}
```

### 2. Key Components

#### SharedService
- Manages the embedded state and SSO tokens
- Provides methods to decode JWT tokens and extract user information
- Observable streams for reactive updates

#### AppComponent
- Sets up the postMessage listener
- Validates incoming SSO messages
- Updates the shared service with SSO data
- Manages URL parameters for embedded mode

#### PagesComponent
- Subscribes to embedded state changes
- Handles menu visibility based on side menu state
- Adapts UI for embedded mode

### 3. How It Works

1. **Initial Setup**: The application checks for the `embedded=true` URL parameter on startup
2. **PostMessage Listener**: A message event listener is set up to receive SSO data
3. **Token Management**: When SSO data is received, tokens are stored in the SharedService
4. **UI Adaptation**: The UI adapts based on embedded state and side menu configuration
5. **Authentication**: The SSO token can be used for API requests

### 4. Usage Examples

#### Getting SSO Token
```typescript
constructor(private sharedService: SharedService) {}

ngOnInit() {
  // Get current token
  const token = this.sharedService.getSSOToken();
  
  // Subscribe to token changes
  this.sharedService.ssoToken$.subscribe(token => {
    if (token) {
      console.log('New SSO token received:', token);
    }
  });
}
```

#### Checking User Roles
```typescript
// Check if user has specific role
const hasAdminRole = this.sharedService.hasRole('admin');

// Get all user roles
const userRoles = this.sharedService.getUserRoles();

// Get full user info
const userInfo = this.sharedService.getUserInfo();
```

#### Handling Embedded State
```typescript
// Check if application is embedded
const isEmbedded = this.sharedService.isEmbedded();

// Subscribe to embedded state changes
this.sharedService.embeddedState$.subscribe(embedded => {
  if (embedded) {
    // Hide/show UI elements for embedded mode
  }
});
```

### 5. Testing the Implementation

To test the SSO functionality, you can simulate a postMessage from the browser console:

```javascript
// Simulate SSO message
const ssoMessage = {
  embedded: true,
  accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI2SXd0Nks5NGQtUzBsTWpm....',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJhZjcyNzE4.....',
  language: 'en'
};

// Send the message to the iframe (if testing from parent)
iframe.contentWindow.postMessage(ssoMessage, '*');

// Or simulate receiving a message (if testing from child)
window.postMessage(ssoMessage, '*');
```

#### Step-by-Step Testing Instructions:

**Method 1: Test with URL Parameter**
1. Start your Angular application
2. Navigate to: `http://localhost:4200?embedded=true`
3. Open browser console (F12)
4. You should see logs showing embedded mode detected

**Method 2: Test with postMessage (Recommended)**
1. Start your Angular application normally: `http://localhost:4200`
2. Open browser console (F12)
3. Paste and run this code:
```javascript
const testSSOMessage = {
  embedded: true,
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlcyI6WyJhZG1pbiIsInVzZXIiXX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  language: 'en'
};

window.postMessage(testSSOMessage, '*');
```
4. Watch the console for logs showing the SSO process

**Method 3: Create a Test HTML Page**
Create a test file `test-sso.html` in your project root:
```html
<!DOCTYPE html>
<html>
<head>
    <title>SSO Test Parent</title>
</head>
<body>
    <h1>SSO Test Parent Window</h1>
    <button onclick="sendSSOMessage()">Send SSO Message to Child</button>
    <br><br>
    <iframe id="childFrame" src="http://localhost:4200?embedded=true" width="800" height="600"></iframe>

    <script>
        function sendSSOMessage() {
            const ssoMessage = {
                embedded: true,
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlcyI6WyJhZG1pbiIsInVzZXIiXX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                language: 'en'
            };
            
            const iframe = document.getElementById('childFrame');
            iframe.contentWindow.postMessage(ssoMessage, '*');
            console.log('SSO message sent to iframe:', ssoMessage);
        }
    </script>
</body>
</html>
```

**What to Look For in Console:**
- `AppComponent: Initializing...`
- `AppComponent: Setting up postMessage listener`
- `AppComponent: Received postMessage event:` (when you send the message)
- `AppComponent: SSO message validation passed`
- `SharedService: Updating SSO data with:`
- `AppComponent: Decoded JWT token:` (with user info)
- `PagesComponent: Embedded state changed to: true`


### 6. Security Considerations

1. **Origin Validation**: Consider validating the origin of postMessage events in production
2. **Token Validation**: Always validate JWT tokens server-side  
3. **Secure Storage**: Tokens are stored in memory only and not persisted
4. **Message Filtering**: The implementation automatically filters out browser extension messages (React DevTools, Chrome extensions, etc.) to reduce console noise

### 7. Message Filtering

The SSO implementation includes intelligent filtering to avoid processing irrelevant postMessage events:

- **Browser Extensions**: Automatically ignores messages from React DevTools, Chrome extensions, etc.
- **Noise Reduction**: Filters out common non-SSO messages like heartbeats, pings, etc.
- **Smart Logging**: Only logs validation failures for messages that could potentially be SSO messages

This prevents console spam from browser extensions and other third-party scripts.

### 8. Configuration

The embedded functionality can be controlled through:
- URL parameter: `?embedded=true`
- postMessage data: `embedded: true`

The application will adapt its UI based on these settings, hiding the side menu when embedded and adjusting the layout accordingly.
