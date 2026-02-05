// Development email logger - simulates email sending for testing
export class DevEmailLogger {
  static logEmail(to: string, subject: string, type: 'verification' | 'login' | 'password_reset') {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL SIMULATION (Development Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Type: ${type}`)
    console.log(`Time: ${new Date().toLocaleString()}`)
    
    switch (type) {
      case 'verification':
        console.log('\n🔗 VERIFICATION LINK:')
        console.log(`http://localhost:3000/auth/verify?token=dev-token-${Date.now()}`)
        console.log('\n📝 In production, user would click this link to verify their email.')
        break
        
      case 'login':
        console.log('\n🔐 LOGIN NOTIFICATION:')
        console.log('User has been notified of new login to their account.')
        break
        
      case 'password_reset':
        console.log('\n🔑 PASSWORD RESET LINK:')
        console.log(`http://localhost:3000/auth/reset-password?token=dev-reset-${Date.now()}`)
        console.log('\n📝 In production, user would click this link to reset their password.')
        break
    }
    
    console.log('\n💡 To enable real emails:')
    console.log('1. Sign up at https://resend.com')
    console.log('2. Get your API key')
    console.log('3. Update RESEND_API_KEY in .env.local')
    console.log('='.repeat(60) + '\n')
  }
}