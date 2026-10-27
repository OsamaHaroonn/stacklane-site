/* ============================================================
   index.html behaviour — quote form, contact fallbacks, config links.
   No inline script, so a strict CSP can be enforced.
   ============================================================ */
(function () {
  'use strict';

  var S = window.STORE || {};
  var email = (S.CONTACT_EMAIL || '').trim();
  var emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /* ---------- 1. Fill every email link from config ---------- */
  [].forEach.call(document.querySelectorAll('[data-email]'), function (el) {
    if (emailOK) {
      el.href = 'mailto:' + email;
      el.textContent = email;
    } else {
      el.removeAttribute('href');
      el.textContent = 'Set your email in assets/store.js';
      el.className += ' is-setup';
      el.title = 'Configuration needed';
    }
  });

  /* ---------- 2. Optional WhatsApp / booking buttons ---------- */
  var linkRow = document.getElementById('fb-links');
  if (linkRow) {
    if (S.WHATSAPP) {
      var wa = document.createElement('a');
      wa.className = 'btn btn-secondary';
      wa.href = 'https://wa.me/' + String(S.WHATSAPP).replace(/[^\d]/g, '');
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = 'WhatsApp instead';
      linkRow.appendChild(wa);
    }
    if (S.BOOKING_URL) {
      var bk = document.createElement('a');
      bk.className = 'btn btn-ghost';
      bk.href = S.BOOKING_URL;
      bk.target = '_blank';
      bk.rel = 'noopener';
      bk.textContent = 'Book a call';
      linkRow.appendChild(bk);
    }
    if (!S.WHATSAPP && !S.BOOKING_URL && !emailOK) linkRow.hidden = true;
  }

  /* ---------- 3. Compose the message ---------- */
  function readField(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function buildMessage() {
    var name = readField('q-name') || '(no name)';
    var business = readField('q-business') || '(no business given)';
    var service = readField('q-service');
    var details = readField('q-details') || '(no details given)';
    return {
      subject: 'Quote request — ' + service,
      body: [
        'Hi,',
        '',
        'I would like a fixed quote for: ' + service,
        '',
        'Name: ' + name,
        'Business: ' + business,
        '',
        'The problem:',
        details,
        '',
        '— sent from the site'
      ].join('\n')
    };
  }

  var fallback = document.getElementById('contact-fallback');
  var status = document.getElementById('copy-status');
  var summary = '';

  function showFallback() {
    if (fallback) fallback.hidden = false;
  }

  function say(msg) {
    if (status) status.textContent = msg;
  }

  // Always render the message, so a visitor can copy it by hand even when
  // clipboard permission and the mail app both fail.
  function renderMessage(text) {
    var ta = document.getElementById('copy-summary-text');
    if (ta && text) ta.value = text;
  }

  /* ---------- 4. Submit: real endpoint, else email + fallback ---------- */
  var form = document.getElementById('quote-form');
  var submitBtn = document.getElementById('quote-submit');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = buildMessage();
    summary = msg.subject + '\n\n' + msg.body;
    renderMessage(summary);

    // A) Configured form backend: send it properly, no mail app needed.
    if (S.FORM_ENDPOINT) {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      fetch(S.FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          subject: msg.subject,
          name: readField('q-name'),
          business: readField('q-business'),
          service: readField('q-service'),
          message: readField('q-details'),
          _replyto: email
        })
      }).then(function (r) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send my quote request'; }
        if (r.ok) {
          form.innerHTML = '<span class="badge badge-good">Sent</span>' +
            '<p style="margin:.5rem 0 0">Thanks — you\'ll get a fixed quote within 24 hours.</p>';
        } else {
          showFallback();
          say('Sending failed. Use one of the options above.');
        }
      }).catch(function () {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send my quote request'; }
        showFallback();
        say('No connection. Use one of the options above.');
      });
      return;
    }

    // B) No backend: open the mail app, then always reveal fallbacks so a
    //    visitor without a mail client is never left with a dead button.
    if (emailOK) {
      window.location.href = 'mailto:' + email +
        '?subject=' + encodeURIComponent(msg.subject) +
        '&body=' + encodeURIComponent(msg.body);
    }
    showFallback();
    say(emailOK
      ? 'If your email app did not open, copy the message below.'
      : 'This site\'s email address is not configured yet.');
  });

  /* ---------- 5. Copy-to-clipboard fallback ---------- */
  var copyBtn = document.getElementById('copy-summary');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!summary) {
        var m = buildMessage();
        summary = m.subject + '\n\n' + m.body;
        renderMessage(summary);
      }

      function done(ok) {
        say(ok
          ? 'Message copied — paste it into any email.'
          : 'Automatic copy was blocked. The message is shown above — select it and press Ctrl+C.');
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = summary;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        done(ok);
      }
    });
  }

  /* ---------- 6. Misc ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();