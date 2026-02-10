# Implementation Plan: Email Verification

## Overview

This implementation plan breaks down the email verification feature into discrete coding tasks. The approach follows an incremental strategy: database schema → core services → API endpoints → middleware integration → testing. Each task builds on previous work to ensure continuous validation.

## Tasks

- [ ] 1. Set up database schema and migrations
  - Create `verification_tokens` table with fields: id, user_id, token_hash, expires_at, created_at
  - Create `verification_rate_limits` table with fields: id, email, attempt_count, window_start
  - Add indexes on user_id, expires_at, and token_hash for verification_tokens
  - Add index on window_start for verification_rate_limits
  - Configure Row Level Security policies for both tables
  - Add cascade delete constraint from users to verification_tokens
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2. Implement Token Manager service
  - [ ] 2.1 Create token generation and hashing functions
    - Implement `generateToken()` using crypto.randomBytes(32) with base64url encoding
    - Implement `hashToken()` using SHA-256
    - Implement `verifyTokenHash()` using crypto.timingSafeEqual for constant-time comparison
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 2.2 Write property test for token generation
    - **Property 1: Registration Creates Unverified Account with Valid Token**
    - **Property 2: Token Storage and Hashing**
    - **Validates: Requirements 1.1, 1.2, 1.4, 5.2, 5.3**
  
  - [ ] 2.3 Implement token database operations
    - Implement `storeToken()` to insert token hash with expiration
    - Implement `getTokenData()` to retrieve token by hash
    - Implement `invalidateToken()` to mark token as used
    - Implement `deleteExpiredTokens()` for cleanup
    - _Requirements: 1.4, 2.6, 5.5_
  
  - [ ]* 2.4 Write unit tests for token database operations
    - Test token storage and retrieval
    - Test token invalidation
    - Test expired token cleanup
    - _Requirements: 1.4, 2.6, 5.5_

- [ ] 3. Implement Email Verification Service
  - [ ] 3.1 Create core verification service class
    - Implement `createVerificationToken()` method
    - Implement `verifyToken()` method with validation logic
    - Implement `isEmailVerified()` method
    - Implement `cleanupExpiredTokens()` method
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 3.2 Write property tests for token validation
    - **Property 4: Valid Token Verification Succeeds**
    - **Property 5: Expired Token Verification Fails**
    - **Property 6: Invalid Token Verification Fails**
    - **Property 7: Successful Verification Redirects**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2**
  
  - [ ] 3.3 Implement rate limiting logic
    - Create rate limit check function
    - Implement attempt tracking in database
    - Implement window-based limiting (3 per hour)
    - Add cleanup for old rate limit records
    - _Requirements: 4.5_
  
  - [ ]* 3.4 Write property test for rate limiting
    - **Property 11: Rate Limiting Prevents Abuse**
    - **Validates: Requirements 4.5**
  
  - [ ] 3.5 Implement resend verification email logic
    - Implement `resendVerificationEmail()` method
    - Add validation for existing account
    - Add check for already verified accounts
    - Integrate rate limiting
    - Invalidate old tokens before creating new one
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 3.6 Write property test for resend flow
    - **Property 10: Resend Invalidates Old Tokens and Creates New One**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 4. Checkpoint - Ensure core services work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement verification email templates
  - [ ] 5.1 Extend email templates for verification
    - Create `getVerificationEmailContent()` function
    - Design HTML template with company branding
    - Include call-to-action button with verification link
    - Add plain-text version of link
    - Add security notice about 24-hour expiration
    - Add statement about ignoring if not requested
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 5.2 Write property test for email content
    - **Property 3: Verification Email Contains Required Elements**
    - **Validates: Requirements 1.5, 7.1, 7.3, 7.4, 7.5, 7.6**
  
  - [ ] 5.3 Integrate with Resend email service
    - Create function to send verification email via Resend
    - Add error handling for email delivery failures
    - Add logging for email send attempts
    - _Requirements: 1.3, 8.3, 10.4_
  
  - [ ]* 5.4 Write property test for email service integration
    - **Property 16: Email Service Failures Are Handled**
    - **Property 18: Email Service Integration**
    - **Validates: Requirements 8.3, 10.4**

- [ ] 6. Implement API endpoints
  - [ ] 6.1 Create POST /api/auth/register endpoint
    - Add email verification logic to registration flow
    - Create user with email_verified=false
    - Generate verification token
    - Send verification email
    - Return success response with verification instructions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 6.2 Write integration test for registration endpoint
    - Test successful registration creates unverified account
    - Test verification email is sent
    - Test token is stored in database
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 6.3 Create GET /api/auth/verify endpoint
    - Extract token from query parameter
    - Validate token using verification service
    - Update user email_verified status on success
    - Return appropriate success/error response
    - Handle expired, invalid, and already-verified cases
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.4_
  
  - [ ]* 6.4 Write integration test for verify endpoint
    - Test valid token verification succeeds
    - Test expired token returns error
    - Test invalid token returns error
    - Test already-verified account handles gracefully
    - _Requirements: 2.2, 2.3, 2.4, 8.4_
  
  - [ ] 6.5 Create POST /api/auth/resend-verification endpoint
    - Validate email parameter
    - Check if account exists and is unverified
    - Apply rate limiting
    - Resend verification email
    - Return success/error response with attempts remaining
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 6.6 Write integration test for resend endpoint
    - Test successful resend
    - Test rate limiting after 3 attempts
    - Test error for already verified account
    - Test error for non-existent account
    - _Requirements: 4.1, 4.5_

- [ ] 7. Checkpoint - Ensure API endpoints work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement login middleware for verification check
  - [ ] 8.1 Create verification check middleware
    - Add middleware to check email_verified status during login
    - Reject login if email not verified
    - Return error with resend link for unverified accounts
    - Allow login for verified accounts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 8.2 Write property tests for login verification
    - **Property 8: Unverified Users Cannot Login**
    - **Property 9: Verified Users Can Login**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 6.3**
  
  - [ ] 8.3 Integrate middleware with existing auth flow
    - Add middleware to Supabase Auth sign-in flow
    - Ensure compatibility with existing session management
    - Test that existing verified users are not affected
    - _Requirements: 10.5_
  
  - [ ]* 8.4 Write property test for auth flow compatibility
    - **Property 19: Authentication Flow Compatibility**
    - **Validates: Requirements 10.5**

- [ ] 9. Implement verification status persistence
  - [ ] 9.1 Add verification status to user session
    - Include email_verified field in session data
    - Update session creation logic
    - Ensure status persists across requests
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 9.2 Write property test for status persistence
    - **Property 12: Verification Status Persists**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ] 9.3 Implement email change verification reset
    - Add logic to detect email changes
    - Reset email_verified to false on email change
    - Trigger new verification process
    - _Requirements: 6.4_
  
  - [ ]* 9.4 Write property test for email change
    - **Property 13: Email Change Resets Verification**
    - **Validates: Requirements 6.4**

- [ ] 10. Implement logging and error handling
  - [ ] 10.1 Add verification event logging
    - Log all verification attempts (success and failure)
    - Include timestamp, user ID, email, action, result, IP address
    - Use structured logging format
    - _Requirements: 8.5_
  
  - [ ]* 10.2 Write property test for logging
    - **Property 15: Verification Attempts Are Logged**
    - **Validates: Requirements 8.5**
  
  - [ ] 10.3 Implement error handling classes
    - Create EmailVerificationError class
    - Define error codes enum
    - Implement error message formatting
    - Add user-friendly error messages
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 10.4 Write unit tests for error handling
    - Test error message formatting
    - Test error code mapping
    - Test user-friendly messages
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11. Implement database cleanup and maintenance
  - [ ] 11.1 Create cleanup job for expired tokens
    - Implement scheduled job to delete expired tokens
    - Run cleanup after 48 hours of expiration
    - Add logging for cleanup operations
    - _Requirements: 5.5_
  
  - [ ] 11.2 Implement cascade delete for user deletion
    - Verify cascade delete constraint works
    - Test that deleting user deletes tokens
    - _Requirements: 9.5_
  
  - [ ]* 11.3 Write property test for cascade delete
    - **Property 17: User Deletion Cascades to Tokens**
    - **Validates: Requirements 9.5**

- [ ] 12. Create verification UI pages
  - [ ] 12.1 Create email verification success page
    - Design success confirmation page
    - Add redirect to login/dashboard
    - Include clear messaging
    - _Requirements: 2.5_
  
  - [ ] 12.2 Create email verification error pages
    - Create expired token error page with resend button
    - Create invalid token error page
    - Create already verified success page
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ] 12.3 Update registration success page
    - Add message about checking email
    - Add resend verification link
    - Include troubleshooting tips
    - _Requirements: 1.1_
  
  - [ ] 12.4 Update login error handling
    - Add unverified email error message
    - Include resend verification link
    - _Requirements: 3.4, 3.5_

- [ ] 13. Final checkpoint - End-to-end testing
  - [ ]* 13.1 Write end-to-end integration tests
    - Test complete registration → verification → login flow
    - Test resend verification flow
    - Test error scenarios
    - Test rate limiting
    - _Requirements: All_
  
  - [ ] 13.2 Ensure all tests pass
    - Run all unit tests
    - Run all property tests
    - Run all integration tests
    - Fix any failing tests
  
  - [ ] 13.3 Manual testing checklist
    - Test registration and email receipt
    - Test verification link click
    - Test login with unverified account
    - Test login with verified account
    - Test resend verification
    - Test rate limiting
    - Test expired token
    - Test invalid token

- [ ] 14. Documentation and deployment preparation
  - [ ] 14.1 Update API documentation
    - Document new endpoints
    - Document error codes
    - Document rate limits
    - _Requirements: All_
  
  - [ ] 14.2 Create migration guide
    - Document database migrations
    - Document configuration changes
    - Document environment variables needed
    - _Requirements: 9.1, 9.2_
  
  - [ ] 14.3 Add monitoring and alerts
    - Set up monitoring for verification success rate
    - Set up alerts for email delivery failures
    - Set up alerts for unusual rate limit patterns
    - _Requirements: 8.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- The implementation uses TypeScript throughout for type safety
- Supabase Auth's `email_confirmed_at` field is used as the source of truth for verification status
- Custom token management provides flexibility for custom email templates and rate limiting
