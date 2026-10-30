/* Athithya Property Solutions — shared behaviour (vanilla JS) */
(function () {
  'use strict';

  /* ---------- Mobile nav + Services dropdown ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  var dropdownItems = document.querySelectorAll('.has-dropdown');
  function closeDropdowns(except) {
    dropdownItems.forEach(function (li) {
      if (li !== except) {
        li.classList.remove('open');
        var b = li.querySelector('.nav-link');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  }
  dropdownItems.forEach(function (li) {
    var btn = li.querySelector('.nav-link');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      closeDropdowns(li);
    });
    // Hover support on desktop (CSS handles visibility; keep aria in sync)
    li.addEventListener('mouseenter', function () {
      if (window.matchMedia('(min-width: 961px)').matches) btn.setAttribute('aria-expanded', 'true');
    });
    li.addEventListener('mouseleave', function () {
      if (window.matchMedia('(min-width: 961px)').matches && !li.classList.contains('open')) btn.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dropdown')) closeDropdowns(null);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDropdowns(null);
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    }
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        panel.style.maxHeight = '0px';
        panel.hidden = true;
      } else {
        panel.hidden = false;
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
  window.addEventListener('resize', function () {
    document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(function (b) {
      var p = document.getElementById(b.getAttribute('aria-controls'));
      p.style.maxHeight = p.scrollHeight + 'px';
    });
  });

  /* ---------- Enquiry form (contact.html) ---------- */
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint') || '/api/enquiry';
  var statusBox = document.getElementById('form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitting = false;

  // Pre-select enquiry type from ?type=... links on other pages
  var params = new URLSearchParams(window.location.search);
  var preType = params.get('type');
  var typeSelect = form.elements['enquiryType'];
  if (preType && typeSelect) {
    Array.prototype.forEach.call(typeSelect.options, function (o) {
      if (o.value.toLowerCase() === preType.toLowerCase()) typeSelect.value = o.value;
    });
  }

  function setError(field, msg) {
    var row = field.closest('.form-row');
    row.classList.add('invalid');
    row.querySelector('.field-error').textContent = msg;
    field.setAttribute('aria-invalid', 'true');
  }
  function clearError(field) {
    var row = field.closest('.form-row');
    row.classList.remove('invalid');
    field.removeAttribute('aria-invalid');
  }

  function validate() {
    var ok = true;
    var f = form.elements;
    ['fullName', 'phone', 'email', 'enquiryType', 'message'].forEach(function (n) { clearError(f[n]); });

    if (f.fullName.value.trim().length < 2) { setError(f.fullName, 'Please enter your full name.'); ok = false; }
    var digits = f.phone.value.replace(/[\s\-()+]/g, '');
    if (!/^(91|0)?[6-9]\d{9}$/.test(digits) && !/^\d{8,15}$/.test(digits)) {
      setError(f.phone, 'Please enter a valid phone number (for example 9841455995).'); ok = false;
    }
    if (f.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) {
      setError(f.email, 'Please enter a valid email address or leave this field blank.'); ok = false;
    }
    if (!f.enquiryType.value) { setError(f.enquiryType, 'Please choose an enquiry type.'); ok = false; }
    if (f.message.value.trim().length < 10) { setError(f.message, 'Please enter a message (at least 10 characters).'); ok = false; }
    if (!ok) {
      var first = form.querySelector('.invalid input, .invalid select, .invalid textarea');
      if (first) first.focus();
    }
    return ok;
  }

  function showStatus(type, msg) {
    statusBox.className = 'form-status ' + type;
    statusBox.textContent = msg;
  }

  form.addEventListener('input', function (e) {
    if (e.target.closest('.form-row')) clearError(e.target);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;
    statusBox.className = 'form-status';
    statusBox.textContent = '';
    if (!validate()) return;

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    var label = submitBtn.querySelector('.label');
    label.textContent = 'Sending…';

    var f = form.elements;
    var payload = {
      fullName: f.fullName.value.trim(),
      phone: f.phone.value.trim(),
      email: f.email.value.trim(),
      enquiryType: f.enquiryType.value,
      message: f.message.value.trim(),
      website: f.website.value // honeypot — must stay empty
    };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; });
      })
      .then(function (r) {
        if (r.res.ok && r.data && r.data.success === true) {
          showStatus('success', 'Thank you. Your enquiry has been sent to Athithya Property Solutions. Our team will contact you.');
          form.reset();
        } else {
          var msg = (r.data && r.data.message) || 'We could not send your enquiry. Please try again, or contact us on WhatsApp at 9841455995.';
          showStatus('error', msg);
        }
      })
      .catch(function () {
        showStatus('error', 'We could not reach the server, so your enquiry was NOT sent. Please try again, or contact us directly on WhatsApp at 9841455995 or by email at athithyapropertyconsultant@gmail.com.');
      })
      .then(function () {
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        label.textContent = 'Send Enquiry';
      });
  });
})();
