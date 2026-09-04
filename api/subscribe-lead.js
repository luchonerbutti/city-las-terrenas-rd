// Puente City Las Terrenas -> Brevo
// Recibe los mismos datos que el formulario de la web (nombre, email, whatsapp)
// y da de alta/actualiza el contacto en Brevo, añadiéndolo a la lista "City - Dossier Web" (ID 3),
// para que la automatización de seguimiento a 3 días se dispare sola.
// No sustituye a Formspree: se llama en paralelo, sin bloquear la descarga del dossier.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { nombre, email, whatsapp } = req.body || {};

    if (!email) {
      res.status(400).json({ error: 'email required' });
      return;
    }

    const attributes = {};
    if (nombre) attributes.FIRSTNAME = String(nombre).slice(0, 200);
    if (whatsapp) attributes.SMS = String(whatsapp).slice(0, 50);

    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [3],
        updateEnabled: true
      })
    });

    if (!brevoRes.ok) {
      const text = await brevoRes.text().catch(() => '');
      console.error('Brevo API error', brevoRes.status, text);
    }

    // Siempre respondemos 200: esta llamada es secundaria y nunca debe
    // mostrar un error al lead ni interferir con el flujo de Formspree.
    res.status(200).json({ ok: brevoRes.ok });
  } catch (err) {
    console.error('subscribe-lead error', err);
    res.status(200).json({ ok: false });
  }
};
