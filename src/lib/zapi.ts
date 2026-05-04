export async function sendWhatsAppMessage(phone: string, message: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    console.error("Z-API credentials missing in environment variables.");
    return false;
  }

  // Format phone to international standard if necessary
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = '55' + formattedPhone;
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Z-API Error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Z-API Exception:", error);
    return false;
  }
}
