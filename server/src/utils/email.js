import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.FROM_EMAIL   || 'support@bmwshiftauto.store';
const OWNER  = process.env.OWNER_EMAIL;

// ── Send to owner when new order is placed ────────────────
export async function sendNewOrderNotification(order) {
  if (!OWNER) return;

  const itemsList = (order.items || [])
    .map(i => `<li style="margin-bottom:6px"><strong>${i.name}</strong> × ${i.quantity} — $${(i.price * i.quantity).toFixed(2)}</li>`)
    .join('');

  const s = order.shipping || {};
  const address = [s.street, `${s.city}${s.state ? ', ' + s.state : ''} ${s.zip || ''}`.trim(), s.country]
    .filter(Boolean).join('<br>');

  const adminUrl = 'https://bmwshiftauto.store/pages/admin/orders.html';

  await resend.emails.send({
    from: FROM,
    to:   OWNER,
    subject: `🛒 New Order — ${order.orderNumber} ($${order.total.toFixed(2)})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0066CC;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">New Order Received</h1>
        </div>
        <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5">

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:140px">Order Number</td><td style="padding:8px 0;font-weight:700;font-family:monospace">${order.orderNumber}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Customer</td><td style="padding:8px 0;font-weight:600">${s.name || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0">${s.email || order.guestEmail || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${s.phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Payment</td><td style="padding:8px 0;text-transform:capitalize">${order.paymentMethod}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Total</td><td style="padding:8px 0;font-weight:700;color:#0066CC;font-size:18px">$${order.total.toFixed(2)}</td></tr>
          </table>

          <div style="margin-bottom:24px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:10px">Items Ordered</div>
            <ul style="margin:0;padding-left:20px">${itemsList}</ul>
          </div>

          <div style="margin-bottom:28px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:10px">Ship To</div>
            <div style="line-height:1.8">${s.name || ''}<br>${address}</div>
          </div>

          <a href="${adminUrl}" style="display:inline-block;background:#0066CC;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">View Order in Admin Panel</a>
        </div>
      </div>
    `,
  }).catch(err => console.error('Owner order email failed:', err));
}

// ── Send to customer confirming their order ───────────────
export async function sendOrderConfirmationToCustomer(order) {
  const customerEmail = order.shipping?.email || order.guestEmail;
  if (!customerEmail) return;

  const paymentUrl = `https://bmwshiftauto.store/pages/payment-upload.html?orderId=${order._id}&orderNumber=${encodeURIComponent(order.orderNumber)}&method=${order.paymentMethod}&total=${order.total}`;

  await resend.emails.send({
    from:     FROM,
    to:       customerEmail,
    reply_to: FROM,
    subject:  `Order Confirmed — ${order.orderNumber} — Shift Auto Supply`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0066CC;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">Order Confirmed!</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px">Thank you for your order, ${order.shipping?.name?.split(' ')[0] || 'there'}.</p>
        </div>
        <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5">

          <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#666">Order Number</span>
              <strong style="font-family:monospace">${order.orderNumber}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#666">Payment Method</span>
              <span style="text-transform:capitalize">${order.paymentMethod}</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e5e5;padding-top:12px">
              <strong>Total</strong>
              <strong style="color:#0066CC;font-size:18px">$${order.total.toFixed(2)}</strong>
            </div>
          </div>

          <div style="margin-bottom:28px">
            <div style="font-size:13px;font-weight:700;margin-bottom:16px">What happens next?</div>
            <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
              <div style="width:28px;height:28px;background:#0066CC;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">1</div>
              <div><strong>Complete your payment</strong><br><span style="color:#666;font-size:13px">Send your payment via ${order.paymentMethod} using the details on the confirmation page</span></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
              <div style="width:28px;height:28px;background:#0066CC;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">2</div>
              <div><strong>Upload your receipt</strong><br><span style="color:#666;font-size:13px">Take a screenshot of your payment and upload it on the confirmation page</span></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:14px">
              <div style="width:28px;height:28px;background:#0066CC;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">3</div>
              <div><strong>We verify and ship</strong><br><span style="color:#666;font-size:13px">Our team confirms your payment and prepares your order — usually within 24 hours</span></div>
            </div>
          </div>

          <a href="${paymentUrl}" style="display:block;background:#0066CC;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;text-align:center;font-size:16px;margin-bottom:24px">Complete Your Payment</a>

          <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#666;text-align:center">
            <p>Questions? <a href="https://www.facebook.com/share/1SoYSJPkMu/" style="color:#0066CC">Message us on Facebook</a> — we reply within a few hours.</p>
            <p style="margin-top:8px">— The Shift Auto Supply Team</p>
          </div>
        </div>
      </div>
    `,
  }).catch(err => console.error('Customer confirmation email failed:', err));
}

// ── Send contact form message to owner ────────────────────
export async function sendContactFormToOwner({ name, email, subject, orderNumber, message }) {
  if (!OWNER) return;

  await resend.emails.send({
    from:     FROM,
    to:       OWNER,
    reply_to: email,
    subject:  `Contact Form: ${subject} — ${name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#1a1a2e;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">New Contact Form Message</h1>
        </div>
        <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5">
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:120px">From</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#0066CC">${email}</a></td></tr>
            ${orderNumber ? `<tr><td style="padding:8px 0;color:#666">Order #</td><td style="padding:8px 0;font-family:monospace">${orderNumber}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#666">Subject</td><td style="padding:8px 0">${subject}</td></tr>
          </table>

          <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:20px;margin-bottom:24px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#666;margin-bottom:10px">Message</div>
            <p style="margin:0;line-height:1.7;white-space:pre-wrap">${message}</p>
          </div>

          <a href="mailto:${email}?subject=Re: ${subject}" style="display:inline-block;background:#0066CC;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700">Reply to ${name}</a>
        </div>
      </div>
    `,
  }).catch(err => console.error('Contact form email failed:', err));
}
