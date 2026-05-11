#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function main() {
  const prompt = process.argv.slice(2).join(' ').trim();
  if (!prompt) {
    console.error('Usage: node scripts/ask-deepseek.js "<prompt>"');
    process.exit(1);
  }

  const workspace = 'C:\\Users\\hecto\\.openclaw\\workspace';
  const configPath = path.join(workspace, 'deepseek_config.json');
  const telegramConfigPath = path.join(workspace, 'telegram_bot_config.json');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const telegram = JSON.parse(fs.readFileSync(telegramConfigPath, 'utf8'));

  const apiKey = process.env[config.api_key_env || 'DEEPSEEK_API_KEY'];
  if (!apiKey) {
    throw new Error(`Missing DeepSeek API key env: ${config.api_key_env || 'DEEPSEEK_API_KEY'}`);
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are a junior coding assistant. Return ONLY a code snippet or patch suggestion. No explanation, no markdown fences, no prose before or after the patch.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  const response = await fetch(`${config.base_url.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('DeepSeek returned empty content');
  }

  process.stdout.write(content + '\n');

  if (process.env.DEEPSEEK_TELEGRAM_NOTIFY === '1') {
    await fetch(`https://api.telegram.org/bot${telegram.bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegram.chat_id,
        text: `DeepSeek request completed. Prompt preview: ${prompt.slice(0, 120)}`
      })
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
