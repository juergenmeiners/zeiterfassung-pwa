export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const subscription = req.body;
  
  try {
    // In Production: In Datenbank speichern
    // Für jetzt: Console log
    console.log('Push Subscription gespeichert:', {
      endpoint: subscription.endpoint,
      keys: !!subscription.keys
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Save Subscription Error:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
}
