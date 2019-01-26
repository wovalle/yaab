import * as ngrok from 'ngrok';
import axios from 'axios';
const runtimeConfig = require('../.runtimeconfig.json');

// Setup telegram hook and open ngrok
async function init() {
  const url = await ngrok.connect(5000);

  const hookUrl = `https://api.telegram.org/bot${
    runtimeConfig.telegram.key
  }/setWebhook`;

  await axios.post(hookUrl, {
    url: `${url}/yaab-88ea8/us-central1/onTelegramUpdateFn`,
    max_connections: 5,
    allowed_updates: ['message', 'callback_query'],
  });

  console.log('Tunnel ready! url:', url);
}

init();
