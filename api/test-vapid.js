export default async function handler(req, res) {
  // Teste ob VAPID Keys verfügbar sind
  const hasPublicKey = !!process.env.VAPID_PUBLIC_KEY;
  const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY;
  const hasSubject = !!process.env.VAPID_SUBJECT;
  
  res.json({
    vapid_setup: hasPublicKey && hasPrivateKey && hasSubject,
    public_key_length: process.env.VAPID_PUBLIC_KEY?.length || 0,
    private_key_length: process.env.VAPID_PRIVATE_KEY?.length || 0,
    subject: hasSubject ? '✅ Set' : '❌ Missing',
    timestamp: new Date().toISOString()
  });
}
