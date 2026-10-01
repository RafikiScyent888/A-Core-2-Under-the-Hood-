/* =====================================================================
   The Email Threat tickets, from the Email Threat Classification sim.

   The sim's twelve emails, word for word apart from the names (they are
   sent to the office's own staff here), and twelve more. The owner's
   rulings (1 October 2026):
     - four categories: legitimate, spam, phishing, malicious ("the sims
       need to stay current"); "Make Your Computer 3x Faster" is malicious
     - two questions per email: the category, then a six-option question
       on the giveaway
     - the student acts on each email, with consequences
     - staff forward suspicious mail to the help desk, except three that
       can't be forwarded: their headers are the evidence, so the
       technician looks at the original on the user's PC and adds the
       safeguards
   ===================================================================== */
import * as MX from "./mail.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
export const CATS = [
  { key: "legit", label: "Legitimate", why: "" },
  { key: "spam", label: "Spam", why: "" },
  { key: "phishing", label: "Phishing", why: "" },
  { key: "malicious", label: "Malicious", why: "" }
];
const CAT_WHY = {
  legit: "Legitimate mail asks for nothing risky and comes from where it says it does.",
  spam: "Spam is unwanted marketing: it wants a sale or a sign-up, not a password and not a download.",
  phishing: "Phishing pretends to be someone trusted to get a password, money or details out of you.",
  malicious: "Malicious mail wants you to open or run something, an attachment or a download, that infects the PC."
};
const STAFF = {
  WS1: { name: "John Doe", addr: "jdoe@rafiki.local", first: "John" },
  WS4: { name: "Farah Nkemelu", addr: "fnkemelu@rafiki.local", first: "Farah" },
  WS2: { name: "Brenda Smith", addr: "bsmith@rafiki.local", first: "Brenda" },
  WS3: { name: "Dev Patel", addr: "dpatel@rafiki.local", first: "Dev" },
  WS5: { name: "Rosa Ortiz", addr: "rortiz@rafiki.local", first: "Rosa" }
};
export function staffOf(id) { return STAFF[id]; }
function mail(o) { o.toAddr = STAFF[o.to].addr; o.tell = { prompt: o.cat === "legit" ? "What tells you it's genuine?" : "What gives it away?", options: [opt(o.tell[0], true)].concat(o.tell.slice(1).map(function (w) { return opt(w[0], false, w[1]); })) }; return o; }

/* ---------------------------------------------------------------- the emails */
const SPF_FAIL = { spf: "fail", dkim: "none", dmarc: "fail" };
const EMAILS = {
  /* ---- the sim's twelve ---- */
  statement: mail({ id: "statement", to: "WS4", cat: "legit", from: ["MyBank Customer Care", "statements@mybank.com"], subject: "Monthly Account Statement Ready", date: "Mon 2 Jun 2025 08:02",
    note: "Got this from my bank. Is it OK to log in? — Farah",
    body: "Hello Farah,\n\nYour monthly account statement for May 2025 is now available.\n\nYou can access it securely by logging into your online banking portal:\nhttps://secure.mybank.com/login\n\nAccount Summary:\n- Ending Balance: $4,210.87\n- Last Payment: $200 (05/23/2025)\n- Statement Period: 05/01/2025 - 05/31/2025\n\nIf you have any questions about this statement or your account, please contact our support team via your online message center.\n\nThank you for choosing MyBank.\n\n— MyBank Customer Care",
    tell: ["It's from mybank.com, links to mybank.com's own site, and asks for nothing",
      ["It shows her real ending balance and last payment, so only the bank could have sent it", "Anyone can type a number, and scammers copy real statements. Where it sends her, and what it asks for, decide it."],
      ["It ends \"Thank you for choosing MyBank\"", "A polite sign-off costs nothing to copy. Phishing uses them too."],
      ["It has no spelling or grammar mistakes", "Good phishing is spelled perfectly. Spelling is a weak clue either way."],
      ["It's addressed to Farah by her first name", "Names leak from breaches and social media, and phishing uses them. A name proves nothing."],
      ["It arrived early on a Monday morning", "Timing proves nothing either way."]] }),
  slim: mail({ id: "slim", to: "WS5", cat: "spam", from: ["SlimFast Burners Team", "offers@slimfast-burners.com"], subject: "Drop 20lbs in Just 14 Days — No Exercise Required!", date: "Mon 2 Jun 2025 07:15",
    note: "Keep getting these. Can you make them stop? — Rosa",
    body: "Hey Rosa,\n\nSummer is here, and so is your chance to get the body you've always wanted — without diet or workouts!\n\nOur new, doctor-developed weight loss gummies melt away stubborn fat while you sleep. No harmful chemicals. No subscriptions. Just results.\n\n💊 Try it today: http://slimfast-burners.com/free-trial\n\nLimited supply left. Don't wait!\n\nTo your transformation,\n— SlimFast Burners Team",
    tell: ["It sells a product with impossible claims, and asks for no login or download",
      ["It uses Rosa's first name, so it's a targeted attack", "Mailing lists have names. It's after a sale, not her password: that's spam."],
      ["The link is plain http rather than https, so clicking it would install malware on her PC", "No https means no encryption. It doesn't mean malware, and nothing here asks her to run anything."],
      ["It says \"Limited supply left\", so it's an attack", "Urgency turns up in spam and phishing alike. What it wants decides it: a sale."],
      ["It comes from a company she's never bought from", "That's why it's unwanted, but on its own it doesn't tell spam from phishing."],
      ["It has an emoji in it", "Emoji are style, not a threat signal."]] }),
  msreset: mail({ id: "msreset", to: "WS1", cat: "phishing", from: ["Microsoft Account Support", "support@msaccount-updatecenter.com"], subject: "Microsoft Account Alert: Password Expiring Today", date: "Mon 2 Jun 2025 09:41",
    note: "Do I need to do this? Says my password expires today. — John",
    body: "Hello John,\n\nYour Microsoft account password is set to expire on June 8, 2025. Failure to update your password may result in access loss.\n\nTo reset your password, click below:\nhttp://msaccount-updatecenter.com\n\nThis security policy helps us protect your data and keep your account safe.\n\nThank you,\n— Microsoft Account Support",
    tell: ["The reset link goes to msaccount-updatecenter.com, not a Microsoft domain",
      ["Microsoft account passwords never expire on a set date, so the whole claim is false", "Organizations can set passwords to expire. The claim isn't the tell; where the link goes is."],
      ["It uses John's first name, which Microsoft never does", "Microsoft's real mail uses names. A name proves nothing."],
      ["It says \"security policy\", a known phishing keyword", "Real policy mail says it too. Keywords aren't proof; the link's destination is."],
      ["There's no Microsoft logo anywhere in it", "Logos are easy to fake and easy to leave out. Not decisive."],
      ["It's plain text rather than a branded email", "Format proves nothing either way."]] }),
  faster: mail({ id: "faster", to: "WS3", cat: "malicious", from: ["PC Optimizer Pro", "deals@maxspeed-pcfixer.com"], subject: "🔥 Make Your Computer 3x Faster (Free Download)", date: "Mon 2 Jun 2025 06:58",
    note: "My PC IS slow. Is this legit? — Dev",
    body: "Dev,\n\nIs your PC running slow? It's not your imagination.\n\nMost computers get clogged with junk files, unused apps, and hidden errors. Our powerful optimizer cleans it all up — fast.\n\n✅ Boost performance instantly\n✅ 100% Free download\n✅ No tech knowledge required\n\nGet started now: http://maxspeed-pcfixer.com\n\nYour system will thank you!\n\n— PC Optimizer Pro",
    tell: ["It wants him to download and run a free \"optimizer\" from an unknown site",
      ["It's an advert, so it's only spam", "An advert that gets you to install a program is how malware arrives. The download is what makes it malicious."],
      ["It asks for his password", "It doesn't. It wants a download, not a login: that's the difference from phishing."],
      ["It mentions hidden errors, so it's fake antivirus", "Close, but it isn't posing as antivirus or demanding payment. The danger is the download itself."],
      ["It's full of ticks and emoji", "Style, not a threat signal."],
      ["It came before 7 in the morning", "Timing proves nothing."]] }),
  cloudhost: mail({ id: "cloudhost", to: "WS3", cat: "legit", from: ["CloudHost Billing Department", "billing@cloudhost.com"], subject: "Receipt for Your CloudHost Subscription Payment", date: "Tue 3 Jun 2025 10:12",
    note: "Is this receipt real? I do pay for CloudHost. — Dev",
    body: "Hello Dev,\n\nThank you for your recent payment for your CloudHost VPS subscription.\n\nInvoice Number: CH-20250601-1892\nDate Paid: June 1, 2025\nAmount: $19.99\n\nYou can view or download your receipt from your billing dashboard:\nhttps://cloudhost.com/account/billing\n\nIf you have any billing questions, our support team is available 24/7 through the customer portal.\n\nWe appreciate your business and look forward to continuing to serve you.\n\n— CloudHost Billing Department",
    tell: ["It matches a payment Dev made, comes from cloudhost.com, and links there",
      ["It has an invoice number", "Fake invoices have numbers too."],
      ["It says support is available 24/7", "Anyone can say that."],
      ["The amount is only $19.99, and nobody would bother faking something that small", "Small amounts are exactly what scammers fake, so nobody questions them."],
      ["It thanks him for his business", "Costs nothing to copy."],
      ["It's a plain receipt with no logo", "Format proves nothing."]] }),
  iphone: mail({ id: "iphone", to: "WS2", cat: "spam", from: ["The iPhone Giveaway Team", "winner@iphone15-giveaway.com"], subject: "You've Been Selected to Win a New iPhone 15!", date: "Tue 3 Jun 2025 11:30",
    note: "Probably fake but... is it? — Brenda",
    body: "Dear Valued User,\n\nYou've been chosen to receive a brand new iPhone 15 — absolutely free! 🎁\n\nJust answer a short survey and enter your shipping info:\nhttp://iphone15-giveaway.com/claim-now\n\nWinners are selected every 2 minutes — claim your device before time runs out!\n\nGood luck,\n— The iPhone Giveaway Team\n\n*Offer valid for US residents only. Shipping & handling may apply.",
    tell: ["A prize she never entered, to \"Dear Valued User\", with shipping-fee fine print",
      ["It asks for her shipping details in a survey, so it's really after her email password", "It asks for an address and a fee, not a login. Prize offers like this are keyed as spam."],
      ["It mentions the iPhone, so it's from Apple", "Nothing in it is from Apple. It comes from iphone15-giveaway.com."],
      ["Winners every 2 minutes means it's malicious", "Urgency isn't malice. Nothing here is downloaded or run."],
      ["It has a gift emoji in it", "Style, not a threat signal."],
      ["It came in the middle of the morning", "Timing proves nothing."]] }),
  paypal: mail({ id: "paypal", to: "WS4", cat: "phishing", from: ["PayPal Account Review Department", "service@paypal-resolve-login.net"], subject: "Your PayPal Account Has Been Limited", date: "Tue 3 Jun 2025 09:05",
    note: "I use PayPal for personal stuff. Should I click? — Farah",
    body: "Dear Customer,\n\nWe've noticed unauthorized attempts to log in to your PayPal account.\n\nTo prevent fraud, we've temporarily limited access to your account. To restore access, please confirm your information:\n\nhttp://paypal-resolve-login.net\n\nThis action is required to comply with PayPal's security standards. Failure to respond will result in permanent limitation.\n\nSincerely,\nPayPal Account Review Department",
    tell: ["It's \"Dear Customer\", and the link goes to paypal-resolve-login.net, not paypal.com",
      ["PayPal never limits accounts", "It does. The claim isn't the tell; the link is."],
      ["It mentions PayPal's security standards", "Real security mail mentions them too."],
      ["It came to her work address, and she only ever uses PayPal for personal things at home", "Worth noting, people do use work addresses. The link is decisive."],
      ["There's no PayPal logo", "Logos are easy to fake and easy to leave out."],
      ["It's short", "Length proves nothing."]] }),
  invoice: mail({ id: "invoice", to: "WS4", cat: "malicious", from: ["Accounts — Hartwell Supplies", "accounts@hartwellsupplies-billing.com"], subject: "OVERDUE: Invoice Q4-0981", date: "Tue 3 Jun 2025 08:47",
    note: "We don't use Hartwell I think? Excel says the file has macros. — Farah",
    body: "Hello,\n\nPlease see the attached overdue invoice Q4-0981.\n\nTo view the payment details, open the attachment, then click Enable Editing and Enable Content.\n\nPayment is due within 3 days.\n\nRegards,\nAccounts Department\nHartwell Supplies",
    attach: ["Invoice-Q4-0981.xlsm"],
    tell: ["A macro-enabled .xlsm invoice that tells her to \"Enable Content\"",
      ["It's from a supplier Farah has never dealt with", "Worth checking, but new suppliers happen. The danger is the macro file and the instruction to enable it."],
      ["It says payment is overdue", "Real reminders say that too. Urgency isn't proof."],
      ["It's an Excel file, and those are always malware", "Most aren't. The .xlsm, a workbook with macros, plus \"Enable Content\" is the danger."],
      ["It asks her to log in to pay", "It doesn't. It wants a file opened and its macros run: malicious, not phishing."],
      ["It has no company logo", "Format proves nothing."]] }),
  hotel: mail({ id: "hotel", to: "WS2", cat: "legit", from: ["TravelSafe Booking Services", "bookings@travelsafe.com"], subject: "Booking Confirmed: Your NYC Hotel Reservation, July 12–15", date: "Wed 4 Jun 2025 14:20",
    note: "This is my sales trip. Just checking it's real before I rely on it. — Brenda",
    body: "Hi Brenda,\n\nYour hotel reservation has been successfully confirmed!\n\n📍 Hotel: Midtown Grand Hotel, New York City\n📅 Dates: July 12 – July 15, 2025\n🛏️ Room: Deluxe King with City View\n🧾 Confirmation #: 4395721-NYC\n\nYou can view your reservation or make changes at:\nhttps://travelsafe.com/reservations\n\nA reminder with check-in instructions will be sent 48 hours before your stay.\n\nWe hope you enjoy your trip!\n\n— TravelSafe Booking Services",
    tell: ["It matches the trip Brenda booked, comes from travelsafe.com, and asks for nothing",
      ["It has a confirmation number", "Fake bookings have numbers too."],
      ["It names a real hotel in Midtown New York, with the right room type and the right dates", "Anyone can name a real hotel."],
      ["It promises a reminder 48 hours before", "Easy to say. Proves nothing."],
      ["It's friendly: \"We hope you enjoy your trip!\"", "Tone costs nothing to copy."],
      ["It's laid out with emoji like a real booking", "Format proves nothing."]] }),
  stream: mail({ id: "stream", to: "WS3", cat: "spam", from: ["StreamFreedom Pro", "hello@flix-hacktool.net"], subject: "🔥 Watch Any Show From Any Country — No Restrictions!", date: "Wed 4 Jun 2025 18:02",
    note: "Ha. Junk, right? — Dev",
    body: "Dev,\n\nTired of missing out on global Netflix and Disney+ content? Unlock over 1,000 international shows instantly with our premium streaming tool.\n\n✓ Works on Netflix, Hulu, BBC, and more\n✓ Ultra-fast servers\n✓ No installation required\n\nStart your access now: http://flix-hacktool.net/unlock\n\nStream smarter, not harder.\n\n— StreamFreedom Pro",
    tell: ["It advertises a service: no login wanted, nothing to install",
      ["The domain has \"hack\" in it, so it will install malware", "It says no installation, and nothing asks him to run anything. A shady advert is still spam."],
      ["It mentions Netflix, so it's after his Netflix password", "It doesn't ask for a login. It's selling a service."],
      ["Getting round region locks is against the rules, so it's malicious", "Breaking a streaming service's terms isn't malware. It's unwanted marketing."],
      ["It came in the evening", "Timing proves nothing."],
      ["It uses tick marks", "Style, not a threat signal."]] }),
  bank: mail({ id: "bank", to: "WS5", cat: "phishing", from: ["Online Security Division, Global Trust Bank", "security@securebank-verification.com"], subject: "⚠️ Urgent: Your Bank Account Has Been Temporarily Suspended", date: "Wed 4 Jun 2025 07:31",
    note: "Scared me. Is my account really suspended? — Rosa",
    body: "Dear Rosa,\n\nWe detected suspicious transactions from a foreign IP address and, as a security precaution, your account has been temporarily suspended.\n\nTo restore access, please verify your identity immediately:\nhttp://securebank-verification.com\n\nIf no action is taken within 24 hours, your account may be permanently locked due to inactivity.\n\nWe apologize for any inconvenience and appreciate your prompt attention to this matter.\n\n— Online Security Division\nGlobal Trust Bank",
    tell: ["It threatens a lockout in 24 hours and sends her to securebank-verification.com",
      ["It mentions a foreign IP address", "Real fraud alerts mention them too. That detail isn't the tell."],
      ["It apologizes for the inconvenience", "Politeness costs nothing to copy."],
      ["Rosa doesn't bank with Global Trust Bank, so the account it's talking about can't be hers", "Worth asking her, but the decisive tell is the urgency and the link, which you can see without asking."],
      ["It has a warning sign in the subject", "Style, not proof."],
      ["It doesn't quote her account number", "Plenty of real mail doesn't. Not decisive."]] }),
  login: mail({ id: "login", to: "WS1", cat: "phishing", from: ["Webmail Security Center", "alerts@email-verify-alert.com"], subject: "Unusual Login Attempt Detected from Unknown Device", date: "Wed 4 Jun 2025 08:10",
    note: "Someone in Jakarta tried to log in?? — John",
    body: "Hi John,\n\nA login attempt was made on your email account from an unrecognized location.\n\nDevice: Windows PC\nLocation: Jakarta, Indonesia\nTime: 06/07/2025 – 2:13 AM\n\nIf this was not you, please secure your account now to avoid unauthorized access:\nhttp://email-verify-alert.com\n\nThank you,\n— Webmail Security Center",
    tell: ["Its \"secure your account\" link goes to email-verify-alert.com, not our mail service",
      ["Jakarta is on the other side of the world, so the login attempt it describes must be fake", "Sign-in alerts about far-off places are a real feature. The link is the tell."],
      ["The attempt was at 2:13 in the morning", "Attackers and alerts work at all hours. Not decisive."],
      ["It doesn't say which browser was used", "Real alerts vary. Proves nothing."],
      ["It's signed by a department, not a person", "Real automated alerts are too."],
      ["It says \"Windows PC\", and John uses Windows", "Most people do. Not decisive."]] }),

  /* ---- twelve more ---- */
  course: mail({ id: "course", to: "WS3", cat: "legit", from: ["EduLearn Team", "welcome@edulearn.org"], subject: "Welcome to CyberSec Foundations — Class Starts June 10", date: "Thu 5 Jun 2025 09:00",
    note: "I signed up for a course last week. Is this the real welcome email? — Dev",
    body: "Hi Dev,\n\nCongratulations on enrolling in our CyberSec Foundations course! Your registration is confirmed and your first class begins on June 10, 2025.\n\nCourse Dashboard: https://learn.edulearn.org/cybersec/login\n\nWhat's next:\n✔ Review the syllabus and introductory materials.\n✔ Join the course forum to meet peers and instructors.\n✔ Complete the welcome module before the start date.\n\nIf you have any issues accessing your dashboard, feel free to contact us at support@edulearn.org.\n\nWe're excited to help you begin your cybersecurity journey!\n\n— EduLearn Team",
    tell: ["It confirms the course Dev signed up for, from edulearn.org, linking to edulearn.org",
      ["It has tick marks for the next steps", "Style, not proof."],
      ["It gives a support address", "Anyone can add one."],
      ["The start date is in the future", "Proves nothing."],
      ["It's about an education course, and nobody bothers to fake emails about online learning", "Scammers fake anything people expect."],
      ["It sounds excited and friendly", "Tone costs nothing to copy."]] }),
  giftcards: mail({ id: "giftcards", to: "WS4", cat: "phishing", noForward: true, guard: "external", blockDom: "rafiki-lt.com", from: ["Mason (Team Lead)", "mason@rafiki-lt.com"], replyTo: "mason.lead.office@gmail.com", hdr: { spf: "fail", dkim: "none", dmarc: "fail", server: "smtp.bulk-relay.example", ip: "198.51.100.77" }, subject: "Quick favour", date: "Thu 5 Jun 2025 11:48",
    body: "Farah, are you at your desk? I need a quick favour. I'm in a meeting and can't talk.\n\nPlease buy six $200 Apple gift cards for a client thank-you and email me the codes. I'll sort the expense today.\n\nKeep this between us for now.\n\nMason",
    tell: ["It's from rafiki-lt.com, not rafiki.local, and replies go to a Gmail address",
      ["Mason would never ask anyone for a favour by email; he'd always walk over or call instead", "He might. The headers, not his habits, prove it isn't him."],
      ["Gift cards are always a scam", "A strong warning sign, but the proof is who really sent it."],
      ["It says \"keep this between us\"", "A classic pressure line, but not proof on its own."],
      ["It was sent while Mason was in a meeting", "Nobody can check that from the email. Not decisive."],
      ["It has no email signature", "Plenty of quick internal mail doesn't."]] }),
  chairs: mail({ id: "chairs", to: "WS1", cat: "spam", from: ["ErgoDeals", "news@ergodeals-mail.com"], subject: "Exclusive: 70% off ergonomic chairs this week only", date: "Thu 5 Jun 2025 13:15",
    note: "HR gets these daily. Can we block them? — John",
    body: "Hi John,\n\nYour back deserves better. This week only, our best-selling ergonomic chairs are 70% off.\n\nShop the sale: https://ergodeals-mail.com/sale\n\nUnsubscribe: https://ergodeals-mail.com/unsubscribe\n\n— The ErgoDeals Team",
    tell: ["A sales offer with an unsubscribe link, wanting a purchase and nothing else",
      ["It has an unsubscribe link, so it's phishing", "Unsubscribe links are in legitimate mail and spam alike."],
      ["70% off is far too good to be true, so the sale link must lead to something malicious", "A big discount isn't malware. Nothing asks him to run anything."],
      ["It says \"Exclusive\" and \"this week only\"", "Sales language. That's spam's style, but it isn't what sets it apart."],
      ["It came to his work address", "Marketing lists hold work addresses. Not decisive."],
      ["It's addressed to John by name", "Names are on every mailing list."]] }),
  bonus: mail({ id: "bonus", to: "WS2", cat: "malicious", from: ["HR Shared Files", "files@sharedocs-hr.com"], subject: "Q3 bonus list — please review before Friday", date: "Thu 5 Jun 2025 15:40",
    note: "Why would HR send me this? The file won't preview. — Brenda",
    body: "Hi,\n\nThe Q3 bonus list is attached. Please review your entry before Friday.\n\nHR",
    attach: ["Q3-bonus-list.pdf.exe"],
    tell: ["The attachment ends in .exe: a program dressed up as a PDF",
      ["It mentions money, so it's after her bank details", "It asks for nothing typed in. It wants a file opened: malicious."],
      ["It says \"before Friday\", a deadline", "Urgency isn't proof."],
      ["PDFs are dangerous to open", "Close, but this isn't a PDF at all. Read the whole file name."],
      ["It isn't signed by a named person", "Weak. Lots of mail isn't."],
      ["It went to Sales, not HR", "Odd, but people get HR mail. The file name is the giveaway."]] }),
  mailbox: mail({ id: "mailbox", to: "WS5", cat: "phishing", noForward: true, guard: "antispoof", from: ["IT Helpdesk", "helpdesk@rafiki.local"], returnPath: "bounce@mx-relay-77.example", hdr: { spf: "fail", dkim: "none", dmarc: "fail", server: "mx-relay-77.example", ip: "203.0.113.199" }, subject: "Your mailbox is full — validate within 24 hours", date: "Fri 6 Jun 2025 08:20",
    body: "Dear user,\n\nYour mailbox has reached its storage limit. To keep receiving email, validate your account within 24 hours:\n\nValidate my mailbox\n\nIT Helpdesk",
    links: [{ shown: "Validate my mailbox", href: "https://rafiki-mail-validate.example/login" }],
    tell: ["It claims to be helpdesk@rafiki.local but came from an outside server and failed SPF",
      ["Our own help desk would never send anyone an email about how full their mailbox is getting", "We might. The headers prove who really sent it."],
      ["It gives a 24-hour deadline", "Urgency is a warning sign, not proof."],
      ["It has a \"Validate my mailbox\" button", "A warning sign, but the proof is where it really came from."],
      ["It's signed \"IT Helpdesk\", not a person", "Our own notices are too. Not decisive."],
      ["It says \"Dear user\" instead of her name", "Generic greetings are a hint, not proof."]] }),
  paywise: mail({ id: "paywise", to: "WS3", cat: "legit", from: ["Rafiki IT", "it@rafiki.local"], subject: "PayWise 3.2 is available in Software Center", date: "Fri 6 Jun 2025 09:30",
    note: "Is this really from IT? It says it installs on its own. — Dev",
    body: "Hello,\n\nPayWise 3.2 is now available in Software Center. Open Software Center and choose Install, or it will install automatically on Friday night.\n\nThere is nothing to download from this email.\n\nRafiki IT",
    tell: ["It's from it@rafiki.local and points to Software Center, with no link or attachment",
      ["It mentions PayWise, which Dev uses", "An attacker can name programs people use."],
      ["It says it installs on its own", "IT can push installs, and so can a fake that wants you to relax. Not decisive."],
      ["It's short and polite", "Tone costs nothing to copy."],
      ["It names the IT department", "Anyone can type a department's name."],
      ["It says it installs on Friday night, and Friday night is when our updates usually run", "True here, but an attacker could guess it."]] }),
  webinar: mail({ id: "webinar", to: "WS2", cat: "spam", from: ["GrowthSummit Events", "invites@growthsummit-events.com"], subject: "Free webinar: 10x your sales pipeline", date: "Fri 6 Jun 2025 10:05",
    note: "Got this three times this week. Junk? — Brenda",
    body: "Hi Brenda,\n\nJoin 4,000 sales leaders at our free webinar: how to 10x your pipeline in 90 days.\n\nRegister free: https://growthsummit-events.com/register\n\nSee you there!\nGrowthSummit Events",
    tell: ["Unsolicited event marketing: it wants a sign-up, not a password or a download",
      ["Registering means typing her name and work details into a form, so it's really phishing", "A sign-up form for an event isn't a stolen login. Unwanted marketing is spam."],
      ["It's free, so it's malicious", "Free isn't malware. Nothing here is run."],
      ["It's addressed to her role in Sales", "Lists target roles. Not decisive."],
      ["It's the third one this week", "Repetition makes it annoying, not malicious."],
      ["It has a register link", "Real events have them too."]] }),
  parcel: mail({ id: "parcel", to: "WS5", cat: "malicious", from: ["Parcel Delivery Service", "noreply@parcel-dlvry-notice.com"], subject: "We couldn't deliver your package", date: "Fri 6 Jun 2025 12:44",
    note: "We get deliveries every day. Should I print this label? It's a zip. — Rosa",
    body: "Dear customer,\n\nWe were unable to deliver your package. Print the attached label and bring it to your nearest depot.\n\nParcel Delivery Service",
    attach: ["Delivery_Label.zip"],
    tell: ["A zipped \"label\" to open, from a courier that gives no tracking number",
      ["Reception does get parcels, so it's genuine", "That's exactly why it works on her. It doesn't make it genuine."],
      ["It comes from a \"noreply\" address", "Lots of real mail does. Not decisive."],
      ["It asks her to take the label to a depot", "That part is harmless. Opening the zip is the danger."],
      ["It's after her home address", "It doesn't ask for one. It wants a file opened."],
      ["Zip files are blocked anyway, so it's harmless", "They aren't always, and this one got through."]] }),
  bankswitch: mail({ id: "bankswitch", to: "WS4", cat: "phishing", noForward: true, guard: "impersonation", blockDom: "bradytag-co.com", from: ["Brady Tag Co. Accounts", "accounts@bradytag-co.com"], replyTo: "payments@bradytag-billing.com", hdr: { spf: "pass", dkim: "pass", dmarc: "pass", server: "vps-41.cheaphost.example", ip: "192.0.2.41" }, subject: "Updated bank details for invoice payments", date: "Mon 9 Jun 2025 09:12",
    body: "Dear Accounts Payable,\n\nPlease note that Brady Tag Co. has changed banks. From today, please make all invoice payments to the new account below, before your next payment run.\n\nBank: First Coastal\nAccount: 88104472\nRouting: 061000104\n\nKind regards,\nAccounts, Brady Tag Co.",
    tell: ["It's from bradytag-co.com, not bradytag.com, with replies routed to a third domain",
      ["SPF passed, so it's genuine", "SPF only proves bradytag-co.com's own server sent it. Anyone can register a lookalike domain and pass."],
      ["Suppliers never change bank accounts", "They do, rarely. That's why a call to a known number is the check."],
      ["It wants the change made before Farah's next payment run, and suppliers never rush like that", "Urgency is a warning sign, not proof."],
      ["It has no attachment", "Invoice fraud usually doesn't need one."],
      ["It's polite and well written", "Proves nothing either way."]] }),
  shipped: mail({ id: "shipped", to: "WS4", cat: "legit", from: ["Brady Tag Co.", "orders@bradytag.com"], subject: "Your order #55120 has shipped", date: "Mon 9 Jun 2025 10:30",
    note: "After that bank one, I'm not sure about anything from Brady Tag. This one OK? — Farah",
    body: "Hello Farah,\n\nYour order #55120 (LabelPro label stock, 12 rolls) has shipped.\n\nTrack it here: https://www.bradytag.com/orders/55120\n\nThank you,\nBrady Tag Co.",
    tell: ["It's from bradytag.com, matches order 55120, and its link goes to bradytag.com",
      ["It has an order number", "Fake mail has numbers too."],
      ["Brady Tag is our label supplier, so anything that arrives from Brady Tag must be safe", "That's exactly what the bank-details email relied on. The domain decides it."],
      ["It says thank you", "Costs nothing to copy."],
      ["It has a tracking link", "Phishing has links too. Where it goes is what counts."],
      ["It came an hour after the bank email", "Timing proves nothing."]] }),
  docusign: mail({ id: "docusign", to: "WS1", cat: "phishing", from: ["DocuSign via HR Docs", "dse@docusign.secure-view.co"], subject: "Please review and sign: Employment contract — amendment", date: "Mon 9 Jun 2025 11:02",
    note: "HR does use e-signatures. This one asks me to sign in first. — John",
    body: "You have a document to review and sign.\n\nEmployment contract — amendment\n\nREVIEW DOCUMENT\n\nThis message was sent to you by HR Docs via DocuSign.",
    links: [{ shown: "REVIEW DOCUMENT", href: "https://docusign.secure-view.co/login" }],
    tell: ["The Review Document button goes to a sign-in page on secure-view.co, not DocuSign",
      ["HR really does use e-signatures for contracts, so a signing request like this one is genuine", "That's why it works. Where the button goes is the check."],
      ["It has a big button instead of a link", "Real DocuSign mail has a button too."],
      ["It has \"DocuSign\" in the sender's name", "A display name can say anything."],
      ["It's about a contract, which is private", "Real contracts arrive this way too."],
      ["It's an advert for DocuSign", "It isn't selling anything; it wants a sign-in."]] }),
  timesheet: mail({ id: "timesheet", to: "WS2", cat: "malicious", from: ["Payroll", "payroll@rafiki-payroll.net"], subject: "New timesheet template for October", date: "Mon 9 Jun 2025 13:20",
    note: "Payroll's new template. Excel has a yellow bar. Do I enable it? — Brenda",
    body: "Hi all,\n\nAttached is the new timesheet template. Open it and click Enable Content so the hours calculate.\n\nPayroll",
    attach: ["Timesheet_Oct.xlsm"],
    tell: ["An emailed .xlsm that tells her to click \"Enable Content\" so it \"works\"",
      ["Payroll does send timesheets, so it's genuine", "That's why it works. The macro file and the instruction are the danger."],
      ["It's an Excel file, and those are always blocked", "They aren't, and this one wasn't."],
      ["It's after her hours to steal her pay", "It wants a macro run, not details typed in: malicious."],
      ["It's spam about timesheets", "It isn't selling anything. It wants code run."],
      ["It's addressed to \"all\"", "Real team mail is too."]] })
};
export function emailById(id) { return EMAILS[id]; }

/* ------------------------------------------------------------- per email */
function tri(fleet, id) { return MX.tri(fleet, id); }
function reset(fleet, e) { return MX.state(fleet).resets.indexOf(e.to) >= 0; }
/* What "done" means for each kind of email. */
export function acted(fleet, e) {
  const t = tri(fleet, e.id), s = MX.state(fleet), dom = MX.domainOf(e.from[1]);
  const purged = s.purged.indexOf(e.id) >= 0, blockedDom = s.blocked.indexOf(dom) >= 0;
  if (e.cat === "legit") return t.safe && !t.report && !purged && !MX.blocked(fleet, e.from[1]);
  if (e.cat === "spam") return !t.safe && (t.report === "junk" || MX.blocked(fleet, e.from[1]));
  let ok = t.report === "phishing" && purged && (!t.compromised || reset(fleet, e));
  if (e.cat === "malicious") ok = ok && blockedDom;
  if (e.noForward) ok = ok && t.headers.indexOf(e.to) >= 0 && s[e.guard] && (!e.blockDom || s.blocked.indexOf(e.blockDom) >= 0);
  return ok;
}
export function emailDone(fleet, e) { const t = tri(fleet, e.id); return t.cat === e.cat && t.tell && acted(fleet, e); }
export function part(fleet, e) { const t = tri(fleet, e.id); return t.cat !== e.cat ? "cat" : !t.tell ? "tell" : !acted(fleet, e) ? "act" : null; }

/* ---------------------------------------------------------------------
   The shared shape of an email ticket.
   --------------------------------------------------------------------- */
export function emailTicket(o) {
  const t = Object.assign({ sim: "Email Threat Classification", tier: 1, kind: "email", outcome: "resolve", machine: "TECH" }, o);
  t.mails = o.emails.map(function (id) { return EMAILS[id]; });
  t.devices = t.mails.filter(function (e) { return e.noForward; }).map(function (e) { return e.to; });
  t.setup = function (fleet) {
    t.mails.forEach(function (e) { MX.deliver(fleet, e, STAFF[e.to]); });
    MX.state(fleet);
    fleet.TECH.clock = o.clock || "Jun 09 09:00";
  };
  t.goal = function (fleet) { return t.mails.every(function (e) { return emailDone(fleet, e); }); };
  t.scoreFn = function (fleet) {
    let n = 0; const s = MX.state(fleet);
    t.mails.forEach(function (e) { const x = tri(fleet, e.id); if (x.cat === e.cat) n++; if (x.tell) n++; if (acted(fleet, e)) n += 3;
      if (x.report === (e.cat === "spam" ? "junk" : "phishing") && e.cat !== "legit") n++; if (s.purged.indexOf(e.id) >= 0 && (e.cat === "phishing" || e.cat === "malicious")) n++;
      if (e.noForward && x.headers.indexOf(e.to) >= 0) n++; });
    t.mails.forEach(function (e) { if (e.noForward && s[e.guard]) n++; });
    return n;
  };
  /* the email being worked on: the first one not yet done */
  t.current = function (fleet) { return t.mails.filter(function (e) { return !emailDone(fleet, e); })[0] || null; };
  /* the two questions, answered on the ticket */
  t.question = function (id, which) { const e = EMAILS[id]; return which === "cat" ? { prompt: "What is it?", options: CATS.map(function (c) { return opt(c.label, c.key === e.cat, c.key === e.cat ? "" : CAT_WHY[c.key] + " " + catNote(e, c.key)); }) } : e.tell; };
  t.answer = function (fleet, id, which, label) {
    const q = t.question(id, which), o = q.options.filter(function (x) { return x.label === label; })[0]; if (!o) return null;
    const x = tri(fleet, id);
    if (which === "cat") { if (o.correct) x.cat = EMAILS[id].cat; else if (x.catOut.indexOf(label) < 0) x.catOut.push(label); }
    else { if (o.correct) x.tell = true; else if (x.tellOut.indexOf(label) < 0) x.tellOut.push(label); }
    return o;
  };
  /* consequences first: a phishing email called safe gets clicked */
  t.react = function (act, fleet) {
    if (act.type === "mail-safe") { const e = EMAILS[act.id]; if (e && e.cat === "phishing") tri(fleet, e.id).compromised = true; }
  };
  t.judge = function (act, fleet, before) {
    const e = act.id ? EMAILS[act.id] : null, who = e ? STAFF[e.to].first : "";
    if (act.type === "mail-answer") return act.correct ? { guess: false } : { guess: true, say: act.why };
    if (act.type === "mail-click") return { guess: true, say: "Never open a link or an attachment from a suspicious email, even to check it: that's how it gets in. Read where a link goes without opening it (point at it, or focus it, and read the address)." };
    if (act.type === "mail-policy") return act.on ? { guess: false } : { guess: true, say: "That switches off a protection for everyone. Turn it back on." };
    if (!e && act.type !== "mail-block") return { guess: false };
    if (act.type === "mail-safe") {
      if (e.cat === "legit") return { guess: false };
      if (e.cat === "phishing") return { guess: true, say: who + " took your word for it, clicked, and typed their password into the fake page. Their account is compromised now: reset their password and sign them out everywhere, in Mail admin." };
      if (e.cat === "malicious") return { guess: true, say: who + " took your word for it and opened it. Never call something safe before you've checked where it came from and what it wants them to open or run." };
      return { guess: true, say: "It's junk mail. Telling " + who + " it's fine means more of it, and it's still unwanted marketing." };
    }
    if (act.type === "mail-report") {
      if (e.cat === "legit") return { guess: true, say: who + "'s genuine email has gone to Junk, and they've lost it. Restore it from the Junk or Deleted folder." };
      if (act.kind === "phishing" && e.cat === "spam") return { guess: true, say: "The security team sends it back: it's marketing, not an attack. Junk it, or block the sender." };
      if (act.kind === "junk" && (e.cat === "phishing" || e.cat === "malicious")) return { guess: true, say: "Junk hides it from one person. It's still in everyone else's inbox, and the security team never hears about it. Report it as phishing." };
      return { guess: false };
    }
    if (act.type === "mail-purge") return e.cat === "legit" ? { guess: true, say: "You've pulled a genuine email out of " + who + "'s mailbox. Only purge what's harmful. You can put it back from Mail admin's purge list." } : { guess: false };
    if (act.type === "mail-reset") return e.cat === "phishing" && tri(fleet, e.id).compromised ? { guess: false } : { guess: true, say: "Nobody's account was compromised. A forced reset locks " + who + " out of everything for nothing." };
    if (act.type === "mail-block") {
      const legit = t.mails.filter(function (x) { return x.cat === "legit" && (MX.domainOf(x.from[1]) === act.entry || x.from[1] === act.entry); })[0];
      if (legit) return { guess: true, say: "That blocks " + act.entry + ", where " + STAFF[legit.to].first + "'s genuine mail comes from. Unblock it." };
      if (act.entry === "rafiki.local") return { guess: true, say: "That blocks our own domain: nobody in the office can email anyone. Unblock it." };
      return { guess: false };
    }
    if (act.type === "mail-policy") return act.on ? { guess: false } : { guess: true, say: "That switches off a protection for everyone. Turn it back on." };
    return { guess: false };
  };
  /* the strike for rung 3, on the question the student is stuck on */
  t.strikeNow = function (fleet, survivor) {
    const e = t.current(fleet); if (!e) return null; const p = part(fleet, e); if (p !== "cat" && p !== "tell") return null;
    const q = t.question(e.id, p), x = tri(fleet, e.id), picked = {}; (p === "cat" ? x.catOut : x.tellOut).forEach(function (l) { picked[l] = true; });
    const keep = survivor(q.options, picked), out = {};
    q.options.forEach(function (o) { if (!o.correct && o.label !== keep) out[o.label] = o.why; });
    return { id: e.id, which: p, strike: out };
  };
  t.hints = function (fleet) { return mailHints(t, fleet); };
  t.moves = function (fleet) { return mailMoves(t, fleet); };
  t.notReady = function (fleet) { const e = t.current(fleet); return e ? "Not finished yet: \"" + e.subject + "\" still needs " + ({ cat: "classifying", tell: "its giveaway picked", act: "acting on" }[part(fleet, e)]) + "." : null; };
  return t;
}
function catNote(e, k) {
  if (e.cat === "malicious" && k === "spam") return "This one wants something opened or run.";
  if (e.cat === "malicious" && k === "phishing") return "It doesn't want a password typed in; it wants a file or download run.";
  if (e.cat === "phishing" && k === "spam") return "It isn't selling anything: it's pretending to be someone to get something from them.";
  if (e.cat === "phishing" && k === "malicious") return "Nothing here is to be run or opened; it wants a sign-in, money or details.";
  if (e.cat === "spam" && k === "phishing") return "It isn't pretending to be anyone they trust, and it wants no login.";
  if (e.cat === "spam" && k === "malicious") return "Nothing here is to be run or downloaded.";
  if (k === "legit") return "Something here doesn't add up. Look again at where it really came from and what it wants.";
  return "Look again: this one checks out.";
}

/* Mason's two rungs, for the email and the part the student is on. */
export function mailHints(t, fleet) {
  const e = t.current(fleet);
  if (!e) return ["Everything's triaged. Resolve the ticket.", "Last, tell the staff what to watch for next time."];
  const p = part(fleet, e), who = STAFF[e.to].first;
  if (p === "cat") return [e.noForward ? who + " couldn't forward this one. Connect to their PC and look at the original, including its message details." : "Open " + who + "'s forward in Mail. Read who it's really from (the address, not the name), where its links really go, and what it wants " + who + " to do.",
    "Legitimate mail asks for nothing risky; spam wants a sale; phishing pretends to be someone to get a password, money or details; malicious mail wants something opened or run."];
  if (p === "tell") return [e.noForward ? "The proof is in the message details on " + who + "'s PC: where it was really sent from, and where replies would go." : "Point at each link and read the address it really goes to, and read the sender's full address and any attachment's full name.",
    "A display name, a logo or a polite tone can be faked in seconds. What can't: the real sending domain, where a link goes, and what a file really is."];
  const H = {
    legit: ["It's genuine. " + who + " is waiting to hear whether they can use it.", "A genuine email gets a clear answer back to the user, and nothing blocked, reported or purged."],
    spam: ["It's unwanted marketing. What stops it reaching " + who + " again?", "Spam goes to Junk, which trains the filter, or its sender gets blocked. It isn't a security incident."],
    phishing: ["Others may have the same email. And did anyone already act on it?", "Phishing is reported to the security team and pulled from every mailbox it reached. If anyone signed in, their password is reset and their sessions ended."],
    malicious: ["Others may have it too, and the sender will try again.", "Malicious mail is reported, pulled from every mailbox, and its sending domain blocked so the next one never arrives."]
  };
  const h = H[e.cat].slice();
  if (e.noForward) {
    h[0] = "Report it and pull it, from " + who + "'s Mail since it can't be forwarded. Then: what would have stopped it reaching " + who + ", and the next one like it?";
    h[1] = { external: "A fake colleague only works while their mail looks internal. Mail admin can mark everything from outside the company.", antispoof: "Mail that claims a domain it wasn't sent from fails SPF and DMARC. Mail admin can hold that mail instead of delivering it.", impersonation: "This sender passed SPF, because it owns its lookalike domain. Mail admin can flag domains a character or two off ours and our suppliers'." }[e.guard];
  }
  return h;
}
/* Rung 3's six moves for the email the student is on. */
export function mailMoves(t, fleet) {
  const e = t.current(fleet); if (!e) return [opt("Resolve the ticket, then tell the staff what to watch for", true), opt("Escalate every email to the security team as well", false, "They're handled. Escalating finished work wastes the security team's time."), opt("Block all external mail for a day", false, "That stops the business, and it's all dealt with."), opt("Ask each user to delete their copies themselves", false, "The harmful ones are already purged."), opt("Reply to each sender asking them to stop", false, "Replying to a scammer confirms the address is live."), opt("Run a malware scan on every PC first", false, "Nobody opened anything harmful. There's no infection to scan for.")];
  const p = part(fleet, e);
  if (p === "cat" || p === "tell") {
    const q = t.question(e.id, p);
    if (p === "tell") return q.options;
    return q.options.concat([opt("Ask " + STAFF[e.to].first + " to forward it again to be sure", false, "Forwarding again tells you nothing new. Read it."), opt("Reply to the sender and ask if it's genuine", false, "Never reply to a suspicious sender: it confirms the address is live, and they'll say yes.")]);
  }
  const who = STAFF[e.to].first, dom = MX.domainOf(e.from[1]);
  const A = {
    safe: opt("Reply to " + who + ": it's genuine, go ahead", e.cat === "legit", e.cat === "legit" ? "" : "It isn't genuine. Telling them it's safe is how they get caught."),
    junk: opt("Report it as junk, or block the sender", e.cat === "spam", e.cat === "spam" ? "" : e.cat === "legit" ? "It's genuine; " + who + " would lose it." : "Junk hides it from one person; the rest still have it, and nobody investigates."),
    phish: opt("Report it as phishing and purge it from every mailbox", e.cat === "phishing" && !e.noForward, e.cat === "legit" ? "It's genuine; " + who + " would lose it." : e.cat === "spam" ? "It's marketing, not an attack. The security team would send it back." : e.cat === "malicious" ? "Close, but the sender will try again: block its domain too." : "Also needed: the policy that stops the next spoofed one."),
    mal: opt("Report it, purge it, and block " + dom, e.cat === "malicious", e.cat === "malicious" ? "" : e.cat === "phishing" ? (e.noForward ? "Close, but blocking one domain doesn't stop the next one dressed the same way: a policy does." : "Blocking isn't wrong, but it isn't what's missing: report and purge.") : e.cat === "legit" ? "It's genuine." : "Over the top for marketing."),
    spoof: opt("Report and purge it, then turn on: " + (e.noForward ? MX.POLICIES[e.guard].label.toLowerCase() : "quarantine mail that fails SPF and DMARC"), !!e.noForward, e.noForward ? "" : "That policy is for mail that fakes where it came from. This one came from its own domain."),
    ask: opt("Ask " + who + " to delete it and carry on", false, "Deleting one copy leaves it in everyone else's inbox, and teaches nothing.")
  };
  return [A.safe, A.junk, A.phish, A.mal, A.spoof, A.ask];
}

/* ------------------------------------------------------------- the tickets */
function educate(prompt, right, wrong) { return { prompt: prompt, options: [opt(right, true)].concat(wrong.map(function (w) { return opt(w[0], false, w[1]); })) }; }
const FROM = "Help desk mailbox, Rafiki's IT Services";
export const MAIL = [
  emailTicket({ id: "E1", base: true, title: "Four emails forwarded to the help desk: \"is this safe?\"", from: FROM, clock: "Jun 02 10:00", emails: ["statement", "slim", "msreset", "faster"],
    brief: ["Four staff have forwarded emails to the help desk mailbox this morning, each asking whether it's safe.",
      "Open each one in Mail on your laptop. For each: say what it is, find what gives it away (or what shows it's genuine), and deal with it properly in Mail and Mail admin."],
    close: educate("Last step: what do you send all staff after this morning?", "Check the real sender and where links go, and forward anything doubtful to IT before clicking", [
      ["Never open any email from someone you don't know", "Unworkable, and plenty of attacks come from names you do know."],
      ["Delete anything with a link in it", "Genuine mail has links too: Farah's statement did. Check where they go."],
      ["Only trust emails that have a company logo", "A logo is the easiest thing in an email to fake."],
      ["Mark every advert as phishing so security sees it", "Adverts are spam. Flooding the security team hides the real attacks."],
      ["Reply to the sender to ask if an email is genuine", "A scammer will say yes, and now knows the address is live."]]),
    note: { must: [["phish"], ["spam", "junk"], ["malicious", "malware", "download"], ["legit", "genuine", "safe"], ["report", "purge", "block"]], tip: "Each email, what it was, what gave it away, and what you did about it." } }),
  emailTicket({ id: "E2", title: "Help desk mailbox: a receipt, a prize, PayPal and an overdue invoice", from: FROM, clock: "Jun 03 12:00", emails: ["cloudhost", "iphone", "paypal", "invoice"],
    brief: ["Four more forwards to the help desk mailbox: Dev's receipt, Brenda's prize, Farah's PayPal warning and an overdue invoice from a supplier Farah doesn't recognise.",
      "Triage each one, then act on it."],
    close: educate("What do you tell Farah about the invoice?", "Never enable macros in a file that arrived by email; check with the sender on a known number", [
      ["Only open invoices from suppliers she has heard of", "Known suppliers' mailboxes get hacked. The macro is the danger, wherever it comes from."],
      ["Save attachments to the desktop before opening them", "Where the file sits doesn't change what its macro does."],
      ["Open invoices on her phone instead", "That moves the risk to a device IT can't see."],
      ["Forward suspicious invoices to a colleague to try first", "That spreads it to a second PC."],
      ["Turn macros off herself in Excel's settings", "IT sets that by policy. Her part is not to enable them for emailed files."]]),
    note: { must: [["receipt", "cloudhost"], ["paypal", "phish"], ["iphone", "spam", "prize"], ["invoice", "macro", "xlsm"]], tip: "Each email, what it was, the giveaway, and what you did." } }),
  emailTicket({ id: "E3", title: "Help desk mailbox: a booking, a streaming tool and two security alerts", from: FROM, clock: "Jun 04 10:00", emails: ["hotel", "stream", "bank", "login"],
    brief: ["Four forwards: Brenda's hotel booking, Dev's streaming offer, Rosa's \"suspended\" bank account, and John's alert about a login from Jakarta.",
      "Two of them look like security alerts. Only one kind of thing makes an alert real."],
    close: educate("What do you tell John and Rosa about security alerts?", "Go to the site yourself, typed or bookmarked, never by the email's link", [
      ["Ignore every security alert from now on", "Some are real. Check them the safe way instead."],
      ["Only trust alerts that mention a location", "Fakes copy that detail; John's did."],
      ["Click the link but don't type a password", "Opening a malicious page can be enough. Don't open it at all."],
      ["Reply to the alert to ask if it's real", "The scammer answers."],
      ["Forward every alert to the whole office as a warning", "Spreads the link to more people. Send it to IT."]]),
    note: { must: [["booking", "hotel", "travelsafe"], ["spam", "stream"], ["bank", "suspend"], ["login", "jakarta"], ["phish"]], tip: "Each email, what it was, the giveaway, and what you did." } }),
  emailTicket({ id: "E4", title: "Farah: a \"quick favour\" from Mason that won't forward", from: "Farah Nkemelu, Finance", clock: "Jun 05 12:00", emails: ["course", "giftcards", "chairs", "bonus"],
    brief: ["Farah called: \"Mason emailed asking me to buy gift cards for a client. It seemed odd, so I tried to forward it to you, but Mail won't let me: it says the message was flagged. Can you look?\"",
      "Three more forwards are also waiting in the help desk mailbox: Dev's course welcome, John's chair sale, and a bonus list sent to Brenda."],
    close: educate("What do you tell Farah about requests like Mason's?", "Check any request for money or gift cards in person or on a known number first", [
      ["Only buy gift cards if the email is from a manager", "This one was \"from\" a manager. That's the trick."],
      ["Reply to the email to ask Mason if it's really him", "The reply goes to the scammer's Gmail."],
      ["Buy them but keep the receipts", "The money is gone the moment the codes are sent."],
      ["Ignore all email from Mason from now on", "The real Mason emails her. Verify, don't ignore."],
      ["Forward it to Mason's personal address", "That's an unknown address. Use a known one, in person or by phone."]]),
    note: { must: [["gift", "mason"], ["header", "spf", "dmarc", "reply-to", "reply to"], ["policy", "spoof", "quarantin"], ["bonus", ".exe", "exe"], ["spam", "chair"]], tip: "Each email, the giveaway (the headers for Farah's), and the safeguards you added." } }),
  emailTicket({ id: "E5", title: "Rosa: an IT \"mailbox full\" email that won't forward", from: "Rosa Ortiz, Reception", clock: "Jun 06 13:00", emails: ["mailbox", "paywise", "webinar", "parcel"],
    brief: ["Rosa called: \"I got an email from the IT helpdesk saying my mailbox is full and I have 24 hours. I tried to forward it to you to check, but it won't send. Is it you?\"",
      "Three more forwards are waiting too: Dev's PayWise notice, Brenda's webinar invite, and a delivery label at reception."],
    close: educate("What do you tell Rosa about emails that seem to come from IT?", "IT never asks you to sign in through an email. If one does, call us first", [
      ["Trust any email from helpdesk@rafiki.local", "The fake used exactly that address. The headers showed it came from outside."],
      ["Only trust IT emails that have a logo", "Logos are the easiest thing to fake."],
      ["Validate the mailbox, but with a different password", "Any password typed into a fake page is stolen."],
      ["Delete all emails from IT without reading them", "Then she misses real notices, like Dev's."],
      ["Reply to the email to ask if it's really IT", "Replies go to whoever sent it."]]),
    note: { must: [["mailbox", "validate"], ["header", "spf", "dmarc"], ["policy", "spoof", "quarantin"], ["parcel", "zip", "label"], ["paywise", "software center"]], tip: "Each email, the giveaway (the headers for Rosa's), and what you did." } }),
  emailTicket({ id: "E6", title: "Farah: Brady Tag's \"new bank details\" won't forward", from: "Farah Nkemelu, Finance", clock: "Jun 09 13:30", emails: ["bankswitch", "shipped", "docusign", "timesheet"],
    brief: ["Farah called: \"Brady Tag, our label supplier, emailed new bank details for invoice payments. Mail won't let me forward it. I'm about to do the payment run, so I need to know if it's real.\"",
      "Also waiting: Brady Tag's shipping notice, a DocuSign request to John, and a new timesheet template sent to Brenda."],
    close: educate("What do you tell Farah about bank-detail changes?", "Confirm any change of bank details by calling the supplier on a number already on file", [
      ["Check the email's SPF result before paying", "This one passed SPF: the scammer owns the lookalike domain."],
      ["Reply to the email to confirm the new account", "The reply goes to the scammer's third domain."],
      ["Call the phone number in the email", "That number belongs to the scammer."],
      ["Pay a small amount first to test the new account", "That money is lost too, and it confirms the scam works."],
      ["Only accept changes sent as a PDF on letterhead", "Letterhead is easy to fake."]]),
    note: { must: [["bank", "brady"], ["bradytag-co", "lookalike", "domain", "reply-to", "reply to"], ["policy", "spoof", "quarantin", "block"], ["docusign"], ["timesheet", "xlsm", "macro"]], tip: "Each email, the giveaway (the headers for Farah's), and the safeguards you added." } })
];
