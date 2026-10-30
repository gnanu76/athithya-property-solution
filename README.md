# Athithya Property Solutions — Website

Seven-page static website (HTML5, CSS3, vanilla JS) plus a small Node.js/Express backend that e-mails enquiry-form submissions to `athithyapropertyconsultant@gmail.com`.

## Structure
```
index.html  about.html  real-estate.html  construction.html
ongoing-projects.html  completed-projects.html  contact.html
css/style.css    js/script.js
backend/server.js  backend/package.json
.env.example  robots.txt  sitemap.xml
assets/logo  assets/projects  assets/founders   (empty, for client photos)
```

## Run locally (with working enquiry form)
1. Install Node.js 18+.
2. `cd backend && npm install`
3. Copy `.env.example` to `.env` in the project root and fill in:
   - `SMTP_USER` — the Gmail account that sends mail
   - `SMTP_PASS` — a Google **App Password** (Google Account → Security → 2-Step Verification → App passwords)
   - `ENQUIRY_TO` — already set to athithyapropertyconsultant@gmail.com
4. `npm start` (inside `backend/`), then open http://localhost:3000
5. **Send a real test enquiry** from the Contact page and confirm it arrives in the inbox. The form shows success only when the server confirms the email was sent; if SMTP is not configured it shows an error.

Opening the HTML files directly (without the backend) works for browsing, but the form will show an error and nothing is sent.

## Deployment
- Needs a host that runs Node (Render, Railway, a VPS, cPanel Node app). Set the `.env` values as environment variables on the host. Start command: `node backend/server.js`.
- Static-only hosting (Netlify, GitHub Pages) can serve the pages, but then the form needs a backend: either host `backend/` separately and set `data-endpoint` on the form in `contact.html` to its full URL (and add CORS), or replace the endpoint with a form service such as Formspree.

## Adding photos
All image areas are empty `.image-placeholder` boxes. To add a photo, put an `<img src="assets/..." alt="descriptive text">` inside the box and add `style="object-fit:cover;width:100%;height:100%"`. **Logo:** save the client's original logo as `assets/logo/athithya-logo.png` (exact filename). Every page's header already points to it, keeps its original proportions (64px tall on desktop, 50px on mobile) and shows it on the green header. Until the file exists, the header shows a dashed slot and the company name in gold. If your file has a different name or extension (e.g. `.svg`), change the `src` in the `<img class="brand-logo">` tag in each page (or in `_build/build.js` if you regenerate).

## Editing content
Pages are plain HTML and can be edited directly. Project cards on Home, Ongoing and Completed pages are clearly marked editable sample records: replace the bracketed text with confirmed details or delete the card.
Customer reviews: add genuine reviews (max 10) in the marked comment block on `index.html`.

## Client must confirm before launch
- [ ] Founding year **2002** and the "25th year" claim (not published yet; story avoids it)
- [ ] Production domain: replace `https://www.example.com` in canonical tags, `robots.txt`, `sitemap.xml`
- [ ] WhatsApp number 9841455995 and a voice-call number (click-to-call not added)
- [ ] Exact Google Maps pin — map currently searches the written address. Replace the iframe `src` with the client's Google Maps embed link if available
- [ ] "Free site visit" offer and terms
- [ ] Business hours (none shown)
- [ ] Real project details, completion statuses and customer reviews
- [ ] Vision/Mission wording
- [ ] Whether the company holds any RERA/DTCP/CMDA registrations (none are claimed)
- [ ] Logo and founder/management photos

## Notes
- Fonts (Inter, Playfair Display) load from Google Fonts; system fallbacks are set.
- Honeypot field, rate limiting (8 per 15 min per IP) and server-side validation are in `backend/server.js`.
