// Escape dynamic values before inserting them into HTML.
export function emailEscape(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[char];
  });
}

export function emailMoney(value: number): string {
  return `₱${Number(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function emailParagraph(content: string): string {
  return `
    <p style="margin:0 0 18px;font-size:15px;line-height:25px;color:#5e554e;">
      ${content}
    </p>
  `;
}

export function commonBrewEmail(options: {
  preview: string;
  category: string;
  title: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${emailEscape(options.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f0eb;">
  <div style="display:none;font-size:1px;line-height:1px;color:#f3f0eb;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${emailEscape(options.preview)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
    bgcolor="#f3f0eb" style="border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <!--[if mso]>
        <table role="presentation" width="560" cellpadding="0" cellspacing="0">
        <tr><td>
        <![endif]-->

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          bgcolor="#fffdf9"
          style="max-width:560px;border-collapse:collapse;border:1px solid #ded7ce;font-family:Arial,Helvetica,sans-serif;color:#30251e;">

          <tr>
            <td style="padding:28px 24px 24px;border-top:4px solid #493326;border-bottom:1px solid #e6dfd6;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:34px;color:#30251e;">
                CommonBrew<span style="color:#896e55;">.</span>
              </p>
              <p style="margin:6px 0 0;font-size:10px;line-height:16px;letter-spacing:2px;color:#75685d;">
                COFFEE &amp; TEA &nbsp;/&nbsp; TAYTAY
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 24px 28px;">
              <p style="margin:0 0 12px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:2px;color:#796651;text-transform:uppercase;">
                ${emailEscape(options.category)}
              </p>
              <h1 style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:normal;color:#30251e;">
                ${emailEscape(options.title)}
              </h1>
              ${options.body}
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px;border-top:1px solid #e6dfd6;">
              <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#5e554e;">
                Need a hand? We're happy to help.
              </p>
              <p style="margin:0;font-size:12px;line-height:22px;">
                <a href="tel:+639474960778"
                  style="color:#493326;text-decoration:underline;">0947 496 0778</a>
                <br>
                <a href="mailto:commonbrewtaytay@gmail.com"
                  style="color:#493326;text-decoration:underline;word-break:break-word;">commonbrewtaytay@gmail.com</a>
              </p>
            </td>
          </tr>

          <tr>
            <td bgcolor="#eee9e1" style="padding:20px 24px;">
              <p style="margin:0;font-size:11px;line-height:19px;color:#6f6256;">
                <strong>CommonBrew Taytay</strong><br>
                Unit 7 Leoncio Commercial Bldg, Taytay, Rizal
              </p>
              <p style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:20px;font-style:italic;color:#6f6256;">
                “Every good and perfect gift is from above.”<br>
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-style:normal;">James 1:17</span>
              </p>
            </td>
          </tr>
        </table>

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
