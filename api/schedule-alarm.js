import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { subscription, alarmData } = req.body;
  
  try {
    // Alarm Zeit berechnen
    const now = new Date();
    const [hours, minutes] = alarmData.time.split(':');
    const alarmTime = new Date();
    alarmTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    const delay = alarmTime.getTime() - now.getTime();
    
    // Für kurze Delays: setTimeout (Demo)
    // Für Production: Cron Job Service verwenden
    if (delay <= 24 * 60 * 60 * 1000) { // Max 24 Stunden
      setTimeout(async () => {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: 'Zeiterfassung Alarm',
            body: alarmData.message,
            data: { type: alarmData.type }
          }),
          {
            TTL: 60 * 60 * 24,
            urgency: 'high'
          }
        );
      }, delay);
    }
    
    res.json({ 
      success: true, 
      scheduledFor: alarmTime.toISOString(),
      delayMs: delay 
    });
    
  } catch (error) {
    console.error('Schedule Alarm Error:', error);
    res.status(500).json({ error: 'Failed to schedule alarm' });
  }
}
