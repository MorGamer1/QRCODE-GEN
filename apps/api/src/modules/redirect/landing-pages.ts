import type { ContentPayloadMap, ContentType as ContentTypeT } from '@qrgen/shared';

/** Escapes untrusted content before interpolating into an HTML template literal. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseStyles = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f3f4f6; color: #111827;
  }
  @media (prefers-color-scheme: dark) { body { background: #0b0f19; color: #e5e7eb; } }
  .card {
    width: 100%; max-width: 420px; background: #ffffff; border-radius: 16px; padding: 32px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06);
  }
  @media (prefers-color-scheme: dark) { .card { background: #131a2a; box-shadow: none; border: 1px solid #232b3d; } }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { line-height: 1.6; color: #4b5563; font-size: 14px; }
  @media (prefers-color-scheme: dark) { p { color: #9ca3af; } }
  .btn {
    display: block; width: 100%; text-align: center; padding: 12px 20px; border-radius: 10px;
    background: #2563eb; color: #fff !important; text-decoration: none; font-weight: 600; font-size: 15px;
    border: none; cursor: pointer; margin-top: 8px;
  }
  .btn.secondary { background: transparent; color: #2563eb !important; border: 1px solid #2563eb; }
  .field { margin: 14px 0; }
  .field label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-bottom: 4px; }
  .field .value { font-size: 16px; font-weight: 600; word-break: break-word; }
  input[type=password] {
    width: 100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #d1d5db; font-size: 15px; margin-top: 6px;
  }
  .error { color: #dc2626; font-size: 13px; margin-top: 8px; }
  .icon { width: 48px; height: 48px; border-radius: 12px; background: #eff6ff; display: flex; align-items: center;
    justify-content: center; margin-bottom: 16px; font-size: 24px; }
  img.qr-mini { width: 160px; height: 160px; margin: 16px auto; display: block; }
  .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px; }
`;

export function pageShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(title)}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="card">${bodyHtml}</div>
</body>
</html>`;
}

export function errorPage(title: string, message: string): string {
  return pageShell(
    title,
    `<div class="icon">⚠️</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>`,
  );
}

export function passwordPromptPage(actionUrl: string, error?: string): string {
  return pageShell(
    'Password required',
    `<div class="icon">🔒</div>
     <h1>This QR code is protected</h1>
     <p>Enter the password to continue.</p>
     <form method="POST" action="${escapeHtml(actionUrl)}">
       <input type="password" name="password" autofocus required placeholder="Password" />
       ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
       <button class="btn" type="submit">Continue</button>
     </form>`,
  );
}

export function textPage(name: string, data: ContentPayloadMap[ContentTypeT.TEXT]): string {
  return pageShell(
    name,
    `<h1>${escapeHtml(name)}</h1><p style="white-space:pre-wrap;">${escapeHtml(data.text)}</p>`,
  );
}

export function wifiPage(
  name: string,
  data: ContentPayloadMap[ContentTypeT.WIFI],
  miniQrDataUri: string,
): string {
  return pageShell(
    name,
    `<div class="icon">📶</div>
     <h1>${escapeHtml(name)}</h1>
     <p>Scan the code below with your camera app, or connect manually.</p>
     <img class="qr-mini" src="${miniQrDataUri}" alt="Wi-Fi QR code" />
     <div class="field"><label>Network name</label><div class="value">${escapeHtml(data.ssid)}</div></div>
     ${
       data.password
         ? `<div class="field"><label>Password</label><div class="value">${escapeHtml(data.password)}</div></div>`
         : '<p>This is an open network - no password required.</p>'
     }`,
  );
}

export function vcardPage(
  name: string,
  data: ContentPayloadMap[ContentTypeT.VCARD],
  downloadUrl: string,
): string {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  return pageShell(
    name,
    `<div class="icon">👤</div>
     <h1>${escapeHtml(fullName)}</h1>
     ${data.title || data.organization ? `<p>${escapeHtml([data.title, data.organization].filter(Boolean).join(' · '))}</p>` : ''}
     ${data.phone ? `<div class="field"><label>Phone</label><div class="value">${escapeHtml(data.phone)}</div></div>` : ''}
     ${data.email ? `<div class="field"><label>Email</label><div class="value">${escapeHtml(data.email)}</div></div>` : ''}
     <a class="btn" href="${escapeHtml(downloadUrl)}">Save contact</a>`,
  );
}

export function locationPage(name: string, data: ContentPayloadMap[ContentTypeT.LOCATION]): string {
  const osmUrl = `https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=16/${data.latitude}/${data.longitude}`;
  return pageShell(
    name,
    `<div class="icon">📍</div>
     <h1>${escapeHtml(name)}</h1>
     ${data.query ? `<p>${escapeHtml(data.query)}</p>` : ''}
     <a class="btn" href="geo:${data.latitude},${data.longitude}">Open in Maps app</a>
     <a class="btn secondary" href="${escapeHtml(osmUrl)}">View on OpenStreetMap</a>`,
  );
}

export function eventPage(
  name: string,
  data: ContentPayloadMap[ContentTypeT.EVENT],
  icsUrl: string,
): string {
  return pageShell(
    name,
    `<div class="icon">📅</div>
     <h1>${escapeHtml(data.title)}</h1>
     <p>${escapeHtml(new Date(data.start).toLocaleString())}${data.location ? ` · ${escapeHtml(data.location)}` : ''}</p>
     ${data.description ? `<p>${escapeHtml(data.description)}</p>` : ''}
     <a class="btn" href="${escapeHtml(icsUrl)}">Add to calendar</a>`,
  );
}

export function cryptoPage(name: string, data: ContentPayloadMap[ContentTypeT.CRYPTO]): string {
  return pageShell(
    name,
    `<div class="icon">₿</div>
     <h1>${escapeHtml(data.currency)} payment</h1>
     <div class="field"><label>Address</label><div class="value">${escapeHtml(data.address)}</div></div>
     ${data.amount ? `<div class="field"><label>Amount</label><div class="value">${escapeHtml(data.amount)}</div></div>` : ''}
     <a class="btn" href="${escapeHtml(data.currency.toLowerCase())}:${escapeHtml(data.address)}${data.amount ? `?amount=${data.amount}` : ''}">Open in wallet</a>`,
  );
}

export function socialPage(name: string, data: ContentPayloadMap[ContentTypeT.SOCIAL]): string {
  return pageShell(
    name,
    `<div class="icon">🔗</div>
     <h1>${escapeHtml(data.displayName || name)}</h1>
     <p>Continue to ${escapeHtml(data.platform)}</p>
     <a class="btn" href="${escapeHtml(data.url)}">Continue</a>`,
  );
}

export function customPage(name: string, data: ContentPayloadMap[ContentTypeT.CUSTOM]): string {
  const fields = data.fields
    ? Object.entries(data.fields)
        .map(
          ([k, v]) =>
            `<div class="field"><label>${escapeHtml(k)}</label><div class="value">${escapeHtml(v)}</div></div>`,
        )
        .join('')
    : '';
  return pageShell(
    name,
    `<h1>${escapeHtml(data.title || name)}</h1>
     ${data.body ? `<p>${escapeHtml(data.body)}</p>` : ''}
     ${fields}
     ${data.redirectUrl ? `<a class="btn" href="${escapeHtml(data.redirectUrl)}">Continue</a>` : ''}`,
  );
}

export function mediaPage(name: string, kind: 'image' | 'pdf', url: string): string {
  const body =
    kind === 'image'
      ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" style="max-width:100%;border-radius:12px;" />`
      : `<div class="icon">📄</div><p>Tap below to open the document.</p><a class="btn" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open PDF</a>`;
  return pageShell(name, `<h1>${escapeHtml(name)}</h1>${body}`);
}
